// Math utilities
var MathUtils = (function() {
    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function distance(x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function angleTo(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    function vecAdd(a, b) {
        return { x: a.x + b.x, y: a.y + b.y };
    }

    function vecScale(v, s) {
        return { x: v.x * s, y: v.y * s };
    }

    function vecNormalize(v) {
        var len = Math.sqrt(v.x * v.x + v.y * v.y);
        if (len === 0) return { x: 0, y: 0 };
        return { x: v.x / len, y: v.y / len };
    }

    function vecLength(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y);
    }

    function degToRad(deg) {
        return deg * Math.PI / 180;
    }

    function radToDeg(rad) {
        return rad * 180 / Math.PI;
    }

    return {
        clamp: clamp,
        lerp: lerp,
        distance: distance,
        angleTo: angleTo,
        vecAdd: vecAdd,
        vecScale: vecScale,
        vecNormalize: vecNormalize,
        vecLength: vecLength,
        degToRad: degToRad,
        radToDeg: radToDeg
    };
})();
