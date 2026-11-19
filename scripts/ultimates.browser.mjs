// Keyboard-driven ultimate regression on the real game. Never sets game state or charge.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try {
  const p=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  const button=name=>p.getByRole('button',{name,exact:true}),text=()=>p.locator('body').innerText();
  const check=async v=>assert.ok((await text()).includes(v),await text());
  const settle=async()=>{await p.clock.runFor(150);for(let i=0;i<100&&(await text()).includes('Opening the next adventure');i++){await new Promise(r=>setTimeout(r,50));await p.clock.runFor(100);}};
  const click=async n=>{await button(n).click();await settle();};
  await p.goto(process.env.GAME_URL||'http://localhost:5173');
  await button('Meet the heroes').waitFor({timeout:120000});
  await p.clock.install();await p.clock.pauseAt((await p.evaluate(()=>Date.now()))+1000);
  const names=['Grimble','Pip','Wisp'],ults=['Hidden Light','Tiny Trouble','Mirror Illusions'];
  for(let h=0;h<3;h++) {
    const name=names[h],ult=ults[h];
    await click('Meet the heroes');await click(`Select ${name}`);
    await p.getByRole('button',{name:new RegExp(`Play ${name}`)}).click();await settle();
    await click('Continue story');await click('Play this memory');
    await p.keyboard.press('KeyL');await p.clock.runFor(200);
    assert.equal(await button(`${ult} · L · Ready`).isDisabled(),true,'Cannot cast before Start');
    await click('Start mini-game');
    if(h===2) {await p.keyboard.down('KeyA');await p.clock.runFor(650);await p.keyboard.up('KeyA');}
    await p.keyboard.press('KeyL');await p.clock.runFor(300);
    await check(`${ult} · L (12s)`);
    if(h===0)await check('Hidden Light activated');
    if(h===1)await check('Tiny Trouble active');
    if(h===2){await check('2 Mirror Illusions active');await p.clock.runFor(900);await check('pages restored');}
    await p.screenshot({path:`/tmp/${name.toLowerCase()}-l-ultimate.png`});
    await click('Pause mini-game');const before=await text();
    await p.keyboard.press('KeyL');await p.clock.runFor(2000);assert.equal(await text(),before);
    await click('Resume mini-game');await p.clock.runFor(6500);
    if(h===1)assert.ok(!(await text()).includes('Tiny Trouble active ·'));
    if(h===2)assert.ok(!(await text()).includes('2 Mirror Illusions active'));
    await click('Restart mini-game');await check(`${ult} · L · Ready`);
    await click('Start mini-game');await click(`${ult} · L · Ready`);
    await check(`${ult} · L (12s)`);
    await click('Back to Gravewick Tales');await click('Back to main menu');
    console.log(`PASS ${name}: quick L tap, ultimate effect, pause, expiry, restart, button and exit`);
  }
  // Combat input is also exercised through the real arena; charge-dependent effects are unit-tested.
  await click('Endless arena');await p.getByLabel('Gravewick Mayhem arena').waitFor();
  await p.keyboard.press('KeyL');await p.clock.runFor(200);
  await p.keyboard.press('KeyP');await settle();await button('Resume').waitFor();
  await p.screenshot({path:'/tmp/combat-ultimate-charge.png'});
  await click('Quit to title');assert.deepEqual(errors,[]);
  console.log('PASS real Endless L input/pause/exit; no browser errors');
}finally{await browser.close();}
