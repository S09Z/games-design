// HUD - heads up display
var HUD = (function() {
    function HUD() {
        this.ammoEl = document.getElementById('hud-ammo');
        this.scoreEl = document.getElementById('hud-score');
        this.levelNameEl = document.getElementById('hud-level-name');
        this.nextAmmoEl = document.getElementById('hud-next-ammo');
    }

    HUD.prototype.update = function(ammo, score, levelName, nextType) {
        if (this.scoreEl) this.scoreEl.textContent = 'Score: ' + score;
        if (this.levelNameEl) this.levelNameEl.textContent = levelName || '';
        if (this.ammoEl) {
            this.ammoEl.innerHTML = '';
            for (var i = 0; i < ammo; i++) {
                var icon = document.createElement('span');
                icon.className = 'ammo-icon';
                if (i === 0 && nextType) icon.classList.add('ammo-' + nextType);
                this.ammoEl.appendChild(icon);
            }
        }
        if (this.nextAmmoEl && nextType) {
            this.nextAmmoEl.textContent = nextType ? nextType.charAt(0).toUpperCase() + nextType.slice(1) : '';
        }
    };

    HUD.prototype.show = function() {
        var hud = document.getElementById('hud');
        if (hud) hud.style.display = 'flex';
    };

    HUD.prototype.hide = function() {
        var hud = document.getElementById('hud');
        if (hud) hud.style.display = 'none';
    };

    return HUD;
})();
