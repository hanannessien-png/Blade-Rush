/** In-game HUD: stage progress, balances, score + power meter, knives left, power-ups. */
import { LinearGradient } from 'expo-linear-gradient';
import React, { memo, useEffect, useRef, useSyncExternalStore } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { game } from '@/constants/colors';
import type { KnifeSize } from '../../config/difficulty';
import { POWERUP_ORDER, type ModeId, type PowerUpId } from '../../game/types';
import { useGame } from '../../state/store';
import { fmt, S } from '../../strings';
import { CurrencyPill } from '../components/CurrencyPill';
import { feedbackTap, RoundButton } from '../components/GlossyButton';
import { Icon, type IconName } from '../components/Icon';
import { BodyText, DisplayText } from '../components/Typography';
import { unlockStageOf, type RunController } from './runController';

export const POWERUP_ICON: Record<PowerUpId, IconName> = {
  slowmo: 'hourglass',
  freeze: 'snowflake',
  aim: 'crosshair',
  extra: 'extra',
  shield: 'shield',
  sweep: 'sweep',
};

function stageLabel(mode: ModeId, stage: number): string {
  if (mode === 'fixed') return fmt(S.game.stageOf, { n: stage, max: 30 });
  if (mode === 'daily') return fmt(S.game.stageOf, { n: stage, max: 10 });
  return fmt(S.game.stage, { n: stage });
}

