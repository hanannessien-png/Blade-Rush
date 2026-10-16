/**
 * World backgrounds: sky gradient, glow, far and near silhouettes (recorded
 * once per world/palette/height) and stateless ambient particles drawn per frame.
 */
import { Skia, type SkCanvas, type SkPicture } from '@shopify/react-native-skia';
import type { AmbientParticle, Silhouette, WorldDef } from '../../data/worlds';
import { lighten, withAlpha } from './color';
import { artRand, blurred, fill, linear, oval, poly, radial, record, sparkle, stroke } from './sk';

export const BG_MARGIN = 30;
const W = 360;

export interface WorldPalette {
  sky: readonly [string, string, string];
  far: string;
  near: string;
  glow: string;
  particleColor: string;
}

function hills(c: SkCanvas, y: number, amp: number, color: string, seed: number, h: number): void {
  const r = artRand(seed);
  const p = Skia.Path.Make();
  p.moveTo(-BG_MARGIN, h);
  p.lineTo(-BG_MARGIN, y);
  for (let x = -BG_MARGIN; x <= W + BG_MARGIN; x += 40) {
    p.quadTo(x + 20, y - amp * (0.5 + r()), x + 40, y + (r() - 0.5) * amp * 0.4);
  }
  p.lineTo(W + BG_MARGIN, h);
  p.close();
  c.drawPath(p, fill(color));
}

