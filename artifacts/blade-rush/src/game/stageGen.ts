/**
 * Seeded stage generation. Every stage is validated for solvability: the free
 * angular space must hold all knives to throw (plus slack) using the widest
 * knife in the queue at the smallest radius the target can reach.
 */
import { DIFFICULTY, type KnifeSize } from '../config/difficulty';
import { ECONOMY } from '../config/economy';
import { BOSSES } from '../data/bosses';
import { angDist, freeCapacity, halfWidthDeg } from './angles';
import { hashInts, mulberry32, pick, randInt, randRange, shuffle, type Rng } from './rng';
import type { ModeId, ModifierId, Obstacle, ShieldDef, SpeedPatternKind, StageDef, StageItem, TargetChange } from './types';

const D = DIFFICULTY;

export interface StageContext {
  mode: ModeId;
  /** 1-based stage within the run. */
  stage: number;
  runSeed: number;
}

export function isBossStage(stage: number): boolean {
  return stage > 0 && stage % D.bossEvery === 0;
}

export function bossIndexFor(mode: ModeId, stage: number, runSeed: number): number | null {
  if (!isBossStage(stage)) return null;
  const n = stage / D.bossEvery - 1;
  switch (mode) {
    case 'fixed':
      return n % D.fixedRunBossCount;
    case 'daily':
      return hashInts(runSeed, n, 0xb055) % D.bossCount;
    default:
      return n % D.bossCount;
  }
}

/** How many times Endless has looped through all 20 bosses before this stage. */
export function bossCycleFor(stage: number): number {
  if (!isBossStage(stage)) return Math.floor((stage - 1) / (D.bossEvery * D.bossCount));
  return Math.floor((stage / D.bossEvery - 1) / D.bossCount);
}

export function worldFor(mode: ModeId, stage: number, runSeed: number): { index: number; cycle: number } {
  const raw = Math.floor((stage - 1) / D.stagesPerWorld);
  const offset = mode === 'daily' ? runSeed % D.worldCount : 0;
  return { index: (raw + offset) % D.worldCount, cycle: Math.floor(raw / D.worldCount) };
}

export function knivesForStage(stage: number, bossExtra: number): number {
  const base = Math.min(D.knivesMax, D.knivesBase + Math.floor(stage / D.knivesPerStageDivisor));
  return Math.min(D.knivesMax + D.bossExtraKnives, base + bossExtra);
}

export function preStuckForStage(stage: number): number {
  if (stage < D.preStuckStartStage) return 0;
  return Math.min(D.preStuckMax, Math.floor(1 + (stage - D.preStuckStartStage) * D.preStuckPerStage));
}

export function rotationForStage(stage: number, isBoss: boolean, cycle: number): number {
  const base = Math.min(D.rotationCap, D.rotationBase + D.rotationPerStage * (stage - 1));
  if (!isBoss) return base;
  return Math.min(D.rotationCap + 40, base + D.bossRotationBonus + cycle * D.bossCycleRotationBonus);
}

const MODIFIER_UNLOCK: Record<ModifierId, number> = {
  pattern: D.unlock.speedPatterns,
  spikes: D.unlock.spikes,
  mixed: D.unlock.mixedKnives,
  change: D.unlock.changingTarget,
  shields: D.unlock.shields,
  drift: D.unlock.driftingSpikes,
  ghost: D.unlock.ghostSpikes,
};

export function modifierCount(stage: number): number {
  if (stage < 2) return 0;
  return Math.min(D.maxModifiers, 1 + Math.floor((stage - 2) / 7));
}

function chooseModifiers(rng: Rng, stage: number): ModifierId[] {
  const unlocked = (Object.keys(MODIFIER_UNLOCK) as ModifierId[]).filter((m) => stage >= MODIFIER_UNLOCK[m]);
  const count = Math.min(modifierCount(stage), unlocked.length);
  if (count === 0) return [];
  const chosen: ModifierId[] = [];
  // A freshly unlocked modifier is always featured on its introduction stage.
  const fresh = unlocked.find((m) => MODIFIER_UNLOCK[m] === stage);
  if (fresh) chosen.push(fresh);
  for (const m of shuffle(rng, unlocked)) {
    if (chosen.length >= count) break;
    if (!chosen.includes(m)) chosen.push(m);
  }
  return chosen;
}

