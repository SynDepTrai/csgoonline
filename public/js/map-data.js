// CS:GO Tactical Map ("DE_DUST2"), Full Arsenal, Attachable Optics/Scopes, Economy & Physics

export const TICK_RATE = 32;
export const SNAPSHOT_RATE = 22;

export const PLAYER_RADIUS = 0.52;
export const PLAYER_HEIGHT = 1.82;
export const EYE_HEIGHT = 1.62;
export const CROUCH_EYE_HEIGHT = 1.08;

export const BASE_MOVE_SPEED = 7.4;
export const WALK_SPEED = 3.95;
export const CROUCH_SPEED = 3.25;
export const JUMP_FORCE = 9.1;
export const GRAVITY = 25.0;

// Attachable Scopes / Optics (Purchasable in [B] Buy Menu & mountable on guns!)
export const SCOPE_ITEMS = {
  iron: {
    id: 'iron',
    name: 'Tâm Cơ Bản (1.35x)',
    shortName: 'Cơ bản 1.35x',
    price: 0,
    fov1: 56,
    fov2: null,
    spreadMult: 0.68,
    recoilMult: 0.82,
    reticle: 'iron',
    desc: 'Ngắm chuẩn cơ bản khi bấm Chuột phải'
  },
  reddot: {
    id: 'reddot',
    name: 'Red-Dot Sight (1.5x)',
    shortName: 'Red-Dot 1.5x',
    price: 300,
    fov1: 50,
    fov2: null,
    spreadMult: 0.52,
    recoilMult: 0.72,
    reticle: 'reddot',
    desc: 'Kính ngắm chấm đỏ thoáng rộng, sấy AK/M4 cực êm'
  },
  holo: {
    id: 'holo',
    name: 'Holographic EOTech (1.7x)',
    shortName: 'Holo 1.7x',
    price: 450,
    fov1: 46,
    fov2: null,
    spreadMult: 0.48,
    recoilMult: 0.68,
    reticle: 'holo',
    desc: 'Tâm quang học vòng tròn + chấm chuẩn đặc nhiệm'
  },
  acog4x: {
    id: 'acog4x',
    name: 'ACOG 4x Tactical',
    shortName: 'ACOG 4x',
    price: 650,
    fov1: 32,
    fov2: null,
    spreadMult: 0.3,
    recoilMult: 0.62,
    reticle: 'acog',
    desc: 'Ống ngắm 4x chữ V phát sáng chuyên tap xa'
  },
  sniper8x: {
    id: 'sniper8x',
    name: 'Sniper 8x Mil-Dot (2 Nấc)',
    shortName: 'Sniper 8x',
    price: 900,
    fov1: 26,
    fov2: 12,
    spreadMult: 0.08,
    recoilMult: 0.6,
    reticle: 'sniper',
    desc: 'Ống ngắm bắn tỉa 2 nấc phóng đại 4x & 8x chuẩn AWP'
  },
  thermal: {
    id: 'thermal',
    name: 'Thermal Night-Scope (6x)',
    shortName: 'Thermal 6x',
    price: 1100,
    fov1: 22,
    fov2: 11,
    spreadMult: 0.12,
    recoilMult: 0.6,
    reticle: 'thermal',
    desc: 'Ống ngắm quang ảnh nhiệt xanh lục tương phản cao, 2 nấc Zoom'
  }
};

