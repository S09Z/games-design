# Phase 4 — Input

Goal: Port all input handling from `prototype.html:480-546` to the new stack.

## Reference: `prototype.html:480-551`

## Tasks

### 4a — Slider controls
Reference: `prototype.html:506-514`
- [ ] Direction slider → React `<input type="range" min="8" max="62">`
- [ ] Power slider → React `<input type="range" min="20" max="100">`
- [ ] On input → update GameState aimDeg/power → triggers re-render of label + trajectory preview
- [ ] Labels show current values (`32°`, `66%`)

### 4b — Fire button
Reference: `prototype.html:517`
- [ ] "FIRE" button in React Controls component
- [ ] On click → `gameState.fire()` (only enabled in `aiming` state)
- [ ] Button disabled state when not `aiming`

### 4c — Drag to aim
Reference: `prototype.html:487-499, 538-546`
- [ ] Pointer events on Three.js canvas (`pointerdown`, `pointermove`, `pointerup`)
- [ ] On `pointerdown`: check distance from trebuchet pivot (< 260 units), start drag
- [ ] On `pointermove`: calculate angle from drag vector (clamp 8-62°), power from drag distance (20-100%)
- [ ] On `pointerup`: trigger `fire()`
- [ ] Cursor change: `grab` → `grabbing` during drag

### 4d — Keyboard
- [ ] Space → fire (same as button, only in `aiming`)
- [ ] Escape → toggle pause
- [ ] P key → toggle pause

### 4e — State gating
- [ ] All input disabled when:
  - Game state ≠ `aiming`
  - Game is paused
  - Modal is open (result, pause, menu)
- [ ] keyboard handlers check state before dispatching

## Verification

- Sliders update aim/power labels in real-time
- Drag from trebuchet sets angle and power correctly
- Drag release fires the boulder
- Space bar fires
- Escape pauses/unpauses
- All input disabled during swing/fly/settle states
- Cursor changes appropriately