function drawFar(c: SkCanvas, kind: Silhouette, color: string, h: number, glow: string): void {
  const r = artRand(kind.length * 131);
  const base = h * 0.78;
  const col = fill(color);
  switch (kind) {
    case 'workshop': {
      for (let i = 0; i < 4; i++) c.drawRect(Skia.XYWHRect(-10, h * 0.12 + i * 70, 120, 6), col);
      for (let i = 0; i < 3; i++) c.drawRect(Skia.XYWHRect(250, h * 0.18 + i * 80, 130, 6), col);
      for (let i = 0; i < 5; i++) {
        const x = 10 + i * 22;
        c.drawRect(Skia.XYWHRect(x, h * 0.12 + 6, 4, 18 + r() * 14), col);
      }
      c.drawCircle(300, h * 0.1, 26, col);
      c.drawCircle(300, h * 0.1, 8, fill(lighten(color, 0.15)));
      hills(c, base, 20, color, 3, h);
      break;
    }
    case 'trees':
      for (let i = 0; i < 9; i++) {
        const x = -20 + i * 50 + r() * 20;
        const y = base - 40 - r() * 60;
        c.drawCircle(x, y, 40 + r() * 20, col);
        c.drawCircle(x + 28, y + 14, 30, col);
      }
      hills(c, base, 20, color, 5, h);
      break;
    case 'stalactites':
      for (let i = 0; i < 12; i++) {
        const x = -20 + i * 34 + r() * 10;
        const len = 50 + r() * 110;
        c.drawPath(poly([[x - 14, -5], [x + 14, -5], [x + 2, len]]), col);
      }
      for (let i = 0; i < 8; i++) {
        const x = -10 + i * 52 + r() * 14;
        const hh = 40 + r() * 80;
        c.drawPath(poly([[x - 16, h], [x + 16, h], [x + 4, h - hh - h * 0.15]]), col);
      }
      break;
    case 'mesas':
      for (let i = 0; i < 4; i++) {
        const x = -40 + i * 110 + r() * 30;
        const top = base - 80 - r() * 90;
        c.drawPath(poly([[x, h], [x + 10, top + 10], [x + 18, top], [x + 80, top], [x + 90, top + 12], [x + 100, h]]), col);
      }
      hills(c, base + 20, 14, color, 9, h);
      break;
    case 'volcano':
      c.drawPath(poly([[-40, h], [110, base - 230], [170, base - 230], [400, h]]), col);
      c.drawCircle(140, base - 236, 46, blurred(fill(glow, 0.7), 20));
      hills(c, base + 10, 30, color, 4, h);
      break;
    case 'skyline':
      for (let i = 0; i < 12; i++) {
        const bw = 26 + r() * 22;
        const x = -20 + i * 34;
        const top = base - 60 - r() * 200;
        c.drawRect(Skia.XYWHRect(x, top, bw, h - top), col);
        const win = fill(i % 3 === 0 ? '#FF3DF2' : '#29F0FF', 0.45);
        for (let wy = top + 10; wy < base; wy += 16) {
          for (let wx = x + 5; wx < x + bw - 6; wx += 9) if (r() > 0.6) c.drawRect(Skia.XYWHRect(wx, wy, 4, 6), win);
        }
      }
      break;
    case 'manor': {
      const y = base - 120;
      c.drawRect(Skia.XYWHRect(60, y, 240, h - y), col);
      c.drawPath(poly([[50, y], [180, y - 70], [310, y]]), col);
      for (const x of [40, 280]) {
        c.drawRect(Skia.XYWHRect(x, y - 60, 40, h - y + 60), col);
        c.drawPath(poly([[x - 6, y - 60], [x + 20, y - 110], [x + 46, y - 60]]), col);
      }
      const win = fill('#FFE89A', 0.55);
      for (let i = 0; i < 6; i++) c.drawRect(Skia.XYWHRect(85 + i * 36, y + 30, 12, 18), win);
      c.drawCircle(290, h * 0.12, 30, fill('#F2F0D8', 0.85));
      break;
    }
    case 'cove': {
      const sea = base + 10;
      c.drawRect(Skia.XYWHRect(-BG_MARGIN, sea, W + BG_MARGIN * 2, h - sea), fill(color));
      c.drawPath(poly([[200, sea], [320, sea], [305, sea + 16], [215, sea + 16]]), fill(lighten(color, 0.08)));
      c.drawRect(Skia.XYWHRect(258, sea - 120, 4, 120), col);
      c.drawPath(poly([[262, sea - 115], [262, sea - 30], [310, sea - 40]]), fill(lighten(color, 0.1)));
      c.drawPath(poly([[258, sea - 100], [258, sea - 30], [215, sea - 40]]), fill(lighten(color, 0.06)));
      for (let i = 0; i < 6; i++) c.drawLine(-10 + i * 70, sea + 30 + i * 6, 30 + i * 70, sea + 30 + i * 6, stroke('#FFFFFF', 2, 0.15));
      break;
    }
    case 'planets':
      c.drawCircle(280, h * 0.16, 54, radial(260, h * 0.14, 70, [lighten(color, 0.35), color]));
      oval(c, 280, h * 0.16, 90, 14, stroke(lighten(color, 0.4), 3, 0.6));
      c.drawCircle(60, h * 0.62, 26, radial(52, h * 0.6, 30, [lighten(color, 0.3), color]));
      for (let i = 0; i < 70; i++) c.drawCircle(r() * W, r() * h, 0.6 + r() * 1.2, fill('#FFFFFF', 0.3 + r() * 0.6));
      break;
    case 'candyhills':
      hills(c, base - 40, 50, color, 11, h);
      for (let i = 0; i < 5; i++) {
        const x = 20 + i * 80;
        const y = base - 90 - r() * 40;
        c.drawRect(Skia.XYWHRect(x - 2, y, 4, 90), fill('#FFFFFF', 0.6));
        c.drawCircle(x, y, 18, fill(lighten(color, 0.25)));
        c.drawCircle(x, y, 10, stroke('#FFFFFF', 3, 0.6));
      }
      break;
    case 'temple': {
      const y = base - 160;
      for (let s = 0; s < 5; s++) c.drawRect(Skia.XYWHRect(90 + s * 18, y + s * 32, 180 - s * 36, 34), col);
      c.drawRect(Skia.XYWHRect(150, y - 30, 60, 30), col);
      hills(c, base + 10, 18, color, 13, h);
      break;
    }
    case 'palace': {
      const y = base - 140;
      c.drawRect(Skia.XYWHRect(40, y, 280, h - y), col);
      c.drawCircle(180, y, 56, col);
      for (const x of [40, 300]) {
        c.drawRect(Skia.XYWHRect(x - 14, y - 70, 28, 80), col);
        c.drawCircle(x, y - 72, 18, col);
        c.drawLine(x, y - 90, x, y - 112, stroke(color, 2));
        c.drawPath(poly([[x, y - 112], [x + 16, y - 106], [x, y - 100]]), fill(glow, 0.8));
      }
      const win = fill('#FFE07A', 0.5);
      for (let i = 0; i < 7; i++) c.drawRRect(Skia.RRectXY(Skia.XYWHRect(62 + i * 36, y + 30, 14, 26), 7, 7), win);
      break;
    }
  }
}

