/**
 * Global game state (Zustand). Holds the persisted save plus every action that
 * changes it. Run-level state (current stage, points, charges) lives in the
 * game screen, not here.
 */
import { create } from 'zustand';
import { ECONOMY } from '../config/economy';
import { ACHIEVEMENTS } from '../data/achievements';
import { BOSSES } from '../data/bosses';
import { COLLECTION_BONUS, KNIFE_BY_ID, KNIVES, type CollectionId } from '../data/knives';
import type { MissionMetric } from '../data/missions';
import { dayKey } from '../game/rng';
import { queueSave } from '../services/storage';
import {
  achievementValue,
  applyMissionProgress,
  defaultSave,
  giftStatus,
  missionDef,
  rolloverDay,
  type AgeGroup,
  type SaveData,
  type Settings,
  type Stats,
} from './save';

export interface Reward {
  apples: number;
  gems: number;
}

type CounterKey = Exclude<keyof Stats, 'bossesBeaten'>;
export type BestKey = 'endlessBest' | 'fixedBest' | 'timeAttackBest';

export type BuyResult = 'ok' | 'needApples' | 'needGems' | 'owned';

export interface DailyResult {
  apples: number;
  gems: number;
  milestoneGems: number;
  completed: boolean;
}

interface Actions {
  hydrate(data: SaveData): void;
  rollover(): void;
  grant(r: Reward): void;
  buyKnife(id: string, currency: 'apples' | 'gems'): BuyResult;
  /** Gives a knife for free (boss exclusives). Returns true when it is new. */
  awardKnife(id: string): boolean;
  equip(id: string): void;
  markSeen(id: string): void;
  claimCollection(id: CollectionId): Reward | null;
  bump(counts: Partial<Record<CounterKey, number>>): void;
  /** Saves a new best; returns true when it beat the old one. */
  setBest(key: BestKey, value: number): boolean;
  /** Records a boss win. Returns the exclusive knife id on its first defeat. */
  bossDefeated(index: number): string | null;
  missionProgress(metric: MissionMetric, amount: number): void;
  claimMission(id: string): Reward | null;
  openChest(): Reward | null;
  claimAchievement(id: string): Reward | null;
  claimGift(): Reward | null;
  startDaily(extra: boolean): boolean;
  finishDaily(cleared: number): DailyResult;
  setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void;
  setAgeGroup(group: AgeGroup): void;
  setTutorialDone(): void;
  setFreeApplesReadyAt(ts: number): void;
  countLaunch(): void;
  resetAll(): void;
}

export type GameStore = SaveData & { hydrated: boolean } & Actions;

