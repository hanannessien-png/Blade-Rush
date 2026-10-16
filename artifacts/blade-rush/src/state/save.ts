/**
 * The single versioned save object, plus pure helpers for day rollover,
 * missions and achievements. Everything here is unit-testable.
 */
import { ECONOMY } from '../config/economy';
import { ACHIEVEMENTS, type AchievementMetric } from '../data/achievements';
import { DEFAULT_KNIFE_ID } from '../data/knives';
import { MISSION_POOL, type MissionDef, type MissionMetric } from '../data/missions';
import { dateSeed, dayKey, mulberry32, shuffle } from '../game/rng';

export const SAVE_VERSION = 1;

export type AgeGroup = 'child' | 'teen' | 'adult' | 'unknown';

export interface Stats {
  applesSliced: number;
  goldenSliced: number;
  crystalSliced: number;
  knivesStuck: number;
  closeCalls: number;
  bossesDefeated: number;
  powerupsUsed: number;
  giftsClaimed: number;
  dailyCompleted: number;
  stagesCleared: number;
  runsPlayed: number;
  endlessBest: number;
  fixedBest: number;
  fixedWins: number;
  timeAttackBest: number;
  dailyStreakBest: number;
  /** Boss indices defeated at least once. */
  bossesBeaten: number[];
}

export interface Settings {
  sound: boolean;
  music: boolean;
  haptics: boolean;
  reduceMotion: boolean;
}

export interface MissionState {
  day: string;
  ids: string[];
  progress: Record<string, number>;
  claimed: string[];
  chestOpened: boolean;
}

export interface GiftState {
  lastClaimDay: string | null;
  /** Days claimed in the current streak (0–7); the next gift is index `streak % 7`. */
  streak: number;
}

export interface DailyState {
  day: string;
  attemptsUsed: number;
  extraUsed: boolean;
  bestToday: number;
  completedToday: boolean;
  streak: number;
  lastPlayedDay: string | null;
  milestonesClaimed: number[];
}

export interface SaveData {
  version: number;
  apples: number;
  gems: number;
  owned: string[];
  equipped: string;
  unseen: string[];
  collectionsClaimed: string[];
  achievementsClaimed: string[];
  stats: Stats;
  missions: MissionState;
  gift: GiftState;
  daily: DailyState;
  settings: Settings;
  ageGroup: AgeGroup | null;
  launches: number;
  tutorialDone: boolean;
  freeApplesReadyAt: number;
}

export function emptyStats(): Stats {
  return {
    applesSliced: 0,
    goldenSliced: 0,
    crystalSliced: 0,
    knivesStuck: 0,
    closeCalls: 0,
    bossesDefeated: 0,
    powerupsUsed: 0,
    giftsClaimed: 0,
    dailyCompleted: 0,
    stagesCleared: 0,
    runsPlayed: 0,
    endlessBest: 0,
    fixedBest: 0,
    fixedWins: 0,
    timeAttackBest: 0,
    dailyStreakBest: 0,
    bossesBeaten: [],
  };
}

export function missionsForDay(day: string, date: Date): MissionState {
  const rng = mulberry32(dateSeed(date) ^ 0x3157);
  const picked: MissionDef[] = [];
  for (const m of shuffle(rng, MISSION_POOL)) {
    if (picked.length >= 3) break;
    if (picked.some((p) => p.metric === m.metric)) continue;
    picked.push(m);
  }
  return { day, ids: picked.map((m) => m.id), progress: {}, claimed: [], chestOpened: false };
}

export function defaultSave(now = new Date()): SaveData {
  const day = dayKey(now);
  return {
    version: SAVE_VERSION,
    apples: ECONOMY.startingApples,
    gems: ECONOMY.startingGems,
    owned: [DEFAULT_KNIFE_ID],
    equipped: DEFAULT_KNIFE_ID,
    unseen: [],
    collectionsClaimed: [],
    achievementsClaimed: [],
    stats: emptyStats(),
    missions: missionsForDay(day, now),
    gift: { lastClaimDay: null, streak: 0 },
    daily: {
      day,
      attemptsUsed: 0,
      extraUsed: false,
      bestToday: 0,
      completedToday: false,
      streak: 0,
      lastPlayedDay: null,
      milestonesClaimed: [],
    },
    settings: { sound: true, music: true, haptics: true, reduceMotion: false },
    ageGroup: null,
    launches: 0,
    tutorialDone: false,
    freeApplesReadyAt: 0,
  };
}

