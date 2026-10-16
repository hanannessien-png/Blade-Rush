/**
 * The only place that decides whether an ad may show. Screens ask it; it
 * enforces config/adPolicy.ts, preloads every format, reloads with
 * exponential backoff, mutes audio during full-screen ads and never blocks
 * gameplay when an ad is missing.
 */
import { create } from 'zustand';
import { AD_POLICY } from '../../config/adPolicy';
import type { AgeGroup } from '../../state/save';
import { audio } from '../audio';
import { admobBackend } from './admobBackend';
import { createMockBackend } from './mockBackend';
import type { AdBackend, AdRequestProfile, FullscreenKind } from './types';

export type RewardedOutcome = 'rewarded' | 'dismissed' | 'unavailable';

interface AdStatus {
  ready: boolean;
  canRequestAds: boolean;
  privacyOptionsRequired: boolean;
  backend: 'admob' | 'mock';
  nonPersonalized: boolean;
  fullscreenShowing: boolean;
}

export const useAdStatus = create<AdStatus>()(() => ({
  ready: false,
  canRequestAds: false,
  privacyOptionsRequired: false,
  backend: admobBackend ? 'admob' : 'mock',
  nonPersonalized: true,
  fullscreenShowing: false,
}));

/** Age screen result → ad request settings (see the compliance notes in the spec). */
export function profileFor(age: AgeGroup | null): AdRequestProfile {
  switch (age) {
    case 'adult':
      return { childDirected: false, underAgeOfConsent: false, maxRating: 'MA', nonPersonalizedOnly: false, useConsentFlow: true };
    case 'teen':
      return { childDirected: false, underAgeOfConsent: false, maxRating: 'T', nonPersonalizedOnly: false, useConsentFlow: true };
    case 'child':
    case 'unknown':
    default:
      return { childDirected: true, underAgeOfConsent: true, maxRating: 'G', nonPersonalizedOnly: true, useConsentFlow: false };
  }
}

const KINDS: readonly FullscreenKind[] = ['interstitial', 'rewarded', 'appOpen'];
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

class AdManager {
  private backend: AdBackend = admobBackend ?? createMockBackend();
  private profile: AdRequestProfile = profileFor(null);
  private started = false;
  private attempts: Record<FullscreenKind, number> = { interstitial: 0, rewarded: 0, appOpen: 0 };
  private loading: Record<FullscreenKind, boolean> = { interstitial: false, rewarded: false, appOpen: false };
  private retryTimers: Partial<Record<FullscreenKind, ReturnType<typeof setTimeout>>> = {};
  private lastFullscreenAt = 0;
  private lastRewardedAt = 0;
  private stagesSinceInterstitial = 0;
  private firstSession = false;

  get showing(): boolean {
    return useAdStatus.getState().fullscreenShowing;
  }

  /** Runs consent (13+), configures the SDK and preloads every format. Safe to call again after the age changes. */
  async start(age: AgeGroup | null, launches: number): Promise<void> {
    this.profile = profileFor(age);
    this.firstSession = launches <= 1;
    let canRequestAds = true;
    let privacyOptionsRequired = false;
    if (this.profile.useConsentFlow) {
      const c = await this.backend.gatherConsent(this.profile);
      canRequestAds = c.canRequestAds;
      privacyOptionsRequired = c.privacyOptionsRequired;
    }
    useAdStatus.setState({ canRequestAds, privacyOptionsRequired, nonPersonalized: this.profile.nonPersonalizedOnly });
    if (canRequestAds && !this.started) {
      try {
        await this.backend.initialize(this.profile);
        this.started = true;
      } catch (err) {
        console.warn('[ads] initialize failed', err);
      }
    }
    useAdStatus.setState({ ready: true });
    if (this.started) KINDS.forEach((k) => this.preload(k));
  }

  async showPrivacyOptions(): Promise<void> {
    await this.backend.showPrivacyOptions();
    if (this.profile.useConsentFlow) {
      const c = await this.backend.gatherConsent(this.profile);
      useAdStatus.setState({ canRequestAds: c.canRequestAds, privacyOptionsRequired: c.privacyOptionsRequired });
    }
  }

