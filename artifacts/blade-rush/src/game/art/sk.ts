/**
 * Thin helpers over the Skia imperative API. Never call these at module top
 * level: on web, CanvasKit is only available after LoadSkiaWeb resolves.
 */
import {
  BlurStyle,
  PaintStyle,
  Skia,
  StrokeCap,
  StrokeJoin,
  TileMode,
  type SkCanvas,
  type SkPaint,
  type SkPath,
  type SkPicture,
} from '@shopify/react-native-skia';

export function fill(color: string, alpha = 1): SkPaint {
  const p = Skia.Paint();
  p.setAntiAlias(true);
  p.setColor(Skia.Color(color));
  if (alpha < 1) p.setAlphaf(alpha);
  return p;
}

export function stroke(color: string, width: number, alpha = 1): SkPaint {
  const p = fill(color, alpha);
  p.setStyle(PaintStyle.Stroke);
  p.setStrokeWidth(width);
  p.setStrokeCap(StrokeCap.Round);
  p.setStrokeJoin(StrokeJoin.Round);
  return p;
}

export function blurred(p: SkPaint, sigma: number): SkPaint {
  p.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, sigma, true));
  return p;
}

export function linear(x0: number, y0: number, x1: number, y1: number, colors: readonly string[], pos?: readonly number[]): SkPaint {
  const p = Skia.Paint();
  p.setAntiAlias(true);
  p.setShader(
    Skia.Shader.MakeLinearGradient(
      Skia.Point(x0, y0),
      Skia.Point(x1, y1),
      colors.map((c) => Skia.Color(c)),
      pos ? [...pos] : null,
      TileMode.Clamp,
    ),
  );
  return p;
}

export function radial(cx: number, cy: number, r: number, colors: readonly string[], pos?: readonly number[]): SkPaint {
  const p = Skia.Paint();
  p.setAntiAlias(true);
  p.setShader(
    Skia.Shader.MakeRadialGradient(Skia.Point(cx, cy), Math.max(0.01, r), colors.map((c) => Skia.Color(c)), pos ? [...pos] : null, TileMode.Clamp),
  );
  return p;
}

export function record(width: number, height: number, draw: (c: SkCanvas) => void, originX = 0, originY = 0): SkPicture {
  const rec = Skia.PictureRecorder();
  const c = rec.beginRecording(Skia.XYWHRect(originX, originY, width, height));
  draw(c);
  return rec.finishRecordingAsPicture();
}

export function path(): SkPath {
  return Skia.Path.Make();
}

export function poly(points: readonly (readonly [number, number])[], close = true): SkPath {
  const p = Skia.Path.Make();
  points.forEach(([x, y], i) => (i === 0 ? p.moveTo(x, y) : p.lineTo(x, y)));
  if (close) p.close();
  return p;
}

export function circlePath(x: number, y: number, r: number): SkPath {
  const p = Skia.Path.Make();
  p.addCircle(x, y, r);
  return p;
}

export function rrect(x: number, y: number, w: number, h: number, r: number) {
  return Skia.RRectXY(Skia.XYWHRect(x, y, w, h), r, r);
}

export function oval(c: SkCanvas, cx: number, cy: number, rx: number, ry: number, p: SkPaint): void {
  c.drawOval(Skia.XYWHRect(cx - rx, cy - ry, rx * 2, ry * 2), p);
}

export function arc(c: SkCanvas, cx: number, cy: number, r: number, start: number, sweep: number, p: SkPaint): void {
  c.drawArc(Skia.XYWHRect(cx - r, cy - r, r * 2, r * 2), start, sweep, false, p);
}

/** A soft drop shadow under any path. */
export function shadow(c: SkCanvas, p: SkPath, dx: number, dy: number, sigma: number, alpha: number): void {
  c.save();
  c.translate(dx, dy);
  c.drawPath(p, blurred(fill('#000000', alpha), sigma));
  c.restore();
}

/** Four-point sparkle star. */
export function sparkle(c: SkCanvas, x: number, y: number, r: number, p: SkPaint): void {
  const s = r * 0.28;
  c.drawPath(poly([[x, y - r], [x + s, y - s], [x + r, y], [x + s, y + s], [x, y + r], [x - s, y + s], [x - r, y], [x - s, y - s]]), p);
}

/** Deterministic pseudo-random sequence for art (stable between frames). */
export function artRand(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
