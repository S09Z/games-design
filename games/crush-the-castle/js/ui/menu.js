// Menu system
var Menu = (function() {
    function Menu(saveManager) {
        this.saveManager = saveManager;
    }

    Menu.prototype.renderLevelSelect = function() {
        var grid = document.getElementById('level-grid');
        if (!grid) return;
        grid.innerHTML = '';
        for (var i = 1; i <= 5; i++) {
            this._createLevelButton(grid, i);
        }
    };

    Menu.prototype._createLevelButton = function(container, id) {
        var levelNames = {
            1: 'The First Castle',
            2: 'Stone Tower',
            3: 'Wooden Fortress',
            4: 'Mixed Structures',
            5: 'Challenge Tower'
        };
        var levelDiffs = {
            1: 'Tutorial',
            2: 'Easy',
            3: 'Easy',
            4: 'Medium',
            5: 'Medium'
        };

        var data = this.saveManager.getLevelData(id);
        var unlocked = data && data.unlocked;
        var stars = (data && data.stars) || 0;
        var bestScore = (data && data.bestScore) || 0;

        var btn = document.createElement('div');
        btn.className = 'level-btn' + (unlocked ? '' : ' locked');
        btn.dataset.levelId = id;

        var starsHtml = '';
        for (var s = 1; s <= 3; s++) {
            starsHtml += '<span class="star ' + (s <= stars ? 'earned' : 'empty') + '">&#9733;</span>';
        }

        btn.innerHTML =
            '<div class="level-num">' + id + '</div>' +
            '<div class="level-name">' + levelNames[id] + '</div>' +
            '<div class="level-diff">' + levelDiffs[id] + '</div>' +
            '<div class="level-stars">' + starsHtml + '</div>' +
            (bestScore > 0 ? '<div class="level-score">Best: ' + bestScore + '</div>' : '') +
            (unlocked ? '' : '<div class="lock-icon">&#128274;</div>');

        return btn;
    };

    Menu.prototype.updateLevelSelect = function() {
        this.renderLevelSelect();
    };

    Menu.prototype.showLevelComplete = function(stars, score, levelId) {
        var el = document.getElementById('level-complete');
        if (!el) return;

        var starsEl = el.querySelector('.result-stars');
        if (starsEl) {
            starsEl.innerHTML = '';
            for (var s = 1; s <= 3; s++) {
                var span = document.createElement('span');
                span.className = 'star-big ' + (s <= stars ? 'earned' : 'empty');
                span.innerHTML = '&#9733;';
                starsEl.appendChild(span);
            }
        }

        var scoreEl = el.querySelector('.result-score');
        if (scoreEl) scoreEl.textContent = 'Score: ' + score;

        var nextBtn = el.querySelector('#btn-next-level');
        if (nextBtn) {
            nextBtn.style.display = levelId < 5 ? 'block' : 'none';
        }
    };

    return Menu;
})();
