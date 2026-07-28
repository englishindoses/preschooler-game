import Phaser from 'phaser';
import { ChoiceGameScene, RoundPlan, Card, CardPart } from './ChoiceGameScene';
import { DESIGN_WIDTH } from './BaseScene';
import { PATTERN_LEVELS, pickItems, shuffle } from '../core/content';
import { praise, speak, speakSound } from '../core/audio';
import { CATEGORY_COLOUR } from '../core/theme';
import type { Item } from '../data/types';

// A tile in the pattern strip: a picture (or placeholder) that is NOT tappable —
// it's the pattern the child reads, not a choice.
interface Tile {
  item: Item;
  parts: CardPart[];
}

// Where the empty "?" box sits — the target the child drags an answer into.
interface Slot {
  x: number;
  y: number;
  size: number;
}

// A draggable choice picture, with the spot it springs back to if it's dropped
// anywhere else and the resting scale of each of its pieces.
interface Choice {
  card: Card;
  homeX: number;
  homeY: number;
  scales: number[];
}

const STRIP_Y = 300; // the pattern strip, under the HUD
const CHOICE_Y = 570; // the row of pictures to choose from
const CHOICE_SIZE = 200; // how big a choice picture is in that row
const STEP_MS = 380; // how long the demo dwells on each tile of the strip
const DRAG_LIFT = 1.12; // how much a picture grows while it's being carried
const TAP_SLOP = 12; // a "drag" shorter than this was really just a tap

// Game — Patterns ("What comes next?"). A repeating row of pictures ends in an
// empty box; the child DRAGS the picture that continues the pattern into it.
// Reasoning practice, and it reuses the same item pictures as the other games
// (no new art). It's also where the drag-to-place mechanic first appears.
//
// Like Odd One Out, level 1 is a worked example: Gigi reads the pattern out,
// walks along it, picks the next one herself and says why. Then the child tries
// one; right first time → straight to level 2, otherwise the demo plays again.
export class PatternsScene extends ChoiceGameScene {
  protected storageKey = 'pg.level.patterns';
  protected levelCount = PATTERN_LEVELS.length;
  // The answer's word would give the game away, so it appears only once the
  // child has chosen correctly.
  protected revealWordAtStart = false;

  private sequence: Item[] = []; // the pictures shown before the "?" box
  private explainLine = ''; // "cow, pig, cow, pig — so next is cow!"
  private stripParts: CardPart[] = []; // everything drawn for the strip
  private stripTiles: Tile[] = []; // just the pattern pictures (for the demo)
  private choices: Choice[] = []; // the draggable pictures and their home spots
  private slot?: Slot;
  private slotMark?: Phaser.GameObjects.Text; // the "?" itself

  constructor() {
    super('Patterns');
  }

  // --- Round planning -------------------------------------------------------

  protected planRound(levelIndex: number): RoundPlan {
    const level = PATTERN_LEVELS[levelIndex];
    const unit = level.unit;

    // One item per letter of the repeating unit ("AB" → two items, "AABB" →
    // still two, used in pairs).
    const letters = [...new Set(unit.split(''))];
    const chosen = pickItems(letters.length);
    const byLetter = new Map<string, Item>();
    letters.forEach((letter, i) => byLetter.set(letter, chosen[i]));
    const at = (i: number): Item => byLetter.get(unit[i % unit.length]) as Item;

    this.sequence = Array.from({ length: level.shown }, (_, i) => at(i));
    const answer = at(level.shown);

    // Choices: the answer, then the pattern's other picture(s) — those are the
    // meaningful wrong answers — then unrelated fillers if more are needed.
    const picks: Item[] = [answer, ...shuffle(chosen.filter((it) => it.id !== answer.id))].slice(
      0,
      level.choices,
    );
    if (picks.length < level.choices) {
      picks.push(
        ...pickItems(level.choices - picks.length, { exclude: chosen.map((it) => it.id) }),
      );
    }

    const words = this.sequence.map((it) => it.word).join(', ');
    this.explainLine = `${words} — so next is ${answer.word}!`;

    const isDemo = !!level.demo && this.round === 0;
    return {
      items: shuffle(picks),
      target: answer,
      instruction: isDemo
        ? `Watch me! ${words}. What comes next?`
        : level.demo
          ? `Now you! ${words}. What comes next? Drag it into the box!`
          : `${words}. What comes next?`,
      parentLabel: 'what comes next?',
      successLine: `${praise()} ${this.explainLine}`,
      demo: isDemo,
    };
  }

  // --- Layout ---------------------------------------------------------------

