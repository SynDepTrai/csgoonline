// CS:GO Dust II Web Client — Universal Attachable Scopes (Right-Click ADS, [V] Swap, [B] Buy Scopes), Economy & Settings

import {
  ARENA_HALF,
  BUY_CATEGORIES,
  CROUCH_EYE_HEIGHT,
  EYE_HEIGHT,
  GEAR_ITEMS,
  MAP_BOXES,
  RADAR_CALLOUTS,
  SCOPE_ITEMS,
  SKIN_COLORS,
  WEAPONS,
  stepPlayerPhysics
} from './map-data.js';
import { World3D } from './world-3d.js';
import { NetworkClient } from './net.js';
import { sound } from './sound.js';

const CROSSHAIR_COLORS = ['#4ade80', '#22d3ee', '#facc15', '#fb7185', '#ffffff', '#e879f9'];

const defaultSettings = {
  sens: 1.0,
  zoomSens: 0.95,
  adsMode: 'hybrid', // 'hybrid' | 'toggle' | 'hold'
  invertY: false,
  speedScale: 1.0,
  economyMode: 'csgo',
  fov: 75,
  hand: 'right',
  shadows: true,
  volMaster: 55,
  volStep: 110,
  chStyle: 'dynamic',
  scopeStyle: 'csgo',
  chColor: '#4ade80',
  chLen: 7,
  chGap: 4,
  chThick: 2,
  chDot: false,
  chOutline: true
};

let cfg = { ...defaultSettings };
try {
  const saved = JSON.parse(localStorage.getItem('csgo_web_cfg') || '{}');
  cfg = { ...defaultSettings, ...saved };
} catch {}

function saveCfg() {
  localStorage.setItem('csgo_web_cfg', JSON.stringify(cfg));
}

// --- DOM Elements ---
const elMenu = document.getElementById('menu-screen');
const elHud = document.getElementById('hud');
const elPause = document.getElementById('pause-overlay');
const elBuyOverlay = document.getElementById('buy-overlay');
const elSettingsModal = document.getElementById('settings-modal');
const elScopeOverlay = document.getElementById('scope-overlay');
const scopeCanvas = document.getElementById('scope-canvas');
const scopeCtx = scopeCanvas.getContext('2d');
const elScopeZoomBadge = document.getElementById('scope-zoom-badge');
const elDmgFlash = document.getElementById('damage-flash');
const elError = document.getElementById('menu-error');
const elOnlineStat = document.getElementById('menu-online-stat');

const inputName = document.getElementById('player-name');
const inputRoomCode = document.getElementById('room-code-input');
const selectMode = document.getElementById('create-mode');
const selectEco = document.getElementById('create-eco');
const selectBots = document.getElementById('create-bots');
const selectLimit = document.getElementById('create-limit');

const hudMoney = document.getElementById('hud-money');
const elEcoToast = document.getElementById('eco-toast');
const hudCtScore = document.getElementById('hud-ct-score');
const hudTScore = document.getElementById('hud-t-score');
const hudModeBadge = document.getElementById('hud-mode-badge');
const hudRoomCode = document.getElementById('hud-room-code');
const hudTargetLine = document.getElementById('hud-target-line');
const hudNetInfo = document.getElementById('hud-net-info');
const hudHpNum = document.getElementById('hud-hp-num');
const hudHpFill = document.getElementById('hud-hp-fill');
const hudArmorNum = document.getElementById('hud-armor-num');
const hudArmorFill = document.getElementById('hud-armor-fill');
const hudOpticBadge = document.getElementById('hud-optic-badge');
const hudWeaponName = document.getElementById('hud-weapon-name');
const hudAmmoCur = document.getElementById('hud-ammo-cur');
const hudAmmoRes = document.getElementById('hud-ammo-res');

const slotPrimary = document.getElementById('slot-primary');
const slotSecondary = document.getElementById('slot-secondary');
const slotMelee = document.getElementById('slot-melee');
const slotMedishot = document.getElementById('slot-medishot');

const chCanvas = document.getElementById('crosshair-canvas');
const chCtx = chCanvas.getContext('2d');
const chPreviewCanvas = document.getElementById('ch-preview-canvas');
const chPreviewCtx = chPreviewCanvas.getContext('2d');

const elReloadBanner = document.getElementById('reload-banner');
const elRespawnBanner = document.getElementById('respawn-banner');
const elRespawnKiller = document.getElementById('respawn-killer');
const elMatchEndBanner = document.getElementById('match-end-banner');
const elMatchWinnerText = document.getElementById('match-winner-text');
const elHitmarker = document.getElementById('hitmarker');
const elPopups = document.getElementById('floating-popups');
const elKillfeed = document.getElementById('killfeed');
const elScoreboard = document.getElementById('scoreboard');
const elSbBody = document.getElementById('sb-body');
const elSbRoomInfo = document.getElementById('sb-room-info');
const elChatMessages = document.getElementById('chat-messages');
const elChatInput = document.getElementById('chat-input');
const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');

const world = new World3D(document.getElementById('game-canvas-container'));

let selectedSkin = Number(localStorage.getItem('voxshot_skin') || 0);
let selectedWeapon = localStorage.getItem('voxshot_weapon') || 'ak47';
if (!WEAPONS[selectedWeapon]) selectedWeapon = 'ak47';
let friendNetMode = 'ws';

if (localStorage.getItem('voxshot_name')) {
  inputName.value = localStorage.getItem('voxshot_name');
}

// --- Match State ---
let inMatch = false;
let selfId = null;
let roomCode = '';
let isPublicRoom = false;
let gameMode = 'tdm';
let roomEconomyMode = 'csgo';
let roomSpeedScale = 1.0;
let scoreLimit = 30;
let teamScores = { 1: 0, 2: 0 };
let latestPlayers = [];
let matchEnded = false;
let buyOpen = false;
let settingsOpen = false;
let chatFocused = false;

const localPlayer = {
  x: 0,
  y: 2,
  z: 0,
  vx: 0,
  vy: 0,
  vz: 0,
  yaw: 0,
  pitch: 0,
  grounded: false,
  crouch: false,
  walk: false,
  hp: 100,
  armor: 100,
  money: 4200,
  medishots: 1,
  dead: false,
  primary: 'ak47',
  secondary: 'usp',
  weapon: 'ak47',
  lastWeapon: 'usp',
  activeOptic: 'reddot',
  ownedScopes: ['iron', 'reddot'],
  zoomLevel: 0, // 0 = off, 1 = zoom1, 2 = zoom2
  ammo: {},
  reserve: {},
  reloading: false,
  reloadTimer: 0,
  reloadTotal: 1,
  lastFireTime: 0,
  sprayShots: 0,
  dynamicGapBoost: 0
};

function initWeaponAmmo(weaponId) {
  const w = WEAPONS[weaponId];
  if (!w || w.isMelee) return;
  localPlayer.ammo[weaponId] = w.magSize;
  localPlayer.reserve[weaponId] = w.reserveAmmo;
}

function resetAllOwnedAmmo() {
  for (const id of Object.keys(WEAPONS)) {
    initWeaponAmmo(id);
  }
}
resetAllOwnedAmmo();

// Resolve which Optic/Scope is active on the current weapon!
function getEffectiveOptic() {
  const wCfg = WEAPONS[localPlayer.weapon];
  if (!wCfg || wCfg.isMelee) return null;
  // Built-in sniper scopes on AWP & Scout unless player explicitly bought Thermal!
  if ((wCfg.id === 'awp' || wCfg.id === 'ssg08') && localPlayer.activeOptic !== 'thermal') {
    return SCOPE_ITEMS.sniper8x;
  }
  return SCOPE_ITEMS[localPlayer.activeOptic] || SCOPE_ITEMS[wCfg.defaultOptic] || SCOPE_ITEMS.reddot;
}

// Input state
const keys = new Set();
let mouseDownLeft = false;
let rightMouseDownAt = 0;
let hitmarkerTimer = 0;
let dmgFlashAlpha = 0;
let stateSendAccum = 0;
let stepDistAccum = 0;
let radarEnemyPings = [];

function applyRuntimeSettings() {
  sound.masterVolume = (cfg.volMaster / 100) * 0.9;
  sound.footstepVolume = cfg.volStep / 100;
  world.setShadowQuality(cfg.shadows);
  world.vmRoot.scale.x = cfg.hand === 'left' ? -1 : 1;
  selectEco.value = cfg.economyMode;
  drawCrosshairPreview();
}

