// Physics engine
var PhysicsEngine = (function() {
    var GRAVITY = 500; // px/s^2
    var GROUND_Y = 450;

    function Engine() {
        this.bodies = [];
        this.gravity = GRAVITY;
        this.groundY = GROUND_Y;
        this.collisionEvents = [];
    }

    Engine.prototype.addBody = function(body) {
        this.bodies.push(body);
        return body;
    };

    Engine.prototype.removeBody = function(body) {
        var idx = this.bodies.indexOf(body);
        if (idx !== -1) this.bodies.splice(idx, 1);
    };

    Engine.prototype.clear = function() {
        this.bodies = [];
        this.collisionEvents = [];
    };

    Engine.prototype.update = function(dt) {
        this.collisionEvents = [];

        // Apply gravity and integrate
        for (var i = 0; i < this.bodies.length; i++) {
            var body = this.bodies[i];
            if (body.type === 'static' || body.isDead) continue;
            if (body.isSleeping) continue;

            // Gravity
            body.vy += this.gravity * dt;
            body.update(dt);
        }

        // Ground collision
        for (var i = 0; i < this.bodies.length; i++) {
            var body = this.bodies[i];
            if (body.type === 'static' || body.isDead) continue;

            var bottom = body.y + body.height;
            if (bottom > this.groundY) {
                var penetration = bottom - this.groundY;
                body.y -= penetration;
                body.onGround = true;

                if (body.vy > 0) {
                    var impactSpeed = body.vy;
                    body.vy = -body.vy * body.restitution;
                    body.vx *= (1 - body.friction * 0.3);

                    // Stop bouncing if too slow
                    if (Math.abs(body.vy) < 20) {
                        body.vy = 0;
                    }

                    if (impactSpeed > 50) {
                        this.collisionEvents.push({
                            type: 'ground',
                            body: body,
                            speed: impactSpeed,
                            x: body.getCenterX(),
                            y: this.groundY
                        });
                    }
                }
            } else {
                body.onGround = false;
            }

            // Sleep check
            body.checkSleep();
        }

        // Body vs body collisions
        var dynamicBodies = [];
        var allBodies = [];
        for (var i = 0; i < this.bodies.length; i++) {
            if (!this.bodies[i].isDead) {
                allBodies.push(this.bodies[i]);
                if (this.bodies[i].type === 'dynamic') {
                    dynamicBodies.push(this.bodies[i]);
                }
            }
        }

        for (var i = 0; i < dynamicBodies.length; i++) {
            var a = dynamicBodies[i];
            if (a.isSleeping && !a.isProjectile) continue;

            for (var j = 0; j < allBodies.length; j++) {
                var b = allBodies[j];
                if (a === b) continue;
                if (b.type === 'static' && b.isDead) continue;
                // Skip two sleeping non-projectiles
                if (a.isSleeping && b.isSleeping) continue;

                var col = null;
                if (a.isProjectile) {
                    col = Collision.testCircleAABB(a, b);
                } else {
                    col = Collision.testAABB(a, b);
                }

                if (col) {
                    var damage = Collision.impactDamage(col);
                    var preDeadA = a.isDead;
                    var preDeadB = b.isDead;

                    Collision.resolveCollision(col);

                    // Wake sleeping bodies nearby
                    if (b.isSleeping) b.wake();

                    // Apply damage
                    if (damage > 30) {
                        if (!a.isProjectile) a.takeDamage(damage * 0.5);
                        b.takeDamage(damage * (a.isProjectile ? 1.5 : 0.5));
                    }

                    if (damage > 20) {
                        this.collisionEvents.push({
                            type: 'body',
                            a: a,
                            b: b,
                            speed: damage,
                            x: (a.getCenterX() + b.getCenterX()) / 2,
                            y: (a.getCenterY() + b.getCenterY()) / 2,
                            aJustDied: !preDeadA && a.isDead,
                            bJustDied: !preDeadB && b.isDead
                        });
                    }
                }
            }
        }

        return this.collisionEvents;
    };

    Engine.prototype.applyExplosion = function(x, y, radius, force) {
        var events = [];
        for (var i = 0; i < this.bodies.length; i++) {
            var body = this.bodies[i];
            if (body.type === 'static' || body.isDead) continue;

            var cx = body.getCenterX();
            var cy = body.getCenterY();
            var dist = MathUtils.distance(x, y, cx, cy);

            if (dist < radius) {
                var falloff = 1 - (dist / radius);
                var strength = force * falloff;
                var dx = cx - x;
                var dy = cy - y;
                var len = Math.sqrt(dx * dx + dy * dy) || 1;
                body.vx += (dx / len) * strength / body.mass;
                body.vy += (dy / len) * strength / body.mass - strength * 0.5 / body.mass;
                body.wake();

                var dmg = strength * 2;
                var preDeadBody = body.isDead;
                body.takeDamage(dmg);
                events.push({
                    type: 'explosion_hit',
                    body: body,
                    justDied: !preDeadBody && body.isDead,
                    x: cx, y: cy
                });
            }
        }
        return events;
    };

    return Engine;
})();
