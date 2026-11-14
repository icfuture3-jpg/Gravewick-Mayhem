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

## Hero powers

The Meet the Heroes screen, Grimoire, and in-game ability bar share the same move descriptions:

- **Grimble:** J sweeps his golden lantern and reveals nearby hidden health supplies. K teleports toward his aim (up to 260 pixels) through a lantern portal; the exit pulls and damages nearby enemies. L reveals all three hidden supplies in the stage and damages all current enemies.
- **Pip:** J is a heavy ham whack. K picks an unpredictable bouncing dynamite, frost, or shock gadget (damage, non-boss freeze, or strong knockback). L shrinks him for six seconds with a smaller collision radius, 50% faster movement, and half incoming damage—not invulnerability.
- **Wisp:** J fires magic from her floating spellbook. K turns her invisible for five seconds: enemies stop tracking her, but existing projectiles and hazards can still hurt. J or L ends invisibility. L creates two six-second illusions that attract enemies, absorb attacks (three hits each), and fire weaker bolts.

Switching heroes ends shrinking/invisibility so those personal powers cannot transfer. Illusions remain until destroyed or expired. Hidden supplies reset each stage/run and become normal collectible health pickups once revealed. Practice starts with a full ultimate; Refill restores health, cooldowns, and ultimate charge for repeated ability checks.

## Action cutscenes

Story battles now have automatically advancing, skippable action sequences: the trio enters each stage through lantern portals, Pip shrinks and launches a gadget, and Wisp vanishes behind firing mirror doubles. Boss arrivals get a team charge; each boss crossing half health triggers one counterattack sequence. Each defeated boss gets a finishing move and victory celebration, including the final portal sealing. Gameplay, enemy attacks, health, projectiles and cooldowns pause for the movies, then resume from their existing state. Click/Space advances a beat; Esc skips the current sequence. Endless and Practice remain uninterrupted. These use the existing animated models with cinematic magic, explosions, motion lines, camera shake and procedural sound cues—not pre-rendered video or recorded voices.

## Gravewick Tales — separate personal story mini-games

The title screen has two distinct entries:

- **Play Gravewick Mayhem** starts the original team campaign directly. Its arena combat, training, hero switching, action cutscenes and high scores are unchanged. Endless and Practice remain separate buttons.
- **Gravewick Tales** opens a separate character picker. Click Grimble, Pip or Wisp's animated model (or their Play tale button) to begin that character's own story. Meet the Heroes also links to the selected character's Gravewick Tale.

Each Tale contains three chapters: an animated backstory scene, a personal mini-game memory, and a chapter conclusion. Complete all three to see the character's ending. Tales never starts the arena brawler, offers no Continue/Skip to battle controls, and does not affect Mayhem health, waves or high scores. Cutscenes wait for Continue so the story can be read at your pace. A failed memory can be retried or exited; winning offers Continue tale. The ending offers Replay this tale or Choose another character.

- **Grimble — Keeper of the Lost Light / Lantern Hunt:** reveal and collect fallen-star sparks, keeper embers and gate fragments while dodging shadows. WASD/arrows move, J/Space reveals, K portals toward your mouse.
- **Pip — The Smallest Big Hero / Gadget Gallery:** repair market toys, rebuild a failed invention and disable machine locks. Move with WASD/arrows; aim with the mouse; J/click throws, K cycles gadget types, Space shrinks under the scanner.
- **Wisp — Beyond the Mirror / Mirror Memory:** unlock the library spellbook, confront doubtful reflections and write its final page. Watch the rune pattern, then repeat with 1–4 or the rune buttons; K replays at a time cost.

Objectives reveal matching backstory memories during play. Mini-games include Start, pause/resume, blur-pause, timeout and retry. Tales points are session-only and isolated from Mayhem's leaderboard; no mid-Tale save is provided. All characters are unlocked. The personal stories use original backstory text and existing animated models, without new external assets or recorded voices.

## Mini-game browser regression checks

Install Chromium once with `bunx playwright install chromium`. Start the app with `bun run dev --port 5173`, then run `bun run test:browser` in another terminal. The real Chromium playthrough uses normal mouse/keyboard/button inputs through all three chapters for each hero, all endings, replay, pause/resume, timeout/retry and exits. It controls browser time for deterministic animation-frame stepping; it does not edit game state or bypass objectives. Set `GAME_URL` only to a reachable local test server to use another port.

Wisp's large rune tiles and the rune buttons both accept clicks; repeated flashes now have blank gaps. Inputs queue in order instead of overwriting rapid clicks. Her progress text shows how many runes were accepted, and the watch phase explains why rune inputs are temporarily disabled. On-screen lantern/portal, gadget/throw/shrink and pattern-replay buttons mirror the keyboard controls. Pause/resume preserves mouse aim; retry resets it, clears input and resets the current chapter.

## Acting out Tales descriptions

Tales uses its own chapter-specific animated story renderer rather than Mayhem's generic attack montage. Grimble catches a falling star's sparks, relights keeper lanterns and opens the star gate; Pip repairs toys, rebuilds a prototype and shrinks beneath a scanner to disable locks; Wisp retrieves a floating spellbook from a mirror, confronts a reflection with doubles and writes a page as the dark mirror becomes starlight. Chapter conclusions show the completed action instead of starting the task over. These are stylized 2D props and choreography around the existing animated character sprites—not new skeletal hand animations or rendered movies. Mayhem cutscenes remain unchanged, and voices remain absent.

During mini-games, revealed sparks gain lantern frames, Pip's targets become toys with wheels and stay visibly repaired/disabled when matched, and Wisp's floating book gains writing with each restored memory. Puzzle rules, controls, timing, difficulty, collision sizes and hit areas are unchanged.

## Runtime ownership

The persistent React shell owns navigation, sound preference and local scores. Mayhem and
Tales are separate lazy-loaded bundles. Mayhem mounts only for a campaign, endless or practice
session; its canvas, global input listeners, animation frame and audio context are destroyed
on exit. Pause/resume keeps the existing session mounted. Sound preference, including the M
shortcut, survives returning to the menu and starting another run.

Tales retains its own session-only chapter state and keyed mini-game/cutscene cleanup. Campaign
location names and palettes live in `locations.ts`; combat and transition rules are unchanged.
Shared baked sprites remain cached for the page lifetime and are still loaded at startup;
this separation does not yet introduce on-demand character models or mid-Tale saves.

With the local app running, `bun scripts/runtime.browser.mjs` checks lazy runtime loading,
repeated Mayhem/Tales switches, listener/animation/audio cleanup, mute retention, pause/resume,
and campaign/practice launches using normal browser inputs.

## Cutscene sound and lightning

Mayhem action scenes now sync laser zaps, gadget explosions, lightning cracks and delayed
thunder to their animation beats. Tales adds lightning/thunder for Grimble, gadget blasts
for Pip, and laser magic for Wisp, without changing chapter choreography or mini-game rules.
Effects play once per story beat, not continuously while reading. Tales has a Sound toggle
sharing Mayhem's sound preference; it can also enable browser audio if autoplay is blocked.
Audio closes on cutscene exit. Lightning uses a restrained tint and bolt; the system reduced
motion preference suppresses lightning flashes. Explosion and thunder now use bundled CC0 audio files instead of noise synthesis; credits are in public/audio/CREDITS.md. Lasers remain synthesized.