export const WEAPONS = {
  // === PISTOLS (SLOT 2) ===
  usp: {
    id: 'usp',
    slotType: 'secondary',
    category: 'pistols',
    name: 'USP-S',
    labelVi: 'USP-S Giảm Thanh',
    defaultOptic: 'reddot',
    price: 200,
    killReward: 300,
    damage: 34,
    headshotMult: 3.0,
    fireRate: 0.17,
    auto: false,
    magSize: 12,
    reserveAmmo: 36,
    reloadTime: 1.75,
    baseSpread: 0.003,
    moveSpread: 0.022,
    adsSpread: 0.0015,
    pellets: 1,
    range: 130,
    speedMult: 1.04,
    recoilPitch: 0.026,
    recoilYaw: 0.006,
    isMelee: false
  },
  glock: {
    id: 'glock',
    slotType: 'secondary',
    category: 'pistols',
    name: 'Glock-18',
    labelVi: 'Glock-18',
    defaultOptic: 'reddot',
    price: 200,
    killReward: 300,
    damage: 28,
    headshotMult: 2.9,
    fireRate: 0.14,
    auto: false,
    magSize: 20,
    reserveAmmo: 120,
    reloadTime: 1.7,
    baseSpread: 0.005,
    moveSpread: 0.018,
    adsSpread: 0.0025,
    pellets: 1,
    range: 120,
    speedMult: 1.05,
    recoilPitch: 0.021,
    recoilYaw: 0.007,
    isMelee: false
  },
  deagle: {
    id: 'deagle',
    slotType: 'secondary',
    category: 'pistols',
    name: 'Desert Eagle',
    labelVi: 'Desert Eagle',
    defaultOptic: 'reddot',
    price: 700,
    killReward: 300,
    damage: 53,
    headshotMult: 2.75,
    fireRate: 0.27,
    auto: false,
    magSize: 7,
    reserveAmmo: 35,
    reloadTime: 1.9,
    baseSpread: 0.0038,
    moveSpread: 0.048,
    adsSpread: 0.0015,
    pellets: 1,
    range: 145,
    speedMult: 1.0,
    recoilPitch: 0.064,
    recoilYaw: 0.014,
    isMelee: false
  },

  // === SMGs & SHOTGUNS (SLOT 1) ===
  mp9: {
    id: 'mp9',
    slotType: 'primary',
    category: 'smgs',
    name: 'MP9',
    labelVi: 'Tiểu liên MP9',
    defaultOptic: 'reddot',
    price: 1250,
    killReward: 600,
    damage: 24,
    headshotMult: 2.4,
    fireRate: 0.072,
    auto: true,
    magSize: 30,
    reserveAmmo: 120,
    reloadTime: 1.65,
    baseSpread: 0.009,
    moveSpread: 0.016,
    adsSpread: 0.0045,
    pellets: 1,
    range: 105,
    speedMult: 1.04,
    recoilPitch: 0.016,
    recoilYaw: 0.008,
    isMelee: false
  },
  p90: {
    id: 'p90',
    slotType: 'primary',
    category: 'smgs',
    name: 'P90',
    labelVi: 'Tiểu liên P90',
    defaultOptic: 'holo',
    price: 2350,
    killReward: 300,
    damage: 25,
    headshotMult: 2.35,
    fireRate: 0.074,
    auto: true,
    magSize: 50,
    reserveAmmo: 100,
    reloadTime: 2.2,
    baseSpread: 0.011,
    moveSpread: 0.018,
    adsSpread: 0.005,
    pellets: 1,
    range: 110,
    speedMult: 1.0,
    recoilPitch: 0.017,
    recoilYaw: 0.009,
    isMelee: false
  },
  xm1014: {
    id: 'xm1014',
    slotType: 'primary',
    category: 'heavy',
    name: 'XM1014',
    labelVi: 'Shotgun XM1014',
    defaultOptic: 'holo',
    price: 2000,
    killReward: 900,
    damage: 18,
    headshotMult: 1.8,
    fireRate: 0.36,
    auto: true,
    magSize: 7,
    reserveAmmo: 32,
    reloadTime: 2.1,
    baseSpread: 0.055,
    moveSpread: 0.015,
    adsSpread: 0.038,
    pellets: 7,
    range: 58,
    speedMult: 0.96,
    recoilPitch: 0.048,
    recoilYaw: 0.012,
    isMelee: false
  },

  // === RIFLES & SNIPERS (SLOT 1) ===
  ak47: {
    id: 'ak47',
    slotType: 'primary',
    category: 'rifles',
    name: 'AK-47',
    labelVi: 'AK-47',
    defaultOptic: 'reddot',
    price: 2700,
    killReward: 300,
    damage: 36,
    headshotMult: 3.05,
    fireRate: 0.1,
    auto: true,
    magSize: 30,
    reserveAmmo: 90,
    reloadTime: 2.1,
    baseSpread: 0.0032,
    moveSpread: 0.048,
    adsSpread: 0.0014,
    pellets: 1,
    range: 180,
    speedMult: 0.95,
    recoilPitch: 0.028,
    recoilYaw: 0.011,
    isMelee: false
  },
  m4a1s: {
    id: 'm4a1s',
    slotType: 'primary',
    category: 'rifles',
    name: 'M4A1-S',
    labelVi: 'M4A1-S Giảm Thanh',
    defaultOptic: 'holo',
    price: 2900,
    killReward: 300,
    damage: 32,
    headshotMult: 2.9,
    fireRate: 0.095,
    auto: true,
    magSize: 25,
    reserveAmmo: 75,
    reloadTime: 1.95,
    baseSpread: 0.0018,
    moveSpread: 0.032,
    adsSpread: 0.0009,
    pellets: 1,
    range: 180,
    speedMult: 0.97,
    recoilPitch: 0.018,
    recoilYaw: 0.007,
    isMelee: false
  },
  aug: {
    id: 'aug',
    slotType: 'primary',
    category: 'rifles',
    name: 'AUG',
    labelVi: 'AUG Ống Ngắm 4x',
    defaultOptic: 'acog4x',
    price: 3300,
    killReward: 300,
    damage: 31,
    headshotMult: 3.15,
    fireRate: 0.096,
    auto: true,
    magSize: 30,
    reserveAmmo: 90,
    reloadTime: 2.25,
    baseSpread: 0.0028,
    moveSpread: 0.038,
    adsSpread: 0.0006,
    pellets: 1,
    range: 190,
    speedMult: 0.94,
    recoilPitch: 0.016,
    recoilYaw: 0.006,
    isMelee: false
  },
  ssg08: {
    id: 'ssg08',
    slotType: 'primary',
    category: 'snipers',
    name: 'SSG 08',
    labelVi: 'SSG 08 (Scout)',
    defaultOptic: 'sniper8x',
    price: 1700,
    killReward: 300,
    damage: 78,
    headshotMult: 3.4,
    fireRate: 1.02,
    auto: false,
    magSize: 10,
    reserveAmmo: 90,
    reloadTime: 2.1,
    baseSpread: 0.022,
    moveSpread: 0.025,
    adsSpread: 0.0002,
    pellets: 1,
    range: 240,
    speedMult: 1.02,
    recoilPitch: 0.055,
    recoilYaw: 0.008,
    isMelee: false
  },
  awp: {
    id: 'awp',
    slotType: 'primary',
    category: 'snipers',
    name: 'AWP',
    labelVi: 'AWP Sniper',
    defaultOptic: 'sniper8x',
    price: 4750,
    killReward: 100,
    damage: 115,
    headshotMult: 3.9,
    fireRate: 1.28,
    auto: false,
    magSize: 5,
    reserveAmmo: 30,
    reloadTime: 2.6,
    baseSpread: 0.058,
    moveSpread: 0.088,
    adsSpread: 0.0002,
    pellets: 1,
    range: 260,
    speedMult: 0.85,
    recoilPitch: 0.085,
    recoilYaw: 0.015,
    isMelee: false
  },

  // === MELEE KNIFE (SLOT 3) ===
  knife: {
    id: 'knife',
    slotType: 'melee',
    category: 'melee',
    name: 'Karambit | Fade',
    labelVi: 'Dao Karambit',
    defaultOptic: 'none',
    price: 0,
    killReward: 1500,
    damage: 55,
    heavyDamage: 100,
    headshotMult: 1.35,
    fireRate: 0.42,
    auto: false,
    magSize: 0,
    reserveAmmo: 0,
    reloadTime: 0,
    baseSpread: 0,
    moveSpread: 0,
    adsSpread: 0,
    pellets: 1,
    range: 3.15,
    speedMult: 1.18,
    recoilPitch: 0,
    recoilYaw: 0,
    isMelee: true
  }
};

