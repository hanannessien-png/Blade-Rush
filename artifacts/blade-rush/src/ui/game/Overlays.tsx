/** Pause, Game Over, Boss Defeated, Victory, Daily Results and the ad power-up picker. */
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { game } from '@/constants/colors';
import { AD_POLICY } from '../../config/adPolicy';
import { DIFFICULTY } from '../../config/difficulty';
import type { DailyResult, Reward } from '../../state/store';
import { useGame } from '../../state/store';
import { POWERUP_ORDER, type ModeId, type PowerUpId } from '../../game/types';
import { fmt, S } from '../../strings';
import { BouncyModal } from '../components/BouncyModal';
import { CurrencyIcon } from '../components/CurrencyIcon';
import { GlossyButton, RoundButton } from '../components/GlossyButton';
import { Icon } from '../components/Icon';
import { KnifeImage } from '../components/KnifeImage';
import { BodyText, DisplayText } from '../components/Typography';
import { POWERUP_ICON } from './Hud';
import { unlockStageOf, type BossResult } from './runController';

function RewardRow({ apples, gems, size = 24 }: { apples: number; gems: number; size?: number }) {
  return (
    <View style={styles.rewardRow}>
      {apples > 0 && (
        <View style={styles.rewardItem}>
          <CurrencyIcon kind="apples" size={size + 6} />
          <DisplayText size={size} stroke={2}>{`+${apples}`}</DisplayText>
        </View>
      )}
      {gems > 0 && (
        <View style={styles.rewardItem}>
          <CurrencyIcon kind="gems" size={size + 6} />
          <DisplayText size={size} stroke={2}>{`+${gems}`}</DisplayText>
        </View>
      )}
    </View>
  );
}

// ------------------------------------------------------------------ Pause

export function PauseMenu({ visible, onResume, onHome }: { visible: boolean; onResume(): void; onHome(): void }) {
  const settings = useGame((s) => s.settings);
  const setSetting = useGame((s) => s.setSetting);
  return (
    <BouncyModal visible={visible} title={S.game.paused} onClose={onResume}>
      <View style={styles.toggles}>
        <RoundButton
          icon={settings.sound ? 'sound' : 'soundOff'}
          skin={settings.sound ? 'blue' : 'dark'}
          label={S.settings.sound.split(' ')[0]}
          onPress={() => setSetting('sound', !settings.sound)}
          accessibilityLabel={S.settings.sound}
        />
        <RoundButton
          icon={settings.music ? 'music' : 'musicOff'}
          skin={settings.music ? 'blue' : 'dark'}
          label={S.settings.music}
          onPress={() => setSetting('music', !settings.music)}
          accessibilityLabel={S.settings.music}
        />
        <RoundButton
          icon="vibrate"
          skin={settings.haptics ? 'blue' : 'dark'}
          label={S.settings.haptics}
          onPress={() => setSetting('haptics', !settings.haptics)}
          accessibilityLabel={S.settings.haptics}
        />
      </View>
      <View style={styles.stack}>
        <GlossyButton label={S.game.resume} icon="play" size="lg" skin="primary" onPress={onResume} />
        <GlossyButton label={S.common.home} icon="home" skin="dark" onPress={onHome} />
      </View>
    </BouncyModal>
  );
}

export function QuitConfirm({ visible, onLeave, onStay }: { visible: boolean; onLeave(): void; onStay(): void }) {
  return (
    <BouncyModal visible={visible} title={S.game.quitTitle} titleColor={game.white} onClose={onStay}>
      <BodyText align="center" style={styles.body}>
        {S.game.quitBody}
      </BodyText>
      <View style={styles.rowButtons}>
        <GlossyButton label={S.game.stay} skin="dark" onPress={onStay} style={styles.flex} />
        <GlossyButton label={S.game.leave} skin="danger" onPress={onLeave} style={styles.flex} />
      </View>
    </BouncyModal>
  );
}

// ------------------------------------------------------------------ Game Over

