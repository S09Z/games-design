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
| **Phase 5.4b** — **Low-poly polygon trees + 4 building types (cottage/tavern/windmill/farm)** | ⏳ **In progress** | references received, see Mega Prompt below |

Current code: ~3500 lines in `game.js`, target 60fps, Canvas 2D + Web Audio synth, no external assets.

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

### 5.4 Texture rework — trees and houses ✅ DONE (PR #5)

**Shipped in 5.4b**:
- Trees: 4 faceted low-poly kinds (oak/pine/birch/dead), pre-rendered sprites, 2-tone shading.
- Buildings: 4 kinds — cottage (55%), tavern (20%), windmill (10%), farm (15%).
  Tavern: dark wood planks + orange shingle roof + hanging mug sign.
  Windmill: tall stone tower + pyramid cap + 4 wooden blades.
  Farm: red plank barn + wide double door + hayloft gable window.

### 5.4b Low-poly polygon style + 4 building types (NEXT, references received)

User shared two cartoon reference images:
- **Trees**: faceted low-poly silhouettes with hard color transitions (no gradients), 2-tone shading (light side + shadow side), visible polygon edges. Bold flat colors. Each tree feels like overlapping flat polygons rather than smooth shapes.
- **Houses**: 4 distinct types — cottage / **tavern** / **windmill** / **farm**, in a simple cartoon style. Tavern is dark wood + orange shingled roof. Windmill is a tall narrow stone tower with a conical cap and 4 wooden blades. Farm is a wide barn with a large door + hayloft window.

**Trees — visual upgrade** (keep same 4 kinds + pre-render pipeline; rewrite sprite functions):
- Replace circular foliage clumps with **faceted polygons** (5–8 vertices each).
- Use 2 flat green tones per crown — base + highlight polygon overlaid offset toward upper-left.
- Optional shadow facet on lower-right.
- Trunk also faceted (light side + shadow side trapezoids).
- Dead tree: branches become thin polygons (not strokes), more chunky/angular.

**Buildings — add 3 new kinds beside the existing cottage** (all should keep the same 2×2 footprint to preserve placement logic; vary `wallH`, `roofPeak`, palette, decorations):

| Kind | Weight | Distinct features |
|---|---|---|
| `cottage` | 55% | existing — plaster walls, thatch roof, beam timbers, X-braces, chimney |
| `tavern` | 20% | dark-wood plank walls, **orange shingle roof** (chevron/diamond rows), slightly taller (`wallH = 1.0`), hanging sign on south wall is optional |
| `windmill` | 10% | tall narrow **stone tower** (`wallH = 2.0`), conical cap (no gable), 4 **wooden blades** as an X on the south face, single small window |
| `farm` | 15% | red-wood walls, lower (`wallH = 0.7`), bigger roof (`roofPeak = 0.8`), **large double door** spanning most of the south wall, hayloft **window above the door** |

**Implementation plan**:
1. Add `BUILDING_KIND`, `BUILDING_KIND_WEIGHTS`, `pickBuildingKind()` near the existing `BUILDING_PALETTES`.
2. Add `BUILDING_PROFILES = { cottage: {...}, tavern: {...}, windmill: {...}, farm: {...} }` with per-kind `wallH`, `roofPeak`, `palette` (or palette pool).
3. In `initBuildings()`, attach `b.kind = pickBuildingKind()` and read defaults from `BUILDING_PROFILES[b.kind]`. Keep the 2×2 footprint constant.
4. Rename current `drawBuilding(b)` to `drawCottage(b)` (and keep its body verbatim).
5. New `drawBuilding(b)` dispatcher: switch on `b.kind` → `drawCottage` / `drawTavern` / `drawWindmill` / `drawFarm`.
6. `drawTavern(b)` and `drawFarm(b)` can be cottage-shape variants — copy the cottage code and swap palette, roof-texture pattern, door style, and decorations. To avoid copy-paste sprawl, extract small helpers for wall fills + roof slopes.
7. `drawWindmill(b)` is its own renderer — no gables, conical roof, stone block pattern, X blades on the south face.

**Open questions** (resolve before coding next session):
- Windmill blade animation — static or slowly rotating?
- Farm: hayloft window — small square at gable centre, or larger barn-style?
- Tavern sign — text "TAVERN" or pictogram (mug)? Or skip entirely for first pass?

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

*Last updated: PR #4 merged (Round C2 + NPC visual rework + music + minimap + map pan + 5.4a texture first pass). In progress: 5.4b — low-poly tree style + 4 building kinds. See Mega Prompt below.*

---

## Mega Prompt — handoff to next session (Phase 5.4b)

Paste this verbatim into a new Claude Code session and it should have everything needed to finish the job.

