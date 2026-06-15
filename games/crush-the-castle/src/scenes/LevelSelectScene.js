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

export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelectScene');
  }

  create() {
    this._wireLevelNodes();
    showOverlay('level-select');

    const btnBack = document.getElementById('btn-back-main');
    this._onClick(btnBack, () => {
      this.scene.start('MenuScene');
    });
  }

  _wireLevelNodes() {
    const container = document.getElementById('level-grid');
    if (!container) return;

    const nodes = container.querySelectorAll('.level-node');
    const maxUnlocked = 5; // All unlocked until SaveManager is ported

    nodes.forEach((node) => {
      const levelId = parseInt(node.dataset.level, 10);

      if (levelId <= maxUnlocked) {
        node.classList.remove('locked');
        if (levelId === 1) {
          node.classList.add('current');
        }
        node.addEventListener('click', () => {
          this.scene.start('GameScene', { levelId });
        });
      } else {
        node.classList.add('locked');
      }
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
