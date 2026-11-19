// Runtime ownership regression: observes real browser resources, never edits game state.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page = await browser.newPage({viewport:{width:1280,height:800}});
const errors=[]; page.on('pageerror', e=>errors.push(e.message));
await page.addInitScript(() => {
  const listeners=new Map(), rafs=new Set(), contexts=new Set();
  const add=window.addEventListener.bind(window), remove=window.removeEventListener.bind(window);
  window.addEventListener=(type, handler, options)=>{
    if(['keydown','keyup','mouseup','blur'].includes(type)) {
      if(!listeners.has(type)) listeners.set(type,new Set());
      listeners.get(type).add(handler);
    }
    return add(type,handler,options);
  };
  window.removeEventListener=(type,handler,options)=>{
    listeners.get(type)?.delete(handler); return remove(type,handler,options);
  };
  const request=window.requestAnimationFrame.bind(window), cancel=window.cancelAnimationFrame.bind(window);
  window.requestAnimationFrame=callback=>{
    const id=request(time=>{rafs.delete(id);callback(time);}); rafs.add(id);return id;
  };
  window.cancelAnimationFrame=id=>{rafs.delete(id);cancel(id);};
  const Audio=window.AudioContext;
  window.AudioContext=class extends Audio {
    constructor(...args){super(...args);contexts.add(this);}
    close(){contexts.delete(this);return super.close();}
  };
  window.runtimeResources=()=>({rafs:rafs.size,audio:contexts.size,
    keydown:listeners.get('keydown')?.size??0,mouseup:listeners.get('mouseup')?.size??0});
});
const button=name=>page.getByRole('button',{name,exact:true});
const click=async name=>{await button(name).click();};
const resources=()=>page.evaluate(()=>window.runtimeResources());
let baseline;
const idle=async()=>{
  await button('Play Gravewick Mayhem').waitFor({timeout:90000});
  await page.waitForFunction(()=>window.runtimeResources().rafs===0);
  const current=await resources();
  if(!baseline) {
    assert.equal(current.rafs,0);assert.equal(current.audio,0);assert.equal(current.keydown,0);
    baseline=current; // Browser tooling can register its own persistent mouse listener.
  }
  assert.deepEqual(current,baseline);
  assert.equal(await page.locator('canvas').count(),0);
};
try {
  await page.goto(process.env.GAME_URL || 'http://localhost:5173');
  await idle();
  let modules=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name));
  assert.ok(!modules.some(url=>/\/(mayhem-runtime|engine|tales-view)[.-]/.test(url)), 'Game runtimes must not load at the menu');
  for(let run=0;run<3;run++) {
    await click('Endless arena');
    await page.getByLabel('Gravewick Mayhem arena').waitFor();
    await page.waitForFunction(()=>window.runtimeResources().audio===1);
    assert.deepEqual(await resources(),{...baseline,rafs:1,audio:1,keydown:1,mouseup:baseline.mouseup+1});
    await page.keyboard.press('KeyP'); await button('Resume').waitFor();
    if(run===0) {await page.keyboard.press('KeyM');await button('Sound: off').waitFor();}
    else await button('Sound: off').waitFor();
    await click('Resume');
    await page.keyboard.press('KeyP'); await button('Resume').waitFor();
    await click('Quit to title'); await idle();
    await click('Meet the heroes'); await click('Select Grimble');
    await page.getByRole('button',{name:/Play Grimble/}).click();
    await button('Continue story').waitFor();
    assert.equal(await page.locator('canvas').count(),1);
    const cutscene=await resources();
    assert.equal(cutscene.rafs,1);assert.equal(cutscene.keydown,0);assert.equal(cutscene.mouseup,baseline.mouseup);
    await click('Continue story');await click('Play this memory');
    await button('Start mini-game').waitFor(); await click('Start mini-game');
    assert.deepEqual(await resources(),{...baseline,rafs:1,audio:0,keydown:1});
    await page.keyboard.press('KeyP');
    assert.equal(await button('Resume').count(),0,'Mayhem keyboard handler must not run during Tales');
    await click('Back to Gravewick Tales'); await click('Back to main menu'); await idle();
  }
  await click('Play Gravewick Mayhem'); await page.getByLabel('Gravewick Mayhem arena').waitFor();
  await page.keyboard.press('Escape'); await page.keyboard.press('KeyP');await button('Resume').waitFor();
  await button('Sound: off').waitFor();await click('Quit to title');await idle();
  assert.equal(await button('Practice arena').count(),0);
  assert.equal(await button('Start practice').count(),0);
  assert.equal(await button('Refill health, skills & ultimate').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS lazy loading; 3 Mayhem/Tales round trips; listener, RAF and audio cleanup; mute retention; pause/resume; campaign launch; no Practice UI');
} finally {await browser.close();}
