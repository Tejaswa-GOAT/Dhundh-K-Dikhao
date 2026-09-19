(() => {
  // js/audio.js
  var SoundEngine = class {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
      this.masterGain = null;
      this.tanpuraOscs = [];
      this.tanpuraGain = null;
      this.isTanpuraRunning = false;
      this.hasUnlocked = false;
      this.waterSpraySource = null;
      this.waterSprayGain = null;
    }
    init() {
      if (this.ctx) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    unlock() {
      if (this.hasUnlocked && this.ctx && this.ctx.state === "running") return;
      this.init();
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      this.hasUnlocked = true;
      this.startTanpuraDrone();
    }
    setMute(mute) {
      this.isMuted = mute;
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
      }
    }
    // Peaceful Indian Tanpura drone in D (Pa - Sa - Sa - Sa)
    startTanpuraDrone() {
      if (!this.ctx || this.isTanpuraRunning) return;
      this.isTanpuraRunning = true;
      this.tanpuraGain = this.ctx.createGain();
      this.tanpuraGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      this.tanpuraGain.connect(this.masterGain);
      const freqs = [
        146.83,
        // D3 (Sa)
        220,
        // A3 (Pa)
        293.66,
        // D4 (Sa high)
        293.66 * 1.002
        // slight acoustic beating
      ];
      this.tanpuraOscs = freqs.map((f, i) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        osc.type = i % 2 === 0 ? "sawtooth" : "triangle";
        osc.frequency.setValueAtTime(f, this.ctx.currentTime);
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(600 + i * 150, this.ctx.currentTime);
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.setValueAtTime(0.15 + i * 0.08, this.ctx.currentTime);
        lfoGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(g.gain);
        g.gain.setValueAtTime(0.05, this.ctx.currentTime);
        osc.connect(filter);
        filter.connect(g);
        g.connect(this.tanpuraGain);
        osc.start();
        lfo.start();
        return { osc, lfo };
      });
    }
    // Temple Bell (Ghanti) - Resonant brass bell chime
    playTempleBell(pitch = 1) {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const fundamental = 1250 * pitch;
      const partials = [1, 2.01, 3.12, 4.24, 6.18];
      const gains = [0.4, 0.25, 0.15, 0.1, 0.05];
      partials.forEach((p, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(fundamental * p, now);
        g.gain.setValueAtTime(gains[idx], now);
        g.gain.exponentialRampToValueAtTime(1e-4, now + 2.2 / (idx + 1));
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 2.3);
      });
    }
    // Festive Dhol Strike - punchy folk bass drum with warm resonance
    playDhol(isRim = false) {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      if (isRim) {
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.15);
      } else {
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.28);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.32);
      }
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.35);
    }
    // Sacred Aarti Conch / Gong Sting - for transitions
    playAartiSting() {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      this.playTempleBell(0.85);
      setTimeout(() => this.playTempleBell(1.2), 300);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(293.66, now);
      osc.frequency.linearRampToValueAtTime(329.63, now + 1.2);
      gain.gain.setValueAtTime(1e-3, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(1e-3, now + 2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 2.1);
    }
    // Cute Mouse Squeak - joyful high chirp when blessed or jumping
    playMouseSqueak() {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(2200, now);
      osc.frequency.exponentialRampToValueAtTime(3400, now + 0.08);
      osc.frequency.setValueAtTime(2600, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(3900, now + 0.18);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.22);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.24);
    }
    // Marigold Blessing Burst - sparkling petal whoosh and chord
    playBlessingSuccess() {
      if (!this.ctx || this.isMuted) return;
      this.playTempleBell(1.1);
      setTimeout(() => this.playMouseSqueak(), 150);
      const now = this.ctx.currentTime;
      const chord = [293.66, 369.99, 440, 493.88, 587.33];
      chord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        g.gain.setValueAtTime(1e-4, now + idx * 0.05);
        g.gain.linearRampToValueAtTime(0.12, now + idx * 0.05 + 0.04);
        g.gain.exponentialRampToValueAtTime(1e-4, now + idx * 0.05 + 0.9);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 1);
      });
    }
    // Miss Chime - gentle wooden/ceramic clink with small petal flutter
    playMissChime() {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.22);
    }
    // Soft UI Click / Pop
    playUiClick() {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.05);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.06);
    }
    // Subtle Paint Stroke Swish
    playPaintStroke() {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.09);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.1);
    }
    // Pulse countdown sting (last 10s)
    playUrgentPulse() {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.25);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.32);
    }
    // Heartbeat Proximity Thump (Lub-Dub)
    playHeartbeat(factor = 0.5) {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const g1 = this.ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(65, now);
      osc1.frequency.exponentialRampToValueAtTime(42, now + 0.12);
      g1.gain.setValueAtTime(0.28 * factor, now);
      g1.gain.exponentialRampToValueAtTime(1e-3, now + 0.14);
      osc1.connect(g1);
      g1.connect(this.masterGain);
      osc1.start(now);
      osc1.stop(now + 0.15);
      const osc2 = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(55, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(36, now + 0.24);
      g2.gain.setValueAtTime(0.22 * factor, now + 0.12);
      g2.gain.exponentialRampToValueAtTime(1e-3, now + 0.26);
      osc2.connect(g2);
      g2.connect(this.masterGain);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.28);
    }
    // Festive Taunt Chime / Squeak
    playTauntSound() {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      [880, 1174, 1480, 1760].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.12, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(1e-3, now + i * 0.06 + 0.18);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.2);
      });
    }
    // Prop Ability Sweet Bounce / Roll Whoosh
    playAbilitySound() {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.24);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.26);
    }
    // Seeker Trunk Sniff (Air inhalation draft)
    playTrunkSniff() {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.3);
      filter.Q.setValueAtTime(3, now);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.35);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      noise.start(now);
      noise.stop(now + 0.36);
    }
    // Golden Prasad Snatch Collect Ding
    playPrasadSnatch() {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      [1046.5, 1318.5, 1567.98, 2093].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.15, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(1e-3, now + i * 0.05 + 0.35);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.38);
      });
    }
    // Alias for Prasad collection
    playPrasadCollect() {
      return this.playPrasadSnatch();
    }
    // Warm diya ignite flame pop
    playDiyaIgnite() {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.15);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.16);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.18);
    }
    // Gentle calf footstep
    playBalaFootstep() {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.09);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.1);
    }
    // Tiny mouse footstep tap
    playMouseFootstep() {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1200 + Math.random() * 300, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.03);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.035);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.04);
    }
    // Playful young elephant giggle / trumpet
    playSeekerLaugh() {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      [587.33, 659.25, 783.99].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.15, now + i * 0.08 + 0.06);
        gain.gain.setValueAtTime(0.08, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(1e-3, now + i * 0.08 + 0.12);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.14);
      });
    }
    // Continuous Water Spray Jet Loop (Synthesized filtered white/pink noise)
    startWaterSprayLoop() {
      if (!this.ctx || this.isMuted) return;
      if (this.waterSpraySource) return;
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        output[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;
      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(1350, this.ctx.currentTime);
      bandpass.Q.setValueAtTime(1.8, this.ctx.currentTime);
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(1e-3, this.ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.24, this.ctx.currentTime + 0.08);
      whiteNoise.connect(bandpass);
      bandpass.connect(gainNode);
      gainNode.connect(this.masterGain);
      whiteNoise.start();
      this.waterSpraySource = whiteNoise;
      this.waterSprayGain = gainNode;
    }
    stopWaterSprayLoop() {
      if (!this.ctx || !this.waterSprayGain || !this.waterSpraySource) return;
      try {
        const now = this.ctx.currentTime;
        this.waterSprayGain.gain.setValueAtTime(this.waterSprayGain.gain.value, now);
        this.waterSprayGain.gain.exponentialRampToValueAtTime(1e-4, now + 0.09);
        const src = this.waterSpraySource;
        setTimeout(() => {
          try {
            src.stop();
            src.disconnect();
          } catch (e) {
          }
        }, 100);
      } catch (e) {
      }
      this.waterSpraySource = null;
      this.waterSprayGain = null;
    }
    // Procedural Liquid Water Splash on Contact
    playWaterSplash(intensity = 1) {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      const baseFreq = 420 + Math.random() * 220;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + 0.04);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, now + 0.12);
      gain.gain.setValueAtTime(0.18 * intensity, now);
      gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.14);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.15);
      const bufferSize = this.ctx.sampleRate * 0.08;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.15;
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(1600, now);
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.12 * intensity, now);
      noiseGain.gain.exponentialRampToValueAtTime(1e-3, now + 0.07);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(now);
    }
    // Low pressure coughing sputter when tank hits 0
    playWaterEmptySputter() {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      [0, 0.08, 0.16].forEach((delay, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140 - i * 20, now + delay);
        osc.frequency.linearRampToValueAtTime(60, now + delay + 0.05);
        gain.gain.setValueAtTime(0.15, now + delay);
        gain.gain.exponentialRampToValueAtTime(1e-3, now + delay + 0.06);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + delay);
        osc.stop(now + delay + 0.07);
      });
    }
    // Aquatic chime on disguise blast-off / hider reveal
    playHiderSoakReveal() {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + idx * 0.06);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.38);
      });
    }
    // Directional 3D Anti-Camp Festive Sound (Panned left/right based on listener position and orientation)
    playDirectionalChime(sourcePos, listenerPos, listenerYaw = 0, type = "bell") {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      let dx = 0, dz = 0, dist = 1;
      if (sourcePos && listenerPos) {
        dx = sourcePos.x - listenerPos.x;
        dz = sourcePos.z - listenerPos.z;
        dist = Math.max(0.1, Math.hypot(dx, dz));
      }
      const angleToSource = Math.atan2(dx, dz);
      let relAngle = (angleToSource - listenerYaw) % (Math.PI * 2);
      if (relAngle > Math.PI) relAngle -= Math.PI * 2;
      if (relAngle < -Math.PI) relAngle += Math.PI * 2;
      const panVal = Math.max(-0.95, Math.min(0.95, Math.sin(relAngle)));
      const maxDist = 28;
      const distFactor = Math.max(0.05, Math.min(1, 1 - dist / maxDist));
      let panner = null;
      if (typeof this.ctx.createStereoPanner === "function") {
        panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime(panVal, now);
        panner.connect(this.masterGain);
      }
      const chimeGain = this.ctx.createGain();
      chimeGain.gain.setValueAtTime(0.35 * distFactor, now);
      chimeGain.connect(panner ? panner : this.masterGain);
      if (type === "dhol") {
        const osc = this.ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(65, now + 0.22);
        chimeGain.gain.setValueAtTime(0.45 * distFactor, now);
        chimeGain.gain.exponentialRampToValueAtTime(1e-3, now + 0.25);
        osc.connect(chimeGain);
        osc.start(now);
        osc.stop(now + 0.26);
      } else {
        const freqs = [1180, 1540, 2120];
        freqs.forEach((f, i) => {
          const osc = this.ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(f, now + i * 0.04);
          const g = this.ctx.createGain();
          g.gain.setValueAtTime(0.25 * distFactor / (i + 1), now + i * 0.04);
          g.gain.exponentialRampToValueAtTime(1e-4, now + i * 0.04 + 1.2);
          osc.connect(g);
          g.connect(chimeGain);
          osc.start(now + i * 0.04);
          osc.stop(now + i * 0.04 + 1.3);
        });
      }
    }
    // Heavy prop ground landing impact thud
    playHeavyThud() {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(85, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.35);
      gain.gain.setValueAtTime(0.48, now);
      gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.38);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.4);
    }
    // Crisp stone/wood rigid freeze lock clack
    playFreezeClack() {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
      gain.gain.setValueAtTime(0.26, now);
      gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.09);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.1);
    }
    // Unfreeze sudden escape whoosh
    playUnfreezeWhoosh() {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.12);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.14);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.15);
    }
    // Unstuck geometry pop
    playUnstuckPop() {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(960, now + 0.1);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(1e-3, now + 0.12);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.13);
    }
    // =========================================================================
    // 3D DIRECTIONAL SPATIAL AUDIO ENGINE
    // =========================================================================
    /**
     * Plays a sound positioned in 3D festival space relative to the player's camera.
     * Calculates distance attenuation and stereo azimuth panning.
     */
    playDirectionalSpatialSound(soundType, sourcePos, listenerPos, listenerYaw = 0) {
      if (!this.ctx || this.isMuted || !sourcePos || !listenerPos) return;
      const now = this.ctx.currentTime;
      const dx = sourcePos.x - listenerPos.x;
      const dz = sourcePos.z - listenerPos.z;
      const dist = Math.hypot(dx, dz);
      const maxAudibleDist = 32;
      if (dist > maxAudibleDist) return;
      const volumeFactor = Math.max(0.05, Math.min(1, 1 / (1 + dist * 0.12)));
      const soundAngle = Math.atan2(dx, dz);
      let relAngle = soundAngle - listenerYaw;
      while (relAngle > Math.PI) relAngle -= Math.PI * 2;
      while (relAngle < -Math.PI) relAngle += Math.PI * 2;
      const panValue = Math.max(-1, Math.min(1, Math.sin(relAngle)));
      let spatialOutput = this.masterGain;
      if (this.ctx.createStereoPanner) {
        const panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime(panValue, now);
        panner.connect(this.masterGain);
        spatialOutput = panner;
      }
      const spatialGain = this.ctx.createGain();
      spatialGain.gain.setValueAtTime(volumeFactor, now);
      spatialGain.connect(spatialOutput);
      if (soundType === "anti_camp_bell") {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1480, now);
        g.gain.setValueAtTime(0.22, now);
        g.gain.exponentialRampToValueAtTime(1e-3, now + 0.65);
        osc.connect(g);
        g.connect(spatialGain);
        osc.start(now);
        osc.stop(now + 0.7);
      } else if (soundType === "anti_camp_dhol") {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(65, now + 0.2);
        g.gain.setValueAtTime(0.32, now);
        g.gain.exponentialRampToValueAtTime(1e-3, now + 0.25);
        osc.connect(g);
        g.connect(spatialGain);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (soundType === "taunt_giggle") {
        [0, 0.08, 0.16].forEach((offset, idx) => {
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(800 + idx * 180, now + offset);
          osc.frequency.exponentialRampToValueAtTime(1250 + idx * 120, now + offset + 0.06);
          g.gain.setValueAtTime(0.18, now + offset);
          g.gain.exponentialRampToValueAtTime(1e-3, now + offset + 0.07);
          osc.connect(g);
          g.connect(spatialGain);
          osc.start(now + offset);
          osc.stop(now + offset + 0.08);
        });
      } else if (soundType === "taunt_morya") {
        [0, 0.12].forEach((offset, idx) => {
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(idx === 0 ? 987.77 : 1318.51, now + offset);
          g.gain.setValueAtTime(0.28, now + offset);
          g.gain.exponentialRampToValueAtTime(1e-3, now + offset + 0.5);
          osc.connect(g);
          g.connect(spatialGain);
          osc.start(now + offset);
          osc.stop(now + offset + 0.55);
        });
      } else {
        this.playTempleBell(1.2);
      }
    }
  };
  var sound = new SoundEngine();

  // js/storage.js
  var STORAGE_KEY = "mushika_mandap_v1";
  var defaultData = {
    mushikaEscapes: 0,
    balaBlessings: 0,
    gamesPlayed: 0,
    muted: false,
    hasSeenTutorial: false,
    lastRole: "hider",
    // 'hider' | 'seeker' | 'hotseat'
    difficulty: "normal"
    // 'easy' | 'normal' | 'festive'
  };
  var StorageManager = class {
    constructor() {
      this.data = this.load();
    }
    load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...defaultData };
        return { ...defaultData, ...JSON.parse(raw) };
      } catch (e) {
        console.warn("Could not read from localStorage", e);
        return { ...defaultData };
      }
    }
    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      } catch (e) {
        console.warn("Could not write to localStorage", e);
      }
    }
    recordMushikaWin() {
      this.data.mushikaEscapes++;
      this.data.gamesPlayed++;
      this.save();
    }
    recordBalaWin() {
      this.data.balaBlessings++;
      this.data.gamesPlayed++;
      this.save();
    }
    setMuted(muted) {
      this.data.muted = muted;
      this.save();
    }
    setSeenTutorial(seen = true) {
      this.data.hasSeenTutorial = seen;
      this.save();
    }
    setLastRole(role) {
      this.data.lastRole = role;
      this.save();
    }
    setDifficulty(diff) {
      this.data.difficulty = diff;
      this.save();
    }
    resetScores() {
      this.data.mushikaEscapes = 0;
      this.data.balaBlessings = 0;
      this.data.gamesPlayed = 0;
      this.save();
    }
  };
  var storage = new StorageManager();

  // js/state.js
  var GAME_PHASES = {
    TITLE: "TITLE",
    TUTORIAL: "TUTORIAL",
    HIDE: "HIDE",
    // 60.0s (Saffron #E07A2F)
    AARTI: "AARTI",
    // 2.0s Interstitial
    HOTSEAT_PASS: "HOTSEAT_PASS",
    SEEK: "SEEK",
    // 90.0s (Peacock Green #0F6A62)
    RESULT: "RESULT",
    PAUSED: "PAUSED"
  };
  var GameStateManager = class {
    constructor() {
      this.currentPhase = GAME_PHASES.TITLE;
      this.previousPhase = null;
      this.gameMode = "hider";
      this.difficulty = storage.data.difficulty || "normal";
      this.HIDE_DURATION = 45;
      this.AARTI_DURATION = 2;
      this.SEEK_DURATION = 60;
      this.phaseTimer = 0;
      this.isFrozen = false;
      this.freezeLookGrace = 0;
      this.lastTenSecondPulse = false;
      this.blessingsCount = 0;
      this.remainingMiceCount = 4;
      this.prasadScore = 0;
      this.scoreMultiplier = 1;
      this.hasCarriedPrasad = false;
      this.winner = null;
      this.seekerStamina = 3;
      this.seekerMaxStamina = 3;
      this.seekerStaminaPenaltyTimer = 0;
      this.onPhaseChange = null;
      this.onTimerUpdate = null;
      this.onResult = null;
    }
    get phaseTimeLeft() {
      return this.phaseTimer;
    }
    startRound(mode = "hider", initialPhase = null, totalMice = 4) {
      this.gameMode = mode;
      storage.setLastRole(mode);
      this.blessingsCount = 0;
      this.prasadScore = 0;
      this.scoreMultiplier = 1;
      this.hasCarriedPrasad = false;
      this.seekerStamina = 3;
      this.seekerStaminaPenaltyTimer = 0;
      this.winner = null;
      this.lastTenSecondPulse = false;
      this.remainingMiceCount = totalMice;
      if (initialPhase) {
        this.setPhase(initialPhase);
        this.phaseTimer = initialPhase === GAME_PHASES.HIDE ? this.HIDE_DURATION : this.SEEK_DURATION;
      } else if (mode === "seeker") {
        this.setPhase(GAME_PHASES.SEEK);
        this.phaseTimer = this.SEEK_DURATION;
      } else {
        this.setPhase(GAME_PHASES.HIDE);
        this.phaseTimer = this.HIDE_DURATION;
      }
    }
    setPhase(phase) {
      this.previousPhase = this.currentPhase;
      this.currentPhase = phase;
      if (phase === GAME_PHASES.HIDE) {
        this.isFrozen = false;
        this.freezeLookGrace = 0;
      } else if (phase === GAME_PHASES.AARTI) {
        this.phaseTimer = this.AARTI_DURATION;
        sound.playAartiSting();
      } else if (phase === GAME_PHASES.SEEK) {
        this.phaseTimer = this.SEEK_DURATION;
        this.isFrozen = this.gameMode === "hotseat";
        sound.playTempleBell(1);
      } else if (phase === GAME_PHASES.RESULT) {
        this.isFrozen = true;
        if (this.onResult) this.onResult(this.winner, this.getRoundStats());
      }
      if (this.onPhaseChange) {
        this.onPhaseChange(this.currentPhase, this.gameMode);
      }
    }
    togglePause() {
      if (this.currentPhase === GAME_PHASES.PAUSED) {
        this.currentPhase = this.previousPhase || GAME_PHASES.SEEK;
        if (this.onPhaseChange) this.onPhaseChange(this.currentPhase, this.gameMode);
      } else if (this.currentPhase === GAME_PHASES.HIDE || this.currentPhase === GAME_PHASES.SEEK) {
        this.previousPhase = this.currentPhase;
        this.currentPhase = GAME_PHASES.PAUSED;
        if (this.onPhaseChange) this.onPhaseChange(this.currentPhase, this.gameMode);
      }
    }
    update(dt) {
      if (this.currentPhase === GAME_PHASES.PAUSED || this.currentPhase === GAME_PHASES.TITLE || this.currentPhase === GAME_PHASES.HOTSEAT_PASS || this.currentPhase === GAME_PHASES.RESULT) {
        return;
      }
      this.phaseTimer = Math.max(0, this.phaseTimer - dt);
      if (this.onTimerUpdate) {
        this.onTimerUpdate(this.phaseTimer, this.currentPhase);
      }
      if (this.phaseTimer <= 10 && this.phaseTimer > 0) {
        const sec = Math.floor(this.phaseTimer);
        if (sec !== this.lastSec) {
          this.lastSec = sec;
          sound.playUrgentPulse();
        }
      }
      if (this.currentPhase === GAME_PHASES.HIDE) {
        if (this.phaseTimer <= 0) {
          if (this.gameMode === "hotseat") {
            if (this.freezeLookGrace === 0) {
              this.freezeLookGrace = 2;
            } else {
              this.freezeLookGrace -= dt;
              if (this.freezeLookGrace <= 0) {
                this.isFrozen = true;
                this.setPhase(GAME_PHASES.AARTI);
              }
            }
          } else {
            this.isFrozen = false;
            this.setPhase(GAME_PHASES.AARTI);
          }
        }
      } else if (this.currentPhase === GAME_PHASES.AARTI) {
        if (this.phaseTimer <= 0) {
          if (this.gameMode === "hotseat") {
            this.setPhase(GAME_PHASES.HOTSEAT_PASS);
          } else {
            this.setPhase(GAME_PHASES.SEEK);
          }
        }
      } else if (this.currentPhase === GAME_PHASES.SEEK) {
        if (this.seekerStaminaPenaltyTimer > 0) {
          const penaltyRemaining = this.seekerStaminaPenaltyTimer;
          this.seekerStaminaPenaltyTimer = Math.max(0, this.seekerStaminaPenaltyTimer - dt);
          const excessDt = dt - penaltyRemaining;
          if (excessDt > 0) {
            this.seekerStamina = Math.min(this.seekerMaxStamina, (this.seekerStamina || 0) + excessDt * 0.35);
          }
        } else {
          this.seekerStamina = Math.min(this.seekerMaxStamina, (this.seekerStamina || 0) + dt * 0.35);
        }
        if (this.remainingMiceCount <= 0) {
          this.winner = "seeker";
          storage.recordBalaWin();
          this.setPhase(GAME_PHASES.RESULT);
        } else if (this.phaseTimer <= 0) {
          this.winner = "hider";
          storage.recordMushikaWin();
          this.setPhase(GAME_PHASES.RESULT);
        }
      }
    }
    getRoundStats() {
      return {
        mode: this.gameMode,
        winner: this.winner,
        blessingsCount: this.blessingsCount,
        remainingMice: this.remainingMiceCount,
        mushikaWins: storage.data.mushikaEscapes,
        balaWins: storage.data.balaBlessings
      };
    }
  };

  // js/world/murti.js
  function createSacredMurti() {
    const group = new THREE.Group();
    group.name = "SacredGaneshaMurti";
    const goldMat = new THREE.MeshStandardMaterial({
      color: 15579186,
      metalness: 0.75,
      roughness: 0.25,
      flatShading: true,
      name: "GoldMurti"
    });
    const terracottaMat = new THREE.MeshStandardMaterial({
      color: 13199938,
      roughness: 0.7,
      flatShading: true,
      name: "TerracottaMurti"
    });
    const dhotiMat = new THREE.MeshStandardMaterial({
      color: 14705445,
      roughness: 0.5,
      flatShading: true,
      name: "DhotiOrange"
    });
    const woodMat = new THREE.MeshStandardMaterial({
      color: 4859153,
      roughness: 0.6,
      flatShading: true,
      name: "DarkTeakWood"
    });
    const velvetMat = new THREE.MeshStandardMaterial({
      color: 8000550,
      // Royal Maroon
      roughness: 0.8,
      flatShading: true,
      name: "MaroonVelvet"
    });
    const flowerYellowMat = new THREE.MeshStandardMaterial({
      color: 16041008,
      roughness: 0.5,
      flatShading: true
    });
    const flowerWhiteMat = new THREE.MeshStandardMaterial({
      color: 16448250,
      roughness: 0.4,
      flatShading: true
    });
    const step1 = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.25, 4.4), woodMat);
    step1.position.set(0, 0.125, 0);
    step1.receiveShadow = true;
    group.add(step1);
    const step2 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.35, 3.4), velvetMat);
    step2.position.set(0, 0.425, 0);
    step2.receiveShadow = true;
    group.add(step2);
    const dais = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.8, 0.5, 24), goldMat);
    dais.position.set(0, 0.85, 0);
    dais.receiveShadow = true;
    dais.castShadow = true;
    group.add(dais);
    const archRadius = 1.6;
    const archTube = 0.09;
    const archGeom = new THREE.TorusGeometry(archRadius, archTube, 12, 32, Math.PI);
    const archMesh = new THREE.Mesh(archGeom, goldMat);
    archMesh.position.set(0, 2.3, -0.4);
    archMesh.rotation.x = 0;
    archMesh.castShadow = true;
    group.add(archMesh);
    for (let i = 0; i <= 10; i++) {
      const angle = Math.PI / 10 * i;
      const rayGeom = new THREE.ConeGeometry(0.04, 0.3, 6);
      const rayMesh = new THREE.Mesh(rayGeom, goldMat);
      rayMesh.position.set(
        Math.cos(angle) * (archRadius + 0.1),
        2.3 + Math.sin(angle) * (archRadius + 0.1),
        -0.4
      );
      rayMesh.rotation.z = angle - Math.PI / 2;
      group.add(rayMesh);
    }
    const murtiGroup = new THREE.Group();
    murtiGroup.position.set(0, 1.1, 0);
    const seatedBase = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.55, 16), dhotiMat);
    seatedBase.position.set(0, 0.25, 0);
    seatedBase.castShadow = true;
    murtiGroup.add(seatedBase);
    const leftLeg = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.18, 12, 16, Math.PI * 0.7), dhotiMat);
    leftLeg.position.set(-0.25, 0.25, 0.2);
    leftLeg.rotation.x = Math.PI / 2;
    leftLeg.rotation.z = -0.4;
    murtiGroup.add(leftLeg);
    const rightLeg = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.18, 12, 16, Math.PI * 0.7), dhotiMat);
    rightLeg.position.set(0.25, 0.25, 0.2);
    rightLeg.rotation.x = Math.PI / 2;
    rightLeg.rotation.z = 0.4;
    murtiGroup.add(rightLeg);
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.52, 18, 18), terracottaMat);
    belly.position.set(0, 0.65, 0.05);
    belly.scale.set(1.05, 0.95, 1.15);
    belly.castShadow = true;
    murtiGroup.add(belly);
    const sacredThreadGeom = new THREE.TorusGeometry(0.54, 0.025, 8, 24);
    const sacredThread = new THREE.Mesh(sacredThreadGeom, goldMat);
    sacredThread.position.set(0, 0.68, 0.05);
    sacredThread.rotation.x = 0.5;
    sacredThread.rotation.y = 0.4;
    murtiGroup.add(sacredThread);
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.55, 16), terracottaMat);
    torso.position.set(0, 0.98, 0);
    torso.castShadow = true;
    murtiGroup.add(torso);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 18, 18), terracottaMat);
    head.position.set(0, 1.42, 0.08);
    head.castShadow = true;
    murtiGroup.add(head);
    const earGeom = new THREE.CylinderGeometry(0.26, 0.26, 0.04, 16);
    const leftEar = new THREE.Mesh(earGeom, terracottaMat);
    leftEar.position.set(-0.45, 1.45, 0.06);
    leftEar.rotation.z = 0.3;
    leftEar.rotation.y = -0.2;
    murtiGroup.add(leftEar);
    const rightEar = new THREE.Mesh(earGeom, terracottaMat);
    rightEar.position.set(0.45, 1.45, 0.06);
    rightEar.rotation.z = -0.3;
    rightEar.rotation.y = 0.2;
    murtiGroup.add(rightEar);
    const curvePoints = [
      new THREE.Vector3(0, 1.38, 0.38),
      new THREE.Vector3(-0.04, 1.18, 0.48),
      new THREE.Vector3(-0.12, 0.98, 0.44),
      new THREE.Vector3(-0.24, 0.95, 0.36)
    ];
    const trunkCurve = new THREE.CatmullRomCurve3(curvePoints);
    const trunkGeom = new THREE.TubeGeometry(trunkCurve, 20, 0.09, 12, false);
    const trunk = new THREE.Mesh(trunkGeom, terracottaMat);
    trunk.castShadow = true;
    murtiGroup.add(trunk);
    const tuskGeom = new THREE.ConeGeometry(0.035, 0.16, 8);
    const tuskMat = new THREE.MeshStandardMaterial({ color: 16777210, roughness: 0.2 });
    const rightTusk = new THREE.Mesh(tuskGeom, tuskMat);
    rightTusk.position.set(0.12, 1.25, 0.32);
    rightTusk.rotation.x = Math.PI * 0.7;
    rightTusk.rotation.z = -0.15;
    murtiGroup.add(rightTusk);
    const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.18, 16), goldMat);
    crownBase.position.set(0, 1.74, 0.06);
    murtiGroup.add(crownBase);
    const crownTier2 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.22, 16), goldMat);
    crownTier2.position.set(0, 1.9, 0.06);
    murtiGroup.add(crownTier2);
    const crownSpire = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 16), goldMat);
    crownSpire.position.set(0, 2.14, 0.06);
    murtiGroup.add(crownSpire);
    const tilakGeom = new THREE.BoxGeometry(0.04, 0.12, 0.02);
    const tilakMat = new THREE.MeshStandardMaterial({ color: 9706278, roughness: 0.3 });
    const tilak = new THREE.Mesh(tilakGeom, tilakMat);
    tilak.position.set(0, 1.52, 0.44);
    murtiGroup.add(tilak);
    const bowlGeom = new THREE.CylinderGeometry(0.12, 0.06, 0.08, 12);
    const modakBowl = new THREE.Mesh(bowlGeom, goldMat);
    modakBowl.position.set(-0.48, 0.88, 0.34);
    murtiGroup.add(modakBowl);
    const miniModak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.09, 8), new THREE.MeshStandardMaterial({ color: 16041008 }));
    miniModak.position.set(-0.48, 0.94, 0.34);
    murtiGroup.add(miniModak);
    const handGeom = new THREE.BoxGeometry(0.08, 0.14, 0.04);
    const abhayaHand = new THREE.Mesh(handGeom, terracottaMat);
    abhayaHand.position.set(0.48, 1.05, 0.32);
    abhayaHand.rotation.x = -0.3;
    murtiGroup.add(abhayaHand);
    const lotusGeom = new THREE.ConeGeometry(0.07, 0.14, 8);
    const lotusMat = new THREE.MeshStandardMaterial({ color: 14900104 });
    const lotusIcon = new THREE.Mesh(lotusGeom, lotusMat);
    lotusIcon.position.set(0.55, 1.38, 0.12);
    lotusIcon.rotation.x = Math.PI;
    murtiGroup.add(lotusIcon);
    const ropeIcon = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 6, 12), goldMat);
    ropeIcon.position.set(-0.55, 1.38, 0.12);
    murtiGroup.add(ropeIcon);
    const garlandCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.42, 1.25, 0.15),
      new THREE.Vector3(-0.25, 0.85, 0.45),
      new THREE.Vector3(0, 0.72, 0.5),
      new THREE.Vector3(0.25, 0.85, 0.45),
      new THREE.Vector3(0.42, 1.25, 0.15)
    ]);
    const malaGeom = new THREE.TubeGeometry(garlandCurve, 24, 0.05, 8, false);
    const mala = new THREE.Mesh(malaGeom, flowerYellowMat);
    murtiGroup.add(mala);
    group.add(murtiGroup);
    [-1.8, 1.8].forEach((x) => {
      const diyaBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.6, 12), goldMat);
      diyaBase.position.set(x, 0.55, 1.2);
      group.add(diyaBase);
      const diyaBowl = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.12, 12), goldMat);
      diyaBowl.position.set(x, 0.88, 1.2);
      diyaBowl.rotation.x = Math.PI;
      group.add(diyaBowl);
      const diyaLight = new THREE.PointLight(16753971, 0.8, 3.5);
      diyaLight.position.set(x, 1.05, 1.2);
      group.add(diyaLight);
    });
    group.traverse((child) => {
      if (child.isMesh) {
        child.userData = {
          isSacred: true,
          isTargetable: false,
          isObstacle: true
        };
      }
    });
    group.userData = {
      isMurtiCenterpiece: true,
      bounds: {
        xMin: -2.7,
        xMax: 2.7,
        zMin: -2.3,
        zMax: 2.3,
        height: 3.5
      }
    };
    return group;
  }

  // js/world/props.js
  function createMandapProps() {
    const group = new THREE.Group();
    group.name = "VillageSquareProps";
    const woodMat = new THREE.MeshStandardMaterial({ color: 6044193, roughness: 0.75, flatShading: true });
    const darkWoodMat = new THREE.MeshStandardMaterial({ color: 3678740, roughness: 0.8, flatShading: true });
    const lightWoodMat = new THREE.MeshStandardMaterial({ color: 9200185, roughness: 0.7, flatShading: true });
    const pineMat = new THREE.MeshStandardMaterial({ color: 11897431, roughness: 0.8, flatShading: true });
    const terracottaMat = new THREE.MeshStandardMaterial({ color: 12736831, roughness: 0.85, flatShading: true });
    const tealMat = new THREE.MeshStandardMaterial({ color: 2792847, roughness: 0.6, flatShading: true });
    const royalBlueMat = new THREE.MeshStandardMaterial({ color: 2508371, roughness: 0.55, flatShading: true });
    const saffronMat = new THREE.MeshStandardMaterial({ color: 16032353, roughness: 0.6, flatShading: true });
    const yellowMat = new THREE.MeshStandardMaterial({ color: 15320170, roughness: 0.6, flatShading: true });
    const pinkMat = new THREE.MeshStandardMaterial({ color: 15167313, roughness: 0.6, flatShading: true });
    const purpleMat = new THREE.MeshStandardMaterial({ color: 7473591, roughness: 0.6, flatShading: true });
    const greenMat = new THREE.MeshStandardMaterial({ color: 2976335, roughness: 0.65, flatShading: true });
    const marigoldMat = new THREE.MeshStandardMaterial({ color: 16031773, roughness: 0.6, flatShading: true });
    const brassMat = new THREE.MeshStandardMaterial({ color: 13938487, metalness: 0.7, roughness: 0.3, flatShading: true });
    const redClothMat = new THREE.MeshStandardMaterial({ color: 14034984, roughness: 0.7, flatShading: true });
    const strawMat = new THREE.MeshStandardMaterial({ color: 14533002, roughness: 0.85, flatShading: true });
    const obstacles = [];
    const hideableProps = [];
    function addPropObstacle(mesh, halfWidth, halfHeight, halfDepth, walkableTop = 0, isHideable = true) {
      mesh.userData.isObstacle = true;
      mesh.userData.isHideable = isHideable;
      const topY = walkableTop > 0 ? walkableTop : mesh.position.y + halfHeight;
      mesh.userData.obstacleBounds = {
        center: mesh.position.clone(),
        hx: halfWidth,
        hy: halfHeight,
        hz: halfDepth,
        topY
      };
      obstacles.push(mesh);
      if (isHideable) {
        hideableProps.push(mesh);
      }
    }
    function tagProp(mesh, propType, propName, isHideable = true) {
      mesh.userData.isMajorPropRoot = true;
      mesh.userData.propType = propType;
      mesh.userData.propName = propName;
      mesh.userData.isHideable = isHideable;
      mesh.traverse((child) => {
        if (child.isMesh) {
          child.userData.isChildOfMajor = true;
          child.userData.propType = propType;
          child.userData.propName = propName;
          child.userData.isHideable = isHideable;
        }
      });
      if (isHideable && !hideableProps.includes(mesh)) {
        hideableProps.push(mesh);
      }
    }
    function createWoodenChair(cx, cy, cz, rotY = 0, name = "Festival Wooden Chair") {
      const chair = new THREE.Group();
      chair.position.set(cx, cy, cz);
      chair.rotation.y = rotY;
      chair.name = "Wooden_Chair";
      [-0.22, 0.22].forEach((lx) => {
        [-0.22, 0.22].forEach((lz) => {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.45, 6), darkWoodMat);
          leg.position.set(lx, 0.225, lz);
          chair.add(leg);
        });
      });
      [-0.22, 0.22].forEach((lx) => {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.44), woodMat);
        bar.position.set(lx, 0.12, 0);
        chair.add(bar);
      });
      const seatMesh = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.045, 0.5), lightWoodMat);
      seatMesh.position.set(0, 0.46, 0);
      chair.add(seatMesh);
      [-0.22, 0.22].forEach((px) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.52, 0.035), darkWoodMat);
        post.position.set(px, 0.72, -0.22);
        chair.add(post);
      });
      const crown = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.05, 0.04), woodMat);
      crown.position.set(0, 0.96, -0.22);
      chair.add(crown);
      [-0.11, 0, 0.11].forEach((rx) => {
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.44, 6), lightWoodMat);
        rod.position.set(rx, 0.7, -0.22);
        chair.add(rod);
      });
      group.add(chair);
      tagProp(chair, "chair", name, true);
      addPropObstacle(chair, 0.28, 0.48, 0.28, 0.48, true);
      return chair;
    }
    createWoodenChair(-5.5, 0.45, -0.5, 0.4, "Courtyard Wooden Chair");
    createWoodenChair(1.8, 0.45, 1.2, -0.6, "Pandal Guest Chair");
    createWoodenChair(-6.8, 0.45, 2.5, 1.2, "Market Tea Chair");
    const loom = new THREE.Group();
    loom.position.set(-7, 0.45, -2);
    loom.name = "Weaving_Loom";
    [-0.65, 0.65].forEach((lx) => {
      [-0.5, 0.5].forEach((lz) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.1), woodMat);
        post.position.set(lx, 0.6, lz);
        loom.add(post);
      });
      const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.1), woodMat);
      topBar.position.set(lx, 1.15, 0);
      loom.add(topBar);
    });
    const beamFront = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.08), woodMat);
    beamFront.position.set(0, 0.95, 0.48);
    loom.add(beamFront);
    const beamBack = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.08), woodMat);
    beamBack.position.set(0, 0.95, -0.48);
    loom.add(beamBack);
    const clothGeom = new THREE.BoxGeometry(1.15, 0.04, 0.85);
    const cloth = new THREE.Mesh(clothGeom, redClothMat);
    cloth.position.set(0, 0.85, 0);
    cloth.rotation.x = 0.12;
    loom.add(cloth);
    const shuttle = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.08), lightWoodMat);
    shuttle.position.set(0.1, 0.89, 0.1);
    shuttle.rotation.y = 0.4;
    loom.add(shuttle);
    group.add(loom);
    tagProp(loom, "loom", "Artisan Handloom", true);
    addPropObstacle(loom, 0.75, 0.6, 0.6, 1.05, true);
    const cart = new THREE.Group();
    cart.position.set(0, 0.45, -6);
    cart.rotation.y = 0.2;
    cart.name = "Vegetable_Handcart";
    const bed = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 1.4), darkWoodMat);
    bed.position.y = 0.55;
    cart.add(bed);
    [-0.65, 0.65].forEach((cz) => {
      const side = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 0.06), woodMat);
      side.position.set(0, 0.72, cz);
      cart.add(side);
    });
    [-1.25, 1.25].forEach((cx) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 12), darkWoodMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(cx * 0.9, 0.5, 0);
      cart.add(wheel);
    });
    [-0.5, 0.5].forEach((hz) => {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.08), woodMat);
      handle.position.set(1.6, 0.52, hz);
      handle.rotation.z = -0.12;
      cart.add(handle);
    });
    const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.5), pineMat);
    crate1.position.set(-0.5, 0.8, -0.2);
    cart.add(crate1);
    const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.5), pineMat);
    crate2.position.set(0.3, 0.8, 0.2);
    cart.add(crate2);
    group.add(cart);
    tagProp(cart, "cart", "Produce Handcart", true);
    addPropObstacle(cart, 1.3, 0.5, 0.8, 0.95, true);
    const stallBlue = new THREE.Group();
    stallBlue.position.set(6.5, 0.45, 0.5);
    stallBlue.rotation.y = -Math.PI / 2;
    stallBlue.name = "Plaza_Stall_Blue";
    const table = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.8, 1), lightWoodMat);
    table.position.set(0, 0.4, 0);
    stallBlue.add(table);
    [-1.1, 1.1].forEach((px) => {
      [-0.45, 0.45].forEach((pz) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), woodMat);
        post.position.set(px, 1.1, pz);
        stallBlue.add(post);
      });
    });
    const canopyB = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.15, 1.4), royalBlueMat);
    canopyB.position.set(0, 2.15, 0);
    canopyB.rotation.x = -0.15;
    stallBlue.add(canopyB);
    [-0.6, 0, 0.6].forEach((bx, i) => {
      const bin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.7), pineMat);
      bin.position.set(bx, 0.9, 0);
      bin.rotation.x = 0.2;
      stallBlue.add(bin);
    });
    group.add(stallBlue);
    tagProp(stallBlue, "stall", "Blue Market Stall", true);
    addPropObstacle(stallBlue, 1.3, 1.1, 0.7, 0.85, true);
    const stallStriped = new THREE.Group();
    stallStriped.position.set(5.5, 0.45, 6.5);
    stallStriped.rotation.y = -Math.PI * 0.75;
    stallStriped.name = "Plaza_Stall_Striped";
    const tableS = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 0.9), lightWoodMat);
    tableS.position.set(0, 0.4, 0);
    stallStriped.add(tableS);
    [-1, 1].forEach((px) => {
      [-0.4, 0.4].forEach((pz) => {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.1, 6), woodMat);
        post.position.set(px, 1.05, pz);
        stallStriped.add(post);
      });
    });
    const canopyS = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.15, 1.3), saffronMat);
    canopyS.position.set(0, 2.05, 0);
    canopyS.rotation.x = -0.15;
    stallStriped.add(canopyS);
    group.add(stallStriped);
    tagProp(stallStriped, "stall", "Striped Fruit Stall", true);
    addPropObstacle(stallStriped, 1.2, 1.05, 0.65, 0.85, true);
    const stallEast = new THREE.Group();
    stallEast.position.set(15.5, 0, 2.5);
    stallEast.rotation.y = Math.PI / 2;
    stallEast.name = "East_Bank_Stall";
    const tEast = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.75, 0.9), lightWoodMat);
    tEast.position.set(0, 0.375, 0);
    stallEast.add(tEast);
    const cEast = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 1.2), yellowMat);
    cEast.position.set(0, 1.95, 0);
    cEast.rotation.x = -0.15;
    stallEast.add(cEast);
    group.add(stallEast);
    tagProp(stallEast, "stall", "East Bank Stall", true);
    addPropObstacle(stallEast, 1.2, 1, 0.6, 0.75, true);
    const benchGreen = new THREE.Group();
    benchGreen.position.set(2.8, 0.45, -5.8);
    benchGreen.name = "Bench_Plaza_North";
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.5), greenMat);
    seat.position.set(0, 0.42, 0);
    benchGreen.add(seat);
    const backrest = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 0.06), greenMat);
    backrest.position.set(0, 0.72, -0.22);
    benchGreen.add(backrest);
    [-0.7, 0.7].forEach((bx) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.46), darkWoodMat);
      leg.position.set(bx, 0.21, 0);
      benchGreen.add(leg);
    });
    group.add(benchGreen);
    tagProp(benchGreen, "bench", "Green Plaza Bench", true);
    addPropObstacle(benchGreen, 0.85, 0.4, 0.3, 0.5, true);
    const benchTree = new THREE.Group();
    benchTree.position.set(3.5, 0.55, -11.2);
    benchTree.name = "Bench_Tree_Chabutra";
    const tSeat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.45), woodMat);
    tSeat.position.set(0, 0.38, 0);
    benchTree.add(tSeat);
    group.add(benchTree);
    tagProp(benchTree, "bench", "Tree Chabutra Bench", true);
    addPropObstacle(benchTree, 0.8, 0.35, 0.25, 0.95, true);
    const chowkiTeal = new THREE.Group();
    chowkiTeal.position.set(-6.2, 0.45, 1);
    chowkiTeal.name = "Chowki_Teal";
    const cTable = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.9), woodMat);
    cTable.position.y = 0.225;
    chowkiTeal.add(cTable);
    const cCloth = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 0.95), tealMat);
    cCloth.position.y = 0.46;
    chowkiTeal.add(cCloth);
    group.add(chowkiTeal);
    tagProp(chowkiTeal, "chowki", "Teal Decorated Chowki", true);
    addPropObstacle(chowkiTeal, 0.5, 0.25, 0.5, 0.95, true);
    [-0.4, 0.4].forEach((sx, idx) => {
      const stool = new THREE.Group();
      stool.position.set(-7.5 + sx, 0.45, 4.5);
      stool.name = `Chowki_Pink_${idx}`;
      const sBase = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.22, 0.45), woodMat);
      sBase.position.y = 0.11;
      stool.add(sBase);
      const sCushion = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.48), pinkMat);
      sCushion.position.y = 0.24;
      stool.add(sCushion);
      group.add(stool);
      tagProp(stool, "chowki", "Pink Bajot Stool", true);
      addPropObstacle(stool, 0.25, 0.15, 0.25, 0.72, true);
    });
    const chowkiPurple = new THREE.Group();
    chowkiPurple.position.set(-4.5, 0.45, 7.8);
    chowkiPurple.name = "Chowki_Purple";
    const pTable = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.42, 0.7), purpleMat);
    pTable.position.y = 0.21;
    chowkiPurple.add(pTable);
    group.add(chowkiPurple);
    tagProp(chowkiPurple, "chowki", "Purple Altar Chowki", true);
    addPropObstacle(chowkiPurple, 0.58, 0.22, 0.38, 0.9, true);
    const crateStack = new THREE.Group();
    crateStack.position.set(0.5, 0.45, 8);
    crateStack.name = "Crate_Stack_South";
    const cr1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.42, 0.55), pineMat);
    cr1.position.set(0, 0.21, 0);
    crateStack.add(cr1);
    const cr2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.42, 0.55), pineMat);
    cr2.position.set(0.65, 0.21, 0);
    crateStack.add(cr2);
    const cr3 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.38, 0.5), pineMat);
    cr3.position.set(0.32, 0.61, 0);
    cr3.rotation.y = 0.15;
    crateStack.add(cr3);
    group.add(crateStack);
    tagProp(crateStack, "crate", "Stacked Harvest Crates", true);
    addPropObstacle(crateStack, 0.75, 0.45, 0.4, 1.25, true);
    const blueTrunk = new THREE.Group();
    blueTrunk.position.set(-1.5, 0.45, 8);
    blueTrunk.name = "Storage_Chest_Blue";
    const trunkMesh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.48, 0.55), royalBlueMat);
    trunkMesh.position.y = 0.24;
    blueTrunk.add(trunkMesh);
    const studGeom = new THREE.BoxGeometry(0.04, 0.04, 0.04);
    [-0.41, 0.41].forEach((bx) => {
      [-0.26, 0.26].forEach((bz) => {
        const stud = new THREE.Mesh(studGeom, brassMat);
        stud.position.set(bx, 0.44, bz);
        blueTrunk.add(stud);
      });
    });
    group.add(blueTrunk);
    tagProp(blueTrunk, "crate", "Blue Storage Chest", true);
    addPropObstacle(blueTrunk, 0.45, 0.25, 0.3, 0.95, true);
    const westCrates = new THREE.Group();
    westCrates.position.set(-13.5, 0, 6.5);
    westCrates.name = "Crate_Stack_West";
    const wcr1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.7), darkWoodMat);
    wcr1.position.y = 0.25;
    westCrates.add(wcr1);
    const wcr2 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.45, 0.65), woodMat);
    wcr2.position.set(0, 0.72, 0);
    westCrates.add(wcr2);
    group.add(westCrates);
    tagProp(westCrates, "crate", "West Cargo Crates", true);
    addPropObstacle(westCrates, 0.45, 0.5, 0.4, 0.95, true);
    const potStack = new THREE.Group();
    potStack.position.set(-14.5, 0, 13.5);
    potStack.name = "Pot_Stack_Southwest";
    const potBottom = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), terracottaMat);
    potBottom.position.y = 0.42;
    potBottom.scale.set(1, 0.85, 1);
    potStack.add(potBottom);
    const potMid = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), tealMat);
    potMid.position.y = 0.98;
    potMid.scale.set(1, 0.85, 1);
    potStack.add(potMid);
    const potTop = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), saffronMat);
    potTop.position.y = 1.42;
    potTop.scale.set(1, 0.85, 1);
    potStack.add(potTop);
    group.add(potStack);
    tagProp(potStack, "matka", "Stacked Painted Matkas", true);
    addPropObstacle(potStack, 0.45, 0.75, 0.45, 1.5, true);
    const bridgePots = new THREE.Group();
    bridgePots.position.set(7, 0.45, 4.2);
    bridgePots.name = "Pot_Pair_Bridge";
    [-0.3, 0.3].forEach((px, i) => {
      const urn = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), i === 0 ? terracottaMat : saffronMat);
      urn.position.set(px, 0.28, 0);
      urn.scale.set(1, 0.9, 1);
      bridgePots.add(urn);
      const garland = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.04, 6, 12), marigoldMat);
      garland.position.set(px, 0.35, 0);
      garland.rotation.x = Math.PI / 2;
      bridgePots.add(garland);
    });
    group.add(bridgePots);
    tagProp(bridgePots, "matka", "Bridge Marigold Urns", true);
    addPropObstacle(bridgePots, 0.45, 0.28, 0.3, 0.95, true);
    const cartwheel = new THREE.Group();
    cartwheel.position.set(-2.5, 0, 9.8);
    cartwheel.name = "Cartwheel_South";
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.06, 6, 16), darkWoodMat);
    rim.position.y = 0.65;
    rim.rotation.x = 0.15;
    cartwheel.add(rim);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.15, 8), darkWoodMat);
    hub.position.y = 0.65;
    hub.rotation.x = Math.PI / 2 + 0.15;
    cartwheel.add(hub);
    for (let s = 0; s < 6; s++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.35, 4), darkWoodMat);
      spoke.position.y = 0.65;
      spoke.rotation.z = Math.PI / 6 * s;
      spoke.rotation.x = 0.15;
      cartwheel.add(spoke);
    }
    group.add(cartwheel);
    tagProp(cartwheel, "wheel", "Leaning Timber Cartwheel", true);
    addPropObstacle(cartwheel, 0.75, 0.65, 0.2, 0.8, true);
    const strawRoll = new THREE.Group();
    strawRoll.position.set(-5.5, 0.45, 5.5);
    strawRoll.name = "Mat_Roll_South";
    const matMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.4, 10), strawMat);
    matMesh.rotation.z = Math.PI / 2;
    matMesh.rotation.y = 0.4;
    matMesh.position.y = 0.16;
    strawRoll.add(matMesh);
    group.add(strawRoll);
    tagProp(strawRoll, "mat", "Rolled Straw Mat", true);
    addPropObstacle(strawRoll, 0.65, 0.16, 0.25, 0.75, true);
    const fruitBasket = new THREE.Group();
    fruitBasket.position.set(2.8, 0.45, 7.8);
    fruitBasket.name = "Fruit_Basket_Stand";
    const basketMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.32, 0.22, 12), strawMat);
    basketMesh.position.y = 0.11;
    fruitBasket.add(basketMesh);
    for (let f = 0; f < 7; f++) {
      const ang = Math.PI * 2 / 7 * f;
      const orange = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6), saffronMat);
      orange.position.set(Math.cos(ang) * 0.22, 0.22, Math.sin(ang) * 0.22);
      fruitBasket.add(orange);
    }
    const centerModak = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 6), yellowMat);
    centerModak.position.set(0, 0.28, 0);
    fruitBasket.add(centerModak);
    const altarIdol = new THREE.Group();
    altarIdol.position.set(6.8, 0.45, -2.5);
    altarIdol.name = "Festival_Ganesha_Altar";
    const chowki = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.25, 0.9), darkWoodMat);
    chowki.position.y = 0.125;
    altarIdol.add(chowki);
    const idolBase = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.1, 12), redClothMat);
    idolBase.position.y = 0.3;
    altarIdol.add(idolBase);
    const idolBody = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), yellowMat);
    idolBody.position.set(0, 0.5, 0);
    idolBody.scale.set(1.1, 0.95, 1.1);
    altarIdol.add(idolBody);
    const idolHead = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), saffronMat);
    idolHead.position.set(0, 0.7, 0.02);
    altarIdol.add(idolHead);
    const idolCrown = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 6), brassMat);
    idolCrown.position.set(0, 0.88, 0.02);
    altarIdol.add(idolCrown);
    group.add(altarIdol);
    tagProp(altarIdol, "ganesha_idol", "Altar Ganesha Idol", true);
    addPropObstacle(altarIdol, 0.48, 0.55, 0.48, 1, true);
    const samaiLamp = new THREE.Group();
    samaiLamp.position.set(-3, 0.45, -9.5);
    samaiLamp.name = "Pandal_Samai_Lamp";
    const samaiBase = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.08, 12), brassMat);
    samaiBase.position.y = 0.04;
    samaiLamp.add(samaiBase);
    const samaiPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 0.8, 8), brassMat);
    samaiPillar.position.y = 0.46;
    samaiLamp.add(samaiPillar);
    const samaiPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.18, 0.06, 10), brassMat);
    samaiPlate.position.y = 0.88;
    samaiLamp.add(samaiPlate);
    const samaiFinial = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 6), brassMat);
    samaiFinial.position.y = 1;
    samaiLamp.add(samaiFinial);
    group.add(samaiLamp);
    tagProp(samaiLamp, "samai", "Pandal Samai Lamp", true);
    addPropObstacle(samaiLamp, 0.3, 0.55, 0.3, 1.05, true);
    const dholDrum = new THREE.Group();
    dholDrum.position.set(-4.5, 0.45, 2);
    dholDrum.name = "Procession_Dhol_Drum";
    const drumMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.72, 12), saffronMat);
    drumMesh.position.y = 0.3;
    drumMesh.rotation.z = Math.PI / 2;
    dholDrum.add(drumMesh);
    [-0.25, 0.25].forEach((dx) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.5), darkWoodMat);
      leg.position.set(dx, 0.2, 0);
      dholDrum.add(leg);
    });
    group.add(dholDrum);
    tagProp(dholDrum, "dhol", "Procession Dhol Drum", true);
    addPropObstacle(dholDrum, 0.45, 0.35, 0.35, 0.75, true);
    const modakThali = new THREE.Group();
    modakThali.position.set(-1.2, 0.45, 5.5);
    modakThali.name = "Feast_Modak_Platter";
    const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.04, 16), brassMat);
    platter.position.y = 0.02;
    modakThali.add(platter);
    for (let m = 0; m < 6; m++) {
      const angle = Math.PI * 2 / 6 * m;
      const modak = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.15, 6), yellowMat);
      modak.position.set(Math.cos(angle) * 0.22, 0.09, Math.sin(angle) * 0.22);
      modakThali.add(modak);
    }
    const centerBigModak = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 6), saffronMat);
    centerBigModak.position.set(0, 0.13, 0);
    modakThali.add(centerBigModak);
    group.add(modakThali);
    tagProp(modakThali, "modak", "Feast Modak Platter", true);
    addPropObstacle(modakThali, 0.45, 0.15, 0.45, 0.6, true);
    group.userData.obstacles = obstacles;
    group.userData.hideableProps = hideableProps;
    return group;
  }

  // js/world/mandapMap.js
  var MandapMap = class {
    constructor(scene) {
      this.scene = scene;
      this.obstacles = [];
      this.murtiBounds = null;
      this.hideableProps = [];
      this.clouds = [];
      this.root = new THREE.Group();
      this.root.name = "VillageSquareMap";
      this.scene.add(this.root);
      this.buildLighting();
      this.buildVillageTerrain();
      this.buildCentralPlaza();
      this.buildNorthSanctumAndTree();
      this.buildStreamAndBridge();
      this.buildVillageWell();
      this.buildWestMarketBuildings();
      this.buildGrandRangolis();
      this.buildFestiveGarlands();
      this.buildImmersionGhat();
      this.buildFestivalPandalsAndIdols();
      this.murti = createSacredMurti();
      this.murti.position.set(-4.5, 0.85, -13.2);
      this.murti.scale.set(0.9, 0.9, 0.9);
      this.root.add(this.murti);
      this.murtiBounds = this.murti.userData.bounds;
      this.propsGroup = createMandapProps();
      this.root.add(this.propsGroup);
      if (this.propsGroup.userData.obstacles) {
        this.obstacles.push(...this.propsGroup.userData.obstacles);
      }
      if (this.propsGroup.userData.hideableProps) {
        this.hideableProps.push(...this.propsGroup.userData.hideableProps);
      }
    }
    buildLighting() {
      this.scene.background = new THREE.Color(2654408);
      this.scene.fog = new THREE.FogExp2(6203614, 7e-3);
      this.buildLowPolyVoxelClouds();
      const ambient = new THREE.AmbientLight(9487080, 0.88);
      this.root.add(ambient);
      const sun = new THREE.DirectionalLight(16770467, 1.4);
      sun.position.set(24, 30, 18);
      this.root.add(sun);
      const fill = new THREE.DirectionalLight(15251588, 0.55);
      fill.position.set(-20, 16, -14);
      this.root.add(fill);
      const fountainLight = new THREE.PointLight(16757593, 0.9, 18);
      fountainLight.position.set(0, 3.5, 0);
      this.root.add(fountainLight);
      const templeLight = new THREE.PointLight(16753971, 1.2, 12);
      templeLight.position.set(-4.5, 2.5, -12.5);
      this.root.add(templeLight);
      const treeLight = new THREE.PointLight(16765545, 1, 14);
      treeLight.position.set(3.5, 3, -12.5);
      this.root.add(treeLight);
    }
    // Register a collidable box obstacle with optional walkability
    addBoxObstacle(x, y, z, hx, hy, hz, walkableTop = 0, isStair = false, isHideable = false, name = "") {
      const obsObj = new THREE.Object3D();
      obsObj.position.set(x, y, z);
      obsObj.userData.isObstacle = true;
      obsObj.userData.isStair = isStair;
      obsObj.userData.isHideable = isHideable;
      obsObj.userData.propName = name;
      obsObj.userData.obstacleBounds = {
        center: new THREE.Vector3(x, y, z),
        hx,
        hy,
        hz,
        topY: walkableTop > 0 ? walkableTop : y + hy
      };
      this.obstacles.push(obsObj);
      if (isHideable) {
        this.hideableProps.push(obsObj);
      }
      return obsObj;
    }
    // Register a cylindrical obstacle
    addCylinderObstacle(x, y, z, radius, height, walkableTop = 0, isHideable = false, name = "") {
      return this.addBoxObstacle(x, y, z, radius, height * 0.5, radius, walkableTop, false, isHideable, name);
    }
    buildVillageTerrain() {
      const dirtMat = new THREE.MeshStandardMaterial({
        color: 13935475,
        // Warm sandy terracotta earthen tone
        roughness: 0.9,
        metalness: 0.02,
        flatShading: true
      });
      const dirtGeom = new THREE.PlaneGeometry(44, 40, 12, 12);
      const dirtFloor = new THREE.Mesh(dirtGeom, dirtMat);
      dirtFloor.rotation.x = -Math.PI / 2;
      dirtFloor.position.set(0, 0, 0);
      dirtFloor.receiveShadow = false;
      this.root.add(dirtFloor);
      const hillMat = new THREE.MeshStandardMaterial({
        color: 13013595,
        roughness: 0.95,
        flatShading: true
      });
      const hillGeom = new THREE.CylinderGeometry(28, 32, 4, 16, 1, true);
      const hills = new THREE.Mesh(hillGeom, hillMat);
      hills.position.set(0, -1.2, 0);
      this.root.add(hills);
    }
    buildCentralPlaza() {
      const stoneMat = new THREE.MeshStandardMaterial({
        color: 12234659,
        // Chiseled sandstone grey flagstones
        roughness: 0.85,
        metalness: 0.05,
        flatShading: true
      });
      const plazaGeom = new THREE.BoxGeometry(18, 0.45, 18);
      const plaza = new THREE.Mesh(plazaGeom, stoneMat);
      plaza.position.set(-1, 0.225, 0);
      this.root.add(plaza);
      const wallMat = new THREE.MeshStandardMaterial({
        color: 9207410,
        roughness: 0.8,
        flatShading: true
      });
      const pierMat = new THREE.MeshStandardMaterial({
        color: 7694173,
        roughness: 0.75,
        flatShading: true
      });
      const wallNW = new THREE.Mesh(new THREE.BoxGeometry(6.9, 0.5, 0.5), wallMat);
      wallNW.position.set(-6.55, 0.7, -9);
      this.root.add(wallNW);
      this.addBoxObstacle(-6.55, 0.7, -9, 3.45, 0.25, 0.25, 0.95);
      const wallNE = new THREE.Mesh(new THREE.BoxGeometry(6.9, 0.5, 0.5), wallMat);
      wallNE.position.set(4.55, 0.7, -9);
      this.root.add(wallNE);
      this.addBoxObstacle(4.55, 0.7, -9, 3.45, 0.25, 0.25, 0.95);
      const wallS = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.5, 0.5), wallMat);
      wallS.position.set(0.75, 0.7, 9);
      this.root.add(wallS);
      this.addBoxObstacle(0.75, 0.7, 9, 7.25, 0.25, 0.25, 0.95);
      const swStep = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.225, 1.2), stoneMat);
      swStep.position.set(-8.5, 0.112, 9);
      this.root.add(swStep);
      this.addBoxObstacle(-8.5, 0.112, 9, 1.25, 0.112, 0.6, 0.225, true);
      const wallW = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 17), wallMat);
      wallW.position.set(-10, 0.7, -0.5);
      this.root.add(wallW);
      this.addBoxObstacle(-10, 0.7, -0.5, 0.25, 0.25, 8.5, 0.95);
      const wallEN = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 13), wallMat);
      wallEN.position.set(8, 0.7, -2.5);
      this.root.add(wallEN);
      this.addBoxObstacle(8, 0.7, -2.5, 0.25, 0.25, 6.5, 0.95);
      const wallES = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 2), wallMat);
      wallES.position.set(8, 0.7, 8);
      this.root.add(wallES);
      this.addBoxObstacle(8, 0.7, 8, 0.25, 0.25, 1, 0.95);
      [
        [-10, 9],
        [-10, -9],
        [8, -9],
        [8, 9],
        [-3.1, -9],
        [1.1, -9],
        [-6.5, 9],
        [8, 4],
        [8, 7]
      ].forEach(([px, pz]) => {
        const pier = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 0.65), pierMat);
        pier.position.set(px, 0.85, pz);
        this.root.add(pier);
        this.addBoxObstacle(px, 0.85, pz, 0.35, 0.42, 0.35, 1.25);
      });
      this.buildCentralFountain(-1, 0.45, 0);
    }
    buildCentralFountain(fx, fy, fz) {
      const fountainGroup = new THREE.Group();
      fountainGroup.position.set(fx, fy, fz);
      fountainGroup.name = "Fountain_Center";
      const stoneMat = new THREE.MeshStandardMaterial({
        color: 11445142,
        roughness: 0.75,
        metalness: 0.08,
        flatShading: true
      });
      const waterMat = new THREE.MeshStandardMaterial({
        color: 3846057,
        roughness: 0.15,
        metalness: 0.4,
        transparent: true,
        opacity: 0.85,
        flatShading: true
      });
      const marigoldMat = new THREE.MeshStandardMaterial({
        color: 16031002,
        roughness: 0.6,
        flatShading: true
      });
      const baseGeom = new THREE.CylinderGeometry(2.3, 2.4, 0.45, 8);
      const baseMesh = new THREE.Mesh(baseGeom, stoneMat);
      baseMesh.position.y = 0.225;
      fountainGroup.add(baseMesh);
      for (let i = 0; i < 16; i++) {
        const ang = Math.PI * 2 / 16 * i;
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), marigoldMat);
        flower.position.set(Math.cos(ang) * 2.5, 0.08, Math.sin(ang) * 2.5);
        fountainGroup.add(flower);
      }
      const waterLower = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.05, 16), waterMat);
      waterLower.position.y = 0.38;
      fountainGroup.add(waterLower);
      const midStem = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.85, 0.7, 8), stoneMat);
      midStem.position.y = 0.75;
      fountainGroup.add(midStem);
      const midBasin = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 0.95, 0.28, 8), stoneMat);
      midBasin.position.y = 1.1;
      fountainGroup.add(midBasin);
      const waterMid = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.04, 12), waterMat);
      waterMid.position.y = 1.22;
      fountainGroup.add(waterMid);
      const topSpout = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.65, 8), stoneMat);
      topSpout.position.y = 1.55;
      fountainGroup.add(topSpout);
      this.root.add(fountainGroup);
      fountainGroup.userData.propType = "fountain";
      fountainGroup.userData.propName = "Central Fountain";
      this.addCylinderObstacle(fx, fy + 0.6, fz, 2.35, 1.3, fy + 0.45, true, "Central Fountain");
    }
    buildNorthSanctumAndTree() {
      const templeGroup = new THREE.Group();
      templeGroup.position.set(-4.5, 0, -13.5);
      templeGroup.name = "Mandir_Temple";
      const templeMat = new THREE.MeshStandardMaterial({
        color: 12411715,
        // Traditional terracotta sandstone
        roughness: 0.8,
        flatShading: true
      });
      const goldMat = new THREE.MeshStandardMaterial({
        color: 13938487,
        metalness: 0.7,
        roughness: 0.3,
        flatShading: true
      });
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.5, 4.6), templeMat);
      plinth.position.y = 0.25;
      templeGroup.add(plinth);
      const tSteps = new THREE.Mesh(new THREE.BoxGeometry(2, 0.25, 1.2), templeMat);
      tSteps.position.set(0, 0.125, 2.5);
      templeGroup.add(tSteps);
      const sanctum = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.4, 3.4), templeMat);
      sanctum.position.set(0, 1.6, -0.4);
      templeGroup.add(sanctum);
      for (let s = 0; s < 4; s++) {
        const sw = 3.2 - s * 0.65;
        const sh = 0.8;
        const spireTier = new THREE.Mesh(new THREE.BoxGeometry(sw, sh, sw), templeMat);
        spireTier.position.set(0, 2.8 + s * 0.75, -0.4);
        templeGroup.add(spireTier);
      }
      const kalash = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.35, 0.6, 8), goldMat);
      kalash.position.set(0, 5.8, -0.4);
      templeGroup.add(kalash);
      [-1.3, 1.3].forEach((px) => {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.1, 0.3), templeMat);
        pillar.position.set(px, 1.45, 1.4);
        templeGroup.add(pillar);
      });
      this.root.add(templeGroup);
      templeGroup.userData.propType = "temple";
      templeGroup.userData.propName = "North Mandir";
      this.addBoxObstacle(-4.5, 1.6, -13.5, 2.3, 2, 2.2, 0.5, false, true, "North Mandir");
      const treeGroup = new THREE.Group();
      treeGroup.position.set(3.5, 0, -13);
      treeGroup.name = "Sacred_Banyan_Tree";
      const barkMat = new THREE.MeshStandardMaterial({
        color: 4861467,
        roughness: 0.9,
        flatShading: true
      });
      const leafMat = new THREE.MeshStandardMaterial({
        color: 4288562,
        roughness: 0.65,
        flatShading: true
      });
      const chabutraMat = new THREE.MeshStandardMaterial({
        color: 9866111,
        roughness: 0.8,
        flatShading: true
      });
      const chabutra = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.4, 0.55, 8), chabutraMat);
      chabutra.position.y = 0.275;
      treeGroup.add(chabutra);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.6, 4.2, 8), barkMat);
      trunk.position.y = 2.4;
      treeGroup.add(trunk);
      const canopyOffsets = [
        { x: 0, y: 5.5, z: 0, r: 3.4 },
        { x: -1.8, y: 5, z: 1.2, r: 2.4 },
        { x: 1.9, y: 5.2, z: -1.1, r: 2.5 },
        { x: 1.2, y: 4.8, z: 1.8, r: 2.2 },
        { x: -1.4, y: 5.1, z: -1.6, r: 2.3 }
      ];
      canopyOffsets.forEach((c) => {
        const cluster = new THREE.Mesh(new THREE.DodecahedronGeometry(c.r, 1), leafMat);
        cluster.position.set(c.x, c.y, c.z);
        treeGroup.add(cluster);
      });
      const garlandMat = new THREE.MeshStandardMaterial({ color: 16031773, roughness: 0.6 });
      for (let g = 0; g < 8; g++) {
        const ang = Math.PI * 2 / 8 * g;
        const gx = Math.cos(ang) * 2.2;
        const gz = Math.sin(ang) * 2.2;
        const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 5), garlandMat);
        strand.position.set(gx, 4, gz);
        treeGroup.add(strand);
      }
      this.root.add(treeGroup);
      treeGroup.userData.propType = "tree";
      treeGroup.userData.propName = "Sacred Banyan Tree";
      this.addCylinderObstacle(3.5, 0.3, -13, 3.3, 0.6, 0.55, false, "Tree Platform");
      this.addCylinderObstacle(3.5, 2.4, -13, 1.5, 4, 0, true, "Banyan Tree Trunk");
    }
    buildStreamAndBridge() {
      const streamGroup = new THREE.Group();
      streamGroup.name = "SunkenStream";
      const rockMat = new THREE.MeshStandardMaterial({
        color: 7234137,
        // Dark rocky embankment
        roughness: 0.9,
        flatShading: true
      });
      const streamWaterMat = new THREE.MeshStandardMaterial({
        color: 4759477,
        roughness: 0.2,
        metalness: 0.35,
        transparent: true,
        opacity: 0.88,
        flatShading: true
      });
      const trench = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, 36), rockMat);
      trench.position.set(10, -0.6, 0);
      streamGroup.add(trench);
      const waterMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 35), streamWaterMat);
      waterMesh.rotation.x = -Math.PI / 2;
      waterMesh.position.set(10, -0.42, 0);
      streamGroup.add(waterMesh);
      const northRamp = new THREE.Mesh(new THREE.BoxGeometry(3, 0.4, 3.2), rockMat);
      northRamp.position.set(10, -0.2, -15.5);
      northRamp.rotation.x = 0.18;
      streamGroup.add(northRamp);
      this.addBoxObstacle(10, -0.2, -15.5, 1.5, 0.2, 1.6, 0, true);
      const southRamp = new THREE.Mesh(new THREE.BoxGeometry(3, 0.4, 3.2), rockMat);
      southRamp.position.set(10, -0.2, 15.5);
      southRamp.rotation.x = -0.18;
      streamGroup.add(southRamp);
      this.addBoxObstacle(10, -0.2, 15.5, 1.5, 0.2, 1.6, 0, true);
      this.root.add(streamGroup);
      const bridgeGroup = new THREE.Group();
      bridgeGroup.position.set(10, 0, 5.8);
      bridgeGroup.name = "StoneArchBridge";
      const bridgeMat = new THREE.MeshStandardMaterial({
        color: 11905179,
        roughness: 0.8,
        flatShading: true
      });
      const deck = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.35, 2.4), bridgeMat);
      deck.position.set(0, 0.62, 0);
      bridgeGroup.add(deck);
      const wRamp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 2.4), bridgeMat);
      wRamp.position.set(-2.4, 0.48, 0);
      bridgeGroup.add(wRamp);
      const eRamp = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 2.4), bridgeMat);
      eRamp.position.set(2.4, 0.38, 0);
      eRamp.rotation.z = -0.18;
      bridgeGroup.add(eRamp);
      [-1.15, 1.15].forEach((pz) => {
        const railing = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.7, 0.25), bridgeMat);
        railing.position.set(0, 1.1, pz);
        bridgeGroup.add(railing);
      });
      [
        [-2.4, -1.15],
        [-2.4, 1.15],
        [2.4, -1.15],
        [2.4, 1.15]
      ].forEach(([bx, bz]) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.1, 0.45), bridgeMat);
        post.position.set(bx, 0.95, bz);
        bridgeGroup.add(post);
      });
      this.root.add(bridgeGroup);
      bridgeGroup.userData.propType = "bridge";
      bridgeGroup.userData.propName = "Stone Arch Bridge";
      this.addBoxObstacle(10, 0.62, 5.8, 2.6, 0.18, 1.2, 0.72, true, true, "Bridge Deck");
      this.addBoxObstacle(10, 1.1, 4.65, 2.6, 0.35, 0.15, 1.45, false, false, "Bridge Railing North");
      this.addBoxObstacle(10, 1.1, 6.95, 2.6, 0.35, 0.15, 1.45, false, false, "Bridge Railing South");
    }
    buildVillageWell() {
      const wellGroup = new THREE.Group();
      wellGroup.position.set(16.5, 0, -7);
      wellGroup.name = "Village_Well";
      const masonryMat = new THREE.MeshStandardMaterial({
        color: 8551285,
        roughness: 0.85,
        flatShading: true
      });
      const woodMat = new THREE.MeshStandardMaterial({
        color: 5057816,
        roughness: 0.75,
        flatShading: true
      });
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 0.9, 12, 1, true), masonryMat);
      wall.position.y = 0.45;
      wellGroup.add(wall);
      [-1.2, 1.2].forEach((px) => {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.2, 0.18), woodMat);
        post.position.set(px, 1.1, 0);
        wellGroup.add(post);
      });
      const beam = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.18, 0.18), woodMat);
      beam.position.set(0, 2.2, 0);
      wellGroup.add(beam);
      const pulley = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 10), woodMat);
      pulley.position.set(0, 2.05, 0);
      pulley.rotation.z = Math.PI / 2;
      wellGroup.add(pulley);
      const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.28, 8), woodMat);
      bucket.position.set(0, 1.2, 0);
      wellGroup.add(bucket);
      this.root.add(wellGroup);
      wellGroup.userData.propType = "well";
      wellGroup.userData.propName = "Village Well";
      this.addCylinderObstacle(16.5, 0.45, -7, 1.45, 0.9, 0.9, true, "Village Well");
    }
    buildWestMarketBuildings() {
      const wallMat = new THREE.MeshStandardMaterial({ color: 14071960, roughness: 0.85, flatShading: true });
      const roofMat = new THREE.MeshStandardMaterial({ color: 10898218, roughness: 0.8, flatShading: true });
      const blueAwningMat = new THREE.MeshStandardMaterial({ color: 2390944, roughness: 0.6, flatShading: true });
      const orangeAwningMat = new THREE.MeshStandardMaterial({ color: 15625293, roughness: 0.6, flatShading: true });
      const yellowAwningMat = new THREE.MeshStandardMaterial({ color: 16170336, roughness: 0.6, flatShading: true });
      const shop1 = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3.4, 5.5), wallMat);
      shop1.position.set(-16, 1.7, 8);
      this.root.add(shop1);
      this.addBoxObstacle(-16, 1.7, 8, 2.25, 1.7, 2.75);
      const shop2 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.4, 4.8), wallMat);
      shop2.position.set(-16, 1.7, 1.5);
      this.root.add(shop2);
      this.addBoxObstacle(-16, 1.7, 1.5, 2.1, 1.7, 2.4);
      const awningBlue = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 4.4), blueAwningMat);
      awningBlue.position.set(-13.4, 2.3, 1.5);
      awningBlue.rotation.z = -0.32;
      this.root.add(awningBlue);
      const shop3 = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.8, 5.2), wallMat);
      shop3.position.set(-16, 1.9, -4.5);
      this.root.add(shop3);
      this.addBoxObstacle(-16, 1.9, -4.5, 2.2, 1.9, 2.6);
      const shop4 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 4.5), wallMat);
      shop4.position.set(-16, 1.6, -11);
      this.root.add(shop4);
      this.addBoxObstacle(-16, 1.6, -11, 2.1, 1.6, 2.25);
      const awningOrange = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 4), orangeAwningMat);
      awningOrange.position.set(-13.4, 2.2, -11);
      awningOrange.rotation.z = -0.32;
      this.root.add(awningOrange);
      const seBuilding = new THREE.Mesh(new THREE.BoxGeometry(5.2, 4.8, 6.5), wallMat);
      seBuilding.position.set(18, 2.4, 13);
      this.root.add(seBuilding);
      this.addBoxObstacle(18, 2.4, 13, 2.6, 2.4, 3.25);
    }
    buildGrandRangolis() {
      const createRangoliMat = (type) => {
        const cvs = document.createElement("canvas");
        cvs.width = 512;
        cvs.height = 512;
        const ctx = cvs.getContext("2d");
        const cx = 256, cy = 256;
        ctx.clearRect(0, 0, 512, 512);
        if (type === "star_lotus") {
          ctx.fillStyle = "#E63946";
          for (let a = 0; a < 8; a++) {
            const ang = Math.PI * 2 / 8 * a;
            ctx.beginPath();
            ctx.ellipse(cx + Math.cos(ang) * 90, cy + Math.sin(ang) * 90, 75, 38, ang, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = "#2A9D8F";
          for (let a = 0; a < 8; a++) {
            const ang = Math.PI * 2 / 8 * a + Math.PI / 8;
            ctx.beginPath();
            ctx.ellipse(cx + Math.cos(ang) * 130, cy + Math.sin(ang) * 130, 65, 30, ang, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = "#F4A261";
          ctx.beginPath();
          ctx.arc(cx, cy, 55, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#E76F51";
          ctx.beginPath();
          ctx.arc(cx, cy, 32, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = "#9B5DE5";
          for (let a = 0; a < 12; a++) {
            const ang = Math.PI * 2 / 12 * a;
            ctx.beginPath();
            ctx.ellipse(cx + Math.cos(ang) * 110, cy + Math.sin(ang) * 110, 55, 24, ang, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = "#F15BB5";
          for (let a = 0; a < 12; a++) {
            const ang = Math.PI * 2 / 12 * a + Math.PI / 12;
            ctx.beginPath();
            ctx.ellipse(cx + Math.cos(ang) * 80, cy + Math.sin(ang) * 80, 42, 18, ang, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = "#FEE440";
          ctx.beginPath();
          ctx.arc(cx, cy, 45, 0, Math.PI * 2);
          ctx.fill();
        }
        const tex = new THREE.CanvasTexture(cvs);
        return new THREE.MeshStandardMaterial({
          map: tex,
          transparent: true,
          roughness: 0.9,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1
        });
      };
      const rangoliStarMat = createRangoliMat("star_lotus");
      const rangoliMandalaMat = createRangoliMat("mandala");
      const rSW = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), rangoliStarMat);
      rSW.rotation.x = -Math.PI / 2;
      rSW.position.set(-4.5, 0.465, 4);
      this.root.add(rSW);
      const rSE = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), rangoliMandalaMat);
      rSE.rotation.x = -Math.PI / 2;
      rSE.position.set(3.5, 0.465, 4);
      this.root.add(rSE);
      const rNW = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), rangoliMandalaMat);
      rNW.rotation.x = -Math.PI / 2;
      rNW.position.set(-4.5, 0.465, -4.5);
      this.root.add(rNW);
      const rNE = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), rangoliStarMat);
      rNE.rotation.x = -Math.PI / 2;
      rNE.position.set(3.5, 0.465, -4.5);
      this.root.add(rNE);
      const rStreetW = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), rangoliStarMat);
      rStreetW.rotation.x = -Math.PI / 2;
      rStreetW.position.set(-13.5, 0.015, 9.5);
      this.root.add(rStreetW);
      const rStreetE = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), rangoliMandalaMat);
      rStreetE.rotation.x = -Math.PI / 2;
      rStreetE.position.set(16, 0.015, 8.5);
      this.root.add(rStreetE);
    }
    buildFestiveGarlands() {
      const toranMat = new THREE.MeshStandardMaterial({ color: 16031773, roughness: 0.7 });
      for (let i = 0; i < 18; i++) {
        const bead = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), toranMat);
        bead.position.set(-13.5, 2.6 - Math.sin(i / 18 * Math.PI) * 0.25, -12 + i * 1.3);
        this.root.add(bead);
      }
    }
    // Comprehensive 3D Collision Detection for Bala and Mushika
    checkCollision(pos, radius = 0.35, isSeeker = false) {
      const result = {
        collided: false,
        groundY: 0,
        // Default dirt road height
        isAgainstWall: false,
        wallNormal: new THREE.Vector3(0, 1, 0),
        wallContactMesh: null
      };
      const minX = -20.5 + radius;
      const maxX = 20.5 - radius;
      const minZ = -18.5 + radius;
      const maxZ = 18.5 - radius;
      if (pos.x <= minX) {
        pos.x = minX;
        result.collided = true;
        result.isAgainstWall = true;
        result.wallNormal.set(1, 0, 0);
      } else if (pos.x >= maxX) {
        pos.x = maxX;
        result.collided = true;
        result.isAgainstWall = true;
        result.wallNormal.set(-1, 0, 0);
      }
      if (pos.z <= minZ) {
        pos.z = minZ;
        result.collided = true;
        result.isAgainstWall = true;
        result.wallNormal.set(0, 0, 1);
      } else if (pos.z >= maxZ) {
        pos.z = maxZ;
        result.collided = true;
        result.isAgainstWall = true;
        result.wallNormal.set(0, 0, -1);
      }
      const inPlazaX = pos.x >= -10 && pos.x <= 8;
      const inPlazaZ = pos.z >= -9 && pos.z <= 9;
      if (inPlazaX && inPlazaZ) {
        result.groundY = 0.45;
      }
      const inStreamX = pos.x >= 8.5 && pos.x <= 11.5;
      const inStreamZ = pos.z >= -14 && pos.z <= 14;
      const onBridgeZ = pos.z >= 4.5 && pos.z <= 7;
      if (inStreamX && inStreamZ && !onBridgeZ) {
        result.groundY = -0.55;
      }
      if (pos.x >= 7.8 && pos.x <= 12.2 && onBridgeZ) {
        result.groundY = 0.7;
      }
      if (this.murtiBounds) {
        const mx = this.murti.position.x;
        const mz = this.murti.position.z;
        const b = this.murtiBounds;
        const mMinX = mx + b.xMin - radius;
        const mMaxX = mx + b.xMax + radius;
        const mMinZ = mz + b.zMin - radius;
        const mMaxZ = mz + b.zMax + radius;
        if (pos.x > mMinX && pos.x < mMaxX && pos.z > mMinZ && pos.z < mMaxZ) {
          const dL = Math.abs(pos.x - mMinX);
          const dR = Math.abs(mMaxX - pos.x);
          const dT = Math.abs(pos.z - mMinZ);
          const dB = Math.abs(mMaxZ - pos.z);
          const minD = Math.min(dL, dR, dT, dB);
          if (minD === dL) pos.x = mMinX;
          else if (minD === dR) pos.x = mMaxX;
          else if (minD === dT) pos.z = mMinZ;
          else pos.z = mMaxZ;
          result.collided = true;
        }
      }
      for (const obs of this.obstacles) {
        if (!obs.userData || !obs.userData.obstacleBounds) continue;
        if (obs.userData.isObstacleDisabled) continue;
        const ob = obs.userData.obstacleBounds;
        const dx = pos.x - ob.center.x;
        const dz = pos.z - ob.center.z;
        const combinedHx = ob.hx + radius;
        const combinedHz = ob.hz + radius;
        if (Math.abs(dx) < combinedHx && Math.abs(dz) < combinedHz) {
          const topY = ob.topY;
          const isStair = obs.userData && obs.userData.isStair;
          const stepThreshold = isStair ? 0.38 : 0.28;
          const canWalkOnTop = !isSeeker || topY <= 0.75;
          if (canWalkOnTop && pos.y >= topY - stepThreshold) {
            if (topY > result.groundY) {
              result.groundY = topY;
            }
          } else {
            result.collided = true;
            const overlapX = combinedHx - Math.abs(dx);
            const overlapZ = combinedHz - Math.abs(dz);
            if (overlapX < overlapZ) {
              pos.x += Math.sign(dx) * overlapX;
              result.isAgainstWall = true;
              result.wallNormal.set(Math.sign(dx), 0, 0);
            } else {
              pos.z += Math.sign(dz) * overlapZ;
              result.isAgainstWall = true;
              result.wallNormal.set(0, 0, Math.sign(dz));
            }
            result.wallContactMesh = obs;
          }
        }
      }
      return result;
    }
    getObstacles() {
      return this.obstacles;
    }
    getHideableProps() {
      return this.hideableProps;
    }
    // =========================================================================
    // REALISTIC LOW-POLY STEPPED CUMULUS CLOUDS (Matching Reference Image)
    // =========================================================================
    buildLowPolyVoxelClouds() {
      const cloudWhiteMat = new THREE.MeshStandardMaterial({
        color: 16777215,
        roughness: 0.85,
        flatShading: true
      });
      const cloudCyanMat = new THREE.MeshStandardMaterial({
        color: 8835322,
        roughness: 0.88,
        flatShading: true
      });
      const cloudShadowMat = new THREE.MeshStandardMaterial({
        color: 3372984,
        roughness: 0.92,
        flatShading: true
      });
      const cloudDefs = [
        { type: "grandCumulus", pos: [-24, 21, -22], scale: 1.8, speed: 0.55 },
        { type: "horizontalStratus", pos: [-6, 23, -26], scale: 1.6, speed: 0.42 },
        { type: "mediumCumulus", pos: [14, 19.5, -20], scale: 1.5, speed: 0.65 },
        { type: "wispyCloudlet", pos: [-22, 17.5, 10], scale: 1.3, speed: 0.85 },
        { type: "grandCumulus", pos: [5, 23.5, -14], scale: 2.1, speed: 0.48 },
        { type: "mediumCumulus", pos: [24, 18.5, 12], scale: 1.4, speed: 0.72 },
        { type: "horizontalStratus", pos: [-3, 19, 24], scale: 1.7, speed: 0.52 },
        { type: "wispyCloudlet", pos: [26, 21.5, -5], scale: 1.25, speed: 0.92 }
      ];
      cloudDefs.forEach((def) => {
        const cloudMesh = this.createSteppedVoxelCloud(def.type, def.scale, cloudWhiteMat, cloudCyanMat, cloudShadowMat);
        cloudMesh.position.set(...def.pos);
        this.root.add(cloudMesh);
        this.clouds.push({
          group: cloudMesh,
          speed: def.speed,
          minX: -48,
          maxX: 48
        });
      });
    }
    createSteppedVoxelCloud(type, scale, whiteMat, cyanMat, shadowMat) {
      const group = new THREE.Group();
      group.name = `Cloud_${type}`;
      const addVoxel = (x, y, z, w, h, d, mat) => {
        const geom = new THREE.BoxGeometry(w * scale, h * scale, d * scale);
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(x * scale, y * scale, z * scale);
        group.add(mesh);
      };
      if (type === "grandCumulus") {
        addVoxel(0, 0.15, 0, 4.4, 0.32, 2.2, shadowMat);
        addVoxel(-2, 0.16, 0.1, 1.2, 0.28, 1.6, shadowMat);
        addVoxel(2, 0.16, -0.1, 1.2, 0.28, 1.6, shadowMat);
        addVoxel(-2.6, 0.12, 0, 0.5, 0.22, 1, shadowMat);
        addVoxel(2.6, 0.12, 0, 0.5, 0.22, 1, shadowMat);
        addVoxel(0, 0.55, 0, 3.8, 0.55, 2, cyanMat);
        addVoxel(-1.4, 0.58, 0.15, 1.8, 0.52, 1.8, cyanMat);
        addVoxel(1.4, 0.58, -0.15, 1.8, 0.52, 1.8, cyanMat);
        addVoxel(-2.3, 0.48, 0, 0.8, 0.42, 1.4, cyanMat);
        addVoxel(2.3, 0.48, 0, 0.8, 0.42, 1.4, cyanMat);
        addVoxel(-0.6, 1.05, 0.1, 1.8, 0.6, 1.6, whiteMat);
        addVoxel(0.9, 0.98, -0.1, 1.7, 0.55, 1.5, whiteMat);
        addVoxel(-1.8, 0.88, 0, 1.1, 0.45, 1.2, cyanMat);
        addVoxel(1.9, 0.85, 0, 1, 0.42, 1.2, cyanMat);
        addVoxel(-0.7, 1.48, 0.1, 1.2, 0.45, 1.1, whiteMat);
        addVoxel(0.8, 1.38, -0.05, 1.1, 0.42, 1, whiteMat);
        addVoxel(-0.3, 1.65, 0.05, 0.65, 0.25, 0.75, whiteMat);
        addVoxel(0.6, 1.55, -0.05, 0.55, 0.22, 0.65, whiteMat);
        addVoxel(-2.9, 0.25, 0, 0.4, 0.22, 0.6, shadowMat);
        addVoxel(2.9, 0.25, 0, 0.4, 0.22, 0.6, shadowMat);
        addVoxel(-1.5, 1.32, 0.2, 0.35, 0.25, 0.35, whiteMat);
        addVoxel(1.5, 1.22, -0.2, 0.35, 0.25, 0.35, whiteMat);
      } else if (type === "mediumCumulus") {
        addVoxel(0, 0.14, 0, 3.2, 0.28, 1.8, shadowMat);
        addVoxel(-1.6, 0.12, 0, 0.6, 0.22, 1.2, shadowMat);
        addVoxel(1.6, 0.12, 0, 0.6, 0.22, 1.2, shadowMat);
        addVoxel(0, 0.48, 0, 2.7, 0.45, 1.6, cyanMat);
        addVoxel(-1.1, 0.52, 0.1, 1.2, 0.42, 1.4, cyanMat);
        addVoxel(1.1, 0.5, -0.1, 1.2, 0.42, 1.4, cyanMat);
        addVoxel(-0.2, 0.88, 0.05, 1.8, 0.48, 1.3, whiteMat);
        addVoxel(0.7, 0.82, -0.05, 1.2, 0.42, 1.1, whiteMat);
        addVoxel(0.1, 1.2, 0.05, 0.9, 0.35, 0.85, whiteMat);
        addVoxel(-2, 0.22, 0, 0.35, 0.2, 0.5, shadowMat);
        addVoxel(2, 0.22, 0, 0.35, 0.2, 0.5, shadowMat);
        addVoxel(-0.8, 1.05, 0.1, 0.35, 0.22, 0.35, whiteMat);
      } else if (type === "horizontalStratus") {
        addVoxel(0, 0.12, 0, 4.8, 0.25, 1.4, shadowMat);
        addVoxel(-2.3, 0.1, 0, 0.7, 0.2, 0.9, shadowMat);
        addVoxel(2.3, 0.1, 0, 0.7, 0.2, 0.9, shadowMat);
        addVoxel(0, 0.38, 0, 4, 0.35, 1.2, cyanMat);
        addVoxel(-1.5, 0.42, 0.05, 1.4, 0.32, 1, cyanMat);
        addVoxel(1.5, 0.4, -0.05, 1.4, 0.32, 1, cyanMat);
        addVoxel(-0.4, 0.7, 0, 2.2, 0.38, 0.9, whiteMat);
        addVoxel(0.9, 0.65, 0, 1.5, 0.32, 0.8, whiteMat);
        addVoxel(-0.2, 0.92, 0, 0.8, 0.22, 0.6, whiteMat);
      } else {
        addVoxel(0, 0.1, 0, 2, 0.2, 1.1, shadowMat);
        addVoxel(0, 0.32, 0, 1.6, 0.3, 0.9, cyanMat);
        addVoxel(0.1, 0.55, 0, 1, 0.28, 0.7, whiteMat);
        addVoxel(-0.2, 0.72, 0, 0.5, 0.18, 0.45, whiteMat);
        addVoxel(-1.1, 0.15, 0, 0.3, 0.18, 0.4, shadowMat);
        addVoxel(1.1, 0.15, 0, 0.3, 0.18, 0.4, shadowMat);
      }
      return group;
    }
    // =========================================================================
    // SOUTH-EAST IMMERSION GHAT (Visarjan Kund / Sacred Immersion Water Area)
    // =========================================================================
    buildImmersionGhat() {
      const stoneMat = new THREE.MeshStandardMaterial({ color: 11445142, roughness: 0.8, flatShading: true });
      const waterMat = new THREE.MeshStandardMaterial({
        color: 1731212,
        roughness: 0.15,
        metalness: 0.25,
        transparent: true,
        opacity: 0.88,
        flatShading: true
      });
      const clayMat = new THREE.MeshStandardMaterial({ color: 12736831, roughness: 0.85, flatShading: true });
      const flameMat = new THREE.MeshBasicMaterial({ color: 16765503 });
      const leafMat = new THREE.MeshStandardMaterial({ color: 2976335, roughness: 0.6, flatShading: true });
      const pinkLotusMat = new THREE.MeshStandardMaterial({ color: 16223655, roughness: 0.5, flatShading: true });
      const ghatGroup = new THREE.Group();
      ghatGroup.name = "Immersion_Visarjan_Ghat";
      ghatGroup.position.set(11, 0, 6);
      for (let i = 0; i < 4; i++) {
        const stepY = (3 - i) * 0.14;
        const stepZ = i * 0.55;
        const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.14, 0.65), stoneMat);
        stepMesh.position.set(0, stepY + 0.07, stepZ);
        ghatGroup.add(stepMesh);
        this.addBoxObstacle(11, stepY + 0.07, 6 + stepZ, 2.6, 0.07, 0.32, stepY + 0.14, true, false, "Ghat Steps");
      }
      const waterPool = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.08, 4.8), waterMat);
      waterPool.position.set(0, 0.04, 3.8);
      ghatGroup.add(waterPool);
      const diyaOffsets = [
        [-1.4, 2.8],
        [-0.5, 3.5],
        [0.8, 3.1],
        [1.6, 4.2],
        [-1, 4.5]
      ];
      diyaOffsets.forEach(([dx, dz], idx) => {
        const diyaGroup = new THREE.Group();
        diyaGroup.position.set(dx, 0.07, dz);
        diyaGroup.name = `Floating_Diya_${idx}`;
        const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.06, 0.06, 8), clayMat);
        diyaGroup.add(bowl);
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 6), flameMat);
        flame.position.set(0, 0.05, 0);
        diyaGroup.add(flame);
        ghatGroup.add(diyaGroup);
        this.addBoxObstacle(11 + dx, 0.07, 6 + dz, 0.15, 0.08, 0.15, 0.15, false, true, "Floating Diya");
      });
      const lotusOffsets = [[-1.8, 4], [0.3, 4.5], [1.5, 2.6]];
      lotusOffsets.forEach(([lx, lz]) => {
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.02, 10), leafMat);
        pad.position.set(lx, 0.05, lz);
        ghatGroup.add(pad);
        const flower = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.18, 7), pinkLotusMat);
        flower.position.set(lx, 0.12, lz);
        flower.rotation.x = Math.PI;
        ghatGroup.add(flower);
      });
      this.root.add(ghatGroup);
    }
    // =========================================================================
    // GANESH CHATURTHI FESTIVAL PANDALS & VARIED IDOLS
    // =========================================================================
    buildFestivalPandalsAndIdols() {
      const saffronMat = new THREE.MeshStandardMaterial({ color: 16031773, roughness: 0.6, flatShading: true });
      const redClothMat = new THREE.MeshStandardMaterial({ color: 14034984, roughness: 0.65, flatShading: true });
      const goldMat = new THREE.MeshStandardMaterial({ color: 13938487, metalness: 0.75, roughness: 0.28, flatShading: true });
      const woodMat = new THREE.MeshStandardMaterial({ color: 6044193, roughness: 0.75, flatShading: true });
      const brassMat = new THREE.MeshStandardMaterial({ color: 12950311, metalness: 0.8, roughness: 0.25, flatShading: true });
      const whiteModakMat = new THREE.MeshStandardMaterial({ color: 16777202, roughness: 0.7, flatShading: true });
      const yellowLaddooMat = new THREE.MeshStandardMaterial({ color: 16101415, roughness: 0.8, flatShading: true });
      const pandalGroup = new THREE.Group();
      pandalGroup.position.set(3.5, 0.45, -1);
      pandalGroup.name = "Grand_Procession_Pandal";
      const pillarPositions = [[-2, -1.8], [2, -1.8], [-2, 1.8], [2, 1.8]];
      pillarPositions.forEach(([px, pz]) => {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.6, 8), woodMat);
        pillar.position.set(px, 1.3, pz);
        pandalGroup.add(pillar);
        const garland = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.05, 6, 12), saffronMat);
        garland.rotation.x = Math.PI / 2;
        garland.position.set(px, 1.8, pz);
        pandalGroup.add(garland);
        this.addBoxObstacle(3.5 + px, 0.45 + 1.3, -1 + pz, 0.16, 1.3, 0.16, 3, false, true, "Pandal Pillar");
      });
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1, 4), saffronMat);
      canopy.rotation.y = Math.PI / 4;
      canopy.position.set(0, 3, 0);
      pandalGroup.add(canopy);
      const palanquin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.35, 2), goldMat);
      palanquin.position.set(0, 0.18, 0);
      pandalGroup.add(palanquin);
      this.addBoxObstacle(3.5, 0.45 + 0.18, -1, 1.2, 0.18, 1, 0.82, false, true, "Floral Palanquin");
      const grandMurti = new THREE.Group();
      grandMurti.position.set(0, 0.36, 0);
      grandMurti.name = "Grand_Procession_Ganesha_Idol";
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.65, 8), saffronMat);
      torso.position.y = 0.32;
      grandMurti.add(torso);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 8), saffronMat);
      head.position.set(0, 0.78, 0.05);
      grandMurti.add(head);
      [-0.38, 0.38].forEach((ex) => {
        const ear = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.32, 0.04), saffronMat);
        ear.position.set(ex, 0.82, 0.02);
        grandMurti.add(ear);
      });
      const mukut = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.48, 8), goldMat);
      mukut.position.set(0, 1.18, 0.05);
      grandMurti.add(mukut);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 0.42, 6), saffronMat);
      trunk.position.set(0, 0.62, 0.32);
      trunk.rotation.x = -0.45;
      grandMurti.add(trunk);
      const modakInTrunk = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.12, 6), whiteModakMat);
      modakInTrunk.position.set(0.06, 0.46, 0.42);
      grandMurti.add(modakInTrunk);
      grandMurti.userData.isMajorPropRoot = true;
      grandMurti.userData.propType = "ganesha_idol";
      grandMurti.userData.propName = "Ganesha Idol";
      grandMurti.userData.isHideable = true;
      grandMurti.traverse((child) => {
        if (child.isMesh) {
          child.userData.isChildOfMajor = true;
          child.userData.propType = "ganesha_idol";
          child.userData.propName = "Ganesha Idol";
          child.userData.isHideable = true;
        }
      });
      if (!this.hideableProps.includes(grandMurti)) {
        this.hideableProps.push(grandMurti);
      }
      pandalGroup.add(grandMurti);
      this.addBoxObstacle(3.5, 0.45 + 0.36 + 0.6, -1, 0.55, 0.65, 0.55, 1.9, false, true, "Ganesha Idol");
      [-1.6, 1.6].forEach((dx, didx) => {
        const dhol = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.65, 8), redClothMat);
        dhol.position.set(dx, 0.35, 1.3);
        dhol.rotation.z = Math.PI / 2;
        dhol.userData.isMajorPropRoot = true;
        dhol.userData.propType = "dhol";
        dhol.userData.propName = "Festival Dhol";
        dhol.userData.isHideable = true;
        pandalGroup.add(dhol);
        this.addBoxObstacle(3.5 + dx, 0.45 + 0.35, -1 + 1.3, 0.35, 0.25, 0.25, 0.7, false, true, `Festival Dhol ${didx + 1}`);
      });
      const modakPlate = new THREE.Group();
      modakPlate.position.set(-0.85, 0.38, 0.7);
      const thaliBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.04, 10), brassMat);
      modakPlate.add(thaliBase);
      for (let i = 0; i < 5; i++) {
        const m = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 6), whiteModakMat);
        m.position.set(i === 4 ? 0 : Math.cos(i * Math.PI / 2) * 0.14, 0.05 + (i === 4 ? 0.06 : 0), i === 4 ? 0 : Math.sin(i * Math.PI / 2) * 0.14);
        modakPlate.add(m);
      }
      modakPlate.userData.isMajorPropRoot = true;
      modakPlate.userData.propType = "modak";
      modakPlate.userData.propName = "Feast Modak Platter";
      modakPlate.userData.isHideable = true;
      modakPlate.traverse((c) => {
        if (c.isMesh) {
          c.userData.isChildOfMajor = true;
          c.userData.propType = "modak";
          c.userData.propName = "Feast Modak Platter";
          c.userData.isHideable = true;
        }
      });
      pandalGroup.add(modakPlate);
      this.addBoxObstacle(3.5 - 0.85, 0.45 + 0.38, -1 + 0.7, 0.35, 0.18, 0.35, 0.68, false, true, "Feast Modak Platter");
      const laddooPlate = new THREE.Group();
      laddooPlate.position.set(0.85, 0.38, 0.7);
      const lBase = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.04, 10), brassMat);
      laddooPlate.add(lBase);
      for (let i = 0; i < 5; i++) {
        const lad = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 6), yellowLaddooMat);
        lad.position.set(i === 4 ? 0 : Math.cos(i * Math.PI / 2) * 0.14, 0.05 + (i === 4 ? 0.06 : 0), i === 4 ? 0 : Math.sin(i * Math.PI / 2) * 0.14);
        laddooPlate.add(lad);
      }
      laddooPlate.userData.isMajorPropRoot = true;
      laddooPlate.userData.propType = "laddoo";
      laddooPlate.userData.propName = "Laddoo Plate";
      laddooPlate.userData.isHideable = true;
      laddooPlate.traverse((c) => {
        if (c.isMesh) {
          c.userData.isChildOfMajor = true;
          c.userData.propType = "laddoo";
          c.userData.propName = "Laddoo Plate";
          c.userData.isHideable = true;
        }
      });
      pandalGroup.add(laddooPlate);
      this.addBoxObstacle(3.5 + 0.85, 0.45 + 0.38, -1 + 0.7, 0.35, 0.18, 0.35, 0.68, false, true, "Laddoo Plate");
      this.root.add(pandalGroup);
    }
    update(dt) {
      if (this.clouds && this.clouds.length > 0) {
        for (const c of this.clouds) {
          c.group.position.x += c.speed * dt;
          if (c.group.position.x > c.maxX) {
            c.group.position.x = c.minX;
          }
        }
      }
    }
  };

  // js/entities/morphs.js
  var PROP_MASS_CONFIG = {
    micro: {
      mass: 0.2,
      speed: 6.8,
      accel: 32,
      hopPower: 6.2,
      wobble: 0.22,
      drift: 0.02,
      cameraDistance: 1.8,
      soundType: "micro"
    },
    medium: {
      mass: 3.5,
      speed: 5,
      accel: 16,
      hopPower: 4.4,
      wobble: 0.12,
      drift: 0.12,
      cameraDistance: 2.4,
      soundType: "medium"
    },
    heavy: {
      mass: 42,
      speed: 3.2,
      accel: 5.5,
      hopPower: 2.7,
      wobble: 0.04,
      drift: 0.48,
      cameraDistance: 3.4,
      soundType: "heavy"
    }
  };
  function getPropMassClass(propIdOrName) {
    if (!propIdOrName) return "micro";
    const s = String(propIdOrName).toLowerCase();
    if (s.includes("modak") || s.includes("diya") || s.includes("flower") || s.includes("leaf") || s.includes("laddoo") || s.includes("mouse") || s.includes("petal") || s.includes("shoe") || s.includes("sandal")) {
      return "micro";
    }
    if (s.includes("idol") || s.includes("murti") || s.includes("ganesha") || s.includes("ganpati") || s.includes("dhol") || s.includes("crate") || s.includes("pillar") || s.includes("bench") || s.includes("loom") || s.includes("cart") || s.includes("chest") || s.includes("table")) {
      return "heavy";
    }
    return "medium";
  }
  function normalizeMorphId(id) {
    if (!id) return null;
    const lower = String(id).toLowerCase().trim();
    if (lower.includes("ganesha") || lower.includes("ganpati") || lower.includes("idol") || lower.includes("murti")) return "ganesha_idol";
    if (lower.includes("samai") || lower.includes("pillar_lamp") || lower.includes("tall_lamp")) return "samai";
    if (lower.includes("garland") || lower.includes("toran")) return "garland";
    if (lower.includes("modak")) return "modak";
    if (lower.includes("diya") || lower.includes("lamp")) return "diya";
    if (lower.includes("thali") || lower.includes("plate") || lower.includes("board")) return "thali";
    if (lower.includes("kalash")) return "kalash";
    if (lower.includes("coconut")) return "coconut";
    if (lower.includes("crate") || lower.includes("box") || lower.includes("speaker") || lower.includes("stall")) return "crate";
    if (lower.includes("dhol")) return "dhol";
    if (lower.includes("flower") || lower.includes("marigold") || lower.includes("lotus") || lower.includes("pile") || lower.includes("heap")) return "flower";
    if (lower.includes("leaf")) return "leaf";
    if (lower.includes("matka") || lower.includes("pot") || lower.includes("steamer") || lower.includes("bucket") || lower.includes("urn")) return "matka";
    if (lower.includes("bell")) return "bell";
    if (lower.includes("lantern") || lower.includes("kandeel")) return "lantern";
    if (lower.includes("rangoli")) return "rangoli";
    if (lower.includes("painting") || lower.includes("frame")) return "painting";
    if (lower.includes("shoe") || lower.includes("sandal")) return "shoe";
    if (lower.includes("laddoo")) return "laddoo";
    return "modak";
  }
  function createMorphMesh(rawMorphId, paintMaterial) {
    const morphId = normalizeMorphId(rawMorphId);
    const group = new THREE.Group();
    group.name = `Morph_${morphId}`;
    const mat = paintMaterial;
    switch (morphId) {
      case "modak": {
        const geom = new THREE.CylinderGeometry(0.02, 0.28, 0.42, 16, 4);
        const pos = geom.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const y = pos.getY(i);
          const x = pos.getX(i);
          const z = pos.getZ(i);
          const angle = Math.atan2(z, x);
          const pleat = Math.cos(angle * 7) * 0.035;
          if (y < 0.15) {
            pos.setX(i, x + Math.cos(angle) * pleat);
            pos.setZ(i, z + Math.sin(angle) * pleat);
          }
        }
        geom.computeVertexNormals();
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.y = 0.21;
        group.add(mesh);
        break;
      }
      case "diya": {
        const baseGeom = new THREE.CylinderGeometry(0.24, 0.14, 0.14, 16);
        const base = new THREE.Mesh(baseGeom, mat);
        base.position.y = 0.07;
        group.add(base);
        const lipGeom = new THREE.ConeGeometry(0.12, 0.16, 4);
        const lip = new THREE.Mesh(lipGeom, mat);
        lip.position.set(0, 0.12, 0.22);
        lip.rotation.x = Math.PI / 2;
        group.add(lip);
        const flameGeom = new THREE.ConeGeometry(0.04, 0.12, 8);
        const flameMat = new THREE.MeshBasicMaterial({ color: 16757504 });
        const flame = new THREE.Mesh(flameGeom, flameMat);
        flame.position.set(0, 0.2, 0.24);
        group.add(flame);
        break;
      }
      case "thali": {
        const plateGeom = new THREE.CylinderGeometry(0.38, 0.36, 0.04, 24);
        const plate = new THREE.Mesh(plateGeom, mat);
        plate.position.y = 0.03;
        group.add(plate);
        const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.05, 10), mat);
        b1.position.set(-0.16, 0.05, 0.06);
        group.add(b1);
        const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.05, 10), mat);
        b2.position.set(0.16, 0.05, 0.06);
        group.add(b2);
        const m = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.14, 8), mat);
        m.position.set(0, 0.09, -0.05);
        group.add(m);
        break;
      }
      case "kalash": {
        const pot = new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 12), mat);
        pot.position.y = 0.22;
        group.add(pot);
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.1, 14), mat);
        neck.position.y = 0.4;
        group.add(neck);
        const coco = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), mat);
        coco.position.y = 0.58;
        group.add(coco);
        for (let i = 0; i < 5; i++) {
          const angle = Math.PI * 2 / 5 * i;
          const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 5), mat);
          leaf.position.set(Math.cos(angle) * 0.14, 0.48, Math.sin(angle) * 0.14);
          leaf.rotation.z = Math.cos(angle) * 0.6;
          leaf.rotation.x = -Math.sin(angle) * 0.6;
          group.add(leaf);
        }
        break;
      }
      case "coconut": {
        const coco = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 14), mat);
        coco.position.y = 0.24;
        coco.scale.set(1, 1.15, 1);
        group.add(coco);
        const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 8), mat);
        tuft.position.set(0, 0.5, 0);
        group.add(tuft);
        break;
      }
      case "flower": {
        const center = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.08, 12), mat);
        center.position.y = 0.06;
        group.add(center);
        for (let i = 0; i < 8; i++) {
          const angle = Math.PI * 2 / 8 * i;
          const petal = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 6), mat);
          petal.position.set(Math.cos(angle) * 0.16, 0.09, Math.sin(angle) * 0.16);
          petal.rotation.z = Math.cos(angle) * 0.5;
          petal.rotation.x = -Math.sin(angle) * 0.5;
          petal.scale.set(1, 1, 0.35);
          group.add(petal);
        }
        break;
      }
      case "leaf": {
        const leaf = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.38, 0.03, 16), mat);
        leaf.position.y = 0.02;
        leaf.scale.set(0.7, 1, 1.4);
        group.add(leaf);
        break;
      }
      case "crate": {
        const crate = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.55), mat);
        crate.position.y = 0.225;
        group.add(crate);
        const trimTop = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.05, 0.58), mat);
        trimTop.position.y = 0.43;
        group.add(trimTop);
        break;
      }
      case "dhol": {
        const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.54, 16), mat);
        drum.position.y = 0.22;
        drum.rotation.z = Math.PI / 2;
        drum.scale.set(1.2, 1, 1.2);
        group.add(drum);
        break;
      }
      case "matka": {
        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), mat);
        belly.position.y = 0.26;
        group.add(belly);
        const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.12, 16), mat);
        neck.position.y = 0.48;
        group.add(neck);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 16), mat);
        rim.position.y = 0.54;
        rim.rotation.x = Math.PI / 2;
        group.add(rim);
        break;
      }
      case "bell": {
        const bellCup = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.28, 16, 1, true), mat);
        bellCup.position.y = 0.15;
        bellCup.rotation.x = Math.PI;
        group.add(bellCup);
        const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.32, 8), mat);
        handle.position.y = 0.42;
        group.add(handle);
        const finial = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), mat);
        finial.position.y = 0.6;
        group.add(finial);
        break;
      }
      case "lantern": {
        const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), mat);
        body.position.y = 0.38;
        group.add(body);
        for (let i = 0; i < 4; i++) {
          const angle = Math.PI / 2 * i;
          const tassel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.22, 6), mat);
          tassel.position.set(Math.cos(angle) * 0.12, 0.14, Math.sin(angle) * 0.12);
          group.add(tassel);
        }
        break;
      }
      case "rangoli": {
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.02, 24), mat);
        disc.position.y = 0.015;
        group.add(disc);
        break;
      }
      case "painting": {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.06), mat);
        frame.position.y = 0.32;
        group.add(frame);
        break;
      }
      case "shoe": {
        const sole = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.4), mat);
        sole.position.y = 0.02;
        group.add(sole);
        const strap = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.02, 6, 12, Math.PI), mat);
        strap.position.set(0, 0.06, 0.04);
        strap.rotation.x = Math.PI / 2;
        group.add(strap);
        break;
      }
      case "laddoo": {
        const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.28, 0.03, 16), mat);
        dish.position.y = 0.02;
        group.add(dish);
        for (let i = 0; i < 5; i++) {
          const angle = Math.PI * 2 / 5 * i;
          const lad = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), mat);
          lad.position.set(Math.cos(angle) * 0.16, 0.11, Math.sin(angle) * 0.16);
          group.add(lad);
        }
        const topLad = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), mat);
        topLad.position.set(0, 0.24, 0);
        group.add(topLad);
        break;
      }
      case "ganesha_idol": {
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.12, 16), mat);
        base.position.y = 0.06;
        group.add(base);
        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), mat);
        belly.position.set(0, 0.28, 0.02);
        belly.scale.set(1.05, 0.95, 1.1);
        group.add(belly);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat);
        head.position.set(0, 0.52, 0.04);
        group.add(head);
        const crown = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.28, 8), mat);
        crown.position.set(0, 0.74, 0.04);
        group.add(crown);
        [-1, 1].forEach((side) => {
          const ear = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.03), mat);
          ear.position.set(side * 0.24, 0.54, 0.02);
          ear.rotation.y = side * 0.25;
          ear.rotation.z = side * -0.15;
          group.add(ear);
        });
        const trunkGeom = new THREE.CylinderGeometry(0.045, 0.08, 0.26, 8);
        const trunk = new THREE.Mesh(trunkGeom, mat);
        trunk.position.set(-0.06, 0.42, 0.22);
        trunk.rotation.x = Math.PI * 0.35;
        trunk.rotation.z = -0.3;
        group.add(trunk);
        const modakTip = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 6), mat);
        modakTip.position.set(-0.14, 0.36, 0.24);
        group.add(modakTip);
        break;
      }
      case "samai": {
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.08, 16), mat);
        base.position.y = 0.04;
        group.add(base);
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 0.7, 10), mat);
        pillar.position.y = 0.42;
        group.add(pillar);
        const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.18, 0.06, 12), mat);
        dish.position.y = 0.78;
        group.add(dish);
        const finial = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.18, 8), mat);
        finial.position.y = 0.9;
        group.add(finial);
        const flameMat = new THREE.MeshBasicMaterial({ color: 16753920 });
        for (let i = 0; i < 4; i++) {
          const angle = Math.PI / 2 * i;
          const wick = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.06, 4), flameMat);
          wick.position.set(Math.cos(angle) * 0.18, 0.83, Math.sin(angle) * 0.18);
          group.add(wick);
        }
        break;
      }
      case "garland": {
        const garlandGroup = new THREE.Group();
        const ringCount = 14;
        for (let i = 0; i < ringCount; i++) {
          const angle = Math.PI * 2 / ringCount * i;
          const r = 0.28;
          const flower = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 6), mat);
          flower.position.set(Math.cos(angle) * r, 0.06 + Math.sin(i * 2) * 0.02, Math.sin(angle) * r);
          flower.scale.set(1.1, 0.85, 1.1);
          garlandGroup.add(flower);
        }
        garlandGroup.position.y = 0.02;
        group.add(garlandGroup);
        break;
      }
      default: {
        const fallback = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 0.35, 12), mat);
        fallback.position.y = 0.18;
        group.add(fallback);
        break;
      }
    }
    return group;
  }

  // js/entities/mushika.js
  var MOUSE_SIZES = {
    petite: { label: "Petite", scale: 0.52, radius: 0.22 },
    normal: { label: "Normal", scale: 0.7, radius: 0.28 },
    plump: { label: "Plump", scale: 0.9, radius: 0.35 }
  };
  var Mushika = class {
    constructor(id = "mushika_player", isAI = false) {
      this.id = id;
      this.isAI = isAI;
      this.isTagged = false;
      this.isFrozen = false;
      this.isRigidFrozen = false;
      this.isOrientationLocked = false;
      this.lockedHeading = 0;
      this.currentSize = "normal";
      this.currentPose = "sit";
      this.currentMorph = null;
      this.morphMesh = null;
      this.activeWorldProp = null;
      this.propRadius = 0.28;
      this.propHeight = 0.45;
      this.abilityCooldown = 0;
      this.tauntCooldown = 0;
      this.unstuckCooldown = 0;
      this.massClass = "micro";
      this.momentum = new THREE.Vector3(0, 0, 0);
      this.bankAngle = 0;
      this.wobbleDecay = 0;
      this.wobblePhase = 0;
      this.lastMoveHeading = 0;
      this.antiCampTimer = 18;
      this.antiCampMax = 18;
      this.velocity = new THREE.Vector3(0, 0, 0);
      this.isGrounded = true;
      this.groundY = 0.05;
      this.waddlePhase = 0;
      this.breathPhase = Math.random() * Math.PI * 2;
      this.tailWagPhase = Math.random() * Math.PI * 2;
      this.canvas = document.createElement("canvas");
      this.canvas.width = 512;
      this.canvas.height = 512;
      this.ctx = this.canvas.getContext("2d");
      this.strokeHistory = [];
      this.texture = new THREE.CanvasTexture(this.canvas);
      this.texture.generateMipmaps = true;
      this.paintMaterial = new THREE.MeshStandardMaterial({
        map: this.texture,
        roughness: 0.88,
        metalness: 0.05,
        flatShading: true,
        name: `MushikaPaintMat_${id}`
      });
      this.resetPaint();
      this.root = new THREE.Group();
      this.root.name = `Mushika_${id}`;
      this.mouseMesh = this.buildMouseMesh();
      this.root.add(this.mouseMesh);
      this.prasadBowl = this.buildPrasadBowl();
      this.prasadBowl.visible = false;
      this.root.add(this.prasadBowl);
      this.tilakStamp = this.buildTilakStamp();
      this.tilakStamp.visible = false;
      this.root.add(this.tilakStamp);
      this.setSize(this.currentSize);
      this.setPose(this.currentPose);
    }
    resetPaint() {
      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = "rgba(235, 235, 240, 0.35)";
      for (let y = 0; y < this.canvas.height; y += 4) {
        this.ctx.fillRect(0, y, this.canvas.width, 1.5);
      }
      for (let x = 0; x < this.canvas.width; x += 4) {
        this.ctx.fillRect(x, 0, 1.5, this.canvas.height);
      }
      const underGrad = this.ctx.createLinearGradient(0, this.canvas.height, 0, this.canvas.height * 0.45);
      underGrad.addColorStop(0, "rgba(210, 205, 200, 0.45)");
      underGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      this.ctx.fillStyle = underGrad;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = "rgba(255, 182, 193, 0.25)";
      this.ctx.beginPath();
      this.ctx.arc(140, 210, 35, 0, Math.PI * 2);
      this.ctx.arc(372, 210, 35, 0, Math.PI * 2);
      this.ctx.fill();
      this.strokeHistory = [];
      this.saveHistoryState();
      this.texture.needsUpdate = true;
    }
    saveHistoryState() {
      if (this.strokeHistory.length > 10) this.strokeHistory.shift();
      this.strokeHistory.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
    }
    undoLastStroke() {
      if (this.strokeHistory.length > 1) {
        this.strokeHistory.pop();
        const prevState = this.strokeHistory[this.strokeHistory.length - 1];
        this.ctx.putImageData(prevState, 0, 0);
        this.texture.needsUpdate = true;
        return true;
      }
      return false;
    }
    paintStroke(u, v, colorHex, radius = 28, opacity = 0.85, brushType = "solid") {
      const x = Math.floor(u * this.canvas.width);
      const y = Math.floor((1 - v) * this.canvas.height);
      this.ctx.save();
      this.ctx.globalAlpha = opacity;
      if (brushType === "airbrush") {
        const grad = this.ctx.createRadialGradient(x, y, 0, x, y, radius * 1.4);
        grad.addColorStop(0, colorHex);
        grad.addColorStop(0.35, colorHex);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 1.4, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (brushType === "spray") {
        this.ctx.fillStyle = colorHex;
        const particleCount = Math.floor(radius * 1.3);
        for (let i = 0; i < particleCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.sqrt(Math.random()) * radius;
          const px = x + Math.cos(angle) * dist;
          const py = y + Math.sin(angle) * dist;
          const pSize = 1.5 + Math.random() * 2.5;
          this.ctx.fillRect(px, py, pSize, pSize);
        }
      } else {
        const grad = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, colorHex);
        grad.addColorStop(0.85, colorHex);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
      this.texture.needsUpdate = true;
    }
    floodFillColor(colorHex) {
      this.saveHistoryState();
      this.ctx.fillStyle = colorHex;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.texture.needsUpdate = true;
    }
    applyBaseCoat(colorHex) {
      this.floodFillColor(colorHex);
    }
    applyShadowLayer(colorHex) {
      this.saveHistoryState();
      this.ctx.save();
      this.ctx.globalAlpha = 0.55;
      const c = new THREE.Color(colorHex);
      c.multiplyScalar(0.65);
      const shadowHex = "#" + c.getHexString();
      const grad = this.ctx.createLinearGradient(0, this.canvas.height, 0, this.canvas.height * 0.35);
      grad.addColorStop(0, shadowHex);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
      this.texture.needsUpdate = true;
    }
    applyHighlightLayer(colorHex) {
      this.saveHistoryState();
      this.ctx.save();
      this.ctx.globalAlpha = 0.45;
      const c = new THREE.Color(colorHex);
      c.lerp(new THREE.Color(16777215), 0.5);
      const hiHex = "#" + c.getHexString();
      const grad = this.ctx.createRadialGradient(256, 120, 10, 256, 120, 240);
      grad.addColorStop(0, hiHex);
      grad.addColorStop(0.8, "rgba(255,255,255,0)");
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
      this.texture.needsUpdate = true;
    }
    // Build Among Us styled cute low-poly mouse with faceted geometries
    buildMouseMesh() {
      const group = new THREE.Group();
      group.name = "MouseBodyGroup";
      const bodyGeom = new THREE.CylinderGeometry(0.24, 0.28, 0.44, 8);
      const body = new THREE.Mesh(bodyGeom, this.paintMaterial);
      body.position.set(0, 0.26, 0);
      group.add(body);
      this.bodyPart = body;
      const bottomDome = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), this.paintMaterial);
      bottomDome.position.set(0, 0.08, 0);
      bottomDome.scale.set(1, 0.45, 1);
      group.add(bottomDome);
      const headDome = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), this.paintMaterial);
      headDome.position.set(0, 0.46, 0);
      group.add(headDome);
      this.headPart = headDome;
      const visorGeom = new THREE.BoxGeometry(0.28, 0.14, 0.12);
      const visorMat = new THREE.MeshStandardMaterial({
        color: 1712946,
        roughness: 0.15,
        metalness: 0.6,
        flatShading: true
      });
      const visor = new THREE.Mesh(visorGeom, visorMat);
      visor.position.set(0, 0.38, 0.22);
      group.add(visor);
      const visorShine = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.05, 0.02),
        new THREE.MeshBasicMaterial({ color: 61695 })
      );
      visorShine.position.set(-0.06, 0.41, 0.285);
      group.add(visorShine);
      const nose = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.06, 6),
        new THREE.MeshStandardMaterial({ color: 16230584, roughness: 0.4, flatShading: true })
      );
      nose.position.set(0, 0.29, 0.28);
      nose.rotation.x = Math.PI / 2;
      group.add(nose);
      [-1, 1].forEach((side) => {
        const earGroup = new THREE.Group();
        earGroup.position.set(side * 0.18, 0.58, 0.04);
        earGroup.rotation.z = side * 0.35;
        earGroup.rotation.y = -side * 0.15;
        const outer = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 8), this.paintMaterial);
        outer.rotation.x = Math.PI / 2;
        earGroup.add(outer);
        const inner = new THREE.Mesh(
          new THREE.CylinderGeometry(0.075, 0.075, 0.035, 6),
          new THREE.MeshStandardMaterial({ color: 16233154, roughness: 0.5, flatShading: true })
        );
        inner.position.z = 5e-3;
        inner.rotation.x = Math.PI / 2;
        earGroup.add(inner);
        group.add(earGroup);
      });
      const packGeom = new THREE.BoxGeometry(0.24, 0.28, 0.14);
      const pack = new THREE.Mesh(packGeom, this.paintMaterial);
      pack.position.set(0, 0.28, -0.22);
      group.add(pack);
      this.paws = [];
      [-0.14, 0.14].forEach((x) => {
        const foot = new THREE.Mesh(new THREE.SphereGeometry(0.075, 6, 6), this.paintMaterial);
        foot.position.set(x, 0.06, 0.08);
        foot.scale.set(0.9, 0.6, 1.3);
        group.add(foot);
        this.paws.push(foot);
      });
      this.tailBasePoints = [
        new THREE.Vector3(0, 0.1, -0.26),
        new THREE.Vector3(0, 0.16, -0.38),
        new THREE.Vector3(0, 0.22, -0.5),
        new THREE.Vector3(0.06, 0.28, -0.58),
        new THREE.Vector3(0.1, 0.34, -0.52)
      ];
      const tailCurve = new THREE.CatmullRomCurve3(this.tailBasePoints);
      const tailGeom = new THREE.TubeGeometry(tailCurve, 10, 0.035, 6, false);
      const tail = new THREE.Mesh(tailGeom, this.paintMaterial);
      group.add(tail);
      this.tailPart = tail;
      return group;
    }
    buildPrasadBowl() {
      const group = new THREE.Group();
      group.position.set(0, 0.12, 0.38);
      const bowl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.08, 0.1, 8),
        new THREE.MeshStandardMaterial({ color: 13938487, metalness: 0.8, roughness: 0.2, flatShading: true })
      );
      group.add(bowl);
      const modak = new THREE.Mesh(
        new THREE.ConeGeometry(0.06, 0.12, 6),
        new THREE.MeshStandardMaterial({ color: 16774888, roughness: 0.5, flatShading: true })
      );
      modak.position.y = 0.09;
      group.add(modak);
      return group;
    }
    buildTilakStamp() {
      const group = new THREE.Group();
      group.position.set(0, 0.54, 0.18);
      const sindoor = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 0.07, 0.01),
        new THREE.MeshBasicMaterial({ color: 9706278 })
      );
      group.add(sindoor);
      const chandan = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.015, 0.012),
        new THREE.MeshBasicMaterial({ color: 16041008 })
      );
      chandan.position.y = 0.025;
      group.add(chandan);
      return group;
    }
    setSize(sizeKey) {
      const conf = MOUSE_SIZES[sizeKey] || MOUSE_SIZES.normal;
      this.currentSize = sizeKey;
      this.root.scale.set(conf.scale, conf.scale, conf.scale);
    }
    setPose(poseKey) {
      this.currentPose = poseKey;
      this.mouseMesh.scale.set(1, 1, 1);
      this.mouseMesh.position.set(0, 0, 0);
      switch (poseKey) {
        case "sit":
          this.mouseMesh.scale.set(1, 1.05, 0.95);
          this.mouseMesh.rotation.set(0, 0, 0);
          this.mouseMesh.position.y = 0;
          break;
        case "curl":
          this.mouseMesh.scale.set(1.15, 0.82, 0.9);
          this.mouseMesh.rotation.set(0.1, 0, 0);
          this.mouseMesh.position.y = -0.04;
          break;
        case "flatten":
          this.mouseMesh.scale.set(1.4, 0.45, 1.35);
          this.mouseMesh.rotation.set(0, 0, 0);
          this.mouseMesh.position.y = -0.1;
          break;
        case "stand":
          this.mouseMesh.scale.set(0.75, 1.45, 0.75);
          this.mouseMesh.rotation.set(-0.05, 0, 0);
          this.mouseMesh.position.y = 0.08;
          break;
        case "tilt":
          this.mouseMesh.scale.set(0.95, 0.95, 0.95);
          this.mouseMesh.rotation.set(0, 0, 0.42);
          this.mouseMesh.position.y = -0.02;
          break;
        case "stretch":
          this.mouseMesh.scale.set(0.85, 0.65, 1.55);
          this.mouseMesh.rotation.set(0.05, 0, 0);
          this.mouseMesh.position.y = -0.06;
          break;
      }
      if (this.morphMesh) {
        this.morphMesh.scale.set(1, 1, 1);
        this.morphMesh.position.set(0, 0, 0);
        this.morphMesh.rotation.set(0, 0, 0);
        switch (poseKey) {
          case "sit":
            this.morphMesh.scale.set(1, 1, 1);
            break;
          case "curl":
            this.morphMesh.scale.set(1.12, 0.88, 1.12);
            this.morphMesh.position.y = -0.04;
            break;
          case "flatten":
            this.morphMesh.scale.set(1.35, 0.58, 1.35);
            this.morphMesh.position.y = -0.06;
            break;
          case "stand":
            this.morphMesh.scale.set(0.82, 1.32, 0.82);
            this.morphMesh.position.y = 0.06;
            break;
          case "tilt":
            this.morphMesh.rotation.z = 0.38;
            this.morphMesh.position.y = -0.02;
            break;
          case "stretch":
            this.morphMesh.scale.set(0.88, 0.78, 1.4);
            this.morphMesh.position.y = -0.04;
            break;
        }
      }
    }
    setMorph(targetObjectOrId) {
      if (this.activeWorldProp) {
        this.activeWorldProp.visible = true;
        if (this.activeWorldProp.userData) {
          this.activeWorldProp.userData.isObstacleDisabled = false;
        }
        this.activeWorldProp = null;
      }
      if (this.morphMesh) {
        this.root.remove(this.morphMesh);
        this.morphMesh = null;
      }
      if (!targetObjectOrId) {
        this.revertToMouse();
        return;
      }
      if (targetObjectOrId && (targetObjectOrId.isObject3D || targetObjectOrId.clone)) {
        let targetProp = targetObjectOrId;
        let p = targetProp;
        while (p && p.type !== "Scene") {
          if (p.userData && p.userData.isMajorPropRoot) {
            targetProp = p;
            break;
          }
          p = p.parent;
        }
        this.activeWorldProp = targetProp;
        targetProp.visible = false;
        if (targetProp.userData) {
          targetProp.userData.isObstacleDisabled = true;
        }
        const clone = targetProp.clone(true);
        clone.visible = true;
        clone.position.set(0, 0, 0);
        let hasPlaneMesh = targetProp.geometry && targetProp.geometry.type === "PlaneGeometry" || clone.geometry && clone.geometry.type === "PlaneGeometry";
        if (!hasPlaneMesh && clone.traverse) {
          clone.traverse((child) => {
            if (child.isMesh && child.geometry && child.geometry.type === "PlaneGeometry") {
              hasPlaneMesh = true;
            }
          });
        }
        const isRangoliOrPlane = hasPlaneMesh || targetProp.userData && (targetProp.userData.propType === "rangoli" || targetProp.userData.propName && targetProp.userData.propName.toLowerCase().includes("rangoli"));
        if (isRangoliOrPlane) {
          clone.rotation.set(-Math.PI / 2, 0, 0);
        } else {
          clone.rotation.set(0, 0, 0);
        }
        const box = new THREE.Box3().setFromObject(clone);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        clone.position.x = -center.x;
        clone.position.z = -center.z;
        clone.position.y = -box.min.y + (isRangoliOrPlane ? 0.02 : 0);
        const cloneGroup = new THREE.Group();
        cloneGroup.name = `Morph_${targetProp.userData ? targetProp.userData.propType || targetProp.userData.propName : "prop"}`;
        cloneGroup.add(clone);
        this.morphMesh = cloneGroup;
        this.root.add(this.morphMesh);
        this.mouseMesh.visible = false;
        this.propRadius = Math.max(0.2, Math.max(size.x, size.z) * 0.5);
        this.propHeight = isRangoliOrPlane ? 0.05 : Math.max(0.2, size.y);
        this.currentMorph = targetProp.userData ? targetProp.userData.propType || targetProp.userData.propName || "prop" : "prop";
        this.massClass = getPropMassClass(this.currentMorph);
        this.setPose(this.currentPose);
        return;
      }
      this.currentMorph = targetObjectOrId;
      this.massClass = getPropMassClass(targetObjectOrId);
      this.mouseMesh.visible = false;
      this.morphMesh = createMorphMesh(targetObjectOrId, this.paintMaterial);
      this.root.add(this.morphMesh);
      this.propRadius = 0.35;
      this.propHeight = 0.45;
      this.setPose(this.currentPose);
    }
    get currentMassConfig() {
      return PROP_MASS_CONFIG[this.massClass] || PROP_MASS_CONFIG.micro;
    }
    revertToMouse() {
      if (this.activeWorldProp) {
        this.activeWorldProp.visible = true;
        if (this.activeWorldProp.userData) {
          this.activeWorldProp.userData.isObstacleDisabled = false;
        }
        this.activeWorldProp = null;
      }
      if (this.morphMesh) {
        this.root.remove(this.morphMesh);
        this.morphMesh = null;
      }
      this.currentMorph = null;
      this.massClass = "micro";
      this.mouseMesh.visible = true;
      this.propRadius = 0.28;
      this.propHeight = 0.45;
      this.setPose(this.currentPose);
    }
    triggerPropAbility(particles = null) {
      if (this.abilityCooldown > 0) return false;
      this.abilityCooldown = 3;
      if (this.morphMesh) {
        const origY = this.morphMesh.position.y;
        this.morphMesh.position.y = origY + 0.25;
        this.morphMesh.rotation.y += Math.PI * 0.5;
        setTimeout(() => {
          if (this.morphMesh) {
            this.morphMesh.position.y = origY;
          }
        }, 200);
      }
      if (particles && particles.spawnFestiveBurst) {
        particles.spawnFestiveBurst(this.root.position, 10, "#D4AF37");
      }
      return true;
    }
    triggerTaunt(particles = null, audio = null, listenerPos = null, listenerYaw = 0) {
      if (this.tauntCooldown > 0) return false;
      this.tauntCooldown = 4;
      this.root.rotation.y += 0.35;
      setTimeout(() => {
        this.root.rotation.y -= 0.7;
      }, 120);
      setTimeout(() => {
        this.root.rotation.y += 0.35;
      }, 240);
      if (particles && particles.spawnTauntRing) {
        particles.spawnTauntRing(this.root.position);
      }
      if (audio) {
        const taunts = ["taunt_giggle", "taunt_morya", "anti_camp_dhol", "anti_camp_bell"];
        const chosen = taunts[Math.floor(Math.random() * taunts.length)];
        if (audio.playDirectionalSpatialSound) {
          audio.playDirectionalSpatialSound(chosen, this.root.position, listenerPos || this.root.position, listenerYaw || 0);
        } else if (audio.playTauntSound) {
          audio.playTauntSound();
        }
      }
      return true;
    }
    toggleRigidFreeze(sound2 = null, particles = null) {
      this.isRigidFrozen = !this.isRigidFrozen;
      if (this.isRigidFrozen) {
        this.velocity.set(0, 0, 0);
        this.momentum.set(0, 0, 0);
        if (particles && particles.spawnChandanPuff) {
          particles.spawnChandanPuff(this.root.position);
        }
        if (sound2 && sound2.playFreezeClack) {
          sound2.playFreezeClack();
        }
      } else {
        if (sound2 && sound2.playUnfreezeWhoosh) {
          sound2.playUnfreezeWhoosh();
        }
        if (particles && particles.spawnBlessingBurst) {
          particles.spawnBlessingBurst(this.root.position);
        }
      }
      return this.isRigidFrozen;
    }
    toggleOrientationLock() {
      this.isOrientationLocked = !this.isOrientationLocked;
      if (this.isOrientationLocked) {
        this.lockedHeading = this.root.rotation.y;
      }
      return this.isOrientationLocked;
    }
    unstuck(mapObstacles = [], particles = null, sound2 = null) {
      if (this.unstuckCooldown > 0) return false;
      this.unstuckCooldown = 2;
      this.root.position.y += 0.65;
      this.velocity.y = 2.5;
      this.isGrounded = false;
      if (mapObstacles && mapObstacles.length > 0) {
        const playerPos = this.root.position;
        for (const obs of mapObstacles) {
          if (!obs.userData || !obs.userData.obstacleBounds) continue;
          if (obs.userData.isObstacleDisabled) continue;
          const b = obs.userData.obstacleBounds;
          const distXZ = Math.hypot(playerPos.x - b.center.x, playerPos.z - b.center.z);
          const reqDist = Math.max(b.hx, b.hz) + this.propRadius + 0.15;
          if (distXZ < reqDist && Math.abs(playerPos.y - b.center.y) < b.hy + 0.5) {
            const pushDir = new THREE.Vector2(playerPos.x - b.center.x, playerPos.z - b.center.z);
            if (pushDir.lengthSq() < 1e-3) pushDir.set(1, 0);
            pushDir.normalize();
            this.root.position.x = b.center.x + pushDir.x * reqDist;
            this.root.position.z = b.center.z + pushDir.y * reqDist;
            break;
          }
        }
      }
      if (particles && particles.spawnBlessingBurst) {
        particles.spawnBlessingBurst(this.root.position);
      }
      if (sound2 && sound2.playUnstuckPop) {
        sound2.playUnstuckPop();
      }
      return true;
    }
    revealBlessed() {
      this.isTagged = true;
      this.isRigidFrozen = false;
      this.isOrientationLocked = false;
      this.revertToMouse();
      this.setPose("sit");
      this.prasadBowl.visible = true;
      this.tilakStamp.visible = true;
    }
    // Tail wag animation with smooth sway offset
    rebuildTail(wagOffset = 0) {
      if (!this.tailPart) return;
      this.tailPart.rotation.y = Math.sin(wagOffset) * 0.28;
      this.tailPart.rotation.z = Math.cos(wagOffset * 0.7) * 0.08;
    }
    update(dt, isMoving = false, headingDelta = 0) {
      if (this.abilityCooldown > 0) this.abilityCooldown = Math.max(0, this.abilityCooldown - dt);
      if (this.tauntCooldown > 0) this.tauntCooldown = Math.max(0, this.tauntCooldown - dt);
      if (this.unstuckCooldown > 0) this.unstuckCooldown = Math.max(0, this.unstuckCooldown - dt);
      if (!this.isTagged) {
        this.antiCampTimer -= dt;
        if (this.antiCampTimer <= 0) {
          this.antiCampTimer = this.antiCampMax;
          this.shouldEmitAntiCampSound = true;
        }
      }
      const massConf = PROP_MASS_CONFIG[this.massClass] || PROP_MASS_CONFIG.micro;
      if (this.isRigidFrozen || this.isFrozen || this.isTagged) {
        this.velocity.set(0, 0, 0);
        this.momentum.set(0, 0, 0);
        if (this.morphMesh) {
          this.morphMesh.rotation.z = 0;
          this.morphMesh.position.y = 0;
        }
        return;
      }
      if (this.mouseMesh.visible) {
        this.tailWagPhase += dt * (isMoving ? 10 : 3.5);
        this.rebuildTail(this.tailWagPhase);
      }
      const activeMesh = this.morphMesh || this.mouseMesh;
      if (isMoving) {
        this.waddlePhase += dt * (this.massClass === "micro" ? 18 : this.massClass === "medium" ? 12 : 8);
        const waddleRoll = Math.sin(this.waddlePhase) * massConf.wobble;
        const bounce = Math.abs(Math.sin(this.waddlePhase)) * (this.massClass === "micro" ? 0.05 : 0.025);
        const targetBank = Math.max(-0.25, Math.min(0.25, headingDelta * 1.5));
        this.bankAngle += (targetBank - this.bankAngle) * (1 - Math.exp(-dt * 12));
        if (this.mouseMesh.visible) {
          this.mouseMesh.rotation.z = waddleRoll + this.bankAngle;
          this.mouseMesh.position.y = bounce;
        }
        if (this.morphMesh) {
          this.morphMesh.rotation.z = waddleRoll * 0.75 + this.bankAngle;
          this.morphMesh.position.y = bounce;
        }
        if (this.paws && this.paws.length === 2) {
          this.paws[0].position.y = 0.06 + Math.sin(this.waddlePhase) * 0.04;
          this.paws[1].position.y = 0.06 - Math.sin(this.waddlePhase) * 0.04;
        }
        this.wobbleDecay = 1;
      } else {
        if (this.wobbleDecay > 0.01) {
          this.wobbleDecay = Math.max(0, this.wobbleDecay - dt * (this.massClass === "heavy" ? 2.5 : 4.5));
          this.wobblePhase += dt * 20;
          const stopWobble = Math.sin(this.wobblePhase) * this.wobbleDecay * (this.massClass === "heavy" ? 0.14 : 0.08);
          if (activeMesh) {
            activeMesh.rotation.z = stopWobble;
          }
        } else {
          if (activeMesh) {
            activeMesh.rotation.z = 0;
            activeMesh.position.y = 0;
          }
          this.bankAngle = 0;
        }
        this.breathPhase += dt * 3.5;
        const breath = Math.sin(this.breathPhase) * 0.025;
        if (!this.currentMorph && this.bodyPart) {
          this.bodyPart.scale.y = 1 + breath;
        }
      }
    }
  };

  // js/entities/bala.js
  var Bala = class {
    constructor(id = "bala_seeker", isAI = false) {
      this.id = id;
      this.isAI = isAI;
      this.position = new THREE.Vector3(0, 0, 0);
      this.velocity = new THREE.Vector3(0, 0, 0);
      this.isGrounded = true;
      this.rotationY = 0;
      this.walkCycle = 0;
      this.isBlessing = false;
      this.blessCooldown = 0;
      this.root = new THREE.Group();
      this.root.name = `Bala_${id}`;
      this.model = this.buildBalaMesh();
      this.root.add(this.model);
    }
    buildBalaMesh() {
      const group = new THREE.Group();
      const skinMat = new THREE.MeshStandardMaterial({
        color: 7240587,
        // Slate calf grey
        roughness: 0.85,
        metalness: 0.05,
        flatShading: true,
        name: "ElephantSkin"
      });
      const pinkMat = new THREE.MeshStandardMaterial({
        color: 15245488,
        roughness: 0.6,
        flatShading: true
      });
      const vestMat = new THREE.MeshStandardMaterial({
        color: 9051180,
        // Royal maroon vest
        roughness: 0.5,
        flatShading: true
      });
      const goldMat = new THREE.MeshStandardMaterial({
        color: 13938487,
        metalness: 0.7,
        roughness: 0.3,
        flatShading: true
      });
      const marigoldMat = new THREE.MeshStandardMaterial({
        color: 16031773,
        roughness: 0.6,
        flatShading: true
      });
      const bodyGeom = new THREE.SphereGeometry(0.68, 16, 16);
      const body = new THREE.Mesh(bodyGeom, skinMat);
      body.position.set(0, 0.78, 0);
      body.scale.set(1.1, 1.05, 1.35);
      group.add(body);
      this.bodyPart = body;
      const vestGeom = new THREE.CylinderGeometry(0.72, 0.74, 0.85, 16, 1, true);
      const vest = new THREE.Mesh(vestGeom, vestMat);
      vest.position.set(0, 0.82, -0.05);
      vest.rotation.x = Math.PI / 2;
      vest.scale.set(1.05, 1.1, 0.95);
      group.add(vest);
      const trimGeom = new THREE.TorusGeometry(0.74, 0.03, 8, 24);
      const trim = new THREE.Mesh(trimGeom, goldMat);
      trim.position.set(0, 0.82, -0.45);
      group.add(trim);
      const headGroup = new THREE.Group();
      headGroup.position.set(0, 1.15, 0.72);
      const headGeom = new THREE.SphereGeometry(0.48, 16, 16);
      const head = new THREE.Mesh(headGeom, skinMat);
      head.scale.set(1.05, 1, 1.1);
      headGroup.add(head);
      const tilakGeom = new THREE.BoxGeometry(0.06, 0.16, 0.02);
      const tilakMat = new THREE.MeshStandardMaterial({ color: 9706278 });
      const tilak = new THREE.Mesh(tilakGeom, tilakMat);
      tilak.position.set(0, 0.18, 0.5);
      headGroup.add(tilak);
      const tilakDot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), goldMat);
      tilakDot.position.set(0, 0.1, 0.52);
      headGroup.add(tilakDot);
      [-1, 1].forEach((side) => {
        const earGroup = new THREE.Group();
        earGroup.position.set(side * 0.42, 0.12, -0.05);
        earGroup.rotation.z = side * 0.15;
        earGroup.rotation.y = side * 0.35;
        const earOuter = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.03, 16), skinMat);
        earGroup.add(earOuter);
        const earInner = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.035, 14), pinkMat);
        earInner.position.z = 0.01;
        earGroup.add(earInner);
        headGroup.add(earGroup);
      });
      [-1, 1].forEach((side) => {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 10), new THREE.MeshStandardMaterial({ color: 1709074, roughness: 0.1 }));
        eye.position.set(side * 0.28, 0.08, 0.42);
        headGroup.add(eye);
        const catchlight = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), new THREE.MeshBasicMaterial({ color: 16777215 }));
        catchlight.position.set(side * 0.29, 0.1, 0.47);
        headGroup.add(catchlight);
      });
      const trunkPoints = [
        new THREE.Vector3(0, -0.05, 0.48),
        new THREE.Vector3(0, -0.3, 0.62),
        new THREE.Vector3(0, -0.22, 0.85),
        new THREE.Vector3(0, 0.02, 0.98)
        // gracefully curled upward
      ];
      const trunkCurve = new THREE.CatmullRomCurve3(trunkPoints);
      const trunkGeom = new THREE.TubeGeometry(trunkCurve, 20, 0.12, 10, false);
      const trunk = new THREE.Mesh(trunkGeom, skinMat);
      headGroup.add(trunk);
      this.trunkPart = trunk;
      const flowerGeom = new THREE.SphereGeometry(0.12, 12, 12);
      const flower = new THREE.Mesh(flowerGeom, marigoldMat);
      flower.position.set(0, 0.04, 1.05);
      headGroup.add(flower);
      this.blessingFlower = flower;
      const malaCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.48, -0.3, 0.2),
        new THREE.Vector3(-0.25, -0.62, 0.45),
        new THREE.Vector3(0, -0.72, 0.5),
        new THREE.Vector3(0.25, -0.62, 0.45),
        new THREE.Vector3(0.48, -0.3, 0.2)
      ]);
      const mala = new THREE.Mesh(new THREE.TubeGeometry(malaCurve, 20, 0.09, 8, false), marigoldMat);
      headGroup.add(mala);
      group.add(headGroup);
      this.headGroup = headGroup;
      this.legs = [];
      const legGeom = new THREE.CylinderGeometry(0.18, 0.22, 0.55, 12);
      [
        { x: -0.36, z: 0.42 },
        // Front left
        { x: 0.36, z: 0.42 },
        // Front right
        { x: -0.38, z: -0.42 },
        // Back left
        { x: 0.38, z: -0.42 }
        // Back right
      ].forEach((pos) => {
        const leg = new THREE.Mesh(legGeom, skinMat);
        leg.position.set(pos.x, 0.28, pos.z);
        group.add(leg);
        this.legs.push(leg);
      });
      const tailGeom = new THREE.CylinderGeometry(0.03, 0.04, 0.4, 8);
      const tail = new THREE.Mesh(tailGeom, skinMat);
      tail.position.set(0, 0.65, -0.72);
      tail.rotation.x = -0.4;
      group.add(tail);
      this.socketL = new THREE.Group();
      this.socketL.name = "Socket_L";
      this.socketL.position.set(-0.45, 0.85, 0.45);
      this.socketL.rotation.y = 0.08;
      this.pichkariL = this.buildPichkari(goldMat);
      this.socketL.add(this.pichkariL);
      group.add(this.socketL);
      this.socketR = new THREE.Group();
      this.socketR.name = "Socket_R";
      this.socketR.position.set(0.45, 0.85, 0.45);
      this.socketR.rotation.y = -0.08;
      this.pichkariR = this.buildPichkari(goldMat);
      this.socketR.add(this.pichkariR);
      group.add(this.socketR);
      this.nozzleTipL = new THREE.Object3D();
      this.nozzleTipL.position.set(0, 0, 0.42);
      this.socketL.add(this.nozzleTipL);
      this.nozzleTipR = new THREE.Object3D();
      this.nozzleTipR.position.set(0, 0, 0.42);
      this.socketR.add(this.nozzleTipR);
      return group;
    }
    buildPichkari(goldMat) {
      const pGroup = new THREE.Group();
      const brassMat = new THREE.MeshStandardMaterial({
        color: 12950311,
        metalness: 0.8,
        roughness: 0.25,
        flatShading: true
      });
      const tealMat = new THREE.MeshStandardMaterial({
        color: 1014651,
        metalness: 0.2,
        roughness: 0.5,
        flatShading: true
      });
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.42, 10), brassMat);
      barrel.rotation.x = Math.PI / 2;
      pGroup.add(barrel);
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.22, 10), tealMat);
      sleeve.rotation.x = Math.PI / 2;
      pGroup.add(sleeve);
      [-0.1, 0.1].forEach((z) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.054, 8e-3, 6, 12), goldMat);
        ring.position.z = z;
        pGroup.add(ring);
      });
      const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.12, 10), goldMat);
      nozzle.position.z = 0.26;
      nozzle.rotation.x = Math.PI / 2;
      pGroup.add(nozzle);
      const pumpHandle = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 12), brassMat);
      pumpHandle.position.z = -0.23;
      pumpHandle.rotation.y = Math.PI / 2;
      pGroup.add(pumpHandle);
      return pGroup;
    }
    getLeftNozzleWorldPos() {
      if (this.nozzleTipL) {
        const pos = new THREE.Vector3();
        this.nozzleTipL.getWorldPosition(pos);
        if (pos.lengthSq() > 0.01) return pos;
      }
      return this.root.position.clone().add(new THREE.Vector3(-0.4, 0.85, 0.8));
    }
    getRightNozzleWorldPos() {
      if (this.nozzleTipR) {
        const pos = new THREE.Vector3();
        this.nozzleTipR.getWorldPosition(pos);
        if (pos.lengthSq() > 0.01) return pos;
      }
      return this.root.position.clone().add(new THREE.Vector3(0.4, 0.85, 0.8));
    }
    setSpraying(isSpraying) {
      this.isSprayingWater = isSpraying;
    }
    triggerBlessingAnimation() {
      this.isBlessing = true;
      this.blessAnimTime = 0;
    }
    setMissCooldown() {
      this.blessCooldown = 1.25;
    }
    update(dt, isMoving = false) {
      if (this.blessCooldown > 0) {
        this.blessCooldown = Math.max(0, this.blessCooldown - dt);
      }
      if (isMoving) {
        this.walkCycle += dt * 7.5;
        this.legs[0].rotation.x = Math.sin(this.walkCycle) * 0.35;
        this.legs[1].rotation.x = -Math.sin(this.walkCycle) * 0.35;
        this.legs[2].rotation.x = -Math.sin(this.walkCycle) * 0.35;
        this.legs[3].rotation.x = Math.sin(this.walkCycle) * 0.35;
        if (this.bodyPart) {
          this.bodyPart.position.y = 0.78 + Math.abs(Math.sin(this.walkCycle * 2)) * 0.04;
        }
      } else {
        this.legs.forEach((l) => l.rotation.x *= 0.85);
        if (this.bodyPart) this.bodyPart.position.y = 0.78;
      }
      if (this.isSprayingWater) {
        this.recoilPhase = (this.recoilPhase || 0) + dt * 25;
        const kickback = Math.sin(this.recoilPhase) * 0.035;
        if (this.pichkariL) this.pichkariL.position.z = kickback;
        if (this.pichkariR) this.pichkariR.position.z = -kickback;
      } else {
        if (this.pichkariL) this.pichkariL.position.z *= 0.85;
        if (this.pichkariR) this.pichkariR.position.z *= 0.85;
      }
      if (this.isBlessing) {
        this.blessAnimTime += dt;
        if (this.headGroup) {
          this.headGroup.rotation.x = -Math.sin(this.blessAnimTime * Math.PI / 0.4) * 0.2;
        }
        if (this.blessAnimTime > 0.4) {
          this.isBlessing = false;
          if (this.headGroup) this.headGroup.rotation.x = 0;
        }
      }
    }
  };

  // js/systems/particles.js
  var ParticleSystem = class {
    constructor(scene) {
      this.scene = scene;
      this.particles = [];
      this.suspectPetals = [];
      this.petalGeom = new THREE.ConeGeometry(0.045, 0.12, 5);
      this.petalOrangeMat = new THREE.MeshStandardMaterial({
        color: 14711343,
        roughness: 0.6,
        side: THREE.DoubleSide
      });
      this.petalYellowMat = new THREE.MeshStandardMaterial({
        color: 16031773,
        roughness: 0.5,
        side: THREE.DoubleSide
      });
      this.petalRedMat = new THREE.MeshStandardMaterial({
        color: 9706278,
        roughness: 0.6,
        side: THREE.DoubleSide
      });
      this.goldDustMat = new THREE.MeshBasicMaterial({ color: 16766720 });
    }
    // Large Joyful Marigold Petal Burst on Successful Blessing (40 particles)
    spawnBlessingBurst(position) {
      const count = 42;
      for (let i = 0; i < count; i++) {
        const mat = i % 3 === 0 ? this.petalOrangeMat : i % 3 === 1 ? this.petalYellowMat : this.goldDustMat;
        const mesh = new THREE.Mesh(this.petalGeom, mat);
        mesh.position.copy(position);
        mesh.position.y += 0.25;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 0.5;
        const speed = 1.8 + Math.random() * 2.6;
        const vx = Math.cos(theta) * Math.sin(phi) * speed;
        const vy = Math.cos(phi) * speed + 1.2;
        const vz = Math.sin(theta) * Math.sin(phi) * speed;
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        this.scene.add(mesh);
        this.particles.push({
          mesh,
          vx,
          vy,
          vz,
          rotVx: (Math.random() - 0.5) * 8,
          rotVy: (Math.random() - 0.5) * 8,
          life: 1.8 + Math.random() * 0.8,
          maxLife: 2.2,
          gravity: -4.5
        });
      }
    }
    // Gentle Puff of Petals on Missed Tag (6 petals)
    spawnMissPuff(position) {
      const count = 6;
      for (let i = 0; i < count; i++) {
        const mesh = new THREE.Mesh(this.petalGeom, this.petalYellowMat);
        mesh.position.copy(position);
        const angle = Math.PI * 2 / count * i;
        const vx = Math.cos(angle) * 0.8;
        const vy = 0.6 + Math.random() * 0.4;
        const vz = Math.sin(angle) * 0.8;
        this.scene.add(mesh);
        this.particles.push({
          mesh,
          vx,
          vy,
          vz,
          rotVx: (Math.random() - 0.5) * 4,
          rotVy: (Math.random() - 0.5) * 4,
          life: 0.8,
          maxLife: 0.8,
          gravity: -2.5
        });
      }
    }
    // Seeker Tool: Drop Suspect Petal Marker (max 3, floating marigold flower)
    dropSuspectPetal(position) {
      if (this.suspectPetals.length >= 3) {
        const old = this.suspectPetals.shift();
        this.scene.remove(old.mesh);
      }
      const flowerGroup = new THREE.Group();
      flowerGroup.position.copy(position);
      flowerGroup.position.y += 0.25;
      const blossom = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), this.petalYellowMat);
      blossom.scale.set(1, 0.55, 1);
      flowerGroup.add(blossom);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.22, 16), new THREE.MeshBasicMaterial({
        color: 16031773,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.15;
      flowerGroup.add(ring);
      this.scene.add(flowerGroup);
      this.suspectPetals.push({
        mesh: flowerGroup,
        initialY: flowerGroup.position.y,
        life: 25,
        // 25s persistence
        maxLife: 25
      });
    }
    update(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          this.scene.remove(p.mesh);
          this.particles.splice(i, 1);
          continue;
        }
        p.vy += p.gravity * dt;
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;
        p.mesh.rotation.x += p.rotVx * dt;
        p.mesh.rotation.y += p.rotVy * dt;
        if (p.mesh.position.y < 0.05) {
          p.mesh.position.y = 0.05;
          p.vx *= 0.4;
          p.vz *= 0.4;
          p.vy = 0;
        }
        const ratio = p.life / p.maxLife;
        p.mesh.scale.set(ratio, ratio, ratio);
      }
      for (let i = this.suspectPetals.length - 1; i >= 0; i--) {
        const sp = this.suspectPetals[i];
        sp.life -= dt;
        if (sp.life <= 0) {
          this.scene.remove(sp.mesh);
          this.suspectPetals.splice(i, 1);
          continue;
        }
        sp.mesh.position.y = sp.initialY + Math.sin(Date.now() * 3e-3 + i) * 0.06;
        sp.mesh.rotation.y += dt * 0.8;
        const alpha = Math.min(1, sp.life / 5);
        sp.mesh.traverse((child) => {
          if (child.material && child.material.transparent) {
            child.material.opacity = alpha * 0.8;
          }
        });
      }
    }
    clear() {
      this.particles.forEach((p) => this.scene.remove(p.mesh));
      this.particles = [];
      this.suspectPetals.forEach((sp) => this.scene.remove(sp.mesh));
      this.suspectPetals = [];
    }
  };

  // js/systems/paintSystem.js
  var FESTIVAL_PALETTE = [
    // Primary Festival Row (from reference image)
    "#E07A2F",
    "#F4C430",
    "#7A1F2B",
    "#0F6A62",
    "#E35B88",
    "#5C8C38",
    "#C2593F",
    "#1E255E",
    "#D4AF37",
    "#FFF6E8",
    "#2E86AB",
    "#2B2B2B",
    // Neutral & Skin & Cloth Tone Row
    "#F5DEB3",
    "#D2B48C",
    "#BC8F8F",
    "#DEB887",
    "#A0522D",
    "#8B4513",
    "#FFFFFF",
    "#C0C0C0",
    "#808080",
    "#000000",
    "#FF0055",
    "#00F0FF",
    "#76FF03",
    "#FFD600",
    "#AA00FF",
    "#00E5FF",
    "#FF6D00",
    "#304FFE"
  ];
  var PaintSystem = class _PaintSystem {
    constructor(scene, camera) {
      this.scene = scene;
      this.camera = camera;
      this.currentColor = "#E07A2F";
      this.currentLayer = "base";
      this.brushType = "solid";
      this.brushRadius = 28;
      this.opacity = 0.9;
      this.roughness = 0.88;
      this.metalness = 0.05;
      this.raycaster = new THREE.Raycaster();
      this.recentColors = [];
    }
    setColor(hex) {
      this.currentColor = hex;
      if (!this.recentColors.includes(hex)) {
        this.recentColors.unshift(hex);
        if (this.recentColors.length > 8) this.recentColors.pop();
      }
    }
    setBrushType(type) {
      this.brushType = type;
    }
    setBrushSize(radius) {
      this.brushRadius = Math.max(8, Math.min(80, radius));
    }
    setLayer(layer) {
      this.currentLayer = layer;
    }
    setOpacity(val) {
      this.opacity = Math.max(0.1, Math.min(1, val));
    }
    // Helper: Convert Hex to RGB object {r, g, b} (0-255)
    static hexToRgb(hex) {
      const clean = hex.replace("#", "");
      const bigint = parseInt(clean, 16);
      return {
        r: bigint >> 16 & 255,
        g: bigint >> 8 & 255,
        b: bigint & 255
      };
    }
    // Helper: Convert RGB (0-255) to Hex string
    static rgbToHex(r, g, b) {
      const toHex = (c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0");
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    // Helper: Convert HSV (h: 0-360, s: 0-1, v: 0-1) to RGB (0-255)
    static hsvToRgb(h, s, v) {
      const c = v * s;
      const x = c * (1 - Math.abs(h / 60 % 2 - 1));
      const m = v - c;
      let r = 0, g = 0, b = 0;
      if (h >= 0 && h < 60) {
        r = c;
        g = x;
      } else if (h >= 60 && h < 120) {
        r = x;
        g = c;
      } else if (h >= 120 && h < 180) {
        g = c;
        b = x;
      } else if (h >= 180 && h < 240) {
        g = x;
        b = c;
      } else if (h >= 240 && h < 300) {
        r = x;
        b = c;
      } else if (h >= 300 && h < 360) {
        r = c;
        b = x;
      }
      return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
      };
    }
    // Eyedropper: Raycasts to world under screen coordinate and samples diffuse color
    sampleWorldColor(screenX, screenY, width, height, excludeMesh) {
      const mouse = new THREE.Vector2(
        screenX / width * 2 - 1,
        -(screenY / height) * 2 + 1
      );
      this.raycaster.setFromCamera(mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);
      for (const hit of intersects) {
        if (hit.object.userData && hit.object.userData.isSacred) continue;
        let isSelfOrChild = false;
        if (excludeMesh) {
          let curr = hit.object;
          while (curr) {
            if (curr === excludeMesh) {
              isSelfOrChild = true;
              break;
            }
            curr = curr.parent;
          }
        }
        if (isSelfOrChild) continue;
        if (hit.object.type === "Line" || hit.object.type === "PointLight") continue;
        let sampledHex = null;
        if (hit.object.material && hit.object.material.map && hit.object.material.map.image && hit.uv) {
          const img = hit.object.material.map.image;
          if (img instanceof HTMLCanvasElement) {
            const ctx = img.getContext("2d");
            const px = Math.floor(hit.uv.x * img.width);
            const py = Math.floor((1 - hit.uv.y) * img.height);
            const pData = ctx.getImageData(px, py, 1, 1).data;
            sampledHex = _PaintSystem.rgbToHex(pData[0], pData[1], pData[2]);
          }
        }
        if (!sampledHex && hit.object.material && hit.object.material.color) {
          sampledHex = "#" + hit.object.material.color.getHexString();
        }
        if (sampledHex) {
          this.setColor(sampledHex);
          sound.playUiClick();
          return sampledHex;
        }
      }
      return null;
    }
    // Direct surface color sampling at pos along given normal (ground or wall)
    sampleSurfaceColorAt(pos, normal = new THREE.Vector3(0, 1, 0), excludeMesh) {
      const rayOrigin = pos.clone().addScaledVector(normal, 0.25);
      const rayDir = normal.clone().negate();
      const ray = new THREE.Raycaster(rayOrigin, rayDir, 0.02, 2.5);
      const hits = ray.intersectObjects(this.scene.children, true);
      for (const hit of hits) {
        if (hit.object.userData && hit.object.userData.isSacred) continue;
        let isSelfOrChild = false;
        if (excludeMesh) {
          let curr = hit.object;
          while (curr) {
            if (curr === excludeMesh) {
              isSelfOrChild = true;
              break;
            }
            curr = curr.parent;
          }
        }
        if (isSelfOrChild) continue;
        if (hit.object.type === "Line" || hit.object.type === "PointLight") continue;
        let sampledHex = null;
        if (hit.object.material && hit.object.material.map && hit.object.material.map.image && hit.uv) {
          const img = hit.object.material.map.image;
          if (img instanceof HTMLCanvasElement) {
            const ctx = img.getContext("2d");
            const px = Math.floor(hit.uv.x * img.width);
            const py = Math.floor((1 - hit.uv.y) * img.height);
            const pData = ctx.getImageData(px, py, 1, 1).data;
            sampledHex = _PaintSystem.rgbToHex(pData[0], pData[1], pData[2]);
          }
        }
        if (!sampledHex && hit.object.material && hit.object.material.color) {
          sampledHex = "#" + hit.object.material.color.getHexString();
        }
        if (sampledHex) {
          this.setColor(sampledHex);
          return sampledHex;
        }
      }
      return null;
    }
    // Direct surface color sampling beneath position (ground/floor/table)
    sampleSurfaceColorBeneath(pos, excludeMesh) {
      return this.sampleSurfaceColorAt(pos, new THREE.Vector3(0, 1, 0), excludeMesh);
    }
    // 1-Touch Meccha Chameleon Auto-Blend: Instant base coat + realistic gradient ground/ambient shadow
    applyChameleonAutoBlend(mushika, sampledHex) {
      if (!mushika) return;
      const color = sampledHex || this.currentColor;
      this.setColor(color);
      mushika.applyBaseCoat(color);
      mushika.applyShadowLayer(color);
      sound.playPaintStroke();
      return color;
    }
    // Paint stroke onto Mushika supporting multiple brush types
    paintOnMushika(mushika, u = 0.5, v = 0.5) {
      if (!mushika) return;
      let finalColor = this.currentColor;
      let finalOpacity = this.opacity;
      if (this.currentLayer === "shadow") {
        finalOpacity *= 0.65;
        const c = new THREE.Color(this.currentColor);
        c.multiplyScalar(0.62);
        finalColor = "#" + c.getHexString();
      } else if (this.currentLayer === "highlight") {
        finalOpacity *= 0.6;
        const c = new THREE.Color(this.currentColor);
        c.lerp(new THREE.Color(16777215), 0.45);
        finalColor = "#" + c.getHexString();
      }
      mushika.saveHistoryState();
      if (this.brushType === "fill") {
        mushika.floodFillColor(finalColor);
      } else {
        mushika.paintStroke(u, v, finalColor, this.brushRadius, finalOpacity, this.brushType);
      }
      sound.playPaintStroke();
    }
    floodFillMushika(mushika) {
      if (this.currentLayer === "shadow") {
        mushika.applyShadowLayer(this.currentColor);
      } else if (this.currentLayer === "highlight") {
        mushika.applyHighlightLayer(this.currentColor);
      } else {
        mushika.applyBaseCoat(this.currentColor);
      }
      sound.playPaintStroke();
    }
    resetMushikaPaint(mushika) {
      mushika.resetPaint();
      sound.playUiClick();
    }
    undoMushikaPaint(mushika) {
      const res = mushika.undoLastStroke();
      if (res) sound.playUiClick();
      return res;
    }
  };

  // js/systems/blessSystem.js
  var BlessSystem = class {
    constructor(scene, camera, particleSystem) {
      this.scene = scene;
      this.camera = camera;
      this.particles = particleSystem;
      this.raycaster = new THREE.Raycaster();
      this.raycaster.far = 10;
      this.diyaGlow = new THREE.PointLight(16753971, 0, 7.5);
      this.diyaGlow.name = "SeekerDiyaGlow";
      this.scene.add(this.diyaGlow);
      this.isDiyaGlowActive = false;
    }
    toggleDiyaGlow() {
      this.isDiyaGlowActive = !this.isDiyaGlowActive;
      this.diyaGlow.intensity = this.isDiyaGlowActive ? 0.85 : 0;
      sound.playUiClick();
      return this.isDiyaGlowActive;
    }
    updateDiyaPosition(seekerPosition) {
      if (this.isDiyaGlowActive) {
        this.diyaGlow.position.copy(seekerPosition);
        this.diyaGlow.position.y += 1.1;
      }
    }
    /**
     * Pure Confirmation Tag: Checks proximity and physical touch on suspect props.
     * Eliminates exclusively by clear confirmation (touch / proximity check within 2.6m).
     * No health bars, no self-damage, zero weapons or projectiles.
     * @param {Object} seeker - The Seeker entity (Bala)
     * @param {Array} hiderList - List of active Mushika mice
     * @param {Object|null} screenCoords - Optional screen tap coordinates
     * @param {Array} mapObstacles - Collidable obstacles for line-of-sight verification
     */
    confirmTag(seeker, hiderList = [], screenCoords = null, mapObstacles = []) {
      if (seeker.blessCooldown > 0) {
        return { attempted: false, reason: "cooldown", timeLeft: seeker.blessCooldown };
      }
      const TAG_MAX_RANGE = 2.6;
      const seekerPos = seeker.root.position;
      let hitMouse = null;
      for (const hider of hiderList) {
        if (hider.isTagged) continue;
        const dist = seekerPos.distanceTo(hider.root.position);
        const combinedRadius = (seeker.bodyRadius || 0.65) + (hider.propRadius || 0.35) + 0.35;
        if (dist <= combinedRadius) {
          hitMouse = hider;
          break;
        }
      }
      const isChildOf = (child, ancestor) => {
        let curr = child;
        while (curr) {
          if (curr === ancestor) return true;
          curr = curr.parent;
        }
        return false;
      };
      if (screenCoords && screenCoords.x !== void 0 && screenCoords.y !== void 0) {
        const mouse = new THREE.Vector2(
          screenCoords.x / window.innerWidth * 2 - 1,
          -(screenCoords.y / window.innerHeight) * 2 + 1
        );
        this.raycaster.setFromCamera(mouse, this.camera);
      } else {
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
      }
      const intersects = this.raycaster.intersectObjects(this.scene.children, true);
      let firstHit = null;
      for (const hit of intersects) {
        if (!hit.object.isMesh || !hit.object.visible) continue;
        if (hit.object === seeker.root || isChildOf(hit.object, seeker.root)) continue;
        if (hit.object.type === "Line" || hit.object.type === "PointLight") continue;
        firstHit = hit;
        break;
      }
      if (!hitMouse && firstHit) {
        const dist = seekerPos.distanceTo(firstHit.point);
        if (dist <= TAG_MAX_RANGE) {
          for (const hider of hiderList) {
            if (hider.isTagged) continue;
            if (firstHit.object === hider.root || isChildOf(firstHit.object, hider.root)) {
              hitMouse = hider;
              break;
            }
          }
        }
      }
      if (!hitMouse) {
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        for (const hider of hiderList) {
          if (hider.isTagged) continue;
          const toH = new THREE.Vector3().subVectors(hider.root.position, seekerPos);
          toH.y = 0;
          const d = toH.length();
          if (d <= TAG_MAX_RANGE + 0.4) {
            toH.normalize();
            if (forward.dot(toH) > 0.6) {
              hitMouse = hider;
              break;
            }
          }
        }
      }
      if (hitMouse) {
        seeker.blessCooldown = 0.4;
        const tagPos = hitMouse.root.position.clone();
        tagPos.y += 0.35;
        this.particles.spawnBlessingBurst(tagPos);
        sound.playBlessingSuccess();
        hitMouse.revealBlessed();
        seeker.triggerBlessingAnimation();
        const remaining = hiderList.filter((h) => !h.isTagged).length;
        const mouseName = hitMouse.id.replace("mushika_", "").toUpperCase();
        const morphDesc = hitMouse.currentMorph ? hitMouse.currentMorph.toUpperCase() : "MOUSE";
        return {
          attempted: true,
          success: true,
          mouseId: hitMouse.id,
          remainingMice: remaining,
          message: `\u{1F389} TAG CONFIRMED! Found ${mouseName} disguised as a ${morphDesc}!`
        };
      }
      if (firstHit && seekerPos.distanceTo(firstHit.point) <= TAG_MAX_RANGE) {
        seeker.blessCooldown = 0.55;
        this.particles.spawnMissPuff(firstHit.point);
        sound.playMissChime();
        const hitPropName = firstHit.object.userData?.propName || firstHit.object.parent?.userData?.propName || "Scenery Prop";
        return {
          attempted: true,
          success: false,
          reason: "real_prop",
          cooldown: 0.55,
          message: `\u{1F33F} That's authentic scenery (${hitPropName})! Keep looking for moving props.`
        };
      }
      seeker.blessCooldown = 0.25;
      sound.playMissChime();
      return {
        attempted: true,
        success: false,
        reason: "out_of_range",
        cooldown: 0.25,
        message: "Too far! Get close (within 2.5m) to touch or proximity-tag suspects."
      };
    }
    // Alias for backwards compatibility
    blessTarget(seeker, hiderList = [], screenCoords = null, mapObstacles = []) {
      return this.confirmTag(seeker, hiderList, screenCoords, mapObstacles);
    }
  };

  // js/world/slots.js
  var HIDING_SLOTS = [
    // --- Zone 1: Central Courtyard & Fountain (Z: -3 to +3, Y: 0.45) ---
    {
      id: "slot_fountain_garland_ring",
      zone: "Central Fountain",
      zoneId: 1,
      position: new THREE.Vector3(-1, 0.55, 2.3),
      rotationY: 0,
      surfaceType: "floor",
      recommendedMorph: "flower",
      recommendedPose: "flatten",
      targetColor: "#F49D1A",
      // Marigold Orange
      altColors: ["#AEA396", "#3AAFA9"],
      desc: "Curled amidst the circular marigold garland around the stone fountain basin"
    },
    {
      id: "slot_fountain_upper_basin",
      zone: "Central Fountain",
      zoneId: 1,
      position: new THREE.Vector3(-1, 1.55, 0),
      rotationY: 1.2,
      surfaceType: "shelf",
      recommendedMorph: "modak",
      recommendedPose: "sit",
      targetColor: "#AEA396",
      // Sandstone Grey
      altColors: ["#3AAFA9", "#FFFFFF"],
      desc: "Perched on the upper stone finial tier of the central fountain"
    },
    // --- Zone 2: Artisan Weaving Loom (West Plaza: X: -7.0, Z: -2.0) ---
    {
      id: "slot_loom_textile_shuttle",
      zone: "Weaving Loom",
      zoneId: 2,
      position: new THREE.Vector3(-7, 1.35, -2),
      rotationY: 0.2,
      surfaceType: "table",
      recommendedMorph: "thali",
      recommendedPose: "flatten",
      targetColor: "#D62828",
      // Vermilion Red Textile
      altColors: ["#5C3A21", "#F4A01D"],
      desc: "Lying flat against the taut festive red warp threads on the handloom"
    },
    {
      id: "slot_chowki_teal_corner",
      zone: "Weaving Loom",
      zoneId: 2,
      position: new THREE.Vector3(-6.2, 0.95, 1),
      rotationY: 0.8,
      surfaceType: "table",
      recommendedMorph: "thali",
      recommendedPose: "sit",
      targetColor: "#2A9D8F",
      // Teal Damask
      altColors: ["#D4AF37", "#5C3A21"],
      desc: "Resting on the teal decorated bajot table beside the loom"
    },
    // --- Zone 3: North Produce Handcart (X: 0.0, Z: -6.0) ---
    {
      id: "slot_cart_produce_crates",
      zone: "North Handcart",
      zoneId: 3,
      position: new THREE.Vector3(0.3, 1.25, -5.8),
      rotationY: 0.5,
      surfaceType: "crate",
      recommendedMorph: "crate",
      recommendedPose: "sit",
      targetColor: "#B58A57",
      // Light Pine Wood
      altColors: ["#382214", "#F4A261"],
      desc: "Tucked between harvest produce boxes in the wooden handcart"
    },
    {
      id: "slot_green_bench_slats",
      zone: "Plaza Seating",
      zoneId: 3,
      position: new THREE.Vector3(2.8, 0.9, -5.8),
      rotationY: 0,
      surfaceType: "bench",
      recommendedMorph: "leaf",
      recommendedPose: "flatten",
      targetColor: "#2D6A4F",
      // Forest Green
      altColors: ["#8C6239", "#5C3A21"],
      desc: "Flattened along the green painted slats of the plaza bench"
    },
    // --- Zone 4: Plaza Market Stalls (East Courtyard: X: 5.5 to 6.5) ---
    {
      id: "slot_stall_blue_counter",
      zone: "Blue Market Stall",
      zoneId: 4,
      position: new THREE.Vector3(6.5, 1.35, 0.5),
      rotationY: -1.57,
      surfaceType: "shelf",
      recommendedMorph: "crate",
      recommendedPose: "sit",
      targetColor: "#264653",
      // Deep Blue
      altColors: ["#8C6239", "#B58A57"],
      desc: "Camouflaged on the blue market stall counter shelf"
    },
    {
      id: "slot_stall_striped_fruit",
      zone: "Striped Fruit Stall",
      zoneId: 4,
      position: new THREE.Vector3(5.5, 1.3, 6.5),
      rotationY: -2.3,
      surfaceType: "crate",
      recommendedMorph: "modak",
      recommendedPose: "curl",
      targetColor: "#F4A261",
      // Saffron Fruit
      altColors: ["#E9C46A", "#8C6239"],
      desc: "Curled in a fruit crate under the warm saffron striped awning"
    },
    // --- Zone 5: Sacred Banyan Tree & Mandir (North: Z: -13) ---
    {
      id: "slot_tree_chabutra_roots",
      zone: "Sacred Banyan Tree",
      zoneId: 5,
      position: new THREE.Vector3(3.5, 0.65, -11.5),
      rotationY: 1.8,
      surfaceType: "shelf",
      recommendedMorph: "diya",
      recommendedPose: "sit",
      targetColor: "#968B7F",
      // Stone Chabutra Grey
      altColors: ["#4A2E1B", "#F4A01D"],
      desc: "Sitting on the raised stone chabutra seat under festive tree garlands"
    },
    {
      id: "slot_mandir_porch_pillar",
      zone: "North Mandir",
      zoneId: 5,
      position: new THREE.Vector3(-4.5, 0.55, -11.5),
      rotationY: 0,
      surfaceType: "floor",
      recommendedMorph: "kalash",
      recommendedPose: "stand",
      targetColor: "#BD6343",
      // Terracotta Sandstone
      altColors: ["#D4AF37", "#941B26"],
      desc: "Standing upright like a miniature carved sanctum finial at the temple steps"
    },
    // --- Zone 6: Stone Arch Bridge & Stream (X: 7 to 11, Z: 5.8) ---
    {
      id: "slot_bridge_marigold_urn",
      zone: "Stone Arch Bridge",
      zoneId: 6,
      position: new THREE.Vector3(7.3, 0.95, 4.2),
      rotationY: 0.8,
      surfaceType: "crate",
      recommendedMorph: "matka",
      recommendedPose: "sit",
      targetColor: "#C2593F",
      // Terracotta Urn
      altColors: ["#F4A01D", "#B5A89B"],
      desc: "Disguised beside the marigold-garlanded earthen urns at the bridge ramp"
    },
    // --- Zone 7: Village Stone Well & East Bank (X: 16.5, Z: -7.0) ---
    {
      id: "slot_well_masonry_ledge",
      zone: "Village Well",
      zoneId: 7,
      position: new THREE.Vector3(16.5, 0.95, -5.6),
      rotationY: 3.14,
      surfaceType: "shelf",
      recommendedMorph: "matka",
      recommendedPose: "curl",
      targetColor: "#827B75",
      // Masonry Stone Grey
      altColors: ["#4D2D18", "#3AAFA9"],
      desc: "Curled on the circular stone masonry rim of the village water well"
    },
    {
      id: "slot_east_stall_goods",
      zone: "East Bank Market",
      zoneId: 7,
      position: new THREE.Vector3(15.5, 0.8, 2.5),
      rotationY: 1.57,
      surfaceType: "shelf",
      recommendedMorph: "crate",
      recommendedPose: "sit",
      targetColor: "#E9C46A",
      // Mustard Yellow
      altColors: ["#8C6239", "#5C3A21"],
      desc: "Tucked beneath the yellow awning on the east stream bank"
    },
    // --- Zone 8: South-West Alley & Colorful Pottery (X: -14, Z: 13) ---
    {
      id: "slot_southwest_pot_stack",
      zone: "Pottery Corner",
      zoneId: 8,
      position: new THREE.Vector3(-14.5, 1.45, 13.5),
      rotationY: -0.4,
      surfaceType: "crate",
      recommendedMorph: "matka",
      recommendedPose: "sit",
      targetColor: "#F4A261",
      // Saffron Yellow
      altColors: ["#2A9D8F", "#C2593F"],
      desc: "Sitting atop the vibrant 3-tier painted water matka stack"
    },
    {
      id: "slot_south_harvest_crate",
      zone: "South Courtyard",
      zoneId: 8,
      position: new THREE.Vector3(0.8, 0.95, 8),
      rotationY: 0.1,
      surfaceType: "crate",
      recommendedMorph: "crate",
      recommendedPose: "sit",
      targetColor: "#B58A57",
      // Pine Wood
      altColors: ["#264653", "#8C6239"],
      desc: "Disguised atop the stacked slatted harvest crates by the south parapet"
    },
    {
      id: "slot_leaning_cartwheel",
      zone: "South Courtyard",
      zoneId: 8,
      position: new THREE.Vector3(-2.5, 0.7, 9.8),
      rotationY: 0.15,
      surfaceType: "floor",
      recommendedMorph: "dhol",
      recommendedPose: "tilt",
      targetColor: "#382214",
      // Dark Wood
      altColors: ["#8C6239", "#BAAFA3"],
      desc: "Tilted against the hub of the leaning wooden cartwheel"
    }
  ];

  // js/systems/aiHider.js
  var AI_MICE_NAMES = ["Chintu", "Motu", "Golu", "Pintu"];
  var AIHiderSystem = class {
    constructor(scene) {
      this.scene = scene;
      this.aiMice = [];
    }
    spawnAIMice(difficulty = "normal", count = 4) {
      this.clear();
      const spawnCount = Math.max(1, Math.min(AI_MICE_NAMES.length, count));
      const validCourtyardSlots = HIDING_SLOTS.filter((s) => s.zoneId <= 8);
      const shuffled = [...validCourtyardSlots].sort(() => Math.random() - 0.5);
      const selectedSlots = [];
      const usedZones = /* @__PURE__ */ new Set();
      for (const slot of shuffled) {
        if (!usedZones.has(slot.zone)) {
          selectedSlots.push(slot);
          usedZones.add(slot.zone);
          if (selectedSlots.length === spawnCount) break;
        }
      }
      while (selectedSlots.length < spawnCount) {
        selectedSlots.push(shuffled[selectedSlots.length % shuffled.length]);
      }
      const names = AI_MICE_NAMES.slice(0, spawnCount);
      names.forEach((name, index) => {
        const slot = selectedSlots[index];
        const mouse = new Mushika(`mushika_${name}`, true);
        mouse.root.position.copy(slot.position);
        mouse.root.rotation.y = slot.rotationY;
        const sizes = ["petite", "normal", "plump"];
        mouse.setSize(sizes[index % sizes.length]);
        const pose = slot.recommendedPose || "sit";
        mouse.setPose(pose);
        const morph = slot.recommendedMorph;
        mouse.setMorph(morph);
        let baseColor = slot.targetColor || "#E07A2F";
        if (difficulty === "easy") {
          const c = new THREE.Color(baseColor);
          const hsl = { h: 0, s: 0, l: 0 };
          c.getHSL(hsl);
          hsl.h = (hsl.h + (Math.random() - 0.5) * 0.08 + 1) % 1;
          hsl.s = Math.max(0.2, Math.min(1, hsl.s + (Math.random() - 0.5) * 0.12));
          c.setHSL(hsl.h, hsl.s, hsl.l);
          baseColor = "#" + c.getHexString();
        }
        mouse.applyBaseCoat(baseColor);
        mouse.applyShadowLayer(baseColor);
        mouse.applyHighlightLayer(baseColor);
        if (slot.altColors && slot.altColors.length > 0) {
          const alt = slot.altColors[0];
          mouse.paintStroke(0.5, 0.25, alt, 45, 0.65);
        }
        mouse.isFrozen = true;
        this.scene.add(mouse.root);
        this.aiMice.push(mouse);
      });
      return this.aiMice;
    }
    update(dt) {
      this.aiMice.forEach((mouse) => mouse.update(dt));
    }
    clear() {
      this.aiMice.forEach((mouse) => this.scene.remove(mouse.root));
      this.aiMice = [];
    }
  };

  // js/systems/aiSeeker.js
  var AI_SEEKER_STATES = {
    PATROL: "PATROL",
    INSPECT: "INSPECT",
    CHASE: "CHASE",
    CATCH: "CATCH"
  };
  var AISeekerSystem = class {
    constructor(scene, blessSystem) {
      this.scene = scene;
      this.blessSystem = blessSystem;
      this.bala = null;
      this.waypoints = [
        new THREE.Vector3(0, 0.45, 0),
        // 1. Central Fountain
        new THREE.Vector3(-6.5, 0.45, -1.8),
        // 2. Weaving Loom (West Courtyard)
        new THREE.Vector3(0, 0.45, -5),
        // 3. North Produce Handcart
        new THREE.Vector3(-4.5, 0.25, -11),
        // 4. North Mandir Porch (North Sanctum)
        new THREE.Vector3(3.5, 0.55, -11),
        // 5. Sacred Banyan Tree Chabutra
        new THREE.Vector3(16, 0, -14),
        // 6. North-East Lane behind Well
        new THREE.Vector3(16.5, 0, -5.5),
        // 7. Village Stone Well (East Bank)
        new THREE.Vector3(15, 0, 3),
        // 8. East Bank Market Stall
        new THREE.Vector3(11.5, 0.5, 5.8),
        // 9. Stone Arch Bridge (East Approach)
        new THREE.Vector3(8, 0.65, 5.8),
        // 10. Stone Arch Bridge (Deck Center)
        new THREE.Vector3(5.5, 0.45, 6),
        // 11. Striped Fruit Stall (Plaza South-East)
        new THREE.Vector3(0.5, 0.45, 7.5),
        // 12. South Harvest Crates & Blue Chest
        new THREE.Vector3(-8.5, 0.2, 8.5),
        // 13. South-West Courtyard Steps
        new THREE.Vector3(-14.5, 0, 12),
        // 14. South-West Painted Matkas
        new THREE.Vector3(-14, 0, 5),
        // 15. West Cargo Crates
        new THREE.Vector3(-13.5, 0, -3),
        // 16. West Blue Shop Awning
        new THREE.Vector3(-14, 0, -12),
        // 17. North-West Alley Turn
        new THREE.Vector3(6, 0.45, 0.5)
        // 18. Plaza Blue Market Stall
      ];
      this.currentWaypointIndex = 0;
      this.state = AI_SEEKER_STATES.PATROL;
      this.stateTimer = 0;
      this.inspectDuration = 0.8;
      this.inspectedTarget = null;
      this.inspectedProp = null;
      this.recentlyInspectedProps = /* @__PURE__ */ new Set();
      this.lastKnownMousePos = null;
      this.lastKnownMouseTimer = 0;
      this.hasTaggedPlayer = false;
      this.sniffCooldown = 5;
      this.patrolSpeed = 3.3;
      this.chaseSpeed = 5.3;
      this.inspectHeadPhase = 0;
    }
    spawn(startPos = new THREE.Vector3(0, 0.45, 7.5)) {
      this.clear();
      this.bala = new Bala("bala_ai", true);
      this.bala.root.position.copy(startPos);
      this.scene.add(this.bala.root);
      this.currentWaypointIndex = 0;
      this.state = AI_SEEKER_STATES.PATROL;
      this.stateTimer = 0;
      this.hasTaggedPlayer = false;
      this.recentlyInspectedProps.clear();
      this.lastKnownMousePos = null;
      return this.bala;
    }
    /**
     * Record dynamic mouse movement for late-timer search bias
     */
    recordMouseMovement(pos) {
      if (!pos) return;
      this.lastKnownMousePos = pos.clone();
      this.lastKnownMouseTimer = 12;
    }
    update(dt, targetMice, mapObstacles = [], remainingSeekTime = 60) {
      if (!this.bala) return;
      const miceList = Array.isArray(targetMice) ? targetMice : targetMice ? [targetMice] : [];
      const aliveMice = miceList.filter((m) => m && !m.isTagged);
      const balaPos = this.bala.root.position;
      if (this.lastKnownMouseTimer > 0) {
        this.lastKnownMouseTimer -= dt;
        if (this.lastKnownMouseTimer <= 0) {
          this.lastKnownMousePos = null;
        }
      }
      if (aliveMice.length > 0) {
        this.sniffCooldown -= dt;
        if (this.sniffCooldown <= 0) {
          this.sniffCooldown = 7 + Math.random() * 3.5;
          let nearestMouse = null;
          let nearestDist = Infinity;
          for (const m of aliveMice) {
            const d = balaPos.distanceTo(m.root.position);
            if (d < nearestDist) {
              nearestDist = d;
              nearestMouse = m;
            }
          }
          if (nearestMouse && nearestDist <= 26) {
            this.recordMouseMovement(nearestMouse.root.position);
            if (window.sound && window.sound.playTrunkSniff) {
              window.sound.playTrunkSniff();
            }
            if (window.game && window.game.showSeekerToast) {
              window.game.showSeekerToast("\u{1F443} Bala caught your scent! He is searching your area!", "\u{1F418}", 2200);
            }
          }
        }
      }
      aliveMice.forEach((m) => {
        if (m.velocity && m.velocity.lengthSq() > 0.04) {
          const d = balaPos.distanceTo(m.root.position);
          if (d < 18) {
            this.recordMouseMovement(m.root.position);
            if (this.state === AI_SEEKER_STATES.PATROL && d < 12) {
              this.transitionToChase(m);
            }
          }
        }
      });
      switch (this.state) {
        case AI_SEEKER_STATES.PATROL: {
          this.bala.setSpraying(false);
          this.bala.update(dt, true);
          let targetPos;
          if (this.lastKnownMousePos) {
            targetPos = this.lastKnownMousePos;
          } else {
            targetPos = this.waypoints[this.currentWaypointIndex];
          }
          const toTarget = new THREE.Vector3().subVectors(targetPos, balaPos);
          toTarget.y = 0;
          const dist = toTarget.length();
          if (dist < 1.1) {
            this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.waypoints.length;
            if (this.lastKnownMousePos) {
              this.lastKnownMousePos = null;
            }
          } else {
            toTarget.normalize();
            const walkSpeed = remainingSeekTime < 30 ? 4 : this.patrolSpeed;
            balaPos.addScaledVector(toTarget, dt * walkSpeed);
            this.bala.root.rotation.y = Math.atan2(toTarget.x, toTarget.z);
          }
          for (const m of aliveMice) {
            const distToMouse = balaPos.distanceTo(m.root.position);
            const isMoving = m.velocity && m.velocity.lengthSq() > 0.04;
            const maxVisionDist = isMoving || !m.currentMorph ? 25 : 16;
            if (distToMouse < maxVisionDist && this.hasLineOfSight(balaPos, m.root.position, mapObstacles)) {
              if (isMoving || !m.currentMorph) {
                this.transitionToChase(m);
                return;
              } else if (distToMouse < 14) {
                this.transitionToInspect(m, null);
                return;
              }
            }
          }
          this.checkNearbyHideableProps(balaPos, aliveMice);
          break;
        }
        case AI_SEEKER_STATES.INSPECT: {
          this.bala.update(dt, false);
          this.stateTimer -= dt;
          this.inspectHeadPhase += dt * 8;
          if (this.bala.headGroup) {
            this.bala.headGroup.rotation.y = Math.sin(this.inspectHeadPhase) * 0.28;
            this.bala.headGroup.rotation.x = Math.cos(this.inspectHeadPhase * 0.7) * 0.15;
          }
          if (this.bala.trunkPart) {
            this.bala.trunkPart.rotation.x = Math.sin(this.inspectHeadPhase * 1.8) * 0.2;
          }
          if (this.inspectedTarget) {
            if (this.inspectedTarget.isTagged) {
              this.transitionToPatrol();
              return;
            }
            if (this.inspectedTarget.velocity && this.inspectedTarget.velocity.lengthSq() > 0.05) {
              this.transitionToChase(this.inspectedTarget);
              return;
            }
            const lookDir = new THREE.Vector3().subVectors(this.inspectedTarget.root.position, balaPos);
            lookDir.y = 0;
            if (lookDir.length() > 0.1) {
              this.bala.root.rotation.y = Math.atan2(lookDir.x, lookDir.z);
            }
          }
          if (this.stateTimer <= 0) {
            if (this.bala.headGroup) {
              this.bala.headGroup.rotation.set(0, 0, 0);
            }
            if (this.inspectedTarget && !this.inspectedTarget.isTagged) {
              const suspicion = this.evaluateCamouflage(this.inspectedTarget, remainingSeekTime);
              if (suspicion >= 0.38) {
                const dist = balaPos.distanceTo(this.inspectedTarget.root.position);
                if (dist <= 4.8) {
                  this.transitionToCatch(this.inspectedTarget);
                } else {
                  this.transitionToChase(this.inspectedTarget);
                }
                return;
              }
            }
            this.transitionToPatrol();
          }
          break;
        }
        case AI_SEEKER_STATES.CHASE: {
          if (!this.inspectedTarget || this.inspectedTarget.isTagged) {
            this.transitionToPatrol();
            return;
          }
          this.bala.update(dt, true);
          const targetPos = this.inspectedTarget.root.position;
          const toTarget = new THREE.Vector3().subVectors(targetPos, balaPos);
          toTarget.y = 0;
          const dist = toTarget.length();
          toTarget.normalize();
          balaPos.addScaledVector(toTarget, dt * this.chaseSpeed);
          this.bala.root.rotation.y = Math.atan2(toTarget.x, toTarget.z);
          this.recordMouseMovement(targetPos);
          if (dist <= 2.9 && this.hasLineOfSight(balaPos, targetPos, mapObstacles)) {
            this.transitionToCatch(this.inspectedTarget);
          } else if (dist > 22 || !this.hasLineOfSight(balaPos, targetPos, mapObstacles)) {
            this.stateTimer -= dt;
            if (this.stateTimer <= 0) {
              this.transitionToInspect(null, null);
            }
          }
          break;
        }
        case AI_SEEKER_STATES.CATCH: {
          if (!this.inspectedTarget || this.inspectedTarget.isTagged) {
            this.transitionToPatrol();
            return;
          }
          this.bala.update(dt, false);
          this.stateTimer -= dt;
          const targetPos = this.inspectedTarget.root.position;
          const lookDir = new THREE.Vector3().subVectors(targetPos, balaPos);
          lookDir.y = 0;
          if (lookDir.length() > 0.1) {
            this.bala.root.rotation.y = Math.atan2(lookDir.x, lookDir.z);
          }
          if (this.stateTimer <= 0) {
            const target = this.inspectedTarget;
            const res = this.blessSystem.confirmTag(this.bala, [target]);
            if (res && res.success) {
              this.hasTaggedPlayer = true;
              if (this.onTargetBlessed) {
                this.onTargetBlessed(target);
              }
            }
            this.bala.triggerBlessingAnimation();
            this.transitionToPatrol();
          }
          break;
        }
      }
    }
    checkNearbyHideableProps(balaPos, aliveMice) {
      if (!window.game || !window.game.map) return;
      const hideableProps = window.game.map.getHideableProps ? window.game.map.getHideableProps() : [];
      for (const prop of hideableProps) {
        if (!prop.userData || !prop.userData.obstacleBounds) continue;
        const center = prop.userData.obstacleBounds.center;
        const dist = balaPos.distanceTo(center);
        if (dist < 4.2 && !this.recentlyInspectedProps.has(prop)) {
          if (Math.random() < 0.75) {
            this.recentlyInspectedProps.add(prop);
            setTimeout(() => this.recentlyInspectedProps.delete(prop), 22e3);
            let hidingMouseNearby = null;
            for (const m of aliveMice) {
              if (m.root.position.distanceTo(center) < 3) {
                hidingMouseNearby = m;
                break;
              }
            }
            this.transitionToInspect(hidingMouseNearby, prop);
            return;
          }
        }
      }
    }
    transitionToPatrol() {
      this.state = AI_SEEKER_STATES.PATROL;
      this.inspectedTarget = null;
      this.inspectedProp = null;
      if (this.bala) {
        this.bala.setSpraying(false);
        if (this.bala.headGroup) this.bala.headGroup.rotation.set(0, 0, 0);
      }
    }
    transitionToInspect(targetMouse, prop = null) {
      this.state = AI_SEEKER_STATES.INSPECT;
      this.stateTimer = 0.65 + Math.random() * 0.35;
      this.inspectedTarget = targetMouse;
      this.inspectedProp = prop;
      this.inspectHeadPhase = 0;
    }
    transitionToChase(targetMouse) {
      this.state = AI_SEEKER_STATES.CHASE;
      this.stateTimer = 4.5;
      this.inspectedTarget = targetMouse;
      if (this.bala) this.bala.setSpraying(false);
    }
    transitionToCatch(targetMouse) {
      this.state = AI_SEEKER_STATES.CATCH;
      this.stateTimer = 0.22;
      this.inspectedTarget = targetMouse;
      if (this.bala) this.bala.setSpraying(true);
    }
    // Camouflage Evaluation: Checks paint match, raw white body, shape/pose suitability
    evaluateCamouflage(mouse, remainingTime = 60) {
      if (!mouse) return 0.1;
      let suspicion = 0.28;
      const ctx = mouse.ctx;
      if (ctx) {
        try {
          const p = ctx.getImageData(256, 256, 1, 1).data;
          const isPureWhite = p[0] > 230 && p[1] > 230 && p[2] > 230;
          if (isPureWhite) suspicion += 0.75;
        } catch (e) {
        }
      }
      if (!mouse.currentMorph) {
        suspicion += 0.7;
      }
      if (!mouse.isRigidFrozen) {
        suspicion += 0.38;
      }
      if (mouse.velocity && mouse.velocity.lengthSq() > 0.01) {
        suspicion += 0.8;
      }
      if (mouse.currentMorph === "leaf" && mouse.currentPose !== "flatten") suspicion += 0.4;
      if (mouse.currentMorph === "thali" && mouse.currentPose !== "flatten") suspicion += 0.4;
      if (mouse.currentMorph === "matka" && mouse.currentPose === "flatten") suspicion += 0.4;
      if (remainingTime < 30) {
        suspicion += 0.2;
      }
      return Math.min(1, Math.max(0, suspicion));
    }
    hasLineOfSight(from, to, obstacles) {
      const ray = new THREE.Ray(from, new THREE.Vector3().subVectors(to, from).normalize());
      const dist = from.distanceTo(to);
      for (const obs of obstacles) {
        if (!obs.userData || !obs.userData.obstacleBounds) continue;
        if (obs.userData.isObstacleDisabled) continue;
        const ob = obs.userData.obstacleBounds;
        const box = new THREE.Box3(
          new THREE.Vector3(ob.center.x - ob.hx, ob.center.y - ob.hy, ob.center.z - ob.hz),
          new THREE.Vector3(ob.center.x + ob.hx, ob.center.y + ob.hy, ob.center.z + ob.hz)
        );
        const hit = ray.intersectBox(box, new THREE.Vector3());
        if (hit && from.distanceTo(hit) < dist - 0.4) {
          return false;
        }
      }
      return true;
    }
    clear() {
      if (this.bala) {
        this.scene.remove(this.bala.root);
        this.bala = null;
      }
      this.recentlyInspectedProps.clear();
      this.lastKnownMousePos = null;
    }
  };

  // js/input.js
  var InputManager = class {
    constructor(canvas, uiContainer) {
      this.canvas = canvas;
      this.uiContainer = uiContainer;
      this.moveX = 0;
      this.moveZ = 0;
      this.isHop = false;
      this.isCrouch = false;
      this.isSnap = false;
      this.lookDeltaX = 0;
      this.lookDeltaY = 0;
      this.actionBless = false;
      this.actionMarkPetal = false;
      this.actionSampleColor = false;
      this.actionSwitchProp = false;
      this.actionRevert = false;
      this.actionBlend = false;
      this.actionTaunt = false;
      this.actionPropAbility = false;
      this.actionFreeze = false;
      this.actionLockOrientation = false;
      this.actionUnstuck = false;
      this.actionSniff = false;
      this.isSprint = false;
      this.keys = {};
      this.isPointerLocked = false;
      this.isMouseDown = false;
      this.isHoldingSpray = false;
      this.mousePos = { x: 0, y: 0 };
      this.isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
      this.activeTouches = /* @__PURE__ */ new Map();
      this.joystickData = {
        active: false,
        touchId: null,
        baseX: 0,
        baseY: 0,
        knobX: 0,
        knobY: 0,
        radius: 55
      };
      this.lookTouchId = null;
      this.lastLookPos = { x: 0, y: 0 };
      this.touchStartTime = 0;
      this.touchStartX = 0;
      this.touchStartY = 0;
      this.touchIsTapCandidate = false;
      this.lastTapTime = 0;
      this.lastTapX = 0;
      this.lastTapY = 0;
      this.actionTap = false;
      this.tapPos = null;
      this.mouseClickStartTime = 0;
      this.mouseClickStartX = 0;
      this.mouseClickStartY = 0;
      this.setupKeyboard();
      this.setupMouse();
      this.setupTouch();
    }
    setupKeyboard() {
      window.addEventListener("keydown", (e) => {
        this.keys[e.code] = true;
        if (e.code === "KeyE") {
          this.actionBless = true;
          this.actionSwitchProp = true;
        }
        if (e.code === "KeyQ") {
          this.actionMarkPetal = true;
          this.actionRevert = true;
          this.actionSniff = true;
        }
        if (e.code === "KeyT") {
          this.actionTaunt = true;
        }
        if (e.code === "KeyF" || e.code === "KeyX") {
          this.actionFreeze = true;
          this.actionPropAbility = true;
        }
        if (e.code === "KeyL") {
          this.actionLockOrientation = true;
        }
        if (e.code === "KeyU") {
          this.actionUnstuck = true;
        }
        if (e.code === "KeyC") {
          this.actionBlend = true;
        }
        if (e.code === "KeyR") this.actionSampleColor = true;
        if (e.code === "Tab") {
          e.preventDefault();
          this.actionToggleStudio = true;
        }
        if (e.code === "Digit1") this.actionPose = "sit";
        if (e.code === "Digit2") this.actionPose = "curl";
        if (e.code === "Digit3") this.actionPose = "flatten";
        if (e.code === "Digit4") this.actionPose = "stand";
        if (e.code === "Digit5") this.actionPose = "tilt";
        if (e.code === "Digit6") this.actionPose = "stretch";
        if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
          this.isSprint = true;
          this.isSnap = true;
        }
        if (e.code === "Space") this.isHop = true;
      });
      window.addEventListener("keyup", (e) => {
        this.keys[e.code] = false;
        if (e.code === "Space") this.isHop = false;
        if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
          this.isSprint = false;
          this.isSnap = false;
        }
      });
    }
    setupMouse() {
      this.canvas.addEventListener("click", (e) => {
        if (!this.isTouchDevice && document.pointerLockElement !== this.canvas) {
          this.canvas.requestPointerLock();
        }
      });
      this.canvas.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        this.actionSniff = true;
        this.actionRevert = true;
      });
      document.addEventListener("pointerlockchange", () => {
        this.isPointerLocked = document.pointerLockElement === this.canvas;
      });
      window.addEventListener("wheel", (e) => {
        const inModal = e.target && e.target.closest && e.target.closest(".modal:not(.hidden), #chameleon-studio:not(.hidden), .swatches-grid");
        if (inModal) return;
        e.preventDefault();
        const clampedDx = Math.max(-40, Math.min(40, e.deltaX));
        const clampedDy = Math.max(-40, Math.min(40, e.deltaY));
        this.lookDeltaX -= clampedDx * 24e-4;
        this.lookDeltaY -= clampedDy * 24e-4;
      }, { passive: false });
      let lastClientX = null;
      let lastClientY = null;
      window.addEventListener("mousemove", (e) => {
        this.mousePos.x = e.clientX;
        this.mousePos.y = e.clientY;
        let dx = e.movementX;
        let dy = e.movementY;
        if (dx === void 0 || isNaN(dx) || dx === 0 && dy === 0 && lastClientX !== null && (e.clientX !== lastClientX || e.clientY !== lastClientY)) {
          dx = lastClientX !== null ? e.clientX - lastClientX : 0;
          dy = lastClientY !== null ? e.clientY - lastClientY : 0;
        }
        lastClientX = e.clientX;
        lastClientY = e.clientY;
        const clampedDx = Math.max(-60, Math.min(60, dx));
        const clampedDy = Math.max(-60, Math.min(60, dy));
        if (this.isPointerLocked) {
          this.lookDeltaX += clampedDx * 22e-4;
          this.lookDeltaY += clampedDy * 22e-4;
        } else if (this.isMouseDown) {
          this.lookDeltaX += clampedDx * 32e-4;
          this.lookDeltaY += clampedDy * 32e-4;
        }
      });
      this.canvas.addEventListener("mousedown", (e) => {
        this.isMouseDown = true;
        this.mouseClickStartTime = performance.now();
        this.mouseClickStartX = e.clientX;
        this.mouseClickStartY = e.clientY;
        lastClientX = e.clientX;
        lastClientY = e.clientY;
        if (e.button === 0) {
          this.actionPropAbility = true;
        }
      });
      window.addEventListener("mouseup", (e) => {
        if (this.isMouseDown && e.button === 0) {
          const duration = performance.now() - (this.mouseClickStartTime || 0);
          const dist = Math.hypot(e.clientX - (this.mouseClickStartX || e.clientX), e.clientY - (this.mouseClickStartY || e.clientY));
          if (duration < 280 && dist < 12) {
            this.actionTap = true;
            this.tapPos = { x: e.clientX, y: e.clientY };
            this.actionBless = true;
            this.actionSwitchProp = true;
          }
        }
        this.isMouseDown = false;
        lastClientX = null;
        lastClientY = null;
      });
    }
    setupTouch() {
      const touchZone = this.canvas;
      touchZone.addEventListener("touchstart", (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (e.target && e.target !== this.canvas && e.target.closest && e.target.closest(".interactive, button, #mobile-action-pad, .mobile-action-btn, .morph-card, .swatch, .pill-btn, .modal")) {
            continue;
          }
          const elemUnderTouch = document.elementFromPoint(t.clientX, t.clientY);
          if (elemUnderTouch && elemUnderTouch.closest(".interactive, button, #mobile-action-pad, .mobile-action-btn, .morph-card, .swatch, .pill-btn, .modal")) {
            continue;
          }
          if (t.clientX < window.innerWidth * 0.5) {
            if (!this.joystickData.active) {
              const joyBase = document.getElementById("touch-joystick-base");
              const rect = joyBase ? joyBase.getBoundingClientRect() : null;
              const defaultCenterX = rect ? rect.left + rect.width / 2 : 100;
              const defaultCenterY = rect ? rect.top + rect.height / 2 : window.innerHeight - 100;
              const distToDefault = Math.hypot(t.clientX - defaultCenterX, t.clientY - defaultCenterY);
              let centerX = defaultCenterX;
              let centerY = defaultCenterY;
              if (distToDefault > 95) {
                centerX = t.clientX;
                centerY = t.clientY;
                if (joyBase) {
                  joyBase.style.left = `${centerX - 65}px`;
                  joyBase.style.top = `${centerY - 65}px`;
                  joyBase.style.bottom = "auto";
                }
              }
              this.joystickData.active = true;
              this.joystickData.touchId = t.identifier;
              this.joystickData.baseX = centerX;
              this.joystickData.baseY = centerY;
              this.joystickData.knobX = t.clientX;
              this.joystickData.knobY = t.clientY;
              const dx = t.clientX - centerX;
              const dy = t.clientY - centerY;
              const dist = Math.hypot(dx, dy);
              const maxR = this.joystickData.radius || 50;
              const deadzone = 6;
              if (dist > deadzone) {
                const norm = Math.min(1, (dist - deadzone) / (maxR - deadzone));
                const angle = Math.atan2(dy, dx);
                this.moveX = Math.cos(angle) * norm;
                this.moveZ = Math.sin(angle) * norm;
              } else {
                this.moveX = 0;
                this.moveZ = 0;
              }
              this.updateJoystickUI(true);
            }
          } else {
            if (this.lookTouchId === null) {
              this.lookTouchId = t.identifier;
              this.lastLookPos.x = t.clientX;
              this.lastLookPos.y = t.clientY;
              this.touchStartTime = performance.now();
              this.touchStartX = t.clientX;
              this.touchStartY = t.clientY;
              this.touchIsTapCandidate = true;
            }
          }
        }
      }, { passive: false });
      const onTouchMove = (e) => {
        e.preventDefault();
        const deadzone = 6;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === this.joystickData.touchId) {
            const dx = t.clientX - this.joystickData.baseX;
            const dy = t.clientY - this.joystickData.baseY;
            const dist = Math.hypot(dx, dy);
            const maxR = this.joystickData.radius || 50;
            const angle = Math.atan2(dy, dx);
            if (dist <= deadzone) {
              this.joystickData.knobX = this.joystickData.baseX;
              this.joystickData.knobY = this.joystickData.baseY;
              this.moveX = 0;
              this.moveZ = 0;
            } else if (dist > maxR) {
              this.joystickData.knobX = this.joystickData.baseX + Math.cos(angle) * maxR;
              this.joystickData.knobY = this.joystickData.baseY + Math.sin(angle) * maxR;
              this.moveX = Math.cos(angle);
              this.moveZ = Math.sin(angle);
            } else {
              this.joystickData.knobX = t.clientX;
              this.joystickData.knobY = t.clientY;
              const norm = (dist - deadzone) / (maxR - deadzone);
              this.moveX = Math.cos(angle) * norm;
              this.moveZ = Math.sin(angle) * norm;
            }
            this.updateJoystickUI(true);
          }
          if (t.identifier === this.lookTouchId) {
            const dx = t.clientX - this.lastLookPos.x;
            const dy = t.clientY - this.lastLookPos.y;
            if (Math.hypot(dx, dy) > 10) {
              this.touchIsTapCandidate = false;
            }
            const clampedDx = Math.max(-50, Math.min(50, dx));
            const clampedDy = Math.max(-50, Math.min(50, dy));
            this.lookDeltaX += clampedDx * 65e-4;
            this.lookDeltaY += clampedDy * 65e-4;
            this.lastLookPos.x = t.clientX;
            this.lastLookPos.y = t.clientY;
          }
        }
      };
      touchZone.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      const onTouchEnd = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === this.joystickData.touchId) {
            this.joystickData.active = false;
            this.joystickData.touchId = null;
            this.moveX = 0;
            this.moveZ = 0;
            const joyBase = document.getElementById("touch-joystick-base");
            if (joyBase) {
              joyBase.style.left = "";
              joyBase.style.top = "";
              joyBase.style.bottom = "";
            }
            this.updateJoystickUI(false);
          }
          if (t.identifier === this.lookTouchId) {
            const touchDuration = performance.now() - this.touchStartTime;
            const touchDist = Math.hypot(t.clientX - this.touchStartX, t.clientY - this.touchStartY);
            if (this.touchIsTapCandidate && touchDuration < 280 && touchDist < 16) {
              const now = performance.now();
              if (this.lastTapTime && now - this.lastTapTime < 320 && Math.hypot(t.clientX - this.lastTapX, t.clientY - this.lastTapY) < 40) {
                this.isHop = true;
                this.lastTapTime = 0;
              } else {
                this.lastTapTime = now;
                this.lastTapX = t.clientX;
                this.lastTapY = t.clientY;
                this.actionTap = true;
                this.tapPos = { x: t.clientX, y: t.clientY };
                this.actionBless = true;
                this.actionSwitchProp = true;
              }
            }
            this.lookTouchId = null;
          }
        }
      };
      touchZone.addEventListener("touchend", onTouchEnd);
      touchZone.addEventListener("touchcancel", onTouchEnd);
      window.addEventListener("touchend", onTouchEnd);
      window.addEventListener("touchcancel", onTouchEnd);
    }
    updateJoystickUI(isDragging = false) {
      const joyKnob = document.getElementById("touch-joystick-knob");
      if (!joyKnob) return;
      if (this.joystickData.active) {
        joyKnob.classList.add("dragging");
        const kx = this.joystickData.knobX - this.joystickData.baseX;
        const ky = this.joystickData.knobY - this.joystickData.baseY;
        joyKnob.style.transform = `translate(${kx}px, ${ky}px)`;
      } else {
        joyKnob.classList.remove("dragging");
        joyKnob.style.transform = "translate(0px, 0px)";
      }
    }
    // Process and return current frame input vector
    update() {
      if (!this.joystickData.active) {
        this.moveX = 0;
        this.moveZ = 0;
        if (this.keys["KeyW"]) this.moveZ -= 1;
        if (this.keys["KeyS"]) this.moveZ += 1;
        if (this.keys["KeyA"]) this.moveX -= 1;
        if (this.keys["KeyD"]) this.moveX += 1;
        const hasWasd = this.keys["KeyW"] || this.keys["KeyS"] || this.keys["KeyA"] || this.keys["KeyD"];
        if (this.keys["ArrowLeft"]) {
          this.lookDeltaX -= 0.038;
          if (!hasWasd) this.moveX -= 1;
        }
        if (this.keys["ArrowRight"]) {
          this.lookDeltaX += 0.038;
          if (!hasWasd) this.moveX += 1;
        }
        if (this.keys["ArrowUp"]) {
          this.lookDeltaY -= 0.03;
          if (!hasWasd) this.moveZ -= 1;
        }
        if (this.keys["ArrowDown"]) {
          this.lookDeltaY += 0.03;
          if (!hasWasd) this.moveZ += 1;
        }
        const len = Math.hypot(this.moveX, this.moveZ);
        if (len > 0) {
          this.moveX /= len;
          this.moveZ /= len;
        }
      }
      const isSpraying = this.isHoldingSpray || this.isMouseDown && performance.now() - (this.mouseClickStartTime || 0) > 80 || !!this.keys["KeyE"];
      const delta = {
        moveX: this.moveX,
        moveZ: this.moveZ,
        isHop: this.isHop,
        isCrouch: this.isCrouch,
        isSnap: this.isSnap,
        isSprint: this.isSprint,
        lookX: this.lookDeltaX,
        lookY: this.lookDeltaY,
        isSpraying,
        actionBless: this.actionBless,
        actionMarkPetal: this.actionMarkPetal,
        actionSampleColor: this.actionSampleColor,
        actionSwitchProp: this.actionSwitchProp,
        actionRevert: this.actionRevert,
        actionBlend: this.actionBlend,
        actionTaunt: this.actionTaunt,
        actionPropAbility: this.actionPropAbility,
        actionFreeze: this.actionFreeze,
        actionLockOrientation: this.actionLockOrientation,
        actionUnstuck: this.actionUnstuck,
        actionSniff: this.actionSniff,
        actionToggleStudio: this.actionToggleStudio,
        actionPose: this.actionPose,
        actionTap: this.actionTap,
        tapPos: this.tapPos ? { ...this.tapPos } : null
      };
      if (!this.keys["Space"]) {
        this.isHop = false;
      }
      this.lookDeltaX = 0;
      this.lookDeltaY = 0;
      this.actionBless = false;
      this.actionMarkPetal = false;
      this.actionSampleColor = false;
      this.actionSwitchProp = false;
      this.actionRevert = false;
      this.actionBlend = false;
      this.actionTaunt = false;
      this.actionPropAbility = false;
      this.actionFreeze = false;
      this.actionLockOrientation = false;
      this.actionUnstuck = false;
      this.actionSniff = false;
      this.actionToggleStudio = false;
      this.actionPose = null;
      this.actionTap = false;
      this.tapPos = null;
      return delta;
    }
    setHoldingSpray(isHolding) {
      this.isHoldingSpray = !!isHolding;
    }
  };

  // js/camera.js
  var FollowCamera = class {
    constructor(camera) {
      this.camera = camera;
      this.yaw = 0;
      this.pitch = 0.28;
      this.distance = 2.4;
      this.targetDistance = 2.4;
      this.targetOffset = new THREE.Vector3(0, 0.45, 0);
      this.currentPos = new THREE.Vector3(0, 2, 5);
      this.currentLookAt = new THREE.Vector3(0, 0.5, 0);
      this.raycaster = new THREE.Raycaster();
      this.isFirstPerson = false;
      this.currentRole = "hider";
      this.fpsEyeHeight = 1.95;
      this.hiderEyeHeight = 0.32;
      this.swayPhase = 0;
      this.trunkTip = this.buildTrunkTip();
      this.camera.add(this.trunkTip);
      this.trunkTip.visible = false;
      this.pichkariViewmodel = this.buildDualPichkariViewModel();
      this.camera.add(this.pichkariViewmodel);
      this.pichkariViewmodel.visible = false;
    }
    buildDualPichkariViewModel() {
      const root = new THREE.Group();
      root.name = "SeekerPichkariViewmodel";
      const brassMat = new THREE.MeshStandardMaterial({
        color: 12950311,
        metalness: 0.85,
        roughness: 0.25,
        flatShading: true
      });
      const tealMat = new THREE.MeshStandardMaterial({
        color: 1014651,
        metalness: 0.2,
        roughness: 0.5,
        flatShading: true
      });
      const goldMat = new THREE.MeshStandardMaterial({
        color: 13938487,
        metalness: 0.75,
        roughness: 0.3,
        flatShading: true
      });
      const makePichkari = (side) => {
        const pGroup = new THREE.Group();
        pGroup.position.set(side * 0.32, -0.28, -0.55);
        pGroup.rotation.y = -side * 0.12;
        pGroup.rotation.x = -0.06;
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.048, 0.44, 8), brassMat);
        barrel.rotation.x = Math.PI / 2;
        pGroup.add(barrel);
        const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.24, 8), tealMat);
        sleeve.rotation.x = Math.PI / 2;
        pGroup.add(sleeve);
        const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.12, 8), goldMat);
        nozzle.position.z = 0.27;
        nozzle.rotation.x = Math.PI / 2;
        pGroup.add(nozzle);
        const nozzleTip = new THREE.Object3D();
        nozzleTip.position.set(0, 0, 0.34);
        pGroup.add(nozzleTip);
        return { group: pGroup, tip: nozzleTip };
      };
      const left = makePichkari(-1);
      const right = makePichkari(1);
      root.add(left.group);
      root.add(right.group);
      this.viewmodelL = left.group;
      this.viewmodelR = right.group;
      this.viewmodelTipL = left.tip;
      this.viewmodelTipR = right.tip;
      return root;
    }
    getNozzleLWorldPos() {
      if (this.viewmodelTipL && this.isFirstPerson && this.currentRole === "seeker") {
        const pos = new THREE.Vector3();
        this.viewmodelTipL.getWorldPosition(pos);
        if (pos.lengthSq() > 0.01) return pos;
      }
      return null;
    }
    getNozzleRWorldPos() {
      if (this.viewmodelTipR && this.isFirstPerson && this.currentRole === "seeker") {
        const pos = new THREE.Vector3();
        this.viewmodelTipR.getWorldPosition(pos);
        if (pos.lengthSq() > 0.01) return pos;
      }
      return null;
    }
    setSprayingRecoil(isSpraying, dt) {
      if (!this.viewmodelL || !this.viewmodelR) return;
      if (isSpraying) {
        this.recoilT = (this.recoilT || 0) + dt * 26;
        const kickL = Math.sin(this.recoilT) * 0.025;
        const kickR = Math.sin(this.recoilT + Math.PI * 0.5) * 0.025;
        this.viewmodelL.position.z = -0.55 + kickL;
        this.viewmodelR.position.z = -0.55 + kickR;
      } else {
        this.viewmodelL.position.z = -0.55;
        this.viewmodelR.position.z = -0.55;
      }
    }
    buildTrunkTip() {
      const group = new THREE.Group();
      group.name = "SeekerTrunkPOV";
      const skinMat = new THREE.MeshStandardMaterial({
        color: 7240587,
        roughness: 0.85,
        metalness: 0.05,
        flatShading: true
      });
      const pinkMat = new THREE.MeshStandardMaterial({
        color: 15245488,
        roughness: 0.6,
        flatShading: true
      });
      const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.35, 8), skinMat);
      seg1.rotation.x = Math.PI * 0.32;
      seg1.position.set(0, -0.08, 0.1);
      group.add(seg1);
      const seg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.32, 8), skinMat);
      seg2.rotation.x = Math.PI * 0.48;
      seg2.position.set(0, -0.02, 0.36);
      group.add(seg2);
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.08, 0.1, 8), pinkMat);
      tip.rotation.x = Math.PI * 0.58;
      tip.position.set(0, 0.05, 0.52);
      group.add(tip);
      group.position.set(0, -0.36, -0.68);
      return group;
    }
    setTargetRole(role) {
      this.currentRole = role;
      const isPortrait = window.innerWidth < window.innerHeight;
      if (role === "seeker") {
        this.setFirstPerson(true);
      } else {
        this.setFirstPerson(false);
        this.distance = isPortrait ? 2.8 : 2.2;
        this.targetDistance = this.distance;
        this.targetOffset.set(0, 0.45, 0);
        this.minDistance = 0.8;
        this.pitch = 0.28;
      }
    }
    setFirstPerson(enabled) {
      this.isFirstPerson = enabled;
      if (enabled) {
        this.distance = 0;
        const eyeH = this.currentRole === "seeker" ? this.fpsEyeHeight : this.hiderEyeHeight;
        this.targetOffset.set(0, eyeH, 0);
        this.minDistance = 0;
        this.pitch = 0;
      }
      const isSeekerFPS = this.isFirstPerson && this.currentRole === "seeker";
      if (this.trunkTip) {
        this.trunkTip.visible = isSeekerFPS;
      }
      if (this.pichkariViewmodel) {
        this.pichkariViewmodel.visible = false;
      }
    }
    togglePOV() {
      this.setFirstPerson(!this.isFirstPerson);
      return this.isFirstPerson;
    }
    update(dt, targetPosition, lookDeltaX, lookDeltaY, obstacles = [], propRadius = 0.28, propHeight = 0.45, isMoving = false, targetHeading = null, isOrientationLocked = false) {
      this.yaw -= lookDeltaX;
      if (this.trunkTip) {
        this.trunkTip.visible = this.isFirstPerson && this.currentRole === "seeker";
      }
      if (this.isFirstPerson) {
        this.pitch = Math.max(-1.3, Math.min(1.3, this.pitch - lookDeltaY));
        const eyeH = this.currentRole === "seeker" ? this.fpsEyeHeight : Math.max(0.18, propHeight * 0.75);
        this.targetOffset.set(0, eyeH, 0);
        let swayX = 0;
        let swayY = 0;
        if (isMoving) {
          this.swayPhase += dt * (this.currentRole === "seeker" ? 7.5 : 12);
          swayX = Math.sin(this.swayPhase) * (this.currentRole === "seeker" ? 0.03 : 0.015);
          swayY = Math.abs(Math.sin(this.swayPhase * 2)) * (this.currentRole === "seeker" ? 0.025 : 0.015);
          if (this.trunkTip && this.trunkTip.visible) {
            this.trunkTip.position.x = 0.22 + Math.sin(this.swayPhase) * 0.03;
            this.trunkTip.position.y = -0.32 + Math.cos(this.swayPhase * 2) * 0.025;
            this.trunkTip.rotation.z = Math.sin(this.swayPhase) * 0.08;
          }
        } else {
          if (this.trunkTip && this.trunkTip.visible) {
            this.swayPhase += dt * 2;
            this.trunkTip.position.y = -0.32 + Math.sin(this.swayPhase) * 8e-3;
            this.trunkTip.rotation.z = 0;
          }
        }
        const anchor = targetPosition.clone().add(this.targetOffset);
        anchor.x += swayX;
        anchor.y += swayY;
        const cosPitch = Math.cos(this.pitch);
        const sinPitch = Math.sin(this.pitch);
        const sinYaw = Math.sin(this.yaw);
        const cosYaw = Math.cos(this.yaw);
        const lookDir = new THREE.Vector3(
          -sinYaw * cosPitch,
          sinPitch,
          -cosYaw * cosPitch
        ).normalize();
        const lookTarget = anchor.clone().add(lookDir.multiplyScalar(10));
        const lerpFactor = 1 - Math.exp(-dt * 22);
        this.currentPos.lerp(anchor, lerpFactor);
        this.currentLookAt.lerp(lookTarget, lerpFactor);
        this.camera.position.copy(this.currentPos);
        this.camera.lookAt(this.currentLookAt);
      } else {
        this.pitch = Math.max(-0.25, Math.min(1.15, this.pitch + lookDeltaY));
        if (!isOrientationLocked && isMoving && Math.abs(lookDeltaX) < 1e-4 && targetHeading !== null && targetHeading !== void 0) {
          const targetYaw = targetHeading - Math.PI;
          let diff = (targetYaw - this.yaw) % (Math.PI * 2);
          if (diff > Math.PI) diff -= Math.PI * 2;
          if (diff < -Math.PI) diff += Math.PI * 2;
          this.yaw += diff * (1 - Math.exp(-dt * 3.5));
        }
        this.targetDistance = Math.max(1.8, Math.min(4.5, (propRadius || 0.35) * 3.5));
        this.distance += (this.targetDistance - this.distance) * (1 - Math.exp(-dt * 8));
        const targetY = Math.max(0.35, (propHeight || 0.45) * 0.85);
        this.targetOffset.set(0, targetY, 0);
        const anchor = targetPosition.clone().add(this.targetOffset);
        const cosPitch = Math.cos(this.pitch);
        const sinPitch = Math.sin(this.pitch);
        const sinYaw = Math.sin(this.yaw);
        const cosYaw = Math.cos(this.yaw);
        const desiredOffset = new THREE.Vector3(
          sinYaw * cosPitch * this.distance,
          sinPitch * this.distance,
          cosYaw * cosPitch * this.distance
        );
        let targetCamPos = anchor.clone().add(desiredOffset);
        const dir = new THREE.Vector3().subVectors(targetCamPos, anchor);
        const maxDist = dir.length();
        dir.normalize();
        this.raycaster.set(anchor, dir);
        this.raycaster.far = maxDist;
        if (obstacles.length > 0) {
          const hits = this.raycaster.intersectObjects(obstacles, true);
          for (const hit of hits) {
            if (hit.object && hit.object.userData && hit.object.userData.isObstacleDisabled) continue;
            const minDist = this.minDistance || 0.8;
            if (hit.distance < maxDist && hit.distance > minDist) {
              targetCamPos = anchor.clone().addScaledVector(dir, Math.max(minDist, hit.distance - 0.2));
              break;
            }
          }
        }
        if (targetCamPos.y < 0.25) targetCamPos.y = 0.25;
        const lerpFactor = 1 - Math.exp(-dt * 15);
        this.currentPos.lerp(targetCamPos, lerpFactor);
        this.currentLookAt.lerp(anchor, lerpFactor);
        this.camera.position.copy(this.currentPos);
        this.camera.lookAt(this.currentLookAt);
      }
    }
  };

  // js/systems/waterSprayController.js
  var WaterSprayController = class {
    /**
     * @param {Partial<WaterSprayConfig>} [customConfig]
     */
    constructor(customConfig = {}) {
      this.config = {
        range: 12,
        coneAngleDeg: 18,
        sprayRateUnitsPerSec: 20,
        maxPressure: 100,
        pressureRechargeRate: 15,
        damagePerTick: 4,
        tickIntervalMs: 50,
        // 20 Ticks/sec
        ...customConfig
      };
      this.currentPressure = this.config.maxPressure;
      this.isSpraying = false;
      this.isOverheated = false;
      this.lastSprayTime = 0;
      this.tickTimer = 0;
      this.state = "idle";
      this.onSputter = null;
      this.onHitHider = null;
      this.onHitStatic = null;
    }
    /**
     * Start continuous water spray
     */
    startSpray() {
      if (this.isOverheated || this.currentPressure <= 5) {
        this.isSpraying = false;
        if (this.currentPressure <= 5 && !this.isOverheated) {
          this.isOverheated = true;
          this.state = "cooldown";
          if (this.onSputter) this.onSputter();
        }
        return;
      }
      this.isSpraying = true;
      this.state = "spraying";
    }
    /**
     * Stop water spray
     */
    stopSpray() {
      this.isSpraying = false;
      this.isHittingStatic = false;
      if (!this.isOverheated) {
        this.state = "idle";
      }
    }
    /**
     * Main update loop called each frame
     * @param {number} deltaTime - Frame delta time in seconds
     * @param {{x: number, y: number, z: number}} handOrigin - Socket position
     * @param {{x: number, y: number, z: number}} forwardVector - Aim direction
     * @param {function(any, any, number, number): {prop: IPropHider|null, isStatic: boolean, hitPoint?: {x: number, y: number, z: number}}} queryPropsCallback
     */
    update(deltaTime, handOrigin, forwardVector, queryPropsCallback) {
      const now = performance.now();
      if (!this.isSpraying) {
        if (now - this.lastSprayTime > 1200) {
          this.currentPressure = Math.min(
            this.config.maxPressure,
            this.currentPressure + this.config.pressureRechargeRate * deltaTime
          );
          if (this.currentPressure >= 30 && this.isOverheated) {
            this.isOverheated = false;
            this.state = "idle";
          } else if (!this.isOverheated) {
            this.state = this.currentPressure >= this.config.maxPressure ? "idle" : "recharging";
          }
        }
        return;
      }
      this.lastSprayTime = now;
      const drainMultiplier = this.isHittingStatic ? 1.4 : 1;
      const frameDrain = this.config.sprayRateUnitsPerSec * deltaTime * drainMultiplier;
      this.currentPressure = Math.max(0, this.currentPressure - frameDrain);
      if (this.currentPressure <= 0) {
        this.currentPressure = 0;
        this.isSpraying = false;
        this.isOverheated = true;
        this.isHittingStatic = false;
        this.state = "cooldown";
        if (this.onSputter) this.onSputter();
        return;
      }
      this.tickTimer += deltaTime * 1e3;
      if (this.tickTimer >= this.config.tickIntervalMs) {
        this.tickTimer = 0;
        let hitResult = { prop: null, isStatic: false, hitPoint: null };
        if (typeof queryPropsCallback === "function") {
          hitResult = queryPropsCallback(
            handOrigin,
            forwardVector,
            this.config.range,
            this.config.coneAngleDeg
          ) || hitResult;
        }
        this.isHittingStatic = !!hitResult.isStatic;
        if (hitResult.prop) {
          const hitPoint = hitResult.hitPoint || [handOrigin.x, handOrigin.y, handOrigin.z];
          hitResult.prop.takeWaterDamage(this.config.damagePerTick, hitPoint);
          hitResult.prop.applySoakEffect(3);
          if (this.onHitHider) {
            this.onHitHider(hitResult.prop, hitPoint);
          }
        } else if (hitResult.isStatic) {
          if (this.onHitStatic) {
            this.onHitStatic(hitResult.hitPoint);
          }
        }
      }
    }
    /**
     * @returns {number} Pressure percentage (0 to 100)
     */
    getPressurePercent() {
      return this.currentPressure / this.config.maxPressure * 100;
    }
    /**
     * @returns {{pressure: number, percent: number, isSpraying: boolean, isOverheated: boolean, state: string}}
     */
    getStatus() {
      return {
        pressure: Math.max(0, this.currentPressure),
        percent: Math.max(0, Math.min(100, this.getPressurePercent())),
        isSpraying: this.isSpraying,
        isOverheated: this.isOverheated,
        state: this.state
      };
    }
    reset() {
      this.currentPressure = this.config.maxPressure;
      this.isSpraying = false;
      this.isOverheated = false;
      this.isHittingStatic = false;
      this.lastSprayTime = 0;
      this.tickTimer = 0;
      this.state = "idle";
    }
  };
  function evaluateConeCast(handPos, lookDir, targetPos, maxRange, coneAngleDeg) {
    const toTarget = {
      x: targetPos.x - handPos.x,
      y: targetPos.y - handPos.y,
      z: targetPos.z - handPos.z
    };
    const distSq = toTarget.x ** 2 + toTarget.y ** 2 + toTarget.z ** 2;
    if (distSq > maxRange * maxRange) return false;
    const dist = Math.sqrt(distSq);
    if (dist < 1e-4) return true;
    const normalizedToTarget = {
      x: toTarget.x / dist,
      y: toTarget.y / dist,
      z: toTarget.z / dist
    };
    const dropFactor = dist / maxRange * 0.15;
    const adjustedLookDir = {
      x: lookDir.x,
      y: lookDir.y - dropFactor,
      z: lookDir.z
    };
    const adjMag = Math.hypot(adjustedLookDir.x, adjustedLookDir.y, adjustedLookDir.z) || 1;
    const normAdjLook = {
      x: adjustedLookDir.x / adjMag,
      y: adjustedLookDir.y / adjMag,
      z: adjustedLookDir.z / adjMag
    };
    const dot = normalizedToTarget.x * normAdjLook.x + normalizedToTarget.y * normAdjLook.y + normalizedToTarget.z * normAdjLook.z;
    const minDot = Math.cos(coneAngleDeg * Math.PI / 180 / 2);
    return dot >= minDot;
  }

  // js/systems/waterSprayVisuals.js
  var WaterSprayVisuals = class {
    constructor(scene) {
      this.scene = scene;
      this.streamGroup = new THREE.Group();
      this.streamGroup.name = "WaterSprayStreams";
      this.scene.add(this.streamGroup);
      this.waterMaterial = new THREE.MeshStandardMaterial({
        color: 3720693,
        emissive: 1607884,
        emissiveIntensity: 0.45,
        roughness: 0.15,
        metalness: 0.1,
        transparent: true,
        opacity: 0.78,
        flatShading: false
      });
      this.foamMaterial = new THREE.MeshBasicMaterial({
        color: 15268095,
        transparent: true,
        opacity: 0.85
      });
      this.splashRingGeom = new THREE.RingGeometry(0.08, 0.28, 16);
      this.splashRingGeom.rotateX(-Math.PI / 2);
      this.splashRingMat = new THREE.MeshBasicMaterial({
        color: 6345980,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
      });
      this.mistParticles = [];
      this.splashRings = [];
      this.maxMist = 60;
      this.maxRings = 24;
      this.dropletGeom = new THREE.SphereGeometry(0.045, 6, 6);
      this.leftStreamMesh = null;
      this.rightStreamMesh = null;
      this.streamSegmentCount = 12;
      this.initStreams();
    }
    initStreams() {
      const dummyCurve = new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 1));
      const geomL = new THREE.TubeGeometry(dummyCurve, this.streamSegmentCount, 0.055, 6, false);
      const geomR = new THREE.TubeGeometry(dummyCurve, this.streamSegmentCount, 0.055, 6, false);
      this.leftStreamMesh = new THREE.Mesh(geomL, this.waterMaterial);
      this.rightStreamMesh = new THREE.Mesh(geomR, this.waterMaterial);
      this.leftStreamMesh.visible = false;
      this.rightStreamMesh.visible = false;
      this.streamGroup.add(this.leftStreamMesh);
      this.streamGroup.add(this.rightStreamMesh);
    }
    /**
     * Update active water jets and particle physics
     * @param {number} dt - Frame delta time
     * @param {boolean} isSpraying - Controller spray active
     * @param {THREE.Vector3} socketL - Left nozzle world position
     * @param {THREE.Vector3} socketR - Right nozzle world position
     * @param {THREE.Vector3} aimDir - Aim direction vector
     * @param {number} effectiveRange - Spray range in meters
     * @param {THREE.Vector3|null} [hitPoint] - Optional obstacle contact point
     */
    update(dt, isSpraying, socketL, socketR, aimDir, effectiveRange = 10, hitPoint = null) {
      if (isSpraying && socketL && socketR && aimDir) {
        this.leftStreamMesh.visible = true;
        this.rightStreamMesh.visible = true;
        const targetRange = hitPoint ? Math.min(effectiveRange, socketL.distanceTo(hitPoint)) : effectiveRange;
        this.updateStreamGeometry(this.leftStreamMesh, socketL, aimDir, targetRange, -0.15);
        this.updateStreamGeometry(this.rightStreamMesh, socketR, aimDir, targetRange, 0.15);
        this.spawnMistDroplets(socketL, socketR, aimDir, targetRange);
        const impactPos = hitPoint ? hitPoint.clone() : socketL.clone().addScaledVector(aimDir, targetRange);
        impactPos.y = Math.max(0.02, impactPos.y - targetRange * 0.12);
        this.spawnImpactSplash(impactPos);
      } else {
        this.leftStreamMesh.visible = false;
        this.rightStreamMesh.visible = false;
      }
      for (let i = this.mistParticles.length - 1; i >= 0; i--) {
        const p = this.mistParticles[i];
        p.life -= dt;
        if (p.life <= 0) {
          this.scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          this.mistParticles.splice(i, 1);
          continue;
        }
        p.mesh.position.addScaledVector(p.velocity, dt);
        p.velocity.y -= 7.5 * dt;
        const progress = p.life / p.maxLife;
        p.mesh.scale.setScalar(progress * (p.initialScale || 1));
        if (p.mesh.material) {
          p.mesh.material.opacity = progress * 0.85;
        }
      }
      for (let i = this.splashRings.length - 1; i >= 0; i--) {
        const r = this.splashRings[i];
        r.life -= dt;
        if (r.life <= 0) {
          this.scene.remove(r.mesh);
          this.splashRings.splice(i, 1);
          continue;
        }
        const progress = 1 - r.life / r.maxLife;
        const scale = 1 + progress * 2.4;
        r.mesh.scale.set(scale, scale, scale);
        r.mesh.material.opacity = (1 - progress) * 0.75;
      }
    }
    /**
     * Updates tube geometry with parabolic ballistic arc
     */
    updateStreamGeometry(tubeMesh, origin, aimDir, range, lateralOffset = 0) {
      const points = [];
      const numPoints = 8;
      const step = range / (numPoints - 1);
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(aimDir, up).normalize();
      for (let i = 0; i < numPoints; i++) {
        const dist = i * step;
        const progress = dist / (range || 1);
        const drop = progress ** 1.7 * (range * 0.14);
        const convergeFactor = Math.max(0, 1 - progress * 1.5);
        const lat = lateralOffset * convergeFactor;
        const pt = origin.clone().addScaledVector(aimDir, dist).addScaledVector(right, lat);
        pt.y -= drop;
        if (pt.y < 0.05) pt.y = 0.05;
        points.push(pt);
      }
      const curve = new THREE.CatmullRomCurve3(points);
      if (tubeMesh.geometry) tubeMesh.geometry.dispose();
      tubeMesh.geometry = new THREE.TubeGeometry(curve, 10, 0.05, 6, false);
    }
    spawnMistDroplets(socketL, socketR, aimDir, range) {
      if (this.mistParticles.length >= this.maxMist) return;
      const count = 2;
      for (let i = 0; i < count; i++) {
        const isLeft = Math.random() < 0.5;
        const origin = isLeft ? socketL : socketR;
        const progress = 0.2 + Math.random() * 0.75;
        const dist = progress * range;
        const pos = origin.clone().addScaledVector(aimDir, dist);
        pos.x += (Math.random() - 0.5) * 0.35;
        pos.y -= progress ** 1.7 * (range * 0.14) + (Math.random() - 0.5) * 0.2;
        pos.z += (Math.random() - 0.5) * 0.35;
        const mat = this.foamMaterial.clone();
        const mesh = new THREE.Mesh(this.dropletGeom, mat);
        mesh.position.copy(pos);
        const scale = 0.6 + Math.random() * 0.8;
        mesh.scale.setScalar(scale);
        this.scene.add(mesh);
        this.mistParticles.push({
          mesh,
          velocity: aimDir.clone().multiplyScalar(2 + Math.random() * 3).add(new THREE.Vector3(
            (Math.random() - 0.5) * 1.2,
            Math.random() * 1,
            (Math.random() - 0.5) * 1.2
          )),
          life: 0.35 + Math.random() * 0.25,
          maxLife: 0.6,
          initialScale: scale
        });
      }
    }
    spawnImpactSplash(impactPos) {
      if (this.splashRings.length >= this.maxRings) return;
      if (Math.random() < 0.45) {
        const mat = this.splashRingMat.clone();
        const ring = new THREE.Mesh(this.splashRingGeom, mat);
        ring.position.copy(impactPos);
        ring.position.y = 0.03;
        this.scene.add(ring);
        this.splashRings.push({
          mesh: ring,
          life: 0.45,
          maxLife: 0.45
        });
      }
      for (let i = 0; i < 2; i++) {
        if (this.mistParticles.length >= this.maxMist) break;
        const mat = this.foamMaterial.clone();
        const mesh = new THREE.Mesh(this.dropletGeom, mat);
        mesh.position.copy(impactPos);
        mesh.position.y += 0.08;
        const scale = 0.8 + Math.random() * 0.6;
        mesh.scale.setScalar(scale);
        this.scene.add(mesh);
        const theta = Math.random() * Math.PI * 2;
        const spd = 1.2 + Math.random() * 2;
        this.mistParticles.push({
          mesh,
          velocity: new THREE.Vector3(
            Math.cos(theta) * spd,
            1.8 + Math.random() * 1.8,
            Math.sin(theta) * spd
          ),
          life: 0.4 + Math.random() * 0.3,
          maxLife: 0.7,
          initialScale: scale
        });
      }
    }
    clear() {
      this.leftStreamMesh.visible = false;
      this.rightStreamMesh.visible = false;
      this.mistParticles.forEach((p) => {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
      });
      this.mistParticles = [];
      this.splashRings.forEach((r) => this.scene.remove(r.mesh));
      this.splashRings = [];
    }
  };

  // js/network.js
  var NetworkClient = class {
    constructor() {
      this.ws = null;
      this.isConnected = false;
      this.playerId = null;
      this.roomCode = null;
      this.isHost = false;
      this.playerName = "Player";
      this.players = [];
      this.messageQueue = [];
      this.lastMoveSent = 0;
      this.moveThrottleMs = 40;
      this.onConnected = null;
      this.onRoomCreated = null;
      this.onRoomJoined = null;
      this.onJoinError = null;
      this.onRoomUpdate = null;
      this.onGameStart = null;
      this.onPlayerMove = null;
      this.onPlayerTagged = null;
      this.onGameOver = null;
      this.onPlayerLeft = null;
      this.onPhaseChange = null;
      this.onTaunt = null;
      if (typeof window !== "undefined") {
        this.connect();
      }
    }
    connect() {
      if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
        return;
      }
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      let host = window.location.host;
      if (!host || host === "") host = "localhost:8080";
      const wsUrl = `${protocol}//${host}`;
      console.log(`[Network] Connecting to ${wsUrl}...`);
      try {
        this.ws = new WebSocket(wsUrl);
      } catch (err) {
        console.error("[Network] WebSocket connection failed:", err);
        return;
      }
      this.ws.onopen = () => {
        console.log("[Network] Connected to multiplayer server");
        this.isConnected = true;
        while (this.messageQueue.length > 0) {
          const queued = this.messageQueue.shift();
          this.ws.send(JSON.stringify(queued));
        }
        if (this.onConnected) this.onConnected();
      };
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (err) {
          console.error("[Network] Malformed message received:", err);
        }
      };
      this.ws.onclose = () => {
        console.log("[Network] Disconnected from server");
        this.isConnected = false;
        this.playerId = null;
        this.roomCode = null;
      };
      this.ws.onerror = (err) => {
        console.warn("[Network] WebSocket error:", err);
      };
    }
    send(data) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(data));
      } else {
        this.messageQueue.push(data);
        if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
          this.connect();
        }
      }
    }
    createRoom(playerName = "Host") {
      this.playerName = playerName;
      this.send({
        type: "CREATE_ROOM",
        playerName
      });
    }
    joinRoom(roomCode, playerName = "Friend") {
      this.playerName = playerName;
      this.send({
        type: "JOIN_ROOM",
        roomCode: String(roomCode).toUpperCase().trim(),
        playerName
      });
    }
    leaveRoom() {
      this.send({ type: "LEAVE_ROOM" });
      this.roomCode = null;
      this.isHost = false;
      this.players = [];
    }
    startGame() {
      this.send({ type: "START_GAME" });
    }
    sendMove(pos, rot, morph, isFrozen = false, isOrientationLocked = false) {
      const now = performance.now();
      if (now - this.lastMoveSent < this.moveThrottleMs) return;
      this.lastMoveSent = now;
      this.send({
        type: "MOVE",
        pos: {
          x: Math.round(pos.x * 100) / 100,
          y: Math.round(pos.y * 100) / 100,
          z: Math.round(pos.z * 100) / 100
        },
        rot: Math.round(rot * 100) / 100,
        morph,
        isFrozen,
        isOrientationLocked
      });
    }
    confirmTag(targetId) {
      this.send({
        type: "TAG_CONFIRMED",
        targetId
      });
    }
    sendPhaseChange(phase, timer = 0) {
      this.send({
        type: "PHASE_CHANGE",
        phase,
        timer
      });
    }
    sendTimeExpired() {
      this.send({ type: "TIME_EXPIRED" });
    }
    sendTaunt(pos, massClass = "micro") {
      this.send({
        type: "TAUNT",
        pos: { x: pos.x, y: pos.y, z: pos.z },
        massClass
      });
    }
    requestRematch() {
      this.send({ type: "REMATCH" });
    }
    handleMessage(data) {
      switch (data.type) {
        case "ROOM_CREATED":
          this.roomCode = data.roomCode;
          this.playerId = data.playerId;
          this.isHost = true;
          this.players = data.players || [];
          if (this.onRoomCreated) this.onRoomCreated(data);
          break;
        case "ROOM_JOINED":
          this.roomCode = data.roomCode;
          this.playerId = data.playerId;
          this.isHost = false;
          this.players = data.players || [];
          if (this.onRoomJoined) this.onRoomJoined(data);
          break;
        case "JOIN_ERROR":
          if (this.onJoinError) this.onJoinError(data.message);
          break;
        case "ROOM_UPDATE":
          this.players = data.players || [];
          if (this.onRoomUpdate) this.onRoomUpdate(data);
          break;
        case "GAME_START":
          this.players = data.players || [];
          if (this.onGameStart) this.onGameStart(data);
          break;
        case "PLAYER_MOVE":
          if (this.onPlayerMove) this.onPlayerMove(data);
          break;
        case "PLAYER_TAGGED":
          if (this.onPlayerTagged) this.onPlayerTagged(data);
          break;
        case "GAME_OVER":
          if (this.onGameOver) this.onGameOver(data);
          break;
        case "PLAYER_LEFT":
          this.players = data.players || [];
          if (this.onPlayerLeft) this.onPlayerLeft(data);
          break;
        case "PHASE_CHANGE":
          if (this.onPhaseChange) this.onPhaseChange(data);
          break;
        case "TAUNT":
          if (this.onTaunt) this.onTaunt(data);
          break;
        default:
          break;
      }
    }
  };
  var network = new NetworkClient();

  // js/main.js
  var MushikaMandapGame = class {
    constructor() {
      this.canvas = document.getElementById("game-canvas");
      if (!this.canvas) {
        this.canvas = document.createElement("canvas");
        this.canvas.id = "game-canvas";
        const container = document.getElementById("game-container") || document.body;
        container.appendChild(this.canvas);
      }
      this.uiRoot = document.getElementById("ui-root");
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(1708555);
      this.scene.fog = new THREE.FogExp2(1708555, 0.022);
      this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        powerPreference: "high-performance"
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = false;
      this.particles = new ParticleSystem(this.scene);
      this.map = new MandapMap(this.scene);
      this.mandapMap = this.map;
      this.followCamera = new FollowCamera(this.camera);
      this.input = new InputManager(this.canvas, this.uiRoot);
      this.state = new GameStateManager();
      this.paintSystem = new PaintSystem(this.scene, this.camera);
      this.blessSystem = new BlessSystem(this.scene, this.camera, this.particles);
      this.aiHiders = new AIHiderSystem(this.scene);
      this.aiSeeker = new AISeekerSystem(this.scene, this.blessSystem);
      this.sound = sound;
      this.waterController = new WaterSprayController();
      this.waterVisuals = new WaterSprayVisuals(this.scene);
      this.waterController.onSputter = () => sound.playWaterEmptySputter();
      this.waterController.onHitHider = () => sound.playWaterSplash(1.2);
      this.waterController.onHitStatic = () => sound.playWaterSplash(0.5);
      this.playerMushika = null;
      this.playerBala = null;
      this.isSpectating = false;
      this.spectateTargets = [];
      this.spectateIndex = 0;
      this.lookRaycaster = new THREE.Raycaster();
      this.currentLookTarget = null;
      this.lastTime = performance.now();
      this.dt = 0;
      sound.setMute(storage.data.muted);
      this.network = network;
      this.isMultiplayer = false;
      this.multiplayerRole = null;
      this.remotePlayers = /* @__PURE__ */ new Map();
      this.initUI();
      this.bindEvents();
      this.initNetwork();
      this.sound = sound;
      this.evaluateConeCast = evaluateConeCast;
      window.game = this;
      window.sound = sound;
      window.addEventListener("resize", () => this.onResize());
      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);
    }
    initUI() {
      this.updateTitleScoreDisplay();
      this.initChameleonStudio();
      const btnAudio = document.getElementById("btn-settings-audio");
      if (btnAudio) {
        btnAudio.textContent = storage.data.muted ? "Sound: OFF" : "Sound: ON";
        btnAudio.classList.toggle("active", !storage.data.muted);
      }
    }
    bindEvents() {
      const unlockAudio = () => {
        sound.unlock();
        window.removeEventListener("click", unlockAudio);
        window.removeEventListener("touchstart", unlockAudio);
        window.removeEventListener("keydown", unlockAudio);
      };
      window.addEventListener("click", unlockAudio);
      window.addEventListener("touchstart", unlockAudio);
      window.addEventListener("keydown", unlockAudio);
      document.getElementById("btn-menu-solo")?.addEventListener("click", () => {
        sound.unlock();
        document.getElementById("lobby-top-menu").style.display = "none";
        document.getElementById("lobby-solo-menu").style.display = "flex";
        sound.playUiClick();
      });
      document.getElementById("btn-solo-back")?.addEventListener("click", () => {
        document.getElementById("lobby-solo-menu").style.display = "none";
        document.getElementById("lobby-top-menu").style.display = "flex";
        sound.playUiClick();
      });
      document.getElementById("btn-solo-hider")?.addEventListener("click", () => {
        sound.unlock();
        this.startHiderGame();
      });
      document.getElementById("btn-solo-seeker")?.addEventListener("click", () => {
        sound.unlock();
        this.startSeekerGame();
      });
      document.getElementById("btn-menu-friends")?.addEventListener("click", () => {
        sound.unlock();
        document.getElementById("lobby-top-menu").style.display = "none";
        document.getElementById("lobby-friends-menu").style.display = "flex";
        sound.playUiClick();
      });
      document.getElementById("btn-friends-back")?.addEventListener("click", () => {
        document.getElementById("lobby-friends-menu").style.display = "none";
        document.getElementById("lobby-top-menu").style.display = "flex";
        sound.playUiClick();
      });
      document.getElementById("btn-friends-create")?.addEventListener("click", () => {
        sound.unlock();
        this.network.connect();
        const statusLabel = document.getElementById("party-status-label");
        if (statusLabel) statusLabel.textContent = "CREATING ROOM...";
        this.network.createRoom("Host");
        sound.playUiClick();
      });
      document.getElementById("btn-friends-join")?.addEventListener("click", () => {
        sound.unlock();
        this.network.connect();
        const errEl = document.getElementById("join-error-msg");
        if (errEl) errEl.style.display = "none";
        document.getElementById("lobby-friends-menu").style.display = "none";
        document.getElementById("lobby-join-input").style.display = "flex";
        document.getElementById("join-code-input")?.focus();
        sound.playUiClick();
      });
      document.getElementById("btn-join-confirm")?.addEventListener("click", () => {
        const rawCode = document.getElementById("join-code-input")?.value?.toUpperCase().trim();
        const errEl = document.getElementById("join-error-msg");
        if (!rawCode || rawCode.length < 3) {
          if (errEl) {
            errEl.textContent = "Please enter a valid 4-letter room code";
            errEl.style.display = "block";
          }
          return;
        }
        if (errEl) errEl.style.display = "none";
        this.network.connect();
        this.network.joinRoom(rawCode, "Friend");
        sound.playUiClick();
      });
      document.getElementById("btn-join-back")?.addEventListener("click", () => {
        document.getElementById("lobby-join-input").style.display = "none";
        document.getElementById("lobby-friends-menu").style.display = "flex";
        sound.playUiClick();
      });
      const shareInviteLink = () => {
        const code = document.getElementById("party-code-display")?.textContent?.trim();
        if (!code || code === "ABCD") return;
        const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${code}`;
        if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
          navigator.share({
            title: "Mushika Mandap \u2014 Prop Hunt",
            text: `\u{1FA94} Come play Mushika Mandap Prop Hunt with me! Click link to join Room ${code}:`,
            url: inviteUrl
          }).catch(() => {
            this.copyInviteLink(inviteUrl);
          });
        } else {
          this.copyInviteLink(inviteUrl);
        }
      };
      document.getElementById("btn-party-share-link")?.addEventListener("click", () => {
        shareInviteLink();
      });
      document.getElementById("party-code-display")?.addEventListener("click", () => {
        shareInviteLink();
      });
      document.getElementById("btn-party-start")?.addEventListener("click", () => {
        sound.unlock();
        this.network.startGame();
        sound.playTempleBell(1);
      });
      document.getElementById("btn-party-leave")?.addEventListener("click", () => {
        this.network.leaveRoom();
        document.getElementById("lobby-party-room").style.display = "none";
        document.getElementById("lobby-friends-menu").style.display = "flex";
        document.querySelector(".lobby-card")?.classList.remove("in-party-mode");
        try {
          window.history.replaceState({}, "", window.location.pathname);
        } catch (e) {
        }
        sound.playUiClick();
      });
      document.getElementById("btn-play-hotseat")?.addEventListener("click", () => {
        sound.unlock();
        this.startHotSeatGame();
      });
      document.getElementById("btn-open-tutorial")?.addEventListener("click", () => {
        document.getElementById("modal-tutorial")?.classList.remove("hidden");
      });
      document.getElementById("btn-close-tutorial")?.addEventListener("click", () => {
        document.getElementById("modal-tutorial")?.classList.add("hidden");
        storage.setSeenTutorial(true);
      });
      document.getElementById("btn-open-settings")?.addEventListener("click", () => {
        document.getElementById("modal-settings")?.classList.remove("hidden");
      });
      document.getElementById("btn-close-settings")?.addEventListener("click", () => {
        document.getElementById("modal-settings")?.classList.add("hidden");
      });
      document.getElementById("btn-settings-audio")?.addEventListener("click", (e) => {
        const next = !storage.data.muted;
        storage.setMuted(next);
        sound.setMute(next);
        e.target.textContent = next ? "Sound: OFF" : "Sound: ON";
        e.target.classList.toggle("active", !next);
      });
      document.getElementById("btn-reset-scores")?.addEventListener("click", () => {
        storage.resetScores();
        this.updateTitleScoreDisplay();
      });
      document.getElementById("btn-audio-toggle")?.addEventListener("click", () => {
        const next = !storage.data.muted;
        storage.setMuted(next);
        sound.setMute(next);
        document.getElementById("btn-audio-toggle").textContent = next ? "OFF" : "SFX";
      });
      document.getElementById("btn-pause-toggle")?.addEventListener("click", () => {
        this.state.togglePause();
      });
      document.getElementById("btn-hotseat-ready")?.addEventListener("click", () => {
        document.getElementById("modal-hotseat")?.classList.add("hidden");
        this.startHotSeatSeekPhase();
      });
      document.getElementById("btn-rematch")?.addEventListener("click", () => {
        document.getElementById("modal-result")?.classList.add("hidden");
        if (this.isMultiplayer) {
          this.network.requestRematch();
          return;
        }
        if (this.state.gameMode === "seeker") this.startSeekerGame();
        else if (this.state.gameMode === "hotseat") this.startHotSeatGame();
        else this.startHiderGame();
      });
      document.getElementById("btn-swap-role")?.addEventListener("click", () => {
        document.getElementById("modal-result")?.classList.add("hidden");
        if (this.isMultiplayer) {
          this.network.requestRematch();
          return;
        }
        if (this.state.gameMode === "seeker") this.startHiderGame();
        else this.startSeekerGame();
      });
      document.getElementById("btn-result-title")?.addEventListener("click", () => {
        document.getElementById("modal-result")?.classList.add("hidden");
        this.returnToTitle();
      });
      const triggerPropSwitch = () => {
        if (this.currentLookTarget) {
          this.triggerPlayerMorph(this.currentLookTarget.object || this.currentLookTarget.propType);
        }
      };
      document.getElementById("btn-prop-switch")?.addEventListener("click", triggerPropSwitch);
      document.getElementById("btn-touch-switch")?.addEventListener("click", triggerPropSwitch);
      document.getElementById("btn-seeker-tag")?.addEventListener("click", () => {
        this.performSeekerBless();
      });
      const triggerRevert = () => {
        const isHiderPlayable = this.playerMushika && !this.isSpectating && (this.state.currentPhase === GAME_PHASES.HIDE || this.state.currentPhase === GAME_PHASES.SEEK && this.state.gameMode !== "hotseat");
        if (isHiderPlayable) {
          this.playerMushika.revertToMouse();
          sound.playUiClick();
          this.particles.spawnBlessingBurst(this.playerMushika.root.position);
          this.setMorphControlsVisible(false);
        }
      };
      document.getElementById("btn-revert-morph")?.addEventListener("click", triggerRevert);
      const triggerFreeze = () => {
        if (this.playerMushika) {
          const frozen = this.playerMushika.toggleRigidFreeze(sound, this.particles);
          this.showSeekerToast(frozen ? "\u{1F512} Prop Frozen Rigid! Free Camera Orbit" : "\u{1F513} Prop Unfrozen! Bolt!", "\u{1F9F1}", 1600);
          document.getElementById("btn-prop-freeze")?.classList.toggle("active-freeze", frozen);
          document.getElementById("btn-touch-freeze")?.classList.toggle("active-freeze", frozen);
        }
      };
      document.getElementById("btn-prop-freeze")?.addEventListener("click", triggerFreeze);
      document.getElementById("btn-touch-freeze")?.addEventListener("click", triggerFreeze);
      const triggerLock = () => {
        if (this.playerMushika) {
          const locked = this.playerMushika.toggleOrientationLock();
          this.showSeekerToast(locked ? "\u{1F9ED} Orientation Locked! Camera orbits freely [L]" : "\u{1F9ED} Orientation Free [L]", "\u{1F504}", 1600);
          document.getElementById("btn-prop-lock")?.classList.toggle("active-freeze", locked);
        }
      };
      document.getElementById("btn-prop-lock")?.addEventListener("click", triggerLock);
      const triggerUnstuck = () => {
        if (this.playerMushika) {
          this.playerMushika.unstuck(this.map.obstacles, this.particles, sound);
          this.showSeekerToast("\u{1F300} Unstuck! Popped to clearance", "\u{1F4A8}", 1600);
        }
      };
      document.getElementById("btn-prop-unstuck")?.addEventListener("click", triggerUnstuck);
      document.getElementById("btn-touch-unstuck")?.addEventListener("click", triggerUnstuck);
      const triggerTaunt = () => {
        if (this.playerMushika) {
          const listenerPos = this.playerBala ? this.playerBala.root.position : this.camera.position;
          this.playerMushika.triggerTaunt(this.particles, sound, listenerPos, this.followCamera.yaw);
          this.showSeekerToast("\u{1F514} Taunt Emitted! Directional Echo", "\u{1F389}", 1400);
          if (this.isMultiplayer) {
            this.network.sendTaunt(this.playerMushika.root.position, this.playerMushika.massClass);
          }
        }
      };
      document.getElementById("btn-prop-taunt")?.addEventListener("click", triggerTaunt);
      document.getElementById("btn-touch-taunt")?.addEventListener("click", triggerTaunt);
      document.getElementById("btn-touch-lock")?.addEventListener("click", triggerLock);
      const triggerChameleonBlend = () => {
        const isHiderPlayable = this.playerMushika && !this.isSpectating && (this.state.currentPhase === GAME_PHASES.HIDE || this.state.currentPhase === GAME_PHASES.SEEK && this.state.gameMode !== "hotseat");
        if (isHiderPlayable) {
          const pos = this.playerMushika.root.position;
          const normal = new THREE.Vector3(0, 1, 0);
          const sampled = this.paintSystem.sampleSurfaceColorAt(pos, normal, this.playerMushika.root);
          this.paintSystem.applyChameleonAutoBlend(this.playerMushika, sampled);
          this.particles.spawnBlessingBurst(pos);
        }
      };
      const btnTouchSpray = document.getElementById("btn-touch-bless");
      if (btnTouchSpray) {
        const startSprayHold = (e) => {
          e.preventDefault();
          this.input.setHoldingSpray(true);
        };
        const stopSprayHold = (e) => {
          e.preventDefault();
          this.input.setHoldingSpray(false);
        };
        btnTouchSpray.addEventListener("touchstart", startSprayHold, { passive: false });
        btnTouchSpray.addEventListener("touchend", stopSprayHold, { passive: false });
        btnTouchSpray.addEventListener("touchcancel", stopSprayHold, { passive: false });
        btnTouchSpray.addEventListener("mousedown", startSprayHold);
        window.addEventListener("mouseup", () => this.input.setHoldingSpray(false));
        btnTouchSpray.addEventListener("click", (e) => {
          e.preventDefault();
          this.performSeekerBless();
        });
      }
      document.getElementById("btn-touch-mark")?.addEventListener("click", () => {
        if (this.playerBala) {
          this.particles.dropSuspectPetal(this.playerBala.root.position);
          sound.playUiClick();
        }
      });
      document.getElementById("btn-touch-diya")?.addEventListener("click", () => {
        this.blessSystem.toggleDiyaGlow();
      });
      const triggerHop = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (this.playerMushika) {
          this.performHop(this.playerMushika);
        } else if (this.playerBala) {
          this.performHop(this.playerBala);
        }
      };
      const btnJump = document.getElementById("btn-touch-jump");
      if (btnJump) {
        btnJump.addEventListener("touchstart", triggerHop, { passive: false });
        btnJump.addEventListener("click", triggerHop);
      }
      const btnHop = document.getElementById("btn-touch-hop");
      if (btnHop && btnHop !== btnJump) {
        btnHop.addEventListener("touchstart", triggerHop, { passive: false });
        btnHop.addEventListener("click", triggerHop);
      }
      this.state.onPhaseChange = (phase, mode) => this.handlePhaseChange(phase, mode);
      this.state.onTimerUpdate = (timer, phase) => this.handleTimerUpdate(timer, phase);
      this.state.onResult = (winner, stats) => this.handleResult(winner, stats);
    }
    copyInviteLink(url) {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          this.showInviteCopiedToast();
        }).catch(() => {
          this.fallbackCopy(url);
        });
      } else {
        this.fallbackCopy(url);
      }
    }
    fallbackCopy(text) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        this.showInviteCopiedToast();
      } catch (e) {
      }
      document.body.removeChild(ta);
    }
    showInviteCopiedToast() {
      const toast = document.getElementById("party-copy-toast");
      if (toast) {
        toast.textContent = "\u2713 Invite Link Copied to Clipboard!";
        toast.style.display = "block";
        setTimeout(() => {
          toast.style.display = "none";
        }, 2500);
      }
      sound.playUiClick();
    }
    initNetwork() {
      this.network.onRoomCreated = (data) => {
        const disp = document.getElementById("party-code-display");
        if (disp) disp.textContent = data.roomCode;
        document.getElementById("lobby-friends-menu").style.display = "none";
        document.getElementById("lobby-party-room").style.display = "flex";
        document.querySelector(".lobby-card")?.classList.add("in-party-mode");
        const statusLabel = document.getElementById("party-status-label");
        if (statusLabel) statusLabel.textContent = "ROOM CREATED! SHARE INVITE LINK";
        const note = document.getElementById("party-status-note");
        if (note) note.textContent = `Invite friends by sharing the link below or code: ${data.roomCode}`;
        this.updateRosterUI(data.players);
        const btnStart = document.getElementById("btn-party-start");
        if (btnStart) btnStart.style.display = "inline-flex";
        try {
          window.history.replaceState({}, "", `?room=${data.roomCode}`);
        } catch (e) {
        }
        const waBtn = document.getElementById("btn-party-whatsapp");
        if (waBtn) {
          const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${data.roomCode}`;
          waBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent("\u{1FA94} Play Mushika Mandap Prop Hunt with me! Click to join:\n" + inviteUrl)}`;
        }
        sound.playUiClick();
      };
      this.network.onRoomJoined = (data) => {
        const disp = document.getElementById("party-code-display");
        if (disp) disp.textContent = data.roomCode;
        document.getElementById("lobby-top-menu").style.display = "none";
        document.getElementById("lobby-solo-menu").style.display = "none";
        document.getElementById("lobby-friends-menu").style.display = "none";
        document.getElementById("lobby-join-input").style.display = "none";
        document.getElementById("lobby-party-room").style.display = "flex";
        document.querySelector(".lobby-card")?.classList.add("in-party-mode");
        const statusLabel = document.getElementById("party-status-label");
        if (statusLabel) statusLabel.textContent = "CONNECTED TO PARTY!";
        const note = document.getElementById("party-status-note");
        if (note) note.textContent = "Waiting for host to launch the match...";
        this.updateRosterUI(data.players);
        const btnStart = document.getElementById("btn-party-start");
        if (btnStart) btnStart.style.display = "none";
        try {
          window.history.replaceState({}, "", `?room=${data.roomCode}`);
        } catch (e) {
        }
        const waBtn = document.getElementById("btn-party-whatsapp");
        if (waBtn) {
          const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${data.roomCode}`;
          waBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent("\u{1FA94} Play Mushika Mandap Prop Hunt with me! Click to join:\n" + inviteUrl)}`;
        }
        sound.playTempleBell(1);
      };
      this.network.onJoinError = (msg) => {
        const errEl = document.getElementById("join-error-msg");
        if (errEl) {
          errEl.textContent = msg || "Could not join room";
          errEl.style.display = "block";
        }
        document.getElementById("lobby-party-room").style.display = "none";
        document.getElementById("lobby-join-input").style.display = "flex";
        document.querySelector(".lobby-card")?.classList.remove("in-party-mode");
        sound.playPaintStroke();
      };
      this.network.onRoomUpdate = (data) => {
        this.updateRosterUI(data.players);
        if (data.message) {
          this.showSeekerToast(data.message, "\u{1F465}", 2500);
        }
        if (this.network.isHost && data.players.length >= 2) {
          const btnStart = document.getElementById("btn-party-start");
          if (btnStart) {
            btnStart.style.display = "inline-flex";
            btnStart.classList.add("pulse-glow");
          }
          const statusLabel = document.getElementById("party-status-label");
          if (statusLabel) statusLabel.textContent = "FRIEND ASSEMBLED! READY TO START";
        }
      };
      this.network.onGameStart = (data) => {
        this.startMultiplayerGame(data);
      };
      this.network.onPlayerMove = (data) => {
        this.updateRemotePlayer(data);
      };
      this.network.onPlayerTagged = (data) => {
        this.handlePlayerTagged(data);
      };
      this.network.onGameOver = (data) => {
        this.handleMultiplayerGameOver(data);
      };
      this.network.onPlayerLeft = (data) => {
        if (data.id && this.remotePlayers.has(data.id)) {
          const rp = this.remotePlayers.get(data.id);
          if (rp.entity && rp.entity.root) {
            this.scene.remove(rp.entity.root);
          }
          this.remotePlayers.delete(data.id);
        }
        this.updateRosterUI(data.players);
        this.showSeekerToast(data.message || "Player left room", "\u{1F44B}", 2200);
      };
      this.network.onPhaseChange = (data) => {
        if (this.isMultiplayer && this.state) {
          if (this.state.currentPhase !== data.phase) {
            this.state.setPhase(data.phase);
          }
          if (data.timer !== void 0) {
            this.state.phaseTimer = data.timer;
          }
          if (data.phase === "SEEK") {
            if (this.multiplayerRole === "seeker") {
              this.showSeekerToast("\u{1F549}\uFE0F AARTI COMPLETE! Search & bless the disguised hiders!", "\u{1F50D}", 4e3);
            } else {
              this.showSeekerToast("\u{1F440} SEEKER IS UNLEASHED! Stay hidden & motionless!", "\u{1F92B}", 4e3);
            }
          }
        }
      };
      this.network.onTaunt = (data) => {
        const listenerPos = this.playerBala ? this.playerBala.root.position : this.playerMushika ? this.playerMushika.root.position : this.camera.position;
        const pos = new THREE.Vector3(data.pos.x, data.pos.y, data.pos.z);
        this.particles.spawnTauntRing(pos);
        const soundType = data.massClass === "heavy" ? "dhol" : "bell";
        sound.playDirectionalChime(pos, listenerPos, this.followCamera.yaw, soundType);
      };
      const urlParams = new URLSearchParams(window.location.search);
      const autoRoom = urlParams.get("room") || (window.location.hash ? window.location.hash.replace("#", "") : null);
      if (autoRoom && autoRoom.trim().length >= 3) {
        const cleanRoom = autoRoom.trim().toUpperCase().slice(0, 4);
        console.log(`[Network] Auto-joining room from URL: ${cleanRoom}`);
        document.getElementById("lobby-top-menu").style.display = "none";
        document.getElementById("lobby-solo-menu").style.display = "none";
        document.getElementById("lobby-friends-menu").style.display = "none";
        document.getElementById("lobby-party-room").style.display = "flex";
        document.querySelector(".lobby-card")?.classList.add("in-party-mode");
        const disp = document.getElementById("party-code-display");
        if (disp) disp.textContent = cleanRoom;
        const roster = document.getElementById("party-roster-list");
        if (roster) {
          roster.innerHTML = `<div class="party-member"><span class="member-dot"></span> Joining room ${cleanRoom}...</div>`;
        }
        const btnStart = document.getElementById("btn-party-start");
        if (btnStart) btnStart.style.display = "none";
        this.network.connect();
        this.network.joinRoom(cleanRoom, "Friend");
      }
    }
    updateRosterUI(players = []) {
      const countEl = document.getElementById("party-player-count");
      if (countEl) countEl.textContent = players.length;
      const rosterEl = document.getElementById("party-roster-list");
      if (!rosterEl) return;
      rosterEl.innerHTML = "";
      players.forEach((p) => {
        const row = document.createElement("div");
        row.className = "party-member";
        const isSelf = p.id === this.network.playerId;
        const hostBadge = p.isHost ? " (Host)" : "";
        const selfBadge = isSelf ? " [YOU]" : "";
        row.innerHTML = `<span class="member-dot ready"></span> ${p.name}${hostBadge}${selfBadge} \u2014 READY`;
        rosterEl.appendChild(row);
      });
    }
    startMultiplayerGame(data) {
      document.getElementById("modal-title")?.classList.add("hidden");
      document.querySelector(".lobby-card")?.classList.remove("in-party-mode");
      this.cleanupEntities();
      this.isMultiplayer = true;
      this.isSpectating = false;
      const myId = this.network.playerId;
      const myRole = data.seekerId === myId ? "seeker" : "hider";
      this.multiplayerRole = myRole;
      console.log(`[Multiplayer] Starting match as ${myRole.toUpperCase()}!`);
      if (myRole === "seeker") {
        this.playerBala = new Bala("bala_player", false);
        this.playerBala.root.position.set(0, 0, 15);
        if (this.playerBala.model) this.playerBala.model.visible = false;
        this.scene.add(this.playerBala.root);
        this.followCamera.yaw = 0;
        this.followCamera.pitch = 0.15;
        this.followCamera.setTargetRole("seeker");
      } else {
        this.playerMushika = new Mushika("mushika_player", false);
        this.playerMushika.root.position.set(0, 0.45, 7);
        this.scene.add(this.playerMushika.root);
        this.followCamera.yaw = 0;
        this.followCamera.pitch = 0.28;
        this.followCamera.setTargetRole("hider");
      }
      this.remotePlayers.clear();
      (data.players || []).forEach((p) => {
        if (p.id !== myId) {
          const isSeeker = p.id === data.seekerId;
          let entity;
          if (isSeeker) {
            entity = new Bala(`bala_${p.id}`, false);
            entity.root.position.set(0, 0, 15);
            if (entity.model) entity.model.visible = true;
          } else {
            entity = new Mushika(`mushika_${p.id}`, false);
            entity.root.position.set(0, 0.45, 7);
          }
          this.scene.add(entity.root);
          this.remotePlayers.set(p.id, {
            id: p.id,
            name: p.name,
            role: isSeeker ? "seeker" : "hider",
            entity,
            targetPos: entity.root.position.clone(),
            targetRot: 0,
            currentMorph: null,
            isTagged: false
          });
        }
      });
      let totalHiders = 0;
      (data.players || []).forEach((p) => {
        if (p.id !== data.seekerId) totalHiders++;
      });
      if ((data.players || []).length <= 1) {
        if (myRole === "seeker") {
          const aiMice = this.aiHiders.spawnAIMice(storage.data.difficulty || "normal", 3);
          totalHiders = aiMice.length;
        }
      }
      const hidersCount = Math.max(1, totalHiders);
      this.state.HIDE_DURATION = data.hideDuration || 45;
      this.state.SEEK_DURATION = data.seekDuration || 60;
      this.state.startRound(myRole, GAME_PHASES.HIDE, hidersCount);
      if (myRole === "seeker") {
        this.showSeekerToast("\u{1F418} You are the SEEKER! Get ready... Hunt begins in 45s!", "\u23F3", 4500);
      } else {
        this.showSeekerToast("\u{1F42D} You are a HIDER! Quick, hide & morph into a temple prop! (45s)", "\u{1FA94}", 4500);
      }
    }
    updateRemotePlayer(data) {
      if (!this.remotePlayers.has(data.id)) return;
      const rp = this.remotePlayers.get(data.id);
      const entity = rp.entity;
      if (!entity || !entity.root) return;
      if (data.pos) {
        rp.targetPos.set(data.pos.x, data.pos.y, data.pos.z);
      }
      if (data.rot !== void 0) {
        rp.targetRot = data.rot;
      }
      if (rp.role === "hider" && entity.setMorph) {
        if (data.morph !== rp.currentMorph) {
          rp.currentMorph = data.morph;
          if (data.morph) {
            entity.setMorph(data.morph);
            this.particles.spawnBlessingBurst(entity.root.position);
          } else {
            entity.revertToMouse();
            this.particles.spawnBlessingBurst(entity.root.position);
          }
        }
        if (data.isFrozen !== void 0) {
          entity.isRigidFrozen = !!data.isFrozen;
        }
      }
    }
    handlePlayerTagged(data) {
      const myId = this.network.playerId;
      this.state.remainingMiceCount = data.remainingHiders;
      const miceCount = document.getElementById("hud-mice-count");
      if (miceCount) miceCount.textContent = `${data.remainingHiders} Left`;
      if (data.targetId === myId) {
        if (this.playerMushika) {
          this.playerMushika.isTagged = true;
          this.particles.spawnBlessingBurst(this.playerMushika.root.position);
        }
        this.showSeekerToast("\u{1F6A8} You were tagged by Bala!", "\u{1F6A8}", 3e3);
        sound.playTempleBell(1.2);
        this.enterSpectateMode();
      } else if (this.remotePlayers.has(data.targetId)) {
        const rp = this.remotePlayers.get(data.targetId);
        rp.isTagged = true;
        if (rp.entity && rp.entity.root) {
          this.particles.spawnBlessingBurst(rp.entity.root.position);
          if (rp.entity.revertToMouse) rp.entity.revertToMouse();
        }
        this.showSeekerToast(`\u{1F389} Tagged ${data.targetName || "Hider"}!`, "\u{1F389}", 3e3);
        sound.playTempleBell(1.2);
      }
    }
    handleMultiplayerGameOver(data) {
      this.state.winner = data.winner;
      if (data.winner === "seeker") {
        storage.recordBalaWin();
      } else {
        storage.recordMushikaWin();
      }
      this.state.setPhase(GAME_PHASES.RESULT);
      this.showSeekerToast(data.message || "Round Complete!", "\u{1F3C6}", 4e3);
    }
    initChameleonStudio() {
      const studio = document.getElementById("chameleon-studio");
      const canvas = document.getElementById("color-wheel-canvas");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = cx - 2;
      const imgData = ctx.createImageData(canvas.width, canvas.height);
      const data = imgData.data;
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const dx = x - cx;
          const dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const idx = (y * canvas.width + x) * 4;
          if (dist <= radius) {
            let angle = Math.atan2(dy, dx) * (180 / Math.PI);
            if (angle < 0) angle += 360;
            const sat = Math.min(1, dist / radius);
            const rgb = PaintSystem.hsvToRgb(angle, sat, 1);
            data[idx] = rgb.r;
            data[idx + 1] = rgb.g;
            data[idx + 2] = rgb.b;
            data[idx + 3] = 255;
          } else {
            data[idx + 3] = 0;
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);
      let isWheelDragging = false;
      const pickColorFromWheel = (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius + 6) {
          let angle = Math.atan2(dy, dx) * (180 / Math.PI);
          if (angle < 0) angle += 360;
          const sat = Math.min(1, Math.max(0, dist / radius));
          const rgb = PaintSystem.hsvToRgb(angle, sat, 1);
          const hex = PaintSystem.rgbToHex(rgb.r, rgb.g, rgb.b);
          this.updateStudioColor(hex);
        }
      };
      canvas.addEventListener("mousedown", (e) => {
        isWheelDragging = true;
        pickColorFromWheel(e.clientX, e.clientY);
      });
      window.addEventListener("mousemove", (e) => {
        if (isWheelDragging) pickColorFromWheel(e.clientX, e.clientY);
      });
      window.addEventListener("mouseup", () => {
        isWheelDragging = false;
      });
      const sliderR = document.getElementById("slider-r");
      const sliderG = document.getElementById("slider-g");
      const sliderB = document.getElementById("slider-b");
      const onSliderChange = () => {
        const r = parseInt(sliderR.value, 10);
        const g = parseInt(sliderG.value, 10);
        const b = parseInt(sliderB.value, 10);
        const hex = PaintSystem.rgbToHex(r, g, b);
        this.updateStudioColor(hex, false);
      };
      sliderR?.addEventListener("input", onSliderChange);
      sliderG?.addEventListener("input", onSliderChange);
      sliderB?.addEventListener("input", onSliderChange);
      const swatchesContainer = document.getElementById("studio-swatches-grid");
      if (swatchesContainer) {
        swatchesContainer.innerHTML = "";
        FESTIVAL_PALETTE.forEach((c) => {
          const btn = document.createElement("button");
          btn.className = "studio-swatch";
          btn.style.backgroundColor = c;
          btn.title = c;
          btn.addEventListener("click", () => {
            this.updateStudioColor(c);
            sound.playUiClick();
          });
          swatchesContainer.appendChild(btn);
        });
      }
      const tabList = [
        { btn: document.getElementById("tab-palette"), panel: document.getElementById("panel-palette") },
        { btn: document.getElementById("tab-poses"), panel: document.getElementById("panel-poses") }
      ];
      tabList.forEach((t) => {
        t.btn?.addEventListener("click", () => {
          tabList.forEach((other) => {
            other.btn?.classList.remove("active");
            other.panel?.classList.remove("active");
          });
          t.btn.classList.add("active");
          t.panel?.classList.add("active");
          sound.playUiClick();
        });
      });
      document.querySelectorAll(".pose-card-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          document.querySelectorAll(".pose-card-btn").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          const pose = btn.dataset.pose;
          if (this.playerMushika) {
            this.playerMushika.setPose(pose);
            this.particles.spawnBlessingBurst(this.playerMushika.root.position);
            sound.playPaintStroke();
          }
        });
      });
      document.getElementById("btn-studio-eyedrop")?.addEventListener("click", () => {
        this.triggerEyedropperSample();
      });
      document.getElementById("btn-studio-blend")?.addEventListener("click", () => {
        if (this.playerMushika) {
          const pos = this.playerMushika.root.position;
          const sampled = this.paintSystem.sampleSurfaceColorAt(pos, new THREE.Vector3(0, 1, 0), this.playerMushika.root);
          const finalColor = this.paintSystem.applyChameleonAutoBlend(this.playerMushika, sampled);
          if (finalColor) this.updateStudioColor(finalColor);
          this.particles.spawnBlessingBurst(pos);
        }
      });
      document.getElementById("btn-close-studio")?.addEventListener("click", () => {
        studio.classList.add("hidden");
        sound.playUiClick();
      });
      document.getElementById("btn-spectate-prev")?.addEventListener("click", () => {
        this.spectatePrev();
      });
      document.getElementById("btn-spectate-next")?.addEventListener("click", () => {
        this.spectateNext();
      });
      this.updateStudioColor(this.paintSystem.currentColor);
    }
    updateStudioColor(hex, updateSliders = true) {
      this.paintSystem.setColor(hex);
      const preview = document.getElementById("studio-color-preview");
      if (preview) preview.style.backgroundColor = hex;
      const rgb = PaintSystem.hexToRgb(hex);
      const valR = document.getElementById("val-r");
      const valG = document.getElementById("val-g");
      const valB = document.getElementById("val-b");
      if (valR) valR.textContent = rgb.r;
      if (valG) valG.textContent = rgb.g;
      if (valB) valB.textContent = rgb.b;
      if (updateSliders) {
        const sliderR = document.getElementById("slider-r");
        const sliderG = document.getElementById("slider-g");
        const sliderB = document.getElementById("slider-b");
        if (sliderR) sliderR.value = rgb.r;
        if (sliderG) sliderG.value = rgb.g;
        if (sliderB) sliderB.value = rgb.b;
      }
    }
    enterSpectateMode() {
      this.isSpectating = true;
      document.getElementById("chameleon-studio")?.classList.add("hidden");
      const btnRevert = document.getElementById("btn-revert-morph");
      if (btnRevert) btnRevert.style.display = "none";
      document.getElementById("prop-prompt")?.classList.add("hidden");
      const specHud = document.getElementById("spectate-hud");
      if (specHud) specHud.style.display = "flex";
      this.updateSpectateTargets();
      this.spectateIndex = 0;
      this.applySpectateTarget();
      sound.playTempleBell(0.85);
    }
    updateSpectateTargets() {
      this.spectateTargets = [];
      this.aiHiders.aiMice.forEach((mouse, idx) => {
        if (!mouse.isTagged) {
          const name = mouse.id ? mouse.id.replace("mushika_", "Mouse ") : `AI Mouse ${idx + 1}`;
          const morphDesc = mouse.currentMorph ? ` (${mouse.currentMorph.replace("_", " ")})` : "";
          this.spectateTargets.push({
            name: `${name}${morphDesc}`,
            entity: mouse,
            role: "hider"
          });
        }
      });
      if (this.aiSeeker.bala) {
        this.spectateTargets.push({
          name: "Bala (AI Seeker)",
          entity: this.aiSeeker.bala,
          role: "seeker"
        });
      }
      if (this.spectateIndex >= this.spectateTargets.length) {
        this.spectateIndex = 0;
      }
    }
    applySpectateTarget() {
      if (this.spectateTargets.length === 0) return;
      const current = this.spectateTargets[this.spectateIndex];
      const nameEl = document.getElementById("spectate-name");
      const subEl = document.getElementById("spectate-sub");
      if (nameEl) nameEl.textContent = current.name;
      if (subEl) subEl.textContent = `${this.state.remainingMiceCount} Mice Remaining`;
      if (current.role === "seeker") {
        this.followCamera.setTargetRole("seeker");
      } else {
        this.followCamera.setTargetRole("hider");
      }
    }
    spectateNext() {
      if (this.spectateTargets.length <= 1) return;
      this.spectateIndex = (this.spectateIndex + 1) % this.spectateTargets.length;
      this.applySpectateTarget();
      sound.playUiClick();
    }
    spectatePrev() {
      if (this.spectateTargets.length <= 1) return;
      this.spectateIndex = (this.spectateIndex - 1 + this.spectateTargets.length) % this.spectateTargets.length;
      this.applySpectateTarget();
      sound.playUiClick();
    }
    selectMorph(morphId) {
      if (this.playerMushika) {
        this.playerMushika.setMorph(morphId);
        sound.playUiClick();
      }
    }
    triggerEyedropperSample(screenX, screenY) {
      let sampled = null;
      if (screenX !== void 0 && screenY !== void 0) {
        sampled = this.paintSystem.sampleWorldColor(
          screenX,
          screenY,
          window.innerWidth,
          window.innerHeight,
          this.playerMushika ? this.playerMushika.root : null
        );
      }
      if (!sampled && this.playerMushika) {
        sampled = this.paintSystem.sampleSurfaceColorBeneath(
          this.playerMushika.root.position,
          this.playerMushika.root
        );
      }
      if (!sampled) {
        sampled = this.paintSystem.sampleWorldColor(
          window.innerWidth * 0.5,
          window.innerHeight * 0.5,
          window.innerWidth,
          window.innerHeight,
          this.playerMushika ? this.playerMushika.root : null
        );
      }
      if (sampled && this.playerMushika) {
        this.paintSystem.setColor(sampled);
        this.paintSystem.paintOnMushika(this.playerMushika, 0.5, 0.5);
      }
    }
    snapPlayerToSurface() {
      if (!this.playerMushika) return;
      const origin = this.playerMushika.root.position.clone();
      origin.y += 0.8;
      const ray = new THREE.Raycaster(origin, new THREE.Vector3(0, -1, 0), 0.1, 5);
      const hits = ray.intersectObjects(this.scene.children, true);
      const root = this.playerMushika.root;
      for (const hit of hits) {
        let isPlayer = false;
        let curr = hit.object;
        while (curr) {
          if (curr === root) {
            isPlayer = true;
            break;
          }
          curr = curr.parent;
        }
        if (!isPlayer) {
          if (hit.object.userData && hit.object.userData.isSacred) continue;
          this.playerMushika.root.position.y = hit.point.y + 0.02;
          sound.playUiClick();
          break;
        }
      }
    }
    // 1-Finger Touch Tap Ripple Visual Feedback
    spawnTouchTapRipple(x, y) {
      const ripple = document.createElement("div");
      ripple.className = "touch-tap-ripple";
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 460);
    }
    setMorphControlsVisible(visible) {
      const displayVal = visible ? "inline-flex" : "none";
      const touchVal = visible ? "flex" : "none";
      ["btn-revert-morph", "btn-prop-freeze", "btn-prop-lock", "btn-prop-unstuck", "btn-prop-taunt"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.display = displayVal;
      });
      ["btn-touch-freeze", "btn-touch-lock", "btn-touch-unstuck", "btn-touch-taunt"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.style.display = touchVal;
      });
    }
    // Helper: Resolve major composite item root (e.g., Full Chair instead of 1 rod/leg, Murti instead of pavilion)
    resolveMajorPropTarget(hitObject) {
      if (!hitObject) return null;
      let curr = hitObject;
      let candidate = null;
      while (curr && curr !== this.scene) {
        if (curr.userData) {
          if (curr.userData.isMajorPropRoot) return curr;
          if ((curr.userData.propName || curr.userData.propType) && !candidate) {
            candidate = curr;
          }
        }
        curr = curr.parent;
      }
      return candidate || hitObject;
    }
    // Trigger player prop morph with particle burst and button activations
    triggerPlayerMorph(targetPropOrType) {
      const isHiderPlayable = this.playerMushika && !this.isSpectating && (this.state.currentPhase === GAME_PHASES.HIDE || this.state.currentPhase === GAME_PHASES.SEEK && this.state.gameMode !== "hotseat");
      if (!isHiderPlayable || !targetPropOrType) return false;
      const resolvedTarget = targetPropOrType && targetPropOrType.isObject3D ? this.resolveMajorPropTarget(targetPropOrType) : targetPropOrType;
      this.playerMushika.setMorph(resolvedTarget);
      sound.playPaintStroke();
      this.particles.spawnBlessingBurst(this.playerMushika.root.position);
      document.getElementById("prop-prompt")?.classList.add("hidden");
      const btnTouch = document.getElementById("btn-touch-switch");
      if (btnTouch) btnTouch.style.display = "none";
      this.setMorphControlsVisible(true);
      return true;
    }
    // 1-Finger Tap Interaction for Hider (Point-to-Morph / Point-to-Hop)
    performHiderTapInteract(screenX, screenY) {
      if (!this.playerMushika || this.state.isFrozen) return;
      const mouse = new THREE.Vector2(
        screenX / window.innerWidth * 2 - 1,
        -(screenY / window.innerHeight) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObjects(this.scene.children, true);
      const playerPos = this.playerMushika.root.position;
      for (const hit of intersects) {
        if (!hit.object.visible) continue;
        if (hit.object.userData && hit.object.userData.isSacred) break;
        let isSelf = false;
        let curr = hit.object;
        while (curr) {
          if (curr === this.playerMushika.root) {
            isSelf = true;
            break;
          }
          curr = curr.parent;
        }
        if (isSelf) {
          this.performHop(this.playerMushika);
          return;
        }
        const propTarget = this.resolveMajorPropTarget(hit.object);
        if (propTarget && propTarget.userData && (propTarget.userData.propName || propTarget.userData.propType)) {
          const dist = playerPos.distanceTo(hit.point);
          if (dist <= 6.5) {
            this.triggerPlayerMorph(propTarget);
            return;
          }
        }
      }
      this.performHop(this.playerMushika);
    }
    performHop(character) {
      if (character.isGrounded) {
        character.velocity.y = 4.5;
        character.isGrounded = false;
        sound.playMouseSqueak();
      }
    }
    startHiderGame() {
      document.getElementById("modal-title")?.classList.add("hidden");
      this.cleanupEntities();
      this.isSpectating = false;
      const specHud = document.getElementById("spectate-hud");
      if (specHud) specHud.style.display = "none";
      this.playerMushika = new Mushika("mushika_player", false);
      this.playerMushika.root.position.set(0, 0.45, 7);
      this.scene.add(this.playerMushika.root);
      this.aiHiders.spawnAIMice(storage.data.difficulty || "normal", 3);
      this.state.remainingMiceCount = 1 + this.aiHiders.aiMice.length;
      this.aiSeeker.spawn(new THREE.Vector3(0, 0, 15));
      this.aiSeeker.onTargetBlessed = (target) => {
        if (target === this.playerMushika) {
          this.state.blessingsCount++;
          this.state.remainingMiceCount = Math.max(0, this.state.remainingMiceCount - 1);
          this.enterSpectateMode();
        } else {
          this.state.blessingsCount++;
          this.state.remainingMiceCount = Math.max(0, this.state.remainingMiceCount - 1);
          if (this.isSpectating) {
            this.updateSpectateTargets();
            this.applySpectateTarget();
          }
        }
        const miceCount = document.getElementById("hud-mice-count");
        if (miceCount) miceCount.textContent = `${this.state.remainingMiceCount} Left`;
        if (this.state.remainingMiceCount <= 0) {
          this.state.remainingMiceCount = 0;
          this.state.winner = "seeker";
          storage.recordBalaWin();
          this.state.setPhase(GAME_PHASES.RESULT);
        }
      };
      this.followCamera.yaw = 0;
      this.followCamera.pitch = 0.28;
      this.followCamera.setTargetRole("hider");
      this.state.startRound("hider");
    }
    startSeekerGame() {
      document.getElementById("modal-title")?.classList.add("hidden");
      this.cleanupEntities();
      this.playerBala = new Bala("bala_player", false);
      this.playerBala.root.position.set(0, 0, 15);
      this.scene.add(this.playerBala.root);
      if (this.playerBala.model) this.playerBala.model.visible = false;
      const mice = this.aiHiders.spawnAIMice(storage.data.difficulty || "normal", 4);
      this.state.remainingMiceCount = mice.length;
      this.followCamera.setTargetRole("seeker");
      this.state.startRound("seeker");
    }
    startHotSeatGame() {
      document.getElementById("modal-title")?.classList.add("hidden");
      this.cleanupEntities();
      this.playerMushika = new Mushika("mushika_player", false);
      this.playerMushika.root.position.set(0, 0.45, 7);
      this.scene.add(this.playerMushika.root);
      this.followCamera.setTargetRole("hider");
      this.state.startRound("hotseat");
    }
    startHotSeatSeekPhase() {
      this.playerBala = new Bala("bala_player2", false);
      this.playerBala.root.position.set(0, 0, 15);
      this.scene.add(this.playerBala.root);
      this.followCamera.setTargetRole("seeker");
      this.state.remainingMiceCount = 1;
      this.state.setPhase(GAME_PHASES.SEEK);
    }
    cleanupEntities() {
      if (this.playerMushika) {
        this.scene.remove(this.playerMushika.root);
        this.playerMushika = null;
      }
      if (this.playerBala) {
        this.scene.remove(this.playerBala.root);
        this.playerBala = null;
      }
      if (this.remotePlayers) {
        for (const [id, rp] of this.remotePlayers) {
          if (rp.entity && rp.entity.root) {
            this.scene.remove(rp.entity.root);
          }
        }
        this.remotePlayers.clear();
      }
      this.aiHiders.clear();
      this.aiSeeker.clear();
      this.particles.clear();
      this.isSpectating = false;
      this.spectateTargets = [];
      this.spectateIndex = 0;
      const specHud = document.getElementById("spectate-hud");
      if (specHud) specHud.style.display = "none";
      document.getElementById("chameleon-studio")?.classList.add("hidden");
      document.getElementById("seeker-target-prompt")?.classList.add("hidden");
      document.getElementById("prop-prompt")?.classList.add("hidden");
      document.getElementById("seeker-toast")?.classList.add("hidden");
      document.getElementById("seeker-reticle")?.classList.remove("reticle-locked");
      document.getElementById("seeker-reticle")?.classList.remove("reticle-spraying");
      if (this.waterController) this.waterController.reset();
      if (this.waterVisuals) this.waterVisuals.clear();
      sound.stopWaterSprayLoop();
      this.currentLookTarget = null;
      this.currentSeekTarget = null;
    }
    returnToTitle() {
      if (this.isMultiplayer) {
        this.network.leaveRoom();
        this.isMultiplayer = false;
      }
      this.cleanupEntities();
      this.state.setPhase(GAME_PHASES.TITLE);
      document.getElementById("modal-title")?.classList.remove("hidden");
      document.getElementById("hud-top-bar").style.display = "none";
      document.getElementById("seeker-reticle").style.display = "none";
      const btnRevert = document.getElementById("btn-revert-morph");
      if (btnRevert) btnRevert.style.display = "none";
      const specHud = document.getElementById("spectate-hud");
      if (specHud) specHud.style.display = "none";
      document.getElementById("chameleon-studio")?.classList.add("hidden");
      const topMenu = document.getElementById("lobby-top-menu");
      if (topMenu) topMenu.style.display = "flex";
      const soloMenu = document.getElementById("lobby-solo-menu");
      if (soloMenu) soloMenu.style.display = "none";
      const friendsMenu = document.getElementById("lobby-friends-menu");
      if (friendsMenu) friendsMenu.style.display = "none";
      const partyRoom = document.getElementById("lobby-party-room");
      if (partyRoom) partyRoom.style.display = "none";
      const joinInput = document.getElementById("lobby-join-input");
      if (joinInput) joinInput.style.display = "none";
      const btnPartyStart = document.getElementById("btn-party-start");
      if (btnPartyStart) btnPartyStart.style.display = "none";
      document.querySelector(".lobby-card")?.classList.remove("in-party-mode");
      this.updateTitleScoreDisplay();
    }
    updateTitleScoreDisplay() {
      const sm = document.getElementById("score-mushika");
      const sb = document.getElementById("score-bala");
      if (sm) sm.textContent = storage.data.mushikaEscapes;
      if (sb) sb.textContent = storage.data.balaBlessings;
    }
    handlePhaseChange(phase, mode) {
      const hudTop = document.getElementById("hud-top-bar");
      const reticle = document.getElementById("seeker-reticle");
      const roleChip = document.getElementById("hud-role-chip");
      const btnBless = document.getElementById("btn-touch-bless");
      const btnMark = document.getElementById("btn-touch-mark");
      const btnDiya = document.getElementById("btn-touch-diya");
      const announcement = document.getElementById("interstitial-announcement");
      const btnRevert = document.getElementById("btn-revert-morph");
      const actionPad = document.getElementById("mobile-action-pad");
      const btnJumpEl = document.getElementById("btn-touch-jump");
      if (phase === GAME_PHASES.TITLE) {
        hudTop.style.display = "none";
        reticle.style.display = "none";
        if (btnRevert) btnRevert.style.display = "none";
        if (actionPad) actionPad.style.display = "none";
        return;
      }
      hudTop.style.display = "flex";
      if (actionPad) actionPad.style.display = "flex";
      if (btnJumpEl) btnJumpEl.style.display = "flex";
      document.body.className = phase === GAME_PHASES.HIDE ? "phase-hide" : "phase-seek";
      if (phase === GAME_PHASES.HIDE) {
        reticle.style.display = "flex";
        if (btnBless) btnBless.style.display = "none";
        if (btnMark) btnMark.style.display = "none";
        if (btnDiya) btnDiya.style.display = "none";
        if (btnJumpEl) btnJumpEl.style.display = "flex";
        const isHider = mode === "hider" || mode === "hotseat";
        roleChip.textContent = isHider ? "HIDER" : "PREP";
        document.getElementById("hud-timer-pill").className = "hud-pill phase-hide";
      } else if (phase === GAME_PHASES.AARTI) {
        reticle.style.display = "none";
        if (btnRevert) btnRevert.style.display = "none";
        if (btnJumpEl) btnJumpEl.style.display = "none";
        if (btnBless) btnBless.style.display = "none";
        document.getElementById("chameleon-studio")?.classList.add("hidden");
        announcement.style.display = "block";
        setTimeout(() => {
          announcement.style.display = "none";
        }, 1900);
        if (this.playerMushika) {
          this.playerMushika.isFrozen = true;
          this.playerMushika.velocity.set(0, 0, 0);
          this.snapPlayerToSurface();
        }
      } else if (phase === GAME_PHASES.HOTSEAT_PASS) {
        if (btnRevert) btnRevert.style.display = "none";
        if (btnJumpEl) btnJumpEl.style.display = "none";
        if (btnBless) btnBless.style.display = "none";
        document.getElementById("chameleon-studio")?.classList.add("hidden");
        document.getElementById("modal-hotseat")?.classList.remove("hidden");
      } else if (phase === GAME_PHASES.SEEK) {
        const isSeeker = mode === "seeker" || mode === "hotseat" && this.playerBala !== null;
        const isHider = !isSeeker;
        reticle.style.display = "flex";
        if (btnBless) btnBless.style.display = isSeeker ? "flex" : "none";
        if (btnMark) btnMark.style.display = isSeeker ? "flex" : "none";
        if (btnDiya) btnDiya.style.display = isSeeker ? "flex" : "none";
        if (btnJumpEl) btnJumpEl.style.display = "flex";
        if (isSeeker) document.getElementById("chameleon-studio")?.classList.add("hidden");
        if (this.playerMushika && this.playerMushika.currentMorph) {
          if (btnRevert) btnRevert.style.display = "inline-flex";
          const btnAbility = document.getElementById("btn-prop-ability");
          if (btnAbility) btnAbility.style.display = "inline-flex";
          const btnTaunt = document.getElementById("btn-prop-taunt");
          if (btnTaunt) btnTaunt.style.display = "inline-flex";
        } else {
          if (btnRevert) btnRevert.style.display = "none";
        }
        roleChip.textContent = isSeeker ? "SEEKER" : "HIDER";
        document.getElementById("hud-timer-pill").className = "hud-pill phase-seek";
        if (this.playerMushika) {
          this.playerMushika.isFrozen = mode === "hotseat";
          if (mode === "hotseat") {
            this.playerMushika.velocity.set(0, 0, 0);
          }
        }
      }
      if (this.isMultiplayer && this.network && this.network.isHost) {
        if (phase === GAME_PHASES.HIDE || phase === GAME_PHASES.AARTI || phase === GAME_PHASES.SEEK) {
          this.network.sendPhaseChange(phase, this.state.phaseTimer);
        }
      }
    }
    handleTimerUpdate(timer, phase) {
      const timerText = document.getElementById("hud-timer-text");
      const timerPill = document.getElementById("hud-timer-pill");
      const miceCount = document.getElementById("hud-mice-count");
      if (timerText) {
        timerText.textContent = `${timer.toFixed(1)}s`;
      }
      if (timerPill) {
        timerPill.classList.toggle("pulse", timer <= 10 && timer > 0);
      }
      if (miceCount) {
        miceCount.textContent = `${this.state.remainingMiceCount} Left`;
      }
    }
    handleResult(winner, stats) {
      document.getElementById("hud-top-bar").style.display = "none";
      document.getElementById("seeker-reticle").style.display = "none";
      document.getElementById("mobile-action-pad")?.style.setProperty("display", "none");
      const btnRevert = document.getElementById("btn-revert-morph");
      if (btnRevert) btnRevert.style.display = "none";
      const modal = document.getElementById("modal-result");
      modal?.classList.remove("hidden");
      const celeText = document.getElementById("result-celebration-text");
      const resVictor = document.getElementById("res-victor");
      const resMode = document.getElementById("res-mode");
      const resBlessed = document.getElementById("res-blessed");
      const resMushikaWins = document.getElementById("res-mushika-wins");
      const resBalaWins = document.getElementById("res-bala-wins");
      if (winner === "hider") {
        celeText.textContent = "Mushika Feasts on Modaks! The little mice stayed hidden!";
        resVictor.textContent = "Mushika (Hiders Win)";
      } else {
        celeText.textContent = "Bala Shared Blessings with all Mushikas! Wholesome Festival Gathering!";
        resVictor.textContent = "Bala (Seeker Wins)";
      }
      resMode.textContent = stats.mode === "hider" ? "Hider (Mushika)" : stats.mode === "seeker" ? "Seeker (Bala)" : "Family Hot-Seat";
      resBlessed.textContent = `${stats.blessingsCount} blessed (${stats.remainingMice} escaped)`;
      resMushikaWins.textContent = stats.mushikaWins;
      resBalaWins.textContent = stats.balaWins;
      sound.playTempleBell(1.15);
    }
    showSeekerToast(msg, icon = "\u2728", durationMs = 2400) {
      const toast = document.getElementById("seeker-toast");
      const toastMsg = document.getElementById("seeker-toast-msg");
      const toastIcon = document.getElementById("seeker-toast-icon");
      if (!toast || !toastMsg) return;
      toastMsg.textContent = msg;
      if (toastIcon) toastIcon.textContent = icon;
      toast.classList.remove("hidden");
      if (this.seekerToastTimeout) clearTimeout(this.seekerToastTimeout);
      this.seekerToastTimeout = setTimeout(() => {
        toast.classList.add("hidden");
      }, durationMs);
    }
    performSeekerConfirmTag(screenCoords = null) {
      const seeker = this.playerBala;
      if (!seeker || this.state.currentPhase !== GAME_PHASES.SEEK) return;
      if (this.isMultiplayer) {
        let hitTargetId = null;
        let hitTargetName = "Hider";
        this.lookRaycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const hits = this.lookRaycaster.intersectObjects(this.scene.children, true);
        for (const hit of hits) {
          if (hit.distance > 6) break;
          for (const [id, rp] of this.remotePlayers) {
            if (rp.role === "hider" && !rp.isTagged && rp.entity && rp.entity.root) {
              let p = hit.object;
              while (p) {
                if (p === rp.entity.root) {
                  hitTargetId = id;
                  hitTargetName = rp.name;
                  break;
                }
                p = p.parent;
              }
            }
            if (hitTargetId) break;
          }
          if (hitTargetId) break;
        }
        if (!hitTargetId) {
          const seekerPos = seeker.root.position;
          for (const [id, rp] of this.remotePlayers) {
            if (rp.role === "hider" && !rp.isTagged && rp.entity && rp.entity.root) {
              if (seekerPos.distanceTo(rp.entity.root.position) <= 3.2) {
                hitTargetId = id;
                hitTargetName = rp.name;
                break;
              }
            }
          }
        }
        if (hitTargetId) {
          this.network.confirmTag(hitTargetId);
          sound.playTempleBell(1.2);
          this.showSeekerToast(`\u{1F389} TAGGED ${hitTargetName}! Confirming...`, "\u{1F389}", 2500);
          return;
        } else {
          this.showSeekerToast("\u{1F33F} No disguised hider found here!", "\u{1F440}", 1500);
          sound.playUiClick();
          return;
        }
      }
      const targets = this.state.gameMode === "seeker" ? this.aiHiders.aiMice : this.playerMushika ? [this.playerMushika] : [];
      const res = this.blessSystem.confirmTag(seeker, targets, screenCoords, this.map.obstacles);
      if (res.attempted) {
        if (res.success) {
          this.state.blessingsCount++;
          this.state.remainingMiceCount = res.remainingMice;
          sound.playTempleBell(1.2);
          this.showSeekerToast(res.message || "\u{1F389} TAG CONFIRMED! Disguised prop found!", "\u{1F389}", 3e3);
          const miceCount = document.getElementById("hud-mice-count");
          if (miceCount) miceCount.textContent = `${this.state.remainingMiceCount} Left`;
          if (res.remainingMice === 0) {
            this.state.winner = "seeker";
            storage.recordBalaWin();
            this.state.setPhase(GAME_PHASES.RESULT);
          }
        } else {
          this.showSeekerToast(res.message, res.reason === "real_prop" ? "\u{1F33F}" : "\u{1F440}", 1600);
        }
      }
    }
    performSeekerBless(screenCoords = null) {
      return this.performSeekerConfirmTag(screenCoords);
    }
    onResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    // Main Game Loop (RAF with dt capped at 0.1s)
    animate(currentTime) {
      requestAnimationFrame(this.animate);
      this.dt = Math.min(0.1, (currentTime - this.lastTime) * 1e-3);
      this.lastTime = currentTime;
      const inputDelta = this.input.update();
      this.state.update(this.dt);
      if (inputDelta.actionBless) {
        this.performSeekerBless();
      }
      if (inputDelta.actionMarkPetal && this.playerBala) {
        this.particles.dropSuspectPetal(this.playerBala.root.position);
        sound.playUiClick();
      }
      const isHiderPlayable = this.playerMushika && !this.isSpectating && (this.state.currentPhase === GAME_PHASES.HIDE || this.state.currentPhase === GAME_PHASES.SEEK && this.state.gameMode !== "hotseat");
      if (inputDelta.actionSampleColor && isHiderPlayable) {
        this.triggerEyedropperSample();
      }
      if (inputDelta.actionBlend && isHiderPlayable) {
        const pos = this.playerMushika.root.position;
        const normal = new THREE.Vector3(0, 1, 0);
        const sampled = this.paintSystem.sampleSurfaceColorAt(pos, normal, this.playerMushika.root);
        const finalColor = this.paintSystem.applyChameleonAutoBlend(this.playerMushika, sampled);
        if (finalColor) this.updateStudioColor(finalColor);
        this.particles.spawnBlessingBurst(pos);
      }
      if (inputDelta.actionToggleStudio && isHiderPlayable) {
        const studio = document.getElementById("chameleon-studio");
        studio?.classList.toggle("hidden");
        sound.playUiClick();
      }
      if (inputDelta.actionPose && isHiderPlayable) {
        this.playerMushika.setPose(inputDelta.actionPose);
        document.querySelectorAll(".pose-card-btn").forEach((btn) => {
          btn.classList.toggle("active", btn.dataset.pose === inputDelta.actionPose);
        });
        this.particles.spawnBlessingBurst(this.playerMushika.root.position);
        sound.playPaintStroke();
      }
      if (inputDelta.actionSwitchProp && this.currentLookTarget && isHiderPlayable) {
        this.playerMushika.setMorph(this.currentLookTarget.object || this.currentLookTarget.propType);
        sound.playPaintStroke();
        this.particles.spawnBlessingBurst(this.playerMushika.root.position);
        document.getElementById("prop-prompt")?.classList.add("hidden");
        const btnTouch = document.getElementById("btn-touch-switch");
        if (btnTouch) btnTouch.style.display = "none";
        this.setMorphControlsVisible(true);
      }
      if (inputDelta.actionSwitchProp && this.playerBala && this.state.currentPhase === GAME_PHASES.SEEK) {
        this.performSeekerBless();
      }
      if (inputDelta.actionRevert && isHiderPlayable) {
        this.playerMushika.revertToMouse();
        sound.playUiClick();
        this.particles.spawnBlessingBurst(this.playerMushika.root.position);
        this.setMorphControlsVisible(false);
      }
      if (inputDelta.actionPropAbility && this.playerMushika && this.playerMushika.currentMorph) {
        this.playerMushika.triggerPropAbility(this.particles);
        sound.playAbilitySound();
      }
      if (inputDelta.actionFreeze && isHiderPlayable) {
        const frozen = this.playerMushika.toggleRigidFreeze(sound, this.particles);
        this.showSeekerToast(frozen ? "\u{1F512} Prop Frozen Rigid! Free Camera Orbit" : "\u{1F513} Prop Unfrozen! Ready to Bolt", "\u{1F9F1}", 1600);
        const freezeBtn = document.getElementById("btn-prop-freeze");
        if (freezeBtn) freezeBtn.classList.toggle("active-freeze", frozen);
      }
      if (inputDelta.actionLockOrientation && isHiderPlayable) {
        const locked = this.playerMushika.toggleOrientationLock();
        this.showSeekerToast(locked ? "\u{1F9ED} Orientation Locked! Camera orbits freely [L]" : "\u{1F9ED} Orientation Free [L]", "\u{1F504}", 1600);
        const lockBtn = document.getElementById("btn-prop-lock");
        if (lockBtn) lockBtn.classList.toggle("active-freeze", locked);
      }
      if (inputDelta.actionUnstuck && isHiderPlayable) {
        this.playerMushika.unstuck(this.map.obstacles, this.particles, sound);
        this.showSeekerToast("\u{1F300} Unstuck! Popped to clearance", "\u{1F4A8}", 1600);
      }
      if (inputDelta.actionTaunt && this.playerMushika) {
        const listenerPos2 = this.playerBala ? this.playerBala.root.position : this.camera.position;
        this.playerMushika.triggerTaunt(this.particles, sound, listenerPos2, this.followCamera.yaw);
        this.showSeekerToast("\u{1F514} Taunt Emitted! Directional Echo", "\u{1F389}", 1400);
      }
      if (isHiderPlayable && !this.state.isFrozen) {
        this.lookRaycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const hits = this.lookRaycaster.intersectObjects(this.scene.children, true);
        let foundProp = null;
        for (const hit of hits) {
          if (hit.distance > 4.5) break;
          if (hit.object.userData && hit.object.userData.isSacred) continue;
          let isSelf = false;
          let p = hit.object;
          while (p) {
            if (p === this.playerMushika.root) {
              isSelf = true;
              break;
            }
            p = p.parent;
          }
          if (isSelf) continue;
          const targetObj = this.resolveMajorPropTarget(hit.object);
          if (targetObj && targetObj.userData && (targetObj.userData.propType || targetObj.userData.propName)) {
            foundProp = {
              object: targetObj,
              propType: targetObj.userData.propType || "prop",
              propName: targetObj.userData.propName || "Festival Prop"
            };
            break;
          }
        }
        const promptCard = document.getElementById("prop-prompt");
        const promptName = document.getElementById("prop-prompt-name");
        const touchSwitch = document.getElementById("btn-touch-switch");
        if (foundProp) {
          this.currentLookTarget = foundProp;
          if (promptCard) promptCard.classList.remove("hidden");
          if (promptName) promptName.textContent = foundProp.propName;
          if (touchSwitch) touchSwitch.style.display = "flex";
        } else {
          this.currentLookTarget = null;
          if (promptCard) promptCard.classList.add("hidden");
          if (touchSwitch) touchSwitch.style.display = "none";
        }
      }
      const isSeekerPlayable = this.playerBala && this.state.currentPhase === GAME_PHASES.SEEK;
      if (isSeekerPlayable) {
        this.lookRaycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const hits = this.lookRaycaster.intersectObjects(this.scene.children, true);
        let foundSeekTarget = null;
        const targets = this.state.gameMode === "seeker" ? this.aiHiders.aiMice : this.playerMushika ? [this.playerMushika] : [];
        for (const hit of hits) {
          if (hit.distance > 6.5) break;
          if (hit.object.userData && hit.object.userData.isSacred) break;
          let isSelf = false;
          let curr = hit.object;
          while (curr) {
            if (curr === this.playerBala.root) {
              isSelf = true;
              break;
            }
            curr = curr.parent;
          }
          if (isSelf) continue;
          let matchedMouse = null;
          for (const m of targets) {
            if (m.isTagged) continue;
            let p = hit.object;
            while (p) {
              if (p === m.root) {
                matchedMouse = m;
                break;
              }
              p = p.parent;
            }
            if (matchedMouse) break;
          }
          if (matchedMouse) {
            const morphLabel = matchedMouse.currentMorph ? matchedMouse.currentMorph.toUpperCase() : "SUSPECT MOUSE";
            foundSeekTarget = {
              isMouse: true,
              mouse: matchedMouse,
              name: `${morphLabel} (SUSPECT)`
            };
            break;
          }
          const targetProp = this.resolveMajorPropTarget(hit.object);
          if (targetProp && targetProp.userData && (targetProp.userData.propName || targetProp.userData.propType)) {
            foundSeekTarget = {
              isMouse: false,
              object: targetProp,
              name: targetProp.userData.propName || "Festival Prop"
            };
            break;
          }
          if (foundSeekTarget) break;
        }
        const seekerPrompt = document.getElementById("seeker-target-prompt");
        const seekerName = document.getElementById("seeker-target-name");
        const reticle = document.getElementById("seeker-reticle");
        const btnTouchBless = document.getElementById("btn-touch-bless");
        if (foundSeekTarget) {
          this.currentSeekTarget = foundSeekTarget;
          if (seekerPrompt) seekerPrompt.classList.remove("hidden");
          if (seekerName) seekerName.textContent = foundSeekTarget.name;
          if (reticle) reticle.classList.add("reticle-locked");
          if (btnTouchBless) {
            btnTouchBless.style.display = "flex";
            btnTouchBless.classList.add("pulse-glow");
          }
        } else {
          this.currentSeekTarget = null;
          if (seekerPrompt) seekerPrompt.classList.add("hidden");
          if (reticle) reticle.classList.remove("reticle-locked");
          if (btnTouchBless) btnTouchBless.classList.remove("pulse-glow");
        }
      } else {
        document.getElementById("seeker-target-prompt")?.classList.add("hidden");
        document.getElementById("seeker-reticle")?.classList.remove("reticle-locked");
      }
      let activeEntity = null;
      let isPlayerMoving = false;
      if (this.isSpectating) {
        if (inputDelta.moveX < -0.5) {
          if (!this._prevSpectateKey) {
            this.spectatePrev();
            this._prevSpectateKey = true;
          }
        } else if (inputDelta.moveX > 0.5) {
          if (!this._prevSpectateKey) {
            this.spectateNext();
            this._prevSpectateKey = true;
          }
        } else {
          this._prevSpectateKey = false;
        }
        if (this.spectateTargets.length > 0) {
          const current = this.spectateTargets[this.spectateIndex];
          if (current && current.entity && current.entity.root) {
            activeEntity = current.entity;
          }
        }
      }
      if (inputDelta.actionTap && inputDelta.tapPos) {
        this.spawnTouchTapRipple(inputDelta.tapPos.x, inputDelta.tapPos.y);
        if (this.playerBala && this.state.currentPhase === GAME_PHASES.SEEK) {
          this.performSeekerBless(inputDelta.tapPos);
        } else if (this.playerMushika && (this.state.currentPhase === GAME_PHASES.HIDE || this.state.currentPhase === GAME_PHASES.SEEK)) {
          this.performHiderTapInteract(inputDelta.tapPos.x, inputDelta.tapPos.y);
        }
      } else if (this.playerMushika) {
        activeEntity = this.playerMushika;
        const isHotseatWaiting = this.state.gameMode === "hotseat" && this.state.currentPhase === GAME_PHASES.SEEK;
        const canMove = !this.isSpectating && !isHotseatWaiting && !this.state.isFrozen && (this.state.currentPhase === GAME_PHASES.HIDE || this.state.currentPhase === GAME_PHASES.SEEK);
        let headingDelta = 0;
        if (canMove && !this.playerMushika.isRigidFrozen) {
          const massConf = PROP_MASS_CONFIG[this.playerMushika.massClass] || PROP_MASS_CONFIG.micro;
          const speed = massConf.speed;
          if (inputDelta.moveX !== 0 || inputDelta.moveZ !== 0) {
            const camYaw = this.followCamera.yaw;
            const sinY = Math.sin(camYaw);
            const cosY = Math.cos(camYaw);
            const forward = -inputDelta.moveZ;
            const strafe = inputDelta.moveX;
            const forwardX = -sinY;
            const forwardZ = -cosY;
            const rightX = cosY;
            const rightZ = -sinY;
            const targetMoveX = (forward * forwardX + strafe * rightX) * speed;
            const targetMoveZ = (forward * forwardZ + strafe * rightZ) * speed;
            const accelLerp = 1 - Math.exp(-this.dt * massConf.accel);
            this.playerMushika.momentum.x += (targetMoveX - this.playerMushika.momentum.x) * accelLerp;
            this.playerMushika.momentum.z += (targetMoveZ - this.playerMushika.momentum.z) * accelLerp;
            this.playerMushika.root.position.x += this.playerMushika.momentum.x * this.dt;
            this.playerMushika.root.position.z += this.playerMushika.momentum.z * this.dt;
            const moveHeading = Math.atan2(targetMoveX, targetMoveZ);
            if (this.playerMushika.isOrientationLocked) {
              this.playerMushika.root.rotation.y = this.playerMushika.lockedHeading;
            } else {
              headingDelta = moveHeading - (this.playerMushika.lastMoveHeading || moveHeading);
              this.playerMushika.root.rotation.y = moveHeading;
              this.playerMushika.lastMoveHeading = moveHeading;
            }
            isPlayerMoving = true;
          } else {
            this.playerMushika.momentum.multiplyScalar(Math.max(0, 1 - this.dt * (massConf.drift > 0.2 ? 6 : 12)));
            if (this.playerMushika.momentum.lengthSq() > 0.04) {
              this.playerMushika.root.position.x += this.playerMushika.momentum.x * this.dt;
              this.playerMushika.root.position.z += this.playerMushika.momentum.z * this.dt;
              isPlayerMoving = true;
            }
          }
          if (inputDelta.isHop && this.playerMushika.isGrounded) {
            this.playerMushika.velocity.y = massConf.hopPower;
            this.playerMushika.isGrounded = false;
            if (massConf.soundType === "heavy") {
              sound.playDhol(false);
            } else if (massConf.soundType === "medium") {
              sound.playUiClick();
            } else {
              sound.playMouseSqueak();
            }
          }
          if (!this.playerMushika.isGrounded) {
            this.playerMushika.velocity.y -= 14 * this.dt;
            this.playerMushika.root.position.y += this.playerMushika.velocity.y * this.dt;
          }
          const col = this.map.checkCollision(this.playerMushika.root.position, this.playerMushika.propRadius || 0.35);
          this.playerMushika.groundY = col.groundY;
          if (this.playerMushika.root.position.y <= col.groundY) {
            const wasAirborne = !this.playerMushika.isGrounded;
            this.playerMushika.root.position.y = col.groundY;
            this.playerMushika.velocity.y = 0;
            this.playerMushika.isGrounded = true;
            if (wasAirborne) {
              if (massConf.soundType === "heavy") {
                sound.playHeavyThud();
              } else if (massConf.soundType === "medium") {
                sound.playUiClick();
              }
            }
          } else {
            this.playerMushika.isGrounded = false;
          }
        } else {
          this.playerMushika.velocity.set(0, 0, 0);
          this.playerMushika.momentum.set(0, 0, 0);
        }
        this.playerMushika.update(this.dt, isPlayerMoving, headingDelta);
      } else if (this.playerBala) {
        activeEntity = this.playerBala;
        const isSeekPhase = this.state.currentPhase === GAME_PHASES.SEEK;
        const speed = isSeekPhase ? 4 : 2;
        if (inputDelta.moveX !== 0 || inputDelta.moveZ !== 0) {
          const camYaw = this.followCamera.yaw;
          const sinY = Math.sin(camYaw);
          const cosY = Math.cos(camYaw);
          const forward = -inputDelta.moveZ;
          const strafe = inputDelta.moveX;
          const forwardX = -sinY;
          const forwardZ = -cosY;
          const rightX = cosY;
          const rightZ = -sinY;
          const worldMoveX = forward * forwardX + strafe * rightX;
          const worldMoveZ = forward * forwardZ + strafe * rightZ;
          this.playerBala.root.position.x += worldMoveX * speed * this.dt;
          this.playerBala.root.position.z += worldMoveZ * speed * this.dt;
          this.playerBala.root.rotation.y = Math.atan2(worldMoveX, worldMoveZ);
          isPlayerMoving = true;
        }
        if (inputDelta.isHop) {
          this.performHop(this.playerBala);
        }
        if (!this.playerBala.isGrounded) {
          this.playerBala.velocity.y -= 14 * this.dt;
          this.playerBala.root.position.y += this.playerBala.velocity.y * this.dt;
        }
        const col = this.map.checkCollision(this.playerBala.root.position, 0.65, true);
        if (this.playerBala.root.position.y <= (col.groundY || 0.25)) {
          this.playerBala.root.position.y = col.groundY || 0.25;
          this.playerBala.velocity.y = 0;
          this.playerBala.isGrounded = true;
        } else {
          this.playerBala.isGrounded = false;
        }
        this.playerBala.update(this.dt, isPlayerMoving);
        this.blessSystem.updateDiyaPosition(this.playerBala.root.position);
      }
      const allActiveHiders = [
        ...this.playerMushika && !this.playerMushika.isTagged ? [this.playerMushika] : [],
        ...this.aiHiders.aiMice.filter((m) => !m.isTagged)
      ];
      const listenerPos = this.playerBala ? this.playerBala.root.position : this.camera.position;
      const listenerYaw = this.followCamera.yaw;
      for (const hider of allActiveHiders) {
        if (hider.shouldEmitAntiCampSound) {
          hider.shouldEmitAntiCampSound = false;
          this.particles.spawnTauntRing(hider.root.position);
          const soundType = hider.massClass === "heavy" ? "dhol" : "bell";
          sound.playDirectionalChime(hider.root.position, listenerPos, listenerYaw, soundType);
        }
      }
      if (this.playerBala && this.state.currentPhase === GAME_PHASES.SEEK) {
        const stamPill = document.getElementById("hud-seeker-stamina-pill");
        if (stamPill) stamPill.style.display = "none";
        if (this.seekerSniffCooldown > 0) {
          this.seekerSniffCooldown = Math.max(0, this.seekerSniffCooldown - this.dt);
        }
        if (inputDelta.actionSniff) {
          if (!this.seekerSniffCooldown || this.seekerSniffCooldown <= 0) {
            this.seekerSniffCooldown = 8;
            sound.playTrunkSniff();
            const targets = this.state.gameMode === "seeker" ? this.aiHiders.aiMice : this.playerMushika ? [this.playerMushika] : [];
            const activeTargets = targets.filter((m) => !m.isTagged);
            let nearest = null;
            let minDist = Infinity;
            const balaPos = this.playerBala.root.position;
            for (const m of activeTargets) {
              const d = balaPos.distanceTo(m.root.position);
              if (d < minDist) {
                minDist = d;
                nearest = m;
              }
            }
            if (nearest) {
              const dir = new THREE.Vector3().subVectors(nearest.root.position, balaPos).normalize();
              this.particles.spawnFestiveBurst(balaPos.clone().addScaledVector(dir, 1.8), 16, "#00CED1");
            }
          }
        }
      } else {
        sound.stopWaterSprayLoop();
      }
      if (this.playerMushika && this.state.currentPhase === GAME_PHASES.SEEK && !this.playerMushika.isTagged) {
        const bala = this.aiSeeker?.bala || this.playerBala;
        const vignette = document.getElementById("tension-vignette");
        if (bala) {
          const distToBala = this.playerMushika.root.position.distanceTo(bala.root.position);
          if (distToBala < 3.5) {
            vignette?.classList.add("pulsing");
            this.heartbeatTimer = (this.heartbeatTimer || 0) - this.dt;
            if (this.heartbeatTimer <= 0) {
              const factor = 1 - distToBala / 3.5;
              sound.playHeartbeat(0.4 + factor * 0.6);
              this.heartbeatTimer = Math.max(0.35, 0.85 - factor * 0.5);
            }
          } else {
            vignette?.classList.remove("pulsing");
            this.heartbeatTimer = 0;
          }
        }
      } else {
        document.getElementById("tension-vignette")?.classList.remove("pulsing");
      }
      if (this.playerMushika && (this.state.currentPhase === GAME_PHASES.HIDE || this.state.currentPhase === GAME_PHASES.SEEK)) {
        const playerPos = this.playerMushika.root.position;
        const prasadPill = document.getElementById("hud-prasad-pill");
        const prasadText = document.getElementById("hud-prasad-text");
        if (prasadPill) prasadPill.style.display = "inline-flex";
        if (this.mapProps?.userData?.prasadPickups) {
          const t = performance.now() * 3e-3;
          this.mapProps.userData.prasadPickups.forEach((p) => {
            if (!p.userData.collected) {
              p.rotation.y += this.dt * 2;
              p.position.y = (p.userData.baseY || 0.8) + Math.sin(t + p.position.x) * 0.04;
              if (!this.playerHasPrasad && playerPos.distanceTo(p.position) < 0.75) {
                p.userData.collected = true;
                p.visible = false;
                this.playerHasPrasad = true;
                sound.playPrasadSnatch();
                this.particles.spawnFestiveBurst(p.position, 16, "#FFD700");
              }
            }
          });
        }
        if (this.playerHasPrasad && this.mapProps?.userData?.mouseHoles) {
          this.mapProps.userData.mouseHoles.forEach((hole) => {
            if (playerPos.distanceTo(hole.position) < 1.1) {
              this.playerHasPrasad = false;
              this.state.prasadScore = (this.state.prasadScore || 0) + 1;
              this.state.scoreMultiplier = 5;
              sound.playPrasadSnatch();
              this.particles.spawnFestiveBurst(hole.position, 28, "#FFD700");
            }
          });
        }
        if (prasadText) {
          prasadText.textContent = `${this.state.prasadScore || 0}/5 (${this.playerHasPrasad ? "CARRYING" : this.state.scoreMultiplier + "x"})`;
        }
      } else {
        const prasadPill = document.getElementById("hud-prasad-pill");
        if (prasadPill) prasadPill.style.display = "none";
      }
      if (this.isMultiplayer) {
        if (this.playerMushika) {
          this.network.sendMove(
            this.playerMushika.root.position,
            this.playerMushika.root.rotation.y,
            this.playerMushika.currentMorph,
            this.playerMushika.isRigidFrozen,
            this.playerMushika.isOrientationLocked
          );
        } else if (this.playerBala) {
          this.network.sendMove(
            this.playerBala.root.position,
            this.playerBala.root.rotation.y,
            null,
            false,
            false
          );
        }
        for (const [id, rp] of this.remotePlayers) {
          if (rp.entity && rp.entity.root) {
            rp.entity.root.position.lerp(rp.targetPos, 0.4);
            let diff = rp.targetRot - rp.entity.root.rotation.y;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            rp.entity.root.rotation.y += diff * 0.4;
            const isMoving = rp.targetPos.distanceTo(rp.entity.root.position) > 0.04;
            if (rp.role === "seeker") {
              rp.entity.update(this.dt, isMoving);
            } else if (rp.role === "hider") {
              rp.entity.update(this.dt, isMoving, 0);
            }
          }
        }
        if (this.network.isHost) {
          if (this.state.currentPhase === GAME_PHASES.HIDE && this.state.phaseTimer <= 0) {
            this.network.sendPhaseChange("SEEK", 60);
          } else if (this.state.currentPhase === GAME_PHASES.SEEK && this.state.phaseTimer <= 0) {
            this.network.sendTimeExpired();
          }
        }
      }
      if (!this.isMultiplayer) {
        if (this.state.gameMode === "seeker" && this.state.currentPhase === GAME_PHASES.SEEK) {
          this.aiHiders.update(this.dt);
        } else if (this.state.gameMode === "hider" && this.state.currentPhase === GAME_PHASES.SEEK) {
          const allHidingMice = [this.playerMushika, ...this.aiHiders.aiMice];
          this.aiSeeker.update(this.dt, allHidingMice, this.map.obstacles, this.state.phaseTimeLeft);
          this.aiHiders.update(this.dt);
        }
      }
      this.particles.update(this.dt);
      if (this.map && this.map.update) {
        this.map.update(this.dt);
      }
      if (activeEntity) {
        const propR = activeEntity && activeEntity.propRadius ? activeEntity.propRadius : 0.35;
        const propH = activeEntity && activeEntity.propHeight ? activeEntity.propHeight : 0.45;
        const heading = activeEntity.root ? activeEntity.root.rotation.y : null;
        const isOrientationLocked = this.playerMushika ? this.playerMushika.isOrientationLocked : false;
        this.followCamera.update(
          this.dt,
          activeEntity.root.position,
          inputDelta.lookX,
          inputDelta.lookY,
          this.map.obstacles,
          propR,
          propH,
          isPlayerMoving,
          heading,
          isOrientationLocked
        );
      } else {
        const t = currentTime * 15e-5;
        this.camera.position.set(Math.cos(t) * 9, 4.2, Math.sin(t) * 9 + 3);
        this.camera.lookAt(0, 1.5, 2.5);
      }
      this.renderer.render(this.scene, this.camera);
    }
  };
  function bootGame() {
    if (!window.game) {
      try {
        window.game = new MushikaMandapGame();
        console.log("[MushikaMandap] Game initialized successfully");
      } catch (err) {
        console.error("[MushikaMandap] Error starting game:", err);
      }
    }
  }
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", bootGame);
  } else {
    bootGame();
  }
})();
