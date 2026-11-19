import {expect,it,vi} from "vitest";
import {hammerImpactTimes,playHammerCues} from "./pip-hammer-audio";
import type {Sound} from "./audio";
const audio=():Sound=>({tone:vi.fn(),noise:vi.fn(),music:vi.fn(),setMuted:vi.fn(),close:vi.fn(),sample:vi.fn()});
it.each([0,1])("syncs chapter %i taps to every mallet impact exactly once",chapter=>{
  const s=audio(),times=hammerImpactTimes(chapter);
  expect(times).toHaveLength(chapter===0?6:0);
  let prev=0;
  for(const t of times){
    playHammerCues(s,1,chapter,false,prev,t-0.001);
    const before=vi.mocked(s.sample!).mock.calls.length;
    playHammerCues(s,1,chapter,false,t-0.001,t);
    expect(vi.mocked(s.sample!).mock.calls.length-before).toBe(1);prev=t;
  }
  const total=vi.mocked(s.sample!).mock.calls.length;
  playHammerCues(s,1,chapter,false,prev,30);
  expect(s.sample).toHaveBeenCalledTimes(total);
  expect(s.tone).not.toHaveBeenCalled();expect(s.noise).not.toHaveBeenCalled();
});
it("does not hammer during conclusions, scanner scenes or other heroes' stories",()=>{
  const s=audio();
  playHammerCues(s,1,0,true,0,10);playHammerCues(s,1,2,false,0,10);
  playHammerCues(s,0,0,false,0,10);playHammerCues(s,2,0,false,0,10);
  expect(s.sample).not.toHaveBeenCalled();
});
it("a dropped frame still triggers each crossed impact once",()=>{
  const s=audio();playHammerCues(s,1,0,false,0,7);
  expect(s.sample).toHaveBeenCalledTimes(6);
  playHammerCues(s,1,0,false,7,14);expect(s.sample).toHaveBeenCalledTimes(6);
});
