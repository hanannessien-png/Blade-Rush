/**
 * A knife preview rendered once to a PNG (see knifeArt.knifeImageUri) and
 * shown as an Image, so long store grids stay cheap. Animations run on the
 * native driver from one shared clock.
 */
import React, { useMemo } from 'react';
import { Animated, Easing, Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { KNIFE_BY_ID } from '../../data/knives';
import { knifeImageAspect, knifeImageUri } from '../../game/art/knifeArt';
import { useGame } from '../../state/store';

const swayClock = new Animated.Value(0);
const spinClock = new Animated.Value(0);
let clocksStarted = false;

function startClocks() {
  if (clocksStarted) return;
  clocksStarted = true;
  Animated.loop(
    Animated.sequence([
      Animated.timing(swayClock, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(swayClock, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]),
  ).start();
  Animated.loop(Animated.timing(spinClock, { toValue: 1, duration: 5200, easing: Easing.linear, useNativeDriver: true })).start();
}

const SWAY = swayClock.interpolate({ inputRange: [0, 1], outputRange: ['24deg', '46deg'] });
const SPIN = spinClock.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

interface Props {
  id: string;
  /** Box size; the knife is fitted diagonally inside. */
  size: number;
  motion?: 'static' | 'sway' | 'spin';
  dim?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function KnifeImage({ id, size, motion = 'static', dim, style }: Props) {
  const reduceMotion = useGame((s) => s.settings.reduceMotion);
  const def = KNIFE_BY_ID[id] ?? KNIFE_BY_ID.classic;
  const uri = useMemo(() => knifeImageUri(def.id, def.style, 3), [def]);
  const aspect = knifeImageAspect(def.style);
  const h = size * 0.98;
  const w = h * aspect;
  const m = reduceMotion ? 'static' : motion;
  if (m !== 'static') startClocks();
  const rotate = m === 'spin' ? SPIN : m === 'sway' ? SWAY : '35deg';

  return (
    <View style={[{ width: size, height: size }, styles.center, style]}>
      {uri && (
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Image
            source={{ uri }}
            style={{ width: w, height: h, opacity: dim ? 0.5 : 1 }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
