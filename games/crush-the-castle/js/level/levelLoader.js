// Level loader - fetches and parses level JSON files
var LevelLoader = (function() {
    var cache = {};

    function LevelLoader() {}

    LevelLoader.prototype.loadLevelFile = function(id, callback) {
        if (cache[id]) {
            callback(null, cache[id]);
            return;
        }
        var url = 'assets/levels/level' + id + '.json';
        fetch(url)
            .then(function(resp) {
                if (!resp.ok) throw new Error('Failed to load level ' + id);
                return resp.json();
            })
            .then(function(data) {
                cache[id] = data;
                callback(null, data);
            })
            .catch(function(err) {
                console.error('LevelLoader error:', err);
                callback(err, null);
            });
    };

    LevelLoader.prototype.preloadAll = function(count, onComplete) {
        var loaded = 0;
        var errors = 0;
        var self = this;
        for (var i = 1; i <= count; i++) {
            (function(id) {
                self.loadLevelFile(id, function(err) {
                    if (err) errors++;
                    loaded++;
                    if (loaded === count && onComplete) onComplete(errors);
                });
            })(i);
        }
    };

    LevelLoader.prototype.getCached = function(id) {
        return cache[id] || null;
    };

    return LevelLoader;
})();
