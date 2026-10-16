import { describe, expect, it } from 'vitest';
import { GameEngine } from '../engine';
import { generateStage } from '../stageGen';

function engineFor(stage: number): GameEngine {
  const e = new GameEngine();
  e.setViewport({ height: 640, safeTop: 90, safeBottom: 20 });
  e.loadStage(generateStage({ mode: 'endless', stage, runSeed: 12345 }));
  return e;
}

/** Throws as fast as allowed, never waiting for a gap, until the stage ends. */
function spam(e: GameEngine, maxSteps = 4000): void {
  for (let i = 0; i < maxSteps && e.phase === 'play'; i++) {
    e.throwKnife();
    e.update(1 / 60);
  }
}

describe('engine', () => {
  it('ends a stage in either clear or fail', () => {
    for (const stage of [1, 4, 7, 12]) {
      const e = engineFor(stage);
      spam(e);
      expect(['clear', 'fail']).toContain(e.phase);
    }
  });

  it('gives back the failed knife on Continue so the stage stays clearable', () => {
    let checked = 0;
    for (let stage = 2; stage <= 40 && checked < 5; stage++) {
      const e = engineFor(stage);
      spam(e);
      if (e.phase !== 'fail') continue;
      checked++;
      const remainingBefore = e.remainingKnives;
      e.resumeAfterFail();
      expect(e.phase).toBe('play');
      expect(e.queueIndex).toBe(e.thrown);
      expect(e.remainingKnives).toBe(remainingBefore);
      expect(e.remainingKnives).toBeGreaterThan(0);
      for (let i = 0; i < 30 && !e.canThrow; i++) e.update(1 / 60);
      expect(e.canThrow).toBe(true);
    }
    expect(checked).toBeGreaterThan(0);
  });
});
