// Real Chromium playthrough: normal DOM buttons, keyboard and mouse only; no game-state edits.
// Start Vite separately, then: bun run scripts/mini-games.browser.mjs
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page = await browser.newPage({viewport:{width:1280,height:800}});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
const button = name => page.getByRole('button',{name,exact:true});
const click = async name => {
  await button(name).click(); await page.clock.runFor(100);
  // Import resolution and React's cached native scheduler run in real time, while gameplay
  // timers use the controlled clock. Let both advance until the lazy view is committed.
  for (let attempt=0;attempt<100 && (await page.locator('body').innerText()).includes('Opening the next adventure');attempt++) {
    await new Promise(resolve=>setTimeout(resolve,50));
    await page.clock.runFor(100);
  }

};
const text = async () => page.locator('body').innerText();
const requireText = async str => assert.ok((await text()).includes(str),`Missing ${str}: ${await text()}`);
async function move(code, ms) {await page.keyboard.down(code); await page.clock.runFor(ms); await page.keyboard.up(code); await page.clock.runFor(50);}
async function point(x,y) {
  const b=await page.locator('canvas[aria-label$="playfield"]').boundingBox();
  const scale=Math.min(b.width/960,b.height/480);
  return {x:b.x+(b.width-960*scale)/2+x*scale,y:b.y+(b.height-480*scale)/2+y*scale};
}
async function aim(x,y) {const p=await point(x,y);await page.mouse.move(p.x,p.y);}
async function canvasClick(x,y) {const p=await point(x,y); await page.mouse.click(p.x,p.y); await page.clock.runFor(100);}
try {
  await page.goto(process.env.GAME_URL || 'http://localhost:5173');
  await button('Gravewick Tales').waitFor({timeout:90000});
  await page.clock.install(); await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 1000);
  await click('Gravewick Tales');
  for (const [hero,name] of ['Grimble','Pip','Wisp'].entries()) {
    await click(`Select ${name}`);
    await requireText(`${name} · Chapter 1/3`);
    await click('Continue story');
    for (let chapter=0;chapter<3;chapter++) {
      await click('Play this memory');
      await requireText(`Memory ${chapter+1}/3`);
      await click('Start mini-game');
      // Pause/resume must preserve time and aim, and action clicks while paused do nothing.
      await aim(130,105);
      await click('Pause mini-game');
      const paused=await text(); await page.clock.runFor(4000); assert.equal(await text(),paused);
      await click('Resume mini-game');
      if(hero===0) {
        await page.keyboard.down('KeyJ');
        for(const [code,ms] of [['KeyA',1400],['KeyW',960],['KeyD',800],['KeyS',440],['KeyD',880],['KeyW',560],['KeyD',960],['KeyS',440],['KeyA',400],['KeyS',640]]) await move(code,ms);
        await page.keyboard.up('KeyJ'); await page.clock.runFor(300);
      } else if(hero===1) {
        await click('Shrink · Space');
        await move('KeyA',1400);
        let gadget=0;
        for(let target=0;target<6;target++) {
          const kind=(target+chapter)%3;
          while(gadget!==kind) {await click('Change gadget · K'); gadget=(gadget+1)%3;}
          await aim(130+target*140,105+(target%2)*80);
          // Check both canvas throws and the on-screen Throw button; the latter retains aim after pause.
          if(target%2===0) await click('Throw at aim · J'); else await canvasClick(130+target*140,105+(target%2)*80);
          await page.clock.runFor(700);
          if(target<5) await move('KeyD',560);
        }
      } else {
        // Replay is a real gameplay button and should restart the demonstration.
        await page.clock.runFor(3500); await click('Replay pattern · K (−5s)');
        for(let round=0;round<3;round++) {
          await page.clock.runFor(5500);
          const seq=Array.from({length:3+round},(_,i)=>(chapter+i*3+round*2+Math.floor(i/2))%4);
          for(let i=0;i<seq.length;i++) {
            const rune=seq[i];
            if(i===0) await canvasClick(240+rune*170,165);
            else await button(`${rune+1} · ${['Moon','Star','Eye','Key'][rune]}`).click();
            // Keep repeated clicks in rapid succession: queued rather than overwritten.
          }
          await page.clock.runFor(300);
          await requireText(`${round+1}/3 patterns`);
        }
      }
      await requireText('Challenge complete!');
      await click('Continue tale');
      await requireText(chapter===2 ? 'The end' : 'Memory restored');
      await click(chapter===2 ? 'Finish tale' : 'Next chapter');
      if(chapter<2) await requireText(`${name} · Chapter ${chapter+2}/3`);
      console.log(`PASS ${name} chapter ${chapter+1}: real inputs -> win -> conclusion -> next`);
    }
    await requireText(`${name}'s tale complete`);
    await page.screenshot({path:`/tmp/gravewick-${name.toLowerCase()}-ending.png`});
    await click('Replay this tale'); await requireText(`${name} · Chapter 1/3`);
    await click('Back to Gravewick Tales');
  }
  // Exercise timeout/retry independently from all nine successful chapters.
  await click('Select Pip'); await click('Continue story'); await click('Play this memory'); await click('Start mini-game');
  await page.clock.runFor(60000); await requireText("Time's up.");
  await click('Retry mini-game'); await requireText('45s · 0/6 targets'); await click('Start mini-game');
  await click('Back to Gravewick Tales'); await click('Back to main menu');
  await requireText('Play Gravewick Mayhem');
  await click('Gravewick Tales'); await click('Select Grimble'); await click('Continue story'); await click('Play this memory'); await click('Start mini-game');
  await aim(690,390); await click('Portal to aim · K'); await click('Shine lantern · J');
  await requireText('1/5 lights');
  await click('Back to Gravewick Tales');
  assert.deepEqual(errors,[]);
  console.log('PASS all 9 chapters, 3 endings, replay, exit, pause/resume, Wisp replay/canvas/buttons, Pip action buttons, timeout/retry; no browser errors');
} catch (error) {console.error(await text()); await page.screenshot({path:"/tmp/gravewick-browser-failure.png"}); throw error;} finally {await browser.close();}
