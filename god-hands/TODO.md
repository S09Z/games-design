# Hand of God — Progress Notes

Living document for cross-session / cross-machine continuity. Update after each phase.

---

## Status Overview

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1 — Foundation | ✅ Done | PR #1 |
| Phase 2 — Spells | ✅ Done | PR #1 |
| Phase 3 — Juice & Polish | ✅ Done | PR #1 |
| Phase 3+ — Critical / Respawn / UI extras | ✅ Done | PR #1 |
| Phase 4 Round A — World basics | ✅ Done | PR #1 (merged) |
| Phase 4 Round B — House respawn + Necromancer | ✅ Done | PR #2 (merged) + polish in PR #3 |
| Phase 4 Round B+ — Necromancer AOE, occlusion fix, wander buffer | ✅ Done | PR #3 |
| Phase 4 Round C1 — NPC visual variety (race/class/gender/age) | ✅ Done | PR #3 |
| Phase 4 Round C2 — Per-class behavior | ✅ Done | PR #4 |
| Phase 4 Round D — NPC visual rework (weapons / headgear / dress / ears / beard) | ✅ Done | PR #4 |
| Phase 4 Round E — Mute toggle + tavern theme music + vocal SFX | ✅ Done | PR #4 |
| Phase 4 Round F — Hamburger settings + appearance filters + minimap + map pan | ✅ Done | PR #4 |
| Phase 5.4a — Texture first pass (4 tree variants, X-braces, chimney) | ✅ Done | PR #4 |
| Phase 5.4b — Low-poly polygon trees + 4 building types (cottage/tavern/windmill/farm) | ✅ Done | PR #6 |
| Phase 5.1 — HP + attack damage system | ✅ Done | feature/phase-5-1 |
| Phase 5.3 — Spell L2 long-press | ✅ Done | feature/phase-5-3 |
| Phase 5.2 — Zombie grab-and-bite | 🔲 Planned | unblocked by 5.1 |
| Phase 6.1 — Performance | 🔲 Planned | particle pool, dirty canvas, NPC throttle |
| Phase 6.2 — Quality of Life | 🔲 Planned | combo, slow-mo, respawn wave, spell wheel |
| Phase 6.3 — Game Design / Feel | 🔲 Planned | chaos mode, chromatic aberration |
| Phase 7 — Achievements + Easter eggs | 🔲 Planned | moved from 5.5 |

**Next up:** Phase 5.2 (Zombie grab-and-bite), then Phase 6 experiments.

Current code: ~4200 lines in `god-hands/game.js`, target 60fps, Canvas 2D + Web Audio synth, no external assets.

---

## Shipped reference — what each merged PR added

### Round B (PR #2 + #3) — House respawn + Necromancer + zombies
- Respawn now picks a random building's south-door position; NPC enters WANDER.
- Slot 6 `NECROMANCER` spell (`#8B3FBF`, key `6`) — click ground → reanimate nearest `CORPSE` within ~4 wu radius. Critical-hit body parts not revivable.
- `ZOMBIE` state — pale green-gray (`#7a8a6a`), 0.6× speed, chases nearest alive NPC, touch = instant kill. Zombie killed → returns to `CORPSE`.
- HUD: `Z Zombies` counter.

### Round B+ (PR #3) — Polish
- Necromancer became AOE (radius ~2.5).
- 1-tile wander buffer + occlusion silhouette fix for NPCs behind buildings.

### Round C1 (PR #3) — NPC visual variety
48 combinations: 2 genders × 2 ages × 3 races × 4 classes. Class → body color, race → proportions, elder → hunch + gray hair, female → bun + side strands. Appearance only.

### Round C2 (PR #4) — Per-class behavior
- Class speed mults: warrior 1.10× / wizard 0.85× / ranger 1.25× / priest 1.00×. Elder ×0.75.
- Warrior: charges nearest `ZOMBIE` within 3 wu and kills on contact.
- Priest: single-use heal — runs to nearest `ON_FIRE` within 4 wu and extinguishes.
- Wizard: fire resistance (slower ignite).
- Ranger: longer wander stride (5–9 wu vs 1.5–5.5 wu).

