import Phaser from 'phaser';

// Every screen is designed in a fixed 1280x720 landscape space. Objects are
// always placed using these coordinates. Phaser's Scale.FIT (set in main.ts)
// scales this landscape canvas to fit any screen and centres it — so the game
// is ALWAYS landscape, never rotates, and never re-arranges when the phone
// turns. On a portrait phone it simply appears as a smaller centred landscape
// area with calm background-coloured margins above and below.
export const DESIGN_WIDTH = 1280;
export const DESIGN_HEIGHT = 720;
export const BG_COLOUR = '#bfe3b0';

export class BaseScene extends Phaser.Scene {
  // Scenes that extend BaseScene should call super.create() first, then build
  // their content in design coordinates (0..1280 wide, 0..720 tall).
  create(): void {
    this.cameras.main.setBackgroundColor(BG_COLOUR);
  }

  // Shared reward beat: a spinning star, then a pause, then onComplete.
  protected showStar(onComplete: () => void): void {
    const star = this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, '⭐', { fontSize: '160px' })
      .setOrigin(0.5)
      .setScale(0);
    this.tweens.add({
      targets: star,
      scale: 1,
      angle: 360,
      duration: 700,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(900, () => {
          star.destroy();
          onComplete();
        });
      },
    });
  }
}
