import { useEffect } from 'react';

export function useChartResize(containerRef, chartRef) {
  useEffect(() => {
    if (!containerRef.current || !chartRef.current) {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry || !chartRef.current) return;

      const { width, height } = entry.contentRect;
      chartRef.current.applyOptions({ width, height });
      chartRef.current.timeScale().fitContent();
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [containerRef, chartRef]);
}
