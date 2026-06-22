# V2 Phase 5 — Polish & Final Verification

Goal: Clean up, style tuning, and end-to-end testing.

## Tasks

### Style alignment
- Container `max-width: 980px` (was 960px)
- Canvas border is now on parent container (4px `#2E2117`, border-radius 22px)
- Range sliders use V2 dark theme (white translucent track, white border)
- Hint text updated to mention drag-to-pan
- How to Play text below game container (inline, not in MainMenu)

### Cleanup
- Remove unused `Controls.tsx` (replaced by CommandBar)
- Remove unused `HUD.tsx` (replaced by CommandBar)
- Remove old Effects shake code (moved to camera)

### Remove unused state
- `bestScore` state from App.tsx (no longer displayed)
- `handleHowToPlay` callback

### Verification
- `npm run build` succeeds
- `npm run dev` starts
- Full game loop: Menu → Play → Select ammo → Aim → Fire → Camera follow → Win/Lose → Play Again
- All 3 ammo types work
- Camera follows boulder, pan works
- Command bar renders correctly
- Pause overlay works
- Result modal shows score + Play Again
- No console errors
