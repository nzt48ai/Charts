import { forwardRef } from 'react';
import { useChartController } from '../hooks/useChartController';

const Chart = forwardRef(function Chart({ initialData = [], chartOptions = null }, ref) {
  const { containerRef } = useChartController(ref, initialData, chartOptions);

  return <div ref={containerRef} className="chart-root" />;
});

export default Chart;
