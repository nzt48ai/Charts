import { useRef } from 'react';
import { mockCandleData } from './core/mockCandleData';
import { useTradovateMarketData } from './hooks/useTradovateMarketData';
import Chart from './ui/Chart';

function App() {
  const chartApiRef = useRef(null);

  useTradovateMarketData(chartApiRef, {
    seedData: mockCandleData,
  });

  return (
    <main className="app-shell">
      <section className="chart-panel">
        <Chart ref={chartApiRef} initialData={mockCandleData} />
      </section>
    </main>
  );
}

export default App;
