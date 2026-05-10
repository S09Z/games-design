# Hand of God — Browser Game Design Document
**Version:** 1.0 | **Platform:** Web Browser (HTML/CSS/JS only) | **Date:** May 2026

---

## 1. Vision Statement

เกม Isometric God Sandbox ที่ผู้เล่นรับบทเป็น "มือเทพเจ้า" ล่องลอยเหนือหมู่บ้านเล็กๆ
สามารถหยิบ โยน และปล่อยธาตุใส่ชาวบ้านได้อย่างอิสระ
ไม่มี Win/Lose — มีแค่ Chaos และ Satisfaction

**Core Fantasy:** รู้สึกว่าตัวเองมีพลังเหนือโลกใบเล็กๆ

---

## 2. Technical Architecture

### 2.1 Rendering Stack
```
Canvas 2D API (HTML5)
  └── IsometricRenderer         — แปลง World (x,y,z) → Screen (sx,sy)
        ├── TileLayer           — พื้นดิน, หญ้า, ทาง
        ├── EntityLayer         — NPC, Objects, Particles
        ├── HandLayer           — Cursor มือ + ของที่ถือ
        └── UILayer             — HUD, SpellBar (DOM overlay)
```

### 2.2 Isometric Projection Formula
```js
// World → Screen (2:1 Diamond Isometric)
const TILE_W = 64;   // px กว้าง tile
const TILE_H = 32;   // px สูง tile (ครึ่งนึงของกว้าง)
const ELEV_H = 48;   // px ต่อ 1 unit ความสูง (z-axis)

function worldToScreen(wx, wy, wz = 0) {
  return {
    sx: (wx - wy) * (TILE_W / 2) + CANVAS_W / 2,
    sy: (wx + wy) * (TILE_H / 2) - wz * ELEV_H + CANVAS_H / 2
  };
}

function screenToWorld(sx, sy) {
  const dx = sx - CANVAS_W / 2;
  const dy = sy - CANVAS_H / 2;
  return {
    wx: (dx / (TILE_W / 2) + dy / (TILE_H / 2)) / 2,
    wy: (dy / (TILE_H / 2) - dx / (TILE_W / 2)) / 2
  };
}
```

### 2.3 Game Loop
```
requestAnimationFrame Loop (target 60fps)
  ├── update(deltaTime)
  │     ├── physicsSystem.step()      — Gravity, Velocity, Collision
  │     ├── npcSystem.update()        — AI Wander, State Machine
  │     ├── spellSystem.update()      — Projectile, AOE, Lifetime
  │     ├── particleSystem.update()   — Blood, Smoke, Spark, Ash
  │     └── handSystem.update()       — Drag, Throw Physics
  └── render()
        ├── clearCanvas()
        ├── renderTiles()             — Depth-sorted ด้วย (wx + wy)
        ├── renderEntities()          — Sort by (wy + wx) สำหรับ Z-order
        ├── renderParticles()
        └── renderHand()
```

---

## 3. World Design

### 3.1 Map Layout (20×20 Tiles)
```
┌─────────────────────────┐
│  🌲  🌲  🌲  🌲  🌲     │  ← Tree Border
│  🌲  🏠  🏠  🌲  🏠    │
│  🌲  🏠  ⛲  🏠  🌲    │  ⛲ = Fountain (Center)
│  🌲  🏠  🏠  🌲  🏠    │  🏠 = Houses (Waypoints for NPC)
│  🌲  🌲  🌲  🌲  🌲     │
└─────────────────────────┘
```

### 3.2 Tile Types
| Tile ID | Name       | Passable | Visual              |
|---------|------------|----------|---------------------|
| 0       | Grass      | ✅       | สีเขียว, Noise texture |
| 1       | Stone Path | ✅       | สีเทา, Grid pattern |
| 2       | Water      | ❌       | สีน้ำเงิน, Shimmer anim |
| 3       | Tree       | ❌       | สีเขียวเข้ม, Shadow |
| 4       | House Base | ❌       | สีน้ำตาล, 3D Isometric |