export const BUY_CATEGORIES = [
  { id: 'pistols', title: '1. SÚNG LỤC (PISTOLS)', items: ['usp', 'glock', 'deagle'] },
  { id: 'smgs', title: '2. TIỂU LIÊN & SHOTGUN', items: ['mp9', 'p90', 'xm1014'] },
  { id: 'rifles', title: '3. SÚNG TRƯỜNG (RIFLES)', items: ['ak47', 'm4a1s', 'aug'] },
  { id: 'snipers', title: '4. SÚNG NGẮM (SNIPERS)', items: ['ssg08', 'awp'] }
];

export const GEAR_ITEMS = {
  kevlar: { id: 'kevlar', name: 'Kevlar + Mũ Chống Đạn', price: 1000, desc: 'Phục hồi 100 Giáp + Mũ giảm sát thương đạn' },
  medishot: { id: 'medishot', name: 'Kim Tiêm Medi-Shot (+55 HP)', price: 500, desc: 'Hồi ngay 55 Máu khi bấm phím [4] hoặc [X]' }
};

export const SKIN_COLORS = [
  0x47648c,
  0xc9965b,
  0x4d6b53,
  0x8c4a3e,
  0x3b4d63,
  0xa88454
];

export const ARENA_HALF = 38;

export const MAP_BOXES = [
  { x: 0, y: 0, z: -38.5, w: 78, h: 8.5, d: 1.2, type: 'sandstone_wall' },
  { x: 0, y: 0, z: 38.5, w: 78, h: 8.5, d: 1.2, type: 'sandstone_wall' },
  { x: -38.5, y: 0, z: 0, w: 1.2, h: 8.5, d: 78, type: 'sandstone_wall' },
  { x: 38.5, y: 0, z: 0, w: 1.2, h: 8.5, d: 78, type: 'sandstone_wall' },

  // Mid Double Doors
  { x: -6.8, y: 0, z: -8, w: 8.4, h: 4.8, d: 1.3, type: 'stucco_wall' },
  { x: 6.8, y: 0, z: -8, w: 8.4, h: 4.8, d: 1.3, type: 'stucco_wall' },
  { x: 0, y: 3.6, z: -8, w: 5.2, h: 1.2, d: 1.35, type: 'stucco_wall' },
  { x: -1.55, y: 0, z: -8.15, w: 2.1, h: 3.6, d: 0.24, type: 'blue_door' },
  { x: 1.55, y: 0, z: -8.15, w: 2.1, h: 3.6, d: 0.24, type: 'blue_door' },

  // Xbox
  { x: 3.6, y: 0, z: -4.8, w: 2.2, h: 1.65, d: 2.2, type: 'wood_crate' },
  { x: 3.6, y: 0, z: -2.9, w: 1.8, h: 0.85, d: 1.4, type: 'stone_block' },

  // Top-Mid
  { x: -2.8, y: 0, z: 18.5, w: 2.1, h: 1.9, d: 2.1, type: 'ammo_crate' },
  { x: 4.5, y: 0, z: 14.0, w: 1.5, h: 3.2, d: 1.5, type: 'sandstone_pillar' },

  // Catwalk
  { x: 11.5, y: 0, z: -5.2, w: 13.5, h: 2.2, d: 4.8, type: 'catwalk_stone' },
  { x: 9.2, y: 2.2, z: -3.0, w: 5.5, h: 1.05, d: 0.55, type: 'stucco_trim' },
  { x: 14.5, y: 0, z: 6.5, w: 5.0, h: 4.8, d: 12.0, type: 'stucco_building' },

  // Bombsite A
  { x: 25.0, y: 0, z: -23.0, w: 17.0, h: 2.2, d: 16.0, type: 'bombsite_platform' },
  { x: 23.5, y: 2.2, z: -22.5, w: 2.3, h: 2.1, d: 2.3, type: 'ammo_crate' },
  { x: 25.8, y: 2.2, z: -22.5, w: 2.1, h: 1.4, d: 2.1, type: 'wood_crate' },
  { x: 23.5, y: 4.3, z: -22.5, w: 1.9, h: 1.5, d: 1.9, type: 'wood_crate' },
  { x: 31.5, y: 2.2, z: -29.5, w: 3.6, h: 2.2, d: 1.2, type: 'stucco_trim' },

  // A-Long
  { x: 26.5, y: 0, z: 12.5, w: 3.4, h: 3.1, d: 7.8, type: 'blue_container' },
  { x: 33.0, y: 0, z: 2.0, w: 2.2, h: 1.8, d: 2.2, type: 'wood_crate' },
  { x: 21.5, y: 0, z: 24.0, w: 7.5, h: 4.6, d: 1.4, type: 'stucco_wall' },

  // Bombsite B & Tunnels
  { x: -18.5, y: 0, z: 6.0, w: 1.6, h: 4.8, d: 15.0, type: 'stucco_building' },
  { x: -28.5, y: 0, z: -24.0, w: 14.0, h: 1.6, d: 13.0, type: 'bombsite_platform' },
  { x: -26.5, y: 1.6, z: -23.0, w: 2.3, h: 2.1, d: 2.3, type: 'ammo_crate' },
  { x: -24.2, y: 1.6, z: -21.2, w: 2.0, h: 1.35, d: 2.0, type: 'wood_crate' },
  { x: -18.5, y: 0, z: -18.5, w: 1.4, h: 1.25, d: 6.5, type: 'stucco_trim' },
  { x: -27.5, y: 0, z: -8.5, w: 7.0, h: 4.5, d: 1.5, type: 'stucco_wall' },

  // Courtyard & CT Cover
  { x: -27.0, y: 0, z: 16.0, w: 2.4, h: 2.2, d: 2.4, type: 'wood_crate' },
  { x: -24.6, y: 0, z: 16.0, w: 2.0, h: 1.2, d: 2.0, type: 'wood_crate' },
  { x: -11.0, y: 0, z: 25.5, w: 5.5, h: 3.6, d: 1.5, type: 'stucco_wall' },
  { x: -3.5, y: 0, z: -24.5, w: 2.2, h: 1.9, d: 2.2, type: 'ammo_crate' },
  { x: 6.5, y: 0, z: -21.5, w: 6.0, h: 4.4, d: 1.4, type: 'stucco_wall' }
];

