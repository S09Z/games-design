// Object pool for particle reuse
var ObjectPool = (function() {
    function Pool(createFn, resetFn, initialSize) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.available = [];
        this.inUse = [];

        for (var i = 0; i < (initialSize || 0); i++) {
            this.available.push(this.createFn());
        }
    }

    Pool.prototype.get = function() {
        var obj;
        if (this.available.length > 0) {
            obj = this.available.pop();
        } else {
            obj = this.createFn();
        }
        this.inUse.push(obj);
        return obj;
    };

    Pool.prototype.release = function(obj) {
        var idx = this.inUse.indexOf(obj);
        if (idx !== -1) {
            this.inUse.splice(idx, 1);
            if (this.resetFn) this.resetFn(obj);
            this.available.push(obj);
        }
    };

    Pool.prototype.releaseAll = function() {
        while (this.inUse.length > 0) {
            var obj = this.inUse.pop();
            if (this.resetFn) this.resetFn(obj);
            this.available.push(obj);
        }
    };

    Pool.prototype.getInUse = function() {
        return this.inUse;
    };

    return Pool;
})();
