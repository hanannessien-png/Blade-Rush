/**
 * One play-through ("run") of any mode. Owns the engine and renderer, turns
 * engine events into score, rewards, sounds and haptics, and tells the screen
 * which overlay to show. The screen calls `frame(dt)` from its render loop.
 */
import type { SkPicture } from '@shopify/react-native-skia';
import { AD_POLICY } from '../../config/adPolicy';
import { DIFFICULTY, type KnifeSize } from '../../config/difficulty';
import { ECONOMY, powerMeterThreshold } from '../../config/economy';
import { BOSSES } from '../../data/bosses';
import { KNIFE_BY_ID } from '../../data/knives';
import { WORLDS } from '../../data/worlds';
import { GameEngine, type EngineEvent } from '../../game/engine';
import { Renderer } from '../../game/render';
import { dateSeed } from '../../game/rng';
import { appleRewardOf, generateStage } from '../../game/stageGen';
import { POWERUP_ORDER, type ModeId, type PowerUpId } from '../../game/types';
import { ads } from '../../services/ads/adManager';
import { audio } from '../../services/audio';
import { haptic } from '../../services/haptics';
import { useGame, type DailyResult, type Reward } from '../../state/store';
import { fmt, S } from '../../strings';

const D = DIFFICULTY;
const FIXED_RUN_SEED = 0x5eed2026;

export type Overlay = null | 'pause' | 'quit' | 'gameOver' | 'boss' | 'victory' | 'daily' | 'adPower';

export interface HudState {
  stage: number;
  stageInWorld: number;
  isBoss: boolean;
  worldIndex: number;
  sizes: KnifeSize[];
  used: number;
  spares: number;
  points: number;
  meter: number;
  threshold: number;
  charges: number;
  usesLeft: number;
  adPowerUsed: boolean;
  active: Record<PowerUpId, boolean>;
  timeLeft: number;
  canThrow: boolean;
}

export interface BossResult {
  name: string;
  apples: number;
  gems: number;
  knife: string | null;
  doubled: boolean;
}

export type FloatKind = 'apple' | 'gem' | 'golden' | 'time' | 'penalty';

export interface RunUi {
  hud(h: HudState): void;
  overlay(o: Overlay): void;
  popup(text: string, color: string): void;
  float(x: number, y: number, text: string, kind: FloatKind): void;
  worldTitle(worldIndex: number, number: number): void;
  bossIntro(name: string): void;
  tutorialStep(throwsLeft: number): void;
}

export function unlockStageOf(id: PowerUpId): number {
  return D.powerups.unlockStages[POWERUP_ORDER.indexOf(id)];
}

function seedFor(mode: ModeId): number {
  if (mode === 'fixed') return FIXED_RUN_SEED;
  if (mode === 'daily') return dateSeed(new Date());
  return (Math.random() * 0x7fffffff) >>> 0;
}

export class RunController {
  readonly engine = new GameEngine();
  readonly renderer = new Renderer();
  readonly mode: ModeId;
  readonly seed: number;
  readonly startBest: number;

  stage = 0;
  points = 0;
  meter = 0;
  charges = 0;
  usesThisStage = 0;
  adPowerUsed = false;
  continuesUsed = 0;
  timeLeft: number = D.timeAttack.startSec;
  timeUp = false;
  taAdUsed = false;
  earnedApples = 0;
  earnedGems = 0;
  stagesCleared = 0;
  runDoubled = false;
  finalized = false;
  bossResult: BossResult | null = null;
  dailyResult: DailyResult | null = null;
  victoryReward: Reward | null = null;
  overlay: Overlay = null;
  scale = 1;
  started = false;

  private waiting = false;
  private blockUntil = 0;
  private tutorialLeft: number;
  private lastHud = '';
  private renderedWhilePaused = false;
  private ui: RunUi;

  constructor(mode: ModeId, ui: RunUi) {
    this.mode = mode;
    this.ui = ui;
    this.seed = seedFor(mode);
    const st = useGame.getState();
    this.startBest =
      mode === 'endless' ? st.stats.endlessBest : mode === 'fixed' ? st.stats.fixedBest : mode === 'timeAttack' ? st.stats.timeAttackBest : st.daily.bestToday;
    this.tutorialLeft = st.tutorialDone ? 0 : 3;
  }

  // ---------------------------------------------------------------- setup

  setViewport(widthPx: number, heightPx: number, safeTopPx: number, safeBottomPx: number): void {
    this.scale = widthPx / D.logicalWidth;
    this.engine.setViewport({
      height: heightPx / this.scale,
      safeTop: safeTopPx / this.scale,
      safeBottom: safeBottomPx / this.scale,
    });
  }

  /** Dev builds only: begin at a later stage (used to check bosses and worlds). */
  devStartStage = 1;

