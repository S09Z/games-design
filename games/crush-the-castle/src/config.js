import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import LevelSelectScene from './scenes/LevelSelectScene.js';
import GameScene from './scenes/GameScene.js';
import LevelCompleteScene from './scenes/LevelCompleteScene.js';
import GameOverScene from './scenes/GameOverScene.js';

export const gameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 500,
  parent: 'game-container',
  backgroundColor: '#87CEEB',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: true,
  },
  scene: [BootScene, MenuScene, LevelSelectScene, GameScene, LevelCompleteScene, GameOverScene],
};
