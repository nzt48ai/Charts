export const FIB_LEVELS = Object.freeze([0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]);

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function buildDomainPoint(time, price) {
  return { time, price };
}

export function resolveFibLevelY(startY, deltaY, level) {
  return startY + deltaY * level;
}
