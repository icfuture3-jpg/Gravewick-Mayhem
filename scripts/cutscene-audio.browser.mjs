import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:1280,height:800}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
  window.audioAudit={tones:0,noise:0,live:0,samples:0};
  window.recordedClips=[];
  const NativeAudio=window.Audio;
  window.Audio=class extends NativeAudio {
    constructor(...args){super(...args);window.recordedClips.push(this);this.addEventListener('playing',()=>window.audioAudit.samples++);}
  };
  const Audio=window.AudioContext;
  window.AudioContext=class extends Audio {
    constructor(...args){super(...args);window.audioAudit.live++;}
    createOscillator(){window.audioAudit.tones++;return super.createOscillator();}
    createBufferSource(){window.audioAudit.noise++;return super.createBufferSource();}
    close(){window.audioAudit.live--;return super.close();}
  };
});
const click=async name=>page.getByRole('button',{name,exact:true}).click();
const audit=()=>page.evaluate(()=>({...window.audioAudit}));
try {
  await page.goto(process.env.GAME_URL || 'http://localhost:5174');
  await page.getByRole('button',{name:'Meet the heroes',exact:true}).waitFor({timeout:90000});
  await page.clock.install();
  await click('Meet the heroes');
  await click('Select Grimble');
  await page.getByRole('button',{name:/Play Grimble/}).click();
  await page.getByLabel('Personal story cutscene').waitFor();
  await click('Back to Gravewick Tales');
  for(const hero of ['Grimble','Pip','Wisp']) {
    const before=await audit();
    await click(`Select ${hero}`);
    await page.getByRole('button',{name:'Continue story',exact:true}).waitFor();
    await page.waitForFunction(()=>window.recordedClips.filter(a=>a.src).every(a=>a.readyState>=3));
    await page.clock.runFor(7500);
    await new Promise(resolve=>setTimeout(resolve,200));
    const after=await audit();
    if(hero==='Wisp') {assert.ok(after.tones>before.tones);assert.equal(after.live,1);}
    else {assert.ok(after.samples>before.samples,`${hero}: real recording plays`);assert.equal(after.noise,before.noise,'No static synthesis');}
    assert.equal(await page.evaluate(()=>window.recordedClips.filter(a=>a.src).every(a=>a.error===null)),true);
    await page.clock.runFor(8000);assert.deepEqual(await audit(),after,'No repeating sounds while reading');
    await click('Back to Gravewick Tales');assert.equal((await audit()).live,0);
    assert.equal(await page.evaluate(()=>window.recordedClips.every(a=>a.paused)),true);
    console.log(`PASS ${hero}: recorded/synthesized cues, no loop, all playback stops`);
  }
  await click('Select Pip');await page.getByRole('button',{name:'Continue story',exact:true}).waitFor();
  await click('Sound: on');const muted=await audit();
  await page.clock.runFor(7500);assert.deepEqual(await audit(),muted,'Muted scene creates no audio');
  await click('Back to Gravewick Tales');
  await click('Select Wisp');await page.getByRole('button',{name:'Continue story',exact:true}).waitFor();
  await page.getByRole('button',{name:'Sound: off',exact:true}).waitFor();
  await click('Sound: off');await page.clock.runFor(7500);
  assert.ok((await audit()).tones>muted.tones);
  await click('Back to Gravewick Tales');assert.equal((await audit()).live,0);
  assert.deepEqual(errors,[]);
  console.log('PASS shared mute, re-enable, no browser errors');
} finally {await browser.close();}
