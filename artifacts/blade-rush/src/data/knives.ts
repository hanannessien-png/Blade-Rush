/**
 * The 50-knife catalog. Visuals are fully procedural (see src/game/art/knifeArt.ts);
 * names and flavor text live in src/strings.ts under `knives`.
 * Knives are cosmetic only: they never change gameplay.
 */
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export type CollectionId =
  | 'starter'
  | 'kitchen'
  | 'pirate'
  | 'hunter'
  | 'ninja'
  | 'ice'
  | 'cyber'
  | 'voodoo'
  | 'cosmic'
  | 'royal'
  | 'boss';

export type BladeShape =
  | 'classic'
  | 'chef'
  | 'cleaver'
  | 'bread'
  | 'dagger'
  | 'kris'
  | 'tanto'
  | 'scimitar'
  | 'leaf'
  | 'needle'
  | 'bowie'
  | 'kunai'
  | 'crystal'
  | 'flame'
  | 'hook'
  | 'sickle';

export type GuardShape = 'none' | 'bar' | 'round' | 'cross' | 'winged' | 'disc' | 'ring' | 'skull';
export type HandleShape = 'wrapped' | 'plain' | 'ringed' | 'ornate' | 'grip' | 'bone';
export type PommelShape = 'none' | 'round' | 'gem' | 'ring' | 'spike' | 'crown';
export type BladePattern = 'none' | 'damascus' | 'circuit' | 'runes' | 'stars' | 'frost' | 'swirl' | 'serrated';

export interface KnifeStyle {
  blade: BladeShape;
  /** Blade length and max width in logical px. */
  bladeLen: number;
  bladeWidth: number;
  /** Light, mid, dark blade colors. */
  bladeColors: readonly [string, string, string];
  edge: string;
  pattern: BladePattern;
  patternColor?: string;
  guard: GuardShape;
  guardColors: readonly [string, string];
  handle: HandleShape;
  handleColors: readonly [string, string];
  pommel: PommelShape;
  pommelColor: string;
  gem?: string;
  /** Legendary glow and trail color. */
  glow?: string;
}

export interface KnifeDef {
  id: string;
  collection: CollectionId;
  rarity: Rarity;
  priceApples?: number;
  priceGems?: number;
  /** For boss exclusives: index (0-based) of the boss that awards it. */
  bossIndex?: number;
  style: KnifeStyle;
}

const STEEL = ['#F4F7FB', '#B9C3D0', '#6E7B8C'] as const;
const DARK_STEEL = ['#C9D1DC', '#7B8798', '#3B4452'] as const;
const GOLD = ['#FFF3B0', '#F2B531', '#9A6408'] as const;

function k(
  id: string,
  collection: CollectionId,
  rarity: Rarity,
  price: { a?: number; g?: number; boss?: number },
  style: KnifeStyle,
): KnifeDef {
  return { id, collection, rarity, priceApples: price.a, priceGems: price.g, bossIndex: price.boss, style };
}

