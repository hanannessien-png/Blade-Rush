/**
 * A knife preview shown as a pre-rendered PNG (src/data/knifeImages.ts), so
 * long store grids open instantly. Animations run on the native driver from
 * one shared clock.
 */
import React, { useMemo } from 'react';
import { Animated, Easing, Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { KNIFE_IMAGES } from '../../data/knifeImages';
import { KNIFE_BY_ID, KNIVES } from '../../data/knives';
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
  // Fallback renders at runtime only for a knife that has no exported image yet.
  const source = useMemo(() => {
    const asset = KNIFE_IMAGES[def.id];
    if (asset) return asset;
    const uri = knifeImageUri(def.id, def.style, 3);
    return uri ? { uri } : null;
  }, [def]);
  const aspect = knifeImageAspect(def.style);
  const h = size * 0.98;
  const w = h * aspect;
  const m = reduceMotion ? 'static' : motion;
  if (m !== 'static') startClocks();
  const rotate = m === 'spin' ? SPIN : m === 'sway' ? SWAY : '35deg';

  return (
    <View style={[{ width: size, height: size }, styles.center, style]}>
      {source && (
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Image
            source={source}
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


// Development helper (web preview console): re-renders every knife preview so the
// PNGs in assets/knives can be refreshed after knife art changes.
if (__DEV__ && typeof window !== 'undefined') {
  (globalThis as { __knifeExport?: () => Record<string, string | null> }).__knifeExport = () =>
    Object.fromEntries(KNIVES.map((k) => [k.id, knifeImageUri(k.id, k.style, 3)]));
}