function CountdownRing({ progress, size = 34 }: { progress: number; size?: number }) {
  const r = size / 2 - 3;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(0,0,0,0.25)" strokeWidth={4} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={game.white}
        strokeWidth={4}
        fill="none"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={c * (1 - progress)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
}

/** Seconds-left countdown for the Continue offer; restarts when `active` turns on. */
function useOfferCountdown(active: boolean): number {
  const total = AD_POLICY.continueCountdownSec * 1000;
  const [left, setLeft] = useState(total);
  useEffect(() => {
    if (!active) return;
    const start = Date.now();
    setLeft(total);
    const id = setInterval(() => {
      const l = Math.max(0, total - (Date.now() - start));
      setLeft(l);
      if (l <= 0) clearInterval(id);
    }, 50);
    return () => clearInterval(id);
  }, [active, total]);
  return left / total;
}

interface GameOverProps {
  visible: boolean;
  mode: ModeId;
  timeUp: boolean;
  stage: number;
  result: number;
  points: number;
  best: number;
  newBest: boolean;
  earnedApples: number;
  earnedGems: number;
  canDouble: boolean;
  canContinue: boolean;
  continuesLeft: number;
  canAddTime: boolean;
  busy: boolean;
  onContinue(): void;
  onAddTime(): void;
  onDouble(): void;
  onRetry(): void;
  onHome(): void;
  onStore(): void;
  onFinishDaily(): void;
}

export function GameOverPanel(p: GameOverProps) {
  const offerActive = p.visible && (p.canContinue || p.canAddTime);
  const progress = useOfferCountdown(offerActive);
  const showOffer = offerActive && progress > 0;
  const stagesMode = p.mode === 'timeAttack' || p.mode === 'daily';
  return (
    <BouncyModal visible={p.visible} title={p.timeUp ? S.gameOver.outOfTime : S.gameOver.title} titleColor={game.danger} backdropCloses={false}>
      <View style={styles.scoreCard}>
        <View style={styles.scoreCol}>
          <BodyText size={13} weight="bold" color={game.textMute} align="center">
            {stagesMode ? S.gameOver.stagesCleared : S.gameOver.stage}
          </BodyText>
          <DisplayText size={34}>{String(p.result)}</DisplayText>
        </View>
        <View style={styles.scoreDivider} />
        <View style={styles.scoreCol}>
          <BodyText size={13} weight="bold" color={game.textMute} align="center">
            {S.gameOver.score}
          </BodyText>
          <DisplayText size={34}>{p.points.toLocaleString('en-US')}</DisplayText>
        </View>
        <View style={styles.scoreDivider} />
        <View style={styles.scoreCol}>
          <BodyText size={13} weight="bold" color={game.textMute} align="center">
            {S.gameOver.best}
          </BodyText>
          <DisplayText size={34} color={game.gold}>
            {String(Math.max(p.best, p.result))}
          </DisplayText>
        </View>
      </View>
      {p.newBest && (
        <View style={styles.newBest}>
          <Icon name="star" size={18} color={game.gold} />
          <DisplayText size={18} color={game.gold} stroke={1.5}>
            {S.gameOver.newBest}
          </DisplayText>
          <Icon name="star" size={18} color={game.gold} />
        </View>
      )}
      {(p.earnedApples > 0 || p.earnedGems > 0) && (
        <View style={styles.earned}>
          <BodyText size={13} weight="bold" color={game.textMute} align="center">
            {S.gameOver.earned}
          </BodyText>
          <View style={styles.earnedRow}>
            <RewardRow apples={p.earnedApples} gems={p.earnedGems} size={22} />
            {p.canDouble && (
              <GlossyButton label={S.common.doubleIt} icon="ad" size="sm" skin="gold" onPress={p.onDouble} disabled={p.busy} />
            )}
          </View>
        </View>
      )}
      <View style={styles.stack}>
        {showOffer && p.canContinue && (
          <GlossyButton skin="green" size="lg" onPress={p.onContinue} disabled={p.busy} accessibilityLabel={S.gameOver.continue}>
            <View style={styles.offerRow}>
              <CountdownRing progress={progress} />
              <View style={styles.offerText}>
                <DisplayText size={26}>{S.gameOver.continue}</DisplayText>
                <BodyText size={12} weight="black" color={game.white} align="center">
                  {fmt(S.gameOver.continuesLeft, { n: p.continuesLeft })}
                </BodyText>
              </View>
              <Icon name="ad" size={26} color={game.white} detail={game.buttons.green.bottom} outline />
            </View>
          </GlossyButton>
        )}
        {showOffer && p.canAddTime && (
          <GlossyButton skin="green" size="lg" onPress={p.onAddTime} disabled={p.busy} accessibilityLabel={fmt(S.gameOver.addTime, { n: DIFFICULTY.timeAttack.adBonusSec })}>
            <View style={styles.offerRow}>
              <CountdownRing progress={progress} />
              <DisplayText size={28}>{fmt(S.gameOver.addTime, { n: DIFFICULTY.timeAttack.adBonusSec })}</DisplayText>
              <Icon name="ad" size={26} color={game.white} detail={game.buttons.green.bottom} outline />
            </View>
          </GlossyButton>
        )}
        {p.mode === 'daily' ? (
          <GlossyButton label={S.game.next} icon="flag" skin="primary" size="md" onPress={p.onFinishDaily} disabled={p.busy} />
        ) : (
          <GlossyButton label={S.gameOver.retry} icon="refresh" skin="primary" size="md" onPress={p.onRetry} disabled={p.busy} />
        )}
        <View style={styles.rowButtons}>
          <GlossyButton label={S.gameOver.home} icon="home" skin="dark" size="sm" onPress={p.onHome} disabled={p.busy} style={styles.flex} />
          <GlossyButton label={S.gameOver.store} icon="bag" skin="blue" size="sm" onPress={p.onStore} disabled={p.busy} style={styles.flex} />
        </View>
      </View>
    </BouncyModal>
  );
}

// ------------------------------------------------------------------ Boss defeated

export function BossDefeatedPanel({
  visible,
  result,
  busy,
  onDouble,
  onNext,
}: {
  visible: boolean;
  result: BossResult | null;
  busy: boolean;
  onDouble(): void;
  onNext(): void;
}) {
  const equipped = useGame((s) => s.equipped);
  const equip = useGame((s) => s.equip);
  if (!result) return null;
  const knifeName = result.knife ? S.knives[result.knife]?.name ?? result.knife : '';
  return (
    <BouncyModal visible={visible} title={S.boss.defeated} backdropCloses={false} accent={game.gold}>
      <DisplayText size={20} color={game.white} stroke={1.5}>
        {result.name}
      </DisplayText>
      {result.knife && (
        <View style={styles.reveal}>
          <View style={styles.revealGlow} />
          <KnifeImage id={result.knife} size={130} motion="spin" />
          <DisplayText size={20} color={game.gold} stroke={2}>
            {S.boss.newKnife}
          </DisplayText>
          <BodyText size={15} weight="black" color={game.white} align="center">
            {knifeName}
          </BodyText>
          {equipped === result.knife ? (
            <BodyText size={13} weight="bold" color={game.success} align="center">
              {S.common.equipped}
            </BodyText>
          ) : (
            <GlossyButton label={S.common.equip} size="sm" skin="blue" onPress={() => equip(result.knife!)} />
          )}
        </View>
      )}
      <View style={styles.bossRewards}>
        <RewardRow apples={result.doubled ? result.apples * 2 : result.apples} gems={result.gems} />
      </View>
      <View style={styles.stack}>
        {!result.doubled && <GlossyButton label={S.boss.doubleApples} icon="ad" skin="gold" size="sm" onPress={onDouble} disabled={busy} />}
        <GlossyButton label={S.game.next} icon="play" skin="primary" size="lg" onPress={onNext} disabled={busy} />
      </View>
    </BouncyModal>
  );
}

// ------------------------------------------------------------------ Victory & daily results

export function VictoryPanel({ visible, reward, onAgain, onHome }: { visible: boolean; reward: Reward | null; onAgain(): void; onHome(): void }) {
  return (
    <BouncyModal visible={visible} title={S.victory.title} backdropCloses={false} accent={game.gold}>
      <Icon name="trophy" size={84} color={game.gold} detail={game.goldDark} outline />
      <BodyText align="center" size={16} weight="bold" color={game.white} style={styles.body}>
        {S.victory.body}
      </BodyText>
      {reward && <RewardRow apples={reward.apples} gems={reward.gems} />}
      <View style={styles.stack}>
        <GlossyButton label={S.victory.playAgain} icon="refresh" skin="primary" size="lg" onPress={onAgain} />
        <GlossyButton label={S.common.home} icon="home" skin="dark" onPress={onHome} />
      </View>
    </BouncyModal>
  );
}

export function DailyResultsPanel({
  visible,
  cleared,
  result,
  streak,
  onHome,
  onDaily,
}: {
  visible: boolean;
  cleared: number;
  result: DailyResult | null;
  streak: number;
  onHome(): void;
  onDaily(): void;
}) {
  return (
    <BouncyModal visible={visible} title={S.dailyChallenge.resultTitle} backdropCloses={false}>
      {result?.completed && (
        <DisplayText size={22} color={game.success} stroke={2}>
          {S.dailyChallenge.complete}
        </DisplayText>
      )}
      <DisplayText size={44}>{fmt(S.dailyChallenge.cleared, { n: cleared })}</DisplayText>
      {result && <RewardRow apples={result.apples} gems={result.gems + result.milestoneGems} />}
      <View style={styles.streak}>
        <Icon name="calendar" size={22} color={game.gold} />
        <BodyText size={15} weight="black" color={game.white}>
          {`${S.dailyChallenge.streak}: ${streak}`}
        </BodyText>
      </View>
      <View style={styles.stack}>
        <GlossyButton label={S.common.home} icon="home" skin="primary" size="md" onPress={onHome} />
        <GlossyButton label={S.home.daily} icon="calendar" skin="dark" size="sm" onPress={onDaily} />
      </View>
    </BouncyModal>
  );
}

// ------------------------------------------------------------------ Ad power-up picker

export function AdPowerPicker({
  visible,
  stage,
  busy,
  onPick,
  onClose,
}: {
  visible: boolean;
  stage: number;
  busy: boolean;
  onPick(id: PowerUpId): void;
  onClose(): void;
}) {
  const [sel, setSel] = useState<PowerUpId | null>(null);
  useEffect(() => {
    if (visible) setSel(null);
  }, [visible]);
  return (
    <BouncyModal visible={visible} title={S.game.adPowerTitle} onClose={onClose}>
      <BodyText align="center" style={styles.body}>
        {S.game.adPowerBody}
      </BodyText>
      <View style={styles.grid}>
        {POWERUP_ORDER.map((id) => {
          const locked = stage < unlockStageOf(id);
          const on = sel === id;
          return (
            <View key={id} style={styles.gridCell}>
              <RoundButton
                icon={locked ? 'lock' : POWERUP_ICON[id]}
                skin={locked ? 'disabled' : on ? 'primary' : 'secondary'}
                size={54}
                disabled={locked}
                onPress={() => setSel(id)}
                accessibilityLabel={S.powerups[id].name}
              />
              <BodyText size={11} weight="black" color={on ? game.gold : locked ? game.textMute : game.white} align="center" numberOfLines={2}>
                {locked ? fmt(S.powerups.unlocksAt, { n: unlockStageOf(id) }) : S.powerups[id].name}
              </BodyText>
            </View>
          );
        })}
      </View>
      {sel && (
        <BodyText size={13} align="center" color={game.textDim} style={styles.body}>
          {S.powerups[sel].desc}
        </BodyText>
      )}
      <GlossyButton label={S.common.watchAd} icon="ad" skin="gold" disabled={!sel || busy} onPress={() => sel && onPick(sel)} />
    </BouncyModal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  body: {
    marginBottom: 12,
  },
  stack: {
    gap: 10,
    marginTop: 12,
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  toggles: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 6,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: game.surfaceLo,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: game.stroke,
    paddingVertical: 10,
  },
  scoreCol: {
    flex: 1,
    alignItems: 'center',
  },
  scoreDivider: {
    width: 2,
    alignSelf: 'stretch',
    backgroundColor: game.stroke,
  },
  newBest: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  earned: {
    marginTop: 10,
    gap: 4,
  },
  earnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  offerText: {
    alignItems: 'center',
  },
  reveal: {
    alignItems: 'center',
    gap: 4,
    marginVertical: 6,
  },
  revealGlow: {
    position: 'absolute',
    top: 0,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 210, 63, 0.22)',
  },
  bossRewards: {
    marginTop: 8,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: 12,
    marginBottom: 10,
  },
  gridCell: {
    width: '33%',
    alignItems: 'center',
    gap: 4,
  },
});
