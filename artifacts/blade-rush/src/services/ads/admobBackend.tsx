/**
 * Web build: AdMob does not exist here, so the preview uses the mock service.
 * The Android build resolves admobBackend.native.tsx instead.
 */
import type { ComponentType } from 'react';
import type { AdBackend } from './types';

export const admobBackend: AdBackend | null = null;

export interface NativeBannerProps {
  unitId: string;
  nonPersonalized: boolean;
  onFailed(): void;
}

export function getNativeBanner(): ComponentType<NativeBannerProps> | null {
  return null;
}
