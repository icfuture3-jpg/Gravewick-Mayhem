// Ordinary UI inputs, audio playback audit and local screenshots; never edits game state.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.toyAudio={plays:0,stops:0,clips:[],successes:0,failures:[]};
  const play=HTMLMediaElement.prototype.play,pause=HTMLMediaElement.prototype.pause;
  HTMLMediaElement.prototype.play=function(){if(this.src.endsWith('toy-cheer.wav')){window.toyAudio.plays++;window.toyAudio.clips.push(this);const result=play.call(this);result.then(()=>window.toyAudio.successes++,error=>window.toyAudio.failures.push(error.name));return result;}return play.call(this);};
  HTMLMediaElement.prototype.pause=function(){if(this.src.endsWith('toy-cheer.wav'))window.toyAudio.stops++;return pause.call(this);};
  window.toyWords=[];const fillText=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(/HOORAY|YAY!|THANKS PIP/.test(String(text)))window.toyWords.push(String(text));return fillText.call(this,text,...args);};
 });
 const button=name=>page.getByRole('button',{name,exact:true}),body=()=>page.locator('body').innerText();
 const audit=()=>page.evaluate(()=>({plays:window.toyAudio.plays,stops:window.toyAudio.stops,words:window.toyWords}));
 await page.goto(process.env.GAME_URL||'http://localhost:5173');await button('Meet the heroes').waitFor({timeout:120000});
 await button('Meet the heroes').click();await button('Select Pip').click();await page.getByRole('button',{name:/Play Pip/}).click();await page.getByLabel('Personal story cutscene').waitFor();
 await page.clock.install();await page.clock.pauseAt((await page.evaluate(()=>Date.now()))+1000);
 const click=async name=>{await button(name).click();await page.clock.runFor(160);};
 await page.clock.runFor(2000);await page.screenshot({path:'/tmp/pip-garage-opening.png'});
 await click('Continue story');await page.clock.runFor(3200);await page.screenshot({path:'/tmp/pip-3d-hammer-story.png'});await page.clock.runFor(4300);
 assert.equal((await audit()).plays,6,'One story sound per repaired toy');await page.clock.runFor(5000);assert.equal((await audit()).plays,6,'No reading loop');
 await click('Play this memory');await button('Start mini-game').waitFor();await click('Start mini-game');
 const repair=async()=>{for(let part=1;part<=3;part++){await page.getByRole('button',{name:new RegExp(`^Hit part ${part}`)}).click();await page.clock.runFor(360);}};
 await repair();assert.equal((await audit()).plays,7,'First playable repaired toy celebrates once');
 await click('Pause mini-game');const paused=await audit();await page.keyboard.press('KeyJ');await page.clock.runFor(1200);assert.equal((await audit()).plays,paused.plays);assert.ok(paused.stops>0);
 await click('Resume mini-game');await click('Sound: on');await repair();assert.equal((await audit()).plays,7,'Muted repairs do not play');
 await click('Sound: off');await repair();assert.equal((await audit()).plays,8,'Unmuted next repair plays again');
 await page.screenshot({path:'/tmp/pip-3d-hammer-mini-game.png'});
 await repair();await repair();await repair();assert.ok((await body()).includes('6/6 toys repaired'));
 const complete=await audit();assert.equal(complete.plays,11);assert.deepEqual(complete.words,[]);
 await page.clock.runFor(4000);assert.equal((await audit()).plays,11,'Completion visuals do not repeat audio');
 await click('Continue tale');await page.clock.runFor(1500);assert.equal((await audit()).plays,12,'One reward sound');await page.clock.runFor(5000);assert.equal((await audit()).plays,12);
 await page.screenshot({path:'/tmp/pip-wheel-free-reward.png'});
 await click('Back to Gravewick Tales');
 assert.ok(await page.evaluate(()=>window.toyAudio.clips.every(clip=>!clip.getAttribute('src'))),'Exit clears sound sources');
 await new Promise(resolve=>setTimeout(resolve,300));
 const playback=await page.evaluate(()=>({successes:window.toyAudio.successes,failures:window.toyAudio.failures}));
 assert.ok(playback.successes>0,'The bundled audio actually begins playback, not just play() calls');
 assert.deepEqual(playback.failures,[]);
 assert.deepEqual(errors,[]);console.log('PASS Pip six story cues, six toy repairs including muted toy, no overhead words, one reward cue, no reading loop, pause/exit cleanup and 3D hammer screenshots; no browser errors. Subjective timbre not evaluated.');
}finally{await browser.close();}
