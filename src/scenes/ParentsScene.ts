import Phaser from 'phaser';
import { BaseScene, DESIGN_WIDTH, DESIGN_HEIGHT } from './BaseScene';
import { LISTEN_LEVELS, ODD_LEVELS } from '../core/content';

// Parent-only area (design/design.md §5.1), reached from Home behind a
// press-and-hold gate so a young child can't open it by accident. It lets a
// grown-up pick the starting level for each game. (The games still adapt up/down
// from there during play.)
//
// Storage note: the two "tap the picture" games store a 0-based level index (via
// the shared Difficulty engine); Memory stores its 1-based level directly. The
// `zeroBased` flag bridges that so the buttons always show 1..N.
interface GameCfg {
  label: string;
  key: string;
  levels: number;
  zeroBased: boolean;
}

const GAMES: GameCfg[] = [
  { label: 'Listen & Tap', key: 'pg.level.listen_and_tap', levels: LISTEN_LEVELS.length, zeroBased: true },
  { label: 'Odd One Out', key: 'pg.level.odd_one_out', levels: ODD_LEVELS.length, zeroBased: true },
  { label: 'Memory Pairs', key: 'pg.level.memory_pairs', levels: 4, zeroBased: false },
];

export class ParentsScene extends BaseScene {
  private status!: Phaser.GameObjects.Text;

  constructor() {
    super('Parents');
  }

  create(): void {
    super.create();

    this.add
      .text(DESIGN_WIDTH / 2, 68, 'For grown-ups', {
        fontFamily: 'sans-serif',
        fontSize: '56px',
        fontStyle: 'bold',
        color: '#2b2b2b',
      })
      .setOrigin(0.5);

    this.add
      .text(DESIGN_WIDTH / 2, 126, 'Choose a starting level for each game', {
        fontFamily: 'sans-serif',
        fontSize: '30px',
        color: '#5a7a4a',
      })
      .setOrigin(0.5);

    GAMES.forEach((game, i) => this.makeRow(game, 230 + i * 110));

    this.status = this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 135, '', {
        fontFamily: 'sans-serif',
        fontSize: '30px',
        color: '#2e7d32',
      })
      .setOrigin(0.5);

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

  private makeRow(game: GameCfg, y: number): void {
    this.add
      .text(110, y, game.label, { fontFamily: 'sans-serif', fontSize: '40px', color: '#2b2b2b' })
      .setOrigin(0, 0.5);

    const current = this.levelOf(game);
    const startX = 560;
    const gap = 92;
    const buttons: Phaser.GameObjects.Rectangle[] = [];

    for (let lvl = 1; lvl <= game.levels; lvl++) {
      const bx = startX + (lvl - 1) * gap;
      const rect = this.add
        .rectangle(bx, y, 72, 72, lvl === current ? 0x2e7d32 : 0x9ccc8f)
        .setStrokeStyle(4, 0xffffff)
        .setInteractive({ useHandCursor: true });
      this.add
        .text(bx, y, String(lvl), { fontFamily: 'sans-serif', fontSize: '36px', color: '#ffffff' })
        .setOrigin(0.5);
      rect.on('pointerdown', () => this.selectLevel(game, lvl, buttons));
      buttons.push(rect);
    }
  }

  private selectLevel(game: GameCfg, lvl: number, buttons: Phaser.GameObjects.Rectangle[]): void {
    localStorage.setItem(game.key, String(game.zeroBased ? lvl - 1 : lvl));
    buttons.forEach((b, i) => b.setFillStyle(i === lvl - 1 ? 0x2e7d32 : 0x9ccc8f));
    this.status.setText(`${game.label}: level ${lvl}`);
  }

  private levelOf(game: GameCfg): number {
    const raw = localStorage.getItem(game.key);
    if (raw === null) return 1;
    const n = Number(raw);
    if (!Number.isInteger(n)) return 1;
    const lvl = game.zeroBased ? n + 1 : n;
    return Phaser.Math.Clamp(lvl, 1, game.levels);
  }
}
