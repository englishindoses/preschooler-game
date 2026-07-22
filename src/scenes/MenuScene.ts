import { BaseScene, DESIGN_WIDTH, DESIGN_HEIGHT, BG_FARMYARD } from './BaseScene';
import { unlockAudio } from '../core/audio';

// TEMPORARY placeholder Home. The real Home is a farm scene with picture-based
// activity choices (design/design.md §5.1). For now, two labelled buttons so we
// can reach and test both games. Tapping a button also unlocks audio (the
// browser requires a user gesture before any sound can play).
export class MenuScene extends BaseScene {
  constructor() {
    super('Menu');
  }

  create(): void {
    super.create();
    // Home is the farmyard — a definite place to come back to. (The game
    // screens use the neutral field instead; see BaseScene.)
    this.addBackground(BG_FARMYARD);

    this.add
      .text(DESIGN_WIDTH / 2, 110, '🦒  Choose a game', {
        fontFamily: 'sans-serif',
        fontSize: '64px',
        color: '#2b2b2b',
      })
      .setOrigin(0.5);

    this.makeButton(DESIGN_WIDTH / 2, 280, 'Listen & Tap', 0x42a5f5, 'ListenAndTap');
    this.makeButton(DESIGN_WIDTH / 2, 440, 'Odd One Out', 0x8bc34a, 'OddOneOut');
    this.makeButton(DESIGN_WIDTH / 2, 600, 'Memory Pairs', 0xffa726, 'Memory');

    this.makeGrownupsGate();
  }

  // Small corner entry to the parents area, behind a press-and-hold so a young
  // child can't open it by tapping. A grown-up holds it for ~1.5s to enter.
  private makeGrownupsGate(): void {
    const HOLD_MS = 1500;
    const x = DESIGN_WIDTH - 40;
    const y = DESIGN_HEIGHT - 34;

    const label = this.add
      .text(x, y, '🔒 For grown-ups (hold)', {
        fontFamily: 'sans-serif',
        fontSize: '26px',
        color: '#4a6a3a',
      })
      .setOrigin(1, 1)
      .setInteractive({ useHandCursor: true });

    let timer: Phaser.Time.TimerEvent | null = null;
    const cancel = (): void => {
      timer?.remove();
      timer = null;
      label.setText('🔒 For grown-ups (hold)');
    };
    label.on('pointerdown', () => {
      label.setText('🔒 Keep holding…');
      timer = this.time.delayedCall(HOLD_MS, () => this.scene.start('Parents'));
    });
    label.on('pointerup', cancel);
    label.on('pointerout', cancel);
  }

  private makeButton(x: number, y: number, label: string, colour: number, sceneKey: string): void {
    const w = 560;
    const h = 130;
    // The rectangle itself is the tap target — its own hit area lines up under a
    // zoomed/rotated camera, unlike a Container hit area.
    const rect = this.add
      .rectangle(x, y, w, h, colour)
      .setStrokeStyle(6, 0xffffff)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(x, y, label, { fontFamily: 'sans-serif', fontSize: '48px', color: '#ffffff' })
      .setOrigin(0.5);

    rect.on('pointerdown', () => {
      unlockAudio();
      this.scene.start(sceneKey);
    });
  }
}
