import { LilitaOne_400Regular } from '@expo-google-fonts/lilita-one';
import { Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { game } from '@/constants/colors';
import { ads } from '@/src/services/ads/adManager';
import { audio } from '@/src/services/audio';
import { setHapticsEnabled } from '@/src/services/haptics';
import { flushSave, loadSave } from '@/src/services/storage';
import { useGame } from '@/src/state/store';
import { MockAdOverlay } from '@/src/ui/components/MockAdOverlay';
import { ToastHost } from '@/src/ui/components/Toasts';

SplashScreen.preventAutoHideAsync();

/** Loads the save, starts audio and keeps services in sync with settings and app state. */
function AppServices() {
  const hydrated = useGame((s) => s.hydrated);
  const sound = useGame((s) => s.settings.sound);
  const music = useGame((s) => s.settings.music);
  const haptics = useGame((s) => s.settings.haptics);
  const backgroundAt = useRef<number | null>(null);

  useEffect(() => {
    audio.init();
    let cancelled = false;
    void loadSave().then((data) => {
      if (cancelled) return;
      const st = useGame.getState();
      st.hydrate(data);
      st.countLaunch();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    audio.setSoundEnabled(sound);
  }, [sound]);
  useEffect(() => {
    audio.setMusicEnabled(music);
  }, [music]);
  useEffect(() => {
    setHapticsEnabled(haptics);
  }, [haptics]);

  useEffect(() => {
    if (hydrated) audio.playMusic('menu');
  }, [hydrated]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        if (backgroundAt.current === null) backgroundAt.current = Date.now();
        void flushSave();
        audio.setSuspended(true);
        return;
      }
      if (state === 'active') {
        const away = backgroundAt.current ? (Date.now() - backgroundAt.current) / 1000 : 0;
        backgroundAt.current = null;
        if (!ads.showing) audio.setSuspended(false);
        const st = useGame.getState();
        if (!st.hydrated) return;
        st.rollover();
        if (st.ageGroup !== null) void ads.maybeAppOpen('resume', away);
      }
    });
    return () => sub.remove();
  }, []);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    LilitaOne_400Regular,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <GestureHandlerRootView style={styles.root}>
          <AppServices />
          <View style={styles.outer}>
            <View style={styles.frame}>
              <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: game.bg } }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="age" options={{ gestureEnabled: false }} />
                <Stack.Screen name="home" options={{ gestureEnabled: false }} />
                <Stack.Screen name="game/[mode]" options={{ gestureEnabled: false, animation: 'fade' }} />
              </Stack>
              <ToastHost />
              <MockAdOverlay />
            </View>
          </View>
          <StatusBar hidden style="light" />
        </GestureHandlerRootView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: game.bgDeep,
  },
  outer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: game.bgDeep,
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    backgroundColor: game.bg,
    overflow: 'hidden',
  },
});