function drawNear(c: SkCanvas, kind: Silhouette, color: string, h: number): void {
  const r = artRand(kind.length * 977);
  const col = fill(color);
  const base = h * 0.9;
  switch (kind) {
    case 'workshop':
      c.drawRect(Skia.XYWHRect(-BG_MARGIN, base, W + BG_MARGIN * 2, h - base), col);
      c.drawRect(Skia.XYWHRect(10, base - 40, 70, 40), col);
      c.drawRect(Skia.XYWHRect(280, base - 26, 90, 26), col);
      c.drawCircle(320, base - 44, 18, col);
      break;
    case 'trees':
      for (const x of [-20, 380]) {
        c.drawRect(Skia.XYWHRect(x - 10, h * 0.45, 22, h), col);
        c.drawCircle(x, h * 0.42, 60, col);
        c.drawCircle(x + (x < 0 ? 40 : -40), h * 0.36, 40, col);
        for (let i = 0; i < 3; i++) c.drawCircle(x + (x < 0 ? 30 : -30) + i * 8, h * 0.44 + i * 12, 5, fill('#E8282B', 0.85));
      }
      hills(c, base, 14, color, 21, h);
      break;
    case 'stalactites':
      for (let i = 0; i < 6; i++) {
        const x = -30 + i * 80 + r() * 20;
        c.drawPath(poly([[x - 20, -5], [x + 20, -5], [x, 60 + r() * 50]]), col);
      }
      hills(c, base, 10, color, 23, h);
      break;
    case 'mesas':
      hills(c, base, 12, color, 25, h);
      for (const x of [40, 320]) {
        c.drawRRect(Skia.RRectXY(Skia.XYWHRect(x - 8, base - 70, 16, 74), 8, 8), col);
        c.drawRRect(Skia.RRectXY(Skia.XYWHRect(x - 26, base - 50, 12, 30), 6, 6), col);
        c.drawRect(Skia.XYWHRect(x - 20, base - 26, 14, 6), col);
      }
      break;
    case 'volcano':
      c.drawPath(poly([[-40, h], [-40, base - 30], [20, base - 60], [60, base - 10], [120, base], [240, base - 6], [300, base - 50], [400, base - 20], [400, h]]), col);
      c.drawRect(Skia.XYWHRect(-BG_MARGIN, h - 14, W + BG_MARGIN * 2, 14), blurred(fill('#FF5A1A', 0.6), 8));
      break;
    case 'skyline':
      for (let i = 0; i < 7; i++) {
        const bw = 50 + r() * 20;
        const x = -30 + i * 64;
        const top = base - 40 - r() * 70;
        c.drawRect(Skia.XYWHRect(x, top, bw, h - top), col);
        c.drawRect(Skia.XYWHRect(x, top, bw, 2), fill(i % 2 ? '#FF3DF2' : '#29F0FF', 0.8));
      }
      break;
    case 'manor':
      hills(c, base, 10, color, 27, h);
      for (let x = -20; x < 380; x += 16) c.drawPath(poly([[x, base + 4], [x + 3, base - 30], [x + 6, base + 4]]), col);
      c.drawRect(Skia.XYWHRect(-30, base - 22, 420, 3), col);
      break;
    case 'cove':
      for (const x of [10, 350]) {
        const p = Skia.Path.Make();
        p.moveTo(x - 6, h);
        p.quadTo(x + (x < 100 ? 20 : -20), h * 0.7, x + (x < 100 ? 10 : -10), h * 0.55);
        p.lineTo(x + (x < 100 ? 18 : -18), h * 0.55);
        p.quadTo(x + (x < 100 ? 30 : -30), h * 0.7, x + 8, h);
        p.close();
        c.drawPath(p, col);
        for (let i = 0; i < 5; i++) {
          const a = -Math.PI + (i / 4) * Math.PI;
          const cx = x + (x < 100 ? 14 : -14);
          oval(c, cx + Math.cos(a) * 26, h * 0.55 + Math.sin(a) * 12, 26, 7, col);
        }
      }
      hills(c, base + 10, 8, color, 29, h);
      break;
    case 'planets':
      for (let i = 0; i < 5; i++) {
        const x = r() * W;
        const y = h * 0.3 + r() * h * 0.5;
        const rr = 6 + r() * 10;
        c.drawCircle(x < 180 ? x * 0.3 : W - (W - x) * 0.3, y, rr, col);
      }
      break;
    case 'candyhills':
      hills(c, base, 24, color, 31, h);
      for (const x of [20, 340]) {
        const s = stroke('#FFFFFF', 9);
        const p = Skia.Path.Make();
        p.moveTo(x, h);
        p.lineTo(x, base - 70);
        p.quadTo(x, base - 100, x + (x < 100 ? 22 : -22), base - 100);
        c.drawPath(p, s);
        c.drawPath(p, stroke('#E8282B', 9, 0.9));
      }
      break;
    case 'temple':
      for (const x of [10, 350]) {
        c.drawRect(Skia.XYWHRect(x - 14, h * 0.4, 28, h), col);
        c.drawRect(Skia.XYWHRect(x - 20, h * 0.4, 40, 10), col);
      }
      for (let i = 0; i < 8; i++) {
        const p = Skia.Path.Make();
        const x = r() * W;
        p.moveTo(x, -4);
        p.quadTo(x + 14, 40, x - 4, 80 + r() * 60);
        c.drawPath(p, stroke(color, 4));
      }
      hills(c, base, 10, color, 33, h);
      break;
    case 'palace':
      c.drawRect(Skia.XYWHRect(-BG_MARGIN, base, W + BG_MARGIN * 2, h - base), col);
      for (let x = -20; x < 380; x += 20) c.drawRRect(Skia.RRectXY(Skia.XYWHRect(x, base - 26, 10, 26), 5, 5), col);
      c.drawRect(Skia.XYWHRect(-30, base - 32, 420, 8), col);
      break;
  }
}

