import Phaser from 'phaser';
import { BaseScene, DESIGN_WIDTH, DESIGN_HEIGHT } from './BaseScene';
import { PROGRESSION } from '../core/content';
import { Difficulty } from '../core/difficulty';
import { speak } from '../core/audio';
import { CATEGORY_COLOUR } from '../core/theme';
import type { Item } from '../data/types';

// A card is either the real picture (once its image is added) or a coloured
// placeholder square with the word. `hit` is the tap target (a leaf object, so
// its hit area lines up under a zoomed/rotated camera); `parts` are all the
// visual pieces, tweened and destroyed together.
interface Card {
  hit: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  parts: Array<Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text>;
  item: Item;
}

// Everything a single round needs. A game supplies this via planRound().
export interface RoundPlan {
  items: Item[]; // cards to show, already in the order they should appear
  target: Item; // the correct card
  instruction: string; // spoken at round start and on replay
  parentLabel: string; // small written text by the mascot (for the parent)
  successLine: string; // spoken when the child gets it right
}

// Shared engine for the "tap the right picture" games (Listen & Tap, Odd One
// Out). Handles the round loop, card layout, correct/wrong feedback, the
// no-fail scaffold, the reward beat and adaptive difficulty. A subclass only
// decides how to build each round (planRound) — see design/design.md §7–§8.
export abstract class ChoiceGameScene extends BaseScene {
  protected difficulty!: Difficulty;
  protected abstract storageKey: string;
  protected abstract levelCount: number;
  protected abstract planRound(levelIndex: number): RoundPlan;

  private roundIndex = 0;
  private cards: Card[] = [];
  private plan!: RoundPlan;
  private wrongCount = 0;
  private neededHighlight = false;
  private inputLocked = true;

  private mascot!: Phaser.GameObjects.Text;
  private wordLabel!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;

  create(): void {
    super.create(); // fit/rotate camera for landscape
    this.difficulty = new Difficulty(this.levelCount, PROGRESSION, this.storageKey);
    this.buildHud();
    this.startSet();
    this.installDevHooks();
  }

  // --- HUD ------------------------------------------------------------------

