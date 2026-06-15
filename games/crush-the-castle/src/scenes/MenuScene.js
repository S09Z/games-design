import Phaser from 'phaser';

const SCREEN_IDS = ['main-menu', 'level-select', 'pause-menu', 'level-complete', 'game-over', 'loading-screen', 'hud'];

function hideAllOverlays() {
  SCREEN_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

function showOverlay(id) {
  hideAllOverlays();
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex';
}

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    showOverlay('main-menu');

    const btnPlay = document.getElementById('btn-play');
    const btnLevelSelect = document.getElementById('btn-level-select');
    const btnMute = document.getElementById('btn-mute');

    this._onClick(btnPlay, () => {
      this.scene.start('GameScene', { levelId: 1 });
    });

    this._onClick(btnLevelSelect, () => {
      this.scene.start('LevelSelectScene');
    });

    this._onClick(btnMute, () => {
      // Placeholder — audio will be wired in Phase 7
    });
  }

  _onClick(el, fn) {
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      fn();
    };
    el.addEventListener('click', handler);
    this.events.on('shutdown', () => {
      el.removeEventListener('click', handler);
    });
  }
}
