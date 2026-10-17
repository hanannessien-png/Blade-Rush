/**
 * Procedural knives. Local frame: the tip is at (0, 0) and the knife extends
 * down the +y axis (blade, guard, handle, pommel). Each knife is recorded into
 * an SkPicture once and reused every frame.
 */
import { Skia, ClipOp, type SkCanvas, type SkPath, type SkPicture } from '@shopify/react-native-skia';
import type { KnifeStyle } from '../../data/knives';
import { darken, lighten, withAlpha } from './color';
import { artRand, blurred, circlePath, fill, linear, oval, poly, rrect, shadow, sparkle, stroke } from './sk';

export const GUARD_H = 5;
export const HANDLE_LEN = 26;

export function knifeLength(style: KnifeStyle): number {
  return style.bladeLen + GUARD_H + HANDLE_LEN + 6;
}

function bladePath(style: KnifeStyle): SkPath {
  const L = style.bladeLen;
  const W = style.bladeWidth;
  const h = W / 2;
  const p = Skia.PathBuilder.Make();
  switch (style.blade) {
    case 'classic':
      p.moveTo(0, 0);
      p.quadTo(h * 1.05, L * 0.22, h, L * 0.5);
      p.lineTo(h, L);
      p.lineTo(-h, L);
      p.lineTo(-h, L * 0.32);
      p.close();
      break;
    case 'chef':
      p.moveTo(0, 0);
      p.cubicTo(W * 0.15, L * 0.08, h, L * 0.38, h, L);
      p.lineTo(-h * 0.9, L);
      p.lineTo(-h * 0.85, L * 0.35);
      p.quadTo(-W * 0.2, L * 0.1, 0, 0);
      break;
    case 'cleaver':
      p.moveTo(-h, 3);
      p.quadTo(-h, 0, -h + 3, 0);
      p.lineTo(h, 0);
      p.lineTo(h, L);
      p.lineTo(-h * 0.5, L);
      p.lineTo(-h, L * 0.72);
      p.close();
      break;
    case 'bread':
      p.moveTo(0, 0);
      p.quadTo(h, 0, h, L * 0.12);
      p.lineTo(h, L);
      p.lineTo(-h, L);
      p.lineTo(-h, L * 0.12);
      p.quadTo(-h, 0, 0, 0);
      break;
    case 'dagger':
      p.moveTo(0, 0);
      p.lineTo(h, L * 0.32);
      p.lineTo(h * 0.8, L);
      p.lineTo(-h * 0.8, L);
      p.lineTo(-h, L * 0.32);
      p.close();
      break;
    case 'kris': {
      const n = 5;
      p.moveTo(0, 0);
      for (let i = 1; i <= n; i++) {
        const y = (L / n) * i;
        const taper = Math.min(1, y / (L * 0.35));
        const wave = i % 2 === 0 ? 2.4 : -2.4;
        p.quadTo(h * taper + wave + 1.5, y - L / n / 2, h * taper + wave * 0.3, y);
      }
      p.lineTo(-h, L);
      for (let i = n - 1; i >= 0; i--) {
        const y = (L / n) * i;
        const taper = Math.min(1, y / (L * 0.35));
        const wave = i % 2 === 0 ? 2.4 : -2.4;
        p.quadTo(-h * taper + wave - 1.5, y + L / n / 2, -h * taper + wave * 0.3, y);
      }
      p.close();
      break;
    }
    case 'tanto':
      p.moveTo(h * 0.15, 0);
      p.lineTo(h, L * 0.22);
      p.lineTo(h, L);
      p.lineTo(-h, L);
      p.lineTo(-h, L * 0.08);
      p.close();
      break;
    case 'scimitar':
      p.moveTo(0, 0);
      p.cubicTo(W * 0.95, L * 0.18, W * 0.62, L * 0.62, h, L);
      p.lineTo(-h, L);
      p.cubicTo(-h * 0.5, L * 0.6, W * 0.2, L * 0.22, 0, 0);
      break;
    case 'leaf':
      p.moveTo(0, 0);
      p.cubicTo(W * 0.72, L * 0.34, W * 0.5, L * 0.8, W * 0.3, L);
      p.lineTo(-W * 0.3, L);
      p.cubicTo(-W * 0.5, L * 0.8, -W * 0.72, L * 0.34, 0, 0);
      break;
    case 'needle':
      p.moveTo(0, 0);
      p.lineTo(h, L * 0.85);
      p.lineTo(h * 0.9, L);
      p.lineTo(-h * 0.9, L);
      p.lineTo(-h, L * 0.85);
      p.close();
      break;
    case 'bowie':
      p.moveTo(0, 0);
      p.quadTo(W * 0.56, L * 0.22, h, L * 0.55);
      p.lineTo(h, L);
      p.lineTo(-h, L);
      p.lineTo(-h, L * 0.32);
      p.lineTo(-W * 0.14, L * 0.14);
      p.close();
      break;
    case 'kunai':
      p.moveTo(0, 0);
      p.lineTo(h, L * 0.55);
      p.lineTo(W * 0.16, L);
      p.lineTo(-W * 0.16, L);
      p.lineTo(-h, L * 0.55);
      p.close();
      break;
    case 'crystal':
      p.moveTo(0, 0);
      p.lineTo(h, L * 0.3);
      p.lineTo(W * 0.36, L * 0.62);
      p.lineTo(W * 0.46, L);
      p.lineTo(-W * 0.46, L);
      p.lineTo(-W * 0.32, L * 0.6);
      p.lineTo(-h, L * 0.28);
      p.close();
      break;
    case 'flame':
      p.moveTo(0, 0);
      p.cubicTo(W * 0.6, L * 0.14, W * 0.1, L * 0.34, W * 0.5, L * 0.5);
      p.cubicTo(W * 0.8, L * 0.66, W * 0.38, L * 0.85, W * 0.42, L);
      p.lineTo(-W * 0.42, L);
      p.cubicTo(-W * 0.5, L * 0.8, -W * 0.15, L * 0.6, -W * 0.45, L * 0.4);
      p.cubicTo(-W * 0.62, L * 0.24, -W * 0.1, L * 0.14, 0, 0);
      break;
    case 'hook':
      p.moveTo(W * 0.36, L * 0.07);
      p.cubicTo(0, -L * 0.05, -W * 0.56, L * 0.14, -h, L * 0.42);
      p.lineTo(-h, L);
      p.lineTo(h, L);
      p.lineTo(h, L * 0.46);
      p.cubicTo(h, L * 0.26, W * 0.12, L * 0.16, W * 0.36, L * 0.07);
      break;
    case 'sickle':
      p.moveTo(0, 0);
      p.cubicTo(W * 1.15, L * 0.14, W * 0.95, L * 0.74, W * 0.38, L);
      p.lineTo(-W * 0.38, L);
      p.cubicTo(W * 0.3, L * 0.7, W * 0.42, L * 0.26, 0, 0);
      break;
  }
  return p.build();
}