export const useGame = create<GameStore>()((set, get) => {
  const update = (fn: (s: SaveData) => Partial<SaveData>) => set((s) => fn(s));

  return {
    ...defaultSave(),
    hydrated: false,

    hydrate(data) {
      set({ ...rolloverDay(data, new Date()), hydrated: true });
    },

    rollover() {
      const s = get();
      const next = rolloverDay(s, new Date());
      if (next !== s) set({ missions: next.missions, daily: next.daily });
    },

    grant({ apples, gems }) {
      if (!apples && !gems) return;
      update((s) => ({ apples: s.apples + apples, gems: s.gems + gems }));
    },

    buyKnife(id, currency) {
      const s = get();
      const k = KNIFE_BY_ID[id];
      if (!k) return 'owned';
      if (s.owned.includes(id)) return 'owned';
      if (currency === 'apples') {
        if (k.priceApples === undefined) return 'needApples';
        if (s.apples < k.priceApples) return 'needApples';
        set({ apples: s.apples - k.priceApples, owned: [...s.owned, id], equipped: id });
      } else {
        if (k.priceGems === undefined) return 'needGems';
        if (s.gems < k.priceGems) return 'needGems';
        set({ gems: s.gems - k.priceGems, owned: [...s.owned, id], equipped: id });
      }
      return 'ok';
    },

    awardKnife(id) {
      const s = get();
      if (!KNIFE_BY_ID[id] || s.owned.includes(id)) return false;
      set({ owned: [...s.owned, id], unseen: [...s.unseen, id] });
      return true;
    },

    equip(id) {
      if (get().owned.includes(id)) set({ equipped: id });
    },

    markSeen(id) {
      const s = get();
      if (s.unseen.includes(id)) set({ unseen: s.unseen.filter((u) => u !== id) });
    },

    claimCollection(id) {
      const s = get();
      if (s.collectionsClaimed.includes(id)) return null;
      const all = KNIVES.filter((k) => k.collection === id);
      if (!all.every((k) => s.owned.includes(k.id))) return null;
      const r = COLLECTION_BONUS[id];
      set({ collectionsClaimed: [...s.collectionsClaimed, id], apples: s.apples + r.apples, gems: s.gems + r.gems });
      return { apples: r.apples, gems: r.gems };
    },

    bump(counts) {
      update((s) => {
        const stats = { ...s.stats };
        for (const [k, v] of Object.entries(counts) as [CounterKey, number][]) stats[k] = (stats[k] as number) + v;
        return { stats };
      });
    },

    setBest(key, value) {
      const s = get();
      if (value <= s.stats[key]) return false;
      set({ stats: { ...s.stats, [key]: value } });
      return true;
    },

    bossDefeated(index) {
      const s = get();
      const first = !s.stats.bossesBeaten.includes(index);
      set({
        stats: {
          ...s.stats,
          bossesDefeated: s.stats.bossesDefeated + 1,
          bossesBeaten: first ? [...s.stats.bossesBeaten, index] : s.stats.bossesBeaten,
        },
      });
      const knife = BOSSES[index]?.exclusiveKnife;
      if (knife && get().awardKnife(knife)) return knife;
      return null;
    },

    missionProgress(metric, amount) {
      const s = get();
      const next = applyMissionProgress(s.missions, metric, amount);
      if (next !== s.missions) set({ missions: next });
    },

    claimMission(id) {
      const s = get();
      const def = missionDef(id);
      if (!def || s.missions.claimed.includes(id) || (s.missions.progress[id] ?? 0) < def.target) return null;
      set({
        missions: { ...s.missions, claimed: [...s.missions.claimed, id] },
        apples: s.apples + def.apples,
        gems: s.gems + def.gems,
      });
      return { apples: def.apples, gems: def.gems };
    },

    openChest() {
      const s = get();
      if (s.missions.chestOpened || !s.missions.ids.every((id) => s.missions.claimed.includes(id))) return null;
      set({
        missions: { ...s.missions, chestOpened: true },
        apples: s.apples + ECONOMY.missionChestApples,
        gems: s.gems + ECONOMY.missionChestGems,
      });
      return { apples: ECONOMY.missionChestApples, gems: ECONOMY.missionChestGems };
    },

    claimAchievement(id) {
      const s = get();
      const a = ACHIEVEMENTS.find((x) => x.id === id);
      if (!a || s.achievementsClaimed.includes(id) || achievementValue(s, a.metric) < a.target) return null;
      const r = ECONOMY.achievementReward[a.tier];
      set({ achievementsClaimed: [...s.achievementsClaimed, id], apples: s.apples + r.apples, gems: s.gems + r.gems });
      return { apples: r.apples, gems: r.gems };
    },

    claimGift() {
      const s = get();
      const today = dayKey(new Date());
      const st = giftStatus(s.gift, today);
      if (!st.canClaim) return null;
      const r = ECONOMY.dailyGift[st.index];
      set({
        gift: { lastClaimDay: today, streak: st.index + 1 },
        apples: s.apples + r.apples,
        gems: s.gems + r.gems,
        stats: { ...s.stats, giftsClaimed: s.stats.giftsClaimed + 1 },
      });
      return { apples: r.apples, gems: r.gems };
    },

    startDaily(extra) {
      get().rollover();
      const s = get();
      if (!extra) {
        if (s.daily.attemptsUsed > 0) return false;
        set({ daily: { ...s.daily, attemptsUsed: 1 } });
      } else {
        if (s.daily.extraUsed) return false;
        set({ daily: { ...s.daily, extraUsed: true, attemptsUsed: Math.max(1, s.daily.attemptsUsed) } });
      }
      return true;
    },

    finishDaily(cleared) {
      const s = get();
      const today = dayKey(new Date());
      const d = s.daily;
      const improved = Math.max(0, cleared - d.bestToday);
      const apples = improved * ECONOMY.dailyApplesPerStage;
      const completedNow = cleared >= ECONOMY.dailyChallengeStages && !d.completedToday;
      const gems = completedNow ? ECONOMY.dailyCompletionGems : 0;
      const firstPlayToday = d.lastPlayedDay !== today;
      const streak = firstPlayToday ? d.streak + 1 : d.streak;
      let milestoneGems = 0;
      const claimed = [...d.milestonesClaimed];
      for (const m of ECONOMY.dailyStreakMilestones) {
        if (streak >= m.days && !claimed.includes(m.days)) {
          claimed.push(m.days);
          milestoneGems += m.gems;
        }
      }
      set({
        apples: s.apples + apples,
        gems: s.gems + gems + milestoneGems,
        daily: {
          ...d,
          bestToday: Math.max(d.bestToday, cleared),
          completedToday: d.completedToday || completedNow,
          streak,
          lastPlayedDay: today,
          milestonesClaimed: claimed,
        },
        stats: {
          ...s.stats,
          dailyCompleted: s.stats.dailyCompleted + (completedNow ? 1 : 0),
          dailyStreakBest: Math.max(s.stats.dailyStreakBest, streak),
        },
      });
      get().missionProgress('dailyPlayed', 1);
      return { apples, gems, milestoneGems, completed: completedNow };
    },

    setSetting(key, value) {
      update((s) => ({ settings: { ...s.settings, [key]: value } }));
    },

    setAgeGroup(group) {
      set({ ageGroup: group });
    },

    setTutorialDone() {
      if (!get().tutorialDone) set({ tutorialDone: true });
    },

    setFreeApplesReadyAt(ts) {
      set({ freeApplesReadyAt: ts });
    },

    countLaunch() {
      update((s) => ({ launches: s.launches + 1 }));
    },

    resetAll() {
      const keep = get();
      set({ ...defaultSave(), ageGroup: keep.ageGroup, settings: keep.settings, launches: keep.launches, hydrated: true });
    },
  };
});

export function snapshot(s: GameStore): SaveData {
  return {
    version: s.version,
    apples: s.apples,
    gems: s.gems,
    owned: s.owned,
    equipped: s.equipped,
    unseen: s.unseen,
    collectionsClaimed: s.collectionsClaimed,
    achievementsClaimed: s.achievementsClaimed,
    stats: s.stats,
    missions: s.missions,
    gift: s.gift,
    daily: s.daily,
    settings: s.settings,
    ageGroup: s.ageGroup,
    launches: s.launches,
    tutorialDone: s.tutorialDone,
    freeApplesReadyAt: s.freeApplesReadyAt,
  };
}

// Persist every change after hydration.
useGame.subscribe((s, prev) => {
  if (!s.hydrated) return;
  if (s === prev) return;
  queueSave(snapshot(s));
});
