import { getTimeframeConfig } from './timeframes';

function normalizeTimestamp(epochMillis, intervalSeconds) {
  const epochSeconds = Math.floor(epochMillis / 1000);
  return Math.floor(epochSeconds / intervalSeconds) * intervalSeconds;
}

function toEpochMillis(rawTime) {
  if (typeof rawTime === 'number' && Number.isFinite(rawTime)) {
    return rawTime > 10_000_000_000 ? rawTime : rawTime * 1000;
  }

  if (typeof rawTime === 'string') {
    const parsed = Date.parse(rawTime);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function aggregateCandles(seedCandles, intervalSeconds) {
  const aggregated = [];

  for (const seedCandle of seedCandles) {
    const epochMillis = toEpochMillis(seedCandle.time);

    if (!Number.isFinite(epochMillis)) {
      continue;
    }

    const bucketTime = normalizeTimestamp(epochMillis, intervalSeconds);
    const candle = {
      time: bucketTime,
      open: Number(seedCandle.open),
      high: Number(seedCandle.high),
      low: Number(seedCandle.low),
      close: Number(seedCandle.close),
    };

    if (![candle.open, candle.high, candle.low, candle.close].every(Number.isFinite)) {
      continue;
    }

    const previousCandle = aggregated[aggregated.length - 1];

    if (!previousCandle || previousCandle.time !== bucketTime) {
      aggregated.push(candle);
      continue;
    }

    previousCandle.high = Math.max(previousCandle.high, candle.high);
    previousCandle.low = Math.min(previousCandle.low, candle.low);
    previousCandle.close = candle.close;
  }

  return aggregated;
}

export function createCandleEngine({ timeframe = '1m', seedCandles = [] } = {}) {
  let timeframeConfig = getTimeframeConfig(timeframe);
  let candles = aggregateCandles(seedCandles, timeframeConfig.seconds);

  const upsertFromTick = ({ price, timestamp }) => {
    if (!Number.isFinite(price)) {
      return null;
    }

    const bucketTime = normalizeTimestamp(Number(timestamp), timeframeConfig.seconds);

    if (!Number.isFinite(bucketTime)) {
      return null;
    }

    if (candles.length === 0) {
      const firstCandle = { time: bucketTime, open: price, high: price, low: price, close: price };
      candles.push(firstCandle);
      return firstCandle;
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

  const reset = ({ timeframe: nextTimeframe = timeframeConfig.id, seedCandles: nextSeedCandles = [] } = {}) => {
    timeframeConfig = getTimeframeConfig(nextTimeframe);
    candles = aggregateCandles(nextSeedCandles, timeframeConfig.seconds);
    return candles;
  };

  return {
    get timeframeId() {
      return timeframeConfig.id;
    },
    get intervalSeconds() {
      return timeframeConfig.seconds;
    },
    getCandles: () => candles,
    reset,
    upsertFromTick,
  };
}