  // The pattern strip across the middle, and the draggable choices beneath it.
  protected layoutCards(items: Item[]): void {
    this.buildStrip();

    const n = items.length;
    const gap = 90;
    const totalWidth = n * CHOICE_SIZE + (n - 1) * gap;
    const startX = (DESIGN_WIDTH - totalWidth) / 2 + CHOICE_SIZE / 2;
    items.forEach((item, i) => {
      this.makeChoice(item, startX + i * (CHOICE_SIZE + gap), CHOICE_Y);
    });
  }

  private buildStrip(): void {
    const total = this.sequence.length + 1; // + the "?" box
    const gap = 18;
    const size = Math.min(150, (1140 - (total - 1) * gap) / total);
    const totalWidth = total * size + (total - 1) * gap;
    const startX = (DESIGN_WIDTH - totalWidth) / 2 + size / 2;
    const xAt = (i: number): number => startX + i * (size + gap);

    // A pale band behind the strip so the pictures read clearly over the field.
    this.stripParts.push(
      this.add.rectangle(DESIGN_WIDTH / 2, STRIP_Y, totalWidth + 48, size + 40, 0xffffff, 0.4),
    );

    this.sequence.forEach((item, i) => {
      const tile = this.makeTile(item, xAt(i), STRIP_Y, size);
      this.stripTiles.push(tile);
      this.stripParts.push(...tile.parts);
    });

    // The empty box the child is filling.
    const sx = xAt(total - 1);
    this.slot = { x: sx, y: STRIP_Y, size };
    this.slotMark = this.add
      .text(sx, STRIP_Y, '?', {
        fontFamily: 'sans-serif',
        fontSize: `${Math.round(size * 0.62)}px`,
        fontStyle: 'bold',
        color: '#2b2b2b',
      })
      .setOrigin(0.5);
    this.stripParts.push(
      this.add
        .rectangle(sx, STRIP_Y, size, size, 0xffffff, 0.75)
        .setStrokeStyle(6, 0x5a7a4a),
      this.slotMark,
    );
  }

  // A non-interactive copy of a picture (or the coloured placeholder card).
  private makeTile(item: Item, x: number, y: number, size: number): Tile {
    if (this.textures.exists(item.id)) {
      const img = this.add.image(x, y, item.id);
      img.setScale(size / Math.max(img.width, img.height));
      return { item, parts: [img] };
    }
    const colour = CATEGORY_COLOUR[item.category] ?? 0xcccccc;
    const rect = this.add.rectangle(x, y, size, size, colour).setStrokeStyle(4, 0xffffff);
    const label = this.add
      .text(x, y, item.word, {
        fontFamily: 'sans-serif',
        fontSize: `${Math.round(size * 0.2)}px`,
        color: '#ffffff',
      })
      .setOrigin(0.5);
    return { item, parts: [rect, label] };
  }

  // The strip belongs to the round, so it goes when the cards go (including at
  // the reward beat, so nothing sits behind the star).
  protected clearCards(): void {
    super.clearCards();
    this.stripParts.forEach((p) => p.destroy());
    this.stripParts = [];
    this.stripTiles = [];
    this.choices = [];
    this.slot = undefined;
    this.slotMark = undefined;
  }

  // --- Dragging an answer into the box --------------------------------------

  // A choice picture the child picks up and carries to the "?" box. Dropping it
  // on the box is the answer; dropping it anywhere else just springs it home, so
  // a wandering finger never costs anything (no-fail rule).
  private makeChoice(item: Item, x: number, y: number): void {
    const tile = this.makeTile(item, x, y, CHOICE_SIZE);
    const hit = tile.parts[0] as Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
    hit.setInteractive({ useHandCursor: true, draggable: true });

    const card: Card = { hit, parts: tile.parts, item };
    const choice: Choice = { card, homeX: x, homeY: y, scales: tile.parts.map((p) => p.scale) };
    this.cards.push(card);
    this.choices.push(choice);

    hit.on('dragstart', () => {
      if (this.inputLocked) return;
      card.parts.forEach((p, i) => {
        p.setDepth(60);
        p.setScale(choice.scales[i] * DRAG_LIFT);
      });
    });

    // Phaser reports where the dragged object should now be; every piece of the
    // picture moves by the same amount so labels stay with their card.
    hit.on('drag', (_p: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      if (this.inputLocked) return;
      const dx = dragX - hit.x;
      const dy = dragY - hit.y;
      card.parts.forEach((part) => {
        part.x += dx;
        part.y += dy;
      });
    });

    hit.on('dragend', () => {
      if (this.inputLocked) return;
      const movement = Phaser.Math.Distance.Between(hit.x, hit.y, choice.homeX, choice.homeY);
      if (movement < TAP_SLOP) {
        // A tap, not a drag: show what to do instead of scoring it as an answer.
        this.sendHome(choice);
        speak('Drag it into the box!');
        return;
      }
      if (this.overSlot(hit.x, hit.y)) {
        this.onCardTap(card); // right → snaps in; wrong → springs back
      } else {
        this.sendHome(choice);
      }
    });
  }

