// Hand of God — Phase 4 Round A (World basics + death stages + Meteor)
// Phase 1: Canvas + isometric tiles, NPC wander, hand grab/drop, throw physics.
// Phase 2: SpellBar UI, Fireball / Lightning / Wind, ON_FIRE + DEAD states.
// Phase 3: Blood splatter, hit flash, unified death animation, blood decals,
//          screen shake, fall death, splat sound. Critical (20%) dismemberment.
//          Respawn 1s/NPC, NPC count slider, info panel, hover ring.
// Phase 4 Round A:
//   - Buildings 2x2 random non-clustered, max 60% area
//   - Trees ringed at outer edges
//   - 2-stage death: critical (20%) explodes / non-critical leaves CORPSE (fade 30s)
//   - Meteor spell + crater decal pattern

const CONFIG = {
  TILE_W: 64,
  TILE_H: 32,
  ELEV_H: 48,
  MAP_SIZE: 30,
  WORLD_PAN_EXTRA: 5,  // pannable void around the grass (each side); total world = MAP_SIZE + 2*EXTRA
  NPC_COUNT: 15,
  GRAVITY: 18,
  BOUNCE_FACTOR: 0.35,
  FRICTION: 0.7,
  STUN_DURATION: 2.0,
  GRAB_LIFT: 2.0,
  GRAB_LIFT_RATE: 12,
  HAND_BODY_OFFSET: 30,
  THROW_HISTORY_MS: 100,
  MAX_THROW_SPEED: 14,

  // Spells
  FIREBALL_SPEED: 9,
  FIREBALL_AOE: 2.5,
  FIRE_BURN_DURATION: 3.0,
  LIGHTNING_RANGE: 6,
  LIGHTNING_CHAIN_RANGE: 4,
  LIGHTNING_CHAIN_COUNT: 3,
  LIGHTNING_BOLT_LIFETIME: 0.25,
  WIND_AOE: 4,
  WIND_FORCE: 14,
  METEOR_AOE: 3.0,
  METEOR_FALL_DURATION: 0.55,
  METEOR_HEIGHT: 12,
  NECROMANCER_RADIUS: 2.5,

  // Death / juice
  DEATH_FLASH_DURATION: 0.08,
  FALL_DEATH_THRESHOLD: 10,
  SHAKE_DECAY: 0.3,
  DECAL_MAX: 200,
  CRITICAL_CHANCE: 0.20,
  RESPAWN_INTERVAL: 1.0,
  CORPSE_DURATION: 30.0,

  // World
  BUILDING_TARGET: 15,
  BUILDING_SIZE: 2,
  BUILDING_WALL_HEIGHT: 0.8,    // wall height in wz units (NPC ≈ 0.5 wz, so wall ≈ 1.5x NPC)
  BUILDING_ROOF_PEAK: 0.55,     // additional peak height above wall (gabled thatch)
  BUILDING_MAX_COVERAGE: 0.3,
  BUILDING_GAP: 3,              // minimum tile gap between buildings
  TREE_COUNT: 25,
  TREE_BORDER_WIDTH: 2.8,
};

const SPELL_COLORS = {
  HAND:        '#e8e8e8',
  FIREBALL:    '#FF4500',
  LIGHTNING:   '#FFD700',
  WIND:        '#87CEEB',
  METEOR:      '#FF6347',
  NECROMANCER: '#8B3FBF',
};

// Medieval cottage palettes: plaster walls + dark timber beams + thatched roof
const BUILDING_PALETTES = [
  { wall: '#d4c08e', wallSide: '#b8a575', beam: '#3a2818', roof: '#a07e35', roofShadow: '#7a5e22' },
  { wall: '#c8a070', wallSide: '#a8855a', beam: '#4a3020', roof: '#946d28', roofShadow: '#6a4a18' },
  { wall: '#e0d0a0', wallSide: '#c4b58c', beam: '#2a1810', roof: '#b8923f', roofShadow: '#8b6c2c' },
];

const state = {
  canvas: null,
  ctx: null,
  dpr: 1,
  width: 0,
  height: 0,
  originX: 0,
  originY: 0,
  tiles: [],
  buildings: [],
  trees: [],
  npcs: [],
  particles: [],
  projectiles: [],
  lightningBolts: [],
  bloodDecals: [],
  craterDecals: [],
  necroCasts: [],
  shake: { intensity: 0, timer: 0, duration: CONFIG.SHAKE_DECAY },
  targetCount: 15,
  totalDeaths: 0,
  respawnTimer: 0,
  selectedSpell: 'HAND',
  hand: {
    pos: { x: 0, y: 0 },
    visible: false,
    holding: null,
    history: [],
  },
  pan: { active: false, lastX: 0, lastY: 0 },
  filters: null, // populated in init() once CLASSES/RACES/etc are defined
  music: { started: false, muted: false, gain: null, loopStart: 0, timer: null },
  lastTime: 0,
};

function pickFiltered(allList, filterSet) {
  if (!filterSet || filterSet.size === 0) return allList[Math.floor(Math.random() * allList.length)];
  const allowed = allList.filter(x => filterSet.has(x));
  const pool = allowed.length > 0 ? allowed : allList;
  return pool[Math.floor(Math.random() * pool.length)];
}

function clampOrigin() {
  // pannable world extends EXTRA tiles into the void on every side of the
  // grass, so the camera center can roam world coords [-E, N+E] in both axes.
  const N = CONFIG.MAP_SIZE;
  const E = CONFIG.WORLD_PAN_EXTRA;
  const halfW = state.width / 2;
  const halfH = state.height / 2;
  const minX = halfW - (N + 2 * E) * CONFIG.TILE_W / 2;
  const maxX = halfW + (N + 2 * E) * CONFIG.TILE_W / 2;
  const minY = halfH - (N + E) * CONFIG.TILE_H;
  const maxY = halfH + E * CONFIG.TILE_H;
  state.originX = Math.max(minX, Math.min(maxX, state.originX));
  state.originY = Math.max(minY, Math.min(maxY, state.originY));
}

// ---------- Isometric projection ----------
function worldToScreen(wx, wy, wz = 0) {
  return {
    sx: (wx - wy) * (CONFIG.TILE_W / 2) + state.originX,
    sy: (wx + wy) * (CONFIG.TILE_H / 2) - wz * CONFIG.ELEV_H + state.originY,
  };
}

function screenToWorld(sx, sy) {
  const dx = sx - state.originX;
  const dy = sy - state.originY;
  return {
    wx: (dx / (CONFIG.TILE_W / 2) + dy / (CONFIG.TILE_H / 2)) / 2,
    wy: (dy / (CONFIG.TILE_H / 2) - dx / (CONFIG.TILE_W / 2)) / 2,
  };
}

// ---------- Tile map ----------
function initTiles() {
  const N = CONFIG.MAP_SIZE;
  const mid = Math.floor(N / 2);
  state.tiles = [];
  for (let y = 0; y < N; y++) {
    state.tiles[y] = [];
    for (let x = 0; x < N; x++) {
      let t = 0;
      if (x === mid || y === mid) t = 1;
      state.tiles[y][x] = t;
    }
  }
}

function drawTile(x, y, type) {
  const { sx, sy } = worldToScreen(x, y, 0);
  const TW = CONFIG.TILE_W, TH = CONFIG.TILE_H;
  const ctx = state.ctx;

  ctx.beginPath();
  ctx.moveTo(sx, sy - TH / 2);
  ctx.lineTo(sx + TW / 2, sy);
  ctx.lineTo(sx, sy + TH / 2);
  ctx.lineTo(sx - TW / 2, sy);
  ctx.closePath();

  if (type === 0) {
    const shade = (x * 7 + y * 13) % 3;
    ctx.fillStyle = ['#3a6b2a', '#3d7330', '#356627'][shade];
  } else {
    ctx.fillStyle = '#8a7a5c';
  }
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function renderTiles() {
  const N = CONFIG.MAP_SIZE;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      drawTile(x, y, state.tiles[y][x]);
    }
  }
}

// ---------- Buildings ----------
function tileInsideBuilding(wx, wy, margin = 0) {
  for (const b of state.buildings) {
    if (wx >= b.wx - margin && wx < b.wx + b.w + margin &&
        wy >= b.wy - margin && wy < b.wy + b.h + margin) return true;
  }
  return false;
}

