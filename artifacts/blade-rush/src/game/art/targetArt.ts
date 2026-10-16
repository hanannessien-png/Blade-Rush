/**
 * Target materials (one per world) plus apples and spikes. Targets are drawn
 * at a unit radius of 100 around the origin and scaled at render time.
 */
import { ClipOp, Skia, type SkCanvas, type SkPicture } from '@shopify/react-native-skia';
import type { TargetMaterial } from '../../data/worlds';
import { darken, lighten, mix, withAlpha } from './color';
import { arc, artRand, blurred, circlePath, fill, linear, oval, poly, radial, record, sparkle, stroke } from './sk';

export const UNIT_R = 100;

export type TargetPalette = readonly [string, string, string, string];

function rim(c: SkCanvas, light: string): void {
  arc(c, 0, 0, UNIT_R - 3, 200, 110, blurred(stroke(lighten(light, 0.4), 4, 0.55), 1.5));
  arc(c, 0, 0, UNIT_R - 3, 20, 110, stroke('#000000', 4, 0.18));
}

function bark(c: SkCanvas, dark: string, mid: string, seed: number): void {
  const r = artRand(seed);
  const p = Skia.Path.Make();
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = UNIT_R + (r() - 0.5) * 3;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  p.close();
  c.drawPath(p, radial(0, 0, UNIT_R, [mid, dark], [0.85, 1]));
  const s = stroke(darken(dark, 0.35), 1.5, 0.6);
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2;
    c.drawLine(Math.cos(a) * 89, Math.sin(a) * 89, Math.cos(a) * 99, Math.sin(a) * 99, s);
  }
}

function woodFace(c: SkCanvas, pal: TargetPalette, seed: number, faceR: number): void {
  const [light, mid, dark, ring] = pal;
  c.drawCircle(0, 0, faceR, radial(-18, -22, faceR * 1.15, [lighten(light, 0.15), light, mid], [0, 0.55, 1]));
  const r = artRand(seed);
  for (let i = 1; i <= 6; i++) {
    const rr = (faceR / 7) * i + (r() - 0.5) * 3;
    const p = Skia.Path.Make();
    const n = 32;
    for (let k = 0; k <= n; k++) {
      const a = (k / n) * Math.PI * 2;
      const wob = rr + Math.sin(a * 3 + i) * 1.4 + (r() - 0.5) * 0.8;
      const x = Math.cos(a) * wob;
      const y = Math.sin(a) * wob;
      if (k === 0) p.moveTo(x, y);
      else p.lineTo(x, y);
    }
    p.close();
    c.drawPath(p, stroke(ring, 1.4, 0.55));
  }
  // Cracks
  const cs = stroke(darken(dark, 0.2), 1.6, 0.6);
  for (let i = 0; i < 3; i++) {
    const a = r() * Math.PI * 2;
    const p = Skia.Path.Make();
    p.moveTo(Math.cos(a) * 12, Math.sin(a) * 12);
    p.lineTo(Math.cos(a + 0.12) * 30, Math.sin(a + 0.12) * 30);
    p.lineTo(Math.cos(a - 0.05) * 46, Math.sin(a - 0.05) * 46);
    c.drawPath(p, cs);
  }
  c.drawCircle(0, 0, 5, fill(dark, 0.7));
}