export const MAP_RAMPS = [
  { x: 18.2, z: -11.3, w: 4.6, d: 7.4, yBottom: 0, yTop: 2.2, dir: '-z' },
  { x: 28.5, z: -11.75, w: 5.8, d: 6.5, yBottom: 0, yTop: 2.2, dir: '-z' },
  { x: -28.5, z: -15.25, w: 5.0, d: 4.5, yBottom: 0, yTop: 1.6, dir: '-z' },
  { x: 4.8, z: -5.2, w: 3.6, d: 4.2, yBottom: 0, yTop: 2.2, dir: '+x' }
];

export const HEALTH_PACKS = [
  { id: 'hp1', x: 26.5, y: 2.2, z: -26.5 },
  { id: 'hp2', x: -29.5, y: 1.6, z: -26.5 },
  { id: 'hp3', x: -9.5, y: 0, z: -3.5 },
  { id: 'hp4', x: 19.5, y: 0, z: 16.0 }
];

export const RADAR_CALLOUTS = [
  { label: 'A', x: 25, z: -23, color: '#ef4444', big: true },
  { label: 'B', x: -28, z: -24, color: '#ef4444', big: true },
  { label: 'MID', x: 0, z: -2, color: '#e2e8f0', big: false },
  { label: 'LONG', x: 27, z: 6, color: '#e2e8f0', big: false },
  { label: 'CAT', x: 12, z: -5, color: '#e2e8f0', big: false },
  { label: 'CT', x: 0, z: -31, color: '#93c5fd', big: false },
  { label: 'T', x: 0, z: 32, color: '#fcd34d', big: false }
];

