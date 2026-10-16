/** Daily Challenge hub: today's attempt, streak and milestone rewards. */
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { game } from '@/constants/colors';
import { ECONOMY } from '../../config/economy';
import { useGame } from '../../state/store';
import { fmt, S } from '../../strings';
import { CurrencyIcon } from '../components/CurrencyIcon';
import { GlossyButton } from '../components/GlossyButton';
import { Icon } from '../components/Icon';
import { Card, ProgressBar, Screen } from '../components/Screen';
import { BodyText, DisplayText } from '../components/Typography';
import { useNow } from '../hooks';
import { formatDuration, msUntilTomorrow, watchForReward } from '../rewards';

export function DailyScreen() {
  const daily = useGame((s) => s.daily);
  const startDaily = useGame((s) => s.startDaily);
  const rollover = useGame((s) => s.rollover);
  const now = useNow(1000);
  const left = msUntilTomorrow(new Date(now));
  if (left < 1500) rollover();

  const freeAvailable = daily.attemptsUsed === 0;
  const extraAvailable = !freeAvailable && !daily.extraUsed;

  const play = () => {
    if (startDaily(false)) router.push('/game/daily');
  };
  const playExtra = () =>
    void watchForReward(() => {
      if (startDaily(true)) router.push('/game/daily');
    });

  return (
    <Screen title={S.dailyChallenge.title}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BodyText size={15} weight="bold" color={game.textDim} align="center">
          {S.dailyChallenge.subtitle}
        </BodyText>

        <Card style={styles.hero}>
          <View style={styles.streakBadge}>
            <Icon name="calendar" size={40} color={game.gold} detail={game.outline} outline />
            <View>
              <DisplayText size={40} align="left">
                {String(daily.streak)}
              </DisplayText>
              <BodyText size={13} weight="black" color={game.textDim}>
                {S.dailyChallenge.streak}
              </BodyText>
            </View>
          </View>
          <View style={styles.best}>
            <BodyText size={14} weight="black" color={game.white}>
              {fmt(S.dailyChallenge.bestToday, { n: daily.bestToday })}
            </BodyText>
            <ProgressBar value={daily.bestToday} max={ECONOMY.dailyChallengeStages} color={daily.completedToday ? game.gold : game.success} />
            {daily.completedToday && (
              <BodyText size={13} weight="black" color={game.gold}>
                {S.dailyChallenge.complete}
              </BodyText>
            )}
          </View>
        </Card>

        <View style={styles.actions}>
          {freeAvailable ? (
            <GlossyButton label={S.common.play} icon="play" size="lg" skin="primary" sub={S.dailyChallenge.attempts} onPress={play} />
          ) : extraAvailable ? (
            <>
              <BodyText size={13} weight="bold" color={game.textDim} align="center">
                {S.dailyChallenge.attemptUsed}
              </BodyText>
              <GlossyButton label={S.dailyChallenge.extraAttempt} icon="ad" size="md" skin="gold" onPress={playExtra} />
            </>
          ) : (
            <BodyText size={14} weight="black" color={game.textDim} align="center">
              {S.dailyChallenge.extraUsed}
            </BodyText>
          )}
          <View style={styles.timer}>
            <Icon name="clock" size={18} color={game.textMute} />
            <BodyText size={13} weight="black" color={game.textMute}>
              {fmt(S.dailyChallenge.newDay, { t: formatDuration(left) })}
            </BodyText>
          </View>
        </View>

        <Card style={styles.rewards}>
          <BodyText size={13} weight="bold" color={game.textDim} align="center">
            {fmt(S.dailyChallenge.rewardsInfo, { a: ECONOMY.dailyApplesPerStage, g: ECONOMY.dailyCompletionGems })}
          </BodyText>
          {ECONOMY.dailyStreakMilestones.map((m) => {
            const got = daily.milestonesClaimed.includes(m.days);
            return (
              <View key={m.days} style={styles.milestone}>
                <Icon name={got ? 'check' : 'star'} size={18} color={got ? game.success : game.gold} />
                <BodyText size={14} weight="black" color={got ? game.textMute : game.white} style={styles.flex}>
                  {fmt(S.dailyChallenge.milestone, { d: m.days, g: m.gems })}
                </BodyText>
                <CurrencyIcon kind="gems" size={18} />
              </View>
            );
          })}
        </Card>
      </ScrollView>
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
  hero: {
    gap: 14,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  best: {
    gap: 6,
  },
  actions: {
    alignItems: 'center',
    gap: 10,
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewards: {
    gap: 10,
  },
  milestone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
