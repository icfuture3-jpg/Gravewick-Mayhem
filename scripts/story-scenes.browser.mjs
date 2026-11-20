// Local Vite renderer check, not a full campaign playthrough or a hosted preview.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(process.env.GAME_URL||'http://localhost:5173');
 await page.getByRole('button',{name:'Meet the heroes',exact:true}).waitFor({timeout:120000});
 await page.evaluate(async()=>{
  const stories=await import('/story-tableaux.ts'),movies=await import('/movie.ts'),cinematic=await import('/cinematic.ts');
  const overlay=document.createElement('div');Object.assign(overlay.style,{position:'fixed',inset:'0',zIndex:'1000',background:'#10091e',display:'grid',placeItems:'center'});
  const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;canvas.style.width='min(100vw,1200px)';overlay.append(canvas);document.body.append(overlay);
  const ctx=canvas.getContext('2d'),drawImage=ctx.drawImage.bind(ctx);let images=0;
  ctx.drawImage=(...args)=>{images++;return drawImage(...args);};
  window.renderCheck=(type,time,stage=0)=>{
   images=0;ctx.clearRect(0,0,960,540);ctx.fillStyle='#10091e';ctx.fillRect(0,0,960,540);
   ctx.save();
   if(type==='watch'||type==='pip'||type==='cheer'){
    ctx.translate(0,75);
    if(type==='cheer')stories.drawConclusion(ctx,1,0,time);else stories.drawPrologue(ctx,type==='watch'?0:1,time);
   }else{
    const scene=type==='entrance'?movies.bossEntrance(stage)[0]:type==='turn'?movies.turningPoint(stage)[0]:movies.celebration(stage)[0];
    cinematic.drawAction(ctx,scene,time);
    ctx.fillStyle='#ffe3a0';ctx.font='bold 24px Trebuchet MS';ctx.textAlign='center';ctx.fillText(scene.caption,480,460);
   }
   ctx.restore();return images;
  };
 });
 for(const time of [1,2.5,6.8]){
  await page.evaluate(t=>window.renderCheck('watch',t),time);
  await page.screenshot({path:`/tmp/grimble-watch-${time}.png`});
 }
 const images=await page.evaluate(()=>window.renderCheck('pip',2));
 assert.equal(images,6,'One environment + one table + three toys + exactly one Pip silhouette');
 await page.screenshot({path:'/tmp/pip-workshop-single-silhouette.png'});
 await page.evaluate(()=>window.renderCheck('cheer',2.8));await page.screenshot({path:'/tmp/pip-cheering-toys.png'});
 for(let stage=0;stage<3;stage++)for(const moment of ['entrance','turn','defeat']){
  await page.evaluate(({stage,moment})=>window.renderCheck(moment,2,stage),{stage,moment});
  await page.screenshot({path:`/tmp/boss-${stage+1}-${moment}.png`});
 }
 assert.deepEqual(errors,[]);console.log('PASS local isolated renderers: patrol/starfall/catch, single Pip silhouette, cheering podium toys, all nine boss shots; no browser errors. Combat is covered separately by simulation tests.');
}finally{await browser.close();}
