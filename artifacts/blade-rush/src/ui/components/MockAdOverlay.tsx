/**
 * Preview-only stand-in for full-screen ads (Expo Go and web). It behaves like
 * the real thing: a countdown, then a close button; rewarded ads pay only after
 * the countdown completes.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { game } from '@/constants/colors';
import { AD_POLICY } from '../../config/adPolicy';
import { useMockAds } from '../../services/ads/mockBackend';
import { fmt, S } from '../../strings';
import { GlossyButton } from './GlossyButton';
import { Icon } from './Icon';
import { BodyText, DisplayText } from './Typography';

export function MockAdOverlay() {
  const { visible, kind, finish } = useMockAds();
  const insets = useSafeAreaInsets();
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (!visible || kind === 'privacy') return;
    const total = AD_POLICY.mockAdSeconds[kind];
    setLeft(total);
    const start = Date.now();
    const id = setInterval(() => {
      const remaining = Math.max(0, total - Math.floor((Date.now() - start) / 1000));
      setLeft(remaining);
      if (remaining <= 0) clearInterval(id);
    }, 200);
    return () => clearInterval(id);
  }, [visible, kind]);

  if (!visible) return null;

  if (kind === 'privacy') {
    return (
      <View style={[StyleSheet.absoluteFill, styles.dim]}>
        <View style={styles.privacyCard}>
          <Icon name="privacy" size={44} color={game.gem} />
          <DisplayText size={24}>{S.settings.privacy}</DisplayText>
          <BodyText align="center" color={game.textDim}>
            {S.ads.mockBody}
          </BodyText>
          <GlossyButton label={S.common.close} skin="blue" onPress={() => finish(false)} />
        </View>
      </View>
    );
  }

  const done = left <= 0;
  const rewarded = kind === 'rewarded';
  return (
    <View style={[StyleSheet.absoluteFill, styles.root]}>
      <LinearGradient colors={[game.adTop, game.adMid, game.adBottom]} style={StyleSheet.absoluteFill} />
      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <View style={styles.adTag}>
          <BodyText size={12} weight="black" color={game.outline}>
            {S.ads.label}
          </BodyText>
        </View>
        {done ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={S.ads.close}
            onPress={() => finish(rewarded)}
            style={styles.closeBtn}
            hitSlop={10}
          >
            <Icon name="close" size={22} color={game.white} />
          </Pressable>
        ) : (
          <View style={styles.counter}>
            <BodyText size={13} weight="black" color={game.white}>
              {fmt(rewarded ? S.ads.rewardIn : S.ads.closeIn, { n: left })}
            </BodyText>
          </View>
        )}
      </View>
      <View style={styles.center}>
        <Icon name="ad" size={96} color={game.white} detail="#5A1E8C" />
        <DisplayText size={34}>{S.ads.mockTitle}</DisplayText>
        <BodyText align="center" color={game.textDim} style={styles.body}>
          {S.ads.mockBody}
        </BodyText>
        {rewarded && done && (
          <DisplayText size={24} color={game.gold}>
            {S.ads.rewardReady}
          </DisplayText>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    zIndex: 1000,
    elevation: 1000,
  },
  dim: {
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: game.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  privacyCard: {
    width: '100%',
    maxWidth: 360,
    padding: 22,
    gap: 12,
    borderRadius: 24,
    alignItems: 'center',
    backgroundColor: game.surface,
    borderWidth: 3,
    borderColor: game.strokeHi,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  adTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: game.gold,
  },
  counter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  body: {
    maxWidth: 280,
  },
});
