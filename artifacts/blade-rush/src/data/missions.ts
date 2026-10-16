/**
 * Daily mission pool. Three are picked each calendar day from a date seed.
 * Mission text lives in src/strings.ts under `missions`.
 */
export type MissionMetric =
  | 'applesSliced'
  | 'stagesCleared'
  | 'bossesDefeated'
  | 'powerupsUsed'
  | 'dailyPlayed'
  | 'closeCalls'
  | 'knivesStuck'
  | 'goldenSliced'
  | 'endlessStage'
  | 'timeAttackStages';

export interface MissionDef {
  id: string;
  metric: MissionMetric;
  target: number;
  /** 'sum' accumulates over the day, 'max' tracks the best single run. */
  mode: 'sum' | 'max';
  apples: number;
  gems: number;
}

export const MISSION_POOL: readonly MissionDef[] = [
  { id: 'slice20', metric: 'applesSliced', target: 20, mode: 'sum', apples: 60, gems: 0 },
  { id: 'slice40', metric: 'applesSliced', target: 40, mode: 'sum', apples: 100, gems: 0 },
  { id: 'clear8', metric: 'stagesCleared', target: 8, mode: 'sum', apples: 60, gems: 0 },
  { id: 'clear20', metric: 'stagesCleared', target: 20, mode: 'sum', apples: 120, gems: 0 },
  { id: 'boss1', metric: 'bossesDefeated', target: 1, mode: 'sum', apples: 0, gems: 2 },
  { id: 'boss3', metric: 'bossesDefeated', target: 3, mode: 'sum', apples: 0, gems: 4 },
  { id: 'power2', metric: 'powerupsUsed', target: 2, mode: 'sum', apples: 70, gems: 0 },
  { id: 'daily1', metric: 'dailyPlayed', target: 1, mode: 'sum', apples: 80, gems: 0 },
  { id: 'close5', metric: 'closeCalls', target: 5, mode: 'sum', apples: 90, gems: 0 },
  { id: 'stick100', metric: 'knivesStuck', target: 100, mode: 'sum', apples: 80, gems: 0 },
  { id: 'golden3', metric: 'goldenSliced', target: 3, mode: 'sum', apples: 0, gems: 2 },
  { id: 'endless12', metric: 'endlessStage', target: 12, mode: 'max', apples: 100, gems: 0 },
  { id: 'ta6', metric: 'timeAttackStages', target: 6, mode: 'max', apples: 90, gems: 0 },
];
