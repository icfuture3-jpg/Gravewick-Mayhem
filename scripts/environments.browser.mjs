// Isolated local rendering checks. Does not claim a full campaign playthrough.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.GAME_URL||'http://localhost:5173');
 await page.getByRole('button',{name:'Meet the heroes',exact:true}).waitFor({timeout:120000});
 const cache=await page.evaluate(async()=>{
  const env=await import('/environments.ts');const mini=await import('/mini-game.ts');const view=await import('/mini-game-art.ts');const heroes=await import('/heroes.ts');
  const overlay=document.createElement('div');Object.assign(overlay.style,{position:'fixed',inset:'0',zIndex:'1000',background:'#131322',display:'grid',placeItems:'center'});
  const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;canvas.style.width='min(100vw,1200px)';overlay.append(canvas);document.body.append(overlay);const ctx=canvas.getContext('2d');
  window.environmentCheck=(name,hero,stage)=>{
   ctx.clearRect(0,0,960,540);
   if(hero!==undefined)view.drawMini(ctx,mini.createMini(hero,stage),480,240);
   else {env.drawEnvironment(ctx,name,960,540);heroes.drawFigure(ctx,0,400,340,0.8,0,false,false,1);heroes.drawFigure(ctx,1,500,355,0.8,0,false,false,1);heroes.drawFigure(ctx,2,600,340,0.8,0,false,false,1);}
   ctx.fillStyle='#ffefc4';ctx.font='bold 20px Trebuchet MS';ctx.textAlign='center';ctx.fillText(name,480,35);
  };
  return env.ENVIRONMENTS.map(name=>({name,width:env.environmentFrames[name]?.width,height:env.environmentFrames[name]?.height}));
 });
 for(const item of cache){assert.equal(item.width,1280);assert.equal(item.height,720);await page.evaluate(name=>window.environmentCheck(name),item.name);await page.screenshot({path:`/tmp/environment-${item.name}.png`});}
 for(let hero=0;hero<3;hero++)for(let stage=0;stage<3;stage++){
  await page.evaluate(({hero,stage})=>window.environmentCheck(`Hero ${hero} objective ${stage}`,hero,stage),{hero,stage});
  await page.screenshot({path:`/tmp/environment-objective-${hero}-${stage}.png`});
 }
 assert.deepEqual(errors,[]);console.log('PASS 8 baked 3D environments and 9 objective renderers at 1280x800; all caches 1280x720; no browser errors.');
}finally{await browser.close();}