function drawMaterial(c: SkCanvas, material: TargetMaterial, pal: TargetPalette, seed: number): void {
  const [light, mid, dark, accent] = pal;
  const r = artRand(seed);
  // Ground shadow
  c.drawCircle(4, 10, UNIT_R + 2, blurred(fill('#000000', 0.38), 9));
  switch (material) {
    case 'wood':
      bark(c, dark, mid, seed);
      woodFace(c, pal, seed, 86);
      break;
    case 'orchard': {
      bark(c, dark, mid, seed);
      woodFace(c, pal, seed, 86);
      const moss = fill('#5DAF4A', 0.9);
      for (let i = 0; i < 9; i++) {
        const a = 3.6 + r() * 1.6;
        c.drawCircle(Math.cos(a) * 94, Math.sin(a) * 94, 3 + r() * 3, moss);
      }
      break;
    }
    case 'ice': {
      c.drawCircle(0, 0, UNIT_R, radial(-25, -30, UNIT_R * 1.3, [lighten(light, 0.3), light, mid, dark], [0, 0.35, 0.75, 1]));
      const facet = stroke('#FFFFFF', 1.2, 0.55);
      const pts: [number, number][] = [];
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + r() * 0.3;
        pts.push([Math.cos(a) * (55 + r() * 25), Math.sin(a) * (55 + r() * 25)]);
      }
      for (let i = 0; i < pts.length; i++) {
        const [x, y] = pts[i];
        const [x2, y2] = pts[(i + 1) % pts.length];
        c.drawLine(0, 0, x, y, facet);
        c.drawLine(x, y, x2, y2, facet);
        c.drawLine(x, y, x * 1.28, y * 1.28, stroke('#FFFFFF', 1, 0.35));
      }
      c.drawPath(poly(pts.slice(0, 3).map(([x, y]) => [x * 0.9, y * 0.9] as const).concat([[0, 0]])), fill('#FFFFFF', 0.18));
      c.drawCircle(0, 0, UNIT_R - 2, stroke(accent, 4, 0.8));
      const sp = fill('#FFFFFF', 0.95);
      sparkle(c, -40, -42, 6, sp);
      sparkle(c, 30, 20, 4, sp);
      break;
    }
    case 'sandstone': {
      c.drawCircle(0, 0, UNIT_R, fill(mid));
      c.save();
      c.clipPath(circlePath(0, 0, UNIT_R), ClipOp.Intersect, true);
      const bands = [light, mid, accent, light, dark, mid, accent, light];
      for (let i = 0; i < bands.length; i++) {
        const y0 = -UNIT_R + (i * UNIT_R * 2) / bands.length;
        const p = Skia.Path.Make();
        p.moveTo(-UNIT_R, y0);
        p.cubicTo(-40, y0 - 8, 40, y0 + 8, UNIT_R, y0 - 3);
        p.lineTo(UNIT_R, y0 + 30);
        p.lineTo(-UNIT_R, y0 + 30);
        p.close();
        c.drawPath(p, fill(bands[i], 0.9));
      }
      const speck = fill(dark, 0.35);
      for (let i = 0; i < 60; i++) c.drawCircle((r() - 0.5) * 190, (r() - 0.5) * 190, 0.8 + r() * 1.4, speck);
      c.drawCircle(0, 0, UNIT_R, radial(-30, -30, UNIT_R * 1.4, [withAlpha('#FFFFFF', 0.25), withAlpha('#000000', 0), withAlpha('#000000', 0.35)], [0, 0.5, 1]));
      c.restore();
      c.drawCircle(0, 0, UNIT_R - 1.5, stroke(dark, 3, 0.8));
      break;
    }
    case 'lavarock': {
      c.drawCircle(0, 0, UNIT_R, radial(-20, -25, UNIT_R * 1.2, [light, mid, dark], [0, 0.6, 1]));
      const glow = blurred(stroke(accent, 6, 0.75), 4);
      const core = stroke(lighten(accent, 0.45), 1.8, 1);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + r() * 0.4;
        const p = Skia.Path.Make();
        p.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
        let rr = 8;
        let aa = a;
        while (rr < 92) {
          rr += 12 + r() * 10;
          aa += (r() - 0.5) * 0.5;
          p.lineTo(Math.cos(aa) * Math.min(rr, 95), Math.sin(aa) * Math.min(rr, 95));
        }
        c.drawPath(p, glow);
        c.drawPath(p, core);
      }
      c.drawCircle(0, 0, 14, blurred(fill(accent, 0.9), 6));
      c.drawCircle(0, 0, 7, fill(lighten(accent, 0.6)));
      rim(c, light);
      break;
    }
    case 'neon': {
      c.drawCircle(0, 0, UNIT_R, radial(0, 0, UNIT_R, [mid, dark], [0.2, 1]));
      const colors = [accent, '#FF3DF2', accent];
      [92, 66, 40].forEach((rr, i) => {
        c.drawCircle(0, 0, rr, blurred(stroke(colors[i], 7, 0.55), 5));
        c.drawCircle(0, 0, rr, stroke(lighten(colors[i], 0.5), 2.2, 1));
      });
      const seg = stroke(accent, 2, 0.8);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        c.drawLine(Math.cos(a) * 70, Math.sin(a) * 70, Math.cos(a) * 88, Math.sin(a) * 88, seg);
      }
      c.drawCircle(0, 0, 10, blurred(fill('#FF3DF2', 0.9), 5));
      c.drawCircle(0, 0, 5, fill('#FFFFFF'));
      break;
    }
    case 'haunted': {
      bark(c, dark, mid, seed);
      c.drawCircle(0, 0, 86, radial(-18, -22, 100, [light, mid, accent], [0, 0.6, 1]));
      const sw = stroke(darken(dark, 0.1), 1.6, 0.6);
      for (let i = 0; i < 4; i++) {
        const p = Skia.Path.Make();
        const a = (i / 4) * Math.PI * 2;
        p.moveTo(0, 0);
        p.cubicTo(Math.cos(a) * 40, Math.sin(a) * 40, Math.cos(a + 0.9) * 60, Math.sin(a + 0.9) * 60, Math.cos(a + 1.4) * 78, Math.sin(a + 1.4) * 78);
        c.drawPath(p, sw);
      }
      c.drawCircle(0, 0, 86, blurred(stroke('#C7F25C', 6, 0.25), 6));
      break;
    }
    case 'barrel': {
      c.drawCircle(0, 0, UNIT_R, fill(dark));
      c.save();
      c.clipPath(circlePath(0, 0, 88), ClipOp.Intersect, true);
      const planks = 6;
      for (let i = 0; i < planks; i++) {
        const x = -88 + (176 / planks) * i;
        const col = i % 2 === 0 ? light : mix(light, mid, 0.5);
        c.drawRect(Skia.XYWHRect(x, -90, 176 / planks - 1.5, 180), linear(x, 0, x + 176 / planks, 0, [mid, col, mid]));
        c.drawLine(x + 6, -60 + r() * 30, x + 6, 20 + r() * 40, stroke(dark, 0.8, 0.35));
      }
      c.restore();
      c.drawCircle(0, 0, 94, stroke(accent, 11));
      c.drawCircle(0, 0, 94, stroke(lighten(accent, 0.35), 2, 0.7));
      const rivet = fill('#C9CED6');
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        c.drawCircle(Math.cos(a) * 94, Math.sin(a) * 94, 2.2, rivet);
      }
      break;
    }
    case 'asteroid': {
      const p = Skia.Path.Make();
      for (let i = 0; i <= 36; i++) {
        const a = (i / 36) * Math.PI * 2;
        const rr = UNIT_R - 2 + Math.sin(a * 5 + seed) * 2.5 + (r() - 0.5) * 2;
        if (i === 0) p.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        else p.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      p.close();
      c.drawPath(p, radial(-30, -30, 140, [light, mid, dark], [0, 0.5, 1]));
      for (let i = 0; i < 9; i++) {
        const x = (r() - 0.5) * 140;
        const y = (r() - 0.5) * 140;
        if (Math.hypot(x, y) > 80) continue;
        const cr = 5 + r() * 12;
        c.drawCircle(x, y, cr, fill(dark, 0.55));
        arc(c, x, y, cr, 200, 140, stroke(lighten(light, 0.3), 1.6, 0.6));
      }
      c.drawCircle(0, 0, UNIT_R, radial(0, 0, UNIT_R, [withAlpha(accent, 0), withAlpha('#8C7BFF', 0.25)], [0.7, 1]));
      break;
    }
    case 'candy': {
      c.drawCircle(0, 0, UNIT_R, fill(light));
      c.save();
      c.clipPath(circlePath(0, 0, UNIT_R), ClipOp.Intersect, true);
      const n = 8;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2;
        const p = Skia.Path.Make();
        p.moveTo(0, 0);
        p.cubicTo(Math.cos(a0 + 0.6) * 50, Math.sin(a0 + 0.6) * 50, Math.cos(a0 + 0.2) * 90, Math.sin(a0 + 0.2) * 90, Math.cos(a0) * 120, Math.sin(a0) * 120);
        p.lineTo(Math.cos(a0 + 0.38) * 120, Math.sin(a0 + 0.38) * 120);
        p.cubicTo(Math.cos(a0 + 0.55) * 90, Math.sin(a0 + 0.55) * 90, Math.cos(a0 + 0.95) * 50, Math.sin(a0 + 0.95) * 50, 0, 0);
        c.drawPath(p, fill(i % 2 === 0 ? mid : accent));
      }
      c.restore();
      c.drawCircle(0, 0, UNIT_R, radial(-30, -35, UNIT_R * 1.4, [withAlpha('#FFFFFF', 0.55), withAlpha('#FFFFFF', 0), withAlpha('#000000', 0.25)], [0, 0.45, 1]));
      c.drawCircle(0, 0, UNIT_R - 2, stroke(dark, 4, 0.7));
      oval(c, -38, -50, 22, 10, fill('#FFFFFF', 0.45));
      break;
    }
    case 'stone': {
      c.drawCircle(0, 0, UNIT_R, radial(-25, -25, UNIT_R * 1.3, [light, mid, dark], [0, 0.6, 1]));
      c.drawCircle(0, 0, 80, stroke(dark, 3, 0.5));
      c.drawCircle(0, 0, 52, stroke(dark, 2.5, 0.5));
      const glyph = stroke(accent, 2.2, 0.9);
      const gg = blurred(stroke(accent, 5, 0.4), 3);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        const x = Math.cos(a) * 66;
        const y = Math.sin(a) * 66;
        const p = Skia.Path.Make();
        p.moveTo(x - 4, y - 4);
        p.lineTo(x + 4, y - 4);
        p.lineTo(x, y + 4);
        if (i % 2) {
          p.moveTo(x, y - 6);
          p.lineTo(x, y);
        }
        c.drawPath(p, gg);
        c.drawPath(p, glyph);
      }
      c.drawCircle(0, 0, 18, fill(dark, 0.6));
      c.drawCircle(0, 0, 10, blurred(fill(accent, 0.9), 4));
      c.drawCircle(0, 0, 6, fill(lighten(accent, 0.5)));
      const crack = stroke(darken(dark, 0.3), 1.5, 0.7);
      c.drawPath(poly([[60, -70], [48, -52], [55, -40], [42, -30]], false), crack);
      break;
    }
    case 'gold': {
      c.drawCircle(0, 0, UNIT_R, radial(-30, -35, UNIT_R * 1.4, [lighten(light, 0.4), light, mid, dark], [0, 0.3, 0.7, 1]));
      c.drawCircle(0, 0, 86, stroke(dark, 3, 0.6));
      c.drawCircle(0, 0, 84, stroke(lighten(light, 0.5), 1.5, 0.7));
      const gem = fill(accent);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const x = Math.cos(a) * 93;
        const y = Math.sin(a) * 93;
        c.drawCircle(x, y, 4, gem);
        c.drawCircle(x - 1, y - 1, 1.3, fill('#FFFFFF', 0.85));
      }
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        c.drawLine(Math.cos(a) * 30, Math.sin(a) * 30, Math.cos(a) * 76, Math.sin(a) * 76, stroke(dark, 1.4, 0.35));
      }
      c.drawCircle(0, 0, 28, radial(-6, -8, 34, [lighten(light, 0.5), mid, dark]));
      c.drawCircle(0, 0, 12, fill(accent));
      c.drawCircle(-3, -4, 3.5, fill('#FFFFFF', 0.8));
      sparkle(c, -45, -48, 7, fill('#FFFFFF', 0.95));
      break;
    }
  }
  if (material !== 'ice' && material !== 'lavarock') rim(c, light);
}

