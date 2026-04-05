const DEFAULT_LINE_COLOR = '#94a3b8';
const DEFAULT_LINE_OPACITY = 0.52;

function clampOpacity(opacity) {
  const nextOpacity = Number(opacity);

  if (!Number.isFinite(nextOpacity)) {
    return DEFAULT_LINE_OPACITY;
  }

  return Math.max(0, Math.min(1, nextOpacity));
}

function sanitizeColor(color, fallback) {
  if (typeof color !== 'string') {
    return fallback;
  }

  const value = color.trim();

  if (!/^#([a-fA-F0-9]{6})$/.test(value)) {
    return fallback;
  }

  return value.toLowerCase();
}

function hexToRgba(hexColor, opacity) {
  const normalized = sanitizeColor(hexColor, DEFAULT_LINE_COLOR).replace('#', '');
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${clampOpacity(opacity)})`;
}

export const CROSSHAIR_SETTINGS_DEFAULTS = {
  vertLine: {
    color: DEFAULT_LINE_COLOR,
    opacity: DEFAULT_LINE_OPACITY,
  },
  horzLine: {
    color: DEFAULT_LINE_COLOR,
    opacity: DEFAULT_LINE_OPACITY,
  },
};

export function normalizeCrosshairSettings(settings) {
  return {
    vertLine: {
      color: sanitizeColor(settings?.vertLine?.color, CROSSHAIR_SETTINGS_DEFAULTS.vertLine.color),
      opacity: clampOpacity(settings?.vertLine?.opacity),
    },
    horzLine: {
      color: sanitizeColor(settings?.horzLine?.color, CROSSHAIR_SETTINGS_DEFAULTS.horzLine.color),
      opacity: clampOpacity(settings?.horzLine?.opacity),
    },
  };
}

export function buildCrosshairChartOptions(settings) {
  const normalizedSettings = normalizeCrosshairSettings(settings);

  return {
    crosshair: {
      vertLine: {
        color: hexToRgba(normalizedSettings.vertLine.color, normalizedSettings.vertLine.opacity),
      },
      horzLine: {
        color: hexToRgba(normalizedSettings.horzLine.color, normalizedSettings.horzLine.opacity),
      },
    },
  };
}
