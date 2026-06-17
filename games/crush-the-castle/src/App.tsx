import { useEffect, useRef } from 'react';
import { PhysicsWorld } from './physics/PhysicsWorld';
import { level1 } from './game/Level';
import { GameState } from './state/GameState';
import { World } from './game/World';
import { createBackground } from './game/Background';
import { Trebuchet } from './game/Trebuchet';
import { createBlockMesh, resizeBlockMesh, addCastleDetails, updateBlockMesh } from './game/Castle';
import { createEnemyMesh, syncEnemyMesh } from './game/Enemy';
import { ParticleSystem } from './game/Particles';
import { Effects } from './game/Effects';

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const world = new World(canvas);
    const { scene, camera, renderer } = world;
    world.setupLights();

    createBackground(scene);
    addCastleDetails(scene);

    const treb = new Trebuchet();
    scene.add(treb.group);

    const physics = new PhysicsWorld();
    const gameState = new GameState(physics);
    const particles = new ParticleSystem();
    const effects = new Effects(scene);

    const bodyMeshes = new Map<number, THREE.Mesh>();

    function getColliderSize(collider: import('@dimforge/rapier3d-compat').Collider) {
      try {
        const he = collider.halfExtents();
        return { x: he.x, y: he.y, z: he.z };
      } catch {
        return { x: 0.5, y: 0.5, z: 0.5 };
      }
    }

    physics.init().then(() => {
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
        if (physics.boulder) {
          const t = physics.boulder.rigidBody.translation();
          particles.spawnImpact(t.x, t.y, 18);
        }
      };

      physics.onBoulderLaunched = (pos) => {
        effects.triggerShake(5);
        particles.spawnImpact(pos.x, pos.y, 5);
        effects.hideTrajectory();
      };

      physics.onEnemyKilled = () => {
        // particles already handled via displacement check
      };

      function animate() {
        requestAnimationFrame(animate);

        // Update trebuchet animation
        treb.update();

        // Handle trebuchet fire
        if (treb.swinging && treb.swingF >= 0) {
          if (treb.swingF === (treb.swingF < 5 ? -1 : 4)) {
            // placeholder
          }
        }

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

        // Handle boulder
        if (physics.boulder) {
          let mesh = bodyMeshes.get(physics.boulder.collider.handle);
          if (!mesh) {
            const t = physics.boulder.rigidBody.translation();
            const size = getColliderSize(physics.boulder.collider);
            const geo = new THREE.SphereGeometry(size.x, 12, 12);
            const mat = new THREE.MeshStandardMaterial({ color: 0x8C8378, roughness: 0.9 });
            mesh = new THREE.Mesh(geo, mat);
            mesh.castShadow = true;
            scene.add(mesh);
            bodyMeshes.set(physics.boulder.collider.handle, mesh);
          }
          const t = physics.boulder.rigidBody.translation();
          const r = physics.boulder.rigidBody.rotation();
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
      physics.destroy();
      world.dispose();
      particles.clear();
    };
  }, []);

  return (
    <div style={{ width: 960, height: 540, margin: '40px auto' }}>
      <canvas ref={canvasRef} width={960} height={540}
        style={{ display: 'block', width: '100%', height: '100%', border: '2px solid #333', borderRadius: 8 }} />
    </div>
  );
}
