/**
 * The AdService contract. Two backends implement it: AdMob (Android builds)
 * and a mock (Expo Go and web preview) that shows fake full-screen ads.
 */
export type FullscreenKind = 'interstitial' | 'rewarded' | 'appOpen';

export type ContentRating = 'G' | 'PG' | 'T' | 'MA';

/** Request settings derived from the age screen. */
export interface AdRequestProfile {
  childDirected: boolean;
  underAgeOfConsent: boolean;
  maxRating: ContentRating;
  nonPersonalizedOnly: boolean;
  /** Run the Google UMP consent flow (13 and over only). */
  useConsentFlow: boolean;
}

export interface ConsentResult {
  canRequestAds: boolean;
  privacyOptionsRequired: boolean;
}

export interface ShowResult {
  shown: boolean;
  rewarded: boolean;
}

export interface AdBackend {
  readonly kind: 'admob' | 'mock';
  gatherConsent(profile: AdRequestProfile): Promise<ConsentResult>;
  showPrivacyOptions(): Promise<void>;
  initialize(profile: AdRequestProfile): Promise<void>;
  /** Starts loading; calls back once with success or failure. */
  load(kind: FullscreenKind, profile: AdRequestProfile, done: (ok: boolean) => void): void;
  isLoaded(kind: FullscreenKind): boolean;
  /** Resolves when the ad is closed (or failed to show). */
  show(kind: FullscreenKind): Promise<ShowResult>;
}
