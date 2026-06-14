// Physics body
var Body = (function() {
    var MATERIAL_PROPS = {
        stone: { friction: 0.6, restitution: 0.2, color: '#777777', strokeColor: '#444444' },
        wood:  { friction: 0.4, restitution: 0.3, color: '#C19A6B', strokeColor: '#8B6914' },
        wood_plank: { friction: 0.4, restitution: 0.3, color: '#C19A6B', strokeColor: '#8B6914' },
        ice:   { friction: 0.05, restitution: 0.8, color: '#AEE4FF', strokeColor: '#5BB5E8' },
        rock:  { friction: 0.5, restitution: 0.2, color: '#555555', strokeColor: '#333333' },
        explosive: { friction: 0.3, restitution: 0.1, color: '#CC2200', strokeColor: '#880000' },
        enemy: { friction: 0.5, restitution: 0.2, color: '#FFD700', strokeColor: '#CC8800' }
    };

    function Body(config) {
        this.id = config.id || (Body._nextId = (Body._nextId || 0) + 1, Body._nextId);
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.width = config.width || 20;
        this.height = config.height || 20;
        this.vx = config.vx || 0;
        this.vy = config.vy || 0;
        this.mass = config.mass || 1;
        this.material = config.material || 'stone';
        this.type = config.type || 'dynamic'; // 'static' or 'dynamic'
        this.isProjectile = config.isProjectile || false;
        this.isEnemy = config.isEnemy || false;
        this.projectileType = config.projectileType || null;
        this.health = config.health || 100;
        this.maxHealth = config.health || 100;
        this.isDead = false;
        this.hasExploded = false;
        this.onGround = false;
        this.sleepTimer = 0;
        this.isSleeping = false;
        this.angle = 0;
        this.angularVel = 0;

        var props = MATERIAL_PROPS[this.material] || MATERIAL_PROPS.stone;
        this.friction = config.friction !== undefined ? config.friction : props.friction;
        this.restitution = config.restitution !== undefined ? config.restitution : props.restitution;
        this.color = config.color || props.color;
        this.strokeColor = config.strokeColor || props.strokeColor;

        // Explosion radius for explosive type
        this.explosionRadius = config.explosionRadius || 80;
    }

    Body.prototype.update = function(dt) {
        if (this.type === 'static' || this.isDead) return;
        if (this.isSleeping) return;

        this.vx = MathUtils.clamp(this.vx, -800, 800);
        this.vy = MathUtils.clamp(this.vy, -800, 800);

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Angular rotation based on horizontal velocity
        if (!this.onGround && !this.isProjectile) {
            this.angularVel = this.vx * 0.005;
        }
        this.angle += this.angularVel * dt;
    };

    Body.prototype.applyForce = function(fx, fy) {
        if (this.type === 'static' || this.isDead) return;
        this.vx += fx / this.mass;
        this.vy += fy / this.mass;
    };

    Body.prototype.takeDamage = function(amount) {
        if (this.isDead) return;
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
        }
    };

    Body.prototype.getLeft = function() { return this.x; };
    Body.prototype.getRight = function() { return this.x + this.width; };
    Body.prototype.getTop = function() { return this.y; };
    Body.prototype.getBottom = function() { return this.y + this.height; };
    Body.prototype.getCenterX = function() { return this.x + this.width / 2; };
    Body.prototype.getCenterY = function() { return this.y + this.height / 2; };

    Body.prototype.checkSleep = function() {
        var speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed < 5 && this.onGround) {
            this.sleepTimer++;
            if (this.sleepTimer > 90) {
                this.isSleeping = true;
                this.vx = 0;
                this.vy = 0;
            }
        } else {
            this.sleepTimer = 0;
            this.isSleeping = false;
        }
    };

    Body.prototype.wake = function() {
        this.isSleeping = false;
        this.sleepTimer = 0;
    };

    return Body;
})();
