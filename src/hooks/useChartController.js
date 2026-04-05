import { useEffect, useImperativeHandle, useRef } from 'react';
import { createCandlestickChart } from '../engine/createCandlestickChart';
import { createFibOverlay } from '../engine/createFibOverlay';
import { useChartResize } from './useChartResize';

export function useChartController(
  forwardedRef,
  {
    initialData,
    chartOptions,
    drawingTool,
    fibToolConfigs,
    fibDrawings,
    magnetStrength,
    onFibDrawingsChange,
    onInteractionStateChange,
  },
) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const fibOverlayRef = useRef(null);
  const candlesRef = useRef(initialData ?? []);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const { chart, candlestickSeries } = createCandlestickChart(containerRef.current);
    const fibOverlay = createFibOverlay({
      container: containerRef.current,
      chart,
      series: candlestickSeries,
      initialMagnetStrength: magnetStrength,
      initialDrawings: fibDrawings,
      onDrawingsChange: onFibDrawingsChange,
      onInteractionStateChange,
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    fibOverlayRef.current = fibOverlay;

    if (initialData.length > 0) {
      candlesRef.current = initialData;
      candlestickSeries.setData(initialData);
      fibOverlay.setCandles(initialData);
      chart.timeScale().fitContent();
    }

    return () => {
      fibOverlay.destroy();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      fibOverlayRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || initialData.length === 0) {
      return;
    }

    candlesRef.current = initialData;
    seriesRef.current.setData(initialData);
    fibOverlayRef.current?.setCandles(initialData);
  }, [initialData]);

  useEffect(() => {
    if (!chartRef.current || !chartOptions) {
      return;
    }

    chartRef.current.applyOptions(chartOptions);
  }, [chartOptions]);

  useEffect(() => {
    fibOverlayRef.current?.setDrawingTool(drawingTool);
  }, [drawingTool]);

  useEffect(() => {
    if (!fibToolConfigs) {
      return;
    }

    fibOverlayRef.current?.setToolConfigs(fibToolConfigs);
  }, [fibToolConfigs]);

  useEffect(() => {
    fibOverlayRef.current?.setDrawings(fibDrawings);
  }, [fibDrawings]);

  useEffect(() => {
    fibOverlayRef.current?.setMagnetStrength(magnetStrength);
  }, [magnetStrength]);

  useChartResize(containerRef, chartRef);

  useImperativeHandle(
    forwardedRef,
    () => ({
      isReady: () => Boolean(seriesRef.current),
      setData: (candles) => {
        if (!seriesRef.current) {
          return;
        }

        candlesRef.current = candles;
        seriesRef.current.setData(candles);
        fibOverlayRef.current?.setCandles(candles);
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

        const nextCandles = candlesRef.current.slice();
        if (nextCandles.length === 0) {
          nextCandles.push(candle);
        } else {
          const last = nextCandles[nextCandles.length - 1];
          if (last.time === candle.time) {
            nextCandles[nextCandles.length - 1] = candle;
          } else {
            nextCandles.push(candle);
          }
        }

        candlesRef.current = nextCandles;
        seriesRef.current.update(candle);
        fibOverlayRef.current?.setCandles(nextCandles);
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
      undoDrawing: () => fibOverlayRef.current?.undo(),
      redoDrawing: () => fibOverlayRef.current?.redo(),
      deleteSelectedDrawings: () => fibOverlayRef.current?.deleteSelection(),
      groupSelectedDrawings: () => fibOverlayRef.current?.groupSelection(),
      ungroupSelectedDrawings: () => fibOverlayRef.current?.ungroupSelection(),
      bringSelectionToFront: () => fibOverlayRef.current?.bringToFront(),
      sendSelectionToBack: () => fibOverlayRef.current?.sendToBack(),
      setMagnetStrength: (value) => fibOverlayRef.current?.setMagnetStrength(value),
    }),
    [],
  );

  return { containerRef };
}
