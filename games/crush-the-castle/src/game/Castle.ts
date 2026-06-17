import * as THREE from 'three';
import type { BodyHandle } from '../physics/Bodies';
import { GY } from '../config';

const matCache = new Map<string, THREE.MeshStandardMaterial>();

function stoneMat(dark = false): THREE.MeshStandardMaterial {
  const key = dark ? 'sd' : 'st';
  if (matCache.has(key)) return matCache.get(key)!;
  const m = new THREE.MeshStandardMaterial({
    color: dark ? 0x787268 : 0x9A9284,
    roughness: 0.85,
    metalness: 0.05,
  });
  matCache.set(key, m);
  return m;
}

const woodMat = new THREE.MeshStandardMaterial({ color: 0x9A6B38, roughness: 0.9 });

export function createBlockMesh(h: BodyHandle): THREE.Mesh {
  const s = h.rigidBody.translation();
  const kind = h.userData.material;
  const material = kind === 'wood' ? woodMat : stoneMat(kind === 'darkStone');
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(s.x, s.y, s.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.bodyHandle = h;
  return mesh;
}

export function resizeBlockMesh(mesh: THREE.Mesh, h: BodyHandle) {
  // Get the collider half-extents for sizing
  try {
    const collider = h.collider;
    const he = collider.halfExtents();
    mesh.scale.set(he.x * 2, he.y * 2, he.z * 2);
  } catch {
    mesh.scale.set(1, 1, 1);
  }
}

export function addCastleDetails(scene: THREE.Scene) {
  const gy = GY;
  const bH = 24;

  // Arch gateway at central keep (793)
  const kx = 793, aw = 36, ah = 46;
  const archShape = new THREE.Shape();
  archShape.moveTo(-aw / 2, -ah + aw / 2);
  archShape.absarc(0, -ah + aw / 2, aw / 2, Math.PI, 0, false);
  archShape.lineTo(aw / 2, 0);
  archShape.lineTo(-aw / 2, 0);
  archShape.closePath();
  const archGeo = new THREE.ShapeGeometry(archShape);
  const archMat = new THREE.MeshBasicMaterial({ color: 0x2A1808, side: THREE.DoubleSide });
  const arch = new THREE.Mesh(archGeo, archMat);
  arch.position.set(kx, gy, -1);
  scene.add(arch);

  // Arch border
  const archBorderMat = new THREE.MeshBasicMaterial({ color: 0x9A7050 });
  const borderPoints: THREE.Vector3[] = [];
  const steps = 16;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = Math.PI + t * Math.PI;
    borderPoints.push(new THREE.Vector3(
      kx + (aw / 2 + 2) * Math.cos(a),
      gy - ah + aw / 2 + (aw / 2 + 2) * Math.sin(a),
      -1
    ));
  }
  borderPoints.push(new THREE.Vector3(kx - aw / 2 - 2, gy, -1));
  borderPoints.push(new THREE.Vector3(kx - aw / 2 - 2, gy, -1));
  const borderGeo = new THREE.BufferGeometry().setFromPoints(borderPoints);
  const borderLine = new THREE.Line(borderGeo, archBorderMat);
  scene.add(borderLine);

  // Flags
  const flags: { x: number; y: number; color: number }[] = [
    { x: 665, y: gy - 7 * bH - 2, color: 0xE8533A },
    { x: 793, y: gy - 9 * bH - 2, color: 0xF2A93B },
    { x: 917, y: gy - 6 * bH - 2, color: 0xE8533A },
  ];

  for (const f of flags) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 30, 6),
      new THREE.MeshStandardMaterial({ color: 0x8A5A30 })
    );
    pole.position.set(f.x, f.y + 15, 0);
    scene.add(pole);

    // Flag triangle
    const flagShape = new THREE.Shape();
    flagShape.moveTo(0, 0);
    flagShape.lineTo(24, -7);
    flagShape.lineTo(0, -14);
    flagShape.closePath();
    const flagGeo = new THREE.ShapeGeometry(flagShape);
    const flagMat = new THREE.MeshBasicMaterial({ color: f.color, side: THREE.DoubleSide });
    const flag = new THREE.Mesh(flagGeo, flagMat);
    flag.position.set(f.x, f.y + 30, 0);
    scene.add(flag);

    // Flag border
    const flagBorderMat = new THREE.MeshBasicMaterial({ color: 0x2E2117 });
    const flagBorder = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(24, -7, 0),
        new THREE.Vector3(0, -14, 0),
        new THREE.Vector3(0, 0, 0),
      ]),
      flagBorderMat
    );
    flagBorder.position.copy(flag.position);
    scene.add(flagBorder);
  }

  // Arrow-slit windows
  const slitMat = new THREE.MeshBasicMaterial({ color: 0x2A1808 });
  const slits: [number, number, number, number][] = [
    [630, gy - 4 * bH - 4, 10, 14],
    [676, gy - 4 * bH - 4, 10, 14],
    [759, gy - 6 * bH - 4, 10, 16],
    [817, gy - 6 * bH - 4, 10, 16],
    [786, gy - 6 * bH - 4, 14, 20],
  ];
  for (const [sx, sy, sw, sh] of slits) {
    const slit = new THREE.Mesh(
      new THREE.PlaneGeometry(sw, sh),
      slitMat
    );
    slit.position.set(sx, sy, -0.5);
    scene.add(slit);
  }
}

export function updateBlockMesh(mesh: THREE.Mesh, h: BodyHandle) {
  const t = h.rigidBody.translation();
  const r = h.rigidBody.rotation();
  mesh.position.set(t.x, t.y, t.z);
  mesh.quaternion.set(r.x, r.y, r.z, r.w);

  // Update visual tint based on crack level
  const cl = h.userData.cl || 0;
  const mat = mesh.material as THREE.MeshStandardMaterial;
  if (cl > 0) {
    const darken = 1 - cl * 0.12;
    const baseColor = h.userData.material === 'darkStone' ? 0x787268 : h.userData.material === 'wood' ? 0x9A6B38 : 0x9A9284;
    const r2 = ((baseColor >> 16) & 0xFF) * darken / 255;
    const g = ((baseColor >> 8) & 0xFF) * darken / 255;
    const b = (baseColor & 0xFF) * darken / 255;
    mat.color.setRGB(r2, g, b);
  }
}
