import { clamp } from './fibMath';

const HIT_TOLERANCE = 8;
const HANDLE_RADIUS = 6;

export const AXIS_LOCK = Object.freeze({
  NONE: 'none',
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
});

export function resolveAxisLock(startPoint, nextPoint, currentLock = AXIS_LOCK.NONE, threshold = 5) {
  if (currentLock !== AXIS_LOCK.NONE) {
    return currentLock;
  }

  const deltaX = Math.abs(nextPoint.x - startPoint.x);
  const deltaY = Math.abs(nextPoint.y - startPoint.y);

  if (deltaX < threshold && deltaY < threshold) {
    return AXIS_LOCK.NONE;
  }

  return deltaX >= deltaY ? AXIS_LOCK.HORIZONTAL : AXIS_LOCK.VERTICAL;
}

export function applyAxisConstraint(nextAnchor, sourceAnchor, lockAxis) {
  if (lockAxis === AXIS_LOCK.HORIZONTAL) {
    return { ...nextAnchor, price: sourceAnchor.price };
  }

  if (lockAxis === AXIS_LOCK.VERTICAL) {
    return { ...nextAnchor, time: sourceAnchor.time };
  }

  return nextAnchor;
}

export function hitTestHandle(point, handlePoint, radius = HANDLE_RADIUS) {
  if (!point || !handlePoint) {
    return false;
  }

  const dx = point.x - handlePoint.x;
  const dy = point.y - handlePoint.y;
  return dx * dx + dy * dy <= radius * radius;
}

export function hitTestFibPrice(point, start, end, levels = []) {
  if (!point || !start || !end) {
    return false;
  }

  const minX = Math.min(start.x, end.x) - HIT_TOLERANCE;
  const maxX = Math.max(start.x, end.x) + HIT_TOLERANCE;
  if (point.x < minX || point.x > maxX) {
    return false;
  }

  const deltaY = end.y - start.y;
  return levels.some((level) => Math.abs(point.y - (start.y + deltaY * level)) <= HIT_TOLERANCE);
}

export function hitTestFibTime(point, start, end, levels = [], width = Infinity) {
  if (!point || !start || !end) {
    return false;
  }

  const spanX = end.x - start.x;
  const candidateXs = [start.x, end.x, ...levels.map((level) => end.x + spanX * level)].filter(
    (x) => x >= -HIT_TOLERANCE && x <= width + HIT_TOLERANCE,
  );

  return candidateXs.some((x) => Math.abs(point.x - x) <= HIT_TOLERANCE);
}

export function buildSelectionFromGroup(drawings, targetIds) {
  const baseIds = new Set(targetIds);
  const selectedIds = new Set(baseIds);

  drawings.forEach((drawing) => {
    if (!drawing.groupId || !baseIds.has(drawing.id)) {
      return;
    }

    drawings.forEach((candidate) => {
      if (candidate.groupId === drawing.groupId) {
        selectedIds.add(candidate.id);
      }
    });
  });

  return selectedIds;
}

export function clampCanvasPoint(point, width, height) {
  return {
    x: clamp(point.x, 0, width),
    y: clamp(point.y, 0, height),
  };
}

export function resolveMagnetRadius(strength) {
  const normalized = clamp(Number(strength) || 0, 0, 100);
  return 3 + (normalized / 100) * 22;
}