### Phase 5.4a (PR #4) — Texture first pass
- 4 pre-rendered tree variants (oak / pine / birch / dead) via offscreen canvas.
- X-braces and chimney on cottages.
- Tavern theme music + mute button + burn/death vocal SFX.
- Hamburger settings panel (NPC slider + appearance filters).
- Mini-map bottom-left with clipped viewport polygon.
- Map grew 20→30 tiles; pannable +5 void tiles per side.

### Phase 5.4b (PR #6) — Low-poly trees + 4 building kinds
- Trees re-rendered as faceted low-poly with 2-tone shading; trunks are 2-trapezoid faceted.
- Buildings now have a `kind` field: cottage 55% / tavern 20% / windmill 10% / farm 15%.
- `drawBuilding(b)` is a dispatcher; new `drawCottage/Tavern/Windmill/Farm` functions.
- Per-kind wallH, roofPeak, palette. 2×2 footprint kept for all kinds.

### Phase 5.1 — HP + attack damage system
- Every NPC has `hp` / `maxHp` (class base × race mod). All spells routed through `applyDamage(npc, amount, source)`.
- Crit (20%) is now a ×2 damage multiplier; `kill(npc, intensity, isCritical)` — dismemberment only on crit kills.
- Wizard fire-resist = ×0.5 fire-tick damage inside `applyDamage`. Zombie touch = `DMG_ZOMBIE_TOUCH = 9999`.
- HP bar: 18×3 px above head, red/yellow/green, fades 3 s after last damage. Drawn inside `drawNPC`.
- Necromancer revive restores `hp = maxHp` so zombies aren't immediately one-shot.
- Bug fixes: `buildingOccluding` excludes DYING + CORPSE; `pickNPCAt` two-pass for occluded NPCs.

### Phase 5.4c — Building visual polish
- **Windmill spinning blades**: `state.windmillAngle` increments `dt × 1.4` rad/s; `drawWindmill` uses `ctx.save/translate/rotate(windmillAngle + π/4)/restore`. 4 flat rectangular boards (`blLen = 46px`), golden hub ring. Taper increased to 0.30 wu.
- **Chimney smoke**: `chimneyWx/Wy/Wz` baked onto each cottage/tavern building at `initBuildings()`; `updateChimneySmoke(dt)` emits slow-rising 'smoke' particles every ~2 s per building.
- **Cottage**: chimney drawn on east roof slope (south face `#7a6a56`, east face `#5a4a38`, dark cap). Two cross-pane windows on east wall (amber `#ffe8a0`, stacked low + mid).
- **Tavern**: brick chimney on east roof slope. Two round porthole windows on east wall (circles + cross pane). Two rectangular paned windows on south wall flanking door. Beer barrel mug landmark on roof ridge midpoint — barrel body with stave lines, 2 metal bands, foam bumps, thick C-curve handle.
- **Tavern sign**: upgraded to larger board with proper beer-mug pictogram (trapezoid body + foam ellipse + handle arc).

---

## Known Issues / Future Polish

- ~~NPCs walk through buildings~~ — fixed in PR #3 (1-tile wander buffer + occlusion silhouette case B)
- Decal cap 200 (FIFO) — may visually pop when oldest decal vanishes
- Corpse takes a slot in `state.npcs` for 30s before becoming DEAD-recyclable; under heavy combat array can grow temporarily up to ~target × 2
- Hard-retarget when wander step would enter building buffer can cause brief micro-stutter near houses; cosmetic, not blocking

---

## Conventions / Style Decisions

- **Critical chance**: 20% per kill (CONFIG.CRITICAL_CHANCE)
- **Respawn interval**: 1.0s (CONFIG.RESPAWN_INTERVAL)
- **Corpse fade**: 30s lifetime, last 5s alpha ramp
- **Fall death threshold**: impact `|vel.z| > 10`
- **Buildings**: 2×2 footprint, 3-tile gap, 30% max coverage. Per-kind heights:
  cottage 0.80 / tavern 1.00 / windmill 2.00 / farm 0.70 wz; roof peak 0.50–0.80.
- **Building kinds**: cottage 55% / tavern 20% / windmill 10% / farm 15%
- **Trees**: 25 on outer ring (within 2.8 tiles of edge); pre-rendered to 80×90 sprites
- **Tree kinds**: oak 45% / pine 30% / birch 17% / dead 8%
- **Map**: 30×30 tiles, center cross path, +5 pannable void tiles each side
- **Class speed mults**: warrior 1.10 / wizard 0.85 / ranger 1.25 / priest 1.00; elder ×0.75

