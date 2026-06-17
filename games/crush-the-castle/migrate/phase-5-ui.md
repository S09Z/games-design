# Phase 5 — UI (React)

Goal: Port all HTML/DOM overlays from `prototype.html` to React components.  
UI overlays are positioned absolutely over the Three.js canvas.

## Reference: `prototype.html:74-214`

## Tasks

### 5a — HUD (`prototype.html:74-109`)
- [ ] **Score** (top-left) — star icon + "Score" label + score value
- [ ] **Level** (top-left above score) — "LEVEL 1" badge
- [ ] **Enemies left** (top-center) — red circle icon + "N left" text
- [ ] **Ammo** (bottom-left) — "Ammo" label + bullet icon + "×N"
- [ ] All HUD values read from GameState, update via event subscription
- [ ] Props: `score, enemiesAlive, ammo, level`

### 5b — Controls (`prototype.html:111-129`)
- [ ] **Direction slider** — label + `<input type="range">` + degree value
- [ ] **Power slider** — label + `<input type="range">` + percentage value
- [ ] **FIRE button** — triangle icon + "FIRE" text
- [ ] Disabled state when game state ≠ `aiming`

### 5c — Main Menu (`prototype.html:193-214`)
- [ ] Full-screen overlay on game start
- [ ] Title: "Crush the Castle" with styled text
- [ ] **▶ PLAY** button — hides menu, starts level
- [ ] **How to Play** button — scrolls to instructions
- [ ] **Settings** button — placeholder
- [ ] **Sound/Music toggle** (top-right)
- [ ] Background radial gradient overlay

### 5d — Pause Modal (`prototype.html:136-156`)
- [ ] Semi-transparent backdrop
- [ ] "Paused" title badge
- [ ] **RESUME** button → `setPaused(false)`
- [ ] **Restart** button → `buildLevel()`
- [ ] **Quit to Menu** button → show main menu
- [ ] **Music toggle** switch
- [ ] **Sound toggle** switch

### 5e — Victory Modal (`prototype.html:158-191`)
- [ ] "Victory!" title with red background
- [ ] 3 stars (filled/empty based on `starsEarned`)
- [ ] Score + Best Score display
- [ ] **Home** (icon) → main menu
- [ ] **Retry** button → restart level
- [ ] **NEXT** button → next level (or restart if last)

### 5f — Defeat Modal (`prototype.html:158-191`)
- [ ] "Defeat" title with dark background
- [ ] Score display
- [ ] **Menu** button → main menu
- [ ] **Try Again** button → restart level

### 5g — Hint text (`prototype.html:132-134`)
- [ ] "Set direction & power, then press FIRE — or drag from the trebuchet"
- [ ] Visible on first load, hidden on first fire

## Styling
- [ ] Port CSS from `prototype.html:12-57` into CSS modules or styled-components
- [ ] Custom range input styling (`.ct` class slider thumb + track)
- [ ] `.hud-btn` style (icon buttons with shadow press effect)
- [ ] `.fire-btn` style (red button with shadow)
- [ ] `.modal-play-again` style
- [ ] Press effect (`transform: translateY`, reduced `box-shadow`)

## Verification

- All UI elements render in correct positions over the canvas
- HUD updates in real-time as game state changes
- Sliders control aim/power
- Modals open/close with correct transitions
- Button press animations work
- Responsive layout at different viewport sizes
