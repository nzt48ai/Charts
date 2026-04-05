export const chartTheme = {
  background: '#0b0e13',
  textColor: '#cbd5e1',
  gridColor: '#1f2937',
};

export const chartOptions = {
  layout: {
    background: { color: chartTheme.background },
    textColor: chartTheme.textColor,
  },
  grid: {
    vertLines: { color: chartTheme.gridColor },
    horzLines: { color: chartTheme.gridColor },
  },
  rightPriceScale: {
    borderColor: chartTheme.gridColor,
  },
  timeScale: {
    borderColor: chartTheme.gridColor,
  },
  crosshair: {
    vertLine: {
      color: '#94a3b8',
      width: 1,
      style: 2,
    },
    horzLine: {
      color: '#94a3b8',
      width: 1,
      style: 2,
    },
  },
};

export const candlestickOptions = {
  upColor: '#22c55e',
  downColor: '#ef4444',
  borderVisible: false,
  wickUpColor: '#22c55e',
  wickDownColor: '#ef4444',
};
