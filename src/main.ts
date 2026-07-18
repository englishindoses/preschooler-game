import Phaser from 'phaser';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { ListenAndTapScene } from './scenes/ListenAndTapScene';
import { OddOneOutScene } from './scenes/OddOneOutScene';
import { MemoryScene } from './scenes/MemoryScene';
import { BG_COLOUR } from './scenes/BaseScene';
import { installFullscreenLock } from './core/fullscreen';

// RESIZE mode: the canvas always fills the whole screen. Each scene fits/rotates
// its camera (see BaseScene) to render the 1280x720 landscape design landscape
// from the first frame — filling the screen, no black bands.
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: BG_COLOUR,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%',
  },
  scene: [PreloadScene, MenuScene, ListenAndTapScene, OddOneOutScene, MemoryScene],
};

new Phaser.Game(config);

// Android: first tap enters fullscreen and locks to landscape.
installFullscreenLock();
