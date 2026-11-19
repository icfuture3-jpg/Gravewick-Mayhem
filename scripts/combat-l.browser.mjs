// Actual campaign/Endless controls; reads only text already drawn to the canvas.
// Never changes charge, health, enemies, hero state, or calls practice/refill helpers.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try{
 const p=await b.newPage({viewport:{width:1280,height:800}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{
  window.combatText=[];
  const fillRect=CanvasRenderingContext2D.prototype.fillRect;
  CanvasRenderingContext2D.prototype.fillRect=function(x,y,w,h){if(this.canvas.getAttribute('aria-label')==='Gravewick Mayhem arena'&&x===-20&&y===-20)window.combatText=[];return fillRect.call(this,x,y,w,h);};
  const fillText=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(text,...args){if(this.canvas.getAttribute('aria-label')==='Gravewick Mayhem arena')window.combatText.push(String(text));return fillText.call(this,text,...args);};
 });
 const button=name=>p.getByRole('button',{name,exact:true});
 const texts=()=>p.evaluate(()=>window.combatText);
 const check=async pred=>{const t=await texts();assert.ok(pred(t),t.join('\n'));};
 async function advance(ms=150){await p.clock.runFor(ms);}
 async function key(code){await p.keyboard.press(code);await advance();}
 async function click(name){await button(name).click();await advance();}
 await p.goto(process.env.GAME_URL||'http://localhost:5177');
 await button('Play Gravewick Mayhem').waitFor({timeout:120000});
 await p.clock.install();await p.clock.pauseAt((await p.evaluate(()=>Date.now()))+1000);
 const names=['Hidden Light','Tiny Trouble','Mirror Illusions'];
 for(const mode of ['Play Gravewick Mayhem','Endless arena']){
  await click(mode);
  for(let i=0;i<100&&!await p.getByLabel('Gravewick Mayhem arena').count();i++){await new Promise(r=>setTimeout(r,50));await advance(100);}
  await p.getByLabel('Gravewick Mayhem arena').waitFor();await advance();
  if(mode==='Play Gravewick Mayhem'){
   await key('KeyL'); // Cutscene ignores casts; dismiss intro normally with Escape.
   await key('Escape');
  }
  for(let hero=0;hero<3;hero++){
   await key(`Digit${hero+1}`);
   await check(t=>t.includes('L / Space: READY'));
   await key('KeyL');await advance(180);
   await check(t=>!t.includes('L / Space: READY')&&t.includes(`L · ${names[hero]}`));
   if(hero===0)await check(t=>t.includes('0 hidden supplies'));
   if(hero===1)await check(t=>t.some(v=>v.startsWith('TINY ·')));
   if(hero===2)await check(t=>t.includes('2 ILLUSIONS')&&t.filter(v=>v.startsWith('Illusion ·')).length===2);
   await p.screenshot({path:`/tmp/combat-${mode==='Endless arena'?'endless':'story'}-hero-${hero+1}-l.png`});
   console.log(`PASS ${mode}: ${names[hero]} on fresh hero, actual L key and visible effect`);
  }
  if(mode==='Play Gravewick Mayhem'){
   await key('KeyP');const paused=await texts();await key('KeyL');await advance(2000);assert.deepEqual(await texts(),paused);
   await click('Resume');await key('KeyG');await advance(2000);await key('Escape');
   // Training keeps enemies from spawning; wait for normal recharge, without hitting anything.
   await key('Digit1');await advance(13000);await check(t=>t.includes('L / Space: READY'));
   // Holding through empty -> ready must not consume the newly recharged move.
   await key('KeyL');await advance(200);await p.keyboard.down('KeyL');await advance(14000);await p.keyboard.up('KeyL');
   await check(t=>t.includes('L / Space: READY'));
   await key('Space');await advance(150);await check(t=>!t.includes('L / Space: READY'));
   await key('Digit3');await key('KeyL');await advance(300);await check(t=>t.includes('2 ILLUSIONS'));
   await advance(6500);await check(t=>!t.some(v=>v.startsWith('Illusion ·')));
   console.log('PASS independent recharge without hits, L recast, Space alias, pause/Grimoire safety, held-key safety, illusion expiry');
  }
  if(mode==='Endless arena') {
   // Fight actual waves while the meters refill, without any direct state access.
   await p.keyboard.down('KeyJ');
   for(let lap=0;lap<4;lap++) for(const direction of ['KeyD','KeyW','KeyA','KeyS']) {
    await p.keyboard.down(direction);await advance(900);await p.keyboard.up(direction);
   }
   await p.keyboard.up('KeyJ');await advance(200);
   await check(t=>t.some(v=>v.startsWith('Endless  ·  Wave ')));
   assert.equal(await button('Play again').count(),0,'Run is still in active combat');
   for(const hero of [2,1,0]) {
    await key(`Digit${hero+1}`);await check(t=>t.includes('L / Space: READY'));
    await key('KeyL');await advance(180);
    await check(t=>!t.includes('L / Space: READY'));
    if(hero===2)await check(t=>t.some(v=>v.startsWith('Illusion ·')));
    if(hero===1)await check(t=>t.some(v=>v.startsWith('TINY ·')));
   }
   await p.screenshot({path:'/tmp/endless-combat-l-after-fighting.png'});
   console.log('PASS active Endless waves: J attacks/movement, natural recharge and all three L recasts with enemies present');
  }
  await key('KeyP');await button('Resume').waitFor();await click('Quit to title');
 }
 assert.deepEqual(errors,[]);console.log('PASS campaign and Endless L regression; no browser errors');
}catch(e){throw e;}finally{await b.close();}
