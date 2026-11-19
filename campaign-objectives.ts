import type { HeroId } from "./solo-story";

export interface CampaignObjective {hero: HeroId; stage: 1 | 2}
/** Two objectives per campaign stage, after waves one and two. Never in Endless. */
export const CAMPAIGN_OBJECTIVES: readonly (readonly CampaignObjective[])[] = [
  [{hero: 0, stage: 1}, {hero: 1, stage: 1}],
  [{hero: 0, stage: 2}, {hero: 2, stage: 1}],
  [{hero: 1, stage: 2}, {hero: 2, stage: 2}],
];
export function campaignObjective(stage: number, clearedWave: number): CampaignObjective | null {
  return CAMPAIGN_OBJECTIVES[stage]?.[clearedWave - 1] ?? null;
}
