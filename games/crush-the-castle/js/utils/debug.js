// Debug utilities
var Debug = (function() {
    var showFPS = false;
    var showHitboxes = false;
    var frameCount = 0;
    var fps = 0;
    var lastFPSTime = 0;

    function update(timestamp) {
        frameCount++;
        if (timestamp - lastFPSTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            lastFPSTime = timestamp;
        }
    }

    function drawFPS(ctx) {
        if (!showFPS) return;
        ctx.save();
        ctx.fillStyle = 'lime';
        ctx.font = '14px monospace';
        ctx.fillText('FPS: ' + fps, 10, 20);
        ctx.restore();
    }

    function drawHitbox(ctx, body) {
        if (!showHitboxes) return;
        ctx.save();
        ctx.strokeStyle = 'lime';
        ctx.lineWidth = 1;
        ctx.strokeRect(body.x, body.y, body.width, body.height);
        ctx.restore();
    }

    function toggleFPS() { showFPS = !showFPS; }
    function toggleHitboxes() { showHitboxes = !showHitboxes; }
    function getFPS() { return fps; }
    function isShowingHitboxes() { return showHitboxes; }

    return {
        update: update,
        drawFPS: drawFPS,
        drawHitbox: drawHitbox,
        toggleFPS: toggleFPS,
        toggleHitboxes: toggleHitboxes,
        getFPS: getFPS,
        isShowingHitboxes: isShowingHitboxes,
        get showFPS() { return showFPS; },
        get showHitboxes() { return showHitboxes; }
    };
})();