const StageDots = memo(function StageDots({ current, isBoss }: { current: number; isBoss: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
  return (
    <View style={styles.dots}>
      {[1, 2, 3, 4, 5].map((i) => {
        const done = i < current;
        const now = i === current;
        if (i === 5) {
          return (
            <Animated.View key={i} style={now ? { transform: [{ scale }] } : null}>
              <View style={[styles.skull, now && isBoss && styles.skullNow, done && styles.dotDone]}>
                <Icon name="skull" size={18} color={now ? game.white : done ? game.outline : game.textMute} detail={now ? game.danger : game.surfaceLo} />
              </View>
            </Animated.View>
          );
        }
        return (
          <Animated.View key={i} style={[styles.dot, done && styles.dotDone, now && styles.dotNow, now ? { transform: [{ scale }] } : null]} />
        );
      })}
    </View>
  );
});

/**
 * Every in-game HUD element. It subscribes to the run controller itself, so a
 * HUD change never re-renders the game screen, and each part is memoized so a
 * score change does not redraw the knife column or the power-up rails.
 */
export function HudLayer({
  run,
  mode,
  topInset,
  bottomInset,
  centerY,
  overlayOpen,
  onPause,
  onUse,
  onAdPower,
}: {
  run: RunController;
  mode: ModeId;
  topInset: number;
  bottomInset: number;
  centerY: number;
  overlayOpen: boolean;
  onPause(): void;
  onUse(id: PowerUpId): void;
  onAdPower(): void;
}) {
  const hud = useSyncExternalStore(run.subscribeHud, run.getHud, run.getHud);
  if (!hud) return null;
  const a = hud.active;
  const activeKey = `${a.slowmo ? 's' : ''}${a.freeze ? 'f' : ''}${a.aim ? 'a' : ''}${a.extra ? 'e' : ''}${a.shield ? 'h' : ''}`;
  return (
    <>
      <View style={[styles.top, { paddingTop: topInset + 6 }]} pointerEvents="box-none">
        <View style={styles.row} pointerEvents="box-none">
          <RoundButton icon="pause" size={44} onPress={onPause} accessibilityLabel={S.game.paused} />
          <StageHeader mode={mode} stage={hud.stage} stageInWorld={hud.stageInWorld} isBoss={hud.isBoss} />
          <Balances />
        </View>
        <MeterRow points={hud.points} meter={hud.meter} threshold={hud.threshold} charges={hud.charges} />
        {mode === 'timeAttack' && <Timer timeLeft={hud.timeLeft} />}
      </View>
      <KnifeColumn sizes={hud.sizes} used={hud.used} spares={hud.spares} bottomInset={bottomInset} />
      <PowerRails
        stage={hud.stage}
        charges={hud.charges}
        usesLeft={hud.usesLeft}
        activeKey={activeKey}
        centerY={centerY}
        onUse={onUse}
        showAd={!hud.adPowerUsed && hud.stage >= 3 && !overlayOpen}
        onAdPower={onAdPower}
      />
    </>
  );
}

const StageHeader = memo(function StageHeader({ mode, stage, stageInWorld, isBoss }: { mode: ModeId; stage: number; stageInWorld: number; isBoss: boolean }) {
  return (
    <View style={styles.center} pointerEvents="none">
      <DisplayText size={18} stroke={1.5} color={isBoss ? game.danger : game.white}>
        {isBoss ? S.game.bossFight : stageLabel(mode, stage)}
      </DisplayText>
      <StageDots current={stageInWorld} isBoss={isBoss} />
    </View>
  );
});

const Balances = memo(function Balances() {
  const apples = useGame((s) => s.apples);
  const gems = useGame((s) => s.gems);
  return (
    <View style={styles.pills} pointerEvents="none">
      <CurrencyPill kind="apples" value={apples} compact />
      <CurrencyPill kind="gems" value={gems} compact />
    </View>
  );
});

const MeterRow = memo(function MeterRow({ points, meter, threshold, charges }: { points: number; meter: number; threshold: number; charges: number }) {
  const meterP = charges >= 3 ? 1 : threshold > 0 ? meter / threshold : 0;
  return (
    <View style={styles.meterRow} pointerEvents="none">
      <BodyText size={15} weight="black" color={game.white} shadow style={styles.points}>
        {fmt(S.game.points, { n: points.toLocaleString('en-US') })}
      </BodyText>
      <View style={styles.meterTrack}>
        <LinearGradient
          colors={METER_COLORS}
          start={H_START}
          end={H_END}
          style={[styles.meterFill, { width: `${Math.max(0, Math.min(1, meterP)) * 100}%` }]}
        />
        <Icon name="bolt" size={14} color={game.white} outline />
      </View>
      <View style={[styles.charges, charges > 0 && styles.chargesOn]}>
        <BodyText size={13} weight="black" color={charges > 0 ? game.outline : game.textMute}>
          {fmt(S.game.charges, { n: charges })}
        </BodyText>
      </View>
    </View>
  );
});

const METER_COLORS = [game.mint, game.teal] as const;
const H_START = { x: 0, y: 0 };
const H_END = { x: 1, y: 0 };

const Timer = memo(function Timer({ timeLeft }: { timeLeft: number }) {
  const lowTime = timeLeft <= 10;
  return (
    <View style={styles.timer} pointerEvents="none">
      <Icon name="stopwatch" size={26} color={lowTime ? game.danger : game.white} detail={game.surfaceLo} />
      <DisplayText size={34} color={lowTime ? game.danger : game.white}>
        {fmt(S.timeAttack.timeLeft, { t: timeLeft })}
      </DisplayText>
    </View>
  );
});

const SIZE_W: Record<KnifeSize, number> = { small: 0.8, normal: 1, wide: 1.35 };

const KnifeColumn = memo(function KnifeColumn({ sizes, used: usedCount, spares, bottomInset }: { sizes: KnifeSize[]; used: number; spares: number; bottomInset: number }) {
  return (
    <View style={[styles.knives, { bottom: bottomInset + 18 }]} pointerEvents="none">
      {spares > 0 && (
        <View style={styles.spares}>
          <Icon name="extra" size={16} color={game.gem} />
          <BodyText size={13} weight="black" color={game.gem}>
            {`+${spares}`}
          </BodyText>
        </View>
      )}
      <View style={styles.knifeCol}>
        {sizes.map((size, i) => {
          const used = i < usedCount;
          const next = i === usedCount;
          return (
            <View key={i} style={[styles.knifeItem, { opacity: used ? 0.3 : 1, transform: [{ scaleY: SIZE_W[size] }, { rotate: '90deg' }] }]}>
              <Icon name="knife" size={next ? 28 : 24} color={used ? game.textMute : next ? game.gold : game.white} />
            </View>
          );
        })}
      </View>
    </View>
  );
});

interface RailProps {
  stage: number;
  charges: number;
  usesLeft: number;
  activeKey: string;
  centerY: number;
  onUse(id: PowerUpId): void;
  onAdPower(): void;
  showAd: boolean;
}

const ACTIVE_CODE: Record<PowerUpId, string> = { slowmo: 's', freeze: 'f', aim: 'a', extra: 'e', shield: 'h', sweep: '-' };

const PowerButton = memo(function PowerButton({ id, locked, active, usable, onUse }: { id: PowerUpId; locked: boolean; active: boolean; usable: boolean; onUse(id: PowerUpId): void }) {
  const unlockAt = unlockStageOf(id);
  const skin = locked ? game.buttons.disabled : usable ? game.buttons.secondary : game.buttons.dark;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={locked ? fmt(S.powerups.unlocksAt, { n: unlockAt }) : S.powerups[id].name}
      accessibilityState={{ disabled: !usable }}
      onPress={() => {
        if (!usable) return;
        feedbackTap();
        onUse(id);
      }}
      hitSlop={4}
    >
      <View style={[styles.pBtn, { backgroundColor: skin.edge }, active && styles.pActive]}>
        <LinearGradient colors={[skin.top, skin.bottom]} style={styles.pBody}>
          <Icon name={POWERUP_ICON[id]} size={26} color={locked ? game.textMute : game.white} outline={!locked} detail={skin.bottom} />
          {locked && (
            <View style={styles.pLock}>
              <Icon name="lock" size={11} color={game.white} detail={game.outline} />
              <BodyText size={10} weight="black" color={game.white}>
                {String(unlockAt)}
              </BodyText>
            </View>
          )}
        </LinearGradient>
      </View>
    </Pressable>
  );
});

