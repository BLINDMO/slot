import { Graphics } from 'pixi.js';
import type { Motif } from '../skins';

/**
 * Vector symbol artwork drawn directly in PixiJS — resolution-independent ("HD")
 * and emoji-free. Each motif is drawn as a clean white icon with light shading
 * over the tile's coloured plate, for a cohesive modern slot look.
 */
const LT = 0xffffff;
const SH = 0xc6d2e0;
const DK = 0x17222e;

/** Draw a motif centered in a `size`×`size` box. */
export function drawSymbol(g: Graphics, motif: Motif, size: number): void {
  g.clear();
  const c = size / 2;
  const R = size * 0.3;
  const lw = Math.max(2, size * 0.07);

  switch (motif) {
    case 'skull': {
      g.ellipse(c, c - R * 0.18, R * 0.78, R * 0.82).fill(LT);
      g.roundRect(c - R * 0.5, c + R * 0.3, R, R * 0.55, R * 0.18).fill(LT);
      g.circle(c - R * 0.34, c - R * 0.1, R * 0.24).fill(DK);
      g.circle(c + R * 0.34, c - R * 0.1, R * 0.24).fill(DK);
      g.poly([c, c + R * 0.18, c - R * 0.12, c + R * 0.42, c + R * 0.12, c + R * 0.42]).fill(DK);
      g.rect(c - R * 0.28, c + R * 0.62, R * 0.16, R * 0.28).fill(DK);
      g.rect(c + R * 0.12, c + R * 0.62, R * 0.16, R * 0.28).fill(DK);
      break;
    }
    case 'anchor': {
      g.circle(c, c - R * 0.72, R * 0.2).stroke({ width: lw, color: LT });
      g.moveTo(c, c - R * 0.5).lineTo(c, c + R * 0.78).stroke({ width: lw, color: LT, cap: 'round' });
      g.moveTo(c - R * 0.42, c - R * 0.28).lineTo(c + R * 0.42, c - R * 0.28).stroke({ width: lw, color: LT, cap: 'round' });
      g.moveTo(c - R * 0.7, c + R * 0.25)
        .quadraticCurveTo(c - R * 0.7, c + R * 0.85, c, c + R * 0.85)
        .quadraticCurveTo(c + R * 0.7, c + R * 0.85, c + R * 0.7, c + R * 0.25)
        .stroke({ width: lw, color: LT, cap: 'round' });
      g.moveTo(c - R * 0.7, c + R * 0.25).lineTo(c - R * 0.92, c + R * 0.1).stroke({ width: lw, color: LT, cap: 'round' });
      g.moveTo(c + R * 0.7, c + R * 0.25).lineTo(c + R * 0.92, c + R * 0.1).stroke({ width: lw, color: LT, cap: 'round' });
      break;
    }
    case 'sword': {
      g.poly([c, c - R, c - R * 0.16, c - R * 0.7, c - R * 0.16, c + R * 0.35, c + R * 0.16, c + R * 0.35, c + R * 0.16, c - R * 0.7]).fill(LT);
      g.poly([c, c - R, c + R * 0.16, c - R * 0.7, c, c - R * 0.55]).fill(SH);
      g.roundRect(c - R * 0.5, c + R * 0.33, R, R * 0.18, R * 0.08).fill(SH);
      g.rect(c - R * 0.1, c + R * 0.5, R * 0.2, R * 0.32).fill(SH);
      g.circle(c, c + R * 0.86, R * 0.16).fill(LT);
      break;
    }
    case 'coin': {
      g.circle(c, c, R * 0.92).fill(0xe9b73a);
      g.circle(c, c, R * 0.72).fill(0xf6d066);
      g.circle(c, c, R * 0.72).stroke({ width: lw * 0.7, color: 0xc9982a });
      star(g, c, c, R * 0.42, R * 0.18, 4, 0xfff1c0);
      break;
    }
    case 'compass': {
      g.circle(c, c, R * 0.92).stroke({ width: lw, color: LT });
      g.circle(c, c, R * 0.74).stroke({ width: lw * 0.5, color: SH, alpha: 0.7 });
      g.poly([c, c - R * 0.62, c + R * 0.22, c, c, c + R * 0.62, c - R * 0.22, c]).fill(LT);
      g.poly([c, c - R * 0.62, c - R * 0.22, c, c, c]).fill(0xff6b6b);
      g.circle(c, c, R * 0.12).fill(DK);
      break;
    }
    case 'heart':
      heart(g, c, c, R);
      break;
    case 'spade': {
      g.moveTo(c, c - R * 0.85)
        .bezierCurveTo(c + R * 0.95, c + R * 0.05, c + R * 0.55, c + R * 0.6, c + R * 0.12, c + R * 0.42)
        .lineTo(c - R * 0.12, c + R * 0.42)
        .bezierCurveTo(c - R * 0.55, c + R * 0.6, c - R * 0.95, c + R * 0.05, c, c - R * 0.85)
        .fill(LT);
      g.poly([c, c + R * 0.3, c - R * 0.28, c + R * 0.92, c + R * 0.28, c + R * 0.92]).fill(LT);
      break;
    }
    case 'diamond':
      g.poly([c, c - R * 0.92, c + R * 0.7, c, c, c + R * 0.92, c - R * 0.7, c]).fill(LT);
      g.poly([c, c - R * 0.92, c + R * 0.7, c, c, c]).fill(SH);
      break;
    case 'club': {
      g.circle(c, c - R * 0.35, R * 0.4).fill(LT);
      g.circle(c - R * 0.42, c + R * 0.15, R * 0.4).fill(LT);
      g.circle(c + R * 0.42, c + R * 0.15, R * 0.4).fill(LT);
      g.poly([c, c + R * 0.1, c - R * 0.26, c + R * 0.92, c + R * 0.26, c + R * 0.92]).fill(LT);
      break;
    }
    case 'star':
      star(g, c, c, R * 0.98, R * 0.42, 5, LT);
      break;
    case 'revolver': {
      g.roundRect(c - R * 0.85, c - R * 0.3, R * 1.5, R * 0.42, R * 0.1).fill(LT);
      g.circle(c + R * 0.7, c - R * 0.09, R * 0.12).fill(DK);
      g.poly([c - R * 0.5, c + R * 0.1, c - R * 0.1, c + R * 0.1, c - R * 0.35, c + R * 0.85, c - R * 0.78, c + R * 0.85]).fill(LT);
      g.moveTo(c - R * 0.1, c + R * 0.12).quadraticCurveTo(c - R * 0.1, c + R * 0.5, c - R * 0.42, c + R * 0.5).stroke({ width: lw * 0.8, color: LT });
      break;
    }
    case 'hat': {
      g.ellipse(c, c + R * 0.5, R * 1.0, R * 0.28).fill(LT);
      g.moveTo(c - R * 0.5, c + R * 0.45)
        .quadraticCurveTo(c - R * 0.42, c - R * 0.75, c, c - R * 0.7)
        .quadraticCurveTo(c + R * 0.42, c - R * 0.75, c + R * 0.5, c + R * 0.45)
        .fill(LT);
      g.rect(c - R * 0.52, c + R * 0.28, R * 1.04, R * 0.16).fill(SH);
      break;
    }
    case 'gem': {
      g.poly([c - R * 0.55, c - R * 0.45, c + R * 0.55, c - R * 0.45, c, c + R * 0.95]).fill(LT);
      g.poly([c - R * 0.85, c - R * 0.05, c - R * 0.55, c - R * 0.45, c + R * 0.55, c - R * 0.45, c + R * 0.85, c - R * 0.05]).fill(0xeaf3ff);
      g.poly([c - R * 0.55, c - R * 0.45, c, c + R * 0.95, c - R * 0.2, c - R * 0.45]).fill(SH);
      g.moveTo(c - R * 0.85, c - R * 0.05).lineTo(c + R * 0.85, c - R * 0.05).stroke({ width: lw * 0.5, color: 0x9fb3c8 });
      break;
    }
    case 'cherry': {
      g.moveTo(c - R * 0.4, c + R * 0.45)
        .quadraticCurveTo(c, c - R * 0.4, c + R * 0.45, c - R * 0.75)
        .stroke({ width: lw * 0.7, color: SH, cap: 'round' });
      g.moveTo(c + R * 0.4, c + R * 0.45)
        .quadraticCurveTo(c + R * 0.2, c - R * 0.3, c + R * 0.45, c - R * 0.75)
        .stroke({ width: lw * 0.7, color: SH, cap: 'round' });
      g.circle(c - R * 0.4, c + R * 0.55, R * 0.34).fill(LT);
      g.circle(c + R * 0.42, c + R * 0.5, R * 0.34).fill(LT);
      g.poly([c + R * 0.45, c - R * 0.78, c + R * 0.95, c - R * 0.95, c + R * 0.7, c - R * 0.5]).fill(SH);
      break;
    }
    case 'lemon': {
      g.ellipse(c, c, R * 0.62, R * 0.85).fill(LT);
      g.ellipse(c - R * 0.18, c - R * 0.2, R * 0.18, R * 0.3).fill(0xffffff);
      g.ellipse(c - R * 0.18, c - R * 0.2, R * 0.18, R * 0.3).fill({ color: 0xeef4fb });
      g.poly([c + R * 0.2, c - R * 0.78, c + R * 0.62, c - R * 0.95, c + R * 0.36, c - R * 0.5]).fill(SH);
      break;
    }
    case 'grape': {
      const pts: [number, number][] = [
        [0, -0.2], [-0.36, 0.05], [0.36, 0.05], [-0.18, 0.35], [0.18, 0.35], [0, 0.68]
      ];
      for (const [x, y] of pts) g.circle(c + x * R, c + y * R, R * 0.26).fill(LT);
      g.poly([c, c - R * 0.4, c + R * 0.5, c - R * 0.75, c + R * 0.12, c - R * 0.3]).fill(SH);
      break;
    }
    case 'bell': {
      g.moveTo(c - R * 0.7, c + R * 0.45)
        .quadraticCurveTo(c - R * 0.7, c - R * 0.7, c, c - R * 0.78)
        .quadraticCurveTo(c + R * 0.7, c - R * 0.7, c + R * 0.7, c + R * 0.45)
        .lineTo(c - R * 0.7, c + R * 0.45)
        .fill(LT);
      g.roundRect(c - R * 0.82, c + R * 0.45, R * 1.64, R * 0.18, R * 0.08).fill(LT);
      g.circle(c, c + R * 0.78, R * 0.16).fill(SH);
      g.circle(c, c - R * 0.82, R * 0.12).fill(SH);
      break;
    }
    default:
      break;
  }
}

/** Filled n-point star. */
function star(g: Graphics, cx: number, cy: number, outer: number, inner: number, points: number, color: number): void {
  const pts: number[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  g.poly(pts).fill(color);
}

function heart(g: Graphics, cx: number, cy: number, R: number): void {
  g.moveTo(cx, cy + R * 0.8)
    .bezierCurveTo(cx - R * 1.1, cy - R * 0.2, cx - R * 0.5, cy - R * 0.9, cx, cy - R * 0.35)
    .bezierCurveTo(cx + R * 0.5, cy - R * 0.9, cx + R * 1.1, cy - R * 0.2, cx, cy + R * 0.8)
    .fill(LT);
}
