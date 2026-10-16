/**
 * Neutral age screen shown once before any ad request: pick a decade, then a
 * year. The answer only sets how ads are requested and stays on the device.
 */
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { game } from '@/constants/colors';
import { ads } from '../../services/ads/adManager';
import type { AgeGroup } from '../../state/save';
import { useGame } from '../../state/store';
import { S } from '../../strings';
import { feedbackTap, GlossyButton } from '../components/GlossyButton';
import { Icon } from '../components/Icon';
import { Backdrop, Card, useScreenInsets } from '../components/Screen';
import { BodyText, DisplayText } from '../components/Typography';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Conservative: assumes the birthday has not happened yet this year. */
export function ageGroupForYear(year: number, currentYear: number): AgeGroup {
  const age = currentYear - year - 1;
  if (age < 13) return 'child';
  if (age < 18) return 'teen';
  return 'adult';
}

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress(): void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={() => {
        feedbackTap();
        onPress();
      }}
      style={[styles.chip, selected && styles.chipOn]}
    >
      <DisplayText size={20} color={selected ? game.outline : game.white} stroke={selected ? 0 : 1.5}>
        {label}
      </DisplayText>
    </Pressable>
  );
}

export function AgeScreen() {
  const insets = useScreenInsets();
  const setAgeGroup = useGame((s) => s.setAgeGroup);
  const currentYear = new Date().getFullYear();
  const lastDecade = Math.floor(currentYear / 10) * 10;
  const decades = Array.from({ length: 9 }, (_, i) => lastDecade - (8 - i) * 10);
  const [decade, setDecade] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const finish = async (group: AgeGroup) => {
    if (busy) return;
    setBusy(true);
    setAgeGroup(group);
    const st = useGame.getState();
    await Promise.race([ads.start(group, st.launches), sleep(8000)]);
    router.replace('/home');
  };

  const years = decade === null ? [] : Array.from({ length: 10 }, (_, i) => decade + i).filter((y) => y <= currentYear);

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>
      <Backdrop />
      <DisplayText size={40} color={game.gold}>
        {S.age.title}
      </DisplayText>
      <BodyText size={18} weight="black" color={game.white} align="center" style={styles.question}>
        {S.age.question}
      </BodyText>
      <Card style={styles.card}>
        {decade === null ? (
          <View style={styles.grid}>
            {decades.map((d) => (
              <Chip key={d} label={`${d}s`} selected={false} onPress={() => setDecade(d)} />
            ))}
          </View>
        ) : (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={S.common.back}
              onPress={() => {
                feedbackTap();
                setDecade(null);
                setYear(null);
              }}
              style={styles.backRow}
            >
              <Icon name="back" size={20} color={game.textDim} />
              <BodyText size={15} weight="black" color={game.textDim}>
                {`${decade}s`}
              </BodyText>
            </Pressable>
            <View style={styles.grid}>
              {years.map((y) => (
                <Chip key={y} label={String(y)} selected={year === y} onPress={() => setYear(y)} />
              ))}
            </View>
          </>
        )}
      </Card>
      <BodyText size={13} align="center" color={game.textMute} style={styles.note}>
        {S.age.note}
      </BodyText>
      <View style={styles.actions}>
        <GlossyButton
          label={busy ? S.common.loading : S.age.confirm}
          skin="primary"
          size="lg"
          disabled={year === null || busy}
          onPress={() => year !== null && void finish(ageGroupForYear(year, currentYear))}
        />
        <Pressable accessibilityRole="button" onPress={() => void finish('unknown')} disabled={busy} style={styles.skip}>
          <BodyText size={15} weight="bold" color={game.textDim} align="center">
            {S.age.skip}
          </BodyText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: game.bg,
  },
  question: {
    marginTop: 4,
    marginBottom: 16,
  },
  card: {
    alignSelf: 'stretch',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  chip: {
    width: '30%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: game.surfaceHi,
    borderWidth: 2,
    borderColor: game.stroke,
  },
  chipOn: {
    backgroundColor: game.gold,
    borderColor: game.outline,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  note: {
    marginTop: 14,
    paddingHorizontal: 10,
  },
  actions: {
    marginTop: 'auto',
    alignSelf: 'stretch',
    gap: 12,
  },
  skip: {
    paddingVertical: 10,
  },
});
