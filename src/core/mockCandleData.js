const BASE_MOCK_CANDLE_DATA = [
  { time: '2026-03-23', open: 102, high: 109, low: 100, close: 106 },
  { time: '2026-03-24', open: 106, high: 112, low: 105, close: 111 },
  { time: '2026-03-25', open: 111, high: 115, low: 108, close: 109 },
  { time: '2026-03-26', open: 109, high: 117, low: 107, close: 115 },
  { time: '2026-03-27', open: 115, high: 118, low: 112, close: 114 },
  { time: '2026-03-30', open: 114, high: 121, low: 113, close: 119 },
  { time: '2026-03-31', open: 119, high: 123, low: 118, close: 121 },
  { time: '2026-04-01', open: 121, high: 124, low: 117, close: 118 },
  { time: '2026-04-02', open: 118, high: 122, low: 116, close: 120 },
  { time: '2026-04-03', open: 120, high: 126, low: 119, close: 125 },
];

const ROOT_PRICE_OFFSETS = {
  ES: 4200,
  NQ: 18200,
  YM: 38200,
  RTY: 2200,
  CL: 78,
  GC: 2220,
  SI: 26,
  ZN: 110,
  '6E': 1.09,
  '6J': 0.0068,
};

function normalizeRoot(rootSymbol) {
  return rootSymbol?.toUpperCase().trim() || 'ES';
}

function resolveScale(rootSymbol) {
  if (rootSymbol.startsWith('6')) {
    return 0.0004;
  }

  if (rootSymbol === 'CL') {
    return 0.22;
  }

  if (rootSymbol === 'GC' || rootSymbol === 'SI') {
    return 1.8;
  }

  if (rootSymbol === 'ZN') {
    return 0.08;
  }

  return 5.5;
}

export function getMockCandleDataForSymbol(rootSymbol) {
  const normalizedRoot = normalizeRoot(rootSymbol);
  const offset = ROOT_PRICE_OFFSETS[normalizedRoot] ?? ROOT_PRICE_OFFSETS.ES;
  const scale = resolveScale(normalizedRoot);

  return BASE_MOCK_CANDLE_DATA.map((candle) => ({
    time: candle.time,
    open: Number((offset + candle.open * scale).toFixed(5)),
    high: Number((offset + candle.high * scale).toFixed(5)),
    low: Number((offset + candle.low * scale).toFixed(5)),
    close: Number((offset + candle.close * scale).toFixed(5)),
  }));
}

export const mockCandleData = getMockCandleDataForSymbol('ES');
