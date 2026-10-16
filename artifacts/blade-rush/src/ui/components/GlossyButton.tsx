/**
 * Chunky glossy buttons with an inner highlight, a 3D lip and a press
 * animation. Every press plays the UI tap sound and a light haptic.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { game, type ButtonSkin } from '@/constants/colors';
import { audio } from '../../services/audio';
import { haptic } from '../../services/haptics';
import { Icon, type IconName } from './Icon';
import { BodyText, DisplayText } from './Typography';

export type ButtonSize = 'lg' | 'md' | 'sm';

const SIZES: Record<ButtonSize, { h: number; font: number; icon: number; pad: number; radius: number; lip: number }> = {
  lg: { h: 68, font: 30, icon: 30, pad: 26, radius: 24, lip: 6 },
  md: { h: 52, font: 21, icon: 22, pad: 18, radius: 18, lip: 5 },
  sm: { h: 40, font: 16, icon: 17, pad: 12, radius: 14, lip: 4 },
};

export function usePressAnim() {
  const v = useRef(new Animated.Value(0)).current;
  const pressIn = () => Animated.spring(v, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  const pressOut = () => Animated.spring(v, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 12 }).start();
  return { v, pressIn, pressOut };
}

export function feedbackTap(): void {
  audio.play('tap');
  haptic('select');
}

interface Props {
  label?: string;
  icon?: IconName;
  iconRight?: React.ReactNode;
  skin?: ButtonSkin;
  size?: ButtonSize;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Small text under the label (e.g. a price or a countdown). */
  sub?: string;
  children?: React.ReactNode;
  accessibilityLabel?: string;
  silent?: boolean;
  testID?: string;
}

export function GlossyButton({ label, icon, iconRight, skin = 'primary', size = 'md', onPress, disabled, style, sub, children, accessibilityLabel, silent, testID }: Props) {
  const S = SIZES[size];
  const C = game.buttons[disabled ? 'disabled' : skin];
  const { v, pressIn, pressOut } = usePressAnim();
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.95] });
  const sink = v.interpolate({ inputRange: [0, 1], outputRange: [0, S.lip - 1] });

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={() => {
        if (!silent) feedbackTap();
        onPress?.();
      }}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View style={[styles.lip, { borderRadius: S.radius + 2, backgroundColor: C.edge, paddingBottom: S.lip }]}>
          <Animated.View style={{ transform: [{ translateY: sink }] }}>
            <LinearGradient
              colors={[C.top, C.bottom]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[styles.body, { minHeight: S.h, borderRadius: S.radius, paddingHorizontal: S.pad }]}
            >
              <View pointerEvents="none" style={[styles.shine, { borderTopLeftRadius: S.radius, borderTopRightRadius: S.radius }]} />
              <View pointerEvents="none" style={[styles.innerEdge, { borderRadius: S.radius }]} />
              {children ?? (
                <View style={styles.row}>
                  {icon && <Icon name={icon} size={S.icon} color={C.text} outline />}
                  {label !== undefined && (
                    <View style={styles.labelCol}>
                      <DisplayText size={S.font} color={C.text} stroke={size === 'sm' ? 1.5 : 2}>
                        {label}
                      </DisplayText>
                      {sub !== undefined && (
                        <BodyText size={size === 'lg' ? 13 : 11} weight="black" color={C.text} align="center" shadow>
                          {sub}
                        </BodyText>
                      )}
                    </View>
                  )}
                  {iconRight}
                </View>
              )}
            </LinearGradient>
          </Animated.View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

interface RoundProps {
  icon: IconName;
  skin?: ButtonSkin;
  size?: number;
  onPress?: () => void;
  badge?: number | boolean;
  label?: string;
  disabled?: boolean;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
}

/** Round glossy icon button with an optional notification badge and caption. */
export function RoundButton({ icon, skin = 'dark', size = 56, onPress, badge, label, disabled, accessibilityLabel, style }: RoundProps) {
  const C = game.buttons[disabled ? 'disabled' : skin];
  const { v, pressIn, pressOut } = usePressAnim();
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] });
  const lip = Math.max(3, Math.round(size / 14));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={() => {
        feedbackTap();
        onPress?.();
      }}
      style={[styles.roundWrap, style]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View style={{ width: size, height: size + lip, borderRadius: size / 2, backgroundColor: C.edge }}>
          <LinearGradient colors={[C.top, C.bottom]} style={[styles.roundBody, { width: size, height: size, borderRadius: size / 2 }]}>
            <View pointerEvents="none" style={[styles.roundShine, { width: size * 0.7, height: size * 0.32, borderRadius: size }]} />
            <Icon name={icon} size={size * 0.52} color={C.text} outline />
          </LinearGradient>
        </View>
        {badge ? (
          <View style={styles.badge}>
            {typeof badge === 'number' ? (
              <BodyText size={11} weight="black" color={game.white} align="center">
                {badge > 9 ? '9+' : String(badge)}
              </BodyText>
            ) : (
              <View style={styles.badgeDot} />
            )}
          </View>
        ) : null}
      </Animated.View>
      {label !== undefined && (
        <DisplayText size={13} stroke={1.5} containerStyle={styles.roundLabel}>
          {label}
        </DisplayText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lip: {
    borderWidth: 2,
    borderColor: game.outline,
  },
  body: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  innerEdge: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  labelCol: {
    alignItems: 'center',
  },
  roundWrap: {
    alignItems: 'center',
  },
  roundBody: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: game.outline,
    overflow: 'hidden',
  },
  roundShine: {
    position: 'absolute',
    top: 4,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 4,
    backgroundColor: game.danger,
    borderWidth: 2,
    borderColor: game.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: game.white,
  },
  roundLabel: {
    marginTop: 4,
  },
});