---

## 4. Entity System

### 4.1 NPC (Villager) State Machine
```
         ┌──────────┐
    ┌───▶│  WANDER  │◀───┐
    │    └────┬─────┘    │
    │ arrive  │          │ calm down
    │         ▼          │
    │    ┌──────────┐    │
    │    │   IDLE   │    │
    │    └────┬─────┘    │
    │  start  │          │
    │         ▼          │
    │    ┌──────────┐    │
    └────│   WALK   │    │
         └────┬─────┘    │
              │ spot danger
              ▼
         ┌──────────┐    │
    ┌───▶│   FLEE   │────┘
    │    └────┬─────┘
    │         │ grabbed
    │         ▼
    │    ┌──────────┐
    │    │  GRABBED │  ← หยุด AI, Physics เข้าควบคุม
    │    └────┬─────┘
    │         │ thrown / dropped
    │         ▼
    │    ┌──────────┐
    │    │ AIRBORNE │  ← Projectile Physics
    │    └────┬─────┘
    │         │ land
    │         ▼
    │    ┌──────────┐
    │    │ STUNNED  │ (2s) ── hit_wall → DEAD
    └────┤          │
         └────┬─────┘
              │ recover
              ▼
         ┌──────────┐
         │ ON_FIRE  │ → DEAD (3s)   ← โดน Fire Spell
         │ FROZEN   │ → WANDER (5s) ← โดน Ice Spell (ถ้ามี)
         │ ZAPPED   │ → DEAD (0.5s) ← โดน Lightning Spell
         └──────────┘
```

### 4.2 NPC Data Structure
```js
{
  id: 'npc_001',
  type: 'villager',            // villager | elder | child
  pos: { wx: 5, wy: 3, wz: 0 },
  vel: { x: 0, y: 0, z: 0 },  // velocity (world units/s)
  state: 'WANDER',
  health: 100,
  maxHealth: 100,

  // Wander AI
  target: { wx: 7, wy: 4 },
  wanderTimer: 3.0,            // วินาทีก่อนเปลี่ยนทิศ
  speed: 1.5,                  // world units/s

  // Physics (ใช้ตอน AIRBORNE)
  gravity: 9.8,
  onGround: true,
  bounceFactor: 0.3,

  // Visual
  sprite: 'villager_a',        // sprite sheet key
  frame: 0,
  facing: 'SE',                // N, NE, E, SE, S, SW, W, NW
  animTimer: 0,

  // Status
  statusEffects: [],           // [{ type: 'BURNING', timer: 3.0 }]
  isMortal: true,
  isDead: false,

  // Reaction
  panicLevel: 0,               // 0–100
  lastDamageSource: null,
}
```

### 4.3 NPC Visual Sprites (Canvas Drawn)
ใช้ Canvas API วาด Pixel-art Style ไม่ต้องโหลด Image ภายนอก

```
Body:  10×20px isometric figure
├── Head:   6×6px circle (flesh color)
├── Body:   6×10px rectangle (outfit color)
├── Arms:   2×6px each side
└── Legs:   2×8px (animate walk cycle)

Walk Cycle: 4 frames @ 8fps
Idle:       2 frames breathing @ 1fps
Grabbed:    arms flail, 6 frames @ 12fps
Dead:       splatter → flat body
```

---

## 5. Hand of God System

### 5.1 Cursor States
| State        | Visual                        | Trigger                    |
|--------------|-------------------------------|----------------------------|
| HOVER        | มือเปล่า แบบฝ่ามือออก          | Default                    |
| HOVER_NPC    | มือกำ แต่ยังไม่หยิบ + Glow    | เมาส์อยู่เหนือ NPC           |
| GRAB         | มือกำ + NPC ห้อยอยู่           | Click NPC                  |
| CAST_READY   | มือเปล่า + Spell Aura สี       | เลือก Spell แล้ว            |
| CAST_HOLD    | มือชี้ + Charging Animation   | กดค้าง Charge              |
| THROW        | มือปา + Arc Preview           | ลาก NPC แล้วปล่อย           |

