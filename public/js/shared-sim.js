// Universal CS:GO Multiplayer Room Simulation (Economy, Buy System, Speed Scaling, Bot AI)

import {
  ARENA_HALF,
  CROUCH_EYE_HEIGHT,
  EYE_HEIGHT,
  GEAR_ITEMS,
  HEALTH_PACKS,
  PLAYER_HEIGHT,
  PLAYER_RADIUS,
  SCOPE_ITEMS,
  SKIN_COLORS,
  SPAWN_POINTS,
  WEAPONS,
  intersectRayAABB,
  raycastWorld,
  stepPlayerPhysics
} from './map-data.js';

const BOT_NAMES = [
  'BOT Vitaliy',
  'BOT Maverick',
  'BOT Phoenix',
  'BOT Crusher',
  'BOT Stone',
  'BOT Falcon',
  'BOT Wolf',
  'BOT Gunner'
];

const BOT_WAYPOINTS = [
  { x: 0, z: -2 },
  { x: -1, z: -15 },
  { x: 0, z: 12 },
  { x: 13, z: -5.2 },
  { x: 24, z: -20 },
  { x: 27, z: 4 },
  { x: 24, z: 20 },
  { x: -26, z: -20 },
  { x: -24, z: 10 },
  { x: -8, z: 18 }
];

const MAX_MONEY = 16000;

export class GameRoomSim {
  constructor(options = {}) {
    this.roomCode = options.roomCode || 'DUST2';
    this.isPublic = !!options.isPublic;
    this.mode = options.mode === 'ffa' ? 'ffa' : 'tdm';
    this.economyMode = options.economyMode === 'free' ? 'free' : 'csgo'; // 'csgo' ($3500 start + earn $) | 'free' ($16000 unlimited)
    this.speedScale = Math.max(0.6, Math.min(1.6, Number(options.speedScale) || 1.0));
    this.scoreLimit = Number(options.scoreLimit) || (this.mode === 'tdm' ? 30 : 20);
    this.maxPlayers = Number(options.maxPlayers) || 10;
    this.botCount = options.botCount !== undefined ? Number(options.botCount) : (this.isPublic ? 5 : 3);
    this.onBroadcast = options.onBroadcast || (() => {});
    this.onSendTo = options.onSendTo || (() => {});

    this.players = new Map();
    this.healthPacks = HEALTH_PACKS.map((hp) => ({
      ...hp,
      active: true,
      respawnTimer: 0
    }));

    this.teamScores = { 1: 0, 2: 0 };
    this.matchEnded = false;
    this.matchWinnerText = '';
    this.restartTimer = 0;
    this.botSeq = 1;
    this.snapshotAccum = 0;

    this.syncBots();
  }

  pickTeam() {
    if (this.mode !== 'tdm') return 0;
    let ct = 0;
    let t = 0;
    for (const p of this.players.values()) {
      if (p.team === 1) ct++;
      else if (p.team === 2) t++;
    }
    return ct <= t ? 1 : 2;
  }

  pickSpawn(team, excludePlayerId = null) {
    let candidates = SPAWN_POINTS;
    if (this.mode === 'tdm' && (team === 1 || team === 2)) {
      const teamSpawns = SPAWN_POINTS.filter((s) => s.team === team);
      if (teamSpawns.length > 0) candidates = teamSpawns;
    }

    let bestSpawn = candidates[Math.floor(Math.random() * candidates.length)];
    let bestMinDist = -1;

    for (const sp of candidates) {
      let minDist = 999;
      for (const other of this.players.values()) {
        if (other.id === excludePlayerId || other.dead) continue;
        if (this.mode === 'tdm' && other.team === team) continue;
        const d = Math.hypot(other.x - sp.x, other.z - sp.z);
        if (d < minDist) minDist = d;
      }
      const score = minDist + Math.random() * 5;
      if (score > bestMinDist) {
        bestMinDist = score;
        bestSpawn = sp;
      }
    }

    return {
      x: bestSpawn.x + (Math.random() - 0.5) * 1.6,
      y: bestSpawn.y,
      z: bestSpawn.z + (Math.random() - 0.5) * 1.6,
      yaw: bestSpawn.yaw
    };
  }

  resolveColor(team, skinIndex = 0) {
    if (this.mode === 'tdm') {
      return team === 1 ? 0x47648c : 0xc9965b;
    }
    return SKIN_COLORS[Math.abs(Number(skinIndex) || 0) % SKIN_COLORS.length];
  }