const cache = new Map<string, SkPicture>();

export function targetPicture(material: TargetMaterial, pal: TargetPalette, key: string): SkPicture {
  let pic = cache.get(key);
  if (!pic) {
    const seed = key.split('').reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
    pic = record(260, 260, (c) => drawMaterial(c, material, pal, seed), -130, -130);
    cache.set(key, pic);
  }
  return pic;
}

/** Path of one wedge of the shattered target (unit radius). */
const wedgeCache = new Map<number, ReturnType<typeof Skia.Path.Make>>();
export function wedgePath(index: number, pieces: number) {
  const key = index * 100 + pieces;
  let p = wedgeCache.get(key);
  if (!p) {
    const sweep = 360 / pieces;
    p = Skia.Path.Make();
    p.moveTo(0, 0);
    p.arcToOval(Skia.XYWHRect(-UNIT_R - 4, -UNIT_R - 4, (UNIT_R + 4) * 2, (UNIT_R + 4) * 2), index * sweep, sweep, false);
    p.close();
    wedgeCache.set(key, p);
  }
  return p;
}

// ---------------------------------------------------------------------------
// Apples and spikes

export type AppleKind = 'apple' | 'golden' | 'crystal';

const APPLE_COLORS: Record<AppleKind, readonly [string, string, string]> = {
  apple: ['#FF8A80', '#E8282B', '#8E0E14'],
  golden: ['#FFF6B0', '#FFC21E', '#B06A00'],
  crystal: ['#E8FDFF', '#5CD8FF', '#1E64B4'],
};

