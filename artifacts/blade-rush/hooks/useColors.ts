import colors from '@/constants/colors';

/** Design tokens (the game uses one dark palette in every color scheme). */
export function useColors() {
  return { ...colors.dark, radius: colors.radius };
}
