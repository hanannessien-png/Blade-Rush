/** Main menu: logo, Play, free apples, and the shortcut row. */
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, BackHandler, Easing, Platform, StyleSheet, View } from 'react-native';
import { game } from '@/constants/colors';
import { ECONOMY } from '../../config/economy';
import { dayKey } from '../../game/rng';
import { claimableAchievements, claimableMissions, giftStatus } from '../../state/save';
import { useGame } from '../../state/store';
import { fmt, S } from '../../strings';
import { BannerSlot } from '../components/BannerSlot';
import { CurrencyPill } from '../components/CurrencyPill';
import { GlossyButton, RoundButton } from '../components/GlossyButton';
import { Backdrop, useScreenInsets } from '../components/Screen';
import { BodyText } from '../components/Typography';
import { useNow } from '../hooks';
import { formatDuration, grantReward, watchForReward } from '../rewards';
import { Logo } from './SplashScreen';

/** Free apples from a rewarded ad, with a shared cooldown. */
export function useFreeApples() {
  const readyAt = useGame((s) => s.freeApplesReadyAt);
  const setReadyAt = useGame((s) => s.setFreeApplesReadyAt);
  const now = useNow(1000);
  const waiting = readyAt > now;
  const claim = () =>
    watchForReward(() => {
      grantReward({ apples: ECONOMY.rewardedApples, gems: 0 });
      setReadyAt(Date.now() + ECONOMY.freeApplesCooldownSec * 1000);
    });
  return { waiting, label: waiting ? formatDuration(readyAt - now) : fmt(S.home.freeApples, { n: ECONOMY.rewardedApples }), claim };
}

export function HomeScreen() {
  const insets = useScreenInsets();
  const apples = useGame((s) => s.apples);
  const gems = useGame((s) => s.gems);
  const sound = useGame((s) => s.settings.sound);
  const music = useGame((s) => s.settings.music);
  const setSetting = useGame((s) => s.setSetting);
  const best = useGame((s) => s.stats.endlessBest);
  const unseen = useGame((s) => s.unseen.length);
  const awards = useGame((s) => claimableAchievements(s));
  const missions = useGame((s) => claimableMissions(s));
  const giftReady = useGame((s) => giftStatus(s.gift, dayKey(new Date())).canClaim);
  const dailyReady = useGame((s) => s.daily.attemptsUsed === 0);
  const free = useFreeApples();

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const playScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });

  // Android back on Home leaves the app.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      BackHandler.exitApp();
      return true;
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={styles.root}>
      <Backdrop />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <RoundButton icon="gear" size={44} onPress={() => router.push('/settings')} accessibilityLabel={S.home.settings} />
          <RoundButton
            icon={sound ? 'sound' : 'soundOff'}
            size={44}
            skin={sound ? 'dark' : 'disabled'}
            onPress={() => setSetting('sound', !sound)}
            accessibilityLabel={S.settings.sound}
          />
          <RoundButton
            icon={music ? 'music' : 'musicOff'}
            size={44}
            skin={music ? 'dark' : 'disabled'}
            onPress={() => setSetting('music', !music)}
            accessibilityLabel={S.settings.music}
          />
        </View>
        <View style={styles.headerRight}>
          <CurrencyPill kind="apples" value={apples} onPress={() => router.push('/store')} />
          <CurrencyPill kind="gems" value={gems} onPress={() => router.push('/store')} />
        </View>
      </View>

      <View style={styles.hero}>
        <Logo size={1.05} />
        {best > 1 && (
          <BodyText size={16} weight="black" color={game.textDim} align="center">
            {fmt(S.home.bestEndless, { n: best })}
          </BodyText>
        )}
      </View>

      <View style={styles.actions}>
        <Animated.View style={{ transform: [{ scale: playScale }] }}>
          <GlossyButton label={S.home.play} icon="play" size="lg" skin="primary" onPress={() => router.push('/modes')} style={styles.play} />
        </Animated.View>
        <GlossyButton
          label={free.label}
          icon={free.waiting ? 'clock' : 'ad'}
          size="sm"
          skin={free.waiting ? 'disabled' : 'gold'}
          disabled={free.waiting}
          onPress={() => void free.claim()}
          style={styles.free}
        />
      </View>

      <View style={styles.row}>
        <RoundButton icon="bag" skin="blue" label={S.home.store} badge={unseen} onPress={() => router.push('/store')} accessibilityLabel={S.home.store} />
        <RoundButton icon="trophy" skin="accent" label={S.home.achievements} badge={awards} onPress={() => router.push('/achievements')} accessibilityLabel={S.home.achievements} />
        <RoundButton icon="missions" skin="green" label={S.home.missions} badge={missions} onPress={() => router.push('/missions')} accessibilityLabel={S.home.missions} />
        <RoundButton icon="gift" skin="primary" label={S.home.gift} badge={giftReady} onPress={() => router.push('/gift')} accessibilityLabel={S.home.gift} />
        <RoundButton icon="calendar" skin="secondary" label={S.home.daily} badge={dailyReady} onPress={() => router.push('/daily')} accessibilityLabel={S.home.daily} />
      </View>

      <BannerSlot position="bottom" />
      <View style={{ height: insets.bottom }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: game.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    gap: 8,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actions: {
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 30,
  },
  play: {
    minWidth: 230,
  },
  free: {
    minWidth: 150,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 8,
    marginTop: 26,
    marginBottom: 16,
  },
});
