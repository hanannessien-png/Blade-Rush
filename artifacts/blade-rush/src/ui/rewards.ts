/** Shared helpers for rewards, rewarded ads and countdown text. */
import { ads } from '../services/ads/adManager';
import { audio } from '../services/audio';
import { haptic } from '../services/haptics';
import { useGame, type Reward } from '../state/store';
import { fmt, S } from '../strings';
import { toast } from './components/Toasts';

/** Toast + sound for a reward that was already added to the balance. */
export function celebrateReward(r: Reward | null): void {
  if (!r) return;
  if (r.apples > 0) toast(fmt(S.toast.apples, { n: r.apples }), 'apples');
  if (r.gems > 0) toast(fmt(S.toast.gems, { n: r.gems }), 'gems');
  if (r.apples > 0 || r.gems > 0) {
    audio.play('coin');
    haptic('success');
  }
}

/** Grants a reward to the balance and celebrates it. */
export function grantReward(r: Reward): void {
  useGame.getState().grant(r);
  celebrateReward(r);
}

/**
 * Opt-in rewarded ad. Calls `onReward` only when the reward was earned.
 * Shows a friendly toast when no ad is available.
 */
export async function watchForReward(onReward: () => void): Promise<boolean> {
  const r = await ads.showRewarded();
  if (r === 'rewarded') {
    onReward();
    return true;
  }
  if (r === 'unavailable') toast(S.common.noAd, 'info');
  return false;
}

export function msUntilTomorrow(now = new Date()): number {
  const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return t.getTime() - now.getTime();
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}
