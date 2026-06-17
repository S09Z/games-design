import * as THREE from 'three';
import { GY, PV, AL, AS, SL, A_LOAD, A_REST, SF, RELEASE_FRAME, RELEASE_ANGLE, W, VMAX } from '../config';

const gy = GY;
const px = PV.x;
const py3 = GY - PV.y; // pivot Y in 3D space

function p3(x: number, y: number, z = 0) {
  return new THREE.Vector3(x, gy - y, z);
}

function makeBar(x1: number, y1: number, x2: number, y2: number, w: number, color: number, zD = 12): THREE.Mesh {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const geo = new THREE.BoxGeometry(len, w, zD);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
  const mesh = new THREE.Mesh(geo, mat);
  const pos = p3(mx, my, 0);
  mesh.position.copy(pos);
  mesh.rotation.z = -ang;
  mesh.castShadow = true;
  return mesh;
}

export class Trebuchet {
  group = new THREE.Group();
  arm: THREE.Mesh;
  armPivot: THREE.Object3D;
  boulderMesh: THREE.Mesh;
  slingLine: THREE.Line;
  aimAngle = 32;
  power = 66;
  angle = A_LOAD;
  swinging = false;
  swingF = 0;
  onRelease: ((pos: { x: number; y: number; z: number }, vel: { x: number; y: number; z: number }) => void) | null = null;
  onSwingComplete: (() => void) | null = null;

