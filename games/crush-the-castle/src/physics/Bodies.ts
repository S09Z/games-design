import RAPIER from '@dimforge/rapier3d-compat';
import { BOULDER_RADIUS, BOULDER_DENSITY, GY, W } from '../config';

// ── Types ──

export interface Vec3 { x: number; y: number; z: number }

export interface BlockDef {
  pos: Vec3;
  size: Vec3;
  material: 'stone' | 'darkStone' | 'wood';
}

export interface EnemyDef {
  pos: Vec3;
  size: Vec3;
  type: 'guard' | 'king';
}

export interface LevelData {
  name: string;
  blocks: BlockDef[];
  enemies: EnemyDef[];
  bounds: { left: number; right: number };
}

export interface BodyHandle {
  rigidBody: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  userData: {
    kind: 'block' | 'enemy' | 'boulder' | 'ground' | 'wall';
    material?: 'stone' | 'darkStone' | 'wood';
    enemyType?: 'guard' | 'king';
    dead?: boolean;
    spawnPos?: Vec3;
    cl?: number;          // crack level 0-3
  };
}

// ── Body factory ──

export function createGround(world: RAPIER.World, halfDepth = 40): BodyHandle {
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(W / 2, 0, 0));
  const collider = world.createCollider(
    RAPIER.ColliderDesc.cuboid(W + 200, 1, halfDepth)
      .setFriction(0.9),
    body,
  );
  return { rigidBody: body, collider, userData: { kind: 'ground', cl: 0 } };
}

export function createWalls(world: RAPIER.World, halfDepth = 40): BodyHandle[] {
  const h = 540;
  const desc = (x: number) =>
    RAPIER.RigidBodyDesc.fixed().setTranslation(x, GY / 2, 0);
  const col = (x: number) =>
    RAPIER.ColliderDesc.cuboid(1, GY, halfDepth).setFriction(0.3);
  return [
    { x: -30 },
    { x: W + 30 },
  ].map(({ x }) => {
    const body = world.createRigidBody(desc(x));
    const collider = world.createCollider(col(x), body);
    return { rigidBody: body, collider, userData: { kind: 'wall', cl: 0 } };
  });
}

export function createBlock(world: RAPIER.World, def: BlockDef): BodyHandle {
  const hw = def.size.x / 2, hh = def.size.y / 2, hd = def.size.z / 2;
  const friction = def.material === 'wood' ? 0.7 : 0.55;
  const restitution = 0.08;
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(def.pos.x, def.pos.y, def.pos.z)
      .setCanSleep(true),
  );
  const collider = world.createCollider(
    RAPIER.ColliderDesc.cuboid(hw, hh, hd)
      .setFriction(friction)
      .setRestitution(restitution)
      .setDensity(1.0)
      .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
    body,
  );
  return {
    rigidBody: body,
    collider,
    userData: { kind: 'block', material: def.material, cl: 0 },
  };
}

export function createEnemy(world: RAPIER.World, def: EnemyDef): BodyHandle {
  const hw = def.size.x / 2, hh = def.size.y / 2, hd = def.size.z / 2;
  const friction = 0.4;
  const restitution = def.type === 'king' ? 0.2 : 0.25;
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(def.pos.x, def.pos.y, def.pos.z)
      .setCanSleep(true),
  );
  const collider = world.createCollider(
    RAPIER.ColliderDesc.cuboid(hw, hh, hd)
      .setFriction(friction)
      .setRestitution(restitution)
      .setDensity(1.0)
      .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
    body,
  );
  return {
    rigidBody: body,
    collider,
    userData: {
      kind: 'enemy',
      enemyType: def.type,
      dead: false,
      spawnPos: { ...def.pos },
      cl: 0,
    },
  };
}

export function createBoulder(world: RAPIER.World, pos: Vec3, vel: Vec3, radius = BOULDER_RADIUS): BodyHandle {
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(pos.x, pos.y, pos.z)
      .setLinvel(vel.x, vel.y, vel.z)
      .setCanSleep(false),
  );
  const collider = world.createCollider(
    RAPIER.ColliderDesc.ball(radius)
      .setFriction(0.4)
      .setRestitution(0.2)
      .setDensity(BOULDER_DENSITY * 100)
      .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS),
    body,
  );
  return {
    rigidBody: body,
    collider,
    userData: { kind: 'boulder', cl: 0 },
  };
}

export function removeBody(world: RAPIER.World, handle: BodyHandle) {
  world.removeCollider(handle.collider);
  world.removeRigidBody(handle.rigidBody);
}
