import Phaser from 'phaser';
import { BaseScene, DESIGN_WIDTH } from './BaseScene';
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
  }

  private makeButton(x: number, y: number, label: string, colour: number, sceneKey: string): void {
    const w = 560;
    const h = 130;
    const rect = this.add.rectangle(0, 0, w, h, colour).setStrokeStyle(6, 0xffffff);
    const text = this.add
      .text(0, 0, label, { fontFamily: 'sans-serif', fontSize: '48px', color: '#ffffff' })
      .setOrigin(0.5);

    const button = this.add.container(x, y, [rect, text]);
    button.setSize(w, h);
    button.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains,
    );
    button.on('pointerdown', () => {
      unlockAudio();
      this.scene.start(sceneKey);
    });
  }
}
