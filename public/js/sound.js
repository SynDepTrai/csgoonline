// Realistic CS:GO Acoustic Synthesizer (All 11 Weapons, Kevlar Helmet Dink, Buy Sound, Footsteps)

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.masterVolume = 0.5;
    this.footstepVolume = 1.0;
    this.noiseCache = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  getNoiseBuffer() {
    if (this.noiseCache) return this.noiseCache;
    const sr = this.ctx.sampleRate;
    const len = Math.floor(sr * 1.2);
    const buf = this.ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseCache = buf;
    return buf;
  }

  playGunshot(weaponId = 'ak47', volumeScale = 1.0) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const vol = Math.min(1, this.masterVolume * volumeScale);
    if (vol <= 0.01) return;

    if (weaponId === 'knife') {
      this.playKnifeSlash(vol);
      return;
    }

    if (weaponId === 'awp' || weaponId === 'ssg08') {
      const isAwp = weaponId === 'awp';
      const dur = isAwp ? 0.9 : 0.48;
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer();

      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(isAwp ? 3300 : 3900, now);
      lp.frequency.exponentialRampToValueAtTime(140, now + dur);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(vol * (isAwp ? 1.15 : 0.88), now);
      nGain.gain.exponentialRampToValueAtTime(vol * 0.25, now + 0.14);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      noise.connect(lp);
      lp.connect(nGain);
      nGain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + dur + 0.02);

      const sub = this.ctx.createOscillator();
      const sGain = this.ctx.createGain();
      sub.type = 'sawtooth';
      sub.frequency.setValueAtTime(isAwp ? 165 : 220, now);
      sub.frequency.exponentialRampToValueAtTime(isAwp ? 34 : 52, now + 0.38);
      sGain.gain.setValueAtTime(vol * (isAwp ? 0.95 : 0.72), now);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      sub.connect(sGain);
      sGain.connect(this.ctx.destination);
      sub.start(now);
      sub.stop(now + 0.41);

      if (volumeScale > 0.65) {
        this.playMechanicalClick(now + 0.38, 1200, vol * 0.3);
        this.playMechanicalClick(now + 0.54, 1520, vol * 0.32);
      }
      return;
    }

    if (weaponId === 'm4a1s' || weaponId === 'usp') {
      // Silenced M4A1-S & USP-S
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer();
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(weaponId === 'usp' ? 2900 : 2550, now);
      bp.Q.value = 1.45;

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(vol * 0.6, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

      noise.connect(bp);
      bp.connect(nGain);
      nGain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.09);

      const thump = this.ctx.createOscillator();
      const tGain = this.ctx.createGain();
      thump.type = 'sine';
      thump.frequency.setValueAtTime(215, now);
      thump.frequency.exponentialRampToValueAtTime(70, now + 0.065);
      tGain.gain.setValueAtTime(vol * 0.52, now);
      tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      thump.connect(tGain);
      tGain.connect(this.ctx.destination);
      thump.start(now);
      thump.stop(now + 0.075);
      return;
    }

    if (weaponId === 'xm1014') {
      // Heavy Shotgun Blast
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer();
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(2200, now);
      lp.frequency.exponentialRampToValueAtTime(160, now + 0.32);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(vol * 1.0, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.33);
      noise.connect(lp);
      lp.connect(nGain);
      nGain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.34);

      const boom = this.ctx.createOscillator();
      const bGain = this.ctx.createGain();
      boom.type = 'triangle';
      boom.frequency.setValueAtTime(140, now);
      boom.frequency.exponentialRampToValueAtTime(38, now + 0.22);
      bGain.gain.setValueAtTime(vol * 0.88, now);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
      boom.connect(bGain);
      bGain.connect(this.ctx.destination);
      boom.start(now);
      boom.stop(now + 0.24);
      return;
    }

    if (weaponId === 'deagle') {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer();
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(3800, now);
      lp.frequency.exponentialRampToValueAtTime(260, now + 0.34);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(vol * 0.98, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      noise.connect(lp);
      lp.connect(nGain);
      nGain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.36);

      const punch = this.ctx.createOscillator();
      const pGain = this.ctx.createGain();
      punch.type = 'triangle';
      punch.frequency.setValueAtTime(240, now);
      punch.frequency.exponentialRampToValueAtTime(48, now + 0.18);
      pGain.gain.setValueAtTime(vol * 0.85, now);
      pGain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
      punch.connect(pGain);
      pGain.connect(this.ctx.destination);
      punch.start(now);
      punch.stop(now + 0.2);
      return;
    }

    if (weaponId === 'mp9' || weaponId === 'p90' || weaponId === 'glock') {
      // Crisp 9mm / 5.7mm SMG & Glock pop
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer();
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(3200, now);
      lp.frequency.exponentialRampToValueAtTime(420, now + 0.11);

      const nGain = this.ctx.createGain();
      nGain.gain.setValueAtTime(vol * 0.72, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      noise.connect(lp);
      lp.connect(nGain);
      nGain.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.13);

      const pop = this.ctx.createOscillator();
      const pGain = this.ctx.createGain();
      pop.type = 'triangle';
      pop.frequency.setValueAtTime(290, now);
      pop.frequency.exponentialRampToValueAtTime(75, now + 0.08);
      pGain.gain.setValueAtTime(vol * 0.65, now);
      pGain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
      pop.connect(pGain);
      pGain.connect(this.ctx.destination);
      pop.start(now);
      pop.stop(now + 0.09);
      return;
    }

    // AK-47 & AUG Rifle Bark
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(weaponId === 'aug' ? 3300 : 3650, now);
    filter.frequency.exponentialRampToValueAtTime(310, now + 0.19);

    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(vol * 0.9, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.21);

    const bark = this.ctx.createOscillator();
    const bGain = this.ctx.createGain();
    bark.type = 'sawtooth';
    bark.frequency.setValueAtTime(weaponId === 'aug' ? 255 : 235, now);
    bark.frequency.exponentialRampToValueAtTime(56, now + 0.11);
    bGain.gain.setValueAtTime(vol * 0.78, now);
    bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    bark.connect(bGain);
    bGain.connect(this.ctx.destination);
    bark.start(now);
    bark.stop(now + 0.13);

    this.playMechanicalClick(now + 0.025, 1950, vol * 0.24);
  }

  playMechanicalClick(when, freq, gainVal) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, when);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.55, when + 0.035);
    g.gain.setValueAtTime(gainVal, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.04);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(when);
    osc.stop(when + 0.045);
  }

  playKnifeSlash(vol) {
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer();
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1400, now);
    bp.frequency.exponentialRampToValueAtTime(3800, now + 0.09);
    bp.Q.value = 2.2;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol * 0.5, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    noise.connect(bp);
    bp.connect(g);
    g.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.12);
  }

  playWeaponDraw(weaponId = 'ak47') {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (weaponId === 'knife') {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.exponentialRampToValueAtTime(3600, now + 0.14);
      g.gain.setValueAtTime(this.masterVolume * 0.25, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    } else {
      this.playMechanicalClick(now + 0.02, 1100, this.masterVolume * 0.22);
      this.playMechanicalClick(now + 0.11, 1550, this.masterVolume * 0.22);
    }
  }

  playBuySound() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.playMechanicalClick(now, 1320, this.masterVolume * 0.3);
    this.playMechanicalClick(now + 0.06, 1760, this.masterVolume * 0.34);
  }

  playScopeZoom() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    this.playMechanicalClick(this.ctx.currentTime, 1850, this.masterVolume * 0.28);
  }

  playHitmarker(headshot = false, kill = false) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (headshot) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1920, now);
      osc.frequency.exponentialRampToValueAtTime(980, now + 0.09);
      g.gain.setValueAtTime(this.masterVolume * 0.9, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);

      const noise = this.ctx.createBufferSource();
      noise.buffer = this.getNoiseBuffer();
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'bandpass';
      hp.frequency.value = 2400;
      const ng = this.ctx.createGain();
      ng.gain.setValueAtTime(this.masterVolume * 0.65, now);
      ng.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      noise.connect(hp);
      hp.connect(ng);
      ng.connect(this.ctx.destination);
      noise.start(now);
      noise.stop(now + 0.09);
    } else {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.055);
      g.gain.setValueAtTime(this.masterVolume * 0.65, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.065);
    }

    if (kill) {
      this.playMechanicalClick(now + 0.04, 880, this.masterVolume * 0.35);
    }
  }

  playFootstep() {
    if (!this.enabled || this.footstepVolume <= 0.01) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.getNoiseBuffer();
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 650 + Math.random() * 280;
    bp.Q.value = 1.6;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(this.masterVolume * 0.22 * this.footstepVolume, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    noise.connect(bp);
    bp.connect(g);
    g.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.07);
  }

  playReload() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.playMechanicalClick(now + 0.05, 680, this.masterVolume * 0.28);
    this.playMechanicalClick(now + 0.65, 920, this.masterVolume * 0.32);
    this.playMechanicalClick(now + 1.25, 1420, this.masterVolume * 0.35);
  }

  playJump() {
    this.playFootstep();
  }

  playPickup() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.playMechanicalClick(now, 1050, this.masterVolume * 0.32);
    this.playMechanicalClick(now + 0.08, 1380, this.masterVolume * 0.32);
  }

  playHurt() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(52, now + 0.11);
    g.gain.setValueAtTime(this.masterVolume * 0.5, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }
}

export const sound = new SoundEngine();
