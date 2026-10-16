/**
 * Twirlblade design tokens. The game is always dark ("twilight carnival"):
 * deep indigo night, glossy candy-colored buttons, warm gold highlights.
 */
const palette = {
  text: '#FFFFFF',
  tint: '#FFB21E',

  background: '#0B1340',
  foreground: '#FFFFFF',

  card: '#18215E',
  cardForeground: '#FFFFFF',

  primary: '#FFB21E',
  primaryForeground: '#3A1A00',

  secondary: '#2FD7C4',
  secondaryForeground: '#05302E',

  muted: '#232E7A',
  mutedForeground: '#AEB8F0',

  accent: '#FF4FA3',
  accentForeground: '#FFFFFF',

  destructive: '#FF5A5A',
  destructiveForeground: '#FFFFFF',

  border: '#33409A',
  input: '#33409A',
};

const colors = {
  light: palette,
  dark: palette,
  radius: 18,
};

/** Extended game tokens used by the UI kit. */
export const game = {
  bgDeep: '#070C2B',
  bg: '#0B1340',
  bgTop: '#1B1F6B',
  surface: '#18215E',
  surfaceHi: '#232E7A',
  surfaceLo: '#111850',
  stroke: '#33409A',
  strokeHi: '#4C5BC4',
  text: '#FFFFFF',
  textDim: '#C3CBF5',
  textMute: '#8792D4',
  outline: '#1A0F3D',
  shadow: '#050826',
  overlay: 'rgba(5, 8, 38, 0.78)',
  overlayLight: 'rgba(5, 8, 38, 0.5)',
  apple: '#FF4D4D',
  appleDark: '#A3141B',
  leaf: '#4CB648',
  gem: '#5CE1FF',
  gemDark: '#1E64B4',
  gold: '#FFD23F',
  goldDark: '#B07A00',
  success: '#5BE36A',
  danger: '#FF5A5A',
  bronze: '#D98A4E',
  silver: '#C9D3E3',
  white: '#FFFFFF',
  black: '#000000',
  wood: '#C98A4B',
  woodDark: '#7A4A22',
  mint: '#7DFF9A',
  teal: '#2FD7C4',
  crimson: '#B3122A',
  adTop: '#2B0F4F',
  adMid: '#5A1E8C',
  adBottom: '#E0258A',
  transparent: 'transparent',
  /** Glossy button skins: top, bottom, edge (3D lip), text. */
  buttons: {
    primary: { top: '#FFD55A', bottom: '#FF8A1A', edge: '#B04A00', text: '#FFFFFF' },
    secondary: { top: '#5CF0DD', bottom: '#14A9A0', edge: '#0B6467', text: '#FFFFFF' },
    accent: { top: '#FF7EC0', bottom: '#E0258A', edge: '#8C0A4B', text: '#FFFFFF' },
    blue: { top: '#7BAAFF', bottom: '#2F62E6', edge: '#1A3699', text: '#FFFFFF' },
    green: { top: '#8BF27A', bottom: '#27B048', edge: '#136B2A', text: '#FFFFFF' },
    danger: { top: '#FF8A8A', bottom: '#E0313F', edge: '#8A1220', text: '#FFFFFF' },
    dark: { top: '#3A47A8', bottom: '#222C7A', edge: '#121850', text: '#FFFFFF' },
    gold: { top: '#FFF0A0', bottom: '#F2B531', edge: '#8A5A00', text: '#5A3400' },
    disabled: { top: '#5B6290', bottom: '#3E4470', edge: '#262B50', text: '#B5BAD9' },
  },
  rarity: {
    common: { frame: '#9AA7B8', light: '#DCE3EC', dark: '#4F5B6B' },
    rare: { frame: '#3FA0FF', light: '#9FD2FF', dark: '#1B4C8C' },
    epic: { frame: '#B45CFF', light: '#DDB4FF', dark: '#4E1A8C' },
    legendary: { frame: '#FFB21E', light: '#FFE39A', dark: '#8C5200' },
  },
  tiers: {
    bronze: { top: '#F2B27E', bottom: '#B0642E', edge: '#6B3412' },
    silver: { top: '#F2F6FF', bottom: '#9AA7BE', edge: '#4F5B6B' },
    gold: { top: '#FFF0A0', bottom: '#F2B531', edge: '#8A5A00' },
  },
} as const;

export type ButtonSkin = keyof typeof game.buttons;

export const fonts = {
  display: 'LilitaOne_400Regular',
  body: 'Nunito_700Bold',
  bodyBold: 'Nunito_800ExtraBold',
  bodyBlack: 'Nunito_900Black',
} as const;

export default colors;
