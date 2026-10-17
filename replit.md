# Twirlblade

An Android-only, offline, portrait knife-throwing arcade game (package `com.apexplay.twirlblade`, publisher "apex"): tap to throw knives into a spinning target, slice apples, beat bosses and collect knives.

## Run & Operate

- Game workflow: `artifacts/blade-rush: expo` (`pnpm --filter @workspace/blade-rush run dev`). Preview on web or scan the QR code in Expo Go.
- `pnpm --filter @workspace/blade-rush run typecheck` — strict TypeScript check
- `pnpm --filter @workspace/blade-rush run test` — vitest (stage generator, angles, engine)
- Dev shortcut: open `/game/<mode>?stage=N` to start a run at stage N (ignored in release builds). Modes: `endless`, `fixed`, `daily`, `timeAttack`.
- The API server and mockup sandbox artifacts are template leftovers; the game does not use them.

## Stack

- Expo (React Native) + expo-router, strict TypeScript
- Rendering: @shopify/react-native-skia (game world drawn from code, no image assets); React Native views for HUD and menus
- State: zustand store persisted to AsyncStorage
- Ads: react-native-google-mobile-ads (Android builds only); a mock ad overlay runs in Expo Go and on web
- Fonts: Lilita One (display) and Nunito (body)

## Where things live

- `artifacts/blade-rush/src/config/` — tunables: difficulty curve, economy, ad policy, ad unit IDs (`ads.ts`)
- `artifacts/blade-rush/src/data/` — knives, bosses, worlds, achievements, missions
- `artifacts/blade-rush/src/game/` — pure engine, stage generator, Skia renderer and procedural art
- `artifacts/blade-rush/src/state/` — save format (`save.ts`) and store actions (`store.ts`)
- `artifacts/blade-rush/src/ui/` — UI kit, game screen (`game/`), menu screens (`screens/`)
- `artifacts/blade-rush/src/strings.ts` — every player-facing string (English only)
- `artifacts/blade-rush/constants/colors.ts` — all color tokens; components never hard-code hex values

## Architecture decisions

- The engine is pure TypeScript with no rendering, so it is unit-tested; the run controller owns mode rules, scoring and ad timing.
- The world is redrawn each frame into a Skia picture handed to the canvas through a shared value; menus use native views.
- On web, Skia's CanvasKit must load before any module that touches `Skia` is imported, so `index.web.js` loads CanvasKit and then dynamically imports the router entry. Never call Skia at module top level.
- Knife previews are pre-rendered PNGs in `assets/knives` (mapped in `src/data/knifeImages.ts`); rendering them at runtime froze the first Store open. If knife art changes, re-export them with `__knifeExport()` in the web preview console.
- Performance rules for the play screen: the HUD subscribes to the run controller (`useSyncExternalStore`), and floats/popups live behind an imperative handle, so the game screen does not re-render during play. Do not allocate Skia paints, shaders, paths or colours per frame in the renderer; cache them or record a picture (boss faces are cached per mood).
- Build paths with `Skia.PathBuilder` and `.build()`; the mutable `SkPath` methods are deprecated and print warnings.

## Product

- Modes: Endless, Fixed Run (30 stages), Daily Challenge (10 seeded stages, one free attempt plus one from an ad), Time Attack (60 s).
- A boss every 5th stage (20 bosses), 12 worlds, 50 cosmetic knives in 11 collections, 6 power-ups unlocked by stage.
- Apples and gems, 42 achievements, 3 daily missions with a bonus chest, a 7-day login gift, settings with a double-confirm reset.
- Age screen at first launch, Google UMP consent, banners, interstitials, rewarded ads and App Open (skipped in the first session).

## User preferences

- The user writes in Egyptian Arabic; reply in Egyptian Arabic.
- Android only; do not plan iOS work.
- The production AdMob IDs in `src/config/ads.ts` and `app.json` were supplied by the user for this game; dev builds use Google test IDs.

## Gotchas

- `react-native-google-mobile-ads` is not in Expo Go; real ads only appear in a store/EAS build.
- Keep the AdMob app ID in `app.json` and `src/config/ads.ts` in sync.
- SVG gradient ids must be unique per instance (`useId`), otherwise icons render black on web when another screen is hidden.
- Headless Chrome has a minimum window width near 500 px; use device-metrics emulation for narrow phone screenshots.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `expo` skill for Expo conventions
