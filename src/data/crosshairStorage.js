import { CROSSHAIR_SETTINGS_DEFAULTS, normalizeCrosshairSettings } from '../core/crosshairSettings';

export const CROSSHAIR_STORAGE_KEYS = {
  SETTINGS: 'charts.crosshair.settings.v1',
};

function isStorageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadCrosshairSettings() {
  if (!isStorageAvailable()) {
    return CROSSHAIR_SETTINGS_DEFAULTS;
  }

  const rawValue = window.localStorage.getItem(CROSSHAIR_STORAGE_KEYS.SETTINGS);

  if (!rawValue) {
    return CROSSHAIR_SETTINGS_DEFAULTS;
  }

  try {
    return normalizeCrosshairSettings(JSON.parse(rawValue));
  } catch {
    return CROSSHAIR_SETTINGS_DEFAULTS;
  }
}

export function saveCrosshairSettings(settings) {
  if (!isStorageAvailable()) {
    return;
  }

  const normalizedSettings = normalizeCrosshairSettings(settings);
  window.localStorage.setItem(CROSSHAIR_STORAGE_KEYS.SETTINGS, JSON.stringify(normalizedSettings));
}
