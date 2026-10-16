/** Celebration burst. Change `burstKey` to fire again. Skipped with Reduce motion. */
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { game } from '@/constants/colors';
import { useGame } from '../../state/store';

const COLORS = [game.gold, game.apple, game.gem, game.success, game.buttons.accent.top, game.white];
const COUNT = 30;

interface Piece {
  dx: number;
  up: number;
  fall: number;
  spin: number;
  color: string;
  w: number;
  h: number;
  delay: number;
}

function makePieces(seed: number): Piece[] {
  let s = seed * 9301 + 49297;
  const r = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: COUNT }, () => ({
    dx: (r() - 0.5) * 340,
    up: 120 + r() * 200,
    fall: 160 + r() * 260,
    spin: (r() - 0.5) * 1440,
    color: COLORS[Math.floor(r() * COLORS.length)],
    w: 7 + r() * 6,
    h: 10 + r() * 8,
    delay: r() * 120,
  }));
}

export function Confetti({ burstKey, originY = 0.35 }: { burstKey: number; originY?: number }) {
  const reduceMotion = useGame((s) => s.settings.reduceMotion);
  const pieces = useMemo(() => makePieces(burstKey + 1), [burstKey]);
  const progress = useRef(pieces.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (burstKey <= 0 || reduceMotion) return;
    const anims = progress.map((p, i) => {
      p.setValue(0);
      return Animated.timing(p, { toValue: 1, duration: 1500, delay: pieces[i].delay, easing: Easing.linear, useNativeDriver: true });
    });
    Animated.parallel(anims).start();
  }, [burstKey, reduceMotion, pieces, progress]);

  if (burstKey <= 0 || reduceMotion) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.root]}>
      <View style={[styles.origin, { top: `${originY * 100}%` }]}>
        {pieces.map((pc, i) => {
          const p = progress[i];
          const translateX = p.interpolate({ inputRange: [0, 1], outputRange: [0, pc.dx] });
          const translateY = p.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, -pc.up, pc.fall] });
          const rotate = p.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${pc.spin}deg`] });
          const opacity = p.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] });
          return (
            <Animated.View
              key={i}
              style={[
                styles.piece,
                { width: pc.w, height: pc.h, backgroundColor: pc.color, opacity, transform: [{ translateX }, { translateY }, { rotate }] },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    zIndex: 800,
    elevation: 800,
  },
  origin: {
    position: 'absolute',
    left: '50%',
    width: 0,
    height: 0,
  },
  piece: {
    position: 'absolute',
    borderRadius: 2,
  },
});
