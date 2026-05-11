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
| Phase 4 Round C2 — Per-class behavior | ⏳ Pending | not scoped yet |

Current code: ~2400 lines in `game.js`, target 60fps, Canvas 2D + Web Audio synth, no external assets.

---

## Round B — Confirmed Scope (next up)

### 1. Respawn from house
- Replace random respawn → spawn at random building's **south door position**
- NPC walks "out of the door" then enters WANDER
- Fallback to random position if no buildings exist
- Keep 1 NPC / second pacing

### 2. Necromancer spell (slot 6, key `6`)
- Icon: 💀 / Color: dark purple `#8B3FBF`
- Cast rule: **Click ground → find nearest CORPSE within radius (~4 wu) → reanimate as zombie**
- (Direct click on corpse = same path)
- No cooldown
- Critical-hit body parts (scattered particles) NOT revivable — only `CORPSE` state bodies

### 3. Zombie state
- New AI state `ZOMBIE`
- Visual: pale green-gray skin `#7a8a6a` + glowing eyes + lurching gait
- Speed: 0.6× normal NPC
- AI: chase nearest alive NPC, on touch → **kill NPC instantly** (option `a` from scope discussion)
- Zombies are killable by spells/fall — when killed → become `CORPSE` again (re-revivable)
- HUD: add `Z Zombies` counter alongside `X Alive · Y Killed`

### Implementation notes for Round B
- Add slot 6 to `index.html` SpellBar
- Add `--spell-color: #8B3FBF` for `[data-spell="NECROMANCER"]` in CSS
- New state: `ZOMBIE` in updateNPC + drawNPC
- New cast function `castNecromancer` similar to lightning's nearest-target search
- New audio: necromancer cast (low organ-like / reverse swell)
- Update `KEY_MAP` to include `'6': 'NECROMANCER'`

---

## Round C1 — NPC visual variety (DONE, PR #3)

48 combinations: 2 genders × 2 ages × 3 races × 4 classes
- Class → body color (warrior red, wizard blue, ranger green, priest white-gold)
- Race → body proportions (elf tall/slim, dwarf wide/short, human medium)
- Age elder → forward hunch + gray hair tint
- Gender female → bun + side strands hairstyle
- All appearance only; behavior is identical across combinations.

## Round C2 — Per-class behavior (NOT YET SCOPED)

Open questions for next session:
- Speed differences (wizard slower? warrior faster? ranger fastest?)
- Hit/death reactions per class (warrior shouts, wizard fizzles, etc.)
- Class-specific spell interactions (priest resists fire? wizard resists lightning?)
- Any class-based AI hooks (warriors fight zombies on contact, etc.)
- Should age also affect behavior (elders walk slower)?

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
- **Building**: 2×2 footprint, 3-tile gap, 30% max coverage, wall 0.8 wz, peak +0.55 wz
- **Trees**: 25 on outer ring (within 2.8 tiles of edge)
- **Map**: 20×20 tiles, center cross path

---

## Phase 5 — Planned features (analysis + design, not yet built)

These items were scoped by the user for future sessions. Each section is intentionally a *design sketch*, not a spec — open questions noted so the next session can confirm before coding.

### 5.1 HP + attack damage system (ระบบเลือดและพลังโจมตี)

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

### 5.4 Texture rework — trees and houses

**Today**:
- Trees: green ellipse + brown trunk rectangle.
- Houses: 3 palette variants, plaster + timber + thatch, but very flat fills.

**Proposed**:

**Trees** — introduce variants (random per instance):
- `oak` — round bushy foliage, thick trunk.
- `pine` — triangular tiered foliage, narrow trunk.
- `birch` — tall slim, white bark with dark notches.
- `dead` — bare branches, no foliage (1 in 12 chance, adds eerie atmosphere).
Add 2-tone foliage shading (highlight + shadow per crown) and vertical bark hatching on trunks.

**Houses** — visual layer additions:
- Roof: short diagonal strokes for thatch texture, or repeated chevron for shingles.
- Wall: half-timbered framing — beam outline + cross-brace pattern in `palette.beam`.
- Door: dark rectangle centered on the south face (currently implicit).
- Window: tiny square with cross mullion, lit at night (once 5.6 ships).
- Chimney: small box on the roof ridge + smoke particle every ~2 s.

Building variants (footprint shape):
- `cottage` (2×2) — current default.
- `longhouse` (3×2) — wider, single ridge, denser palette.
- `tower` (2×2 + extra wallH) — taller, used as landmarks (1-2 per map).

**Implementation note**: per-instance rendering would tank fps if redrawn each frame. Pre-render each variant to an off-screen canvas at init, then `drawImage` for each instance.

**Open questions**:
- Stay in flat-color/geometric style, or go full pseudo-pixelart with dithering? (current style is closer to flat — keep that.)
- Building footprints stay axis-aligned? (yes — easier depth sort.)

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

*Last updated: PR #3 opened. Round C1 complete. Phase 5 features (5.1–5.5) scoped as design sketches above; awaiting user confirmation before implementation.*