function drawPattern(c: SkCanvas, style: KnifeStyle, blade: SkPath): void {
  const L = style.bladeLen;
  const W = style.bladeWidth;
  const color = style.patternColor ?? '#FFFFFF';
  if (style.pattern === 'none') return;
  c.save();
  c.clipPath(blade, ClipOp.Intersect, true);
  const r = artRand(L * 31 + W * 7);
  switch (style.pattern) {
    case 'damascus': {
      const s = stroke(color, 0.7, 0.55);
      for (let i = 0; i < 9; i++) {
        const y0 = (L / 9) * i + 3;
        const p = Skia.PathBuilder.Make();
        p.moveTo(-W, y0);
        p.cubicTo(-W * 0.3, y0 - 4, W * 0.2, y0 + 5, W, y0 - 2);
        c.drawPath(p.build(), s);
      }
      break;
    }
    case 'circuit': {
      const glow = blurred(stroke(color, 2.2, 0.55), 2);
      const s = stroke(color, 0.9, 1);
      const dot = fill(color);
      const lines: [number, number, number, number][] = [
        [0, L * 0.25, 0, L * 0.6],
        [0, L * 0.6, W * 0.25, L * 0.72],
        [0, L * 0.42, -W * 0.25, L * 0.52],
        [-W * 0.25, L * 0.52, -W * 0.25, L * 0.85],
        [W * 0.25, L * 0.72, W * 0.25, L * 0.92],
      ];
      for (const [x0, y0, x1, y1] of lines) {
        c.drawLine(x0, y0, x1, y1, glow);
        c.drawLine(x0, y0, x1, y1, s);
      }
      c.drawCircle(0, L * 0.25, 1.4, dot);
      c.drawCircle(-W * 0.25, L * 0.85, 1.4, dot);
      c.drawCircle(W * 0.25, L * 0.92, 1.4, dot);
      break;
    }
    case 'runes': {
      const glow = blurred(stroke(color, 2.4, 0.5), 2);
      const s = stroke(color, 0.9, 0.95);
      for (let i = 0; i < 4; i++) {
        const y = L * 0.3 + i * L * 0.16;
        const p = Skia.PathBuilder.Make();
        p.moveTo(-2, y - 2);
        p.lineTo(2, y);
        p.lineTo(-2, y + 2);
        if (i % 2 === 0) {
          p.moveTo(2, y - 3);
          p.lineTo(2, y + 3);
        }
        c.drawPath(p.build(), glow);
        c.drawPath(p.build(), s);
      }
      break;
    }
    case 'stars': {
      const s = fill(color, 0.95);
      for (let i = 0; i < 9; i++) {
        const x = (r() - 0.5) * W * 0.8;
        const y = L * 0.15 + r() * L * 0.8;
        if (i % 3 === 0) sparkle(c, x, y, 2.4, s);
        else c.drawCircle(x, y, 0.7 + r() * 0.6, s);
      }
      break;
    }
    case 'frost': {
      const s = stroke(color, 0.7, 0.8);
      for (let i = 0; i < 5; i++) {
        const x = (r() - 0.5) * W * 0.6;
        const y = L * 0.2 + r() * L * 0.7;
        for (let k = 0; k < 3; k++) {
          const a = (k * Math.PI) / 3;
          c.drawLine(x - Math.cos(a) * 2.5, y - Math.sin(a) * 2.5, x + Math.cos(a) * 2.5, y + Math.sin(a) * 2.5, s);
        }
      }
      break;
    }
    case 'swirl': {
      const s = stroke(color, 0.9, 0.6);
      for (let i = 0; i < 4; i++) {
        const y = L * 0.25 + i * L * 0.18;
        const p = Skia.PathBuilder.Make();
        p.moveTo(-W * 0.4, y);
        p.cubicTo(-W * 0.1, y - 5, W * 0.1, y + 5, W * 0.4, y);
        c.drawPath(p.build(), s);
      }
      break;
    }
    case 'serrated': {
      const teeth = fill(darken(style.bladeColors[2], 0.2), 0.9);
      const n = Math.floor(L / 4.5);
      for (let i = 2; i < n; i++) {
        const y = i * 4.5;
        c.drawPath(poly([[W / 2 + 1, y], [W / 2 - 2.2, y + 2.2], [W / 2 + 1, y + 4.5]]), teeth);
      }
      break;
    }
  }
  c.restore();
}

