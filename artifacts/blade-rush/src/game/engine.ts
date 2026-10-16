/**
 * One-stage simulation: target rotation, thrown knives, collisions, apples,
 * power-up effects and juicy feedback (particles, shatter, shake, hit-stop).
 * Pure TypeScript with no rendering; src/game/render.ts draws its state.
 * Run-level rules (modes, scoring, rewards) live in the game screen controller.
 */
import { DIFFICULTY as D, type KnifeSize } from '../config/difficulty';
import { angDist, checkCollision, DEG, halfWidthDeg, impactLocalAngle, isCloseCall, norm360, widestGapCenter } from './angles';
import { angularVelocity } from './motion';
import { mulberry32, type Rng } from './rng';
import type { ItemKind, Obstacle, PowerUpId, ShieldDef, StageDef } from './types';

export type EnginePhase = 'idle' | 'play' | 'clear' | 'fail';

export interface LiveItem {
  id: number;
  kind: ItemKind;
  angle: number;
  size: KnifeSize;
  drift: number;
  ghostPhase: number | null;
  /** Seconds since this knife stuck (drives the wobble); large when static. */
  wobbleT: number;
}

export interface FlyingKnife {
  y: number;
  size: KnifeSize;
  checkedShield: boolean;
  final: boolean;
}

export interface Debris {
  kind: 'knife' | 'apple-half' | 'wedge' | 'spike';
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  life: number;
  /** For apple halves: which half and apple kind. For wedges: arc start/sweep. */
  side: number;
  appleKind: ItemKind;
  a0: number;
  sweep: number;
  size: KnifeSize;
  isPlayer: boolean;
}

export type ParticleKind = 'chip' | 'juice' | 'spark' | 'star' | 'ring';

export interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
}

export type EngineEvent =
  | { type: 'throw' }
  | { type: 'stick'; closeCall: boolean; x: number; y: number; remaining: number }
  | { type: 'slice'; kind: 'apple' | 'golden' | 'crystal'; x: number; y: number }
  | { type: 'blocked'; by: 'shield' | 'spare'; x: number; y: number }
  | { type: 'fail'; x: number; y: number }
  | { type: 'failDone' }
  | { type: 'clear'; perfect: boolean; isBoss: boolean }
  | { type: 'clearDone' }
  | { type: 'swept'; count: number };

export interface Viewport {
  /** Logical width is always 360; height grows with tall screens. */
  height: number;
  safeTop: number;
  safeBottom: number;
}

const GRAVITY = 1500;
const JUICE_COLORS: Record<string, string> = { apple: '#FF4D4D', golden: '#FFD23F', crystal: '#7FE3FF' };

export class GameEngine {
  def: StageDef | null = null;
  phase: EnginePhase = 'idle';
  viewport: Viewport = { height: 640, safeTop: 0, safeBottom: 0 };

  // Clocks
  clock = 0;
  stageTime = 0;
  patternTime = 0;
  phaseTime = 0;
  introT = 1;

  // Target
  cx = 180;
  cy = 220;
  restY = 560;
  rotation = 0;
  radius = 80;
  dirMul: 1 | -1 = 1;
  shrinkRadius = 80;
  bossHitT = 10;
  targetFlash = 0;

  items: LiveItem[] = [];
  flying: FlyingKnife[] = [];
  debris: Debris[] = [];
  particles: Particle[] = [];
  shields: ShieldDef[] = [];

  queueIndex = 0;
  thrown = 0;
  nextReadyIn = 0;
  knifeSlide = 1;

  // Feel
  shake = 0;
  punch = 0;
  hitStop = 0;
  timeScale = 1;

  // Power-up state
  slowMoLeft = 0;
  freezeLeft = 0;
  aimThrows = 0;
  spares = 0;
  shieldCharges = 0;
  shieldFlash = 0;

  applesTotal = 0;
  applesSliced = 0;
  reduceMotion = false;

  private nextId = 1;
  private rng: Rng = mulberry32(1);
  private events: EngineEvent[] = [];
  private failEmitted = false;
  private clearEmitted = false;

  setViewport(vp: Viewport): void {
    this.viewport = vp;
    const usable = vp.height - vp.safeTop - vp.safeBottom;
    this.cy = vp.safeTop + Math.max(170, usable * 0.36);
    this.restY = vp.safeTop + usable * 0.84;
  }

