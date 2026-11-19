// Real browser playthrough: ordinary buttons, mouse and keyboard; never edits game state.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page = await browser.newPage({viewport:{width:1280,height:800}});
const errors=[]; page.on('pageerror',e=>errors.push(e.message));
const button = name => page.getByRole('button',{name,exact:true});
const text = () => page.locator('body').innerText();
const requireText = async value => assert.ok((await text()).includes(value),`Missing ${value}: ${await text()}`);
async function settle() {
  await page.clock.runFor(120);
  for(let i=0;i<100 && (await text()).includes('Opening the next adventure');i++) {
    await new Promise(r=>setTimeout(r,50)); await page.clock.runFor(100);
  }
}
const click = async name => {await button(name).click(); await settle();};
async function canvasClick(x,y) {
  const b=await page.locator('canvas[aria-label$="playfield"]').boundingBox();
  const scale=Math.min(b.width/960,b.height/480);
  await page.mouse.click(b.x+(b.width-960*scale)/2+x*scale,b.y+(b.height-480*scale)/2+y*scale);
  await settle();
}
async function enter(name) {
  await click('Meet the heroes'); await click(`Select ${name}`);
  await page.getByRole('button',{name:new RegExp(`Play ${name}`)}).click(); await settle();
  await page.clock.runFor(1600);await page.screenshot({path:`/tmp/${name.toLowerCase()}-unique-prologue.png`});
  await click('Continue story');await page.clock.runFor(1800);await page.screenshot({path:`/tmp/${name.toLowerCase()}-unique-action-1.png`});await click('Play this memory');
}
try {
  await page.goto(process.env.GAME_URL || 'http://localhost:5173');
  await button('Meet the heroes').waitFor({timeout:120000});
  await page.clock.install(); await page.clock.pauseAt((await page.evaluate(()=>Date.now()))+1000);
  for(const [hero,name] of ['Grimble','Pip','Wisp'].entries()) {
    await enter(name);
    for(let chapter=0;chapter<1;chapter++) {
      await requireText('Personal memory');
      // Canvas and keyboard inputs must do nothing before Start.
      await canvasClick(185,180); await page.keyboard.press('KeyJ');
      await requireText(`0/${hero===0?5:hero===1?6:3}`);
      await page.screenshot({path:`/tmp/${name.toLowerCase()}-unique-game-${chapter+1}.png`});
      await click('Start mini-game');
      if(hero===2 && chapter===0) {
        // WASD remains usable alongside click-to-walk and navigation buttons.
        await page.keyboard.down('KeyD'); await page.clock.runFor(150); await page.keyboard.up('KeyD');
      }
      await click('Pause mini-game');
      const paused=await text(); await canvasClick(458,225); await page.clock.runFor(4000);
      assert.equal(await text(),paused,'Paused input must not change progress');
      await click('Resume mini-game');
      if(chapter===0) await page.screenshot({path:`/tmp/${name.toLowerCase()}-mini-game-preview.png`});
      if(hero===0) {
        const sparks=[[130,150],[330,260],[550,120],[790,230],[740,390]];
        for(let i=0;i<5;i++) {
          if(await button(`Spark ${i+1} · HOME ✓`).count()) continue; // Incidental followers can arrive together.
          if(i===0) await canvasClick(...sparks[i]); else if(await button(`Find spark ${i+1}`).count()) await click(`Find spark ${i+1}`);
          await page.clock.runFor(4000);
          await requireText('following');
          await click('Guide sparks HOME'); await page.clock.runFor(4000);
          const rescued=Number((await text()).match(/(\d)\/5 sparks home/)[1]);
          assert.ok(rescued>=i+1, 'Every visited spark must reach home');
        }
      } else if(hero===1) {
        // A wrong part has no penalty or progress, and is clearly explained.
        await canvasClick(505,255); await page.clock.runFor(350);
        await requireText('no penalty'); await requireText('0/6 toys repaired');
        for(let toy=0;toy<6;toy++) for(let part=0;part<3;part++) {
          const points=[[458,225],[505,255],[480,290]];
          if(toy===0) await canvasClick(...points[part]);
          else await click(`Hit part ${part+1} · GOLD`);
          await page.clock.runFor(350);
        }
      } else {
        const pages=[[185,180],[735,180],[770,350]];
        for(let i=0;i<3;i++) {
          if(i===0) await canvasClick(...pages[i]); else await click(`Collect page ${i+1}`);
          await page.clock.runFor(4000); await requireText('Page collected!');
          await click('Return to BOOK'); await page.clock.runFor(4000);
          await requireText(`${i+1}/3 pages restored`);
        }
      }
      await requireText('Challenge complete!');
      if(chapter===0) await page.screenshot({path:`/tmp/${name.toLowerCase()}-mini-game-win.png`});
      await click('Continue tale');await page.clock.runFor(1800);await page.screenshot({path:`/tmp/${name.toLowerCase()}-unique-outro-${chapter+1}.png`}); await requireText('Memory restored');
      await click('Finish tale');

      console.log(`PASS ${name} chapter ${chapter+1}: normal inputs -> win -> conclusion`);
    }
    await requireText(`${name}'s tale complete`);
    await click('Replay this tale'); await click('Continue story'); await click('Play this memory');
    await click('Start mini-game');
    // Restart safely resets partial progress and returns to the ready state.
    if(hero===1) {await canvasClick(458,225); await page.clock.runFor(400);}
    else {await click(hero===0?'Find spark 1':'Collect page 1'); await page.clock.runFor(4000);}
    await click('Restart mini-game'); await requireText('Ready when you are');
    await requireText(`0/${hero===0?5:hero===1?6:3}`);
    await click('Back to Gravewick Tales'); await click('Back to main menu');
  }
  assert.equal(await button('Gravewick Tales').count(),0,'No Tales entry on the title screen');
  assert.deepEqual(errors,[]);
  console.log('PASS all 3 personal mini-games, 3 endings, replay, restart, pause/resume, keyboard, canvas and action buttons; no browser errors');
} catch(error) {
  console.error(await text()); await page.screenshot({path:'/tmp/mini-game-failure.png'}); throw error;
} finally {await browser.close();}