  constructor() {
    const g = this.group;
    const pivotX = px, pivotY = PV.y;

    // Ground shadow
    const shadowGeo = new THREE.PlaneGeometry(272, 28);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x3F3020, transparent: true, opacity: 0.14 });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.copy(p3(pivotX + 26, gy, -1));
    shadow.rotation.x = -Math.PI / 2;
    g.add(shadow);

    // Ground sill
    g.add(makeBar(102, gy - 3, 374, gy - 3, 18, 0x7A5230, 18));

    // Rear A-frame legs
    g.add(makeBar(140, gy, pivotX - 8, pivotY + 18, 10, 0x6B4427));
    g.add(makeBar(pivotX + 10, pivotY + 18, 254, gy, 10, 0x6B4427));

    // Front A-frame legs
    g.add(makeBar(110, gy, pivotX - 4, pivotY + 12, 15, 0x8A5A30));
    g.add(makeBar(pivotX + 6, pivotY + 12, 318, gy, 15, 0x8A5A30));

    // Forward brace
    g.add(makeBar(pivotX + 8, pivotY + 18, 374, gy - 2, 12, 0x7A5230));

    // Lower cross braces (X pattern)
    g.add(makeBar(128, gy - 76, 298, gy - 94, 9, 0x6B4427));
    g.add(makeBar(128, gy - 94, 298, gy - 76, 9, 0x6B4427));

    // Upper cross braces (X pattern)
    g.add(makeBar(130, gy - 152, 280, gy - 168, 7, 0x6B4427));
    g.add(makeBar(130, gy - 168, 280, gy - 152, 7, 0x6B4427));

    // Axle housing
    const axleGeo = new THREE.CylinderGeometry(11, 11, 56, 12);
    const axleMat = new THREE.MeshStandardMaterial({ color: 0x9A6840, roughness: 0.7 });
    const axle = new THREE.Mesh(axleGeo, axleMat);
    axle.position.copy(p3(pivotX, pivotY + 10, 0));
    axle.rotation.z = Math.PI / 2;
    g.add(axle);

    // Axle bolts
    for (const ox of [-20, 0, 20]) {
      const bolt = new THREE.Mesh(
        new THREE.SphereGeometry(3.5, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0x3A3A40 })
      );
      bolt.position.copy(p3(pivotX + ox, pivotY + 10, 0));
      g.add(bolt);
    }

    // Counterweight chain + box group
    const cwGroup = new THREE.Object3D();

    // Chain (thin cylinder)
    const chain = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 24, 6),
      new THREE.MeshStandardMaterial({ color: 0x3A3A40 })
    );
    chain.position.set(0, 12, 0);
    cwGroup.add(chain);

    // Counterweight box
    const cwBox = new THREE.Mesh(
      new THREE.BoxGeometry(46, 58, 24),
      new THREE.MeshStandardMaterial({ color: 0x5C3F26, roughness: 0.9 })
    );
    cwBox.position.set(0, 46, 0);
    cwBox.castShadow = true;
    cwGroup.add(cwBox);

    // Metal bars on counterweight
    for (const yb of [-28, -15, -2, 11, 24]) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(46, 5, 26),
        new THREE.MeshStandardMaterial({ color: 0x3A3A40 })
      );
      bar.position.set(0, yb, 0);
      cwGroup.add(bar);
    }

    // Counterweight rivets
    for (const [bx, by] of [[-16, -24], [15, -24], [-16, 25], [15, 25]]) {
      const rivet = new THREE.Mesh(
        new THREE.SphereGeometry(2.8, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0x7A7A84 })
      );
      rivet.position.set(bx, by, 0);
      cwGroup.add(rivet);
    }

    // Arm pivot — contains the arm + counterweight
    this.armPivot = new THREE.Object3D();
    this.armPivot.position.copy(p3(pivotX, pivotY, 0));
    g.add(this.armPivot);

    // Throwing arm (the long beam)
    const totalLen = AL + AS;
    this.arm = new THREE.Mesh(
      new THREE.BoxGeometry(totalLen, 16, 14),
      new THREE.MeshStandardMaterial({ color: 0xA87848, roughness: 0.7 })
    );
    // Arm extends from -AS (short side) to +AL (long side)
    this.arm.position.set((AL - AS) / 2, 0, 0);
    this.arm.castShadow = true;
    this.armPivot.add(this.arm);

    // Arm banding (cross-marks)
    for (const t of [-AS + 12, 55, AL - 20]) {
      const band = new THREE.Mesh(
        new THREE.BoxGeometry(4, 18, 16),
        new THREE.MeshStandardMaterial({ color: 0x3A3A40 })
      );
      band.position.set(t, 0, 0);
      this.armPivot.add(band);
    }

    // Attach counterweight to short arm
    const cwOffset = new THREE.Object3D();
    cwOffset.position.set(-AS, 0, 0);
    cwOffset.add(cwGroup);
    this.armPivot.add(cwOffset);

    // Pivot pin at center
    const pin = new THREE.Mesh(
      new THREE.SphereGeometry(11, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x2E2E36 })
    );
    pin.position.set(0, 0, 0);
    this.armPivot.add(pin);
    const pinInner = new THREE.Mesh(
      new THREE.SphereGeometry(5.5, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x8A8A96, metalness: 0.3 })
    );
    pinInner.position.set(0, 0, 0);
    this.armPivot.add(pinInner);

    // Pre-fire boulder at sling end
    const boulderGeo = new THREE.SphereGeometry(16, 16, 16);
    const boulderMat = new THREE.MeshStandardMaterial({
      color: 0x8C8378,
      roughness: 0.9,
    });
    this.boulderMesh = new THREE.Mesh(boulderGeo, boulderMat);
    this.boulderMesh.castShadow = true;
    g.add(this.boulderMesh);

    // Sling rope
    const slingGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(6);
    slingGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const slingMat = new THREE.LineBasicMaterial({
      color: 0x8A5A30,
      linewidth: 1,
      transparent: true,
      opacity: 0.6,
    });
    this.slingLine = new THREE.Line(slingGeo, slingMat);
    g.add(this.slingLine);

    this.angle = A_LOAD;
  }

  armTip(): { x: number; y: number } {
    const cos = Math.cos(this.angle);
    const sin = Math.sin(this.angle);
    return { x: px + AL * cos, y: PV.y + AL * sin };
  }

  spawnPos(): { x: number; y: number } {
    const r = this.aimAngle * Math.PI / 180;
    const tip = this.armTip();
    return { x: tip.x + SL * Math.cos(r), y: tip.y - SL * Math.sin(r) };
  }

  aimVel(): { x: number; y: number; vx: number; vy: number } {
    const r = this.aimAngle * Math.PI / 180;
    const v = (this.power / 100) * VMAX;
    return { x: Math.cos(r) * v, y: -Math.sin(r) * v, vx: Math.cos(r) * v, vy: -Math.sin(r) * v };
  }

  fire() {
    if (this.swinging) return;
    this.swinging = true;
    this.swingF = 0;
    this.angle = A_LOAD;
  }

  update() {
    // Fire sequence: quintic ease arm animation
    if (this.swinging) {
      this.swingF++;
      const p = Math.min(this.swingF / SF, 1);
      const e = p * p * p * p * p;
      this.angle = A_LOAD + (A_REST - A_LOAD) * e;

      if (this.swingF === RELEASE_FRAME) {
        const { pos, vel } = this.spawnBoulder();
        this.onRelease?.(pos, vel);
      }

      if (this.swingF >= SF) {
        this.swinging = false;
        this.onSwingComplete?.();
      }
    }

    const ang = this.angle;
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);

    // Arm rotation
    this.armPivot.rotation.z = -(ang - A_LOAD);

    // Pre-fire boulder and sling line (hide after release frame)
    if (this.swingF < RELEASE_FRAME) {
      const sp = this.spawnPos();
      this.boulderMesh.visible = true;
      this.boulderMesh.position.set(sp.x, gy - sp.y, 0);

      const tip = this.armTip();
      const pos = this.slingLine.geometry.attributes.position.array as Float32Array;
      pos[0] = tip.x; pos[1] = gy - tip.y; pos[2] = 0;
      pos[3] = sp.x; pos[4] = gy - sp.y; pos[5] = 0;
      this.slingLine.geometry.attributes.position.needsUpdate = true;
      this.slingLine.visible = true;
    } else {
      this.boulderMesh.visible = false;
      this.slingLine.visible = false;
    }
  }

  spawnBoulder(): { pos: { x: number; y: number; z: number }; vel: { x: number; y: number; z: number } } {
    const sp = this.spawnPos();
    const v = this.aimVel();
    return {
      pos: { x: sp.x, y: gy - sp.y, z: 0 },
      vel: { x: v.x, y: v.vy, z: 0 },
    };
  }
}
