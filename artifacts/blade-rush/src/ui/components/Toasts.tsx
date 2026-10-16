/** Small toast queue for rewards and confirmations ("+50 apples", "Equipped!"). */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { create } from 'zustand';
import { game } from '@/constants/colors';
import { CurrencyIcon } from './CurrencyIcon';
import { Icon } from './Icon';
import { BodyText } from './Typography';
import { useScreenInsets } from './Screen';

type ToastKind = 'apples' | 'gems' | 'success' | 'info';

interface Toast {
  id: number;
  text: string;
  kind: ToastKind;
}

interface ToastState {
  items: Toast[];
  push(text: string, kind?: ToastKind): void;
  remove(id: number): void;
}

let nextId = 1;

export const useToasts = create<ToastState>()((set) => ({
  items: [],
  push(text, kind = 'info') {
    const id = nextId++;
    set((s) => ({ items: [...s.items.slice(-2), { id, text, kind }] }));
  },
  remove(id) {
    set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
  },
}));

export function toast(text: string, kind?: ToastKind): void {
  useToasts.getState().push(text, kind);
}

function ToastItem({ t }: { t: Toast }) {
  const v = useRef(new Animated.Value(0)).current;
  const remove = useToasts((s) => s.remove);
  useEffect(() => {
    Animated.sequence([
      Animated.spring(v, { toValue: 1, useNativeDriver: true, speed: 16, bounciness: 10 }),
      Animated.delay(1500),
      Animated.timing(v, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => remove(t.id));
  }, [v, remove, t.id]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] });
  return (
    <Animated.View style={[styles.toast, { opacity: v, transform: [{ translateY }] }]}>
      {t.kind === 'apples' || t.kind === 'gems' ? (
        <CurrencyIcon kind={t.kind} size={22} />
      ) : (
        <Icon name={t.kind === 'success' ? 'check' : 'info'} size={20} color={t.kind === 'success' ? game.success : game.gem} />
      )}
      <BodyText size={15} weight="black" color={game.white}>
        {t.text}
      </BodyText>
    </Animated.View>
  );
}

export function ToastHost() {
  const items = useToasts((s) => s.items);
  const insets = useScreenInsets();
  return (
    <View pointerEvents="none" style={[styles.host, { top: insets.top + 56 }]}>
      {items.map((t) => (
        <ToastItem key={t.id} t={t} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 6,
    zIndex: 900,
    elevation: 900,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: game.surfaceLo,
    borderWidth: 2,
    borderColor: game.strokeHi,
  },
});
