import { forwardRef } from 'react';
import { useChartController } from '../hooks/useChartController';

const Chart = forwardRef(function Chart({ initialData = [], isSymbolTransitioning = false }, ref) {
  const { containerRef } = useChartController(ref, initialData);

  return (
    <div
      ref={containerRef}
      className={`chart-root${isSymbolTransitioning ? ' chart-root--symbol-transition' : ''}`}
    />
  );
});

export default Chart;
