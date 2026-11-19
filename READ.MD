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

## Hero powers

The Meet the Heroes screen, Grimoire, and in-game ability bar share the same move descriptions:

- **Grimble:** J sweeps his golden lantern and reveals nearby hidden health supplies. K teleports toward his aim (up to 260 pixels) through a lantern portal; the exit pulls and damages nearby enemies. L reveals all three hidden supplies in the stage and damages all current enemies.
- **Pip:** J is a heavy ham whack. K picks an unpredictable bouncing dynamite, frost, or shock gadget (damage, non-boss freeze, or strong knockback). L shrinks him for six seconds with a smaller collision radius, 50% faster movement, and half incoming damage—not invulnerability.
- **Wisp:** J fires magic from her floating spellbook. K turns her invisible for five seconds: enemies stop tracking her, but existing projectiles and hazards can still hurt. J or L ends invisibility. L creates two six-second illusions that attract enemies, absorb attacks (three hits each), and fire weaker bolts.

Switching heroes ends shrinking/invisibility so those personal powers cannot transfer. Illusions remain until destroyed or expired. Hidden supplies reset each stage/run and become normal collectible health pickups once revealed.

## Action cutscenes

Story battles now have automatically advancing, skippable action sequences: the trio enters each stage through lantern portals, Pip shrinks and launches a gadget, and Wisp vanishes behind firing mirror doubles. Boss arrivals get a team charge; each boss crossing half health triggers one counterattack sequence. Each defeated boss gets a finishing move and victory celebration, including the final portal sealing. Gameplay, enemy attacks, health, projectiles and cooldowns pause for the movies, then resume from their existing state. Click/Space advances a beat; Esc skips the current sequence. Endless remains uninterrupted. These use the existing animated models with cinematic magic, explosions, motion lines, camera shake and procedural sound cues—not pre-rendered video or recorded voices.

## Gravewick Tales — separate personal story mini-games

Open **Meet the heroes**, select Grimble, Pip or Wisp, then choose their personal Tale. The title screen has no Gravewick Tales button. The Mayhem campaign and Endless arena remain separate and unchanged.

Each Tale has three chapters: a backstory scene, a playable memory and a conclusion. Complete all three chapters to see the hero's ending. These mini-games never launch the arena or write to Mayhem's leaderboard.

- **Grimble — Lantern Hunt:** click the ground or use WASD/arrows to explore. His lantern automatically reveals nearby fallen-star sparks, keeper embers or gate fragments. Walk close so they follow, then escort them to the glowing HOME lantern. Purple shadows briefly slow Grimble but never steal rescued lights. Rescue five per chapter.
- **Pip — Monster Toy Workshop:** repair six monster toys/mechanisms per chapter with his meat mallet. Click each large golden broken part in order (three per toy), or aim and press J/Space. Numbered Hit part buttons offer the same actions without precise aiming. Wrong hits have no penalty. Later chapters rebuild his prototype and repair mechanisms that stop the nightmare machine.
- **Wisp — Lost Library Pages:** explore the whimsical library with click-to-walk or WASD/arrows. Walk close to a glowing page to collect it, then return it to the open BOOK. Carry one at a time and restore three per chapter. There are no rune sequences or memory tests.

The playfield, objective text and live progress explain the next step. Navigation/action buttons provide a keyboard-accessible alternative to the canvas. There is no countdown or failure penalty. Start, pause/resume, blur-pause, restart and exit are available; restart clears the current chapter only. Progress and fixed completion bonuses are session-only. All characters are unlocked. Story art uses existing models and drawn props, without new external assets or voices.

## Mini-game browser regression checks

Install Chromium once with `bunx playwright install chromium`. Start the app with `bun run dev --port 5173`, then run `bun run test:browser` in another terminal. The Chromium playthrough uses DOM buttons, mouse and keyboard through all nine chapters, all endings, replay, pause/resume, restart and exits. It controls browser time without modifying game state. Set `GAME_URL` only to a reachable local test server to use another port.

## Acting out Tales descriptions

Tales uses its own chapter-specific animated story renderer rather than Mayhem's generic attack montage. Grimble catches a falling star's sparks, relights keeper lanterns and opens the star gate; Pip repairs toys, rebuilds a prototype and shrinks beneath a scanner to disable locks; Wisp retrieves a floating spellbook from a mirror, confronts a reflection with doubles and writes a page as the dark mirror becomes starlight. Chapter conclusions show the completed action instead of starting the task over. These are stylized 2D props and choreography around the existing animated character sprites—not new skeletal hand animations or rendered movies. Mayhem cutscenes remain unchanged, and voices remain absent.