// --- Settings UI Wiring ---
function setupSettingsModal() {
  const sensRange = document.getElementById('set-sens-range');
  const sensNum = document.getElementById('set-sens-num');
  const zoomRange = document.getElementById('set-zoom-sens-range');
  const zoomNum = document.getElementById('set-zoom-sens-num');
  const adsModeSel = document.getElementById('set-ads-mode');
  const invertSel = document.getElementById('set-invert-y');
  const speedRange = document.getElementById('set-speed-range');
  const speedVal = document.getElementById('set-speed-val');
  const ecoSel = document.getElementById('set-eco-mode');
  const botsSel = document.getElementById('set-room-bots');

  const chStyleSel = document.getElementById('set-ch-style');
  const scopeStyleSel = document.getElementById('set-scope-style');
  const chLen = document.getElementById('set-ch-len');
  const valChLen = document.getElementById('val-ch-len');
  const chGap = document.getElementById('set-ch-gap');
  const valChGap = document.getElementById('val-ch-gap');
  const chThick = document.getElementById('set-ch-thick');
  const valChThick = document.getElementById('val-ch-thick');
  const chDot = document.getElementById('set-ch-dot');
  const chOutline = document.getElementById('set-ch-outline');

  const fovRange = document.getElementById('set-fov');
  const valFov = document.getElementById('val-fov');
  const handSel = document.getElementById('set-hand');
  const shadowSel = document.getElementById('set-shadows');
  const volMaster = document.getElementById('set-vol-master');
  const valVolMaster = document.getElementById('val-vol-master');
  const volStep = document.getElementById('set-vol-step');
  const valVolStep = document.getElementById('val-vol-step');

  sensRange.value = String(cfg.sens);
  sensNum.value = cfg.sens.toFixed(2);
  zoomRange.value = String(cfg.zoomSens);
  zoomNum.value = cfg.zoomSens.toFixed(2);
  adsModeSel.value = cfg.adsMode || 'hybrid';
  invertSel.value = cfg.invertY ? '1' : '0';
  speedRange.value = String(cfg.speedScale);
  speedVal.textContent = `${Math.round(cfg.speedScale * 100)}%`;
  ecoSel.value = cfg.economyMode;

  chStyleSel.value = cfg.chStyle;
  scopeStyleSel.value = cfg.scopeStyle;
  chLen.value = String(cfg.chLen); valChLen.textContent = String(cfg.chLen);
  chGap.value = String(cfg.chGap); valChGap.textContent = String(cfg.chGap);
  chThick.value = String(cfg.chThick); valChThick.textContent = String(cfg.chThick);
  chDot.checked = !!cfg.chDot;
  chOutline.checked = !!cfg.chOutline;

  fovRange.value = String(cfg.fov); valFov.textContent = `${cfg.fov}°`;
  handSel.value = cfg.hand;
  shadowSel.value = cfg.shadows ? '1' : '0';
  volMaster.value = String(cfg.volMaster); valVolMaster.textContent = `${cfg.volMaster}%`;
  volStep.value = String(cfg.volStep); valVolStep.textContent = `${cfg.volStep}%`;

  const swatchRow = document.getElementById('ch-color-swatches');
  function renderChColors() {
    swatchRow.innerHTML = '';
    CROSSHAIR_COLORS.forEach((hex) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ch-swatch' + (cfg.chColor === hex ? ' active' : '');
      b.style.background = hex;
      b.onclick = () => {
        cfg.chColor = hex;
        saveCfg();
        renderChColors();
        drawCrosshairPreview();
      };
      swatchRow.appendChild(b);
    });
  }
  renderChColors();

  document.querySelectorAll('.s-tab').forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll('.s-tab').forEach((t) => t.classList.toggle('active', t === btn));
      document.querySelectorAll('.s-tab-body').forEach((b) => b.classList.toggle('hidden', b.id !== btn.dataset.stab));
      drawCrosshairPreview();
    };
  });

  sensRange.oninput = () => {
    cfg.sens = Number(sensRange.value);
    sensNum.value = cfg.sens.toFixed(2);
    saveCfg();
  };
  sensNum.onchange = () => {
    cfg.sens = Math.max(0.1, Math.min(4.0, Number(sensNum.value) || 1.0));
    sensRange.value = String(cfg.sens);
    sensNum.value = cfg.sens.toFixed(2);
    saveCfg();
  };

  zoomRange.oninput = () => {
    cfg.zoomSens = Number(zoomRange.value);
    zoomNum.value = cfg.zoomSens.toFixed(2);
    saveCfg();
  };
  zoomNum.onchange = () => {
    cfg.zoomSens = Math.max(0.3, Math.min(2.0, Number(zoomNum.value) || 0.95));
    zoomRange.value = String(cfg.zoomSens);
    zoomNum.value = cfg.zoomSens.toFixed(2);
    saveCfg();
  };

  adsModeSel.onchange = () => {
    cfg.adsMode = adsModeSel.value;
    saveCfg();
  };

  invertSel.onchange = () => {
    cfg.invertY = invertSel.value === '1';
    saveCfg();
  };

  speedRange.oninput = () => {
    cfg.speedScale = Number(speedRange.value);
    roomSpeedScale = cfg.speedScale;
    speedVal.textContent = `${Math.round(cfg.speedScale * 100)}%`;
    saveCfg();
    if (inMatch) net.send({ t: 'cfg', speedScale: cfg.speedScale });
  };

  ecoSel.onchange = () => {
    cfg.economyMode = ecoSel.value;
    saveCfg();
    selectEco.value = cfg.economyMode;
    if (inMatch) net.send({ t: 'cfg', economyMode: cfg.economyMode });
  };

  botsSel.onchange = () => {
    if (inMatch) net.send({ t: 'cfg', botCount: Number(botsSel.value) });
    else selectBots.value = botsSel.value;
  };

  const onChChange = () => {
    cfg.chStyle = chStyleSel.value;
    cfg.scopeStyle = scopeStyleSel.value;
    cfg.chLen = Number(chLen.value); valChLen.textContent = String(cfg.chLen);
    cfg.chGap = Number(chGap.value); valChGap.textContent = String(cfg.chGap);
    cfg.chThick = Number(chThick.value); valChThick.textContent = String(cfg.chThick);
    cfg.chDot = chDot.checked;
    cfg.chOutline = chOutline.checked;
    saveCfg();
    drawCrosshairPreview();
  };
  [chStyleSel, scopeStyleSel, chLen, chGap, chThick, chDot, chOutline].forEach((el) => {
    el.addEventListener('input', onChChange);
    el.addEventListener('change', onChChange);
  });

  fovRange.oninput = () => {
    cfg.fov = Number(fovRange.value);
    valFov.textContent = `${cfg.fov}°`;
    saveCfg();
  };
  handSel.onchange = () => {
    cfg.hand = handSel.value;
    saveCfg();
    applyRuntimeSettings();
  };
  shadowSel.onchange = () => {
    cfg.shadows = shadowSel.value === '1';
    saveCfg();
    applyRuntimeSettings();
  };
  volMaster.oninput = () => {
    cfg.volMaster = Number(volMaster.value);
    valVolMaster.textContent = `${cfg.volMaster}%`;
    saveCfg();
    applyRuntimeSettings();
  };
  volStep.oninput = () => {
    cfg.volStep = Number(volStep.value);
    valVolStep.textContent = `${cfg.volStep}%`;
    saveCfg();
    applyRuntimeSettings();
  };
}

function openSettingsModal() {
  settingsOpen = true;
  if (document.pointerLockElement) document.exitPointerLock();
  elPause.classList.add('hidden');
  elSettingsModal.classList.remove('hidden');
  drawCrosshairPreview();
}

function closeSettingsModal() {
  settingsOpen = false;
  elSettingsModal.classList.add('hidden');
  if (inMatch) requestGamePointerLock();
}

document.getElementById('btn-menu-settings').onclick = openSettingsModal;
document.getElementById('btn-hud-settings').onclick = (e) => { e.stopPropagation(); openSettingsModal(); };
document.getElementById('btn-pause-settings').onclick = openSettingsModal;
document.getElementById('btn-close-settings').onclick = closeSettingsModal;

// --- Crosshair & Multi-Optic Scope Renderer ---
function renderCrosshair(ctx, w, h, dynamicExtraGap = 0) {
  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);

  const style = cfg.chStyle;
  const color = cfg.chColor;
  const thick = cfg.chThick;
  const len = cfg.chLen;
  const gap = cfg.chGap + (style === 'dynamic' ? dynamicExtraGap : 0);
  const outline = cfg.chOutline;

  const drawRect = (x, y, rw, rh) => {
    if (outline) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
      ctx.fillRect(x - 1, y - 1, rw + 2, rh + 2);
    }
    ctx.fillStyle = color;
    ctx.fillRect(x, y, rw, rh);
  };

  if (style === 'dot') {
    const d = Math.max(3, thick + 1);
    drawRect(cx - d / 2, cy - d / 2, d, d);
    return;
  }

  if (style === 'circle') {
    const radius = Math.max(6, gap + len * 0.7);
    if (outline) {
      ctx.strokeStyle = 'rgba(0,0,0,0.85)';
      ctx.lineWidth = thick + 2;
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = thick;
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
    drawRect(cx - 1.5, cy - 1.5, 3, 3);
    return;
  }

  const halfT = thick / 2;
  if (style !== 'tshape') {
    drawRect(cx - halfT, cy - gap - len, thick, len);
  }
  drawRect(cx - halfT, cy + gap, thick, len);
  drawRect(cx - gap - len, cy - halfT, len, thick);
  drawRect(cx + gap, cy - halfT, len, thick);

  if (cfg.chDot) {
    drawRect(cx - halfT, cy - halfT, thick, thick);
  }
}

function drawCrosshairPreview() {
  const w = chPreviewCanvas.width;
  const h = chPreviewCanvas.height;
  const grad = chPreviewCtx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#c9b38c');
  grad.addColorStop(0.5, '#dfd0b4');
  grad.addColorStop(1, '#8c6d46');
  chPreviewCtx.fillStyle = grad;
  chPreviewCtx.fillRect(0, 0, w, h);

  chPreviewCtx.strokeStyle = 'rgba(90, 70, 45, 0.25)';
  chPreviewCtx.beginPath();
  chPreviewCtx.moveTo(0, h / 2 + 18); chPreviewCtx.lineTo(w, h / 2 + 18);
  chPreviewCtx.stroke();

  renderCrosshair(chPreviewCtx, w, h, 0);
}

