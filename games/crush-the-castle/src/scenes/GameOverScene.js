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

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.levelId = data.levelId || 1;
    this.score = data.score || 0;
  }

  create() {
    const scoreEl = document.querySelector('#game-over .result-score');
    if (scoreEl) scoreEl.textContent = `Score: ${this.score}`;

    showOverlay('game-over');

    this._onClick('btn-try-again', () => {
      this.scene.start('GameScene', { levelId: this.levelId });
    });

    this._onClick('btn-main-menu-over', () => {
      this.scene.start('MenuScene');
    });
  }

  _onClick(id, fn) {
    const el = document.getElementById(id);
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
