/**
 * The 20 bosses. Each has a static body (recorded once, unit radius 100) and a
 * face drawn per frame so it can blink, look at the knife and flinch on hits.
 */
import { ClipOp, Skia, type SkCanvas, type SkPicture } from '@shopify/react-native-skia';
import type { BossDef } from '../../data/bosses';
import { darken, lighten, withAlpha } from './color';
import { arc, artRand, blurred, circlePath, fill, linear, oval, poly, radial, record, sparkle, stroke } from './sk';

const R = 100;

type FaceStyle = 'cute' | 'carved' | 'glow' | 'alien' | 'shades';

const FACE: Record<string, { style: FaceStyle; y: number; spread: number; color?: string }> = {
  pumpkin: { style: 'carved', y: -6, spread: 30, color: '#FFE36E' },
  crystal: { style: 'cute', y: -4, spread: 26 },
  shield: { style: 'glow', y: -8, spread: 28, color: '#FF4A3D' },
  pizza: { style: 'cute', y: -6, spread: 28 },
  gear: { style: 'glow', y: -4, spread: 24, color: '#FFB21E' },
  lava: { style: 'carved', y: -4, spread: 28, color: '#FFE36E' },
  mask: { style: 'carved', y: -10, spread: 30, color: '#C7F25C' },
  moon: { style: 'cute', y: -4, spread: 26 },
  cactus: { style: 'cute', y: 0, spread: 24 },
  crown: { style: 'cute', y: 6, spread: 26 },
  egg: { style: 'cute', y: 4, spread: 24 },
  cyber: { style: 'glow', y: -4, spread: 28, color: '#29F0FF' },
  burger: { style: 'cute', y: 0, spread: 28 },
  sushi: { style: 'cute', y: -2, spread: 20 },
  candy: { style: 'cute', y: -2, spread: 26 },
  chest: { style: 'cute', y: -18, spread: 28 },
  disco: { style: 'shades', y: -6, spread: 26 },
  alien: { style: 'alien', y: -4, spread: 28 },
  idol: { style: 'carved', y: -10, spread: 30, color: '#2FD1B8' },
  clock: { style: 'cute', y: -26, spread: 22 },
};

function shine(c: SkCanvas): void {
  c.drawCircle(0, 0, R, radial(-35, -40, R * 1.5, [withAlpha('#FFFFFF', 0.35), withAlpha('#FFFFFF', 0), withAlpha('#000000', 0.32)], [0, 0.45, 1]));
}

function ball(c: SkCanvas, base: string, light: string, dark: string): void {
  c.drawCircle(0, 0, R, radial(-30, -34, R * 1.35, [light, base, dark], [0, 0.55, 1]));
}