// Draws ALL 6 Scope / Sight Reticles cleanly!
function drawScopeOverlay(optic, moveSpeed) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (scopeCanvas.width !== w || scopeCanvas.height !== h) {
    scopeCanvas.width = w;
    scopeCanvas.height = h;
  }
  const ctx = scopeCtx;
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const reticleType = optic.reticle;

  ctx.save();

  // Case A: Reflex Open Sights (Iron / Red-Dot / Holo EOTech) — Wide Peripheral Vision!
  if (reticleType === 'iron' || reticleType === 'reddot' || reticleType === 'holo') {
    // Subtle tactical peripheral focus vignette
    const vGrad = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.25, cx, cy, Math.max(w, h) * 0.72);
    vGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vGrad.addColorStop(1, 'rgba(5, 8, 14, 0.45)');
    ctx.fillStyle = vGrad;
    ctx.fillRect(0, 0, w, h);

    if (reticleType === 'iron') {
      // Crisp Iron Sight Post & Rear Notch
      ctx.strokeStyle = 'rgba(20, 24, 30, 0.92)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx - 26, cy + 4); ctx.lineTo(cx - 8, cy + 4);
      ctx.moveTo(cx + 8, cy + 4); ctx.lineTo(cx + 26, cy + 4);
      ctx.moveTo(cx, cy + 28); ctx.lineTo(cx, cy + 2);
      ctx.stroke();

      ctx.fillStyle = '#4ade80';
      ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, Math.PI * 2); ctx.fill();
    } else if (reticleType === 'reddot') {
      // Sleek Reflex Red-Dot Sight Housing + Anti-Reflective Cyan Tint + Glowing Red Laser Dot!
      const rw = 190;
      const rh = 136;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.beginPath();
      ctx.roundRect(cx - rw / 2, cy - rh / 2, rw, rh, 36);
      ctx.fill();

      ctx.strokeStyle = 'rgba(18, 22, 28, 0.94)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.roundRect(cx - rw / 2, cy - rh / 2, rw, rh, 36);
      ctx.stroke();

      // Glowing Red Dot
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ff2a2a';
      ctx.beginPath();
      ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // Authentic EOTech Holographic Sight (Boxy Steel Hood + 68 MOA Segmented Red Ring + 1 MOA Dot!)
      const hw = 210;
      const hh = 148;
      ctx.fillStyle = 'rgba(34, 211, 238, 0.04)';
      ctx.beginPath();
      ctx.roundRect(cx - hw / 2, cy - hh / 2, hw, hh, 16);
      ctx.fill();

      ctx.strokeStyle = 'rgba(20, 24, 30, 0.95)';
      ctx.lineWidth = 13;
      ctx.beginPath();
      ctx.roundRect(cx - hw / 2, cy - hh / 2, hw, hh, 16);
      ctx.stroke();

      // Glowing Holographic Circle + 4 Cardinal Ticks + Center Dot
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 8;
      ctx.strokeStyle = '#fb7185';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.stroke();

      for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
        ctx.beginPath();
        ctx.moveTo(cx + dx * 20, cy + dy * 20);
        ctx.lineTo(cx + dx * 30, cy + dy * 30);
        ctx.stroke();
      }
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(cx, cy, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
    return;
  }

  // Case B: Magnified Tube Scopes (ACOG 4x / Sniper 8x / Thermal 6x)
  const radius = Math.min(w, h) * (reticleType === 'acog' ? 0.39 : 0.43);

  // Thermal Green Night-Vision Tint inside the lens!
  if (reticleType === 'thermal') {
    ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Clean Even-Odd Outer Black Mask (Zero subpath artifacts!)
  ctx.fillStyle = reticleType === 'acog' ? 'rgba(6, 9, 14, 0.88)' : 'rgba(3, 5, 8, 0.98)';
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.moveTo(cx + radius, cy);
  ctx.arc(cx, cy, radius, 0, Math.PI * 2, true);
  ctx.fill('evenodd');

  // Lens Rim + CS:GO Movement Blur Ring
  const blurWidth = Math.min(18, 3 + moveSpeed * 2.1);
  ctx.strokeStyle = '#090d14';
  ctx.lineWidth = blurWidth * 2;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  if (reticleType === 'acog') {
    // ACOG 4x Tactical Chevron + BDC Bullet Drop Stadia Lines!
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx - radius, cy); ctx.lineTo(cx - 28, cy);
    ctx.moveTo(cx + 28, cy); ctx.lineTo(cx + radius, cy);
    ctx.moveTo(cx, cy + 16); ctx.lineTo(cx, cy + radius);
    ctx.stroke();

    // BDC horizontal range ticks (200m, 400m, 600m)
    for (let i = 1; i <= 4; i++) {
      const y = cy + 16 + i * 24;
      const hw = 14 - i * 2;
      ctx.beginPath();
      ctx.moveTo(cx - hw, y); ctx.lineTo(cx + hw, y);
      ctx.stroke();
    }

    // Glowing Red Fiber-Optic Chevron ^
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + 9);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + 10, cy + 9);
    ctx.stroke();
    ctx.shadowBlur = 0;
  } else if (reticleType === 'thermal') {
    // Digital Thermal Rangefinder Grid
    ctx.strokeStyle = 'rgba(110, 231, 183, 0.82)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.8, cy); ctx.lineTo(cx - 18, cy);
    ctx.moveTo(cx + 18, cy); ctx.lineTo(cx + radius * 0.8, cy);
    ctx.moveTo(cx, cy - radius * 0.8); ctx.lineTo(cx, cy - 18);
    ctx.moveTo(cx, cy + 18); ctx.lineTo(cx, cy + radius * 0.8);
    ctx.stroke();

    ctx.strokeRect(cx - 16, cy - 16, 32, 32);
    ctx.fillStyle = '#ecfdf5';
    ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, Math.PI * 2); ctx.fill();

    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#6ee7b7';
    ctx.fillText('FLIR THERMAL // ACTIVE', cx - radius * 0.55, cy - radius * 0.55);
  } else {
    // Sniper 8x: Uses user's selected Sniper Scope Style (CS:GO Classic / Mil-Dot / Red-Dot)!
    const sStyle = cfg.scopeStyle;
    if (sStyle === 'mildot') {
      ctx.strokeStyle = 'rgba(10, 14, 18, 0.92)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius);
      ctx.stroke();

      ctx.fillStyle = '#111827';
      for (let i = -5; i <= 5; i++) {
        if (i === 0) continue;
        const step = radius * 0.12;
        ctx.beginPath(); ctx.arc(cx + i * step, cy, 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy + i * step, 2.6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#22c55e';
      ctx.beginPath(); ctx.arc(cx, cy, 2.8, 0, Math.PI * 2); ctx.fill();
    } else if (sStyle === 'reddot') {
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
    } else {
      // Authentic CS:GO Sniper Crosshair (blurs when moving fast!)
      ctx.strokeStyle = moveSpeed > 1.8 ? 'rgba(0,0,0,0.45)' : '#000000';
      ctx.lineWidth = moveSpeed > 1.8 ? 3.6 : 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy); ctx.lineTo(cx + radius, cy);
      ctx.moveTo(cx, cy - radius); ctx.lineTo(cx, cy + radius);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(cx, cy, 2.2, 0, Math.PI * 2); ctx.fill();
    }
  }

  ctx.restore();
}

// --- CS:GO Buy Menu [B] (Guns + Scopes + Gear!) ---
function renderBuyMenu() {
  const isFree = roomEconomyMode === 'free';
  document.getElementById('buy-money-val').textContent = isFree ? '$16000 (MIỄN PHÍ)' : `$${localPlayer.money}`;

  const grid = document.getElementById('buy-grid');
  grid.innerHTML = '';

  for (const cat of BUY_CATEGORIES) {
    const col = document.createElement('div');
    col.className = 'buy-col';
    col.innerHTML = `<div class="buy-col-title">${cat.title}</div>`;

    for (const wId of cat.items) {
      const w = WEAPONS[wId];
      const owned = localPlayer.primary === wId || localPlayer.secondary === wId;
      const priceText = isFree ? 'MIỄN PHÍ' : `$${w.price}`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'buy-item-btn' + (owned ? ' equipped' : '');
      btn.innerHTML = `
        <div class="buy-item-top">
          <span>${w.name}</span>
          <span class="buy-price">${owned ? 'ĐANG CÓ' : priceText}</span>
        </div>
        <div class="buy-stats">Dmg: ${w.damage} (Đầu: ${Math.round(w.damage * w.headshotMult)}) • Thưởng: $${w.killReward}</div>
      `;
      btn.onclick = () => net.send({ t: 'buy', item: wId });
      col.appendChild(btn);
    }
    grid.appendChild(col);
  }

  // Render Attachable Scopes Grid!
  const scopeGrid = document.getElementById('buy-scope-cards');
  scopeGrid.innerHTML = '';
  for (const sc of Object.values(SCOPE_ITEMS)) {
    const isEquipped = localPlayer.activeOptic === sc.id;
    const isOwned = (localPlayer.ownedScopes || []).includes(sc.id);
    const priceLabel = isEquipped ? 'ĐANG GẮN' : (isOwned || isFree || sc.price === 0 ? 'LẮP NGAY ($0)' : `$${sc.price}`);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'buy-item-btn' + (isEquipped ? ' equipped' : '');
    btn.innerHTML = `
      <div class="buy-item-top">
        <span>🔭 ${sc.name}</span>
        <span class="buy-price">${priceLabel}</span>
      </div>
      <div class="buy-stats">${sc.desc}</div>
    `;
    btn.onclick = () => net.send({ t: 'buy', item: sc.id });
    scopeGrid.appendChild(btn);
  }

  const gearWrap = document.getElementById('buy-gear-cards');
  gearWrap.innerHTML = '';
  for (const g of Object.values(GEAR_ITEMS)) {
    const priceText = isFree ? 'MIỄN PHÍ' : `$${g.price}`;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'buy-item-btn';
    btn.innerHTML = `
      <div class="buy-item-top">
        <span>🛡️ ${g.name}</span>
        <span class="buy-price">${priceText}</span>
      </div>
      <div class="buy-stats">${g.desc}</div>
    `;
    btn.onclick = () => net.send({ t: 'buy', item: g.id });
    gearWrap.appendChild(btn);
  }
}

