# Phase 7 — Polish & Cleanup

Goal: Clean up old artifacts, add final polish, and verify everything works end-to-end.

## Tasks

### Cleanup
- [ ] Remove old Phaser migration files (`src/scenes/`)
- [ ] Remove old `js/` folder (if all functionality is ported)
- [ ] Remove `phaser` and `headroom-ai` from `package.json`
- [ ] Remove old CSS files (`css/animations.css`, `css/responsive.css`, `css/style.css`)
- [ ] Remove old `index.html` content (replace with new Vite entry)
- [ ] Remove `dist/` (will be rebuilt)
- [ ] Remove `prototype.html`? (keep as reference or delete)

### Responsive
- [ ] Three.js renderer resizes with window (match aspect ratio or allow letterbox)
- [ ] React UI overlays reposition correctly on resize
- [ ] Touch: pointer events work on mobile

### Mobile support
- [ ] Touch drag to aim
- [ ] Touch fire button (larger hit area)
- [ ] Prevent default touch behaviors (scroll, zoom)

### Performance
- [ ] Use `InstancedMesh` for castle blocks (if many)
- [ ] Merge static geometry where possible
- [ ] Three.js `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`
- [ ] Rapier physics rate capped at 60Hz

### Physics tuning
- [ ] Tune gravity scale to match original trebuchet arc feel
- [ ] Tune boulder restitution/bounce
- [ ] Tune block friction so castle crumbles similarly to reference

### Testing
- [ ] Play through all levels end-to-end
- [ ] Verify win/lose conditions trigger correctly
- [ ] Test edge cases: 0 ammo, 1 enemy left, drag-aim release
- [ ] Test pause/resume cycle
- [ ] Test save/load best score
- [ ] Test on mobile viewport

### Final
- [ ] `npm run build` succeeds without errors
- [ ] `npm run preview` serves the built app correctly
- [ ] Remove any unused imports/variables from the new codebase

## Verification

- Build succeeds with zero errors
- Full game loop: Menu → Play → Aim → Fire → Win/Lose → Modal → Next Level/Menu
- Mobile touch input works
- No console errors or warnings
- No old dependency references remain
