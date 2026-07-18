import Phaser from 'phaser';
import { BaseScene, DESIGN_WIDTH, DESIGN_HEIGHT } from './BaseScene';
import { MEMORY_LEVELS, PROGRESSION, pickItems, shuffle } from '../core/content';
import { Difficulty } from '../core/difficulty';
import { speak, praise } from '../core/audio';
import { CATEGORY_COLOUR } from '../core/theme';
import type { Item } from '../data/types';

// Game #10 — Memory / Pairs (design/design.md §9). Flip cards to find matching
// pairs. Different mechanic from the "tap the right picture" games, but reuses
// the item set, mascot, difficulty engine and reward beat. Each completed board
// is a round; boards grow from 2 pairs to 4 pairs as the child succeeds.
export class MemoryScene extends BaseScene {
  private difficulty!: Difficulty;
  private cards: MemoryCard[] = [];
  private firstPick: MemoryCard | null = null;
  private pairs = 0;
  private matched = 0;
  private mismatches = 0;
  private locked = true;

  private mascot!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;

  constructor() {
    super('Memory');
  }

  create(): void {
    super.create();
    this.difficulty = new Difficulty(MEMORY_LEVELS.length, PROGRESSION, 'pg.level.memory_pairs');
    this.buildHud();
    this.newBoard();
    this.installDevHooks();
  }

