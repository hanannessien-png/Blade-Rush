/**
 * Draws the engine state into one SkPicture per frame. All persistent art is
 * pre-recorded (knives, targets, bosses, backgrounds); this file only places it.
 */
import { Skia, ClipOp, type SkCanvas, type SkPaint, type SkPicture } from '@shopify/react-native-skia';
import { DIFFICULTY as D, type KnifeSize } from '../config/difficulty';
import { BOSSES } from '../data/bosses';
import type { KnifeStyle } from '../data/knives';
import { WORLDS, type WorldDef } from '../data/worlds';
import { DEG, halfWidthDeg, norm360 } from './angles';
import { AMBIENT_COUNT, backgroundPictures, BG_MARGIN, drawAmbient, makeAmbientPaints, type AmbientPaints, type WorldPalette } from './art/backgroundArt';
import { bossBodyPicture, drawBossFace } from './art/bossArt';
import { shiftHue } from './art/color';
import { knifePicture } from './art/knifeArt';
import { blurred, fill, linear, sparkle, stroke } from './art/sk';
import { appleHalfPicture, applePicture, spikePicture, targetPicture, UNIT_R, wedgePath, type AppleKind, type TargetPalette } from './art/targetArt';
import type { GameEngine } from './engine';

export const CYCLE_HUE_SHIFT = 47;

export function worldPalette(world: WorldDef, cycle: number): WorldPalette & { target: TargetPalette } {
  const h = cycle * CYCLE_HUE_SHIFT;
  return {
    sky: [shiftHue(world.sky[0], h), shiftHue(world.sky[1], h), shiftHue(world.sky[2], h)],
    far: shiftHue(world.far, h),
    near: shiftHue(world.near, h),
    glow: shiftHue(world.glow, h),
    particleColor: shiftHue(world.particleColor, h),
    target: [shiftHue(world.target[0], h), shiftHue(world.target[1], h), shiftHue(world.target[2], h), shiftHue(world.target[3], h)],
  };
}

const SIZE_SCALE: Record<KnifeSize, number> = { small: 0.8, normal: 1, wide: 1.34 };

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

interface Paints {
  dot: SkPaint;
  line: SkPaint;
  flash: SkPaint;
  shieldGlow: SkPaint;
  shieldCore: SkPaint;
  aimFill: SkPaint;
  aimEdge: SkPaint;
  bubble: SkPaint;
  bubbleGlow: SkPaint;
  trail: SkPaint;
  targetGlow: SkPaint;
}

export interface RenderInput {
  /** Screen px per logical px. */
  scale: number;
  knifeId: string;
  knifeStyle: KnifeStyle;
  reduceMotion: boolean;
}

export class Renderer {
  private paints: Paints | null = null;
  private ambient: AmbientPaints | null = null;
  private ambientColor = '';
  private worldKey = '';
  private world: WorldDef = WORLDS[0];
  private pal = worldPalette(WORLDS[0], 0);
  private recent: SkPicture[] = [];

  private ensurePaints(): Paints {
    if (!this.paints) {
      this.paints = {
        dot: fill('#FFFFFF'),
        line: stroke('#FFFFFF', 2),
        flash: fill('#FFFFFF'),
        shieldGlow: blurred(stroke('#7FE3FF', 12, 0.55), 6),
        shieldCore: stroke('#E8FBFF', 5),
        aimFill: fill('#7DFF9A', 0.32),
        aimEdge: blurred(stroke('#7DFF9A', 5, 0.8), 3),
        bubble: stroke('#9EEBFF', 2.5, 0.9),
        bubbleGlow: blurred(fill('#7FE3FF', 0.22), 8),
        trail: fill('#FFFFFF', 0.4),
        targetGlow: fill('#FFFFFF'),
      };
    }
    return this.paints;
  }

  private setWorld(index: number, cycle: number): void {
    const key = `${index}:${cycle}`;
    if (key === this.worldKey) return;
    this.worldKey = key;
    this.world = WORLDS[index] ?? WORLDS[0];
    this.pal = worldPalette(this.world, cycle);
    if (this.ambientColor !== this.pal.particleColor) {
      this.ambient = makeAmbientPaints(this.pal.particleColor);
      this.ambientColor = this.pal.particleColor;
    }
  }