  startingMoney() {
    return this.economyMode === 'free' ? 16000 : 4200; // Enough to buy Rifle + Armor or save for AWP!
  }

  addHumanPlayer(id, name, weaponId = 'ak47', skinIndex = 0) {
    const cleanName = String(name || 'Operator').trim().slice(0, 18) || 'Operator';
    const team = this.pickTeam();
    const sp = this.pickSpawn(team, id);

    const defaultPistol = team === 1 ? 'usp' : 'glock';
    const requestedWep = WEAPONS[weaponId] ? weaponId : (team === 1 ? 'm4a1s' : 'ak47');
    const primary = WEAPONS[requestedWep].slotType === 'primary' ? requestedWep : (team === 1 ? 'm4a1s' : 'ak47');
    const secondary = WEAPONS[requestedWep].slotType === 'secondary' ? requestedWep : defaultPistol;

    const player = {
      id,
      name: cleanName,
      isBot: false,
      team,
      color: this.resolveColor(team, skinIndex),
      primary,
      secondary,
      weapon: requestedWep,
      activeOptic: WEAPONS[requestedWep].defaultOptic || 'reddot',
      ownedScopes: ['iron', 'reddot'],
      money: this.startingMoney(),
      medishots: 1,
      x: sp.x,
      y: sp.y,
      z: sp.z,
      vx: 0,
      vy: 0,
      vz: 0,
      yaw: sp.yaw,
      pitch: 0,
      grounded: true,
      crouch: false,
      walk: false,
      hp: 100,
      armor: 100,
      maxHp: 100,
      dead: false,
      respawnTimer: 0,
      spawnShield: 1.8,
      kills: 0,
      deaths: 0,
      score: 0,
      lastShotAt: 0
    };

    this.players.set(id, player);
    this.syncBots();

    this.onSendTo(id, {
      t: 'welcome',
      selfId: id,
      roomCode: this.roomCode,
      isPublic: this.isPublic,
      mode: this.mode,
      economyMode: this.economyMode,
      speedScale: this.speedScale,
      scoreLimit: this.scoreLimit,
      botCount: this.botCount,
      money: player.money,
      primary: player.primary,
      secondary: player.secondary,
      activeOptic: player.activeOptic,
      ownedScopes: player.ownedScopes,
      medishots: player.medishots,
      healthPacks: this.healthPacks,
      players: this.serializePlayers(),
      teamScores: this.teamScores
    });

    const sideTag = team === 1 ? ' [CT]' : (team === 2 ? ' [T]' : '');
    this.onBroadcast({
      t: 'sys',
      msg: `${cleanName}${sideTag} đã tham chiến tại Dust II!`
    });

    return player;
  }

  removePlayer(id) {
    const p = this.players.get(id);
    if (!p) return;
    this.players.delete(id);
    if (!p.isBot) {
      this.onBroadcast({
        t: 'sys',
        msg: `${p.name} đã rời máy chủ.`
      });
      this.syncBots();
    }
  }

  humanCount() {
    let count = 0;
    for (const p of this.players.values()) {
      if (!p.isBot) count++;
    }
    return count;
  }

  syncBots() {
    const humans = this.humanCount();
    let desiredBots = 0;

    if (this.isPublic) {
      desiredBots = humans === 0 ? 0 : Math.max(0, Math.min(this.botCount, 6 - humans));
    } else {
      desiredBots = humans === 0 ? 0 : Math.max(0, Math.min(8, this.botCount));
    }

    const currentBots = [];
    for (const p of this.players.values()) {
      if (p.isBot) currentBots.push(p);
    }

    while (currentBots.length > desiredBots) {
      const removed = currentBots.pop();
      this.players.delete(removed.id);
    }

    const botPool = ['ak47', 'm4a1s', 'aug', 'awp', 'ssg08', 'mp9', 'p90', 'deagle'];
    while (currentBots.length < desiredBots) {
      const idx = this.botSeq++;
      const botId = `bot_${idx}`;
      const team = this.pickTeam();
      const sp = this.pickSpawn(team, botId);
      const wId = botPool[idx % botPool.length];

      const bot = {
        id: botId,
        name: BOT_NAMES[(idx - 1) % BOT_NAMES.length],
        isBot: true,
        team,
        color: this.resolveColor(team, idx),
        weapon: wId,
        money: 8000,
        x: sp.x,
        y: sp.y,
        z: sp.z,
        vx: 0,
        vy: 0,
        vz: 0,
        yaw: sp.yaw,
        pitch: 0,
        grounded: true,
        crouch: false,
        walk: false,
        hp: 100,
        armor: 100,
        maxHp: 100,
        dead: false,
        respawnTimer: 0,
        spawnShield: 1.2,
        kills: 0,
        deaths: 0,
        score: 0,
        aiTargetWp: BOT_WAYPOINTS[Math.floor(Math.random() * BOT_WAYPOINTS.length)],
        aiWpTimer: 3 + Math.random() * 4,
        aiStrafeDir: Math.random() < 0.5 ? -1 : 1,
        aiStrafeTimer: 1.1,
        aiShootCooldown: 0.45 + Math.random() * 0.5,
        aiBurstLeft: 4
      };
      this.players.set(botId, bot);
      currentBots.push(bot);
    }
  }

