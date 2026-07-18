import Phaser from 'phaser';
import { ITEMS } from '../core/content';

// Loads item images once at startup. Any image that isn't there yet simply
// fails to load (a harmless console 404) and the game falls back to the
// coloured placeholder card for that item. Drop a PNG into
// public/assets/images/items/<id>.png and it appears automatically — no code
// change needed.
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    this.load.on('loaderror', () => {
      /* missing image — placeholder will be used instead */
    });
    for (const item of ITEMS) {
      this.load.image(item.id, item.image);
    }
  }

  create(): void {
    this.scene.start('Menu');
  }
}
