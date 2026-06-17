import * as THREE from 'three';

interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

const colors = [0xC8A875, 0x9A9182, 0xE8D4A0, 0xD4965A, 0xB0A898];

export class ParticleSystem {
  particles: Particle[] = [];

  spawnImpact(x: number, y: number, n = 18) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * 5.5 + 1.5;
      const col = colors[i % 5];
      const geo = new THREE.SphereGeometry(Math.random() * 3 + 1.5, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color: col });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, 0);
      this.particles.push({
        mesh,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 2.5,
        life: Math.floor(Math.random() * 20 + 12),
        maxLife: 32,
      });
    }

    // Dust puffs
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * 1.5 + 0.5;
      const geo2 = new THREE.SphereGeometry(Math.random() * 8 + 4, 8, 8);
      const mat2 = new THREE.MeshBasicMaterial({ color: 0xB4A591, transparent: true, opacity: 0.5 });
      const mesh2 = new THREE.Mesh(geo2, mat2);
      mesh2.position.set(x, y, 0);
      this.particles.push({
        mesh: mesh2,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 1,
        life: Math.floor(Math.random() * 30 + 20),
        maxLife: 50,
      });
    }
  }

  update() {
    for (const p of this.particles) {
      p.mesh.position.x += p.vx * 0.6;
      p.mesh.position.y += p.vy * 0.6;
      p.vy += 0.18 * 0.6;
      p.vx *= 0.95;
      p.life--;

      const alpha = Math.max(0, p.life / p.maxLife);
      (p.mesh.material as THREE.MeshBasicMaterial).opacity = alpha;
      const s = 0.5 + (1 - p.life / p.maxLife) * 0.5;
      p.mesh.scale.setScalar(s);
    }

    // Remove dead particles
    const dead = this.particles.filter(p => p.life <= 0);
    for (const p of dead) {
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.MeshBasicMaterial).dispose();
    }
    this.particles = this.particles.filter(p => p.life > 0);
  }

  clear() {
    for (const p of this.particles) {
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.MeshBasicMaterial).dispose();
    }
    this.particles = [];
  }
}
