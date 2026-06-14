// Collision detection helpers
var Collision = (function() {
    // AABB overlap test, returns null if no collision, or collision info
    function testAABB(a, b) {
        var aLeft = a.x, aRight = a.x + a.width;
        var aTop = a.y, aBottom = a.y + a.height;
        var bLeft = b.x, bRight = b.x + b.width;
        var bTop = b.y, bBottom = b.y + b.height;

        if (aRight <= bLeft || bRight <= aLeft) return null;
        if (aBottom <= bTop || bBottom <= aTop) return null;

        // Compute penetration on each axis
        var overlapX = Math.min(aRight - bLeft, bRight - aLeft);
        var overlapY = Math.min(aBottom - bTop, bBottom - aTop);

        var nx, ny, depth;
        if (overlapX < overlapY) {
            depth = overlapX;
            nx = (a.getCenterX() < b.getCenterX()) ? -1 : 1;
            ny = 0;
        } else {
            depth = overlapY;
            nx = 0;
            ny = (a.getCenterY() < b.getCenterY()) ? -1 : 1;
        }

        return {
            a: a,
            b: b,
            nx: nx,
            ny: ny,
            depth: depth
        };
    }

    // Test circle vs AABB (for circular projectiles against rect bodies)
    function testCircleAABB(circle, rect) {
        var cx = circle.getCenterX();
        var cy = circle.getCenterY();
        var r = circle.width / 2;

        var nearestX = MathUtils.clamp(cx, rect.x, rect.x + rect.width);
        var nearestY = MathUtils.clamp(cy, rect.y, rect.y + rect.height);

        var dx = cx - nearestX;
        var dy = cy - nearestY;
        var distSq = dx * dx + dy * dy;

        if (distSq > r * r) return null;

        var dist = Math.sqrt(distSq);
        var nx, ny;
        if (dist === 0) {
            nx = 0; ny = -1;
            dist = r;
        } else {
            nx = dx / dist;
            ny = dy / dist;
        }

        return {
            a: circle,
            b: rect,
            nx: nx,
            ny: ny,
            depth: r - dist
        };
    }

    // Compute impulse-based resolution
    function resolveCollision(col) {
        var a = col.a;
        var b = col.b;
        var nx = col.nx;
        var ny = col.ny;

        // Relative velocity along normal
        var rvx = (b.type === 'dynamic' ? b.vx : 0) - a.vx;
        var rvy = (b.type === 'dynamic' ? b.vy : 0) - a.vy;
        var relVelNormal = rvx * nx + rvy * ny;

        // Don't resolve if separating
        if (relVelNormal > 0) return;

        var restitution = Math.min(a.restitution, b.restitution);
        var invMassA = a.type === 'static' ? 0 : 1 / a.mass;
        var invMassB = b.type === 'static' ? 0 : 1 / b.mass;
        var invMassSum = invMassA + invMassB;
        if (invMassSum === 0) return;

        var j = -(1 + restitution) * relVelNormal / invMassSum;
        var jx = j * nx;
        var jy = j * ny;

        if (a.type === 'dynamic') {
            a.vx -= jx * invMassA;
            a.vy -= jy * invMassA;
        }
        if (b.type === 'dynamic') {
            b.vx += jx * invMassB;
            b.vy += jy * invMassB;
        }

        // Friction
        var friction = (a.friction + b.friction) / 2;
        var tvx = rvx - relVelNormal * nx;
        var tvy = rvy - relVelNormal * ny;
        var tLen = Math.sqrt(tvx * tvx + tvy * tvy);
        if (tLen > 0.001) {
            var tx = tvx / tLen;
            var ty = tvy / tLen;
            var jt = -friction * (rvx * tx + rvy * ty) / invMassSum;
            if (a.type === 'dynamic') {
                a.vx -= jt * tx * invMassA;
                a.vy -= jt * ty * invMassA;
            }
            if (b.type === 'dynamic') {
                b.vx += jt * tx * invMassB;
                b.vy += jt * ty * invMassB;
            }
        }

        // Positional correction (slop to prevent sinking)
        var slop = 0.5;
        var percent = 0.4;
        var correction = Math.max(col.depth - slop, 0) / invMassSum * percent;
        if (a.type === 'dynamic') {
            a.x -= correction * nx * invMassA;
            a.y -= correction * ny * invMassA;
        }
        if (b.type === 'dynamic') {
            b.x += correction * nx * invMassB;
            b.y += correction * ny * invMassB;
        }
    }

    // Compute damage from collision impact speed
    function impactDamage(col) {
        var a = col.a;
        var b = col.b;
        var rvx = (b.type === 'dynamic' ? b.vx : 0) - a.vx;
        var rvy = (b.type === 'dynamic' ? b.vy : 0) - a.vy;
        var speed = Math.sqrt(rvx * rvx + rvy * rvy);
        return speed * 0.5; // scale factor
    }

    return {
        testAABB: testAABB,
        testCircleAABB: testCircleAABB,
        resolveCollision: resolveCollision,
        impactDamage: impactDamage
    };
})();
