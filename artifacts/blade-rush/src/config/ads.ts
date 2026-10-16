/**
 * AdMob identifiers (Android only). The production IDs below are used in
 * release builds. Development builds, and any build made with
 * EXPO_PUBLIC_USE_TEST_ADS=1, use Google's official test units instead, so you
 * never click your own live ads while testing.
 *
 * The AdMob app ID is also set in app.json under the
 * react-native-google-mobile-ads plugin (androidAppId); keep both in sync.
 */
export const ADMOB_APP_ID = 'ca-app-pub-6225158226956884~6131419726';

export const PRODUCTION_AD_UNITS = {
  banner: 'ca-app-pub-6225158226956884/7385800803',
  interstitial: 'ca-app-pub-6225158226956884/2245154768',
  rewarded: 'ca-app-pub-6225158226956884/2509623500',
  appOpen: 'ca-app-pub-6225158226956884/9266603547',
} as const;

/** Google's public Android test units. Safe to click. */
export const TEST_AD_UNITS = {
  banner: 'ca-app-pub-3940256099942544/9214589741',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded: 'ca-app-pub-3940256099942544/5224354917',
  appOpen: 'ca-app-pub-3940256099942544/9257395921',
} as const;

export type AdUnitKey = keyof typeof PRODUCTION_AD_UNITS;

export const USE_TEST_ADS: boolean =
  (typeof __DEV__ !== 'undefined' && __DEV__) || process.env.EXPO_PUBLIC_USE_TEST_ADS === '1';

export function adUnitId(key: AdUnitKey): string {
  return USE_TEST_ADS ? TEST_AD_UNITS[key] : PRODUCTION_AD_UNITS[key];
}
