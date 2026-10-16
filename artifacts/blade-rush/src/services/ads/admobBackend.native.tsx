/**
 * AdMob backend for Android builds (react-native-google-mobile-ads).
 * Expo Go has no AdMob native module, so there we return null and the app
 * falls back to the mock service.
 */
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as GMA from 'react-native-google-mobile-ads';
import type { ComponentType } from 'react';
import { adUnitId } from '../../config/ads';
import type { AdBackend, AdRequestProfile, FullscreenKind, ShowResult } from './types';

interface FullAd {
  load(): void;
  show(): Promise<void>;
  readonly loaded: boolean;
  addAdEventListener(type: string, listener: (payload?: unknown) => void): () => void;
  removeAllListeners(): void;
}

function loadModule(): typeof GMA | null {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-google-mobile-ads') as typeof GMA;
  } catch (err) {
    console.warn('[ads] AdMob module unavailable, using preview ads', err);
    return null;
  }
}

const mod = loadModule();

function create(kind: FullscreenKind, profile: AdRequestProfile): FullAd {
  const m = mod!;
  const opts = { requestNonPersonalizedAdsOnly: profile.nonPersonalizedOnly };
  switch (kind) {
    case 'interstitial':
      return m.InterstitialAd.createForAdRequest(adUnitId('interstitial'), opts) as unknown as FullAd;
    case 'rewarded':
      return m.RewardedAd.createForAdRequest(adUnitId('rewarded'), opts) as unknown as FullAd;
    case 'appOpen':
      return m.AppOpenAd.createForAdRequest(adUnitId('appOpen'), opts) as unknown as FullAd;
  }
}

function makeBackend(m: typeof GMA): AdBackend {
  const ads: Partial<Record<FullscreenKind, FullAd>> = {};
  const loaded: Record<FullscreenKind, boolean> = { interstitial: false, rewarded: false, appOpen: false };
  const LOADED_EVENT: Record<FullscreenKind, string> = {
    interstitial: m.AdEventType.LOADED,
    appOpen: m.AdEventType.LOADED,
    rewarded: m.RewardedAdEventType.LOADED,
  };

  return {
    kind: 'admob',

    async gatherConsent(profile) {
      try {
        const info = await m.AdsConsent.gatherConsent({ tagForUnderAgeOfConsent: profile.underAgeOfConsent });
        return {
          canRequestAds: info.canRequestAds,
          privacyOptionsRequired: info.privacyOptionsRequirementStatus === m.AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
        };
      } catch (err) {
        console.warn('[ads] consent flow failed', err);
        try {
          const info = await m.AdsConsent.getConsentInfo();
          return {
            canRequestAds: info.canRequestAds,
            privacyOptionsRequired: info.privacyOptionsRequirementStatus === m.AdsConsentPrivacyOptionsRequirementStatus.REQUIRED,
          };
        } catch {
          return { canRequestAds: false, privacyOptionsRequired: false };
        }
      }
    },

    async showPrivacyOptions() {
      try {
        await m.AdsConsent.showPrivacyOptionsForm();
      } catch (err) {
        console.warn('[ads] privacy options form failed', err);
      }
    },

    async initialize(profile) {
      const rating: Record<AdRequestProfile['maxRating'], GMA.MaxAdContentRating> = {
        G: m.MaxAdContentRating.G,
        PG: m.MaxAdContentRating.PG,
        T: m.MaxAdContentRating.T,
        MA: m.MaxAdContentRating.MA,
      };
      await m.default().setRequestConfiguration({
        maxAdContentRating: rating[profile.maxRating],
        tagForChildDirectedTreatment: profile.childDirected,
        tagForUnderAgeOfConsent: profile.underAgeOfConsent,
      });
      await m.default().initialize();
    },

    load(kind, profile, done) {
      const old = ads[kind];
      old?.removeAllListeners();
      loaded[kind] = false;
      const ad = create(kind, profile);
      ads[kind] = ad;
      let settled = false;
      const unsubLoaded = ad.addAdEventListener(LOADED_EVENT[kind], () => {
        loaded[kind] = true;
        if (!settled) {
          settled = true;
          done(true);
        }
      });
      const unsubError = ad.addAdEventListener(m.AdEventType.ERROR, () => {
        loaded[kind] = false;
        if (!settled) {
          settled = true;
          unsubLoaded();
          unsubError();
          done(false);
        }
      });
      ad.load();
    },

    isLoaded(kind) {
      return loaded[kind] && !!ads[kind]?.loaded;
    },

    show(kind) {
      const ad = ads[kind];
      if (!ad || !loaded[kind]) return Promise.resolve({ shown: false, rewarded: false });
      loaded[kind] = false;
      return new Promise<ShowResult>((resolve) => {
        let rewarded = false;
        let finished = false;
        const subs: (() => void)[] = [];
        const finish = (shown: boolean) => {
          if (finished) return;
          finished = true;
          subs.forEach((u) => u());
          ad.removeAllListeners();
          resolve({ shown, rewarded });
        };
        if (kind === 'rewarded') {
          subs.push(ad.addAdEventListener(m.RewardedAdEventType.EARNED_REWARD, () => (rewarded = true)));
        }
        subs.push(ad.addAdEventListener(m.AdEventType.CLOSED, () => finish(true)));
        subs.push(ad.addAdEventListener(m.AdEventType.ERROR, () => finish(false)));
        ad.show().catch(() => finish(false));
      });
    },
  };
}

export const admobBackend: AdBackend | null = mod ? makeBackend(mod) : null;

export interface NativeBannerProps {
  unitId: string;
  nonPersonalized: boolean;
  onFailed(): void;
}

/** The real anchored adaptive banner, or null when AdMob is unavailable. */
export function getNativeBanner(): ComponentType<NativeBannerProps> | null {
  if (!mod) return null;
  const m = mod;
  return function NativeBanner({ unitId, nonPersonalized, onFailed }: NativeBannerProps) {
    const Banner = m.BannerAd;
    return (
      // eslint-disable-next-line react/jsx-no-useless-fragment
      <Banner
        unitId={unitId}
        size={m.BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: nonPersonalized }}
        onAdFailedToLoad={onFailed}
      />
    );
  };
}
