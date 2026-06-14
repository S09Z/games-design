// Particle system
var ParticleSystem = (function() {
    function Particle() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.maxLife = 1;
        this.color = '#888888';
        this.size = 4;
        this.gravity = 300;
        this.active = false;
    }

    var particlePool = new ObjectPool(
        function() { return new Particle(); },
        function(p) { p.active = false; },
        100
    );

    function ParticleSystem() {
        this.particles = [];
    }

    ParticleSystem.prototype.spawn = function(x, y, count, color, speed, gravity) {
        count = count || 6;
        color = color || '#888888';
        speed = speed || 150;
        gravity = gravity !== undefined ? gravity : 300;

        for (var i = 0; i < count; i++) {
            var p = particlePool.get();
            p.x = x + (Math.random() - 0.5) * 10;
            p.y = y + (Math.random() - 0.5) * 10;
            var angle = Math.random() * Math.PI * 2;
            var s = (0.3 + Math.random() * 0.7) * speed;
            p.vx = Math.cos(angle) * s;
            p.vy = Math.sin(angle) * s - speed * 0.3;
            p.life = 0.5 + Math.random() * 0.8;
            p.maxLife = p.life;
            p.color = color;
            p.size = 2 + Math.random() * 5;
            p.gravity = gravity;
            p.active = true;
            this.particles.push(p);
        }
    };

    ParticleSystem.prototype.spawnDebris = function(x, y, material) {
        var color = '#888888';
        var count = 8;
        if (material === 'stone') { color = '#888888'; }
        else if (material === 'wood' || material === 'wood_plank') { color = '#C19A6B'; count = 6; }
        else if (material === 'ice') { color = '#AEE4FF'; count = 10; }
        else if (material === 'enemy') { color = '#CC0000'; count = 5; }
        this.spawn(x, y, count, color, 180, 350);
    };

    ParticleSystem.prototype.spawnExplosion = function(x, y) {
        this.spawn(x, y, 20, '#FF6600', 300, 200);
        this.spawn(x, y, 15, '#FFAA00', 250, 200);
        this.spawn(x, y, 10, '#FF0000', 200, 250);
    };

    ParticleSystem.prototype.update = function(dt) {
        for (var i = this.particles.length - 1; i >= 0; i--) {
            var p = this.particles[i];
            p.vy += p.gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;

            // Ground
            if (p.y > 450) {
                p.y = 450;
                p.vy *= -0.3;
                p.vx *= 0.7;
            }

            if (p.life <= 0) {
                particlePool.release(p);
                this.particles.splice(i, 1);
            }
        }
    };

    ParticleSystem.prototype.draw = function(ctx) {
        for (var i = 0; i < this.particles.length; i++) {
            var p = this.particles[i];
            var alpha = MathUtils.clamp(p.life / p.maxLife, 0, 1);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            var s = p.size * alpha;
            ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
            ctx.restore();
        }
    };

    ParticleSystem.prototype.clear = function() {
        for (var i = 0; i < this.particles.length; i++) {
            particlePool.release(this.particles[i]);
        }
        this.particles = [];
    };

    return ParticleSystem;
})();
