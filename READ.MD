# Gravewick Mayhem

Standalone single-player canvas brawler. Runs directly in a browser with React and Vite; no Treehouse SDK, account, server, API keys, or external asset host required.

## Run locally

Install Bun 1.4.4, then:

```sh
bun install --frozen-lockfile
bun run dev
```

Open the local URL printed by Vite. Desktop keyboard and mouse are required. WASD/arrows move, mouse aims, J/left click attacks, K/right click uses a skill, L/Space uses the ultimate, Shift dashes, Q/1–3 swaps heroes, G opens the Grimoire, P/Esc pauses, and M mutes. Click/Space advances a written cutscene; Esc skips it.

## Check and build

```sh
bun run checks
bun run test
bun run build
bun run start
```

The build produces `dist/`, suitable for static hosting. `vercel.json` configures Vite, a frozen Bun install, and the output directory for Vercel. No environment variables are required.

## Scores and assets

Story and endless high scores are separate top-ten lists in this browser's localStorage. They persist across reloads on the same origin and device, but are not shared online or across deployment URLs. Clearing site data removes them. When browser storage is blocked or full, scores work in memory for the current page session and the game displays a warning after a run.

The original Treehouse sign-in and online leaderboards have been removed. All ten original binary models are hosted locally under `public/assets/`. Animated model frames are baked once with Three.js, then reused throughout gameplay, cutscenes, portraits, and the hero gallery. A loading screen waits for every model before the game starts; failed model loads show a reload message instead of silently substituting drawn characters. WebGL is required during loading. The bat has no animation clips, so its existing procedural flap motion is retained. Voice recordings were not included; written cutscenes, procedural music, and sound effects remain.

Simulation, art, and audio live in `engine.ts`, `art.ts`, `heroes.ts`, and `audio.ts`. `hud.tsx` supplies menus and the canvas; `client.tsx` starts the standalone app; `leaderboard.ts` handles local scores.

Story mode begins with five interactive training prompts before enemies spawn. Complete movement, attack, skill, swap and dash actions, or press T to skip. Endless mode starts without training. Heroes use run clips when available and mirror toward their aim; ranged enemies display a short dashed warning before firing.

## Practice arena

Choose Practice arena from the title, pick any of the three heroes and any of the seven Grimoire enemies (including each boss), then Start practice. All heroes remain switchable with Q/1–3. Ultimates start full; use the on-screen refill button to restore health, skill cooldowns and ultimate charge. Defeated opponents respawn; boss summons and slime splitting remain enabled. Practice never submits high scores. Pause and Quit to title to change the matchup.
