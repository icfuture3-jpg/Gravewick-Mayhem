// Regression: collect with real controls, return by canvas book and button, finish flight.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try {
  const p=await b.newPage({viewport:{width:1280,height:800}});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  const button=name=>p.getByRole('button',{name,exact:true});
  const click=async name=>{await button(name).click();await p.clock.runFor(150);};
  const text=()=>p.locator('body').innerText();
  const check=async value=>assert.ok((await text()).includes(value),await text());
  await p.goto(process.env.GAME_URL||'http://localhost:5173');
  await button('Meet the heroes').waitFor({timeout:120000});
  await clickBeforeClock();
  async function clickBeforeClock(){await button('Meet the heroes').click();await button('Select Wisp').click();await p.getByRole('button',{name:/Play Wisp/}).click();await p.getByLabel('Personal story cutscene').waitFor();}
  await p.clock.install();await p.clock.pauseAt((await p.evaluate(()=>Date.now()))+1000);
  await click('Continue story');await click('Play this memory');
  for(let i=0;i<100 && !await button('Start mini-game').count();i++){await new Promise(r=>setTimeout(r,50));await p.clock.runFor(100);}
  await click('Start mini-game');
  for(let i=0;i<3;i++){
    await click(`Collect page ${i+1}`);await p.clock.runFor(4000);await check('Page collected!');
    if(i===1) await click('Return to BOOK');
    else {
      const box=await p.getByLabel('Lost Library Pages playfield').boundingBox();
      const scale=Math.min(box.width/960,box.height/480);
      await p.mouse.click(box.x+box.width/2,box.y+(box.height-480*scale)/2+405*scale);
      await p.clock.runFor(150);
    }
    await p.clock.runFor(4000);await check(`${i+1}/3 pages restored`);
  }
  await check('Challenge complete!');await p.clock.runFor(2000);
  await p.screenshot({path:'/tmp/wisp-restored-floating-book.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS book canvas click, Return to BOOK button, all 3 pages, completion and book flight; no browser errors');
}finally{await b.close();}