  updateRoomConfig({ botCount, mode, scoreLimit, speedScale, economyMode }) {
    if (botCount !== undefined) {
      this.botCount = Math.max(0, Math.min(8, Number(botCount) || 0));
    }
    if (speedScale !== undefined) {
      this.speedScale = Math.max(0.6, Math.min(1.6, Number(speedScale) || 1.0));
    }
    if (economyMode === 'csgo' || economyMode === 'free') {
      this.economyMode = economyMode;
      if (economyMode === 'free') {
        for (const p of this.players.values()) {
          p.money = MAX_MONEY;
          if (!p.isBot) this.sendPlayerEconomy(p);
        }
      }
    }
    if (mode === 'ffa' || mode === 'tdm') {
      if (this.mode !== mode) {
        this.mode = mode;
        this.resetMatch();
      }
    }
    if (scoreLimit !== undefined) {
      this.scoreLimit = Math.max(5, Math.min(100, Number(scoreLimit) || 25));
    }
    this.syncBots();
    this.onBroadcast({
      t: 'roomCfg',
      mode: this.mode,
      economyMode: this.economyMode,
      speedScale: this.speedScale,
      scoreLimit: this.scoreLimit,
      botCount: this.botCount
    });
  }

  sendPlayerEconomy(p, note = '') {
    this.onSendTo(p.id, {
      t: 'eco',
      money: p.money,
      primary: p.primary,
      secondary: p.secondary,
      weapon: p.weapon,
      activeOptic: p.activeOptic,
      ownedScopes: p.ownedScopes,
      hp: p.hp,
      armor: p.armor,
      medishots: p.medishots,
      note
    });
  }

  handleBuy(p, itemId) {
    const isFree = this.economyMode === 'free';

    // Buy / Equip Scope Attachment!
    if (SCOPE_ITEMS[itemId]) {
      const sc = SCOPE_ITEMS[itemId];
      const alreadyOwned = (p.ownedScopes || []).includes(itemId);
      const cost = (isFree || alreadyOwned) ? 0 : sc.price;
      if (p.money < cost) {
        this.sendPlayerEconomy(p, `Không đủ tiền mua ${sc.name}! Cần $${cost}`);
        return;
      }
      p.money -= cost;
      if (!alreadyOwned) {
        p.ownedScopes.push(itemId);
      }
      p.activeOptic = itemId;
      this.sendPlayerEconomy(p, `Đã lắp ống ngắm ${sc.name}! (Bấm Chuột phải để ngắm)`);
      return;
    }

    if (GEAR_ITEMS[itemId]) {
      const gear = GEAR_ITEMS[itemId];
      const cost = isFree ? 0 : gear.price;
      if (p.money < cost) {
        this.sendPlayerEconomy(p, `Không đủ tiền! Cần $${cost}`);
        return;
      }
      if (itemId === 'kevlar') {
        if (p.armor >= 100) {
          this.sendPlayerEconomy(p, 'Giáp Kevlar + Mũ của bạn vẫn còn đầy (100)!');
          return;
        }
        p.money -= cost;
        p.armor = 100;
        this.sendPlayerEconomy(p, 'Đã mua Giáp Kevlar + Mũ chống đạn!');
      } else if (itemId === 'medishot') {
        if (p.medishots >= 3) {
          this.sendPlayerEconomy(p, 'Tối đa mang 3 Kim tiêm Medi-Shot!');
          return;
        }
        p.money -= cost;
        p.medishots += 1;
        this.sendPlayerEconomy(p, 'Đã mua Kim tiêm Medi-Shot (+55 HP)!');
      }
      return;
    }

    const wCfg = WEAPONS[itemId];
    if (!wCfg || wCfg.isMelee) return;

    const cost = isFree ? 0 : wCfg.price;
    if (p.money < cost) {
      this.sendPlayerEconomy(p, `Không đủ tiền mua ${wCfg.name}! Cần $${cost}`);
      return;
    }

    p.money -= cost;
    if (wCfg.slotType === 'primary') {
      p.primary = wCfg.id;
    } else if (wCfg.slotType === 'secondary') {
      p.secondary = wCfg.id;
    }
    p.weapon = wCfg.id;
    if (wCfg.defaultOptic && wCfg.defaultOptic !== 'none') {
      if (!p.ownedScopes.includes(wCfg.defaultOptic)) {
        p.ownedScopes.push(wCfg.defaultOptic);
      }
      p.activeOptic = wCfg.defaultOptic;
    }
    this.sendPlayerEconomy(p, `Đã trang bị ${wCfg.name}!`);
  }