  start(): void {
    if (this.started) return;
    this.started = true;
    useGame.getState().bump({ runsPlayed: 1 });
    this.loadStage(__DEV__ ? Math.max(1, this.devStartStage) : 1);
    if (this.tutorialLeft > 0) this.ui.tutorialStep(this.tutorialLeft);
  }

  private loadStage(n: number): void {
    const e = this.engine;
    const prevWorld = e.def?.worldIndex ?? -1;
    this.stage = n;
    e.reduceMotion = useGame.getState().settings.reduceMotion;
    const def = generateStage({ mode: this.mode, stage: n, runSeed: this.seed });
    e.loadStage(def);
    this.usesThisStage = 0;
    this.adPowerUsed = false;

    if (def.worldIndex !== prevWorld) {
      this.ui.worldTitle(def.worldIndex, Math.floor((n - 1) / D.stagesPerWorld) + 1);
      audio.playMusic(WORLDS[def.worldIndex]?.music ?? 'workshop');
    }
    if (def.isBoss && def.bossIndex !== null) {
      const boss = BOSSES[def.bossIndex];
      this.ui.bossIntro(S.bosses[boss.id] ?? boss.id);
      audio.play('boss');
      haptic('medium');
      this.blockUntil = Date.now() + 1300;
    }

    const store = useGame.getState();
    if (this.mode === 'endless') {
      store.setBest('endlessBest', n);
      store.missionProgress('endlessStage', n);
    } else if (this.mode === 'fixed') {
      store.setBest('fixedBest', n);
    }
  }

  // ---------------------------------------------------------------- loop

  get paused(): boolean {
    return this.overlay !== null || this.waiting || ads.showing;
  }

  /** Advances the game and returns a new frame, or null when nothing changed. */
  frame(dt: number, knifeId: string): SkPicture | null {
    const e = this.engine;
    if (!this.started) return null;
    if (!this.paused) {
      this.renderedWhilePaused = false;
      e.update(dt);
      if (this.mode === 'timeAttack' && !this.timeUp && e.phase === 'play' && Date.now() > this.blockUntil) {
        this.timeLeft -= dt;
        if (this.timeLeft <= 0) this.onTimeUp();
      }
      this.handle(e.drainEvents());
    } else if (this.renderedWhilePaused) {
      this.pushHud();
      return null;
    } else {
      this.renderedWhilePaused = true;
    }
    this.pushHud();
    const knife = KNIFE_BY_ID[knifeId] ?? KNIFE_BY_ID.classic;
    return this.renderer.render(e, { scale: this.scale, knifeId: knife.id, knifeStyle: knife.style, reduceMotion: e.reduceMotion });
  }

  private pushHud(): void {
    const e = this.engine;
    const def = e.def;
    const limit = def?.isBoss ? D.powerups.usesPerBossStage : D.powerups.usesPerStage;
    const h: HudState = {
      stage: this.stage,
      stageInWorld: ((this.stage - 1) % D.stagesPerWorld) + 1,
      isBoss: def?.isBoss ?? false,
      worldIndex: def?.worldIndex ?? 0,
      sizes: def?.knives ?? [],
      used: e.queueIndex,
      spares: e.spares,
      points: this.points,
      meter: Math.floor(this.meter),
      threshold: powerMeterThreshold(this.stage),
      charges: this.charges,
      usesLeft: Math.max(0, limit - this.usesThisStage),
      adPowerUsed: this.adPowerUsed,
      active: {
        slowmo: e.slowMoLeft > 0,
        freeze: e.freezeLeft > 0,
        aim: e.aimThrows > 0,
        extra: e.spares > 0,
        shield: e.shieldCharges > 0,
        sweep: false,
      },
      timeLeft: Math.ceil(Math.max(0, this.timeLeft)),
      canThrow: e.canThrow,
    };
    const key = JSON.stringify(h);
    if (key !== this.lastHud) {
      this.lastHud = key;
      this.ui.hud(h);
    }
  }

  // ---------------------------------------------------------------- input

  tap(): void {
    if (this.paused || Date.now() < this.blockUntil) return;
    if (this.engine.throwKnife() && this.tutorialLeft > 0) {
      this.tutorialLeft--;
      this.ui.tutorialStep(this.tutorialLeft);
      if (this.tutorialLeft === 0) useGame.getState().setTutorialDone();
    }
  }

  isUnlocked(id: PowerUpId): boolean {
    return this.stage >= unlockStageOf(id);
  }

  canUsePowerUp(id: PowerUpId): boolean {
    const limit = this.engine.def?.isBoss ? D.powerups.usesPerBossStage : D.powerups.usesPerStage;
    return this.isUnlocked(id) && this.charges > 0 && this.usesThisStage < limit && this.engine.phase === 'play' && !this.paused;
  }

