/**
 * In-screen modal: dim backdrop + a card that springs in. Rendered as an
 * absolute overlay (not a native Modal) so it layers cleanly with the game.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { game } from '@/constants/colors';
import { useGame } from '../../state/store';
import { feedbackTap } from './GlossyButton';
import { Icon } from './Icon';
import { DisplayText } from './Typography';

interface Props {
  visible: boolean;
  title?: string;
  titleColor?: string;
  onClose?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Tapping the backdrop closes the modal (when onClose is set). */
  backdropCloses?: boolean;
  accent?: string;
}

export function BouncyModal({ visible, title, titleColor = game.gold, onClose, children, style, backdropCloses = true, accent = game.strokeHi }: Props) {
  const reduceMotion = useGame((s) => s.settings.reduceMotion);
  const [mounted, setMounted] = useState(visible);
  const v = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      v.setValue(0);
      if (reduceMotion) Animated.timing(v, { toValue: 1, duration: 120, useNativeDriver: true }).start();
      else Animated.spring(v, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 11 }).start();
    } else if (mounted) {
      Animated.timing(v, { toValue: 0, duration: 140, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!mounted) return null;
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: v }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Close"
          onPress={backdropCloses && onClose ? onClose : undefined}
        />
      </Animated.View>
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View style={[styles.cardWrap, { opacity: v, transform: [{ scale }] }, style]}>
          <LinearGradient colors={[game.surfaceHi, game.surface, game.surfaceLo]} style={[styles.card, { borderColor: accent }]}>
            {title !== undefined && (
              <DisplayText size={30} color={titleColor} containerStyle={styles.title}>
                {title}
              </DisplayText>
            )}
            {children}
          </LinearGradient>
          {onClose && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={10}
              onPress={() => {
                feedbackTap();
                onClose();
              }}
              style={styles.close}
            >
              <Icon name="close" size={20} color={game.white} />
            </Pressable>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: game.overlay,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  cardWrap: {
    width: '100%',
    maxWidth: 380,
  },
  card: {
    borderRadius: 26,
    borderWidth: 3,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 18,
    alignItems: 'stretch',
  },
  title: {
    marginBottom: 10,
  },
  close: {
    position: 'absolute',
    top: -12,
    right: -8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: game.buttons.danger.bottom,
    borderWidth: 3,
    borderColor: game.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
