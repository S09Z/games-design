export type SoundName =
  | 'fire'
  | 'impact'
  | 'enemy_die'
  | 'win'
  | 'lose'
  | 'button'
  | 'select';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private _soundEnabled = true;
  private _musicEnabled = true;
  private _volume = 0.7;

  get soundEnabled() { return this._soundEnabled; }
  get musicEnabled() { return this._musicEnabled; }

  constructor() {
    const saved = localStorage.getItem('ctc_audio');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        this._soundEnabled = s.sound ?? true;
        this._musicEnabled = s.music ?? true;
        this._volume = s.volume ?? 0.7;
      } catch {}
    }
  }

  private init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._soundEnabled ? this._volume : 0;
      this.masterGain.connect(this.ctx.destination);
    } catch {
      console.warn('Web Audio API not available');
    }
  }

  private ensureResumed() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private save() {
    try {
      localStorage.setItem('ctc_audio', JSON.stringify({
        sound: this._soundEnabled,
        music: this._musicEnabled,
        volume: this._volume,
      }));
    } catch {}
  }

  setSoundEnabled(v: boolean) {
    this._soundEnabled = v;
    if (this.masterGain) {
      this.masterGain.gain.value = v ? this._volume : 0;
    }
    this.save();
  }

  setMusicEnabled(v: boolean) {
    this._musicEnabled = v;
    this.save();
  }

  toggleSound() { this.setSoundEnabled(!this._soundEnabled); }
  toggleMusic() { this.setMusicEnabled(!this._musicEnabled); }

  setVolume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && this._soundEnabled) {
      this.masterGain.gain.value = this._volume;
    }
    this.save();
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    gainVal: number,
    startTime: number,
    endFreq?: number,
  ) {
    if (!this.ctx || !this.masterGain) return;
    this.ensureResumed();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);
    }
    gain.gain.setValueAtTime(gainVal, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  private playNoise(duration: number, gainVal: number, startTime: number) {
    if (!this.ctx || !this.masterGain) return;
    this.ensureResumed();
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    gain.gain.setValueAtTime(gainVal, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    source.start(startTime);
    source.stop(startTime + duration);
  }

  play(name: SoundName) {
    if (!this._soundEnabled) return;
    this.init();
    this.ensureResumed();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    switch (name) {
      case 'fire':
        this.playNoise(0.15, 0.4, now);
        this.playTone(120, 0.2, 'sawtooth', 0.3, now, 60);
        this.playTone(80, 0.1, 'sine', 0.4, now + 0.05, 40);
        break;

      case 'impact':
        this.playNoise(0.1, 0.5, now);
        this.playTone(100, 0.15, 'sine', 0.5, now, 40);
        this.playNoise(0.05, 0.3, now + 0.02);
        break;

      case 'enemy_die':
        this.playTone(600, 0.2, 'square', 0.3, now, 200);
        this.playTone(300, 0.15, 'sine', 0.2, now + 0.1, 100);
        break;

      case 'win': {
        const winNotes = [261, 329, 392, 523, 659, 784];
        for (let i = 0; i < winNotes.length; i++) {
          this.playTone(winNotes[i], 0.3, 'sine', 0.4, now + i * 0.12);
          this.playTone(winNotes[i] * 1.5, 0.25, 'triangle', 0.2, now + i * 0.12);
        }
        break;
      }

      case 'lose': {
        const loseNotes = [392, 349, 293, 261, 220, 196];
        for (let i = 0; i < loseNotes.length; i++) {
          this.playTone(loseNotes[i], 0.35, 'sine', 0.3, now + i * 0.15);
        }
        break;
      }

      case 'button':
        this.playTone(440, 0.08, 'sine', 0.2, now);
        break;

      case 'select':
        this.playTone(520, 0.06, 'sine', 0.15, now);
        this.playTone(660, 0.06, 'sine', 0.15, now + 0.08);
        break;
    }
  }
}

export const audioManager = new AudioManager();
