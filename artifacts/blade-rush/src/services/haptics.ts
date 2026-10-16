/**
 * Haptics: light on stick, medium on apple, heavy on fail, success on boss win.
 * Silently does nothing on web or when the player turned vibration off.
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticKind = 'light' | 'medium' | 'heavy' | 'success' | 'select';

let enabled = true;

export function setHapticsEnabled(on: boolean): void {
  enabled = on;
}

export function haptic(kind: HapticKind): void {
  if (!enabled || Platform.OS === 'web') return;
  let p: Promise<void>;
  switch (kind) {
    case 'light':
      p = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'medium':
      p = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'heavy':
      p = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case 'success':
      p = Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'select':
      p = Haptics.selectionAsync();
      break;
  }
  p.catch(() => {});
}
