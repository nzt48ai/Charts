import { DEFAULT_LAYOUT_ID, LAYOUTS } from './layoutConfigs';

export const STORAGE_KEYS = {
  ACTIVE_LAYOUT: 'charts.layout.active.v1',
};

function isStorageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadActiveLayoutId() {
  if (!isStorageAvailable()) {
    return DEFAULT_LAYOUT_ID;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEYS.ACTIVE_LAYOUT);

  if (!rawValue || !LAYOUTS[rawValue]) {
    return DEFAULT_LAYOUT_ID;
  }

  return rawValue;
}

export function saveActiveLayoutId(layoutId) {
  if (!isStorageAvailable()) {
    return;
  }

  if (!LAYOUTS[layoutId]) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.ACTIVE_LAYOUT, layoutId);
}
