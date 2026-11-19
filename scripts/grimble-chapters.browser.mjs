import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try{
 const p=await b.newPage({viewport:{width:1280,height:800}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 const button=n=>p.getByRole('button',{name:n,exact:true}),text=()=>p.locator('body').innerText();
 const check=async v=>assert.ok((await text()).includes(v),await text());
 const click=async n=>{await button(n).click();await p.clock.runFor(150);};
 await p.goto(process.env.GAME_URL||'http://localhost:5176');
 await button('Meet the heroes').waitFor({timeout:120000});
 await button('Meet the heroes').click();await button('Select Grimble').click();
 await p.getByRole('button',{name:/Play Grimble/}).click();await p.getByLabel('Personal story cutscene').waitFor();
 await p.clock.install();await p.clock.pauseAt((await p.evaluate(()=>Date.now()))+1000);
 await click('Continue story');await click('Play this memory');
 for(let i=0;i<100&&!await button('Start mini-game').count();i++){await new Promise(r=>setTimeout(r,50));await p.clock.runFor(50);}
 for(let chapter=0;chapter<3;chapter++){
  await click('Start mini-game');
  if(chapter===0){
   for(let i=0;i<5;i++){
    if(await button(`Spark ${i+1} · HOME ✓`).count())continue;
    if(await button(`Find spark ${i+1}`).count())await click(`Find spark ${i+1}`);
    await p.clock.runFor(4000);
    // Held key must not cancel this explicit HOME command.
    await p.keyboard.down('KeyA');await click('Guide sparks HOME');await p.clock.runFor(3500);await p.keyboard.up('KeyA');
   }
  }else{
   assert.equal(await button('Guide sparks HOME').count(),0);
   if(chapter===2){await click('Go to seal 2');await p.clock.runFor(4000);await click('Activate nearby seal · J');await check('0/5 gate seals activated');}
   for(let i=0;i<5;i++){
    await click(`Go to ${chapter===1?'lantern':'seal'} ${i+1}`);await p.clock.runFor(4000);
    await click(chapter===1?'Light nearby lantern · J':'Activate nearby seal · J');await p.clock.runFor(250);
    await check(`${i+1}/5 ${chapter===1?'lanterns relit':'gate seals activated'}`);
   }
  }
  await check('Challenge complete!');await p.screenshot({path:`/tmp/grimble-distinct-chapter-${chapter+1}.png`});
  await click('Continue tale');await click(chapter===2?'Finish tale':'Next chapter');
  if(chapter<2)await click('Play this memory');
  console.log(`PASS Grimble chapter ${chapter+1}`);
 }
 await check("Grimble's tale complete");assert.deepEqual(errors,[]);
 console.log('PASS HOME with held movement, three distinct objectives, wrong seal safety, ending; no browser errors');
}finally{await b.close();}
