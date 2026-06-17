import * as THREE from 'three';
import { W, H, GY } from '../config';

export function createBackground(scene: THREE.Scene) {
  // Sky gradient via canvas texture
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 540;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 540);
  grad.addColorStop(0, '#9CC2D2');
  grad.addColorStop(0.45, '#C9DDCF');
  grad.addColorStop(0.72, '#EFDEB4');
  grad.addColorStop(1, '#F7D89A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2, 540);
  const tex = new THREE.CanvasTexture(canvas);
  scene.background = tex;

  // Sun emissive sphere
  const sunGeo = new THREE.SphereGeometry(28, 16, 16);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFF4CE });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  sun.position.set(820, GY - 110, 0);
  scene.add(sun);

  // Sun glow sprite
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 192;
  glowCanvas.height = 192;
  const gctx = glowCanvas.getContext('2d')!;
  const r = gctx.createRadialGradient(96, 96, 8, 96, 96, 96);
  r.addColorStop(0, 'rgba(255,247,221,0.92)');
  r.addColorStop(0.4, 'rgba(252,233,180,0.46)');
  r.addColorStop(1, 'rgba(248,215,154,0)');
  gctx.fillStyle = r;
  gctx.fillRect(0, 0, 192, 192);
  const glowTex = new THREE.CanvasTexture(glowCanvas);
  const glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false });
  const glow = new THREE.Sprite(glowMat);
  glow.position.set(820, GY - 110, -20);
  glow.scale.set(380, 380, 1);
  scene.add(glow);

  // Far hills
  const farHillShape = new THREE.Shape();
  const farPts: [number, number][] = [
    [0, GY - 148], [200, GY - 188], [430, GY - 152], [660, GY - 190],
    [880, GY - 150], [960, GY - 174], [960, GY - 80], [0, GY - 80],
  ];
  farHillShape.moveTo(farPts[0][0], farPts[0][1]);
  for (let i = 1; i < farPts.length; i++) farHillShape.lineTo(farPts[i][0], farPts[i][1]);
  farHillShape.closePath();
  const farHillGeo = new THREE.ShapeGeometry(farHillShape);
  const farHillMat = new THREE.MeshBasicMaterial({ color: 0xAEC6B2, side: THREE.DoubleSide });
  const farHill = new THREE.Mesh(farHillGeo, farHillMat);
  farHill.position.set(0, 0, -50);
  scene.add(farHill);

  // Near hills
  const nearHillShape = new THREE.Shape();
  const nearPts: [number, number][] = [
    [0, GY - 120], [260, GY - 154], [500, GY - 124], [720, GY - 152],
    [960, GY - 122], [960, GY - 80], [0, GY - 80],
  ];
  nearHillShape.moveTo(nearPts[0][0], nearPts[0][1]);
  for (let i = 1; i < nearPts.length; i++) nearHillShape.lineTo(nearPts[i][0], nearPts[i][1]);
  nearHillShape.closePath();
  const nearHillGeo = new THREE.ShapeGeometry(nearHillShape);
  const nearHillMat = new THREE.MeshBasicMaterial({ color: 0x86A06C, side: THREE.DoubleSide });
  const nearHill = new THREE.Mesh(nearHillGeo, nearHillMat);
  nearHill.position.set(0, 0, -30);
  scene.add(nearHill);

  // Ground plane
  const groundGeo = new THREE.PlaneGeometry(1200, 200);
  const groundMat2 = new THREE.MeshStandardMaterial({
    color: 0x82A268,
    roughness: 0.9,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat2);
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(W / 2, 0, 0);
  ground.receiveShadow = true;
  scene.add(ground);
}