function toggleBuyMenu(forceState) {
  if (!inMatch) return;
  buyOpen = forceState !== undefined ? forceState : !buyOpen;
  if (buyOpen) {
    if (document.pointerLockElement) document.exitPointerLock();
    elPause.classList.add('hidden');
    renderBuyMenu();
    elBuyOverlay.classList.remove('hidden');
  } else {
    elBuyOverlay.classList.add('hidden');
    requestGamePointerLock();
  }
}

function cycleOwnedScope() {
  const list = localPlayer.ownedScopes && localPlayer.ownedScopes.length > 0
    ? localPlayer.ownedScopes
    : ['iron', 'reddot'];
  const idx = list.indexOf(localPlayer.activeOptic);
  const nextId = list[(idx + 1) % list.length];
  localPlayer.activeOptic = nextId;
  world.setViewmodelWeapon(localPlayer.weapon, localPlayer.activeOptic);
  sound.playScopeZoom();
  updateInventoryHud();
  showEcoToast(`Đã đổi sang ${SCOPE_ITEMS[nextId]?.name || nextId}`);
}

document.getElementById('btn-open-buy').onclick = (e) => { e.stopPropagation(); toggleBuyMenu(true); };
document.getElementById('btn-pause-buy').onclick = () => toggleBuyMenu(true);
document.getElementById('btn-close-buy').onclick = () => toggleBuyMenu(false);

// --- Lobby Controls ---
function renderSkinSwatches() {
  const container = document.getElementById('skin-picker');
  container.innerHTML = '';
  SKIN_COLORS.forEach((hex, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'skin-swatch' + (idx === selectedSkin ? ' active' : '');
    btn.style.background = `#${hex.toString(16).padStart(6, '0')}`;
    btn.onclick = () => {
      selectedSkin = idx;
      localStorage.setItem('voxshot_skin', String(idx));
      renderSkinSwatches();
    };
    container.appendChild(btn);
  });
}
renderSkinSwatches();

document.querySelectorAll('.w-card').forEach((card) => {
  card.classList.toggle('selected', card.dataset.weapon === selectedWeapon);
  card.onclick = () => {
    selectedWeapon = card.dataset.weapon;
    localStorage.setItem('voxshot_weapon', selectedWeapon);
    document.querySelectorAll('.w-card').forEach((c) => c.classList.toggle('selected', c === card));
  };
});

document.querySelectorAll('.net-tab').forEach((tab) => {
  tab.onclick = () => {
    friendNetMode = tab.dataset.net;
    document.querySelectorAll('.net-tab').forEach((t) => t.classList.toggle('active', t === tab));
    document.getElementById('net-tab-desc').textContent = friendNetMode === 'ws'
      ? 'Tạo mã phòng 5 ký tự trên Server độ trễ thấp — gửi mã hoặc Link mời cho bạn bè vào bắn ngay.'
      : 'Kết nối ngang hàng WebRTC (PeerJS) trực tiếp giữa các trình duyệt — bắn xuyên mạng Internet không cần Server!';
  };
});

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('p2p')) {
  friendNetMode = 'p2p';
  document.querySelectorAll('.net-tab').forEach((t) => t.classList.toggle('active', t.dataset.net === 'p2p'));
  inputRoomCode.value = urlParams.get('p2p').toUpperCase();
} else if (urlParams.get('room')) {
  inputRoomCode.value = urlParams.get('room').toUpperCase();
}

async function refreshServerStatus() {
  if (inMatch) return;
  try {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('offline');
    const data = await res.json();
    elOnlineStat.textContent = `Dust II Online • ${data.onlineHumans} đặc nhiệm đang chiến đấu`;
  } catch {
    elOnlineStat.textContent = 'Chế độ Tĩnh • Hỗ trợ Phòng P2P Trực Tiếp';
  }
}
refreshServerStatus();
setInterval(refreshServerStatus, 6000);

function showMenuError(msg) {
  if (!msg) { elError.classList.add('hidden'); return; }
  elError.textContent = msg;
  elError.classList.remove('hidden');
}

function getProfile() {
  const name = inputName.value.trim() || 'Operator';
  localStorage.setItem('voxshot_name', name);
  return { name, weapon: selectedWeapon, skin: selectedSkin };
}

const net = new NetworkClient({
  onMessage: handleServerMessage,
  onDisconnect: (reason) => leaveToMenu(reason || 'Đã ngắt kết nối.'),
  onStatus: () => {}
});

document.getElementById('btn-quick-play').onclick = async () => {
  sound.init();
  showMenuError('');
  const btn = document.getElementById('btn-quick-play');
  btn.disabled = true;
  btn.textContent = '⏳ ĐANG VÀO DUST II...';
  try {
    await net.connectWebSocket({ t: 'quickPlay', ...getProfile() });
    enterMatchLock();
  } catch (err) {
    showMenuError(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = '⚡ TÌM PHÒNG NHANH (GO!)';
  }
};

document.getElementById('btn-create-room').onclick = async () => {
  sound.init();
  showMenuError('');
  const payload = {
    ...getProfile(),
    mode: selectMode.value,
    economyMode: selectEco.value,
    speedScale: cfg.speedScale,
    botCount: Number(selectBots.value),
    scoreLimit: Number(selectLimit.value)
  };
  const btn = document.getElementById('btn-create-room');
  btn.disabled = true;
  try {
    if (friendNetMode === 'p2p') await net.hostP2PRoom(payload);
    else await net.connectWebSocket({ t: 'createRoom', ...payload });
    enterMatchLock();
  } catch (err) {
    showMenuError(err.message);
  } finally {
    btn.disabled = false;
  }
};

document.getElementById('btn-join-room').onclick = async () => {
  sound.init();
  showMenuError('');
  const code = inputRoomCode.value.trim().toUpperCase();
  if (!code) {
    showMenuError('Vui lòng nhập mã phòng 5 ký tự của bạn bè!');
    return;
  }
  const btn = document.getElementById('btn-join-room');
  btn.disabled = true;
  try {
    if (friendNetMode === 'p2p') await net.joinP2PRoom({ roomCode: code, ...getProfile() });
    else await net.connectWebSocket({ t: 'joinRoom', roomCode: code, ...getProfile() });
    enterMatchLock();
  } catch (err) {
    showMenuError(err.message);
  } finally {
    btn.disabled = false;
  }
};

function buildInviteLink() {
  const base = `${window.location.origin}${window.location.pathname}`;
  const param = net.transportType && net.transportType.startsWith('p2p') ? 'p2p' : 'room';
  return `${base}?${param}=${encodeURIComponent(roomCode)}`;
}

async function copyText(text, msg = 'Đã sao chép!') {
  try {
    await navigator.clipboard.writeText(text);
    const toast = document.getElementById('copy-toast');
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2200);
  } catch {}
}

document.getElementById('btn-copy-code').onclick = () => copyText(roomCode, `Đã copy mã phòng: ${roomCode}`);
document.getElementById('btn-copy-link').onclick = () => copyText(buildInviteLink(), 'Đã copy Link mời vào thẳng phòng!');
document.getElementById('btn-hud-copy').onclick = (e) => {
  e.stopPropagation();
  copyText(buildInviteLink(), 'Đã copy Link!');
  const b = document.getElementById('btn-hud-copy');
  b.textContent = '✓ Đã Copy!';
  setTimeout(() => { b.textContent = '🔗 Copy Link Mời'; }, 1800);
};

document.getElementById('btn-resume').onclick = () => requestGamePointerLock();
document.getElementById('btn-leave').onclick = () => leaveToMenu('');

function enterMatchLock() {
  inMatch = true;
  buyOpen = false;
  settingsOpen = false;
  elMenu.classList.add('hidden');
  elPause.classList.add('hidden');
  elBuyOverlay.classList.add('hidden');
  elSettingsModal.classList.add('hidden');
  elHud.classList.remove('hidden');
  requestGamePointerLock();
}

function leaveToMenu(errMsg = '') {
  inMatch = false;
  buyOpen = false;
  net.disconnect();
  world.clearRemotePlayers();
  if (document.pointerLockElement) document.exitPointerLock();
  elHud.classList.add('hidden');
  elPause.classList.add('hidden');
  elBuyOverlay.classList.add('hidden');
  elScopeOverlay.classList.add('hidden');
  elMenu.classList.remove('hidden');
  showMenuError(errMsg);
  refreshServerStatus();
}

