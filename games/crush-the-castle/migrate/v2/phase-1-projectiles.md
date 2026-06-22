# V2 Phase 1 — Projectiles (Spread & Heavy)

Goal: Implement Spread (3× fan) and Heavy (large/slow) ammo types.

## Changes

### `src/physics/PhysicsWorld.ts`
- Refactor `launchBoulder()` to accept ammo type config from `GameState.selectedAmmo`
- For **Spread**: launch 3 boulders in a fan pattern (±0.15 rad from aim angle)
- For **Heavy**: single boulder with `sizeMul: 1.6`, `speedMul: 0.7`
- For **Standard**: unchanged behavior
- Track multiple active boulders (remove single-boulder assumption)
  - `activeBoulders: RigidBody[]` array instead of single reference
  - Wait for ALL active boulders to settle/despawn before `endTurn`
- Pass `radius` per ammo type to `createBoulder()`

### `src/physics/Bodies.ts`
- `createBoulder()` accepts `radius` param instead of hardcoded `BOULDER_RADIUS`
- Apply density consistently across sizes

### `src/game/World.ts`
- Listen for `'boulder-launched'` with ammo type info
- Remove check for single boulder — iterate any active boulders for trajectory/effects

### `config.ts`
- (Already done in Phase 0 — `AMMO_TYPES` has `count`, `speedMul`, `sizeMul`, `spreadRad`)

## Verification
- `npm run build` succeeds
- Select "Spread" → fire → 3 boulders fly in fan pattern
- Select "Heavy" → fire → large slow boulder
- Select "Standard" → fire → normal boulder
- Turn ends when ALL projectiles settle
