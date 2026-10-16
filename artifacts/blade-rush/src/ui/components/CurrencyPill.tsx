/** Apple and gem counters with a count-up animation and an icon bounce on gains. */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { fonts, game } from '@/constants/colors';
import { CurrencyIcon, type Currency } from './CurrencyIcon';
import { Icon } from './Icon';
import { BodyText } from './Typography';

/** Animates a number from its previous value to the new one. */
export function useCountUp(value: number, durationMs = 650): number {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const shownRef = useRef(value);
  shownRef.current = shown;
  useEffect(() => {
    from.current = shownRef.current;
    if (from.current === value) return;
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / durationMs);
      const e = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from.current + (value - from.current) * e));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, durationMs]);
  return shown;
}

export function formatCount(n: number): string {
  if (n >= 100000) return `${Math.floor(n / 1000)}k`;
  return n.toLocaleString('en-US');
}

interface Props {
  kind: Currency;
  value: number;
  onPress?: () => void;
  compact?: boolean;
}

export function CurrencyPill({ kind, value, onPress, compact }: Props) {
  const shown = useCountUp(value);
  const bounce = useRef(new Animated.Value(1)).current;
  const prev = useRef(value);
  useEffect(() => {
    if (value > prev.current) {
      bounce.setValue(1.35);
      Animated.spring(bounce, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 14 }).start();
    }
    prev.current = value;
  }, [value, bounce]);

  const iconSize = compact ? 26 : 30;
  const body = (
    <View style={[styles.pill, compact && styles.pillCompact]}>
      <Animated.View style={[styles.icon, { transform: [{ scale: bounce }] }]}>
        <CurrencyIcon kind={kind} size={iconSize} />
      </Animated.View>
      <BodyText size={compact ? 15 : 17} weight="black" color={game.white} style={styles.num} numberOfLines={1}>
        {formatCount(shown)}
      </BodyText>
      {onPress && (
        <View style={styles.plus}>
          <Icon name="plus" size={12} color={game.white} />
        </View>
      )}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${value} ${kind}`} onPress={onPress} hitSlop={6}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    paddingLeft: 30,
    paddingRight: 12,
    marginLeft: 14,
    borderRadius: 17,
    backgroundColor: game.surfaceLo,
    borderWidth: 2,
    borderColor: game.outline,
  },
  pillCompact: {
    height: 30,
    paddingLeft: 26,
    paddingRight: 10,
  },
  icon: {
    position: 'absolute',
    left: -14,
  },
  num: {
    fontFamily: fonts.bodyBlack,
    minWidth: 28,
  },
  plus: {
    marginLeft: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: game.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
