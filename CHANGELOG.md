# Changelog

A running record of notable changes. **Newest first.** British English.
(Small tweaks don't all need an entry — capture anything worth remembering later.)

## 2026-07-23 — Listen & Tap: popping animals no longer hide behind upper bushes

**Fixed — Listen & Tap**
- An animal in a lower row popped out *behind* the bush of the row above it, so
  the pop couldn't be seen. Each animal/bush clump now takes its draw depth from
  its vertical position, so lower rows always render in front of the rows above.

## 2026-07-22 — Listen & Tap hunts everything; Odd One Out reworked

**Changed — Listen & Tap**
- A round no longer ends after one find: the child now finds **every animal on
  the board**, asked for one at a time, before the round moves on. Found animals
  stay out of their bush and can't be tapped again. Difficulty records once per
  board (perfect board = first-try).

**Changed — Odd One Out**
- New round make-up: the board is **several copies of one item plus a single
  different one** (all dogs and one elephant), instead of a mixed-category set.
  The spoken reason is now "These are all dogs. The elephant is different!"
- **Level 1 is a pre-game example**: Gigi asks "Watch me! Which one is
  different?", picks the odd card itself (it lifts up with a burst of stars and
  its word appears) and explains why. Then the child tries one ("Now you!") —
  right first time goes **straight to level 2**; otherwise the example plays
  again. Levels are now 1 demo · 2 (3 cards, far) · 3 (4, far) · 4 (4, near) —
  "near" means the odd one is from the same category (a sheep among cows).
- Engine support in `ChoiceGameScene`: multi-find rounds (`nextTarget`), demo
  rounds (`RoundPlan.demo` + `runDemo`), per-set round counts, and
  `Difficulty.jumpTo` for out-of-band level jumps.

## 2026-07-22 — Backgrounds fill the whole screen

**Fixed**
- Background art now covers the **entire screen on any device aspect ratio**, not
  just the 1280×720 design box. Screens wider or taller than 16:9 (most modern
  phones) previously showed plain green bars either side of the art.
  `BaseScene` now scales the background to cover the camera's *visible* region
  (viewport ÷ zoom, axes swapped in portrait) and re-fits it on every
  resize/rotation.

## 2026-07-20 — Real background art

**Added**
- Two painted backgrounds in `public/assets/images/ui/`, named after the place
  they show: **`field_bg.png`** (open grassy field) and **`farmyard_bg.png`**
  (barn + farmhouse).
- **Field** is used by **all three game screens** — it's neutral, so it suits the
  farm animals and the wild animals equally. **Farmyard** is the **Home** screen,
  which shows no animals and can therefore be a definite place.
- `BaseScene.addBackground(key)` scales the art to *cover* the 1280×720 design
  space and sits it at depth −100. If an image is missing the scene falls back to
  the plain green as before.
- Listen & Tap's hand-drawn sky/grass rectangles are gone — it inherits the field.

## 2026-07-20 — Listen & Tap becomes a "Find the…" hidden-object game

**Changed**
- **Listen & Tap is now a hunt.** Animals are scattered across a grassy scene,
  each **partly hidden behind a bush** (enough shows to recognise, enough hides
  to make it a search). Tap the wrong one → it **peeks out** while the voice says
  "Oops!"; tap the right one → it **jumps out of the bush with a burst of stars**.
  Bushes gently rustle. Aim: turn a too-easy naming task into something that
  captures curiosity and challenges a confident child.
- **More items as she improves.** Listen & Tap now ramps 3 → 4 → 5 → 6 scattered
  animals, with a final level using **6 similar-category** animals (harder to
  tell apart). Bushes/scatter are placeholders (drawn shapes) — a real bush image
  can drop in later.
- Shared `ChoiceGameScene` refactored to expose presentation hooks
  (`buildBackground`, `layoutCards`, `onCorrectFeedback`, `onWrongFeedback`) so
  Listen & Tap can restyle the round while Odd One Out keeps the tidy row and all
  the round/difficulty/reward logic stays shared.

