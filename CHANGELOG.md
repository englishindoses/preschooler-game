# Changelog

A running record of notable changes. **Newest first.** British English.
(Small tweaks don't all need an entry — capture anything worth remembering later.)

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
