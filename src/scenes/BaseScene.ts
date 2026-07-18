import Phaser from 'phaser';

// Every screen is designed in a fixed 1280x720 landscape space. Objects are
// always placed using these coordinates. BaseScene keeps the game LANDSCAPE on
// any screen by fitting/rotating the camera (not the DOM) so the game renders
// landscape from the very first frame — even before the fullscreen/orientation
// lock kicks in on the first tap. On a portrait phone it appears sideways,
// filling the screen; the child turns the phone (or the OS lock rotates it).
// Rotating inside Phaser's camera keeps taps landing correctly.
export const DESIGN_WIDTH = 1280;
export const DESIGN_HEIGHT = 720;
export const BG_COLOUR = '#bfe3b0';

export class BaseScene extends Phaser.Scene {
  protected fitCamera(): void {
    const cam = this.cameras.main;
    const vw = this.scale.width;
    const vh = this.scale.height;
    const portrait = vh > vw;

    cam.setBackgroundColor(BG_COLOUR);

    if (portrait) {
      // +90° so the phone's top edge (volume buttons) stays on top when turned.
      cam.setRotation(Phaser.Math.DegToRad(90));
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