  private preload(kind: FullscreenKind): void {
    if (!this.started || this.loading[kind] || this.backend.isLoaded(kind)) return;
    this.loading[kind] = true;
    this.backend.load(kind, this.profile, (ok) => {
      this.loading[kind] = false;
      if (ok) {
        this.attempts[kind] = 0;
        return;
      }
      const delay = Math.min(AD_POLICY.reloadBackoffMaxSec, AD_POLICY.reloadBackoffBaseSec * 2 ** this.attempts[kind]);
      this.attempts[kind]++;
      if (this.retryTimers[kind]) clearTimeout(this.retryTimers[kind]);
      this.retryTimers[kind] = setTimeout(() => this.preload(kind), delay * 1000);
    });
  }

  private cooldownOk(): boolean {
    return Date.now() - this.lastFullscreenAt >= AD_POLICY.fullscreenCooldownSec * 1000;
  }

  private async present(kind: FullscreenKind) {
    useAdStatus.setState({ fullscreenShowing: true });
    audio.setSuspended(true);
    try {
      return await this.backend.show(kind);
    } finally {
      this.lastFullscreenAt = Date.now();
      if (kind === 'rewarded') this.lastRewardedAt = Date.now();
      audio.setSuspended(false);
      useAdStatus.setState({ fullscreenShowing: false });
      this.preload(kind);
    }
  }

  isRewardedReady(): boolean {
    return this.started && this.backend.isLoaded('rewarded');
  }

  /**
   * Opt-in rewarded ad. Rewarded ads are player-initiated, so they skip the
   * full-screen cooldown. The reward is granted only on the earned callback.
   */
  async showRewarded(): Promise<RewardedOutcome> {
    if (this.showing || !useAdStatus.getState().canRequestAds) return 'unavailable';
    if (!this.started) return 'unavailable';
    if (!this.backend.isLoaded('rewarded')) {
      this.preload('rewarded');
      const until = Date.now() + AD_POLICY.rewardedWaitSec * 1000;
      while (Date.now() < until && !this.backend.isLoaded('rewarded')) await sleep(250);
      if (!this.backend.isLoaded('rewarded')) return 'unavailable';
    }
    const r = await this.present('rewarded');
    if (!r.shown) return 'unavailable';
    return r.rewarded ? 'rewarded' : 'dismissed';
  }

  /** Call after each cleared stage in Endless and Fixed Run. True when an interstitial is due. */
  noteStageCleared(): boolean {
    this.stagesSinceInterstitial++;
    return this.stagesSinceInterstitial >= AD_POLICY.interstitialEveryStages;
  }

  /** Interstitial between stages or when leaving Game Over. Never during play. */
  async maybeInterstitial(reason: 'stage' | 'runEnd'): Promise<boolean> {
    if (reason === 'stage' && this.stagesSinceInterstitial < AD_POLICY.interstitialEveryStages) return false;
    if (reason === 'runEnd' && !AD_POLICY.interstitialOnRunEnd) return false;
    if (!this.started || this.showing || !this.cooldownOk()) return false;
    if (Date.now() - this.lastRewardedAt < AD_POLICY.noInterstitialAfterRewardedSec * 1000) return false;
    if (!this.backend.isLoaded('interstitial')) {
      this.preload('interstitial');
      return false;
    }
    const r = await this.present('interstitial');
    if (r.shown) this.stagesSinceInterstitial = 0;
    return r.shown;
  }

  /** App Open on cold start (after the splash) and when returning after a long enough break. */
  async maybeAppOpen(trigger: 'cold' | 'resume', awaySec = 0): Promise<boolean> {
    if (AD_POLICY.appOpenSkipFirstSession && this.firstSession) return false;
    if (trigger === 'resume' && awaySec < AD_POLICY.appOpenMinBackgroundSec) return false;
    if (!this.started || this.showing || !this.cooldownOk()) return false;
    if (!this.backend.isLoaded('appOpen')) {
      if (trigger === 'cold') {
        // Give a cold-start App Open a moment to finish loading.
        this.preload('appOpen');
        const until = Date.now() + 3000;
        while (Date.now() < until && !this.backend.isLoaded('appOpen')) await sleep(200);
      }
      if (!this.backend.isLoaded('appOpen')) return false;
    }
    const r = await this.present('appOpen');
    return r.shown;
  }
}

export const ads = new AdManager();
