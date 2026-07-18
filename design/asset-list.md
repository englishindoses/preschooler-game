# Asset List — Milestone 1 (Games #1, #2, #10)

Everything to generate for the three games. **File names must match exactly** — the code
loads them by these paths. All under `public/assets/`.

**General specs**
- **Images:** PNG, **transparent background**, square-ish, large (≥ 512×512). One
  consistent, friendly, simple cartoon style across everything.
- **Audio:** MP3 (or OGG), short, clear. **British English**, warm, child-friendly voice.
- **Colourblind-safe:** pictures should read by shape, not colour alone (the spoken/written
  word always accompanies them).

---

## 1. Item pictures  → `public/assets/images/items/`

One picture per item. Simple, recognisable, front or 3/4 view, whole object centred.

| File name | Name | Description |
|---|---|---|
| `cow.png` | Cow | Friendly cartoon cow, standing, side/front view |
| `horse.png` | Horse | Cartoon horse, standing |
| `sheep.png` | Sheep | Fluffy white sheep, standing |
| `pig.png` | Pig | Pink cartoon pig |
| `hen.png` | Hen | Brown/white hen |
| `duck.png` | Duck | Yellow or white duck |
| `goat.png` | Goat | Cartoon goat |
| `dog.png` | Dog | Friendly cartoon dog |
| `cat.png` | Cat | Cartoon cat, sitting |
| `rabbit.png` | Rabbit | Cartoon rabbit with big ears |
| `lion.png` | Lion | Cartoon lion with mane |
| `elephant.png` | Elephant | Grey cartoon elephant |
| `monkey.png` | Monkey | Cartoon monkey |
| `tractor.png` | Tractor | Simple farm tractor, side view |
| `car.png` | Car | Simple cartoon car, side view |
| `bus.png` | Bus | Simple bus, side view |
| `apple.png` | Apple | Red apple |
| `carrot.png` | Carrot | Orange carrot with green top |
| `banana.png` | Banana | Yellow banana |

---

## 2. Spoken word clips  → `public/assets/audio/words/`

The mascot/voice saying **just the word**, British English. One per item.

| File name | Says |
|---|---|
| `cow.mp3` | "cow" |
| `horse.mp3` | "horse" |
| `sheep.mp3` | "sheep" |
| `pig.mp3` | "pig" |
| `hen.mp3` | "hen" |
| `duck.mp3` | "duck" |
| `goat.mp3` | "goat" |
| `dog.mp3` | "dog" |
| `cat.mp3` | "cat" |
| `rabbit.mp3` | "rabbit" |
| `lion.mp3` | "lion" |
| `elephant.mp3` | "elephant" |
| `monkey.mp3` | "monkey" |
| `tractor.mp3` | "tractor" |
| `car.mp3` | "car" |
| `bus.mp3` | "bus" |
| `apple.mp3` | "apple" |
| `carrot.mp3` | "carrot" |
| `banana.mp3` | "banana" |

---

## 3. Sound-effect clips  → `public/assets/audio/sounds/`

The **real sound** each thing makes (plays when a card is chosen correctly / matched).
Food and rabbit have **no** sound — skip those.

| File name | Sound |
|---|---|
| `cow.mp3` | Moo |
| `horse.mp3` | Neigh |
| `sheep.mp3` | Baa |
| `pig.mp3` | Oink |
| `hen.mp3` | Cluck |
| `duck.mp3` | Quack |
| `goat.mp3` | Goat bleat |
| `dog.mp3` | Woof |
| `cat.mp3` | Meow |
| `lion.mp3` | Roar |
| `elephant.mp3` | Trumpet |
| `monkey.mp3` | Monkey "ooh-ooh" |
| `tractor.mp3` | Engine "brrm" |
| `car.mp3` | Car beep / engine |
| `bus.mp3` | Bus engine / horn |

*(No sound needed: rabbit, apple, carrot, banana.)*

---

## 4. Mascot — "Gigi" the giraffe  → `public/assets/images/mascot/`

Gender-neutral, friendly giraffe. One consistent character in four poses.

| File name | Name | Description |
|---|---|---|
| `gigi_idle.png` | Gigi idle | Standing, gentle smile, neutral |
| `gigi_pointing.png` | Gigi pointing | Pointing/gesturing (demonstrates the task) |
| `gigi_celebrating.png` | Gigi celebrating | Happy, arms/hooves up, cheering |
| `gigi_encouraging.png` | Gigi encouraging | Warm, thoughtful "have another go" look |

---

## 5. Mascot voice lines  → `public/assets/audio/vo/`

Instructions and feedback. To keep recordings few, **carrier phrases** combine with the
word clips from §2 (e.g. `find_the.mp3` then `cow.mp3`).

| File name | Says |
|---|---|
| `find_1.mp3` … `find_6.mp3` | Varied "find" prompts (spoken as full lines with the word, or as carriers): "Find the…", "Where is the…?", "Can you see the…?", "Can you find the…?", "Where's the…?", "Show me the…!" |
| `which_different.mp3` | "Which one is different?" |
| `find_pairs.mp3` | "Find the matching pairs!" |
| `welcome.mp3` | Short friendly welcome, e.g. "Let's play!" |
| `praise_1.mp3` … `praise_6.mp3` | "Yes!", "Well done!", "You did it!", "Lovely!", "Great!", "Brilliant!" |
| `try_again_1.mp3` … `try_again_3.mp3` | "Hmm, try again!", "Nearly!", "Have another go!" |
| `well_done.mp3` | "Well done!" (reward moment) |
| `not_a_pair.mp3` | "Not a pair. Try again!" (memory) |

**Odd One Out reasons** (spoken after a correct answer — the "why"). Start with a small
carrier set; the game says `praise` + one of these:

| File name | Says |
|---|---|
| `isnt_an_animal.mp3` | "That one isn't an animal." |
| `isnt_a_vehicle.mp3` | "That one isn't a vehicle." |
| `isnt_a_food.mp3` | "That one isn't a food." |
| `isnt_a_farm_animal.mp3` | "That one isn't a farm animal." (farm-vs-wild rounds) |

*(These replace the current full-sentence placeholder speech; wiring can be adjusted to
match whichever exact lines you record.)*

---

## 6. UI & scene art  → `public/assets/images/ui/`

Currently emoji/solid-colour placeholders. Replace with:

| File name | Name | Description |
|---|---|---|
| `home_bg.png` | Home background | Friendly farm scene (landscape 1280×720) for the Home screen |
| `activity_listen.png` | Listen & Tap icon | Picture button for the Listen & Tap game |
| `activity_odd.png` | Odd One Out icon | Picture button for the Odd One Out game |
| `activity_memory.png` | Memory icon | Picture button for the Memory game |
| `card_back.png` | Card back | The face-down memory card design (one design, square) |
| `icon_home.png` | Home button | House icon (return home) |
| `icon_replay.png` | Replay button | Speaker/replay icon |
| `reward_star.png` | Reward star | Celebratory star/sticker for the reward beat |

*(Optional later: a soft background for the in-game screens instead of the solid green.)*

---

## Summary counts
- **19** item pictures · **19** word clips · **15** sound clips
- **4** mascot poses · **~20** voice lines
- **8** UI images

**Priority if generating in batches:** item pictures + word clips first (they power all
three games), then sounds, then mascot poses, then UI art. The games run on placeholders
until each asset arrives, so you can drop them in gradually.
