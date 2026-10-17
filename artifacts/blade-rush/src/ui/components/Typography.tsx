/**
 * Display text: the chunky heading font with an outline and drop shadow.
 * Body text: the clean rounded sans.
 */
import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { fonts, game } from '@/constants/colors';

interface DisplayProps {
  children: React.ReactNode;
  size?: number;
  color?: string;
  outline?: string;
  /** Outline thickness; 0 disables the outline. */
  stroke?: number;
  align?: 'left' | 'center' | 'right';
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  numberOfLines?: number;
}

export const DisplayText = React.memo(function DisplayText({
  children,
  size = 28,
  color = game.white,
  outline = game.outline,
  stroke,
  align = 'center',
  style,
  containerStyle,
  numberOfLines,
}: DisplayProps) {
  const w = stroke ?? Math.max(1.5, Math.round(size / 12));
  const base: TextStyle = {
    fontFamily: fonts.display,
    fontSize: size,
    lineHeight: Math.round(size * 1.18),
    textAlign: align,
    letterSpacing: 0.5,
  };
  // Thin outlines look the same with four diagonal copies; that halves the text nodes.
  const offsets = w <= 0 ? [] : w <= 2 ? DIAGONALS.map(([x, y]) => [x * w, y * w] as const) : OFFSETS.map(([x, y]) => [x * w, y * w] as const);
  return (
    <View style={containerStyle}>
      {offsets.map(([dx, dy], i) => (
        <Text
          key={i}
          aria-hidden
          numberOfLines={numberOfLines}
          style={[base, style, styles.copy, { color: outline, transform: [{ translateX: dx }, { translateY: dy }] }]}
        >
          {children}
        </Text>
      ))}
      {w > 0 && (
        <Text aria-hidden numberOfLines={numberOfLines} style={[base, style, styles.copy, { color: outline, transform: [{ translateY: w + size * 0.08 }] }]}>
          {children}
        </Text>
      )}
      <Text numberOfLines={numberOfLines} style={[base, style, { color }]}>
        {children}
      </Text>
    </View>
  );
});

const DIAGONALS: readonly (readonly [number, number])[] = [
  [0.85, 0.85],
  [-0.85, 0.85],
  [0.85, -0.85],
  [-0.85, -0.85],
];

const OFFSETS: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [0.7, 0.7],
  [-0.7, 0.7],
  [0.7, -0.7],
  [-0.7, -0.7],
];

interface BodyProps {
  children: React.ReactNode;
  size?: number;
  color?: string;
  weight?: 'regular' | 'bold' | 'black';
  align?: 'left' | 'center' | 'right';
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  shadow?: boolean;
}

export function BodyText({ children, size = 15, color = game.textDim, weight = 'regular', align = 'left', style, numberOfLines, shadow }: BodyProps) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily: weight === 'black' ? fonts.bodyBlack : weight === 'bold' ? fonts.bodyBold : fonts.body,
          fontSize: size,
          lineHeight: Math.round(size * 1.35),
          color,
          textAlign: align,
        },
        shadow && styles.shadow,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  copy: {
    ...StyleSheet.absoluteFill,
  },
  shadow: {
    textShadowColor: 'rgba(5, 8, 38, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1,
  },
});
