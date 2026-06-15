// Renderer
var Renderer = (function() {
    var GROUND_Y = 450;
    var WORLD_WIDTH = 800;
    var WORLD_HEIGHT = 500;

    function Renderer(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.explosions = []; // active explosion animations
    }

    Renderer.prototype.resize = function() {
        var winW = window.innerWidth;
        var winH = window.innerHeight;
        var scaleX = winW / WORLD_WIDTH;
        var scaleY = winH / WORLD_HEIGHT;
        this.scale = Math.min(scaleX, scaleY);
        this.canvas.width = Math.round(WORLD_WIDTH * this.scale);
        this.canvas.height = Math.round(WORLD_HEIGHT * this.scale);
        this.offsetX = (winW - this.canvas.width) / 2;
        this.offsetY = (winH - this.canvas.height) / 2;
        this.canvas.style.left = this.offsetX + 'px';
        this.canvas.style.top = this.offsetY + 'px';
    };

    Renderer.prototype.clear = function() {
        var ctx = this.ctx;
        var w = this.canvas.width;
        var h = this.canvas.height;
        ctx.save();
        ctx.scale(this.scale, this.scale);

        // Sky gradient
        var grad = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
        grad.addColorStop(0, '#5BA3C9');
        grad.addColorStop(1, '#C8E8F5');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
        ctx.restore();
    };

    Renderer.prototype.drawGround = function() {
        var ctx = this.ctx;
        ctx.save();
        ctx.scale(this.scale, this.scale);

        // Dirt below
        ctx.fillStyle = '#5C3D1E';
        ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, WORLD_HEIGHT - GROUND_Y);

        // Grass strip
        ctx.fillStyle = '#4A7C3F';
        ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 8);

        // Grass highlights
        ctx.fillStyle = '#5A9B4A';
        for (var i = 0; i < WORLD_WIDTH; i += 15) {
            ctx.fillRect(i, GROUND_Y, 8, 4);
        }

        ctx.restore();
    };

    Renderer.prototype.drawTrebuchet = function(x, y, angle) {
        var ctx = this.ctx;
        ctx.save();
        ctx.scale(this.scale, this.scale);

        var baseY = y;
        var armLength = 70;
        var pivotH = 60;
        var pivotX = x;
        var pivotY = baseY - pivotH;

        // Wheels
        ctx.fillStyle = '#5C3D1E';
        ctx.beginPath();
        ctx.arc(x - 22, baseY, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8B6914';
        ctx.beginPath();
        ctx.arc(x + 22, baseY, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x - 22, baseY, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + 22, baseY, 12, 0, Math.PI * 2);
        ctx.stroke();

        // Base frame
        ctx.fillStyle = '#6B4423';
        ctx.fillRect(x - 30, baseY - 15, 60, 15);
        ctx.strokeStyle = '#3A2510';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 30, baseY - 15, 60, 15);

        // Support legs
        ctx.strokeStyle = '#5C3D1E';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 20, baseY - 12);
        ctx.lineTo(pivotX - 5, pivotY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 20, baseY - 12);
        ctx.lineTo(pivotX + 5, pivotY);
        ctx.stroke();

        // Arm
        ctx.save();
        ctx.translate(pivotX, pivotY);
        ctx.rotate(angle);

        // Long arm (projectile side)
        ctx.strokeStyle = '#5C3D1E';
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(armLength, 0);
        ctx.stroke();

        // Short arm (counterweight side)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-armLength * 0.4, 0);
        ctx.stroke();

        // Counterweight
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(-armLength * 0.4, 8, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Sling at end of long arm
        ctx.strokeStyle = '#8B6914';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(armLength, 0);
        ctx.lineTo(armLength + 10, 10);
        ctx.stroke();

        ctx.restore();

        // Pivot pin
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    };

    Renderer.prototype.drawBody = function(body) {
        if (body.isDead) return;
        var ctx = this.ctx;
        ctx.save();
        ctx.scale(this.scale, this.scale);

        var cx = body.x + body.width / 2;
        var cy = body.y + body.height / 2;

        ctx.translate(cx, cy);
        if (body.angle) ctx.rotate(body.angle);
        ctx.translate(-body.width / 2, -body.height / 2);

        // Health-based alpha/color shift
        var healthRatio = body.health / body.maxHealth;

        ctx.fillStyle = body.color;
        ctx.fillRect(0, 0, body.width, body.height);

        // Draw cracks based on damage
        if (healthRatio < 0.7) {
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(body.width * 0.2, body.height * 0.1);
            ctx.lineTo(body.width * 0.4, body.height * 0.5);
            ctx.lineTo(body.width * 0.3, body.height * 0.9);
            ctx.stroke();
        }
        if (healthRatio < 0.4) {
            ctx.beginPath();
            ctx.moveTo(body.width * 0.7, body.height * 0.1);
            ctx.lineTo(body.width * 0.5, body.height * 0.4);
            ctx.lineTo(body.width * 0.8, body.height * 0.8);
            ctx.stroke();
        }

        // Damage tint
        if (healthRatio < 0.5) {
            ctx.fillStyle = 'rgba(200,0,0,' + (0.3 * (1 - healthRatio)) + ')';
            ctx.fillRect(0, 0, body.width, body.height);
        }

        ctx.strokeStyle = body.strokeColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(0, 0, body.width, body.height);

        // Wood grain for wood
        if (body.material === 'wood' || body.material === 'wood_plank') {
            ctx.strokeStyle = 'rgba(100,60,0,0.3)';
            ctx.lineWidth = 1;
            if (body.width > body.height) {
                // Horizontal plank - draw grain lines
                for (var g = 4; g < body.height; g += 8) {
                    ctx.beginPath();
                    ctx.moveTo(0, g);
                    ctx.lineTo(body.width, g);
                    ctx.stroke();
                }
            } else {
                for (var g = 4; g < body.width; g += 8) {
                    ctx.beginPath();
                    ctx.moveTo(g, 0);
                    ctx.lineTo(g, body.height);
                    ctx.stroke();
                }
            }
        }

        if (Debug.showHitboxes) {
            ctx.strokeStyle = 'lime';
            ctx.lineWidth = 1;
            ctx.strokeRect(0, 0, body.width, body.height);
        }

        ctx.restore();
    };

    Renderer.prototype.drawProjectile = function(body) {
        if (body.isDead) return;
        var ctx = this.ctx;
        var cx = body.getCenterX();
        var cy = body.getCenterY();
        var r = body.width / 2;

        ctx.save();
        ctx.scale(this.scale, this.scale);

        if (body.projectileType === 'rock') {
            // Rock - irregular gray circle
            var grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
            grad.addColorStop(0, '#999999');
            grad.addColorStop(1, '#333333');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        } else if (body.projectileType === 'explosive') {
            // Red bomb with fuse
            var grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
            grad.addColorStop(0, '#FF4444');
            grad.addColorStop(1, '#880000');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#440000';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            // Fuse
            ctx.strokeStyle = '#FFAA00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx + r * 0.5, cy - r * 0.7);
            ctx.quadraticCurveTo(cx + r * 0.8, cy - r * 1.2, cx + r * 0.3, cy - r * 1.5);
            ctx.stroke();
            // Spark
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(cx + r * 0.3, cy - r * 1.5, 3, 0, Math.PI * 2);
            ctx.fill();
            // !
            ctx.fillStyle = 'white';
            ctx.font = 'bold ' + Math.round(r) + 'px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('!', cx, cy);
        } else if (body.projectileType === 'ice') {
            // Ice ball
            var grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
            grad.addColorStop(0, '#FFFFFF');
            grad.addColorStop(0.5, '#AEE4FF');
            grad.addColorStop(1, '#4499CC');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#3388BB';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            // Glint
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath();
            ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.25, 0, Math.PI * 2);
            ctx.fill();
        }

        if (Debug.showHitboxes) {
            ctx.strokeStyle = 'lime';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    };

    Renderer.prototype.drawEnemy = function(enemy) {
        if (enemy.isDead) return;
        var ctx = this.ctx;
        var x = enemy.x + enemy.width / 2;
        var y = enemy.y + enemy.height / 2;

        ctx.save();
        ctx.scale(this.scale, this.scale);

        // Bounce animation
        var healthRatio = enemy.health / enemy.maxHealth;

        // Body (red tunic)
        ctx.fillStyle = '#CC0000';
        ctx.fillRect(x - 8, y - 2, 16, 14);
        ctx.strokeStyle = '#880000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 8, y - 2, 16, 14);

        // Arms
        ctx.fillStyle = '#CC0000';
        ctx.fillRect(x - 14, y, 6, 10);
        ctx.fillRect(x + 8, y, 6, 10);

        // Helmet (dark gray)
        ctx.fillStyle = '#555555';
        ctx.beginPath();
        ctx.arc(x, y - 8, 9, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(x - 9, y - 8, 18, 5);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y - 8, 9, Math.PI, 0);
        ctx.stroke();

        // Face
        ctx.fillStyle = '#F4C07A';
        ctx.beginPath();
        ctx.arc(x, y - 6, 7, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(x - 3, y - 7, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 3, y - 7, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.fillStyle = '#555';
        ctx.fillRect(x - 7, y + 12, 6, 10);
        ctx.fillRect(x + 1, y + 12, 6, 10);

        // Shield
        ctx.fillStyle = '#8B6914';
        ctx.beginPath();
        ctx.moveTo(x - 18, y + 2);
        ctx.lineTo(x - 10, y - 4);
        ctx.lineTo(x - 10, y + 14);
        ctx.lineTo(x - 18, y + 10);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#5C3D1E';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Damage indicator
        if (healthRatio < 0.5) {
            ctx.fillStyle = 'rgba(255,0,0,0.3)';
            ctx.beginPath();
            ctx.arc(x, y, 12, 0, Math.PI * 2);
            ctx.fill();
        }

        // Health bar
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x - 12, y - 22, 24, 4);
        ctx.fillStyle = healthRatio > 0.5 ? '#00CC00' : '#CC4400';
        ctx.fillRect(x - 12, y - 22, 24 * healthRatio, 4);

        ctx.restore();
    };

    Renderer.prototype.drawAimLine = function(startX, startY, angle, power, projectileType) {
        var ctx = this.ctx;
        ctx.save();
        ctx.scale(this.scale, this.scale);

        var speed = power * 650;
        var vx = Math.cos(angle) * speed;
        var vy = Math.sin(angle) * speed;
        var x = startX;
        var y = startY;
        var dt = 0.05;
        var steps = 30;

        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);

        for (var i = 0; i < steps; i++) {
            vy += 500 * dt;
            x += vx * dt;
            y += vy * dt;
            if (y > 450) break;
            ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Dots along trajectory
        x = startX;
        y = startY;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
        ctx.setLineDash([]);

        var dotColor = '#FFFFFF';
        if (projectileType === 'explosive') dotColor = '#FF6600';
        else if (projectileType === 'ice') dotColor = '#AEE4FF';

        for (var i = 0; i < 8; i++) {
            vy += 500 * dt * 3;
            x += vx * dt * 3;
            y += vy * dt * 3;
            if (y > 450) break;
            ctx.fillStyle = dotColor;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    };

    Renderer.prototype.addExplosion = function(x, y, radius) {
        this.explosions.push({ x: x, y: y, radius: radius, life: 0.5, maxLife: 0.5 });
    };

    Renderer.prototype.drawExplosions = function(dt) {
        var ctx = this.ctx;
        ctx.save();
        ctx.scale(this.scale, this.scale);

        for (var i = this.explosions.length - 1; i >= 0; i--) {
            var exp = this.explosions[i];
            exp.life -= dt;
            var t = 1 - (exp.life / exp.maxLife);
            var alpha = 1 - t;
            var r = exp.radius * (0.3 + t * 0.7);

            var grad = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, r);
            grad.addColorStop(0, 'rgba(255,255,200,' + alpha + ')');
            grad.addColorStop(0.3, 'rgba(255,140,0,' + alpha * 0.8 + ')');
            grad.addColorStop(0.7, 'rgba(255,60,0,' + alpha * 0.4 + ')');
            grad.addColorStop(1, 'rgba(100,0,0,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, r, 0, Math.PI * 2);
            ctx.fill();

            if (exp.life <= 0) {
                this.explosions.splice(i, 1);
            }
        }
        ctx.restore();
    };

    Renderer.prototype.drawBackground = function() {
        var ctx = this.ctx;
        ctx.save();
        ctx.scale(this.scale, this.scale);

        // Distant mountains
        ctx.fillStyle = 'rgba(100,130,160,0.4)';
        ctx.beginPath();
        ctx.moveTo(0, 350);
        ctx.lineTo(100, 250);
        ctx.lineTo(200, 320);
        ctx.lineTo(300, 200);
        ctx.lineTo(400, 280);
        ctx.lineTo(500, 230);
        ctx.lineTo(600, 300);
        ctx.lineTo(700, 240);
        ctx.lineTo(800, 310);
        ctx.lineTo(800, 450);
        ctx.lineTo(0, 450);
        ctx.fill();

        // Trees on left
        for (var tx = 200; tx < 420; tx += 40) {
            var th = 30 + Math.sin(tx * 0.1) * 10;
            ctx.fillStyle = '#2D5A1E';
            ctx.beginPath();
            ctx.moveTo(tx, GROUND_Y);
            ctx.lineTo(tx - 12, GROUND_Y - th * 0.6);
            ctx.lineTo(tx + 12, GROUND_Y - th * 0.6);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(tx, GROUND_Y - th * 0.5);
            ctx.lineTo(tx - 9, GROUND_Y - th);
            ctx.lineTo(tx + 9, GROUND_Y - th);
            ctx.closePath();
            ctx.fill();
        }

        // Clouds
        this._drawCloud(ctx, 150, 60, 0.8);
        this._drawCloud(ctx, 400, 40, 1.1);
        this._drawCloud(ctx, 650, 80, 0.7);

        ctx.restore();
    };

    Renderer.prototype._drawCloud = function(ctx, x, y, scale) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.arc(0, 0, 25, 0, Math.PI * 2);
        ctx.arc(30, -5, 20, 0, Math.PI * 2);
        ctx.arc(-25, 5, 18, 0, Math.PI * 2);
        ctx.arc(15, 10, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    var GROUND_Y_local = GROUND_Y;

    return Renderer;
})();
