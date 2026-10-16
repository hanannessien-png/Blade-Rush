import type { KnifeSize } from '../config/difficulty';

export type ModeId = 'endless' | 'fixed' | 'daily' | 'timeAttack';

export type SpeedPatternKind = 'constant' | 'reverse' | 'sine' | 'stopGo' | 'accelerate';

export type ItemKind = 'knife' | 'spike' | 'apple' | 'golden' | 'crystal';

export type TargetChange = 'none' | 'pulse' | 'swap' | 'shrink';

export type ModifierId = 'pattern' | 'spikes' | 'mixed' | 'change' | 'shields' | 'drift' | 'ghost';

export type PowerUpId = 'slowmo' | 'freeze' | 'aim' | 'extra' | 'shield' | 'sweep';

export const POWERUP_ORDER: readonly PowerUpId[] = ['slowmo', 'freeze', 'aim', 'extra', 'shield', 'sweep'];

export interface StageItem {
  kind: ItemKind;
  /** Angle in degrees in the target's local (rotating) frame. */
  angle: number;
  /** Drifting spikes slide around the target (deg/s, signed). */
  drift?: number;
  /** Ghost spikes fade in and out; phase offset in seconds. */
  ghostPhase?: number;
  /** Width class for knives. */
  size?: KnifeSize;
}

export interface ShieldDef {
  /** Start angle in world degrees (0 = right, 90 = down). */
  angle: number;
  arc: number;
  /** Orbit speed in deg/s, signed. */
  speed: number;
}

export interface StageDef {
  stage: number;
  seed: number;
  isBoss: boolean;
  bossIndex: number | null;
  worldIndex: number;
  /** Palette shift cycle (Endless loops through the worlds with shifted palettes). */
  worldCycle: number;
  radius: number;
  /** Knives to throw, in order. */
  knives: KnifeSize[];
  items: StageItem[];
  /** Base rotation speed in deg/s (always positive). */
  speed: number;
  direction: 1 | -1;
  pattern: SpeedPatternKind;
  /** Pattern parameter: reverse period (s) for 'reverse'. */
  patternParam: number;
  change: TargetChange;
  shields: ShieldDef[];
  modifiers: ModifierId[];
}

export interface Obstacle {
  angle: number;
  halfWidth: number;
}
