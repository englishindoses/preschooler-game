# Preschooler Game — Project Context

Educational mobile phone game for **preschool children (ages 3–5)**. The child cannot
read, write, or navigate complex apps, so the game is **audio-first, picture-based, and
has no fail states**. Learning through play: vocabulary, phonics, numeracy, reasoning.

## Who does what
- **Claude Code** does all the coding.
- **The user** generates assets (images, audio) with other AI tools and saves them into
  the correct folders. When a game needs assets, produce a clear list/spec for the user.

## Source of truth
- **Build spec:** `design/design.md` — the authoritative doc to build from. Read it before
  writing any code. Game content/data: `src/data/items.json` and `src/data/levels.json`.
- **Brainstorm/history only:** Notion —
  **https://app.notion.com/p/397b032be58581189e0dd51db49d2ada**
  (Page: "Preschool Game — Brainstorm & Design"). Used for early brainstorm and decisions;
  **not** the build spec. `design/` supersedes it for anything about how the game works.

## Working conventions
- **Language: British English** (colour, recognise, …) — content and copy.
- **Notion edit convention:** Claude's new additions/edits are written in **blue**; the
  user sets them to black once read. Keep using this.
- **Don't create git branches** without asking; work on `main` by default.
- Keep instructions for children **spoken + written**, targets **big**, feedback
  **positive** (never "wrong"/no losing), one action per screen.

## Project workflow (4 stages)
Brainstorm → Choose → Decide tools/tech → **Build the plan**.
Brainstorm ✅ · Choose ✅ · Tools/tech ✅ · **Now: design/build (Milestone 1).**

## Status
- Local **git repo** initialised (branch `main`). Project scaffolded (Phaser+Vite+TS).
- **All three Milestone-1 games built with placeholders and verified:** #1 Listen & Tap,
  #2 Odd One Out (both share `ChoiceGameScene`; a subclass supplies `planRound()`),
  #10 Memory/Pairs (`MemoryScene`, its own flip mechanic). Reusable core in `src/core/`
  (content, difficulty, audio, theme); `BaseScene` handles landscape + the reward star.
- Placeholders (all swap out later): coloured cards for pictures, browser speech
  (`src/core/audio.ts`) for voice, on-screen level readout, and a **temporary `MenuScene`**
  standing in for the real farm Home. **Next game: #4 Counting & Place** (drag-to-place).
- **Asset spec:** `design/asset-list.md` (exact filenames + descriptions to generate).
- Phaser gotcha (learned): a `time.delayedCall` scheduled from *inside* another timer
  callback did not fire reliably here — use a tween `delay` for sequenced timing instead
  (see `MemoryScene` flip-back).
- **Games chosen (Milestone 1):** #1 Listen & Tap, #2 Odd One Out, #10 Memory/Pairs, on a
  shared **farm/animal** theme. #4 Counting & Place is next (introduces drag-to-place).
- **Tech stack:** TypeScript + Phaser 3 + Vite; parent area as an HTML/CSS overlay;
  shipped later as a PWA via `vite-plugin-pwa`. No React/Pixi/Howler, no backend, no API
  keys. Full detail + rationale in `design/design.md §3`.
- **Design spec:** `design/design.md` (framework, 3 games, asset list); data in
  `src/data/items.json` + `levels.json`.
- **Mascot:** a **giraffe**, placeholder name "Gigi" (rename freely).

## Not yet decided
Art style · final mascot name · phonics scheme (later games) · exact reward/sticker
visuals · hosting. Asset generation (images/audio) pending — spec is in `design.md §10`.

## Notes for future sessions
- The **grilling** skill is installed globally — useful for stress-testing the plan
  before building (Stage 4).
- When the user stops mid-task to ask a question, answer and wait; don't resume until
  told to continue.
