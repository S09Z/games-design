import * as THREE from 'three';

export class World {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(45, 960 / 540, 1, 2000);
    this.camera.position.set(480, 200, 600);
    this.camera.lookAt(480, 100, 0);

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

  dispose() {
    this.renderer.dispose();
  }
}
