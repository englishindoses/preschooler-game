import Phaser from 'phaser';
import { ChoiceGameScene, RoundPlan, Card } from './ChoiceGameScene';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from './BaseScene';
import {
  ITEMS,
  LISTEN_LEVELS,
  categoriesWithAtLeast,
  pickOne,
  pickItems,
  shuffle,
} from '../core/content';
import { praise, findPrompt } from '../core/audio';
import { CATEGORY_COLOUR } from '../core/theme';
import type { Item } from '../data/types';

// Game #1 — Listen & Tap, played as a "Find the…" hidden-object game
// (design/design.md §7). Animals are scattered across a grassy scene, each
// partly hidden behind a bush — enough shows to recognise them, enough hides to
// make it a hunt. Tapping the wrong one makes it peek out ("Oops!"); tapping the
// right one makes it jump right out of the bush with a burst of stars. The
// number of animals grows with the level so a confident child keeps being
// challenged. Round loop, audio, difficulty and reward come from ChoiceGameScene.
export class ListenAndTapScene extends ChoiceGameScene {
  protected storageKey = 'pg.level.listen_and_tap';
  protected levelCount = LISTEN_LEVELS.length;

  // The animals still to be found on this board, in asking order. The round
  // only ends when every animal has been found (served one by one via
  // nextTarget), so each board is a full hunt, not a single find.
  private quarry: Item[] = [];

  constructor() {
    super('ListenAndTap');
  }

  protected planRound(levelIndex: number): RoundPlan {
    const level = LISTEN_LEVELS[levelIndex];

    // For a "same category" round the target must come from a category big
    // enough to supply all the distractors too.
    let target: Item;
    if (level.distractorCategory === 'same') {
      const category = pickOne(categoriesWithAtLeast(level.choices));
      target = pickOne(ITEMS.filter((it) => it.category === category));
    } else {
      target = pickOne(ITEMS);
    }

    const distractors = pickItems(level.choices - 1, {
      exclude: [target.id],
      category: level.distractorCategory === 'same' ? target.category : undefined,
    });

    // Every animal on the board gets hunted; quarry is the asking order and
    // the first one is the round's opening target.
    const items = shuffle([target, ...distractors]);
    this.quarry = shuffle(items);
    const first = this.quarry.shift()!;

    return {
      items,
      target: first,
      instruction: findPrompt(first.word),
      parentLabel: first.word,
      successLine: `${praise()} The ${first.word}!`,
    };
  }

  // After each find: the next animal to hunt, until the board is cleared.
  protected nextTarget(): { target: Item; instruction: string; successLine: string } | null {
    const next = this.quarry.shift();
    if (!next) return null;
    return {
      target: next,
      instruction: findPrompt(next.word),
      successLine: `${praise()} The ${next.word}!`,
    };
  }

  // The field background comes from ChoiceGameScene — sky above, grass below,
  // so the bushes look like they sit on grass.

  // --- Scattered, bush-hidden layout ---------------------------------------

  protected layoutCards(items: Item[]): void {
    const n = items.length;
    const cols = Math.min(n, 3);
    const rows = Math.ceil(n / cols);

    const left = 160;
    const right = DESIGN_WIDTH - 160;
    const top = 250;
    const bottom = DESIGN_HEIGHT - 90;
    const cellW = (right - left) / cols;
    const cellH = (bottom - top) / rows;
    const size = Phaser.Math.Clamp(Math.min(cellW, cellH) * 0.62, 120, 200);

    items.forEach((item, i) => {
      const r = Math.floor(i / cols);
      // Centre a short final row so it doesn't hug the left.
      const inRow = r === rows - 1 ? n - cols * (rows - 1) : cols;
      const c = i - cols * r;
      const rowLeft = left + ((cols - inRow) * cellW) / 2;
      const jx = (Math.random() - 0.5) * cellW * 0.22;
      const jy = (Math.random() - 0.5) * cellH * 0.22;
      const x = rowLeft + c * cellW + cellW / 2 + jx;
      const y = top + r * cellH + cellH / 2 + jy;
      this.cards.push(this.makeHiddenCard(item, x, y, size));
    });
  }

