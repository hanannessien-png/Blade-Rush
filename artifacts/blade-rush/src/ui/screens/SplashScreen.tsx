/** Branded loading screen: waits for the save, starts ads (consent) and opens Home. */
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { game } from '@/constants/colors';
import { ads } from '../../services/ads/adManager';
import { useGame } from '../../state/store';
import { S } from '../../strings';
import { KnifeImage } from '../components/KnifeImage';
import { Backdrop, useScreenInsets } from '../components/Screen';
import { BodyText, DisplayText } from '../components/Typography';

const MIN_SPLASH_MS = 1400;
const ADS_TIMEOUT_MS = 8000;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function Logo({ size = 1 }: { size?: number }) {
  const equipped = useGame((s) => s.equipped);
  return (
    <View style={styles.logo}>
      <View style={[styles.disc, { width: 170 * size, height: 170 * size, borderRadius: 85 * size }]}>
        <View style={[styles.ring, { width: 120 * size, height: 120 * size, borderRadius: 60 * size }]} />
        <View style={[styles.ring, { width: 70 * size, height: 70 * size, borderRadius: 35 * size }]} />
        <View style={[styles.bull, { width: 24 * size, height: 24 * size, borderRadius: 12 * size }]} />
      </View>
      <KnifeImage id={equipped} size={190 * size} motion="spin" style={styles.knife} />
      <DisplayText size={54 * size} color={game.gold} stroke={4}>
        {S.appName}
      </DisplayText>
    </View>
  );
}

export function SplashScreen() {
  const hydrated = useGame((s) => s.hydrated);
  const mountedAt = useRef(Date.now()).current;
  const bar = useRef(new Animated.Value(0)).current;
  const insets = useScreenInsets();

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(bar, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [bar]);

  useEffect(() => {
    if (!hydrated) return;
    let alive = true;
    void (async () => {
      await sleep(Math.max(0, MIN_SPLASH_MS - (Date.now() - mountedAt)));
      if (!alive) return;
      const st = useGame.getState();
      if (st.ageGroup === null) {
        router.replace('/age');
        return;
      }
      await Promise.race([ads.start(st.ageGroup, st.launches), sleep(ADS_TIMEOUT_MS)]);
      if (!alive) return;
      await ads.maybeAppOpen('cold');
      if (alive) router.replace('/home');
    })();
    return () => {
      alive = false;
    };
  }, [hydrated, mountedAt]);

  const translateX = bar.interpolate({ inputRange: [0, 1], outputRange: [-90, 180] });
  return (
    <View style={styles.root}>
      <Backdrop />
      <View style={styles.center}>
        <Logo />
        <BodyText size={18} weight="black" color={game.textDim} align="center">
          {S.splash.tagline}
        </BodyText>
      </View>
      <View style={[styles.loader, { marginBottom: insets.bottom + 40 }]}>
        <Animated.View style={[styles.loaderFill, { transform: [{ translateX }] }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: game.bg,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  logo: {
    alignItems: 'center',
  },
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: game.wood,
    borderWidth: 6,
    borderColor: game.woodDark,
    marginBottom: -24,
  },
  ring: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: 'rgba(122, 74, 34, 0.55)',
  },
  bull: {
    backgroundColor: game.apple,
    borderWidth: 3,
    borderColor: game.outline,
  },
  knife: {
    position: 'absolute',
    top: -10,
  },
  loader: {
    width: 180,
    height: 12,
    borderRadius: 6,
    backgroundColor: game.surfaceLo,
    borderWidth: 2,
    borderColor: game.outline,
    overflow: 'hidden',
  },
  loaderFill: {
    width: 90,
    height: '100%',
    borderRadius: 6,
    backgroundColor: game.gold,
  },
});