/** Smallest radius the target reaches during the stage (shrink / pulse). */
export function minRadiusFor(radius: number, change: TargetChange, knives: number): number {
  if (change === 'shrink') return Math.max(D.shrinkMinRadius, radius - D.shrinkPerKnife * knives);
  if (change === 'pulse') return radius * (1 - D.pulseAmplitude);
  return radius;
}

export function itemHalfWidth(item: StageItem, radius: number): number {
  if (item.kind === 'knife') return halfWidthDeg(D.knifeWidthPx[item.size ?? 'normal'], radius);
  if (item.kind === 'spike') return halfWidthDeg(D.spikeWidthPx, radius);
  return 0;
}

/** Items that make a throw fail (stuck knives and spikes). Apples are not obstacles. */
export function obstaclesOf(items: readonly StageItem[], radius: number): Obstacle[] {
  return items
    .filter((it) => it.kind === 'knife' || it.kind === 'spike')
    .map((it) => ({ angle: it.angle, halfWidth: itemHalfWidth(it, radius) }));
}

export interface SolvabilityReport {
  solvable: boolean;
  capacity: number;
  needed: number;
}

export function checkSolvable(def: Pick<StageDef, 'items' | 'knives' | 'radius' | 'change'>): SolvabilityReport {
  const minR = minRadiusFor(def.radius, def.change, def.knives.length);
  const widest = def.knives.reduce<number>((w, s) => Math.max(w, D.knifeWidthPx[s]), D.knifeWidthPx.normal);
  const knifeWidthDeg = 2 * halfWidthDeg(widest, minR);
  const staticItems = def.items.filter((it) => !(it.kind === 'spike' && it.drift));
  let capacity = freeCapacity(obstaclesOf(staticItems, minR), knifeWidthDeg);
  // A drifting spike can slide into any gap: reserve its width plus one knife.
  const spikeDeg = 2 * halfWidthDeg(D.spikeWidthPx, minR);
  for (const it of def.items) {
    if (it.kind === 'spike' && it.drift) capacity -= Math.ceil((spikeDeg + knifeWidthDeg) / knifeWidthDeg);
  }
  const needed = def.knives.length + D.solvableSlack;
  return { solvable: capacity >= needed, capacity, needed };
}

function placeAngle(rng: Rng, items: readonly StageItem[], radius: number, ownHalf: number, padding: number): number | null {
  for (let attempt = 0; attempt < 60; attempt++) {
    const a = rng() * 360;
    let ok = true;
    for (const it of items) {
      const half = it.kind === 'knife' || it.kind === 'spike' ? itemHalfWidth(it, radius) : halfWidthDeg(D.appleHalfWidthPx * 2, radius);
      if (angDist(a, it.angle) < ownHalf + half + padding) {
        ok = false;
        break;
      }
    }
    if (ok) return a;
  }
  return null;
}