export const KNIVES: readonly KnifeDef[] = [
  // Starter
  k('classic', 'starter', 'common', {}, {
    blade: 'classic', bladeLen: 44, bladeWidth: 11, bladeColors: STEEL, edge: '#FFFFFF', pattern: 'none',
    guard: 'bar', guardColors: ['#E3E8EF', '#7D8896'], handle: 'wrapped', handleColors: ['#B06A3B', '#5E3317'],
    pommel: 'round', pommelColor: '#D5DCE5',
  }),

  // Kitchen (Common, apples)
  k('paring', 'kitchen', 'common', { a: 100 }, {
    blade: 'classic', bladeLen: 40, bladeWidth: 9, bladeColors: STEEL, edge: '#FFFFFF', pattern: 'none',
    guard: 'none', guardColors: ['#333', '#111'], handle: 'plain', handleColors: ['#3A3F4A', '#15181E'],
    pommel: 'none', pommelColor: '#222',
  }),
  k('chef', 'kitchen', 'common', { a: 140 }, {
    blade: 'chef', bladeLen: 46, bladeWidth: 14, bladeColors: STEEL, edge: '#FFFFFF', pattern: 'none',
    guard: 'bar', guardColors: ['#E3E8EF', '#7D8896'], handle: 'ringed', handleColors: ['#2C2F36', '#0E1014'],
    pommel: 'round', pommelColor: '#C7CED8',
  }),
  k('cleaver', 'kitchen', 'common', { a: 180 }, {
    blade: 'cleaver', bladeLen: 40, bladeWidth: 19, bladeColors: DARK_STEEL, edge: '#F2F5F9', pattern: 'none',
    guard: 'none', guardColors: ['#333', '#111'], handle: 'plain', handleColors: ['#C68A4E', '#6E431E'],
    pommel: 'ring', pommelColor: '#BFC7D2',
  }),
  k('bread', 'kitchen', 'common', { a: 220 }, {
    blade: 'bread', bladeLen: 48, bladeWidth: 11, bladeColors: STEEL, edge: '#FFFFFF', pattern: 'serrated',
    guard: 'round', guardColors: ['#F7D27C', '#B07A1E'], handle: 'grip', handleColors: ['#E9C99A', '#9E7442'],
    pommel: 'round', pommelColor: '#E9C99A',
  }),
  k('santoku', 'kitchen', 'common', { a: 250 }, {
    blade: 'chef', bladeLen: 44, bladeWidth: 15, bladeColors: ['#FDFDFE', '#C5CEDA', '#7D8B9E'], edge: '#FFFFFF', pattern: 'damascus', patternColor: '#8E9AAB',
    guard: 'bar', guardColors: ['#7A5230', '#3B2412'], handle: 'plain', handleColors: ['#8B5A33', '#41250F'],
    pommel: 'none', pommelColor: '#222',
  }),

  // Pirate (Rare, apples)
  k('cutlass', 'pirate', 'rare', { a: 300 }, {
    blade: 'scimitar', bladeLen: 48, bladeWidth: 12, bladeColors: STEEL, edge: '#FFFFFF', pattern: 'none',
    guard: 'winged', guardColors: ['#FFF3B0', '#C98A14'], handle: 'wrapped', handleColors: ['#2E4A7A', '#132544'],
    pommel: 'round', pommelColor: '#F2B531',
  }),
  k('hook', 'pirate', 'rare', { a: 350 }, {
    blade: 'hook', bladeLen: 44, bladeWidth: 12, bladeColors: DARK_STEEL, edge: '#E8EDF3', pattern: 'none',
    guard: 'disc', guardColors: ['#C9A06A', '#6E4E25'], handle: 'ringed', handleColors: ['#5C3A1E', '#2B190A'],
    pommel: 'spike', pommelColor: '#AAB3BF',
  }),
  k('anchor', 'pirate', 'rare', { a: 400 }, {
    blade: 'dagger', bladeLen: 44, bladeWidth: 13, bladeColors: ['#DDE7F2', '#8FA6BF', '#3F5670'], edge: '#FFFFFF', pattern: 'none',
    guard: 'cross', guardColors: ['#D6DDE6', '#6C7786'], handle: 'wrapped', handleColors: ['#C33B3B', '#5E1414'],
    pommel: 'ring', pommelColor: '#D6DDE6',
  }),
  k('jolly', 'pirate', 'rare', { a: 450 }, {
    blade: 'scimitar', bladeLen: 46, bladeWidth: 13, bladeColors: ['#3B3F48', '#22252B', '#0B0C0F'], edge: '#C8CFD9', pattern: 'none',
    guard: 'skull', guardColors: ['#F3EEDC', '#9F977C'], handle: 'wrapped', handleColors: ['#2A2A2A', '#0A0A0A'],
    pommel: 'round', pommelColor: '#F3EEDC',
  }),

  // Hunter (Rare, apples)
  k('bowie', 'hunter', 'rare', { a: 350 }, {
    blade: 'bowie', bladeLen: 46, bladeWidth: 14, bladeColors: STEEL, edge: '#FFFFFF', pattern: 'none',
    guard: 'bar', guardColors: ['#E9C77B', '#8A6526'], handle: 'grip', handleColors: ['#7C4A2A', '#3A1E0D'],
    pommel: 'round', pommelColor: '#E9C77B',
  }),
  k('ranger', 'hunter', 'rare', { a: 420 }, {
    blade: 'classic', bladeLen: 44, bladeWidth: 12, bladeColors: ['#E7EBDF', '#9EA88E', '#545E44'], edge: '#FFFFFF', pattern: 'none',
    guard: 'bar', guardColors: ['#5D6B45', '#2B331E'], handle: 'grip', handleColors: ['#6E7F4E', '#2F3820'],
    pommel: 'round', pommelColor: '#5D6B45',
  }),
  k('tracker', 'hunter', 'rare', { a: 480 }, {
    blade: 'tanto', bladeLen: 42, bladeWidth: 13, bladeColors: DARK_STEEL, edge: '#F4F7FB', pattern: 'none',
    guard: 'round', guardColors: ['#C08A51', '#6A4521'], handle: 'bone', handleColors: ['#F1E6CC', '#B3A27A'],
    pommel: 'round', pommelColor: '#C08A51',
  }),
  k('timberline', 'hunter', 'rare', { a: 540 }, {
    blade: 'bowie', bladeLen: 48, bladeWidth: 15, bladeColors: ['#F5EEE3', '#C7B394', '#7A6446'], edge: '#FFFFFF', pattern: 'damascus', patternColor: '#9C8462',
    guard: 'cross', guardColors: ['#A7713E', '#4F3014'], handle: 'wrapped', handleColors: ['#3E6B4C', '#173323'],
    pommel: 'gem', pommelColor: '#A7713E', gem: '#59D18A',
  }),
  k('wildwood', 'hunter', 'rare', { a: 600 }, {
    blade: 'leaf', bladeLen: 44, bladeWidth: 15, bladeColors: STEEL, edge: '#FFFFFF', pattern: 'none',
    guard: 'winged', guardColors: ['#8C5A2B', '#45270C'], handle: 'ornate', handleColors: ['#A06A35', '#4A2A0E'],
    pommel: 'spike', pommelColor: '#8C5A2B',
  }),

  // Ninja (Epic, apples or gems)
  k('kunai', 'ninja', 'epic', { a: 700, g: 20 }, {
    blade: 'kunai', bladeLen: 40, bladeWidth: 14, bladeColors: ['#5A6170', '#2C313B', '#0E1116'], edge: '#B7C1CF', pattern: 'none',
    guard: 'none', guardColors: ['#333', '#111'], handle: 'wrapped', handleColors: ['#C7273B', '#5B0B16'],
    pommel: 'ring', pommelColor: '#5A6170',
  }),
  k('shadow', 'ninja', 'epic', { a: 780, g: 22 }, {
    blade: 'tanto', bladeLen: 46, bladeWidth: 12, bladeColors: ['#4A4F5C', '#1E2129', '#07080B'], edge: '#9AA6B8', pattern: 'swirl', patternColor: '#5B6476',
    guard: 'disc', guardColors: ['#2B2E36', '#0B0C10'], handle: 'wrapped', handleColors: ['#3B3F4D', '#0E1015'],
    pommel: 'round', pommelColor: '#2B2E36',
  }),
  k('tanto', 'ninja', 'epic', { a: 850, g: 24 }, {
    blade: 'tanto', bladeLen: 46, bladeWidth: 13, bladeColors: STEEL, edge: '#FFFFFF', pattern: 'damascus', patternColor: '#9AA4B2',
    guard: 'disc', guardColors: ['#E2B24A', '#7B5713'], handle: 'wrapped', handleColors: ['#2A3550', '#0C1222'],
    pommel: 'round', pommelColor: '#E2B24A',
  }),
  k('sakura', 'ninja', 'epic', { a: 920, g: 27 }, {
    blade: 'leaf', bladeLen: 46, bladeWidth: 13, bladeColors: ['#FFF1F5', '#F4B6C8', '#B9607E'], edge: '#FFFFFF', pattern: 'swirl', patternColor: '#E58AA6',
    guard: 'disc', guardColors: ['#FFD3E0', '#C46A88'], handle: 'wrapped', handleColors: ['#3B2433', '#140A11'],
    pommel: 'gem', pommelColor: '#F4B6C8', gem: '#FF6F9C',
  }),
  k('moonlit', 'ninja', 'epic', { a: 1000, g: 30 }, {
    blade: 'scimitar', bladeLen: 48, bladeWidth: 12, bladeColors: ['#F0F3FF', '#9EAAD8', '#4B5591'], edge: '#FFFFFF', pattern: 'stars', patternColor: '#FFFFFF',
    guard: 'disc', guardColors: ['#C9CFE8', '#5D648A'], handle: 'wrapped', handleColors: ['#2D2F5E', '#0E0F26'],
    pommel: 'gem', pommelColor: '#C9CFE8', gem: '#9FB4FF',
  }),

  // Ice (Epic)
  k('icicle', 'ice', 'epic', { a: 800, g: 25 }, {
    blade: 'needle', bladeLen: 50, bladeWidth: 10, bladeColors: ['#FFFFFF', '#AEE6FF', '#3D9BD1'], edge: '#FFFFFF', pattern: 'frost', patternColor: '#E5F7FF',
    guard: 'cross', guardColors: ['#DDF4FF', '#5FA9D6'], handle: 'ringed', handleColors: ['#BFE8FF', '#4F8EB8'],
    pommel: 'spike', pommelColor: '#DDF4FF',
  }),
  k('glacier', 'ice', 'epic', { a: 900, g: 28 }, {
    blade: 'crystal', bladeLen: 46, bladeWidth: 15, bladeColors: ['#F2FCFF', '#8FD6F5', '#2D7DB0'], edge: '#FFFFFF', pattern: 'frost', patternColor: '#FFFFFF',
    guard: 'winged', guardColors: ['#CFEFFF', '#4E95C2'], handle: 'grip', handleColors: ['#2F5F86', '#10273D'],
    pommel: 'gem', pommelColor: '#CFEFFF', gem: '#7FE3FF',
  }),
  k('frostbite', 'ice', 'epic', { a: 1000, g: 31 }, {
    blade: 'kris', bladeLen: 46, bladeWidth: 13, bladeColors: ['#F7FDFF', '#A3DDF7', '#3E8CC0'], edge: '#FFFFFF', pattern: 'frost', patternColor: '#FFFFFF',
    guard: 'round', guardColors: ['#D7F2FF', '#5799C4'], handle: 'wrapped', handleColors: ['#E9F7FF', '#7FB5D9'],
    pommel: 'round', pommelColor: '#D7F2FF',
  }),
  k('aurora', 'ice', 'epic', { a: 1100, g: 35 }, {
    blade: 'leaf', bladeLen: 48, bladeWidth: 14, bladeColors: ['#E8FFF6', '#7BE0C3', '#5B6BD6'], edge: '#FFFFFF', pattern: 'swirl', patternColor: '#C9B6FF',
    guard: 'winged', guardColors: ['#BFF5E6', '#5A8BC9'], handle: 'ornate', handleColors: ['#3A4A9E', '#151C4A'],
    pommel: 'gem', pommelColor: '#BFF5E6', gem: '#A98BFF',
  }),

  // Cyber Neon (Epic)
  k('pulse', 'cyber', 'epic', { a: 900, g: 25 }, {
    blade: 'tanto', bladeLen: 46, bladeWidth: 12, bladeColors: ['#1E2233', '#121522', '#06070D'], edge: '#29F0FF', pattern: 'circuit', patternColor: '#29F0FF',
    guard: 'bar', guardColors: ['#2A2F45', '#0B0D16'], handle: 'grip', handleColors: ['#262A3C', '#0A0B12'],
    pommel: 'gem', pommelColor: '#2A2F45', gem: '#29F0FF',
  }),
  k('circuit', 'cyber', 'epic', { a: 1000, g: 28 }, {
    blade: 'classic', bladeLen: 46, bladeWidth: 13, bladeColors: ['#2A1F3D', '#170F25', '#07040D'], edge: '#FF3DF2', pattern: 'circuit', patternColor: '#FF3DF2',
    guard: 'cross', guardColors: ['#3A2E52', '#130C1F'], handle: 'ringed', handleColors: ['#2E2440', '#0B0712'],
    pommel: 'gem', pommelColor: '#3A2E52', gem: '#FF3DF2',
  }),
  k('glitch', 'cyber', 'epic', { a: 1100, g: 31 }, {
    blade: 'kunai', bladeLen: 42, bladeWidth: 14, bladeColors: ['#1D2B22', '#0F1A13', '#040806'], edge: '#5CFF8A', pattern: 'circuit', patternColor: '#5CFF8A',
    guard: 'none', guardColors: ['#333', '#111'], handle: 'grip', handleColors: ['#22302A', '#08100C'],
    pommel: 'ring', pommelColor: '#5CFF8A',
  }),
  k('laser', 'cyber', 'epic', { a: 1200, g: 35 }, {
    blade: 'needle', bladeLen: 52, bladeWidth: 10, bladeColors: ['#FFF0F0', '#FF6B6B', '#B3122E'], edge: '#FFFFFF', pattern: 'none',
    guard: 'disc', guardColors: ['#C9CED9', '#4B5160'], handle: 'ringed', handleColors: ['#3D4250', '#12141A'],
    pommel: 'gem', pommelColor: '#C9CED9', gem: '#FF4D6D',
  }),

  // Voodoo (Epic)
  k('hex', 'voodoo', 'epic', { a: 1000, g: 30 }, {
    blade: 'kris', bladeLen: 46, bladeWidth: 13, bladeColors: ['#E4D8FF', '#8D6BD6', '#3A2378'], edge: '#F3EDFF', pattern: 'runes', patternColor: '#C7F25C',
    guard: 'skull', guardColors: ['#F1EAD6', '#9E9374'], handle: 'wrapped', handleColors: ['#4B2C6E', '#1D0F2E'],
    pommel: 'gem', pommelColor: '#F1EAD6', gem: '#C7F25C',
  }),
  k('totem', 'voodoo', 'epic', { a: 1100, g: 33 }, {
    blade: 'leaf', bladeLen: 44, bladeWidth: 15, bladeColors: ['#F2E2C7', '#C79A5B', '#6E4A1C'], edge: '#FFF6E6', pattern: 'runes', patternColor: '#E2522F',
    guard: 'winged', guardColors: ['#E2522F', '#7A2410'], handle: 'ornate', handleColors: ['#8A5A2A', '#3B220A'],
    pommel: 'spike', pommelColor: '#E2522F',
  }),
  k('bayou', 'voodoo', 'epic', { a: 1200, g: 36 }, {
    blade: 'hook', bladeLen: 44, bladeWidth: 13, bladeColors: ['#D9F2D0', '#6FAF6A', '#25552B'], edge: '#F1FFEE', pattern: 'swirl', patternColor: '#B8F28E',
    guard: 'ring', guardColors: ['#A68B5B', '#4F3E20'], handle: 'bone', handleColors: ['#EDE3C8', '#A99A72'],
    pommel: 'round', pommelColor: '#A68B5B',
  }),
  k('spirit', 'voodoo', 'epic', { a: 1300, g: 40 }, {
    blade: 'flame', bladeLen: 48, bladeWidth: 14, bladeColors: ['#EFFFFB', '#7DF2D9', '#1B8C86'], edge: '#FFFFFF', pattern: 'runes', patternColor: '#FFFFFF',
    guard: 'skull', guardColors: ['#E6F7F2', '#7FA59A'], handle: 'wrapped', handleColors: ['#1F3B45', '#081419'],
    pommel: 'gem', pommelColor: '#E6F7F2', gem: '#7DF2D9',
  }),

  // Cosmic (Legendary, gems)
  k('nebula', 'cosmic', 'legendary', { g: 50 }, {
    blade: 'leaf', bladeLen: 48, bladeWidth: 14, bladeColors: ['#FFD6FA', '#B05CFF', '#2B1172'], edge: '#FFFFFF', pattern: 'stars', patternColor: '#FFFFFF',
    guard: 'winged', guardColors: ['#E3C6FF', '#5B2DA8'], handle: 'ornate', handleColors: ['#3A1C7A', '#120634'],
    pommel: 'gem', pommelColor: '#E3C6FF', gem: '#FF7AF0', glow: '#C77DFF',
  }),
  k('comet', 'cosmic', 'legendary', { g: 56 }, {
    blade: 'flame', bladeLen: 50, bladeWidth: 14, bladeColors: ['#FFFFFF', '#8FD3FF', '#2A4CB8'], edge: '#FFFFFF', pattern: 'stars', patternColor: '#FFFFFF',
    guard: 'disc', guardColors: ['#D5ECFF', '#3A64B8'], handle: 'ringed', handleColors: ['#22357A', '#0A1236'],
    pommel: 'gem', pommelColor: '#D5ECFF', gem: '#7FD8FF', glow: '#6FC8FF',
  }),
  k('galaxy', 'cosmic', 'legendary', { g: 63 }, {
    blade: 'crystal', bladeLen: 48, bladeWidth: 15, bladeColors: ['#F8E1FF', '#6A4BFF', '#120A4A'], edge: '#FFFFFF', pattern: 'stars', patternColor: '#FFF6B0',
    guard: 'winged', guardColors: ['#BFAFFF', '#3B2A9E'], handle: 'ornate', handleColors: ['#2A1E6E', '#0A0626'],
    pommel: 'crown', pommelColor: '#BFAFFF', gem: '#FFE36E', glow: '#8C7BFF',
  }),
  k('supernova', 'cosmic', 'legendary', { g: 70 }, {
    blade: 'flame', bladeLen: 52, bladeWidth: 15, bladeColors: ['#FFFDF0', '#FFB347', '#E0311E'], edge: '#FFFFFF', pattern: 'stars', patternColor: '#FFFFFF',
    guard: 'winged', guardColors: ['#FFE08A', '#B5520F'], handle: 'ornate', handleColors: ['#7A1E0E', '#2B0802'],
    pommel: 'gem', pommelColor: '#FFE08A', gem: '#FF5A36', glow: '#FF8A3D',
  }),

  // Royal (Legendary, gems)
  k('scepter', 'royal', 'legendary', { g: 70 }, {
    blade: 'needle', bladeLen: 50, bladeWidth: 11, bladeColors: GOLD, edge: '#FFFFFF', pattern: 'none',
    guard: 'ring', guardColors: ['#FFF3B0', '#9A6408'], handle: 'ornate', handleColors: ['#7B1E3A', '#2E0614'],
    pommel: 'crown', pommelColor: '#F2B531', gem: '#E0115F', glow: '#FFD45C',
  }),
  k('regal', 'royal', 'legendary', { g: 76 }, {
    blade: 'dagger', bladeLen: 48, bladeWidth: 14, bladeColors: ['#FFFFFF', '#D8DEE9', '#8892A6'], edge: '#FFFFFF', pattern: 'swirl', patternColor: '#F2B531',
    guard: 'winged', guardColors: ['#FFF3B0', '#9A6408'], handle: 'ornate', handleColors: ['#1C3F8C', '#081A40'],
    pommel: 'gem', pommelColor: '#F2B531', gem: '#3D7BFF', glow: '#9CC2FF',
  }),
  k('empress', 'royal', 'legendary', { g: 83 }, {
    blade: 'leaf', bladeLen: 48, bladeWidth: 14, bladeColors: ['#FFF4FA', '#F6B9D5', '#B0517F'], edge: '#FFFFFF', pattern: 'swirl', patternColor: '#FFF3B0',
    guard: 'winged', guardColors: ['#FFF3B0', '#9A6408'], handle: 'ornate', handleColors: ['#F4F0FA', '#A99BBE'],
    pommel: 'crown', pommelColor: '#F2B531', gem: '#FF7AB6', glow: '#FFB3D9',
  }),
  k('sovereign', 'royal', 'legendary', { g: 90 }, {
    blade: 'scimitar', bladeLen: 52, bladeWidth: 14, bladeColors: GOLD, edge: '#FFFFFF', pattern: 'runes', patternColor: '#FFFFFF',
    guard: 'winged', guardColors: ['#FFFFFF', '#B9C3D0'], handle: 'ornate', handleColors: ['#5A0F2E', '#1E0410'],
    pommel: 'crown', pommelColor: '#F2B531', gem: '#18C29C', glow: '#FFE07A',
  }),

  // Boss exclusives (first win over bosses 1–10)
  k('pumpkin_fang', 'boss', 'epic', { boss: 0 }, {
    blade: 'sickle', bladeLen: 44, bladeWidth: 14, bladeColors: ['#FFE2B8', '#FF9A2E', '#A44A00'], edge: '#FFF6E6', pattern: 'none',
    guard: 'round', guardColors: ['#6FB24A', '#2D5A17'], handle: 'grip', handleColors: ['#5E8A35', '#24410F'],
    pommel: 'round', pommelColor: '#6FB24A',
  }),
  k('crystal_shard', 'boss', 'epic', { boss: 1 }, {
    blade: 'crystal', bladeLen: 48, bladeWidth: 16, bladeColors: ['#FFFFFF', '#9BE7FF', '#3474D6'], edge: '#FFFFFF', pattern: 'frost', patternColor: '#FFFFFF',
    guard: 'cross', guardColors: ['#E2F7FF', '#6EA8E0'], handle: 'ringed', handleColors: ['#2C4F94', '#0E1E45'],
    pommel: 'gem', pommelColor: '#E2F7FF', gem: '#7FE3FF',
  }),
  k('iron_will', 'boss', 'epic', { boss: 2 }, {
    blade: 'cleaver', bladeLen: 42, bladeWidth: 18, bladeColors: ['#D3D9E2', '#7F8A9A', '#363D49'], edge: '#FFFFFF', pattern: 'serrated',
    guard: 'disc', guardColors: ['#B8C0CC', '#4A5260'], handle: 'grip', handleColors: ['#4A5260', '#1A1E25'],
    pommel: 'spike', pommelColor: '#B8C0CC',
  }),
  k('pizza_cutter', 'boss', 'epic', { boss: 3 }, {
    blade: 'leaf', bladeLen: 44, bladeWidth: 15, bladeColors: ['#FFF4CC', '#F5C04A', '#C0561E'], edge: '#FFFFFF', pattern: 'swirl', patternColor: '#E0412A',
    guard: 'round', guardColors: ['#FFFFFF', '#C93A2B'], handle: 'ringed', handleColors: ['#E0412A', '#7C1408'],
    pommel: 'round', pommelColor: '#FFFFFF',
  }),
  k('gear_blade', 'boss', 'epic', { boss: 4 }, {
    blade: 'tanto', bladeLen: 46, bladeWidth: 13, bladeColors: ['#F4E3C1', '#C9963F', '#6E4A12'], edge: '#FFF6E0', pattern: 'circuit', patternColor: '#6E4A12',
    guard: 'ring', guardColors: ['#E0B65C', '#7A5512'], handle: 'ringed', handleColors: ['#5A4A3A', '#211912'],
    pommel: 'ring', pommelColor: '#E0B65C',
  }),
  k('lava_edge', 'boss', 'epic', { boss: 5 }, {
    blade: 'flame', bladeLen: 48, bladeWidth: 14, bladeColors: ['#FFF2B0', '#FF7A1A', '#8E1405'], edge: '#FFFBE0', pattern: 'swirl', patternColor: '#FFD15C',
    guard: 'winged', guardColors: ['#4A2B26', '#160A08'], handle: 'grip', handleColors: ['#3A1F1A', '#0F0604'],
    pommel: 'gem', pommelColor: '#4A2B26', gem: '#FF5A1A',
  }),
  k('voodoo_needle', 'boss', 'legendary', { boss: 6 }, {
    blade: 'needle', bladeLen: 52, bladeWidth: 11, bladeColors: ['#F5E6FF', '#B26BFF', '#3E0F7A'], edge: '#FFFFFF', pattern: 'runes', patternColor: '#C7F25C',
    guard: 'skull', guardColors: ['#F1EAD6', '#9E9374'], handle: 'wrapped', handleColors: ['#C7F25C', '#4B6B0E'],
    pommel: 'gem', pommelColor: '#F1EAD6', gem: '#B26BFF', glow: '#B26BFF',
  }),
  k('moon_sickle', 'boss', 'legendary', { boss: 7 }, {
    blade: 'sickle', bladeLen: 48, bladeWidth: 15, bladeColors: ['#FFFFFF', '#C7D6FF', '#5D6FB8'], edge: '#FFFFFF', pattern: 'stars', patternColor: '#FFFFFF',
    guard: 'disc', guardColors: ['#E5ECFF', '#6A79B8'], handle: 'ornate', handleColors: ['#2A356E', '#0B1030'],
    pommel: 'crown', pommelColor: '#E5ECFF', gem: '#9FD0FF', glow: '#BFD3FF',
  }),
  k('cactus_thorn', 'boss', 'legendary', { boss: 8 }, {
    blade: 'kris', bladeLen: 48, bladeWidth: 13, bladeColors: ['#E9FFD9', '#6CC24A', '#1F6A21'], edge: '#FFFFFF', pattern: 'serrated',
    guard: 'winged', guardColors: ['#FF8FB1', '#B0365E'], handle: 'grip', handleColors: ['#C99A5B', '#6B4718'],
    pommel: 'gem', pommelColor: '#C99A5B', gem: '#FF6F9C', glow: '#9BFF7A',
  }),
  k('crown_jewel', 'boss', 'legendary', { boss: 9 }, {
    blade: 'dagger', bladeLen: 50, bladeWidth: 14, bladeColors: GOLD, edge: '#FFFFFF', pattern: 'damascus', patternColor: '#FFF3B0',
    guard: 'winged', guardColors: ['#FFFFFF', '#B9C3D0'], handle: 'ornate', handleColors: ['#7A0F1E', '#2A0309'],
    pommel: 'crown', pommelColor: '#F2B531', gem: '#E01133', glow: '#FFD45C',
  }),
];

