# Preschool Game — Design Spec (Milestone 1)

> **Purpose of this file:** the single source of truth a developer (Claude Code) builds
> from. Notion was for brainstorming; **this** doc is the build spec. Read it before
> writing any code. Written in British English.

---

## 1. What we're building

An educational **web game** (later a PWA) for children aged **3–5** who **cannot read,
write, or navigate apps**. Milestone 1 = **three games** on a shared farm/animal theme:

| # | Game | Child's task | Teaches |
|---|------|--------------|---------|
| 1 | **Listen & Tap** | Hear a word → tap the matching picture | Vocabulary, listening |
| 2 | **Odd One Out** | Tap the picture that doesn't belong | Categorising, reasoning |
| 10 | **Memory / Pairs** | Flip cards to find matching pairs | Memory, concentration |

A 4th game (**Counting & Place**, drag-to-place) comes next and introduces dragging — out
of scope for Milestone 1 but the code should not make it hard to add later.

---

## 2. Non-negotiable rules (apply to every screen)

- **Audio-first.** Every instruction is spoken. A tap-to-replay button is always present.
- **No fail states.** Wrong taps gently bounce back ("hmm, try again!"). Never "WRONG",
  never a losing state, no score shown to the child.
- **No timers / no pressure** by default.
- **Big touch targets, one clear action per screen.**
- **Immediate positive feedback:** sound + animation + the mascot celebrating.
- **Autonomy:** where possible, let the child choose (2–3 picture choices).
- **Repetition is fine** — children may replay freely.
- **Colourblind-safe:** never rely on colour alone; always pair it with the spoken word.
- **No ads, no purchases, ever.**
- **British English** in all copy and audio.

---

## 3. Tech stack

- **TypeScript** — the language.
- **Phaser 3** — game framework (rendering, input, tweens/animation, audio).
- **Vite** — dev server (instant browser preview) + build tool.
- **HTML/CSS overlay** — for the parent area only (text-heavy; sits over the game canvas).
- **PWA via `vite-plugin-pwa`** — added later to make it installable/offline.

No React, no PixiJS, no Howler, no backend, no database, **no API keys**. The game is fully
self-contained: all content is in local files, everything runs on the device.

---

## 4. Project structure

```
preschooler-game/
├─ design/
│  └─ design.md            ← this file
├─ public/
│  └─ assets/
│     ├─ images/           ← item pictures, mascot, UI, card backs
│     └─ audio/
│        ├─ words/         ← spoken word labels ("cow")
│        ├─ sounds/        ← animal/vehicle sounds (moo, brmm)
│        └─ vo/            ← mascot voice lines (instructions, praise)
├─ src/
│  ├─ main.ts              ← boots Phaser
│  ├─ scenes/             ← Boot, Preload, Home, game scenes, Reward
│  ├─ core/               ← shared logic (round loop, difficulty, audio, progress)
│  └─ data/
│     ├─ items.json        ← the shared content set (see §6)
│     └─ levels.json       ← difficulty ladders per game (see §6)
├─ index.html
└─ package.json
```

Content lives in `src/data/*.json` so games can be tuned/extended **without touching game
code**. Adding a new animal = adding an entry + its assets. No code change.

---

## 5. Shared framework (all three games use this)

### 5.0 Orientation — always landscape

The game is **always presented in landscape**, whatever way the phone is held. If the
phone is portrait, the whole view is **rotated to fill the screen sideways** (no black
letterbox bands) — the child sees it sideways and naturally turns the phone.

Implementation: every scene extends **`BaseScene`**, which rotates/zooms the **camera**
(not the DOM) to fit the fixed **1280×720** design space onto the screen. Rotating inside
Phaser's camera keeps **taps landing correctly** (a CSS rotation of the canvas breaks
input — verified). All objects are placed in 1280×720 design coordinates. `main.ts` uses
Phaser `Scale.RESIZE` so the canvas always fills the screen edge-to-edge.

### 5.1 Scene flow

```
Boot → Preload (load assets) → Home
Home ──tap an activity picture──► Game scene ──finish a set──► Reward ──► Home
```

- **Home** is a friendly farm scene, **not** a menu. It shows the mascot + **2–3 activity
  pictures** the child taps to choose a game (picture-based navigation).
- A **house icon** always returns Home. A small, dull **parental-gate** button (see §5.6)
  leads to the parent area.

### 5.2 The round loop (the heart of every game)

