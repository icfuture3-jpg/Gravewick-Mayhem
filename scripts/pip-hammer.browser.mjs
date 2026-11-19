import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
try {
  const p=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{
    window.hammerAudit={tones:0,live:0,samples:0};
    const play=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(){window.hammerAudit.samples++;return play.call(this);};
    const Native=window.AudioContext;
    window.AudioContext=class extends Native {
      constructor(...args){super(...args);window.hammerAudit.live++;}
      createOscillator(){window.hammerAudit.tones++;return super.createOscillator();}
      close(){window.hammerAudit.live--;return super.close();}
    };
  });
  const button=n=>p.getByRole('button',{name:n,exact:true});
  const click=async n=>button(n).click();
  const audit=()=>p.evaluate(()=>({...window.hammerAudit}));
  await p.goto(process.env.GAME_URL||'http://localhost:5175');
  await button('Meet the heroes').waitFor({timeout:120000});
  await click('Meet the heroes');await click('Select Pip');
  await p.clock.install();await p.clock.pauseAt((await p.evaluate(()=>Date.now()))+1000);
  await p.getByRole('button',{name:/Play Pip/}).click();
  for(let i=0;i<100&&!await p.getByLabel('Personal story cutscene').count();i++){await new Promise(r=>setTimeout(r,50));await p.clock.runFor(20);}
  await p.getByLabel('Personal story cutscene').waitFor();
  await p.clock.runFor(7500);
  assert.equal((await audit()).tones,12,'Six two-tone hammer taps');
  await p.clock.runFor(6000);assert.equal((await audit()).tones,12,'No endless tapping while reading');
  await click('Sound: on');await click('Continue story');await p.clock.runFor(7500);
  assert.equal((await audit()).tones,12,'Muted repair scene is silent');
  await click('Back to Gravewick Tales');assert.equal((await audit()).live,0,'Audio closes on exit');
  assert.equal((await audit()).samples,0,'No thunder or explosion recordings play in Pip repair scenes');
  assert.deepEqual(errors,[]);
  console.log('PASS 6 hammer impacts; no reading loop; shared mute; audio cleanup; no browser errors. Audible timbre not evaluated.');
}finally{await browser.close();}
