# V2 Phase 2 — Camera (Auto-follow & Pan)

Goal: Camera auto-follows boulder after launch, supports drag-to-pan when idle.

## Changes

### `src/game/World.ts`
- Replace static `camera.position.set(...)` with an `update()` lerp system:
  - `target: { x, y }` — follows boulder position during flight
  - `CAM_FOLLOW_SPEED` — lerp factor (0.06)
  - Clamp target to `CAM_PAN_BOUNDS`
- Add drag-to-pan during aiming/settling phases:
  - On pointer drag (when not dragging aim slider): pan camera target
  - Differentiate: drag on trebuchet area = aim; drag elsewhere = pan
- Reset camera to `CAM_DEFAULT` on level restart

### `src/game/Effects.ts`
- Merge camera shake into new camera system (add offset to camera target, not direct position)
- Trajectory dots: update to use current camera position for overlay placement

### Remove old camera logic
- Remove manual `camera.position.set(...)` calls in render loop
- Remove any direct camera manipulation from other components

## Verification
- `npm run build` succeeds
- Camera follows boulder smoothly on launch
- Drag on empty space pans the view
- Drag on trebuchet still aims (not pan)
- Camera resets on level restart
- Camera shake still works during impact
