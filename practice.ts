import type { EnemyKind } from "./art";
export const PRACTICE_ENEMIES = ["clown", "bat", "ghoul", "slime", "boogeyman", "nergal", "meteor"] as const satisfies readonly EnemyKind[];
export type PracticeEnemy = typeof PRACTICE_ENEMIES[number];
export interface PracticeOptions { hero: 0 | 1 | 2; enemy: PracticeEnemy }
