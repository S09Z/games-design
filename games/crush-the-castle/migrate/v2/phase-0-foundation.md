# V2 Phase 0 — Foundation (Config, Types, State)

Goal: Add config, types, and state management for ammo types and camera system.

## Changes

### `src/config.ts`
- Add ammo type enum/constants:
  - `STANDARD` — single boulder, fast, current behavior
  - `SPREAD` — 3 boulders in fan pattern, medium speed
  - `HEAVY` — large boulder, slow, 2× size
- Add `AMMO_TYPES` config object with per-type params:
  - projectile count (1 / 3 / 1)
  - speed multiplier (1 / 0.85 / 0.7)
  - size multiplier (1 / 0.7 / 1.6)
  - spread angle (0 / 0.15 rad / 0)
- Add camera config:
  - `CAM_FOLLOW_SPEED` — lerp factor for auto-follow
  - `CAM_PAN_BOUNDS` — clamp region for panning
  - `CAM_DEFAULT` — default camera position

### `src/state/GameState.ts`
- Add `selectedAmmo` field (type: `'standard' | 'spread' | 'heavy'`)
- Add `ammoTypeChanged` event to EventBus
- Wire ammo type switching into game state

### EventBus (`src/state/events.ts`)
- Add event: `'ammo-type-changed'`

### New files
None — purely config/type changes.

## Verification
- `npm run build` succeeds
- Game loads without errors
- Ammo type defaults to `'standard'` (no visible behavior change yet)