function requestGamePointerLock() {
  if (!inMatch || chatFocused || buyOpen || settingsOpen) return;
  const canvas = world.renderer.domElement;
  if (canvas.requestPointerLock) canvas.requestPointerLock();
}

document.addEventListener('pointerlockchange', () => {
  if (!inMatch) return;
  const locked = document.pointerLockElement === world.renderer.domElement;
  if (locked) {
    elPause.classList.add('hidden');
    elBuyOverlay.classList.add('hidden');
    elSettingsModal.classList.add('hidden');
    buyOpen = false;
    settingsOpen = false;
  } else if (!chatFocused && !buyOpen && !settingsOpen) {
    mouseDownLeft = false;
    setZoomLevel(0);
    document.getElementById('pause-room-code').textContent = roomCode;
    document.getElementById('pause-net-badge').textContent =
      net.transportType && net.transportType.startsWith('p2p') ? 'P2P WebRTC' : 'Server WS';
    elPause.classList.remove('hidden');
  }
});

world.renderer.domElement.addEventListener('mousedown', () => {
  if (inMatch && !document.pointerLockElement && !chatFocused && !buyOpen && !settingsOpen) {
    requestGamePointerLock();
  }
});

// --- Server Message Handler ---
function showEcoToast(text) {
  if (!text) return;
  elEcoToast.textContent = text;
  elEcoToast.classList.remove('hidden');
  clearTimeout(showEcoToast._t);
  showEcoToast._t = setTimeout(() => elEcoToast.classList.add('hidden'), 2800);
}

function handleServerMessage(msg) {
  switch (msg.t) {
    case 'welcome': {
      selfId = msg.selfId;
      roomCode = msg.roomCode;
      isPublicRoom = !!msg.isPublic;
      gameMode = msg.mode || 'tdm';
      roomEconomyMode = msg.economyMode || 'csgo';
      roomSpeedScale = msg.speedScale || 1.0;
      scoreLimit = msg.scoreLimit || 30;
      teamScores = msg.teamScores || { 1: 0, 2: 0 };
      matchEnded = false;

      localPlayer.money = msg.money ?? 4200;
      localPlayer.primary = msg.primary || 'ak47';
      localPlayer.secondary = msg.secondary || 'usp';
      localPlayer.activeOptic = msg.activeOptic || 'reddot';
      localPlayer.ownedScopes = msg.ownedScopes || ['iron', 'reddot'];
      localPlayer.medishots = msg.medishots ?? 1;

      elMatchEndBanner.classList.add('hidden');
      elRespawnBanner.classList.add('hidden');
      elChatMessages.innerHTML = '';
      elKillfeed.innerHTML = '';

      hudModeBadge.textContent = gameMode === 'tdm' ? 'CT vs T' : 'FFA';
      hudRoomCode.textContent = roomCode;
      elSbRoomInfo.textContent = `Phòng: ${roomCode} (${gameMode.toUpperCase()})`;

      world.syncHealthPacks(msg.healthPacks || []);
      latestPlayers = msg.players || [];
      const me = latestPlayers.find((p) => p.id === selfId);
      if (me) {
        localPlayer.x = me.x;
        localPlayer.y = me.y;
        localPlayer.z = me.z;
        localPlayer.vx = 0; localPlayer.vy = 0; localPlayer.vz = 0;
        localPlayer.yaw = me.yw || 0;
        localPlayer.pitch = 0;
        localPlayer.hp = me.hp;
        localPlayer.armor = me.ar ?? 100;
        localPlayer.dead = !!me.d;
        resetAllOwnedAmmo();
        equipWeapon(me.w || localPlayer.primary, false);
      }
      updateVitalsAndEcoHud();
      updateTopScoreHud();
      world.syncRemotePlayers(latestPlayers, selfId);
      break;
    }

    case 'eco': {
      localPlayer.money = msg.money ?? localPlayer.money;
      if (msg.primary !== undefined) localPlayer.primary = msg.primary;
      if (msg.secondary !== undefined) localPlayer.secondary = msg.secondary;
      if (msg.activeOptic !== undefined) localPlayer.activeOptic = msg.activeOptic;
      if (msg.ownedScopes !== undefined) localPlayer.ownedScopes = msg.ownedScopes;
      if (msg.hp !== undefined) localPlayer.hp = msg.hp;
      if (msg.armor !== undefined) localPlayer.armor = msg.armor;
      if (msg.medishots !== undefined) localPlayer.medishots = msg.medishots;

      if (msg.weapon && WEAPONS[msg.weapon]) {
        initWeaponAmmo(msg.weapon);
        equipWeapon(msg.weapon, false);
      } else {
        world.setViewmodelWeapon(localPlayer.weapon, localPlayer.activeOptic);
      }
      sound.playBuySound();

      if (msg.note) {
        showEcoToast(msg.note);
        document.getElementById('buy-feedback').textContent = msg.note;
      }
      updateVitalsAndEcoHud();
      updateInventoryHud();
      if (buyOpen) renderBuyMenu();
      break;
    }

    case 'snap': {
      latestPlayers = msg.p || [];
      const me = latestPlayers.find((p) => p.id === selfId);
      if (me) {
        localPlayer.hp = me.hp;
        localPlayer.armor = me.ar ?? localPlayer.armor;
        localPlayer.dead = !!me.d;
        updateVitalsAndEcoHud();
      }
      world.syncRemotePlayers(latestPlayers, selfId);
      updateTopScoreHud();
      if (!elScoreboard.classList.contains('hidden')) renderScoreboard();
      break;
    }

    case 'shot': {
      const wCfg = WEAPONS[msg.w] || WEAPONS.ak47;
      if (msg.id !== selfId) {
        const dist = Math.hypot(msg.ox - localPlayer.x, msg.oz - localPlayer.z);
        const maxHear = (msg.w === 'm4a1s' || msg.w === 'usp') ? 45 : 85;
        const vol = Math.max(0.03, 1 - dist / maxHear);
        sound.playGunshot(msg.w, vol * 0.8);

        if (msg.w !== 'm4a1s' && msg.w !== 'usp' && msg.w !== 'knife') {
          radarEnemyPings.push({ x: msg.ox, z: msg.oz, life: 1.8 });
        }
        for (const tr of msg.tr || []) {
          world.spawnTracer(msg.ox, msg.oy - 0.1, msg.oz, tr[0], tr[1], tr[2], tr[3], wCfg.isMelee);
        }
      } else {
        const muz = world.getMuzzleWorldPos();
        for (const tr of msg.tr || []) {
          world.spawnTracer(muz.x, muz.y, muz.z, tr[0], tr[1], tr[2], tr[3], wCfg.isMelee);
        }
      }
      break;
    }

    case 'hit': {
      triggerHitmarker(msg.hs, msg.kill, msg.dmg);
      sound.playHitmarker(msg.hs, msg.kill);
      break;
    }

    case 'hurt': {
      localPlayer.hp = msg.hp;
      if (msg.armor !== undefined) localPlayer.armor = msg.armor;
      updateVitalsAndEcoHud();
      dmgFlashAlpha = Math.min(0.92, dmgFlashAlpha + 0.55);
      sound.playHurt();
      break;
    }

    case 'kill': {
      if (msg.teamScores) teamScores = msg.teamScores;
      addKillfeedItem(msg);
      updateTopScoreHud();
      if (msg.vid === selfId) {
        localPlayer.dead = true;
        localPlayer.hp = 0;
        setZoomLevel(0);
        updateVitalsAndEcoHud();
        elRespawnKiller.textContent = `Hạ gục bởi ${msg.kName} bằng ${WEAPONS[msg.w]?.name || msg.w}${msg.hs ? ' (HEADSHOT!)' : ''}`;
        elRespawnBanner.classList.remove('hidden');
      }
      break;
    }

    case 'respawn': {
      localPlayer.x = msg.x;
      localPlayer.y = msg.y;
      localPlayer.z = msg.z;
      localPlayer.vx = 0; localPlayer.vy = 0; localPlayer.vz = 0;
      localPlayer.yaw = msg.yaw;
      localPlayer.pitch = 0;
      localPlayer.hp = msg.hp;
      localPlayer.armor = msg.armor ?? 100;
      if (msg.money !== undefined) localPlayer.money = msg.money;
      localPlayer.dead = false;
      localPlayer.reloading = false;
      setZoomLevel(0);
      elReloadBanner.classList.add('hidden');
      elRespawnBanner.classList.add('hidden');
      resetAllOwnedAmmo();
      updateInventoryHud();
      updateVitalsAndEcoHud();
      break;
    }

    case 'pickup': {
      world.setHealthPackActive(msg.hpId, false);
      if (msg.pid === selfId) {
        localPlayer.hp = msg.hp;
        localPlayer.armor = msg.armor ?? 100;
        updateVitalsAndEcoHud();
        sound.playPickup();
        spawnFloatingPopup('+45 HP & GIÁP', '#4ade80');
      }
      break;
    }

    case 'hpState': {
      world.setHealthPackActive(msg.id, msg.active);
      break;
    }

    case 'matchEnd': {
      matchEnded = true;
      latestPlayers = msg.players || latestPlayers;
      setZoomLevel(0);
      elRespawnBanner.classList.add('hidden');
      elMatchWinnerText.textContent = msg.winnerText || 'KẾT THÚC HIỆP!';
      elMatchEndBanner.classList.remove('hidden');
      renderScoreboard();
      elScoreboard.classList.remove('hidden');
      break;
    }

    case 'matchStart': {
      matchEnded = false;
      gameMode = msg.mode || gameMode;
      scoreLimit = msg.scoreLimit || scoreLimit;
      teamScores = msg.teamScores || { 1: 0, 2: 0 };
      elMatchEndBanner.classList.add('hidden');
      elScoreboard.classList.add('hidden');
      world.syncHealthPacks(msg.healthPacks || []);
      latestPlayers = msg.players || [];
      world.syncRemotePlayers(latestPlayers, selfId);
      resetAllOwnedAmmo();
      updateInventoryHud();
      updateTopScoreHud();
      break;
    }

    case 'roomCfg': {
      gameMode = msg.mode || gameMode;
      if (msg.economyMode) roomEconomyMode = msg.economyMode;
      if (msg.speedScale !== undefined) roomSpeedScale = msg.speedScale;
      scoreLimit = msg.scoreLimit || scoreLimit;
      hudModeBadge.textContent = gameMode === 'tdm' ? 'CT vs T' : 'FFA';
      updateTopScoreHud();
      updateVitalsAndEcoHud();
      break;
    }

    case 'chat': {
      appendChatLine(msg.name, msg.text, msg.team === 1 ? '#7da6df' : (msg.team === 2 ? '#e6b35a' : '#fde047'));
      break;
    }

    case 'sys': {
      appendChatLine('Radio', msg.msg, '#9ca3af');
      break;
    }
  }
}