  render(e: GameEngine, input: RenderInput): SkPicture {
    const P = this.ensurePaints();
    const def = e.def;
    if (def) this.setWorld(def.worldIndex, def.worldCycle);
    const h = e.viewport.height;
    const rec = Skia.PictureRecorder();
    const c = rec.beginRecording(Skia.XYWHRect(0, 0, D.logicalWidth * input.scale, h * input.scale));
    c.save();
    c.scale(input.scale, input.scale);

    // Background with gentle parallax
    const t = e.clock;
    const bg = backgroundPictures(this.world, this.pal, `${this.world.id}:${this.worldKey}`, h);
    const drift = input.reduceMotion ? 0 : 1;
    c.save();
    c.translate(Math.sin(t * 0.15) * 6 * drift, 0);
    c.drawPicture(bg.far);
    c.restore();
    if (this.ambient) drawAmbient(c, this.world.particle, this.pal.particleColor, t, h, input.reduceMotion ? Math.ceil(AMBIENT_COUNT[this.world.particle] / 3) : AMBIENT_COUNT[this.world.particle], this.ambient);
    c.save();
    c.translate(Math.sin(t * 0.15 + 1) * 12 * drift, 0);
    c.drawPicture(bg.near);
    c.restore();

    // Camera shake and punch
    c.save();
    if (e.shake > 0) c.translate((Math.random() - 0.5) * e.shake, (Math.random() - 0.5) * e.shake);
    if (e.punch > 0) {
      const s = 1 + e.punch;
      c.translate(e.cx, e.cy);
      c.scale(s, s);
      c.translate(-e.cx, -e.cy);
    }

    if (def && e.phase !== 'clear') this.drawTargetGroup(c, e, input, P);
    this.drawDebris(c, e, input);
    if (def) this.drawThrowables(c, e, input, P);
    this.drawParticles(c, e, P);
    c.restore();

    c.restore();
    const pic = rec.finishRecordingAsPicture();
    this.recent.push(pic);
    if (this.recent.length > 30) {
      const old = this.recent.shift();
      old?.dispose?.();
    }
    return pic;
  }

  private targetPic(e: GameEngine): SkPicture {
    const def = e.def!;
    if (def.isBoss && def.bossIndex !== null) return bossBodyPicture(BOSSES[def.bossIndex], 'base');
    return targetPicture(this.world.material, this.pal.target, `${this.world.id}:${this.worldKey}`);
  }

