import RAPIER from '@dimforge/rapier3d-compat';
import type { BodyHandle } from './Bodies';
import { SETTLE_THRESHOLD } from '../config';

export interface CollisionResult {
  boulderImpact: boolean;
  highSpeedHit: boolean;
  bodiesToCrack: BodyHandle[];
}

/**
 * Detect collisions from Rapier EventQueue collision events.
 * Called after world.step(eventQueue).
 */
export function detectCollisions(
  eventQueue: RAPIER.EventQueue,
  boulderHandles: BodyHandle[],
  allBodies: BodyHandle[],
): CollisionResult {
  let boulderImpact = false;
  let highSpeedHit = false;
  const bodiesToCrack: BodyHandle[] = [];

  eventQueue.drainCollisionEvents((handle1, handle2, started) => {
    if (!started) return;

    const h1 = allBodies.find(h => h.collider.handle === handle1);
    const h2 = allBodies.find(h => h.collider.handle === handle2);
    if (!h1 || !h2) return;

    const vel1 = h1.rigidBody.linvel();
    const vel2 = h2.rigidBody.linvel();
    const rv = Math.hypot(vel1.x - vel2.x, vel1.y - vel2.y, vel1.z - vel2.z);
    const isBoulder = boulderHandles.includes(h1) || boulderHandles.includes(h2);

    if (rv > 5 && isBoulder) {
      boulderImpact = true;
      highSpeedHit = true;
    }

    if (rv > 3) {
      [h1, h2].forEach(h => {
        if (!boulderHandles.includes(h) && !h.rigidBody.isFixed() && h.userData.kind === 'block') {
          bodiesToCrack.push(h);
        }
      });
      highSpeedHit = true;
    }
  });

  return { boulderImpact, highSpeedHit, bodiesToCrack };
}

/**
 * Check if the system has settled (all dynamic bodies below speed threshold).
 */
export function isSettled(allBodies: BodyHandle[]): boolean {
  for (const h of allBodies) {
    if (h.rigidBody.isFixed() || h.rigidBody.isKinematic()) continue;
    const v = h.rigidBody.linvel();
    if (Math.hypot(v.x, v.y, v.z) > SETTLE_THRESHOLD) return false;
  }
  return true;
}
