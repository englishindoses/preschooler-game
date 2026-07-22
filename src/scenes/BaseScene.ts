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

// Scene background art (public/assets/images/ui/). `field` is the neutral one —
// an open grassy field that suits farm animals and wild animals alike, so every
// game screen uses it. `farmyard` (barn + farmhouse) is the Home screen, which
// shows no animals, so it can be a definite place.
export const BG_FIELD = 'bg_field';
export const BG_FARMYARD = 'bg_farmyard';

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

    // Dev-only: record the active scene so tests can verify navigation.
    if ((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV) {
      (window as unknown as { __scene: string }).__scene = this.scene.key;
    }
  }

  // Paints one of the background images across the whole design space, behind
  // everything else. Scaled to *cover* 1280x720 (so no gaps if the art's aspect
  // ratio differs) and centred. If the image hasn't been added yet the scene
  // just keeps the plain BG_COLOUR — nothing else has to change.
  protected addBackground(key: string): void {
    if (!this.textures.exists(key)) return;
    const bg = this.add.image(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, key).setDepth(-100);
    bg.setScale(Math.max(DESIGN_WIDTH / bg.width, DESIGN_HEIGHT / bg.height));
  }

  // Shared reward beat: a spinning gold star with a big explosion of stars all
  // around it, then a pause, then onComplete. Drawn as a real 5-point star (not
  // an emoji, which rendered clipped), centred so it always fits.
  protected showStar(onComplete: () => void): void {
    const cx = DESIGN_WIDTH / 2;
    const cy = DESIGN_HEIGHT / 2;
    const star = this.add
      .star(cx, cy, 5, 78, 160, 0xffd23f)
      .setStrokeStyle(10, 0xf5a623)
      .setScale(0);
    this.tweens.add({
      targets: star,
      scale: 1,
      angle: 360,
      duration: 700,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Big exaggerated explosion around the star — kids love it — in waves.
        this.starBurst(cx, cy, 30, 420);
        this.time.delayedCall(220, () => this.starBurst(cx, cy, 24, 320));
        this.time.delayedCall(460, () => this.starBurst(cx, cy, 20, 240));
        this.time.delayedCall(1100, () => {
          star.destroy();
          onComplete();
        });
      },
    });
  }

  // An outward explosion of little stars at (x, y) — used to celebrate a correct
  // answer / matched pair. Bigger count/spread = a more dramatic burst. Purely
  // decorative; cleans itself up.
  protected starBurst(x: number, y: number, count = 14, spread = 170): void {
    for (let i = 0; i < count; i++) {
      const outer = 10 + Math.random() * 14;
      const star = this.add
        .star(x, y, 5, outer * 0.45, outer, 0xffd23f)
        .setStrokeStyle(2, 0xf5a623)
        .setDepth(50);
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const dist = spread * 0.5 + Math.random() * spread * 0.7;
      this.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        scale: { from: 1, to: 0 },
        angle: 200 + Math.random() * 180,
        duration: 700 + Math.random() * 350,
        ease: 'Quad.easeOut',
        onComplete: () => star.destroy(),
      });
    }
  }
}
