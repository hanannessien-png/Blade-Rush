/** Glossy apple and gem icons for currency counters and price tags. */
import React, { useId } from 'react';
import Svg, { Defs, Ellipse, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

export type Currency = 'apples' | 'gems';

// Gradient ids must be unique per instance: on web they share one document.
const safeId = (raw: string) => raw.replace(/[^a-zA-Z0-9_-]/g, '');

export function AppleIcon({ size = 24 }: { size?: number }) {
  const id = `tbApple${safeId(useId())}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <RadialGradient id={id} cx="38%" cy="35%" r="70%">
          <Stop offset="0" stopColor="#FF9C8F" />
          <Stop offset="0.5" stopColor="#F02E33" />
          <Stop offset="1" stopColor="#8E0E14" />
        </RadialGradient>
      </Defs>
      <Path d="M16 10c3-3.6 9.5-3 11 2.2 1.4 4.8-1 11.4-5 13.6-2 1.2-3.8.6-6 .2-2.2.4-4 1-6-.2-4-2.2-6.4-8.8-5-13.6C6.5 7 13 6.4 16 10z" fill="#5A0A0E" transform="translate(0.8 1.2)" opacity={0.45} />
      <Path d="M16 10c3-3.6 9.5-3 11 2.2 1.4 4.8-1 11.4-5 13.6-2 1.2-3.8.6-6 .2-2.2.4-4 1-6-.2-4-2.2-6.4-8.8-5-13.6C6.5 7 13 6.4 16 10z" fill={`url(#${id})`} stroke="#5A0A0E" strokeWidth={1.4} />
      <Ellipse cx="11" cy="14" rx="2.2" ry="3.4" fill="#FFFFFF" opacity={0.65} transform="rotate(-20 11 14)" />
      <Path d="M16 10.5c0-2.5.6-4.5 2-6" stroke="#5A3A1A" strokeWidth={2.2} strokeLinecap="round" fill="none" />
      <Path d="M18 6.5c2-2.6 5.4-2.8 7-1.6-1.6 2.6-4.6 3-7 1.6z" fill="#4CB648" stroke="#22621F" strokeWidth={1} />
    </Svg>
  );
}

export function GemIcon({ size = 24 }: { size?: number }) {
  const id = `tbGem${safeId(useId())}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#E8FDFF" />
          <Stop offset="0.45" stopColor="#5CE1FF" />
          <Stop offset="1" stopColor="#1E64B4" />
        </LinearGradient>
      </Defs>
      <Path d="M9 6h14l6 7-13 14L3 13z" fill="#0B2F66" opacity={0.45} transform="translate(0.8 1.2)" />
      <Path d="M9 6h14l6 7-13 14L3 13z" fill={`url(#${id})`} stroke="#0B2F66" strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M3 13h26M9 6l3 7 4-7 4 7 3-7M12 13l4 14 4-14" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={1} fill="none" />
      <Path d="M9.5 7.5l2 4.5H5.6z" fill="#FFFFFF" opacity={0.7} />
    </Svg>
  );
}

export function CurrencyIcon({ kind, size = 24 }: { kind: Currency; size?: number }) {
  return kind === 'apples' ? <AppleIcon size={size} /> : <GemIcon size={size} />;
}