export const KNIFE_BY_ID: Record<string, KnifeDef> = Object.fromEntries(KNIVES.map((kn) => [kn.id, kn]));

export const DEFAULT_KNIFE_ID = 'classic';

export const COLLECTION_ORDER: readonly CollectionId[] = [
  'starter',
  'kitchen',
  'pirate',
  'hunter',
  'ninja',
  'ice',
  'cyber',
  'voodoo',
  'cosmic',
  'royal',
  'boss',
];

/** One-time bonus for owning every knife in a collection. */
export const COLLECTION_BONUS: Record<CollectionId, { apples: number; gems: number }> = {
  starter: { apples: 0, gems: 0 },
  kitchen: { apples: 150, gems: 0 },
  pirate: { apples: 250, gems: 0 },
  hunter: { apples: 300, gems: 0 },
  ninja: { apples: 0, gems: 10 },
  ice: { apples: 0, gems: 10 },
  cyber: { apples: 0, gems: 12 },
  voodoo: { apples: 0, gems: 12 },
  cosmic: { apples: 0, gems: 25 },
  royal: { apples: 0, gems: 30 },
  boss: { apples: 0, gems: 40 },
};

export const RARITY_COLORS: Record<Rarity, { frame: string; light: string; dark: string }> = {
  common: { frame: '#9AA7B8', light: '#DCE3EC', dark: '#4F5B6B' },
  rare: { frame: '#3FA0FF', light: '#9FD2FF', dark: '#1B4C8C' },
  epic: { frame: '#B45CFF', light: '#DDB4FF', dark: '#4E1A8C' },
  legendary: { frame: '#FFB21E', light: '#FFE39A', dark: '#8C5200' },
};
