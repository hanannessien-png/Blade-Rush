/** Transient in-game effects: popups, floating numbers, banners and the tutorial hand. */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { game } from '@/constants/colors';
import { S } from '../../strings';
import { CurrencyIcon } from '../components/CurrencyIcon';
import { Icon } from '../components/Icon';
import { BodyText, DisplayText } from '../components/Typography';
import type { FloatKind } from './runController';

export interface PopupItem {
  id: number;
  text: string;
  color: string;
}

export function Popup({ item, y }: { item: PopupItem | null; y: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!item) return;
    v.setValue(0);
    Animated.sequence([
      Animated.spring(v, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 14 }),
      Animated.delay(550),
      Animated.timing(v, { toValue: 2, duration: 260, useNativeDriver: true }),
    ]).start();
  }, [item, v]);
  if (!item) return null;
  const scale = v.interpolate({ inputRange: [0, 1, 2], outputRange: [0.4, 1, 1.1] });
  const opacity = v.interpolate({ inputRange: [0, 0.3, 1, 2], outputRange: [0, 1, 1, 0] });
  const translateY = v.interpolate({ inputRange: [0, 1, 2], outputRange: [10, 0, -18] });
  return (
    <Animated.View pointerEvents="none" style={[styles.popup, { top: y, opacity, transform: [{ scale }, { translateY }] }]}>
      <DisplayText size={30} color={item.color}>
        {item.text}
      </DisplayText>
    </Animated.View>
  );
}

export interface FloatItem {
  id: number;
  x: number;
  y: number;
  text: string;
  kind: FloatKind;
}

function FloatText({ item, onDone }: { item: FloatItem; onDone(id: number): void }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 950, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(() => onDone(item.id));
  }, [v, item.id, onDone]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, -70] });
  const opacity = v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });
  const scale = v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.6, 1.15, 1] });
  const color = item.kind === 'penalty' ? game.danger : item.kind === 'time' ? game.mint : item.kind === 'gem' ? game.gem : item.kind === 'golden' ? game.gold : game.white;
  return (
    <Animated.View pointerEvents="none" style={[styles.float, { left: item.x - 60, top: item.y - 20, opacity, transform: [{ translateY }, { scale }] }]}>
      {(item.kind === 'apple' || item.kind === 'golden') && <CurrencyIcon kind="apples" size={22} />}
      {item.kind === 'gem' && <CurrencyIcon kind="gems" size={22} />}
      {(item.kind === 'time' || item.kind === 'penalty') && <Icon name="stopwatch" size={20} color={color} detail={game.outline} />}
      <DisplayText size={24} color={color} stroke={2}>
        {item.text}
      </DisplayText>
    </Animated.View>
  );
}

export function FloatLayer({ items, onDone }: { items: FloatItem[]; onDone(id: number): void }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {items.map((f) => (
        <FloatText key={f.id} item={f} onDone={onDone} />
      ))}
    </View>
  );
}

export interface BannerItem {
  id: number;
  kind: 'boss' | 'world';
  title: string;
  sub: string;
}

/** Boss intro (big, centered) and world title (top) banners. */
export function StageBanner({ item, y }: { item: BannerItem | null; y: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!item) return;
    v.setValue(0);
    Animated.sequence([
      Animated.spring(v, { toValue: 1, useNativeDriver: true, speed: 12, bounciness: 9 }),
      Animated.delay(item.kind === 'boss' ? 900 : 1100),
      Animated.timing(v, { toValue: 2, duration: 320, useNativeDriver: true }),
    ]).start();
  }, [item, v]);
  if (!item) return null;
  const boss = item.kind === 'boss';
  const translateX = v.interpolate({ inputRange: [0, 1, 2], outputRange: [-260, 0, 260] });
  const opacity = v.interpolate({ inputRange: [0, 0.5, 1, 1.6, 2], outputRange: [0, 1, 1, 1, 0] });
  return (
    <Animated.View pointerEvents="none" style={[styles.banner, { top: y, opacity, transform: [{ translateX }] }]}>
      <View style={[styles.bannerBand, boss ? styles.bannerBoss : styles.bannerWorld]}>
        {boss && <Icon name="skull" size={30} color={game.white} detail={game.danger} />}
        <View style={styles.bannerText}>
          <DisplayText size={boss ? 34 : 18} color={boss ? game.white : game.gold} stroke={boss ? 3 : 1.5}>
            {item.title}
          </DisplayText>
          <DisplayText size={boss ? 20 : 24} color={boss ? game.gold : game.white} stroke={2}>
            {item.sub}
          </DisplayText>
        </View>
        {boss && <Icon name="skull" size={30} color={game.white} detail={game.danger} />}
      </View>
    </Animated.View>
  );
}

/** Quick dip-to-dark when the world changes. */
export function WorldFade({ trigger }: { trigger: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (trigger <= 1) return;
    v.setValue(1);
    Animated.timing(v, { toValue: 0, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [trigger, v]);
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.fade, { opacity: v }]} />;
}

export function TutorialHand({ throwsLeft, y }: { throwsLeft: number; y: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 520, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(200),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v]);
  if (throwsLeft <= 0) return null;
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [0, 16] });
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.88] });
  return (
    <View pointerEvents="none" style={[styles.tutorial, { top: y }]}>
      <View style={styles.tutorialBubble}>
        <BodyText size={16} weight="black" color={game.white} align="center">
          {throwsLeft === 3 ? S.tutorial.tap : S.tutorial.avoid}
        </BodyText>
      </View>
      <Animated.View style={{ transform: [{ translateY }, { scale }] }}>
        <HandGlyph />
      </Animated.View>
    </View>
  );
}

function HandGlyph() {
  return (
    <View style={styles.hand}>
      <View style={styles.handFinger} />
      <View style={styles.handPalm} />
    </View>
  );
}

const styles = StyleSheet.create({
  popup: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  float: {
    position: 'absolute',
    width: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bannerBand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 22,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: game.outline,
  },
  bannerBoss: {
    backgroundColor: game.crimson,
  },
  bannerWorld: {
    backgroundColor: 'rgba(11, 19, 64, 0.82)',
    borderColor: game.strokeHi,
  },
  bannerText: {
    alignItems: 'center',
  },
  fade: {
    backgroundColor: game.bgDeep,
  },
  tutorial: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 10,
  },
  tutorialBubble: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(5, 8, 38, 0.75)',
    borderWidth: 2,
    borderColor: game.strokeHi,
  },
  hand: {
    width: 46,
    height: 62,
    alignItems: 'center',
  },
  handFinger: {
    width: 16,
    height: 30,
    borderRadius: 8,
    backgroundColor: game.white,
    borderWidth: 3,
    borderColor: game.outline,
    zIndex: 1,
  },
  handPalm: {
    width: 40,
    height: 36,
    marginTop: -8,
    borderRadius: 14,
    backgroundColor: game.white,
    borderWidth: 3,
    borderColor: game.outline,
  },
});
