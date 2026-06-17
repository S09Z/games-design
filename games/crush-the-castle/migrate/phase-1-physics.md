# Phase 1 — Physics (Rapier)

Goal: Port all Matter.js physics from `prototype.html` to Rapier 3D.  
All physics stays 2D-plane constrained (XZ) to preserve the original feel.  
Rapier bodies are invisible at this phase — verified via debug rendering.

## Reference: `prototype.html:348-477`

## Tasks

### 1a — World setup
- [ ] Initialize Rapier WASM (`RAPIER.init()`)
- [ ] Create `RigidBodySet` + `ColliderSet` + `IntegrationParameters`
- [ ] Set gravity `{ x: 0, y: -9.81, z: 0 }` — adjust scale to match Matter.js feel
- [ ] Create ground plane (static collider at y=0, full width)
- [ ] Create wall boundaries (static, left/right edges)

### 1b — Castle blocks
Reference: `prototype.html:417-477`
- [ ] Port cobblestone floor (`mkS`) — dynamic box colliders
  - Left tower: cols 647,683 (×6 rows each)
  - Central keep: cols 773,813 (×8 rows each)
  - Right barbican: cols 900,934 (×5 rows each)
- [ ] Port dark stone blocks — `mkS` with `dk=true` (keep rows 4+)
- [ ] Port wood beams — `mkW` varying widths at specific heights
- [ ] Port mortar lines → skip (visual only, handled in Phase 2)

### 1c — Enemies
Reference: `prototype.html:437-443`
- [ ] Create guard body — dynamic capsule/box collider at (665, gy-6bh-34)
- [ ] Create guard bodies — 2 guards at (908, gy-5bh-34), (926, gy-5bh-34)
- [ ] Create king body — dynamic capsule at (793, gy-4bh-34)
- [ ] Attach custom data: `type: 'guard'|'king'`, `dead: false`, spawn position

### 1d — Boulder
- [ ] Create boulder body — dynamic sphere collider (radius 16)
- [ ] Set density to match Matter.js `density: .026`
- [ ] Configure restitution (.2), friction (.4) to match `prototype.html:576`

### 1e — Collision events
- [ ] Subscribe to `ContactEvent` (`RapierEventType.ContactEvent`)
- [ ] On contact with boulder + high relative velocity → mark bodies as hit
- [ ] On contact (any) with sufficient speed → increment crack counter on body

### 1f — Settle detection
Reference: `prototype.html:606-609`
- [ ] Every physics tick, scan all dynamic bodies
- [ ] If max velocity < threshold (e.g. 1.5) for 26 consecutive frames → trigger `endTurn`
- [ ] Reset frame counter if any body exceeds threshold

### 1g — Body sync
- [ ] After each `physicsStep()`, copy Rapier positions/rotations → Three.js mesh transforms
- [ ] Store mapping: `Map<RapierBody, ThreeMesh>`

## Verification

- Rapier WASM loads without error
- Castle blocks stack and settle realistically
- Boulder falls with gravity, bounces on ground
- Collision events fire correctly
- Settle detection triggers after everything comes to rest
- Physics feel matches reference (gravity scale, bounce height, friction slide)
