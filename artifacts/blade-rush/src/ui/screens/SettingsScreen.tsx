/** Sound, music, vibration, reduce motion, privacy options and progress reset. */
import Constants from 'expo-constants';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { game } from '@/constants/colors';
import { ads, useAdStatus } from '../../services/ads/adManager';
import type { Settings } from '../../state/save';
import { useGame } from '../../state/store';
import { fmt, S } from '../../strings';
import { BouncyModal } from '../components/BouncyModal';
import { feedbackTap, GlossyButton } from '../components/GlossyButton';
import { Icon, type IconName } from '../components/Icon';
import { Card, Screen } from '../components/Screen';
import { toast } from '../components/Toasts';
import { BodyText } from '../components/Typography';

function Toggle({ on }: { on: boolean }) {
  const v = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(v, { toValue: on ? 1 : 0, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  }, [on, v]);
  const translateX = v.interpolate({ inputRange: [0, 1], outputRange: [0, 24] });
  return (
    <View style={[styles.track, on && styles.trackOn]}>
      <Animated.View style={[styles.knob, { transform: [{ translateX }] }]} />
    </View>
  );
}

function ToggleRow({ icon, label, k }: { icon: IconName; label: string; k: keyof Settings }) {
  const on = useGame((s) => s.settings[k]);
  const setSetting = useGame((s) => s.setSetting);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      onPress={() => {
        feedbackTap();
        setSetting(k, !on);
      }}
      style={styles.row}
    >
      <Icon name={icon} size={26} color={on ? game.gold : game.textMute} />
      <BodyText size={16} weight="black" color={game.white} style={styles.flex}>
        {label}
      </BodyText>
      <Toggle on={on} />
    </Pressable>
  );
}

export function SettingsScreen() {
  const privacyRequired = useAdStatus((s) => s.privacyOptionsRequired);
  const resetAll = useGame((s) => s.resetAll);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen title={S.settings.title}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.group}>
          <ToggleRow icon="sound" label={S.settings.sound} k="sound" />
          <View style={styles.divider} />
          <ToggleRow icon="music" label={S.settings.music} k="music" />
          <View style={styles.divider} />
          <ToggleRow icon="vibrate" label={S.settings.haptics} k="haptics" />
          <View style={styles.divider} />
          <ToggleRow icon="motion" label={S.settings.reduceMotion} k="reduceMotion" />
        </Card>

        {privacyRequired && (
          <Card style={styles.group}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                feedbackTap();
                void ads.showPrivacyOptions();
              }}
              style={styles.row}
            >
              <Icon name="privacy" size={26} color={game.gem} />
              <View style={styles.flex}>
                <BodyText size={16} weight="black" color={game.white}>
                  {S.settings.privacy}
                </BodyText>
                <BodyText size={12} weight="bold" color={game.textMute}>
                  {S.settings.privacyBody}
                </BodyText>
              </View>
              <Icon name="play" size={16} color={game.textMute} />
            </Pressable>
          </Card>
        )}

        <GlossyButton label={S.settings.reset} icon="trash" skin="danger" size="sm" onPress={() => setStep(1)} style={styles.reset} />

        <BodyText size={12} weight="bold" color={game.textMute} align="center">
          {`${S.appName} · ${fmt(S.settings.version, { v: version })}`}
        </BodyText>
      </ScrollView>

      <BouncyModal visible={step === 1} title={S.settings.resetTitle} titleColor={game.danger} onClose={() => setStep(0)}>
        <BodyText align="center" style={styles.body}>
          {S.settings.resetBody}
        </BodyText>
        <View style={styles.buttons}>
          <GlossyButton label={S.common.cancel} skin="dark" onPress={() => setStep(0)} style={styles.flex} />
          <GlossyButton label={S.settings.resetYes} skin="danger" onPress={() => setStep(2)} style={styles.flex} />
        </View>
      </BouncyModal>
      <BouncyModal visible={step === 2} title={S.settings.resetConfirmTitle} titleColor={game.danger} onClose={() => setStep(0)}>
        <BodyText align="center" style={styles.body}>
          {S.settings.resetConfirmBody}
        </BodyText>
        <View style={styles.buttons}>
          <GlossyButton label={S.common.cancel} skin="dark" onPress={() => setStep(0)} style={styles.flex} />
          <GlossyButton
            label={S.settings.resetYes}
            skin="danger"
            onPress={() => {
              resetAll();
              setStep(0);
              toast(S.settings.resetDone, 'info');
            }}
            style={styles.flex}
          />
        </View>
      </BouncyModal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    gap: 14,
  },
  group: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  divider: {
    height: 1.5,
    backgroundColor: game.stroke,
  },
  track: {
    width: 56,
    height: 32,
    borderRadius: 16,
    padding: 3,
    backgroundColor: game.surfaceLo,
    borderWidth: 2,
    borderColor: game.outline,
  },
  trackOn: {
    backgroundColor: game.success,
  },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: game.white,
    borderWidth: 2,
    borderColor: game.outline,
  },
  reset: {
    alignSelf: 'center',
    marginTop: 10,
  },
  body: {
    marginBottom: 14,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
});