---

## Phase 5 — Planned features (analysis + design, not yet built)

These items were scoped by the user for future sessions. Each section is intentionally a *design sketch*, not a spec — open questions noted so the next session can confirm before coding.

### 5.1 HP + attack damage system (ระบบเลือดและพลังโจมตี) — ✅ DONE

**Shipped numbers** (CONFIG.*): `DMG_FIREBALL_DIRECT=100`, `DMG_FIREBALL_AOE_EDGE=35`, `DMG_LIGHTNING_BOLT=70`, `DMG_LIGHTNING_CHAIN_HOP=30`, `DMG_METEOR_CENTER=200`, `DMG_METEOR_EDGE=60`, `DMG_FIRE_TICK_PER_SEC=25`, `DMG_ZOMBIE_TOUCH=9999` (instant-kill kept for this round; 5.2 reworks), `DMG_FALL_PER_UNIT=10`, `CRIT_MULT=2.0`, `HP_BAR_DURATION=3.0`s.

**HP scaling**: class base × race mod. warrior 150 / ranger 110 / priest 100 / wizard 70; dwarf ×1.15 / elf ×0.9 / human ×1.0.

**Wizard fire-resist** moved from "slower ignite" (old: `FIRE_BURN_DURATION ×1.5`) to "half fire-tick damage" — handled inside `applyDamage()` when source === 'fire'.

**HP bar**: only-when-damaged. 3s fade, 18×3 px above head, red/yellow/green by ratio. Drawn inside `drawNPC` after `ctx.restore()`, so building occlusion stacks correctly.

**Critical** (20%) is now a ×2 damage multiplier; dismemberment particles fire only when the killing blow was a crit (threaded via `applyDamage` → `kill(npc, intensity, isCritical)`). Legacy direct `kill()` callers (warrior charge, void fall) still random-roll inside `explodeBody`.

**Necromancer** restores `hp = maxHp` on revive so reanimated zombies aren't one-shot.

---

#### Original design sketch

**Today**: NPCs are binary alive/dead. Every offensive contact instant-kills.

**Proposed**:
- Add `hp` / `maxHp` per NPC; spells deal `damage`; death only when `hp ≤ 0`.
- HP bar drawn above head, visible for ~3 s after damage then fades.
- Critical chance (existing 20%) becomes a damage multiplier (e.g. ×2 or ×∞ for one-shot) rather than instant-kill flag.

**Baseline numbers** (subject to playtest):

| Source | Damage | Notes |
|---|---|---|
| Fireball (direct) | 100 | currently one-shots most NPCs |
| Fireball (AOE edge) | 35 |  |
| Lightning bolt | 70 |  |
| Lightning chain hop | 30 | each hop |
| Wind | 0 | knockback only; impact damage comes from fall |
| Meteor (center) | 200 | overkill, intentional |
| Meteor (edge) | 60 |  |
| Throw impact | `f(|v|²)` | reuse existing fall-death threshold |
| Zombie bite | 15 / s | DPS, see 5.2 |
| Fall (per unit |v.z| > threshold) | 10 × excess | ramped |

**HP scaling by class** (proposal): warrior 150, ranger 110, priest 100, wizard 70.
**Race mod**: dwarf ×1.15, elf ×0.9, human ×1.0. Stack with class.

**Open questions**:
- Heal regen at all? (probably no — keeps stakes high)
- Should the priest's heal (Round C2) restore HP partially instead of just extinguishing fire?
- Show HP bar always vs only-when-damaged?

---

### 5.2 Zombie grab-and-bite (จับและกัด) — ✅ DONE

**Shipped**: zombie touch → timed-bite mechanic with rescue window.

**Proposed**: bite is a *duration* event tied to the HP system from 5.1.

State machine extension:
- New zombie sub-state `ZOMBIE_BITING { targetId, biteTimer }`.
- New victim state `BEING_BITTEN { biterId }` — immobile, can still take damage from player spells.

Loop (per frame while biting):
1. Zombie anchors at victim's position (lean-in animation).
2. Victim loses `BITE_DPS × dt` HP, blood particles every ~0.3 s, scream cooldown ~1.5 s.
3. Victim hp ≤ 0 → victim dies normally, zombie releases → returns to chase.
4. Zombie killed by player → victim freed, brief STUNNED, then back to WANDER.
5. Optional: victim has small per-second escape chance (5%?) to break free without help.

