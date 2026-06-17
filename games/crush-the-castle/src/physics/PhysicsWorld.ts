import RAPIER from '@dimforge/rapier3d-compat';
import { events } from '../state/events';
import { GRAVITY, SETTLE_FRAMES, FLY_TIMEOUT } from '../config';
import {
  createGround, createWalls, createBlock, createEnemy, createBoulder, removeBody,
} from './Bodies';
import type { BodyHandle, LevelData } from './Bodies';
import { detectCollisions, isSettled } from './Collision';

export interface PhysicsSnapshot {
  bodies: BodyHandle[];
  boulder: BodyHandle | null;
}

export class PhysicsWorld {
  world!: RAPIER.World;
  eventQueue!: RAPIER.EventQueue;
  bodies: BodyHandle[] = [];
  boulder: BodyHandle | null = null;
  stillFrames = 0;
  flyFrames = 0;
  onBoulderLaunched: ((pos: { x: number; y: number; z: number }, vel: { x: number; y: number; z: number }) => void) | null = null;
  onBoulderRemoved: (() => void) | null = null;
  onEnemyKilled: ((idx: number) => void) | null = null;
  onTurnEnded: (() => void) | null = null;
  onCollisionImpact: (() => void) | null = null;

  async init() {
    await RAPIER.init();
    this.world = new RAPIER.World({ x: 0, y: GRAVITY, z: 0 });
    this.eventQueue = new RAPIER.EventQueue(false);
    this.bodies = [];
    this.boulder = null;
    this.stillFrames = 0;
    this.flyFrames = 0;
    events.emit('physics-ready');
  }

  loadLevel(level: LevelData) {
    // Clear existing
    for (const h of this.bodies) {
      this.world.removeCollider(h.collider);
      this.world.removeRigidBody(h.rigidBody);
    }
    this.bodies = [];
    this.boulder = null;
    this.stillFrames = 0;
    this.flyFrames = 0;
    this.eventQueue.clear();

    // Static bodies
    this.bodies.push(createGround(this.world));
    this.bodies.push(...createWalls(this.world));

    // Castle blocks
    for (const def of level.blocks) {
      this.bodies.push(createBlock(this.world, def));
    }

    // Enemies
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

  launchBoulder(pos: { x: number; y: number; z: number }, vel: { x: number; y: number; z: number }) {
    if (this.boulder) {
      removeBody(this.world, this.boulder);
      this.bodies = this.bodies.filter(h => h !== this.boulder);
    }
    const b = createBoulder(this.world, pos, vel);
    this.boulder = b;
    this.bodies.push(b);
    this.stillFrames = 0;
    this.flyFrames = 0;
    this.onBoulderLaunched?.(pos, vel);
    events.emit('boulder-launched', pos, vel);
  }

  /**
   * Step the physics, check collisions, settle detection, enemy death.
   * Returns true if the turn ended (win/lose or ready for next shot).
   */
  step(): { active: boolean; nextState: 'aiming' | 'lost' | 'won' | null } {
    this.world.step(this.eventQueue);

    // Collision detection
    const col = detectCollisions(this.eventQueue, this.boulder, this.bodies);
    if (col.boulderImpact) {
      this.onCollisionImpact?.();
      events.emit('collision-impact');
    }
    for (const h of col.bodiesToCrack) {
      h.userData.cl = Math.min(3, (h.userData.cl || 0) + 1);
    }

    // Enemy death check — displacement from spawn
    for (const e of this.enemies) {
      if (e.userData.dead) continue;
      const ep = e.rigidBody.translation();
      const sp = e.userData.spawnPos!;
      const dist = Math.hypot(ep.x - sp.x, ep.y - sp.y, ep.z - sp.z);
      if (dist > 82 || ep.y < -10 || ep.x < -30 || ep.x > 990) {
        e.userData.dead = true;
        this.onEnemyKilled?.(this.enemies.indexOf(e));
        events.emit('enemy-killed', this.enemies.indexOf(e));
      }
    }

    // Boulder cleanup
    if (this.boulder) {
      const bp = this.boulder.rigidBody.translation();
      if (bp.y < -20 || bp.x < -40 || bp.x > 1000) {
        removeBody(this.world, this.boulder);
        this.bodies = this.bodies.filter(h => h !== this.boulder);
        this.boulder = null;
        this.onBoulderRemoved?.();
        events.emit('boulder-removed');
      }
    }

    // Fly frame counter
    if (this.boulder || this.flyFrames > 0) {
      this.flyFrames++;
    }

    // Settle detection
    const settled = isSettled(this.dynamicBodies);
    if (settled && (this.boulder || this.flyFrames > 20)) {
      this.stillFrames++;
    } else {
      this.stillFrames = 0;
    }

    if (this.stillFrames >= SETTLE_FRAMES || this.flyFrames > FLY_TIMEOUT) {
      this.onTurnEnded?.();
      events.emit('turn-ended');
      return { active: false, nextState: null }; // caller determines win/lose
    }

    return { active: true, nextState: null };
  }

  destroy() {
    for (const h of this.bodies) {
      this.world.removeCollider(h.collider);
      this.world.removeRigidBody(h.rigidBody);
    }
    this.bodies = [];
    this.boulder = null;
    this.eventQueue.free();
  }
}
