import { normalizeFibDrawings } from '../core/fibDrawings';

const DRAWINGS_STORAGE_KEY = 'charts.drawings.fib.v1';

function isStorageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function loadFibDrawingsBySymbol() {
  if (!isStorageAvailable()) {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(DRAWINGS_STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue);
    if (!parsedValue || typeof parsedValue !== 'object') {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsedValue).map(([symbol, drawings]) => [symbol, normalizeFibDrawings(drawings)]),
    );
  } catch {
    return {};
  }
}

export function saveFibDrawingsBySymbol(drawingsBySymbol) {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    window.localStorage.setItem(DRAWINGS_STORAGE_KEY, JSON.stringify(drawingsBySymbol));
  } catch {
    // Ignore storage write errors in private mode / quota limits.
  }
}
