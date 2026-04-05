import { buildCrosshairChartOptions } from './crosshairSettings';

const defaultCrosshairOptions = buildCrosshairChartOptions(undefined).crosshair;

export const chartTheme = {
  background: '#0b0e13',
  textColor: '#cbd5e1',
  gridColor: '#1f2937',
};

export const chartOptions = {
  handleScroll: {
    mouseWheel: true,
    pressedMouseMove: true,
    horzTouchDrag: true,
    vertTouchDrag: true,
  },
  handleScale: {
    axisPressedMouseMove: true,
    mouseWheel: true,
    pinch: true,
  },
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
    ...defaultCrosshairOptions,
    vertLine: {
      ...defaultCrosshairOptions.vertLine,
      width: 1,
      style: 2,
    },
    horzLine: {
      ...defaultCrosshairOptions.horzLine,
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
