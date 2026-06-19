import { Container, Graphics } from 'pixi.js';
import { gsap } from 'gsap';

interface Particle {
  g: Graphics;
  active: boolean;
}

/**
 * A small, hard-capped particle system for win celebrations: coin/spark bursts
 * and tile shatter shards. Everything is GSAP-driven (so it shares the same
 * ticker and respects tween-kill on destroy) and pooled, so a max-win blast can
 * never spawn an unbounded number of Graphics — important on iOS where fill-rate
 * and GC are the bottleneck.
 */
export class ParticleSystem {
  private layer = new Container();
  private pool: Particle[] = [];
  private cap: number;

  constructor(parent: Container, cap = 140) {
    this.cap = cap;
    parent.addChild(this.layer);
  }

  private take(): Particle | null {
    let p = this.pool.find((x) => !x.active);
    if (!p) {
      if (this.pool.length >= this.cap) return null;
      p = { g: new Graphics(), active: false };
      this.pool.push(p);
      this.layer.addChild(p.g);
    }
    p.active = true;
    p.g.visible = true;
    return p;
  }

  private free(p: Particle): void {
    p.active = false;
    p.g.visible = false;
    gsap.killTweensOf(p.g);
    gsap.killTweensOf(p.g.scale);
  }

  /** Coin/spark fountain from a point, scaled by intensity 0..1. */
  burst(x: number, y: number, intensity: number, color = 0xe8c468): void {
    const n = Math.round(12 + intensity * 60);
    for (let i = 0; i < n; i++) {
      const p = this.take();
      if (!p) break;
      const r = 3 + Math.random() * 4;
      p.g.clear();
      // Alternate coins (gold discs) and bright sparks.
      if (i % 3 === 0) {
        p.g.circle(0, 0, r).fill(0xffffff);
        p.g.circle(0, 0, r * 0.7).fill(color);
      } else {
        p.g.rect(-r * 0.4, -r * 0.4, r * 0.8, r * 0.8).fill(color);
      }
      p.g.position.set(x, y);
      p.g.alpha = 1;
      p.g.scale.set(1);

      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      const speed = 60 + Math.random() * (140 + intensity * 220);
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed;
      const dur = 0.6 + Math.random() * 0.7;

      // Launch up/out, then let gravity pull it down past the bottom.
      gsap.to(p.g, {
        x: x + dx,
        duration: dur,
        ease: 'none'
      });
      gsap.to(p.g, {
        y: y + dy,
        duration: dur * 0.45,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(p.g, {
            y: y + dy + 320,
            duration: dur * 0.55,
            ease: 'power2.in'
          });
        }
      });
      gsap.to(p.g, { alpha: 0, duration: dur, ease: 'power1.in', onComplete: () => this.free(p) });
      gsap.to(p.g.scale, { x: 0.4, y: 0.4, duration: dur, ease: 'power1.in' });
    }
  }

  /** Shatter shards flying out from a cleared tile centre. */
  shatter(x: number, y: number, color: number): void {
    const n = 6;
    for (let i = 0; i < n; i++) {
      const p = this.take();
      if (!p) break;
      const r = 3 + Math.random() * 5;
      p.g.clear();
      p.g.poly([-r, -r, r, -r * 0.5, r * 0.6, r]).fill(color);
      p.g.position.set(x, y);
      p.g.alpha = 1;
      p.g.scale.set(1);
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      gsap.to(p.g, {
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed + 40,
        rotation: (Math.random() - 0.5) * 6,
        alpha: 0,
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => this.free(p)
      });
    }
  }

  /** Stop all particle tweens without destroying the layer (the renderer's root
   *  teardown destroys the display objects). Prevents GSAP ticking dead graphics. */
  killTweens(): void {
    for (const p of this.pool) {
      gsap.killTweensOf(p.g);
      gsap.killTweensOf(p.g.scale);
    }
  }

  destroy(): void {
    this.killTweens();
    this.layer.destroy({ children: true });
    this.pool = [];
  }
}
