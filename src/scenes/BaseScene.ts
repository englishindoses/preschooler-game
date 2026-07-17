import Phaser from 'phaser';

// Every screen is designed in a fixed 1280x720 landscape space. Objects are
// always placed using these coordinates, whatever the real screen size.
export const DESIGN_WIDTH = 1280;
export const DESIGN_HEIGHT = 720;
export const BG_COLOUR = '#bfe3b0';

// BaseScene keeps the game LANDSCAPE on any screen by fitting/rotating the
// camera (not the DOM). Because the rotation happens inside Phaser's camera,
// taps still map to the right place — unlike a CSS rotation. On a portrait
// phone the world is rotated to fill the screen sideways (no black bands), so
// the child naturally turns the phone.
export class BaseScene extends Phaser.Scene {
  protected fitCamera(): void {
    const cam = this.cameras.main;
    const vw = this.scale.width;
    const vh = this.scale.height;
    const portrait = vh > vw;

    cam.setBackgroundColor(BG_COLOUR);

    if (portrait) {
      cam.setRotation(Phaser.Math.DegToRad(-90));
      cam.setZoom(Math.min(vw / DESIGN_HEIGHT, vh / DESIGN_WIDTH));
    } else {
      cam.setRotation(0);
      cam.setZoom(Math.min(vw / DESIGN_WIDTH, vh / DESIGN_HEIGHT));
    }

    cam.centerOn(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2);
  }

  // Scenes that extend BaseScene should call super.create() first, then build
  // their content in design coordinates (0..1280 wide, 0..720 tall).
  create(): void {
    this.fitCamera();
    this.scale.on('resize', this.fitCamera, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.fitCamera, this);
    });
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
