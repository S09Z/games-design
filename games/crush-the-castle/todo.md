# Crush the Castle — Three.js + Rapier Migration

## Stack
| Layer | Choice |
|-------|--------|
| Rendering | **Three.js** (3D, replaces Phaser/Canvas 2D) |
| Physics | **Rapier** (WASM 3D rigid body, replaces Matter.js) |
| UI | **React** (component tree, replaces DOM overlays) |
| Build | **Vite** (already in place) |
| Language | **TypeScript** |

## Key insight
The prototype is **960×540 2D** with hand-drawn Canvas art & Matter.js physics.  
The entire game is **procedural 2D draw calls** — no sprites.  
Porting to 3D is a **creative re-imagining**, not a 1:1 port.

## Status
- 🔴 Not started
- 🟡 In progress
- 🟢 Complete

**Current phase:** Complete ✅

---

## Phases

| # | Phase | File | Risk | Status |
|---|-------|------|------|--------|
| 0 | Foundation Setup | [`migrate/phase-0-foundation.md`](migrate/phase-0-foundation.md) | Low | ✅ |
| 1 | Physics (Rapier) | [`migrate/phase-1-physics.md`](migrate/phase-1-physics.md) | Medium | ✅ |
| 2 | Rendering (Three.js) | [`migrate/phase-2-rendering.md`](migrate/phase-2-rendering.md) | **High** | ✅ |
| 3 | Game Logic | [`migrate/phase-3-game-logic.md`](migrate/phase-3-game-logic.md) | Medium | ✅ |
| 4 | Input | [`migrate/phase-4-input.md`](migrate/phase-4-input.md) | Low | ✅ |
| 5 | UI (React) | [`migrate/phase-5-ui.md`](migrate/phase-5-ui.md) | Low | ✅ |
| 6 | Audio | [`migrate/phase-6-audio.md`](migrate/phase-6-audio.md) | Low | ✅ |
| 7 | Polish & Cleanup | [`migrate/phase-7-polish.md`](migrate/phase-7-polish.md) | Medium | ✅ |

---

## Phase 0 — Foundation Setup ✅

**Files created:**
- `src/main.tsx` — React entry point (StrictMode + createRoot)
- `src/App.tsx` — Root component with Three.js scene + debug renderer + physics integration
- `src/config.ts` — Game constants (W, H, GY, block sizes, trebuchet params, physics params)
- `src/vite-env.d.ts` — Vite client type reference
- `src/physics/` — Physics module structure
- `src/state/` — State management module structure
- `src/game/Level.ts` — Level data (Level 1 castle layout)
- `index.html` — Vite entry HTML
- `vite.config.js` — Vite + React plugin config
- `tsconfig.json` — TypeScript config (ES2020, strict, jsx-react)
- `package.json` — Dependencies (Three.js 0.174, Rapier 0.14, React 19, Vite 8)

**Verification:**
- ✅ `npm run dev` starts without errors
- ✅ `npm run build` produces dist/
- ✅ React root mounts in browser
- ✅ Three.js viewport renders with lights, shadows
- ✅ All dependencies resolve without warnings

---

## Phase 1 — Physics (Rapier) ✅

### 1a — World setup
- ✅ Initialize Rapier WASM (`RAPIER.init()`) in `PhysicsWorld.init()`
- ✅ Create `RAPIER.World` with gravity `{ x: 0, y: -30, z: 0 }`
- ✅ Create `EventQueue` for collision event collection
- ✅ Ground plane (static cuboid, friction 0.9)
- ✅ Wall boundaries (static cuboids at left/right edges)

### 1b — Castle blocks
- ✅ Stone blocks at left watchtower, central keep, right barbican
- ✅ Dark stone blocks (rows 4+ at keep)
- ✅ Wood beams at varying widths/positions

### 1c — Enemies
- ✅ 3 guards + 1 king with custom data (`enemyType`, `dead`, `spawnPos`)

### 1d — Boulder
- ✅ Sphere collider (r=16), density .026, restitution .2, friction .4

### 1e — Collision events
- ✅ `EventQueue.drainCollisionEvents` on all dynamic colliders
- ✅ Boulder impact detection + crack level increment

### 1f — Settle detection
- ✅ Velocity threshold 1.5 for 26 consecutive frames

### 1g — Body sync
- ✅ Map + position/rotation copy each frame

---

## Phase 2 — Rendering (Three.js) ✅

### 2a — Background
- ✅ **Sky gradient** → canvas texture on `scene.background` (`#9CC2D2` → `#C9DDCF` → `#EFDEB4` → `#F7D89A`)
- ✅ **Sun** → emissive sphere at 3D position (820, GY-110)
- ✅ **Sun glow** → sprite with radial gradient texture
- ✅ **Far hills** → `ShapeGeometry` with color `#AEC6B2`
- ✅ **Near hills** → `ShapeGeometry` with color `#86A06C`
- ✅ **Ground** → `PlaneGeometry` with `MeshStandardMaterial` `#82A268`

