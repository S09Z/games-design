# Hand of God — Project Instructions

Single-file isometric god-game in vanilla JS + Canvas 2D + Web Audio. The player drags villagers, throws them, and casts spells (fire / lightning / wind / meteor / necromancer) on a procedurally-rendered village. No external assets, no build step, no dependencies.

---

## How to run

```bash
# Open directly in a browser — no server needed.
open god-hands/index.html
```

Or drag `god-hands/index.html` onto any browser. There is no build, no test runner, no package manager. Open dev tools to see console errors.

## File layout

| File | Role |
|---|---|
| `god-hands/index.html` | Markup — canvas, HUD, spellbar, settings panel, info panel. References `style.css` and `game.js` directly. |
| `god-hands/style.css` | All UI styling (HUD, spellbar, panels, hamburger button, info button, mute button). |
| `god-hands/game.js` | The entire game (≈ 3820 lines). Sectioned by `// ----------` comment headers. |
| `god-hands/CLAUDE.md` | Behavioral rules for AI assistants. |
| `god-hands/TODO.md` | Living progress log, status table per phase, scope sketches for future phases. |
| `god-hands/design.md` | Original game-design doc, updated as state changes (state machine, spell list, phase status). |
| `god-hands/MEMORY.md` | Cross-session facts: user preferences, sticky project decisions, shipped PRs. |

## game.js section map

Sections are introduced by `// ---------- Title ----------` comments. The natural reading order is roughly top-to-bottom:

1. **CONFIG / SPELL_COLORS / BUILDING_PALETTES / state** — constants, central state object, `clampOrigin()`.
2. **Isometric projection** — `worldToScreen(wx, wy, wz)` + `screenToWorld(sx, sy)`. Origin is `state.originX/Y`; the rest of the engine treats screen-space as a function of those two plus tile dimensions.
3. **Tile map / Buildings / Trees** — placement and rendering. Trees use pre-rendered offscreen-canvas sprites built once at `initTrees()`.
4. **NPC** — `makeNPC()`, AI state machine in `updateNPC()`, the `computeNPCAppearance()` model + part drawers (shadow, body parts, hair, headgear, weapon).
5. **Hand / mouse handlers** — `onMouseDown/Move/Up`, pick logic, throw physics, RTS-style pan when HAND spell selected on empty ground.
6. **Spells** — `castFireball / castLightning / castWind / castMeteor / castNecromancer` + their projectile / decal / particle systems.
7. **Effects** — particles, blood/crater decals, screen shake, necro-cast rings.
8. **Audio** — `ensureAudio()`, per-spell SFX, tavern theme music scheduler, vocal SFX (`playBurnScream` / `playDeathGrunt`).
9. **Render / loop / resize / init** — the main animation frame, drawables depth-sort, minimap, init wiring.

## State, in one place

Everything mutable lives on the single `state` object near the top of `game.js`. Memorize these fields:

- `state.npcs[]`, `state.buildings[]`, `state.trees[]`, `state.tiles[][]` — world.
- `state.particles[]`, `state.projectiles[]`, `state.lightningBolts[]`, `state.bloodDecals[]`, `state.craterDecals[]`, `state.necroCasts[]` — effects.
- `state.hand` — cursor / grabbed NPC / drag history.
- `state.pan` — pan-with-Hand drag.
- `state.filters` — per-category appearance filter sets (class / race / gender / age).
- `state.music` — tavern theme scheduler.
- `state.targetCount` — slider value, drives `updateRespawn()`.
- `state.originX/Y`, `state.width/height`, `state.dpr` — viewport.

## Render pipeline

`render()` runs once per frame:

1. Clear screen, apply shake transform.
2. Render tiles, blood/crater decals, hover ring.
3. Build a `drawables[]` array of `{ depth, kind, ref }` for every NPC / particle / projectile / building / tree.
4. Stable-sort by `depth = wx + wy` (back-to-front in iso).
5. Walk the sorted list, dispatch to `drawNPC` / `drawParticle` / `drawProjectile` / `drawBuilding` / `drawTree`.
6. White silhouette pass for NPCs occluded by buildings (case A: inside footprint; case B: behind back corner with screen-X overlap, within roof-reach depth).
7. Lightning bolts and necro-cast cross decals on top.
8. UI overlays: necro-targets ring, mini-map, hand cursor.

Building occlusion override: when an NPC is occluded, push it into `drawables` with `depth = building.wx + building.wy - 0.01` so the building always draws on top, then add a fade-pulse white silhouette in the post pass.

## Common patterns

- **Adding a new visual element** — usually means a new `drawXxx(ctx, ...)` function called between `ctx.save()` and `ctx.restore()` inside `drawNPC` (or a `drawables` push if it has its own world position and needs depth sorting).
- **Adding a new state** — add the literal to switch cases in `updateNPC()` and `drawNPC()`, plus any pickability or aliveness predicate (`isAlive`, `NON_PICKABLE`).
- **Adding a new spell** — extend `selectSpell()` mapping, `SPELL_COLORS`, `KEY_MAP` in `init()`, the `onMouseDown` dispatch, and a `castXxx(targetWorld)` function. Add a `.spell-slot` to `index.html` and a `--spell-color` rule to `style.css`.
- **Adding a new appearance variant** — extend the `CLASSES / RACES / GENDERS / AGES` arrays, update `pickFiltered()` consumers (no changes needed if you stick to the existing 4-category shape).
- **Performance** — anything drawn many times per frame should be sprite-cached to an offscreen canvas at init (see `buildTreeSprite()`).

## Conventions

- **No external assets.** Every visual is `ctx.fillRect / ctx.beginPath / etc`. Every sound is `AudioContext` oscillators + filters. If a feature would need a PNG / WAV / font, propose a procedural alternative first.
- **Style is "flat color cartoon"** — no gradients, no smooth shading. 2-tone or 3-tone shading via discrete polygons.
- **World coords are tiles**, with `TILE_W / TILE_H` controlling pixel size. `wx, wy ∈ [0, MAP_SIZE]` is the playable grass. `WORLD_PAN_EXTRA` adds 5 tiles of pannable void per side; the camera clamp lets the screen center reach `[-E, N+E]`.
- **Files stay single-purpose**: `game.js` is the whole game; resist the urge to split it without a real need.
- **Run the game in a browser to verify visual changes.** `node -c game.js` proves it parses, not that it works.
