export const FUTURES_SYMBOLS = [
  { root: 'ES', name: 'E-mini S&P 500', contract: 'ESM6', exchange: 'CME' },
  { root: 'NQ', name: 'E-mini Nasdaq-100', contract: 'NQM6', exchange: 'CME' },
  { root: 'YM', name: 'E-mini Dow ($5)', contract: 'YMM6', exchange: 'CBOT' },
  { root: 'RTY', name: 'E-mini Russell 2000', contract: 'RTYM6', exchange: 'CME' },
  { root: 'CL', name: 'Crude Oil', contract: 'CLM6', exchange: 'NYMEX' },
  { root: 'GC', name: 'Gold', contract: 'GCM6', exchange: 'COMEX' },
  { root: 'SI', name: 'Silver', contract: 'SIM6', exchange: 'COMEX' },
  { root: 'ZN', name: '10-Year T-Note', contract: 'ZNM6', exchange: 'CBOT' },
  { root: '6E', name: 'Euro FX', contract: '6EM6', exchange: 'CME' },
  { root: '6J', name: 'Japanese Yen', contract: '6JM6', exchange: 'CME' },
];

export const DEFAULT_FUTURES_SYMBOL = FUTURES_SYMBOLS[0];

export function searchFuturesRoots(query) {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return FUTURES_SYMBOLS;
  }

  return FUTURES_SYMBOLS.filter(({ root, name, exchange }) => {
    const haystack = `${root} ${name} ${exchange}`.toLowerCase();
    return haystack.includes(normalized);
  });
}