  handleClientMessage(playerId, msg) {
    const p = this.players.get(playerId);
    if (!p || !msg || typeof msg !== 'object') return;

    switch (msg.t) {
      case 'state': {
        if (p.dead || this.matchEnded) return;
        const lim = ARENA_HALF - 0.3;
        if (Number.isFinite(msg.x) && Number.isFinite(msg.y) && Number.isFinite(msg.z)) {
          const dx = msg.x - p.x;
          const dz = msg.z - p.z;
          if (Math.hypot(dx, dz) < 18) {
            p.x = Math.max(-lim, Math.min(lim, msg.x));
            p.y = Math.max(0, Math.min(35, msg.y));
            p.z = Math.max(-lim, Math.min(lim, msg.z));
          }
        }
        if (Number.isFinite(msg.yaw)) p.yaw = msg.yaw;
        if (Number.isFinite(msg.pitch)) p.pitch = Math.max(-1.52, Math.min(1.52, msg.pitch));
        p.crouch = !!msg.crouch;
        if (msg.weapon && WEAPONS[msg.weapon]) {
          p.weapon = msg.weapon;
        }
        break;
      }

      case 'shoot': {
        if (p.dead || this.matchEnded) return;
        if (msg.weapon && WEAPONS[msg.weapon]) p.weapon = msg.weapon;
        p.spawnShield = 0;
        this.processShot(p, msg);
        break;
      }

      case 'buy': {
        this.handleBuy(p, String(msg.item || ''));
        break;
      }

      case 'useMedishot': {
        if (!p.dead && p.medishots > 0 && p.hp < p.maxHp) {
          p.medishots -= 1;
          p.hp = Math.min(p.maxHp, p.hp + 55);
          this.sendPlayerEconomy(p, '+55 HP (Medi-Shot)');
        }
        break;
      }

      case 'weapon': {
        if (msg.weapon && WEAPONS[msg.weapon]) {
          p.weapon = msg.weapon;
        }
        break;
      }

      case 'chat': {
        const text = String(msg.text || '').trim().slice(0, 120);
        if (text) {
          this.onBroadcast({
            t: 'chat',
            name: p.name,
            team: p.team,
            text
          });
        }
        break;
      }

      case 'cfg': {
        this.updateRoomConfig(msg);
        break;
      }

      case 'ping': {
        this.onSendTo(playerId, { t: 'pong', cTime: msg.cTime });
        break;
      }
    }
  }

