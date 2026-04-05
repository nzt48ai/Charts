import { DEFAULT_TIMEFRAME_ID, isSupportedTimeframe } from '../core/timeframes';
import { DEFAULT_LAYOUT_ID, LAYOUTS } from './layoutConfigs';

export const STORAGE_KEYS = {
  ACTIVE_LAYOUT: 'charts.layout.active.v1',
  ACTIVE_TIMEFRAME: 'charts.timeframe.active.v1',
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

export function loadActiveTimeframeId() {
  if (!isStorageAvailable()) {
    return DEFAULT_TIMEFRAME_ID;
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEYS.ACTIVE_TIMEFRAME);

  if (!rawValue || !isSupportedTimeframe(rawValue)) {
    return DEFAULT_TIMEFRAME_ID;
  }

  return rawValue;
}

export function saveActiveTimeframeId(timeframeId) {
  if (!isStorageAvailable()) {
    return;
  }

  if (!isSupportedTimeframe(timeframeId)) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.ACTIVE_TIMEFRAME, timeframeId);
}
