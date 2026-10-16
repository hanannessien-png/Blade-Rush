/** Mode select: four big cards. */
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { game, type ButtonSkin } from '@/constants/colors';
import { DIFFICULTY } from '../../config/difficulty';
import type { ModeId } from '../../game/types';
import { useGame } from '../../state/store';
import { fmt, S } from '../../strings';
import { feedbackTap, usePressAnim } from '../components/GlossyButton';
import { Icon, type IconName } from '../components/Icon';
import { Screen } from '../components/Screen';
import { BodyText, DisplayText } from '../components/Typography';

interface ModeCardProps {
  icon: IconName;
  skin: ButtonSkin;
  name: string;
  desc: string;
  info: string;
  extra?: string;
  onPress(): void;
}

function ModeCard({ icon, skin, name, desc, info, extra, onPress }: ModeCardProps) {
  const C = game.buttons[skin];
  const { v, pressIn, pressOut } = usePressAnim();
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.97] });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={() => {
        feedbackTap();
        onPress();
      }}
    >
      <Animated.View style={[styles.cardLip, { backgroundColor: C.edge, transform: [{ scale }] }]}>
        <LinearGradient colors={[C.top, C.bottom]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          <View style={styles.shine} pointerEvents="none" />
          <View style={[styles.iconWrap, { backgroundColor: C.edge }]}>
            <Icon name={icon} size={40} color={game.white} outline />
          </View>
          <View style={styles.text}>
            <DisplayText size={26} align="left" color={C.text} stroke={2}>
              {name}
            </DisplayText>
            <BodyText size={14} weight="bold" color={C.text} shadow>
              {desc}
            </BodyText>
            <View style={styles.infoRow}>
              <View style={styles.infoPill}>
                <BodyText size={12} weight="black" color={game.white}>
                  {info}
                </BodyText>
              </View>
              {extra !== undefined && (
                <View style={styles.infoPill}>
                  <BodyText size={12} weight="black" color={game.white}>
                    {extra}
                  </BodyText>
                </View>
              )}
            </View>
          </View>
          <Icon name="play" size={26} color={game.white} outline />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const start = (mode: ModeId) => router.push(`/game/${mode}`);

export function ModesScreen() {
  const stats = useGame((s) => s.stats);
  const streak = useGame((s) => s.daily.streak);
  return (
    <Screen title={S.modes.title}>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <ModeCard
          icon="infinity"
          skin="blue"
          name={S.modes.endless.name}
          desc={S.modes.endless.desc}
          info={fmt(S.modes.endless.best, { n: stats.endlessBest })}
          onPress={() => start('endless')}
        />
        <ModeCard
          icon="flag"
          skin="primary"
          name={S.modes.fixed.name}
          desc={S.modes.fixed.desc}
          info={fmt(S.modes.fixed.best, { n: stats.fixedBest, max: DIFFICULTY.fixedRunStages })}
          extra={stats.fixedWins > 0 ? fmt(S.modes.fixed.won, { n: stats.fixedWins }) : undefined}
          onPress={() => start('fixed')}
        />
        <ModeCard
          icon="calendar"
          skin="accent"
          name={S.modes.daily.name}
          desc={S.modes.daily.desc}
          info={fmt(S.modes.daily.best, { n: streak })}
          onPress={() => router.push('/daily')}
        />
        <ModeCard
          icon="stopwatch"
          skin="green"
          name={S.modes.timeAttack.name}
          desc={S.modes.timeAttack.desc}
          info={fmt(S.modes.timeAttack.best, { n: stats.timeAttackBest })}
          onPress={() => start('timeAttack')}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 14,
  },
  cardLip: {
    borderRadius: 24,
    paddingBottom: 6,
    borderWidth: 2,
    borderColor: game.outline,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 22,
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  infoPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(10, 8, 40, 0.35)',
  },
});