  loadStage(def: StageDef): void {
    this.def = def;
    this.phase = 'play';
    this.stageTime = 0;
    this.patternTime = 0;
    this.phaseTime = 0;
    this.introT = 0;
    this.rotation = this.rng() * 360;
    this.radius = def.radius;
    this.shrinkRadius = def.radius;
    this.dirMul = 1;
    this.rng = mulberry32(def.seed ^ 0xabcdef);
    this.items = def.items.map((it) => ({
      id: this.nextId++,
      kind: it.kind,
      angle: it.angle,
      size: it.size ?? 'normal',
      drift: it.drift ?? 0,
      ghostPhase: it.ghostPhase ?? null,
      wobbleT: 99,
    }));
    this.shields = def.shields.map((s) => ({ ...s }));
    this.flying = [];
    this.queueIndex = 0;
    this.thrown = 0;
    this.nextReadyIn = 0;
    this.knifeSlide = 0;
    this.slowMoLeft = 0;
    this.freezeLeft = 0;
    this.aimThrows = 0;
    this.spares = 0;
    this.shieldCharges = 0;
    this.applesTotal = def.items.filter((i) => i.kind === 'apple' || i.kind === 'golden' || i.kind === 'crystal').length;
    this.applesSliced = 0;
    this.failEmitted = false;
    this.clearEmitted = false;
    this.bossHitT = 10;
    this.timeScale = 1;
    if (def.isBoss && !this.reduceMotion) this.punch = 0.14;
  }

  /** Restart the current stage from its definition (Time Attack collisions). */
  resetStage(): void {
    if (this.def) {
      const keepDebris = this.debris;
      this.loadStage(this.def);
      this.debris = keepDebris;
      this.introT = 0.6;
    }
  }

  /** Continue after a fail: stuck knives stay, the failed knife is gone, a fresh throw is given. */
  resumeAfterFail(): void {
    if (!this.def) return;
    this.phase = 'play';
    this.phaseTime = 0;
    this.failEmitted = false;
    this.flying = [];
    // Knives in flight were lost with the fail; give them back.
    this.queueIndex = this.thrown;
    this.debris = this.debris.filter((d) => d.kind !== 'knife');
    this.nextReadyIn = 0;
    this.knifeSlide = 0;
    this.shake = 0;
  }

  drainEvents(): EngineEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  get totalKnives(): number {
    return this.def?.knives.length ?? 0;
  }

  get remainingKnives(): number {
    return this.totalKnives - this.thrown;
  }

  get currentKnifeSize(): KnifeSize | null {
    if (!this.def || this.queueIndex >= this.def.knives.length) return null;
    return this.def.knives[this.queueIndex];
  }

  get nextKnifeSize(): KnifeSize | null {
    if (!this.def || this.queueIndex + 1 >= this.def.knives.length) return null;
    return this.def.knives[this.queueIndex + 1];
  }

  get canThrow(): boolean {
    return this.phase === 'play' && this.nextReadyIn <= 0 && this.queueIndex < this.totalKnives && this.introT > 0.35;
  }

  throwKnife(): boolean {
    if (!this.canThrow || !this.def) return false;
    const size = this.def.knives[this.queueIndex];
    this.queueIndex++;
    const final = this.queueIndex >= this.def.knives.length;
    this.flying.push({ y: this.restY, size, checkedShield: false, final });
    this.nextReadyIn = D.nextKnifeDelayMs / 1000;
    this.knifeSlide = 0;
    if (this.aimThrows > 0) this.aimThrows--;
    if (final && this.def.isBoss && !this.reduceMotion) this.timeScale = D.bossFinalKnifeSlowMo;
    this.events.push({ type: 'throw' });
    return true;
  }

  applyPowerUp(id: PowerUpId): void {
    const P = D.powerups;
    switch (id) {
      case 'slowmo':
        this.slowMoLeft = P.slowMoSec;
        break;
      case 'freeze':
        this.freezeLeft = P.freezeSec;
        break;
      case 'aim':
        this.aimThrows = P.aimGuideThrows;
        break;
      case 'extra':
        this.spares += P.extraKnives;
        break;
      case 'shield':
        this.shieldCharges = 1;
        this.shieldFlash = 1;
        break;
      case 'sweep': {
        const knives = this.items
          .filter((i) => i.kind === 'knife')
          .sort((a, b) => angDist(a.angle, impactLocalAngle(this.rotation)) - angDist(b.angle, impactLocalAngle(this.rotation)))
          .slice(0, P.cleanSweepCount);
        for (const k of knives) {
          const p = this.worldPos(k.angle, this.radius + 20);
          const out = (k.angle + this.rotation) * DEG;
          this.debris.push(this.makeDebris('knife', p.x, p.y, Math.cos(out) * 260, Math.sin(out) * 260 - 280, k.angle + this.rotation - 90, k.size));
          this.burst(p.x, p.y, 'spark', '#FFFFFF', 8);
        }
        this.items = this.items.filter((i) => !knives.includes(i));
        this.events.push({ type: 'swept', count: knives.length });
        break;
      }
    }
  }

