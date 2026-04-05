import { useRef } from 'react';
import { mockCandleData } from './core/mockCandleData';
import Chart from './ui/Chart';

function App() {
  const chartApiRef = useRef(null);

  return (
    <main className="app-shell">
      <section className="chart-panel">
        <Chart ref={chartApiRef} data={mockCandleData} />
      </section>
    </main>
  );
}

export default App;
