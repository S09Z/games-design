# Project Memory

Cross-session facts about this project and the user's preferences. Read at the start of every session; update when something changes. Keep entries short.

---

## About the user

- Communicates in mixed Thai + English; technical terms in English. Replies in the same mix are fine.
- Prefers to handle `git commit` / `git push` themselves. When code is ready to ship, hand them a single one-liner script (commit + push + `gh pr create`) rather than running it unprompted. Exception: if they explicitly say "ทำให้ที" / "commit ให้เลย" / "do it for me", run the script directly.
- When choosing between options, they like seeing a short menu (A / B / C) with a recommendation, not silent decisions.
- Iterative tester — usually runs the game in a browser between rounds and reports back with new bugs or follow-up scope. Don't pre-emptively over-engineer; ship a small round, wait for feedback, iterate.

## Project decisions in force

- **Single-file game**: keep all logic in `god-hands/game.js`. Do not split into modules without explicit request.
- **No external assets ever** — all visuals via Canvas 2D, all audio via Web Audio synth.
- **Style**: flat-color cartoon, polygon facets, no gradients. (Cemented by the cartoon reference images shared during the Phase 5.4b kickoff.)
- **Map size**: `MAP_SIZE = 30` grass + `WORLD_PAN_EXTRA = 5` void on each side. (Iterated 20 → 40 → 20 → 30.)
- **Building footprint stays 2×2** even when adding new kinds (cottage / tavern / windmill / farm). Placement logic in `initBuildings()` depends on this.
- **`b.kind` mechanism** chosen over per-kind subclasses — building kind drives palette / wallH / roofPeak / decorations inside `drawBuilding()`.
- **Defaults**: music auto-plays after first interaction (browser policy), sound toggle starts at 🔊. Mute icon offsets `right: 52px` so it sits just left of the info `i` button.
- **NPC visual is layered, not bundled** — `computeNPCAppearance()` returns a model; part drawers (`drawNPCQuiver`, `drawNPCHairBack`, `drawNPCLowerBody`, `drawNPCTorso`, `drawNPCBeard`, etc.) consume it. Adding a costume piece means a new helper + a call site in the `drawNPC()` orchestrator, not editing one monolithic function.
- **Critical-hit dismemberment** stays at 20 % (`CONFIG.CRITICAL_CHANCE`). Since Phase 5.1 the 20 % roll is consumed inside `applyDamage()` and threaded into `kill(npc, intensity, isCritical)`; dismemberment fires only when the killing blow was a crit. Legacy direct `kill()` callers (warrior charge, void fall) still random-roll inside `explodeBody`.
- **Spell 1 (Hand) is overloaded**: NPC-under-cursor → grab; empty ground → RTS pan. Don't break either path when extending.
- **HP system (5.1) shipped** — every NPC has `hp` / `maxHp` (class base × race mod), all spells deal damage via `applyDamage(npc, amount, source)`. Wizard fire resist = ×0.5 fire-tick damage (was: slower ignite). Zombie touch is intentionally still instant-kill — 5.2 will replace with bite DPS.
- **Achievements / level-2 spells** are scoped in TODO.md but **not yet implemented**.

## Worktree gotcha (do not forget)

The active worktree path is:
`/Users/ittichaib/Documents/GitHub/games-design/god-hands/.claude/worktrees/cool-joliot-a6dc1b/god-hands/`

The main checkout is:
`/Users/ittichaib/Documents/GitHub/games-design/god-hands/` (top of repo).

These have **different layouts** (top-level files vs. nested `god-hands/` subdir on the worktree branch). When the user says "I don't see the change on main", the answer is almost always:
1. Confirm whether the latest PR has been merged.
2. Confirm whether they pulled main after the merge.
3. Offer to commit / push uncommitted worktree changes for them.

Direct-open test path during development (no git needed):
`file:///Users/ittichaib/Documents/GitHub/games-design/god-hands/.claude/worktrees/cool-joliot-a6dc1b/god-hands/index.html`

## Shipped phases (canonical reference: TODO.md)

- PR #1 — Phases 1–4a (foundation, spells, polish, world basics).
- PR #2 — Round B (house respawn, necromancer, zombie state).
- PR #3 — Round B+ (necro AOE, occlusion, wander buffer) + Round C1 (NPC visual variety).
- PR #4 — Round C2 (per-class behavior) + NPC visual rework (weapons / headgear / dress / ears / beard) + audio (tavern music + mute + vocal SFX) + UI (hamburger settings + appearance filters + minimap + map pan) + 5.4a (4 tree variants + X-braces + chimney).
- PR #6 — Phase 5.4b: low-poly polygon trees + 4 building kinds (cottage / tavern / windmill / farm dispatcher).
- **feature/phase-5-1 (open PR)** — Phase 5.1 (HP system) + Phase 5.4c (spinning windmill blades, chimney smoke, tavern mug/windows/chimney, cottage east windows). Mega Prompt for Phase 5.2 lives at the bottom of `TODO.md`.

## Reference images received

In the Phase 5.4b kickoff, the user pasted two cartoon style references:
- **Trees**: faceted low-poly silhouettes, hard color transitions, visible polygon edges, 2-tone shading.
- **Houses**: 4 distinct types — cottage / tavern / windmill / farm.

Style direction: match the reference look — flat polygons with clear facet edges, no gradients, no smooth shading.
