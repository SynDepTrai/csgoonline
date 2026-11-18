import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { GameRoomSim } from './public/js/shared-sim.js';
import { TICK_RATE } from './public/js/map-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT) || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const rooms = new Map();
let clientSeq = 1;
let publicSeq = 1;

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 50; attempt++) {
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (!rooms.has(code)) return code;
  }
  return `CS${Date.now().toString(36).slice(-3).toUpperCase()}`;
}

function createRoomInstance({ roomCode, isPublic, mode, economyMode, speedScale, botCount, scoreLimit }) {
  const clients = new Map();
  const sim = new GameRoomSim({
    roomCode,
    isPublic,
    mode,
    economyMode,
    speedScale,
    botCount,
    scoreLimit,
    maxPlayers: 10,
    onBroadcast: (payload) => {
      const raw = JSON.stringify(payload);
      for (const ws of clients.values()) {
        if (ws.readyState === 1) ws.send(raw);
      }
    },
    onSendTo: (playerId, payload) => {
      const ws = clients.get(playerId);
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify(payload));
      }
    }
  });

  const entry = { roomCode, isPublic, sim, clients };
  rooms.set(roomCode, entry);
  return entry;
}

function findOrCreatePublicRoom() {
  for (const entry of rooms.values()) {
    if (entry.isPublic && entry.sim.humanCount() < entry.sim.maxPlayers) {
      return entry;
    }
  }
  const code = `DUST${publicSeq++}`;
  return createRoomInstance({
    roomCode: code,
    isPublic: true,
    mode: 'tdm',
    economyMode: 'csgo',
    speedScale: 1.0,
    botCount: 5,
    scoreLimit: 30
  });
}

const VENDOR_FILES = {
  '/vendor/three.module.js': path.join(__dirname, 'node_modules', 'three', 'build', 'three.module.js'),
  '/vendor/three.core.js': path.join(__dirname, 'node_modules', 'three', 'build', 'three.core.js'),
  '/vendor/peerjs.min.js': path.join(__dirname, 'node_modules', 'peerjs', 'dist', 'peerjs.min.js')
};

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(urlObj.pathname);

  if (pathname === '/api/status') {
    let onlineHumans = 0;
    let publicRooms = 0;
    for (const r of rooms.values()) {
      onlineHumans += r.sim.humanCount();
      if (r.isPublic) publicRooms++;
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, onlineHumans, activeRooms: rooms.size, publicRooms }));
    return;
  }

  if (VENDOR_FILES[pathname] && fs.existsSync(VENDOR_FILES[pathname])) {
    res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=3600' });
    fs.createReadStream(VENDOR_FILES[pathname]).pipe(res);
    return;
  }

  if (pathname.startsWith('/vendor/')) {
    const subName = path.basename(pathname);
    const candidate = path.join(__dirname, 'node_modules', 'three', 'build', subName);
    if (fs.existsSync(candidate)) {
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
      fs.createReadStream(candidate).pipe(res);
      return;
    }
  }

  let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, pathname);
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(resolved, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(resolved).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(resolved).pipe(res);
  });
});

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  const playerId = `p_${clientSeq++}`;
  let currentRoom = null;

  function leaveCurrentRoom() {
    if (!currentRoom) return;
    currentRoom.clients.delete(playerId);
    currentRoom.sim.removePlayer(playerId);
    if (currentRoom.sim.humanCount() === 0) {
      rooms.delete(currentRoom.roomCode);
    }
    currentRoom = null;
  }

  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }
    if (!msg || typeof msg.t !== 'string') return;

    if (msg.t === 'quickPlay') {
      leaveCurrentRoom();
      const room = findOrCreatePublicRoom();
      currentRoom = room;
      room.clients.set(playerId, ws);
      room.sim.addHumanPlayer(playerId, msg.name, msg.weapon, msg.skin);
      return;
    }

    if (msg.t === 'createRoom') {
      leaveCurrentRoom();
      const code = generateRoomCode();
      const room = createRoomInstance({
        roomCode: code,
        isPublic: false,
        mode: msg.mode || 'tdm',
        economyMode: msg.economyMode || 'csgo',
        speedScale: msg.speedScale !== undefined ? Number(msg.speedScale) : 1.0,
        botCount: msg.botCount !== undefined ? Number(msg.botCount) : 3,
        scoreLimit: msg.scoreLimit !== undefined ? Number(msg.scoreLimit) : 30
      });
      currentRoom = room;
      room.clients.set(playerId, ws);
      room.sim.addHumanPlayer(playerId, msg.name, msg.weapon, msg.skin);
      return;
    }

    if (msg.t === 'joinRoom') {
      const code = String(msg.roomCode || '').trim().toUpperCase();
      const room = rooms.get(code);
      if (!room) {
        ws.send(JSON.stringify({
          t: 'err',
          msg: `Không tìm thấy phòng mã "${code}". Kiểm tra lại mã phòng hoặc tạo phòng mới nhé!`
        }));
        return;
      }
      if (room.sim.humanCount() >= room.sim.maxPlayers) {
        ws.send(JSON.stringify({
          t: 'err',
          msg: `Phòng "${code}" đã đầy (${room.sim.maxPlayers}/${room.sim.maxPlayers})!`
        }));
        return;
      }
      leaveCurrentRoom();
      currentRoom = room;
      room.clients.set(playerId, ws);
      room.sim.addHumanPlayer(playerId, msg.name, msg.weapon, msg.skin);
      return;
    }

    if (currentRoom) {
      currentRoom.sim.handleClientMessage(playerId, msg);
    }
  });

  ws.on('close', () => leaveCurrentRoom());
  ws.on('error', () => leaveCurrentRoom());
});

const dt = 1 / TICK_RATE;
setInterval(() => {
  for (const room of rooms.values()) {
    room.sim.tick(dt);
  }
}, Math.round(1000 / TICK_RATE));

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n==================================================`);
  console.log(`🎯 CS:GO Web Dust II Server đang chạy!`);
  console.log(`👉 Mở trên máy này: http://localhost:${PORT}`);
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`🌐 Mở trong mạng LAN/Wi-Fi: http://${net.address}:${PORT}`);
      }
    }
  }
  console.log(`==================================================\n`);
});
