const SUPPORTED_INTERVALS_SECONDS = new Set([1, 5, 60]);

function normalizeTimestamp(epochMillis, intervalSeconds) {
  const epochSeconds = Math.floor(epochMillis / 1000);
  return Math.floor(epochSeconds / intervalSeconds) * intervalSeconds;
}

function parseIntervalSeconds(interval) {
  if (typeof interval === 'number' && Number.isFinite(interval)) {
    return interval;
  }

  if (typeof interval === 'string') {
    const normalized = interval.trim().toLowerCase();

    if (normalized === '1s') {
      return 1;
    }

    if (normalized === '5s') {
      return 5;
    }

    if (normalized === '1m') {
      return 60;
    }

    const numericValue = Number(normalized);
    if (Number.isFinite(numericValue)) {
      return numericValue;
    }
  }

  throw new Error(`Unsupported interval format: ${String(interval)}`);
}

function assertSupportedInterval(intervalSeconds) {
  if (!SUPPORTED_INTERVALS_SECONDS.has(intervalSeconds)) {
    throw new Error(
      `Unsupported interval: ${intervalSeconds}s. Supported intervals are 1s, 5s, and 1m.`
    );
  }
}

export function createCandleEngine({ interval = 60, seedCandles = [] } = {}) {
  const intervalSeconds = parseIntervalSeconds(interval);
  assertSupportedInterval(intervalSeconds);

  const candles = seedCandles.map((candle) => ({ ...candle }));

  const upsertFromTick = ({ price, timestamp }) => {
    if (!Number.isFinite(price)) {
      return null;
    }

    const bucketTime = normalizeTimestamp(Number(timestamp), intervalSeconds);

    if (!Number.isFinite(bucketTime)) {
      return null;
    }

    if (candles.length === 0) {
      const seedCandle = { time: bucketTime, open: price, high: price, low: price, close: price };
      candles.push(seedCandle);
      return seedCandle;
    }

    const lastCandle = candles[candles.length - 1];

    if (lastCandle.time !== bucketTime) {
      const nextCandle = {
        time: bucketTime,
        open: lastCandle.close,
        high: price,
        low: price,
        close: price,
      };
      candles.push(nextCandle);
      return nextCandle;
    }

    lastCandle.high = Math.max(lastCandle.high, price);
    lastCandle.low = Math.min(lastCandle.low, price);
    lastCandle.close = price;

    return { ...lastCandle };
  };

  return {
    intervalSeconds,
    getCandles: () => candles,
    upsertFromTick,
  };
}
