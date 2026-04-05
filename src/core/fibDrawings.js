const DRAWING_TYPES = {
  FIB_PRICE: 'fibPrice',
  FIB_TIME: 'fibTime',
};

export const FIB_DRAWING_TYPES = Object.freeze(DRAWING_TYPES);

export const FIB_PRICE_LINE_STYLES = Object.freeze({
  SOLID: 'solid',
  DASHED: 'dashed',
  DOTTED: 'dotted',
});

export const FIB_TOOL_DEFAULTS = Object.freeze({
  [DRAWING_TYPES.FIB_PRICE]: {
    levels: [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1],
    color: '#94a3b8',
    opacity: 0.72,
    showLabels: true,
    lineStyle: FIB_PRICE_LINE_STYLES.SOLID,
  },
  [DRAWING_TYPES.FIB_TIME]: {
    levels: [0, 0.382, 0.5, 0.618, 1, 1.618, 2.618],
    color: '#60a5fa',
    opacity: 0.62,
    showLabels: true,
  },
});

const EPSILON = 0.000001;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeLevels(levels, fallback) {
  if (!Array.isArray(levels) || levels.length === 0) {
    return [...fallback];
  }

  const uniqueLevels = [];
  levels.forEach((rawLevel) => {
    const numericLevel = Number(rawLevel);
    if (!Number.isFinite(numericLevel)) {
      return;
    }

    const roundedLevel = Math.round(numericLevel * 1000) / 1000;
    if (roundedLevel < -20 || roundedLevel > 20) {
      return;
    }

    if (uniqueLevels.some((level) => Math.abs(level - roundedLevel) <= EPSILON)) {
      return;
    }

    uniqueLevels.push(roundedLevel);
  });

  if (uniqueLevels.length === 0) {
    return [...fallback];
  }

  return uniqueLevels.sort((a, b) => a - b);
}

function normalizeHexColor(rawColor, fallback) {
  if (typeof rawColor !== 'string') {
    return fallback;
  }

  const trimmedColor = rawColor.trim();
  return /^#[0-9A-Fa-f]{6}$/.test(trimmedColor) ? trimmedColor : fallback;
}

function normalizeLineStyle(rawLineStyle, fallback) {
  return Object.values(FIB_PRICE_LINE_STYLES).includes(rawLineStyle) ? rawLineStyle : fallback;
}

function normalizeToolConfigForType(type, rawConfig = {}) {
  const defaults = FIB_TOOL_DEFAULTS[type] ?? {};

  if (type === DRAWING_TYPES.FIB_PRICE) {
    return {
      levels: normalizeLevels(rawConfig.levels, defaults.levels),
      color: normalizeHexColor(rawConfig.color, defaults.color),
      opacity: clamp(Number(rawConfig.opacity ?? defaults.opacity), 0.05, 1),
      showLabels: rawConfig.showLabels ?? defaults.showLabels,
      lineStyle: normalizeLineStyle(rawConfig.lineStyle, defaults.lineStyle),
    };
  }

  if (type === DRAWING_TYPES.FIB_TIME) {
    return {
      levels: normalizeLevels(rawConfig.levels, defaults.levels),
      color: normalizeHexColor(rawConfig.color, defaults.color),
      opacity: clamp(Number(rawConfig.opacity ?? defaults.opacity), 0.05, 1),
      showLabels: rawConfig.showLabels ?? defaults.showLabels,
    };
  }

  return null;
}

export function normalizeFibToolConfigs(rawConfigs = {}) {
  return {
    [DRAWING_TYPES.FIB_PRICE]: normalizeToolConfigForType(DRAWING_TYPES.FIB_PRICE, rawConfigs[DRAWING_TYPES.FIB_PRICE]),
    [DRAWING_TYPES.FIB_TIME]: normalizeToolConfigForType(DRAWING_TYPES.FIB_TIME, rawConfigs[DRAWING_TYPES.FIB_TIME]),
  };
}

export function normalizeFibDrawing(rawDrawing) {
  if (!rawDrawing || !Object.values(DRAWING_TYPES).includes(rawDrawing.type)) {
    return null;
  }

  if (!Array.isArray(rawDrawing.anchors) || rawDrawing.anchors.length !== 2) {
    return null;
  }

  const anchors = rawDrawing.anchors.map((anchor) => {
    const time = anchor?.time;
    const price = Number(anchor?.price);

    if (time == null || !Number.isFinite(price)) {
      return null;
    }

    return {
      time,
      price,
    };
  });

  if (anchors.some((anchor) => !anchor)) {
    return null;
  }

  return {
    id: typeof rawDrawing.id === 'string' ? rawDrawing.id : `${rawDrawing.type}-${Date.now()}`,
    type: rawDrawing.type,
    anchors,
    config: normalizeToolConfigForType(rawDrawing.type, rawDrawing.config),
  };
}

export function normalizeFibDrawings(rawDrawings = []) {
  if (!Array.isArray(rawDrawings)) {
    return [];
  }

  return rawDrawings
    .map((drawing) => normalizeFibDrawing(drawing))
    .filter(Boolean);
}
