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

export default class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super('LevelCompleteScene');
  }

  init(data) {
    this.levelId = data.levelId || 1;
    this.stars = data.stars || 0;
    this.score = data.score || 0;
  }

  create() {
    // Populate stars
    const starsEl = document.querySelector('#level-complete .result-stars');
    if (starsEl) {
      starsEl.innerHTML = '';
      const sizes = ['star-sm', 'star-lg', 'star-sm'];
      for (let s = 0; s < 3; s++) {
        const span = document.createElement('span');
        span.className = `star ${s < this.stars ? 'earned' : 'empty'} ${sizes[s]}`;
        span.innerHTML = '★';
        starsEl.appendChild(span);
      }
    }

    const scoreEl = document.querySelector('#level-complete .result-score');
    if (scoreEl) scoreEl.textContent = String(this.score);

    const nextBtn = document.getElementById('btn-next-level');
    if (nextBtn) {
      nextBtn.style.display = this.levelId < 5 ? '' : 'none';
    }

    showOverlay('level-complete');

    this._onClick('btn-next-level', () => {
      this.scene.start('GameScene', { levelId: this.levelId + 1 });
    });

    this._onClick('btn-restart-complete', () => {
      this.scene.start('GameScene', { levelId: this.levelId });
    });

    this._onClick('btn-main-menu-complete', () => {
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
