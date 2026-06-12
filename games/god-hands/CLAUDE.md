# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## 5. Codebase Search (SocratiCode)

This project is indexed with SocratiCode. Always use its MCP tools to explore the codebase before reading any files directly.

### Workflow
1. **Start with `codebase_search`** — hybrid semantic + keyword search in a single call.
   - Broad queries for orientation: "how is authentication handled", "NPC state machine", "death animation".
   - Precise queries for symbol lookup: exact function names, constants, type names.
   - Prefer search results to infer which files to read — do not speculatively open files.
2. **Follow the graph before following imports** — use `codebase_graph_query` to see what a file imports and what depends on it before reading its contents.
3. **Read files only after narrowing via search** — once results point to 1–3 files, read only the relevant sections.
4. **Check status if search returns nothing** — run `codebase_status` to confirm indexing is complete; re-index with `codebase_index` if needed.

### Key tools
| Goal | Tool |
|------|------|
| Find a function, constant, or pattern | `codebase_search` |
| See what a file imports / what depends on it | `codebase_graph_query` |
| Architecture overview | `codebase_graph_stats` |
| Check index freshness | `codebase_status` |
| Re-index after large changes | `codebase_index` or `codebase_update` |

Project path for all calls: `/Users/ittichaib/Documents/GitHub/games-design/god-hands`

---

## 6. Project-specific (Hand of God)

The rules above are universal. The ones below apply only to this codebase. Read them in addition to the universal rules, not instead of them.

**Read first, every session.**
- `INSTRUCTIONS.md` — architecture, file layout, render pipeline, common patterns. Skim this before any non-trivial change.
- `MEMORY.md` — cross-session facts about the user and the project's standing decisions. Treat as load-bearing.
- `TODO.md` — phase status table + design sketches for unshipped work. The latest Mega Prompt lives at the bottom for cross-session handoff.

**No external assets — ever.**
- All graphics are Canvas 2D primitives. All sounds are Web Audio oscillators. No images, no audio files, no fonts, no libraries.
- If a feature seems to require an asset, propose a procedural alternative or push back on scope.

**Visual changes need a browser, not a parser.**
- `node -c game.js` only proves the file parses. It does *not* prove the feature works.
- For UI / NPC / world changes, the verification step is "open `index.html` in a browser and look at it." Say so when reporting completion.
- The current worktree's `index.html` is the one to test (see `MEMORY.md` for the path) — do not assume the user's `main` checkout is up to date.

**Match the existing flat-cartoon style.**
- No gradients. No smooth shading. No soft shadows.
- Use 2- or 3-tone discrete shading: a base polygon plus a brighter highlight polygon (and optionally a darker shadow polygon).
- Polygon edges should be visible — that *is* the style.

**Preserve iso invariants.**
- World coords are always `(wx, wy, wz)`. Screen coords are always derived via `worldToScreen()`.
- Depth-sort key is `wx + wy`; do not invent a separate sort.
- Buildings keep a 2×2 footprint. Adding new building kinds = change palette + height + decorations, not footprint.

**Single-file rule.**
- All gameplay logic lives in `god-hands/game.js`. Resist the urge to extract files for "cleanliness."
- Sections inside `game.js` are delimited by `// ---------- Title ----------` comments. New sections follow the same convention.

**State is one object.**
- Everything mutable hangs off the global `state` variable. New per-frame data goes there, not in module-level `let`s.

**Ship rounds, not epics.**
- The user iterates fast: make a small change, expect feedback, do another small change. Avoid sprawling multi-feature commits when one would do.
- When a feature has clear sub-parts (e.g. 5.4a vs 5.4b), prefer shipping the simpler half and waiting for the user to confirm before tackling the harder half.

**Git etiquette here.**
- The user prefers to run git commands themselves. When work is shippable, hand them a single one-liner (commit + push + `gh pr create`) rather than running it.
- Only run git commands directly when the user explicitly says so ("commit ให้เลย", "ทำให้ที", "do it for me", or similar).
- The worktree branch diverges from `main` in layout — don't be surprised when "main checkout doesn't see the change." Resolve by confirming PR merge + `git pull`, or by running the game from the worktree path directly.