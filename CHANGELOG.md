# Changelog

A running record of notable changes. **Newest first.** British English.
(Small tweaks don't all need an entry — capture anything worth remembering later.)

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
