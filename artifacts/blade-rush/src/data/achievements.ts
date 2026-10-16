/**
 * 14 families × 3 tiers (Bronze, Silver, Gold) = 42 achievements.
 * Bronze and Silver pay apples, Gold pays gems (amounts in config/economy.ts).
 * Titles live in src/strings.ts under `achievements`.
 */
export type AchievementMetric =
  | 'applesSliced'
  | 'endlessBest'
  | 'fixedBest'
  | 'bossesDefeated'
  | 'knivesOwned'
  | 'timeAttackBest'
  | 'dailyStreakBest'
  | 'closeCalls'
  | 'goldenSliced'
  | 'crystalSliced'
  | 'knivesStuck'
  | 'powerupsUsed'
  | 'dailyCompleted'
  | 'giftsClaimed';

export type Tier = 'bronze' | 'silver' | 'gold';

export interface AchievementFamily {
  metric: AchievementMetric;
  thresholds: readonly [number, number, number];
}

export const ACHIEVEMENT_FAMILIES: readonly AchievementFamily[] = [
  { metric: 'applesSliced', thresholds: [50, 500, 2500] },
  { metric: 'endlessBest', thresholds: [10, 25, 50] },
  { metric: 'fixedBest', thresholds: [10, 20, 30] },
  { metric: 'bossesDefeated', thresholds: [3, 15, 50] },
  { metric: 'knivesOwned', thresholds: [5, 15, 35] },
  { metric: 'timeAttackBest', thresholds: [5, 12, 20] },
  { metric: 'dailyStreakBest', thresholds: [3, 7, 30] },
  { metric: 'closeCalls', thresholds: [10, 100, 500] },
  { metric: 'goldenSliced', thresholds: [5, 50, 200] },
  { metric: 'crystalSliced', thresholds: [3, 25, 100] },
  { metric: 'knivesStuck', thresholds: [200, 2000, 10000] },
  { metric: 'powerupsUsed', thresholds: [5, 50, 200] },
  { metric: 'dailyCompleted', thresholds: [1, 5, 20] },
  { metric: 'giftsClaimed', thresholds: [7, 30, 100] },
];

export const TIERS: readonly Tier[] = ['bronze', 'silver', 'gold'];

export interface AchievementDef {
  id: string;
  metric: AchievementMetric;
  tier: Tier;
  target: number;
}

export const ACHIEVEMENTS: readonly AchievementDef[] = ACHIEVEMENT_FAMILIES.flatMap((f) =>
  TIERS.map((tier, i) => ({ id: `${f.metric}_${tier}`, metric: f.metric, tier, target: f.thresholds[i] })),
);