// --- Weapon Switching, Universal Scope Zoom, Reload & Fire ---
function setZoomLevel(level) {
  localPlayer.zoomLevel = level;
  const optic = getEffectiveOptic();
  if (level <= 0 || !optic) {
    elScopeOverlay.classList.add('hidden');
  } else {
    elScopeOverlay.classList.remove('hidden');
    elScopeZoomBadge.textContent = level === 2
      ? `${optic.shortName.toUpperCase()} • ZOOM 2X`
      : `${optic.shortName.toUpperCase()} • ĐANG NGẮM`;
  }
}

function equipWeapon(weaponId, notifyServer = true) {
  if (!WEAPONS[weaponId]) return;
  if (localPlayer.weapon !== weaponId) {
    localPlayer.lastWeapon = localPlayer.weapon;
  }
  localPlayer.weapon = weaponId;
  localPlayer.reloading = false;
  localPlayer.reloadTimer = 0;
  localPlayer.sprayShots = 0;
  setZoomLevel(0);
  elReloadBanner.classList.add('hidden');
  world.setViewmodelWeapon(weaponId, localPlayer.activeOptic);
  sound.playWeaponDraw(weaponId);
  updateInventoryHud();
  if (notifyServer) {
    net.send({ t: 'weapon', weapon: weaponId });
  }
}

function startReload() {
  const wCfg = WEAPONS[localPlayer.weapon];
  if (!wCfg || wCfg.isMelee || localPlayer.dead || localPlayer.reloading) return;
  const cur = localPlayer.ammo[localPlayer.weapon] ?? wCfg.magSize;
  const res = localPlayer.reserve[localPlayer.weapon] ?? wCfg.reserveAmmo;
  if (cur >= wCfg.magSize || res <= 0) return;

  localPlayer.reloading = true;
  localPlayer.reloadTotal = wCfg.reloadTime;
  localPlayer.reloadTimer = wCfg.reloadTime;
  setZoomLevel(0);
  elReloadBanner.classList.remove('hidden');
  sound.playReload();
}

function tryFireWeapon(nowSec, isHeavyKnife = false) {
  if (localPlayer.dead || matchEnded || localPlayer.reloading) return;
  const wCfg = WEAPONS[localPlayer.weapon];
  const rate = (wCfg.isMelee && isHeavyKnife) ? 0.85 : wCfg.fireRate;
  if (nowSec - localPlayer.lastFireTime < rate) return;

  if (!wCfg.isMelee) {
    if ((localPlayer.ammo[localPlayer.weapon] ?? 0) <= 0) {
      startReload();
      return;
    }
    localPlayer.ammo[localPlayer.weapon] -= 1;
    updateInventoryHud();
  }

  localPlayer.lastFireTime = nowSec;
  localPlayer.sprayShots = Math.min(15, localPlayer.sprayShots + 1);
  localPlayer.dynamicGapBoost = Math.min(14, localPlayer.dynamicGapBoost + 3.5);

  const eyeH = localPlayer.crouch ? CROUCH_EYE_HEIGHT : EYE_HEIGHT;
  const ads = localPlayer.zoomLevel > 0;
  const optic = getEffectiveOptic();
  const horizSpeed = Math.hypot(localPlayer.vx, localPlayer.vz);
  const moveFactor = ((horizSpeed / 7.4) + (localPlayer.grounded ? 0 : 1.15)) * (ads && optic ? optic.spreadMult : 1.0);

  net.send({
    t: 'shoot',
    weapon: localPlayer.weapon,
    ox: +localPlayer.x.toFixed(2),
    oy: +(localPlayer.y + eyeH).toFixed(2),
    oz: +localPlayer.z.toFixed(2),
    yaw: +localPlayer.yaw.toFixed(4),
    pitch: +localPlayer.pitch.toFixed(4),
    ads,
    mv: +moveFactor.toFixed(2),
    heavy: !!isHeavyKnife
  });

  if (!wCfg.isMelee) {
    const recoilScale = ads && optic ? optic.recoilMult : 1.0;
    localPlayer.pitch = Math.min(1.5, localPlayer.pitch + wCfg.recoilPitch * recoilScale);
    if (localPlayer.sprayShots > 4) {
      const swayDir = Math.sin(localPlayer.sprayShots * 0.65);
      localPlayer.yaw += swayDir * (wCfg.recoilYaw || 0.008) * recoilScale;
    }
  }

  // Unscope temporarily on bolt-action sniper shot just like CS:GO!
  if (wCfg.id === 'awp' || wCfg.id === 'ssg08') {
    setZoomLevel(0);
  }

  world.triggerViewmodelShot(localPlayer.weapon);
  sound.playGunshot(localPlayer.weapon, 1.0);

  if (!wCfg.isMelee && localPlayer.ammo[localPlayer.weapon] <= 0) {
    setTimeout(() => startReload(), 180);
  }
}

// --- HUD Updates ---
function updateInventoryHud() {
  const wCfg = WEAPONS[localPlayer.weapon] || WEAPONS.ak47;
  hudWeaponName.textContent = wCfg.name.toUpperCase();

  const optic = getEffectiveOptic();
  if (optic) {
    hudOpticBadge.textContent = `🔭 ${optic.shortName}`;
  } else {
    hudOpticBadge.textContent = '🗡️ Chuột Phải: Đâm Mạnh';
  }

  if (wCfg.isMelee) {
    hudAmmoCur.textContent = '∞';
    hudAmmoRes.textContent = '';
  } else {
    hudAmmoCur.textContent = String(localPlayer.ammo[localPlayer.weapon] ?? 0);
    hudAmmoRes.textContent = String(localPlayer.reserve[localPlayer.weapon] ?? 0);
  }

  slotPrimary.querySelector('.inv-name').textContent = WEAPONS[localPlayer.primary]?.name || 'Rifle';
  slotSecondary.querySelector('.inv-name').textContent = WEAPONS[localPlayer.secondary]?.name || 'Pistol';
  slotMedishot.querySelector('.inv-name').textContent = `Medi-Shot (+55 HP) x${localPlayer.medishots}`;
  slotMedishot.style.opacity = localPlayer.medishots > 0 ? '1' : '0.4';

  slotPrimary.classList.toggle('active', localPlayer.weapon === localPlayer.primary);
  slotSecondary.classList.toggle('active', localPlayer.weapon === localPlayer.secondary);
  slotMelee.classList.toggle('active', localPlayer.weapon === 'knife');
}

function updateVitalsAndEcoHud() {
  const hp = Math.max(0, Math.round(localPlayer.hp));
  const ar = Math.max(0, Math.round(localPlayer.armor));
  hudHpNum.textContent = String(hp);
  hudHpFill.style.width = `${hp}%`;
  hudHpFill.style.background = hp > 30 ? '#f3f4f6' : '#ef4444';

  hudArmorNum.textContent = String(ar);
  hudArmorFill.style.width = `${ar}%`;

  hudMoney.textContent = roomEconomyMode === 'free' ? '$16000' : `$${localPlayer.money}`;
}

function updateTopScoreHud() {
  if (gameMode === 'tdm') {
    hudCtScore.textContent = String(teamScores[1] || 0);
    hudTScore.textContent = String(teamScores[2] || 0);
    hudTargetLine.textContent = `Chạm mốc ${scoreLimit} mạng`;
  } else {
    let top = null;
    for (const p of latestPlayers) {
      if (!top || p.k > top.k) top = p;
    }
    hudCtScore.textContent = top ? String(top.k) : '0';
    hudTScore.textContent = String(scoreLimit);
    hudTargetLine.textContent = top ? `Dẫn đầu: ${top.n}` : `Đấu đơn chạm ${scoreLimit}`;
  }
}