/** Apple centred at the origin, stem pointing to -y (outward when placed). */
function drawApple(c: SkCanvas, kind: AppleKind): void {
  const [l, m, d] = APPLE_COLORS[kind];
  c.drawCircle(1.5, 2.5, 11, blurred(fill('#000000', 0.3), 2));
  if (kind === 'crystal') {
    const pts: [number, number][] = [[0, -11], [9, -5], [10, 4], [4, 11], [-4, 11], [-10, 4], [-9, -5]];
    c.drawPath(poly(pts), linear(-10, -10, 10, 10, [l, m, d]));
    const f = stroke('#FFFFFF', 0.9, 0.7);
    c.drawLine(0, -11, 0, 11, f);
    c.drawLine(-9, -5, 4, 11, f);
    c.drawLine(9, -5, -4, 11, f);
    c.drawPath(poly(pts), stroke(d, 1, 0.8));
  } else {
    const p = Skia.Path.Make();
    p.moveTo(0, -7);
    p.cubicTo(5, -12, 12, -8, 11, 0);
    p.cubicTo(10, 8, 5, 12, 0, 10);
    p.cubicTo(-5, 12, -10, 8, -11, 0);
    p.cubicTo(-12, -8, -5, -12, 0, -7);
    c.drawPath(p, radial(-4, -4, 15, [l, m, d], [0, 0.55, 1]));
    c.drawPath(p, stroke(darken(d, 0.3), 0.8, 0.6));
    oval(c, -4.5, -3.5, 2.6, 3.6, fill('#FFFFFF', 0.6));
  }
  c.drawLine(0, -7, 1.5, -13, stroke('#5A3A1A', 1.8));
  const leaf = Skia.Path.Make();
  leaf.moveTo(1.5, -11);
  leaf.quadTo(6, -16, 10, -12);
  leaf.quadTo(6, -9, 1.5, -11);
  c.drawPath(leaf, fill(kind === 'crystal' ? '#BFF6FF' : '#4CB648'));
  if (kind !== 'apple') {
    sparkle(c, 7, -5, 3.5, fill('#FFFFFF', 0.95));
  }
}

