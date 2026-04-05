import { createChart } from 'lightweight-charts';
import { candlestickOptions, chartOptions } from '../core/chartTheme';

export function createCandlestickChart(container) {
  const chart = createChart(container, {
    ...chartOptions,
    width: container.clientWidth,
    height: container.clientHeight,
  });

  const candlestickSeries = chart.addCandlestickSeries(candlestickOptions);

  return { chart, candlestickSeries };
}
