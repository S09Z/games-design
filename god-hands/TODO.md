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

## How to resume on a new machine

1. `git clone https://github.com/S09Z/games-design.git`
2. `cd games-design/god-hands`
3. Read this file + `CLAUDE.md` + `design.md`
4. `claude` — start Claude Code session
5. Paste a brief context summary referencing this TODO

---

*Last updated: PR #3 opened. Round C1 complete. Ready for Round C2 scoping.*
