import { Graphics } from 'pixi.js';
import type { Motif } from '../skins';

/**
 * Vector symbol artwork drawn in PixiJS — fully colored, glossy, with specular
 * highlights and depth. Resolution-independent ("HD"), emoji-free. Drawn over a
 * dark glass cell (see TilePool) so the colours pop with a neon feel.
 */
const WHITE = 0xffffff;

/** Draw a motif centered in a `size`×`size` box. */
export function drawSymbol(g: Graphics, motif: Motif, size: number): void {
  g.clear();
  const c = size / 2;
  const R = size * 0.31;
  const lw = Math.max(2, size * 0.06);
  // soft drop-shadow plate behind every icon for depth
  shadow(g, c, c, R);

  switch (motif) {
    case 'skull': {
      g.ellipse(c, c - R * 0.16, R * 0.82, R * 0.86).fill(0xf3efe2);
      g.roundRect(c - R * 0.52, c + R * 0.32, R * 1.04, R * 0.56, R * 0.18).fill(0xf3efe2);
      g.ellipse(c, c - R * 0.16, R * 0.82, R * 0.86).fill({ color: 0xfffefb, alpha: 0.0 });
      g.ellipse(c - R * 0.3, c - R * 0.5, R * 0.3, R * 0.22).fill({ color: WHITE, alpha: 0.5 });
      g.circle(c - R * 0.34, c - R * 0.08, R * 0.26).fill(0x241b2e);
      g.circle(c + R * 0.34, c - R * 0.08, R * 0.26).fill(0x241b2e);
      g.circle(c - R * 0.4, c - R * 0.14, R * 0.08).fill({ color: 0x6cf0ff, alpha: 0.9 });
      g.circle(c + R * 0.28, c - R * 0.14, R * 0.08).fill({ color: 0x6cf0ff, alpha: 0.9 });
      g.poly([c, c + R * 0.16, c - R * 0.12, c + R * 0.4, c + R * 0.12, c + R * 0.4]).fill(0x241b2e);
      g.rect(c - R * 0.3, c + R * 0.6, R * 0.16, R * 0.3).fill(0x241b2e);
      g.rect(c + R * 0.14, c + R * 0.6, R * 0.16, R * 0.3).fill(0x241b2e);
      break;
    }
    case 'anchor': {
      const steel = 0xd7e2f4;
      g.circle(c, c - R * 0.72, R * 0.22).stroke({ width: lw, color: steel });
      g.moveTo(c, c - R * 0.5).lineTo(c, c + R * 0.78).stroke({ width: lw, color: steel, cap: 'round' });
      g.moveTo(c - R * 0.44, c - R * 0.28).lineTo(c + R * 0.44, c - R * 0.28).stroke({ width: lw, color: steel, cap: 'round' });
      g.moveTo(c - R * 0.72, c + R * 0.22)
        .quadraticCurveTo(c - R * 0.72, c + R * 0.86, c, c + R * 0.86)
        .quadraticCurveTo(c + R * 0.72, c + R * 0.86, c + R * 0.72, c + R * 0.22)
        .stroke({ width: lw, color: steel, cap: 'round' });
      g.moveTo(c - R * 0.72, c + R * 0.22).lineTo(c - R * 0.96, c + R * 0.06).stroke({ width: lw, color: steel, cap: 'round' });
      g.moveTo(c + R * 0.72, c + R * 0.22).lineTo(c + R * 0.96, c + R * 0.06).stroke({ width: lw, color: steel, cap: 'round' });
      g.circle(c, c - R * 0.72, R * 0.22).stroke({ width: lw * 0.4, color: WHITE, alpha: 0.6 });
      break;
    }
    case 'sword': {
      const steel = 0xdde6f5;
      g.poly([c, c - R, c - R * 0.16, c - R * 0.7, c - R * 0.16, c + R * 0.34, c + R * 0.16, c + R * 0.34, c + R * 0.16, c - R * 0.7]).fill(steel);
      g.poly([c, c - R, c - R * 0.16, c - R * 0.7, c, c + R * 0.34]).fill({ color: WHITE, alpha: 0.55 });
      g.poly([c, c - R, c + R * 0.16, c - R * 0.7, c, c - R * 0.5]).fill(0x9fb0c8);
      g.roundRect(c - R * 0.52, c + R * 0.32, R * 1.04, R * 0.2, R * 0.08).fill(0xffcf5a);
      g.rect(c - R * 0.1, c + R * 0.5, R * 0.2, R * 0.34).fill(0x7a4b22);
      g.circle(c, c + R * 0.88, R * 0.16).fill(0xffcf5a);
      break;
    }
    case 'coin': {
      g.circle(c, c, R * 0.95).fill(0xc9912a);
      g.circle(c, c, R * 0.78).fill(0xffd24a);
      g.circle(c, c, R * 0.78).stroke({ width: lw * 0.7, color: 0xb9831f });
      g.ellipse(c - R * 0.22, c - R * 0.3, R * 0.26, R * 0.16).fill({ color: WHITE, alpha: 0.55 });
      sparkle(g, c, c, R * 0.46, 0xfff6cf);
      break;
    }
    case 'compass': {
      g.circle(c, c, R * 0.95).fill(0x223049);
      g.circle(c, c, R * 0.95).stroke({ width: lw * 0.8, color: 0xd7e2f4 });
      g.circle(c, c, R * 0.75).stroke({ width: lw * 0.4, color: 0x8b97ab, alpha: 0.7 });
      g.poly([c, c - R * 0.64, c + R * 0.22, c, c, c + R * 0.64, c - R * 0.22, c]).fill(0xeef3fb);
      g.poly([c, c - R * 0.64, c - R * 0.22, c, c, c]).fill(0xff5d73);
      g.circle(c, c, R * 0.12).fill(0x223049);
      break;
    }
    case 'heart':
      gloss(g, () => heart(g, c, c, R), c, c, R, 0xff4d6d, 0xc01f43);
      break;
    case 'spade': {
      gloss(
        g,
        () => {
          g.moveTo(c, c - R * 0.85)
            .bezierCurveTo(c + R * 0.95, c + R * 0.05, c + R * 0.55, c + R * 0.6, c + R * 0.12, c + R * 0.42)
            .lineTo(c - R * 0.12, c + R * 0.42)
            .bezierCurveTo(c - R * 0.55, c + R * 0.6, c - R * 0.95, c + R * 0.05, c, c - R * 0.85);
          g.poly([c, c + R * 0.3, c - R * 0.28, c + R * 0.92, c + R * 0.28, c + R * 0.92]);
        },
        c,
        c,
        R,
        0xe6ebf5,
        0x9aa6bd
      );
      break;
    }
    case 'diamond':
      gloss(g, () => g.poly([c, c - R * 0.92, c + R * 0.72, c, c, c + R * 0.92, c - R * 0.72, c]), c, c, R, 0x4fd0ff, 0x1d8fcf);
      break;
    case 'club': {
      gloss(
        g,
        () => {
          g.circle(c, c - R * 0.35, R * 0.4);
          g.circle(c - R * 0.42, c + R * 0.15, R * 0.4);
          g.circle(c + R * 0.42, c + R * 0.15, R * 0.4);
          g.poly([c, c + R * 0.1, c - R * 0.26, c + R * 0.92, c + R * 0.26, c + R * 0.92]);
        },
        c,
        c,
        R,
        0x52e08a,
        0x1f9457
      );
      break;
    }
    case 'star':
      gloss(g, () => starPath(g, c, c, R * 0.98, R * 0.42), c, c, R, 0xffd24a, 0xd49a1f);
      break;
    case 'revolver': {
      const steel = 0xc9d4e6;
      g.roundRect(c - R * 0.85, c - R * 0.32, R * 1.5, R * 0.44, R * 0.1).fill(steel);
      g.roundRect(c - R * 0.85, c - R * 0.32, R * 1.5, R * 0.18, R * 0.1).fill({ color: WHITE, alpha: 0.4 });
      g.circle(c + R * 0.68, c - R * 0.1, R * 0.13).fill(0x2a3344);
      g.poly([c - R * 0.5, c + R * 0.1, c - R * 0.08, c + R * 0.1, c - R * 0.34, c + R * 0.86, c - R * 0.78, c + R * 0.86]).fill(0x7a4b22);
      g.moveTo(c - R * 0.1, c + R * 0.12).quadraticCurveTo(c - R * 0.1, c + R * 0.5, c - R * 0.42, c + R * 0.5).stroke({ width: lw * 0.8, color: steel });
      break;
    }
    case 'hat': {
      g.ellipse(c, c + R * 0.5, R * 1.0, R * 0.3).fill(0x7a4b22);
      g.moveTo(c - R * 0.5, c + R * 0.45)
        .quadraticCurveTo(c - R * 0.42, c - R * 0.78, c, c - R * 0.72)
        .quadraticCurveTo(c + R * 0.42, c - R * 0.78, c + R * 0.5, c + R * 0.45)
        .fill(0x9c5e2a);
      g.ellipse(c, c + R * 0.5, R * 1.0, R * 0.3).stroke({ width: lw * 0.4, color: WHITE, alpha: 0.25 });
      g.rect(c - R * 0.52, c + R * 0.26, R * 1.04, R * 0.18).fill(0x5c3413);
      break;
    }
    case 'gem': {
      g.poly([c - R * 0.55, c - R * 0.45, c + R * 0.55, c - R * 0.45, c, c + R * 0.98]).fill(0x2ee6ff);
      g.poly([c - R * 0.86, c - R * 0.05, c - R * 0.55, c - R * 0.45, c + R * 0.55, c - R * 0.45, c + R * 0.86, c - R * 0.05]).fill(0x9af6ff);
      g.poly([c - R * 0.55, c - R * 0.45, c, c + R * 0.98, c - R * 0.18, c - R * 0.45]).fill({ color: 0x14b8d8, alpha: 0.85 });
      g.moveTo(c - R * 0.86, c - R * 0.05).lineTo(c + R * 0.86, c - R * 0.05).stroke({ width: lw * 0.4, color: WHITE, alpha: 0.7 });
      sparkle(g, c + R * 0.3, c - R * 0.2, R * 0.28, WHITE);
      break;
    }
    case 'cherry': {
      g.moveTo(c - R * 0.4, c + R * 0.45).quadraticCurveTo(c, c - R * 0.45, c + R * 0.5, c - R * 0.8).stroke({ width: lw * 0.7, color: 0x4caf50, cap: 'round' });
      g.moveTo(c + R * 0.4, c + R * 0.45).quadraticCurveTo(c + R * 0.2, c - R * 0.35, c + R * 0.5, c - R * 0.8).stroke({ width: lw * 0.7, color: 0x4caf50, cap: 'round' });
      ball(g, c - R * 0.4, c + R * 0.55, R * 0.36, 0xff4d5e, 0xb01f33);
      ball(g, c + R * 0.42, c + R * 0.5, R * 0.36, 0xff4d5e, 0xb01f33);
      g.poly([c + R * 0.5, c - R * 0.82, c + R * 1.0, c - R * 1.0, c + R * 0.72, c - R * 0.5]).fill(0x4caf50);
      break;
    }
    case 'lemon': {
      ballEllipse(g, c, c, R * 0.64, R * 0.86, 0xffd84a, 0xd9a21f);
      g.ellipse(c - R * 0.18, c - R * 0.22, R * 0.18, R * 0.3).fill({ color: WHITE, alpha: 0.4 });
      g.poly([c + R * 0.2, c - R * 0.8, c + R * 0.64, c - R * 0.98, c + R * 0.36, c - R * 0.52]).fill(0x4caf50);
      break;
    }
    case 'grape': {
      const pts: [number, number][] = [
        [0, -0.22], [-0.36, 0.04], [0.36, 0.04], [-0.18, 0.34], [0.18, 0.34], [0, 0.66]
      ];
      for (const [x, y] of pts) ball(g, c + x * R, c + y * R, R * 0.27, 0xb07bff, 0x6e3fc0);
      g.poly([c, c - R * 0.42, c + R * 0.5, c - R * 0.78, c + R * 0.12, c - R * 0.32]).fill(0x4caf50);
      break;
    }
    case 'bell': {
      g.moveTo(c - R * 0.72, c + R * 0.46)
        .quadraticCurveTo(c - R * 0.72, c - R * 0.72, c, c - R * 0.8)
        .quadraticCurveTo(c + R * 0.72, c - R * 0.72, c + R * 0.72, c + R * 0.46)
        .lineTo(c - R * 0.72, c + R * 0.46)
        .fill(0xffd24a);
      g.moveTo(c - R * 0.72, c + R * 0.46).quadraticCurveTo(c - R * 0.4, c - R * 0.5, c, c - R * 0.6).lineTo(c, c + R * 0.46).fill({ color: WHITE, alpha: 0.35 });
      g.roundRect(c - R * 0.84, c + R * 0.46, R * 1.68, R * 0.2, R * 0.08).fill(0xe0a91f);
      g.circle(c, c + R * 0.82, R * 0.17).fill(0xe0a91f);
      g.circle(c, c - R * 0.84, R * 0.12).fill(0xe0a91f);
      break;
    }
    default:
      break;
  }
}

