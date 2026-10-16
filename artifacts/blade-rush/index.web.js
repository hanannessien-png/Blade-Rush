// Web entry (preview only): Skia's WebAssembly engine must be loaded before any
// module that imports Skia is evaluated, so the router is imported afterwards.
import '@expo/metro-runtime';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';

LoadSkiaWeb({ locateFile: () => '/canvaskit.wasm' }).then(async () => {
  const { App } = await import('expo-router/build/qualified-entry');
  renderRootComponent(App);
});