function drawGuard(c: SkCanvas, style: KnifeStyle): void {
  const y = style.bladeLen;
  const W = style.bladeWidth;
  const [gl, gd] = style.guardColors;
  const g = linear(0, y, 0, y + GUARD_H, [lighten(gl, 0.2), gl, gd]);
  const edge = stroke(darken(gd, 0.35), 0.8, 0.8);
  switch (style.guard) {
    case 'none':
      return;
    case 'bar': {
      const r = rrect(-W / 2 - 4, y, W + 8, GUARD_H, 2);
      c.drawRRect(r, g);
      c.drawRRect(r, edge);
      break;
    }
    case 'round':
      oval(c, 0, y + GUARD_H / 2, W / 2 + 3.5, GUARD_H / 2 + 1.2, g);
      oval(c, 0, y + GUARD_H / 2, W / 2 + 3.5, GUARD_H / 2 + 1.2, edge);
      break;
    case 'cross': {
      const r = rrect(-W / 2 - 8, y + 0.5, W + 16, GUARD_H - 1, 2);
      c.drawRRect(r, g);
      c.drawRRect(r, edge);
      c.drawCircle(-W / 2 - 8, y + GUARD_H / 2, 3, g);
      c.drawCircle(W / 2 + 8, y + GUARD_H / 2, 3, g);
      break;
    }
    case 'winged': {
      const p = Skia.PathBuilder.Make();
      p.moveTo(-W / 2 - 2, y + GUARD_H);
      p.quadTo(-W / 2 - 10, y + GUARD_H, -W / 2 - 11, y - 5);
      p.quadTo(-W / 2 - 4, y - 1, -W / 2, y);
      p.lineTo(W / 2, y);
      p.quadTo(W / 2 + 4, y - 1, W / 2 + 11, y - 5);
      p.quadTo(W / 2 + 10, y + GUARD_H, W / 2 + 2, y + GUARD_H);
      p.close();
      c.drawPath(p.build(), g);
      c.drawPath(p.build(), edge);
      break;
    }
    case 'disc':
      oval(c, 0, y + GUARD_H / 2, W / 2 + 5, GUARD_H / 2 + 1.5, g);
      oval(c, 0, y + GUARD_H / 2, W / 2 + 5, GUARD_H / 2 + 1.5, edge);
      oval(c, 0, y + GUARD_H / 2, W / 2 + 1, GUARD_H / 2 - 0.5, fill(darken(gd, 0.2), 0.6));
      break;
    case 'ring': {
      const r = rrect(-W / 2 - 3, y + 1, W + 6, GUARD_H - 2, 1.5);
      c.drawRRect(r, g);
      c.drawCircle(-W / 2 - 5, y + GUARD_H / 2, 3, stroke(gl, 1.6));
      c.drawCircle(W / 2 + 5, y + GUARD_H / 2, 3, stroke(gl, 1.6));
      break;
    }
    case 'skull': {
      const r = rrect(-W / 2 - 4, y + 1, W + 8, GUARD_H - 1, 2);
      c.drawRRect(r, fill(gd));
      c.drawCircle(0, y + GUARD_H / 2, 5, g);
      c.drawCircle(0, y + GUARD_H / 2, 5, edge);
      c.drawCircle(-1.8, y + GUARD_H / 2 - 0.5, 1.1, fill('#2A2235'));
      c.drawCircle(1.8, y + GUARD_H / 2 - 0.5, 1.1, fill('#2A2235'));
      break;
    }
  }
}

