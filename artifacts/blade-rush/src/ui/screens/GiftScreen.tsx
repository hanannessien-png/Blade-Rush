/** 7-day login gift. Missing a day restarts the streak. */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { game } from '@/constants/colors';
import { ECONOMY } from '../../config/economy';
import { dayKey } from '../../game/rng';
import { giftStatus } from '../../state/save';
import { useGame } from '../../state/store';
import { fmt, S } from '../../strings';
import { Confetti } from '../components/Confetti';
import { CurrencyIcon } from '../components/CurrencyIcon';
import { GlossyButton } from '../components/GlossyButton';
import { Icon } from '../components/Icon';
import { Screen } from '../components/Screen';
import { BodyText, DisplayText } from '../components/Typography';
import { useNow } from '../hooks';
import { celebrateReward, formatDuration, msUntilTomorrow } from '../rewards';

function DayCard({ index, state, wide }: { index: number; state: 'claimed' | 'today' | 'future'; wide?: boolean }) {
  const r = ECONOMY.dailyGift[index];
  const today = state === 'today';
  return (
    <View
      style={[
        styles.day,
        wide && styles.dayWide,
        today && styles.dayToday,
        state === 'claimed' && styles.dayClaimed,
      ]}
    >
      <BodyText size={13} weight="black" color={today ? game.outline : game.textDim} align="center">
        {fmt(S.giftScreen.day, { n: index + 1 })}
      </BodyText>
      <View style={styles.dayReward}>
        <Icon name={wide ? 'chest' : 'gift'} size={wide ? 46 : 34} color={today ? game.danger : state === 'claimed' ? game.textMute : game.gold} detail={game.outline} />
        <View>
          <View style={styles.amount}>
            <CurrencyIcon kind="apples" size={16} />
            <BodyText size={14} weight="black" color={today ? game.outline : game.white}>
              {String(r.apples)}
            </BodyText>
          </View>
          {r.gems > 0 && (
            <View style={styles.amount}>
              <CurrencyIcon kind="gems" size={16} />
              <BodyText size={14} weight="black" color={today ? game.outline : game.white}>
                {String(r.gems)}
              </BodyText>
            </View>
          )}
        </View>
      </View>
      {state === 'claimed' && (
        <View style={styles.claimedMark}>
          <Icon name="check" size={30} color={game.success} />
        </View>
      )}
    </View>
  );
}

export function GiftScreen() {
  const gift = useGame((s) => s.gift);
  const claimGift = useGame((s) => s.claimGift);
  const now = useNow(1000);
  const [confetti, setConfetti] = useState(0);
  const st = giftStatus(gift, dayKey(new Date(now)));
  // Days already claimed in the current 7-day cycle.
  const claimedCount = st.canClaim ? st.index : st.index + 1;

  const stateOf = (i: number): 'claimed' | 'today' | 'future' => {
    if (i < claimedCount) return 'claimed';
    if (st.canClaim && i === st.index) return 'today';
    return 'future';
  };

  return (
    <Screen title={S.giftScreen.title}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <DayCard key={i} index={i} state={stateOf(i)} />
          ))}
          <DayCard index={6} state={stateOf(6)} wide />
        </View>
        <View style={styles.actions}>
          {st.canClaim ? (
            <GlossyButton
              label={S.giftScreen.claim}
              icon="gift"
              size="lg"
              skin="primary"
              onPress={() => {
                const r = claimGift();
                if (r) {
                  celebrateReward(r);
                  setConfetti((c) => c + 1);
                }
              }}
            />
          ) : (
            <DisplayText size={20} color={game.textDim} stroke={1.5}>
              {fmt(S.giftScreen.comeBack, { t: formatDuration(msUntilTomorrow(new Date(now))) })}
            </DisplayText>
          )}
          <BodyText size={13} weight="bold" color={game.textMute} align="center">
            {S.giftScreen.streakNote}
          </BodyText>
        </View>
      </ScrollView>
      <Confetti burstKey={confetti} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  day: {
    width: '31.5%',
    paddingVertical: 10,
    borderRadius: 18,
    alignItems: 'center',
    gap: 4,
    backgroundColor: game.surface,
    borderWidth: 2,
    borderColor: game.stroke,
  },
  dayWide: {
    width: '100%',
  },
  dayToday: {
    backgroundColor: game.gold,
    borderColor: game.outline,
    borderWidth: 3,
  },
  dayClaimed: {
    opacity: 0.6,
  },
  dayReward: {
    alignItems: 'center',
    gap: 4,
  },
  amount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  claimedMark: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 8, 38, 0.35)',
    borderRadius: 16,
  },
  actions: {
    marginTop: 22,
    alignItems: 'center',
    gap: 14,
  },
});
