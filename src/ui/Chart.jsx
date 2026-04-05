import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { createCandlestickChart } from '../engine/createCandlestickChart';
import { useChartResize } from '../hooks/useChartResize';

const Chart = forwardRef(function Chart({ initialData = [] }, ref) {
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

    if (initialData.length > 0) {
      candlestickSeries.setData(initialData);
      chart.timeScale().fitContent();
    }

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || initialData.length === 0) {
      return;
    }

    seriesRef.current.setData(initialData);
  }, [initialData]);

  useChartResize(containerRef, chartRef);

  useImperativeHandle(
    ref,
    () => ({
      isReady: () => Boolean(seriesRef.current),
      setData: (candles) => {
        if (!seriesRef.current) {
          return;
        }

        seriesRef.current.setData(candles);
      },
      update: (candle) => {
        if (!seriesRef.current) {
          return;
        }

        seriesRef.current.update(candle);
      },
      fitContent: () => {
        if (!chartRef.current) {
          return;
        }

        chartRef.current.timeScale().fitContent();
      },
    }),
    []
  );

  return <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#0b0e13' }} />;
});

export default Chart;
