/** In-game HUD: stage progress, balances, score + power meter, knives left, power-ups. */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
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
import { unlockStageOf, type HudState } from './runController';

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

function StageDots({ current, isBoss }: { current: number; isBoss: boolean }) {
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
}

interface TopProps {
  mode: ModeId;
  hud: HudState;
  topInset: number;
  onPause(): void;
}

export function TopHud({ mode, hud, topInset, onPause }: TopProps) {
  const apples = useGame((s) => s.apples);
  const gems = useGame((s) => s.gems);
  const meterP = hud.charges >= 3 ? 1 : hud.threshold > 0 ? hud.meter / hud.threshold : 0;
  const lowTime = mode === 'timeAttack' && hud.timeLeft <= 10;
  return (
    <View style={[styles.top, { paddingTop: topInset + 6 }]} pointerEvents="box-none">
      <View style={styles.row} pointerEvents="box-none">
        <RoundButton icon="pause" size={44} onPress={onPause} accessibilityLabel={S.game.paused} />
        <View style={styles.center} pointerEvents="none">
          <DisplayText size={18} stroke={1.5} color={hud.isBoss ? game.danger : game.white}>
            {hud.isBoss ? S.game.bossFight : stageLabel(mode, hud.stage)}
          </DisplayText>
          <StageDots current={hud.stageInWorld} isBoss={hud.isBoss} />
        </View>
        <View style={styles.pills} pointerEvents="none">
          <CurrencyPill kind="apples" value={apples} compact />
          <CurrencyPill kind="gems" value={gems} compact />
        </View>
      </View>
      <View style={styles.meterRow} pointerEvents="none">
        <BodyText size={15} weight="black" color={game.white} shadow style={styles.points}>
          {fmt(S.game.points, { n: hud.points.toLocaleString('en-US') })}
        </BodyText>
        <View style={styles.meterTrack}>
          <LinearGradient
            colors={[game.mint, game.teal]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.meterFill, { width: `${Math.max(0, Math.min(1, meterP)) * 100}%` }]}
          />
          <Icon name="bolt" size={14} color={game.white} outline />
        </View>
        <View style={[styles.charges, hud.charges > 0 && styles.chargesOn]}>
          <BodyText size={13} weight="black" color={hud.charges > 0 ? game.outline : game.textMute}>
            {fmt(S.game.charges, { n: hud.charges })}
          </BodyText>
        </View>
      </View>
      {mode === 'timeAttack' && (
        <View style={styles.timer} pointerEvents="none">
          <Icon name="stopwatch" size={26} color={lowTime ? game.danger : game.white} detail={game.surfaceLo} />
          <DisplayText size={34} color={lowTime ? game.danger : game.white}>
            {fmt(S.timeAttack.timeLeft, { t: hud.timeLeft })}
          </DisplayText>
        </View>
      )}
    </View>
  );
}

const SIZE_W: Record<KnifeSize, number> = { small: 0.8, normal: 1, wide: 1.35 };

export function KnifeColumn({ hud, bottomInset }: { hud: HudState; bottomInset: number }) {
  return (
    <View style={[styles.knives, { bottom: bottomInset + 18 }]} pointerEvents="none">
      {hud.spares > 0 && (
        <View style={styles.spares}>
          <Icon name="extra" size={16} color={game.gem} />
          <BodyText size={13} weight="black" color={game.gem}>
            {`+${hud.spares}`}
          </BodyText>
        </View>
      )}
      <View style={styles.knifeCol}>
        {hud.sizes.map((size, i) => {
          const used = i < hud.used;
          const next = i === hud.used;
          return (
            <View key={i} style={[styles.knifeItem, { opacity: used ? 0.3 : 1, transform: [{ scaleY: SIZE_W[size] }, { rotate: '90deg' }] }]}>
              <Icon name="knife" size={next ? 28 : 24} color={used ? game.textMute : next ? game.gold : game.white} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

interface RailProps {
  hud: HudState;
  centerY: number;
  onUse(id: PowerUpId): void;
  onAdPower(): void;
  showAd: boolean;
}

function PowerButton({ id, hud, onUse }: { id: PowerUpId; hud: HudState; onUse(id: PowerUpId): void }) {
  const unlockAt = unlockStageOf(id);
  const locked = hud.stage < unlockAt;
  const active = hud.active[id];
  const usable = !locked && hud.charges > 0 && hud.usesLeft > 0;
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
}

export function PowerRails({ hud, centerY, onUse, onAdPower, showAd }: RailProps) {
  const left = POWERUP_ORDER.slice(0, 3);
  const right = POWERUP_ORDER.slice(3);
  const top = centerY - 95;
  return (
    <>
      <View style={[styles.rail, styles.railLeft, { top }]} pointerEvents="box-none">
        {left.map((id) => (
          <PowerButton key={id} id={id} hud={hud} onUse={onUse} />
        ))}
      </View>
      <View style={[styles.rail, styles.railRight, { top }]} pointerEvents="box-none">
        {right.map((id) => (
          <PowerButton key={id} id={id} hud={hud} onUse={onUse} />
        ))}
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
}

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