  private buildHud(): void {
    const home = this.add
      .text(60, 55, '🏠', { fontSize: '56px' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    home.on('pointerdown', () => this.scene.start('Menu'));

    this.mascot = this.add.text(160, 120, '🦒', { fontSize: '96px' }).setOrigin(0.5);
    this.wordLabel = this.add
      .text(250, 120, '', { fontFamily: 'sans-serif', fontSize: '40px', color: '#2b2b2b' })
      .setOrigin(0, 0.5);

    const replay = this.add
      .text(DESIGN_WIDTH - 110, 110, '🔊', { fontSize: '72px' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    replay.on('pointerdown', () => this.sayInstruction());

    // Dev-only readout of the current level so we can watch difficulty adapt.
    this.levelText = this.add
      .text(20, DESIGN_HEIGHT - 20, '', {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        color: '#5a7a4a',
      })
      .setOrigin(0, 1);
  }

  // --- Round loop -----------------------------------------------------------

  private startSet(): void {
    this.roundIndex = 0;
    this.nextRound();
  }

  private nextRound(): void {
    this.clearCards();
    this.wrongCount = 0;
    this.neededHighlight = false;

    this.plan = this.planRound(this.difficulty.index);
    this.levelText.setText(
      `level ${this.difficulty.index + 1}  ·  round ${this.roundIndex + 1}/${PROGRESSION.roundsPerSet}`,
    );

    this.layoutCards(this.plan.items);
    this.wordLabel.setText(this.plan.parentLabel);
    this.inputLocked = false;
    this.sayInstruction();
  }

  private sayInstruction(): void {
    if (this.plan) speak(this.plan.instruction);
  }

  // --- Card layout ----------------------------------------------------------

  private layoutCards(items: Item[]): void {
    const n = items.length;
    const size = n <= 2 ? 300 : n === 3 ? 260 : 220;
    const gap = 60;
    const totalWidth = n * size + (n - 1) * gap;
    const startX = (DESIGN_WIDTH - totalWidth) / 2 + size / 2;
    const y = DESIGN_HEIGHT / 2 + 40;

    items.forEach((item, i) => {
      const x = startX + i * (size + gap);
      this.cards.push(this.makeCard(item, x, y, size));
    });
  }

  private makeCard(item: Item, x: number, y: number, size: number): Card {
    // Real picture if we have it; otherwise a coloured placeholder + word.
    if (this.textures.exists(item.id)) {
      const img = this.add.image(x, y, item.id);
      img.setScale(size / Math.max(img.width, img.height));
      img.setInteractive({ useHandCursor: true });
      const card: Card = { hit: img, parts: [img], item };
      img.on('pointerdown', () => this.onCardTap(card));
      return card;
    }

    const colour = CATEGORY_COLOUR[item.category] ?? 0xcccccc;
    const rect = this.add
      .rectangle(x, y, size, size, colour)
      .setStrokeStyle(6, 0xffffff)
      .setInteractive({ useHandCursor: true });
    const label = this.add
      .text(x, y, item.word, {
        fontFamily: 'sans-serif',
        fontSize: '40px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);

    const card: Card = { hit: rect, parts: [rect, label], item };
    rect.on('pointerdown', () => this.onCardTap(card));
    return card;
  }

  private clearCards(): void {
    this.cards.forEach((c) => c.parts.forEach((p) => p.destroy()));
    this.cards = [];
  }

  // --- Answer handling ------------------------------------------------------

  private onCardTap(card: Card): void {
    if (this.inputLocked) return;
    if (card.item.id === this.plan.target.id) {
      this.handleCorrect(card);
    } else {
      this.handleWrong(card);
    }
  }

  private handleCorrect(card: Card): void {
    this.inputLocked = true;
    const firstTry = this.wrongCount === 0;
    this.mascot.setText('🎉');

    // Celebrate visually while the praise plays (relative scale so it works for
    // both full-size placeholder squares and scaled-down images).
    this.tweens.add({
      targets: card.parts,
      scale: '*=1.15',
      duration: 180,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    // Advance only once the spoken praise has finished, so it's never cut off.
    speak(this.plan.successLine, () => {
      this.difficulty.recordRound(firstTry, this.neededHighlight);
      this.mascot.setText('🦒');
      this.roundIndex += 1;
      if (this.roundIndex >= PROGRESSION.roundsPerSet) {
        this.endSet();
      } else {
        this.nextRound();
      }
    });
  }

  private handleWrong(card: Card): void {
    this.wrongCount += 1;
    this.mascot.setText('🤔');
    speak('Hmm, try again!');

    this.tweens.add({
      targets: card.parts,
      angle: { from: -7, to: 7 },
      duration: 80,
      yoyo: true,
      repeat: 2,
      onComplete: () => card.parts.forEach((p) => p.setAngle(0)),
    });
    this.time.delayedCall(700, () => this.mascot.setText('🦒'));

    // After a 2nd miss, scaffold: pulse the correct answer so the child succeeds.
    if (this.wrongCount >= 2 && !this.neededHighlight) {
      this.neededHighlight = true;
      const target = this.cards.find((c) => c.item.id === this.plan.target.id);
      if (target) {
        this.tweens.add({
          targets: target.parts,
          scale: '*=1.12',
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    }
  }

  // --- Reward beat ----------------------------------------------------------

  private endSet(): void {
    this.inputLocked = true;
    this.clearCards();
    this.mascot.setText('🎉');
    speak('Well done!');
    this.showStar(() => {
      this.mascot.setText('🦒');
      this.startSet();
    });
  }

  // --- Dev hooks (stripped from production) ---------------------------------

  private installDevHooks(): void {
    const isDev = (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;
    if (!isDev) return;
    (window as unknown as Record<string, unknown>).__game = {
      state: () => ({
        level: this.difficulty.index + 1,
        round: this.roundIndex,
        target: (this.plan as RoundPlan | undefined)?.target.id ?? null,
        targetCategory: (this.plan as RoundPlan | undefined)?.target.category ?? null,
        instruction: (this.plan as RoundPlan | undefined)?.instruction ?? null,
        cards: this.cards.length,
        items: this.cards.map((c) => ({ id: c.item.id, category: c.item.category })),
        locked: this.inputLocked,
      }),
      geom: () =>
        this.cards.map((c) => ({
          id: c.item.id,
          x: c.hit.x,
          y: c.hit.y,
          w: c.hit.displayWidth,
          h: c.hit.displayHeight,
        })),
      tapCorrect: () => {
        const c = this.cards.find((card) => card.item.id === this.plan.target.id);
        if (c) this.onCardTap(c);
      },
      tapWrong: () => {
        const c = this.cards.find((card) => card.item.id !== this.plan.target.id);
        if (c) this.onCardTap(c);
      },
    };
  }
}
