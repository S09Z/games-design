import * as THREE from 'three';
import type { BodyHandle } from '../physics/Bodies';

export function createEnemyMesh(h: BodyHandle): THREE.Mesh {
  const type = h.userData.enemyType;
  const group = new THREE.Group();

  if (type === 'king') {
    // Cape
    const cape = new THREE.Mesh(
      new THREE.PlaneGeometry(22, 24),
      new THREE.MeshBasicMaterial({ color: 0xE8533A, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
    );
    cape.position.set(0, 8, -5);
    group.add(cape);

    // Legs
    for (const lx of [-3, 3]) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2, 10, 6),
        new THREE.MeshStandardMaterial({ color: 0x2E2117 })
      );
      leg.position.set(lx, 13, 0);
      group.add(leg);
    }

    // Gold robe body
    const robe = new THREE.Mesh(
      new THREE.BoxGeometry(14, 15, 8),
      new THREE.MeshStandardMaterial({ color: 0xF2A93B, roughness: 0.6 })
    );
    robe.position.set(0, 3, 0);
    group.add(robe);

    // Belt
    const belt = new THREE.Mesh(
      new THREE.BoxGeometry(14, 3, 10),
      new THREE.MeshStandardMaterial({ color: 0x2E2117 })
    );
    belt.position.set(0, 8, 0);
    group.add(belt);

    // Belt buckle
    const buckle = new THREE.Mesh(
      new THREE.SphereGeometry(3, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xF2A93B })
    );
    buckle.position.set(0, 8, 4);
    group.add(buckle);

    // Sceptre
    const sceptrePole = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 22, 6),
      new THREE.MeshStandardMaterial({ color: 0xC9851E })
    );
    sceptrePole.position.set(9, 0, 0);
    group.add(sceptrePole);
    const sceptreHead = new THREE.Mesh(
      new THREE.SphereGeometry(4.5, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xF2A93B })
    );
    sceptreHead.position.set(9, 11, 0);
    group.add(sceptreHead);
    const sceptreGem = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0xE8533A })
    );
    sceptreGem.position.set(9, 11, 0);
    group.add(sceptreGem);

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(7, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xF5D9C0, roughness: 0.8 })
    );
    head.position.set(0, -7, 0);
    group.add(head);

    // Eyes
    for (const ex of [-2.5, 2.5]) {
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(1.5, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0x2E2117 })
      );
      eye.position.set(ex, -7.5, 5.5);
      group.add(eye);
    }

    // Beard
    const beard = new THREE.Mesh(
      new THREE.ConeGeometry(4, 5, 6),
      new THREE.MeshStandardMaterial({ color: 0xC8A462 })
    );
    beard.position.set(0, -3, 4);
    beard.rotation.x = 0.3;
    group.add(beard);

    // Crown
    const crownShape = new THREE.Shape();
    crownShape.moveTo(-9, 0);
    crownShape.lineTo(-9, -6);
    crownShape.lineTo(-4.5, -3);
    crownShape.lineTo(0, -9);
    crownShape.lineTo(4.5, -3);
    crownShape.lineTo(9, -6);
    crownShape.lineTo(9, 0);
    crownShape.closePath();
    const crownGeo = new THREE.ShapeGeometry(crownShape);
    const crownMat = new THREE.MeshBasicMaterial({ color: 0xF2A93B, side: THREE.DoubleSide });
    const crown = new THREE.Mesh(crownGeo, crownMat);
    crown.position.set(0, -13, 4);
    group.add(crown);

    // Crown gems
    for (const gx of [-9, 0, 9]) {
      const gem = new THREE.Mesh(
        new THREE.SphereGeometry(2.5, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xE8533A })
      );
      gem.position.set(gx, -13, 5);
      group.add(gem);
    }
  } else {
    // GUARD
    // Legs
    for (const lx of [-3, 3]) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2, 10, 6),
        new THREE.MeshStandardMaterial({ color: 0x2E2117 })
      );
      leg.position.set(lx, 11, 0);
      group.add(leg);
    }

    // Chainmail body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(12, 13, 8),
      new THREE.MeshStandardMaterial({ color: 0x9A9284, roughness: 0.9 })
    );
    body.position.set(0, 2, 0);
    group.add(body);

    // Red tabard
    const tabard = new THREE.Mesh(
      new THREE.BoxGeometry(6, 13, 9),
      new THREE.MeshStandardMaterial({ color: 0xE8533A })
    );
    tabard.position.set(0, 2, 0);
    group.add(tabard);

    // Shield
    const shieldShape = new THREE.Shape();
    shieldShape.moveTo(-6, 0);
    shieldShape.lineTo(-13, 0);
    shieldShape.lineTo(-14, 8);
    shieldShape.lineTo(-10, 14);
    shieldShape.lineTo(-6, 12);
    shieldShape.closePath();
    const shieldGeo = new THREE.ShapeGeometry(shieldShape);
    const shieldMat = new THREE.MeshBasicMaterial({ color: 0x8A5A30, side: THREE.DoubleSide });
    const shield = new THREE.Mesh(shieldGeo, shieldMat);
    shield.position.set(0, 0, 4);
    group.add(shield);

    // Shield cross
    const shieldCrossMat = new THREE.MeshBasicMaterial({ color: 0xE8533A });
    const sc1 = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.5), shieldCrossMat);
    sc1.position.set(-10, 4, 5);
    group.add(sc1);
    const sc2 = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 12), shieldCrossMat);
    sc2.position.set(-10, 4, 5);
    group.add(sc2);

    // Spear
    const spearPole = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 22, 6),
      new THREE.MeshStandardMaterial({ color: 0x8A5A30 })
    );
    spearPole.position.set(8, 1, 0);
    group.add(spearPole);
    const spearHead = new THREE.Mesh(
      new THREE.ConeGeometry(2, 7, 6),
      new THREE.MeshBasicMaterial({ color: 0xB0B8C0 })
    );
    spearHead.position.set(8, -9, 0);
    group.add(spearHead);

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(5.5, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xF5D9C0, roughness: 0.8 })
    );
    head.position.set(0, -7, 0);
    group.add(head);

    // Eyes
    for (const ex of [-2, 2]) {
      const eye = new THREE.Mesh(
        new THREE.SphereGeometry(1.3, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0x2E2117 })
      );
      eye.position.set(ex, -7.5, 4.5);
      group.add(eye);
    }

    // Helmet
    const helmetShape = new THREE.Shape();
    helmetShape.moveTo(-7, 0);
    helmetShape.quadraticCurveTo(0, -10, 7, 0);
    helmetShape.closePath();
    const helmetGeo = new THREE.ShapeGeometry(helmetShape);
    const helmetMat = new THREE.MeshBasicMaterial({ color: 0x8A8278, side: THREE.DoubleSide });
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.set(0, -9, 4);
    group.add(helmet);

    // Visor slit
    const visor = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 3),
      new THREE.MeshBasicMaterial({ color: 0x2E2117 })
    );
    visor.position.set(0, -8, 5.2);
    group.add(visor);
  }

  // Merge group into a single mesh for simplicity
  const container = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial());
  container.add(group);
  container.userData.bodyHandle = h;
  return container;
}

export function syncEnemyMesh(mesh: THREE.Mesh, h: BodyHandle) {
  const t = h.rigidBody.translation();
  const r = h.rigidBody.rotation();
  mesh.position.set(t.x, t.y, t.z);
  mesh.quaternion.set(r.x, r.y, r.z, r.w);
}
