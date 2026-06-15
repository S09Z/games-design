# Crush the Castle — Phaser 3 Migration

## Status
- 🔴 Not started
- 🟡 In progress
- 🟢 Complete

**Current phase:** Phase 2  
(Phase 0 ✅ — Phase 1 ✅)

---

## Phase 0 — Analysis & Preparation ✅

- [x] Read the tech stack doc to understand the current architecture
- [x] Install Phaser 3 and set up bundler (Vite)
- [x] Create Phaser game config and entry point (`vite.config.js`, `src/main.js`, `src/config.js`)
- [x] Create project directory structure (`src/scenes/`)
- [x] Verify build succeeds (16 modules, no errors)

---

## Phase 1 — Scene Shell ✅

Build the skeleton scene system so we have something to render into.

- [x] Create `BootScene` — shows loading overlay, transitions to MenuScene after 600ms
- [x] Create `MenuScene` — main menu overlay, Play → GameScene, Level Select → LevelSelectScene
- [x] Create `LevelSelectScene` — dynamic grid of 5 level buttons
- [x] Create `GameScene` — placeholder rendering (sky, ground, level label), click to test win transition
- [x] Create `LevelCompleteScene` — victory overlay with stars, score, Next Level / Retry / Menu buttons
- [x] Create `GameOverScene` — defeat overlay with Try Again / Menu buttons
- [x] Wire up scene transitions (Boot → Menu → Game → LevelComplete/Menu)
- [x] Update `index.html` — game-container div, Vite entry, remove old canvas/scripts

---

## Phase 2 — Physics (Matter.js)

Port the custom physics engine to Matter.js (built into Phaser). **Highest risk phase.**

- [ ] Create `MatterGameConfig` — set gravity, ground body, world bounds
- [ ] Port `Body` creation — map material props (friction, restitution, density) to Matter.js body options
- [ ] Port structure bodies — static/dynamic rectangles from level JSON
- [ ] Port enemy bodies — dynamic rectangles with custom labels
- [ ] Port projectile bodies — circle bodies with high velocity
- [ ] Port collision damage system — listen to `collisionstart`, compute impact speed, apply health damage
- [ ] Port material-based collision (stone vs wood impact sounds)
- [ ] Port explosion forces — `Body.applyForce()` in radius around center
- [ ] Port ground collision — static ground body with friction
- [ ] Port sleeping system — `Body.setStatic()` when velocity is low enough
- [ ] Port projectile detonation — explosive type detonates on collision
- [ ] Verify physics feel matches original (gravity, bounce, friction)

---

## Phase 3 — Game Logic

Port LevelManager and game state to work with Phaser scenes and Matter.js events.

- [ ] Create `LevelDataLoader` — fetch and cache JSON level files (keep as-is)
- [ ] Create `GameState` class — manages ammo queue, score, enemies alive, win/lose
- [ ] Port `fire()` — spawn Matter circle body from trebuchet position with velocity
- [ ] Port projectile lifecycle — track active projectile, detect settle, trigger end conditions
- [ ] Port score system — enemy kills (+500), structure destroyed (+100), ammo bonus
- [ ] Port star calculation from score thresholds
- [ ] Port win/lose conditions — all enemies dead vs out of ammo + nothing moving
- [ ] Port save manager (localStorage, keep as-is)
- [ ] Port analytics stub (keep as-is)

---

## Phase 4 — Rendering

Replace Canvas 2D draw calls with Phaser Graphics objects.

- [ ] Port background rendering — sky gradient, mountains, clouds, trees
- [ ] Port ground rendering — dirt + grass strip
- [ ] Port trebuchet drawing — base, wheels, arm, counterweight, sling (Phaser Graphics)
- [ ] Port aim trajectory preview — dotted arc line with color per ammo type
- [ ] Port structure rendering — colored rectangles with cracks, damage tint, wood grain
- [ ] Port enemy rendering — soldier with helmet, shield, health bar
- [ ] Port projectile rendering — rock (gray circle), explosive (red + fuse), ice (blue + glint)
- [ ] Port explosion effect — radial gradient that grows and fades (tween or Graphics)
- [ ] Port particle spawning — use Phaser `ParticleEmitter` for debris and explosions
- [ ] Debug overlay — FPS counter, hitbox toggle

---

## Phase 5 — Camera

- [ ] Configure Phaser camera bounds
- [ ] Port projectile following — `camera.startFollow()` on projectile spawn
- [ ] Port smooth lerp — camera lerp for polished feel
- [ ] Port camera reset on level start/restart

---

## Phase 6 — Input

- [ ] Port pointer input — mousedown/touch to aim, release to fire
- [ ] Port angle/power calculation from pointer distance relative to trebuchet
- [ ] Port keyboard input — Space to fire, Esc to pause, F for FPS, H for hitboxes
- [ ] Port mobile fire button
- [ ] Port input enable/disable based on game state

---

## Phase 7 — Audio

**Decision needed:** keep Web Audio API (procedural) or pre-record assets.

### Option A — Keep Web Audio (faster, less authentic)
- [ ] Keep `audioManager.js` as-is alongside Phaser
- [ ] Hook audio calls into game events (fire, impact, explosion, win, lose)

### Option B — Pre-record assets (recommended for quality)
- [ ] Record/generate 11 sound effects as OGG/WAV
- [ ] Load sounds in BootScene
- [ ] Replace procedural calls with `this.sound.play('name')`

---

## Phase 8 — UI (DOM Overlays)

Keep existing CSS/HTML UI to avoid rewriting 300 lines of DOM logic in Phaser.

- [ ] Show/hide DOM overlays from Phaser scene lifecycle methods
- [ ] Wire button clicks to scene transitions
- [ ] Keep HUD (score, ammo, level name) as DOM elements
- [ ] Keep level select grid rendering
- [ ] Port mute button, volume control

---

## Phase 9 — Polish & Testing

- [ ] Test all 5 levels end-to-end
- [ ] Verify physics feel is on-par with original
- [ ] Test mobile touch input
- [ ] Test save/load progression
- [ ] Test edge cases: out of ammo, all enemies dead, explosive mid-air detonation
- [ ] Remove all old JS files and HTML script tags
- [ ] Remove old CSS no longer needed (animations, responsive)
- [ ] Remove old `package.json` dependencies (headroom-ai if unused)
- [ ] Clean up unused assets

---

## Effort Summary

| Phase | Estimate | Risk | Status |
|---|---|---|---|---|
| 0 — Preparation | 2–3h | Low | ✅ |
| 1 — Scene Shell | 6–8h | Low | ✅ |
| 2 — Physics | 10–15h | **High** | 🔴 |
| 3 — Game Logic | 4–6h | Medium | 🔴 |
| 4 — Rendering | 8–12h | Medium | 🔴 |
| 5 — Camera | 1h | Low | 🔴 |
| 6 — Input | 1–2h | Low | 🔴 |
| 7 — Audio | 2–6h | Low | 🔴 |
| 8 — UI Overlays | 2h | Low | 🔴 |
| 9 — Polish | 4–6h | Medium | 🔴 |
| **Total** | **40–60h** | |
