import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try{
 const p=await b.newPage({viewport:{width:1280,height:800}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{window.woodPlays=0;const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){if(this.src.endsWith('wood-knock.wav'))window.woodPlays++;return play.call(this);};});
 const button=n=>p.getByRole('button',{name:n,exact:true}),count=()=>p.evaluate(()=>window.woodPlays);
 await p.goto(process.env.GAME_URL||'http://localhost:5182');await button('Meet the heroes').waitFor({timeout:120000});
 await button('Meet the heroes').click();await button('Select Pip').click();await p.getByRole('button',{name:/Play Pip/}).click();await p.getByLabel('Personal story cutscene').waitFor();
 await p.clock.install();await p.clock.pauseAt((await p.evaluate(()=>Date.now()))+1000);
 const click=async n=>{await button(n).click();await p.clock.runFor(180);};
 await click('Continue story');await p.clock.runFor(7500);const story=await count();assert.ok(story>=6);
 await click('Play this memory');for(let i=0;i<100&&!await button('Start mini-game').count();i++){await new Promise(r=>setTimeout(r,50));await p.clock.runFor(100);}
 const before=await count();await click('Start mini-game');await click('Hit part 1 · GOLD');await p.clock.runFor(400);assert.equal(await count(),before+1);
 await click('Pause mini-game');const paused=await count();await p.keyboard.press('KeyJ');await p.clock.runFor(1000);assert.equal(await count(),paused);
 await click('Resume mini-game');await click('Sound: on');await click('Hit part 2 · GOLD');await p.clock.runFor(400);assert.equal(await count(),paused);
 await click('Sound: off');await click('Hit part 3 · GOLD');await p.clock.runFor(400);assert.equal(await count(),paused+1);
 await click('Back to Gravewick Tales');assert.deepEqual(errors,[]);
 console.log('PASS wooden sample in story and playable mallet hits; no paused/muted knocks; resume/unmute; clean exit. Timbre requires human listening.');
}finally{await b.close();}
