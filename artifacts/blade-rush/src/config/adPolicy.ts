/**
 * When and where ads may appear. Gameplay code never decides this itself; it
 * asks the ad manager, which reads these rules.
 */
export const AD_POLICY = {
  /** Minimum gap between any two full-screen ads (App Open, interstitial, rewarded). */
  fullscreenCooldownSec: 30,
  /** App Open only after the player was away at least this long. */
  appOpenMinBackgroundSec: 15,
  /** Skip App Open on the very first session so the first impression is the game. */
  appOpenSkipFirstSession: true,
  /** Interstitial after every Nth cleared stage in Endless and Fixed Run. */
  interstitialEveryStages: 3,
  /** Interstitial when leaving Game Over / run end, in every mode. */
  interstitialOnRunEnd: true,
  /** Never show an interstitial this soon after a rewarded ad closed. */
  noInterstitialAfterRewardedSec: 45,
  /** Continue (rewarded) per run. */
  maxContinuesPerRun: 3,
  /** Seconds the Continue button stays offered on Game Over. */
  continueCountdownSec: 5,
  /** Fake ad duration in the preview (seconds). */
  mockAdSeconds: { interstitial: 3, appOpen: 3, rewarded: 5 },
  /** Ad reload backoff: base * 2^attempt, capped. */
  reloadBackoffBaseSec: 4,
  reloadBackoffMaxSec: 120,
  /** How long a rewarded request may take before showing "No ad available". */
  rewardedWaitSec: 6,
} as const;

/**
 * Banner position per screen. A fixed slot is reserved so the layout never
 * jumps when the ad loads.
 */
export type BannerPosition = 'top' | 'bottom' | 'none';

export const BANNER_PLACEMENT: Record<string, BannerPosition> = {
  // Home: Play sits in the lower half, so the banner goes at the very bottom
  // below the secondary button row with a clear gap from every control.
  home: 'bottom',
  // Mode select: cards fill the middle; bottom keeps the back button and title clear.
  modes: 'bottom',
  // Store: the header holds balances and Free apples; the bottom of the
  // scrolling grid is the safest place, away from the Buy buttons in the modal.
  store: 'bottom',
  // Achievements and missions are scrolling lists with Claim buttons; the
  // reserved strip sits under the list so no Claim button can overlap it.
  achievements: 'bottom',
  missions: 'bottom',
  // Daily Gift: the Claim button is mid-screen; bottom strip is clear of it.
  gift: 'bottom',
  // Daily Challenge info: the Play button is centred; bottom strip.
  daily: 'bottom',
  // Settings: toggles fill the screen; bottom strip below the version line.
  settings: 'bottom',
  // Game Over: Continue / Retry / Home are large buttons in the middle and
  // bottom, so the banner goes at the top, above the score card.
  gameOver: 'top',
  // During active play the banner is hidden: the whole screen is the
  // tap-to-throw area and we never risk an accidental tap.
  game: 'none',
};

/** Reserved slot height for the anchored adaptive banner (dp). */
export const BANNER_SLOT_HEIGHT = 62;
