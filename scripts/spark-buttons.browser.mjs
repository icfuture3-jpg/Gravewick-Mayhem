// Reproduce incidental spark 2 pickup using actual inputs; never modifies game state.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try{
  const p=await b.newPage({viewport:{width:1280,height:800}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  const button=n=>p.getByRole('button',{name:n,exact:true});
  const click=async n=>{await button(n).click();await p.clock.runFor(150);};
  await p.goto(process.env.GAME_URL||'http://localhost:5175');
  await button('Meet the heroes').waitFor({timeout:120000});
  await button('Meet the heroes').click();await button('Select Grimble').click();
  await p.getByRole('button',{name:/Play Grimble/}).click();await p.getByLabel('Personal story cutscene').waitFor();
  await p.clock.install();await p.clock.pauseAt((await p.evaluate(()=>Date.now()))+1000);
  await click('Continue story');await click('Play this memory');
  for(let i=0;i<100&&!await button('Start mini-game').count();i++){await new Promise(r=>setTimeout(r,50));await p.clock.runFor(50);}
  await click('Start mini-game');await click('Find spark 1');await p.clock.runFor(4000);
  assert.equal(await button('Guide spark 2 HOME').isEnabled(),true);
  await click('Guide spark 2 HOME');await p.clock.runFor(4000);
  assert.equal(await button('Spark 2 · HOME ✓').isDisabled(),true);
  await p.screenshot({path:'/tmp/spark-2-home-fixed.png'});
  await click('Restart mini-game');await click('Start mini-game');
  await click('Find spark 2');await p.clock.runFor(3000);await click('Guide spark 2 HOME');await p.clock.runFor(4000);
  assert.equal(await button('Spark 2 · HOME ✓').isDisabled(),true);
  await click('Back to Gravewick Tales');assert.deepEqual(errors,[]);
  console.log('PASS incidental spark 2 -> enabled Guide HOME -> rescued; direct Find spark 2 -> rescued; restart/exit; no browser errors');
}finally{await b.close();}
