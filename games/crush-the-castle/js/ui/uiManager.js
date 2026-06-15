// UI Manager - controls overlay screens
var UIManager = (function() {
    var SCREENS = ['main-menu', 'level-select', 'pause-menu', 'level-complete', 'game-over', 'loading-screen'];

    function UIManager(saveManager, audioManager) {
        this.saveManager = saveManager;
        this.audioManager = audioManager;
        this.menu = new Menu(saveManager);
        this.hud = new HUD();
        this.currentScreen = null;
        this.onStartGame = null;
        this.onLevelSelect = null;
        this.onResume = null;
        this.onRestart = null;
        this.onMainMenu = null;
        this.onNextLevel = null;
        this.currentLevelId = 1;
        this._bindButtons();
    }

    UIManager.prototype._bindButtons = function() {
        var self = this;

        // Main menu
        this._onClick('btn-play', function() {
            if (self.audioManager) self.audioManager.playSound('button');
            // Go to level 1 directly, or level select
            if (self.onStartGame) self.onStartGame(1);
        });
        this._onClick('btn-level-select', function() {
            if (self.audioManager) self.audioManager.playSound('button');
            self.menu.renderLevelSelect();
            self.showScreen('level-select');
            // Bind level buttons
            self._bindLevelButtons();
        });
        this._onClick('btn-mute', function() {
            if (self.audioManager) {
                self.audioManager.toggleMute();
                var btn = document.getElementById('btn-mute');
                if (btn) btn.textContent = self.audioManager.muted ? '🔇 Muted' : '🔊 Sound';
            }
        });

        // Level select
        this._onClick('btn-back-main', function() {
            if (self.audioManager) self.audioManager.playSound('button');
            self.showScreen('main-menu');
        });

        // Pause menu
        this._onClick('btn-resume', function() {
            if (self.audioManager) self.audioManager.playSound('button');
            if (self.onResume) self.onResume();
        });
        this._onClick('btn-restart-pause', function() {
            if (self.audioManager) self.audioManager.playSound('button');
            if (self.onRestart) self.onRestart();
        });
        this._onClick('btn-main-menu-pause', function() {
            if (self.audioManager) self.audioManager.playSound('button');
            if (self.onMainMenu) self.onMainMenu();
        });

        // Level complete
        this._onClick('btn-next-level', function() {
            if (self.audioManager) self.audioManager.playSound('select');
            if (self.onNextLevel) self.onNextLevel(self.currentLevelId + 1);
        });
        this._onClick('btn-restart-complete', function() {
            if (self.audioManager) self.audioManager.playSound('button');
            if (self.onRestart) self.onRestart();
        });
        this._onClick('btn-main-menu-complete', function() {
            if (self.audioManager) self.audioManager.playSound('button');
            if (self.onMainMenu) self.onMainMenu();
        });

        // Game over
        this._onClick('btn-try-again', function() {
            if (self.audioManager) self.audioManager.playSound('button');
            if (self.onRestart) self.onRestart();
        });
        this._onClick('btn-main-menu-over', function() {
            if (self.audioManager) self.audioManager.playSound('button');
            if (self.onMainMenu) self.onMainMenu();
        });

        // Fire button (mobile)
        this._onClick('btn-fire', function() {
            // Handled by game
            if (self._onFireButton) self._onFireButton();
        });
    };

    UIManager.prototype._bindLevelButtons = function() {
        var self = this;
        var grid = document.getElementById('level-grid');
        if (!grid) return;
        var btns = grid.querySelectorAll('.level-btn:not(.locked)');
        for (var i = 0; i < btns.length; i++) {
            (function(btn) {
                btn.addEventListener('click', function() {
                    var id = parseInt(btn.dataset.levelId);
                    if (self.audioManager) self.audioManager.playSound('select');
                    if (self.onStartGame) self.onStartGame(id);
                });
            })(btns[i]);
        }
    };

    UIManager.prototype._onClick = function(id, fn) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('click', fn);
    };

    UIManager.prototype.showScreen = function(name) {
        // Hide all
        for (var i = 0; i < SCREENS.length; i++) {
            var el = document.getElementById(SCREENS[i]);
            if (el) el.style.display = 'none';
        }
        // Show target
        if (name) {
            var target = document.getElementById(name);
            if (target) target.style.display = 'flex';
        }
        this.currentScreen = name;

        // Show/hide HUD
        if (name === null) {
            // Playing state - show HUD
            this.hud.show();
        } else {
            this.hud.hide();
        }
    };

    UIManager.prototype.showHUD = function() {
        this.hud.show();
    };

    UIManager.prototype.hideHUD = function() {
        this.hud.hide();
    };

    UIManager.prototype.updateHUD = function(ammo, score, levelName, nextType) {
        this.hud.update(ammo, score, levelName, nextType);
    };

    UIManager.prototype.showLevelComplete = function(stars, score, levelId) {
        this.currentLevelId = levelId;
        this.menu.showLevelComplete(stars, score, levelId);
        this.showScreen('level-complete');
        this.hud.hide();
    };

    UIManager.prototype.showGameOver = function(score) {
        var scoreEl = document.querySelector('#game-over .result-score');
        if (scoreEl) scoreEl.textContent = 'Score: ' + score;
        this.showScreen('game-over');
        this.hud.hide();
    };

    UIManager.prototype.showPause = function() {
        var pauseEl = document.getElementById('pause-menu');
        if (pauseEl) pauseEl.style.display = 'flex';
    };

    UIManager.prototype.hidePause = function() {
        var pauseEl = document.getElementById('pause-menu');
        if (pauseEl) pauseEl.style.display = 'none';
    };

    UIManager.prototype.refreshLevelSelect = function() {
        this.menu.updateLevelSelect();
    };

    return UIManager;
})();
