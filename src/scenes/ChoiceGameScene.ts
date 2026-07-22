import Phaser from 'phaser';
import { BaseScene, DESIGN_WIDTH, DESIGN_HEIGHT, BG_FIELD } from './BaseScene';
import { PROGRESSION } from '../core/content';
import { Difficulty } from '../core/difficulty';
import { speak, tryAgain, speakSound, isMuted, setMuted } from '../core/audio';
import { CATEGORY_COLOUR } from '../core/theme';
import type { Item } from '../data/types';

// A card is either the real picture (once its image is added) or a coloured
// placeholder square with the word. `hit` is the tap target (a leaf object, so
// its hit area lines up under a zoomed/rotated camera); `parts` are all the
// visual pieces, tweened and destroyed together. `sprite`/`baseY` are optional,
// used by presentations that animate one picture (e.g. Find It's peek/jump).
export type CardPart =
  | Phaser.GameObjects.Image
  | Phaser.GameObjects.Rectangle
  | Phaser.GameObjects.Text
  | Phaser.GameObjects.Container;

export type CardSprite =
  | Phaser.GameObjects.Image
  | Phaser.GameObjects.Rectangle
  | Phaser.GameObjects.Container;

export interface Card {
  hit: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;
  parts: CardPart[];
  item: Item;
  sprite?: CardSprite; // the one picture Find It peeks/jumps
  baseY?: number; // its resting y (peeking out of the bush)
  riseBy?: number; // how far up it jumps when picked
}

// Everything a single round needs. A game supplies this via planRound().
export interface RoundPlan {
  items: Item[]; // cards to show, already in the order they should appear
  target: Item; // the correct card
  instruction: string; // spoken at round start and on replay
  parentLabel: string; // small written text by the mascot (for the parent)
  successLine: string; // spoken when the child gets it right
  demo?: boolean; // scripted example round: input stays locked, runDemo() plays it
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

  // Whether the big written word shows from the start of the round (Listen &
  // Tap — the child is hunting for that word) or only after they answer
  // correctly (Odd One Out — revealing the odd one's name teaches it).
  protected revealWordAtStart = true;

  private roundIndex = 0;
  protected cards: Card[] = [];
  protected plan!: RoundPlan;
  private wrongCount = 0; // wrong taps at the CURRENT target
  private neededHighlight = false; // scaffold shown for the current target
  private roundHadWrong = false; // any wrong tap this round (across all targets)
  private roundNeededHighlight = false;
  private inputLocked = true;
  private stopHighlight?: () => void; // kills the scaffold pulse, restores scale
  private setLength = 0; // rounds in the current set, fixed when the set starts

  private mascot!: Phaser.GameObjects.Text;
  private wordLabel!: Phaser.GameObjects.Text;
  private bigWord!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;

  create(): void {
    super.create(); // fit/rotate camera for landscape
    this.difficulty = new Difficulty(this.levelCount, PROGRESSION, this.storageKey);
    this.buildBackground(); // static scenery behind everything (optional)
    this.buildHud();
    this.startSet();
    this.installDevHooks();
  }

  // Static background drawn once, behind the HUD and cards. The open field
  // suits farm and wild animals alike, so both games use it; a subclass can
  // override for a different setting.
  protected buildBackground(): void {
    this.addBackground(BG_FIELD);
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

    // Big written word, centred at the top, so the child links word to picture.
    this.bigWord = this.add
      .text(DESIGN_WIDTH / 2, 64, '', {
        fontFamily: 'sans-serif',
        fontSize: '80px',
        fontStyle: 'bold',
        color: '#2b2b2b',
      })
      .setOrigin(0.5);

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
    // Fixed at set start: mid-set level changes (step-up, the demo level's
    // jump) must not change how many rounds this set runs for.
    this.setLength = this.roundsThisSet();
    this.nextRound();
  }

  private nextRound(): void {
    this.clearCards();
    this.wrongCount = 0;
    this.neededHighlight = false;
    this.roundHadWrong = false;
    this.roundNeededHighlight = false;
    this.stopHighlight = undefined;

    this.plan = this.planRound(this.difficulty.index);
    this.levelText.setText(
      `level ${this.difficulty.index + 1}  ·  round ${this.roundIndex + 1}/${this.setLength}`,
    );

    this.layoutCards(this.plan.items);
    this.wordLabel.setText(this.plan.parentLabel);
    this.bigWord.setText(this.revealWordAtStart ? this.plan.target.word : '');

    if (this.plan.demo) {
      this.inputLocked = true; // the mascot plays this one; the child watches
      this.runDemo();
    } else {
      this.inputLocked = false;
      this.sayInstruction();
    }
  }

  // How many rounds make up the current set. A subclass can shorten a set
  // (e.g. Odd One Out's demo level is just demo + one try).
  protected roundsThisSet(): number {
    return PROGRESSION.roundsPerSet;
  }

  // The round the set is on (0-based) — lets planRound tell a set's first
  // round from the rest (Odd One Out's demo is round 0 of its level-1 set).
  protected get round(): number {
    return this.roundIndex;
  }

