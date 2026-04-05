import { useEffect, useImperativeHandle, useRef } from 'react';
import { createCandlestickChart } from '../engine/createCandlestickChart';
import { createFibOverlay } from '../engine/createFibOverlay';
import { useChartResize } from './useChartResize';

export function useChartController(forwardedRef, initialData, chartOptions) {
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

  useEffect(() => {
    if (!chartRef.current || !chartOptions) {
      return;
    }

    chartRef.current.applyOptions(chartOptions);
  }, [chartOptions]);

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
      getVisibleLogicalRange: () => {
        if (!chartRef.current) {
          return null;
        }

        return chartRef.current.timeScale().getVisibleLogicalRange();
      },
      setVisibleLogicalRange: (range) => {
        if (!chartRef.current || !range) {
          return;
        }

        chartRef.current.timeScale().setVisibleLogicalRange(range);
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
      applyOptions: (options) => {
        if (!chartRef.current || !options) {
          return;
        }

        chartRef.current.applyOptions(options);
      },
    }),
    []
  );

  return { containerRef };
}