**Added**
- **Memory** boards open with a **2-second face-up peek** ("Remember where they
  are!") before the cards flip down.

## 2026-07-19 — Words on screen, nicer star, animal sounds, parents area

**Added**
- **Big written word** centred at the top of every game, so the child links the
  word to the picture. Listen & Tap shows it from the start; Odd One Out reveals
  it once the odd one is chosen; Memory shows a card's word as it's turned over.
- **Parents area** (`ParentsScene`), reached from Home behind a **press-and-hold**
  gate (~1.5s) so a child can't open it by accident. Holds a **per-game level
  reset** button (Listen & Tap / Odd One Out / Memory) that clears that game's
  saved difficulty back to level 1.
- **Animal / vehicle sounds** as spoken browser-voice placeholders (same stand-in
  approach as the rest of the audio): on a correct answer / matched pair the voice
  says the noise — "Moo!", "Woof!", "Vroom!" — before the praise. Map lives in
  `src/core/audio.ts` (`SOUND_WORDS`); quiet animals and food make no sound. Swaps
  for real recorded clips later.

**Changed**
- **Reward star** is now a drawn 5-point gold star (was an emoji that rendered
  clipped at the top); centred so it always fits.
- **Wrong-answer feedback** now alternates between "Oops!", "Not quite!" and
  "Try again!" (was a fixed "Hmm, try again!").

## 2026-07-19 — Fix: taps only reached the top half on phones

**Fixed**
- **Tap targets were unreachable below the screen's middle** on high-DPI phones
  (and offset upward everywhere). Cause: the drawing buffer is `pixelRatio`×
  larger than the canvas's on-screen (CSS) size for crispness, but Phaser was
  mapping taps in buffer pixels while the finger reports CSS pixels — so touches
  only reached the top `1/ratio` of the world (the top half on a 2× phone).
  Fix: call `game.scale.refresh()` in `resizeToDevice` after setting the canvas
  CSS size, so the input scale is recomputed from the correct bounds. One change
  in `main.ts` fixes every scene (home, all three games) at once — the fault was
  the global input mapping, not any individual card's hit area.

## 2026-07-19 — Content: sloth added to the item set

**Added**
- **Sloth** wired into `items.json` as a `wild_animal` (`sloth.png` was already in the
  items folder but unreferenced). No code change needed — games pick from `ITEMS` by
  category, so it now appears across all three games. `sound: null` (sloths are
  effectively silent); spoken-word audio path is `assets/audio/words/sloth.mp3` — falls
  back to browser speech until that file is generated. Wild-animal pool is now 4 (lion,
  elephant, monkey, sloth).

## 2026-07-18 — Fixes: tap accuracy + always-landscape orientation

**Fixed**
- **Tap targets were misaligned** on every card/button (dead bottom-right, active
  area skewed top-left). Cause: Container hit areas don't line up under a zoomed
  camera. Now the rectangle itself is the tap target. Verified taps land at all
  corners at phone-size scale.

**Changed**
- **Orientation is now always landscape, no rotation.** Dropped the earlier
  rotate-to-fill-portrait behaviour. The 1280×720 landscape design is scaled to
  fit and centred (`Scale.FIT`), so the game never spins or re-arranges when the
  phone turns. On a portrait phone it shows as a smaller centred landscape area
  with calm background-coloured margins. Fits phone, tablet and laptop.

**Hosting**
- Now building to `docs/` and serving via GitHub Pages (deploy from branch, main /docs).
  Live link: https://englishindoses.github.io/preschooler-game/

## 2026-07-17 — Milestone 1: three placeholder games + repo

**Added**
- Project scaffold: **Phaser 3 + Vite + TypeScript**. Landscape-locked on any screen
  (rotates to fill a portrait phone, taps still land — verified).
- **Game #1 — Listen & Tap** (hear a word, tap the picture).
- **Game #2 — Odd One Out** (tap the one that doesn't belong; mascot says why).
- **Game #3 — Memory / Pairs** (flip cards to find matches; boards grow 2→3→4 pairs).
- Shared engine `ChoiceGameScene` (powers #1 and #2), shared adaptive-difficulty engine,
  placeholder audio via browser speech, temporary `MenuScene` to reach the games.
- Design docs: `design/design.md` (build spec) and `design/asset-list.md` (assets to make).

**Fixed**
- Memory game: a mismatch was permanently freezing the board (a Phaser timer quirk).
  Reworked the flip-back to use a tween delay; input now recovers every time.

**Project**
- Created public GitHub repo `englishindoses/preschooler-game` and pushed the first commit.