const bgCache = new Map<string, { far: SkPicture; near: SkPicture }>();

export function backgroundPictures(world: WorldDef, pal: WorldPalette, key: string, h: number): { far: SkPicture; near: SkPicture } {
  const k = `${key}@${Math.round(h)}`;
  let v = bgCache.get(k);
  if (!v) {
    const far = record(W + BG_MARGIN * 2, h, (c) => {
      c.drawRect(Skia.XYWHRect(-BG_MARGIN, 0, W + BG_MARGIN * 2, h), linear(0, 0, 0, h, pal.sky, [0, 0.55, 1]));
      c.drawCircle(W / 2, h * 0.34, 210, radial(W / 2, h * 0.34, 210, [withAlpha(pal.glow, 0.45), withAlpha(pal.glow, 0)]));
      drawFar(c, world.silhouette, pal.far, h, pal.glow);
    }, -BG_MARGIN, 0);
    const near = record(W + BG_MARGIN * 2, h, (c) => {
      drawNear(c, world.silhouette, pal.near, h);
      // Vignette
      c.drawRect(
        Skia.XYWHRect(-BG_MARGIN, 0, W + BG_MARGIN * 2, h),
        radial(W / 2, h * 0.45, h * 0.75, [withAlpha('#000000', 0), withAlpha('#000000', 0.45)], [0.55, 1]),
      );
    }, -BG_MARGIN, 0);
    v = { far, near };
    bgCache.set(k, v);
    if (bgCache.size > 8) {
      const first = bgCache.keys().next().value;
      if (first !== undefined && first !== k) bgCache.delete(first);
    }
  }
  return v;
}

