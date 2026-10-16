/** 14 achievement families × Bronze / Silver / Gold. */
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { game } from '@/constants/colors';
import { ECONOMY } from '../../config/economy';
import { ACHIEVEMENT_FAMILIES, ACHIEVEMENTS, TIERS, type AchievementFamily, type Tier } from '../../data/achievements';
import { achievementValue } from '../../state/save';
import { useGame } from '../../state/store';
import { fmt, S } from '../../strings';
import { CurrencyIcon } from '../components/CurrencyIcon';
import { GlossyButton } from '../components/GlossyButton';
import { Icon } from '../components/Icon';
import { Card, ProgressBar, Screen } from '../components/Screen';
import { BodyText } from '../components/Typography';
import { celebrateReward } from '../rewards';

function Medal({ tier, state }: { tier: Tier; state: 'claimed' | 'ready' | 'locked' }) {
  const T = game.tiers[tier];
  return (
    <View
      style={[
        styles.medal,
        { backgroundColor: state === 'locked' ? game.surfaceLo : T.bottom, borderColor: state === 'locked' ? game.stroke : T.edge },
        state === 'ready' && styles.medalReady,
      ]}
    >
      <Icon name={state === 'claimed' ? 'check' : 'star'} size={14} color={state === 'locked' ? game.textMute : game.white} />
    </View>
  );
}

function FamilyCard({ f }: { f: AchievementFamily }) {
  const value = useGame((s) => achievementValue(s, f.metric));
  const claimedIds = useGame((s) => s.achievementsClaimed);
  const claimAchievement = useGame((s) => s.claimAchievement);
  const ids = TIERS.map((t) => `${f.metric}_${t}`);
  const defs = ids.map((id) => ACHIEVEMENTS.find((a) => a.id === id)!);
  const nextIdx = defs.findIndex((d) => !claimedIds.includes(d.id));
  const allDone = nextIdx === -1;
  const current = defs[allDone ? 2 : nextIdx];
  const ready = !allDone && value >= current.target;
  const reward = ECONOMY.achievementReward[current.tier];
  const text = S.achievements[f.metric];

  return (
    <Card style={styles.card} highlight={ready ? game.gold : undefined}>
      <View style={styles.top}>
        <View style={styles.flex}>
          <BodyText size={16} weight="black" color={game.white}>
            {text?.title ?? f.metric}
          </BodyText>
          <BodyText size={13} weight="bold" color={game.textDim}>
            {fmt(text?.desc ?? '', { n: current.target.toLocaleString('en-US') })}
          </BodyText>
        </View>
        <View style={styles.medals}>
          {defs.map((d, i) => (
            <Medal key={d.id} tier={TIERS[i]} state={claimedIds.includes(d.id) ? 'claimed' : value >= d.target ? 'ready' : 'locked'} />
          ))}
        </View>
      </View>
      <View style={styles.bottom}>
        <View style={styles.flex}>
          <ProgressBar value={Math.min(value, current.target)} max={current.target} color={game.tiers[current.tier].bottom} />
          <BodyText size={12} weight="black" color={game.textMute}>
            {fmt(S.achievementsScreen.progress, { n: Math.min(value, current.target).toLocaleString('en-US'), max: current.target.toLocaleString('en-US') })}
          </BodyText>
        </View>
        {allDone ? (
          <BodyText size={13} weight="black" color={game.success}>
            {S.common.claimed}
          </BodyText>
        ) : (
          <GlossyButton
            size="sm"
            skin={ready ? 'gold' : 'disabled'}
            disabled={!ready}
            label={reward.gems > 0 ? `+${reward.gems}` : `+${reward.apples}`}
            iconRight={<CurrencyIcon kind={reward.gems > 0 ? 'gems' : 'apples'} size={18} />}
            accessibilityLabel={S.common.claim}
            onPress={() => celebrateReward(claimAchievement(current.id))}
          />
        )}
      </View>
    </Card>
  );
}

export function AchievementsScreen() {
  const claimed = useGame((s) => s.achievementsClaimed.length);
  return (
    <Screen title={S.achievementsScreen.title}>
      <BodyText size={14} weight="black" color={game.textDim} align="center" style={styles.sub}>
        {fmt(S.achievementsScreen.unlocked, { n: claimed, max: ACHIEVEMENTS.length })}
      </BodyText>
      <FlatList
        data={ACHIEVEMENT_FAMILIES}
        keyExtractor={(f) => f.metric}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <FamilyCard f={item} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  sub: {
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    gap: 10,
  },
  card: {
    gap: 10,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  medals: {
    flexDirection: 'row',
    gap: 4,
  },
  medal: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalReady: {
    borderColor: game.white,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
