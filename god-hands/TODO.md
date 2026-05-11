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

**Next up:** Phase 5.2 (Zombie grab-and-bite). 5.1 unblocks bite-as-DPS.

Current code: ~3820 lines in `god-hands/game.js`, target 60fps, Canvas 2D + Web Audio synth, no external assets.

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

### Phase 5.4b (PR #6) — This PR
- Trees re-rendered as faceted low-poly with 2-tone shading; trunks are 2-trapezoid faceted.
- Buildings now have a `kind` field: cottage 55% / tavern 20% / windmill 10% / farm 15%.
- `drawBuilding(b)` is a dispatcher; new `drawCottage/Tavern/Windmill/Farm` functions.
- Per-kind wallH, roofPeak, palette. 2×2 footprint kept for all kinds.

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

### 5.2 Zombie grab-and-bite (จับและกัด)

**Today**: zombie touch → instant kill of target NPC.

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
- Animated windmill blades.
- Window lighting at night (would depend on a future 5.6 day/night cycle).
- Chimney smoke particles.

---

### 5.5 Achievements + easter eggs

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

*Last updated: PR #6 opened (Phase 5.4b — low-poly trees + 4 building kinds). PRs #1–#5 merged. Phase 5.1 / 5.2 / 5.3 / 5.5 still scoped as design sketches above — awaiting user confirmation before implementation. Recommended next: 5.1 (HP system) — unblocks 5.2.*