  private drawTargetGroup(c: SkCanvas, e: GameEngine, input: RenderInput, P: Paints): void {
    const def = e.def!;
    const intro = easeOutBack(Math.min(1, e.introT));
    const r = e.radius * intro;
    const knifePic = knifePicture(input.knifeId, input.knifeStyle);

    // Glow behind the target
    P.targetGlow.setShader(
      Skia.Shader.MakeRadialGradient(Skia.Point(e.cx, e.cy), r * 1.9, [Skia.Color(this.pal.glow), Skia.Color('transparent')], [0, 1], 0),
    );
    P.targetGlow.setAlphaf(def.isBoss ? 0.55 : 0.4);
    c.drawCircle(e.cx, e.cy, r * 1.9, P.targetGlow);

    // Orbiting shields
    if (e.shields.length) {
      const sr = e.shieldRadius() * intro;
      const rect = Skia.XYWHRect(e.cx - sr, e.cy - sr, sr * 2, sr * 2);
      for (const s of e.shields) {
        const a = e.shieldAngle(s);
        c.drawArc(rect, a, s.arc, false, P.shieldGlow);
        c.drawArc(rect, a, s.arc, false, P.shieldCore);
      }
    }

    // Aim guide: the safest gap glows; the bottom marker lights up when it lines up.
    if (e.aimThrows > 0 && e.phase === 'play') {
      const gap = e.aimGap();
      const w = Math.min(60, Math.max(6, gap.width - 2));
      const wa = gap.center + e.rotation;
      const rr = r + 20;
      c.drawArc(Skia.XYWHRect(e.cx - rr, e.cy - rr, rr * 2, rr * 2), wa - w / 2, w, true, P.aimFill);
      c.drawArc(Skia.XYWHRect(e.cx - rr, e.cy - rr, rr * 2, rr * 2), wa - w / 2, w, false, P.aimEdge);
      const knifeHalf = halfWidthDeg(D.knifeWidthPx[e.currentKnifeSize ?? 'normal'], e.radius);
      const off = Math.abs(((norm360(wa - 90) + 180) % 360) - 180);
      if (off < Math.max(1, gap.width / 2 - knifeHalf)) {
        sparkle(c, e.cx, e.cy + r + 28, 9, P.dot);
      }
    }

    // Stuck knives and spikes go under the target so their inserted part is hidden.
    const squashK = Math.max(0, 1 - e.bossHitT / 0.14);
    for (const it of e.items) {
      if (it.kind !== 'knife' && it.kind !== 'spike') continue;
      let wa = it.angle + e.rotation;
      if (it.kind === 'knife' && it.wobbleT < 0.6 && !input.reduceMotion) {
        wa += D.wobbleAmplitudeDeg * Math.exp(-D.wobbleDamping * it.wobbleT) * Math.sin(D.wobbleFrequency * it.wobbleT);
      }
      const rad = wa * DEG;
      if (it.kind === 'knife') {
        const d = r - D.knifePenetration * intro;
        c.save();
        c.translate(e.cx + Math.cos(rad) * d, e.cy + Math.sin(rad) * d);
        c.rotate(wa - 90, 0, 0);
        c.scale(SIZE_SCALE[it.size] * intro, intro);
        c.drawPicture(knifePic);
        c.restore();
      } else {
        const alpha = e.ghostAlpha(it);
        const ghost = it.ghostPhase !== null;
        c.save();
        c.translate(e.cx + Math.cos(rad) * (r - 3), e.cy + Math.sin(rad) * (r - 3));
        c.rotate(wa + 90, 0, 0);
        c.scale(intro, intro);
        if (ghost && alpha < 0.98) {
          const lp = Skia.Paint();
          lp.setAlphaf(Math.max(0.12, alpha));
          c.saveLayer(lp);
          c.drawPicture(spikePicture(true));
          c.restore();
        } else {
          c.drawPicture(spikePicture(ghost));
        }
        c.restore();
      }
    }

    // Target body
    c.save();
    c.translate(e.cx, e.cy);
    c.rotate(e.rotation, 0, 0);
    const sc = (r / UNIT_R);
    c.scale(sc * (1 + 0.05 * squashK), sc * (1 - 0.05 * squashK));
    c.drawPicture(this.targetPic(e));
    if (def.isBoss && def.bossIndex !== null) {
      drawBossFace(c, BOSSES[def.bossIndex], { hitT: e.bossHitT, clock: e.clock });
    }
    c.restore();
    if (e.targetFlash > 0) {
      P.flash.setAlphaf(e.targetFlash * 0.16);
      c.drawCircle(e.cx, e.cy, r, P.flash);
    }

    // Apples sit on the rim, on top of the target.
    for (const it of e.items) {
      if (it.kind !== 'apple' && it.kind !== 'golden' && it.kind !== 'crystal') continue;
      const wa = it.angle + e.rotation;
      const rad = wa * DEG;
      const bob = Math.sin(e.clock * 4 + it.id) * 0.6;
      c.save();
      c.translate(e.cx + Math.cos(rad) * (r + 8 + bob), e.cy + Math.sin(rad) * (r + 8 + bob));
      c.rotate(wa + 90, 0, 0);
      c.scale(intro, intro);
      c.drawPicture(applePicture(it.kind as AppleKind));
      c.restore();
    }
  }

