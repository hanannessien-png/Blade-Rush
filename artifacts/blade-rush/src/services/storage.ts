/**
 * Device-only persistence: one versioned save object in AsyncStorage
 * (localStorage on web). Writes are debounced so frequent updates during play
 * cost a single write.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { migrateSave, type SaveData } from '../state/save';

const KEY = 'twirlblade.save.v1';
const WRITE_DELAY_MS = 400;

let pending: SaveData | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

export async function loadSave(): Promise<SaveData> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return migrateSave(raw ? JSON.parse(raw) : null);
  } catch (err) {
    console.warn('[storage] could not read save, starting fresh', err);
    return migrateSave(null);
  }
}

async function flush(): Promise<void> {
  timer = null;
  const data = pending;
  pending = null;
  if (!data) return;
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('[storage] save failed', err);
  }
}

export function queueSave(data: SaveData): void {
  pending = data;
  if (!timer) timer = setTimeout(() => void flush(), WRITE_DELAY_MS);
}

/** Write immediately (used when the app goes to the background). */
export async function flushSave(): Promise<void> {
  if (timer) clearTimeout(timer);
  await flush();
}

export async function wipeSave(): Promise<void> {
  if (timer) clearTimeout(timer);
  timer = null;
  pending = null;
  await AsyncStorage.removeItem(KEY);
}