A **set** = **3 rounds** (`roundsPerSet`, easy to change to 2). One round:

1. **Instruct** — the mascot speaks the instruction; matching single word shown for the
   parent. A **replay button** re-plays the instruction on tap.
2. **Act** — the child taps (later: drags). Targets are big with generous hit areas.
3. **Respond:**
   - **Correct** → sound + animation + mascot praise → next round.
   - **Not quite** → the tapped item gently wobbles, mascot re-prompts warmly. No penalty,
     no advance. After a **2nd** miss on the same round, subtly highlight the right answer
     (a gentle pulse) so the child always succeeds — scaffold, never fail.
4. After 3 rounds → **Reward** beat (short celebration) → back to Home.

### 5.3 Difficulty engine (shared, adaptive)

Per game, the child sits at a **level** (see ladders in `levels.json`). The level defines
how many choices are on screen and how similar the distractors are.

- **Step UP** after **3 first-try correct answers in a row** (`stepUpStreak`).
- **Hold** on any miss (the streak resets; the level does **not** drop for a single miss).
- **Step DOWN** only after **3 rounds in a row that needed the answer highlighted**
  (`stepDownStruggles`) — a safety net so a child never gets stuck.
- Level per child is **remembered** between sessions (see §5.6). Start every new child at
  level 1.

These three numbers (`stepUpStreak`, `stepDownStruggles`, `roundsPerSet`) live in
`levels.json → progression` so they can be tuned without code changes.

### 5.4 Feedback & audio rules

- Instructions, praise, and re-prompts are **spoken** via mascot voice lines in
  `assets/audio/vo/`. Keep a **small bank of praise variations** ("Yes!", "You did it!",
  "Lovely!") and pick at random so it doesn't feel robotic.
- Every correct answer also plays the item's own sound where it has one (a cow moos).
- Audio must cope with mobile browsers: the **first user tap** unlocks audio (Phaser
  handles this); nothing important should play before that first tap.
- The **replay button** is always visible during the "Act" phase.

### 5.5 The mascot