function drawBody(c: SkCanvas, boss: BossDef): void {
  const [base, light, dark, accent] = boss.colors;
  const r = artRand(boss.id.length * 97 + base.charCodeAt(2));
  c.drawCircle(4, 12, R + 4, blurred(fill('#000000', 0.42), 10));
  switch (boss.id) {
    case 'pumpkin': {
      const lobes = [-60, -30, 0, 30, 60];
      ball(c, base, light, dark);
      for (const x of lobes) oval(c, x, 0, 34, R - Math.abs(x) * 0.25, linear(x - 34, 0, x + 34, 0, [dark, base, light, base, dark], [0, 0.25, 0.5, 0.75, 1]));
      const sep = stroke(darken(dark, 0.2), 2, 0.5);
      for (const x of [-45, -15, 15, 45]) {
        const p = Skia.Path.Make();
        p.moveTo(x, -R + 18);
        p.quadTo(x * 1.25, 0, x, R - 16);
        c.drawPath(p, sep);
      }
      c.drawPath(poly([[-8, -R + 8], [8, -R + 8], [12, -R - 20], [2, -R - 24]]), linear(-8, 0, 12, 0, [darken(accent, 0.3), accent, darken(accent, 0.2)]));
      const leaf = Skia.Path.Make();
      leaf.moveTo(8, -R - 6);
      leaf.quadTo(40, -R - 34, 52, -R - 6);
      leaf.quadTo(30, -R + 4, 8, -R - 6);
      c.drawPath(leaf, fill(accent));
      break;
    }
    case 'crystal': {
      const pts: [number, number][] = [];
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const rr = i % 2 === 0 ? R + 6 : R - 6;
        pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
      }
      c.drawPath(poly(pts), radial(-30, -35, R * 1.4, [light, base, dark], [0, 0.5, 1]));
      const f = stroke('#FFFFFF', 1.4, 0.55);
      pts.forEach(([x, y], i) => i % 2 === 0 && c.drawLine(0, 0, x, y, f));
      c.drawPath(poly([pts[0], pts[1], [0, 0], pts[11]]), fill('#FFFFFF', 0.25));
      c.drawPath(poly(pts), stroke(accent, 2.5, 0.9));
      sparkle(c, -50, -50, 9, fill('#FFFFFF'));
      sparkle(c, 50, 30, 5, fill('#FFFFFF'));
      break;
    }
    case 'shield': {
      ball(c, base, light, dark);
      c.drawCircle(0, 0, R - 8, stroke(dark, 5));
      c.save();
      c.clipPath(circlePath(0, 0, R - 10), ClipOp.Intersect, true);
      c.drawRect(Skia.XYWHRect(-16, -R, 32, R * 2), fill(accent, 0.9));
      c.drawRect(Skia.XYWHRect(-R, -16, R * 2, 32), fill(accent, 0.9));
      c.restore();
      const rivet = radial(-1, -1, 5, ['#FFFFFF', light, dark]);
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        c.drawCircle(Math.cos(a) * (R - 4), Math.sin(a) * (R - 4), 3.6, rivet);
      }
      c.drawCircle(0, 0, 30, radial(-10, -12, 40, ['#FFFFFF', light, base, dark], [0, 0.2, 0.6, 1]));
      break;
    }
    case 'pizza': {
      c.drawCircle(0, 0, R, radial(0, 0, R, [light, base, dark], [0.75, 0.88, 1]));
      c.drawCircle(0, 0, R - 14, fill('#E04A2A'));
      c.drawCircle(0, 0, R - 18, radial(-20, -20, R, ['#FFF2B0', '#FFD45C'], [0, 1]));
      const pep = radial(-3, -3, 14, ['#F06A55', accent, darken(accent, 0.35)]);
      for (const [x, y] of [[-48, -40], [40, -50], [55, 20], [-30, 52], [10, 60], [-62, 12]] as const) {
        c.drawCircle(x, y, 12, pep);
      }
      const cut = stroke('#E2A642', 1.6, 0.7);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        c.drawLine(0, 0, Math.cos(a) * (R - 14), Math.sin(a) * (R - 14), cut);
      }
      for (let i = 0; i < 10; i++) c.drawCircle((r() - 0.5) * 140, (r() - 0.5) * 140, 2.5, fill('#3E8C2E'));
      break;
    }
    case 'gear': {
      const p = Skia.Path.Make();
      const teeth = 12;
      for (let i = 0; i < teeth; i++) {
        const a0 = (i / teeth) * Math.PI * 2;
        const a1 = a0 + (Math.PI * 2) / teeth;
        const pts: [number, number, number][] = [
          [a0, R - 12, 0],
          [a0 + (a1 - a0) * 0.18, R + 8, 0],
          [a0 + (a1 - a0) * 0.5, R + 8, 0],
          [a0 + (a1 - a0) * 0.68, R - 12, 0],
        ];
        pts.forEach(([a, rr], k) => {
          const x = Math.cos(a) * rr;
          const y = Math.sin(a) * rr;
          if (i === 0 && k === 0) p.moveTo(x, y);
          else p.lineTo(x, y);
        });
      }
      p.close();
      c.drawPath(p, radial(-30, -30, R * 1.5, [light, base, dark], [0, 0.5, 1]));
      c.drawPath(p, stroke(darken(dark, 0.3), 2, 0.8));
      c.drawCircle(0, 0, R - 30, stroke(dark, 4, 0.6));
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.5;
        c.drawCircle(Math.cos(a) * 62, Math.sin(a) * 62, 9, fill(accent));
        c.drawCircle(Math.cos(a) * 62, Math.sin(a) * 62, 9, stroke(dark, 1.5, 0.7));
      }
      break;
    }
    case 'lava': {
      c.drawCircle(0, 0, R + 10, blurred(fill(base, 0.6), 14));
      c.drawCircle(0, 0, R, radial(-20, -25, R * 1.2, ['#5A3A34', '#2A1814', '#120806'], [0, 0.6, 1]));
      const glow = blurred(stroke(base, 8, 0.75), 5);
      const core = stroke(accent, 2.4, 1);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + r() * 0.3;
        const p = Skia.Path.Make();
        p.moveTo(Math.cos(a) * 20, Math.sin(a) * 20);
        p.lineTo(Math.cos(a + 0.2) * 55, Math.sin(a + 0.2) * 55);
        p.lineTo(Math.cos(a - 0.05) * 96, Math.sin(a - 0.05) * 96);
        c.drawPath(p, glow);
        c.drawPath(p, core);
      }
      c.drawCircle(0, 0, 34, blurred(fill(light, 0.5), 10));
      break;
    }
    case 'mask': {
      oval(c, 0, 0, R, R, radial(-25, -30, R * 1.4, [light, base, dark], [0, 0.5, 1]));
      const band = fill(accent, 0.9);
      c.save();
      c.clipPath(circlePath(0, 0, R), ClipOp.Intersect, true);
      for (const y of [-58, 40]) {
        c.drawRect(Skia.XYWHRect(-R, y, R * 2, 8), band);
        const zig: [number, number][] = [];
        for (let x = -R, i = 0; x <= R; x += 12, i++) zig.push([x, y + 14 + (i % 2 ? 7 : 0)]);
        c.drawPath(poly(zig, false), stroke(dark, 2.5, 0.7));
      }
      c.restore();
      for (let i = 0; i < 6; i++) {
        const a = Math.PI + 0.35 + (i / 5) * (Math.PI - 0.7);
        const x = Math.cos(a) * (R + 8);
        const y = Math.sin(a) * (R + 8);
        oval(c, x, y, 7, 16, fill(i % 2 ? accent : lighten(base, 0.4)));
      }
      c.drawPath(poly([[-10, 6], [10, 6], [0, 26]]), fill(dark, 0.7));
      break;
    }
    case 'moon': {
      ball(c, base, light, dark);
      for (let i = 0; i < 8; i++) {
        const x = (r() - 0.5) * 140;
        const y = (r() - 0.5) * 140;
        if (Math.hypot(x, y) > 82) continue;
        const cr = 6 + r() * 12;
        c.drawCircle(x, y, cr, fill(dark, 0.3));
        arc(c, x, y, cr, 200, 140, stroke('#FFFFFF', 1.5, 0.5));
      }
      c.drawCircle(0, 0, R, stroke(accent, 3, 0.6));
      const frost = stroke('#FFFFFF', 1.4, 0.8);
      for (let i = 0; i < 5; i++) {
        const a = -2.4 + i * 0.3;
        c.drawLine(Math.cos(a) * 80, Math.sin(a) * 80, Math.cos(a) * 98, Math.sin(a) * 98, frost);
      }
      break;
    }
    case 'cactus': {
      ball(c, base, light, dark);
      const rib = stroke(dark, 3, 0.5);
      for (const x of [-60, -30, 0, 30, 60]) {
        const p = Skia.Path.Make();
        p.moveTo(x * 0.6, -R + 6);
        p.quadTo(x * 1.25, 0, x * 0.6, R - 6);
        c.drawPath(p, rib);
      }
      const spine = stroke('#FFF6D6', 1.4, 0.95);
      for (let i = 0; i < 26; i++) {
        const a = r() * Math.PI * 2;
        const rr = 30 + r() * 62;
        const x = Math.cos(a) * rr;
        const y = Math.sin(a) * rr;
        c.drawLine(x, y, x + 4, y - 3, spine);
        c.drawLine(x, y, x - 4, y - 3, spine);
      }
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i - 2) * 0.32;
        oval(c, Math.cos(a) * (R + 4), Math.sin(a) * (R + 4), 10, 14, fill(accent));
      }
      c.drawCircle(0, -R - 4, 8, fill('#FFE36E'));
      break;
    }
    case 'crown': {
      ball(c, base, light, dark);
      c.drawCircle(0, 0, R - 10, stroke(dark, 3, 0.5));
      const crown = poly([[-56, -R + 18], [56, -R + 18], [64, -R - 30], [32, -R - 6], [0, -R - 42], [-32, -R - 6], [-64, -R - 30]]);
      c.drawPath(crown, linear(0, -R - 42, 0, -R + 18, [light, base, dark]));
      c.drawPath(crown, stroke(darken(dark, 0.3), 2, 0.8));
      for (const [x, y] of [[0, -R - 34], [-60, -R - 24], [60, -R - 24]] as const) c.drawCircle(x, y, 7, fill(accent));
      const gem = fill(accent);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + 0.3;
        c.drawCircle(Math.cos(a) * (R - 10), Math.sin(a) * (R - 10), 4.5, gem);
      }
      break;
    }
    case 'egg': {
      ball(c, base, light, dark);
      const sc = stroke(dark, 2, 0.45);
      for (let row = -4; row <= 4; row++) {
        for (let col = -4; col <= 4; col++) {
          const x = col * 22 + (row % 2 ? 11 : 0);
          const y = row * 18;
          if (Math.hypot(x, y) > 88) continue;
          arc(c, x, y, 11, 20, 140, sc);
        }
      }
      for (let i = 0; i < 7; i++) c.drawCircle((r() - 0.5) * 140, (r() - 0.5) * 140, 5 + r() * 6, fill(accent, 0.6));
      const crack = stroke('#FFFFFF', 2.2, 0.8);
      c.drawPath(poly([[-70, -60], [-55, -48], [-62, -36], [-46, -26]], false), crack);
      break;
    }
    case 'cyber': {
      c.drawCircle(0, 0, R, radial(-25, -30, R * 1.3, [light, base, dark], [0, 0.5, 1]));
      const glow = blurred(stroke(accent, 5, 0.6), 4);
      const line = stroke(accent, 1.8, 1);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const p = Skia.Path.Make();
        p.moveTo(Math.cos(a) * 40, Math.sin(a) * 40);
        p.lineTo(Math.cos(a) * 64, Math.sin(a) * 64);
        p.lineTo(Math.cos(a + 0.25) * 86, Math.sin(a + 0.25) * 86);
        c.drawPath(p, glow);
        c.drawPath(p, line);
        c.drawCircle(Math.cos(a + 0.25) * 86, Math.sin(a + 0.25) * 86, 3, fill(accent));
      }
      c.drawCircle(0, 0, R - 2, stroke(accent, 3, 0.8));
      c.drawCircle(0, 0, R - 2, blurred(stroke(accent, 8, 0.4), 6));
      break;
    }
    case 'burger': {
      c.drawCircle(0, 0, R + 4, fill(accent));
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        c.drawCircle(Math.cos(a) * (R + 2), Math.sin(a) * (R + 2), 9, fill(lighten(accent, 0.15)));
      }
      c.drawCircle(0, 0, R - 6, radial(-30, -35, R * 1.3, [light, base, dark], [0, 0.55, 1]));
      const seed = fill('#FFF6DD');
      for (let i = 0; i < 18; i++) {
        const x = (r() - 0.5) * 150;
        const y = (r() - 0.5) * 150;
        if (Math.hypot(x, y) > 80) continue;
        c.save();
        c.translate(x, y);
        c.rotate(r() * 180, 0, 0);
        oval(c, 0, 0, 2.2, 4.5, seed);
        c.restore();
      }
      break;
    }
    case 'sushi': {
      c.drawCircle(0, 0, R, fill(dark));
      c.drawCircle(0, 0, R - 2, stroke('#3B5A46', 2, 0.6));
      c.drawCircle(0, 0, R - 10, radial(-20, -20, R, ['#FFFFFF', base], [0, 1]));
      const grain = fill('#E6DFCF');
      for (let i = 0; i < 70; i++) {
        const a = r() * Math.PI * 2;
        const rr = 48 + r() * 38;
        c.save();
        c.translate(Math.cos(a) * rr, Math.sin(a) * rr);
        c.rotate(r() * 180, 0, 0);
        oval(c, 0, 0, 1.6, 3.5, grain);
        c.restore();
      }
      c.drawCircle(0, 0, 44, radial(-10, -10, 50, [lighten(accent, 0.3), accent, darken(accent, 0.25)]));
      const strip = stroke('#FFFFFF', 3, 0.5);
      for (let i = -2; i <= 2; i++) c.drawLine(-30, i * 14 - 10, 30, i * 14 + 10, strip);
      oval(c, 24, 26, 14, 10, fill('#8CC152'));
      break;
    }
    case 'candy': {
      c.drawCircle(0, 0, R, fill(accent));
      c.save();
      c.clipPath(circlePath(0, 0, R), ClipOp.Intersect, true);
      for (let i = 0; i < 10; i++) {
        const a0 = (i / 10) * Math.PI * 2;
        const p = Skia.Path.Make();
        p.moveTo(0, 0);
        p.cubicTo(Math.cos(a0 + 0.8) * 50, Math.sin(a0 + 0.8) * 50, Math.cos(a0 + 0.3) * 90, Math.sin(a0 + 0.3) * 90, Math.cos(a0) * 130, Math.sin(a0) * 130);
        p.lineTo(Math.cos(a0 + 0.32) * 130, Math.sin(a0 + 0.32) * 130);
        p.cubicTo(Math.cos(a0 + 0.6) * 90, Math.sin(a0 + 0.6) * 90, Math.cos(a0 + 1.1) * 50, Math.sin(a0 + 1.1) * 50, 0, 0);
        c.drawPath(p, fill(i % 2 ? base : light));
      }
      c.restore();
      c.drawCircle(0, 0, R - 2, stroke(dark, 4, 0.8));
      break;
    }
    case 'chest': {
      c.drawCircle(0, 0, R, fill(dark));
      c.save();
      c.clipPath(circlePath(0, 0, R - 6), ClipOp.Intersect, true);
      for (let i = 0; i < 5; i++) {
        const y = -R + i * 40;
        c.drawRect(Skia.XYWHRect(-R, y, R * 2, 38), linear(0, y, 0, y + 38, [light, base, darken(base, 0.2)]));
      }
      c.drawRect(Skia.XYWHRect(-R, -8, R * 2, 14), linear(0, -8, 0, 6, [lighten(accent, 0.4), accent, darken(accent, 0.3)]));
      c.drawRect(Skia.XYWHRect(-48, -R, 14, R * 2), fill(accent));
      c.drawRect(Skia.XYWHRect(34, -R, 14, R * 2), fill(accent));
      c.restore();
      c.drawCircle(0, 0, R - 3, stroke(accent, 6));
      c.drawRRect(Skia.RRectXY(Skia.XYWHRect(-16, 14, 32, 38), 6, 6), linear(0, 14, 0, 52, [lighten(accent, 0.4), accent, darken(accent, 0.3)]));
      c.drawCircle(0, 28, 5, fill('#2A1606'));
      c.drawPath(poly([[-3, 30], [3, 30], [2, 42], [-2, 42]]), fill('#2A1606'));
      break;
    }
    case 'disco': {
      c.drawCircle(0, 0, R, fill(dark));
      c.save();
      c.clipPath(circlePath(0, 0, R), ClipOp.Intersect, true);
      const t = 15;
      for (let y = -R; y < R; y += t) {
        for (let x = -R; x < R; x += t) {
          const d = Math.hypot(x + t / 2, y + t / 2) / R;
          const v = 0.35 + r() * 0.65;
          c.drawRect(Skia.XYWHRect(x + 1, y + 1, t - 2, t - 2), fill(v > 0.92 ? accent : v > 0.6 ? light : base, 1 - d * 0.35));
        }
      }
      c.restore();
      shine(c);
      for (let i = 0; i < 6; i++) sparkle(c, (r() - 0.5) * 160, (r() - 0.5) * 160, 4 + r() * 6, fill('#FFFFFF'));
      break;
    }
    case 'alien': {
      ball(c, base, light, dark);
      c.drawLine(-30, -R + 6, -46, -R - 30, stroke(dark, 4));
      c.drawLine(30, -R + 6, 46, -R - 30, stroke(dark, 4));
      c.drawCircle(-46, -R - 32, 9, blurred(fill(accent, 0.8), 5));
      c.drawCircle(-46, -R - 32, 6, fill(lighten(accent, 0.4)));
      c.drawCircle(46, -R - 32, 9, blurred(fill(accent, 0.8), 5));
      c.drawCircle(46, -R - 32, 6, fill(lighten(accent, 0.4)));
      for (let i = 0; i < 9; i++) c.drawCircle((r() - 0.5) * 150, (r() - 0.5) * 150, 4 + r() * 7, fill(dark, 0.35));
      break;
    }
    case 'idol': {
      c.drawCircle(0, 0, R, radial(-25, -30, R * 1.3, [light, base, dark], [0, 0.55, 1]));
      for (const rr of [R - 8, R - 24]) c.drawCircle(0, 0, rr, stroke(dark, 3, 0.55));
      const glyph = stroke(dark, 2.4, 0.7);
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const x = Math.cos(a) * (R - 16);
        const y = Math.sin(a) * (R - 16);
        c.drawRect(Skia.XYWHRect(x - 3, y - 3, 6, 6), glyph);
      }
      c.drawPath(poly([[-26, 30], [26, 30], [18, 52], [-18, 52]]), fill(dark, 0.6));
      c.drawCircle(0, -48, 9, blurred(fill(accent, 0.8), 5));
      c.drawCircle(0, -48, 6, fill(lighten(accent, 0.4)));
      break;
    }
    case 'clock': {
      ball(c, base, light, dark);
      c.drawCircle(0, 0, R - 12, radial(-15, -20, R, ['#FFFFFF', light], [0, 1]));
      const tick = stroke(dark, 3);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        c.drawLine(Math.cos(a) * 74, Math.sin(a) * 74, Math.cos(a) * 84, Math.sin(a) * 84, tick);
      }
      c.drawLine(0, 0, 0, 52, stroke(dark, 5));
      c.drawLine(0, 0, 36, 22, stroke(accent, 3.5));
      c.drawCircle(0, 0, 6, fill(dark));
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        c.drawRect(Skia.XYWHRect(Math.cos(a) * (R - 5) - 3, Math.sin(a) * (R - 5) - 3, 6, 6), fill(dark));
      }
      break;
    }
  }
  if (boss.id !== 'disco' && boss.id !== 'lava' && boss.id !== 'cyber') shine(c);
}

