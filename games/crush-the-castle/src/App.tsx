import { useEffect, useRef, useState } from 'react';
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
import { Controls } from './ui/Controls';
import { A_LOAD, PV } from './config';

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trebRef = useRef<Trebuchet | null>(null);
  const gameStateRef = useRef<GameState | null>(null);

  const [aimDeg, setAimDeg] = useState(32);
  const [power, setPower] = useState(66);
  const [phase, setPhase] = useState<GamePhase>('menu');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const world = new World(canvas);
    const { scene, camera, renderer } = world;
    world.setupLights();

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

    function toCanvasCoords(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      };
    }

    function onPointerDown(e: PointerEvent) {
      if (gameState.phase !== 'aiming' || gameState.paused) return;
      const p = toCanvasCoords(e);
      const dx = p.x - PV.x;
      const dy = p.y - PV.y;
      if (Math.hypot(dx, dy) > 260) return;
      isDragging = true;
      canvas.setPointerCapture(e.pointerId);
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDragging) return;
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
    }

    function onPointerUp(_e: PointerEvent) {
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

    const onPhaseChanged = (p: unknown) => setPhase(p as GamePhase);

    function getColliderSize(collider: import('@dimforge/rapier3d-compat').Collider) {
      try {
        const he = collider.halfExtents();
        return { x: he.x, y: he.y, z: he.z };
      } catch {
        return { x: 0.5, y: 0.5, z: 0.5 };
      }
    }

    physics.init().then(() => {
      // Subscribe to events before triggering state changes
      events.on('phase-changed', onPhaseChanged);

      physics.loadLevel(level1);
      gameState.startLevel();

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
        effects.triggerShake(12);
        for (const b of physics.activeBoulders) {
          const t = b.rigidBody.translation();
          particles.spawnImpact(t.x, t.y, 18);
        }
      };

      const onBoulderLaunched = () => {
        effects.triggerShake(5);
        effects.hideTrajectory();
      };
      events.on('boulder-launched', onBoulderLaunched);

      const onBoulderRemoved = (handle: unknown) => {
        const mesh = bodyMeshes.get(handle as number);
        if (mesh) {
          scene.remove(mesh);
          bodyMeshes.delete(handle as number);
        }
      };
      events.on('boulder-removed', onBoulderRemoved);

      physics.onEnemyKilled = (_idx: number, pos?: { x: number; y: number; z: number }) => {
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

        // Camera shake
        effects.updateShake(camera);

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
      physics.destroy();
      world.dispose();
      particles.clear();
    };
  }, []);

  const disabled = phase !== 'aiming';

  return (
    <div style={{ width: 960, height: 540, margin: '40px auto', position: 'relative' }}>
      <canvas ref={canvasRef} width={960} height={540}
        style={{ display: 'block', width: '100%', height: '100%', border: '2px solid #333', borderRadius: 8 }} />
      <Controls
        aimDeg={aimDeg}
        power={power}
        disabled={disabled}
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
    </div>
  );
}
