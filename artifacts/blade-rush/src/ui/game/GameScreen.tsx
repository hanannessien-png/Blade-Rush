/**
 * The play screen. A Skia canvas draws the world (fed by a JS-thread render
 * loop through a shared value); React Native draws the HUD and overlays.
 */
import { Canvas, Picture, Skia, type SkPicture } from '@shopify/react-native-skia';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, BackHandler, Platform, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { game } from '@/constants/colors';
import { WORLDS } from '../../data/worlds';
import type { ModeId, PowerUpId } from '../../game/types';
import { ads, useAdStatus } from '../../services/ads/adManager';
import { audio } from '../../services/audio';
import { useGame } from '../../state/store';
import { fmt, S } from '../../strings';
import { BannerSlot } from '../components/BannerSlot';
import { Confetti } from '../components/Confetti';
import { useScreenInsets } from '../components/Screen';
import { celebrateReward, watchForReward } from '../rewards';
import { FloatLayer, Popup, StageBanner, TutorialHand, WorldFade, type BannerItem, type FloatItem, type PopupItem } from './Effects';
import { KnifeColumn, PowerRails, TopHud } from './Hud';
import { AdPowerPicker, BossDefeatedPanel, DailyResultsPanel, GameOverPanel, PauseMenu, QuitConfirm, VictoryPanel } from './Overlays';
import { RunController, type HudState, type Overlay } from './runController';

function emptyPicture(): SkPicture {
  const rec = Skia.PictureRecorder();
  rec.beginRecording(Skia.XYWHRect(0, 0, 1, 1));
  return rec.finishRecordingAsPicture();
}

const HUD_HEIGHT = 96;
const TA_EXTRA = 44;

export function GameScreen({ mode, devStage }: { mode: ModeId; devStage?: number }) {
  const [runKey, setRunKey] = useState(0);
  return <Run key={runKey} mode={mode} devStage={runKey === 0 ? devStage : undefined} onRetry={() => setRunKey((k) => k + 1)} />;
}

let nextFxId = 1;

