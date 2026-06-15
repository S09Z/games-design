// Main game controller
var Game = (function() {
    var STATES = {
        MENU: 'MENU',
        LEVEL_SELECT: 'LEVEL_SELECT',
        PLAYING: 'PLAYING',
        PAUSED: 'PAUSED',
        LEVEL_COMPLETE: 'LEVEL_COMPLETE',
        GAME_OVER: 'GAME_OVER'
    };

    var TREBUCHET_X = 120;
    var GROUND_Y = 450;
    var FIXED_DT = 1 / 60;

    function Game() {
        this.state = STATES.MENU;
        this.canvas = document.getElementById('game-canvas');
        this.accumulator = 0;
        this.lastTime = 0;
        this.running = false;
        this.currentLevelId = 1;
        this.rafId = null;

        // Modules
        this.renderer = new Renderer(this.canvas);
        this.camera = new Camera(this.canvas);
        this.particles = new ParticleSystem();
        this.physics = new PhysicsEngine();
        this.saveManager = new SaveManager();
        this.audioManager = new AudioManager();
        this.levelLoader = new LevelLoader();
        this.levelManager = new LevelManager(this.physics, this.saveManager);
        this.ui = new UIManager(this.saveManager, this.audioManager);
        this.input = new InputController(this.canvas, this.renderer);

        this._setupCallbacks();
        this._setupInput();
        this._resize();

        window.addEventListener('resize', this._resize.bind(this));
    }

    Game.prototype._resize = function() {
        this.renderer.resize();
    };

    Game.prototype._setupCallbacks = function() {
        var self = this;

        this.levelManager.onScoreChange = function(score) {
            self.ui.updateHUD(
                self.levelManager.ammoLeft,
                score,
                self.levelManager.currentLevelData ? self.levelManager.currentLevelData.name : '',
                self.levelManager.getCurrentProjectileType()
            );
        };
        this.levelManager.onAmmoChange = function(ammo, nextType) {
            self.ui.updateHUD(
                ammo,
                self.levelManager.score,
                self.levelManager.currentLevelData ? self.levelManager.currentLevelData.name : '',
                nextType
            );
        };
        this.levelManager.onEnemyDied = function(enemy) {
            self.audioManager.playSound('enemy_die');
            self.particles.spawnDebris(enemy.getCenterX(), enemy.getCenterY(), 'enemy');
        };
        this.levelManager.onStructureDestroyed = function(body) {
            self.particles.spawnDebris(body.getCenterX(), body.getCenterY(), body.material);
        };
        this.levelManager.onLevelWon = function(stars, score) {
            self.audioManager.playSound('win');
            self.state = STATES.LEVEL_COMPLETE;
            setTimeout(function() {
                self.ui.showLevelComplete(stars, score, self.currentLevelId);
                Analytics.track('level_complete', {
                    level: self.currentLevelId,
                    stars: stars,
                    score: score
                });
            }, 1500);
        };
        this.levelManager.onLevelLost = function() {
            self.audioManager.playSound('lose');
            self.state = STATES.GAME_OVER;
            setTimeout(function() {
                self.ui.showGameOver(self.levelManager.score);
                Analytics.track('level_failed', { level: self.currentLevelId });
            }, 1000);
        };

        this.ui.onStartGame = function(levelId) {
            self.startLevel(levelId);
        };
        this.ui.onResume = function() {
            self.resume();
        };
        this.ui.onRestart = function() {
            self.restartLevel();
        };
        this.ui.onMainMenu = function() {
            self.goToMainMenu();
        };
        this.ui.onNextLevel = function(levelId) {
            self.startLevel(levelId);
        };
        this.ui._onFireButton = function() {
            if (self.state === STATES.PLAYING && self.input.enabled) {
                self._doFire(self.input.angle, self.input.power);
            }
        };
    };

    Game.prototype._setupInput = function() {
        var self = this;
        this.input.onFire = function(angle, power) {
            if (self.state !== STATES.PLAYING) return;
            self._doFire(angle, power);
        };
        this.input.onPause = function() {
            if (self.state === STATES.PLAYING) self.pause();
            else if (self.state === STATES.PAUSED) self.resume();
        };
    };

    Game.prototype._doFire = function(angle, power) {
        // If explosive is in flight, second click detonates
        if (this.levelManager.activeProjectile &&
            this.levelManager.activeProjectile.projectileType === 'explosive') {
            var exp = this.levelManager.tryDetonateProjectile();
            if (exp) {
                this._handleExplosion(exp.x, exp.y, exp.radius, exp.events);
                return;
            }
        }
        var result = this.levelManager.fire(angle, power);
        if (result) {
            this._onProjectileFired(result);
        }
    };

    Game.prototype._onProjectileFired = function(projectile) {
        this.audioManager.playSound('fire');
        this.camera.follow(projectile);
        this.particles.spawn(
            projectile.getCenterX(),
            projectile.getCenterY(),
            8, '#AAAAAA', 100, 200
        );
    };

    Game.prototype._handleExplosion = function(x, y, radius, events) {
        this.audioManager.playSound('explosion');
        this.renderer.addExplosion(x, y, radius);
        this.particles.spawnExplosion(x, y);
        this.camera.stopFollowing();

        if (events) {
            for (var i = 0; i < events.length; i++) {
                var ev = events[i];
                if (ev.justDied && ev.body && !ev.body.isProjectile && !ev.body.isEnemy) {
                    this.particles.spawnDebris(ev.body.getCenterX(), ev.body.getCenterY(), ev.body.material);
                }
            }
        }
    };

    Game.prototype.start = function() {
        this.running = true;
        this.ui.showScreen('main-menu');
        Analytics.track('game_start');
        this._loop(0);
    };

    Game.prototype._loop = function(timestamp) {
        var self = this;
        this.rafId = requestAnimationFrame(function(ts) { self._loop(ts); });

        var dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
        this.lastTime = timestamp;

        Debug.update(timestamp);

        if (this.state === STATES.PLAYING) {
            this.accumulator += dt;
            var collisionEvents = [];
            while (this.accumulator >= FIXED_DT) {
                var evts = this.physics.update(FIXED_DT);
                collisionEvents = collisionEvents.concat(evts);
                this.accumulator -= FIXED_DT;
            }

            this._processCollisionAudio(collisionEvents);
            this._processCollisionParticles(collisionEvents);
            this._processExplosions(collisionEvents);
            this.levelManager.update(dt, collisionEvents);
            this.particles.update(dt);
            this.camera.update();
        }

        this._render(dt);
    };

    Game.prototype._processCollisionAudio = function(events) {
        var played = false;
        for (var i = 0; i < events.length; i++) {
            var ev = events[i];
            if (played) break;
            if (ev.speed > 80) {
                var mat = (ev.b && ev.b.material) || (ev.body && ev.body.material) || 'stone';
                if (mat === 'stone') this.audioManager.playSound('impact_stone');
                else if (mat === 'wood' || mat === 'wood_plank') this.audioManager.playSound('impact_wood');
                else this.audioManager.playSound('impact');
                played = true;
            }
        }
    };

    Game.prototype._processCollisionParticles = function(events) {
        for (var i = 0; i < events.length; i++) {
            var ev = events[i];
            if (ev.speed > 60) {
                var mat = 'stone';
                if (ev.b && ev.b.material) mat = ev.b.material;
                else if (ev.body && ev.body.material) mat = ev.body.material;
                this.particles.spawn(ev.x, ev.y, 3, null, 80, 300);
            }
        }
    };

    Game.prototype._processExplosions = function(events) {
        for (var i = 0; i < events.length; i++) {
            var ev = events[i];
            if (ev.type === 'ground' && ev.body && ev.body.isProjectile &&
                ev.body.projectileType === 'explosive' && !ev.body.hasExploded) {
                var exp = this.levelManager._detonate(ev.body);
                if (exp) {
                    this._handleExplosion(exp.x, exp.y, exp.radius, exp.events);
                }
            }
        }
    };

    Game.prototype._render = function(dt) {
        var ctx = this.renderer.ctx;
        var scale = this.renderer.scale;
        var camX = Math.round(this.camera.x);
        var camY = Math.round(this.camera.y);

        var isGameActive = (
            this.state === STATES.PLAYING ||
            this.state === STATES.PAUSED ||
            this.state === STATES.LEVEL_COMPLETE ||
            this.state === STATES.GAME_OVER
        );

        // Background layer (no camera transform, handled internally)
        this.renderer.clear();
        this.renderer.drawBackground();
        this.renderer.drawGround();

        // World layer - apply scale + camera offset
        ctx.save();
        ctx.scale(scale, scale);
        ctx.translate(-camX, -camY);

        if (isGameActive) {
            // Aim line
            if (this.state === STATES.PLAYING && this.input.isAiming &&
                !this.levelManager.activeProjectile) {
                var pivotX = TREBUCHET_X;
                var pivotY = GROUND_Y - 60;
                var armLen = 70;
                var tipX = pivotX + Math.cos(this.input.angle) * armLen;
                var tipY = pivotY + Math.sin(this.input.angle) * armLen;
                // Draw aim line directly (not via renderer since scale already applied)
                this._drawAimLineDirect(ctx, tipX, tipY, this.input.angle, this.input.power,
                    this.levelManager.getCurrentProjectileType());
            }

            // Structures
            for (var i = 0; i < this.levelManager.structures.length; i++) {
                this._drawBodyDirect(ctx, this.levelManager.structures[i]);
            }

            // Enemies
            for (var i = 0; i < this.levelManager.enemies.length; i++) {
                var enemy = this.levelManager.enemies[i];
                if (!enemy.isDead) this._drawEnemyDirect(ctx, enemy);
            }

            // Projectiles
            for (var i = 0; i < this.levelManager.projectiles.length; i++) {
                this._drawProjectileDirect(ctx, this.levelManager.projectiles[i]);
            }

            // Particles
            this._drawParticlesDirect(ctx);
        }

        // Trebuchet angle
        var trebAngle;
        if (isGameActive && this.input.isAiming && !this.levelManager.activeProjectile) {
            trebAngle = this.input.angle;
        } else if (isGameActive && this.levelManager.activeProjectile) {
            trebAngle = Math.PI * 0.3;
        } else {
            trebAngle = -Math.PI / 3;
        }

        this._drawTrebuchetDirect(ctx, TREBUCHET_X, GROUND_Y, trebAngle);

        ctx.restore();

        // Explosions (world space with camera, drawn directly)
        if (isGameActive) {
            ctx.save();
            ctx.scale(scale, scale);
            ctx.translate(-camX, -camY);
            this._drawExplosionsDirect(ctx, dt);
            ctx.restore();
        }

        // FPS
        if (Debug.showFPS) {
            ctx.save();
            ctx.fillStyle = 'lime';
            ctx.font = Math.round(14 * scale) + 'px monospace';
            ctx.fillText('FPS: ' + Debug.getFPS(), 10, 20 * scale);
            ctx.restore();
        }
    };

    // Direct draw methods (called with ctx already scaled + camera-offset)
    Game.prototype._drawAimLineDirect = function(ctx, startX, startY, angle, power, projectileType) {
        var speed = power * 650;
        var vx = Math.cos(angle) * speed;
        var vy = Math.sin(angle) * speed;
        var x = startX, y = startY;
        var dt = 0.05;

        ctx.save();
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (var i = 0; i < 30; i++) {
            vy += 500 * dt;
            x += vx * dt;
            y += vy * dt;
            if (y > 450) break;
            ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Reset and draw dots
        x = startX; y = startY;
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
        ctx.setLineDash([]);
        var dotColor = projectileType === 'explosive' ? '#FF6600' :
                       projectileType === 'ice' ? '#AEE4FF' : '#FFFFFF';
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

    Game.prototype._drawBodyDirect = function(ctx, body) {
        if (body.isDead) return;
        var cx = body.x + body.width / 2;
        var cy = body.y + body.height / 2;
        ctx.save();
        ctx.translate(cx, cy);
        if (body.angle) ctx.rotate(body.angle);
        ctx.translate(-body.width / 2, -body.height / 2);

        var healthRatio = body.health / body.maxHealth;
        ctx.fillStyle = body.color;
        ctx.fillRect(0, 0, body.width, body.height);

        // Cracks
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
        if (healthRatio < 0.5) {
            ctx.fillStyle = 'rgba(200,0,0,' + (0.3 * (1 - healthRatio)) + ')';
            ctx.fillRect(0, 0, body.width, body.height);
        }

        ctx.strokeStyle = body.strokeColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(0, 0, body.width, body.height);

        // Wood grain
        if (body.material === 'wood' || body.material === 'wood_plank') {
            ctx.strokeStyle = 'rgba(100,60,0,0.3)';
            ctx.lineWidth = 1;
            if (body.width > body.height) {
                for (var g = 4; g < body.height; g += 8) {
                    ctx.beginPath(); ctx.moveTo(0, g); ctx.lineTo(body.width, g); ctx.stroke();
                }
            } else {
                for (var g = 4; g < body.width; g += 8) {
                    ctx.beginPath(); ctx.moveTo(g, 0); ctx.lineTo(g, body.height); ctx.stroke();
                }
            }
        }

        if (Debug.showHitboxes) {
            ctx.strokeStyle = 'lime'; ctx.lineWidth = 1;
            ctx.strokeRect(0, 0, body.width, body.height);
        }
        ctx.restore();
    };

    Game.prototype._drawEnemyDirect = function(ctx, enemy) {
        if (enemy.isDead) return;
        var x = enemy.x + enemy.width / 2;
        var y = enemy.y + enemy.height / 2;
        var healthRatio = enemy.health / enemy.maxHealth;

        ctx.save();
        if (enemy.angle) { ctx.translate(x, y); ctx.rotate(enemy.angle); ctx.translate(-x, -y); }

        // Body
        ctx.fillStyle = '#CC0000';
        ctx.fillRect(x - 8, y - 2, 16, 14);
        ctx.strokeStyle = '#880000'; ctx.lineWidth = 1;
        ctx.strokeRect(x - 8, y - 2, 16, 14);
        // Arms
        ctx.fillStyle = '#CC0000';
        ctx.fillRect(x - 14, y, 6, 10);
        ctx.fillRect(x + 8, y, 6, 10);
        // Helmet
        ctx.fillStyle = '#555555';
        ctx.beginPath();
        ctx.arc(x, y - 8, 9, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(x - 9, y - 8, 18, 5);
        ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y - 8, 9, Math.PI, 0);
        ctx.stroke();
        // Face
        ctx.fillStyle = '#F4C07A';
        ctx.beginPath(); ctx.arc(x, y - 6, 7, 0, Math.PI * 2); ctx.fill();
        // Eyes
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(x - 3, y - 7, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 3, y - 7, 1.5, 0, Math.PI * 2); ctx.fill();
        // Legs
        ctx.fillStyle = '#555';
        ctx.fillRect(x - 7, y + 12, 6, 10);
        ctx.fillRect(x + 1, y + 12, 6, 10);
        // Shield
        ctx.fillStyle = '#8B6914';
        ctx.beginPath();
        ctx.moveTo(x - 18, y + 2); ctx.lineTo(x - 10, y - 4);
        ctx.lineTo(x - 10, y + 14); ctx.lineTo(x - 18, y + 10);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#5C3D1E'; ctx.lineWidth = 1; ctx.stroke();
        // Health bar
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x - 12, y - 22, 24, 4);
        ctx.fillStyle = healthRatio > 0.5 ? '#00CC00' : '#CC4400';
        ctx.fillRect(x - 12, y - 22, 24 * healthRatio, 4);

        ctx.restore();
    };

    Game.prototype._drawProjectileDirect = function(ctx, body) {
        if (body.isDead) return;
        var cx = body.getCenterX();
        var cy = body.getCenterY();
        var r = body.width / 2;

        ctx.save();
        if (body.projectileType === 'rock') {
            var g = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, r*0.1, cx, cy, r);
            g.addColorStop(0, '#999999'); g.addColorStop(1, '#333333');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5; ctx.stroke();
        } else if (body.projectileType === 'explosive') {
            var g = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, r*0.1, cx, cy, r);
            g.addColorStop(0, '#FF4444'); g.addColorStop(1, '#880000');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#440000'; ctx.lineWidth = 1.5; ctx.stroke();
            // Fuse
            ctx.strokeStyle = '#FFAA00'; ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx + r*0.5, cy - r*0.7);
            ctx.quadraticCurveTo(cx + r*0.8, cy - r*1.2, cx + r*0.3, cy - r*1.5);
            ctx.stroke();
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath(); ctx.arc(cx + r*0.3, cy - r*1.5, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = 'bold ' + Math.round(r) + 'px Arial';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('!', cx, cy);
        } else if (body.projectileType === 'ice') {
            var g = ctx.createRadialGradient(cx - r*0.3, cy - r*0.3, r*0.1, cx, cy, r);
            g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.5, '#AEE4FF'); g.addColorStop(1, '#4499CC');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#3388BB'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath(); ctx.arc(cx - r*0.3, cy - r*0.3, r*0.25, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
    };

    Game.prototype._drawParticlesDirect = function(ctx) {
        var particles = this.particles.particles;
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            var alpha = MathUtils.clamp(p.life / p.maxLife, 0, 1);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            var s = p.size * alpha;
            ctx.fillRect(p.x - s/2, p.y - s/2, s, s);
            ctx.restore();
        }
    };

    Game.prototype._drawTrebuchetDirect = function(ctx, x, y, angle) {
        var baseY = y;
        var armLength = 70;
        var pivotH = 60;
        var pivotX = x;
        var pivotY = baseY - pivotH;

        // Wheels
        ctx.fillStyle = '#5C3D1E';
        ctx.beginPath(); ctx.arc(x - 22, baseY, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#8B6914';
        ctx.beginPath(); ctx.arc(x + 22, baseY, 12, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x - 22, baseY, 12, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(x + 22, baseY, 12, 0, Math.PI * 2); ctx.stroke();

        // Base
        ctx.fillStyle = '#6B4423';
        ctx.fillRect(x - 30, baseY - 15, 60, 15);
        ctx.strokeStyle = '#3A2510'; ctx.lineWidth = 2;
        ctx.strokeRect(x - 30, baseY - 15, 60, 15);

        // Support legs
        ctx.strokeStyle = '#5C3D1E'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - 20, baseY - 12); ctx.lineTo(pivotX - 5, pivotY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + 20, baseY - 12); ctx.lineTo(pivotX + 5, pivotY); ctx.stroke();

        // Arm
        ctx.save();
        ctx.translate(pivotX, pivotY);
        ctx.rotate(angle);
        ctx.strokeStyle = '#5C3D1E'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(armLength, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-armLength * 0.4, 0); ctx.stroke();
        // Counterweight
        ctx.fillStyle = '#444';
        ctx.beginPath(); ctx.arc(-armLength * 0.4, 8, 10, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
        // Sling
        ctx.strokeStyle = '#8B6914'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(armLength, 0); ctx.lineTo(armLength + 10, 10); ctx.stroke();
        ctx.restore();

        // Pivot pin
        ctx.fillStyle = '#888';
        ctx.beginPath(); ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2); ctx.fill();
    };

    Game.prototype._drawExplosionsDirect = function(ctx, dt) {
        var exps = this.renderer.explosions;
        for (var i = exps.length - 1; i >= 0; i--) {
            var exp = exps[i];
            exp.life -= dt;
            var t = 1 - (exp.life / exp.maxLife);
            var alpha = 1 - t;
            var r = exp.radius * (0.3 + t * 0.7);

            var grad = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, r);
            grad.addColorStop(0, 'rgba(255,255,200,' + alpha + ')');
            grad.addColorStop(0.3, 'rgba(255,140,0,' + alpha*0.8 + ')');
            grad.addColorStop(0.7, 'rgba(255,60,0,' + alpha*0.4 + ')');
            grad.addColorStop(1, 'rgba(100,0,0,0)');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(exp.x, exp.y, r, 0, Math.PI * 2); ctx.fill();

            if (exp.life <= 0) exps.splice(i, 1);
        }
    };

    Game.prototype.startLevel = function(levelId) {
        var self = this;
        this.currentLevelId = levelId;
        this.ui.showScreen('loading-screen');
        this.physics.clear();
        this.particles.clear();
        this.camera.reset();
        this.renderer.explosions = [];

        this.levelLoader.loadLevelFile(levelId, function(err, data) {
            if (err) {
                console.error('Failed to load level', levelId, err);
                self.ui.showScreen('main-menu');
                return;
            }
            self.levelManager.loadLevel(data);
            self.levelManager._ended = false;
            self.state = STATES.PLAYING;
            self.ui.showScreen(null);
            self.ui.showHUD();
            self.input.enable();
            Analytics.track('level_start', { level: levelId, name: data.name });
        });
    };

    Game.prototype.pause = function() {
        if (this.state !== STATES.PLAYING) return;
        this.state = STATES.PAUSED;
        this.ui.showPause();
        this.input.disable();
        Analytics.track('pause');
    };

    Game.prototype.resume = function() {
        if (this.state !== STATES.PAUSED) return;
        this.state = STATES.PLAYING;
        this.ui.hidePause();
        this.input.enable();
        this.lastTime = performance.now();
        Analytics.track('resume');
    };

    Game.prototype.restartLevel = function() {
        this.levelManager._ended = false;
        this.ui.hidePause();
        this.startLevel(this.currentLevelId);
    };

    Game.prototype.goToMainMenu = function() {
        this.state = STATES.MENU;
        this.ui.hidePause();
        this.ui.showScreen('main-menu');
        this.physics.clear();
        this.particles.clear();
        this.camera.reset();
        this.renderer.explosions = [];
        this.input.disable();
        Analytics.track('main_menu');
    };

    return { Game: Game, STATES: STATES };
})();
