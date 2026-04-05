const SNAP_STEPS = [1, 2, 2.5, 5, 10];

export function snapToStep(value, step) {
  if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) {
    return value;
  }

  return Math.round(value / step) * step;
}

function normalizeStep(rawStep) {
  if (!Number.isFinite(rawStep) || rawStep <= 0) {
    return 0.01;
  }

  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const snapBase = SNAP_STEPS.find((candidate) => normalized <= candidate) ?? 10;
  return snapBase * magnitude;
}

export function resolvePriceSnapStep({
  minPrice = 0,
  maxPrice = 0,
  targetDivisions = 220,
  minStep = 0.01,
}) {
  const range = Math.abs(maxPrice - minPrice);
  if (!Number.isFinite(range) || range === 0) {
    return minStep;
  }

  const roughStep = range / targetDivisions;
  return Math.max(normalizeStep(roughStep), minStep);
}
