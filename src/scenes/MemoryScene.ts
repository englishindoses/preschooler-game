import Phaser from 'phaser';
import { BaseScene, DESIGN_WIDTH, DESIGN_HEIGHT, BG_FIELD } from './BaseScene';
import { pickItems, shuffle } from '../core/content';
import { speak, praise, speakSound, isMuted, setMuted } from '../core/audio';
import { CATEGORY_COLOUR } from '../core/theme';
import type { Item } from '../data/types';

// Game #10 — Memory / Pairs (design/design.md §9), rebuilt with a guided intro
// level and a memory ladder.
//
//  Level 1 (guided): cards stay face-up. Tap a card — it's named and you're
//    asked to find its partner. Right = celebrate + slide the pair aside; wrong
//    = nothing. Board sequence 4, 4, 6, 6 cards, then on to Level 2.
//  Level 2: 4 cards, shown face-up for 2s then flipped down. Wrong pairs flip
//    back. 4 flips with no match triggers a "peek" (all unmatched shown 1s).
//    Clear 5 sets → Level 3.
//  Level 3: as Level 2 but the cards start face-down (no opening peek).
//  Level 4: as Level 2 but 6 cards. Top level.
//  Any memory level: too many misses in a set drops the next set a level.
type Mode = 'guided' | 'memory';
interface LevelConfig {
  mode: Mode;
  peek: boolean; // memory: show the board briefly before flipping down
  boards?: number[]; // guided: the sequence of card counts
  cards?: number; // memory: cards per set
}

const STORAGE_KEY = 'pg.level.memory_pairs';
const MAX_LEVEL = 4;
const MIN_MEMORY_LEVEL = 2; // step-down never drops back into the guided intro
const SETS_TO_CLEAR = 5;
const PEEK_AFTER_FLIPS = 4; // flips with no match → take a peek
const STEP_DOWN_MISMATCHES = 4; // mismatches in a set → next set drops a level

const LEVELS: Record<number, LevelConfig> = {
  1: { mode: 'guided', peek: false, boards: [4, 4, 6, 6] },
  2: { mode: 'memory', peek: true, cards: 4 },
  3: { mode: 'memory', peek: false, cards: 4 },
  4: { mode: 'memory', peek: true, cards: 6 },
};

export class MemoryScene extends BaseScene {
  private level = 1;
  private boardIndex = 0; // guided: position in the boards sequence
  private setsCleared = 0; // memory: sets cleared at the current level

  private cards: MemoryCard[] = [];
  private firstPick: MemoryCard | null = null;
  private locked = true;

  private totalPairs = 0;
  private matchedPairs = 0;
  private matchesThisSet = 0;
  private mismatchesThisSet = 0;
  private flipsSinceMatch = 0;

  private mascot!: Phaser.GameObjects.Text;
  private bigWord!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;

  constructor() {
    super('Memory');
  }

  create(): void {
    super.create();
    this.addBackground(BG_FIELD);
    this.loadLevel();
    this.buildHud();
    this.newSet();
    this.installDevHooks();
  }

  // --- Progression persistence ----------------------------------------------

  private loadLevel(): void {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    this.level = Number.isInteger(saved) && saved >= 1 && saved <= MAX_LEVEL ? saved : 1;
    this.boardIndex = 0;
    this.setsCleared = 0;
  }

  private saveLevel(): void {
    localStorage.setItem(STORAGE_KEY, String(this.level));
  }

  // --- HUD ------------------------------------------------------------------

