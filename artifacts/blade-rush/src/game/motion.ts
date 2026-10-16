/** Target rotation speed patterns. Returns signed angular velocity in deg/s. */
import { DIFFICULTY } from '../config/difficulty';
import type { SpeedPatternKind } from './types';

function smoothstep(x: number): number {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

export function angularVelocity(
  pattern: SpeedPatternKind,
  base: number,
  direction: 1 | -1,
  t: number,
  param: number,
): number {
  const D = DIFFICULTY;
  switch (pattern) {
    case 'constant':
      return base * direction;
    case 'reverse': {
      const period = Math.max(0.8, param);
      const cycle = Math.floor(t / period);
      const local = t - cycle * period;
      const sign = cycle % 2 === 0 ? direction : -direction;
      // Ease out of each reversal over 0.3 s so it reads as a deliberate turn.
      const ease = smoothstep(local / 0.3);
      return base * 1.1 * sign * (0.15 + 0.85 * ease);
    }
    case 'sine': {
      const w = (2 * Math.PI) / D.sinePulsePeriod;
      return base * direction * (1 + D.sinePulseAmplitude * Math.sin(w * t));
    }
    case 'stopGo': {
      const run = D.stopGoRunSec;
      const stop = D.stopGoStopSec;
      const period = run + stop;
      const local = t % period;
      if (local < run) {
        const ramp = Math.min(smoothstep(local / 0.25), smoothstep((run - local) / 0.2));
        return base * 1.35 * direction * ramp;
      }
      return 0;
    }
    case 'accelerate': {
      const cycle = D.accelerateCycleSec;
      const local = (t % cycle) / cycle;
      const f = 0.55 + (D.accelerateFactor - 0.55) * smoothstep(local);
      return base * direction * f;
    }
    default:
      return base * direction;
  }
}