**Implications**:
- Player gets a *window* to save villagers — turns zombies from "untouchable death-touch" into a tactical objective.
- Warrior charge (existing) now reliably saves the victim if it reaches in time.
- Visual cue: small red "biting" badge over zombie head; victim head shakes.

**Open questions**:
- Multiple zombies on one victim — sum DPS?
- Can ranger bow (future skill?) interrupt at range?

---

### 5.3 Spell level-2 via long-press hold

**Today**: every spell is single-tier; click triggers cast.

**Proposed**: holding the mouse button for ≥ `CAST_HOLD_THRESHOLD` (~0.55 s) before release casts the level-2 variant. Released early → level-1 as today.

Visual feedback during hold: a ring around the cursor fills clockwise; flashes when threshold passed; releases the spell on mouseup.

**Per-spell L2 sketch**:

| Spell | L1 (current) | L2 proposal |
|---|---|---|
| 1 Hand | grab villager | *no L2 — pan-on-empty already overloaded; skip per user request* |
| 2 Fireball | single bolt, AOE 2.5 | **3-bolt fan** at cursor, ~30° spread |
| 3 Lightning | chain ×3 | **storm** — chain ×8 with forking arcs |
| 4 Wind | knockback blast | **tornado** that walks along the drag path for ~2 s, sucking NPCs in |
| 5 Meteor | single drop | **meteor shower** — 5 drops random within AOE 5 |
| 6 Necromancer | revive corpses in AOE 2.5 | **bigger AOE + speed buff**: AOE 5, revived zombies get ×1.5 speed for 8 s |

**Open questions**:
- Cooldown on L2 to prevent spam? (probably yes — `L2_COOLDOWN` per slot)
- No mana / resource system yet — does L2 need one, or is the longer cast time the cost?
- Charging-ring color = spell color (existing `SPELL_COLORS`)?

---

### 5.4 Texture rework — trees and houses ✅ DONE (PR #4 + #6)

