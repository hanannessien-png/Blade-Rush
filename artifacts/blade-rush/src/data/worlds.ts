/**
 * 12 worlds of 5 stages each (the 5th is a boss). Each world has its own
 * palette, target material, parallax silhouettes, ambient particles and music.
 * Names live in src/strings.ts under `worlds`.
 */
export type TargetMaterial =
  | 'wood'
  | 'orchard'
  | 'ice'
  | 'sandstone'
  | 'lavarock'
  | 'neon'
  | 'haunted'
  | 'barrel'
  | 'asteroid'
  | 'candy'
  | 'stone'
  | 'gold';

export type Silhouette =
  | 'workshop'
  | 'trees'
  | 'stalactites'
  | 'mesas'
  | 'volcano'
  | 'skyline'
  | 'manor'
  | 'cove'
  | 'planets'
  | 'candyhills'
  | 'temple'
  | 'palace';

export type AmbientParticle =
  | 'dust'
  | 'leaves'
  | 'snow'
  | 'sand'
  | 'embers'
  | 'neon'
  | 'wisps'
  | 'bubbles'
  | 'stars'
  | 'sprinkles'
  | 'motes'
  | 'sparkles';

export type MusicTrack = 'workshop' | 'frost' | 'desert' | 'volcano' | 'neon' | 'candy';

export interface WorldDef {
  id: string;
  /** Sky gradient top → bottom. */
  sky: readonly [string, string, string];
  /** Far and near silhouette colors. */
  far: string;
  near: string;
  /** Glow color behind the target. */
  glow: string;
  /** Target material colors: light, mid, dark, ring/detail. */
  target: readonly [string, string, string, string];
  material: TargetMaterial;
  silhouette: Silhouette;
  particle: AmbientParticle;
  particleColor: string;
  music: MusicTrack;
}

export const WORLDS: readonly WorldDef[] = [
  {
    id: 'workshop', sky: ['#2A1A3E', '#5B3A4E', '#C27A4A'], far: '#3A2436', near: '#24141F', glow: '#FFB46B',
    target: ['#F2C27B', '#D08E45', '#7A4A1E', '#A8692E'], material: 'wood', silhouette: 'workshop',
    particle: 'dust', particleColor: '#FFD9A0', music: 'workshop',
  },
  {
    id: 'orchard', sky: ['#1D3B5C', '#3E7A6E', '#A8D27A'], far: '#2C5A48', near: '#173628', glow: '#FFF0A0',
    target: ['#F5D49A', '#C99456', '#6E4720', '#9C6A36'], material: 'orchard', silhouette: 'trees',
    particle: 'leaves', particleColor: '#9FE07A', music: 'workshop',
  },
  {
    id: 'frozen', sky: ['#0B1F4A', '#1F5A9E', '#8FD6F5'], far: '#2A5C94', near: '#173C6A', glow: '#BDF0FF',
    target: ['#F2FCFF', '#A6E3FA', '#3E8CC9', '#D6F5FF'], material: 'ice', silhouette: 'stalactites',
    particle: 'snow', particleColor: '#FFFFFF', music: 'frost',
  },
  {
    id: 'desert', sky: ['#3A1F4E', '#C2553A', '#F5B25C'], far: '#9A4630', near: '#5E2618', glow: '#FFD98A',
    target: ['#F7D8A8', '#D9A066', '#8C5426', '#B57A40'], material: 'sandstone', silhouette: 'mesas',
    particle: 'sand', particleColor: '#FFE2B0', music: 'desert',
  },
  {
    id: 'volcano', sky: ['#14060A', '#4A0F12', '#C2361A'], far: '#3A0C0C', near: '#1C0506', glow: '#FF7A2E',
    target: ['#5A4A48', '#3A2E2D', '#171111', '#FF6A1A'], material: 'lavarock', silhouette: 'volcano',
    particle: 'embers', particleColor: '#FFB347', music: 'volcano',
  },
  {
    id: 'neon', sky: ['#07051A', '#1E0B4A', '#4A1680'], far: '#1A1046', near: '#0B0724', glow: '#FF3DF2',
    target: ['#2A2F4A', '#1A1D33', '#08091A', '#29F0FF'], material: 'neon', silhouette: 'skyline',
    particle: 'neon', particleColor: '#29F0FF', music: 'neon',
  },
  {
    id: 'haunted', sky: ['#0C0A1E', '#2A1B4A', '#5A3E7A'], far: '#251838', near: '#120B1E', glow: '#C7F25C',
    target: ['#9C8AAE', '#6A587E', '#2E2240', '#4A3A5E'], material: 'haunted', silhouette: 'manor',
    particle: 'wisps', particleColor: '#D9FFB0', music: 'volcano',
  },
  {
    id: 'cove', sky: ['#0E2E4E', '#1F7A9E', '#7FE0D6'], far: '#1A5470', near: '#0C2E40', glow: '#FFE7A0',
    target: ['#E0B07A', '#B07A40', '#5E3A16', '#3A3F48'], material: 'barrel', silhouette: 'cove',
    particle: 'bubbles', particleColor: '#CFFFF8', music: 'desert',
  },
  {
    id: 'space', sky: ['#02030C', '#0C1240', '#2A1A6E'], far: '#1A1E52', near: '#0A0C26', glow: '#8C7BFF',
    target: ['#A8A0B8', '#6E667E', '#2E2A3A', '#C9C2D9'], material: 'asteroid', silhouette: 'planets',
    particle: 'stars', particleColor: '#FFFFFF', music: 'neon',
  },
  {
    id: 'candy', sky: ['#5A1E6E', '#E05AA8', '#FFC2DE'], far: '#C2408A', near: '#8A1E5E', glow: '#FFF0A0',
    target: ['#FFF0F6', '#FF8FC2', '#C2306E', '#7FE0FF'], material: 'candy', silhouette: 'candyhills',
    particle: 'sprinkles', particleColor: '#FFFFFF', music: 'candy',
  },
  {
    id: 'temple', sky: ['#0E2A22', '#2E6A4E', '#B5C77A'], far: '#2A4E3A', near: '#142A1E', glow: '#7FFFE0',
    target: ['#D9CCA8', '#A8986E', '#5A4E32', '#2FD1B8'], material: 'stone', silhouette: 'temple',
    particle: 'motes', particleColor: '#E8FFB0', music: 'frost',
  },
  {
    id: 'palace', sky: ['#1A0E3E', '#5A2A8E', '#F2A65A'], far: '#4A2470', near: '#260F40', glow: '#FFE07A',
    target: ['#FFF0B0', '#F2B531', '#8A5A00', '#E01133'], material: 'gold', silhouette: 'palace',
    particle: 'sparkles', particleColor: '#FFF3B0', music: 'candy',
  },
];
