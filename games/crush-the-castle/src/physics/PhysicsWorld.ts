import RAPIER from '@dimforge/rapier3d-compat';
import { events } from '../state/events';
import { GRAVITY, SETTLE_FRAMES, FLY_TIMEOUT, AMMO_TYPES, BOULDER_RADIUS } from '../config';
import type { AmmoType } from '../config';
import {
  createGround, createWalls, createBlock, createEnemy, createBoulder, removeBody,
} from './Bodies';
import type { BodyHandle, LevelData } from './Bodies';
import { detectCollisions, isSettled } from './Collision';

export class PhysicsWorld {
  world!: RAPIER.World;
  eventQueue!: RAPIER.EventQueue;
  bodies: BodyHandle[] = [];
  activeBoulders: BodyHandle[] = [];
  stillFrames = 0;
  flyFrames = 0;
  onEnemyKilled: ((idx: number, pos?: { x: number; y: number; z: number }) => void) | null = null;
  onTurnEnded: (() => void) | null = null;
  onCollisionImpact: (() => void) | null = null;

  async init() {
    await RAPIER.init();
    this.world = new RAPIER.World({ x: 0, y: GRAVITY, z: 0 });
    this.eventQueue = new RAPIER.EventQueue(false);
    this.bodies = [];
    this.activeBoulders = [];
    this.stillFrames = 0;
    this.flyFrames = 0;
    events.emit('physics-ready');
  }

  loadLevel(level: LevelData) {
    for (const h of this.bodies) {
      this.world.removeCollider(h.collider);
      this.world.removeRigidBody(h.rigidBody);
    }
    this.bodies = [];
    this.activeBoulders = [];
    this.stillFrames = 0;
    this.flyFrames = 0;
    this.eventQueue.clear();

    this.bodies.push(createGround(this.world));
    this.bodies.push(...createWalls(this.world));

    for (const def of level.blocks) {
      this.bodies.push(createBlock(this.world, def));
    }

    for (const def of level.enemies) {
      this.bodies.push(createEnemy(this.world, def));
    }
  }

  get enemies(): BodyHandle[] {
    return this.bodies.filter(h => h.userData.kind === 'enemy');
  }

  get blocks(): BodyHandle[] {
    return this.bodies.filter(h => h.userData.kind === 'block');
  }

  get dynamicBodies(): BodyHandle[] {
    return this.bodies.filter(h => !h.rigidBody.isFixed());
  }

  launchBoulder(pos: { x: number; y: number; z: number }, vel: { x: number; y: number; z: number }, ammoType: AmmoType = 'standard') {
    // Clean up any leftover boulders
    for (const b of this.activeBoulders) {
      removeBody(this.world, b);
      this.bodies = this.bodies.filter(h => h !== b);
    }
    this.activeBoulders = [];

    const cfg = AMMO_TYPES[ammoType];
    const spawnAngle = Math.atan2(-vel.y, vel.x);
    const speed = Math.hypot(vel.x, vel.y, vel.z) * cfg.speedMul;
    const radius = BOULDER_RADIUS * cfg.sizeMul;

    for (let i = 0; i < cfg.count; i++) {
      const offset = cfg.count > 1 ? (i - (cfg.count - 1) / 2) * cfg.spreadRad : 0;
      const angle = spawnAngle + offset;
      const v = { x: Math.cos(angle) * speed, y: -Math.sin(angle) * speed, z: 0 };
      const b = createBoulder(this.world, pos, v, radius);
      this.activeBoulders.push(b);
      this.bodies.push(b);
    }

    this.stillFrames = 0;
    this.flyFrames = 0;
    events.emit('boulder-launched', pos, vel);
  }

  step(): { active: boolean; nextState: 'aiming' | 'lost' | 'won' | null } {
    this.world.step(this.eventQueue);

    // Collision detection
    const col = detectCollisions(this.eventQueue, this.activeBoulders, this.bodies);
    if (col.boulderImpact) {
      this.onCollisionImpact?.();
      events.emit('collision-impact');
    }
    for (const h of col.bodiesToCrack) {
      h.userData.cl = Math.min(3, (h.userData.cl || 0) + 1);
    }

    // Enemy death check
    for (const e of this.enemies) {
      if (e.userData.dead) continue;
      const ep = e.rigidBody.translation();
      const sp = e.userData.spawnPos!;
      const dist = Math.hypot(ep.x - sp.x, ep.y - sp.y, ep.z - sp.z);
      if (dist > 82 || ep.y < -10 || ep.x < -30 || ep.x > 990) {
        e.userData.dead = true;
        this.onEnemyKilled?.(this.enemies.indexOf(e), ep);
        events.emit('enemy-killed', this.enemies.indexOf(e), ep);
      }
    }

    // Boulder cleanup (out of bounds)
    this.activeBoulders = this.activeBoulders.filter(b => {
      const bp = b.rigidBody.translation();
      if (bp.y < -20 || bp.x < -40 || bp.x > 1000) {
        removeBody(this.world, b);
        this.bodies = this.bodies.filter(h => h !== b);
        events.emit('boulder-removed', b.collider.handle);
        return false;
      }
      return true;
    });

    // Fly frame counter
    if (this.activeBoulders.length > 0 || this.flyFrames > 0) {
      this.flyFrames++;
    }

    // Settle detection: all boulders removed + system settled
    const settled = isSettled(this.dynamicBodies);
    if (settled && this.activeBoulders.length === 0 && this.flyFrames > 20) {
      this.stillFrames++;
    } else {
      this.stillFrames = 0;
    }

    if (this.stillFrames >= SETTLE_FRAMES || this.flyFrames > FLY_TIMEOUT) {
      this.onTurnEnded?.();
      events.emit('turn-ended');
      return { active: false, nextState: null };
    }

    return { active: true, nextState: null };
  }

  destroy() {
    for (const h of this.bodies) {
      this.world.removeCollider(h.collider);
      this.world.removeRigidBody(h.rigidBody);
    }
    this.bodies = [];
    this.activeBoulders = [];
    this.eventQueue.free();
  }
}
