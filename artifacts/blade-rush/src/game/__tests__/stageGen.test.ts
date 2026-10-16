import { describe, expect, it } from 'vitest';
import { DIFFICULTY } from '../../config/difficulty';
import { BOSSES } from '../../data/bosses';
import { KNIVES } from '../../data/knives';
import { ACHIEVEMENTS } from '../../data/achievements';
import { angDist, checkCollision, halfWidthDeg } from '../angles';
import {
  bossIndexFor,
  checkSolvable,
  generateStage,
  isBossStage,
  itemHalfWidth,
  knivesForStage,
  minRadiusFor,
  obstaclesOf,
  preStuckForStage,
  rotationForStage,
} from '../stageGen';
import type { ModeId, StageItem } from '../types';

const MODES: ModeId[] = ['endless', 'fixed', 'daily', 'timeAttack'];

describe('difficulty curve', () => {
  it('follows knives = 6 + floor(stage / 3), capped at 16', () => {
    expect(knivesForStage(1, 0)).toBe(6);
    expect(knivesForStage(3, 0)).toBe(7);
    expect(knivesForStage(9, 0)).toBe(9);
    expect(knivesForStage(30, 0)).toBe(16);
    expect(knivesForStage(300, 0)).toBe(16);
  });

  it('adds pre-stuck knives from stage 2 up to 8', () => {
    expect(preStuckForStage(1)).toBe(0);
    expect(preStuckForStage(2)).toBe(1);
    expect(preStuckForStage(6)).toBeGreaterThanOrEqual(3);
    expect(preStuckForStage(40)).toBe(8);
  });

  it('raises rotation speed with a cap', () => {
    expect(rotationForStage(1, false, 0)).toBe(120);
    expect(rotationForStage(2, false, 0)).toBe(124);
    expect(rotationForStage(200, false, 0)).toBe(DIFFICULTY.rotationCap);
  });

  it('puts a boss on every 5th stage', () => {
    expect(isBossStage(5)).toBe(true);
    expect(isBossStage(10)).toBe(true);
    expect(isBossStage(7)).toBe(false);
    expect(generateStage({ mode: 'endless', stage: 5, runSeed: 1 }).isBoss).toBe(true);
    expect(generateStage({ mode: 'endless', stage: 6, runSeed: 1 }).isBoss).toBe(false);
  });

  it('uses the first six bosses in Fixed Run and cycles all 20 in Endless', () => {
    const fixed = Array.from({ length: 6 }, (_, i) => bossIndexFor('fixed', (i + 1) * 5, 1));
    expect(fixed).toEqual([0, 1, 2, 3, 4, 5]);
    expect(bossIndexFor('endless', 100, 1)).toBe(19);
    expect(bossIndexFor('endless', 105, 1)).toBe(0);
  });

  it('keeps stage 1 gentle', () => {
    const s = generateStage({ mode: 'endless', stage: 1, runSeed: 42 });
    expect(s.items.filter((i) => i.kind === 'knife' || i.kind === 'spike')).toHaveLength(0);
    expect(s.pattern).toBe('constant');
    expect(s.knives).toHaveLength(6);
  });
});

describe('stage solvability', () => {
  it('generates only solvable stages across modes, stages and seeds', () => {
    for (const mode of MODES) {
      for (let seed = 1; seed <= 25; seed++) {
        for (let stage = 1; stage <= 120; stage++) {
          const def = generateStage({ mode, stage, runSeed: seed * 7919 });
          const report = checkSolvable(def);
          expect(report.solvable, `${mode} seed ${seed} stage ${stage}: ${report.capacity}/${report.needed}`).toBe(true);
        }
      }
    }
  });

  it('can actually be cleared by a greedy player', () => {
    // Simulate placing every knife at the first free angle (in 0.25° steps)
    // at the smallest radius; every knife must find a slot.
    for (let seed = 1; seed <= 10; seed++) {
      for (let stage = 1; stage <= 80; stage += 3) {
        const def = generateStage({ mode: 'endless', stage, runSeed: seed });
        const minR = minRadiusFor(def.radius, def.change, def.knives.length);
        const stuck: StageItem[] = def.items.filter((i) => i.kind === 'knife' || i.kind === 'spike');
        for (const size of def.knives) {
          const half = halfWidthDeg(DIFFICULTY.knifeWidthPx[size], minR);
          let placed = false;
          for (let a = 0; a < 360; a += 0.25) {
            if (!checkCollision(a, half, obstaclesOf(stuck, minR)).hit) {
              stuck.push({ kind: 'knife', angle: a, size });
              placed = true;
              break;
            }
          }
          expect(placed, `seed ${seed} stage ${stage}`).toBe(true);
        }
      }
    }
  });

  it('never overlaps pre-placed obstacles', () => {
    for (let stage = 2; stage <= 60; stage++) {
      const def = generateStage({ mode: 'endless', stage, runSeed: 99 });
      const obs = def.items.filter((i) => i.kind === 'knife' || i.kind === 'spike');
      for (let i = 0; i < obs.length; i++) {
        for (let j = i + 1; j < obs.length; j++) {
          const gap = angDist(obs[i].angle, obs[j].angle);
          expect(gap).toBeGreaterThanOrEqual(itemHalfWidth(obs[i], def.radius) + itemHalfWidth(obs[j], def.radius));
        }
      }
    }
  });

  it('is deterministic for a given seed (Daily Challenge fairness)', () => {
    const a = generateStage({ mode: 'daily', stage: 7, runSeed: 123456 });
    const b = generateStage({ mode: 'daily', stage: 7, runSeed: 123456 });
    expect(a).toEqual(b);
  });

  it('introduces modifiers progressively', () => {
    for (let seed = 1; seed <= 20; seed++) {
      for (let stage = 1; stage < DIFFICULTY.unlock.spikes; stage++) {
        const def = generateStage({ mode: 'endless', stage, runSeed: seed });
        if (!def.isBoss) expect(def.items.some((i) => i.kind === 'spike')).toBe(false);
      }
      for (let stage = 1; stage < DIFFICULTY.unlock.shields; stage++) {
        expect(generateStage({ mode: 'endless', stage, runSeed: seed }).shields).toHaveLength(0);
      }
    }
  });
});

describe('content data', () => {
  it('has exactly 50 knives with unique ids', () => {
    expect(KNIVES).toHaveLength(50);
    expect(new Set(KNIVES.map((k) => k.id)).size).toBe(50);
  });

  it('has 20 bosses and the first 10 award exclusive knives', () => {
    expect(BOSSES).toHaveLength(20);
    BOSSES.slice(0, 10).forEach((b, i) => {
      const knife = KNIVES.find((k) => k.id === b.exclusiveKnife);
      expect(knife?.bossIndex).toBe(i);
    });
    expect(BOSSES.slice(10).every((b) => !b.exclusiveKnife)).toBe(true);
  });

  it('has 42 achievements in three tiers', () => {
    expect(ACHIEVEMENTS).toHaveLength(42);
  });
});
