import Phaser from 'phaser';

const SCREEN_IDS = ['main-menu', 'level-select', 'pause-menu', 'level-complete', 'game-over', 'loading-screen', 'hud'];

function hideAllOverlays() {
  SCREEN_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

function showHUD() {
  const hud = document.getElementById('hud');
  if (hud) hud.style.display = 'flex';
}

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.levelId = data.levelId || 1;
  }

  create() {
    hideAllOverlays();
    showHUD();

    // Level name in HUD badge
    const nameEl = document.getElementById('hud-level-name');
    if (nameEl) nameEl.textContent = `Level ${this.levelId}`;

    // Score display (just the number, label is separate)
    const scoreEl = document.getElementById('hud-score');
    if (scoreEl) scoreEl.textContent = '0';

    // Clear ammo icons container
    const ammoEl = document.getElementById('hud-ammo');
    if (ammoEl) ammoEl.innerHTML = '';

    // Ammo count
    const ammoCount = document.getElementById('hud-ammo-count');
    if (ammoCount) ammoCount.textContent = '×5';

    // Power meter
    const pctEl = document.getElementById('hud-power-pct');
    if (pctEl) pctEl.textContent = '60%';
    const fillEl = document.getElementById('hud-power-fill');
    if (fillEl) fillEl.style.width = '60%';
    const thumbEl = document.getElementById('hud-power-thumb');
    if (thumbEl) thumbEl.style.left = '60%';

    // Aim angle
    const aimEl = document.getElementById('hud-aim-angle');
    if (aimEl) aimEl.textContent = '42°';

    // Enemies count
    const enemiesEl = document.getElementById('hud-enemies-count');
    if (enemiesEl) enemiesEl.textContent = '0';

    // Draw a placeholder scene on the Phaser canvas
    const w = this.scale.width;
    const h = this.scale.height;

    // Sky
    this.cameras.main.setBackgroundColor('#AFD3DE');

    // Ground
    this.add.rectangle(w / 2, h - 25, w, 50, 0x5C3D1E);
    this.add.rectangle(w / 2, h - 50, w, 8, 0x4A7C3F);

    // Level label
    this.add.text(w / 2, 40, `Level ${this.levelId}`, {
      fontSize: '28px',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(w / 2, 80, 'Game scene ready for migration', {
      fontSize: '16px',
      fontFamily: 'Georgia, serif',
      color: '#dddddd',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // ESC key → pause
    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.pause();
      this.scene.launch('PauseScene', { levelId: this.levelId });
    });

    // Pause button in HUD
    const pauseBtn = document.getElementById('hud-btn-pause');
    if (pauseBtn) {
      const pauseHandler = () => {
        this.scene.pause();
        this.scene.launch('PauseScene', { levelId: this.levelId });
      };
      pauseBtn.addEventListener('click', pauseHandler);
      this.events.on('shutdown', () => {
        pauseBtn.removeEventListener('click', pauseHandler);
      });
    }

    // TEMP: click to simulate win for testing transitions
    this.input.on('pointerdown', () => {
      hideAllOverlays();
      this.scene.start('LevelCompleteScene', { levelId: this.levelId, stars: 3, score: 2500 });
    });
  }

  shutdown() {
    const nameEl = document.getElementById('hud-level-name');
    if (nameEl) nameEl.textContent = '';
    const scoreEl = document.getElementById('hud-score');
    if (scoreEl) scoreEl.textContent = '0';
    const ammoEl = document.getElementById('hud-ammo');
    if (ammoEl) ammoEl.innerHTML = '';
  }
}
