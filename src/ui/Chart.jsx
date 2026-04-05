import { forwardRef } from 'react';
import { useChartController } from '../hooks/useChartController';

const Chart = forwardRef(function Chart({ initialData = [] }, ref) {
  const { containerRef } = useChartController(ref, initialData);

  return <div ref={containerRef} className="chart-root" />;
});

export default Chart;