**Shipped in 5.4a (PR #4)**:
- 4 pre-rendered tree variants (oak / pine / birch / dead) via offscreen canvas.
- X-braces + chimney decorations on cottages.

**Shipped in 5.4b (PR #6)**:
- Trees re-drawn as faceted low-poly polygons with 2-tone shading.
  2-trapezoid faceted trunks. Dead-tree branches are thin polygons (not strokes).
- Buildings now 4 kinds with dispatcher pattern (`drawBuilding(b)` → `drawCottage/Tavern/Windmill/Farm`):
  - **cottage** (55%, wallH 0.80, roofPeak 0.55) — plaster + thatch + X-braces + chimney.
  - **tavern** (20%, wallH 1.00, roofPeak 0.55) — dark plank walls, orange chevron shingles, hanging mug sign.
  - **windmill** (10%, wallH 2.00, roofPeak 0.50) — tall stone tower, 4-sided pyramid cap, 4 static wooden X-blades.
  - **farm** (15%, wallH 0.70, roofPeak 0.80) — red plank barn, 70%-wide double door, hayloft gable window.
- All kinds keep the 2×2 footprint → depth-sort and occlusion logic unchanged.

**Deferred (not scoped yet)**:
- ~~Animated windmill blades~~ — shipped in 5.4c.
- ~~Chimney smoke particles~~ — shipped in 5.4c.
- Window lighting at night (would depend on a future 5.6 day/night cycle).

---

---

## Phase 6 — Experimental features

### 6.1 Performance

**Goal**: maintain 60fps when NPC count is high (50+) and many spells are active simultaneously.

#### 6.1.1 Particle cap + FIFO trim
- Add `CONFIG.MAX_PARTICLES = 400`.
- Each frame after push: `if (state.particles.length > MAX_PARTICLES) state.particles.splice(0, state.particles.length - MAX_PARTICLES)`.
- Same pattern for decals (`MAX_DECALS = 200`, already capped but switch to FIFO not random eviction).

#### 6.1.2 Offscreen background blit
- Render ground tiles + path + static world decorations to an offscreen `OffscreenCanvas` on first frame (and on resize).
- Each frame: `ctx.drawImage(bgCanvas, 0, 0)` then draw dynamic layer on top.
- Cuts per-frame `fillRect` calls for all static tiles.

#### 6.1.3 NPC update throttle for off-screen NPCs
- In `updateNPC`: if NPC world position is outside viewport + 2-tile margin, run update every 3rd frame only.
- Keep a counter on each NPC: `npc._skipFrame = ((npc._skipFrame||0) + 1) % 3`.
- Never throttle NPCs in AIRBORNE, ON_FIRE, ZOMBIE, or BEING_BITTEN states.

---

### 6.2 Quality of Life

#### 6.2.1 Combo counter
- Track `state.combo { count, timer }`. Reset timer to 2.0s on each kill; reset count to 0 on timeout.
- At count ≥ 3 display a pop-up label center-screen: `×3 COMBO!`, `×5 RAMPAGE!`, `×10 MASSACRE!` (custom thresholds).
- Label fades out over 1 s. Font 28px bold, color scales with count (yellow → orange → red).

#### 6.2.2 Slow-mo critical kill
- When a crit kill fires, set `state.slowMo = 0.25` for 0.35 s then ease back to 1.0 over 0.15 s.
- Multiply game `dt` by `state.slowMo` in the main loop.
- Audio: pitch-shift music during slow-mo by setting `state.music.bgNode.playbackRate.value` to `state.slowMo` (already accessible).

#### 6.2.3 Respawn wave (R key)
- Press `R` → immediately spawn 5 NPCs from random buildings (reuse existing spawn logic).
- Debounce: 3 s cooldown between presses.
- HUD hint update: add "R — spawn wave".

#### 6.2.4 Spell radial menu (right-click)
- Right-click anywhere on canvas → open a 6-slot radial ring centered at cursor.
- Each slice shows spell icon + key hint. Click slice selects spell.
- Dismiss on right-click outside, Escape, or after selecting.
- Visual: dark semi-transparent disk, slices separated by thin lines, active slice highlights on hover.

**Open questions**:
- Should radial menu replace or supplement keyboard shortcuts? → supplement (keep 1–6).
- Right-click on NPC → context actions (kill, inspect)? → out of scope for this round.

---

### 6.3 Game Design / Feel

#### 6.3.1 Chaos mode
- Button in HUD (or key `C`) → spawns 10 zombies instantly at random positions near map center.
- Zombies get ×1.5 speed for 10 s ("frenzy" tint: brighter green).
- HUD flashes red border for 1 s on activation.
- Useful for stress-relief burst play; no cooldown (intentionally spammable).

#### 6.3.2 Chromatic aberration on impact
- When `state.screenShake.mag > 5`, render the scene three times with tiny RGB channel offsets using `ctx.globalCompositeOperation`.
- Simpler approach (no triple-draw): after drawing, draw a 2px red-shifted + 2px blue-shifted copy of just the top canvas strip using `ctx.drawImage(canvas, ±2, 0)` with `'screen'` blend and low alpha (~0.35).
- Duration tied to shake lifetime; fades with shake.

**Open questions**:
- Triple-draw might drop below 60fps on weak hardware — benchmark first; fall back to the strip-copy approach if needed.

---

## Phase 7 — Achievements + Easter eggs

*(Moved from Phase 5.5)*

### 7.5 Achievements + easter eggs

**Achievements** (persistent via `localStorage`):

| Name | Trigger |
|---|---|
| First Blood | kill any villager |
| Centurion / Millennial | reach 100 / 1000 total kills (across sessions) |
| Pyromaniac | burn 10 villagers in a single fireball AOE |
| Storm Chaser | lightning chain kills 5+ in one cast |
| Necromancer | revive 10 corpses total |
| Horde | 10+ zombies alive simultaneously |
| Witch Trial | kill a wizard *with* fire (they resist it) |
| Holy Hands | priest extinguishes 5 fires in one session |
| Icarus | kill an NPC by throw-fall |
| Domino | meteor kills 5 in one drop |

UI:
- Toast popup top-right on unlock (~3 s, dismissable).
- Achievement panel reachable via the hamburger menu (new tab).
- Local-only — no auth, no cloud.

**Easter eggs** (hidden, undocumented in panel):
- Click the sun glyph 10 times → rainbow particle rain across the map.
- Konami sequence (`↑↑↓↓←→←→BA`) → all wandering villagers do a 3-second synced dance.
- Cast `2→3→4→5→6` within 2 seconds each → "rainbow combo" cast: all spells fire at cursor simultaneously.
- 1% of spawns are *named* villagers — name appears on hover ("Bob the Brave", "Aldonza of the Vale", etc.).
- 0.3% spawn: **The Wanderer** — elder with a rainbow cloak, 3× HP, gives a blessing animation if undisturbed for 30 s (visible buff to nearby villagers' HP).
- Konami-style "tavern dance" (above) plays the tavern theme louder and at 1.25× pitch.

**Open questions**:
- Achievements per-session or persistent? → **persistent** (more rewarding).
- Achievement state vs. memory: just `localStorage`, no server.
- Counts that span sessions need a small `state.stats` object initialized from `localStorage` at boot.

---

## How to resume on a new machine

1. `git clone https://github.com/S09Z/games-design.git`
2. `cd games-design/god-hands`
3. Read this file + `CLAUDE.md` + `design.md`
4. `claude` — start Claude Code session
5. Paste a brief context summary referencing this TODO

---

*Last updated: Phase 5.2 (zombie grab-and-bite) shipped on branch claude/cool-joliot-a6dc1b. Also includes: zombie up/down bite arm animation, blood wound effect on victim, necromancer ghost spirit (green, 40% smaller), priest mitre Latin cross with border, bug fix zombie returns to ZOMBIE state after being stunned. Next: Phase 5.3 or 5.5.*

---

## Phase 5.2 Mega Prompt

> Paste this entire block at the start of a new Claude Code session to resume with full context.

---

**Project**: Hand of God — single-file isometric god-game. All logic in `god-hands/game.js` (~4100 lines). Canvas 2D + Web Audio, no external assets. Flat-cartoon polygon style (no gradients, no smooth shading).

**Active worktree** (use this path, not the main checkout):
`/Users/ittichaib/Documents/GitHub/games-design/god-hands/.claude/worktrees/cool-joliot-a6dc1b/god-hands/`
Test URL: `file:///Users/ittichaib/Documents/GitHub/games-design/god-hands/.claude/worktrees/cool-joliot-a6dc1b/god-hands/index.html`

**Read first**: `CLAUDE.md`, `MEMORY.md`, `INSTRUCTIONS.md`, `TODO.md`.

---

### What's already shipped (context for 5.2)

**Phase 5.1 — HP system** is live:
- Every NPC has `hp` / `maxHp`. Class base × race mod: warrior 150, ranger 110, priest 100, wizard 70; dwarf ×1.15, elf ×0.9, human ×1.0.
- Central damage function: `applyDamage(npc, amount, source)` — handles crit roll (20% → ×2 mult), wizard fire-resist (source==='fire' → ×0.5), triggers `kill()` when hp ≤ 0.
- `kill(npc, intensity=1.0, isCritical=null)` — extended signature vs old `kill(npc)`. Sets `npc._wasCritical`.
- `explodeBody` reads `npc._wasCritical` to decide dismemberment particles.
- `CONFIG.DMG_ZOMBIE_TOUCH = 9999` — zombie contact still instant-kills for now. **5.2 replaces this with bite DPS.**
- `CONFIG.DMG_FIRE_TICK_PER_SEC = 25`, `CONFIG.CRIT_MULT = 2.0`, `CONFIG.HP_BAR_DURATION = 3.0`.
- HP bar: 18×3 px above head, red/yellow/green, fades 3 s after last hit. Drawn inside `drawNPC` pipeline so building occlusion applies.
- Necromancer revive sets `t.hp = t.maxHp` so zombies aren't one-shot on reanimation.

**Phase 5.4c — Building polish** is live:
- Windmill blades spin (`state.windmillAngle += dt * 1.4` in `loop()`). `drawWindmill` uses `ctx.rotate(state.windmillAngle + Math.PI/4)`.
- Cottage + tavern emit chimney smoke (`updateChimneySmoke(dt)` called in `loop()`; `chimneyWx/Wy/Wz/chimneyTimer` baked on each building at `initBuildings()`).
- Tavern has beer-mug landmark on roof ridge, round porthole windows, upgraded sign.

---

### Phase 5.2 — Zombie grab-and-bite (จับและกัด)

**Goal**: Replace zombie instant-kill touch with a timed-bite mechanic that gives the player a rescue window.

**State machine changes**:

| State | On whom | Meaning |
|---|---|---|
| `ZOMBIE_BITING` | Zombie | Latched onto a victim; anchored at victim pos |
| `BEING_BITTEN` | NPC victim | Immobile; takes bite DPS; can still receive spell damage |

Both new states sit alongside existing states — no existing state is removed.

**New CONFIG values to add**:
```js
BITE_DPS: 15,          // HP per second while bitten
BITE_ESCAPE_CHANCE: 0.05, // 5% per second victim can break free
BITE_BLOOD_INTERVAL: 0.3, // seconds between blood particle bursts
BITE_SCREAM_COOLDOWN: 1.5, // min seconds between scream SFX
```

**Zombie update logic** (inside `updateNPC`, ZOMBIE case):
1. Find nearest alive NPC within ~0.6 wu (contact range, same as old instant-kill).
2. If found AND target is not already `BEING_BITTEN` by someone else:
   - Set zombie state to `ZOMBIE_BITING`; store `npc.biteTargetId = target.id`
   - Set target state to `BEING_BITTEN`; store `target.biterId = npc.id`
3. While `ZOMBIE_BITING`:
   - Anchor zombie at `target.pos` (snap position each frame, no pathfinding).
   - Call `applyDamage(target, CONFIG.BITE_DPS * dt, 'bite')` each frame.
   - Spawn blood particles at target pos every `BITE_BLOOD_INTERVAL` s.
   - Play scream SFX on target with `BITE_SCREAM_COOLDOWN` gate.
   - If `target.hp <= 0`: target dies normally → zombie releases → returns to ZOMBIE chase.
   - If zombie is killed (state changes to DYING): victim transitions to STUNNED for ~0.8 s then WANDER.
4. Escape roll (per second): if `Math.random() < CONFIG.BITE_ESCAPE_CHANCE * dt`: victim breaks free → STUNNED 0.5 s → WANDER; zombie returns to ZOMBIE chase.

**Warrior saves the victim**:
- Warrior charge already calls `kill(zombie)` on contact. When zombie dies mid-bite, the DYING state change triggers the victim-release logic above.

**Multiple zombies**: a victim already in `BEING_BITTEN` cannot be grabbed again — second zombie keeps chasing. (Sum DPS not implemented in this round.)

**Visual cues**:
- **Zombie** in `ZOMBIE_BITING`: draw a small filled red circle (~4 px) above the zombie head (screen-space, offset ~(0, -headTop - 6)).
- **Victim** in `BEING_BITTEN`: horizontal head-shake — add `npc.biteShakeTimer` that increments each frame; offset head draw by `Math.sin(biteShakeTimer * 30) * 2` px.

**Key functions to modify**:
- `updateNPC` — ZOMBIE case: replace instant-kill with grab logic; add ZOMBIE_BITING and BEING_BITTEN handlers.
- `drawNPC` — add red badge for ZOMBIE_BITING; head-shake offset for BEING_BITTEN.
- `applyDamage` — add `'bite'` source (no special resist — treat like generic damage).
- `makeNPC` — add `biteTargetId: null, biterId: null, biteBloodTimer: 0, biteScreamTimer: 0, biteShakeTimer: 0`.
- `CONFIG` — add the 4 new constants above.

**Don't forget**:
- When a `BEING_BITTEN` NPC is killed by a spell (not by the bite), release the biting zombie too.
- When a zombie is turned to CORPSE by the necromancer's AOE revive, any victim it was biting should be freed.
- `DMG_ZOMBIE_TOUCH` stays in CONFIG but is no longer used after 5.2 — leave it as a tombstone (don't delete).

**Verification steps**:
1. Spawn zombies (use Necromancer spell, key `6`). Watch a zombie approach a villager — it should latch on, villager stands still, HP bar drains over ~7 s (warrior: 150 HP / 15 DPS = 10 s).
2. Kill the zombie mid-bite — victim should stagger (STUNNED) then resume wandering.
3. Let a warrior be nearby — it should charge and save the victim.
4. Use fireball on a bitten victim — should deal 100 dmg directly (not blocked by BEING_BITTEN state).
5. Check no crash when multiple zombies are alive simultaneously.

**Ship as a small PR** — do not bundle 5.3 or 5.5 into the same commit.