function drawAppleHalf(c: SkCanvas, kind: AppleKind, side: number): void {
  const [, m, d] = APPLE_COLORS[kind];
  const flesh = kind === 'apple' ? '#FFF3D6' : kind === 'golden' ? '#FFF6C9' : '#E4FBFF';
  c.save();
  if (side === 1) c.scale(-1, 1);
  const outer = Skia.Path.Make();
  outer.moveTo(0, -9);
  outer.cubicTo(-6, -12, -12, -7, -11, 0);
  outer.cubicTo(-10, 8, -5, 11, 0, 10);
  outer.close();
  c.drawPath(outer, fill(m));
  c.drawPath(outer, stroke(d, 0.8, 0.8));
  const inner = Skia.Path.Make();
  inner.moveTo(0, -7);
  inner.cubicTo(-4, -9, -9, -5, -8.5, 0);
  inner.cubicTo(-8, 6, -4, 8.5, 0, 8);
  inner.close();
  c.drawPath(inner, fill(flesh));
  oval(c, -2.5, 0, 1, 1.8, fill('#4A2A10'));
  c.restore();
}

function drawSpike(c: SkCanvas, ghost: boolean): void {
  // Base sits on the rim at y=0, the point extends to -y (outward).
  const body = poly([[-7, 4], [7, 4], [0, -20]]);
  c.drawPath(body, blurred(fill('#000000', 0.35), 2));
  c.drawPath(body, linear(-7, 0, 7, 0, ghost ? ['#B9A6FF', '#F2EEFF', '#7C68D6'] : ['#5C6676', '#F0F3F8', '#3C4452']));
  c.drawPath(body, stroke(ghost ? '#4E3BA8' : '#2A2F38', 1, 0.8));
  c.drawLine(-1, 2, 0, -16, stroke('#FFFFFF', 1.1, 0.7));
  c.drawRect(Skia.XYWHRect(-8.5, 2, 17, 4.5), fill(ghost ? '#6A55C9' : '#3C4452'));
}

const itemCache = new Map<string, SkPicture>();

function cachedItem(key: string, draw: (c: SkCanvas) => void): SkPicture {
  let pic = itemCache.get(key);
  if (!pic) {
    pic = record(60, 60, draw, -30, -30);
    itemCache.set(key, pic);
  }
  return pic;
}

export function applePicture(kind: AppleKind): SkPicture {
  return cachedItem(`apple-${kind}`, (c) => drawApple(c, kind));
}

export function appleHalfPicture(kind: AppleKind, side: number): SkPicture {
  return cachedItem(`half-${kind}-${side}`, (c) => drawAppleHalf(c, kind, side));
}

export function spikePicture(ghost: boolean): SkPicture {
  return cachedItem(`spike-${ghost}`, (c) => drawSpike(c, ghost));
}

export function clearTargetCaches(): void {
  cache.clear();
}
