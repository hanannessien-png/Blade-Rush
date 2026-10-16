/**
 * 20 bosses: food, objects and fantasy creations. Drawn procedurally in
 * src/game/art/bossArt.ts; names live in src/strings.ts under `bosses`.
 */
import type { SpeedPatternKind } from '../game/types';

export type BossKind =
  | 'pumpkin'
  | 'crystal'
  | 'shield'
  | 'pizza'
  | 'gear'
  | 'lava'
  | 'mask'
  | 'moon'
  | 'cactus'
  | 'crown'
  | 'egg'
  | 'cyber'
  | 'burger'
  | 'sushi'
  | 'candy'
  | 'chest'
  | 'disco'
  | 'alien'
  | 'idol'
  | 'clock';

export interface BossDef {
  id: BossKind;
  /** base, light, dark, accent */
  colors: readonly [string, string, string, string];
  pattern: SpeedPatternKind;
  spikes: number;
  extraKnives: number;
  /** Knife id won on the first victory (bosses 1–10 only). */
  exclusiveKnife?: string;
}

export const BOSSES: readonly BossDef[] = [
  { id: 'pumpkin', colors: ['#FF8A1F', '#FFC069', '#B24A00', '#3C8C2A'], pattern: 'reverse', spikes: 0, extraKnives: 2, exclusiveKnife: 'pumpkin_fang' },
  { id: 'crystal', colors: ['#5CC8FF', '#D8F4FF', '#1E64B4', '#FFFFFF'], pattern: 'sine', spikes: 1, extraKnives: 2, exclusiveKnife: 'crystal_shard' },
  { id: 'shield', colors: ['#9AA6B6', '#E1E7EF', '#4A5465', '#C9302C'], pattern: 'stopGo', spikes: 2, extraKnives: 2, exclusiveKnife: 'iron_will' },
  { id: 'pizza', colors: ['#F6C350', '#FFE7A1', '#B86A1A', '#D9342B'], pattern: 'accelerate', spikes: 1, extraKnives: 3, exclusiveKnife: 'pizza_cutter' },
  { id: 'gear', colors: ['#C99A45', '#F2D490', '#6B4A14', '#3B3F48'], pattern: 'reverse', spikes: 2, extraKnives: 3, exclusiveKnife: 'gear_blade' },
  { id: 'lava', colors: ['#E04A1A', '#FFB347', '#5A1206', '#FFE36E'], pattern: 'sine', spikes: 2, extraKnives: 3, exclusiveKnife: 'lava_edge' },
  { id: 'mask', colors: ['#8C5BD6', '#D9C2FF', '#3A1E6E', '#C7F25C'], pattern: 'stopGo', spikes: 3, extraKnives: 3, exclusiveKnife: 'voodoo_needle' },
  { id: 'moon', colors: ['#B9C8F5', '#F2F6FF', '#4F5F9E', '#7FD8FF'], pattern: 'accelerate', spikes: 2, extraKnives: 3, exclusiveKnife: 'moon_sickle' },
  { id: 'cactus', colors: ['#4CAF50', '#A5E38C', '#1D5E22', '#FF6F9C'], pattern: 'reverse', spikes: 3, extraKnives: 3, exclusiveKnife: 'cactus_thorn' },
  { id: 'crown', colors: ['#F2B531', '#FFF0A6', '#8A5A00', '#E01133'], pattern: 'sine', spikes: 3, extraKnives: 4, exclusiveKnife: 'crown_jewel' },
  { id: 'egg', colors: ['#7BD389', '#D8F7DD', '#2E7A3E', '#FFB03B'], pattern: 'stopGo', spikes: 3, extraKnives: 4 },
  { id: 'cyber', colors: ['#2B2F4A', '#5C66A8', '#0C0E1C', '#29F0FF'], pattern: 'accelerate', spikes: 3, extraKnives: 4 },
  { id: 'burger', colors: ['#E8A548', '#FFD994', '#8C4F12', '#5BBF4A'], pattern: 'reverse', spikes: 3, extraKnives: 4 },
  { id: 'sushi', colors: ['#F7F3EA', '#FFFFFF', '#1F2A24', '#FF7A59'], pattern: 'sine', spikes: 3, extraKnives: 4 },
  { id: 'candy', colors: ['#FF5FA2', '#FFD1E6', '#A31E5C', '#FFFFFF'], pattern: 'stopGo', spikes: 4, extraKnives: 4 },
  { id: 'chest', colors: ['#A0632E', '#E0A867', '#4E2A0E', '#F2C230'], pattern: 'accelerate', spikes: 4, extraKnives: 4 },
  { id: 'disco', colors: ['#B8C2D6', '#FFFFFF', '#4B5670', '#FF4FD8'], pattern: 'reverse', spikes: 4, extraKnives: 5 },
  { id: 'alien', colors: ['#6CF0B4', '#D2FFE9', '#17785A', '#B05CFF'], pattern: 'sine', spikes: 4, extraKnives: 5 },
  { id: 'idol', colors: ['#C9A46A', '#F0DDB2', '#6B5226', '#2FD1B8'], pattern: 'stopGo', spikes: 4, extraKnives: 5 },
  { id: 'clock', colors: ['#D8B45A', '#FFF0C2', '#7A5A14', '#C9302C'], pattern: 'accelerate', spikes: 4, extraKnives: 5 },
];