  // Is the picture close enough to the "?" box to count as dropped in it?
  // Deliberately generous — a preschooler's aim is rough.
  private overSlot(x: number, y: number): boolean {
    if (!this.slot) return false;
    return (
      Math.abs(x - this.slot.x) < this.slot.size && Math.abs(y - this.slot.y) < this.slot.size
    );
  }

  private sendHome(choice: Choice, onDone?: () => void): void {
    choice.card.parts.forEach((part, i) => {
      this.tweens.add({
        targets: part,
        x: choice.homeX,
        y: choice.homeY,
        scale: choice.scales[i],
        duration: 260,
        ease: 'Back.easeOut',
        onComplete: i === 0 ? onDone : undefined,
      });
      part.setDepth(0);
    });
  }

  private choiceOf(card: Card): Choice | undefined {
    return this.choices.find((c) => c.card === card);
  }

  // --- Feedback -------------------------------------------------------------

  // Right answer: the carried picture settles into the empty box at the box's
  // size, completing the pattern — which is the whole point of the game.
  protected onCorrectFeedback(card: Card): void {
    this.snapIntoSlot(card, 260);
  }

  // Wrong answer: it springs back to its place in the row and gives a wobble.
  // Nothing is lost; the child can try another.
  protected onWrongFeedback(card: Card): void {
    const choice = this.choiceOf(card);
    if (!choice) {
      super.onWrongFeedback(card);
      return;
    }
    this.sendHome(choice, () => super.onWrongFeedback(card));
  }

  private snapIntoSlot(card: Card, duration: number): void {
    if (!this.slot) return;
    const slot = this.slot;
    const choice = this.choiceOf(card);
    this.slotMark?.setVisible(false);
    const shrink = slot.size / CHOICE_SIZE;
    card.parts.forEach((part, i) => {
      part.setDepth(60);
      this.tweens.add({
        targets: part,
        x: slot.x,
        y: slot.y,
        scale: (choice ? choice.scales[i] : part.scale) * shrink,
        duration,
        ease: 'Back.easeOut',
      });
    });
    this.starBurst(slot.x, slot.y);
  }

  // --- The worked example (level 1) ----------------------------------------

  // Gigi reads the pattern, hops along it picture by picture, then carries the
  // next one over into the box herself — which also shows the child the drag
  // they're being asked to make — and explains. Timed with tween delays rather
  // than nested timers (see CLAUDE.md — a delayedCall from inside a timer
  // callback is unreliable here).
  protected runDemo(): void {
    speak(this.plan.instruction, () => {
      this.stripTiles.forEach((tile, i) => {
        this.tweens.add({
          targets: tile.parts,
          scale: '*=1.18',
          duration: 170,
          yoyo: true,
          delay: i * STEP_MS,
          ease: 'Quad.easeOut',
        });
      });

      // A zero-effect tween used purely to fire once the walk has finished.
      const answerCard = this.cards.find((c) => c.item.id === this.plan.target.id);
      this.tweens.add({
        targets: this.slotMark ?? this.cards[0].hit,
        alpha: 1,
        duration: 1,
        delay: this.stripTiles.length * STEP_MS + 250,
        onComplete: () => {
          this.showTargetWord();
          if (answerCard) {
            this.starBurst(answerCard.hit.x, answerCard.hit.y);
            // A slow glide, so it reads as Gigi carrying it over to the box.
            this.snapIntoSlot(answerCard, 800);
          }
          speakSound(this.plan.target.id, () =>
            speak(this.explainLine, () => this.finishDemoRound()),
          );
        },
      });
    });
  }

  // The demo level's set is just the example plus one try by the child.
  protected roundsThisSet(): number {
    return PATTERN_LEVELS[this.difficulty.index].demo ? 2 : super.roundsThisSet();
  }

  // On the demo level the child's try decides progress directly: right first
  // time → level 2. Otherwise stay, and the next set repeats example + try.
  protected recordProgress(firstTry: boolean, neededHighlight: boolean): void {
    if (PATTERN_LEVELS[this.difficulty.index].demo) {
      if (firstTry) this.difficulty.jumpTo(1);
      return; // the demo level never feeds the normal streak counters
    }
    super.recordProgress(firstTry, neededHighlight);
  }
}