  processShot(shooter, msg) {
    const weapon = WEAPONS[shooter.weapon] || WEAPONS.ak47;
    const now = Date.now() / 1000;
    if (now - (shooter.lastShotAt || 0) < weapon.fireRate * 0.72) {
      return;
    }
    shooter.lastShotAt = now;

    const eyeH = shooter.crouch ? CROUCH_EYE_HEIGHT : EYE_HEIGHT;
    const ox = Number.isFinite(msg.ox) && Math.hypot(msg.ox - shooter.x, msg.oz - shooter.z) < 2.5
      ? msg.ox : shooter.x;
    const oy = Number.isFinite(msg.oy) && Math.abs(msg.oy - (shooter.y + eyeH)) < 1.5
      ? msg.oy : (shooter.y + eyeH);
    const oz = Number.isFinite(msg.oz) && Math.hypot(msg.ox - shooter.x, msg.oz - shooter.z) < 2.5
      ? msg.oz : shooter.z;

    const baseYaw = Number.isFinite(msg.yaw) ? msg.yaw : shooter.yaw;
    const basePitch = Number.isFinite(msg.pitch) ? msg.pitch : shooter.pitch;
    const ads = !!msg.ads;
    const moveFactor = Math.max(0, Math.min(1.5, Number(msg.mv) || 0));

    let spread = ads ? weapon.adsSpread : weapon.baseSpread;
    spread += moveFactor * (weapon.moveSpread || 0);
    if (shooter.crouch) spread *= 0.55;

    const traces = [];
    const damageAgg = new Map();

    const pellets = weapon.pellets || 1;
    for (let i = 0; i < pellets; i++) {
      const sYaw = weapon.isMelee ? 0 : (Math.random() - 0.5) * spread * 2;
      const sPitch = weapon.isMelee ? 0 : (Math.random() - 0.5) * spread * 2;
      const yaw = baseYaw + sYaw;
      const pitch = basePitch + sPitch;

      const cosP = Math.cos(pitch);
      const dx = -Math.sin(yaw) * cosP;
      const dy = Math.sin(pitch);
      const dz = -Math.cos(yaw) * cosP;

      const worldHit = raycastWorld(ox, oy, oz, dx, dy, dz, weapon.range);
      let bestDist = worldHit.dist;
      let hitWallFlag = worldHit.hitWall ? 1 : 0;
      let hitTarget = null;
      let isHeadshot = false;

      for (const target of this.players.values()) {
        if (target.id === shooter.id || target.dead) continue;
        if (this.mode === 'tdm' && shooter.team !== 0 && target.team === shooter.team) continue;

        const targetH = target.crouch ? 1.32 : PLAYER_HEIGHT + 0.06;
        const r = weapon.isMelee ? PLAYER_RADIUS * 1.45 : PLAYER_RADIUS * 1.12;
        const tHit = intersectRayAABB(
          ox, oy, oz, dx, dy, dz,
          target.x - r, target.y, target.z - r,
          target.x + r, target.y + targetH, target.z + r,
          bestDist
        );

        if (tHit !== null && tHit < bestDist) {
          bestDist = tHit;
          hitTarget = target;
          hitWallFlag = 0;
          const hitY = oy + dy * tHit;
          const headThreshold = target.y + targetH * 0.74;
          isHeadshot = !weapon.isMelee && hitY >= headThreshold;
        }
      }

      const endX = +(ox + dx * bestDist).toFixed(2);
      const endY = +(oy + dy * bestDist).toFixed(2);
      const endZ = +(oz + dz * bestDist).toFixed(2);
      const hitCode = hitTarget ? (isHeadshot ? 3 : 1) : (hitWallFlag ? 2 : 0);
      traces.push([endX, endY, endZ, hitCode]);

      if (hitTarget && hitTarget.spawnShield <= 0) {
        const baseDmg = (weapon.isMelee && msg.heavy) ? weapon.heavyDamage : weapon.damage;
        const falloff = (weapon.id === 'awp' || weapon.id === 'ssg08')
          ? 1.0
          : Math.max(0.75, 1 - bestDist / (weapon.range * 2.2));
        const armorScale = (hitTarget.armor > 0 && weapon.category !== 'snipers' && weapon.id !== 'ak47' && weapon.id !== 'deagle')
          ? 0.88
          : 1.0;
        const mult = isHeadshot ? weapon.headshotMult : 1.0;
        const dmg = Math.max(1, Math.round(baseDmg * mult * falloff * armorScale));

        const prev = damageAgg.get(hitTarget.id) || { dmg: 0, headshot: false, hx: endX, hy: endY, hz: endZ };
        prev.dmg += dmg;
        if (isHeadshot) prev.headshot = true;
        damageAgg.set(hitTarget.id, prev);
      }
    }

    this.onBroadcast({
      t: 'shot',
      id: shooter.id,
      w: weapon.id,
      ox: +ox.toFixed(2),
      oy: +oy.toFixed(2),
      oz: +oz.toFixed(2),
      tr: traces
    });

    for (const [targetId, info] of damageAgg.entries()) {
      const target = this.players.get(targetId);
      if (!target || target.dead) continue;

      target.hp = Math.max(0, target.hp - info.dmg);
      target.armor = Math.max(0, (target.armor ?? 100) - Math.round(info.dmg * 0.32));
      const killed = target.hp <= 0;

      if (!shooter.isBot) {
        this.onSendTo(shooter.id, {
          t: 'hit',
          vid: target.id,
          dmg: info.dmg,
          hs: info.headshot,
          kill: killed,
          hx: info.hx,
          hy: info.hy,
          hz: info.hz
        });
      }

      if (!target.isBot) {
        this.onSendTo(target.id, {
          t: 'hurt',
          aid: shooter.id,
          ax: +shooter.x.toFixed(2),
          az: +shooter.z.toFixed(2),
          dmg: info.dmg,
          hp: target.hp,
          armor: target.armor
        });
      }

      if (killed) {
        this.handleKill(shooter, target, weapon, info.headshot);
      }
    }
  }

