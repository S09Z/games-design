# Phase 2 — Rendering (Three.js)

Goal: Replace all Canvas 2D draw calls from `prototype.html` with Three.js geometry + materials.  
**Highest effort phase (~60% of total work).**

## Tasks

### 2a — Background (`prototype.html:655-681`)

- [ ] **Sky gradient** → Three.js background or custom sky shader (`#9CC2D2 → #C9DDCF → #EFDEB4 → #F7D89A`)
- [ ] **Sun** → `PointLight` + emissive sphere at 3D position mapping (820, 110)
- [ ] **Sun glow** → sprite with radial gradient texture
- [ ] **Far hills** → curved `PlaneGeometry` with vertex color `#AEC6B2`
- [ ] **Near hills** → curved `PlaneGeometry` with vertex color `#86A06C`
- [ ] **Ground** → `PlaneGeometry` with gradient material `#82A268 → #5E7E47`

### 2b — Trebuchet (`prototype.html:683-816`)

- [ ] **Rear A-frame legs** → 2 cylinder/box meshes from (140,gy) to pivot
- [ ] **Front A-frame legs** → 2 thicker meshes from (110,gy) and (318,gy) to pivot
- [ ] **Forward brace** → 1 mesh from pivot to (374, gy-2)
- [ ] **Lower cross braces** → 2 meshes in X pattern
- [ ] **Upper cross braces** → 2 meshes in X pattern
- [ ] **Ground sill** → thick cylinder along ground between legs
- [ ] **Axle housing** → cylinder at pivot (230, 250), with bolt details
- [ ] **Throwing arm** → long box pivoting at center, rotates with quintic ease
- [ ] **Arm banding** → small cross-marks along arm
- [ ] **Counterweight chain** → thin cylinder + chain links
- [ ] **Counterweight box** → box with metal bar stripes
- [ ] **Counterweight rivets** → small spheres at corners
- [ ] **Sling rope (pre-fire)** → `THREE.Line` with dashed pattern from arm tip to boulder
- [ ] **Boulder (pre-fire)** → sphere at sling end with gradient material
- [ ] **Ground shadow** → dark ellipse `PlaneGeometry` with transparency

**Arm animation** (`prototype.html:568-585`):
- [ ] Quintic ease interpolation between `A_LOAD` (2.3 rad) and `A_REST` (5.8 rad)
- [ ] Release at frame `RELEASE_FRAME` → spawn boulder as Rapier body
- [ ] Sling swing physics: gravity-dominant start → centrifugal whip
- [ ] Snap to aim direction in last 8 frames

### 2c — Castle (`prototype.html:417-477, 959-1004`)

For each castle block in level data:
- [ ] `BoxGeometry` sized to block dimensions (bW=34, bH=24)
- [ ] `MeshStandardMaterial` with stone roughness (`#9A9284`)
- [ ] Dark stone variant (`#787268`)
- [ ] Wood beam material (`#9A6B38`)

Additional details:
- [ ] **Mortar lines** → thin geometry overlay or texture with cross-hatch lines
- [ ] **Arch gateway** → curved arch geometry at central keep (793, gy)
- [ ] **Arrow-slit windows** → dark inset planes (cols 630,676,759,817,786)
- [ ] **Flags** → triangular `ShapeGeometry` on poles at (665, 793, 917)
  - Red flag `#E8533A` at left tower, right barbican
  - Gold flag `#F2A93B` at central keep

### 2d — Enemies (`prototype.html:876-947`)

Choose **Option A** (simple 3D characters):

**Guard (3 total):**
- [ ] **Legs** → 2 thin cylinders
- [ ] **Body** → box with chainmail material (`#9A9284`)
- [ ] **Tabard** → overlay plane with `#E8533A`
- [ ] **Shield (left arm)** → box + cross decal
- [ ] **Spear (right arm)** → thin cylinder + cone tip
- [ ] **Head** → sphere (`#F5D9C0`)
- [ ] **Helmet** → dome geometry (`#8A8278`) + visor slit
- [ ] **Eyes** → 2 small dark spheres

**King (1 total):**
- [ ] **Cape** → plane with slight transparency (`rgba(232,83,58,.22)`)
- [ ] **Legs** → 2 thin cylinders
- [ ] **Gold robe** → box (`#F2A93B`) with belt
- [ ] **Sceptre** → thin cylinder + gold sphere + red gem
- [ ] **Head** → sphere
- [ ] **Crown** → custom geometry with 5 points + red gems
- [ ] **Beard** → small cone (`#C8A462`)
- [ ] **Facial features** → eyes + smile arc

### 2e — Effects

- [ ] **Trajectory preview** (`prototype.html:824-836`) → `CatmullRomCurve3` with dashed `LineBasicMaterial`, dot markers along path
- [ ] **Launch marker** → ring geometry at spawn point
- [ ] **Impact particles** (`prototype.html:616-626`) → `THREE.Points` with 12-20 debris sprites spawned on collision
  - Colors: `#C8A875`, `#9A9182`, `#E8D4A0`, `#D4965A`, `#B0A898`
  - Physics: random velocity, gravity, fade-out
  - Scale variants per particle radius
- [ ] **Dust puffs** → larger translucent circles that expand and fade
- [ ] **Camera shake** (`prototype.html:819-820`) → `camera.position` offset with decay factor 0.78, triggered on boulder impact (shake=12) and spawn (shake=5)
- [ ] **Crack marks** (`prototype.html:866-873`) → small line geometry overlaid on damaged blocks at crack levels 1-3
- [ ] **Block damage tint** → blend mesh material toward darker tint as `cl` counter increases

### 2f — Lighting

- [ ] `AmbientLight` — soft warm tone
- [ ] `DirectionalLight` — sun direction, `shadow.camera` bounds covering game area
- [ ] Enable shadow maps on renderer
- [ ] Cast shadows: trebuchet, castle blocks, boulder, enemies
- [ ] Receive shadows: ground plane, castle blocks

## Reference lines

| `prototype.html` lines | Feature |
|---|---|
| 655-681 | Background (sky, sun, hills, ground) |
| 683-816 | Trebuchet (full draw) |
| 417-477 | Castle blocks + enemies |
| 959-1004 | Castle details (arch, windows, flags, textures) |
| 876-947 | Enemy figures (guard + king) |
| 824-836 | Trajectory preview |
| 616-626 | Impact particles |
| 819-820 | Camera shake setup |
| 866-873 | Crack marks |

## Verification

- Scene looks visually faithful to the 2D prototype
- Trebuchet arm animates smoothly with quintic ease
- Boulder trajectory is visible before firing
- Castle blocks show damage cracks on impact
- Particles spawn on collision and fade naturally
- Shadows render correctly
- Camera shake feels punchy on impact