const bodyCache = new Map<string, SkPicture>();

export function bossBodyPicture(boss: BossDef, hueKey: string): SkPicture {
  const key = `${boss.id}-${hueKey}`;
  let pic = bodyCache.get(key);
  if (!pic) {
    pic = record(320, 320, (c) => drawBody(c, boss), -160, -160);
    bodyCache.set(key, pic);
  }
  return pic;
}

export interface FaceState {
  /** Seconds since the last knife hit. */
  hitT: number;
  clock: number;
}

/** Draw the boss face. The canvas is already at the boss centre in unit space, un-rotated. */
export function drawBossFace(c: SkCanvas, boss: BossDef, s: FaceState): void {
  const f = FACE[boss.id] ?? FACE.pumpkin;
  const hit = s.hitT < 0.28;
  const blink = (s.clock % 3.4) < 0.12;
  const ex = f.spread;
  const ey = f.y;
  const glowCol = f.color ?? boss.colors[3];
  const ink = '#1B1220';

  if (f.style === 'cute' || f.style === 'shades') {
    if (hit) {
      const sq = stroke(ink, 4.5);
      for (const sx of [-1, 1]) {
        c.drawLine(sx * ex - 9, ey - 7, sx * ex + 3 * sx, ey, sq);
        c.drawLine(sx * ex + 3 * sx, ey, sx * ex - 9, ey + 7, sq);
      }
    } else if (f.style === 'shades') {
      c.drawRRect(Skia.RRectXY(Skia.XYWHRect(-ex - 18, ey - 10, ex * 2 + 36, 22), 9, 9), fill('#14121C'));
      c.drawLine(-ex - 10, ey - 3, -ex + 2, ey - 3, stroke('#FFFFFF', 2.2, 0.7));
      c.drawLine(ex - 10, ey - 3, ex + 2, ey - 3, stroke('#FFFFFF', 2.2, 0.7));
    } else {
      for (const sx of [-1, 1]) {
        if (blink) {
          c.drawLine(sx * ex - 9, ey, sx * ex + 9, ey, stroke(ink, 4));
        } else {
          c.drawCircle(sx * ex, ey, 13, fill('#FFFFFF'));
          c.drawCircle(sx * ex, ey, 13, stroke(ink, 2.4, 0.9));
          c.drawCircle(sx * ex, ey + 4, 7.5, fill(ink));
          c.drawCircle(sx * ex - 2.5, ey + 1.5, 2.6, fill('#FFFFFF'));
        }
      }
    }
    const my = ey + 30;
    if (hit) {
      oval(c, 0, my + 2, 10, 12, fill('#5A1020'));
      oval(c, 0, my + 7, 6, 4, fill('#FF6B81'));
    } else {
      const m = Skia.Path.Make();
      m.moveTo(-16, my);
      m.quadTo(0, my + 16, 16, my);
      c.drawPath(m, stroke(ink, 4.5));
    }
    if (f.style === 'cute') {
      c.drawCircle(-ex - 14, ey + 20, 8, blurred(fill('#FF7A9A', 0.45), 3));
      c.drawCircle(ex + 14, ey + 20, 8, blurred(fill('#FF7A9A', 0.45), 3));
    }
    return;
  }

  if (f.style === 'carved' || f.style === 'glow') {
    const glow = blurred(fill(glowCol, 0.85), 6);
    const core = fill(lighten(glowCol, 0.45));
    const eyeH = hit ? 3 : blink ? 2 : f.style === 'glow' ? 7 : 14;
    for (const sx of [-1, 1]) {
      const eye =
        f.style === 'carved' && !hit && !blink
          ? poly([[sx * ex - 12, ey + 8], [sx * ex + 12, ey + 8], [sx * ex + sx * 2, ey - 12]])
          : (() => {
              const p = Skia.Path.Make();
              p.addRRect(Skia.RRectXY(Skia.XYWHRect(sx * ex - 13, ey - eyeH / 2, 26, eyeH), 3, 3));
              return p;
            })();
      c.drawPath(eye, fill('#1B0A06'));
      c.drawPath(eye, glow);
      c.drawPath(eye, core);
      if (f.style === 'glow' && !hit) c.drawLine(sx * ex - 14, ey - 12 + (sx > 0 ? 0 : 4), sx * ex + 14, ey - 12 + (sx > 0 ? 4 : 0), stroke(ink, 4));
    }
    const my = ey + 34;
    const mouth = Skia.Path.Make();
    if (hit) {
      oval(c, 0, my, 12, 10, fill('#1B0A06'));
      oval(c, 0, my, 12, 10, blurred(stroke(glowCol, 3, 0.8), 2));
    } else if (f.style === 'carved') {
      mouth.moveTo(-28, my - 6);
      const teeth = 6;
      for (let i = 0; i <= teeth; i++) mouth.lineTo(-28 + (56 / teeth) * i, my + (i % 2 ? 6 : -2));
      mouth.lineTo(28, my - 6);
      mouth.quadTo(0, my + 22, -28, my - 6);
      c.drawPath(mouth, fill('#1B0A06'));
      c.drawPath(mouth, glow);
      c.drawPath(mouth, core);
    } else {
      mouth.moveTo(-18, my);
      mouth.lineTo(18, my);
      c.drawPath(mouth, blurred(stroke(glowCol, 5, 0.7), 3));
      c.drawPath(mouth, stroke(lighten(glowCol, 0.4), 2.4));
    }
    return;
  }

  // Alien: big glossy black eyes
  for (const sx of [-1, 1]) {
    c.save();
    c.translate(sx * ex, ey);
    c.rotate(sx * -20, 0, 0);
    const h = hit ? 4 : blink ? 2 : 20;
    oval(c, 0, 0, 15, h, fill('#0B0B14'));
    if (!hit && !blink) oval(c, -4, -6, 4, 6, fill('#FFFFFF', 0.85));
    c.restore();
  }
  const my = ey + 32;
  if (hit) oval(c, 0, my, 8, 8, fill('#0B0B14'));
  else c.drawLine(-8, my, 8, my, stroke('#0B0B14', 3.5));
}

export function clearBossCaches(): void {
  bodyCache.clear();
}

export { withAlpha };