/** Soft dark shadow blob behind an icon for depth. */
function shadow(g: Graphics, cx: number, cy: number, R: number): void {
  g.ellipse(cx, cy + R * 0.95, R * 0.7, R * 0.18).fill({ color: 0x000000, alpha: 0.28 });
}

/** Fill a shape, give it a darker defined edge, and a top sheen highlight. */
function gloss(g: Graphics, path: () => void, cx: number, cy: number, R: number, light: number, dark: number): void {
  path();
  g.fill(light);
  path();
  g.stroke({ width: R * 0.13, color: dark, alpha: 0.7, join: 'round' });
  g.ellipse(cx - R * 0.16, cy - R * 0.32, R * 0.36, R * 0.22).fill({ color: WHITE, alpha: 0.3 });
}

function ball(g: Graphics, x: number, y: number, r: number, light: number, dark: number): void {
  g.circle(x, y, r).fill(dark);
  g.circle(x, y - r * 0.08, r * 0.92).fill(light);
  g.ellipse(x - r * 0.3, y - r * 0.35, r * 0.3, r * 0.22).fill({ color: WHITE, alpha: 0.55 });
}
function ballEllipse(g: Graphics, x: number, y: number, rx: number, ry: number, light: number, dark: number): void {
  g.ellipse(x, y, rx, ry).fill(dark);
  g.ellipse(x, y - ry * 0.06, rx * 0.92, ry * 0.92).fill(light);
}

function sparkle(g: Graphics, x: number, y: number, r: number, color: number): void {
  g.poly([x, y - r, x + r * 0.18, y - r * 0.18, x + r, y, x + r * 0.18, y + r * 0.18, x, y + r, x - r * 0.18, y + r * 0.18, x - r, y, x - r * 0.18, y - r * 0.18]).fill(color);
}

function starPath(g: Graphics, cx: number, cy: number, outer: number, inner: number): void {
  const pts: number[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  g.poly(pts);
}

function heart(g: Graphics, cx: number, cy: number, R: number): void {
  g.moveTo(cx, cy + R * 0.8)
    .bezierCurveTo(cx - R * 1.1, cy - R * 0.2, cx - R * 0.5, cy - R * 0.9, cx, cy - R * 0.35)
    .bezierCurveTo(cx + R * 0.5, cy - R * 0.9, cx + R * 1.1, cy - R * 0.2, cx, cy + R * 0.8);
}