function drawHandle(c: SkCanvas, style: KnifeStyle): number {
  const y0 = style.bladeLen + GUARD_H;
  const L = HANDLE_LEN;
  const w = 8;
  const [hl, hd] = style.handleColors;
  const g = linear(-w / 2, 0, w / 2, 0, [hd, hl, lighten(hl, 0.25), hl, hd], [0, 0.3, 0.45, 0.6, 1]);
  const outline = stroke(darken(hd, 0.4), 0.8, 0.7);
  switch (style.handle) {
    case 'wrapped': {
      const r = rrect(-w / 2, y0, w, L, 2.5);
      c.drawRRect(r, g);
      c.save();
      c.clipRRect(r, ClipOp.Intersect, true);
      const s = stroke(darken(hd, 0.25), 1.6, 0.85);
      for (let i = -1; i < 9; i++) c.drawLine(-w / 2 - 2, y0 + i * 3.4, w / 2 + 2, y0 + i * 3.4 + 4, s);
      c.restore();
      c.drawRRect(r, outline);
      break;
    }
    case 'plain': {
      const r = rrect(-w / 2, y0, w, L, 3);
      c.drawRRect(r, g);
      c.drawRRect(r, outline);
      const rivet = fill('#E6EBF2');
      c.drawCircle(0, y0 + L * 0.3, 1.2, rivet);
      c.drawCircle(0, y0 + L * 0.7, 1.2, rivet);
      break;
    }
    case 'ringed': {
      const r = rrect(-w / 2, y0, w, L, 2.5);
      c.drawRRect(r, g);
      const band = linear(-w / 2, 0, w / 2, 0, [style.guardColors[1], style.guardColors[0], style.guardColors[1]]);
      for (let i = 0; i < 3; i++) c.drawRect(Skia.XYWHRect(-w / 2, y0 + 4 + i * 8, w, 2.2), band);
      c.drawRRect(r, outline);
      break;
    }
    case 'ornate': {
      const p = Skia.PathBuilder.Make();
      p.moveTo(-w / 2 + 1, y0);
      p.cubicTo(-w / 2 - 2, y0 + L * 0.35, -w / 2 - 2, y0 + L * 0.65, -w / 2 + 1, y0 + L);
      p.lineTo(w / 2 - 1, y0 + L);
      p.cubicTo(w / 2 + 2, y0 + L * 0.65, w / 2 + 2, y0 + L * 0.35, w / 2 - 1, y0);
      p.close();
      c.drawPath(p.build(), g);
      const band = linear(-w / 2, 0, w / 2, 0, [style.guardColors[1], style.guardColors[0], style.guardColors[1]]);
      c.drawRect(Skia.XYWHRect(-w / 2 - 1, y0 + 1, w + 2, 2.5), band);
      c.drawRect(Skia.XYWHRect(-w / 2 - 1.5, y0 + L / 2 - 1.2, w + 3, 2.4), band);
      c.drawRect(Skia.XYWHRect(-w / 2 - 1, y0 + L - 3.5, w + 2, 2.5), band);
      c.drawPath(p.build(), outline);
      break;
    }
    case 'grip': {
      const p = Skia.PathBuilder.Make();
      p.moveTo(-w / 2, y0);
      for (let i = 0; i < 4; i++) p.quadTo(-w / 2 - 1.8, y0 + i * 6.5 + 3.25, -w / 2, y0 + (i + 1) * 6.5);
      p.lineTo(w / 2, y0 + L);
      p.lineTo(w / 2, y0);
      p.close();
      c.drawPath(p.build(), g);
      c.drawPath(p.build(), outline);
      break;
    }
    case 'bone': {
      const r = rrect(-w / 2 + 0.5, y0, w - 1, L, 3);
      c.drawRRect(r, g);
      oval(c, 0, y0 + L - 1, w / 2 + 1.2, 2.6, fill(hl));
      c.drawRRect(r, outline);
      break;
    }
  }
  return y0 + L;
}