function initBuildings() {
  state.buildings = [];
  const N = CONFIG.MAP_SIZE;
  const mid = Math.floor(N / 2);
  const w = CONFIG.BUILDING_SIZE, h = CONFIG.BUILDING_SIZE;
  const totalArea = N * N;
  const maxArea = totalArea * CONFIG.BUILDING_MAX_COVERAGE;
  const areaPer = w * h;
  const limit = Math.min(CONFIG.BUILDING_TARGET, Math.floor(maxArea / areaPer));

  let attempts = 0;
  while (state.buildings.length < limit && attempts < 1500) {
    attempts++;
    const wx = 1 + Math.floor(Math.random() * (N - 2 - w));
    const wy = 1 + Math.floor(Math.random() * (N - 2 - h));

    // skip if footprint touches center cross path
    let onPath = false;
    for (let dx = 0; dx < w && !onPath; dx++) {
      for (let dy = 0; dy < h && !onPath; dy++) {
        if (wx + dx === mid || wy + dy === mid) onPath = true;
      }
    }
    if (onPath) continue;

    // require minimum gap from existing buildings
    const gap = CONFIG.BUILDING_GAP;
    let tooClose = false;
    for (const b of state.buildings) {
      if (wx + w + gap > b.wx && wx < b.wx + b.w + gap &&
          wy + h + gap > b.wy && wy < b.wy + b.h + gap) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    state.buildings.push({
      wx, wy, w, h,
      wallH: CONFIG.BUILDING_WALL_HEIGHT,
      roofPeak: CONFIG.BUILDING_ROOF_PEAK,
      palette: BUILDING_PALETTES[Math.floor(Math.random() * BUILDING_PALETTES.length)],
    });
  }
}

function drawBuilding(b) {
  const ctx = state.ctx;
  const x0 = b.wx, y0 = b.wy;
  const x1 = b.wx + b.w, y1 = b.wy + b.h;
  const cx = (x0 + x1) / 2;
  const wallH = b.wallH;
  const peakZ = wallH + b.roofPeak;

  // Ground & wall-top corners
  const bNE = worldToScreen(x1, y0, 0);
  const bSE = worldToScreen(x1, y1, 0);
  const bSW = worldToScreen(x0, y1, 0);
  const wNE = worldToScreen(x1, y0, wallH);
  const wSE = worldToScreen(x1, y1, wallH);
  const wSW = worldToScreen(x0, y1, wallH);

  // Roof ridge (runs N-S along x=cx)
  const ridgeN = worldToScreen(cx, y0, peakZ);
  const ridgeS = worldToScreen(cx, y1, peakZ);

  ctx.lineWidth = 1;

  // === South wall (front, plaster rectangle) ===
  ctx.fillStyle = b.palette.wall;
  ctx.beginPath();
  ctx.moveTo(bSW.sx, bSW.sy);
  ctx.lineTo(bSE.sx, bSE.sy);
  ctx.lineTo(wSE.sx, wSE.sy);
  ctx.lineTo(wSW.sx, wSW.sy);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.stroke();

  // Corner timber posts (south face)
  ctx.strokeStyle = b.palette.beam;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(bSW.sx, bSW.sy); ctx.lineTo(wSW.sx, wSW.sy);
  ctx.moveTo(bSE.sx, bSE.sy); ctx.lineTo(wSE.sx, wSE.sy);
  ctx.stroke();

  // Door on south wall (centered)
  const doorW = 0.5, doorH = wallH * 0.78;
  const dx0 = x0 + (b.w - doorW) / 2;
  const dx1 = dx0 + doorW;
  const dP1 = worldToScreen(dx0, y1, 0);
  const dP2 = worldToScreen(dx1, y1, 0);
  const dP3 = worldToScreen(dx1, y1, doorH);
  const dP4 = worldToScreen(dx0, y1, doorH);
  ctx.fillStyle = '#3a2515';
  ctx.beginPath();
  ctx.moveTo(dP1.sx, dP1.sy);
  ctx.lineTo(dP2.sx, dP2.sy);
  ctx.lineTo(dP3.sx, dP3.sy);
  ctx.lineTo(dP4.sx, dP4.sy);
  ctx.closePath();
  ctx.fill();
  // door arch line
  ctx.strokeStyle = b.palette.beam;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(dP4.sx, dP4.sy);
  ctx.lineTo(dP3.sx, dP3.sy);
  ctx.stroke();

  // === East wall (side, slightly darker plaster) ===
  ctx.fillStyle = b.palette.wallSide;
  ctx.beginPath();
  ctx.moveTo(bSE.sx, bSE.sy);
  ctx.lineTo(bNE.sx, bNE.sy);
  ctx.lineTo(wNE.sx, wNE.sy);
  ctx.lineTo(wSE.sx, wSE.sy);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // East NE corner post
  ctx.strokeStyle = b.palette.beam;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(bNE.sx, bNE.sy); ctx.lineTo(wNE.sx, wNE.sy);
  ctx.stroke();

  // Window on east wall with cross frame
  const winSize = 0.32;
  const winZ0 = wallH * 0.42;
  const winZ1 = winZ0 + winSize;
  const wy0 = y0 + (b.h - winSize) / 2;
  const wy1 = wy0 + winSize;
  const wP1 = worldToScreen(x1, wy0, winZ0);
  const wP2 = worldToScreen(x1, wy1, winZ0);
  const wP3 = worldToScreen(x1, wy1, winZ1);
  const wP4 = worldToScreen(x1, wy0, winZ1);
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(wP1.sx, wP1.sy);
  ctx.lineTo(wP2.sx, wP2.sy);
  ctx.lineTo(wP3.sx, wP3.sy);
  ctx.lineTo(wP4.sx, wP4.sy);
  ctx.closePath();
  ctx.fill();
  // window cross
  const wMid = winZ0 + winSize / 2;
  const wyMid = y0 + b.h / 2;
  const wm1 = worldToScreen(x1, wy0, wMid);
  const wm2 = worldToScreen(x1, wy1, wMid);
  const wm3 = worldToScreen(x1, wyMid, winZ0);
  const wm4 = worldToScreen(x1, wyMid, winZ1);
  ctx.strokeStyle = b.palette.beam;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(wm1.sx, wm1.sy); ctx.lineTo(wm2.sx, wm2.sy);
  ctx.moveTo(wm3.sx, wm3.sy); ctx.lineTo(wm4.sx, wm4.sy);
  ctx.stroke();

  // === East roof slope (rect, thatched) ===
  ctx.fillStyle = b.palette.roof;
  ctx.beginPath();
  ctx.moveTo(wNE.sx, wNE.sy);
  ctx.lineTo(wSE.sx, wSE.sy);
  ctx.lineTo(ridgeS.sx, ridgeS.sy);
  ctx.lineTo(ridgeN.sx, ridgeN.sy);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Thatch texture: lines from eaves up to ridge
  ctx.strokeStyle = b.palette.roofShadow;
  ctx.lineWidth = 1;
  const thatchN = 7;
  for (let i = 1; i < thatchN; i++) {
    const t = i / thatchN;
    const eaveX = wNE.sx + (wSE.sx - wNE.sx) * t;
    const eaveY = wNE.sy + (wSE.sy - wNE.sy) * t;
    const ridgeX = ridgeN.sx + (ridgeS.sx - ridgeN.sx) * t;
    const ridgeY = ridgeN.sy + (ridgeS.sy - ridgeN.sy) * t;
    ctx.beginPath();
    ctx.moveTo(eaveX, eaveY);
    ctx.lineTo(ridgeX, ridgeY);
    ctx.stroke();
  }
  // overhang lip at eave (slightly darker line)
  ctx.strokeStyle = b.palette.roofShadow;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(wNE.sx, wNE.sy);
  ctx.lineTo(wSE.sx, wSE.sy);
  ctx.stroke();

  // === South gable (triangular plaster above south wall) ===
  ctx.fillStyle = b.palette.wall;
  ctx.beginPath();
  ctx.moveTo(wSW.sx, wSW.sy);
  ctx.lineTo(wSE.sx, wSE.sy);
  ctx.lineTo(ridgeS.sx, ridgeS.sy);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Gable diagonal trim beams (decorative)
  ctx.strokeStyle = b.palette.beam;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(wSW.sx, wSW.sy);
  ctx.lineTo(ridgeS.sx, ridgeS.sy);
  ctx.lineTo(wSE.sx, wSE.sy);
  ctx.stroke();
}

// ---------- Trees ----------
function initTrees() {
  state.trees = [];
  const N = CONFIG.MAP_SIZE;
  const mid = Math.floor(N / 2);
  const border = CONFIG.TREE_BORDER_WIDTH;

  let attempts = 0;
  while (state.trees.length < CONFIG.TREE_COUNT && attempts < 1500) {
    attempts++;
    const wx = 0.3 + Math.random() * (N - 0.6);
    const wy = 0.3 + Math.random() * (N - 0.6);

    // outer ring only
    const distFromBorder = Math.min(wx, wy, N - wx, N - wy);
    if (distFromBorder > border) continue;

    // skip on path
    if (Math.abs(wx - mid) < 0.7 || Math.abs(wy - mid) < 0.7) continue;

    // skip near buildings
    if (tileInsideBuilding(wx, wy, 0.5)) continue;

    // spacing
    let tooClose = false;
    for (const t of state.trees) {
      if (Math.hypot(t.wx - wx, t.wy - wy) < 0.7) { tooClose = true; break; }
    }
    if (tooClose) continue;

    state.trees.push({ wx, wy, size: 0.85 + Math.random() * 0.3 });
  }
}

function drawTree(t) {
  const ctx = state.ctx;
  const { sx, sy } = worldToScreen(t.wx, t.wy, 0);
  const s = t.size;

  // trunk
  ctx.fillStyle = '#5a3a20';
  ctx.fillRect(sx - 2 * s, sy - 8 * s, 4 * s, 8 * s);

  // foliage layered
  ctx.fillStyle = '#1a4515';
  ctx.beginPath();
  ctx.moveTo(sx, sy - 30 * s);
  ctx.lineTo(sx - 11 * s, sy - 8 * s);
  ctx.lineTo(sx + 11 * s, sy - 8 * s);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#2a6020';
  ctx.beginPath();
  ctx.moveTo(sx + s, sy - 26 * s);
  ctx.lineTo(sx - 7 * s, sy - 11 * s);
  ctx.lineTo(sx + 8 * s, sy - 11 * s);
  ctx.closePath();
  ctx.fill();
}

// ---------- NPC ----------
const CLASSES  = ['warrior', 'wizard', 'ranger', 'priest'];
const RACES    = ['human', 'elf', 'dwarf'];
const GENDERS  = ['male', 'female'];
const AGES     = ['middle_age', 'elder'];
const CLASS_COLORS = {
  warrior: '#8B2020',
  wizard:  '#4B2080',
  ranger:  '#2D6B2D',
  priest:  '#C0A860',
};
const CLASS_SPEED = { warrior: 1.10, wizard: 0.85, ranger: 1.25, priest: 1.00 };
const AGE_SPEED   = { middle_age: 1.00, elder: 0.75 };

function makeNPC(wx, wy) {
  const f = state.filters || {};
  const npcClass = pickFiltered(CLASSES, f.classes);
  const race     = pickFiltered(RACES,   f.races);
  const gender   = pickFiltered(GENDERS, f.genders);
  const age      = pickFiltered(AGES,    f.ages);
  const baseSpeed = 1.1 + Math.random() * 0.6;
  return {
    pos: { wx, wy, wz: 0 },
    vel: { x: 0, y: 0, z: 0 },
    state: 'IDLE',
    target: { wx, wy },
    timer: Math.random() * 2,
    speed: baseSpeed * CLASS_SPEED[npcClass] * AGE_SPEED[age],
    npcClass, race, gender, age,
    get color() { return CLASS_COLORS[this.npcClass]; },
    walkPhase: Math.random() * Math.PI * 2,
    stunTimer: 0,
    fireTimer: 0,
    firePartTimer: 0,
    flashTimer: 0,
    deathIntensity: 1.0,
    corpseTimer: 0,
    maxFallSpeed: 0,
    isZombieType: false,
    justRespawned: false,
    healUsed: false,
  };
}

function pickFreePosition() {
  const N = CONFIG.MAP_SIZE;
  let wx = N / 2, wy = N / 2;
  for (let attempts = 0; attempts < 30; attempts++) {
    wx = 2 + Math.random() * (N - 4);
    wy = 2 + Math.random() * (N - 4);
    if (!tileInsideBuilding(wx, wy, 0.2)) return { wx, wy };
  }
  return { wx, wy };
}

function spawnNPCs() {
  state.npcs = [];
  for (let i = 0; i < state.targetCount; i++) {
    const { wx, wy } = pickFreePosition();
    state.npcs.push(makeNPC(wx, wy));
  }
}

function pickDoorPosition() {
  if (state.buildings.length > 0) {
    const b = state.buildings[Math.floor(Math.random() * state.buildings.length)];
    // south door: centered on south face, one step outside the footprint
    return { wx: b.wx + b.w / 2, wy: b.wy + b.h + 0.4 };
  }
  return pickFreePosition();
}

function respawnOne() {
  const { wx, wy } = pickDoorPosition();
  const newNPC = makeNPC(wx, wy);
  newNPC.state = 'WANDER';
  newNPC.justRespawned = true;
  pickWanderTarget(newNPC);
  for (let i = 0; i < state.npcs.length; i++) {
    if (state.npcs[i].state === 'DEAD') {
      state.npcs[i] = newNPC;
      return;
    }
  }
  state.npcs.push(newNPC);
}

function updateRespawn(dt) {
  let alive = 0;
  for (const n of state.npcs) {
    if (n.state !== 'DEAD' && n.state !== 'CORPSE' && n.state !== 'ZOMBIE') alive++;
  }
  if (alive < state.targetCount) {
    state.respawnTimer += dt;
    if (state.respawnTimer >= CONFIG.RESPAWN_INTERVAL) {
      state.respawnTimer = 0;
      respawnOne();
    }
  } else {
    state.respawnTimer = 0;
  }
}

function pickWanderTarget(npc) {
  const N = CONFIG.MAP_SIZE;
  const minD = npc.npcClass === 'ranger' ? 5.0 : 1.5;
  const maxD = npc.npcClass === 'ranger' ? 9.0 : 5.5;
  for (let i = 0; i < 16; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = minD + Math.random() * (maxD - minD);
    const nx = npc.pos.wx + Math.cos(angle) * dist;
    const ny = npc.pos.wy + Math.sin(angle) * dist;
    if (nx >= 1 && nx <= N - 1 && ny >= 1 && ny <= N - 1 &&
        !tileInsideBuilding(nx, ny, 1.0)) {
      npc.target.wx = nx;
      npc.target.wy = ny;
      return;
    }
  }
  npc.target.wx = N / 2;
  npc.target.wy = N / 2;
}

function findNearestState(npc, targetState, maxDist) {
  let best = null, bestD = maxDist;
  for (const o of state.npcs) {
    if (o === npc || o.state !== targetState) continue;
    const d = Math.hypot(o.pos.wx - npc.pos.wx, o.pos.wy - npc.pos.wy);
    if (d < bestD) { bestD = d; best = o; }
  }
  return best;
}

function handleSignatureBehavior(npc, dt) {
  if (npc.npcClass === 'warrior') {
    const z = findNearestState(npc, 'ZOMBIE', 3.0);
    if (z) {
      const dx = z.pos.wx - npc.pos.wx, dy = z.pos.wy - npc.pos.wy;
      const d = Math.hypot(dx, dy);
      if (d < 0.35) { kill(z); return true; }
      npc.pos.wx += (dx / d) * npc.speed * 1.4 * dt;
      npc.pos.wy += (dy / d) * npc.speed * 1.4 * dt;
      npc.walkPhase += dt * 12;
      npc.state = 'WANDER';
      return true;
    }
  }
  if (npc.npcClass === 'priest' && !npc.healUsed) {
    const f = findNearestState(npc, 'ON_FIRE', 4.0);
    if (f) {
      const dx = f.pos.wx - npc.pos.wx, dy = f.pos.wy - npc.pos.wy;
      const d = Math.hypot(dx, dy);
      if (d < 0.4) {
        f.state = 'WANDER';
        f.fireTimer = 0;
        f.justRespawned = true;
        pickWanderTarget(f);
        npc.healUsed = true;
        spawnSoulParticles(f.pos);
        return true;
      }
      npc.pos.wx += (dx / d) * npc.speed * dt;
      npc.pos.wy += (dy / d) * npc.speed * dt;
      npc.walkPhase += dt * 8;
      npc.state = 'WANDER';
      return true;
    }
  }
  return false;
}

function updateNPC(npc, dt) {
  switch (npc.state) {
    case 'IDLE':
      if (handleSignatureBehavior(npc, dt)) break;
      npc.timer -= dt;
      if (npc.timer <= 0) {
        pickWanderTarget(npc);
        npc.state = 'WANDER';
      }
      break;

    case 'WANDER': {
      if (handleSignatureBehavior(npc, dt)) break;
      const dx = npc.target.wx - npc.pos.wx;
      const dy = npc.target.wy - npc.pos.wy;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.15) {
        npc.state = 'IDLE';
        npc.timer = 1 + Math.random() * 2;
      } else {
        const stepX = (dx / dist) * npc.speed * dt;
        const stepY = (dy / dist) * npc.speed * dt;
        const nextX = npc.pos.wx + stepX;
        const nextY = npc.pos.wy + stepY;
        if (npc.justRespawned) {
          npc.pos.wx = nextX;
          npc.pos.wy = nextY;
          npc.walkPhase += dt * 8;
          if (!tileInsideBuilding(npc.pos.wx, npc.pos.wy, 1.0)) {
            npc.justRespawned = false;
          }
        } else if (tileInsideBuilding(nextX, nextY, 1.0)) {
          // would enter house buffer — pick a new target
          pickWanderTarget(npc);
        } else {
          npc.pos.wx = nextX;
          npc.pos.wy = nextY;
          npc.walkPhase += dt * 8;
        }
      }
      break;
    }

    case 'GRABBED':
      break;

    case 'AIRBORNE': {
      npc.vel.z -= CONFIG.GRAVITY * dt;
      npc.pos.wx += npc.vel.x * dt;
      npc.pos.wy += npc.vel.y * dt;
      npc.pos.wz += npc.vel.z * dt;
      if (-npc.vel.z > npc.maxFallSpeed) npc.maxFallSpeed = -npc.vel.z;

      const N = CONFIG.MAP_SIZE;
      if (npc.pos.wx < 0)  { npc.pos.wx = 0;  npc.vel.x *= -CONFIG.BOUNCE_FACTOR; }
      if (npc.pos.wx > N)  { npc.pos.wx = N;  npc.vel.x *= -CONFIG.BOUNCE_FACTOR; }
      if (npc.pos.wy < 0)  { npc.pos.wy = 0;  npc.vel.y *= -CONFIG.BOUNCE_FACTOR; }
      if (npc.pos.wy > N)  { npc.pos.wy = N;  npc.vel.y *= -CONFIG.BOUNCE_FACTOR; }

      if (npc.pos.wz <= 0) {
        npc.pos.wz = 0;
        const impactZ = Math.abs(npc.vel.z);
        const intensity = Math.min(1, npc.maxFallSpeed / 8);

        if (impactZ > CONFIG.FALL_DEATH_THRESHOLD) {
          const lethal = Math.min(1.6, impactZ / 10);
          spawnDust(npc.pos, intensity);
          playThud(intensity);
          kill(npc, lethal);
        } else if (impactZ > 2.5) {
          npc.vel.z *= -CONFIG.BOUNCE_FACTOR;
          npc.vel.x *= CONFIG.FRICTION;
          npc.vel.y *= CONFIG.FRICTION;
          spawnDust(npc.pos, intensity);
          playThud(intensity);
        } else {
          npc.vel.x = 0; npc.vel.y = 0; npc.vel.z = 0;
          spawnDust(npc.pos, intensity);
          playThud(intensity);
          npc.state = 'STUNNED';
          npc.stunTimer = CONFIG.STUN_DURATION;
          npc.maxFallSpeed = 0;
        }
      }
      break;
    }

    case 'STUNNED':
      npc.stunTimer -= dt;
      if (npc.stunTimer <= 0) {
        npc.state = 'IDLE';
        npc.timer = 0.5;
      }
      break;

    case 'ON_FIRE': {
      npc.fireTimer -= dt;
      npc.firePartTimer += dt;
      if (npc.firePartTimer >= 0.05) {
        npc.firePartTimer = 0;
        spawnFireParticle(npc.pos);
      }
      if (npc.fireTimer <= 0) { kill(npc); break; }

      // flee: pick new flee target every ~1.5s or when reached
      npc.fleeTimer = (npc.fleeTimer || 0) - dt;
      const N = CONFIG.MAP_SIZE;
      if (npc.fleeTimer <= 0 || Math.hypot(npc.target.wx - npc.pos.wx, npc.target.wy - npc.pos.wy) < 0.3) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 3 + Math.random() * 4;
        npc.target.wx = Math.max(1, Math.min(N - 1, npc.pos.wx + Math.cos(ang) * dist));
        npc.target.wy = Math.max(1, Math.min(N - 1, npc.pos.wy + Math.sin(ang) * dist));
        npc.fleeTimer = 1.5;
      }
      const fdx = npc.target.wx - npc.pos.wx;
      const fdy = npc.target.wy - npc.pos.wy;
      const fd = Math.hypot(fdx, fdy);
      if (fd > 0.01) {
        npc.pos.wx += (fdx / fd) * npc.speed * 1.6 * dt;
        npc.pos.wy += (fdy / fd) * npc.speed * 1.6 * dt;
        npc.walkPhase += dt * 10;
      }

      // fire spread on contact
      for (const other of state.npcs) {
        if (other === npc || other.state === 'ON_FIRE' || !isAlive(other)) continue;
        if (Math.hypot(other.pos.wx - npc.pos.wx, other.pos.wy - npc.pos.wy) < 0.45) {
          if (Math.random() < 0.60) ignite(other);
        }
      }
      break;
    }

    case 'DYING':
      npc.flashTimer -= dt;
      if (npc.flashTimer <= 0) explodeBody(npc);
      break;

    case 'CORPSE':
      npc.corpseTimer -= dt;
      if (npc.corpseTimer <= 0) npc.state = 'DEAD';
      break;

    case 'ZOMBIE': {
      let nearestAlive = null, nearestD = Infinity;
      for (const n of state.npcs) {
        if (n === npc || n.state === 'ZOMBIE' || n.state === 'DEAD' ||
            n.state === 'DYING' || n.state === 'CORPSE') continue;
        const d = Math.hypot(n.pos.wx - npc.pos.wx, n.pos.wy - npc.pos.wy);
        if (d < nearestD) { nearestD = d; nearestAlive = n; }
      }
      if (nearestAlive) {
        const dx = nearestAlive.pos.wx - npc.pos.wx;
        const dy = nearestAlive.pos.wy - npc.pos.wy;
        if (nearestD < 0.35) {
          kill(nearestAlive, 0.5);
        } else {
          npc.pos.wx += (dx / nearestD) * npc.speed * dt;
          npc.pos.wy += (dy / nearestD) * npc.speed * dt;
          npc.walkPhase += dt * 4;
        }
      }
      break;
    }

    case 'DEAD':
      break;
  }
}

