import * as THREE from 'three';
import { GY, W } from '../config';

export class Effects {
  shakeAmount = 0;
  private shakeDecay = 0.78;
  private shakeSub = 0.08;

  // Trajectory preview
  private trajectoryDots: THREE.Mesh[] = [];
  private trajectoryLine: THREE.Line | null = null;
  private launchMarker: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene) {
    // Trajectory dots (reusable)
    for (let i = 0; i < 30; i++) {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0x2E2117, transparent: true, opacity: 0.25 })
      );
      dot.visible = false;
      scene.add(dot);
      this.trajectoryDots.push(dot);
    }

    // Trajectory line
    const lineGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(62 * 3);
    lineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x2E2117,
      dashSize: 4,
      gapSize: 3,
      transparent: true,
      opacity: 0.25,
    });
    this.trajectoryLine = new THREE.Line(lineGeo, lineMat);
    this.trajectoryLine.visible = false;
    scene.add(this.trajectoryLine);

    // Launch marker
    const ringGeo = new THREE.RingGeometry(5, 7, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xE8533A, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    this.launchMarker = new THREE.Mesh(ringGeo, ringMat);
    this.launchMarker.visible = false;
    scene.add(this.launchMarker);
  }

  triggerShake(amount: number) {
    this.shakeAmount = Math.max(this.shakeAmount, amount);
  }

  updateShake(camera: THREE.PerspectiveCamera) {
    if (this.shakeAmount > 0.5) {
      const sx = (Math.random() - 0.5) * this.shakeAmount;
      const sy = (Math.random() - 0.5) * this.shakeAmount;
      camera.position.x += sx;
      camera.position.y += sy;
      camera.lookAt(480, 100, 0);
    }
    this.shakeAmount = Math.max(0, this.shakeAmount * this.shakeDecay - this.shakeSub);
  }

  showTrajectory(
    origin: { x: number; y: number },
    vel: { x: number; vx: number; y: number; vy: number },
    gy: number,
  ) {
    const ox = origin.x;
    const oy = origin.y;
    const vx = vel.vx || vel.x;
    const vy = vel.vy || vel.y;
    const pg = 0.60;

    let dotCount = 0;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 30; i++) {
      const t = i * 2.6;
      const x = ox + vx * t;
      const y = oy + vy * t + 0.5 * pg * t * t;
      if (y > GY || x > W) break;
      this.trajectoryDots[i].position.set(x, y, 0);
      this.trajectoryDots[i].visible = true;
      const r = 4 - i * 0.1;
      this.trajectoryDots[i].scale.setScalar(Math.max(0.3, r / 0.9));
      pts.push(new THREE.Vector3(x, y, 0));
      dotCount++;
    }
    for (let i = dotCount; i < 30; i++) {
      this.trajectoryDots[i].visible = false;
    }

    // Line
    if (pts.length > 1 && this.trajectoryLine) {
      const pos = this.trajectoryLine.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < pts.length; i++) {
        pos[i * 3] = pts[i].x;
        pos[i * 3 + 1] = pts[i].y;
        pos[i * 3 + 2] = 0;
      }
      this.trajectoryLine.geometry.attributes.position.count = pts.length;
      this.trajectoryLine.geometry.attributes.position.needsUpdate = true;
      this.trajectoryLine.geometry.setDrawRange(0, pts.length);
      this.trajectoryLine.computeLineDistances();
      this.trajectoryLine.visible = true;
    }

    // Launch marker
    if (this.launchMarker) {
      this.launchMarker.position.set(ox, oy, 0);
      this.launchMarker.visible = true;
    }
  }

  hideTrajectory() {
    for (const dot of this.trajectoryDots) dot.visible = false;
    if (this.trajectoryLine) this.trajectoryLine.visible = false;
    if (this.launchMarker) this.launchMarker.visible = false;
  }
}
