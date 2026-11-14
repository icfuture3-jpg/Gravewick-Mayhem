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

## Solo stories and mini-games

Choose **Hero stories & mini-games** on the title screen, then Grimble, Pip or Wisp. All three are available immediately. **Play [hero]'s story** starts a three-chapter solo run with that hero's own origin, chapter, boss and ending cutscenes. These are new original backstories for this game. Team story + training remains a separate option. Solo stories skip training, disable hero switching, and end when the selected hero falls. They use the existing three arenas and bosses with 30% lower enemy health and incoming damage, 15 health restored at wave boundaries, and a full heal before each chapter's battle.

Each hero has a distinct mini-game, available standalone from the same picker and before each solo chapter's battle:

- **Grimble — Lantern Hunt:** move with WASD/arrows, hold J/Space to reveal five lost lights, walk over them to collect, and use K to portal toward the mouse. Avoid moving shadows that steal time.
- **Pip — Gadget Gallery:** move and aim with the mouse; J/click throws a gadget, K cycles dynamite/frost/shock. Match each numbered target to the correct gadget. Space briefly shrinks Pip to dodge the moving scanner.
- **Wisp — Mirror Memory:** watch lit runes, then reproduce three increasingly long patterns using 1–4 or the rune buttons. K replays the pattern at a time cost. Later chapters change the patterns.

Mini-games wait for Start, offer pause/resume and retry, pause on window blur, and have clear win/timeout results. A story challenge can be skipped without a bonus, so it cannot block campaign progress. Winning adds a time-based bonus once and Continue to battle resumes the selected hero; battles begin with at least 50% ultimate charge. Standalone mini-games can be replayed or exited at any time. Solo scores and mini-game results are session-only and never mix into team/endless high scores. Full solo runs cannot be saved mid-chapter.

### Clickable characters and playable memories

Click any animated character card in the story picker or Meet the Heroes; the model is inside a native keyboard-accessible selection button. Each story-picker card also has its own direct mini-game launch button. Meet the Heroes launches the selected character's mini-game too.

Each mini-game now takes place inside its hero's backstory: Grimble rescues fallen-star sparks and forgotten keeper embers; Pip repairs his market toys and failed prototype before disabling machine locks; Wisp unlocks the library spellbook, confronts doubtful reflections, and writes its final page. Successful objectives reveal that chapter's memories during play, and winning reveals its story conclusion. Standalone wins offer the next of three backstory memories; retries reset the current memory. In-story challenges use the current campaign chapter. Themed keeper-lantern, market-workbench, and library-mirror playfields distinguish the settings. This narrative progress is session-only.
