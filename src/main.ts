import Phaser from 'phaser';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { ListenAndTapScene } from './scenes/ListenAndTapScene';
import { OddOneOutScene } from './scenes/OddOneOutScene';
import { MemoryScene } from './scenes/MemoryScene';
import { BG_COLOUR } from './scenes/BaseScene';
import { installFullscreenLock } from './core/fullscreen';

// Render at the DEVICE's real pixel density so it's crisp on high-resolution
// phones (not a low-res canvas magnified by the screen, which looks pixelated).
// Capped at 3x to keep the canvas from getting huge on very dense screens.
function pixelRatio(): number {
  return Math.min(window.devicePixelRatio || 1, 3);
}

// Scale.NONE + manual sizing: the drawing buffer is (CSS size × pixel ratio),
// while the canvas is displayed at CSS size — so every pixel is real. Each scene
// fits/rotates its camera (see BaseScene) to render the 1280x720 landscape
// design filling that buffer.
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: BG_COLOUR,
  scale: {
    mode: Phaser.Scale.NONE,
    width: window.innerWidth * pixelRatio(),
    height: window.innerHeight * pixelRatio(),
  },
  render: {
    // Smooth minification (fixes pictures looking rough when scaled down).
    mipmapFilter: 'LINEAR_MIPMAP_LINEAR',
    antialias: true,
  },
  scene: [PreloadScene, MenuScene, ListenAndTapScene, OddOneOutScene, MemoryScene],
};

const game = new Phaser.Game(config);

function resizeToDevice(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const ratio = pixelRatio();
  game.scale.resize(w * ratio, h * ratio);
  if (game.canvas) {
    game.canvas.style.width = `${w}px`;
    game.canvas.style.height = `${h}px`;
  }
}

window.addEventListener('resize', resizeToDevice);
window.addEventListener('orientationchange', resizeToDevice);
resizeToDevice();

// Android: first tap enters fullscreen and locks to landscape.
installFullscreenLock();
