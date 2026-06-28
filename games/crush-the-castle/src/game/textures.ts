import * as THREE from 'three';

// Procedural canvas textures, generated once and reused.

let woodTex: THREE.Texture | null = null;
let stoneTex: THREE.Texture | null = null;

/** Warm wood grain — used for the throwing arm and counterweight crate. */
export function woodTexture(): THREE.Texture {
  if (woodTex) return woodTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#A87848';
  ctx.fillRect(0, 0, 128, 128);
  // Long grain streaks
  for (let i = 0; i < 26; i++) {
    const y = Math.random() * 128;
    ctx.strokeStyle = `rgba(${90 + Math.random() * 40 | 0},${55 + Math.random() * 30 | 0},30,${0.12 + Math.random() * 0.18})`;
    ctx.lineWidth = 0.5 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(42, y + (Math.random() - 0.5) * 6, 86, y + (Math.random() - 0.5) * 6, 128, y + (Math.random() - 0.5) * 4);
    ctx.stroke();
  }
  // A couple of knots
  for (let i = 0; i < 2; i++) {
    const kx = 20 + Math.random() * 88, ky = 20 + Math.random() * 88;
    const g = ctx.createRadialGradient(kx, ky, 1, kx, ky, 7);
    g.addColorStop(0, 'rgba(70,42,20,.5)');
    g.addColorStop(1, 'rgba(70,42,20,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(kx, ky, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  woodTex = new THREE.CanvasTexture(c);
  woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
  return woodTex;
}

/** Mottled grey rock — used for boulders. */
export function stoneTexture(): THREE.Texture {
  if (stoneTex) return stoneTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#8C8378';
  ctx.fillRect(0, 0, 128, 128);
  // Speckle
  for (let i = 0; i < 900; i++) {
    const v = Math.random();
    const shade = v < 0.5 ? 0 : 255;
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${0.04 + Math.random() * 0.1})`;
    ctx.fillRect(Math.random() * 128, Math.random() * 128, 1.5, 1.5);
  }
  // Cracks
  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = 'rgba(70,64,56,.35)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    let x = Math.random() * 128, y = Math.random() * 128;
    ctx.moveTo(x, y);
    for (let s = 0; s < 4; s++) {
      x += (Math.random() - 0.5) * 40;
      y += (Math.random() - 0.5) * 40;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  stoneTex = new THREE.CanvasTexture(c);
  stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping;
  return stoneTex;
}