// ---------- NPC appearance model & part drawers ----------
// computeNPCAppearance() returns a snapshot describing how an NPC should look
// THIS frame: derived flags (isZombie, flash), transform (bob/rot/scale/shakeX),
// palette (skin/body/leg/arm), and animation values (legSplit, armA/B). The
// part drawers below consume that model so drawNPC stays a thin orchestrator.
const RACE_SCALE = {
  human: { x: 1.00, y: 1.00 },
  elf:   { x: 0.82, y: 1.18 },
  dwarf: { x: 1.30, y: 0.78 },
};
const SKIN_BASE  = '#e9c39a';
const SKIN_ELDER = '#d4a878';
const SKIN_ZOMBIE = '#7a8a6a';
const HAIR_YOUNG = '#2e1a08';
const HAIR_ELDER = '#a8a8a8';
const LEG_BASE   = '#3a2e1f';
const LEG_ZOMBIE = '#2e3a2e';
const BODY_ZOMBIE = '#5a6a4a';
const FLASH_COLOR = '#FFFFFF';

function computeNPCAppearance(npc) {
  const isZombie = npc.state === 'ZOMBIE' || npc.isZombieType;
  const flash    = npc.flashTimer > 0;
  const now      = performance.now();

  let bob = 0;
  if (npc.state === 'WANDER') bob = Math.abs(Math.sin(npc.walkPhase)) * 1.5;
  else if (isZombie)          bob = Math.abs(Math.sin(npc.walkPhase)) * 1.0;

  let rot = 0;
  if      (npc.state === 'GRABBED')                                  rot = Math.sin(now / 100) * 0.18;
  else if (npc.state === 'AIRBORNE')                                 rot = (npc.vel.x + npc.vel.y) * 0.12;
  else if (npc.state === 'STUNNED' || npc.state === 'CORPSE')        rot = Math.PI / 2;
  else if (isZombie)                                                 rot = Math.sin(now / 600) * 0.12;
  else if (npc.age === 'elder')                                      rot = 0.07;

  const r = isZombie ? { x: 1, y: 1 } : (RACE_SCALE[npc.race] || RACE_SCALE.human);
  const scaleX = r.x, scaleY = r.y;

  let shakeX = 0;
  if      (npc.state === 'ON_FIRE') shakeX = Math.sin(now * 0.04) * 1.5;
  else if (npc.state === 'DYING')   shakeX = (Math.random() - 0.5) * 3;

  const baseSkin  = (!isZombie && npc.age === 'elder') ? SKIN_ELDER : SKIN_BASE;
  const skinColor = flash ? FLASH_COLOR : (isZombie ? SKIN_ZOMBIE : baseSkin);
  const bodyColor = flash ? FLASH_COLOR : (isZombie ? BODY_ZOMBIE : npc.color);
  const legColor  = flash ? FLASH_COLOR : (isZombie ? LEG_ZOMBIE  : LEG_BASE);
  const armColor  = flash ? FLASH_COLOR : (isZombie ? BODY_ZOMBIE : npc.color);

  let legSplit = 0;
  if      (npc.state === 'WANDER') legSplit = Math.sin(npc.walkPhase) * 2;
  else if (isZombie)               legSplit = Math.sin(npc.walkPhase) * 1.2;

  let armA = 0, armB = 0;
  if (npc.state === 'GRABBED' || npc.state === 'AIRBORNE' ||
      npc.state === 'ON_FIRE' || npc.state === 'DYING') {
    armA = Math.sin(now / 80) * 4;
    armB = -armA;
  } else if (isZombie) {
    armA = -7; armB = -7;
  }

  return {
    isZombie, flash,
    bob, rot, scaleX, scaleY, shakeX,
    skinColor, bodyColor, legColor, armColor,
    legSplit, armA, armB,
  };
}