function triggerHitmarker(headshot, kill, dmg) {
  elHitmarker.classList.remove('hidden', 'headshot', 'kill');
  if (kill) elHitmarker.classList.add('kill');
  else if (headshot) elHitmarker.classList.add('headshot');
  hitmarkerTimer = kill ? 0.22 : 0.12;

  const color = kill ? '#ef4444' : (headshot ? '#fde047' : '#f8fafc');
  const text = kill ? `💀 HẠ GỤC (-${dmg})` : (headshot ? `HEADSHOT -${dmg}` : `-${dmg}`);
  spawnFloatingPopup(text, color);
}

function spawnFloatingPopup(text, color) {
  const div = document.createElement('div');
  div.className = 'dmg-popup';
  div.style.color = color;
  div.style.left = `${(Math.random() - 0.5) * 24}px`;
  div.textContent = text;
  elPopups.appendChild(div);
  setTimeout(() => div.remove(), 650);
}

function addKillfeedItem({ kid, kName, kTeam, vid, vName, vTeam, w, hs }) {
  const wName = WEAPONS[w]?.name || w;
  const kColor = kTeam === 1 ? '#7da6df' : (kTeam === 2 ? '#e6b35a' : '#fde047');
  const vColor = vTeam === 1 ? '#7da6df' : (vTeam === 2 ? '#e6b35a' : '#fca5a5');

  const item = document.createElement('div');
  item.className = 'kill-item' + (kid === selfId ? ' self-kill' : '');
  item.innerHTML = `<strong style="color:${kColor}">${escapeHtml(kName)}</strong> <span style="color:#d1d5db">[${wName}${hs ? ' 🎯' : ''}]</span> <strong style="color:${vColor}">${escapeHtml(vName)}</strong>`;
  elKillfeed.prepend(item);
  while (elKillfeed.children.length > 5) elKillfeed.lastElementChild.remove();
  setTimeout(() => item.remove(), 6500);
}

function appendChatLine(sender, text, color) {
  const div = document.createElement('div');
  div.className = 'chat-line';
  div.innerHTML = `<strong style="color:${color}">${escapeHtml(sender)}:</strong> ${escapeHtml(text)}`;
  elChatMessages.appendChild(div);
  while (elChatMessages.children.length > 16) elChatMessages.firstElementChild.remove();
  elChatMessages.scrollTop = elChatMessages.scrollHeight;
}

