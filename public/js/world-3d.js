// CS:GO "DE_DUST2" 3D PBR World, Procedural Textures, Tactical Operators, First-Person Gloves/Guns, Brass Shells & Decals

import * as THREE from 'three';
import {
  ARENA_HALF,
  MAP_BOXES,
  MAP_RAMPS,
  WEAPONS
} from './map-data.js';

// --- Procedural CS:GO Dust II Texture Generators ---
function seededNoise(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function makeSandstoneFloorTextures() {
  const size = 512;
  const albedo = document.createElement('canvas');
  albedo.width = size; albedo.height = size;
  const ctx = albedo.getContext('2d');

  const bump = document.createElement('canvas');
  bump.width = size; bump.height = size;
  const bctx = bump.getContext('2d');

  ctx.fillStyle = '#d7c39e';
  ctx.fillRect(0, 0, size, size);
  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, size, size);

  // Subtle limestone tiles + sandy patches
  const tile = 64;
  for (let ty = 0; ty < size; ty += tile) {
    const rowOffset = ((ty / tile) % 2) * (tile * 0.5);
    for (let tx = -tile; tx < size; tx += tile) {
      const shade = Math.floor((seededNoise(tx, ty) - 0.5) * 18);
      ctx.fillStyle = `rgb(${214 + shade}, ${193 + shade}, ${155 + shade})`;
      ctx.fillRect(tx + rowOffset + 2, ty + 2, tile - 4, tile - 4);

      ctx.strokeStyle = 'rgba(138, 117, 84, 0.42)';
      ctx.lineWidth = 2;
      ctx.strokeRect(tx + rowOffset + 1, ty + 1, tile - 2, tile - 2);

      bctx.strokeStyle = '#383838';
      bctx.lineWidth = 3;
      bctx.strokeRect(tx + rowOffset + 1, ty + 1, tile - 2, tile - 2);
    }
  }

  // Wind-blown desert sand blotches & grit
  for (let i = 0; i < 2200; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 1 + Math.random() * 2.5;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(232, 215, 182, 0.35)' : 'rgba(168, 144, 106, 0.22)';
    ctx.fillRect(x, y, r, r);
    bctx.fillStyle = Math.random() > 0.5 ? '#969696' : '#6b6b6b';
    bctx.fillRect(x, y, r, r);
  }

  const map = new THREE.CanvasTexture(albedo);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(14, 14);
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bump);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(14, 14);

  return { map, bumpMap };
}

function makeStuccoWallTextures(baseHex = '#dfd0b4', darkTrimHex = '#bfa984') {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');

  const bc = document.createElement('canvas');
  bc.width = size; bc.height = size;
  const bctx = bc.getContext('2d');

  // Vertical gradient simulating lower desert dust weathering
  const grad = ctx.createLinearGradient(0, 0, 0, size);
  grad.addColorStop(0, darkTrimHex);
  grad.addColorStop(0.08, baseHex);
  grad.addColorStop(0.82, baseHex);
  grad.addColorStop(1, '#b59d76');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  bctx.fillStyle = '#808080';
  bctx.fillRect(0, 0, size, size);

  // Horizontal sandstone block courses
  ctx.strokeStyle = 'rgba(120, 98, 68, 0.22)';
  ctx.lineWidth = 2;
  for (let y = 32; y < size; y += 48) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
    bctx.strokeStyle = '#585858';
    bctx.beginPath(); bctx.moveTo(0, y); bctx.lineTo(size, y); bctx.stroke();
  }

  // Plaster speckles
  for (let i = 0; i < 1400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,248,230,0.18)' : 'rgba(115,92,62,0.16)';
    ctx.fillRect(x, y, 2, 2);
    bctx.fillStyle = Math.random() > 0.5 ? '#989898' : '#686868';
    bctx.fillRect(x, y, 2, 2);
  }

  const map = new THREE.CanvasTexture(c);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bc);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  return { map, bumpMap };
}