export const SPAWN_POINTS = [
  { x: -4, y: 0.1, z: -32, yaw: Math.PI, team: 1 },
  { x: 5, y: 0.1, z: -32, yaw: Math.PI, team: 1 },
  { x: 16, y: 0.1, z: -31, yaw: 2.6, team: 1 },
  { x: -18, y: 0.1, z: -31, yaw: -2.6, team: 1 },
  { x: -4, y: 0.1, z: 32, yaw: 0, team: 2 },
  { x: 5, y: 0.1, z: 32, yaw: 0, team: 2 },
  { x: 26, y: 0.1, z: 31, yaw: 0.2, team: 2 },
  { x: -27, y: 0.1, z: 30, yaw: -0.2, team: 2 },
  { x: 28, y: 0.1, z: -2, yaw: 1.5, team: 0 },
  { x: -28, y: 0.1, z: 2, yaw: -1.5, team: 0 }
];

export function getRampHeightAt(x, z) {
  for (const r of MAP_RAMPS) {
    const hw = r.w * 0.5 + 0.3;
    const hd = r.d * 0.5 + 0.3;
    if (x >= r.x - hw && x <= r.x + hw && z >= r.z - hd && z <= r.z + hd) {
      let t = 0;
      if (r.dir === '+z') t = (z - (r.z - r.d * 0.5)) / r.d;
      else if (r.dir === '-z') t = ((r.z + r.d * 0.5) - z) / r.d;
      else if (r.dir === '+x') t = (x - (r.x - r.w * 0.5)) / r.w;
      else if (r.dir === '-x') t = ((r.x + r.w * 0.5) - x) / r.w;
      t = Math.max(0, Math.min(1, t));
      return r.yBottom + t * (r.yTop - r.yBottom);
    }
  }
  return null;
}