  private drawThrowables(c: SkCanvas, e: GameEngine, input: RenderInput, P: Paints): void {
    const knifePic = knifePicture(input.knifeId, input.knifeStyle);
    const glow = input.knifeStyle.glow;
    for (const k of e.flying) {
      const len = 46;
      P.trail.setShader(
        Skia.Shader.MakeLinearGradient(
          Skia.Point(e.cx, k.y + 20),
          Skia.Point(e.cx, k.y + 20 + len * 2),
          [Skia.Color(glow ?? '#FFFFFF'), Skia.Color('transparent')],
          [0, 1],
          0,
        ),
      );
      P.trail.setAlphaf(glow ? 0.7 : 0.35);
      c.drawRect(Skia.XYWHRect(e.cx - 3, k.y + 20, 6, len * 2), P.trail);
      c.save();
      c.translate(e.cx, k.y);
      c.scale(SIZE_SCALE[k.size], 1);
      c.drawPicture(knifePic);
      c.restore();
    }
    const size = e.currentKnifeSize;
    if (size && e.phase === 'play' && e.nextReadyIn <= 0.12) {
      const slide = 1 - Math.pow(1 - e.knifeSlide, 3);
      const y = e.restY + (1 - slide) * 70;
      if (e.shieldCharges > 0) {
        const pulse = 1 + Math.sin(e.clock * 5) * 0.05;
        c.drawCircle(e.cx, y + 34, 46 * pulse, P.bubbleGlow);
        c.drawCircle(e.cx, y + 34, 46 * pulse, P.bubble);
      }
      c.save();
      c.translate(e.cx, y);
      c.scale(SIZE_SCALE[size], 1);
      c.drawPicture(knifePic);
      c.restore();
    }
  }

  private drawDebris(c: SkCanvas, e: GameEngine, input: RenderInput): void {
    if (!e.debris.length) return;
    const knifePic = knifePicture(input.knifeId, input.knifeStyle);
    const tpic = e.def ? this.targetPic(e) : null;
    for (const d of e.debris) {
      c.save();
      c.translate(d.x, d.y);
      switch (d.kind) {
        case 'knife':
          c.rotate(d.rot, 0, 0);
          c.scale(SIZE_SCALE[d.size], 1);
          c.drawPicture(knifePic);
          break;
        case 'spike':
          c.rotate(d.rot + 180, 0, 0);
          c.drawPicture(spikePicture(false));
          break;
        case 'apple-half':
          c.rotate(d.rot, 0, 0);
          c.drawPicture(appleHalfPicture(d.appleKind as AppleKind, d.side));
          break;
        case 'wedge':
          if (tpic) {
            const s = e.radius / UNIT_R;
            c.rotate(d.rot + d.a0, 0, 0);
            c.scale(s, s);
            c.clipPath(wedgePath(d.side, 8), ClipOp.Intersect, true);
            c.drawPicture(tpic);
          }
          break;
      }
      c.restore();
    }
  }

  private drawParticles(c: SkCanvas, e: GameEngine, P: Paints): void {
    const chipA = this.pal.target[1];
    const chipB = this.pal.target[2];
    for (let i = 0; i < e.particles.length; i++) {
      const p = e.particles[i];
      const k = p.life / p.maxLife;
      switch (p.kind) {
        case 'chip':
          P.dot.setColor(Skia.Color(i % 2 ? chipA : chipB));
          P.dot.setAlphaf(Math.min(1, k * 1.6));
          c.drawRect(Skia.XYWHRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size * 0.7), P.dot);
          break;
        case 'juice':
          P.dot.setColor(Skia.Color(p.color));
          P.dot.setAlphaf(Math.min(1, k * 1.4));
          c.drawCircle(p.x, p.y, p.size * (0.6 + k * 0.4), P.dot);
          break;
        case 'spark':
          P.line.setColor(Skia.Color(p.color));
          P.line.setAlphaf(k);
          c.drawLine(p.x, p.y, p.x - p.vx * 0.03, p.y - p.vy * 0.03, P.line);
          break;
        case 'star':
          P.dot.setColor(Skia.Color(p.color));
          P.dot.setAlphaf(k);
          sparkle(c, p.x, p.y, p.size * 1.8, P.dot);
          break;
        case 'ring':
          P.line.setColor(Skia.Color(p.color));
          P.line.setAlphaf(k);
          c.drawCircle(p.x, p.y, p.size, P.line);
          break;
      }
    }
  }

  dispose(): void {
    for (const p of this.recent) p.dispose?.();
    this.recent = [];
  }
}

export { linear, BG_MARGIN };