function makeWoodCrateTexture(isAmmoOlive = false) {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');

  ctx.fillStyle = isAmmoOlive ? '#4e5b42' : '#b88b52';
  ctx.fillRect(0, 0, size, size);

  // Horizontal wood planks
  ctx.strokeStyle = isAmmoOlive ? '#2f3827' : '#785327';
  ctx.lineWidth = 3;
  for (let y = 32; y < size; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
  }

  // Outer frame & diagonal brace
  ctx.strokeStyle = isAmmoOlive ? '#36402d' : '#8c6230';
  ctx.lineWidth = 18;
  ctx.strokeRect(9, 9, size - 18, size - 18);

  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(16, 16); ctx.lineTo(size - 16, size - 16);
  ctx.stroke();

  // Metal corner brackets
  ctx.fillStyle = '#2d333b';
  for (const [cx, cy] of [[0, 0], [size - 28, 0], [0, size - 28], [size - 28, size - 28]]) {
    ctx.fillRect(cx, cy, 28, 28);
  }

  // Military Stencil
  ctx.fillStyle = isAmmoOlive ? '#eab308' : 'rgba(55, 35, 18, 0.72)';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(isAmmoOlive ? 'AMMO 7.62' : 'FRAGILE', size / 2, size / 2 - 6);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeBlueDoorTexture() {
  const size = 256;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#3b6e96';
  ctx.fillRect(0, 0, size, size);

  // Corrugated vertical steel ribs
  for (let x = 0; x < size; x += 16) {
    ctx.fillStyle = (x / 16) % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.16)';
    ctx.fillRect(x, 0, 8, size);
  }

  // Heavy steel frame + rust wear
  ctx.strokeStyle = '#244763';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, size - 14, size - 14);
  ctx.beginPath();
  ctx.moveTo(0, size * 0.5); ctx.lineTo(size, size * 0.5);
  ctx.stroke();

  // Rust & bullet scratches
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = Math.random() > 0.4 ? 'rgba(124, 72, 43, 0.35)' : 'rgba(200, 215, 225, 0.25)';
    ctx.fillRect(Math.random() * size, Math.random() * size, 4 + Math.random() * 10, 3 + Math.random() * 6);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeCalloutSignTexture(text, subText = '') {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 256, 256);

  // Spray-painted red circle + stencil letter like Dust2!
  ctx.strokeStyle = 'rgba(185, 28, 28, 0.85)';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(128, 112, 74, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(185, 28, 28, 0.88)';
  ctx.font = '900 108px Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 116);

  if (subText) {
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(subText, 128, 218);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class World3D {
  constructor(container) {
    this.container = container;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8ec3eb);
    this.scene.fog = new THREE.FogExp2(0xdccbb1, 0.0052);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 320);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);

    this.remotePlayers = new Map();
    this.healthPackMeshes = new Map();
    this.tracers = [];
    this.particles = [];
    this.shells = [];
    this.decals = [];
    this.palmLeaves = [];

    this.setupEnvironmentAndLights();
    this.buildDust2Arena();
    this.buildViewmodel();

    window.addEventListener('resize', () => this.onResize());
  }

  setShadowQuality(high = true) {
    this.renderer.shadowMap.enabled = !!high;
    if (this.sunLight) {
      this.sunLight.castShadow = !!high;
    }
    this.scene.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        obj.material.needsUpdate = true;
      }
    });
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setupEnvironmentAndLights() {
    // Generate realistic desert environment cubemap for metallic weapon reflections!
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envScene = new THREE.Scene();
    const skyHem = new THREE.HemisphereLight(0x87ceeb, 0xd7c39e, 2.2);
    envScene.add(skyHem);
    const envSun = new THREE.DirectionalLight(0xfff4d6, 3.0);
    envSun.position.set(30, 50, 20);
    envScene.add(envSun);
    this.scene.environment = pmrem.fromScene(envScene, 0.04).texture;
    pmrem.dispose();

    // Warm Mediterranean Dust2 Sunlight
    const hemi = new THREE.HemisphereLight(0xaad4f5, 0xc8b08a, 0.92);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff4dc, 2.15);
    sun.position.set(34, 56, 26);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 6;
    sun.shadow.camera.far = 145;
    const d = 46;
    sun.shadow.camera.left = -d;
    sun.shadow.camera.right = d;
    sun.shadow.camera.top = d;
    sun.shadow.camera.bottom = -d;
    sun.shadow.bias = -0.0004;
    this.sunLight = sun;
    this.scene.add(sun);
  }

  buildDust2Arena() {
    // Atmospheric Desert Sky Dome
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 32; skyCanvas.height = 256;
    const sctx = skyCanvas.getContext('2d');
    const sgrad = sctx.createLinearGradient(0, 0, 0, 256);
    sgrad.addColorStop(0.0, '#3a7bd5');
    sgrad.addColorStop(0.42, '#7db9e8');
    sgrad.addColorStop(0.52, '#ebd9be');
    sgrad.addColorStop(1.0, '#d2bc96');
    sctx.fillStyle = sgrad;
    sctx.fillRect(0, 0, 32, 256);
    const skyTex = new THREE.CanvasTexture(skyCanvas);
    skyTex.colorSpace = THREE.SRGBColorSpace;

    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(185, 28, 20),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false })
    );
    this.scene.add(skyDome);

    // Sun Disc
    const sunDisc = new THREE.Mesh(
      new THREE.CircleGeometry(9, 24),
      new THREE.MeshBasicMaterial({ color: 0xfffbeb, fog: false })
    );
    sunDisc.position.set(85, 130, 65);
    sunDisc.lookAt(0, 0, 0);
    this.scene.add(sunDisc);

    // Floor: Sandstone Cobblestone + Sand
    const floorTexs = makeSandstoneFloorTextures();
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(ARENA_HALF * 2, ARENA_HALF * 2),
      new THREE.MeshStandardMaterial({
        map: floorTexs.map,
        bumpMap: floorTexs.bumpMap,
        bumpScale: 0.04,
        roughness: 0.9,
        metalness: 0.02
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Materials for Dust2 Map Architecture
    const stuccoMain = makeStuccoWallTextures('#e2d2b5', '#c5ae87');
    stuccoMain.map.repeat.set(3, 1);
    stuccoMain.bumpMap.repeat.set(3, 1);

    const stuccoOuter = makeStuccoWallTextures('#d8c4a0', '#b79d74');
    stuccoOuter.map.repeat.set(10, 1.5);
    stuccoOuter.bumpMap.repeat.set(10, 1.5);

    const crateWoodTex = makeWoodCrateTexture(false);
    const crateAmmoTex = makeWoodCrateTexture(true);
    const blueDoorTex = makeBlueDoorTexture();

    const mats = {
      sandstone_wall: new THREE.MeshStandardMaterial({
        map: stuccoOuter.map, bumpMap: stuccoOuter.bumpMap, bumpScale: 0.05, roughness: 0.88
      }),
      stucco_wall: new THREE.MeshStandardMaterial({
        map: stuccoMain.map, bumpMap: stuccoMain.bumpMap, bumpScale: 0.045, roughness: 0.85
      }),
      stucco_building: new THREE.MeshStandardMaterial({
        color: 0xdfd0b4, bumpMap: stuccoMain.bumpMap, bumpScale: 0.04, roughness: 0.86
      }),
      stucco_trim: new THREE.MeshStandardMaterial({
        color: 0xcab693, roughness: 0.82
      }),
      sandstone_pillar: new THREE.MeshStandardMaterial({
        color: 0xd6c19c, bumpMap: stuccoMain.bumpMap, bumpScale: 0.04, roughness: 0.84
      }),
      catwalk_stone: new THREE.MeshStandardMaterial({
        color: 0xd0bc98, bumpMap: floorTexs.bumpMap, bumpScale: 0.03, roughness: 0.88
      }),
      bombsite_platform: new THREE.MeshStandardMaterial({
        color: 0xcbb692, bumpMap: floorTexs.bumpMap, bumpScale: 0.03, roughness: 0.86
      }),
      stone_block: new THREE.MeshStandardMaterial({
        color: 0xbfb097, roughness: 0.88
      }),
      wood_crate: new THREE.MeshStandardMaterial({
        map: crateWoodTex, roughness: 0.78, metalness: 0.05
      }),
      ammo_crate: new THREE.MeshStandardMaterial({
        map: crateAmmoTex, roughness: 0.72, metalness: 0.12
      }),
      blue_door: new THREE.MeshStandardMaterial({
        map: blueDoorTex, roughness: 0.52, metalness: 0.45
      }),
      blue_container: new THREE.MeshStandardMaterial({
        map: blueDoorTex, roughness: 0.55, metalness: 0.4
      })
    };

    for (const b of MAP_BOXES) {
      const geo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const mat = mats[b.type] || mats.stucco_wall;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(b.x, b.y + b.h * 0.5, b.z);
      mesh.castShadow = b.type !== 'sandstone_wall';
      mesh.receiveShadow = true;
      this.scene.add(mesh);

      // Architectural brick cornice trim on tall Dust2 walls/buildings
      if (b.type === 'stucco_wall' || b.type === 'stucco_building' || b.type === 'sandstone_wall') {
        const cap = new THREE.Mesh(
          new THREE.BoxGeometry(b.w + 0.14, 0.22, b.d + 0.14),
          new THREE.MeshStandardMaterial({ color: 0xa68963, roughness: 0.85 })
        );
        cap.position.set(b.x, b.y + b.h + 0.1, b.z);
        cap.castShadow = true;
        this.scene.add(cap);
      }
    }

    // Build Dust2 Sloped Stone Ramps
    const rampMat = new THREE.MeshStandardMaterial({
      color: 0xcbb690,
      bumpMap: floorTexs.bumpMap,
      bumpScale: 0.03,
      roughness: 0.88
    });
    for (const r of MAP_RAMPS) {
      const rise = r.yTop - r.yBottom;
      const isX = r.dir === '+x' || r.dir === '-x';
      const runLen = isX ? r.w : r.d;
      const hyp = Math.hypot(runLen, rise);
      const angle = Math.atan2(rise, runLen);
      const thickness = 0.45;

      const geo = isX
        ? new THREE.BoxGeometry(hyp, thickness, r.d)
        : new THREE.BoxGeometry(r.w, thickness, hyp);
      const mesh = new THREE.Mesh(geo, rampMat);
      mesh.position.set(r.x, (r.yBottom + r.yTop) * 0.5 - thickness * 0.44, r.z);

      if (r.dir === '+z') mesh.rotation.x = -angle;
      else if (r.dir === '-z') mesh.rotation.x = angle;
      else if (r.dir === '+x') mesh.rotation.z = angle;
      else if (r.dir === '-x') mesh.rotation.z = -angle;

      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    }

    // Bombsite A & B Spray-Painted Callout Decals + Red Plant Zone Borders!
    this.addWallSign(25, 4.8, -37.85, 0, 'A', 'BOMBSITE A');
    this.addWallSign(-28.5, 4.5, -37.85, 0, 'B', 'BOMBSITE B');
    this.addWallSign(11.9, 2.5, 2.0, Math.PI, 'A', 'SHORT →');
    this.addWallSign(-17.65, 2.5, 4.0, Math.PI / 2, 'B', '← TUNNELS');

    this.addBombsiteZoneRing(24.8, 2.22, -22.5, 6.2, 6.2);
    this.addBombsiteZoneRing(-26.5, 1.62, -22.5, 5.8, 5.8);

    // Decorative Mediterranean Palm Trees outside/corners of Dust2!
    this.addPalmTree(-33, 0, 33);
    this.addPalmTree(34, 0, 33);
    this.addPalmTree(-34, 0, -34);
    this.addPalmTree(34, 2.2, -30);
    this.addPalmTree(-5.5, 0, 20.5);
  }

  addWallSign(x, y, z, rotY, letter, sub) {
    const tex = makeCalloutSignTexture(letter, sub);
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 2.4),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
    );
    plane.position.set(x, y, z);
    plane.rotation.y = rotY;
    this.scene.add(plane);
  }

  addBombsiteZoneRing(x, y, z, w, d) {
    const ring = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshBasicMaterial({ color: 0xb91c1c, transparent: true, opacity: 0.2, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, y, z);
    this.scene.add(ring);
  }

  addPalmTree(x, y, z) {
    const grp = new THREE.Group();
    grp.position.set(x, y, z);

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7c5c3e, roughness: 0.92 });
    let curY = 0;
    let offsetX = 0;
    for (let i = 0; i < 6; i++) {
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.22 - i * 0.015, 0.26 - i * 0.015, 1.25, 8), trunkMat);
      seg.position.set(offsetX, curY + 0.6, 0);
      seg.rotation.z = -0.04 * i;
      seg.castShadow = true;
      grp.add(seg);
      curY += 1.15;
      offsetX += 0.06 * i;
    }

    const crown = new THREE.Group();
    crown.position.set(offsetX, curY, 0);
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x4d7c3f, roughness: 0.78, side: THREE.DoubleSide });
    for (let k = 0; k < 7; k++) {
      const frond = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 2.8), leafMat);
      const pivot = new THREE.Group();
      pivot.rotation.y = (k / 7) * Math.PI * 2;
      frond.position.set(0, -0.18, 1.35);
      frond.rotation.x = 0.38;
      frond.castShadow = true;
      pivot.add(frond);
      crown.add(pivot);
    }
    grp.add(crown);
    this.palmLeaves.push(crown);
    this.scene.add(grp);
  }

  syncHealthPacks(packs) {
    for (const hp of packs) {
      let grp = this.healthPackMeshes.get(hp.id);
      if (!grp) {
        grp = new THREE.Group();
        grp.position.set(hp.x, hp.y + 0.35, hp.z);

        // Tactical CS:GO Field Medkit + Kevlar Satchel
        const bagMat = new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.65 });
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
        const redMat = new THREE.MeshBasicMaterial({ color: 0xdc2626 });

        const bag = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.42, 0.55), bagMat);
        bag.castShadow = true;
        const badge = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.04, 0.32), whiteMat);
        badge.position.y = 0.22;
        const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.08), redMat);
        c1.position.y = 0.23;
        const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.22), redMat);
        c2.position.y = 0.23;

        grp.add(bag, badge, c1, c2);
        grp.userData.baseY = hp.y + 0.35;
        this.scene.add(grp);
        this.healthPackMeshes.set(hp.id, grp);
      }
      grp.visible = !!hp.active;
    }
  }

  setHealthPackActive(id, active) {
    const grp = this.healthPackMeshes.get(id);
    if (grp) grp.visible = !!active;
  }

  // --- Detailed 3D CS:GO Weapon Meshes (+ Tactical Gloves in First Person!) ---
  createGunMesh(weaponId = 'ak47', isFirstPerson = false) {
    const grp = new THREE.Group();

    const gunSteel = new THREE.MeshStandardMaterial({ color: 0x22272e, roughness: 0.35, metalness: 0.78 });
    const darkPolymer = new THREE.MeshStandardMaterial({ color: 0x181c20, roughness: 0.62, metalness: 0.25 });
    const akWood = new THREE.MeshStandardMaterial({ color: 0x8f3f1e, roughness: 0.45, metalness: 0.08 });
    const awpOlive = new THREE.MeshStandardMaterial({ color: 0x455436, roughness: 0.52, metalness: 0.18 });
    const silverChrome = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.14, metalness: 0.94 });
    const p90Amber = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.25, transparent: true, opacity: 0.78 });

    if (weaponId === 'ak47') {
      // AK-47: Steel receiver + wood handguard/stock + curved banana mag + front triangle post
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.095, 0.38), gunSteel);
      const dustCover = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.32, 8), gunSteel);
      dustCover.rotation.x = Math.PI / 2;
      dustCover.position.set(0, 0.048, 0.01);

      const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.066, 0.082, 0.24), akWood);
      handguard.position.set(0, 0.005, -0.3);

      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.11, 0.26), akWood);
      stock.position.set(0, -0.035, 0.3);
      stock.rotation.x = -0.14;

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.015, 0.36, 10), gunSteel);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.022, -0.56);

      const gasTube = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.22, 8), gunSteel);
      gasTube.rotation.x = Math.PI / 2;
      gasTube.position.set(0, 0.052, -0.46);

      const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.065, 0.035), gunSteel);
      frontSight.position.set(0, 0.052, -0.68);

      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.22, 0.075), gunSteel);
      mag.position.set(0, -0.14, -0.11);
      mag.rotation.x = 0.32;

      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.13, 0.055), akWood);
      grip.position.set(0, -0.1, 0.1);
      grip.rotation.x = -0.26;

      grp.add(receiver, dustCover, handguard, stock, barrel, gasTube, frontSight, mag, grip);
      grp.userData.muzzleOffset = new THREE.Vector3(0, 0.025, -0.76);
      grp.userData.forehandPos = new THREE.Vector3(-0.02, -0.04, -0.28);
      grp.userData.gripPos = new THREE.Vector3(0.01, -0.09, 0.1);
    } else if (weaponId === 'm4a1s') {
      // M4A1-S: Matte tactical AR + rail handguard + long cylindrical suppressor
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.105, 0.36), darkPolymer);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.066, 0.088, 0.28), gunSteel);
      rail.position.set(0, 0.01, -0.31);
      const carry = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.042, 0.18), gunSteel);
      carry.position.set(0, 0.08, 0.0);

      const suppressor = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.34, 14), darkPolymer);
      suppressor.rotation.x = Math.PI / 2;
      suppressor.position.set(0, 0.018, -0.62);

      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.11, 0.24), darkPolymer);
      stock.position.set(0, -0.01, 0.28);

      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.19, 0.068), gunSteel);
      mag.position.set(0, -0.13, -0.08);
      mag.rotation.x = 0.12;

      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.13, 0.052), darkPolymer);
      grip.position.set(0, -0.1, 0.09);
      grip.rotation.x = -0.24;

      grp.add(receiver, rail, carry, suppressor, stock, mag, grip);
      grp.userData.muzzleOffset = new THREE.Vector3(0, 0.018, -0.81);
      grp.userData.forehandPos = new THREE.Vector3(-0.02, -0.04, -0.3);
      grp.userData.gripPos = new THREE.Vector3(0.01, -0.09, 0.09);
    } else if (weaponId === 'aug') {
      // AUG: Bullpup olive chassis + integrated ACOG optic!
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.12, 0.56), awpOlive);
      chassis.position.set(0, -0.01, 0.04);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.32, 10), gunSteel);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.02, -0.36);

      const acog = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.024, 0.22, 12), gunSteel);
      acog.rotation.x = Math.PI / 2;
      acog.position.set(0, 0.095, -0.02);

      const rearMag = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.19, 0.07), darkPolymer);
      rearMag.position.set(0, -0.13, 0.22);
      rearMag.rotation.x = 0.15;

      const foregrip = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.11, 0.04), darkPolymer);
      foregrip.position.set(0, -0.1, -0.2);

      grp.add(chassis, barrel, acog, rearMag, foregrip);
      grp.userData.muzzleOffset = new THREE.Vector3(0, 0.02, -0.54);
      grp.userData.forehandPos = new THREE.Vector3(-0.01, -0.08, -0.2);
      grp.userData.gripPos = new THREE.Vector3(0.01, -0.09, 0.02);
    } else if (weaponId === 'awp' || weaponId === 'ssg08') {
      // AWP / SSG 08 Sniper Rifle
      const isAwp = weaponId === 'awp';
      const bodyMat = isAwp ? awpOlive : darkPolymer;
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.115, 0.68), bodyMat);
      chassis.position.set(0, -0.01, 0.02);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, isAwp ? 0.68 : 0.56, 12), gunSteel);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.03, isAwp ? -0.62 : -0.54);

      const muzzleBrake = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.036, 0.075), gunSteel);
      muzzleBrake.position.set(0, 0.03, isAwp ? -0.96 : -0.82);

      // Dual-bell Sniper Scope
      const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.34, 14), gunSteel);
      scopeTube.rotation.x = Math.PI / 2;
      scopeTube.position.set(0, 0.115, -0.06);
      const frontBell = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.026, 0.1, 14), gunSteel);
      frontBell.rotation.x = Math.PI / 2;
      frontBell.position.set(0, 0.115, -0.25);
      const rearBell = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.034, 0.08, 14), gunSteel);
      rearBell.rotation.x = Math.PI / 2;
      rearBell.position.set(0, 0.115, 0.13);

      const boltHandle = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.018, 0.018), silverChrome);
      boltHandle.position.set(0.055, 0.04, 0.04);

      grp.add(chassis, barrel, muzzleBrake, scopeTube, frontBell, rearBell, boltHandle);
      grp.userData.muzzleOffset = new THREE.Vector3(0, 0.03, isAwp ? -1.0 : -0.86);
      grp.userData.forehandPos = new THREE.Vector3(-0.02, -0.04, -0.28);
      grp.userData.gripPos = new THREE.Vector3(0.01, -0.08, 0.14);
    } else if (weaponId === 'xm1014') {
      // XM1014 Tactical Auto Shotgun
      const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.11, 0.42), gunSteel);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.48, 12), gunSteel);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.035, -0.44);
      const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.44, 10), darkPolymer);
      magTube.rotation.x = Math.PI / 2;
      magTube.position.set(0, -0.008, -0.42);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.11, 0.26), darkPolymer);
      stock.position.set(0, -0.03, 0.3);
      grp.add(receiver, barrel, magTube, stock);
      grp.userData.muzzleOffset = new THREE.Vector3(0, 0.035, -0.7);
      grp.userData.forehandPos = new THREE.Vector3(-0.02, -0.03, -0.32);
      grp.userData.gripPos = new THREE.Vector3(0.01, -0.08, 0.12);
    } else if (weaponId === 'p90' || weaponId === 'mp9') {
      const isP90 = weaponId === 'p90';
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.13, isP90 ? 0.46 : 0.32), darkPolymer);
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.16, 10), gunSteel);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(0, 0.02, isP90 ? -0.28 : -0.22);
      grp.add(body, barrel);
      if (isP90) {
        const topMag = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.035, 0.34), p90Amber);
        topMag.position.set(0, 0.082, -0.02);
        grp.add(topMag);
      } else {
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.048), gunSteel);
        mag.position.set(0, -0.14, -0.05);
        grp.add(mag);
      }
      grp.userData.muzzleOffset = new THREE.Vector3(0, 0.02, isP90 ? -0.38 : -0.32);
      grp.userData.forehandPos = new THREE.Vector3(-0.02, -0.05, -0.16);
      grp.userData.gripPos = new THREE.Vector3(0.01, -0.08, 0.06);
    } else if (weaponId === 'deagle' || weaponId === 'usp' || weaponId === 'glock') {
      // Pistols: Desert Eagle (Silver Chrome), USP-S (Silenced), Glock-18
      const slideMat = weaponId === 'deagle' ? silverChrome : gunSteel;
      const slideLen = weaponId === 'deagle' ? 0.28 : 0.22;
      const slideH = weaponId === 'deagle' ? 0.072 : 0.052;
      const slide = new THREE.Mesh(new THREE.BoxGeometry(0.052, slideH, slideLen), slideMat);
      slide.position.set(0, 0.03, -0.06);

      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.035, slideLen * 0.85), darkPolymer);
      frame.position.set(0, -0.015, -0.04);

      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.13, 0.062), darkPolymer);
      grip.position.set(0, -0.085, 0.04);
      grip.rotation.x = -0.24;

      grp.add(slide, frame, grip);

      if (weaponId === 'usp') {
        const sil = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.2, 12), darkPolymer);
        sil.rotation.x = Math.PI / 2;
        sil.position.set(0, 0.03, -0.27);
        grp.add(sil);
        grp.userData.muzzleOffset = new THREE.Vector3(0, 0.03, -0.38);
      } else {
        grp.userData.muzzleOffset = new THREE.Vector3(0, 0.03, -0.22);
      }
      grp.userData.forehandPos = new THREE.Vector3(-0.015, -0.085, 0.03);
      grp.userData.gripPos = new THREE.Vector3(0.015, -0.085, 0.04);
    } else if (weaponId === 'knife') {
      // Iconic CS:GO Karambit | Fade!
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.11, 0.042), darkPolymer);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.006, 8, 16), silverChrome);
      ring.rotation.y = Math.PI / 2;
      ring.position.set(0, -0.072, 0.01);

      // Curved Fade Blade (Pink -> Purple -> Gold metallic!)
      const fadePink = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.12, metalness: 0.92 });
      const fadeGold = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.12, metalness: 0.92 });
      const bladeBase = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.048, 0.12), fadePink);
      bladeBase.position.set(0, 0.065, -0.04);
      bladeBase.rotation.x = 0.55;

      const bladeTip = new THREE.Mesh(new THREE.ConeGeometry(0.024, 0.11, 4), fadeGold);
      bladeTip.position.set(0, 0.095, -0.12);
      bladeTip.rotation.x = -1.25;

      grp.add(handle, ring, bladeBase, bladeTip);
      grp.userData.muzzleOffset = new THREE.Vector3(0, 0.05, -0.2);
      grp.userData.forehandPos = null;
      grp.userData.gripPos = new THREE.Vector3(0, -0.02, 0.02);
    }

    // Add CS:GO Tactical Gloves & Sleeves in First-Person View!
    if (isFirstPerson) {
      const gloveMat = new THREE.MeshStandardMaterial({ color: 0x26292e, roughness: 0.65, metalness: 0.15 });
      const knuckleMat = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.45, metalness: 0.35 });
      const sleeveMat = new THREE.MeshStandardMaterial({ color: 0x3b4d63, roughness: 0.8 });

      const makeArm = (targetPos, side = 1) => {
        const armGrp = new THREE.Group();
        const hand = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.075, 0.11), gloveMat);
        const knuckles = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.055), knuckleMat);
        knuckles.position.set(0, 0.032, -0.01);
        const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.092, 0.092, 0.38), sleeveMat);
        forearm.position.set(side * 0.05, -0.07, 0.23);
        forearm.rotation.x = 0.25;
        forearm.rotation.y = side * -0.18;
        armGrp.add(hand, knuckles, forearm);
        armGrp.position.copy(targetPos);
        return armGrp;
      };

      if (grp.userData.gripPos) {
        grp.add(makeArm(grp.userData.gripPos, 1));
      }
      if (grp.userData.forehandPos) {
        grp.add(makeArm(grp.userData.forehandPos, -1));
      }

      grp.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });
    }

    return grp;
  }

  createOpticAttachmentMesh(opticId = 'reddot') {
    const grp = new THREE.Group();
    if (!opticId || opticId === 'iron' || opticId === 'none') return grp;

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x181c22, roughness: 0.4, metalness: 0.72 });
    const glassMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.16 });
    const redGlow = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const greenGlow = new THREE.MeshBasicMaterial({ color: 0x22c55e });

    if (opticId === 'reddot') {
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.018, 0.095), frameMat);
      const hoodL = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.045, 0.07), frameMat);
      hoodL.position.set(-0.022, 0.028, 0);
      const hoodR = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.045, 0.07), frameMat);
      hoodR.position.set(0.022, 0.028, 0);
      const hoodTop = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.007, 0.07), frameMat);
      hoodTop.position.set(0, 0.05, 0);
      const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.038, 0.038), glassMat);
      lens.position.set(0, 0.028, -0.02);
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.0032, 6, 6), redGlow);
      dot.position.set(0, 0.028, -0.018);
      grp.add(base, hoodL, hoodR, hoodTop, lens, dot);
    } else if (opticId === 'holo') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.026, 0.12), frameMat);
      const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.048, 0.065), frameMat);
      windowFrame.position.set(0, 0.03, -0.01);
      const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.044, 0.034), glassMat);
      lens.position.set(0, 0.032, 0.024);
      const dot = new THREE.Mesh(new THREE.RingGeometry(0.006, 0.0085, 12), redGlow);
      dot.position.set(0, 0.032, 0.025);
      grp.add(body, windowFrame, lens, dot);
    } else if (opticId === 'acog4x') {
      const mount = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.02, 0.12), frameMat);
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.022, 0.2, 12), frameMat);
      tube.rotation.x = Math.PI / 2;
      tube.position.set(0, 0.034, -0.01);
      const fiber = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, 0.11), redGlow);
      fiber.position.set(0, 0.062, -0.02);
      grp.add(mount, tube, fiber);
    } else {
      // Sniper 8x / Thermal 6x
      const isThermal = opticId === 'thermal';
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.28, 12), frameMat);
      tube.rotation.x = Math.PI / 2;
      tube.position.set(0, 0.038, -0.03);
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.025, 0.085, 12), frameMat);
      bell.rotation.x = Math.PI / 2;
      bell.position.set(0, 0.038, -0.19);
      grp.add(tube, bell);
      if (isThermal) {
        const glowLens = new THREE.Mesh(new THREE.CircleGeometry(0.024, 12), greenGlow);
        glowLens.position.set(0, 0.038, 0.112);
        grp.add(glowLens);
      }
    }
    return grp;
  }

  buildViewmodel() {
    this.vmRoot = new THREE.Group();
    this.camera.add(this.vmRoot);
    this.currentVmWeapon = null;
    this.currentVmOptic = 'reddot';
    this.vmRecoilZ = 0;
    this.vmRecoilRotX = 0;
    this.vmBobTime = 0;
    this.vmDrawProgress = 0;
    this.vmInspectTimer = 0;
    this.vmSlashTimer = 0;

    // Realistic warm muzzle flash
    const flashGeo = new THREE.OctahedronGeometry(0.075, 0);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffedd5, transparent: true, opacity: 0.92 });
    this.muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
    this.muzzleFlash.visible = false;
    this.muzzleFlashTimer = 0;
    this.vmRoot.add(this.muzzleFlash);

    this.setViewmodelWeapon('ak47', 'reddot');
  }

  setViewmodelWeapon(weaponId, opticId = null) {
    const nextOptic = opticId !== null ? opticId : this.currentVmOptic;
    if (this.currentVmWeapon === weaponId && this.currentVmOptic === nextOptic) return;
    const weaponChanged = this.currentVmWeapon !== weaponId;
    this.currentVmWeapon = weaponId;
    this.currentVmOptic = nextOptic;

    if (this.vmGun) {
      this.vmRoot.remove(this.vmGun);
    }
    this.vmGun = this.createGunMesh(weaponId, true);

    // Mount custom 3D Scope/Sight on top rail for non-built-in guns!
    if (weaponId !== 'knife' && weaponId !== 'awp' && weaponId !== 'ssg08' && weaponId !== 'aug') {
      const opticMesh = this.createOpticAttachmentMesh(this.currentVmOptic);
      const railY = (weaponId === 'deagle' || weaponId === 'usp' || weaponId === 'glock') ? 0.068 : 0.088;
      opticMesh.position.set(0, railY, -0.05);
      this.vmGun.add(opticMesh);
    }

    this.vmRoot.add(this.vmGun);
    const moz = this.vmGun.userData.muzzleOffset || new THREE.Vector3(0, 0.02, -0.6);
    this.muzzleFlash.position.copy(moz);
    if (weaponChanged) {
      this.vmDrawProgress = 1.0;
    }
    this.vmInspectTimer = 0;
  }

  triggerInspect() {
    this.vmInspectTimer = 2.4;
  }

  triggerViewmodelShot(weaponId = 'ak47') {
    this.vmInspectTimer = 0;
    if (weaponId === 'knife') {
      this.vmSlashTimer = 0.26;
      return;
    }

    this.vmRecoilZ = weaponId === 'awp' ? 0.14 : (weaponId === 'deagle' ? 0.1 : 0.068);
    this.vmRecoilRotX = weaponId === 'deagle' ? 0.24 : 0.095;

    const silenced = weaponId === 'm4a1s' || weaponId === 'usp';
    if (!silenced) {
      this.muzzleFlash.visible = true;
      this.muzzleFlash.rotation.z = Math.random() * Math.PI;
      this.muzzleFlash.scale.setScalar(0.75 + Math.random() * 0.65);
      this.muzzleFlashTimer = 0.04;
    }

    // Eject spinning brass bullet casing!
    this.spawnBrassShell();
  }

  spawnBrassShell() {
    const camPos = new THREE.Vector3();
    this.camera.getWorldPosition(camPos);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);

    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.036, 6),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.2, metalness: 0.9 })
    );
    shell.position.copy(camPos).addScaledVector(right, 0.22).addScaledVector(forward, 0.35);
    shell.position.y -= 0.14;
    this.scene.add(shell);

    this.shells.push({
      mesh: shell,
      vx: right.x * (2.6 + Math.random() * 1.4),
      vy: 2.2 + Math.random() * 1.2,
      vz: right.z * (2.6 + Math.random() * 1.4),
      life: 0.75
    });
  }

  getMuzzleWorldPos() {
    const v = new THREE.Vector3();
    if (this.muzzleFlash) {
      this.muzzleFlash.getWorldPosition(v);
    } else {
      this.camera.getWorldPosition(v);
    }
    return v;
  }

  updateViewmodel(dt, { movingSpeed, grounded, ads, fullScopeHide, reloadProgress, dead }) {
    if (!this.vmRoot) return;
    this.vmRoot.visible = !dead && !fullScopeHide;

    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
      if (this.muzzleFlashTimer <= 0) this.muzzleFlash.visible = false;
    }

    if (this.vmDrawProgress > 0) {
      this.vmDrawProgress = Math.max(0, this.vmDrawProgress - dt * 4.2);
    }
    if (this.vmInspectTimer > 0) {
      this.vmInspectTimer = Math.max(0, this.vmInspectTimer - dt);
    }
    if (this.vmSlashTimer > 0) {
      this.vmSlashTimer = Math.max(0, this.vmSlashTimer - dt);
    }

    this.vmRecoilZ = THREE.MathUtils.lerp(this.vmRecoilZ, 0, Math.min(1, 18 * dt));
    this.vmRecoilRotX = THREE.MathUtils.lerp(this.vmRecoilRotX, 0, Math.min(1, 15 * dt));

    if (grounded && movingSpeed > 0.5) {
      this.vmBobTime += dt * Math.min(13, movingSpeed * 1.25);
    } else {
      this.vmBobTime += dt * 1.4;
    }

    const bobAmp = grounded && movingSpeed > 0.5 ? (ads ? 0.002 : 0.011) : 0.0018;
    const bobX = Math.cos(this.vmBobTime) * bobAmp;
    const bobY = Math.abs(Math.sin(this.vmBobTime)) * bobAmp;

    // Smoothly bring gun to center-eye ADS when aiming with Iron / Red-Dot / Holo!
    const baseX = ads ? 0.0 : (this.currentVmWeapon === 'knife' ? 0.22 : 0.24);
    const baseY = ads ? -0.145 : (this.currentVmWeapon === 'knife' ? -0.2 : -0.23);
    const baseZ = ads ? -0.32 : (this.currentVmWeapon === 'knife' ? -0.38 : -0.46);

    const drawDipY = -this.vmDrawProgress * 0.28;
    const reloadDipY = reloadProgress > 0 ? -Math.sin(reloadProgress * Math.PI) * 0.2 : 0;
    const reloadRoll = reloadProgress > 0 ? Math.sin(reloadProgress * Math.PI) * 0.65 : 0;

    // [F] Inspect Weapon / Spin Karambit!
    let inspectYaw = 0;
    let inspectRoll = 0;
    let inspectPitch = 0;
    if (this.vmInspectTimer > 0) {
      const p = 1 - this.vmInspectTimer / 2.4;
      const env = Math.sin(p * Math.PI);
      if (this.currentVmWeapon === 'knife') {
        inspectRoll = p * Math.PI * 4; // Smooth double Karambit spin!
        inspectYaw = env * 0.35;
      } else {
        inspectYaw = Math.sin(p * Math.PI * 2) * 0.55 * env;
        inspectRoll = env * 0.42;
        inspectPitch = env * 0.16;
      }
    }

    // Knife slash arc
    let slashYaw = 0;
    let slashZ = 0;
    if (this.vmSlashTimer > 0) {
      const sp = Math.sin((this.vmSlashTimer / 0.26) * Math.PI);
      slashYaw = sp * 0.95;
      slashZ = -sp * 0.14;
    }

    this.vmRoot.position.set(
      THREE.MathUtils.lerp(this.vmRoot.position.x, baseX + bobX, Math.min(1, 18 * dt)),
      THREE.MathUtils.lerp(this.vmRoot.position.y, baseY - bobY + drawDipY + reloadDipY, Math.min(1, 18 * dt)),
      THREE.MathUtils.lerp(this.vmRoot.position.z, baseZ + this.vmRecoilZ + slashZ, Math.min(1, 22 * dt))
    );

    this.vmRoot.rotation.set(
      this.vmRecoilRotX + inspectPitch - this.vmDrawProgress * 0.45 - (reloadProgress > 0 ? 0.35 * Math.sin(reloadProgress * Math.PI) : 0),
      inspectYaw + slashYaw,
      reloadRoll + inspectRoll
    );
  }

  // --- Detailed 3D CS:GO CT (SAS) & T (Phoenix/Elite) Operators ---
  createRemoteSoldier(pData) {
    const root = new THREE.Group();
    const isCT = pData.tm === 1;
    const uniformColor = new THREE.Color(pData.c || (isCT ? 0x47648c : 0xc9965b));

    const uniformMat = new THREE.MeshStandardMaterial({ color: uniformColor, roughness: 0.78 });
    const kevlarMat = new THREE.MeshStandardMaterial({ color: isCT ? 0x1e2530 : 0x3b3026, roughness: 0.68 });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.75 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdcb897, roughness: 0.65 });
    const goggleMat = new THREE.MeshStandardMaterial({ color: isCT ? 0x38bdf8 : 0x111827, roughness: 0.2, metalness: 0.8 });

    // Articulated Legs + Combat Boots
    const legGeo = new THREE.BoxGeometry(0.22, 0.72, 0.24);
    const leftLeg = new THREE.Mesh(legGeo, uniformMat);
    leftLeg.position.set(-0.14, 0.36, 0);
    leftLeg.castShadow = true;

    const rightLeg = new THREE.Mesh(legGeo, uniformMat);
    rightLeg.position.set(0.14, 0.36, 0);
    rightLeg.castShadow = true;

    // Torso + Tactical Kevlar Vest + Mag Pouches
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.68, 0.32), uniformMat);
    torso.position.set(0, 1.06, 0);
    torso.castShadow = true;

    const vest = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.48, 0.36), kevlarMat);
    vest.position.set(0, 1.08, 0);
    vest.castShadow = true;

    // Head + Ops-Core Helmet (CT) or Balaclava/Keffiyeh (T)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.59, 0);

    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.4, 0.38), isCT ? kevlarMat : skinMat);
    headMesh.castShadow = true;
    const headgear = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.2, 0.42),
      new THREE.MeshStandardMaterial({ color: isCT ? 0x273445 : 0x7c2d12, roughness: 0.7 })
    );
    headgear.position.y = 0.13;

    const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.09, 0.06), goggleMat);
    goggles.position.set(0, 0.03, -0.19);
    headGroup.add(headMesh, headgear, goggles);

    // Arms + 3D Weapon Holder
    const armPivot = new THREE.Group();
    armPivot.position.set(0.31, 1.24, 0);
    const armMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.5), uniformMat);
    armMesh.position.set(0, -0.02, -0.18);
    armMesh.castShadow = true;
    armPivot.add(armMesh);

    const gunHolder = new THREE.Group();
    gunHolder.position.set(-0.04, 0.01, -0.34);
    gunHolder.add(this.createGunMesh(pData.w || 'ak47', false));
    armPivot.add(gunHolder);

    // Overhead Name + HP Bar
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 256;
    labelCanvas.height = 64;
    const labelTex = new THREE.CanvasTexture(labelCanvas);
    labelTex.colorSpace = THREE.SRGBColorSpace;
    const spriteMat = new THREE.SpriteMaterial({ map: labelTex, transparent: true, depthTest: false });
    const nameSprite = new THREE.Sprite(spriteMat);
    nameSprite.scale.set(2.0, 0.5, 1);
    nameSprite.position.set(0, 2.15, 0);

    root.add(leftLeg, rightLeg, torso, vest, headGroup, armPivot, nameSprite);
    this.scene.add(root);

    const soldier = {
      id: pData.id,
      root,
      leftLeg,
      rightLeg,
      headGroup,
      armPivot,
      gunHolder,
      uniformMat,
      labelCanvas,
      labelTex,
      weapon: pData.w || 'ak47',
      colorHex: pData.c,
      lastHp: -1,
      lastName: '',
      targetPos: new THREE.Vector3(pData.x, pData.y, pData.z),
      targetYaw: pData.yw || 0,
      targetPitch: pData.pt || 0,
      walkPhase: 0
    };

    root.position.copy(soldier.targetPos);
    this.updateSoldierLabel(soldier, pData.n, pData.hp, pData.tm);
    return soldier;
  }

  updateSoldierLabel(soldier, name, hp, team) {
    if (soldier.lastHp === hp && soldier.lastName === name) return;
    soldier.lastHp = hp;
    soldier.lastName = name;

    const ctx = soldier.labelCanvas.getContext('2d');
    ctx.clearRect(0, 0, 256, 64);

    ctx.fillStyle = 'rgba(12, 16, 22, 0.78)';
    ctx.beginPath();
    ctx.roundRect(22, 8, 212, 46, 6);
    ctx.fill();

    ctx.font = 'bold 19px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = team === 1 ? '#7da6df' : (team === 2 ? '#e6b35a' : '#f8fafc');
    ctx.fillText(String(name || '').slice(0, 16), 128, 29);

    const pct = Math.max(0, Math.min(1, (hp || 0) / 100));
    ctx.fillStyle = '#27272a';
    ctx.fillRect(36, 38, 184, 8);
    ctx.fillStyle = pct > 0.45 ? '#22c55e' : (pct > 0.2 ? '#f59e0b' : '#ef4444');
    ctx.fillRect(36, 38, Math.round(184 * pct), 8);

    soldier.labelTex.needsUpdate = true;
  }

  syncRemotePlayers(playersList, selfId) {
    const activeIds = new Set();
    for (const p of playersList) {
      if (p.id === selfId) continue;
      activeIds.add(p.id);

      let s = this.remotePlayers.get(p.id);
      if (!s) {
        s = this.createRemoteSoldier(p);
        this.remotePlayers.set(p.id, s);
      }

      s.targetPos.set(p.x, p.y, p.z);
      s.targetYaw = p.yw || 0;
      s.targetPitch = p.pt || 0;
      s.root.visible = !p.d;
      s.crouch = !!p.cr;

      if (s.colorHex !== p.c && p.c) {
        s.colorHex = p.c;
        s.uniformMat.color.setHex(p.c);
      }

      if (s.weapon !== p.w && p.w) {
        s.weapon = p.w;
        s.gunHolder.clear();
        s.gunHolder.add(this.createGunMesh(p.w, false));
      }

      this.updateSoldierLabel(s, p.n, p.hp, p.tm);
    }

    for (const [id, s] of this.remotePlayers.entries()) {
      if (!activeIds.has(id)) {
        this.scene.remove(s.root);
        this.remotePlayers.delete(id);
      }
    }
  }

  clearRemotePlayers() {
    for (const s of this.remotePlayers.values()) {
      this.scene.remove(s.root);
    }
    this.remotePlayers.clear();
  }

  // --- Bullet Tracers, Dust Sparks, Blood Mist & Wall Bullet Holes ---
  spawnTracer(ox, oy, oz, ex, ey, ez, hitCode = 0, isMelee = false) {
    const start = new THREE.Vector3(ox, oy, oz);
    const end = new THREE.Vector3(ex, ey, ez);
    const dist = start.distanceTo(end);

    if (!isMelee && dist >= 0.25) {
      const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
      const mat = new THREE.LineBasicMaterial({
        color: 0xfef3c7,
        transparent: true,
        opacity: 0.65
      });
      const line = new THREE.Line(geo, mat);
      this.scene.add(line);
      this.tracers.push({ line, mat, geo, life: 0.065, maxLife: 0.065 });
    }

    // Hit effects: hitCode 1=body, 3=headshot -> Blood splatter; hitCode 2=wall -> Dust puff + Bullet hole!
    if (hitCode === 1 || hitCode === 3) {
      const count = hitCode === 3 ? 9 : 5;
      for (let i = 0; i < count; i++) {
        const m = new THREE.Mesh(
          new THREE.BoxGeometry(0.075, 0.075, 0.075),
          new THREE.MeshBasicMaterial({ color: hitCode === 3 ? 0xdc2626 : 0x991b1b })
        );
        m.position.copy(end);
        this.scene.add(m);
        this.particles.push({
          mesh: m,
          vx: (Math.random() - 0.5) * 5.2,
          vy: 1.0 + Math.random() * 3.8,
          vz: (Math.random() - 0.5) * 5.2,
          life: 0.28 + Math.random() * 0.14
        });
      }
    } else if (hitCode === 2) {
      // Sandstone dust chips
      for (let i = 0; i < 4; i++) {
        const m = new THREE.Mesh(
          new THREE.BoxGeometry(0.065, 0.065, 0.065),
          new THREE.MeshBasicMaterial({ color: 0xe7d5b8 })
        );
        m.position.copy(end);
        this.scene.add(m);
        this.particles.push({
          mesh: m,
          vx: (Math.random() - 0.5) * 4.2,
          vy: 1.2 + Math.random() * 3.2,
          vz: (Math.random() - 0.5) * 4.2,
          life: 0.25 + Math.random() * 0.12
        });
      }

      // Bullet impact scorch dot
      if (!isMelee) {
        const hole = new THREE.Mesh(
          new THREE.SphereGeometry(0.045, 6, 6),
          new THREE.MeshBasicMaterial({ color: 0x1c1917 })
        );
        hole.position.copy(end);
        this.scene.add(hole);
        this.decals.push({ mesh: hole, life: 12.0 });
        if (this.decals.length > 55) {
          const old = this.decals.shift();
          this.scene.remove(old.mesh);
          old.mesh.geometry.dispose();
          old.mesh.material.dispose();
        }
      }
    }
  }

  updateWorld(dt, timeSec) {
    // Gentle breeze in Dust2 Palm Trees
    for (let i = 0; i < this.palmLeaves.length; i++) {
      this.palmLeaves[i].rotation.z = Math.sin(timeSec * 1.4 + i) * 0.04;
    }

    for (const grp of this.healthPackMeshes.values()) {
      if (!grp.visible) continue;
      grp.rotation.y = timeSec * 1.4;
      grp.position.y = grp.userData.baseY + Math.sin(timeSec * 2.6) * 0.06;
    }

    // Interpolate Remote Operators
    for (const s of this.remotePlayers.values()) {
      if (!s.root.visible) continue;
      const prevX = s.root.position.x;
      const prevZ = s.root.position.z;

      s.root.position.lerp(s.targetPos, Math.min(1, 16 * dt));

      let dyaw = s.targetYaw - s.root.rotation.y;
      while (dyaw > Math.PI) dyaw -= Math.PI * 2;
      while (dyaw < -Math.PI) dyaw += Math.PI * 2;
      s.root.rotation.y += dyaw * Math.min(1, 16 * dt);

      s.headGroup.rotation.x = s.targetPitch * 0.65;
      s.armPivot.rotation.x = s.targetPitch * 0.85;

      const targetScaleY = s.crouch ? 0.72 : 1.0;
      s.root.scale.y = THREE.MathUtils.lerp(s.root.scale.y, targetScaleY, Math.min(1, 14 * dt));

      const moved = Math.hypot(s.root.position.x - prevX, s.root.position.z - prevZ) / Math.max(0.001, dt);
      if (moved > 0.5) {
        s.walkPhase += dt * Math.min(14, moved * 1.45);
        const swing = Math.sin(s.walkPhase) * 0.52;
        s.leftLeg.rotation.x = swing;
        s.rightLeg.rotation.x = -swing;
      } else {
        s.leftLeg.rotation.x = THREE.MathUtils.lerp(s.leftLeg.rotation.x, 0, Math.min(1, 10 * dt));
        s.rightLeg.rotation.x = THREE.MathUtils.lerp(s.rightLeg.rotation.x, 0, Math.min(1, 10 * dt));
      }
    }

    // Update Tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.scene.remove(t.line);
        t.geo.dispose();
        t.mat.dispose();
        this.tracers.splice(i, 1);
      } else {
        t.mat.opacity = (t.life / t.maxLife) * 0.65;
      }
    }

    // Update Brass Shells
    for (let i = this.shells.length - 1; i >= 0; i--) {
      const sh = this.shells[i];
      sh.life -= dt;
      if (sh.life <= 0) {
        this.scene.remove(sh.mesh);
        sh.mesh.geometry.dispose();
        sh.mesh.material.dispose();
        this.shells.splice(i, 1);
      } else {
        sh.vy -= 18 * dt;
        sh.mesh.position.x += sh.vx * dt;
        sh.mesh.position.y += sh.vy * dt;
        sh.mesh.position.z += sh.vz * dt;
        sh.mesh.rotation.x += 16 * dt;
        sh.mesh.rotation.z += 12 * dt;
      }
    }

    // Update Blood / Dust Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) {
        this.scene.remove(pt.mesh);
        pt.mesh.geometry.dispose();
        pt.mesh.material.dispose();
        this.particles.splice(i, 1);
      } else {
        pt.vy -= 19 * dt;
        pt.mesh.position.x += pt.vx * dt;
        pt.mesh.position.y += pt.vy * dt;
        pt.mesh.position.z += pt.vz * dt;
      }
    }

    // Update Decals
    for (let i = this.decals.length - 1; i >= 0; i--) {
      this.decals[i].life -= dt;
      if (this.decals[i].life <= 0) {
        const d = this.decals[i];
        this.scene.remove(d.mesh);
        d.mesh.geometry.dispose();
        d.mesh.material.dispose();
        this.decals.splice(i, 1);
      }
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
