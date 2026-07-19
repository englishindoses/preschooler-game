import Phaser from 'phaser';
import { BaseScene, DESIGN_WIDTH, DESIGN_HEIGHT } from './BaseScene';

// Parent-only area (design/design.md §5.1). Reached from the Home screen behind
// a press-and-hold gate so a young child can't open it or wipe progress by
// accident. For now it holds one control per game: reset that game's saved
// difficulty level back to the start. More parent settings can live here later.
const RESETTABLE: Array<{ label: string; key: string }> = [
  { label: 'Listen & Tap', key: 'pg.level.listen_and_tap' },
  { label: 'Odd One Out', key: 'pg.level.odd_one_out' },
  { label: 'Memory Pairs', key: 'pg.level.memory_pairs' },
];

export class ParentsScene extends BaseScene {
  private status!: Phaser.GameObjects.Text;

  constructor() {
    super('Parents');
  }

  create(): void {
    super.create();

    this.add
      .text(DESIGN_WIDTH / 2, 70, 'For grown-ups', {
        fontFamily: 'sans-serif',
        fontSize: '56px',
        fontStyle: 'bold',
        color: '#2b2b2b',
      })
      .setOrigin(0.5);

    this.add
      .text(DESIGN_WIDTH / 2, 130, 'Reset a game back to the first level', {
        fontFamily: 'sans-serif',
        fontSize: '30px',
        color: '#5a7a4a',
      })
      .setOrigin(0.5);

    RESETTABLE.forEach((game, i) => this.makeResetRow(game.label, game.key, 230 + i * 110));

    this.status = this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 130, '', {
        fontFamily: 'sans-serif',
        fontSize: '30px',
        color: '#2e7d32',
      })
      .setOrigin(0.5);

    // Back to the Home screen.
    const back = this.add
      .rectangle(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 60, 320, 76, 0x8bc34a)
      .setStrokeStyle(5, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 60, '🏠  Back', {
        fontFamily: 'sans-serif',
        fontSize: '38px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    back.on('pointerdown', () => this.scene.start('Menu'));
  }

  private makeResetRow(label: string, key: string, y: number): void {
    this.add
      .text(DESIGN_WIDTH / 2 - 200, y, label, {
        fontFamily: 'sans-serif',
        fontSize: '40px',
        color: '#2b2b2b',
      })
      .setOrigin(0, 0.5);

    const btn = this.add
      .rectangle(DESIGN_WIDTH / 2 + 300, y, 260, 76, 0xef7c7c)
      .setStrokeStyle(5, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(DESIGN_WIDTH / 2 + 300, y, 'Reset', {
        fontFamily: 'sans-serif',
        fontSize: '36px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    btn.on('pointerdown', () => {
      localStorage.removeItem(key);
      this.status.setText(`${label} reset to level 1`);
      // A small confirming pulse on the button.
      this.tweens.add({
        targets: btn,
        scale: { from: 1, to: 1.12 },
        duration: 140,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    });
  }
}
