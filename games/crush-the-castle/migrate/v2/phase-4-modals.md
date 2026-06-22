# V2 Phase 4 — Modal Simplification

Goal: Simplify pause overlay and result modal per V2 design.

## Changes

### `src/ui/PauseModal.tsx`
- Overlay with semi-transparent background
- Title: "PAUSED"
- Buttons:
  - "RESUME" — resumes game
  - "QUIT" — returns to main menu
- Remove any complex styling, keep minimal

### `src/ui/ResultModal.tsx`
- Overlay with semi-transparent background
- Shows score
- Buttons:
  - "PLAY AGAIN" — restarts level
- No star rating display (V2 doesn't show stars)
- No best score display (V2 doesn't show it)

### `src/App.tsx`
- Wire new pause/result modals
- Remove star/bestScore related props if unused

## Verification
- `npm run build` succeeds
- Pause overlay shows with Resume/Quit buttons
- Result modal shows score + Play Again
- No console errors