function drawNPCShadow(ctx, ground, shrink) {
  ctx.globalAlpha = 0.35 * shrink;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(ground.sx, ground.sy + 4, 8 * shrink, 4 * shrink, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

// Material / texture palette — shared by costume and weapon helpers
const M_METAL_LIGHT  = '#c8c8d2';
const M_METAL_DARK   = '#5a5a64';
const M_GOLD         = '#d4a017';
const M_GOLD_BRIGHT  = '#FFD700';
const M_LEATHER      = '#5a3a1c';
const M_LEATHER_DARK = '#3a2008';
const M_WOOD         = '#5a3008';
const M_STRING       = '#aaa';
const M_BLOOD        = '#a01818';
const M_PRIEST_HAT   = '#f4f0d8';
const M_WIZARD_HAT   = '#1f1234';
const M_RANGER_HOOD  = '#1d4a1d';
const M_BEARD        = '#5a3818';
const CLASS_COLOR_DARK = {
  warrior: '#5a1414',
  wizard:  '#301455',
  ranger:  '#1d4a1d',
  priest:  '#80714a',
};
const classTrim = (npc) => CLASS_COLOR_DARK[npc.npcClass] || '#3a3a3a';

// ---- Back layer (drawn before body) ----
function drawNPCQuiver(ctx, npc, m) {
  if (m.isZombie || m.flash || npc.npcClass !== 'ranger') return;
  // Leather quiver tucked behind the torso, with three arrow shafts poking up
  ctx.fillStyle = M_LEATHER;
  ctx.fillRect(-1.7, -10.5, 3.4, 8);
  ctx.fillStyle = M_LEATHER_DARK;
  ctx.fillRect(-1.7, -10.5, 3.4, 0.6);   // top rim
  ctx.fillRect(-1.7, -2.9, 3.4, 0.6);    // bottom rim
  // arrows: shaft, feather
  ctx.fillStyle = '#a87838';
  ctx.fillRect(-1.2, -12.6, 0.55, 2.6);
  ctx.fillRect( 0,    -13.1, 0.55, 3.1);
  ctx.fillRect( 1.2,  -12.6, 0.55, 2.6);
  ctx.fillStyle = M_BLOOD;
  ctx.fillRect(-1.2, -12.6, 0.55, 0.9);
  ctx.fillRect( 0,    -13.1, 0.55, 0.9);
  ctx.fillRect( 1.2,  -12.6, 0.55, 0.9);
}

function drawNPCHairBack(ctx, npc, m) {
  if (m.isZombie || m.flash || npc.gender !== 'female') return;
  // Long hair flowing down behind the dress — trapezoid from head to shoulders
  ctx.fillStyle = npc.age === 'elder' ? HAIR_ELDER : HAIR_YOUNG;
  ctx.beginPath();
  ctx.moveTo(-3.5, -16);
  ctx.lineTo( 3.5, -16);
  ctx.lineTo( 4.6,  -4);
  ctx.lineTo(-4.6,  -4);
  ctx.closePath();
  ctx.fill();
  // subtle inner shade for texture
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(-1, -14, 2, 10);
}

// ---- Lower body: pants (male/zombie) or skirt (female) ----
function drawNPCLowerBody(ctx, npc, m) {
  if (npc.gender === 'female' && !m.isZombie) {
    // Long dress skirt — flared trapezoid
    ctx.fillStyle = m.bodyColor;
    ctx.beginPath();
    ctx.moveTo(-3, -1);
    ctx.lineTo( 3, -1);
    ctx.lineTo( 5.2, 8);
    ctx.lineTo(-5.2, 8);
    ctx.closePath();
    ctx.fill();
    if (!m.flash) {
      // hem trim
      ctx.fillStyle = classTrim(npc);
      ctx.fillRect(-5.2, 7, 10.4, 1.4);
      // vertical pleat hints
      ctx.fillRect(-2.6, 0.4, 0.4, 7.2);
      ctx.fillRect( 2.2, 0.4, 0.4, 7.2);
    }
    // feet peeking out at the hem
    ctx.fillStyle = m.legColor;
    ctx.fillRect(-2.6, 7.7, 1.8, 1);
    ctx.fillRect( 0.8, 7.7, 1.8, 1);
  } else {
    // Pants — two legs with walk animation
    ctx.fillStyle = m.legColor;
    ctx.fillRect(-3 + m.legSplit, 0, 2, 8);
    ctx.fillRect( 1 - m.legSplit, 0, 2, 8);
    if (!m.flash && !m.isZombie) {
      // belt + buckle
      ctx.fillStyle = M_LEATHER_DARK;
      ctx.fillRect(-4, -1, 8, 1.1);
      ctx.fillStyle = M_GOLD;
      ctx.fillRect(-0.7, -0.9, 1.4, 0.9);
      // boot tops (darker band at ankle)
      ctx.fillStyle = M_LEATHER_DARK;
      ctx.fillRect(-3 + m.legSplit, 6.5, 2, 1.5);
      ctx.fillRect( 1 - m.legSplit, 6.5, 2, 1.5);
    }
  }
}

// ---- Torso (shirt or dress top) ----
function drawNPCTorso(ctx, npc, m) {
  ctx.fillStyle = m.bodyColor;
  ctx.fillRect(-4, -10, 8, 10);
  if (m.flash || m.isZombie) return;

  const trim = classTrim(npc);
  if (npc.gender === 'female') {
    // V-neck
    ctx.fillStyle = m.skinColor;
    ctx.beginPath();
    ctx.moveTo(-1.6, -10);
    ctx.lineTo( 1.6, -10);
    ctx.lineTo( 0,   -6.8);
    ctx.closePath();
    ctx.fill();
    // bodice waist trim
    ctx.fillStyle = trim;
    ctx.fillRect(-4, -2, 8, 0.9);
    // shoulder line
    ctx.fillStyle = trim;
    ctx.fillRect(-4, -10, 8, 0.5);
  } else {
    // Shirt: collar, center seam, shoulder line
    ctx.fillStyle = trim;
    ctx.fillRect(-0.35, -9.5, 0.7, 8.5);   // seam
    ctx.fillRect(-4, -10, 8, 0.5);          // shoulder line
    // collar notch
    ctx.fillStyle = m.skinColor;
    ctx.fillRect(-1, -10, 2, 1);
  }

  // Ranger strap across chest
  if (npc.npcClass === 'ranger') {
    ctx.save();
    ctx.fillStyle = M_LEATHER;
    ctx.translate(0, -5.5);
    ctx.rotate(-0.55);
    ctx.fillRect(-5.2, -0.55, 10.4, 1.1);
    ctx.restore();
  }
}

// ---- Dwarf beard (over front of torso) ----
function drawNPCBeard(ctx, npc, m) {
  if (m.isZombie || m.flash || npc.race !== 'dwarf') return;
  ctx.fillStyle = npc.age === 'elder' ? HAIR_ELDER : M_BEARD;
  // mustache strip
  ctx.fillRect(-2.8, -12, 5.6, 1.1);
  // long beard triangle
  ctx.beginPath();
  ctx.moveTo(-3.2, -11);
  ctx.lineTo( 3.2, -11);
  ctx.lineTo( 0,    -3);
  ctx.closePath();
  ctx.fill();
  // braid texture lines
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(-1.2, -10, 0.5, 6);
  ctx.fillRect( 0.7, -10, 0.5, 6);
}

// ---- Arms ----
function drawNPCArms(ctx, m) {
  ctx.fillStyle = m.armColor;
  ctx.fillRect(-6, -9 + m.armA, 2, 6);
  ctx.fillRect( 4, -9 + m.armB, 2, 6);
}

// ---- Off-hand item (shield for warrior, book for wizard) ----
function drawNPCOffHand(ctx, npc, m) {
  if (m.isZombie || m.flash) return;
  if (npc.npcClass === 'warrior') {
    // Shield — wooden oval with metal rim and central boss
    const x = -7.2, y = -6 + m.armA * 0.4;
    ctx.fillStyle = '#7a4818';
    ctx.beginPath();
    ctx.ellipse(x, y, 2.4, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = M_METAL_DARK;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.ellipse(x, y, 2.4, 3.4, 0, 0, Math.PI * 2);
    ctx.stroke();
    // wood grain
    ctx.fillStyle = '#5a3018';
    ctx.fillRect(x - 0.2, y - 2.6, 0.4, 5.2);
    // metal boss in center
    ctx.fillStyle = M_METAL_LIGHT;
    ctx.beginPath(); ctx.arc(x, y, 0.85, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ececf2';
    ctx.beginPath(); ctx.arc(x - 0.25, y - 0.25, 0.4, 0, Math.PI * 2); ctx.fill();
  } else if (npc.npcClass === 'wizard') {
    // Spell book under the left arm
    const x = -7, y = -4 + m.armA * 0.4;
    ctx.fillStyle = M_LEATHER;
    ctx.fillRect(x - 1.7, y - 1.7, 3.4, 3.4);
    ctx.fillStyle = M_LEATHER_DARK;
    ctx.fillRect(x - 1.7, y - 1.7, 0.55, 3.4);   // spine
    ctx.fillStyle = '#e8d8a0';
    ctx.fillRect(x + 1, y - 1.3, 0.4, 2.6);       // page edges
    ctx.fillStyle = M_GOLD;
    ctx.fillRect(x - 0.4, y - 0.4, 0.8, 0.8);     // clasp
  }
}

// ---- Head (skin sphere) ----
function drawNPCHead(ctx, m) {
  ctx.fillStyle = m.skinColor;
  ctx.beginPath();
  ctx.arc(0, -13, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

// ---- Elf ears (pointed, sticking out beside the head) ----
function drawNPCElfEars(ctx, npc, m) {
  if (m.isZombie || m.flash || npc.race !== 'elf') return;
  ctx.fillStyle = m.skinColor;
  ctx.beginPath();
  ctx.moveTo(-3.0, -13);
  ctx.lineTo(-5.4, -16.2);
  ctx.lineTo(-3.0, -11.6);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo( 3.0, -13);
  ctx.lineTo( 5.4, -16.2);
  ctx.lineTo( 3.0, -11.6);
  ctx.closePath();
  ctx.fill();
  // tiny inner-ear shadow
  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.fillRect(-4.0, -14.2, 1.3, 0.5);
  ctx.fillRect( 2.7, -14.2, 1.3, 0.5);
}

// ---- Hair (front / top, gender + age) ----
function drawNPCHairFront(ctx, npc, m) {
  if (m.isZombie || m.flash) return;
  ctx.fillStyle = npc.age === 'elder' ? HAIR_ELDER : HAIR_YOUNG;
  if (npc.gender === 'female') {
    // Top crown + front side strands framing the face
    ctx.beginPath();
    ctx.arc(0, -15.2, 3.4, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-4.4, -14.8, 1.3, 3.6);
    ctx.fillRect( 3.1, -14.8, 1.3, 3.6);
  } else if (npc.age === 'elder') {
    // Receding gray hair — temples + thin wisp
    ctx.fillRect(-4.0, -15.4, 1.2, 3);
    ctx.fillRect( 2.8, -15.4, 1.2, 3);
    ctx.fillRect(-2.2, -16.1, 4.4, 0.8);
  } else {
    // Young male short fringe cap
    ctx.beginPath();
    ctx.arc(0, -14, 3.6, Math.PI, 0);
    ctx.fill();
  }
}

// ---- Headgear by class (drawn over hair) ----
function drawNPCHeadgear(ctx, npc, m) {
  if (m.isZombie || m.flash) return;
  switch (npc.npcClass) {
    case 'warrior': {
      // Steel helmet — dome, brow band, side bolts, red plume crest
      ctx.fillStyle = M_METAL_LIGHT;
      ctx.beginPath();
      ctx.arc(0, -14.2, 4.1, Math.PI, 0);
      ctx.fill();
      // top highlight
      ctx.fillStyle = '#e8e8f0';
      ctx.beginPath();
      ctx.arc(-0.8, -16, 1.6, Math.PI, Math.PI * 1.6);
      ctx.fill();
      // brow band
      ctx.fillStyle = M_METAL_DARK;
      ctx.fillRect(-4.1, -14.3, 8.2, 0.8);
      // side bolts
      ctx.fillRect(-3.7, -15.1, 0.6, 0.6);
      ctx.fillRect( 3.1, -15.1, 0.6, 0.6);
      // red plume crest
      ctx.fillStyle = M_BLOOD;
      ctx.fillRect(-0.9, -19.5, 1.8, 5);
      ctx.fillStyle = '#7a1010';
      ctx.fillRect(-0.4, -19.0, 0.8, 4.5);
      break;
    }
    case 'wizard': {
      // Tall pointed hat with brim and gold band + star
      ctx.fillStyle = M_WIZARD_HAT;
      ctx.beginPath();
      ctx.moveTo(-3.6, -15.2);
      ctx.lineTo( 3.6, -15.2);
      ctx.lineTo( 0.4, -22);
      ctx.lineTo(-0.4, -22);
      ctx.closePath();
      ctx.fill();
      // floppy fold
      ctx.beginPath();
      ctx.moveTo( 1.0, -19);
      ctx.lineTo( 2.8, -18);
      ctx.lineTo( 1.5, -17.4);
      ctx.closePath();
      ctx.fill();
      // brim ellipse
      ctx.beginPath();
      ctx.ellipse(0, -14.7, 5.4, 1.3, 0, 0, Math.PI * 2);
      ctx.fill();
      // gold band
      ctx.fillStyle = M_GOLD;
      ctx.fillRect(-3.4, -16, 6.8, 0.8);
      // star on the front
      ctx.fillStyle = M_GOLD_BRIGHT;
      ctx.beginPath();
      ctx.arc(0, -18.4, 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-0.2, -19.1, 0.4, 1.4);
      ctx.fillRect(-0.9, -18.4, 1.8, 0.4);
      break;
    }
    case 'priest': {
      // Bishop's mitre — tall, two-peaked, cross on the front
      ctx.fillStyle = M_PRIEST_HAT;
      ctx.beginPath();
      ctx.moveTo(-3.6, -14);
      ctx.lineTo( 3.6, -14);
      ctx.lineTo( 3.6, -17.5);
      ctx.lineTo( 0,   -22);
      ctx.lineTo(-3.6, -17.5);
      ctx.closePath();
      ctx.fill();
      // gold trim at base
      ctx.fillStyle = M_GOLD;
      ctx.fillRect(-3.6, -14, 7.2, 0.8);
      // vertical gold orphrey down the front
      ctx.fillRect(-0.4, -20.5, 0.8, 6);
      // cross symbol
      ctx.fillStyle = M_GOLD_BRIGHT;
      ctx.fillRect(-0.4, -19.6, 0.8, 3.6);
      ctx.fillRect(-1.4, -18.4, 2.8, 0.8);
      // back lappet (streamer behind shoulder)
      ctx.fillStyle = M_PRIEST_HAT;
      ctx.fillRect( 2.0, -13.5, 0.8, 4);
      ctx.fillStyle = M_GOLD;
      ctx.fillRect( 2.0, -10, 0.8, 0.4);
      break;
    }
    case 'ranger': {
      // Forest hood — peaked top, side covers, shoulder cape
      ctx.fillStyle = M_RANGER_HOOD;
      // peaked top
      ctx.beginPath();
      ctx.moveTo(-3.4, -15);
      ctx.lineTo( 3.4, -15);
      ctx.lineTo( 1.2, -19.2);
      ctx.lineTo(-1.2, -19.2);
      ctx.closePath();
      ctx.fill();
      // side covers framing the face
      ctx.fillRect(-4.5, -14.6, 1.5, 4);
      ctx.fillRect( 3.0, -14.6, 1.5, 4);
      // shoulder cape
      ctx.fillRect(-5, -10.6, 10, 1.4);
      // inner shadow trim
      ctx.fillStyle = '#0a2a0a';
      ctx.fillRect(-3.4, -15.4, 6.8, 0.5);
      // tiny green feather on the side
      ctx.fillStyle = '#3a8a3a';
      ctx.fillRect(2.8, -17.6, 0.9, 2.6);
      break;
    }
  }
}

// ---- Weapon in the right hand ----
function drawNPCWeaponRight(ctx, npc, m) {
  if (m.isZombie || m.flash) return;
  // follow the right arm vertical offset so the weapon doesn't float when arms flail
  ctx.save();
  ctx.translate(0, m.armB);
  switch (npc.npcClass) {
    case 'warrior': {
      // Long sword — held tip up, gold guard + pommel
      const x = 6.8;
      ctx.fillStyle = M_METAL_LIGHT;
      ctx.fillRect(x - 0.5, -16, 1.0, 10);
      ctx.fillStyle = '#f4f4fa';
      ctx.fillRect(x - 0.15, -15.8, 0.3, 9);
      ctx.fillStyle = M_GOLD;
      ctx.fillRect(x - 1.7, -6.4, 3.4, 0.9);   // crossguard
      ctx.fillStyle = M_LEATHER_DARK;
      ctx.fillRect(x - 0.4, -5.5, 0.8, 2.6);   // leather grip
      ctx.fillStyle = '#3a2008';                // grip wrap stripes
      ctx.fillRect(x - 0.4, -4.6, 0.8, 0.3);
      ctx.fillRect(x - 0.4, -3.7, 0.8, 0.3);
      ctx.fillStyle = M_GOLD;
      ctx.beginPath(); ctx.arc(x, -2.5, 0.75, 0, Math.PI * 2); ctx.fill();   // pommel
      break;
    }
    case 'ranger': {
      // Longbow — arc on the right with vertical string
      const cx = 7.4, cy = -7;
      ctx.strokeStyle = M_WOOD;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, cy, 5.4, Math.PI * 0.42, -Math.PI * 0.42, true);
      ctx.stroke();
      // string
      ctx.strokeStyle = M_STRING;
      ctx.lineWidth = 0.45;
      ctx.beginPath();
      ctx.moveTo(cx - 0.6, cy - 4.9);
      ctx.lineTo(cx - 0.6, cy + 4.9);
      ctx.stroke();
      // leather grip wrap at hand
      ctx.fillStyle = M_LEATHER_DARK;
      ctx.fillRect(cx + 1.4, cy - 1.1, 1.3, 2.2);
      break;
    }
    case 'wizard': {
      // Tall wooden staff topped with a glowing orb
      const x = 6.6;
      ctx.fillStyle = M_WOOD;
      ctx.fillRect(x - 0.5, -15, 1, 18);
      // wood grain stripes
      ctx.fillStyle = M_LEATHER_DARK;
      ctx.fillRect(x - 0.5, -10, 1, 0.4);
      ctx.fillRect(x - 0.5,  -4, 1, 0.4);
      // hand grip wrap
      ctx.fillStyle = M_LEATHER_DARK;
      ctx.fillRect(x - 0.5, -7, 1, 2.2);
      // orb glow halo
      ctx.fillStyle = 'rgba(255, 224, 102, 0.32)';
      ctx.beginPath(); ctx.arc(x, -16.4, 2.6, 0, Math.PI * 2); ctx.fill();
      // orb
      ctx.fillStyle = M_GOLD_BRIGHT;
      ctx.beginPath(); ctx.arc(x, -16.4, 1.5, 0, Math.PI * 2); ctx.fill();
      // orb highlight
      ctx.fillStyle = '#fff7c0';
      ctx.beginPath(); ctx.arc(x - 0.45, -16.85, 0.55, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'priest': {
      // Gold scepter topped with a small jeweled cross
      const x = 6.5;
      ctx.fillStyle = M_GOLD;
      ctx.fillRect(x - 0.45, -13, 0.9, 11);
      // cross
      ctx.fillRect(x - 0.5, -16.8, 1, 3.8);
      ctx.fillRect(x - 1.5, -15.5, 3, 0.9);
      // jewel
      ctx.fillStyle = M_BLOOD;
      ctx.fillRect(x - 0.4, -15.4, 0.8, 0.7);
      // grip bands
      ctx.fillStyle = M_LEATHER_DARK;
      ctx.fillRect(x - 0.5, -7,  1, 0.4);
      ctx.fillRect(x - 0.5, -10, 1, 0.4);
      break;
    }
  }
  ctx.restore();
}

// ---- Simplified body used only for zombies (no costume detail) ----
function drawNPCZombieBody(ctx, m) {
  ctx.fillStyle = m.legColor;
  ctx.fillRect(-3 + m.legSplit, 0, 2, 8);
  ctx.fillRect( 1 - m.legSplit, 0, 2, 8);
  ctx.fillStyle = m.bodyColor;
  ctx.fillRect(-4, -10, 8, 10);
  // torn shirt rips for atmosphere
  ctx.fillStyle = '#3a4a3a';
  ctx.fillRect(-3, -8, 2, 1);
  ctx.fillRect( 1, -5, 2, 1);
  ctx.fillStyle = m.armColor;
  ctx.fillRect(-6, -9 + m.armA, 2, 6);
  ctx.fillRect( 4, -9 + m.armB, 2, 6);
  ctx.fillStyle = m.skinColor;
  ctx.beginPath();
  ctx.arc(0, -13, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawNPCCharring(ctx, npc) {
  const char = Math.max(0, 1 - npc.fireTimer / CONFIG.FIRE_BURN_DURATION);
  ctx.fillStyle = `rgba(10, 5, 0, ${char * 0.78})`;
  ctx.fillRect(-5, -17, 10, 26);
}

function drawNPCZombieEyes(ctx) {
  ctx.save();
  ctx.shadowColor = '#44ff44';
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#88ff88';
  ctx.beginPath(); ctx.arc(-1.2, -13.5, 1.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( 1.2, -13.5, 1.1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawNPC(npc) {
  if (npc.state === 'DEAD') return;

  const ctx = state.ctx;
  const screen = worldToScreen(npc.pos.wx, npc.pos.wy, npc.pos.wz);
  const ground = worldToScreen(npc.pos.wx, npc.pos.wy, 0);
  const shrink = 1 / (1 + npc.pos.wz * 0.4);

  drawNPCShadow(ctx, ground, shrink);

  const m = computeNPCAppearance(npc);

  ctx.save();
  ctx.translate(screen.sx + m.shakeX, screen.sy - m.bob);
  ctx.rotate(m.rot);
  ctx.scale(m.scaleX, m.scaleY);

  if (npc.state === 'CORPSE') {
    const fade = npc.corpseTimer < 5 ? Math.max(0, npc.corpseTimer / 5) : 1;
    ctx.globalAlpha = 0.85 * fade;
  }

  if (m.isZombie) {
    drawNPCZombieBody(ctx, m);
    if (npc.state === 'ON_FIRE') drawNPCCharring(ctx, npc);
    drawNPCZombieEyes(ctx);
    ctx.restore();
    return;
  }

  // Living NPC — full costume stack, drawn back-to-front.
  drawNPCQuiver(ctx, npc, m);       // behind torso
  drawNPCHairBack(ctx, npc, m);     // long hair behind body (female)
  drawNPCLowerBody(ctx, npc, m);    // pants or dress skirt
  drawNPCTorso(ctx, npc, m);        // shirt or bodice + class trim
  drawNPCBeard(ctx, npc, m);        // dwarf only — over upper torso
  drawNPCArms(ctx, m);
  drawNPCOffHand(ctx, npc, m);      // shield (warrior) / book (wizard)
  drawNPCHead(ctx, m);
  drawNPCElfEars(ctx, npc, m);      // elf only
  drawNPCHairFront(ctx, npc, m);    // crown / fringe / temples
  drawNPCHeadgear(ctx, npc, m);     // helmet / wizard hat / mitre / hood
  drawNPCWeaponRight(ctx, npc, m);  // sword / bow / staff / scepter

  if (npc.state === 'ON_FIRE') drawNPCCharring(ctx, npc);

  ctx.restore();
}

// ---------- Hand ----------
function getMousePos(e) {
  const rect = state.canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

const NON_PICKABLE = new Set(['GRABBED', 'AIRBORNE', 'DEAD', 'DYING', 'CORPSE']);
function isAlive(npc) {
  return npc.state !== 'DEAD' && npc.state !== 'DYING' && npc.state !== 'CORPSE';
}

function buildingOccluding(npc) {
  if (npc.state === 'DEAD' || npc.pos.wz > 0.5) return null;
  for (const b of state.buildings) {
    // case A: NPC standing inside the footprint (under the roof)
    if (npc.pos.wx >= b.wx && npc.pos.wx <= b.wx + b.w &&
        npc.pos.wy >= b.wy && npc.pos.wy <= b.wy + b.h) return b;

    // case B: NPC behind the building in iso depth, with screen-X overlap
    // and within the roof's vertical reach (~3 wu of depth above back corner).
    // Beyond that the NPC's screen position is above the roof peak — the
    // building can't actually cover them, so no silhouette needed.
    const npcDepth = npc.pos.wx + npc.pos.wy;
    const buildingBackDepth = b.wx + b.wy;
    const depthBehind = buildingBackDepth - npcDepth;
    if (depthBehind <= 0 || depthBehind > 3) continue;

    const dxNpc = npc.pos.wx - npc.pos.wy;
    const dxMin = b.wx - (b.wy + b.h);
    const dxMax = (b.wx + b.w) - b.wy;
    if (dxNpc < dxMin || dxNpc > dxMax) continue;

    return b;
  }
  return null;
}

function drawNPCOccludedSilhouette(npc) {
  const ctx = state.ctx;
  const screen = worldToScreen(npc.pos.wx, npc.pos.wy, npc.pos.wz);
  const pulse = 0.35 + Math.sin(performance.now() * 0.004) * 0.15;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#ffffff';
  ctx.translate(screen.sx, screen.sy);
  // legs
  ctx.fillRect(-3, 0, 2, 8);
  ctx.fillRect( 1, 0, 2, 8);
  // body
  ctx.fillRect(-4, -10, 8, 10);
  // arms
  ctx.fillRect(-6, -9, 2, 6);
  ctx.fillRect( 4, -9, 2, 6);
  // head
  ctx.beginPath();
  ctx.arc(0, -13, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function pickNPCAt(sx, sy) {
  for (let i = state.npcs.length - 1; i >= 0; i--) {
    const npc = state.npcs[i];
    if (NON_PICKABLE.has(npc.state)) continue;
    const p = worldToScreen(npc.pos.wx, npc.pos.wy, npc.pos.wz);
    if (sx >= p.sx - 8 && sx <= p.sx + 8 && sy >= p.sy - 18 && sy <= p.sy + 8) {
      return npc;
    }
  }
  return null;
}

function pushHistory(x, y) {
  const t = performance.now();
  state.hand.history.push({ x, y, t });
  const cutoff = t - CONFIG.THROW_HISTORY_MS;
  while (state.hand.history.length > 0 && state.hand.history[0].t < cutoff) {
    state.hand.history.shift();
  }
}

function onMouseDown(e) {
  ensureAudio();
  const { x, y } = getMousePos(e);
  state.hand.pos = { x, y };
  state.hand.visible = true;
  pushHistory(x, y);

  const sel = state.selectedSpell;
  const npcUnder = pickNPCAt(x, y);
  const targetWorld = screenToWorld(x, y);

  if (sel === 'HAND') {
    if (npcUnder) {
      npcUnder.state = 'GRABBED';
      npcUnder.vel = { x: 0, y: 0, z: 0 };
      state.hand.holding = npcUnder;
    } else {
      state.pan.active = true;
      state.pan.lastX = x;
      state.pan.lastY = y;
    }
    return;
  }

  if (sel === 'FIREBALL')          castFireball(npcUnder, targetWorld);
  else if (sel === 'LIGHTNING')    castLightning(npcUnder, targetWorld);
  else if (sel === 'WIND')         castWind(targetWorld);
  else if (sel === 'METEOR')       castMeteor(npcUnder, targetWorld);
  else if (sel === 'NECROMANCER')  castNecromancer(targetWorld);
}

function onMouseMove(e) {
  const { x, y } = getMousePos(e);
  if (state.pan.active) {
    state.originX += x - state.pan.lastX;
    state.originY += y - state.pan.lastY;
    state.pan.lastX = x;
    state.pan.lastY = y;
    clampOrigin();
  }
  state.hand.pos = { x, y };
  state.hand.visible = true;
  pushHistory(x, y);
}

function onMouseUp() {
  if (state.pan.active) {
    state.pan.active = false;
    return;
  }
  const npc = state.hand.holding;
  if (!npc) return;

  const hist = state.hand.history;
  let vx = 0, vy = 0;
  if (hist.length >= 2) {
    const a = hist[0], b = hist[hist.length - 1];
    const dts = (b.t - a.t) / 1000;
    if (dts > 0.01) {
      const sxPerS = (b.x - a.x) / dts;
      const syPerS = (b.y - a.y) / dts;
      vx = (sxPerS / (CONFIG.TILE_W / 2) + syPerS / (CONFIG.TILE_H / 2)) / 2;
      vy = (syPerS / (CONFIG.TILE_H / 2) - sxPerS / (CONFIG.TILE_W / 2)) / 2;
    }
  }

  const speed = Math.hypot(vx, vy);
  if (speed > CONFIG.MAX_THROW_SPEED) {
    const f = CONFIG.MAX_THROW_SPEED / speed;
    vx *= f; vy *= f;
  }

  npc.vel.x = vx;
  npc.vel.y = vy;
  npc.vel.z = Math.min(8, Math.hypot(vx, vy) * 0.4);
  npc.state = 'AIRBORNE';
  npc.maxFallSpeed = 0;
  state.hand.holding = null;
}

function onMouseLeave() {
  state.hand.visible = false;
  state.pan.active = false;
}

function updateHand(dt) {
  const npc = state.hand.holding;
  if (!npc) return;
  npc.pos.wz = Math.min(CONFIG.GRAB_LIFT, npc.pos.wz + CONFIG.GRAB_LIFT_RATE * dt);
  const targetSy = state.hand.pos.y + CONFIG.HAND_BODY_OFFSET + npc.pos.wz * CONFIG.ELEV_H;
  const w = screenToWorld(state.hand.pos.x, targetSy);
  npc.pos.wx = w.wx;
  npc.pos.wy = w.wy;
}

function drawHand() {
  if (!state.hand.visible) return;
  const ctx = state.ctx;
  const { x, y } = state.hand.pos;
  const grabbing = !!state.hand.holding;
  const sel = state.selectedSpell;

  ctx.save();
  ctx.font = '40px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (sel !== 'HAND' && !grabbing) {
    ctx.shadowColor = SPELL_COLORS[sel];
    ctx.shadowBlur = 22;
  }

  ctx.fillText(grabbing ? '✊' : '✋', x, y);
  ctx.restore();
}

// ---------- Spell selection ----------
function selectSpell(name) {
  if (state.hand.holding) {
    const npc = state.hand.holding;
    npc.vel = { x: 0, y: 0, z: 0 };
    npc.state = 'AIRBORNE';
    npc.maxFallSpeed = 0;
    state.hand.holding = null;
  }
  state.selectedSpell = name;
  document.querySelectorAll('.spell-slot').forEach(s => {
    s.classList.toggle('active', s.dataset.spell === name);
  });
}

// ---------- Spell casts ----------
function handWorldOrigin() {
  return { ...screenToWorld(state.hand.pos.x, state.hand.pos.y), wz: 1.5 };
}

function castFireball(npcTarget, targetWorld) {
  const start = handWorldOrigin();
  const target = npcTarget
    ? { wx: npcTarget.pos.wx, wy: npcTarget.pos.wy, wz: 0 }
    : { wx: targetWorld.wx, wy: targetWorld.wy, wz: 0 };
  const dist = Math.hypot(target.wx - start.wx, target.wy - start.wy);
  const duration = Math.max(0.25, dist / CONFIG.FIREBALL_SPEED);

  state.projectiles.push({
    kind: 'fireball',
    start,
    target,
    pos: { ...start },
    timer: 0,
    duration,
    trailTimer: 0,
  });
  playFireballSound();
}

function castLightning(npcTarget, targetWorld) {
  let first = npcTarget;
  if (!first) {
    let best = null, bestD = CONFIG.LIGHTNING_RANGE;
    for (const n of state.npcs) {
      if (!isAlive(n)) continue;
      const d = Math.hypot(n.pos.wx - targetWorld.wx, n.pos.wy - targetWorld.wy);
      if (d < bestD) { bestD = d; best = n; }
    }
    first = best;
  }

  playLightningSound();
  if (!first) return;

  const chain = [first];
  const hitSet = new Set([first]);
  while (chain.length < CONFIG.LIGHTNING_CHAIN_COUNT) {
    const last = chain[chain.length - 1];
    let next = null, bestD = CONFIG.LIGHTNING_CHAIN_RANGE;
    for (const n of state.npcs) {
      if (hitSet.has(n) || !isAlive(n)) continue;
      const d = Math.hypot(n.pos.wx - last.pos.wx, n.pos.wy - last.pos.wy);
      if (d < bestD) { bestD = d; next = n; }
    }
    if (!next) break;
    chain.push(next);
    hitSet.add(next);
  }

  const startWorld = handWorldOrigin();
  const points = [startWorld];
  for (const n of chain) {
    points.push({ wx: n.pos.wx, wy: n.pos.wy, wz: 0.5 });
  }
  state.lightningBolts.push({
    segments: makeBoltSegments(points),
    timer: 0,
    lifetime: CONFIG.LIGHTNING_BOLT_LIFETIME,
  });

  for (const n of chain) {
    spawnSparks(n.pos);
    kill(n);
  }
  triggerScreenShake(3, 0.25);
}

function castWind(targetWorld) {
  const radius = CONFIG.WIND_AOE;
  const force = CONFIG.WIND_FORCE;
  for (const npc of state.npcs) {
    if (!isAlive(npc) || npc.state === 'GRABBED') continue;
    const dx = npc.pos.wx - targetWorld.wx;
    const dy = npc.pos.wy - targetWorld.wy;
    const d = Math.hypot(dx, dy);
    if (d < radius && d > 0.001) {
      const f = (1 - d / radius) * force;
      npc.vel.x = (dx / d) * f;
      npc.vel.y = (dy / d) * f;
      npc.vel.z = 3 + Math.random() * 2;
      npc.state = 'AIRBORNE';
      npc.maxFallSpeed = 0;
    }
  }
  spawnWindBurst(targetWorld);
  playWindSound();
}

function castMeteor(npcTarget, targetWorld) {
  const target = npcTarget
    ? { wx: npcTarget.pos.wx, wy: npcTarget.pos.wy, wz: 0 }
    : { wx: targetWorld.wx, wy: targetWorld.wy, wz: 0 };
  const start = { wx: target.wx, wy: target.wy, wz: CONFIG.METEOR_HEIGHT };

  state.projectiles.push({
    kind: 'meteor',
    start,
    target,
    pos: { ...start },
    timer: 0,
    duration: CONFIG.METEOR_FALL_DURATION,
    trailTimer: 0,
  });
  playMeteorWhoosh();
}

function castNecromancer(targetWorld) {
  const radius = CONFIG.NECROMANCER_RADIUS;
  const targets = [];
  for (const n of state.npcs) {
    if (n.state !== 'CORPSE' || n.isZombieType) continue;
    const d = Math.hypot(n.pos.wx - targetWorld.wx, n.pos.wy - targetWorld.wy);
    if (d <= radius) targets.push(n);
  }
  playNecromancerSound();
  if (targets.length === 0) return;
  for (const t of targets) {
    t.state = 'ZOMBIE';
    t.isZombieType = true;
    t.pos.wz = 0;
    t.vel = { x: 0, y: 0, z: 0 };
    t.speed = 0.65 + Math.random() * 0.15;
    t.walkPhase = 0;
    spawnSmokeBurst({ wx: t.pos.wx, wy: t.pos.wy, wz: 0.2 }, 1.2);
    spawnSoulParticles(t.pos);
    state.necroCasts.push({ wx: t.pos.wx, wy: t.pos.wy, timer: 0, lifetime: 1.8 });
  }
  triggerScreenShake(2 + targets.length * 0.4, 0.25);
}

function spawnSoulParticles(worldPos) {
  for (let i = 0; i < 14; i++) {
    const angle = Math.random() * Math.PI * 2;
    const drift = 0.15 + Math.random() * 0.25;
    state.particles.push({
      kind: 'soul',
      pos: { wx: worldPos.wx + (Math.random() - 0.5) * 0.6,
             wy: worldPos.wy + (Math.random() - 0.5) * 0.6,
             wz: 0.1 + Math.random() * 0.4 },
      vel: { x: Math.cos(angle) * drift, y: Math.sin(angle) * drift,
             z: 0.7 + Math.random() * 1.1 },
      lifetime: 1.4 + Math.random() * 1.0,
      timer: 0,
      size: 2.5 + Math.random() * 2.5,
    });
  }
}

function updateNecroCasts(dt) {
  for (let i = state.necroCasts.length - 1; i >= 0; i--) {
    state.necroCasts[i].timer += dt;
    if (state.necroCasts[i].timer >= state.necroCasts[i].lifetime) {
      state.necroCasts.splice(i, 1);
    }
  }
}

function drawNecroTargets() {
  if (state.selectedSpell !== 'NECROMANCER' || !state.hand.visible) return;
  const cursor = screenToWorld(state.hand.pos.x, state.hand.pos.y);
  const radius = CONFIG.NECROMANCER_RADIUS;
  const ctx = state.ctx;
  const pulse = 1 + Math.sin(performance.now() * 0.007) * 0.15;

  // AOE range ring at cursor — isometric circle projected through worldToScreen
  ctx.save();
  ctx.strokeStyle = '#55ee77';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#44ff66';
  ctx.shadowBlur = 12;
  ctx.globalAlpha = 0.85;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  const STEPS = 64;
  for (let i = 0; i <= STEPS; i++) {
    const θ = (i / STEPS) * Math.PI * 2;
    const wx = cursor.wx + Math.cos(θ) * radius;
    const wy = cursor.wy + Math.sin(θ) * radius;
    const { sx, sy } = worldToScreen(wx, wy, 0);
    if (i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // highlight rings on revivable corpses inside the AOE
  for (const npc of state.npcs) {
    if (npc.state !== 'CORPSE' || npc.isZombieType) continue;
    const d = Math.hypot(npc.pos.wx - cursor.wx, npc.pos.wy - cursor.wy);
    if (d > radius) continue;
    const { sx, sy } = worldToScreen(npc.pos.wx, npc.pos.wy, 0);
    ctx.save();
    ctx.strokeStyle = '#aaffcc';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#44ff88';
    ctx.shadowBlur = 14;
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.ellipse(sx, sy + 4, 14 * pulse, 7 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawNecroCasts() {
  const ctx = state.ctx;
  for (const c of state.necroCasts) {
    const t = c.timer / c.lifetime;
    const alpha = 1 - t;
    const { sx, sy } = worldToScreen(c.wx, c.wy, 0);
    const size = 22 + t * 10;
    ctx.save();
    ctx.globalAlpha = alpha * 0.7;
    ctx.shadowColor = '#44ff66';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#44ff66';
    ctx.lineWidth = 2;
    // vertical beam
    ctx.beginPath();
    ctx.moveTo(sx, sy - size);
    ctx.lineTo(sx, sy + size * 0.5);
    ctx.stroke();
    // horizontal beam
    ctx.beginPath();
    ctx.moveTo(sx - size * 0.65, sy - size * 0.3);
    ctx.lineTo(sx + size * 0.65, sy - size * 0.3);
    ctx.stroke();
    ctx.restore();
  }
}

function makeBoltSegments(points) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const segs = 5;
    let prev = a;
    for (let j = 1; j <= segs; j++) {
      const t = j / segs;
      const wx = a.wx + (b.wx - a.wx) * t + (j < segs ? (Math.random() - 0.5) * 0.45 : 0);
      const wy = a.wy + (b.wy - a.wy) * t + (j < segs ? (Math.random() - 0.5) * 0.45 : 0);
      const wz = a.wz + (b.wz - a.wz) * t + (j < segs ? (Math.random() - 0.5) * 0.3 : 0);
      out.push([prev, { wx, wy, wz }]);
      prev = { wx, wy, wz };
    }
  }
  return out;
}

function ignite(npc) {
  if (!isAlive(npc) || npc.state === 'ON_FIRE') return;
  npc.state = 'ON_FIRE';
  const resist = npc.npcClass === 'wizard' ? 1.5 : 1.0;
  npc.fireTimer = CONFIG.FIRE_BURN_DURATION * resist;
  npc.firePartTimer = 0;
  npc.fleeTimer = 0;
  npc.vel = { x: 0, y: 0, z: 0 };
  playBurnScream(npc);
}

function kill(npc, intensity = 1.0) {
  if (npc.state === 'DEAD' || npc.state === 'DYING' || npc.state === 'CORPSE') return;
  // play "oaff" only when dying from non-fire causes (fire victims already screamed at ignite)
  if (npc.state !== 'ON_FIRE') playDeathGrunt(npc);
  npc.state = 'DYING';
  npc.flashTimer = CONFIG.DEATH_FLASH_DURATION;
  npc.deathIntensity = intensity;
  npc.vel = { x: 0, y: 0, z: 0 };
}

function explodeBody(npc) {
  const i = npc.deathIntensity || 1.0;
  const isCritical = Math.random() < CONFIG.CRITICAL_CHANCE;

  if (isCritical) {
    spawnBloodSplatter(npc.pos, i * 1.6);
    spawnBodyParts(npc.pos, npc.color, i);
    spawnSmokeBurst(npc.pos, 0.5 * i);
    addBloodDecal(npc.pos, 12 + i * 8, 0.7);
    triggerScreenShake(4 + i * 2.5, 0.4);
    playSplatSound(i);
    npc.state = 'DEAD';
  } else {
    // normal death: leave corpse on ground
    npc.pos.wz = 0;
    spawnBloodSplatter(npc.pos, i * 0.6);
    addBloodDecal(npc.pos, 10 + i * 4, 0.55);
    triggerScreenShake(1.5, 0.2);
    playSplatSound(i * 0.6);
    npc.state = 'CORPSE';
    npc.corpseTimer = CONFIG.CORPSE_DURATION;
  }
  state.totalDeaths++;
}

// ---------- Projectile + bolt update/render ----------
function updateProjectiles(dt) {
  for (let i = state.projectiles.length - 1; i >= 0; i--) {
    const p = state.projectiles[i];
    p.timer += dt;
    p.trailTimer += dt;

    const t = Math.min(1, p.timer / p.duration);
    if (p.kind === 'fireball') {
      const arc = 4 * t * (1 - t);
      p.pos.wx = p.start.wx + (p.target.wx - p.start.wx) * t;
      p.pos.wy = p.start.wy + (p.target.wy - p.start.wy) * t;
      p.pos.wz = p.start.wz + (p.target.wz - p.start.wz) * t + arc * 1.5;
    } else if (p.kind === 'meteor') {
      // straight vertical drop with slight x curve for drama
      p.pos.wx = p.start.wx + (p.target.wx - p.start.wx) * t;
      p.pos.wy = p.start.wy + (p.target.wy - p.start.wy) * t;
      p.pos.wz = p.start.wz + (p.target.wz - p.start.wz) * t;
    }

    const trailRate = p.kind === 'meteor' ? 0.015 : 0.03;
    if (p.trailTimer >= trailRate) {
      p.trailTimer = 0;
      spawnFireTrail(p.pos);
      if (p.kind === 'meteor') {
        spawnFireTrail(p.pos);
        if (Math.random() < 0.5) {
          state.particles.push({
            kind: 'smoke',
            pos: { ...p.pos },
            vel: { x: (Math.random()-0.5)*0.5, y: (Math.random()-0.5)*0.5, z: 0.5 },
            timer: 0, lifetime: 1.0 + Math.random() * 0.5,
            size: 4 + Math.random() * 3,
          });
        }
      }
    }

    if (t >= 1) {
      if (p.kind === 'fireball') explodeFireball(p.target.wx, p.target.wy);
      else if (p.kind === 'meteor') explodeMeteor(p.target.wx, p.target.wy);
      state.projectiles.splice(i, 1);
    }
  }
}

function explodeFireball(wx, wy) {
  spawnFireBurst({ wx, wy, wz: 0.1 }, 30);
  spawnSmokeBurst({ wx, wy, wz: 0.3 }, 1.2);
  for (const npc of state.npcs) {
    if (!isAlive(npc)) continue;
    const d = Math.hypot(npc.pos.wx - wx, npc.pos.wy - wy);
    if (d < CONFIG.FIREBALL_AOE) ignite(npc);
  }
  triggerScreenShake(6, 0.35);
  playExplosionSound();
}

function explodeMeteor(wx, wy) {
  spawnFireBurst({ wx, wy, wz: 0.1 }, 60);
  spawnSmokeBurst({ wx, wy, wz: 0.3 }, 2.5);
  // outward dust ring
  for (let i = 0; i < 30; i++) {
    const ang = (i / 30) * Math.PI * 2;
    state.particles.push({
      kind: 'dust',
      pos: { wx, wy, wz: 0.1 },
      vel: {
        x: Math.cos(ang) * (3 + Math.random() * 2),
        y: Math.sin(ang) * (3 + Math.random() * 2) * 0.6,
        z: 1 + Math.random() * 1.5,
      },
      lifetime: 0.8 + Math.random() * 0.4,
      timer: 0,
      size: 3 + Math.random() * 2,
    });
  }

  for (const npc of state.npcs) {
    if (!isAlive(npc)) continue;
    const d = Math.hypot(npc.pos.wx - wx, npc.pos.wy - wy);
    if (d < CONFIG.METEOR_AOE) {
      // mass kill — high intensity boosts critical odds visually
      kill(npc, 1.4);
    }
  }

  addCraterDecal({ wx, wy }, CONFIG.METEOR_AOE);
  triggerScreenShake(12, 0.5);
  playMeteorImpact();
}

function drawProjectile(p) {
  const ctx = state.ctx;
  const { sx, sy } = worldToScreen(p.pos.wx, p.pos.wy, p.pos.wz);
  ctx.save();
  if (p.kind === 'fireball') {
    ctx.shadowColor = '#FF8C00';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#FFC04D';
    ctx.beginPath(); ctx.arc(sx, sy, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FF4500';
    ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.fill();
  } else if (p.kind === 'meteor') {
    ctx.shadowColor = '#FF6347';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#FFA040';
    ctx.beginPath(); ctx.arc(sx, sy, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FF6347';
    ctx.beginPath(); ctx.arc(sx, sy, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#FFFF80';
    ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function updateLightningBolts(dt) {
  for (let i = state.lightningBolts.length - 1; i >= 0; i--) {
    state.lightningBolts[i].timer += dt;
    if (state.lightningBolts[i].timer >= state.lightningBolts[i].lifetime) {
      state.lightningBolts.splice(i, 1);
    }
  }
}

function drawLightningBolts() {
  const ctx = state.ctx;
  for (const bolt of state.lightningBolts) {
    const alpha = 1 - bolt.timer / bolt.lifetime;
    ctx.save();
    ctx.shadowColor = '#FFE066';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = `rgba(255, 240, 130, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (const [a, b] of bolt.segments) {
      const sa = worldToScreen(a.wx, a.wy, a.wz);
      const sb = worldToScreen(b.wx, b.wy, b.wz);
      ctx.moveTo(sa.sx, sa.sy);
      ctx.lineTo(sb.sx, sb.sy);
    }
    ctx.stroke();
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }
}

// ---------- Particles ----------
function spawnDust(worldPos, intensity = 0.5) {
  const count = 4 + Math.floor(intensity * 8);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.6 + Math.random() * 1.4 * (0.5 + intensity);
    state.particles.push({
      kind: 'dust',
      pos: { wx: worldPos.wx, wy: worldPos.wy, wz: 0.05 },
      vel: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed * 0.6,
        z: 0.8 + Math.random() * 1.5,
      },
      lifetime: 0.5 + Math.random() * 0.3,
      timer: 0,
      size: 2 + Math.random() * 2,
    });
  }
}

function spawnFireBurst(worldPos, count = 20) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    state.particles.push({
      kind: 'fire',
      pos: { wx: worldPos.wx, wy: worldPos.wy, wz: worldPos.wz || 0.1 },
      vel: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed * 0.6,
        z: 1 + Math.random() * 2.5,
      },
      lifetime: 0.5 + Math.random() * 0.5,
      timer: 0,
      size: 3 + Math.random() * 4,
    });
  }
}

function spawnFireParticle(worldPos) {
  state.particles.push({
    kind: 'fire',
    pos: { wx: worldPos.wx, wy: worldPos.wy, wz: 0.4 + Math.random() * 0.4 },
    vel: {
      x: (Math.random() - 0.5) * 0.4,
      y: (Math.random() - 0.5) * 0.4,
      z: 1 + Math.random() * 0.8,
    },
    lifetime: 0.4 + Math.random() * 0.3,
    timer: 0,
    size: 2 + Math.random() * 2,
  });
}

function spawnFireTrail(worldPos) {
  state.particles.push({
    kind: 'fire',
    pos: { wx: worldPos.wx, wy: worldPos.wy, wz: worldPos.wz },
    vel: { x: 0, y: 0, z: 0.3 },
    lifetime: 0.3 + Math.random() * 0.2,
    timer: 0,
    size: 3 + Math.random() * 2,
  });
}

function spawnSmokeBurst(worldPos, scale = 1) {
  const count = Math.floor(8 * scale);
  for (let i = 0; i < count; i++) {
    state.particles.push({
      kind: 'smoke',
      pos: { wx: worldPos.wx, wy: worldPos.wy, wz: worldPos.wz || 0.2 },
      vel: {
        x: (Math.random() - 0.5) * 0.6,
        y: (Math.random() - 0.5) * 0.6,
        z: 0.4 + Math.random() * 0.8,
      },
      lifetime: 1.4 + Math.random() * 1.0,
      timer: 0,
      size: 4 + Math.random() * 4,
    });
  }
}

function spawnSparks(worldPos) {
  for (let i = 0; i < 14; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3;
    state.particles.push({
      kind: 'spark',
      pos: { wx: worldPos.wx, wy: worldPos.wy, wz: 0.5 + Math.random() * 0.5 },
      vel: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed * 0.6,
        z: 1.5 + Math.random() * 1.5,
      },
      lifetime: 0.3 + Math.random() * 0.2,
      timer: 0,
      size: 1.5 + Math.random() * 1.2,
    });
  }
}

function spawnWindBurst(worldPos) {
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2 + Math.random() * 0.3;
    const speed = 2 + Math.random() * 3;
    state.particles.push({
      kind: 'wind',
      pos: { wx: worldPos.wx, wy: worldPos.wy, wz: 0.2 + Math.random() * 0.6 },
      vel: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed * 0.6,
        z: 0.2 + Math.random() * 0.5,
      },
      lifetime: 0.5 + Math.random() * 0.3,
      timer: 0,
      size: 4 + Math.random() * 3,
    });
  }
}

function spawnBloodSplatter(worldPos, intensity = 1) {
  const count = Math.floor(intensity * 22) + 12;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * intensity * 4;
    state.particles.push({
      kind: 'blood',
      pos: { wx: worldPos.wx, wy: worldPos.wy, wz: (worldPos.wz || 0) + 0.5 },
      vel: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed * 0.55,
        z: 1 + Math.random() * speed * 0.7,
      },
      lifetime: 0.7 + Math.random() * 0.6,
      timer: 0,
      size: 1.5 + Math.random() * 2,
      color: Math.random() > 0.5 ? '#CC0000' : '#880000',
      landed: false,
    });
  }
}

function spawnGiblets(worldPos, intensity = 1) {
  const count = 5 + Math.floor(intensity * 2);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * intensity * 3;
    state.particles.push({
      kind: 'gib',
      pos: { wx: worldPos.wx, wy: worldPos.wy, wz: (worldPos.wz || 0) + 0.6 },
      vel: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed * 0.55,
        z: 2 + Math.random() * 2.5,
      },
      lifetime: 1.6 + Math.random() * 0.8,
      timer: 0,
      size: 3 + Math.random() * 2.5,
      color: Math.random() > 0.5 ? '#A30000' : '#6E0000',
      spinAngle: Math.random() * Math.PI * 2,
      spinSpeed: (Math.random() - 0.5) * 14,
      bounced: false,
    });
  }
}

function spawnBodyParts(worldPos, npcColor, intensity = 1) {
  const parts = [
    { partType: 'head', size: 7,  color: '#e9c39a' },
    { partType: 'body', size: 9,  color: npcColor   },
    { partType: 'arm',  size: 6,  color: npcColor   },
    { partType: 'arm',  size: 6,  color: npcColor   },
    { partType: 'leg',  size: 8,  color: '#3a2e1f' },
    { partType: 'leg',  size: 8,  color: '#3a2e1f' },
  ];
  for (const def of parts) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2.5 + Math.random() * intensity * 3.5;
    state.particles.push({
      kind: 'bodypart',
      partType: def.partType,
      pos: { wx: worldPos.wx, wy: worldPos.wy, wz: (worldPos.wz || 0) + 0.6 },
      vel: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed * 0.55,
        z: 2.5 + Math.random() * 2.8,
      },
      lifetime: 2.5 + Math.random() * 0.6,
      timer: 0,
      size: def.size,
      color: def.color,
      spinAngle: Math.random() * Math.PI * 2,
      spinSpeed: (Math.random() - 0.5) * 14,
      bounced: false,
    });
  }
}

function updateParticles(dt) {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.timer += dt;
    if (p.timer >= p.lifetime) {
      state.particles.splice(i, 1);
      continue;
    }
    p.pos.wx += p.vel.x * dt;
    p.pos.wy += p.vel.y * dt;
    p.pos.wz += p.vel.z * dt;

    let gz = 0;
    switch (p.kind) {
      case 'dust':     gz = -6;  break;
      case 'fire':     gz = 0;   break;
      case 'smoke':    gz = 0;   break;
      case 'spark':    gz = -10; break;
      case 'wind':     gz = 0;   break;
      case 'blood':    gz = -10; break;
      case 'gib':      gz = -14; break;
      case 'bodypart': gz = -14; break;
      case 'soul':     gz =  0;  break;
    }
    p.vel.z += gz * dt;

    if (p.kind === 'soul') {
      p.vel.x *= (1 - dt * 0.8);
      p.vel.y *= (1 - dt * 0.8);
    } else if (p.kind === 'wind') {
      p.vel.x *= (1 - dt * 1.4);
      p.vel.y *= (1 - dt * 1.4);
    } else if (p.kind === 'smoke') {
      p.vel.x *= (1 - dt * 0.6);
      p.vel.y *= (1 - dt * 0.6);
    }

    if (p.kind === 'blood' && p.pos.wz <= 0 && !p.landed) {
      p.pos.wz = 0;
      p.landed = true;
      p.vel.x = 0; p.vel.y = 0; p.vel.z = 0;
      p.lifetime = Math.min(p.lifetime, p.timer + 0.12);
      if (Math.random() < 0.45) {
        addBloodDecal(p.pos, 1.5 + Math.random() * 2, 0.5);
      }
    } else if (p.kind === 'gib' || p.kind === 'bodypart') {
      p.spinAngle += p.spinSpeed * dt;
      if (p.pos.wz <= 0) {
        p.pos.wz = 0;
        if (Math.abs(p.vel.z) > 1) {
          p.vel.z *= -0.3;
          p.vel.x *= 0.5;
          p.vel.y *= 0.5;
          if (!p.bounced) {
            p.bounced = true;
            const decalSize = p.kind === 'bodypart'
              ? 4 + Math.random() * 4
              : 3 + Math.random() * 3;
            addBloodDecal(p.pos, decalSize, 0.6);
          }
        } else {
          p.vel.x = 0; p.vel.y = 0; p.vel.z = 0;
          p.spinSpeed *= 0.4;
        }
      }
    } else if (p.pos.wz < 0 && p.kind !== 'fire' && p.kind !== 'smoke') {
      p.pos.wz = 0;
    }
  }
}

function drawParticle(p) {
  const ctx = state.ctx;
  const t = p.timer / p.lifetime;
  const alpha = 1 - t;
  const { sx, sy } = worldToScreen(p.pos.wx, p.pos.wy, p.pos.wz);

  switch (p.kind) {
    case 'dust':
      ctx.fillStyle = `rgba(200, 169, 110, ${alpha * 0.7})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
      return;
    case 'fire': {
      const r = 255;
      const g = Math.max(40, Math.floor(180 - 110 * t));
      const b = Math.max(0,  Math.floor(40  - 35  * t));
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.95})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size * (1 - t * 0.4), 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    case 'smoke': {
      const gray = Math.floor(80 - 30 * t);
      ctx.fillStyle = `rgba(${gray}, ${gray}, ${gray}, ${alpha * 0.55})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size * (1 + t * 0.7), 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    case 'spark':
      ctx.fillStyle = `rgba(255, 250, 180, ${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
      return;
    case 'wind':
      ctx.fillStyle = `rgba(180, 220, 255, ${alpha * 0.55})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size * (1 + t * 0.6), 0, Math.PI * 2);
      ctx.fill();
      return;
    case 'blood': {
      const rgb = p.color === '#CC0000' ? '204,0,0' : '136,0,0';
      ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    case 'gib': {
      const lateFade = Math.max(0, (p.timer - p.lifetime * 0.7) / (p.lifetime * 0.3));
      const a = 1 - lateFade;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(p.spinAngle);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = a;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.fillStyle = 'rgba(40, 0, 0, 0.7)';
      ctx.fillRect(-p.size / 4, -p.size / 4, p.size / 2, p.size / 2);
      ctx.restore();
      return;
    }
    case 'bodypart': {
      const lateFade = Math.max(0, (p.timer - p.lifetime * 0.75) / (p.lifetime * 0.25));
      const a = 1 - lateFade;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(p.spinAngle);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      switch (p.partType) {
        case 'head':
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(20, 0, 0, 0.7)';
          ctx.beginPath();
          ctx.arc(p.size / 6, -p.size / 8, p.size / 8, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'body':
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.fillStyle = 'rgba(120, 0, 0, 0.85)';
          ctx.fillRect(-p.size / 2, p.size / 2 - 2, p.size, 2);
          break;
        case 'arm':
          ctx.fillRect(-p.size / 2, -1.5, p.size, 3);
          ctx.fillStyle = 'rgba(120, 0, 0, 0.85)';
          ctx.fillRect(-p.size / 2, -1.5, 2, 3);
          break;
        case 'leg':
          ctx.fillRect(-1.5, -p.size / 2, 3, p.size);
          ctx.fillStyle = 'rgba(120, 0, 0, 0.85)';
          ctx.fillRect(-1.5, -p.size / 2, 3, 2);
          break;
      }
      ctx.restore();
      return;
    }
    case 'soul': {
      const pulse = 1 + Math.sin(p.timer * 8) * 0.2;
      const a = (1 - t) * 0.85;
      ctx.save();
      ctx.shadowColor = '#44ff88';
      ctx.shadowBlur = 10;
      ctx.fillStyle = `rgba(100, 255, 140, ${a})`;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }
  }
}

// ---------- Decals ----------
function addBloodDecal(pos, size, opacity = 0.7) {
  const satellites = [];
  const satCount = 2 + Math.floor(Math.random() * 4);
  for (let i = 0; i < satCount; i++) {
    const ang = Math.random() * Math.PI * 2;
    const d = size * (0.4 + Math.random() * 0.9);
    satellites.push({
      dx: Math.cos(ang) * d,
      dy: Math.sin(ang) * d * 0.5,
      r: size * (0.18 + Math.random() * 0.4),
    });
  }
  state.bloodDecals.push({
    wx: pos.wx, wy: pos.wy, size, opacity, satellites,
  });
  if (state.bloodDecals.length > CONFIG.DECAL_MAX) state.bloodDecals.shift();
}

function renderBloodDecals() {
  const ctx = state.ctx;
  for (const d of state.bloodDecals) {
    const { sx, sy } = worldToScreen(d.wx, d.wy, 0);
    ctx.fillStyle = `rgba(95, 5, 5, ${d.opacity})`;
    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, d.size, d.size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const s of d.satellites) {
      ctx.beginPath();
      ctx.ellipse(sx + s.dx, sy + 2 + s.dy, s.r, s.r * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function addCraterDecal(pos, radius) {
  const cracks = [];
  const crackCount = 5 + Math.floor(Math.random() * 3);
  for (let i = 0; i < crackCount; i++) {
    const ang = (i / crackCount) * Math.PI * 2 + Math.random() * 0.5;
    cracks.push({
      angle: ang,
      length: 0.7 + Math.random() * 0.5,
    });
  }
  state.craterDecals.push({
    wx: pos.wx, wy: pos.wy, radius, cracks,
    opacity: 0.85,
  });
  if (state.craterDecals.length > 30) state.craterDecals.shift();
}

function renderCraterDecals() {
  const ctx = state.ctx;
  for (const c of state.craterDecals) {
    const { sx, sy } = worldToScreen(c.wx, c.wy, 0);
    const screenR = c.radius * CONFIG.TILE_W / 2;

    // outer scorched dirt (large soft ellipse)
    ctx.fillStyle = `rgba(40, 28, 18, ${c.opacity * 0.7})`;
    ctx.beginPath();
    ctx.ellipse(sx, sy, screenR, screenR * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // inner crater hole (darker)
    ctx.fillStyle = `rgba(15, 10, 5, ${c.opacity})`;
    ctx.beginPath();
    ctx.ellipse(sx, sy, screenR * 0.65, screenR * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // cracks (radial dark lines)
    ctx.strokeStyle = `rgba(0, 0, 0, ${c.opacity})`;
    ctx.lineWidth = 1.8;
    for (const k of c.cracks) {
      const r0 = screenR * 0.4;
      const r1 = screenR * (0.7 + k.length * 0.4);
      const x1 = sx + Math.cos(k.angle) * r0;
      const y1 = sy + Math.sin(k.angle) * r0 * 0.5;
      const x2 = sx + Math.cos(k.angle) * r1;
      const y2 = sy + Math.sin(k.angle) * r1 * 0.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // small ember dots (visual debris)
    ctx.fillStyle = `rgba(80, 40, 20, ${c.opacity * 0.8})`;
    for (let i = 0; i < 6; i++) {
      const ang = Math.random() * Math.PI * 2;
      const r = screenR * (0.5 + Math.random() * 0.5);
      ctx.beginPath();
      ctx.arc(sx + Math.cos(ang) * r, sy + Math.sin(ang) * r * 0.5, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ---------- Hover ring (pickable indicator) ----------
function drawHoverRing() {
  if (state.selectedSpell !== 'HAND' || state.hand.holding) return;
  if (!state.hand.visible) return;
  const npc = pickNPCAt(state.hand.pos.x, state.hand.pos.y);
  if (!npc) return;
  const { sx, sy } = worldToScreen(npc.pos.wx, npc.pos.wy, 0);
  const ctx = state.ctx;
  ctx.save();
  const pulse = 1 + Math.sin(performance.now() * 0.006) * 0.12;
  ctx.strokeStyle = 'rgba(255, 224, 102, 0.95)';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#ffe066';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.ellipse(sx, sy + 4, 12 * pulse, 6 * pulse, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// ---------- Screen shake ----------
function triggerScreenShake(intensity, duration = CONFIG.SHAKE_DECAY) {
  if (intensity > state.shake.intensity || state.shake.timer < duration * 0.4) {
    state.shake.intensity = intensity;
    state.shake.duration = duration;
    state.shake.timer = duration;
  }
}

function updateShake(dt) {
  if (state.shake.timer > 0) {
    state.shake.timer -= dt;
    if (state.shake.timer <= 0) {
      state.shake.timer = 0;
      state.shake.intensity = 0;
    }
  }
}

// ---------- Audio ----------
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (Ctor) audioCtx = new Ctor();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  if (audioCtx && !state.music.started) startTavernMusic();
  return audioCtx;
}

// ---------- Tavern theme music ----------
const NOTE_FREQ = {
  D2:  73.42, F2:  87.31, G2:  98.00,
  D3: 146.83, F3: 174.61, G3: 196.00,
  D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00,
  C5: 523.25, D5: 587.33,
};

// 16-beat loop in D minor — ascending lute motif, falling response, cadence.
// Format: [beatPos, noteName, durationBeats]
const TAVERN_MELODY = [
  [ 0.0, 'D4', 0.75], [ 0.75,'A4', 0.25], [ 1.0, 'F4', 0.5],  [ 1.5, 'A4', 0.5],
  [ 2.0, 'D5', 1.0],  [ 3.0, 'A4', 1.0],
  [ 4.0, 'C5', 0.5],  [ 4.5, 'A4', 0.5],  [ 5.0, 'G4', 1.0],
  [ 6.0, 'F4', 0.5],  [ 6.5, 'A4', 0.5],  [ 7.0, 'G4', 1.0],
  [ 8.0, 'F4', 0.5],  [ 8.5, 'G4', 0.5],  [ 9.0, 'A4', 1.0],
  [10.0, 'C5', 1.0],  [11.0, 'A4', 1.0],
  [12.0, 'G4', 0.5],  [12.5,'F4', 0.5],   [13.0, 'E4', 0.5],  [13.5,'D4', 0.5],
  [14.0, 'D4', 2.0],
];
const TAVERN_BASS = [
  [ 0.0, 'D3', 4.0],
  [ 4.0, 'F3', 4.0],
  [ 8.0, 'G3', 4.0],
  [12.0, 'D3', 4.0],
];
const TAVERN_BPM = 105;
const TAVERN_LOOP_BEATS = 16;
const TAVERN_VOLUME = 0.16;

function playLuteNote(freq, when, duration) {
  const ctx = audioCtx;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, when);
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(2400, when);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(0.55, when + 0.012);
  g.gain.exponentialRampToValueAtTime(0.001, when + Math.max(0.05, duration * 0.95));
  osc.connect(lp).connect(g).connect(state.music.gain);
  osc.start(when);
  osc.stop(when + duration + 0.05);
}

function playBassNote(freq, when, duration) {
  const ctx = audioCtx;
  const osc = ctx.createOscillator();
  const sub = ctx.createOscillator();
  const g = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  osc.type = 'sine';        osc.frequency.setValueAtTime(freq, when);
  sub.type = 'triangle';    sub.frequency.setValueAtTime(freq * 0.5, when);
  lp.type = 'lowpass';      lp.frequency.setValueAtTime(800, when);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(0.22, when + 0.4);
  g.gain.linearRampToValueAtTime(0.22, when + Math.max(0.5, duration - 0.4));
  g.gain.linearRampToValueAtTime(0, when + duration);
  osc.connect(lp);
  sub.connect(lp);
  lp.connect(g).connect(state.music.gain);
  osc.start(when); osc.stop(when + duration + 0.05);
  sub.start(when); sub.stop(when + duration + 0.05);
}

function startTavernMusic() {
  if (!audioCtx || state.music.started) return;
  state.music.started = true;
  state.music.gain = audioCtx.createGain();
  state.music.gain.gain.value = state.music.muted ? 0 : TAVERN_VOLUME;
  state.music.gain.connect(audioCtx.destination);
  state.music.loopStart = audioCtx.currentTime + 0.2;
  scheduleTavernLoop();
}

function scheduleTavernLoop() {
  if (!state.music.started) return;
  const beatSec = 60 / TAVERN_BPM;
  const loopT = state.music.loopStart;
  for (const [pos, note, dur] of TAVERN_MELODY) {
    playLuteNote(NOTE_FREQ[note], loopT + pos * beatSec, dur * beatSec);
  }
  for (const [pos, note, dur] of TAVERN_BASS) {
    playBassNote(NOTE_FREQ[note], loopT + pos * beatSec, dur * beatSec);
  }
  const loopDur = TAVERN_LOOP_BEATS * beatSec;
  state.music.loopStart += loopDur;
  // re-schedule slightly before the loop ends
  state.music.timer = setTimeout(scheduleTavernLoop, Math.max(100, (loopDur - 0.3) * 1000));
}

function setMusicMuted(muted) {
  state.music.muted = muted;
  if (state.music.gain) {
    state.music.gain.gain.cancelScheduledValues(audioCtx.currentTime);
    state.music.gain.gain.linearRampToValueAtTime(muted ? 0 : TAVERN_VOLUME, audioCtx.currentTime + 0.08);
  }
}

// ---------- Vocal SFX (burn scream / death grunt) ----------
// Voice is built from a sawtooth glottal source fed through two bandpass
// filters tuned to vowel formants ("ah" for the burn scream, "oh"-ish for
// the death grunt). Pitch and roughness vary by gender + age.
function voicePitch(npc, base) {
  // gender already encoded in base; elder drops a touch and adds randomness
  let f = base;
  if (npc.age === 'elder') f *= 0.92;
  // small per-shout variation so screams don't repeat verbatim
  return f * (0.95 + Math.random() * 0.1);
}

function playBurnScream(npc) {
  const ctx = ensureAudio(); if (!ctx) return;
  const now = ctx.currentTime;
  const dur = 0.85 + Math.random() * 0.2;

  const baseFemale = 340, baseMale = 200;
  const base = npc.gender === 'female' ? baseFemale : baseMale;
  const freq = voicePitch(npc, base);

  // glottal source
  const src = ctx.createOscillator();
  src.type = 'sawtooth';
  src.frequency.setValueAtTime(freq, now);
  // slight upward slide as panic rises
  src.frequency.linearRampToValueAtTime(freq * 1.10, now + dur * 0.7);

  // vibrato (panic wobble)
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.type = 'sine';
  lfo.frequency.value = 6 + Math.random() * 2.5;
  lfoGain.gain.value = freq * (npc.age === 'elder' ? 0.06 : 0.04);
  lfo.connect(lfoGain).connect(src.frequency);

  // "ah" vowel formants
  const f1 = ctx.createBiquadFilter();
  f1.type = 'bandpass'; f1.frequency.value = 700; f1.Q.value = 5;
  const f2 = ctx.createBiquadFilter();
  f2.type = 'bandpass'; f2.frequency.value = 1100; f2.Q.value = 5;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.32, now + 0.05);
  g.gain.linearRampToValueAtTime(0.28, now + dur * 0.65);
  g.gain.linearRampToValueAtTime(0, now + dur);

  src.connect(f1); src.connect(f2);
  f1.connect(g); f2.connect(g);
  g.connect(ctx.destination);

  src.start(now); src.stop(now + dur + 0.05);
  lfo.start(now); lfo.stop(now + dur + 0.05);
}

function playDeathGrunt(npc) {
  const ctx = ensureAudio(); if (!ctx) return;
  const now = ctx.currentTime;
  const dur = 0.38 + Math.random() * 0.08;

  const baseFemale = 260, baseMale = 150;
  const base = npc.gender === 'female' ? baseFemale : baseMale;
  const startF = base * (0.95 + Math.random() * 0.1);
  const endF   = startF * 0.55;

  const src = ctx.createOscillator();
  src.type = 'square';
  src.frequency.setValueAtTime(startF, now);
  src.frequency.exponentialRampToValueAtTime(Math.max(40, endF), now + dur);

  // "oh"-ish vowel formants (lower than scream)
  const f1 = ctx.createBiquadFilter();
  f1.type = 'bandpass'; f1.frequency.value = 400; f1.Q.value = 4;
  const f2 = ctx.createBiquadFilter();
  f2.type = 'bandpass'; f2.frequency.value = 800; f2.Q.value = 4;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.38, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);

  src.connect(f1); src.connect(f2);
  f1.connect(g); f2.connect(g);
  g.connect(ctx.destination);

  src.start(now); src.stop(now + dur + 0.05);
}

function playThud(intensity = 0.5) {
  const ctx = ensureAudio(); if (!ctx) return;
  const now = ctx.currentTime;
  const vol = 0.15 + 0.35 * intensity;

  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);
  oscGain.gain.setValueAtTime(vol, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc.connect(oscGain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.25);

  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.025));
  }
  const src = ctx.createBufferSource();
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = vol * 0.5;
  src.buffer = noiseBuf;
  src.connect(noiseGain).connect(ctx.destination);
  src.start(now);
}

function playFireballSound() {
  const ctx = ensureAudio(); if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(700, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.45);
  g.gain.setValueAtTime(0.18, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  osc.connect(g).connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.5);
}

function playExplosionSound() {
  const ctx = ensureAudio(); if (!ctx) return;
  const now = ctx.currentTime;

  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.18));
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 700;
  const ng = ctx.createGain();
  ng.gain.value = 0.5;
  src.connect(lp).connect(ng).connect(ctx.destination);
  src.start(now);

  const osc = ctx.createOscillator();
  const og = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(85, now);
  osc.frequency.exponentialRampToValueAtTime(28, now + 0.3);
  og.gain.setValueAtTime(0.55, now);
  og.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
  osc.connect(og).connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.5);
}

function playLightningSound() {
  const ctx = ensureAudio(); if (!ctx) return;
  const now = ctx.currentTime;
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 1500;
  const g = ctx.createGain();
  g.gain.value = 0.45;
  src.connect(hp).connect(g).connect(ctx.destination);
  src.start(now);
}

function playWindSound() {
  const ctx = ensureAudio(); if (!ctx) return;
  const now = ctx.currentTime;
  const dur = 0.55;
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const env = Math.exp(-Math.abs(i - d.length / 2) / (ctx.sampleRate * 0.2));
    d[i] = (Math.random() * 2 - 1) * env;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 700;
  bp.Q.value = 0.6;
  const g = ctx.createGain();
  g.gain.value = 0.32;
  src.connect(bp).connect(g).connect(ctx.destination);
  src.start(now);
}

function playSplatSound(intensity = 1) {
  const ctx = ensureAudio(); if (!ctx) return;
  const now = ctx.currentTime;
  const vol = 0.25 + 0.25 * intensity;

  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.18, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 900;
  const ng = ctx.createGain();
  ng.gain.value = vol;
  src.connect(lp).connect(ng).connect(ctx.destination);
  src.start(now);

  const osc = ctx.createOscillator();
  const og = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(105, now);
  osc.frequency.exponentialRampToValueAtTime(32, now + 0.15);
  og.gain.setValueAtTime(vol * 0.8, now);
  og.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  osc.connect(og).connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.2);
}

function playMeteorWhoosh() {
  const ctx = ensureAudio(); if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(900, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.55);
  g.gain.setValueAtTime(0.22, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  osc.connect(g).connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.6);
}

function playMeteorImpact() {
  const ctx = ensureAudio(); if (!ctx) return;
  const now = ctx.currentTime;

  // long noise tail
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.7, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.3));
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 500;
  const ng = ctx.createGain();
  ng.gain.value = 0.7;
  src.connect(lp).connect(ng).connect(ctx.destination);
  src.start(now);

  // deep sub-bass thump
  const osc = ctx.createOscillator();
  const og = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(60, now);
  osc.frequency.exponentialRampToValueAtTime(20, now + 0.5);
  og.gain.setValueAtTime(0.85, now);
  og.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
  osc.connect(og).connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.75);
}

function playNecromancerSound() {
  const ctx = ensureAudio(); if (!ctx) return;
  const now = ctx.currentTime;

  // low organ drone (root + fifth)
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const g = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.value = 55;
  osc2.type = 'sine';
  osc2.frequency.value = 82.5;
  g.gain.setValueAtTime(0.001, now);
  g.gain.linearRampToValueAtTime(0.28, now + 0.25);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
  osc1.connect(g); osc2.connect(g); g.connect(ctx.destination);
  osc1.start(now); osc1.stop(now + 1.0);
  osc2.start(now); osc2.stop(now + 1.0);

  // eerie noise swell
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.55, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const t = i / d.length;
    d[i] = (Math.random() * 2 - 1) * t * (1 - t) * 4;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(350, now);
  bp.frequency.linearRampToValueAtTime(180, now + 0.55);
  bp.Q.value = 2.5;
  const ng = ctx.createGain();
  ng.gain.value = 0.38;
  src.connect(bp).connect(ng).connect(ctx.destination);
  src.start(now);
}

// ---------- Render ----------
function render() {
  const ctx = state.ctx;
  ctx.fillStyle = '#0e0a07';
  ctx.fillRect(0, 0, state.width, state.height);

  let shakeX = 0, shakeY = 0;
  if (state.shake.timer > 0 && state.shake.duration > 0) {
    const fade = state.shake.timer / state.shake.duration;
    const i = state.shake.intensity * fade;
    shakeX = (Math.random() - 0.5) * 2 * i;
    shakeY = (Math.random() - 0.5) * 2 * i;
  }

  ctx.save();
  ctx.translate(shakeX, shakeY);

  renderTiles();
  renderBloodDecals();
  renderCraterDecals();
  drawHoverRing();

  const drawables = [];
  const occludedNPCs = [];
  for (const npc of state.npcs) {
    if (npc.state === 'DEAD') continue;
    const occluder = buildingOccluding(npc);
    if (occluder) {
      // force NPC depth behind the occluding building
      drawables.push({ depth: occluder.wx + occluder.wy - 0.01, kind: 'npc', ref: npc });
      occludedNPCs.push(npc);
    } else {
      drawables.push({ depth: npc.pos.wx + npc.pos.wy, kind: 'npc', ref: npc });
    }
  }
  for (const p of state.particles) {
    drawables.push({ depth: p.pos.wx + p.pos.wy + 0.05, kind: 'particle', ref: p });
  }
  for (const pr of state.projectiles) {
    drawables.push({ depth: pr.pos.wx + pr.pos.wy + 0.1, kind: 'projectile', ref: pr });
  }
  for (const b of state.buildings) {
    // use back corner so anything in front (higher wx+wy) renders on top
    drawables.push({ depth: b.wx + b.wy, kind: 'building', ref: b });
  }
  for (const t of state.trees) {
    drawables.push({ depth: t.wx + t.wy + 0.05, kind: 'tree', ref: t });
  }
  drawables.sort((a, b) => a.depth - b.depth);
  for (const d of drawables) {
    if (d.kind === 'npc') drawNPC(d.ref);
    else if (d.kind === 'particle') drawParticle(d.ref);
    else if (d.kind === 'projectile') drawProjectile(d.ref);
    else if (d.kind === 'building') drawBuilding(d.ref);
    else if (d.kind === 'tree') drawTree(d.ref);
  }

  // white silhouettes for NPCs occluded by buildings — drawn on top of everything
  for (const npc of occludedNPCs) drawNPCOccludedSilhouette(npc);

  drawLightningBolts();
  drawNecroCasts();
  ctx.restore();

  drawNecroTargets();
  drawMinimap();
  drawHand();
}

// ---------- Minimap ----------
const MINIMAP = { size: 160, pad: 12 };

function drawMinimap() {
  const ctx = state.ctx;
  const N = CONFIG.MAP_SIZE;
  const SIZE = MINIMAP.size;
  const cell = SIZE / N;
  const x0 = MINIMAP.pad;
  const y0 = state.height - SIZE - MINIMAP.pad;

  ctx.save();

  // panel
  ctx.fillStyle = 'rgba(20, 14, 6, 0.85)';
  ctx.fillRect(x0 - 4, y0 - 4, SIZE + 8, SIZE + 8);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x0 - 4, y0 - 4, SIZE + 8, SIZE + 8);

  // ground + center cross path
  ctx.fillStyle = '#3a6b2a';
  ctx.fillRect(x0, y0, SIZE, SIZE);
  const mid = Math.floor(N / 2);
  ctx.fillStyle = '#8a7a5c';
  ctx.fillRect(x0 + mid * cell, y0, cell, SIZE);
  ctx.fillRect(x0, y0 + mid * cell, SIZE, cell);

  // buildings
  ctx.fillStyle = '#a07e35';
  for (const b of state.buildings) {
    ctx.fillRect(x0 + b.wx * cell, y0 + b.wy * cell, b.w * cell, b.h * cell);
  }

  // trees
  ctx.fillStyle = '#1e4a1e';
  for (const t of state.trees) {
    ctx.fillRect(x0 + t.wx * cell - 1, y0 + t.wy * cell - 1, 2, 2);
  }

  // NPCs
  for (const npc of state.npcs) {
    if (npc.state === 'DEAD') continue;
    const isZombie = npc.state === 'ZOMBIE' || npc.isZombieType;
    let dotColor;
    if (isZombie)                       dotColor = '#88ff88';
    else if (npc.state === 'CORPSE')    dotColor = '#5a3a3a';
    else if (npc.state === 'ON_FIRE')   dotColor = '#ff8830';
    else                                dotColor = npc.color || '#ddd';
    ctx.fillStyle = dotColor;
    ctx.fillRect(x0 + npc.pos.wx * cell - 1, y0 + npc.pos.wy * cell - 1, 2, 2);
  }

  // viewport polygon — canvas corners projected back to world, clipped to panel
  const corners = [
    screenToWorld(0, 0),
    screenToWorld(state.width, 0),
    screenToWorld(state.width, state.height),
    screenToWorld(0, state.height),
  ];
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, SIZE, SIZE);
  ctx.clip();
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const c = corners[i];
    const px = x0 + c.wx * cell;
    const py = y0 + c.wy * cell;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

// ---------- Loop ----------
function loop(now) {
  const dt = Math.min(0.05, (now - state.lastTime) / 1000 || 0);
  state.lastTime = now;

  for (const npc of state.npcs) updateNPC(npc, dt);
  updateHand(dt);
  updateProjectiles(dt);
  updateLightningBolts(dt);
  updateParticles(dt);
  updateShake(dt);
  updateRespawn(dt);
  updateNecroCasts(dt);

  state.npcs.sort((a, b) => (a.pos.wx + a.pos.wy) - (b.pos.wx + b.pos.wy));

  render();

  let alive = 0, zombies = 0;
  for (const n of state.npcs) {
    if (n.state === 'ZOMBIE') zombies++;
    else if (n.state !== 'DEAD' && n.state !== 'CORPSE') alive++;
  }
  const hudText = zombies > 0
    ? `${alive} Alive · ${state.totalDeaths} Killed · ${zombies} Zombies`
    : `${alive} Alive · ${state.totalDeaths} Killed`;
  document.getElementById('hud-villagers').textContent = hudText;

  requestAnimationFrame(loop);
}

// ---------- Resize / init ----------
function resize() {
  state.dpr = window.devicePixelRatio || 1;
  state.width = window.innerWidth;
  state.height = window.innerHeight;
  state.canvas.width = state.width * state.dpr;
  state.canvas.height = state.height * state.dpr;
  state.canvas.style.width = state.width + 'px';
  state.canvas.style.height = state.height + 'px';
  state.ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  state.originX = state.width / 2;
  state.originY = state.height / 2 - (CONFIG.MAP_SIZE * CONFIG.TILE_H) / 4;
}

function init() {
  state.canvas = document.getElementById('game');
  state.ctx = state.canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  state.canvas.addEventListener('mousedown', onMouseDown);
  state.canvas.addEventListener('mousemove', onMouseMove);
  state.canvas.addEventListener('mouseup', onMouseUp);
  state.canvas.addEventListener('mouseleave', onMouseLeave);

  document.querySelectorAll('.spell-slot').forEach(s => {
    s.addEventListener('click', () => { ensureAudio(); selectSpell(s.dataset.spell); });
  });

  const KEY_MAP = { '1': 'HAND', '2': 'FIREBALL', '3': 'LIGHTNING', '4': 'WIND', '5': 'METEOR', '6': 'NECROMANCER' };
  window.addEventListener('keydown', (e) => {
    if (KEY_MAP[e.key]) { ensureAudio(); selectSpell(KEY_MAP[e.key]); }
  });

  // NPC settings panel (hamburger button on HUD opens/closes it)
  state.filters = {
    classes: new Set(CLASSES),
    races:   new Set(RACES),
    genders: new Set(GENDERS),
    ages:    new Set(AGES),
  };

  const slider = document.getElementById('npc-slider');
  const sliderLabel = document.getElementById('npc-slider-label');
  state.targetCount = CONFIG.NPC_COUNT;
  slider.value = state.targetCount;
  sliderLabel.textContent = state.targetCount;
  slider.addEventListener('input', () => {
    state.targetCount = parseInt(slider.value, 10);
    sliderLabel.textContent = slider.value;
  });

  const settingsToggle = document.getElementById('settings-toggle');
  const settingsPanel  = document.getElementById('settings-panel');
  settingsToggle.addEventListener('click', () => {
    settingsPanel.hidden = !settingsPanel.hidden;
  });

  document.querySelectorAll('#settings-panel .filter-group').forEach(group => {
    const key = group.dataset.filter;
    group.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) state.filters[key].add(cb.value);
        else            state.filters[key].delete(cb.value);
      });
    });
  });

  // Info panel toggle
  const infoToggle = document.getElementById('info-toggle');
  const infoPanel = document.getElementById('info-panel');
  infoToggle.addEventListener('click', () => {
    infoPanel.hidden = !infoPanel.hidden;
  });

  // Mute toggle
  const muteToggle = document.getElementById('mute-toggle');
  muteToggle.addEventListener('click', () => {
    ensureAudio();
    setMusicMuted(!state.music.muted);
    muteToggle.textContent = state.music.muted ? '🔇' : '🔊';
    muteToggle.classList.toggle('muted', state.music.muted);
  });

  initTiles();
  initBuildings();
  initTrees();
  spawnNPCs();

  state.lastTime = performance.now();
  requestAnimationFrame(loop);
}

init();
