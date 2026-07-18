import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { ListenAndTapScene } from './scenes/ListenAndTapScene';
import { OddOneOutScene } from './scenes/OddOneOutScene';
import { MemoryScene } from './scenes/MemoryScene';
import { BG_COLOUR, DESIGN_WIDTH, DESIGN_HEIGHT } from './scenes/BaseScene';
import { installFullscreenLock } from './core/fullscreen';

// FIT mode: the fixed 1280x720 landscape design is scaled to fit the screen and
// centred. The game is ALWAYS landscape and never rotates — turn the phone and
// nothing re-arranges. It just scales to fit a phone, tablet or laptop. On a
// portrait phone it shows as a smaller centred landscape area with margins.
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: BG_COLOUR,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
  },
  scene: [MenuScene, ListenAndTapScene, OddOneOutScene, MemoryScene],
};

new Phaser.Game(config);

// Android: first tap enters fullscreen and locks to landscape.
installFullscreenLock();