```
You are continuing work on "Hand of God", an isometric Canvas-2D game in
/Users/ittichaib/Documents/GitHub/games-design/god-hands/. The repo uses git
worktrees under .claude/worktrees/. No external assets; everything is
procedural Canvas 2D + Web Audio synth. Target: 60 fps with ~30 NPCs.

State as of handoff
- main is up to date with PR #4. PR #3 + PR #4 are merged.
- Already shipped (PR #4):
  * Round C2 per-class behavior (speed mults, warrior charge, wizard fire
    resist, ranger long stride, priest single-use heal).
  * NPC visual rework: gendered clothing, per-class weapons + headgear,
    elf ears, dwarf beard, material/texture palette.
  * Tavern theme music + mute button. Burn-scream and death-grunt vocal SFX.
  * Hamburger settings panel with NPC slider + per-category appearance filters.
  * Mini-map (bottom-left) with viewport polygon clipped to the panel.
  * Map size 30 × 30 grass, pannable world +5 extra tiles void per side,
    RTS-style pan with Hand spell.
  * Texture first pass (5.4a): 4 pre-rendered tree variants (oak / pine /
    birch / dead) plus X-braces and a chimney on cottages.

Your job: Phase 5.4b
The user shared two reference images during the previous session showing the
target visual style:
- Trees: low-poly faceted cartoon — bold flat colors, visible polygon edges,
  2-tone shading (light side / shadow side), no gradients, no smooth circles.
- Houses: 4 distinct types — cottage / tavern / windmill / farm — drawn in a
  simple cartoon style. Tavern has dark wood walls + orange shingle roof.
  Windmill is a tall narrow stone tower with a conical cap and 4 wooden
  blades. Farm is a wide barn with a large door + hayloft window above it.

Concrete tasks
1. Trees — keep the existing 4 kinds, weights, and pre-render pipeline
   (initTrees → buildTreeSprite → drawImage). Rewrite the four
   draw{Oak,Pine,Birch,Dead}Sprite functions so the silhouettes are made of
   faceted polygons with 2-tone flat shading (highlight overlay + base).
   Trunks should be 2-trapezoid faceted (light + shadow side). Dead-tree
   branches become thin polygons, not strokes.
2. Buildings — add b.kind selection at initBuildings time. Weights:
   cottage 55%, tavern 20%, windmill 10%, farm 15%. Keep the 2 × 2 footprint
   for all kinds so placement logic doesn't change. Vary wallH, roofPeak,
   palette, and decorations per kind. Rename current drawBuilding to
   drawCottage and write a top-level drawBuilding(b) dispatcher.

Per-kind summary (proposed values, tweak as needed)
- cottage: wallH 0.8, roofPeak 0.55, current plaster + thatch + X-braces +
  chimney.
- tavern:  wallH 1.0, roofPeak 0.55, dark wood plank walls
  (e.g. wall #6e4524 / wallSide #543518 / beam #2a1808), roof in orange
  shingles drawn as chevron rows (#c87538 / #8a4818). Optional small
  pictogram sign hanging off the south wall.
- windmill: wallH 2.0, roofPeak 0.5, stone walls
  (#9a9a98 / #7a7a78 / beam #3a3a38) with subtle block lines, conical cap
  (single 4-sided pyramid in #5a5a58), 4 wooden blades in an X across the
  south face (rectangles in #8a6038 with darker outline). Static is fine for
  first pass; animation later.
- farm: wallH 0.7, roofPeak 0.8, red wood plank walls
  (#a04030 / #883520 / beam #4a1f15), big double door taking ~70% of the
  south wall width, hayloft window above the door at gable centre.

Constraints
- Pure Canvas 2D + Web Audio. No external assets, no images, no fonts.
- Keep the existing iso projection (worldToScreen / screenToWorld) and the
  depth-sort drawables loop in render(). Buildings already use back-corner
  depth so this should stay correct as long as the 2×2 footprint is kept.
- Match the existing flat-color cartoon style (no gradients, no shadows,
  hard color transitions only).

Files to edit
- god-hands/game.js — only file you should need to touch for this round.
- god-hands/TODO.md — update status table once shipped, mark 5.4b done.

How to ship
1. Implement and verify visually by opening the worktree's index.html in a
   browser (file://...). Pre-render runs at init; if performance regresses,
   reduce polygon count per tree, not the variant count.
2. Commit, push, open a PR titled "Phase 5.4b: low-poly trees + 4 building
   kinds". Reference this TODO section in the PR body.

Open scope decisions (ask user before coding if unsure)
- Windmill blades: static or rotating? Static for first pass is fine.
- Tavern sign: skip / pictogram / "TAVERN" text? Recommend a tiny mug
  pictogram hanging off a small arm.
- Farm hayloft window: small square in gable, or arched? Recommend small
  square for the cartoon feel.
```
