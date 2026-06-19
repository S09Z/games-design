import * as THREE from 'three';

export class World {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  private container: HTMLElement | null = null;
  private resizeHandler: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, 960 / 540, 1, 2000);
    this.camera.position.set(480, 200, 600);
    this.camera.lookAt(480, 100, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(960, 540);
    this.renderer.shadowMap.enabled = true;
  }

  bindContainer(el: HTMLElement) {
    this.container = el;
    this.resizeHandler = () => this.handleResize();
    window.addEventListener('resize', this.resizeHandler);
    this.handleResize();
  }

  private handleResize() {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = w * (540 / 960);
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
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

  dispose() {
    if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
    this.renderer.dispose();
  }
}