  usePowerUp(id: PowerUpId): boolean {
    if (!this.canUsePowerUp(id)) return false;
    this.charges--;
    this.usesThisStage++;
    this.activate(id);
    return true;
  }

  /** Power-up paid for with a rewarded ad: no charge, once per stage. */
  grantAdPowerUp(id: PowerUpId): void {
    this.adPowerUsed = true;
    this.activate(id);
  }

  private activate(id: PowerUpId): void {
    this.engine.applyPowerUp(id);
    audio.play('powerup');
    haptic('medium');
    const st = useGame.getState();
    st.bump({ powerupsUsed: 1 });
    st.missionProgress('powerupsUsed', 1);
    this.ui.popup(S.powerups[id].name, '#7FE3FF');
  }

  // ---------------------------------------------------------------- scoring

  private addPoints(n: number): void {
    this.points += n;
    const max = D.powerups.maxCharges;
    if (this.charges >= max) return;
    this.meter += n;
    const threshold = powerMeterThreshold(this.stage);
    while (this.meter >= threshold && this.charges < max) {
      this.meter -= threshold;
      this.charges++;
      if (POWERUP_ORDER.some((id) => this.isUnlocked(id))) {
        this.ui.popup(S.game.powerReady, '#7DFF9A');
        audio.play('powerup', 1.2);
      }
    }
    if (this.charges >= max) this.meter = 0;
  }

  private earn(apples: number, gems: number): void {
    if (!apples && !gems) return;
    this.earnedApples += apples;
    this.earnedGems += gems;
    useGame.getState().grant({ apples, gems });
  }

  private handle(events: EngineEvent[]): void {
    const P = ECONOMY.points;
    const st = useGame.getState();
    for (const ev of events) {
      switch (ev.type) {
        case 'throw':
          audio.play('whoosh', 0.95 + Math.random() * 0.15);
          break;
        case 'stick':
          audio.play('thwack', 0.92 + Math.random() * 0.16);
          haptic('light');
          this.addPoints(P.knifeStuck + (ev.closeCall ? P.closeCall : 0));
          st.bump({ knivesStuck: 1, closeCalls: ev.closeCall ? 1 : 0 });
          st.missionProgress('knivesStuck', 1);
          if (ev.closeCall) {
            st.missionProgress('closeCalls', 1);
            this.ui.popup(S.game.closeCall, '#FFD23F');
          }
          break;
        case 'slice': {
          audio.play('slice', ev.kind === 'apple' ? 1 : 1.15);
          haptic('medium');
          const r = appleRewardOf(ev.kind);
          this.earn(r.apples, r.gems);
          this.addPoints(ev.kind === 'apple' ? P.apple : ev.kind === 'golden' ? P.goldenApple : P.crystalApple);
          st.bump({ applesSliced: 1, goldenSliced: ev.kind === 'golden' ? 1 : 0, crystalSliced: ev.kind === 'crystal' ? 1 : 0 });
          st.missionProgress('applesSliced', 1);
          if (ev.kind === 'golden') st.missionProgress('goldenSliced', 1);
          const x = ev.x * this.scale;
          const y = ev.y * this.scale;
          if (r.gems > 0) this.ui.float(x, y, `+${r.gems}`, 'gem');
          else this.ui.float(x, y, `+${r.apples}`, ev.kind === 'golden' ? 'golden' : 'apple');
          break;
        }
        case 'blocked':
          audio.play(ev.by === 'shield' ? 'shatter' : 'whoosh', 1.3);
          haptic('medium');
          this.ui.popup(ev.by === 'shield' ? S.game.shieldBlocked : S.game.spareUsed, '#7FE3FF');
          break;
        case 'fail':
          audio.play('fail');
          haptic('heavy');
          if (this.mode === 'timeAttack') {
            this.timeLeft -= D.timeAttack.collisionPenaltySec;
            this.ui.float(ev.x * this.scale, ev.y * this.scale, fmt(S.game.timePenalty, { n: D.timeAttack.collisionPenaltySec }), 'penalty');
            if (this.timeLeft <= 0) this.onTimeUp();
          }
          break;
        case 'failDone':
          if (this.mode === 'timeAttack') {
            if (!this.timeUp) this.engine.resetStage();
          } else {
            this.setOverlay('gameOver');
          }
          break;
        case 'clear': {
          audio.play('shatter');
          this.stagesCleared++;
          st.bump({ stagesCleared: 1 });
          st.missionProgress('stagesCleared', 1);
          this.earn(ECONOMY.applesPerStage, 0);
          if (ev.perfect) {
            this.addPoints(P.perfectStage);
            this.ui.popup(S.game.perfect, '#FFD23F');
          }
          if (this.mode === 'timeAttack') {
            const bonus = ev.isBoss ? D.timeAttack.bossBonusSec : D.timeAttack.stageBonusSec;
            this.timeLeft += bonus;
            this.ui.float(this.engine.cx * this.scale, this.engine.cy * this.scale, fmt(S.game.timeBonus, { n: bonus }), 'time');
          }
          if (ev.isBoss) haptic('success');
          break;
        }
        case 'clearDone':
          void this.afterClear();
          break;
        case 'swept':
          audio.play('shatter', 1.2);
          break;
      }
    }
  }

