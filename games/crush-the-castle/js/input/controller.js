// Input controller
var InputController = (function() {
    var TREBUCHET_X = 120;
    var TREBUCHET_Y = 450; // ground level

    function InputController(canvas, renderer) {
        this.canvas = canvas;
        this.renderer = renderer;
        this.isAiming = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.worldMouseX = 0;
        this.worldMouseY = 0;
        this.angle = -Math.PI / 4; // default angle
        this.power = 0.7;
        this.onFire = null;
        this.onPause = null;
        this.trebuchetX = TREBUCHET_X;
        this.trebuchetY = TREBUCHET_Y - 80; // pivot height
        this.enabled = true;
        this.keys = {};

        this._bindEvents();
    }

    InputController.prototype._getCanvasPos = function(e) {
        var rect = this.canvas.getBoundingClientRect();
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var clientY = e.touches ? e.touches[0].clientY : e.clientY;
        var sx = clientX - rect.left;
        var sy = clientY - rect.top;
        // Convert screen to world
        var wx = sx / this.renderer.scale;
        var wy = sy / this.renderer.scale;
        return { sx: sx, sy: sy, wx: wx, wy: wy };
    };

    InputController.prototype._onMouseDown = function(e) {
        if (!this.enabled) return;
        e.preventDefault();
        var pos = this._getCanvasPos(e);
        this.mouseX = pos.sx;
        this.mouseY = pos.sy;
        this.worldMouseX = pos.wx;
        this.worldMouseY = pos.wy;
        this.isAiming = true;
        this._updateAim(pos);
    };

    InputController.prototype._onMouseMove = function(e) {
        if (!this.enabled) return;
        e.preventDefault();
        if (!this.isAiming) return;
        var pos = this._getCanvasPos(e);
        this.mouseX = pos.sx;
        this.mouseY = pos.sy;
        this.worldMouseX = pos.wx;
        this.worldMouseY = pos.wy;
        this._updateAim(pos);
    };

    InputController.prototype._onMouseUp = function(e) {
        if (!this.enabled) return;
        e.preventDefault();
        if (this.isAiming) {
            this.isAiming = false;
            if (this.onFire) {
                this.onFire(this.angle, this.power);
            }
        }
    };

    InputController.prototype._updateAim = function(pos) {
        var dx = pos.wx - this.trebuchetX;
        var dy = pos.wy - this.trebuchetY;
        var rawAngle = Math.atan2(dy, dx);

        // Clamp angle to valid firing range (above ground, rightward)
        this.angle = MathUtils.clamp(rawAngle, -Math.PI * 0.8, -0.05);

        // Power based on distance from trebuchet (clamped)
        var dist = MathUtils.distance(pos.wx, pos.wy, this.trebuchetX, this.trebuchetY);
        this.power = MathUtils.clamp(dist / 200, 0.2, 1.0);
    };

    InputController.prototype._onKeyDown = function(e) {
        this.keys[e.code] = true;
        if (e.code === 'Escape' && this.onPause) {
            this.onPause();
        }
        if (e.code === 'Space' && this.enabled) {
            e.preventDefault();
            if (this.onFire) {
                this.onFire(this.angle, this.power);
            }
        }
        if (e.code === 'KeyF') {
            Debug.toggleFPS();
        }
        if (e.code === 'KeyH') {
            Debug.toggleHitboxes();
        }
    };

    InputController.prototype._onKeyUp = function(e) {
        this.keys[e.code] = false;
    };

    InputController.prototype._bindEvents = function() {
        var self = this;
        this.canvas.addEventListener('mousedown', function(e) { self._onMouseDown(e); });
        this.canvas.addEventListener('mousemove', function(e) { self._onMouseMove(e); });
        this.canvas.addEventListener('mouseup', function(e) { self._onMouseUp(e); });
        this.canvas.addEventListener('touchstart', function(e) { self._onMouseDown(e); }, { passive: false });
        this.canvas.addEventListener('touchmove', function(e) { self._onMouseMove(e); }, { passive: false });
        this.canvas.addEventListener('touchend', function(e) { self._onMouseUp(e); }, { passive: false });
        document.addEventListener('keydown', function(e) { self._onKeyDown(e); });
        document.addEventListener('keyup', function(e) { self._onKeyUp(e); });
    };

    InputController.prototype.enable = function() { this.enabled = true; };
    InputController.prototype.disable = function() { this.enabled = false; this.isAiming = false; };
    InputController.prototype.setTrebuchetPos = function(x, y) {
        this.trebuchetX = x;
        this.trebuchetY = y;
    };

    return InputController;
})();