export function stepPlayerPhysics(state, input, dt, speedScale = 1.0) {
  state.crouch = !!input.crouch;
  state.walk = !!input.walk;

  const forwardX = -Math.sin(input.yaw);
  const forwardZ = -Math.cos(input.yaw);
  const rightX = Math.cos(input.yaw);
  const rightZ = -Math.sin(input.yaw);

  let wishX = 0;
  let wishZ = 0;
  if (input.f) { wishX += forwardX; wishZ += forwardZ; }
  if (input.b) { wishX -= forwardX; wishZ -= forwardZ; }
  if (input.r) { wishX += rightX; wishZ += rightZ; }
  if (input.l) { wishX -= rightX; wishZ -= rightZ; }

  const wishLen = Math.hypot(wishX, wishZ);
  if (wishLen > 0.001) {
    wishX /= wishLen;
    wishZ /= wishLen;
  }

  const wCfg = WEAPONS[state.weapon] || WEAPONS.ak47;
  const totalSpeedMult = (wCfg.speedMult || 1.0) * Math.max(0.5, Math.min(1.8, speedScale || 1.0));

  let maxSpeed = BASE_MOVE_SPEED * totalSpeedMult;
  if (state.crouch) maxSpeed = CROUCH_SPEED * totalSpeedMult;
  else if (state.walk) maxSpeed = WALK_SPEED * totalSpeedMult;

  if (state.grounded) {
    if (wishLen < 0.01) {
      const friction = Math.max(0, 1 - 15.0 * dt);
      state.vx *= friction;
      state.vz *= friction;
      if (Math.hypot(state.vx, state.vz) < 0.12) {
        state.vx = 0;
        state.vz = 0;
      }
    } else {
      const blend = Math.min(1, 18.5 * dt);
      state.vx += (wishX * maxSpeed - state.vx) * blend;
      state.vz += (wishZ * maxSpeed - state.vz) * blend;
    }
  } else {
    const airBlend = Math.min(1, 4.0 * dt);
    if (wishLen > 0.01) {
      state.vx += (wishX * maxSpeed - state.vx) * airBlend;
      state.vz += (wishZ * maxSpeed - state.vz) * airBlend;
    }
  }

  let jumped = false;
  if (input.jump && state.grounded) {
    state.vy = JUMP_FORCE;
    state.grounded = false;
    jumped = true;
  }

  state.vy -= GRAVITY * dt;

  const stepHeight = 0.62;
  state.x += state.vx * dt;
  resolveHorizontalCollisions(state, stepHeight, 'x');

  state.z += state.vz * dt;
  resolveHorizontalCollisions(state, stepHeight, 'z');

  const limit = ARENA_HALF - PLAYER_RADIUS;
  if (state.x < -limit) { state.x = -limit; state.vx = 0; }
  if (state.x > limit) { state.x = limit; state.vx = 0; }
  if (state.z < -limit) { state.z = -limit; state.vz = 0; }
  if (state.z > limit) { state.z = limit; state.vz = 0; }

  const prevY = state.y;
  state.y += state.vy * dt;
  state.grounded = false;

  let supportY = 0;
  const rampY = getRampHeightAt(state.x, state.z);
  if (rampY !== null && prevY >= rampY - 0.7) {
    supportY = Math.max(supportY, rampY);
  }

  const pHeight = state.crouch ? 1.25 : PLAYER_HEIGHT;
  for (const b of MAP_BOXES) {
    const minX = b.x - b.w * 0.5 - PLAYER_RADIUS * 0.88;
    const maxX = b.x + b.w * 0.5 + PLAYER_RADIUS * 0.88;
    const minZ = b.z - b.d * 0.5 - PLAYER_RADIUS * 0.88;
    const maxZ = b.z + b.d * 0.5 + PLAYER_RADIUS * 0.88;

    if (state.x > minX && state.x < maxX && state.z > minZ && state.z < maxZ) {
      const boxTop = b.y + b.h;
      if (prevY >= boxTop - 0.62 && state.vy <= 0) {
        supportY = Math.max(supportY, boxTop);
      } else if (state.y + pHeight > b.y && prevY + pHeight <= b.y + 0.25 && state.vy > 0) {
        state.y = b.y - pHeight;
        state.vy = 0;
      }
    }
  }

  if (state.y <= supportY) {
    state.y = supportY;
    state.vy = 0;
    state.grounded = true;
  } else if (rampY !== null && state.vy <= 0 && Math.abs(state.y - rampY) < 0.4) {
    state.y = rampY;
    state.vy = 0;
    state.grounded = true;
  }

  return { jumped };
}

