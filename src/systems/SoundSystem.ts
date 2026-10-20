export type MusicCue = 'menu' | 'level1' | 'level2' | 'level3' | 'survival';

const MUSIC_TRACKS: Record<MusicCue, string> = {
  menu: '/music/menu_paper_saints.mp3',
  level1: '/music/Low_Tide_Vigil.mp3',
  level2: '/music/dixon_ward.mp3',
  level3: '/music/empty_hall.mp3',
  survival: '/music/horde_clock.mp3'
};

const MUSIC_FALLBACK = '/music/Low_Tide_Vigil.mp3';

export class SoundSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private lastGroanTime = 0;

  private musicAudio: HTMLAudioElement | null = null;
  private musicAutoplayRetryAttached = false;
  private currentMusicSrc: string | null = null;
  private requestedMusicSrc: string | null = null;
  private readonly missingMusic = new Set<string>();

  constructor() {
    this.playCue('menu');
  }

  public playCue(cue: MusicCue): void {
    let src = MUSIC_TRACKS[cue];
    if (this.missingMusic.has(src)) {
      src = MUSIC_FALLBACK;
    }
    if (this.currentMusicSrc === src && this.musicAudio) {
      if (this.musicAudio.paused) {
        this.musicAudio.play().catch(() => {
          this.attachOneTimeMusicUnlock();
        });
      }
      return;
    }
    this.beginTrack(src);
  }

  private beginTrack(src: string): void {
    try {
      if (!this.musicAudio) {
        const audio = new Audio();
        audio.loop = true;
        audio.volume = 0.35;
        audio.preload = 'auto';
        audio.addEventListener('error', () => {
          const failed = this.requestedMusicSrc;
          if (!failed || failed === MUSIC_FALLBACK) return;
          this.missingMusic.add(failed);
          if (this.currentMusicSrc !== MUSIC_FALLBACK) {
            this.beginTrack(MUSIC_FALLBACK);
          }
        });
        this.musicAudio = audio;
      }

      this.requestedMusicSrc = src;
      this.currentMusicSrc = src;
      this.musicAudio.src = src;
      const playPromise = this.musicAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          this.attachOneTimeMusicUnlock();
        });
      }
    } catch {
      // Brak pliku albo blokada autoplay nie może wywalić gry.
    }
  }

  private attachOneTimeMusicUnlock(): void {
    if (this.musicAutoplayRetryAttached) return;
    this.musicAutoplayRetryAttached = true;

    const unlock = () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      if (!this.musicAudio) return;
      this.musicAudio.play().catch(() => {
        // Drugi raz nie próbujemy.
      });
    };

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  private ensureContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.42;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public init(): void {
    this.ensureContext();
    if (this.musicAudio && this.musicAudio.paused) {
      this.musicAudio.play().catch(() => {
        this.attachOneTimeMusicUnlock();
      });
    }
  }

  private createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  public playSlash(isElectric = false, isFire = false): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    // Air whoosh (filtered noise)
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(ctx, 0.16);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.frequency.exponentialRampToValueAtTime(280, now + 0.15);
    filter.Q.value = 1.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);

    // Metallic blade ring
    const osc = ctx.createOscillator();
    osc.type = isElectric ? 'sawtooth' : isFire ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isElectric ? 920 : 540, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.18, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  public playHit(isCrit = false, isElectric = false): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    // Bassy meat thud
    const sub = ctx.createOscillator();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(isCrit ? 175 : 130, now);
    sub.frequency.exponentialRampToValueAtTime(32, now + 0.14);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(isCrit ? 0.65 : 0.45, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 0.15);

    // Crunch splatter noise
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(ctx, 0.1);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isCrit ? 2800 : 1600, now);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(isCrit ? 0.38 : 0.24, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.masterGain);
    noise.start(now);

    if (isElectric) {
      const zap = ctx.createOscillator();
      zap.type = 'sawtooth';
      zap.frequency.setValueAtTime(1400, now);
      zap.frequency.exponentialRampToValueAtTime(320, now + 0.11);
      const zGain = ctx.createGain();
      zGain.gain.setValueAtTime(0.2, now);
      zGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      zap.connect(zGain);
      zGain.connect(this.masterGain);
      zap.start(now);
      zap.stop(now + 0.12);
    }
  }

  public playShotgun(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    // Explosive blast noise
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(ctx, 0.28);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(220, now + 0.26);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.65, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.27);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.masterGain);
    noise.start(now);

    // Low cannon punch
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.2);

    const oGain = ctx.createGain();
    oGain.gain.setValueAtTime(0.55, now);
    oGain.gain.exponentialRampToValueAtTime(0.001, now + 0.21);

    osc.connect(oGain);
    oGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playDash(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(ctx, 0.18);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(1800, now + 0.16);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
  }

  public playSpecialCarnage(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    // Massive shockwave sub drop + metallic roar
    const sub = ctx.createOscillator();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(220, now);
    sub.frequency.exponentialRampToValueAtTime(26, now + 0.48);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.85, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 0.52);

    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(ctx, 0.45);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.frequency.exponentialRampToValueAtTime(140, now + 0.44);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.75, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.masterGain);
    noise.start(now);
  }

  public playExplosion(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(ctx, 0.7);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.68);

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.85, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(this.masterGain);
    noise.start(now);

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(110, now);
    sub.frequency.exponentialRampToValueAtTime(22, now + 0.55);

    const sGain = ctx.createGain();
    sGain.gain.setValueAtTime(0.75, now);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.56);

    sub.connect(sGain);
    sGain.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 0.57);
  }

  public playZombieGroan(isVolatile = false, force = false): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    if (!force && now - this.lastGroanTime < 0.7) return;
    this.lastGroanTime = now;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    const baseFreq = isVolatile ? 165 + Math.random() * 50 : 85 + Math.random() * 25;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.linearRampToValueAtTime(baseFreq * (isVolatile ? 1.35 : 0.78), now + 0.35);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isVolatile ? 950 : 380, now);
    filter.Q.value = 3.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(isVolatile ? 0.22 : 0.13, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playPickup(isRare = false): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    const notes = isRare ? [523.25, 659.25, 783.99, 1046.5] : [587.33, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.055);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, now + idx * 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.14);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.15);
    });
  }

  public playLevelUp(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    const chord = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      const t = now + i * 0.05;
      osc.frequency.setValueAtTime(freq, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.24, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.68);
    });
  }

  public playNightHorn(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(72, now + 1.1);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 1.2);
  }
}