  handleKill(killer, victim, weaponCfg, headshot) {
    victim.dead = true;
    victim.hp = 0;
    victim.deaths += 1;
    victim.respawnTimer = 2.6;

    // Victim gets small round/death bonus in CS:GO economy so they never get stuck broke
    if (!victim.isBot && this.economyMode !== 'free') {
      victim.money = Math.min(MAX_MONEY, (victim.money || 0) + 450);
    }

    if (killer && killer.id !== victim.id) {
      killer.kills += 1;
      killer.score += headshot ? 300 : 150;
      if (this.mode === 'tdm' && (killer.team === 1 || killer.team === 2)) {
        this.teamScores[killer.team] += 1;
      }

      if (!killer.isBot) {
        const reward = this.economyMode === 'free'
          ? 0
          : (weaponCfg.killReward || 300) + (headshot ? 150 : 0);
        killer.money = this.economyMode === 'free'
          ? MAX_MONEY
          : Math.min(MAX_MONEY, (killer.money || 0) + reward);
        this.sendPlayerEconomy(killer, reward > 0 ? `+$${reward} Thưởng Hạ Gục!` : '');
      }
    }

    this.onBroadcast({
      t: 'kill',
      kid: killer ? killer.id : '',
      kName: killer ? killer.name : 'World',
      kTeam: killer ? killer.team : 0,
      vid: victim.id,
      vName: victim.name,
      vTeam: victim.team,
      w: weaponCfg.id,
      hs: !!headshot,
      teamScores: this.teamScores
    });

    this.checkWinCondition();
  }

  checkWinCondition() {
    if (this.matchEnded) return;

    if (this.mode === 'tdm') {
      if (this.teamScores[1] >= this.scoreLimit) {
        this.endMatch('COUNTER-TERRORISTS WIN!');
      } else if (this.teamScores[2] >= this.scoreLimit) {
        this.endMatch('TERRORISTS WIN!');
      }
    } else {
      for (const p of this.players.values()) {
        if (p.kills >= this.scoreLimit) {
          this.endMatch(`${p.name} MVP CHIẾN THẮNG!`);
          break;
        }
      }
    }
  }

  endMatch(winnerText) {
    this.matchEnded = true;
    this.matchWinnerText = winnerText;
    this.restartTimer = 7.0;
    this.onBroadcast({
      t: 'matchEnd',
      winnerText,
      restartIn: 7.0,
      players: this.serializePlayers(),
      teamScores: this.teamScores
    });
  }

  resetMatch() {
    this.matchEnded = false;
    this.matchWinnerText = '';
    this.teamScores = { 1: 0, 2: 0 };

    let idx = 0;
    for (const p of this.players.values()) {
      if (this.mode === 'tdm') {
        p.team = (idx % 2) + 1;
        p.color = this.resolveColor(p.team, idx);
      } else {
        p.team = 0;
        p.color = SKIN_COLORS[idx % SKIN_COLORS.length];
      }
      idx++;
      p.kills = 0;
      p.deaths = 0;
      p.score = 0;
      p.money = this.startingMoney();
      p.medishots = 1;
      this.respawnPlayer(p);
      if (!p.isBot) this.sendPlayerEconomy(p);
    }

    for (const hp of this.healthPacks) {
      hp.active = true;
      hp.respawnTimer = 0;
    }

    this.onBroadcast({
      t: 'matchStart',
      mode: this.mode,
      scoreLimit: this.scoreLimit,
      players: this.serializePlayers(),
      teamScores: this.teamScores,
      healthPacks: this.healthPacks
    });
  }