### 5.2 Grab Physics
```
เมื่อ Click NPC:
  npc.state = GRABBED
  npc.vel = {0,0,0}
  hand.holding = npc

เมื่อลาก (mousemove):
  npc.screenPos = mousePos + offset(0, -40px)  ← ออฟเซ็ตไม่ให้บังมือ
  npc.wz = interpolate(0 → 2, 0.3s)            ← ลอยขึ้น

เมื่อปล่อย (mouseup):
  throwVelocity = (mousePos - prevMousePos) * THROW_FACTOR
  npc.vel.x = throwVelocity.x * cos(isoAngle)
  npc.vel.y = throwVelocity.y * sin(isoAngle)
  npc.vel.z = |throwVelocity| * 0.5            ← ขึ้นไปก่อน
  npc.state = AIRBORNE
  hand.holding = null
```

### 5.3 Throw Arc Preview
```js
// แสดง Dotted Arc เมื่อ Hold NPC ค้าง > 0.3s
function previewArc(startPos, velocity, steps = 20) {
  const points = [];
  let pos = {...startPos};
  let vel = {...velocity};
  for (let i = 0; i < steps; i++) {
    pos.x += vel.x * 0.1;
    pos.y += vel.y * 0.1;
    pos.z += vel.z * 0.1;
    vel.z -= GRAVITY * 0.1;
    points.push(worldToScreen(pos.x, pos.y, pos.z));
  }
  return points; // วาดเป็น Dashed Line บน Canvas
}
```

### 5.4 Airborne Physics
```js
function updateAirborne(npc, dt) {
  // Apply gravity
  npc.vel.z -= GRAVITY * dt;

  // Move
  npc.pos.x += npc.vel.x * dt;
  npc.pos.y += npc.vel.y * dt;
  npc.pos.z += npc.vel.z * dt;

  // Ground check
  if (npc.pos.z <= 0) {
    npc.pos.z = 0;

    // Bounce ถ้า velocity สูงพอ
    if (Math.abs(npc.vel.z) > 2) {
      npc.vel.z *= -BOUNCE_FACTOR;    // 0.3
      npc.vel.x *= FRICTION;          // 0.7
      npc.vel.y *= FRICTION;
      spawnDustParticles(npc.pos);
      playSound('thud');
    } else {
      // Land
      npc.vel = {x:0, y:0, z:0};
      const damage = calculateFallDamage(npc.maxFallVelocity);
      applyDamage(npc, damage);
      npc.state = damage >= 100 ? 'DEAD' : 'STUNNED';
    }
  }
}
```

---

## 6. Spell System

### 6.1 Spell List
| ID         | Name       | Icon | Color          | AOE   | Effect                              |
|------------|------------|------|----------------|-------|-------------------------------------|
| FIREBALL   | Fireball   | 🔥   | #FF4500        | 80px  | Burning 3s → DEAD, ไฟลาม           |
| LIGHTNING  | Lightning  | ⚡   | #FFD700        | Chain | DEAD ทันที, Chain ถึง 3 คน          |
| WIND       | Wind Blast | 💨   | #87CEEB        | 120px | Knockback แรง, ไม่ตาย              |
| METEOR     | Meteor     | ☄️   | #FF6347        | 150px | Crater + Mass Kill                  |
| FREEZE     | Ice        | ❄️   | #00BFFF        | 60px  | Freeze 5s, ชนอะไรแตกทันที          |
| DARKNESS   | Dark Void  | 🌑   | #2D0055        | 50px  | Teleport NPC ไปตำแหน่งสุ่ม         |

