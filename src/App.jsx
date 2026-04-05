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
      <aside className="right-panel" aria-label="Chart tools panel">
        <div className="panel-card">
          <h2>Watchlist</h2>
          <ul>
            <li>ESM6</li>
            <li>NQM6</li>
            <li>YMM6</li>
          </ul>
        </div>
        <div className="panel-card">
          <h2>Order Ticket</h2>
          <p>Panel content can be replaced with your existing controls.</p>
        </div>
      </aside>

      <section className="bottom-sheet" aria-label="Mobile panel">
        <header className="bottom-sheet__header">
          <span className="bottom-sheet__handle" />
          <h2>Mobile Panel</h2>
        </header>
        <div className="bottom-sheet__content">
          <p>Use this area for watchlist, orders, or settings on mobile.</p>
        </div>
      </section>

      <nav className="floating-actions" aria-label="Quick actions">
        <button type="button">+</button>
        <button type="button">⤢</button>
      </nav>
    </main>
  );
}

export default App;
