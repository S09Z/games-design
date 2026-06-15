import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    const SCREEN_IDS = ['main-menu', 'level-select', 'pause-menu', 'level-complete', 'game-over', 'loading-screen', 'hud'];

    const hideAll = () => {
      SCREEN_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
    };

    const showOne = (id) => {
      hideAll();
      const el = document.getElementById(id);
      if (el) el.style.display = id === 'hud' ? 'flex' : 'flex';
    };

    // Show loading, then transition to menu
    showOne('loading-screen');
    this.time.delayedCall(600, () => {
      hideAll();
      this.scene.start('MenuScene');
    });
  }
}