function drawPommel(c: SkCanvas, style: KnifeStyle, y: number): void {
  const col = style.pommelColor;
  const g = linear(-5, y, 5, y + 8, [lighten(col, 0.4), col, darken(col, 0.35)]);
  const edge = stroke(darken(col, 0.45), 0.8, 0.8);
  switch (style.pommel) {
    case 'none':
      return;
    case 'round':
      c.drawCircle(0, y + 2.5, 4.4, g);
      c.drawCircle(0, y + 2.5, 4.4, edge);
      c.drawCircle(-1.3, y + 1.2, 1.3, fill('#FFFFFF', 0.7));
      break;
    case 'gem':
      c.drawCircle(0, y + 3, 5, g);
      c.drawCircle(0, y + 3, 5, edge);
      c.drawCircle(0, y + 3, 2.8, fill(style.gem ?? '#E01133'));
      c.drawCircle(-0.9, y + 2.1, 1, fill('#FFFFFF', 0.85));
      break;
    case 'ring':
      c.drawCircle(0, y + 4, 3.6, stroke(col, 2));
      break;
    case 'spike':
      c.drawPath(poly([[-4, y], [4, y], [0, y + 7]]), g);
      break;
    case 'crown': {
      c.drawPath(poly([[-5, y], [5, y], [5, y + 3], [3.5, y + 7], [1.5, y + 4], [0, y + 8], [-1.5, y + 4], [-3.5, y + 7], [-5, y + 3]]), g);
      c.drawCircle(0, y + 2, 1.6, fill(style.gem ?? '#E01133'));
      break;
    }
  }
}