  respawnPlayer(p) {
    const sp = this.pickSpawn(p.team, p.id);
    p.x = sp.x;
    p.y = sp.y;
    p.z = sp.z;
    p.vx = 0;
    p.vy = 0;
    p.vz = 0;
    p.yaw = sp.yaw;
    p.pitch = 0;
    p.hp = 100;
    p.armor = Math.max(p.armor || 0, 100);
    p.dead = false;
    p.respawnTimer = 0;
    p.spawnShield = 1.6;

    if (!p.isBot) {
      this.onSendTo(p.id, {
        t: 'respawn',
        x: p.x,
        y: p.y,
        z: p.z,
        yaw: p.yaw,
        hp: p.hp,
        armor: p.armor,
        money: p.money
      });
    }
  }

  stepBotAI(bot, dt) {
    let bestEnemy = null;
    let bestDist = 999;

    const eyeY = bot.y + EYE_HEIGHT;
    for (const other of this.players.values()) {
      if (other.id === bot.id || other.dead) continue;
      if (this.mode === 'tdm' && bot.team !== 0 && other.team === bot.team) continue;

      const dx = other.x - bot.x;
      const dy = (other.y + 1.25) - eyeY;
      const dz = other.z - bot.z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist > 68 || dist >= bestDist) continue;

      const inv = 1 / Math.max(0.001, dist);
      const los = raycastWorld(bot.x, eyeY, bot.z, dx * inv, dy * inv, dz * inv, dist);
      if (!los.hitWall || los.dist >= dist - 0.6) {
        bestDist = dist;
        bestEnemy = other;
      }
    }

    bot.aiWpTimer -= dt;
    if (bot.hp < 50) {
      let nearestHp = null;
      let hpDist = 999;
      for (const hp of this.healthPacks) {
        if (!hp.active) continue;
        const d = Math.hypot(hp.x - bot.x, hp.z - bot.z);
        if (d < hpDist) { hpDist = d; nearestHp = hp; }
      }
      if (nearestHp && hpDist < 28) {
        bot.aiTargetWp = { x: nearestHp.x, z: nearestHp.z };
      }
    } else if (!bot.aiTargetWp || bot.aiWpTimer <= 0 || Math.hypot(bot.aiTargetWp.x - bot.x, bot.aiTargetWp.z - bot.z) < 2.4) {
      bot.aiTargetWp = BOT_WAYPOINTS[Math.floor(Math.random() * BOT_WAYPOINTS.length)];
      bot.aiWpTimer = 3.5 + Math.random() * 4.5;
    }

    const input = { f: false, b: false, l: false, r: false, jump: false, crouch: false, walk: false, yaw: bot.yaw };

