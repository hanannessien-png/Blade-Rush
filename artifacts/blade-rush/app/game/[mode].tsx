import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';
import type { ModeId } from '@/src/game/types';
import { GameScreen } from '@/src/ui/game/GameScreen';

const MODES: readonly ModeId[] = ['endless', 'fixed', 'daily', 'timeAttack'];

export default function GameRoute() {
  const { mode, stage } = useLocalSearchParams<{ mode: string; stage?: string }>();
  if (!MODES.includes(mode as ModeId)) return <Redirect href="/home" />;
  // `?stage=N` is a development shortcut; release builds always start at stage 1.
  const devStage = __DEV__ && stage ? Number(stage) || undefined : undefined;
  return <GameScreen mode={mode as ModeId} devStage={devStage} />;
}
