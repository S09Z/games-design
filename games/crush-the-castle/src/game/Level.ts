import {
  GY, BLOCK_W, BLOCK_H, BLOCK_D, to3D,
} from '../config';
import type { BlockDef, EnemyDef, LevelData } from '../physics/Bodies';

// Level 1 — exact layout from prototype.html buildCastle()
// All coordinates are in 2D canvas space (x→right, y→down) and converted via to3D
const gy = GY;
const bW = BLOCK_W, bH = BLOCK_H;

function stone(x: number, y: number, w = bW, h = bH, dark = false): BlockDef {
  return { pos: to3D(x, y), size: to3D(w, h, BLOCK_D), material: dark ? 'darkStone' as const : 'stone' as const };
}

function wood(x: number, y: number, w: number, h = 18): BlockDef {
  return { pos: to3D(x, y), size: to3D(w, h, BLOCK_D), material: 'wood' as const };
}

function enemy(x: number, y: number, type: 'guard' | 'king'): EnemyDef {
  const s = type === 'king' ? to3D(24, 30) : to3D(24, 24);
  return { pos: to3D(x, y), size: s, type };
}

/**
 * Level 1 — The Siege
 */
export const level1: LevelData = {
  name: 'The Siege',
  blocks: [
    // ── LEFT WATCHTOWER (cols 647,683 · cx=665) ──
    ...[0, 1, 2, 3, 4, 5].flatMap(r => [
      stone(647, gy - bH / 2 - r * bH),
      stone(683, gy - bH / 2 - r * bH),
    ]),
    wood(665, gy - 3 * bH - 8, bW * 2 + 10),
    stone(647, gy - 6 * bH - 10, bW - 10, 18),
    stone(683, gy - 6 * bH - 10, bW - 10, 18),

    // ── LEFT RAMPART (cx=730, w=74) ──
    stone(730, gy - bH / 2, 74),
    stone(730, gy - bH * 1.5, 74),

    // ── CENTRAL KEEP (cols 773,813 · cx=793) ──
    ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap(r => [
      stone(773, gy - bH / 2 - r * bH, bW - 8, bH, r >= 4),
      stone(813, gy - bH / 2 - r * bH, bW - 8, bH, r >= 4),
    ]),
    wood(793, gy - 4 * bH - 8, bW * 1.2, 16),
    stone(793, gy - 8 * bH - 10, bW * 1.4, 16, true),
    stone(773, gy - 8 * bH - 24, bW - 12, 14, true),
    stone(813, gy - 8 * bH - 24, bW - 12, 14, true),

    // ── RIGHT RAMPART (cx=862, w=74) ──
    stone(862, gy - bH / 2, 74),
    stone(862, gy - bH * 1.5, 74),

    // ── RIGHT BARBICAN (cols 900,934 · cx=917) ──
    ...[0, 1, 2, 3, 4].flatMap(r => [
      stone(900, gy - bH / 2 - r * bH),
      stone(934, gy - bH / 2 - r * bH),
    ]),
    wood(917, gy - 2 * bH - 8, bW * 2 + 10),
    stone(900, gy - 5 * bH - 10, bW - 10, 18),
    stone(934, gy - 5 * bH - 10, bW - 10, 18),
  ],
  enemies: [
    enemy(665, gy - 6 * bH - 34, 'guard'),
    enemy(793, gy - 4 * bH - 34, 'king'),
    enemy(908, gy - 5 * bH - 34, 'guard'),
    enemy(926, gy - 5 * bH - 34, 'guard'),
  ],
  // World bounds (in 3D coords)
  bounds: {
    left: -30,
    right: W + 30,
  },
};

const W = 960;

export const levels = [level1];