    if (bestEnemy) {
      const targetYaw = Math.atan2(-(bestEnemy.x - bot.x), -(bestEnemy.z - bot.z));
      const horizDist = Math.hypot(bestEnemy.x - bot.x, bestEnemy.z - bot.z);
      const targetPitch = Math.atan2((bestEnemy.y + 1.28) - eyeY, Math.max(0.5, horizDist));

      let diffYaw = targetYaw - bot.yaw;
      while (diffYaw > Math.PI) diffYaw -= Math.PI * 2;
      while (diffYaw < -Math.PI) diffYaw += Math.PI * 2;

      bot.yaw += diffYaw * Math.min(1, 8.0 * dt);
      bot.pitch += (targetPitch - bot.pitch) * Math.min(1, 7.5 * dt);
      input.yaw = bot.yaw;

      bot.aiStrafeTimer -= dt;
      if (bot.aiStrafeTimer <= 0) {
        bot.aiStrafeDir = Math.random() < 0.25 ? 0 : (Math.random() < 0.5 ? -1 : 1);
        bot.aiStrafeTimer = 0.65 + Math.random() * 1.1;
      }
      if (bot.aiStrafeDir > 0) input.r = true;
      else if (bot.aiStrafeDir < 0) input.l = true;
      else input.crouch = horizDist > 12;

      const prefDist = (bot.weapon === 'awp' || bot.weapon === 'ssg08') ? 30 : 16;
      if (horizDist > prefDist + 5) input.f = true;
      else if (horizDist < prefDist - 5) input.b = true;

      bot.aiShootCooldown -= dt;
      if (bot.aiShootCooldown <= 0 && Math.abs(diffYaw) < 0.22) {
        const w = WEAPONS[bot.weapon] || WEAPONS.ak47;
        const botAimErr = (bot.weapon === 'awp' || bot.weapon === 'ssg08') ? 0.045 : 0.065;
        this.processShot(bot, {
          ox: bot.x,
          oy: bot.y + (input.crouch ? CROUCH_EYE_HEIGHT : EYE_HEIGHT),
          oz: bot.z,
          yaw: bot.yaw + (Math.random() - 0.5) * botAimErr,
          pitch: bot.pitch + (Math.random() - 0.5) * botAimErr,
          ads: w.category === 'snipers' || w.id === 'aug',
          mv: 0.1
        });
        bot.aiBurstLeft--;
        if (bot.aiBurstLeft <= 0) {
          bot.aiBurstLeft = 2 + Math.floor(Math.random() * 4);
          bot.aiShootCooldown = Math.max(w.fireRate * 1.35, 0.48 + Math.random() * 0.55);
        } else {
          bot.aiShootCooldown = Math.max(w.fireRate * 1.3, 0.14);
        }
      }
    } else if (bot.aiTargetWp) {
      const moveYaw = Math.atan2(-(bot.aiTargetWp.x - bot.x), -(bot.aiTargetWp.z - bot.z));
      let diff = moveYaw - bot.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      bot.yaw += diff * Math.min(1, 6.0 * dt);
      bot.pitch *= Math.max(0, 1 - 5 * dt);
      input.yaw = bot.yaw;
      input.f = true;

      const speed = Math.hypot(bot.vx, bot.vz);
      if (speed < 1.1 && bot.grounded && Math.random() < 0.08) {
        input.jump = true;
      }
    }

    stepPlayerPhysics(bot, input, dt, this.speedScale);
  }

  tick(dt) {
    if (this.humanCount() === 0) return;

    if (this.matchEnded) {
      this.restartTimer -= dt;
      if (this.restartTimer <= 0) {
        this.resetMatch();
      }
      return;
    }

    for (const hp of this.healthPacks) {
      if (!hp.active) {
        hp.respawnTimer -= dt;
        if (hp.respawnTimer <= 0) {
          hp.active = true;
          this.onBroadcast({ t: 'hpState', id: hp.id, active: true });
        }
      }
    }

    for (const p of this.players.values()) {
      if (p.spawnShield > 0) p.spawnShield = Math.max(0, p.spawnShield - dt);

      if (p.dead) {
        p.respawnTimer -= dt;
        if (p.respawnTimer <= 0) {
          this.respawnPlayer(p);
        }
        continue;
      }

      if (p.isBot) {
        this.stepBotAI(p, dt);
      }

      if (p.hp < p.maxHp || (p.armor ?? 100) < 100) {
        for (const hp of this.healthPacks) {
          if (!hp.active) continue;
          if (Math.hypot(p.x - hp.x, p.z - hp.z) < 1.55 && Math.abs(p.y - hp.y) < 1.6) {
            hp.active = false;
            hp.respawnTimer = 14.0;
            p.hp = Math.min(p.maxHp, p.hp + 45);
            p.armor = 100;
            this.onBroadcast({
              t: 'pickup',
              hpId: hp.id,
              pid: p.id,
              hp: p.hp,
              armor: p.armor
            });
            break;
          }
        }
      }
    }

    this.snapshotAccum += dt;
    if (this.snapshotAccum >= 0.045) {
      this.snapshotAccum = 0;
      this.onBroadcast({
        t: 'snap',
        p: this.serializePlayers()
      });
    }
  }

  serializePlayers() {
    const arr = [];
    for (const p of this.players.values()) {
      arr.push({
        id: p.id,
        n: p.name,
        b: p.isBot ? 1 : 0,
        tm: p.team,
        c: p.color,
        w: p.weapon,
        x: +p.x.toFixed(2),
        y: +p.y.toFixed(2),
        z: +p.z.toFixed(2),
        yw: +p.yaw.toFixed(2),
        pt: +p.pitch.toFixed(2),
        cr: p.crouch ? 1 : 0,
        hp: p.hp,
        ar: p.armor ?? 100,
        d: p.dead ? 1 : 0,
        sh: p.spawnShield > 0 ? 1 : 0,
        k: p.kills,
        dt: p.deaths,
        sc: p.score
      });
    }
    return arr;
  }
}
