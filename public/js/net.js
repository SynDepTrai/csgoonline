// Unified Multiplayer Transport Layer (Server WebSocket + PeerJS WebRTC P2P)

import { GameRoomSim } from './shared-sim.js';
import { TICK_RATE } from './map-data.js';

const P2P_PREFIX = 'voxshot-csgo-';

function randomCode5() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 5; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export class NetworkClient {
  constructor({ onMessage, onDisconnect, onStatus }) {
    this.onMessage = onMessage;
    this.onDisconnect = onDisconnect;
    this.onStatus = onStatus || (() => {});

    this.transportType = null;
    this.ws = null;
    this.peer = null;
    this.hostConn = null;
    this.peerClients = new Map();
    this.localHostSim = null;
    this.localSimInterval = null;
    this.pingInterval = null;
    this.latencyMs = 0;
  }

  disconnect() {
    if (this.pingInterval) { clearInterval(this.pingInterval); this.pingInterval = null; }
    if (this.localSimInterval) { clearInterval(this.localSimInterval); this.localSimInterval = null; }
    this.localHostSim = null;

    if (this.ws) {
      try { this.ws.onclose = null; this.ws.close(); } catch {}
      this.ws = null;
    }
    if (this.hostConn) {
      try { this.hostConn.close(); } catch {}
      this.hostConn = null;
    }
    for (const c of this.peerClients.values()) {
      try { c.close(); } catch {}
    }
    this.peerClients.clear();
    if (this.peer) {
      try { this.peer.destroy(); } catch {}
      this.peer = null;
    }
    this.transportType = null;
  }

  startPingLoop() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      this.send({ t: 'ping', cTime: performance.now() });
    }, 2000);
  }

  connectWebSocket(joinPayload) {
    this.disconnect();
    this.transportType = 'ws';
    this.onStatus('Đang kết nối máy chủ...');

    return new Promise((resolve, reject) => {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${window.location.host}/ws`;
      let settled = false;

      try {
        this.ws = new WebSocket(wsUrl);
      } catch {
        reject(new Error('Không thể khởi tạo kết nối WebSocket.'));
        return;
      }

      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          this.disconnect();
          reject(new Error('Máy chủ không phản hồi. Bạn có thể chuyển sang tab Phòng P2P Trực Tiếp nhé!'));
        }
      }, 5000);

      this.ws.onopen = () => {
        this.ws.send(JSON.stringify(joinPayload));
        this.startPingLoop();
      };

      this.ws.onmessage = (ev) => {
        let msg;
        try { msg = JSON.parse(ev.data); } catch { return; }

        if (msg.t === 'pong') {
          this.latencyMs = Math.max(1, Math.round(performance.now() - msg.cTime));
          return;
        }
        if (msg.t === 'err' && !settled) {
          settled = true;
          clearTimeout(timeout);
          this.disconnect();
          reject(new Error(msg.msg || 'Lỗi tham gia phòng.'));
          return;
        }
        if (msg.t === 'welcome' && !settled) {
          settled = true;
          clearTimeout(timeout);
          resolve(msg);
        }
        this.onMessage(msg);
      };

      this.ws.onerror = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          this.disconnect();
          reject(new Error('Không kết nối được máy chủ WebSocket. Hãy kiểm tra server hoặc dùng chế độ P2P!'));
        }
      };

      this.ws.onclose = () => {
        if (settled) {
          this.disconnect();
          this.onDisconnect('Đã ngắt kết nối khỏi máy chủ.');
        }
      };
    });
  }

  async hostP2PRoom({ name, weapon, skin, mode, economyMode, speedScale, botCount, scoreLimit }) {
    this.disconnect();
    await this.ensurePeerJSLoaded();
    this.transportType = 'p2p-host';
    this.latencyMs = 1;

    const code = randomCode5();
    this.onStatus(`Đang khởi tạo phòng P2P (${code})...`);

    return new Promise((resolve, reject) => {
      const PeerClass = window.Peer;
      if (!PeerClass) {
        reject(new Error('Không tải được thư viện PeerJS để tạo phòng P2P.'));
        return;
      }

      const peer = new PeerClass(`${P2P_PREFIX}${code}`);
      this.peer = peer;
      let settled = false;

      peer.on('open', () => {
        settled = true;
        let pSeq = 2;

        const sim = new GameRoomSim({
          roomCode: code,
          isPublic: false,
          mode,
          economyMode,
          speedScale,
          botCount,
          scoreLimit,
          maxPlayers: 8,
          onBroadcast: (payload) => {
            queueMicrotask(() => this.onMessage(payload));
            for (const conn of this.peerClients.values()) {
              if (conn.open) conn.send(payload);
            }
          },
          onSendTo: (targetId, payload) => {
            if (targetId === 'host_1') {
              queueMicrotask(() => {
                if (payload.t === 'welcome') resolve(payload);
                this.onMessage(payload);
              });
            } else {
              const conn = this.peerClients.get(targetId);
              if (conn && conn.open) conn.send(payload);
            }
          }
        });

        this.localHostSim = sim;
        sim.addHumanPlayer('host_1', name, weapon, skin);

        const dt = 1 / TICK_RATE;
        this.localSimInterval = setInterval(() => {
          sim.tick(dt);
        }, Math.round(1000 / TICK_RATE));

        peer.on('connection', (conn) => {
          const clientId = `p2p_${pSeq++}`;
          conn.on('open', () => this.peerClients.set(clientId, conn));
          conn.on('data', (msg) => {
            if (!msg || typeof msg !== 'object') return;
            if (msg.t === 'joinP2P') {
              sim.addHumanPlayer(clientId, msg.name, msg.weapon, msg.skin);
              return;
            }
            if (msg.t === 'ping') {
              conn.send({ t: 'pong', cTime: msg.cTime });
              return;
            }
            sim.handleClientMessage(clientId, msg);
          });
          conn.on('close', () => {
            this.peerClients.delete(clientId);
            sim.removePlayer(clientId);
          });
          conn.on('error', () => {
            this.peerClients.delete(clientId);
            sim.removePlayer(clientId);
          });
        });
      });

      peer.on('error', (err) => {
        if (!settled) {
          settled = true;
          this.disconnect();
          reject(new Error(`Lỗi khởi tạo P2P: ${err.message || err.type}`));
        }
      });
    });
  }

  async joinP2PRoom({ roomCode, name, weapon, skin }) {
    this.disconnect();
    await this.ensurePeerJSLoaded();
    this.transportType = 'p2p-client';

    const cleanCode = String(roomCode || '').trim().toUpperCase();
    this.onStatus(`Đang kết nối P2P tới phòng ${cleanCode}...`);

    return new Promise((resolve, reject) => {
      const PeerClass = window.Peer;
      if (!PeerClass) {
        reject(new Error('Không tải được thư viện PeerJS.'));
        return;
      }

      const peer = new PeerClass();
      this.peer = peer;
      let settled = false;

      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          this.disconnect();
          reject(new Error(`Không tìm thấy phòng P2P mã "${cleanCode}" hoặc chủ phòng đã thoát.`));
        }
      }, 7500);

      peer.on('open', () => {
        const conn = peer.connect(`${P2P_PREFIX}${cleanCode}`, { reliable: false });
        this.hostConn = conn;

        conn.on('open', () => {
          conn.send({ t: 'joinP2P', name, weapon, skin });
          this.startPingLoop();
        });

        conn.on('data', (msg) => {
          if (!msg || typeof msg !== 'object') return;
          if (msg.t === 'pong') {
            this.latencyMs = Math.max(1, Math.round(performance.now() - msg.cTime));
            return;
          }
          if (msg.t === 'welcome' && !settled) {
            settled = true;
            clearTimeout(timeout);
            resolve(msg);
          }
          this.onMessage(msg);
        });

        conn.on('close', () => {
          if (settled) {
            this.disconnect();
            this.onDisconnect('Chủ phòng P2P đã đóng phòng.');
          }
        });
      });

      peer.on('error', (err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          this.disconnect();
          reject(new Error(`Không kết nối được phòng P2P "${cleanCode}" (${err.type || 'lỗi mạng'}).`));
        }
      });
    });
  }

  send(msg) {
    if (this.transportType === 'ws') {
      if (this.ws && this.ws.readyState === 1) {
        this.ws.send(JSON.stringify(msg));
      }
    } else if (this.transportType === 'p2p-host') {
      if (this.localHostSim) {
        if (msg.t === 'ping') {
          this.latencyMs = 1;
          return;
        }
        this.localHostSim.handleClientMessage('host_1', msg);
      }
    } else if (this.transportType === 'p2p-client') {
      if (this.hostConn && this.hostConn.open) {
        this.hostConn.send(msg);
      }
    }
  }

  async ensurePeerJSLoaded() {
    if (window.Peer) return;
    const sources = ['/vendor/peerjs.min.js', 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'];
    for (const src of sources) {
      try {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = src;
          s.onload = res;
          s.onerror = rej;
          document.head.appendChild(s);
        });
        if (window.Peer) return;
      } catch {}
    }
  }
}
