/**
 * The game's single icon set, drawn in code (24×24 grid). Each icon is made of
 * filled shapes, strokes, and optional "detail" parts in a contrasting color.
 */
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { game } from '@/constants/colors';

type Part =
  | { f: string }
  | { s: string; w: number }
  | { df: string }
  | { ds: string; w: number };

const KNIFE: Part[] = [
  { f: 'M12 2c2 2.5 2.6 6.5 2 10.5h-4C9.4 8.5 10 4.5 12 2z' },
  { f: 'M8 12.5h8v2H8z' },
  { f: 'M10.6 14.5h2.8V21a1.4 1.4 0 0 1-2.8 0z' },
];

const SPEAKER = 'M4 9h4l5-4.5v15L8 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z';
const SHIELD = 'M12 2.5 20 5.5v6c0 5-3.5 8.6-8 10-4.5-1.4-8-5-8-10v-6z';
const CIRCLE = 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z';

const ICONS = {
  play: [{ f: 'M8 5.2v13.6c0 .8.9 1.3 1.6.9l10.6-6.8c.6-.4.6-1.3 0-1.7L9.6 4.3C8.9 3.9 8 4.4 8 5.2z' }],
  pause: [{ f: 'M7 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm7 0h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z' }],
  home: [{ f: 'M12 3.2 2.6 11a1 1 0 0 0 .6 1.8H5V20a1 1 0 0 0 1 1h4v-5.5h4V21h4a1 1 0 0 0 1-1v-7.2h1.8a1 1 0 0 0 .6-1.8z' }],
  bag: [{ f: 'M5.2 8h13.6l-1 12.1A1 1 0 0 1 16.8 21H7.2a1 1 0 0 1-1-.9z' }, { s: 'M9 10V7a3 3 0 0 1 6 0v3', w: 2.2 }],
  trophy: [{ f: 'M7 3h10v2h3a1 1 0 0 1 1 1c0 3-2 5.2-4.6 5.6A5.2 5.2 0 0 1 13 14.8V17h3v4H8v-4h3v-2.2a5.2 5.2 0 0 1-3.4-3.2C5 11.2 3 9 3 6a1 1 0 0 1 1-1h3zm-2 4c.2 1.5 1 2.6 2 3V7zm14 0h-2v3c1-.4 1.8-1.5 2-3z' }],
  missions: [{ f: 'M8 3h8v2h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2z' }, { ds: 'M8.5 12.5l2.5 2.5 4.5-5', w: 2.2 }],
  gift: [
    { f: 'M4 9.5h16v3.5H4z' },
    { f: 'M5 13h14v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z' },
    { df: 'M11 9.5h2V21h-2z' },
    { s: 'M12 9.5c-1.5-3-5-3.5-5-1.5S10 9.5 12 9.5c2 0 5 .5 5-1.5s-3.5-1.5-5 1.5', w: 2 },
  ],
  calendar: [
    { f: 'M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z' },
    { df: 'M4 8.8h16v1.6H4z' },
    { s: 'M8 3v4M16 3v4', w: 2.2 },
    { df: 'M10.4 12.4h3.2v3.2h-3.2z' },
  ],
  gear: [
    { s: 'M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1', w: 3.4 },
    { f: 'M12 5.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13z' },
    { df: 'M12 9.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z' },
  ],
  sound: [{ f: SPEAKER }, { s: 'M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11', w: 2 }],
  soundOff: [{ f: SPEAKER }, { s: 'M16 9.5l5 5M21 9.5l-5 5', w: 2.2 }],
  music: [
    { s: 'M9 18V6l11-2v12', w: 2.2 },
    { f: 'M6.5 15.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM17.5 13.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z' },
  ],
  musicOff: [
    { s: 'M9 18V6l11-2v12', w: 2.2 },
    { f: 'M6.5 15.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM17.5 13.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z' },
    { s: 'M3 3l18 18', w: 2.4 },
  ],
  back: [{ s: 'M15 5l-7 7 7 7', w: 3.2 }],
  close: [{ s: 'M6 6l12 12M18 6L6 18', w: 3.2 }],
  check: [{ s: 'M5 12.5l4.5 4.5L19 7.5', w: 3.2 }],
  lock: [
    { s: 'M8 10V7.5a4 4 0 0 1 8 0V10', w: 2.4 },
    { f: 'M6 10h12a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z' },
    { df: 'M12 13.5a1.5 1.5 0 0 1 .8 2.8V18h-1.6v-1.7a1.5 1.5 0 0 1 .8-2.8z' },
  ],
  star: [{ f: 'M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z' }],
  clock: [{ f: CIRCLE }, { ds: 'M12 7v5.5l3.5 2', w: 2.2 }],
  stopwatch: [{ s: 'M10 2h4M12 2v2.5', w: 2.2 }, { f: 'M12 4.5a8.25 8.25 0 1 1 0 16.5 8.25 8.25 0 0 1 0-16.5z' }, { ds: 'M12 8.5v4.5l3 1.8', w: 2.2 }],
  infinity: [{ s: 'M12 12c-2-3-4-4.5-6-4.5a4.5 4.5 0 0 0 0 9c2 0 4-1.5 6-4.5s4-4.5 6-4.5a4.5 4.5 0 0 1 0 9c-2 0-4-1.5-6-4.5z', w: 2.6 }],
  flag: [{ s: 'M6 21V4', w: 2.4 }, { f: 'M6 4h12l-2.5 4L18 12H6z' }],
  refresh: [{ s: 'M19 12a7 7 0 1 1-2.05-4.95', w: 2.6 }, { f: 'M20.5 3.5v6.5H14z' }],
  ad: [
    { s: 'M9 2.5 12 5.5 15 2.5', w: 2 },
    { f: 'M4 6h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z' },
    { df: 'M10 9.5v6l5-3z' },
  ],
  shield: [{ f: SHIELD }, { df: 'M12 5.6v13.6c3-1.2 5-4 5-7.6V7.6z' }],
  privacy: [{ f: SHIELD }, { ds: 'M8.5 12l2.5 2.5 4.5-5', w: 2.2 }],
  snowflake: [{ s: 'M12 2.5v19M3.8 7.25l16.4 9.5M3.8 16.75l16.4-9.5M9.5 3.8 12 6.3l2.5-2.5M9.5 20.2 12 17.7l2.5 2.5', w: 2.2 }],
  hourglass: [
    { f: 'M6 3h12v2c0 3-2.5 5-4.5 7 2 2 4.5 4 4.5 7v2H6v-2c0-3 2.5-5 4.5-7C8.5 10 6 8 6 5z' },
    { df: 'M9 19h6c0-1.5-1.5-2.8-3-4-1.5 1.2-3 2.5-3 4z' },
  ],
  crosshair: [
    { s: 'M12 5a7 7 0 1 1 0 14 7 7 0 0 1 0-14z', w: 2.4 },
    { s: 'M12 2v5M12 17v5M2 12h5M17 12h5', w: 2.4 },
    { f: 'M12 10.3a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4z' },
  ],
  extra: [
    { f: 'M9 2c2 2.5 2.6 6.5 2 10.5H7C6.4 8.5 7 4.5 9 2z' },
    { f: 'M5 12.5h8v2H5z' },
    { f: 'M7.6 14.5h2.8V21a1.4 1.4 0 0 1-2.8 0z' },
    { s: 'M18.5 6v7M15 9.5h7', w: 2.6 },
  ],
  sweep: [
    { s: 'M19 3l-6.5 8', w: 2.4 },
    { f: 'M10.5 10.2l4.2 3.3-2.6 6.8c-.3.7-1 .9-1.6.5L4.3 16.8c-.5-.4-.6-1.1-.1-1.6z' },
    { ds: 'M7.2 15.8l3 2.4M9.2 13.3l3 2.4', w: 1.2 },
  ],
  sparkle: [{ f: 'M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z' }],
  crown: [{ f: 'M3 7.5l4.5 4L12 4.5l4.5 7 4.5-4L19 18H5z' }, { f: 'M5 19.3h14V21H5z' }],
  skull: [
    { f: 'M12 2.8c4.7 0 8 3.2 8 7.6 0 2.6-1.2 4.4-3 5.4V19a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-3.2c-1.8-1-3-2.8-3-5.4 0-4.4 3.3-7.6 8-7.6z' },
    { df: 'M8.8 9.2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM15.2 9.2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z' },
    { df: 'M10 16.6h1.2V20H10zM12.8 16.6H14V20h-1.2z' },
  ],
  chest: [
    { f: 'M4 10V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2z' },
    { f: 'M4 11h16v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z' },
    { df: 'M10.5 9.2h3v4.2h-3z' },
  ],
  vibrate: [
    { f: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z' },
    { s: 'M4 8v8M20 8v8', w: 2 },
    { df: 'M10.5 17.5h3V19h-3z' },
  ],
  motion: [{ s: 'M3 8h10M3 12h14M3 16h8', w: 2.4 }, { f: 'M19 13.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5z' }],
  trash: [{ s: 'M4 6h16M9.5 6V4h5v2', w: 2.2 }, { f: 'M6 7.5h12l-1 12.5a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z' }],
  bolt: [{ f: 'M13.5 2 5 13.5h6L9.5 22 19 9.5h-6z' }],
  plus: [{ s: 'M12 5v14M5 12h14', w: 3.2 }],
  info: [{ f: CIRCLE }, { df: 'M11 10.2h2V17h-2zM12 6.4a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6z' }],
  knife: KNIFE,
  target: [
    { s: CIRCLE, w: 2.2 },
    { s: 'M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10z', w: 2.2 },
    { f: 'M12 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4z' },
  ],
  medal: [
    { f: 'M7 2h4l2 5H9zM13 2h4l-2 5h-4z' },
    { f: 'M12 7.5a7 7 0 1 1 0 14 7 7 0 0 1 0-14z' },
    { df: 'M12 10.5l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4z' },
  ],
  diamond: [{ f: 'M12 3 20 12 12 21 4 12z' }],
  dot: [{ f: 'M12 6a6 6 0 1 1 0 12 6 6 0 0 1 0-12z' }],
} satisfies Record<string, Part[]>;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  detail?: string;
  /** Draws a chunky dark outline around every part. */
  outline?: boolean;
  outlineColor?: string;
}

export function Icon({ name, size = 24, color = game.white, detail = game.outline, outline = false, outlineColor = game.outline }: IconProps) {
  const parts: Part[] = ICONS[name];
  return (
    <Svg width={size} height={size} viewBox="-1 -1 26 26">
      {outline &&
        parts.map((p, i) => {
          if ('f' in p) return <Path key={`o${i}`} d={p.f} fill={outlineColor} stroke={outlineColor} strokeWidth={3} strokeLinejoin="round" />;
          if ('s' in p) return <Path key={`o${i}`} d={p.s} fill="none" stroke={outlineColor} strokeWidth={p.w + 3} strokeLinecap="round" strokeLinejoin="round" />;
          return null;
        })}
      {parts.map((p, i) => {
        if ('f' in p) return <Path key={i} d={p.f} fill={color} />;
        if ('s' in p) return <Path key={i} d={p.s} fill="none" stroke={color} strokeWidth={p.w} strokeLinecap="round" strokeLinejoin="round" />;
        if ('df' in p) return <Path key={i} d={p.df} fill={detail} />;
        return <Path key={i} d={p.ds} fill="none" stroke={detail} strokeWidth={p.w} strokeLinecap="round" strokeLinejoin="round" />;
      })}
    </Svg>
  );
}
