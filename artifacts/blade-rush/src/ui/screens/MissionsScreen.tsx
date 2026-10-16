/** Three daily missions and the bonus chest. */
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { game } from '@/constants/colors';
import { ECONOMY } from '../../config/economy';
import type { MissionDef } from '../../data/missions';
import { missionDef } from '../../state/save';
import { useGame } from '../../state/store';
import { fmt, S } from '../../strings';
import { CurrencyIcon } from '../components/CurrencyIcon';
import { GlossyButton } from '../components/GlossyButton';
import { Icon } from '../components/Icon';
import { Card, ProgressBar, Screen } from '../components/Screen';
import { BodyText, DisplayText } from '../components/Typography';
import { useNow } from '../hooks';
import { celebrateReward, formatDuration, msUntilTomorrow } from '../rewards';

export function missionText(def: MissionDef): string {
  if (def.metric === 'bossesDefeated' && def.target > 1) return fmt(S.missions.bossesDefeatedPlural, { n: def.target });
  return fmt(S.missions[def.metric] ?? def.metric, { n: def.target });
}

function MissionCard({ id }: { id: string }) {
  const def = missionDef(id);
  const progress = useGame((s) => s.missions.progress[id] ?? 0);
  const claimed = useGame((s) => s.missions.claimed.includes(id));
  const claimMission = useGame((s) => s.claimMission);
  if (!def) return null;
  const done = progress >= def.target;
  return (
    <Card highlight={done && !claimed ? game.gold : undefined} style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.check, (claimed || done) && styles.checkOn]}>
          <Icon name={claimed ? 'check' : 'target'} size={20} color={claimed || done ? game.white : game.textMute} />
        </View>
        <View style={styles.flex}>
          <BodyText size={15} weight="black" color={game.white}>
            {missionText(def)}
          </BodyText>
          <View style={styles.reward}>
            <CurrencyIcon kind={def.gems > 0 ? 'gems' : 'apples'} size={16} />
            <BodyText size={13} weight="black" color={game.textDim}>
              {`+${def.gems > 0 ? def.gems : def.apples}`}
            </BodyText>
          </View>
        </View>
        {claimed ? (
          <BodyText size={13} weight="black" color={game.success}>
            {S.common.claimed}
          </BodyText>
        ) : (
          <GlossyButton size="sm" skin={done ? 'gold' : 'disabled'} disabled={!done} label={S.common.claim} onPress={() => celebrateReward(claimMission(id))} />
        )}
      </View>
      <ProgressBar value={progress} max={def.target} />
      <BodyText size={12} weight="black" color={game.textMute} align="right">
        {`${Math.min(progress, def.target)} / ${def.target}`}
      </BodyText>
    </Card>
  );
}

export function MissionsScreen() {
  const ids = useGame((s) => s.missions.ids);
  const claimed = useGame((s) => s.missions.claimed);
  const chestOpened = useGame((s) => s.missions.chestOpened);
  const openChest = useGame((s) => s.openChest);
  const rollover = useGame((s) => s.rollover);
  const now = useNow(1000);
  const left = msUntilTomorrow(new Date(now));
  if (left < 1500) rollover();
  const allClaimed = ids.every((id) => claimed.includes(id));

  return (
    <Screen title={S.missionsScreen.title}>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <View style={styles.timer}>
          <Icon name="clock" size={18} color={game.textDim} />
          <BodyText size={14} weight="black" color={game.textDim}>
            {fmt(S.missionsScreen.refresh, { t: formatDuration(left) })}
          </BodyText>
        </View>
        {ids.map((id) => (
          <MissionCard key={id} id={id} />
        ))}
        <Card highlight={allClaimed && !chestOpened ? game.gold : undefined} style={styles.chest}>
          <Icon name="chest" size={72} color={chestOpened ? game.textMute : game.gold} detail={game.goldDark} outline />
          <DisplayText size={24} color={game.gold}>
            {S.missionsScreen.chest}
          </DisplayText>
          <View style={styles.reward}>
            <CurrencyIcon kind="apples" size={20} />
            <BodyText size={15} weight="black" color={game.white}>
              {`+${ECONOMY.missionChestApples}`}
            </BodyText>
            <CurrencyIcon kind="gems" size={20} />
            <BodyText size={15} weight="black" color={game.white}>
              {`+${ECONOMY.missionChestGems}`}
            </BodyText>
          </View>
          {chestOpened ? (
            <BodyText size={14} weight="black" color={game.success}>
              {S.missionsScreen.chestOpened}
            </BodyText>
          ) : allClaimed ? (
            <GlossyButton label={S.missionsScreen.chestOpen} icon="chest" skin="gold" onPress={() => celebrateReward(openChest())} />
          ) : (
            <BodyText size={13} weight="bold" color={game.textDim} align="center">
              {S.missionsScreen.chestHint}
            </BodyText>
          )}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    gap: 10,
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 2,
  },
  card: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  check: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: game.surfaceLo,
    borderWidth: 2,
    borderColor: game.stroke,
  },
  checkOn: {
    backgroundColor: game.success,
    borderColor: game.outline,
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chest: {
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
});