function resolveHorizontalCollisions(state, stepHeight, axis) {
  const pHeight = state.crouch ? 1.25 : PLAYER_HEIGHT;
  for (const b of MAP_BOXES) {
    const boxTop = b.y + b.h;
    if (state.y >= boxTop - stepHeight) continue;
    if (state.y + pHeight <= b.y + 0.05) continue;

    const minX = b.x - b.w * 0.5 - PLAYER_RADIUS;
    const maxX = b.x + b.w * 0.5 + PLAYER_RADIUS;
    const minZ = b.z - b.d * 0.5 - PLAYER_RADIUS;
    const maxZ = b.z + b.d * 0.5 + PLAYER_RADIUS;

    if (state.x > minX && state.x < maxX && state.z > minZ && state.z < maxZ) {
      if (axis === 'x') {
        const penLeft = state.x - minX;
        const penRight = maxX - state.x;
        if (penLeft < penRight) state.x = minX;
        else state.x = maxX;
        state.vx = 0;
      } else {
        const penFront = state.z - minZ;
        const penBack = maxZ - state.z;
        if (penFront < penBack) state.z = minZ;
        else state.z = maxZ;
        state.vz = 0;
      }
    }
  }
}

export function intersectRayAABB(ox, oy, oz, dx, dy, dz, minX, minY, minZ, maxX, maxY, maxZ, maxDist) {
  let tmin = 0;
  let tmax = maxDist;

  if (Math.abs(dx) < 1e-8) {
    if (ox < minX || ox > maxX) return null;
  } else {
    let t1 = (minX - ox) / dx;
    let t2 = (maxX - ox) / dx;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }

  if (Math.abs(dy) < 1e-8) {
    if (oy < minY || oy > maxY) return null;
  } else {
    let t1 = (minY - oy) / dy;
    let t2 = (maxY - oy) / dy;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }

  if (Math.abs(dz) < 1e-8) {
    if (oz < minZ || oz > maxZ) return null;
  } else {
    let t1 = (minZ - oz) / dz;
    let t2 = (maxZ - oz) / dz;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }

  return tmin >= 0 && tmin <= maxDist ? tmin : null;
}

export function raycastWorld(ox, oy, oz, dx, dy, dz, maxDist) {
  let closest = maxDist;
  let hitWall = false;
  let hitBoxType = 'floor';

  if (dy < -1e-5 && oy > 0) {
    const tFloor = -oy / dy;
    if (tFloor > 0 && tFloor < closest) {
      closest = tFloor;
      hitWall = true;
      hitBoxType = 'floor';
    }
  }

  for (const b of MAP_BOXES) {
    const t = intersectRayAABB(
      ox, oy, oz, dx, dy, dz,
      b.x - b.w * 0.5, b.y, b.z - b.d * 0.5,
      b.x + b.w * 0.5, b.y + b.h, b.z + b.d * 0.5,
      closest
    );
    if (t !== null && t < closest) {
      closest = t;
      hitWall = true;
      hitBoxType = b.type;
    }
  }

  return { dist: closest, hitWall, hitBoxType };
}
