# Phase 3 — Game Logic

Goal: Port the complete game state machine from `prototype.html` `CrushGame` class.

## Reference: `prototype.html:225-652`

## Tasks

### 3a — State machine
Reference: `prototype.html:254, 560, 585, 588, 636-651`

```
aiming ──fire()──→ swinging ──release──→ flying ──settle──→ aiming|lost|won
```

- [ ] Implement state enum: `'aiming' | 'swinging' | 'flying' | 'won' | 'lost'`
- [ ] State guards: fire() only in `aiming`, settle detection only in `flying`
- [ ] State transitions update UI, enable/disable input

### 3b — Fire sequence
Reference: `prototype.html:558-562, 568-585`
- [ ] `fire()` sets `swinging = true`, advances arm through quintic ease
- [ ] At `RELEASE_FRAME` → spawn boulder Rapier body with velocity from aim angle/power
- [ ] After `SF` frames → transition to `flying` state
- [ ] Impact particles on release (`spawnImpact`)

### 3c — Flying / projectile tracking
Reference: `prototype.html:588-604`
- [ ] Track active boulder body
- [ ] Each tick: check boulder position, remove if off-screen or below ground
- [ ] Track each enemy's displacement from spawn position
- [ ] If displacement > 82 units or out of bounds → mark dead, +1000 score

### 3d — Turn end / settle detection
Reference: `prototype.html:606-609, 628-652`
- [ ] Every tick in `flying`: find max velocity across all dynamic bodies
- [ ] If max < 1.5 for 26 consecutive frames → `endTurn()`
- [ ] Fallback: if `flyF > 300` frames → force `endTurn()`

### 3e — Scoring
Reference: `prototype.html:594, 638-639`
- [ ] Base score: 1000 per enemy eliminated
- [ ] Ammo bonus: 300 per remaining ammo at victory
- [ ] Star calculation:
  - 3★: remaining ammo >= 2
  - 2★: remaining ammo == 1
  - 1★: remaining ammo == 0
- [ ] Best score persisted to localStorage (`ctc_best` key)

### 3f — Ammo management
- [ ] Start: 5 ammo
- [ ] Decrement on each `endTurn()` where enemies remain alive
- [ ] Display in HUD as `×N`

### 3g — Win/lose conditions
- [ ] Win: all enemies `dead` → show Victory modal with stars
- [ ] Lose: ammo === 0 AND enemies still alive → show Defeat modal
- [ ] Win path: score += ammo * 300, calculate stars
- [ ] Lose path: stars = 0

### 3h — Level data
- [ ] Port castle + enemy layout from `prototype.html:417-477` into level config file
- [ ] Each level has: block positions/types, enemy positions/types, ammo count

### 3i — Event bus
Reference: `prototype.html:state/events.ts`
- [ ] Typed event bus for game events
- [ ] Events: `fire`, `boulder-release`, `impact`, `enemy-kill`, `turn-end`, `victory`, `defeat`, `aim-changed`
- [ ] React UI subscribes to events for updates
- [ ] Audio hooks into events in Phase 6

## Verification

- Fire→swing→release→fly→settle cycle works correctly
- Enemies die when pushed too far
- Score increments correctly
- Win condition triggers with correct stars
- Lose condition triggers when out of ammo
- Best score persists across page reloads
- Level restarts cleanly
