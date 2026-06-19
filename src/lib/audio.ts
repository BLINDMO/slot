/**
 * Audio. The asset pass (Section 7) will load real SFX via Howler.js; until then
 * we synthesize simple tones with the Web Audio API so the game has feedback
 * without shipping any audio files. The public API is the swap point — replace
 * the bodies with Howl playback and the rest of the app is unchanged.
 */
class Sfx {
  private ctx: AudioContext | null = null;

  private ac(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
      if (Ctor) this.ctx = new Ctor();
    }
    // iOS suspends the context until a user gesture resumes it.
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private beep(freq: number, durMs: number, type: OscillatorType = 'sine', gain = 0.06): void {
    const ctx = this.ac();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g).connect(ctx.destination);
    const t = ctx.currentTime;
    osc.start(t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + durMs / 1000);
    osc.stop(t + durMs / 1000);
  }

  /** Resume the audio context — call from the first tap (iOS autoplay policy). */
  unlock(): void {
    this.ac();
  }
  spin(): void {
    this.beep(220, 120, 'sawtooth', 0.03);
  }
  reelStop(): void {
    this.beep(330, 60, 'square', 0.03);
  }
  win(stepMult: number): void {
    const f = 440 + Math.min(stepMult, 30) * 30;
    this.beep(f, 140, 'triangle', 0.05);
  }
  bigWin(): void {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.beep(f, 220, 'triangle', 0.07), i * 110));
  }
  bonus(): void {
    [392, 523, 659].forEach((f, i) => setTimeout(() => this.beep(f, 180, 'square', 0.06), i * 90));
  }
}

export const sfx = new Sfx();