  private buildHud(): void {
    const home = this.add
      .text(60, 55, '🏠', { fontSize: '56px' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    home.on('pointerdown', () => this.scene.start('Menu'));

    this.mascot = this.add.text(160, 120, '🦒', { fontSize: '96px' }).setOrigin(0.5);

    const replay = this.add
      .text(DESIGN_WIDTH - 110, 110, '🔊', { fontSize: '72px' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    replay.on('pointerdown', () => this.sayInstruction());

    this.levelText = this.add
      .text(20, DESIGN_HEIGHT - 20, '', {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        color: '#5a7a4a',
      })
      .setOrigin(0, 1);
  }

  private sayInstruction(): void {
    speak('Find the matching pairs!');
  }

  // --- Board ----------------------------------------------------------------

  private newBoard(): void {
    this.clearCards();
    this.firstPick = null;
    this.matched = 0;
    this.mismatches = 0;

    const level = MEMORY_LEVELS[this.difficulty.index];
    this.pairs = level.pairs;
    this.levelText.setText(`level ${level.level}  ·  ${this.pairs} pairs`);

    const chosen = pickItems(this.pairs);
    const deck = shuffle(chosen.flatMap((it) => [it, it]));
    this.layoutDeck(deck);

    this.locked = false;
    this.sayInstruction();
  }

  private layoutDeck(deck: Item[]): void {
    const rows = 2;
    const cols = deck.length / rows;
    const gap = 30;
    const usableW = DESIGN_WIDTH - 280;
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

  // --- Turn logic -----------------------------------------------------------

  private onCardTap(card: MemoryCard): void {
    if (this.locked || card.matched || card.faceUp) return;

    card.flip(true);

    if (!this.firstPick) {
      this.firstPick = card;
      return;
    }

    // Second card of the pair chosen.
    this.locked = true;
    const first = this.firstPick;
    this.firstPick = null;
    this.time.delayedCall(320, () => this.resolvePair(first, card));
  }

  private resolvePair(first: MemoryCard, second: MemoryCard): void {
    if (first.item.id === second.item.id) {
      speak(`${praise()} ${second.item.word}!`);
      first.markMatched();
      second.markMatched();
      this.matched += 1;
      this.locked = false;
      if (this.matched >= this.pairs) {
        this.boardComplete();
      }
    } else {
      this.mismatches += 1;
      this.mascot.setText('🤔');
      speak('Not a pair. Try again!');
      // Leave both cards face-up for a beat (via the flip's built-in delay) so
      // the child can see them, then flip both back and re-enable input.
      const pause = 900;
      second.flip(false, undefined, pause);
      first.flip(false, () => {
        this.mascot.setText('🦒');
        this.locked = false;
      }, pause);
    }
  }

  private boardComplete(): void {
    this.locked = true;
    // Fewer mismatches = doing well. These map onto the shared difficulty
    // engine's "first-try correct" (efficient) and "needed help" (struggled).
    const efficient = this.mismatches <= this.pairs;
    const struggled = this.mismatches >= this.pairs * 3;
    this.difficulty.recordRound(efficient, struggled);

    this.mascot.setText('🎉');
    speak('Well done!');
    this.showStar(() => {
      this.mascot.setText('🦒');
      this.newBoard();
    });
  }

  // --- Dev hooks (stripped from production) ---------------------------------

  private installDevHooks(): void {
    const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;
    if (!isDev) return;
    (window as unknown as Record<string, unknown>).__game = {
      state: () => ({
        level: this.difficulty.index + 1,
        pairs: this.pairs,
        matched: this.matched,
        mismatches: this.mismatches,
        locked: this.locked,
      }),
      cards: () => this.cards.map((c, i) => ({ i, id: c.item.id, matched: c.matched })),
      tap: (i: number) => {
        const c = this.cards[i];
        if (c) this.onCardTap(c);
      },
    };
  }
}

// A single flippable card, built from leaf objects (not a Container) so the tap
// target lines up under a zoomed/rotated camera. A transparent rectangle on top
// is the input target; the visible faces flip by scaling in x.
class MemoryCard {
  matched = false;
  faceUp = false;

  private back: Phaser.GameObjects.Rectangle;
  private qMark: Phaser.GameObjects.Text;
  private frontRect: Phaser.GameObjects.Rectangle;
  private frontLabel: Phaser.GameObjects.Text;
  private hit: Phaser.GameObjects.Rectangle;
  private parts: Phaser.GameObjects.GameObject[];

  constructor(
    private readonly scene: Phaser.Scene,
    readonly item: Item,
    x: number,
    y: number,
    size: number,
    onTap: (card: MemoryCard) => void,
  ) {
    this.back = scene.add.rectangle(x, y, size, size, 0x00897b).setStrokeStyle(6, 0xffffff);
    this.qMark = scene.add
      .text(x, y, '?', { fontFamily: 'sans-serif', fontSize: `${Math.round(size * 0.5)}px`, color: '#ffffff' })
      .setOrigin(0.5);
    this.frontRect = scene.add
      .rectangle(x, y, size, size, CATEGORY_COLOUR[item.category] ?? 0xcccccc)
      .setStrokeStyle(6, 0xffffff)
      .setVisible(false);
    this.frontLabel = scene.add
      .text(x, y, item.word, { fontFamily: 'sans-serif', fontSize: '34px', color: '#ffffff', align: 'center' })
      .setOrigin(0.5)
      .setVisible(false);
    // Transparent tap target on top (fill alpha 0, but visible so it gets input).
    this.hit = scene.add.rectangle(x, y, size, size, 0x000000, 0).setInteractive({ useHandCursor: true });
    this.hit.on('pointerdown', () => onTap(this));

    this.parts = [this.back, this.qMark, this.frontRect, this.frontLabel, this.hit];
  }

  flip(toFront: boolean, onComplete?: () => void, delay = 0): void {
    this.scene.tweens.add({
      targets: this.parts,
      scaleX: 0,
      delay,
      duration: 130,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.faceUp = toFront;
        this.back.setVisible(!toFront);
        this.qMark.setVisible(!toFront);
        this.frontRect.setVisible(toFront);
        this.frontLabel.setVisible(toFront);
        this.scene.tweens.add({
          targets: this.parts,
          scaleX: 1,
          duration: 130,
          ease: 'Quad.easeOut',
          onComplete,
        });
      },
    });
  }

  markMatched(): void {
    this.matched = true;
    this.hit.disableInteractive();
    this.scene.tweens.add({
      targets: this.parts,
      scale: { from: 1, to: 1.1 },
      duration: 200,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }

  destroy(): void {
    this.parts.forEach((p) => p.destroy());
  }
}