/** Draw the knife at the origin (tip at 0,0 pointing up). */
export function drawKnife(c: SkCanvas, style: KnifeStyle, withShadow = true): void {
  const L = style.bladeLen;
  const W = style.bladeWidth;
  const blade = bladePath(style);
  const total = knifeLength(style);

  if (withShadow) {
    const sil = Skia.PathBuilder.Make().addPath(blade).addRRect(rrect(-4, L, 8, total - L, 3)).build();
    shadow(c, sil, 2.5, 3.5, 2.2, 0.38);
  }

  if (style.glow) {
    c.drawPath(blade, blurred(fill(style.glow, 0.85), 5));
    c.drawPath(blade, blurred(stroke(style.glow, 3, 0.6), 2));
  }

  // Blade body: horizontal gradient spine → edge, then a vertical sheen.
  const [bl, bm, bd] = style.bladeColors;
  c.drawPath(blade, linear(-W / 2, 0, W / 2, 0, [bd, bm, bl, bm, bd], [0, 0.28, 0.5, 0.72, 1]));
  c.drawPath(blade, linear(0, 0, 0, L, [withAlpha('#FFFFFF', 0.28), withAlpha('#FFFFFF', 0), withAlpha('#000000', 0.18)]));
  drawPattern(c, style, blade);

  // Specular streak and edge highlight.
  c.save();
  c.clipPath(blade, ClipOp.Intersect, true);
  c.drawLine(-W * 0.08, L * 0.12, -W * 0.08, L * 0.92, blurred(stroke('#FFFFFF', 1.6, 0.75), 0.6));
  c.drawLine(W * 0.5 - 1, 0, W * 0.5 - 1, L, stroke(style.edge, 1.2, 0.75));
  c.restore();
  c.drawPath(blade, stroke(darken(bd, 0.45), 0.9, 0.75));

  if (style.blade === 'cleaver') c.drawCircle(-W * 0.15, L * 0.18, 2.2, fill(darken(bd, 0.5)));

  drawGuard(c, style);
  const end = drawHandle(c, style);
  drawPommel(c, style, end);

  if (style.glow) {
    const sp = fill('#FFFFFF', 0.95);
    sparkle(c, W * 0.25, L * 0.3, 3, sp);
    sparkle(c, -W * 0.2, L * 0.7, 2, sp);
  }
}

const knifeCache = new Map<string, SkPicture>();

export function knifePicture(id: string, style: KnifeStyle): SkPicture {
  let pic = knifeCache.get(id);
  if (!pic) {
    const len = knifeLength(style);
    pic = (() => {
      const rec = Skia.PictureRecorder();
      const c = rec.beginRecording(Skia.XYWHRect(-30, -20, 60, len + 40));
      drawKnife(c, style);
      return rec.finishRecordingAsPicture();
    })();
    knifeCache.set(id, pic);
  }
  return pic;
}

const imageCache = new Map<string, string>();

/**
 * Render a knife to a PNG data URI for menus (store cards, home). Using images
 * instead of one Skia canvas per card keeps the web build under the browser's
 * WebGL context limit and scrolls smoothly on Android.
 */
export function knifeImageUri(id: string, style: KnifeStyle, scale = 3): string | null {
  const key = `${id}@${scale}`;
  const cached = imageCache.get(key);
  if (cached) return cached;
  const len = knifeLength(style);
  const w = Math.ceil(44 * scale);
  const h = Math.ceil((len + 16) * scale);
  const surface = Skia.Surface.Make(w, h);
  if (!surface) return null;
  const c = surface.getCanvas();
  c.scale(scale, scale);
  c.translate(22, 6);
  drawKnife(c, style);
  surface.flush();
  const img = surface.makeImageSnapshot();
  const b64 = img.encodeToBase64();
  const uri = `data:image/png;base64,${b64}`;
  imageCache.set(key, uri);
  return uri;
}

export function knifeImageAspect(style: KnifeStyle): number {
  return 44 / (knifeLength(style) + 16);
}

export function clearKnifeCaches(): void {
  knifeCache.clear();
}

export { circlePath };