  /** Current half-width of an obstacle in degrees, or 0 when not solid. */
  private obstacleHalf(it: LiveItem): number {
    if (it.kind === 'knife') return halfWidthDeg(D.knifeWidthPx[it.size], this.radius);
    if (it.kind === 'spike') {
      if (it.ghostPhase !== null && this.ghostAlpha(it) < D.ghostSolidAlpha) return 0;
      return halfWidthDeg(D.spikeWidthPx, this.radius);
    }
    return 0;
  }

  ghostAlpha(it: LiveItem): number {
    if (it.ghostPhase === null) return 1;
    const p = ((this.stageTime + it.ghostPhase) / D.ghostPeriod) * Math.PI * 2;
    return 0.5 + 0.5 * Math.sin(p);
  }

  obstacles(): Obstacle[] {
    const out: Obstacle[] = [];
    for (const it of this.items) {
      const h = this.obstacleHalf(it);
      if (h > 0) out.push({ angle: it.angle, halfWidth: h });
    }
    return out;
  }

  /** Aim guide: local angle and width of the safest gap. */
  aimGap(): { center: number; width: number } {
    return widestGapCenter(this.obstacles());
  }

  worldPos(localAngle: number, r: number): { x: number; y: number } {
    const a = (localAngle + this.rotation) * DEG;
    return { x: this.cx + Math.cos(a) * r, y: this.cy + Math.sin(a) * r };
  }

  shieldAngle(s: ShieldDef): number {
    return norm360(s.angle + s.speed * this.stageTime);
  }

  shieldRadius(): number {
    return this.radius + D.shieldOrbitGap;
  }

  update(rawDt: number): void {
    const dtReal = Math.min(rawDt, 1 / 20);
    this.clock += dtReal;
    this.shake = Math.max(0, this.shake - dtReal * 40);
    this.punch = Math.max(0, this.punch - dtReal * 0.35);
    this.targetFlash = Math.max(0, this.targetFlash - dtReal * 4);
    this.shieldFlash = Math.max(0, this.shieldFlash - dtReal * 2);
    if (this.hitStop > 0) {
      this.hitStop -= dtReal;
      return;
    }
    const dt = dtReal * this.timeScale;
    this.updateParticles(dt);
    this.updateDebris(dt);
    if (!this.def) return;
    this.phaseTime += dt;
    this.introT = Math.min(1, this.introT + dt / 0.45);
    this.bossHitT += dt;

    if (this.phase === 'fail') {
      if (this.phaseTime >= D.failDurationSec && !this.failEmitted) {
        this.failEmitted = true;
        this.events.push({ type: 'failDone' });
      }
      return;
    }
    if (this.phase === 'clear') {
      if (this.phaseTime >= D.shatterDurationSec && !this.clearEmitted) {
        this.clearEmitted = true;
        this.events.push({ type: 'clearDone' });
      }
      return;
    }
    if (this.phase !== 'play') return;

    this.stageTime += dt;
    this.nextReadyIn -= dt;
    this.knifeSlide = Math.min(1, this.knifeSlide + dt / 0.12);

    // Rotation
    let rotFactor = 1;
    if (this.slowMoLeft > 0) {
      this.slowMoLeft -= dt;
      rotFactor = D.powerups.slowMoFactor;
    }
    if (this.freezeLeft > 0) {
      this.freezeLeft -= dt;
      rotFactor = 0;
    } else {
      this.patternTime += dt;
    }
    const def = this.def;
    const omega = angularVelocity(def.pattern, def.speed, def.direction, this.patternTime, def.patternParam) * this.dirMul;
    this.rotation = norm360(this.rotation + omega * rotFactor * dt);

    // Target size changes
    if (def.change === 'pulse') {
      this.radius = def.radius * (1 + D.pulseAmplitude * Math.sin((this.stageTime / D.pulsePeriod) * Math.PI * 2));
    } else if (def.change === 'shrink') {
      this.radius += (this.shrinkRadius - this.radius) * Math.min(1, dt * 8);
    }

    // Drifting spikes and wobble
    for (const it of this.items) {
      if (it.drift) it.angle = norm360(it.angle + it.drift * dt * (this.freezeLeft > 0 ? 0 : 1));
      it.wobbleT += dt;
    }

    // Flying knives
    const targetBottom = () => this.cy + this.radius;
    for (let i = this.flying.length - 1; i >= 0; i--) {
      const k = this.flying[i];
      k.y -= D.throwSpeed * dt;
      if (!k.checkedShield && this.shields.length > 0 && k.y <= this.cy + this.shieldRadius()) {
        k.checkedShield = true;
        const kHalf = halfWidthDeg(D.knifeWidthPx[k.size], this.shieldRadius());
        const blocked = this.shields.some((s) => angDist(90, this.shieldAngle(s) + s.arc / 2) < s.arc / 2 + kHalf);
        if (blocked) {
          this.flying.splice(i, 1);
          this.resolveCollision(k, this.cx, this.cy + this.shieldRadius());
          continue;
        }
      }
      if (k.y <= targetBottom()) {
        this.flying.splice(i, 1);
        this.arrive(k);
        if (this.phase !== 'play') return;
      }
    }
  }

