// Save manager using localStorage
var SaveManager = (function() {
    var SAVE_KEY = 'crush_the_castle_save';
    var TOTAL_LEVELS = 5;

    function SaveManager() {
        this.data = this._load();
    }

    SaveManager.prototype._defaultData = function() {
        var levels = {};
        for (var i = 1; i <= TOTAL_LEVELS; i++) {
            levels[i] = {
                unlocked: i === 1,
                stars: 0,
                bestScore: 0,
                completed: false
            };
        }
        return {
            levels: levels,
            totalStars: 0,
            settings: {
                soundEnabled: true,
                volume: 0.7
            }
        };
    };

    SaveManager.prototype._load = function() {
        try {
            var raw = localStorage.getItem(SAVE_KEY);
            if (raw) {
                var data = JSON.parse(raw);
                // Merge with defaults to handle missing fields
                var def = this._defaultData();
                if (!data.levels) data.levels = def.levels;
                if (!data.settings) data.settings = def.settings;
                for (var i = 1; i <= TOTAL_LEVELS; i++) {
                    if (!data.levels[i]) data.levels[i] = def.levels[i];
                }
                return data;
            }
        } catch(e) {
            console.warn('Save load error:', e);
        }
        return this._defaultData();
    };

    SaveManager.prototype._persist = function() {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
        } catch(e) {
            console.warn('Save persist error:', e);
        }
    };

    SaveManager.prototype.getLevelData = function(id) {
        return this.data.levels[id] || null;
    };

    SaveManager.prototype.updateLevel = function(id, stars, score) {
        var level = this.data.levels[id];
        if (!level) return;

        var improved = false;
        if (stars > level.stars) {
            level.stars = stars;
            improved = true;
        }
        if (score > level.bestScore) {
            level.bestScore = score;
            improved = true;
        }
        level.completed = true;

        // Unlock next level
        if (id < TOTAL_LEVELS) {
            this.data.levels[id + 1].unlocked = true;
        }

        // Recalculate total stars
        var total = 0;
        for (var i = 1; i <= TOTAL_LEVELS; i++) {
            total += this.data.levels[i].stars || 0;
        }
        this.data.totalStars = total;

        this._persist();
        return improved;
    };

    SaveManager.prototype.isLevelUnlocked = function(id) {
        var level = this.data.levels[id];
        return level ? level.unlocked : false;
    };

    SaveManager.prototype.getTotalStars = function() {
        return this.data.totalStars || 0;
    };

    SaveManager.prototype.getSettings = function() {
        return this.data.settings || {};
    };

    SaveManager.prototype.updateSettings = function(settings) {
        this.data.settings = Object.assign(this.data.settings || {}, settings);
        this._persist();
    };

    SaveManager.prototype.resetAll = function() {
        this.data = this._defaultData();
        this._persist();
    };

    return SaveManager;
})();