/** Stateless ambient particles: positions are a pure function of time. */
export function drawAmbient(c: SkCanvas, kind: AmbientParticle, color: string, t: number, h: number, count: number, paints: AmbientPaints): void {
  for (let i = 0; i < count; i++) {
    const s1 = ((i * 9301 + 49297) % 233280) / 233280;
    const s2 = ((i * 4096 + 150889) % 714025) / 714025;
    const s3 = ((i * 1103 + 12345) % 9973) / 9973;
    const speed = 0.4 + s3 * 0.8;
    let x = s1 * W;
    let y = s2 * h;
    switch (kind) {
      case 'snow':
      case 'leaves':
      case 'sprinkles':
      case 'sand':
        y = (s2 * h + t * (kind === 'sand' ? 20 : 40) * speed) % (h + 20);
        x = (s1 * W + Math.sin(t * 0.8 + i) * 18 + (kind === 'sand' ? t * 60 * speed : 0)) % (W + 20);
        break;
      case 'embers':
      case 'bubbles':
      case 'wisps':
      case 'motes':
        y = h - ((s2 * h + t * 30 * speed) % (h + 20));
        x = s1 * W + Math.sin(t * 0.9 + i * 1.7) * 14;
        break;
      default:
        x = s1 * W + Math.sin(t * 0.3 + i) * 6;
        y = s2 * h + Math.cos(t * 0.25 + i) * 6;
    }
    const twinkle = 0.5 + 0.5 * Math.sin(t * 2.4 + i * 2.1);
    switch (kind) {
      case 'dust':
        paints.dot.setAlphaf(0.25 + twinkle * 0.3);
        c.drawCircle(x, y, 1.2 + s3 * 1.4, paints.dot);
        break;
      case 'snow':
        paints.dot.setAlphaf(0.75);
        c.drawCircle(x, y, 1.2 + s3 * 2.2, paints.dot);
        break;
      case 'leaves':
        c.save();
        c.translate(x, y);
        c.rotate(t * 90 * speed + i * 40, 0, 0);
        paints.dot.setAlphaf(0.8);
        oval(c, 0, 0, 5, 2.4, paints.dot);
        c.restore();
        break;
      case 'sand':
        paints.line.setAlphaf(0.35);
        c.drawLine(x, y, x + 7, y + 1, paints.line);
        break;
      case 'embers':
      case 'neon':
      case 'motes':
        paints.glow.setAlphaf(0.35 + twinkle * 0.5);
        c.drawCircle(x, y, 2 + s3 * 2, paints.glow);
        paints.dot.setAlphaf(0.9);
        c.drawCircle(x, y, 0.9 + s3, paints.dot);
        break;
      case 'wisps':
        paints.glow.setAlphaf(0.25 + twinkle * 0.25);
        c.drawCircle(x, y, 5 + s3 * 5, paints.glow);
        break;
      case 'bubbles':
        paints.line.setAlphaf(0.5);
        c.drawCircle(x, y, 2 + s3 * 4, paints.line);
        break;
      case 'stars':
        paints.dot.setAlphaf(0.25 + twinkle * 0.75);
        c.drawCircle(x, y, 0.8 + s3 * 1.3, paints.dot);
        break;
      case 'sprinkles':
        c.save();
        c.translate(x, y);
        c.rotate(i * 47 + t * 60, 0, 0);
        paints.sprinkle[i % paints.sprinkle.length].setAlphaf(0.85);
        c.drawRRect(Skia.RRectXY(Skia.XYWHRect(-3.5, -1.2, 7, 2.4), 1.2, 1.2), paints.sprinkle[i % paints.sprinkle.length]);
        c.restore();
        break;
      case 'sparkles':
        paints.dot.setAlphaf(twinkle);
        sparkle(c, x, y, 2 + twinkle * 3, paints.dot);
        break;
    }
  }
}

export interface AmbientPaints {
  dot: ReturnType<typeof fill>;
  glow: ReturnType<typeof fill>;
  line: ReturnType<typeof fill>;
  sprinkle: ReturnType<typeof fill>[];
}

export function makeAmbientPaints(color: string): AmbientPaints {
  return {
    dot: fill(color),
    glow: blurred(fill(color), 3),
    line: stroke(color, 1),
    sprinkle: ['#FF5FA2', '#7FE0FF', '#FFE36E', '#9BFF7A', '#FFFFFF'].map((c) => fill(c)),
  };
}

export const AMBIENT_COUNT: Record<AmbientParticle, number> = {
  dust: 24,
  leaves: 14,
  snow: 40,
  sand: 30,
  embers: 26,
  neon: 18,
  wisps: 10,
  bubbles: 18,
  stars: 50,
  sprinkles: 24,
  motes: 20,
  sparkles: 18,
};
