# Phase 0 — Foundation Setup

Goal: Scaffold the new project and verify the toolchain works.

## Tasks

- [ ] Remove Phaser 4 dependency (`phaser` from `package.json`)
- [ ] Install Three.js, Rapier, React + ReactDOM, TypeScript
- [ ] Scaffold Vite config for TypeScript + React
- [ ] Create project structure:
  ```
  src/
  ├── main.tsx              # React entry
  ├── App.tsx               # Root component (router)
  ├── game/                 # Three.js game world
  │   ├── World.ts          # Scene, renderer, camera, lights
  │   ├── Trebuchet.ts      # 3D trebuchet model + animation
  │   ├── Castle.ts         # Castle block construction
  │   ├── Boulder.ts        # Projectile
  │   ├── Enemy.ts          # Enemy characters
  │   ├── Particles.ts      # Particle/debris system
  │   └── Background.ts     # Sky, terrain, hills
  ├── physics/              # Rapier wrapper
  │   ├── PhysicsWorld.ts   # Rapier world init, step, sync
  │   ├── Bodies.ts         # Body factory (block, boulder, enemy)
  │   └── Collision.ts      # Collision events → game logic
  ├── state/                # Game state (no React coupling)
  │   ├── GameState.ts      # Score, ammo, enemies, win/lose
  │   └── events.ts         # Typed event bus
  ├── ui/                   # React components
  │   ├── HUD.tsx           # Score, ammo, enemies left
  │   ├── Menu.tsx          # Main menu
  │   ├── PauseModal.tsx    # Pause overlay
  │   ├── ResultModal.tsx   # Victory/Defeat modal
  │   ├── Controls.tsx      # Angle slider, power slider, fire btn
  │   └── LevelSelect.tsx   # Level grid
  ├── levels/               # Level data
  │   └── level1.ts         # Port from assets/levels/
  └── config.ts             # Game constants
  ```
- [ ] Verify Vite dev server runs with empty Three.js scene

## Verification

- `npm run dev` starts without errors
- Browser shows a blank Three.js viewport
- React root mounts without errors