  private arrive(k: FlyingKnife): void {
    const def = this.def;
    if (!def) return;
    const local = impactLocalAngle(this.rotation);
    const half = halfWidthDeg(D.knifeWidthPx[k.size], this.radius);
    const hitX = this.cx;
    const hitY = this.cy + this.radius;
    const result = checkCollision(local, half, this.obstacles());
    if (result.hit) {
      this.resolveCollision(k, hitX, hitY);
      return;
    }
    // Apples
    const appleHalf = halfWidthDeg(D.appleHalfWidthPx * 2, this.radius);
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if ((it.kind === 'apple' || it.kind === 'golden' || it.kind === 'crystal') && angDist(it.angle, local) < appleHalf) {
        this.items.splice(i, 1);
        this.applesSliced++;
        const p = this.worldPos(it.angle, this.radius + 14);
        for (let side = 0; side < 2; side++) {
          const dir = side === 0 ? -1 : 1;
          const d = this.makeDebris('apple-half', p.x, p.y, dir * (120 + this.rng() * 90), -260 - this.rng() * 140, 0, 'normal');
          d.side = side;
          d.appleKind = it.kind;
          d.vr = dir * (300 + this.rng() * 200);
          this.debris.push(d);
        }
        this.burst(p.x, p.y, 'juice', JUICE_COLORS[it.kind] ?? '#FF4D4D', 14);
        if (it.kind !== 'apple') this.burst(p.x, p.y, 'star', it.kind === 'golden' ? '#FFE680' : '#BFF6FF', 8);
        this.events.push({ type: 'slice', kind: it.kind as 'apple' | 'golden' | 'crystal', x: p.x, y: p.y });
      }
    }
    // Stick
    this.items.push({ id: this.nextId++, kind: 'knife', angle: local, size: k.size, drift: 0, ghostPhase: null, wobbleT: 0 });
    this.thrown++;
    this.hitStop = D.hitStopMs / 1000;
    this.bossHitT = 0;
    this.targetFlash = 1;
    if (def.change === 'swap') this.dirMul = this.dirMul === 1 ? -1 : 1;
    if (def.change === 'shrink') this.shrinkRadius = Math.max(D.shrinkMinRadius, this.shrinkRadius - D.shrinkPerKnife);
    this.burst(hitX, hitY, 'chip', '', 9);
    const closeCall = isCloseCall(result, D.closeCallDeg);
    this.events.push({ type: 'stick', closeCall, x: hitX, y: hitY, remaining: this.remainingKnives });
    if (this.thrown >= def.knives.length) this.startClear();
  }

  private resolveCollision(k: FlyingKnife, x: number, y: number): void {
    if (this.shieldCharges > 0) {
      this.shieldCharges--;
      this.shieldFlash = 1;
      this.thrown++;
      this.bounce(k, x, y);
      this.burst(x, y, 'ring', '#7FE3FF', 1);
      this.events.push({ type: 'blocked', by: 'shield', x, y });
      if (this.def && this.thrown >= this.def.knives.length) this.startClear();
      return;
    }
    if (this.spares > 0) {
      this.spares--;
      this.queueIndex = Math.max(0, this.queueIndex - 1);
      this.bounce(k, x, y);
      this.events.push({ type: 'blocked', by: 'spare', x, y });
      return;
    }
    this.bounce(k, x, y);
    this.phase = 'fail';
    this.phaseTime = 0;
    this.timeScale = 1;
    this.flying = [];
    if (!this.reduceMotion) this.shake = D.shakeFail;
    this.events.push({ type: 'fail', x, y });
  }

  private bounce(k: FlyingKnife, x: number, y: number): void {
    const dir = this.rng() < 0.5 ? -1 : 1;
    const d = this.makeDebris('knife', x, y + 30, dir * (90 + this.rng() * 80), 380, 180, k.size);
    d.vr = dir * (520 + this.rng() * 260);
    d.isPlayer = true;
    this.debris.push(d);
    this.burst(x, y, 'spark', '#FFF2B0', 12);
  }

  private startClear(): void {
    const def = this.def;
    if (!def) return;
    this.phase = 'clear';
    this.phaseTime = 0;
    this.timeScale = 1;
    this.flying = [];
    if (!this.reduceMotion) this.shake = def.isBoss ? D.shakeBoss : 5;
    // Target breaks into wedges
    const pieces = 8;
    for (let i = 0; i < pieces; i++) {
      const a0 = (360 / pieces) * i;
      const mid = (a0 + 180 / pieces + this.rotation) * DEG;
      const d = this.makeDebris('wedge', this.cx, this.cy, Math.cos(mid) * (180 + this.rng() * 120), Math.sin(mid) * 160 - 320, 0, 'normal');
      // Wedge `side` is cut from the cached wedge path; `a0` keeps the rotation at break time.
      d.side = i;
      d.a0 = this.rotation;
      d.sweep = 360 / pieces;
      d.vr = (this.rng() - 0.5) * 360;
      this.debris.push(d);
    }
    // Everything stuck flies off
    for (const it of this.items) {
      const p = this.worldPos(it.angle, this.radius + (it.kind === 'knife' ? 22 : 8));
      const out = (it.angle + this.rotation) * DEG;
      if (it.kind === 'knife' || it.kind === 'spike') {
        const d = this.makeDebris(it.kind === 'knife' ? 'knife' : 'spike', p.x, p.y, Math.cos(out) * 300, Math.sin(out) * 300 - 260, it.angle + this.rotation - 90, it.size);
        d.vr = (this.rng() - 0.5) * 900;
        this.debris.push(d);
      }
    }
    this.items = [];
    this.burst(this.cx, this.cy, 'chip', '', 26);
    this.burst(this.cx, this.cy, 'star', '#FFF6C2', def.isBoss ? 24 : 10);
    const perfect = this.applesTotal > 0 && this.applesSliced >= this.applesTotal;
    this.events.push({ type: 'clear', perfect, isBoss: def.isBoss });
  }

  private makeDebris(kind: Debris['kind'], x: number, y: number, vx: number, vy: number, rot: number, size: KnifeSize): Debris {
    return { kind, x, y, vx, vy, rot, vr: 0, life: 1.6, side: 0, appleKind: 'apple', a0: 0, sweep: 0, size, isPlayer: false };
  }

  burst(x: number, y: number, kind: ParticleKind, color: string, count: number): void {
    if (this.reduceMotion) count = Math.ceil(count / 3);
    for (let i = 0; i < count; i++) {
      const a = this.rng() * Math.PI * 2;
      const speed = kind === 'chip' ? 120 + this.rng() * 260 : kind === 'juice' ? 80 + this.rng() * 220 : 60 + this.rng() * 200;
      const life = kind === 'ring' ? 0.45 : 0.45 + this.rng() * 0.45;
      this.particles.push({
        kind,
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed - (kind === 'chip' ? 120 : 40),
        life,
        maxLife: life,
        size: kind === 'chip' ? 2 + this.rng() * 3 : kind === 'juice' ? 2 + this.rng() * 3.5 : kind === 'ring' ? 10 : 1.5 + this.rng() * 2.5,
        color,
        gravity: kind === 'star' || kind === 'spark' || kind === 'ring' ? 120 : 900,
      });
    }
    if (this.particles.length > 260) this.particles.splice(0, this.particles.length - 260);
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'ring') p.size += dt * 120;
    }
  }

  private updateDebris(dt: number): void {
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.life -= dt;
      d.vy += GRAVITY * dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.rot += d.vr * dt;
      if (d.life <= 0 || d.y > this.viewport.height + 120) this.debris.splice(i, 1);
    }
  }
}