  private buildHud(): void {
    const home = this.add
      .text(60, 55, '🏠', { fontSize: '56px' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    home.on('pointerdown', () => this.scene.start('Menu'));

    this.mascot = this.add.text(160, 120, '🦒', { fontSize: '96px' }).setOrigin(0.5);

    // Volume button toggles mute on/off.
    const mute = this.add
      .text(DESIGN_WIDTH - 110, 110, isMuted() ? '🔇' : '🔊', { fontSize: '72px' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    mute.on('pointerdown', () => {
      const next = !isMuted();
      setMuted(next);
      mute.setText(next ? '🔇' : '🔊');
    });

    this.bigWord = this.add
      .text(DESIGN_WIDTH / 2, 64, '', {
        fontFamily: 'sans-serif',
        fontSize: '80px',
        fontStyle: 'bold',
        color: '#2b2b2b',
      })
      .setOrigin(0.5);

    this.levelText = this.add
      .text(20, DESIGN_HEIGHT - 20, '', {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        color: '#5a7a4a',
      })
      .setOrigin(0, 1);
  }

  // --- Board setup ----------------------------------------------------------

  private newSet(): void {
    this.clearCards();
    this.firstPick = null;
    this.matchedPairs = 0;
    this.matchesThisSet = 0;
    this.mismatchesThisSet = 0;
    this.flipsSinceMatch = 0;
    this.bigWord.setText('');

    const cfg = LEVELS[this.level];
    const cardCount = cfg.mode === 'guided' ? cfg.boards![this.boardIndex] : cfg.cards!;
    this.totalPairs = cardCount / 2;

    const progress =
      cfg.mode === 'guided'
        ? `board ${this.boardIndex + 1}/${cfg.boards!.length}`
        : `set ${this.setsCleared + 1}/${SETS_TO_CLEAR}`;
    this.levelText.setText(`level ${this.level} (${cfg.mode})  ·  ${progress}  ·  ${this.totalPairs} pairs`);

    const chosen = pickItems(this.totalPairs);
    const deck = shuffle(chosen.flatMap((it) => [it, it]));
    this.layoutDeck(deck);

    if (cfg.mode === 'guided') {
      // Cards stay face-up; the child is guided to each partner.
      this.cards.forEach((c) => c.reveal());
      this.locked = false;
      speak('Look! Find the matching pairs.');
    } else if (cfg.peek) {
      // Show the board ("Look!") for 2s, then flip everything down together and
      // ask the child to find the pairs.
      this.locked = true;
      this.cards.forEach((c) => c.reveal());
      speak('Look!');
      let pending = this.cards.length;
      this.cards.forEach((c) =>
        c.flip(false, () => {
          pending -= 1;
          if (pending === 0) {
            this.locked = false;
            speak('Can you find the pairs?');
          }
        }, 2000),
      );
    } else {
      // Start face-down straight away.
      this.locked = false;
      speak('Can you find the pairs?');
    }
  }

  private layoutDeck(deck: Item[]): void {
    const rows = 2;
    const cols = deck.length / rows;
    const gap = 30;
    // Sizing still reserves the right-hand collected-pairs column so cards can
    // never grow into it, but the grid itself is centred on the full width —
    // at these sizes it clears the column anyway, and a centred board looks
    // right (matching the other games) even while the column is empty.
    const usableW = DESIGN_WIDTH - 340;
    const usableH = DESIGN_HEIGHT - 300;
    const size = Math.min((usableW - (cols - 1) * gap) / cols, (usableH - (rows - 1) * gap) / rows);

    const totalW = cols * size + (cols - 1) * gap;
    const totalH = rows * size + (rows - 1) * gap;
    const startX = (DESIGN_WIDTH - totalW) / 2 + size / 2;
    const startY = 430 - totalH / 2 + size / 2;

    deck.forEach((item, i) => {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const x = startX + c * (size + gap);
      const y = startY + r * (size + gap);
      this.cards.push(new MemoryCard(this, item, x, y, size, (card) => this.onCardTap(card)));
    });
  }

  private clearCards(): void {
    this.cards.forEach((c) => c.destroy());
    this.cards = [];
  }

  // Resting place for a matched pair — a stack down the right-hand side, the two
  // cards overlapping slightly.
  private collectedSlot(pairIndex: number): { ax: number; bx: number; y: number; scale: number } {
    // Down the right-hand side, starting below the volume (replay) button so the
    // collected pairs never cover it.
    const x = DESIGN_WIDTH - 110;
    const y = 250 + pairIndex * 135;
    return { ax: x - 26, bx: x + 26, y, scale: 0.42 };
  }

  // --- Tap handling ---------------------------------------------------------

  private onCardTap(card: MemoryCard): void {
    if (this.locked) return;
    if (LEVELS[this.level].mode === 'guided') {
      this.tapGuided(card);
    } else {
      this.tapMemory(card);
    }
  }

  private tapGuided(card: MemoryCard): void {
    if (card.matched) return;

    if (!this.firstPick) {
      this.firstPick = card;
      card.highlight(true);
      this.bigWord.setText(card.item.word);
      speak(`${card.item.word}! Where's the other ${card.item.word}?`);
      return;
    }

    if (card === this.firstPick) return;

    if (card.item.id === this.firstPick.item.id) {
      const first = this.firstPick;
      this.firstPick = null;
      // collect() resets the scale/depth, so no need to un-highlight first.
      this.onPairMatched(first, card);
    }
    // Wrong pick in guided mode: nothing happens (keep the current selection).
  }

  private tapMemory(card: MemoryCard): void {
    if (card.matched || card.faceUp) return;

    card.flip(true);
    this.bigWord.setText(card.item.word);
    this.flipsSinceMatch += 1;

    if (!this.firstPick) {
      this.firstPick = card;
      speak(`Where's the other ${card.item.word}?`);
      return;
    }

    this.locked = true;
    const first = this.firstPick;
    const second = card;
    this.firstPick = null;
    this.time.delayedCall(350, () => this.resolveMemoryPair(first, second));
  }

  private resolveMemoryPair(first: MemoryCard, second: MemoryCard): void {
    if (first.item.id === second.item.id) {
      this.onPairMatched(first, second);
      return;
    }

    this.mismatchesThisSet += 1;

    if (this.flipsSinceMatch >= PEEK_AFTER_FLIPS) {
      this.takeAPeek();
    } else {
      const pause = 800;
      second.flip(false, undefined, pause);
      first.flip(false, () => {
        this.bigWord.setText('');
        this.locked = false;
      }, pause);
    }
  }

  // All unmatched cards flash up for 1s, then flip back down. A gentle hint when
  // the child is flipping without finding pairs.
  private takeAPeek(): void {
    this.locked = true;
    this.flipsSinceMatch = 0;
    this.firstPick = null;
    this.bigWord.setText('');
    speak('Take a peek!');

    const unmatched = this.cards.filter((c) => !c.matched);
    // Flip the face-down cards up (animated), hold ~1s, then flip everything
    // back down together.
    unmatched.forEach((c) => {
      if (!c.faceUp) c.flip(true);
    });
    const downDelay = 320 + 1000; // flip-up time + a 1s look
    let pending = unmatched.length;
    unmatched.forEach((c) =>
      c.flip(false, () => {
        pending -= 1;
        if (pending === 0) this.locked = false;
      }, downDelay),
    );
  }

  private onPairMatched(a: MemoryCard, b: MemoryCard): void {
    this.locked = true;
    this.matchedPairs += 1;
    this.matchesThisSet += 1;
    this.flipsSinceMatch = 0;
    const isLast = this.matchedPairs >= this.totalPairs;

    this.mascot.setText('🎉');
    this.bigWord.setText(b.item.word);

    // On the final pair, the big "Well done!" must wait for BOTH this pair's
    // audio and its slide-to-the-side to finish, so nothing gets cut off.
    let audioDone = false;
    let animDone = false;
    const maybeFinishSet = (): void => {
      if (isLast && audioDone && animDone) this.onSetComplete();
    };

    speakSound(b.item.id, () =>
      speak(`${praise()} ${b.item.word}!`, () => {
        audioDone = true;
        maybeFinishSet();
      }),
    );

    // Bring the pair together, big and side by side, so the child clearly sees
    // the match; hold a beat; then spin them away to their spot at the side.
    const grow = 1.5;
    const cx = DESIGN_WIDTH / 2; // centred, like the board (clears the collected column)
    const cy = 400;
    const dx = a.size * grow * 0.62;
    const growMs = 350;
    const holdMs = 650;

    a.growTo(cx - dx, cy, grow, growMs);
    b.growTo(cx + dx, cy, grow, growMs, () => this.starBurst(cx, cy));

    const slot = this.collectedSlot(this.matchedPairs - 1);
    let pending = 2;
    const onSpun = (): void => {
      pending -= 1;
      if (pending !== 0) return;
      if (isLast) {
        animDone = true;
        maybeFinishSet();
      } else {
        this.afterMatch();
      }
    };
    a.spinTo(slot.ax, slot.y, slot.scale, onSpun, growMs + holdMs);
    b.spinTo(slot.bx, slot.y, slot.scale, onSpun, growMs + holdMs);
  }

  private afterMatch(): void {
    this.mascot.setText('🦒');
    this.firstPick = null;
    this.bigWord.setText('');
    this.locked = false;
  }

  private onSetComplete(): void {
    this.locked = true;
    this.mascot.setText('🎉');
    speak('Well done!');
    this.showStar(() => {
      this.mascot.setText('🦒');
      this.advanceProgression();
      this.newSet();
    });
  }

  private advanceProgression(): void {
    const cfg = LEVELS[this.level];
    if (cfg.mode === 'guided') {
      this.boardIndex += 1;
      if (this.boardIndex >= cfg.boards!.length) {
        this.level = 2;
        this.boardIndex = 0;
        this.setsCleared = 0;
        this.saveLevel();
      }
      return;
    }

    // Memory level. Too many misses this set → drop a level for the next set.
    if (this.mismatchesThisSet >= STEP_DOWN_MISMATCHES && this.level > MIN_MEMORY_LEVEL) {
      this.level -= 1;
      this.setsCleared = 0;
      this.saveLevel();
      return;
    }

    this.setsCleared += 1;
    if (this.setsCleared >= SETS_TO_CLEAR && this.level < MAX_LEVEL) {
      this.level += 1;
      this.setsCleared = 0;
      this.saveLevel();
    }
  }

  // --- Dev hooks (stripped from production) ---------------------------------

  private installDevHooks(): void {
    const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;
    if (!isDev) return;
    (window as unknown as Record<string, unknown>).__game = {
      state: () => ({
        level: this.level,
        mode: LEVELS[this.level].mode,
        boardIndex: this.boardIndex,
        setsCleared: this.setsCleared,
        totalPairs: this.totalPairs,
        matchedPairs: this.matchedPairs,
        mismatchesThisSet: this.mismatchesThisSet,
        flipsSinceMatch: this.flipsSinceMatch,
        locked: this.locked,
      }),
      cards: () => this.cards.map((c, i) => ({ i, id: c.item.id, matched: c.matched, faceUp: c.faceUp })),
      tap: (i: number) => {
        const c = this.cards[i];
        if (c) this.onCardTap(c);
      },
    };
  }
}

// A single flippable card. Faces live in a container flipped by scaling in x; a
// separate transparent leaf rectangle is the tap target so input lines up under
// the zoomed camera. Front face is the real picture if we have it, else a
// coloured square with the word.
type FrontPart = Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text;

class MemoryCard {
  matched = false;
  faceUp = false;

  private visual: Phaser.GameObjects.Container;
  private back: Phaser.GameObjects.Rectangle;
  private qMark: Phaser.GameObjects.Text;
  private frontParts: FrontPart[];
  private hit: Phaser.GameObjects.Rectangle;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly item: Item,
    x: number,
    y: number,
    readonly size: number,
    onTap: (card: MemoryCard) => void,
  ) {
    this.back = scene.add.rectangle(0, 0, size, size, 0x00897b).setStrokeStyle(6, 0xffffff);
    this.qMark = scene.add
      .text(0, 0, '?', { fontFamily: 'sans-serif', fontSize: `${Math.round(size * 0.5)}px`, color: '#ffffff' })
      .setOrigin(0.5);

    if (scene.textures.exists(item.id)) {
      // The picture sits on a white card with an outline, so a face-up card
      // reads as a proper card (not a floating cut-out).
      const cardBg = scene.add
        .rectangle(0, 0, size, size, 0xffffff)
        .setStrokeStyle(8, 0x00897b)
        .setVisible(false);
      const img = scene.add.image(0, 0, item.id).setVisible(false);
      img.setScale((size * 0.84) / Math.max(img.width, img.height));
      this.frontParts = [cardBg, img];
    } else {
      const rect = scene.add
        .rectangle(0, 0, size, size, CATEGORY_COLOUR[item.category] ?? 0xcccccc)
        .setStrokeStyle(6, 0xffffff)
        .setVisible(false);
      const label = scene.add
        .text(0, 0, item.word, { fontFamily: 'sans-serif', fontSize: '34px', color: '#ffffff', align: 'center' })
        .setOrigin(0.5)
        .setVisible(false);
      this.frontParts = [rect, label];
    }

    this.visual = scene.add.container(x, y, [this.back, this.qMark, ...this.frontParts]);

    this.hit = scene.add.rectangle(x, y, size, size, 0x000000, 0).setInteractive({ useHandCursor: true });
    this.hit.on('pointerdown', () => onTap(this));
  }

  get x(): number {
    return this.visual.x;
  }

  get y(): number {
    return this.visual.y;
  }

  flip(toFront: boolean, onComplete?: () => void, delay = 0): void {
    this.scene.tweens.add({
      targets: this.visual,
      scaleX: 0,
      delay,
      duration: 130,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.faceUp = toFront;
        this.back.setVisible(!toFront);
        this.qMark.setVisible(!toFront);
        this.frontParts.forEach((p) => p.setVisible(toFront));
        this.scene.tweens.add({
          targets: this.visual,
          scaleX: 1,
          duration: 130,
          ease: 'Quad.easeOut',
          onComplete,
        });
      },
    });
  }

  // Instantly turn face-up with no animation (opening peek / take-a-peek).
  reveal(): void {
    this.faceUp = true;
    this.back.setVisible(false);
    this.qMark.setVisible(false);
    this.frontParts.forEach((p) => p.setVisible(true));
    this.visual.setScale(1);
  }

  // Guided-mode selection cue: grow a lot and lift above the other cards so the
  // chosen card clearly stands out.
  highlight(on: boolean): void {
    this.visual.setDepth(on ? 10 : 0);
    this.scene.tweens.add({
      targets: this.visual,
      scale: on ? 1.35 : 1,
      duration: 180,
      ease: 'Back.easeOut',
    });
  }

  // A matched pair moves in two beats: grow to a big position (side by side),
  // then spin away to its resting spot at the side. beginCollect marks the card
  // done and lifts it above the others.
  private beginCollect(): void {
    this.matched = true;
    this.hit.disableInteractive();
    this.visual.setDepth(20);
  }

  growTo(x: number, y: number, scale: number, duration: number, onDone?: () => void): void {
    if (!this.matched) this.beginCollect();
    this.scene.tweens.add({
      targets: this.visual,
      x,
      y,
      scale,
      duration,
      ease: 'Back.easeOut',
      onComplete: onDone,
    });
  }

  spinTo(x: number, y: number, scale: number, onDone?: () => void, delay = 0): void {
    this.scene.tweens.add({
      targets: this.visual,
      x,
      y,
      scale,
      angle: '+=360',
      delay,
      duration: 550,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        this.visual.setDepth(0);
        onDone?.();
      },
    });
  }

  destroy(): void {
    this.visual.destroy();
    this.hit.destroy();
  }
}
