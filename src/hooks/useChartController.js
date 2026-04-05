import { useEffect, useImperativeHandle, useRef } from 'react';
import { createCandlestickChart } from '../engine/createCandlestickChart';
import { createFibOverlay } from '../engine/createFibOverlay';
import { useChartResize } from './useChartResize';

export function useChartController(forwardedRef, initialData) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const { chart, candlestickSeries } = createCandlestickChart(containerRef.current);
    const fibOverlay = createFibOverlay({
      container: containerRef.current,
      chart,
      series: candlestickSeries,
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    if (initialData.length > 0) {
      candlestickSeries.setData(initialData);
      chart.timeScale().fitContent();
    }

    return () => {
      fibOverlay.destroy();
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
    forwardedRef,
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

  return { containerRef };
}