export function generateStage(ctx: StageContext): StageDef {
  const { mode, stage, runSeed } = ctx;
  const seed = hashInts(runSeed, stage, 0x5eed);
  const rng = mulberry32(seed);
  const bossIndex = bossIndexFor(mode, stage, runSeed);
  const isBoss = bossIndex !== null;
  const boss = isBoss ? BOSSES[bossIndex] : null;
  const cycle = isBoss ? bossCycleFor(stage) : 0;
  const world = worldFor(mode, stage, runSeed);
  const radius = isBoss ? D.bossRadius : D.targetRadius;

  const modifiers = chooseModifiers(rng, stage);
  const has = (m: ModifierId) => modifiers.includes(m);

  // Speed pattern
  let pattern: SpeedPatternKind = 'constant';
  if (boss) pattern = boss.pattern;
  else if (has('pattern')) pattern = pick(rng, ['reverse', 'sine', 'stopGo', 'accelerate'] as const);
  const patternParam = randRange(rng, D.reverseEverySec[0], D.reverseEverySec[1]);
  const direction: 1 | -1 = rng() < 0.5 ? 1 : -1;
  const speed = rotationForStage(stage, isBoss, cycle);

  // Changing target
  const change: TargetChange = has('change') ? pick(rng, ['pulse', 'swap', 'shrink'] as const) : 'none';

  // Knife queue
  const knifeCount = knivesForStage(stage, boss ? boss.extraKnives : 0);
  const knives: KnifeSize[] = [];
  for (let i = 0; i < knifeCount; i++) {
    if (has('mixed')) {
      const r = rng();
      knives.push(r < 0.3 ? 'small' : r < 0.72 ? 'normal' : 'wide');
    } else {
      knives.push('normal');
    }
  }

  // Obstacles
  const items: StageItem[] = [];
  const preStuck = preStuckForStage(stage);
  for (let i = 0; i < preStuck; i++) {
    const a = placeAngle(rng, items, radius, halfWidthDeg(D.knifeWidthPx.normal, radius), 3);
    if (a !== null) items.push({ kind: 'knife', angle: a, size: 'normal' });
  }

  let spikes = 0;
  if (has('spikes')) spikes = Math.min(D.spikesMax, 1 + Math.floor((stage - D.unlock.spikes) / 6));
  if (boss) spikes = Math.max(spikes, Math.min(D.spikesMax + 2, boss.spikes + cycle));
  if ((has('drift') || has('ghost')) && spikes < 2) spikes = 2;
  const spikeHalf = halfWidthDeg(D.spikeWidthPx, radius);
  for (let i = 0; i < spikes; i++) {
    const a = placeAngle(rng, items, radius, spikeHalf, 4);
    if (a === null) continue;
    const spike: StageItem = { kind: 'spike', angle: a };
    if (has('drift') && i % 2 === 0) spike.drift = (rng() < 0.5 ? -1 : 1) * D.driftSpeed * randRange(rng, 0.8, 1.3);
    if (has('ghost') && i % 2 === 1) spike.ghostPhase = rng() * D.ghostPeriod;
    items.push(spike);
  }

  // Shields
  const shields: ShieldDef[] = [];
  if (has('shields')) {
    const n = stage >= 25 ? 2 : 1;
    const start = rng() * 360;
    for (let i = 0; i < n; i++) {
      shields.push({ angle: start + (360 / n) * i, arc: D.shieldArcDeg, speed: -direction * D.shieldOrbitSpeed * randRange(rng, 0.85, 1.2) });
    }
  }

  // Ensure solvability: drop pre-stuck knives first, then spikes, until it fits.
  const draft = { items, knives, radius, change };
  while (!checkSolvable(draft).solvable && items.length > 0) {
    const knifeIdx = items.findIndex((it) => it.kind === 'knife');
    if (knifeIdx >= 0) items.splice(knifeIdx, 1);
    else items.splice(items.length - 1, 1);
  }

  // Apples go in free space (they are not obstacles).
  const appleCount = stage === 1 ? 1 : randInt(rng, D.applesMin, D.applesMax);
  const appleHalf = halfWidthDeg(D.appleHalfWidthPx * 2, radius);
  for (let i = 0; i < appleCount; i++) {
    const a = placeAngle(rng, items, radius, appleHalf, 3);
    if (a === null) continue;
    let kind: StageItem['kind'] = 'apple';
    const roll = rng();
    if (stage >= D.unlock.crystalApple && roll < D.crystalAppleChance) kind = 'crystal';
    else if (stage >= D.unlock.goldenApple && roll < D.crystalAppleChance + D.goldenAppleChance) kind = 'golden';
    items.push({ kind, angle: a });
  }

  return {
    stage,
    seed,
    isBoss,
    bossIndex,
    worldIndex: world.index,
    worldCycle: world.cycle,
    radius,
    knives,
    items,
    speed,
    direction,
    pattern,
    patternParam,
    change,
    shields,
    modifiers,
  };
}

/** Apples awarded for slicing an item. */
export function appleRewardOf(kind: StageItem['kind']): { apples: number; gems: number } {
  if (kind === 'golden') return { apples: ECONOMY.goldenAppleReward, gems: 0 };
  if (kind === 'crystal') return { apples: 0, gems: ECONOMY.crystalAppleGems };
  if (kind === 'apple') return { apples: ECONOMY.applePerSlice, gems: 0 };
  return { apples: 0, gems: 0 };
}
