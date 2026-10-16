import { describe, expect, it } from 'vitest';
import { DIFFICULTY } from '../../config/difficulty';
import {
  angDist,
  checkCollision,
  freeCapacity,
  halfWidthDeg,
  impactLocalAngle,
  isCloseCall,
  norm360,
  widestGapCenter,
} from '../angles';
import { angularVelocity } from '../motion';

describe('angle helpers', () => {
  it('normalises into [0, 360)', () => {
    expect(norm360(0)).toBe(0);
    expect(norm360(360)).toBe(0);
    expect(norm360(-30)).toBe(330);
    expect(norm360(725)).toBe(5);
  });

  it('measures the shortest distance across the 0/360 seam', () => {
    expect(angDist(10, 350)).toBe(20);
    expect(angDist(350, 10)).toBe(20);
    expect(angDist(0, 180)).toBe(180);
    expect(angDist(-90, 270)).toBe(0);
  });

  it('gives a normal knife about 9 degrees at the target radius', () => {
    const full = 2 * halfWidthDeg(DIFFICULTY.knifeWidthPx.normal, DIFFICULTY.targetRadius);
    expect(full).toBeGreaterThan(8.5);
    expect(full).toBeLessThan(9.5);
  });

  it('maps the bottom of the target into the local frame', () => {
    expect(impactLocalAngle(0)).toBe(90);
    expect(impactLocalAngle(90)).toBe(0);
    expect(impactLocalAngle(180)).toBe(270);
    expect(impactLocalAngle(-45)).toBe(135);
  });
});

describe('collision', () => {
  const half = 4.5;
  const stuck = [{ angle: 100, halfWidth: half }];

  it('fails when the gap is smaller than the knife width', () => {
    expect(checkCollision(100, half, stuck).hit).toBe(true);
    expect(checkCollision(108.9, half, stuck).hit).toBe(true);
    expect(checkCollision(91.1, half, stuck).hit).toBe(true);
  });

  it('sticks when the gap is at least the knife width', () => {
    expect(checkCollision(109, half, stuck).hit).toBe(false);
    expect(checkCollision(120, half, stuck).hit).toBe(false);
    expect(checkCollision(280, half, stuck).hit).toBe(false);
  });

  it('detects collisions across the 0/360 seam', () => {
    const seam = [{ angle: 2, halfWidth: half }];
    expect(checkCollision(358, half, seam).hit).toBe(true);
    expect(checkCollision(352, half, seam).hit).toBe(false);
  });

  it('reports the obstacle index that was hit', () => {
    const list = [
      { angle: 10, halfWidth: half },
      { angle: 200, halfWidth: half },
    ];
    expect(checkCollision(203, half, list).index).toBe(1);
    expect(checkCollision(100, half, list).index).toBe(-1);
  });

  it('never collides on an empty target', () => {
    const r = checkCollision(45, half, []);
    expect(r.hit).toBe(false);
    expect(r.clearance).toBe(Infinity);
  });

  it('flags close calls within the threshold without touching', () => {
    const r = checkCollision(110.5, half, stuck);
    expect(r.hit).toBe(false);
    expect(isCloseCall(r, 2)).toBe(true);
    expect(isCloseCall(checkCollision(130, half, stuck), 2)).toBe(false);
    expect(isCloseCall(checkCollision(100, half, stuck), 2)).toBe(false);
  });

  it('uses mixed widths (wide knives need bigger gaps)', () => {
    const wideHalf = halfWidthDeg(DIFFICULTY.knifeWidthPx.wide, 80);
    const smallHalf = halfWidthDeg(DIFFICULTY.knifeWidthPx.small, 80);
    const at = 100 + half + (wideHalf + smallHalf) / 2;
    expect(checkCollision(at, wideHalf, stuck).hit).toBe(true);
    expect(checkCollision(at, smallHalf, stuck).hit).toBe(false);
  });
});

describe('free capacity', () => {
  it('fits 40 knives of 9 degrees on an empty target', () => {
    expect(freeCapacity([], 9)).toBe(40);
  });

  it('subtracts the space taken by obstacles', () => {
    expect(freeCapacity([{ angle: 0, halfWidth: 4.5 }], 9)).toBe(39);
    expect(freeCapacity([{ angle: 0, halfWidth: 4.5 }, { angle: 180, halfWidth: 4.5 }], 9)).toBe(38);
  });

  it('counts zero in gaps narrower than a knife', () => {
    // Two obstacles 12° apart leave a 3° gap on one side.
    const cap = freeCapacity([{ angle: 0, halfWidth: 4.5 }, { angle: 12, halfWidth: 4.5 }], 9);
    expect(cap).toBe(Math.floor((360 - 12 - 9) / 9));
  });

  it('finds the widest gap centre for the aim guide', () => {
    const g = widestGapCenter([{ angle: 0, halfWidth: 5 }, { angle: 90, halfWidth: 5 }]);
    expect(g.width).toBeCloseTo(260);
    expect(g.center).toBeCloseTo(225);
  });
});

describe('speed patterns', () => {
  it('keeps constant speed and direction', () => {
    expect(angularVelocity('constant', 120, 1, 3, 2)).toBe(120);
    expect(angularVelocity('constant', 120, -1, 3, 2)).toBe(-120);
  });

  it('reverses direction each period', () => {
    const a = angularVelocity('reverse', 100, 1, 1.5, 2);
    const b = angularVelocity('reverse', 100, 1, 3.5, 2);
    expect(Math.sign(a)).toBe(1);
    expect(Math.sign(b)).toBe(-1);
  });

  it('stops during stop-and-go pauses', () => {
    const run = DIFFICULTY.stopGoRunSec;
    expect(angularVelocity('stopGo', 100, 1, run + 0.1, 0)).toBe(0);
    expect(Math.abs(angularVelocity('stopGo', 100, 1, run / 2, 0))).toBeGreaterThan(0);
  });
});
