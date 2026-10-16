/**
 * MockAdService: fake full-screen ads for Expo Go and the web preview.
 * The overlay UI (components/MockAdOverlay.tsx) reads `useMockAds` and calls
 * `finish` when the player closes it.
 */
import { create } from 'zustand';
import type { AdBackend, FullscreenKind, ShowResult } from './types';

export type MockAdKind = FullscreenKind | 'privacy';

interface MockAdState {
  visible: boolean;
  kind: MockAdKind;
  resolve: ((r: ShowResult) => void) | null;
  open(kind: MockAdKind): Promise<ShowResult>;
  finish(rewarded: boolean): void;
}

export const useMockAds = create<MockAdState>()((set, get) => ({
  visible: false,
  kind: 'interstitial',
  resolve: null,
  open(kind) {
    return new Promise<ShowResult>((resolve) => set({ visible: true, kind, resolve }));
  },
  finish(rewarded) {
    const r = get().resolve;
    set({ visible: false, resolve: null });
    r?.({ shown: true, rewarded });
  },
}));

const LOAD_DELAY_MS = 500;

export function createMockBackend(): AdBackend {
  const loaded: Record<FullscreenKind, boolean> = { interstitial: false, rewarded: false, appOpen: false };
  return {
    kind: 'mock',
    async gatherConsent() {
      return { canRequestAds: true, privacyOptionsRequired: true };
    },
    async showPrivacyOptions() {
      await useMockAds.getState().open('privacy');
    },
    async initialize() {},
    load(kind, _profile, done) {
      setTimeout(() => {
        loaded[kind] = true;
        done(true);
      }, LOAD_DELAY_MS);
    },
    isLoaded(kind) {
      return loaded[kind];
    },
    async show(kind) {
      if (!loaded[kind]) return { shown: false, rewarded: false };
      loaded[kind] = false;
      const r = await useMockAds.getState().open(kind);
      return { shown: r.shown, rewarded: kind === 'rewarded' && r.rewarded };
    },
  };
}
