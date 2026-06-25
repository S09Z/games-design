import { useEffect, useRef, useState, useCallback } from 'react';
import { PhysicsWorld } from './physics/PhysicsWorld';
import { level1 } from './game/Level';
import { GameState, type GamePhase } from './state/GameState';
import { events } from './state/events';
import { World } from './game/World';
import { createBackground } from './game/Background';
import { Trebuchet } from './game/Trebuchet';
import { createBlockMesh, resizeBlockMesh, addCastleDetails, updateBlockMesh } from './game/Castle';
import { createEnemyMesh, syncEnemyMesh } from './game/Enemy';
import { ParticleSystem } from './game/Particles';
import { Effects } from './game/Effects';
import { CommandBar } from './ui/CommandBar';
import { Controls } from './ui/Controls';
import { HUD } from './ui/HUD';
import { MainMenu } from './ui/MainMenu';
import { PauseModal } from './ui/PauseModal';
import { ResultModal } from './ui/ResultModal';
import { Hint } from './ui/Hint';
import { audioManager } from './audio/AudioManager';
import { A_LOAD, PV } from './config';
import type { AmmoType } from './config';

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const trebRef = useRef<Trebuchet | null>(null);
  const gameStateRef = useRef<GameState | null>(null);

  const [aimDeg, setAimDeg] = useState(32);
  const [power, setPower] = useState(66);
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [ammo, setAmmo] = useState(5);
  const [selectedAmmo, setSelectedAmmo] = useState<AmmoType>('standard');
  const [score, setScore] = useState(0);
  const [ammo, setAmmo] = useState(5);
  const [enemiesAlive, setEnemiesAlive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<'victory' | 'defeat' | null>(null);
  const [bestScore, setBestScore] = useState(
    parseInt(localStorage.getItem('ctc_best') || '0', 10)
  );
  const [hintVisible, setHintVisible] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(audioManager.soundEnabled);
  const [musicEnabled, setMusicEnabled] = useState(audioManager.musicEnabled);

  const handlePlay = useCallback(() => {
    gameStateRef.current?.startLevel();
  }, []);

  const handleRestart = useCallback(() => {
    window.location.reload();
  }, []);

  const handleQuit = useCallback(() => {
    window.location.reload();
  }, []);

  const handlePause = useCallback(() => {
    gameStateRef.current?.togglePause();
  }, []);

  const handleResume = useCallback(() => {
    gameStateRef.current?.togglePause();
  }, []);

  const handleHowToPlay = useCallback(() => {
    const el = document.getElementById('howto');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleToggleSound = useCallback(() => {
    audioManager.toggleSound();
    setSoundEnabled(audioManager.soundEnabled);
  }, []);

  const handleToggleMusic = useCallback(() => {
    audioManager.toggleMusic();
    setMusicEnabled(audioManager.musicEnabled);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const world = new World(canvas);
    const { scene, camera, renderer } = world;
    world.setupLights();
    if (containerRef.current) world.bindContainer(containerRef.current);

    createBackground(scene);
    addCastleDetails(scene);

    const treb = new Trebuchet();
    trebRef.current = treb;
    scene.add(treb.group);

    const physics = new PhysicsWorld();
    const gameState = new GameState(physics);
    gameStateRef.current = gameState;
    const particles = new ParticleSystem();
    const effects = new Effects(scene);

    const bodyMeshes = new Map<number, THREE.Mesh>();

    let isDragging = false;
    let isPanning = false;
    let panStart = { x: 0, y: 0 };

    function toCanvasCoords(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      };
    }

    function onPointerDown(e: PointerEvent) {
      if (gameState.paused) return;

      if (gameState.phase === 'aiming') {
        const p = toCanvasCoords(e);
        const dx = p.x - PV.x;
        const dy = p.y - PV.y;
        if (Math.hypot(dx, dy) <= 260) {
          isDragging = true;
          canvas.setPointerCapture(e.pointerId);
          return;
        }
      }

      if (gameState.phase === 'aiming' || gameState.phase === 'settling') {
        isPanning = true;
        panStart = { x: e.clientX, y: e.clientY };
        canvas.setPointerCapture(e.pointerId);
      }
    }

    function onPointerMove(e: PointerEvent) {
      if (isDragging) {
        const p = toCanvasCoords(e);
        const dx = PV.x - p.x;
        const dy = PV.y - p.y;
        const d = Math.hypot(dx, dy);
        if (d < 8) return;
        let deg = Math.atan2(-dy, Math.abs(dx) || 0.001) * 180 / Math.PI;
        deg = Math.max(8, Math.min(62, Math.round(deg)));
        const pw = Math.max(20, Math.min(100, Math.round(d / 260 * 100)));
        treb.aimAngle = deg;
        treb.power = pw;
        setAimDeg(deg);
        setPower(pw);
        return;
      }
      if (isPanning) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        world.panBy(dx * 0.5, dy * 0.5);
        panStart = { x: e.clientX, y: e.clientY };
      }
    }

    function onPointerUp(_e: PointerEvent) {
      if (isPanning) {
        isPanning = false;
        return;
      }
      if (!isDragging) return;
      isDragging = false;
      if (gameState.phase === 'aiming' && !gameState.paused) {
        gameState.fire();
        treb.fire();
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && gameState.phase === 'aiming' && !gameState.paused) {
        e.preventDefault();
        gameState.fire();
        treb.fire();
      }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        gameState.togglePause();
      }
      if (e.code === 'KeyR' && (gameState.phase === 'won' || gameState.phase === 'lost')) {
        window.location.reload();
      }
    };

    const onPhaseChanged = (p: unknown) => {
      setPhase(p as GamePhase);
      if (p === 'aiming') world.reset();
    };

    function getColliderSize(collider: import('@dimforge/rapier3d-compat').Collider) {
      try {
        const he = collider.halfExtents();
        return { x: he.x, y: he.y, z: he.z };
      } catch {
        return { x: 0.5, y: 0.5, z: 0.5 };
      }
    }

    let onBoulderLaunched: () => void;
    let onBoulderRemoved: (handle: unknown) => void;
    let onAmmoChanged: (n: unknown) => void;
    let onAmmoTypeChanged: (t: unknown) => void;

    physics.init().then(() => {
      events.on('phase-changed', onPhaseChanged);
      events.on('score-changed', onScoreChanged);
      events.on('ammo-changed', onAmmoChanged);
      events.on('enemies-changed', onEnemiesChanged);
      events.on('pause', onPause);
      events.on('resume', onResume);
      events.on('victory', onVictory);
      events.on('defeat', onDefeat);

      onAmmoChanged = (n: unknown) => setAmmo(n as number);
      events.on('ammo-changed', onAmmoChanged);

      onAmmoTypeChanged = (t: unknown) => setSelectedAmmo(t as AmmoType);
      events.on('ammo-type-changed', onAmmoTypeChanged);

      physics.loadLevel(level1);

      // Create meshes for blocks
      for (const h of physics.blocks) {
        const mesh = createBlockMesh(h);
        resizeBlockMesh(mesh, h);
        scene.add(mesh);
        bodyMeshes.set(h.collider.handle, mesh);
      }

      // Create meshes for enemies
      for (const h of physics.enemies) {
        const mesh = createEnemyMesh(h);
        scene.add(mesh);
        bodyMeshes.set(h.collider.handle, mesh);
      }

      // Boulder events
      physics.onCollisionImpact = () => {
        world.triggerShake(12);
        for (const b of physics.activeBoulders) {
          const t = b.rigidBody.translation();
          particles.spawnImpact(t.x, t.y, 18);
        }
      };

      onBoulderLaunched = () => {
        world.triggerShake(5);
        effects.hideTrajectory();
      };
      events.on('boulder-launched', onBoulderLaunched);

      onBoulderRemoved = (handle: unknown) => {
        const mesh = bodyMeshes.get(handle as number);
        if (mesh) {
          scene.remove(mesh);
          bodyMeshes.delete(handle as number);
        }
      };
      events.on('boulder-removed', onBoulderRemoved);

      physics.onEnemyKilled = (_idx: number, pos?: { x: number; y: number; z: number }) => {
        audioManager.play('enemy_die');
        if (pos) particles.spawnImpact(pos.x, pos.y, 9);
      };

      // Fire sequence: trebuchet animation -> release -> flying
      treb.onRelease = (pos, vel) => {
        physics.launchBoulder(pos, vel, gameState.selectedAmmo);
      };
      treb.onSwingComplete = () => {
        gameState.startFlying();
      };

      // Keyboard input
      window.addEventListener('keydown', onKeyDown);

      // Pointer events for drag-to-aim
      canvas.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);

      function animate() {
        requestAnimationFrame(animate);

        if (gameState.paused) {
          renderer.render(scene, camera);
          return;
        }

        // Reset treb when entering aiming phase
        if (gameState.phase === 'aiming' && !treb.swinging) {
          treb.angle = A_LOAD;
          treb.swingF = 0;
        }

        // Update trebuchet animation (fires onRelease / onSwingComplete callbacks)
        treb.update();
        physics.step();

        // Show trajectory during aiming
        if (gameState.phase === 'aiming') {
          const sp = treb.spawnPos();
          const v = treb.aimVel();
          effects.showTrajectory(sp, v as any, 468);
        } else {
          effects.hideTrajectory();
        }

        // Sync block meshes
        for (const h of physics.blocks) {
          const mesh = bodyMeshes.get(h.collider.handle);
          if (mesh) updateBlockMesh(mesh, h);
        }

        // Sync enemy meshes
        for (const h of physics.enemies) {
          const mesh = bodyMeshes.get(h.collider.handle);
          if (mesh && !h.userData.dead) syncEnemyMesh(mesh, h);
        }

        // Handle active boulders
        for (const b of physics.activeBoulders) {
          let mesh = bodyMeshes.get(b.collider.handle);
          if (!mesh) {
            const t = b.rigidBody.translation();
            const size = getColliderSize(b.collider);
            const geo = new THREE.SphereGeometry(size.x, 12, 12);
            const mat = new THREE.MeshStandardMaterial({ color: 0x8C8378, roughness: 0.9 });
            mesh = new THREE.Mesh(geo, mat);
            mesh.castShadow = true;
            scene.add(mesh);
            bodyMeshes.set(b.collider.handle, mesh);
          }
          const t = b.rigidBody.translation();
          const r = b.rigidBody.rotation();
          mesh.position.set(t.x, t.y, t.z);
          mesh.quaternion.set(r.x, r.y, r.z, r.w);
        }

        // Update camera (auto-follow + shake)
        const boulderPositions = physics.activeBoulders.map(b => b.rigidBody.translation());
        world.update(gameState.phase, boulderPositions);

        // Update particles
        particles.update();

        renderer.render(scene, camera);
      }
      animate();
    });

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      events.off('phase-changed', onPhaseChanged);
      events.off('boulder-launched', onBoulderLaunched);
      events.off('boulder-removed', onBoulderRemoved);
      events.off('ammo-changed', onAmmoChanged);
      events.off('ammo-type-changed', onAmmoTypeChanged);
      physics.destroy();
      world.dispose();
      particles.clear();
    };
  }, []);

  const disabled = phase !== 'aiming';
  const isPlaying = phase !== 'menu';
  const showControls = phase === 'aiming';

  return (
    <div style={{ width: 960, margin: '40px auto', position: 'relative' }}>
      <div style={{ width: 960, height: 540, position: 'relative' }}>
        <canvas ref={canvasRef} width={960} height={540}
          style={{ display: 'block', width: '100%', height: '100%', border: '2px solid #333', borderRadius: 8 }} />
      </div>
      <CommandBar
        aimDeg={aimDeg}
        power={power}
        selectedAmmo={selectedAmmo}
        disabled={disabled}
        onAimChange={(deg) => {
          setAimDeg(deg);
          if (trebRef.current) trebRef.current.aimAngle = deg;
        }}
        onPowerChange={(pct) => {
          setPower(pct);
          if (trebRef.current) trebRef.current.power = pct;
        }}
        onAmmoSelect={(type) => {
          if (gameStateRef.current) gameStateRef.current.selectAmmo(type);
        }}
        onFire={() => {
          if (gameStateRef.current && trebRef.current) {
            gameStateRef.current.fire();
            trebRef.current.fire();
          }
        }}
        onPause={() => {
          if (gameStateRef.current) gameStateRef.current.togglePause();
        }}
      />
    <div ref={containerRef} style={{ maxWidth: 960, width: '100%', aspectRatio: '16/9', margin: '40px auto', position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%', border: '2px solid #333', borderRadius: 8, touchAction: 'none' }} />

      {isPlaying && (
        <HUD
          score={score}
          enemiesAlive={enemiesAlive}
          ammo={ammo}
          onPause={handlePause}
          onRestart={handleRestart}
        />
      )}

      {showControls && (
        <Controls
          aimDeg={aimDeg}
          power={power}
          disabled={false}
          onAimChange={(deg) => {
            setAimDeg(deg);
            if (trebRef.current) trebRef.current.aimAngle = deg;
          }}
          onPowerChange={(pct) => {
            setPower(pct);
            if (trebRef.current) trebRef.current.power = pct;
          }}
          onFire={() => {
            if (gameStateRef.current && trebRef.current) {
              gameStateRef.current.fire();
              trebRef.current.fire();
            }
          }}
        />
      )}

      {isPlaying && <Hint visible={hintVisible} />}

      {phase === 'menu' && (
        <MainMenu onPlay={handlePlay} onHowToPlay={handleHowToPlay} />
      )}

      {paused && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onQuit={handleQuit}
          soundEnabled={soundEnabled}
          musicEnabled={musicEnabled}
          onToggleSound={handleToggleSound}
          onToggleMusic={handleToggleMusic}
        />
      )}

      {result && (
        <ResultModal
          result={result}
          score={score}
          bestScore={bestScore}
          starsEarned={result === 'victory' ? (ammo >= 2 ? 3 : ammo === 1 ? 2 : 1) : 0}
          onHome={handleQuit}
          onRetry={handleRestart}
          onNext={result === 'victory' ? handleRestart : null}
        />
      )}
    </div>
  );
}
