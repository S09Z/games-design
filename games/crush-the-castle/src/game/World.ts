import * as THREE from 'three';
import { CAM_FOLLOW_SPEED, CAM_PAN_BOUNDS, CAM_DEFAULT } from '../config';

export class World {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  camTarget = { x: CAM_DEFAULT.x, y: CAM_DEFAULT.y };
  shakeAmount = 0;
  private shakeDecay = 0.78;
  private shakeSub = 0.08;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, 960 / 540, 1, 2000);
    this.camera.position.set(CAM_DEFAULT.x, CAM_DEFAULT.y, CAM_DEFAULT.z);
    this.camera.lookAt(CAM_DEFAULT.x, CAM_DEFAULT.y, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(960, 540);
    this.renderer.shadowMap.enabled = true;
  }

  setupLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(500, 400, 300);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -200;
    sun.shadow.camera.right = 1200;
    sun.shadow.camera.top = 600;
    sun.shadow.camera.bottom = -100;
    this.scene.add(sun);
  }

  triggerShake(amount: number) {
    this.shakeAmount = Math.max(this.shakeAmount, amount);
  }

  reset() {
    this.camTarget.x = CAM_DEFAULT.x;
    this.camTarget.y = CAM_DEFAULT.y;
  }

  panBy(dx: number, dy: number) {
    this.camTarget.x -= dx;
    this.camTarget.y += dy;
    this.clampTarget();
  }

  private clampTarget() {
    this.camTarget.x = Math.max(CAM_PAN_BOUNDS.minX, Math.min(CAM_PAN_BOUNDS.maxX, this.camTarget.x));
    this.camTarget.y = Math.max(CAM_PAN_BOUNDS.minY, Math.min(CAM_PAN_BOUNDS.maxY, this.camTarget.y));
  }

  /**
   * Convert client pixel coords to world coords at z=0.
   */
  clientToWorld(clientX: number, clientY: number, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width * 2 - 1;
    const ny = -(clientY - rect.top) / rect.height * 2 + 1;
    const vec = new THREE.Vector3(nx, ny, 0.5);
    vec.unproject(this.camera);
    const dir = vec.sub(this.camera.position).normalize();
    const t = -this.camera.position.z / dir.z;
    return { x: this.camera.position.x + dir.x * t, y: this.camera.position.y + dir.y * t };
  }

  /**
   * Project a world point to client pixel coords.
   */
  worldToClient(wx: number, wy: number, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const vec = new THREE.Vector3(wx, wy, 0).project(this.camera);
    return {
      x: (vec.x * 0.5 + 0.5) * rect.width + rect.left,
      y: (-vec.y * 0.5 + 0.5) * rect.height + rect.top,
    };
  }

  update(phase: string, boulderPositions: { x: number; y: number }[]) {
    // Auto-follow during flying
    if (phase === 'flying' && boulderPositions.length > 0) {
      this.camTarget.x = boulderPositions[0].x;
      this.camTarget.y = boulderPositions[0].y;
    }

    this.clampTarget();

    // Shake offset
    let sx = 0, sy = 0;
    if (this.shakeAmount > 0.5) {
      sx = (Math.random() - 0.5) * this.shakeAmount;
      sy = (Math.random() - 0.5) * this.shakeAmount;
    }
    this.shakeAmount = Math.max(0, this.shakeAmount * this.shakeDecay - this.shakeSub);

    // Lerp camera toward target + shake
    const tx = this.camTarget.x + sx;
    const ty = this.camTarget.y + sy;
    this.camera.position.x += (tx - this.camera.position.x) * CAM_FOLLOW_SPEED;
    this.camera.position.y += (ty + 100 - this.camera.position.y) * CAM_FOLLOW_SPEED;
    this.camera.lookAt(tx, ty, 0);
  }

  dispose() {
    this.renderer.dispose();
  }
}
