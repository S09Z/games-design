// ── Game constants (derived from prototype.html) ──

export const W = 960;
export const H = 540;
export const GY = 468;       // ground Y in canvas coords

export const BLOCK_W = 34;
export const BLOCK_H = 24;
export const BLOCK_D = 16;

// Convert 2D prototype coords → 3D Rapier/Three coords
// prototype: x→right, y→down  |  three.js: x→right, y→up, z→depth
export function to3D(px: number, py: number, pz = 0) {
  return { x: px, y: GY - py, z: pz };
}

// Trebuchet
export const PV = to3D(230, 250);
export const AL = 180;
export const AS = 80;
export const SL = 76;
export const A_LOAD = 2.3;
export const A_REST = 5.8;
export const SF = 72;
export const RELEASE_P = 0.982;
const er = Math.pow(RELEASE_P, 5);
export const RELEASE_ANGLE = A_LOAD + (A_REST - A_LOAD) * er;
export const RELEASE_FRAME = Math.round(SF * RELEASE_P);

export const VMAX = 15;
export const AIM_MIN = 8;
export const AIM_MAX = 62;
export const POWER_MIN = 20;
export const POWER_MAX = 100;

export const BOULDER_RADIUS = 16;
export const BOULDER_DENSITY = 0.026;

export const GRAVITY = -30;
export const SETTLE_THRESHOLD = 1.5;
export const SETTLE_FRAMES = 26;
export const FLY_TIMEOUT = 300;

export const START_AMMO = 5;
export const SCORE_PER_KILL = 1000;
export const SCORE_PER_AMMO = 300;

export const LEVEL_NAME = 'LEVEL 1';