### 6.2 Spell Projectile Data
```js
{
  FIREBALL: {
    speed: 300,           // px/s screen space
    gravity: 50,          // ตกเล็กน้อยระหว่างเดินทาง
    radius: 80,           // AOE px
    lifetime: 5.0,        // s ก่อนหายไปเอง
    color: '#FF4500',
    glowColor: '#FF8C00',
    trailLength: 12,      // จำนวน trail particles
    onHit: 'explode_fire',
  },
  LIGHTNING: {
    speed: Infinity,      // Instant
    chainRange: 120,      // px หา target ถัดไป
    chainCount: 3,
    color: '#FFD700',
    onHit: 'zap_chain',
  },
  WIND: {
    speed: 400,
    radius: 120,
    knockbackForce: 800,
    color: '#87CEEB',
    onHit: 'blow_away',
  }
}
```

### 6.3 Spell Cast Flow
```
1. ผู้เล่นคลิก Spell Icon ใน SpellBar
   → selectedSpell = 'FIREBALL'
   → cursor เปลี่ยนเป็น CAST_READY

2. คลิกบน Canvas
   → ถ้า Click NPC โดยตรง → Apply Effect ทันที (Direct Cast)
   → ถ้า Click พื้น         → Spawn Projectile มาจากมือ → บินไปตำแหน่ง

3. Projectile Update:
   → เคลื่อนที่ตาม velocity + gravity
   → เมื่อชน NPC หรือพื้น → triggerHitEffect()

4. Hit Effect:
   → spawnParticles(type, pos, count)
   → applyStatusEffect(npc, type)
   → playSound(hitSound)
   → screenShake(intensity)  ← สำหรับ Meteor
```

---

## 7. Particle System

### 7.1 Particle Types
| Type       | Color             | Count | Lifetime | Behavior                           |
|------------|-------------------|-------|----------|------------------------------------|
| BLOOD      | #CC0000, #880000  | 20–40 | 1.5s     | Arc ออก, Splat บนพื้น, ค้างอยู่   |
| FIRE       | #FF4500, #FFD700  | 15    | 0.8s     | ลอยขึ้น, Fade out                  |
| SMOKE      | #444444, #666666  | 10    | 2.0s     | ลอยขึ้นช้า, ขยาย                  |
| SPARK      | #FFD700, #FFFFFF  | 30    | 0.4s     | กระจาย, Gravity                   |
| DUST       | #C8A96E           | 8     | 0.6s     | Puff ออกด้านข้าง                  |
| ASH        | #555555           | 5     | 3.0s     | ลอยขึ้นช้ามาก                     |
| GIBLETS    | #CC0000, #8B0000  | 6     | 2.0s     | ชิ้นส่วนร่าง Arc กระจาย           |

### 7.2 Blood Splatter Logic
```js
function spawnBloodSplatter(pos, velocity, intensity) {
  const count = Math.floor(intensity * 30) + 10;  // 10–40 particles

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * intensity * 200 + 50;
    const size  = Math.random() * 3 + 1;

    particles.push({
      type: 'BLOOD',
      pos: {...pos},
      vel: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed * 0.5,  // isometric flatten
        z: Math.random() * speed * 0.8,     // ขึ้นก่อนตก
      },
      color: Math.random() > 0.5 ? '#CC0000' : '#880000',
      size,
      lifetime: 1.5,
      timer: 0,
      onGround: false,
      // เมื่อถึงพื้น → flatten เป็น Splat decal
    });
  }

  // Spawn Decal (stain บนพื้น, ค้างอยู่ตลอด session)
  bloodDecals.push({ pos: {...pos}, size: intensity * 20 + 10, opacity: 0.8 });
}
```

### 7.3 Death Animation
```
Frame 0–3 (0.0–0.2s): NPC ยังเคลื่อนที่ปกติ
Frame 4   (0.2s)     : HIT FLASH — ขาวทั้งตัว 1 frame
Frame 5–8 (0.2–0.5s) : Ragdoll เริ่ม — แขนขาแยก
Frame 9   (0.5s)     : EXPLODE — Giblets + Blood กระจาย
Frame 10+ (0.5s+)    : Decal (เลือดบนพื้น) + Ash particles

เสียง:
  0.0s → impact_flesh.ogg  (Web Audio API Synth)
  0.2s → squish.ogg
  0.5s → splat.ogg
```