function Run({ mode, devStage, onRetry }: { mode: ModeId; devStage?: number; onRetry(): void }) {
  const insets = useScreenInsets();
  const equipped = useGame((s) => s.equipped);
  const best = useGame((s) =>
    mode === 'endless' ? s.stats.endlessBest : mode === 'fixed' ? s.stats.fixedBest : mode === 'timeAttack' ? s.stats.timeAttackBest : s.daily.bestToday,
  );
  const streak = useGame((s) => s.daily.streak);
  const adShowing = useAdStatus((s) => s.fullscreenShowing);

  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [hud, setHud] = useState<HudState | null>(null);
  const [overlay, setOverlayState] = useState<Overlay>(null);
  const [popup, setPopup] = useState<PopupItem | null>(null);
  const [floats, setFloats] = useState<FloatItem[]>([]);
  const [banner, setBanner] = useState<BannerItem | null>(null);
  const [worldBanner, setWorldBanner] = useState<BannerItem | null>(null);
  const [fadeKey, setFadeKey] = useState(0);
  const [tutorial, setTutorial] = useState(0);
  const [busy, setBusy] = useState(false);
  const [confetti, setConfetti] = useState(0);
  const [, force] = useState(0);

  const picture = useSharedValue<SkPicture>(useMemo(emptyPicture, []));
  const equippedRef = useRef(equipped);
  equippedRef.current = equipped;

  const run = useMemo(
    () =>
      new RunController(mode, {
        hud: setHud,
        overlay: (o) => {
          setOverlayState(o);
          if (o === 'victory' || o === 'daily' || o === 'boss') setConfetti((c) => c + 1);
        },
        popup: (text, color) => setPopup({ id: nextFxId++, text, color }),
        float: (x, y, text, kind) => setFloats((f) => [...f.slice(-7), { id: nextFxId++, x, y, text, kind }]),
        worldTitle: (index, number) => {
          setFadeKey((k) => k + 1);
          setWorldBanner({ id: nextFxId++, kind: 'world', title: fmt(S.game.world, { n: number }), sub: S.worlds[WORLDS[index]?.id ?? ''] ?? '' });
        },
        bossIntro: (name) => setBanner({ id: nextFxId++, kind: 'boss', title: S.game.bossFight, sub: name }),
        tutorialStep: setTutorial,
      }),
    [mode],
  );
  if (__DEV__ && devStage) run.devStartStage = devStage;

  // Render loop.
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 1 / 60;
      last = t;
      const pic = run.frame(dt, equippedRef.current);
      if (pic) picture.value = pic;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      run.dispose();
    };
  }, [run, picture]);

  const hudTop = insets.top + HUD_HEIGHT + (mode === 'timeAttack' ? TA_EXTRA : 0);

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      if (width <= 0 || height <= 0) return;
      setSize({ w: width, h: height });
      run.setViewport(width, height, hudTop, insets.bottom + 8);
      run.start();
      force((n) => n + 1);
    },
    [run, hudTop, insets.bottom],
  );

  const setOverlay = useCallback((o: Overlay) => run.setOverlay(o), [run]);

  // Pause when the app goes to the background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active' && run.overlay === null && run.started) setOverlay('pause');
    });
    return () => sub.remove();
  }, [run, setOverlay]);

  // Android back: pause → confirm leaving.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (ads.showing) return true;
      const o = run.overlay;
      if (o === null) setOverlay('pause');
      else if (o === 'pause') setOverlay('quit');
      else if (o === 'quit' || o === 'adPower') setOverlay(o === 'quit' ? 'pause' : null);
      return true;
    });
    return () => sub.remove();
  }, [run, setOverlay]);

  // Menu music never plays here; world music starts with the first stage.
  useEffect(() => () => audio.playMusic('menu'), []);

  const leave = useCallback(
    async (dest: '/home' | '/store' | '/daily' | 'retry', withAd: boolean) => {
      if (busy) return;
      setBusy(true);
      run.finalize();
      if (withAd) await ads.maybeInterstitial('runEnd');
      setBusy(false);
      if (dest === 'retry') {
        onRetry();
        return;
      }
      router.dismissTo('/home');
      if (dest !== '/home') router.push(dest);
    },
    [busy, run, onRetry],
  );

  const rewarded = useCallback(
    async (fn: () => void) => {
      if (busy) return;
      setBusy(true);
      await watchForReward(fn);
      setBusy(false);
    },
    [busy],
  );

  const onUsePower = useCallback((id: PowerUpId) => run.usePowerUp(id), [run]);

  const centerY = size ? run.engine.cy * run.scale : 300;
  const showAdPower = !!hud && !hud.adPowerUsed && hud.stage >= 3 && overlay === null;

  return (
    <View style={styles.root} onLayout={onLayout}>
      {size && (
        <Canvas style={{ width: size.w, height: size.h }} pointerEvents="none">
          <Picture picture={picture} />
        </Canvas>
      )}
      <WorldFade trigger={fadeKey} />

      {/* Tap-to-throw layer: everything not covered by a HUD control. */}
      <View
        style={StyleSheet.absoluteFill}
        onStartShouldSetResponder={() => true}
        onResponderGrant={() => run.tap()}
        accessibilityRole="button"
        accessibilityLabel={S.game.tapToThrow}
      />

      <FloatLayer items={floats} onDone={(id) => setFloats((f) => f.filter((x) => x.id !== id))} />
      <Popup item={popup} y={centerY + (size ? run.engine.radius * run.scale : 80) + 30} />
      <StageBanner item={worldBanner} y={hudTop + 4} />
      <StageBanner item={banner} y={centerY - 40} />
      {tutorial > 0 && overlay === null && <TutorialHand throwsLeft={tutorial} y={centerY + (size ? run.engine.radius * run.scale : 80) + 70} />}

      {hud && (
        <>
          <TopHud mode={mode} hud={hud} topInset={insets.top} onPause={() => run.overlay === null && setOverlay('pause')} />
          <KnifeColumn hud={hud} bottomInset={insets.bottom} />
          <PowerRails hud={hud} centerY={centerY} onUse={onUsePower} showAd={showAdPower} onAdPower={() => setOverlay('adPower')} />
        </>
      )}

      <PauseMenu visible={overlay === 'pause'} onResume={() => setOverlay(null)} onHome={() => setOverlay('quit')} />
      <QuitConfirm
        visible={overlay === 'quit'}
        onStay={() => setOverlay('pause')}
        onLeave={() => {
          run.finalize();
          router.dismissTo('/home');
        }}
      />
      <AdPowerPicker
        visible={overlay === 'adPower'}
        stage={hud?.stage ?? 1}
        busy={busy}
        onClose={() => setOverlay(null)}
        onPick={(id) =>
          void rewarded(() => {
            run.setOverlay(null);
            run.grantAdPowerUp(id);
          })
        }
      />
      <GameOverPanel
        visible={overlay === 'gameOver' && !adShowing}
        mode={mode}
        timeUp={run.timeUp}
        stage={run.stage}
        result={run.result}
        points={run.points}
        best={Math.max(best, run.startBest)}
        newBest={run.isNewBest}
        earnedApples={run.earnedApples}
        earnedGems={run.earnedGems}
        canDouble={!run.runDoubled && run.earnedApples > 0}
        canContinue={run.canContinue}
        continuesLeft={run.continuesLeft}
        canAddTime={mode === 'timeAttack' && !run.taAdUsed}
        busy={busy}
        onContinue={() => void rewarded(() => run.continueRun())}
        onAddTime={() => void rewarded(() => run.addTime())}
        onDouble={() =>
          void rewarded(() => {
            const n = run.doubleRun();
            celebrateReward({ apples: n, gems: 0 });
            force((x) => x + 1);
          })
        }
        onRetry={() => void leave('retry', true)}
        onHome={() => void leave('/home', true)}
        onStore={() => void leave('/store', true)}
        onFinishDaily={() => {
          run.finalize();
          run.setOverlay('daily');
        }}
      />
      {overlay === 'gameOver' && !adShowing && (
        <View style={[styles.topBanner, { paddingTop: insets.top }]} pointerEvents="box-none">
          <BannerSlot position="top" />
        </View>
      )}
      <BossDefeatedPanel
        visible={overlay === 'boss'}
        result={run.bossResult}
        busy={busy}
        onDouble={() =>
          void rewarded(() => {
            const n = run.doubleBoss();
            celebrateReward({ apples: n, gems: 0 });
            force((x) => x + 1);
          })
        }
        onNext={() => void run.continueAfterBoss()}
      />
      <VictoryPanel visible={overlay === 'victory'} reward={run.victoryReward} onAgain={() => void leave('retry', true)} onHome={() => void leave('/home', true)} />
      <DailyResultsPanel
        visible={overlay === 'daily'}
        cleared={run.stagesCleared}
        result={run.dailyResult}
        streak={streak}
        onHome={() => void leave('/home', true)}
        onDaily={() => void leave('/daily', true)}
      />
      <Confetti burstKey={confetti} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: game.bgDeep,
    overflow: 'hidden',
  },
  topBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: game.overlay,
  },
});