  // Demo rounds (plan.demo): the subclass scripts the example here and MUST end
  // by calling finishDemoRound(). Input stays locked throughout.
  protected runDemo(): void {
    this.finishDemoRound();
  }

  protected finishDemoRound(): void {
    this.advanceRound();
  }

  // Multi-find boards (Listen & Tap): the next thing to find on this board, or
  // null when the board is done. Default: one target per round.
  protected nextTarget(): { target: Item; instruction: string; successLine: string } | null {
    return null;
  }

  // Round result → adaptive difficulty. A subclass can override to give a
  // level special progression rules (e.g. Odd One Out's demo level).
  protected recordProgress(firstTry: boolean, neededHighlight: boolean): void {
    this.difficulty.recordRound(firstTry, neededHighlight);
  }

  // Reveals the target's word in the big top label (demo rounds name the odd
  // one; normal rounds reveal it in handleCorrect).
  protected showTargetWord(): void {
    this.bigWord.setText(this.plan.target.word);
  }

  private advanceRound(): void {
    this.mascot.setText('🦒');
    this.roundIndex += 1;
    if (this.roundIndex >= this.setLength) {
      this.endSet();
    } else {
      this.nextRound();
    }
  }

  private sayInstruction(): void {
    if (this.plan) speak(this.plan.instruction);
  }

  // --- Card layout ----------------------------------------------------------

  // Default presentation: a tidy centred row (used by Odd One Out). Find It
  // overrides this to scatter the pictures and hide them behind bushes.
  protected layoutCards(items: Item[]): void {
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

  protected makeCard(item: Item, x: number, y: number, size: number): Card {
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

  protected onCardTap(card: Card): void {
    if (this.inputLocked) return;
    if (card.item.id === this.plan.target.id) {
      this.handleCorrect(card);
    } else {
      this.handleWrong(card);
    }
  }

  // Visual feedback for a correct / wrong tap. Default is a small pulse / shake;
  // Find It overrides these to jump the animal out of the bush (with stars) or
  // make a wrong pick peek out. Kept separate from the shared audio + round
  // flow below so a subclass only changes the animation, not the logic.
  protected onCorrectFeedback(card: Card): void {
    this.tweens.add({
      targets: card.parts,
      scale: '*=1.15',
      duration: 180,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  protected onWrongFeedback(card: Card): void {
    this.tweens.add({
      targets: card.parts,
      angle: { from: -7, to: 7 },
      duration: 80,
      yoyo: true,
      repeat: 2,
      onComplete: () => card.parts.forEach((p) => p.setAngle(0)),
    });
  }

  private handleCorrect(card: Card): void {
    this.inputLocked = true;
    this.mascot.setText('🎉');
    // Reveal the word (Odd One Out had it hidden until now) so it's on screen
    // as the child hears it named.
    this.bigWord.setText(this.plan.target.word);

    // Scaffold pulse off (and scale restored) BEFORE the win animation runs.
    this.stopHighlight?.();
    this.stopHighlight = undefined;
    this.onCorrectFeedback(card);
    card.hit.disableInteractive(); // a found card can't be found again

    // Say the item's own sound (e.g. an animal noise) if it has one, then the
    // spoken praise; advance only once that has finished so it's never cut off.
    speakSound(this.plan.target.id, () => {
      speak(this.plan.successLine, () => {
        const next = this.nextTarget();
        if (next) {
          // Same board, new quarry (Listen & Tap finds every animal in turn).
          this.plan.target = next.target;
          this.plan.instruction = next.instruction;
          this.plan.successLine = next.successLine;
          this.plan.parentLabel = next.target.word;
          this.wordLabel.setText(this.plan.parentLabel);
          this.bigWord.setText(this.revealWordAtStart ? next.target.word : '');
          this.wrongCount = 0;
          this.neededHighlight = false;
          this.mascot.setText('🦒');
          this.inputLocked = false;
          this.sayInstruction();
          return;
        }
        this.recordProgress(!this.roundHadWrong, this.roundNeededHighlight);
        this.advanceRound();
      });
    });
  }

  private handleWrong(card: Card): void {
    this.wrongCount += 1;
    this.roundHadWrong = true;
    this.mascot.setText('🤔');
    speak(tryAgain());

    this.onWrongFeedback(card);
    this.time.delayedCall(700, () => this.mascot.setText('🦒'));

    // After a 2nd miss, scaffold: pulse the correct answer so the child succeeds.
    if (this.wrongCount >= 2 && !this.neededHighlight) {
      this.neededHighlight = true;
      this.roundNeededHighlight = true;
      const target = this.cards.find((c) => c.item.id === this.plan.target.id);
      if (target) {
        const targets = target.sprite ? [target.sprite] : target.parts;
        const scales = targets.map((t) => t.scale);
        const tween = this.tweens.add({
          targets,
          scale: '*=1.12',
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
        // Multi-find boards keep the cards, so the pulse must be stoppable
        // (and the scale restored) once this target is found.
        this.stopHighlight = () => {
          tween.stop();
          targets.forEach((t, i) => t.setScale(scales[i]));
        };
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
