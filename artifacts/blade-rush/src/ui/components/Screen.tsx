/**
 * Shared menu-screen frame: twilight gradient backdrop, a header with a back
 * button, title and balances, and the reserved banner strip.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { game } from '@/constants/colors';
import type { BannerPosition } from '../../config/adPolicy';
import { useGame } from '../../state/store';
import { BannerSlot } from './BannerSlot';
import { CurrencyPill } from './CurrencyPill';
import { RoundButton } from './GlossyButton';
import { Icon } from './Icon';
import { DisplayText } from './Typography';

/** Safe-area insets with the web preview's status bar / home bar allowance. */
export function useScreenInsets() {
  const i = useSafeAreaInsets();
  if (Platform.OS === 'web') return { ...i, top: Math.max(i.top, 67), bottom: Math.max(i.bottom, 34) };
  return i;
}

const STARS: readonly [number, number, number][] = [
  [0.08, 0.12, 3], [0.22, 0.05, 2], [0.4, 0.15, 2.5], [0.63, 0.07, 3], [0.82, 0.16, 2], [0.93, 0.05, 2.5],
  [0.15, 0.32, 2], [0.88, 0.36, 3], [0.05, 0.55, 2.5], [0.95, 0.6, 2], [0.12, 0.8, 2], [0.86, 0.85, 2.5],
];

export function Backdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={[game.bgTop, game.bg, game.bgDeep]} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.glow} />
      {STARS.map(([x, y, r], i) => (
        <View
          key={i}
          style={[styles.star, { left: `${x * 100}%`, top: `${y * 100}%`, width: r * 2, height: r * 2, borderRadius: r, opacity: 0.25 + (i % 3) * 0.15 }]}
        />
      ))}
    </View>
  );
}

interface Props {
  title?: string;
  back?: boolean;
  onBack?: () => void;
  currency?: boolean;
  banner?: BannerPosition;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({ title, back = true, onBack, currency = true, banner = 'bottom', children, headerRight, contentStyle }: Props) {
  const insets = useScreenInsets();
  const apples = useGame((s) => s.apples);
  const gems = useGame((s) => s.gems);
  const goBack = onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/home')));

  return (
    <View style={styles.root}>
      <Backdrop />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {back ? <RoundButton icon="back" size={44} skin="dark" onPress={goBack} accessibilityLabel="Back" /> : <View style={styles.headerSpacer} />}
        <View style={styles.headerRight}>
          {headerRight}
          {currency && (
            <>
              <CurrencyPill kind="apples" value={apples} compact />
              <CurrencyPill kind="gems" value={gems} compact />
            </>
          )}
        </View>
      </View>
      {title !== undefined && (
        <DisplayText size={32} color={game.gold} containerStyle={styles.title}>
          {title}
        </DisplayText>
      )}
      {banner === 'top' && <BannerSlot position="top" />}
      <View style={[styles.content, contentStyle]}>{children}</View>
      {banner === 'bottom' && <BannerSlot position="bottom" />}
      <View style={{ height: insets.bottom }} />
    </View>
  );
}

/** Section card used across menus. */
export function Card({ children, style, highlight }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; highlight?: string }) {
  return <View style={[styles.card, highlight ? { borderColor: highlight } : null, style]}>{children}</View>;
}

export function ProgressBar({ value, max, color = game.success, height = 14 }: { value: number; max: number; color?: string; height?: number }) {
  const p = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <View style={[styles.barTrack, { height, borderRadius: height / 2 }]}>
      <View style={[styles.barFill, { width: `${p * 100}%`, minWidth: p > 0 ? 8 : 0, backgroundColor: color, borderRadius: height / 2 }]}>
        <View style={[styles.barShine, { borderRadius: height / 2 }]} />
      </View>
    </View>
  );
}

export function SectionTitle({ children, icon }: { children: string; icon?: React.ComponentProps<typeof Icon>['name'] }) {
  return (
    <View style={styles.section}>
      {icon && <Icon name={icon} size={20} color={game.gold} />}
      <DisplayText size={20} align="left" stroke={1.5}>
        {children}
      </DisplayText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: game.bg,
  },
  glow: {
    position: 'absolute',
    top: -160,
    alignSelf: 'center',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(120, 90, 255, 0.16)',
  },
  star: {
    position: 'absolute',
    backgroundColor: game.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  headerSpacer: {
    width: 44,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    marginTop: 2,
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: game.surface,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: game.stroke,
    padding: 14,
  },
  barTrack: {
    alignSelf: 'stretch',
    backgroundColor: game.surfaceLo,
    borderWidth: 2,
    borderColor: game.outline,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
  },
  barShine: {
    position: 'absolute',
    top: 1,
    left: 3,
    right: 3,
    height: '38%',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
});
