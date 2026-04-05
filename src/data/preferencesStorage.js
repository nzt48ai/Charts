import { clamp } from '../core/fibMath';
import { normalizeFibToolConfigs } from '../core/fibDrawings';

const DEFAULT_MAGNET_STRENGTH = 35;

export const PREFERENCES_STORAGE_KEYS = {
  DRAWING_PREFERENCES: 'charts.preferences.drawing.v1',
};

function isStorageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function normalizeMagnetStrength(value) {
  return clamp(Number(value) || DEFAULT_MAGNET_STRENGTH, 0, 100);
}

export function loadDrawingPreferences() {
  const fallback = {
    fibToolConfigs: normalizeFibToolConfigs(),
    magnetStrength: DEFAULT_MAGNET_STRENGTH,
  };

  if (!isStorageAvailable()) {
    return fallback;
  }

  const rawValue = window.localStorage.getItem(PREFERENCES_STORAGE_KEYS.DRAWING_PREFERENCES);

  if (!rawValue) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(rawValue);

    return {
      fibToolConfigs: normalizeFibToolConfigs(parsed?.fibToolConfigs),
      magnetStrength: normalizeMagnetStrength(parsed?.magnetStrength),
    };
  } catch {
    return fallback;
  }
}

export function saveDrawingPreferences(preferences) {
  if (!isStorageAvailable()) {
    return;
  }

  const safeValue = {
    fibToolConfigs: normalizeFibToolConfigs(preferences?.fibToolConfigs),
    magnetStrength: normalizeMagnetStrength(preferences?.magnetStrength),
  };

  window.localStorage.setItem(PREFERENCES_STORAGE_KEYS.DRAWING_PREFERENCES, JSON.stringify(safeValue));
}