  private makeHiddenCard(item: Item, x: number, y: number, size: number): Card {
    const parts: Card['parts'] = [];

    // Depth grows with y so clumps lower on the screen draw in front of the
    // row above — a popping animal must not vanish behind an upper bush.
    // Scaled well below the star bursts (depth 50) in BaseScene.
    const layer = y / 100;

    // The animal, drawn first so the bush (added next) sits in front of it.
    let sprite: Card['sprite'];
    if (this.textures.exists(item.id)) {
      const img = this.add.image(x, y, item.id).setDepth(layer);
      img.setScale(size / Math.max(img.width, img.height));
      sprite = img;
      parts.push(img);
    } else {
      const colour = CATEGORY_COLOUR[item.category] ?? 0xcccccc;
      const rect = this.add.rectangle(0, 0, size, size, colour).setStrokeStyle(6, 0xffffff);
      const label = this.add
        .text(0, 0, item.word, { fontFamily: 'sans-serif', fontSize: '34px', color: '#ffffff' })
        .setOrigin(0.5);
      const box = this.add.container(x, y, [rect, label]).setDepth(layer);
      sprite = box;
      parts.push(box);
    }

    // Bush in front, covering the lower part of the animal.
    const bush = this.makeBush(x, y + size * 0.32, size * 1.35).setDepth(layer + 0.01);
    parts.push(bush);
    // Gentle rustle so the scene feels alive and invites a look.
    this.tweens.add({
      targets: bush,
      angle: { from: -2, to: 2 },
      duration: 1500 + Math.random() * 800,
      delay: Math.random() * 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Transparent tap target over the whole clump (a leaf object, so its hit
    // area lines up under the zoomed camera).
    const hit = this.add
      .rectangle(x, y + size * 0.15, size * 1.2, size * 1.35, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(layer + 0.02);
    parts.push(hit);

    const card: Card = { hit, parts, item, sprite, baseY: y, riseBy: size * 0.8 };
    hit.on('pointerdown', () => this.onCardTap(card));
    return card;
  }

  private makeBush(x: number, y: number, w: number): Phaser.GameObjects.Container {
    const h = w * 0.6;
    const dark = 0x3f7d3a;
    const mid = 0x4f9a47;
    const light = 0x69ba5b;
    const leaves = [
      this.add.ellipse(-w * 0.28, h * 0.12, w * 0.6, h * 0.85, dark),
      this.add.ellipse(w * 0.28, h * 0.12, w * 0.6, h * 0.85, dark),
      this.add.ellipse(0, 0, w, h * 0.95, mid),
      this.add.ellipse(-w * 0.12, -h * 0.16, w * 0.5, h * 0.6, light),
      this.add.ellipse(w * 0.18, -h * 0.08, w * 0.42, h * 0.52, light),
    ];
    return this.add.container(x, y, leaves);
  }

  // --- Peek / jump feedback -------------------------------------------------

  protected onCorrectFeedback(card: Card): void {
    const sprite = card.sprite;
    if (!sprite || card.baseY === undefined) return;
    const topY = card.baseY - (card.riseBy ?? 120);

    // Jump right out of the bush and stay up, with a little pop.
    this.tweens.add({ targets: sprite, y: topY, duration: 420, ease: 'Back.easeOut' });
    this.tweens.add({ targets: sprite, scale: '*=1.12', duration: 200, yoyo: true, ease: 'Quad.easeOut' });
    this.starBurst(sprite.x, topY); // shared BaseScene helper
  }

  protected onWrongFeedback(card: Card): void {
    const sprite = card.sprite;
    if (!sprite || card.baseY === undefined) return;
    // A quick peek up out of the bush, then back down.
    this.tweens.add({
      targets: sprite,
      y: card.baseY - (card.riseBy ?? 120) * 0.4,
      duration: 170,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }
}