const PowerRails = memo(function PowerRails({ stage, charges, usesLeft, activeKey, centerY, onUse, onAdPower, showAd }: RailProps) {
  const button = (id: PowerUpId) => {
    const locked = stage < unlockStageOf(id);
    return (
      <PowerButton
        key={id}
        id={id}
        locked={locked}
        active={activeKey.includes(ACTIVE_CODE[id])}
        usable={!locked && charges > 0 && usesLeft > 0}
        onUse={onUse}
      />
    );
  };
  const left = POWERUP_ORDER.slice(0, 3);
  const right = POWERUP_ORDER.slice(3);
  const top = centerY - 95;
  return (
    <>
      <View style={[styles.rail, styles.railLeft, { top }]} pointerEvents="box-none">
        {left.map(button)}
      </View>
      <View style={[styles.rail, styles.railRight, { top }]} pointerEvents="box-none">
        {right.map(button)}
        {showAd && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={S.game.adPowerTitle}
            onPress={() => {
              feedbackTap();
              onAdPower();
            }}
            style={styles.adBtn}
            hitSlop={4}
          >
            <Icon name="ad" size={18} color={game.outline} detail={game.gold} />
            <Icon name="plus" size={12} color={game.outline} />
          </Pressable>
        )}
      </View>
    </>
  );
});

const styles = StyleSheet.create({
  top: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  pills: {
    alignItems: 'flex-end',
    gap: 4,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 3,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: game.surfaceLo,
    borderWidth: 2,
    borderColor: game.textMute,
  },
  dotDone: {
    backgroundColor: game.gold,
    borderColor: game.outline,
  },
  dotNow: {
    backgroundColor: game.white,
    borderColor: game.outline,
  },
  skull: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: game.surfaceLo,
    borderWidth: 2,
    borderColor: game.textMute,
  },
  skullNow: {
    backgroundColor: game.danger,
    borderColor: game.outline,
  },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  points: {
    minWidth: 76,
    textAlign: 'right',
  },
  meterTrack: {
    width: 130,
    height: 16,
    borderRadius: 8,
    backgroundColor: game.surfaceLo,
    borderWidth: 2,
    borderColor: game.outline,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  meterFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  charges: {
    minWidth: 34,
    paddingHorizontal: 6,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: game.surfaceLo,
    borderWidth: 2,
    borderColor: game.outline,
  },
  chargesOn: {
    backgroundColor: game.mint,
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  knives: {
    position: 'absolute',
    left: 12,
    alignItems: 'flex-start',
  },
  spares: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 4,
  },
  knifeCol: {
    flexDirection: 'column-reverse',
    alignItems: 'center',
  },
  knifeItem: {
    marginVertical: -7,
  },
  rail: {
    position: 'absolute',
    gap: 10,
    alignItems: 'center',
  },
  railLeft: {
    left: 8,
  },
  railRight: {
    right: 8,
  },
  pBtn: {
    width: 50,
    height: 54,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: game.outline,
  },
  pActive: {
    borderColor: game.gold,
    shadowColor: game.gold,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  pBody: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pLock: {
    position: 'absolute',
    bottom: 1,
    right: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  adBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    paddingHorizontal: 8,
    height: 30,
    borderRadius: 15,
    backgroundColor: game.gold,
    borderWidth: 2,
    borderColor: game.outline,
  },
});
