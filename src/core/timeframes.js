export const TIMEFRAME_CONFIGS = [
  { id: '1s', label: '1s', seconds: 1 },
  { id: '5s', label: '5s', seconds: 5 },
  { id: '10s', label: '10s', seconds: 10 },
  { id: '15s', label: '15s', seconds: 15 },
  { id: '1m', label: '1m', seconds: 60 },
];

export const DEFAULT_TIMEFRAME_ID = '1m';

const TIMEFRAME_MAP = TIMEFRAME_CONFIGS.reduce((accumulator, config) => {
  accumulator[config.id] = config;
  return accumulator;
}, {});

export function getTimeframeConfig(timeframeId) {
  return TIMEFRAME_MAP[timeframeId] ?? TIMEFRAME_MAP[DEFAULT_TIMEFRAME_ID];
}

export function getTimeframeSeconds(timeframeId) {
  return getTimeframeConfig(timeframeId).seconds;
}

export function isSupportedTimeframe(timeframeId) {
  return Boolean(TIMEFRAME_MAP[timeframeId]);
}