During mini-games, following sparks show a trail home, Pip's monster toys show numbered golden repair rings and completed toys stay repaired, and Wisp carries a visible page while a guide line points to her book.

## Runtime ownership

The persistent React shell owns navigation, sound preference and local scores. Mayhem and
Tales are separate lazy-loaded bundles. Mayhem mounts only for a campaign or endless
session; its canvas, global input listeners, animation frame and audio context are destroyed
on exit. Pause/resume keeps the existing session mounted. Sound preference, including the M
shortcut, survives returning to the menu and starting another run.

Tales retains its own session-only chapter state and keyed mini-game/cutscene cleanup. Campaign
location names and palettes live in `locations.ts`; combat and transition rules are unchanged.
Shared baked sprites remain cached for the page lifetime and are still loaded at startup;
this separation does not yet introduce on-demand character models or mid-Tale saves.

With the local app running, `bun scripts/runtime.browser.mjs` checks lazy runtime loading,
repeated Mayhem/Tales switches, listener/animation/audio cleanup, mute retention, pause/resume,
and campaign launches using normal browser inputs.

## Cutscene sound and lightning

Mayhem action scenes now sync laser zaps, gadget explosions, lightning cracks and delayed
thunder to their animation beats. Tales adds lightning/thunder for Grimble, gadget blasts
for Pip, and laser magic for Wisp, without changing chapter choreography or mini-game rules.
Effects play once per story beat, not continuously while reading. Tales has a Sound toggle
sharing Mayhem's sound preference; it can also enable browser audio if autoplay is blocked.
Audio closes on cutscene exit. Lightning uses a restrained tint and bolt; the system reduced
motion preference suppresses lightning flashes. Explosion and thunder now use bundled CC0 audio files instead of noise synthesis; credits are in public/audio/CREDITS.md. Lasers remain synthesized.

## Grimoire moves in stories and mini-games

Story captions and move buttons read names directly from the same `HERO_ABILITIES` definitions as the Grimoire. Personal chapters show Grimble's Lantern Sweep / Lantern Portal / Hidden Light, Pip's Ham Whack / Gadget Pouch / Tiny Trouble, and Wisp's Spellbook Bolt / Invisible Veil / Spellbook Bolt. Pip stays tiny for six seconds; Wisp's veil lasts five seconds. Her personal story keeps one Wisp (no extra mirror copies). Team campaign action scenes retain their intentional combat illusions, now with named Grimoire moves and a visible ham mallet / coloured bouncing gadget.

Optional moves help in the existing mini-games without replacing their simple objectives:
- Grimble: J **Lantern Sweep** reveals lights within 180px. K **Lantern Portal** teleports toward the mouse up to 260px, carrying following sparks, with the Grimoire's 9s cooldown.
- Pip: existing mallet repairs use **Ham Whack**. K **Gadget Pouch** launches a randomly selected bouncing dynamite/frost/shock gadget toward the mouse; its landing repairs the highlighted part if aimed correctly (5s cooldown). The button aims at that part automatically. Gadget damage/freeze effects are not simulated against non-enemy toys.
- Wisp: J **Spellbook Bolt** fires from the quest book toward the mouse to retrieve a page. Its button targets the next uncollected page. She still carries one page at a time and must return it to BOOK; the book's restored arrival animation is unchanged.

Buttons duplicate keyboard actions. Pausing stops moves and cooldowns; restart clears effects, projectiles and cooldowns. No moves award progress after completion.

## L ultimate controls

In personal mini-games, L (or the named ultimate button) is ready at every chapter start and recharges in 12 seconds. Grimble's Hidden Light reveals all lost sparks; Pip's Tiny Trouble shrinks him and his mallet for six seconds and doubles repair swing speed; Wisp's Mirror Illusions deliberately creates two clearly marked, six-second copies that fire bolts to retrieve pages. Her normal story and gallery remain single-Wisp; extra copies exist only during this explicitly activated move. Restart clears copies/effects and restores readiness. Pause freezes all timers.

Team campaign/Endless combat retains its existing 100% charge requirement and full combat ultimates. Pressing L before full charge now displays the current percentage and how to charge it instead of silently doing nothing. Damage and new enemy discoveries charge the shared ultimate meter. Story cutscenes and paused games do not accept combat casts.