---

## 8. UI / HUD Design

### 8.1 Layout
```
┌────────────────────────────────────────────────────┐
│                                                    │
│              ISOMETRIC WORLD (Canvas)              │
│                                                    │
│                                                    │
│  [👁 47 Villagers]    [☠ 3 Dead]    [⏱ 02:34]    │  ← HUD Top (DOM)
│                                                    │
│                                                    │
└────────────────────────────────────────────────────┘
│ ╔══════════════════════════════════════════════╗  │
│ ║  [✋Hand] [🔥Fire] [⚡Light] [💨Wind] [☄️Meteor] ║  │  ← SpellBar Bottom
│ ╚══════════════════════════════════════════════╝  │
└────────────────────────────────────────────────────┘
```

### 8.2 SpellBar Component (HTML/CSS)
```html
<div id="spellbar">
  <div class="spell-slot active" data-spell="HAND" title="Hand of God">
    <div class="spell-icon">✋</div>
    <div class="spell-name">Hand</div>
    <div class="spell-key">1</div>
  </div>
  <div class="spell-slot" data-spell="FIREBALL" title="Fireball">
    <div class="spell-icon">🔥</div>
    <div class="spell-name">Fire</div>
    <div class="spell-key">2</div>
    <div class="spell-charge-ring"></div>  ← CSS animation วงกลม
  </div>
  <!-- ... -->
</div>
```

### 8.3 SpellBar CSS
```css
#spellbar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  padding: 12px 20px 20px;
  background: linear-gradient(to top, rgba(0,0,0,0.85), transparent);
  border-radius: 20px 20px 0 0;
  backdrop-filter: blur(8px);
}

.spell-slot {
  width: 72px;
  height: 72px;
  border: 2px solid rgba(255,255,255,0.2);
  border-radius: 12px;
  background: rgba(20,10,5,0.7);
  cursor: pointer;
  transition: transform 0.1s, border-color 0.2s;
  position: relative;
  overflow: hidden;
}

.spell-slot:hover      { transform: translateY(-4px); border-color: rgba(255,255,255,0.5); }
.spell-slot.active     { border-color: var(--spell-color); box-shadow: 0 0 20px var(--spell-color); }
.spell-slot[data-spell="FIREBALL"]  { --spell-color: #FF4500; }
.spell-slot[data-spell="LIGHTNING"] { --spell-color: #FFD700; }
.spell-slot[data-spell="WIND"]      { --spell-color: #87CEEB; }
.spell-slot[data-spell="METEOR"]    { --spell-color: #FF6347; }

/* Charge Ring */
.spell-charge-ring {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  border: 3px solid transparent;
  animation: none;
}
.spell-slot.charging .spell-charge-ring {
  animation: chargeRing 1.0s linear forwards;
  border-color: var(--spell-color);
}
@keyframes chargeRing {
  from { clip-path: inset(0 100% 0 0); }
  to   { clip-path: inset(0 0% 0 0); }
}
```

### 8.4 Tooltip / Feedback
```
เมื่อ Hover NPC:
  → แสดง Name + Health Bar เหนือหัว (Canvas Draw)
  → Glow รอบตัว (Canvas Shadow)

เมื่อ Spell Hit:
  → Floating Damage Text ลอยขึ้น (-100 ⚡ , DEAD ☠)
  → Screen Shake ตาม intensity

เมื่อ Kill:
  → Kill Counter +1 (animate bump)
  → Random Dark Humor Message ใน corner
    เช่น "Villager Bob has left the mortal realm."
```

---

## 9. Audio Design (Web Audio API Synthesized)

ไม่ใช้ไฟล์เสียงภายนอก — ใช้ Web Audio API สร้างเสียงทุกอย่าง