- A **giraffe** (gender-neutral; the user's daughter loves them). Working name **"Gigi"** —
  placeholder, rename freely. Single point to change the name in code/data.
- **States** (each needs art + is triggered as noted): `idle`, `pointing` (demonstrates
  before the first round of a set), `celebrating` (correct / reward), `encouraging`
  (gentle "try again").
- The mascot is the **narrator**: it gives instructions and all praise/re-prompts.

### 5.6 Progress & parent area

- **Tracked per child:** which games played, rounds done, current level per game, and a
  simple domain tally (vocabulary / reasoning / memory). Stored **on-device** (browser
  localStorage) — no accounts, no server.
- **Parent area** sits behind a **parental gate** (e.g. "tap the two carrots" or a
  hold-to-enter — something a 3-year-old won't do by accident, no reading required to
  *guess*, but hard to pass without intent). Built as a plain **HTML/CSS overlay**.
- Parent area shows a **friendly progress summary**. **No score is ever shown to the
  child.**

---

## 6. Content model (the data the code reads)

### 6.1 `src/data/items.json`

An array of items. The shared farm/animal set powers all three games.

```jsonc
{
  "id": "cow",              // unique, lowercase, no spaces
  "word": "cow",           // British-English label (shown to parent, spoken)
  "image": "assets/images/items/cow.png",
  "wordAudio": "assets/audio/words/cow.mp3",   // spoken word
  "sound": "assets/audio/sounds/cow.mp3",       // the thing's own sound; null if none
  "category": "farm_animal" // used by Odd One Out
}
```

Categories in Milestone 1: `farm_animal`, `wild_animal`, `vehicle`, `food`.

### 6.2 `src/data/levels.json`

`progression` holds the shared adaptive numbers; each game has an ordered **ladder** of
levels. A level names its parameters; the game builds rounds by picking items from
`items.json` that satisfy them.

- **listen_and_tap** — `choices` (how many pictures) and `distractorCategory`:
  `"any"` (easy, mixed categories) or `"same"` (hard, all same category → real listening).
- **odd_one_out** — `total` items on screen, made of `total-1` from one category + **1**
  from another. `oddness`: `"far"` (very different category, e.g. animal vs vehicle) or
  `"near"` (closer, e.g. farm animal vs wild animal).
- **memory_pairs** — `pairs` (how many matching pairs; grid = pairs × 2 cards) and
  `matchType`: `"identical"` for Milestone 1.

See the file for the concrete ladders.

---

## 7. Game #1 — Listen & Tap

- **Screen:** `choices` big pictures in a row/grid, evenly spaced, generous gaps. Replay
  button visible. Mascot at the side.
- **Instruction:** mascot says *"Find the cow!"* (word also shown). One item is the target.
- **Correct tap:** target animates + plays its sound; mascot praises ("Yes — the cow!
  Moo!"). Advance.
- **Wrong tap:** tapped item wobbles; mascot re-prompts ("Hmm, where's the cow?"). 2nd miss
  → pulse the target.
- **Ladder:** L1 = 2 pictures, mixed categories → L2 = 3 → L3 = 4 → L4 = 4 from the **same**
  category (cow/horse/sheep/goat — now it's real listening, not elimination).
- **Reuse:** ⭐⭐⭐ the whole item set.

---

## 8. Game #2 — Odd One Out

- **Screen:** `total` big pictures. One doesn't belong. Replay button visible.
- **Instruction:** mascot says *"Which one is different?"*
- **Correct tap:** the odd one pops/celebrates; mascot gives the **reason** — *"Yes! The car
  isn't an animal."* (The spoken *why* is what makes this teach, not just test.)
- **Wrong tap:** tapped item wobbles; mascot re-prompts. 2nd miss → pulse the odd one.
- **Ladder:** L1 = 3 items, `oddness: far` (2 animals + 1 vehicle) → L2 = 4 items, `far` →
  L3 = 4 items, `oddness: near` (3 farm animals + 1 wild animal).
- **Reuse:** ⭐⭐⭐ same item set + the `category` field. This is why #1 and #2 are nearly the
  same engine: a grid of tappable pictures where one is "the answer".

---

## 9. Game #10 — Memory / Pairs

- **Screen:** a grid of face-down cards (`pairs × 2`), big, few, well-spaced. A single card
  back design.
- **Play:** child taps a card → it flips (tween) showing the picture; taps a second →
  - **Match** → both cards celebrate + play the item's sound + mascot praise; cards stay
    face-up (or lift away).
  - **No match** → mascot gives a warm nudge; both cards flip back after a short beat
    (long enough for a young child to register them). No penalty.
- **Win:** all pairs found → Reward beat.
- **Ladder:** L1 = 2 pairs (2×2) → L2 = 3 pairs (2×3) → L3 = 4 pairs (2×4). `matchType:
  identical` (cow ↔ cow).
- **Later (not now):** `matchType` can become `sound` (picture ↔ its sound) or `home`
  (animal ↔ habitat) reusing the same art — designed for, not built yet.
- **Reuse:** ⭐⭐⭐ same item set + one card back.

---

## 10. Asset list (for the user to generate)

Consistent, friendly, simple illustrations. Each image: **PNG, transparent background**,
large and clear, one consistent art style. Audio: short **MP3** clips, British English,
warm child-friendly voice.

### 10.1 Item pictures + audio (the shared set)

For **each** item below: a **picture**, a **spoken word** clip, and (where noted) a
**sound** clip.

- **Farm animals** (spoken word + animal sound each): cow, horse, sheep, pig, hen, duck,
  goat, dog, cat, rabbit
- **Wild animals** (word + sound): lion, elephant, monkey
- **Vehicles** (word + sound): tractor, car, bus
- **Food** (word only, no sound): apple, carrot, banana

### 10.2 Mascot (Gigi the giraffe)

- Art for 4 states: `idle`, `pointing`, `celebrating`, `encouraging`.
- Voice lines (British English):
  - Instructions: "Find the ___!", "Which one is different?", "Find the matching pairs!"
  - Praise bank (record ~5–6 variations): "Yes!", "You did it!", "Lovely!", "Well done!" …
  - Re-prompts: "Hmm, try again!", "Where's the ___?", "Nearly!"
  - Odd-one-out reasons: short lines like "The car isn't an animal."
  - A short welcome line for Home.

### 10.3 UI & scenes

- Home farm-scene background + 2–3 activity-choice pictures (one per game).
- Buttons: **replay/speaker**, **home (house)**, parental-gate entry.
- Memory **card back** design.
- Reward beat: a simple celebration (confetti/sticker art or a short mascot animation).

> **Naming:** files should match the ids in `items.json` (e.g. `cow.png`, `cow.mp3` in
> `words/`, `cow.mp3` in `sounds/`). Exact list + paths are in the data files.
