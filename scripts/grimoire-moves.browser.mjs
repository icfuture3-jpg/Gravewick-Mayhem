// Use normal controls, never modify game state. Start a local build/preview server first.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try {
  const p=await browser.newPage({viewport:{width:1280,height:800}}), errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  const button=name=>p.getByRole('button',{name,exact:true});
  const text=()=>p.locator('body').innerText();
  const check=async value=>assert.ok((await text()).includes(value),await text());
  const settle=async()=>{await p.clock.runFor(150);for(let i=0;i<100&&(await text()).includes('Opening the next adventure');i++){await new Promise(r=>setTimeout(r,50));await p.clock.runFor(100);}};
  const click=async name=>{await button(name).click();await settle();};
  async function aim(x,y) {
    const b=await p.locator('canvas[aria-label$="playfield"]').boundingBox(),scale=Math.min(b.width/960,b.height/480);
    await p.mouse.move(b.x+(b.width-960*scale)/2+x*scale,b.y+(b.height-480*scale)/2+y*scale);
  }
  await p.goto(process.env.GAME_URL||'http://localhost:5173');
  await button('Meet the heroes').waitFor({timeout:120000});
  await p.clock.install();await p.clock.pauseAt((await p.evaluate(()=>Date.now()))+1000);
  for(const name of ['Grimble','Pip','Wisp']) {
    await click('Meet the heroes');await click(`Select ${name}`);
    await p.getByRole('button',{name:new RegExp(`Play ${name}`)}).click();await settle();
    await p.clock.runFor(2200);await p.screenshot({path:`/tmp/${name.toLowerCase()}-grimoire-cutscene.png`});
    await click('Continue story');await click('Play this memory');
    await click('Start mini-game');
    if(name==='Grimble') {
      await click('Lantern Sweep · J');await check('Lantern Sweep reveals');
      await aim(790,230);await click('Lantern Portal · K');
      await check('Lantern Portal carries');await check('Lantern Portal · K (9s)');
      await click('Pause mini-game');const paused=await text();await p.clock.runFor(3000);assert.equal(await text(),paused);
      await click('Resume mini-game');
    } else if(name==='Pip') {
      await click('Gadget Pouch · K');await p.clock.runFor(800);await check('Hit golden part 2/3');
      await click('Hit part 2 · GOLD');await p.clock.runFor(400);await click('Hit part 3 · GOLD');await p.clock.runFor(400);
      await check('1/6 toys repaired');
    } else {
      // The spellbook fires; if Wisp waits at BOOK, the retrieved page is restored there.
      await click('Spellbook Bolt · J');await p.clock.runFor(800);await check('1/3 pages restored');
      await aim(735,180);await p.keyboard.press('KeyJ');await p.clock.runFor(800);await check('2/3 pages restored');
      await click('Collect page 3');await p.clock.runFor(4000);await click('Return to BOOK');await p.clock.runFor(4000);
      await check('Challenge complete!');await p.clock.runFor(1800);
    }
    await p.screenshot({path:`/tmp/${name.toLowerCase()}-grimoire-mini-game.png`});
    await click('Restart mini-game');await check('0/');await check('Ready when you are');
    await click('Back to Gravewick Tales');await click('Back to main menu');
    console.log(`PASS ${name}: named cutscene, playable Grimoire moves, restart and exit`);
  }
  assert.deepEqual(errors,[]);console.log('PASS no browser errors');
} finally {await browser.close();}
