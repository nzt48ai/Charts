import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { createCandlestickChart } from '../engine/createCandlestickChart';
import { useChartResize } from '../hooks/useChartResize';

const Chart = forwardRef(function Chart({ data = [] }, ref) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const { chart, candlestickSeries } = createCandlestickChart(containerRef.current);

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    candlestickSeries.setData(data);
    chart.timeScale().fitContent();

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [data]);

  useChartResize(containerRef, chartRef);

  useImperativeHandle(
    ref,
    () => ({
      chart: chartRef.current,
      series: seriesRef.current,
    }),
    []
  );

  return <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#0b0e13' }} />;
});

export default Chart;
