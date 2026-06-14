// Camera
var Camera = (function() {
    function Camera(canvas) {
        this.canvas = canvas;
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.following = null;
        this.defaultX = 0;
        this.defaultY = 0;
        this.smoothing = 0.1;
    }

    Camera.prototype.follow = function(body) {
        this.following = body;
    };

    Camera.prototype.stopFollowing = function() {
        this.following = null;
    };

    Camera.prototype.reset = function() {
        this.following = null;
        this.targetX = this.defaultX;
        this.targetY = this.defaultY;
    };

    Camera.prototype.update = function() {
        if (this.following && !this.following.isDead) {
            // Center camera on projectile, offset so we can see impact area
            var cx = this.following.getCenterX() - this.canvas.width / 2;
            var cy = this.following.getCenterY() - this.canvas.height / 2;
            // Clamp camera so we don't scroll too far
            this.targetX = MathUtils.clamp(cx, 0, 200);
            this.targetY = MathUtils.clamp(cy, -100, 50);
        } else {
            this.targetX = this.defaultX;
            this.targetY = this.defaultY;
        }
        // Smooth camera movement
        this.x = MathUtils.lerp(this.x, this.targetX, this.smoothing);
        this.y = MathUtils.lerp(this.y, this.targetY, this.smoothing);
    };

    Camera.prototype.worldToScreen = function(wx, wy) {
        return { x: wx - this.x, y: wy - this.y };
    };

    Camera.prototype.screenToWorld = function(sx, sy) {
        return { x: sx + this.x, y: sy + this.y };
    };

    Camera.prototype.apply = function(ctx) {
        ctx.translate(-Math.round(this.x), -Math.round(this.y));
    };

    Camera.prototype.restore = function(ctx) {
        ctx.translate(Math.round(this.x), Math.round(this.y));
    };

    return Camera;
})();
