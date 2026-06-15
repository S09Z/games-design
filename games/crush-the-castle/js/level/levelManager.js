// Level manager - manages current level state
var LevelManager = (function() {
    var GROUND_Y = 450;
    var PROJECTILE_RADIUS = 14;

    // Projectile speed multiplier per type
    var PROJECTILE_SPEEDS = {
        rock: 650,
        explosive: 600,
        ice: 700
    };

    var PROJECTILE_MASSES = {
        rock: 3,
        explosive: 2,
        ice: 1.5
    };

    var PROJECTILE_RESTITUTIONS = {
        rock: 0.2,
        explosive: 0.05,
        ice: 0.8
    };

    function LevelManager(physics, saveManager) {
        this.physics = physics;
        this.saveManager = saveManager;
        this.currentLevelData = null;
        this.ammoLeft = 0;
        this.score = 0;
        this.enemies = [];
        this.structures = [];
        this.projectiles = [];
        this.activeProjectile = null;
        this.projectileQueue = []; // remaining ammo types in order
        this.nextProjectileType = 'rock';
        this.enemiesAlive = 0;
        this.onScoreChange = null;
        this.onAmmoChange = null;
        this.onEnemyDied = null;
        this.onStructureDestroyed = null;
        this.onLevelWon = null;
        this.onLevelLost = null;
        this.stars = 0;
        this.projectilesInFlight = 0;
        this.settleTimer = 0;
        this.waitingToSettle = false;
    }

    LevelManager.prototype.loadLevel = function(levelData) {
        this.currentLevelData = levelData;
        this.score = 0;
        this.enemies = [];
        this.structures = [];
        this.projectiles = [];
        this.activeProjectile = null;
        this.projectilesInFlight = 0;
        this.settleTimer = 0;
        this.waitingToSettle = false;
        this.stars = 0;

        // Build ammo queue
        this.projectileQueue = [];
        this.ammoLeft = 0;
        for (var i = 0; i < levelData.projectiles.length; i++) {
            var pd = levelData.projectiles[i];
            for (var c = 0; c < pd.count; c++) {
                this.projectileQueue.push(pd.type);
                this.ammoLeft++;
            }
        }
        this.nextProjectileType = this.projectileQueue.length > 0 ? this.projectileQueue[0] : 'rock';

        // Create structure bodies
        for (var i = 0; i < levelData.structures.length; i++) {
            var s = levelData.structures[i];
            var body = new Body({
                x: s.x,
                y: s.y,
                width: s.width,
                height: s.height,
                mass: s.width * s.height * 0.01,
                material: s.type,
                health: s.health,
                type: 'dynamic'
            });
            this.physics.addBody(body);
            this.structures.push(body);
        }

        // Create enemy bodies
        this.enemiesAlive = 0;
        for (var i = 0; i < levelData.enemies.length; i++) {
            var e = levelData.enemies[i];
            var body = new Body({
                x: e.x - 12,
                y: e.y - 22,
                width: 24,
                height: 40,
                mass: 1.5,
                material: 'enemy',
                health: e.health,
                type: 'dynamic',
                isEnemy: true,
                restitution: 0.3,
                friction: 0.5
            });
            body.enemyId = e.id;
            this.physics.addBody(body);
            this.enemies.push(body);
            this.enemiesAlive++;
        }

        if (this.onAmmoChange) this.onAmmoChange(this.ammoLeft, this.nextProjectileType);
        if (this.onScoreChange) this.onScoreChange(this.score);
    };

    LevelManager.prototype.fire = function(angle, power) {
        if (this.ammoLeft <= 0) return false;
        if (this.activeProjectile && !this.activeProjectile.isDead) return false;

        var type = this.projectileQueue.shift();
        this.ammoLeft--;
        this.nextProjectileType = this.projectileQueue.length > 0 ? this.projectileQueue[0] : null;

        var speed = (PROJECTILE_SPEEDS[type] || 650) * power;
        var vx = Math.cos(angle) * speed;
        var vy = Math.sin(angle) * speed;

        // Start position at trebuchet arm tip
        var armLength = 70;
        var pivotX = 120;
        var pivotY = GROUND_Y - 60;
        var startX = pivotX + Math.cos(angle) * armLength - PROJECTILE_RADIUS;
        var startY = pivotY + Math.sin(angle) * armLength - PROJECTILE_RADIUS;

        var proj = new Body({
            x: startX,
            y: startY,
            width: PROJECTILE_RADIUS * 2,
            height: PROJECTILE_RADIUS * 2,
            vx: vx,
            vy: vy,
            mass: PROJECTILE_MASSES[type] || 3,
            material: type === 'ice' ? 'ice' : (type === 'explosive' ? 'explosive' : 'rock'),
            restitution: PROJECTILE_RESTITUTIONS[type] || 0.2,
            friction: 0.4,
            health: 999,
            type: 'dynamic',
            isProjectile: true,
            projectileType: type
        });

        this.physics.addBody(proj);
        this.projectiles.push(proj);
        this.activeProjectile = proj;
        this.projectilesInFlight++;

        if (this.onAmmoChange) this.onAmmoChange(this.ammoLeft, this.nextProjectileType);

        return proj;
    };

    LevelManager.prototype.update = function(dt, collisionEvents) {
        // Process collision events
        for (var i = 0; i < collisionEvents.length; i++) {
            var ev = collisionEvents[i];
            this._handleCollisionEvent(ev);
        }

        // Check for projectile landing (very slow + on ground)
        for (var i = this.projectiles.length - 1; i >= 0; i--) {
            var proj = this.projectiles[i];

            // Handle explosive detonation on impact
            if (proj.projectileType === 'explosive' && !proj.hasExploded) {
                var speed = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy);
                if (proj.onGround || speed < 50) {
                    this._detonate(proj);
                }
            }

            // Remove dead/settled projectiles from flight count
            if (proj.isDead || (proj.onGround && Math.abs(proj.vx) < 10 && Math.abs(proj.vy) < 10)) {
                if (proj === this.activeProjectile) {
                    this.projectilesInFlight = Math.max(0, this.projectilesInFlight - 1);
                    this.activeProjectile = null;
                    // Start settle timer
                    this.waitingToSettle = true;
                    this.settleTimer = 0;
                }
            }
        }

        // Remove dead enemies from alive count
        for (var i = 0; i < this.enemies.length; i++) {
            var enemy = this.enemies[i];
            if (enemy.isDead && !enemy._countedDead) {
                enemy._countedDead = true;
                this.enemiesAlive = Math.max(0, this.enemiesAlive - 1);
                this.score += 500;
                if (this.onScoreChange) this.onScoreChange(this.score);
                if (this.onEnemyDied) this.onEnemyDied(enemy);
            }
        }

        // Settle timer - wait for physics to calm down
        if (this.waitingToSettle) {
            this.settleTimer += dt;
            if (this.settleTimer >= 2.0) {
                this.waitingToSettle = false;
                this._checkEndConditions();
            }
        }

        // Check if all enemies dead immediately
        if (this.enemiesAlive === 0) {
            this._checkEndConditions();
        }
    };

    LevelManager.prototype._handleCollisionEvent = function(ev) {
        if (ev.type === 'body' || ev.type === 'ground') {
            var body = ev.a || ev.body;
            var other = ev.b;

            // Check structures destroyed
            if (body && body.isDead && !body._countedDestroyed && !body.isProjectile && !body.isEnemy) {
                body._countedDestroyed = true;
                this.score += 100;
                if (this.onScoreChange) this.onScoreChange(this.score);
                if (this.onStructureDestroyed) this.onStructureDestroyed(body);
            }
            if (other && other.isDead && !other._countedDestroyed && !other.isProjectile && !other.isEnemy) {
                other._countedDestroyed = true;
                this.score += 100;
                if (this.onScoreChange) this.onScoreChange(this.score);
                if (this.onStructureDestroyed) this.onStructureDestroyed(other);
            }
        }
    };

    LevelManager.prototype._detonate = function(proj) {
        if (proj.hasExploded) return;
        proj.hasExploded = true;
        proj.isDead = true;

        var cx = proj.getCenterX();
        var cy = proj.getCenterY();
        var expEvents = this.physics.applyExplosion(cx, cy, proj.explosionRadius || 80, 800);

        // Count destroyed by explosion
        for (var i = 0; i < expEvents.length; i++) {
            var ev = expEvents[i];
            if (ev.justDied && ev.body) {
                if (!ev.body._countedDestroyed && !ev.body.isProjectile && !ev.body.isEnemy) {
                    ev.body._countedDestroyed = true;
                    this.score += 100;
                    if (this.onScoreChange) this.onScoreChange(this.score);
                    if (this.onStructureDestroyed) this.onStructureDestroyed(ev.body);
                }
            }
        }

        return { x: cx, y: cy, radius: proj.explosionRadius || 80, events: expEvents };
    };

    LevelManager.prototype.tryDetonateProjectile = function() {
        // Allow manual detonation of explosive mid-air
        if (this.activeProjectile && this.activeProjectile.projectileType === 'explosive') {
            return this._detonate(this.activeProjectile);
        }
        return null;
    };

    LevelManager.prototype._checkEndConditions = function() {
        if (this.enemiesAlive === 0) {
            this._win();
            return;
        }
        if (this.ammoLeft === 0 && this.projectilesInFlight === 0 && !this.waitingToSettle) {
            this._lose();
        }
    };

    LevelManager.prototype._win = function() {
        if (this._ended) return;
        this._ended = true;

        // Ammo bonus
        this.score += this.ammoLeft * 200;
        if (this.onScoreChange) this.onScoreChange(this.score);

        // Calculate stars
        var thresholds = this.currentLevelData.starThresholds || [500, 1500, 2500];
        if (this.score >= thresholds[2]) this.stars = 3;
        else if (this.score >= thresholds[1]) this.stars = 2;
        else this.stars = 1;

        // Save
        this.saveManager.updateLevel(this.currentLevelData.id, this.stars, this.score);

        if (this.onLevelWon) this.onLevelWon(this.stars, this.score);
    };

    LevelManager.prototype._lose = function() {
        if (this._ended) return;
        this._ended = true;
        if (this.onLevelLost) this.onLevelLost();
    };

    LevelManager.prototype.reset = function() {
        this._ended = false;
        if (this.currentLevelData) {
            this.physics.clear();
            this.loadLevel(this.currentLevelData);
        }
    };

    LevelManager.prototype.getCurrentProjectileType = function() {
        return this.nextProjectileType || (this.activeProjectile ? this.activeProjectile.projectileType : 'rock');
    };

    return LevelManager;
})();
