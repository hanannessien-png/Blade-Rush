/**
 * Sound effects and per-world music (expo-audio). Real audio files under
 * assets/audio can be swapped without code changes as long as names match.
 * Each sound effect has a small round-robin pool so rapid throws overlap.
 */
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import type { MusicTrack } from '../data/worlds';

export type Sfx = 'thwack' | 'slice' | 'fail' | 'shatter' | 'boss' | 'tap' | 'coin' | 'powerup' | 'reward' | 'whoosh';

const SFX_SOURCES: Record<Sfx, number> = {
  thwack: require('../../assets/audio/sfx_thwack.mp3'),
  slice: require('../../assets/audio/sfx_slice.mp3'),
  fail: require('../../assets/audio/sfx_fail.mp3'),
  shatter: require('../../assets/audio/sfx_shatter.mp3'),
  boss: require('../../assets/audio/sfx_boss.mp3'),
  tap: require('../../assets/audio/sfx_tap.mp3'),
  coin: require('../../assets/audio/sfx_coin.mp3'),
  powerup: require('../../assets/audio/sfx_powerup.mp3'),
  reward: require('../../assets/audio/sfx_reward.mp3'),
  whoosh: require('../../assets/audio/sfx_whoosh.mp3'),
};

const SFX_VOLUME: Record<Sfx, number> = {
  thwack: 0.9,
  slice: 0.85,
  fail: 0.9,
  shatter: 0.9,
  boss: 0.95,
  tap: 0.55,
  coin: 0.6,
  powerup: 0.8,
  reward: 0.85,
  whoosh: 0.45,
};

const POOL_SIZE: Partial<Record<Sfx, number>> = { thwack: 3, whoosh: 3, slice: 2, coin: 3, tap: 2 };

const MUSIC_SOURCES: Record<MusicTrack, number> = {
  workshop: require('../../assets/audio/music_workshop.mp3'),
  frost: require('../../assets/audio/music_frost.mp3'),
  desert: require('../../assets/audio/music_desert.mp3'),
  volcano: require('../../assets/audio/music_volcano.mp3'),
  neon: require('../../assets/audio/music_neon.mp3'),
  candy: require('../../assets/audio/music_candy.mp3'),
};

const MUSIC_VOLUME = 0.42;
const MENU_TRACK: MusicTrack = 'workshop';

class AudioService {
  private sfxEnabled = true;
  private musicEnabled = true;
  private suspended = false;
  private ready = false;
  private pools = new Map<Sfx, { players: AudioPlayer[]; rates: number[]; next: number }>();
  private music: AudioPlayer | null = null;
  private musicTrack: MusicTrack | null = null;
  private wantedTrack: MusicTrack | null = null;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;

  init(): void {
    if (this.ready) return;
    this.ready = true;
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
    for (const key of Object.keys(SFX_SOURCES) as Sfx[]) {
      const players: AudioPlayer[] = [];
      for (let i = 0; i < (POOL_SIZE[key] ?? 1); i++) {
        try {
          const p = createAudioPlayer(SFX_SOURCES[key]);
          p.volume = SFX_VOLUME[key];
          players.push(p);
        } catch (err) {
          console.warn('[audio] sfx load failed', key, err);
        }
      }
      this.pools.set(key, { players, rates: players.map(() => 1), next: 0 });
    }
  }

  setSoundEnabled(on: boolean): void {
    this.sfxEnabled = on;
  }

  setMusicEnabled(on: boolean): void {
    this.musicEnabled = on;
    this.applyMusic();
  }

  /** Mute everything while a full-screen ad is showing or the app is in the background. */
  setSuspended(on: boolean): void {
    if (this.suspended === on) return;
    this.suspended = on;
    this.applyMusic();
  }

  play(key: Sfx, rate = 1): void {
    if (!this.sfxEnabled || this.suspended || !this.ready) return;
    const pool = this.pools.get(key);
    if (!pool || pool.players.length === 0) return;
    const i = pool.next;
    const p = pool.players[i];
    pool.next = (i + 1) % pool.players.length;
    try {
      // Pooled players keep their last rate, so reset it whenever it differs.
      if (pool.rates[i] !== rate) {
        p.setPlaybackRate?.(rate);
        pool.rates[i] = rate;
      }
      void p.seekTo(0).catch(() => {});
      quiet(p.play());
    } catch {
      // Audio must never break gameplay.
    }
  }

  playMusic(track: MusicTrack | 'menu'): void {
    this.wantedTrack = track === 'menu' ? MENU_TRACK : track;
    this.applyMusic();
  }

  stopMusic(): void {
    this.wantedTrack = null;
    this.applyMusic();
  }

  private applyMusic(): void {
    if (!this.ready) return;
    const shouldPlay = this.musicEnabled && !this.suspended && this.wantedTrack !== null;
    if (!shouldPlay) {
      if (this.music) this.music.pause();
      return;
    }
    const track = this.wantedTrack!;
    if (this.music && this.musicTrack === track) {
      if (!this.music.playing) quiet(this.music.play());
      return;
    }
    this.crossfadeTo(track);
  }

  private crossfadeTo(track: MusicTrack): void {
    const old = this.music;
    let next: AudioPlayer;
    try {
      next = createAudioPlayer(MUSIC_SOURCES[track]);
    } catch (err) {
      console.warn('[audio] music load failed', track, err);
      return;
    }
    next.loop = true;
    next.volume = 0;
    quiet(next.play());
    this.music = next;
    this.musicTrack = track;
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    let step = 0;
    const steps = 12;
    this.fadeTimer = setInterval(() => {
      step++;
      const k = step / steps;
      next.volume = MUSIC_VOLUME * k;
      if (old) old.volume = MUSIC_VOLUME * (1 - k);
      if (step >= steps) {
        if (this.fadeTimer) clearInterval(this.fadeTimer);
        this.fadeTimer = null;
        if (old) {
          old.pause();
          old.remove();
        }
      }
    }, 50);
  }
}

export const audio = new AudioService();

/** Some platforms (the web preview) return a promise from play() that rejects when interrupted; that is harmless. */
function quiet(result: unknown): void {
  if (result && typeof (result as Promise<void>).catch === 'function') (result as Promise<void>).catch(() => {});
}
