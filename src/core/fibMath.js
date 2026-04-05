export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function buildDomainPoint(time, price) {
  return { time, price };
}

export function resolveFibLevelY(startY, deltaY, level) {
  return startY + deltaY * level;
}

export function parseFibLevelsInput(rawInput) {
  if (typeof rawInput !== 'string') {
    return [];
  }

  return rawInput
    .split(',')
    .map((segment) => Number(segment.trim()))
    .filter((value) => Number.isFinite(value));
}

export function buildLineDashPattern(lineStyle) {
  if (lineStyle === 'dashed') {
    return [7, 5];
  }

  if (lineStyle === 'dotted') {
    return [2, 4];
  }

  return [];
}

export function toRgba(hexColor, opacity) {
  const hex = hexColor.replace('#', '');
  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}
