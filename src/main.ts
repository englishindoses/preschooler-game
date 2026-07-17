import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { ListenAndTapScene } from './scenes/ListenAndTapScene';
import { OddOneOutScene } from './scenes/OddOneOutScene';
import { MemoryScene } from './scenes/MemoryScene';
import { BG_COLOUR } from './scenes/BaseScene';

// RESIZE mode: the canvas always fills the whole screen (so the background
// colour reaches every edge — no black bands). Each scene fits/rotates its
// camera to keep the 1280x720 landscape design filling that screen.
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: BG_COLOUR,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%',
  },
  scene: [MenuScene, ListenAndTapScene, OddOneOutScene, MemoryScene],
};

new Phaser.Game(config);