  // ---------------------------------------------------------------- flow

  private async afterClear(): Promise<void> {
    const def = this.engine.def;
    if (def?.isBoss && def.bossIndex !== null) {
      const st = useGame.getState();
      const boss = BOSSES[def.bossIndex];
      const knife = st.bossDefeated(def.bossIndex);
      st.missionProgress('bossesDefeated', 1);
      this.earn(ECONOMY.bossWinApples, ECONOMY.bossWinGems);
      this.bossResult = { name: S.bosses[boss.id] ?? boss.id, apples: ECONOMY.bossWinApples, gems: ECONOMY.bossWinGems, knife, doubled: false };
      audio.play('reward');
      this.setOverlay('boss');
      return;
    }
    await this.advance();
  }

  /** Called by the Boss Defeated overlay's Next button. */
  async continueAfterBoss(): Promise<void> {
    this.setOverlay(null);
    await this.advance();
  }

  private async advance(): Promise<void> {
    if (this.mode === 'fixed' && this.stage >= D.fixedRunStages) {
      this.victory();
      return;
    }
    if (this.mode === 'daily' && this.stage >= ECONOMY.dailyChallengeStages) {
      this.finalize();
      audio.play('reward');
      this.setOverlay('daily');
      return;
    }
    if ((this.mode === 'endless' || this.mode === 'fixed') && ads.noteStageCleared()) {
      this.waiting = true;
      try {
        await ads.maybeInterstitial('stage');
      } finally {
        this.waiting = false;
      }
    }
    this.loadStage(this.stage + 1);
  }

  private victory(): void {
    const st = useGame.getState();
    this.earn(ECONOMY.fixedRunVictoryApples, ECONOMY.fixedRunVictoryGems);
    this.victoryReward = { apples: ECONOMY.fixedRunVictoryApples, gems: ECONOMY.fixedRunVictoryGems };
    st.bump({ fixedWins: 1 });
    this.finalize();
    audio.play('reward');
    haptic('success');
    this.setOverlay('victory');
  }

  private onTimeUp(): void {
    this.timeLeft = 0;
    this.timeUp = true;
    this.setOverlay('gameOver');
  }

  setOverlay(o: Overlay): void {
    this.overlay = o;
    this.ui.overlay(o);
  }

  // ---------------------------------------------------------------- game over actions

  get canContinue(): boolean {
    return this.mode !== 'timeAttack' && this.continuesUsed < AD_POLICY.maxContinuesPerRun;
  }

  get continuesLeft(): number {
    return AD_POLICY.maxContinuesPerRun - this.continuesUsed;
  }

  continueRun(): void {
    this.continuesUsed++;
    this.engine.resumeAfterFail();
    this.setOverlay(null);
  }

  addTime(): void {
    this.taAdUsed = true;
    this.timeUp = false;
    this.timeLeft = D.timeAttack.adBonusSec;
    this.setOverlay(null);
  }

  /** Doubles the apples earned this run (rewarded ad, once). */
  doubleRun(): number {
    if (this.runDoubled || this.earnedApples <= 0) return 0;
    this.runDoubled = true;
    const n = this.earnedApples;
    useGame.getState().grant({ apples: n, gems: 0 });
    this.earnedApples += n;
    return n;
  }

  doubleBoss(): number {
    const b = this.bossResult;
    if (!b || b.doubled) return 0;
    b.doubled = true;
    useGame.getState().grant({ apples: b.apples, gems: 0 });
    this.earnedApples += b.apples;
    return b.apples;
  }

  /** Records end-of-run results once (bests, Time Attack missions, daily results). */
  finalize(): void {
    if (this.finalized) return;
    this.finalized = true;
    const st = useGame.getState();
    if (this.mode === 'timeAttack') {
      st.setBest('timeAttackBest', this.stagesCleared);
      st.missionProgress('timeAttackStages', this.stagesCleared);
    }
    if (this.mode === 'daily') this.dailyResult = st.finishDaily(this.stagesCleared);
  }

  /** The number shown as the run's result. */
  get result(): number {
    return this.mode === 'timeAttack' || this.mode === 'daily' ? this.stagesCleared : this.stage;
  }

  get isNewBest(): boolean {
    return this.result > this.startBest && this.result > 0;
  }

  dispose(): void {
    const r = this.renderer;
    // Let the canvas finish with its last frame before freeing pictures.
    setTimeout(() => r.dispose(), 1000);
  }
}
