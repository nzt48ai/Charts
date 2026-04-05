import { forwardRef } from 'react';
import { useChartController } from '../hooks/useChartController';

const Chart = forwardRef(function Chart(
  {
    initialData = [],
    chartOptions = null,
    drawingTool = null,
    fibToolConfigs = null,
    fibDrawings = [],
    onFibDrawingsChange,
    onDrawingInteractionStateChange,
  },
  ref,
) {
  const { containerRef } = useChartController(ref, {
    initialData,
    chartOptions,
    drawingTool,
    fibToolConfigs,
    fibDrawings,
    onFibDrawingsChange,
    onInteractionStateChange: onDrawingInteractionStateChange,
  });

  return <div ref={containerRef} className="chart-root" />;
});

export default Chart;
