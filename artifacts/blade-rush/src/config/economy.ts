/**
 * Medium-pace economy. Targets: a Common knife after one or two sessions,
 * an Epic after a few days, a Legendary after a couple of weeks.
 */
export const ECONOMY = {
  startingApples: 0,
  startingGems: 0,

  // Earned in play
  applePerSlice: 2,
  goldenAppleReward: 10,
  crystalAppleGems: 1,
  applesPerStage: 1,
  bossWinApples: 25,
  bossWinGems: 3,

  // Fixed Run victory
  fixedRunVictoryApples: 250,
  fixedRunVictoryGems: 10,

  // Rewarded ads always pay apples, never gems, never knives.
  rewardedApples: 50,
  freeApplesCooldownSec: 120,

  // Daily Gift: 7-day cycle; a missed day resets the streak.
  dailyGift: [
    { apples: 10, gems: 0 },
    { apples: 20, gems: 0 },
    { apples: 30, gems: 0 },
    { apples: 40, gems: 0 },
    { apples: 50, gems: 0 },
    { apples: 75, gems: 0 },
    { apples: 150, gems: 5 },
  ],

  // Daily Challenge
  dailyChallengeStages: 10,
  dailyApplesPerStage: 12,
  dailyCompletionGems: 2,
  dailyStreakMilestones: [
    { days: 3, gems: 3 },
    { days: 7, gems: 6 },
    { days: 14, gems: 10 },
    { days: 30, gems: 20 },
  ],

  // Daily missions
  missionChestApples: 100,
  missionChestGems: 3,

  // Achievement tier payouts
  achievementReward: {
    bronze: { apples: 40, gems: 0 },
    silver: { apples: 120, gems: 0 },
    gold: { apples: 0, gems: 6 },
  },

  // Points (power meter)
  points: {
    knifeStuck: 10,
    apple: 25,
    goldenApple: 50,
    crystalApple: 50,
    closeCall: 15,
    perfectStage: 40,
  },
  powerMeterBase: 160,
  powerMeterPerStage: 8,
} as const;

/** Points needed to earn one power-up charge at a given in-run stage. */
export function powerMeterThreshold(stage: number): number {
  return ECONOMY.powerMeterBase + ECONOMY.powerMeterPerStage * Math.max(0, stage - 1);
}
