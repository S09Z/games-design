# V2 Phase 3 — Command Bar UI

Goal: Replace current HUD/Controls with a dark bottom command bar (V2 design).

## Changes

### New: `src/ui/CommandBar.tsx`
- Dark horizontal bar at bottom of screen (replaces HUD + Controls)
- Layout (left → right):
  - **Ammo type selector** — 3 buttons: Standard / Spread / Heavy
    - Active type highlighted
    - Shows label + subtitle (e.g. "Fast · 1", "Med · 3×", "Slow · 2×")
  - **Angle slider** — vertical or horizontal, same range as current
  - **Power slider** — vertical or horizontal, same range as current
  - **Ammo count** — remains in command bar (right side)
  - **Pause button** — same position
- Styling:
  - Background: dark solid (`#1a1a2e` or similar, per V2)
  - Text: white/light
  - Sliders: thinner, white translucent track, white border
  - Active ammo button: brighter highlight
- Emit events: `aim-changed`, `ammo-type-changed`, `pause`

### Modified: `src/ui/HUD.tsx` and `src/ui/Controls.tsx`
- Remove these files or reduce to re-export CommandBar

### Modified: `src/App.tsx`
- Render `<CommandBar />` instead of `<HUD />` + `<Controls />`
- Pass down callbacks: `onAimChange`, `onAmmoSelect`, `onPause`

## Verification
- `npm run build` succeeds
- Command bar renders at bottom with all elements
- Ammo type buttons work (changes `selectedAmmo`)
- Angle/power sliders control aim
- Ammo count updates correctly
- Pause button works
- Styling matches V2 dark theme