### 2b — Trebuchet
- ✅ **Rear/front A-frame legs** → 4 `BoxGeometry` beams from ground to pivot
- ✅ **Forward brace** → beam from pivot to (374, gy-2)
- ✅ **Lower/upper cross braces** → 2 X-pattern beam pairs
- ✅ **Ground sill** → thick beam along ground between legs
- ✅ **Axle housing** → cylinder + bolt details at pivot
- ✅ **Throwing arm** → long box with quintic ease rotation (`A_LOAD` 2.3 → `A_REST` 5.8 rad)
- ✅ **Arm banding** → cross-marks along arm at intervals
- ✅ **Counterweight chain** → thin cylinder
- ✅ **Counterweight box** → box with metal bar stripes + rivet spheres
- ✅ **Sling rope** → `THREE.Line` from arm tip to boulder (visible pre-fire)
- ✅ **Boulder (pre-fire)** → sphere at sling end with gradient material
- ✅ **Ground shadow** → dark `PlaneGeometry` with opacity
- ✅ **Quintic ease interpolation** for arm swing animation
- ✅ **Sling snap** to aim direction in last frames before release

### 2c — Castle
- ✅ **Block materials** → `MeshStandardMaterial` per type (stone `#9A9284`, darkStone `#787268`, wood `#9A6B38`)
- ✅ **Block damage tint** → material darkens as `cl` counter increases (12% per level)
- ✅ **Arch gateway** → `ShapeGeometry` at central keep (793, gy) with border line
- ✅ **Arrow-slit windows** → 5 `PlaneGeometry` dark insets at tower/keep positions
- ✅ **Flags** → triangular `ShapeGeometry` + pole cylinders at (665, `#E8533A`), (793, `#F2A93B`), (917, `#E8533A`)

### 2d — Enemies
- ✅ **Guard (×3)**: legs + chainmail body (`#9A9284`) + red tabard (`#E8533A`) + shield (`#8A5A30` with red cross) + spear (`#B0B8C0` tip) + head (`#F5D9C0`) + eyes + helmet (`#8A8278`) + visor slit
- ✅ **King (×1)**: cape (translucent `#E8533A`) + gold robe (`#F2A93B`) + belt + sceptre + head + crown (5-point with red gems) + beard (`#C8A462`) + eyes

### 2e — Effects
- ✅ **Trajectory preview** → 30 dotted markers + dashed `LineDashedMaterial` along parabolic path
- ✅ **Launch marker** → `RingGeometry` at spawn point
- ✅ **Impact particles** → `SphereGeometry` debris (12-20 particles, 5 colors, random velocity + gravity + fade)
- ✅ **Dust puffs** → larger translucent spheres that expand and fade
- ✅ **Camera shake** → offset with decay factor `0.78`, triggered on boulder impact (shake=12) and spawn (shake=5)

### 2f — Lighting
- ✅ `AmbientLight` — soft warm tone (0.6 intensity)
- ✅ `DirectionalLight` — sun direction, shadow map 2048, camera bounds covering game area
- ✅ Shadow maps enabled on renderer
- ✅ Cast shadows: trebuchet, castle blocks, boulder
- ✅ Receive shadows: ground plane, castle blocks

### New files created
| File | Purpose |
|------|---------|
| `src/game/World.ts` | Scene setup, camera, renderer, lighting |
| `src/game/Background.ts` | Sky gradient, sun glow, hills, ground plane |
| `src/game/Trebuchet.ts` | 3D trebuchet model + quintic arm animation |
| `src/game/Castle.ts` | Block materials, arch, windows, flags, damage tint |
| `src/game/Enemy.ts` | Guard + king 3D character models |
| `src/game/Particles.ts` | Impact particle system + dust puffs |
| `src/game/Effects.ts` | Camera shake + trajectory preview |

### Verification
- ✅ `npm run build` compiles cleanly (33 modules)
- ✅ Dev server starts on port 3000
- ✅ Scene shows full background (sky, sun, hills, ground)
- ✅ Trebuchet 3D model renders with moving arm
- ✅ Castle blocks render with correct materials
- ✅ Flag poles + banners visible
- ✅ Trajectory preview visible during aiming
- ✅ Particles spawn on collision
- ✅ Camera shake on boulder impact
- ✅ Shadows render on ground and objects

---

## Phase 7 — Polish & Cleanup ✅

### Cleanup
- ✅ Removed old `js/` folder (prototype code fully ported)
- ✅ Removed old `css/` folder (styles in `index.html` and React inline)
- ✅ Removed `game-standalone.html` (replaced by `index.html`)
- ✅ Updated `vite.config.js` to use `index.html` as build entry
- ✅ Removed `dist/` (clean rebuild)
- ✅ Removed unused `src/physics/index.ts` barrel file

### Responsive
- ✅ Container uses `max-width: 960px; width: 100%; aspect-ratio: 16/9` for fluid sizing
- ✅ Three.js renderer resizes with window (camera aspect + renderer size)
- ✅ Canvas `touch-action: none` prevents mobile scroll/zoom

### Performance
- ✅ `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`

### Verification
- ✅ `npm run build` succeeds (2,811 KB inline bundle)
- ✅ `npm run dev` starts without errors
- ✅ Full game loop: Menu → Play → Aim → Fire → Win/Lose → Modal