```js
const AudioSynth = {
  // เสียงไฟลูกไฟ
  fireball_whoosh: () => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.5);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.5);
  },

  // เสียงสายฟ้า
  lightning_crack: () => {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  },

  // เสียง Splat
  splat: () => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
    // + Noise layer
    // ...
  }
};
```

---

## 10. Performance Optimization Plan

### 10.1 Rendering
- **Dirty Rectangle:** วาดใหม่เฉพาะ Region ที่มี Entity เคลื่อนที่
- **Sprite Cache:** Pre-render NPC Frames ลง OffscreenCanvas ครั้งเดียว
- **Depth Sort:** Sort Entity ด้วย `(wx + wy)` ก่อน render ทุก Frame
- **Particle Pool:** Pre-allocate 500 Particle Objects ไม่ `new` ระหว่าง Runtime

### 10.2 Physics
- **Spatial Grid:** แบ่ง World เป็น Grid 4×4 สำหรับ Collision Broadphase
- **Sleep System:** NPC ที่ IDLE นาน > 5s ข้าม Physics Update
- **Max Entities:** Cap NPC ที่ 60 ตัว, Particle ที่ 500 ชิ้น

### 10.3 Target Performance
| Metric         | Target     |
|----------------|------------|
| Frame Rate     | 60 FPS     |
| NPC Count      | 30–60 ตัว  |
| Particle Peak  | 500        |
| Memory         | < 100 MB   |
| Load Time      | < 1s (ไม่มี Asset โหลด) |

---

## 11. File Structure

```
hand-of-god/
├── index.html              ← Entry point, Canvas + UI Shell
├── style.css               ← HUD, SpellBar, Cursor styles
└── game.js                 ← All game logic (single file)
      ├── CONFIG             — Constants ทั้งหมด
      ├── IsometricRenderer  — Projection + Draw functions
      ├── TileMap            — World data + Tile rendering
      ├── NPC                — Class: Entity, AI, Physics
      ├── HandSystem         — Grab, Throw, Cursor
      ├── SpellSystem        — Projectile, AOE, Effects
      ├── ParticleSystem     — Pool, Update, Render
      ├── AudioSynth         — Web Audio API sounds
      ├── UIManager          — HUD updates, SpellBar events
      └── GameLoop           — requestAnimationFrame, deltaTime
```

---

## 12. Implementation Phases

### Phase 1 — Foundation (Core Loop)
- [ ] Canvas setup + Isometric tile rendering
- [ ] NPC spawn + Wander AI
- [ ] Hand cursor + Grab/Drop mechanic
- [ ] Basic throw physics + ground collision

### Phase 2 — Spells
- [ ] SpellBar UI (HTML/CSS)
- [ ] Fireball projectile + explosion
- [ ] Lightning instant cast + chain
- [ ] Wind knockback

### Phase 3 — Juice & Polish
- [ ] Particle system (Blood, Fire, Spark)
- [ ] Death animation + Giblets
- [ ] Screen shake
- [ ] Web Audio synth sounds
- [ ] Blood decals on ground

### Phase 4 — World
- [ ] House structures (Isometric 3D look)
- [ ] Trees + Shadows
- [ ] More NPC types (Elder, Child)
- [ ] Meteor spell + Crater

---

## 13. Open Design Questions

1. **Villager Respawn?** — มี Spawn ใหม่ทุก 30s ไหม หรือ Session จบเมื่อตายหมด?
2. **Scoring System?** — มี Score ไหม หรือ Pure Sandbox?
3. **Day/Night Cycle?** — เปลี่ยน Lighting ตามเวลาจริงหรือ Timer?
4. **NPC Relationships?** — ชาวบ้านวิ่งไปหา/ช่วยกันได้ไหม?
5. **God Power Meter?** — Spell มี Cooldown หรือ Mana?

---

*Document Owner: System Architect | Next Step: Phase 1 Implementation*
