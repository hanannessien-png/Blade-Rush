/**
 * Angle and collision math. All angles are degrees. Stuck items are stored in
 * the target's local frame so they rotate with it; a thrown knife always
 * arrives at the bottom of the target (world angle 90°, y-down screen space).
 */
import type { Obstacle } from './types';

export const DEG = Math.PI / 180;

export function norm360(a: number): number {
  const r = a % 360;
  return r < 0 ? r + 360 : r;
}

/** Shortest absolute angular distance between two angles, in [0, 180]. */
export function angDist(a: number, b: number): number {
  const d = Math.abs(norm360(a) - norm360(b));
  return d > 180 ? 360 - d : d;
}

/** Half-width in degrees of something `widthPx` wide sitting on a circle of `radius`. */
export function halfWidthDeg(widthPx: number, radius: number): number {
  return (widthPx / 2 / radius) / DEG;
}

/** The local-frame angle that is currently at the bottom of the target. */
export function impactLocalAngle(targetRotation: number): number {
  return norm360(90 - targetRotation);
}

export interface CollisionResult {
  hit: boolean;
  /** Index of the obstacle hit, or -1. */
  index: number;
  /** Smallest clearance in degrees to any obstacle (negative when overlapping). */
  clearance: number;
}

/**
 * A throw fails when the angular gap to any obstacle is smaller than the sum of
 * half-widths (the new knife's width at the target radius plus the obstacle's).
 */
export function checkCollision(angle: number, halfWidth: number, obstacles: readonly Obstacle[]): CollisionResult {
  let clearance = Infinity;
  let index = -1;
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];
    const c = angDist(angle, o.angle) - (halfWidth + o.halfWidth);
    if (c < clearance) {
      clearance = c;
      index = i;
    }
  }
  if (index === -1) return { hit: false, index: -1, clearance: Infinity };
  return { hit: clearance < 0, index: clearance < 0 ? index : -1, clearance };
}

export function isCloseCall(result: CollisionResult, closeCallDeg: number): boolean {
  return !result.hit && result.clearance <= closeCallDeg;
}

/**
 * How many knives of angular width `knifeWidth` (full width, degrees) still fit
 * around the circle without touching any obstacle or each other.
 */
export function freeCapacity(obstacles: readonly Obstacle[], knifeWidth: number): number {
  if (knifeWidth <= 0) return Infinity;
  if (obstacles.length === 0) return Math.floor(360 / knifeWidth);
  const sorted = obstacles
    .map((o) => ({ angle: norm360(o.angle), halfWidth: o.halfWidth }))
    .sort((a, b) => a.angle - b.angle);
  let total = 0;
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    const b = sorted[(i + 1) % sorted.length];
    let gap = b.angle - a.angle;
    if (i === sorted.length - 1) gap += 360;
    if (sorted.length === 1) gap = 360;
    const usable = gap - a.halfWidth - b.halfWidth;
    if (usable >= knifeWidth) total += Math.floor(usable / knifeWidth + 1e-9);
  }
  return total;
}

/** Centre angle (local frame) of the widest free gap; used by the Aim Guide. */
export function widestGapCenter(obstacles: readonly Obstacle[]): { center: number; width: number } {
  if (obstacles.length === 0) return { center: 0, width: 360 };
  const sorted = obstacles
    .map((o) => ({ angle: norm360(o.angle), halfWidth: o.halfWidth }))
    .sort((a, b) => a.angle - b.angle);
  let best = { center: 0, width: -Infinity };
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i];
    const b = sorted[(i + 1) % sorted.length];
    let gap = b.angle - a.angle;
    if (i === sorted.length - 1) gap += 360;
    if (sorted.length === 1) gap = 360;
    const start = a.angle + a.halfWidth;
    const width = gap - a.halfWidth - b.halfWidth;
    if (width > best.width) best = { center: norm360(start + width / 2), width };
  }
  return best;
}