/** Merge a loaded (possibly older or partial) save over the defaults. */
export function migrateSave(raw: unknown): SaveData {
  const base = defaultSave();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<SaveData>;
  const merged: SaveData = {
    ...base,
    ...r,
    stats: { ...base.stats, ...(r.stats ?? {}) },
    missions: { ...base.missions, ...(r.missions ?? {}) },
    gift: { ...base.gift, ...(r.gift ?? {}) },
    daily: { ...base.daily, ...(r.daily ?? {}) },
    settings: { ...base.settings, ...(r.settings ?? {}) },
    version: SAVE_VERSION,
  };
  if (!merged.owned.includes(DEFAULT_KNIFE_ID)) merged.owned = [DEFAULT_KNIFE_ID, ...merged.owned];
  if (!merged.owned.includes(merged.equipped)) merged.equipped = DEFAULT_KNIFE_ID;
  return merged;
}

export function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Whole calendar days from `a` to `b` (local dates). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / 86400000);
}

/** Roll missions, daily challenge and streaks over to `now` if the day changed. */
export function rolloverDay(save: SaveData, now: Date): SaveData {
  const today = dayKey(now);
  let next = save;
  if (save.missions.day !== today) next = { ...next, missions: missionsForDay(today, now) };
  if (save.daily.day !== today) {
    const last = save.daily.lastPlayedDay;
    const keepStreak = last !== null && daysBetween(last, today) <= 1;
    next = {
      ...next,
      daily: {
        ...save.daily,
        day: today,
        attemptsUsed: 0,
        extraUsed: false,
        bestToday: 0,
        completedToday: false,
        streak: keepStreak ? save.daily.streak : 0,
        milestonesClaimed: keepStreak ? save.daily.milestonesClaimed : [],
      },
    };
  }
  return next;
}

export interface GiftStatus {
  canClaim: boolean;
  /** 0-based index into ECONOMY.dailyGift of the gift shown as current. */
  index: number;
}

export function giftStatus(gift: GiftState, today: string): GiftStatus {
  if (gift.lastClaimDay === today) return { canClaim: false, index: (gift.streak - 1 + 7) % 7 };
  const continues = gift.lastClaimDay !== null && daysBetween(gift.lastClaimDay, today) === 1;
  const streak = continues ? gift.streak % 7 : 0;
  return { canClaim: true, index: streak };
}

export function missionDef(id: string): MissionDef | undefined {
  return MISSION_POOL.find((m) => m.id === id);
}

export function applyMissionProgress(m: MissionState, metric: MissionMetric, amount: number): MissionState {
  let changed = false;
  const progress = { ...m.progress };
  for (const id of m.ids) {
    const def = missionDef(id);
    if (!def || def.metric !== metric) continue;
    const cur = progress[id] ?? 0;
    const next = def.mode === 'max' ? Math.max(cur, amount) : cur + amount;
    if (next !== cur) {
      progress[id] = Math.min(def.target, next);
      changed = true;
    }
  }
  return changed ? { ...m, progress } : m;
}

export function achievementValue(save: SaveData, metric: AchievementMetric): number {
  if (metric === 'knivesOwned') return save.owned.length;
  return save.stats[metric] as number;
}

export function claimableAchievements(save: SaveData): number {
  return ACHIEVEMENTS.filter((a) => !save.achievementsClaimed.includes(a.id) && achievementValue(save, a.metric) >= a.target).length;
}

export function claimableMissions(save: SaveData): number {
  let n = 0;
  for (const id of save.missions.ids) {
    const def = missionDef(id);
    if (def && !save.missions.claimed.includes(id) && (save.missions.progress[id] ?? 0) >= def.target) n++;
  }
  if (!save.missions.chestOpened && save.missions.ids.every((id) => save.missions.claimed.includes(id))) n++;
  return n;
}