function renderScoreboard() {
  const sorted = [...latestPlayers].sort((a, b) => (b.k - a.k) || (a.dt - b.dt));
  elSbBody.innerHTML = sorted.map((p, idx) => {
    const side = p.tm === 1 ? 'CT' : (p.tm === 2 ? 'T' : 'FFA');
    const color = p.tm === 1 ? '#7da6df' : (p.tm === 2 ? '#e6b35a' : '#f3f4f6');
    const wName = WEAPONS[p.w]?.name || p.w;
    return `<tr class="${p.id === selfId ? 'sb-self' : ''}">
      <td>${idx + 1}</td>
      <td style="color:${color}">${escapeHtml(p.n)}</td>
      <td style="color:${color}">${side}</td>
      <td>${wName}</td>
      <td>${p.k}</td>
      <td>${p.dt}</td>
      <td>${p.sc}</td>
    </tr>`;
  }).join('');
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

// --- Keyboard & Mouse Input ---
window.addEventListener('keydown', (e) => {
  if (settingsOpen && e.code === 'Escape') {
    closeSettingsModal();
    return;
  }
  if (!inMatch) return;

  if (buyOpen) {
    if (e.code === 'KeyB' || e.code === 'Escape') {
      e.preventDefault();
      toggleBuyMenu(false);
    }
    return;
  }

  if (e.code === 'Enter') {
    if (!chatFocused) {
      chatFocused = true;
      if (document.pointerLockElement) document.exitPointerLock();
      elPause.classList.add('hidden');
      elChatInput.focus();
    } else {
      const val = elChatInput.value.trim();
      if (val) net.send({ t: 'chat', text: val });
      elChatInput.value = '';
      elChatInput.blur();
      chatFocused = false;
      requestGamePointerLock();
    }
    e.preventDefault();
    return;
  }

  if (chatFocused) {
    if (e.code === 'Escape') {
      elChatInput.blur();
      chatFocused = false;
      requestGamePointerLock();
    }
    return;
  }

  keys.add(e.code);

  if (e.code === 'KeyB') {
    e.preventDefault();
    toggleBuyMenu();
  } else if (e.code === 'KeyV') {
    e.preventDefault();
    cycleOwnedScope();
  } else if (e.code === 'Digit1') {
    if (localPlayer.primary) equipWeapon(localPlayer.primary);
  } else if (e.code === 'Digit2') {
    if (localPlayer.secondary) equipWeapon(localPlayer.secondary);
  } else if (e.code === 'Digit3') {
    equipWeapon('knife');
  } else if (e.code === 'Digit4' || e.code === 'KeyX') {
    if (localPlayer.medishots > 0 && localPlayer.hp < 100) {
      net.send({ t: 'useMedishot' });
      sound.playPickup();
    }
  } else if (e.code === 'KeyQ') {
    const target = localPlayer.lastWeapon && WEAPONS[localPlayer.lastWeapon]
      ? localPlayer.lastWeapon
      : (localPlayer.weapon === localPlayer.primary ? localPlayer.secondary : localPlayer.primary);
    if (target) equipWeapon(target);
  } else if (e.code === 'KeyF') {
    world.triggerInspect();
  } else if (e.code === 'KeyR') {
    startReload();
  } else if (e.code === 'Tab') {
    e.preventDefault();
    renderScoreboard();
    elScoreboard.classList.remove('hidden');
  }
});

window.addEventListener('keyup', (e) => {
  keys.delete(e.code);
  if (e.code === 'Tab' && !matchEnded) {
    elScoreboard.classList.add('hidden');
  }
});

elChatInput.addEventListener('blur', () => { chatFocused = false; });

window.addEventListener('mousemove', (e) => {
  if (!inMatch || document.pointerLockElement !== world.renderer.domElement) return;
  const optic = getEffectiveOptic();
  let zoomMult = 1.0;
  if (localPlayer.zoomLevel === 1 && optic) {
    zoomMult = (optic.fov1 / cfg.fov) * cfg.zoomSens;
  } else if (localPlayer.zoomLevel === 2 && optic) {
    zoomMult = ((optic.fov2 || 12) / cfg.fov) * cfg.zoomSens;
  }

  const scale = 0.0021 * cfg.sens * zoomMult;
  const ySign = cfg.invertY ? -1 : 1;

  localPlayer.yaw -= e.movementX * scale;
  localPlayer.pitch -= e.movementY * scale * ySign;
  localPlayer.pitch = Math.max(-1.5, Math.min(1.5, localPlayer.pitch));
});

window.addEventListener('mousedown', (e) => {
  if (!inMatch || document.pointerLockElement !== world.renderer.domElement) return;
  const wCfg = WEAPONS[localPlayer.weapon];

  if (e.button === 0) {
    mouseDownLeft = true;
    tryFireWeapon(performance.now() / 1000, false);
  } else if (e.button === 2) {
    if (localPlayer.dead || localPlayer.reloading) return;

    if (wCfg.isMelee) {
      tryFireWeapon(performance.now() / 1000, true);
      return;
    }

    rightMouseDownAt = performance.now();
    const optic = getEffectiveOptic();
    if (!optic) return;

    if (cfg.adsMode === 'hold') {
      setZoomLevel(1);
    } else if (optic.fov2) {
      // 2-stage Sniper / Thermal Scope: 0 -> 1 -> 2 -> 0
      setZoomLevel((localPlayer.zoomLevel + 1) % 3);
    } else {
      // 1-stage Reflex / Holo / ACOG Scope: 0 <-> 1
      setZoomLevel(localPlayer.zoomLevel > 0 ? 0 : 1);
    }
    sound.playScopeZoom();
  }
});

window.addEventListener('mouseup', (e) => {
  if (e.button === 0) {
    mouseDownLeft = false;
  } else if (e.button === 2) {
    if (localPlayer.zoomLevel > 0) {
      const heldMs = performance.now() - rightMouseDownAt;
      if (cfg.adsMode === 'hold' || (cfg.adsMode === 'hybrid' && heldMs > 250)) {
        setZoomLevel(0);
      }
    }
  }
});

window.addEventListener('contextmenu', (e) => {
  if (inMatch) e.preventDefault();
});

window.addEventListener('wheel', (e) => {
  if (!inMatch || document.pointerLockElement !== world.renderer.domElement) return;
  const slots = [localPlayer.primary, localPlayer.secondary, 'knife'].filter(Boolean);
  const idx = slots.indexOf(localPlayer.weapon);
  const next = slots[(idx + (e.deltaY > 0 ? 1 : -1) + slots.length) % slots.length];
  if (next) equipWeapon(next);
});

// --- Rotating Player-Centered CS:GO Radar ---
function drawCSGORadar(dt) {
  const size = minimapCanvas.width;
  const half = size * 0.5;
  const ctx = minimapCtx;
  ctx.clearRect(0, 0, size, size);

  const zoom = 2.05;

  ctx.save();
  ctx.translate(half, half);
  ctx.rotate(localPlayer.yaw);

  const toRx = (wx) => (wx - localPlayer.x) * zoom;
  const toRy = (wz) => (wz - localPlayer.z) * zoom;

  ctx.fillStyle = 'rgba(215, 195, 158, 0.14)';
  ctx.fillRect(toRx(-ARENA_HALF), toRy(-ARENA_HALF), ARENA_HALF * 2 * zoom, ARENA_HALF * 2 * zoom);

  for (const b of MAP_BOXES) {
    ctx.fillStyle = b.type === 'bombsite_platform'
      ? 'rgba(239, 68, 68, 0.22)'
      : 'rgba(226, 210, 181, 0.45)';
    ctx.fillRect(toRx(b.x - b.w * 0.5), toRy(b.z - b.d * 0.5), b.w * zoom, b.d * zoom);
  }

  for (const c of RADAR_CALLOUTS) {
    const cx = toRx(c.x);
    const cy = toRy(c.z);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-localPlayer.yaw);
    ctx.fillStyle = c.color;
    ctx.font = c.big ? '900 12px sans-serif' : 'bold 8.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.label, 0, 0);
    ctx.restore();
  }

  for (let i = radarEnemyPings.length - 1; i >= 0; i--) {
    const ping = radarEnemyPings[i];
    ping.life -= dt;
    if (ping.life <= 0) {
      radarEnemyPings.splice(i, 1);
      continue;
    }
    ctx.fillStyle = `rgba(239, 68, 68, ${Math.min(1, ping.life)})`;
    ctx.beginPath();
    ctx.arc(toRx(ping.x), toRy(ping.z), 4.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const myData = latestPlayers.find((p) => p.id === selfId);
  if (gameMode === 'tdm' && myData) {
    for (const p of latestPlayers) {
      if (p.id === selfId || p.d || p.tm !== myData.tm) continue;
      ctx.fillStyle = p.tm === 1 ? '#60a5fa' : '#fbbf24';
      ctx.beginPath();
      ctx.arc(toRx(p.x), toRy(p.z), 3.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();

  ctx.fillStyle = 'rgba(74, 222, 128, 0.18)';
  ctx.beginPath();
  ctx.moveTo(half, half);
  ctx.arc(half, half, 28, -Math.PI * 0.5 - 0.45, -Math.PI * 0.5 + 0.45);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#4ade80';
  ctx.beginPath();
  ctx.arc(half, half, 4, 0, Math.PI * 2);
  ctx.fill();
}

// --- Boot & Main Loop ---
setupSettingsModal();
applyRuntimeSettings();

let lastTime = performance.now();
let fpsFrames = 0;
let fpsTimer = 0;

function animate(nowMs) {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, (nowMs - lastTime) / 1000);
  lastTime = nowMs;
  const nowSec = nowMs / 1000;

  fpsFrames++;
  fpsTimer += dt;
  if (fpsTimer >= 0.5) {
    hudNetInfo.textContent = `${Math.round(fpsFrames / fpsTimer)} FPS • ${net.latencyMs || 1} ms`;
    fpsFrames = 0;
    fpsTimer = 0;
  }

  if (!inMatch) {
    const angle = nowSec * 0.12;
    world.camera.fov = 68;
    world.camera.updateProjectionMatrix();
    world.camera.position.set(Math.cos(angle) * 26, 11.5, Math.sin(angle) * 26);
    world.camera.lookAt(2, 2.2, -6);
    world.vmRoot.visible = false;
    world.updateWorld(dt, nowSec);
    world.render();
    return;
  }

  const locked = document.pointerLockElement === world.renderer.domElement;
  if (!localPlayer.dead && !matchEnded) {
    const input = {
      f: locked && (keys.has('KeyW') || keys.has('ArrowUp')),
      b: locked && (keys.has('KeyS') || keys.has('ArrowDown')),
      l: locked && (keys.has('KeyA') || keys.has('ArrowLeft')),
      r: locked && (keys.has('KeyD') || keys.has('ArrowRight')),
      jump: locked && keys.has('Space'),
      crouch: locked && (keys.has('ControlLeft') || keys.has('ControlRight') || keys.has('KeyC')),
      walk: locked && (keys.has('ShiftLeft') || keys.has('ShiftRight')),
      yaw: localPlayer.yaw
    };

    const res = stepPlayerPhysics(localPlayer, input, dt, roomSpeedScale);
    if (res.jumped) sound.playJump();

    const horizSpeed = Math.hypot(localPlayer.vx, localPlayer.vz);
    if (localPlayer.grounded && horizSpeed > 4.6 && !localPlayer.walk && !localPlayer.crouch) {
      stepDistAccum += horizSpeed * dt;
      if (stepDistAccum >= 2.75) {
        stepDistAccum = 0;
        sound.playFootstep();
      }
    } else {
      stepDistAccum = 1.6;
    }

    if (!mouseDownLeft && nowSec - localPlayer.lastFireTime > 0.22) {
      localPlayer.sprayShots = Math.max(0, localPlayer.sprayShots - dt * 28);
    }

    const wCfg = WEAPONS[localPlayer.weapon];
    if (locked && mouseDownLeft && wCfg.auto) {
      tryFireWeapon(nowSec, false);
    }

    if (localPlayer.reloading) {
      localPlayer.reloadTimer -= dt;
      if (localPlayer.reloadTimer <= 0) {
        localPlayer.reloading = false;
        const needed = wCfg.magSize - (localPlayer.ammo[localPlayer.weapon] || 0);
        const take = Math.min(needed, localPlayer.reserve[localPlayer.weapon] || 0);
        localPlayer.ammo[localPlayer.weapon] += take;
        localPlayer.reserve[localPlayer.weapon] -= take;
        elReloadBanner.classList.add('hidden');
        updateInventoryHud();
      }
    }

    stateSendAccum += dt;
    if (stateSendAccum >= 0.032) {
      stateSendAccum = 0;
      net.send({
        t: 'state',
        x: +localPlayer.x.toFixed(2),
        y: +localPlayer.y.toFixed(2),
        z: +localPlayer.z.toFixed(2),
        yaw: +localPlayer.yaw.toFixed(3),
        pitch: +localPlayer.pitch.toFixed(3),
        crouch: localPlayer.crouch ? 1 : 0,
        weapon: localPlayer.weapon
      });
    }
  }

  if (hitmarkerTimer > 0) {
    hitmarkerTimer -= dt;
    if (hitmarkerTimer <= 0) elHitmarker.classList.add('hidden');
  }
  if (dmgFlashAlpha > 0) {
    dmgFlashAlpha = Math.max(0, dmgFlashAlpha - dt * 2.2);
    elDmgFlash.style.opacity = String(dmgFlashAlpha);
  }

  // Camera Position & Smooth Zoom FOV
  const targetEyeH = localPlayer.crouch ? CROUCH_EYE_HEIGHT : EYE_HEIGHT;
  world.camera.position.x = localPlayer.x;
  world.camera.position.z = localPlayer.z;
  world.camera.position.y += ((localPlayer.y + targetEyeH) - world.camera.position.y) * Math.min(1, 20 * dt);
  world.camera.rotation.y = localPlayer.yaw;
  world.camera.rotation.x = localPlayer.pitch;

  const optic = getEffectiveOptic();
  let targetFov = cfg.fov;
  if (localPlayer.zoomLevel === 1 && optic) targetFov = optic.fov1;
  else if (localPlayer.zoomLevel === 2 && optic) targetFov = optic.fov2 || optic.fov1;

  if (Math.abs(world.camera.fov - targetFov) > 0.05) {
    world.camera.fov += (targetFov - world.camera.fov) * Math.min(1, 20 * dt);
    world.camera.updateProjectionMatrix();
  }

  const speed = Math.hypot(localPlayer.vx, localPlayer.vz);
  localPlayer.dynamicGapBoost = Math.max(0, localPlayer.dynamicGapBoost - dt * 24);
  const moveGap = speed * 1.15 + (localPlayer.grounded ? 0 : 7) + localPlayer.dynamicGapBoost;

  const wCfg = WEAPONS[localPlayer.weapon];
  chCtx.clearRect(0, 0, chCanvas.width, chCanvas.height);

  if (localPlayer.zoomLevel > 0 && optic) {
    drawScopeOverlay(optic, speed);
  } else if ((wCfg.id !== 'awp' && wCfg.id !== 'ssg08') || cfg.chStyle === 'dot') {
    renderCrosshair(chCtx, chCanvas.width, chCanvas.height, moveGap);
  }

  const reloadProgress = localPlayer.reloading
    ? 1 - (localPlayer.reloadTimer / Math.max(0.1, localPlayer.reloadTotal))
    : 0;

  const isFullTubeScope = localPlayer.zoomLevel > 0 && optic &&
    (optic.reticle === 'acog' || optic.reticle === 'sniper' || optic.reticle === 'thermal');

  world.updateViewmodel(dt, {
    movingSpeed: speed,
    grounded: localPlayer.grounded,
    ads: localPlayer.zoomLevel > 0,
    fullScopeHide: isFullTubeScope,
    reloadProgress,
    dead: localPlayer.dead
  });
  if (cfg.hand === 'left' && localPlayer.zoomLevel === 0) {
    world.vmRoot.position.x = -Math.abs(world.vmRoot.position.x);
  }

  world.updateWorld(dt, nowSec);
  drawCSGORadar(dt);
  world.render();
}

requestAnimationFrame(animate);
