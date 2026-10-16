/**
 * Every gameplay number lives here so difficulty can be tuned without touching
 * engine code. Units: pixels are logical (360×640 canvas), angles in degrees,
 * times in seconds unless the name says Ms.
 */
export const DIFFICULTY = {
  logicalWidth: 360,
  logicalHeight: 640,

  // Target
  targetRadius: 80,
  bossRadius: 95,
  targetCenterY: 220,
  /** How deep a stuck knife sits inside the target (px). */
  knifePenetration: 16,

  // Throwing
  throwSpeed: 1800,
  nextKnifeDelayMs: 120,
  knifeRestY: 560,

  /**
   * Knife widths in px measured at the target rim. A normal knife at r=80 is
   * ≈ 9°, which is the classic tuning constant from the design brief.
   */
  knifeWidthPx: { small: 9.8, normal: 12.6, wide: 16.8 } as const,
  spikeWidthPx: 13,
  /** Apples are hit when the knife centre is within this half-width (px). */
  appleHalfWidthPx: 11,
  /** A stick within this many degrees of a neighbour (without touching) is a close call. */
  closeCallDeg: 2,

  // Knife count: 6 + floor(stage / 3), capped
  knivesBase: 6,
  knivesPerStageDivisor: 3,
  knivesMax: 16,
  bossExtraKnives: 2,

  // Pre-stuck knives: from stage 2, grows quickly to the cap
  preStuckStartStage: 2,
  preStuckPerStage: 0.6,
  preStuckMax: 8,

  // Rotation speed
  rotationBase: 120,
  rotationPerStage: 4,
  rotationCap: 330,
  bossRotationBonus: 25,

  // Obstacles: stage at which each modifier is introduced
  unlock: {
    speedPatterns: 2,
    goldenApple: 3,
    spikes: 4,
    mixedKnives: 6,
    crystalApple: 8,
    changingTarget: 10,
    shields: 12,
    driftingSpikes: 15,
    ghostSpikes: 20,
  },
  /** Maximum number of modifiers combined on one stage. */
  maxModifiers: 3,
  spikesMax: 4,
  applesMin: 1,
  applesMax: 3,
  goldenAppleChance: 0.35,
  crystalAppleChance: 0.18,

  // Speed patterns
  reverseEverySec: [2.2, 3.6] as const,
  sinePulseAmplitude: 0.65,
  sinePulsePeriod: 2.6,
  stopGoRunSec: 1.6,
  stopGoStopSec: 0.55,
  accelerateFactor: 1.9,
  accelerateCycleSec: 4,

  // Changing target
  pulseAmplitude: 0.08,
  pulsePeriod: 1.8,
  shrinkPerKnife: 1.6,
  shrinkMinRadius: 60,

  // Orbiting shields
  shieldOrbitGap: 34,
  shieldArcDeg: 46,
  shieldOrbitSpeed: 75,

  // Drifting and ghost spikes
  driftSpeed: 18,
  ghostPeriod: 2.4,
  /** Ghost spikes are only solid while their opacity is above this. */
  ghostSolidAlpha: 0.45,

  // Bosses
  bossEvery: 5,
  bossCount: 20,
  bossExclusiveCount: 10,
  /** Each full cycle through the 20 bosses in Endless adds this much rotation. */
  bossCycleRotationBonus: 30,

  // Worlds
  stagesPerWorld: 5,
  worldCount: 12,

  // Game feel
  hitStopMs: 40,
  wobbleAmplitudeDeg: 7,
  wobbleDamping: 9,
  wobbleFrequency: 34,
  shakeFail: 12,
  shakeBoss: 16,
  shatterDurationSec: 0.95,
  failDurationSec: 0.9,
  bossFinalKnifeSlowMo: 0.3,

  // Power-ups
  powerups: {
    slowMoFactor: 0.4,
    slowMoSec: 5,
    freezeSec: 3,
    aimGuideThrows: 3,
    extraKnives: 2,
    cleanSweepCount: 3,
    /** In-run stage at which each power-up unlocks, in POWERUP_ORDER order. */
    unlockStages: [3, 8, 13, 18, 23, 28],
    usesPerStage: 1,
    usesPerBossStage: 2,
    /** Charges carried over between stages are capped here. */
    maxCharges: 3,
  },

  // Time Attack
  timeAttack: {
    startSec: 60,
    stageBonusSec: 8,
    bossBonusSec: 15,
    collisionPenaltySec: 5,
    adBonusSec: 15,
  },

  // Fixed Run
  fixedRunStages: 30,
  fixedRunBossCount: 6,

  // Solvability: the free space must hold this many extra knives beyond the
  // ones to throw, so a stage is never a pixel-perfect puzzle.
  solvableSlack: 2,
} as const;

export type KnifeSize = keyof typeof DIFFICULTY.knifeWidthPx;
