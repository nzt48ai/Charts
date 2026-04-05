import { useEffect, useRef, useState } from 'react';
import { mockCandleData } from './core/mockCandleData';
import { useTradovateMarketData } from './hooks/useTradovateMarketData';
import Chart from './ui/Chart';

const WATCHLIST_SYMBOLS = ['ESM6', 'NQM6', 'YMM6'];

function App() {
  const chartApiRef = useRef(null);
  const [symbol, setSymbol] = useState(WATCHLIST_SYMBOLS[0]);
  const [isSymbolTransitioning, setIsSymbolTransitioning] = useState(false);

  useTradovateMarketData(chartApiRef, {
    seedData: mockCandleData,
    symbol,
  });

  useEffect(() => {
    if (!isSymbolTransitioning) {
      return undefined;
    }

    const transitionTimer = window.setTimeout(() => {
      setIsSymbolTransitioning(false);
    }, 220);

    return () => {
      window.clearTimeout(transitionTimer);
    };
  }, [isSymbolTransitioning, symbol]);

  const onSymbolSelect = (nextSymbol) => {
    if (nextSymbol === symbol) {
      return;
    }

    setIsSymbolTransitioning(true);
    setSymbol(nextSymbol);
  };

  return (
    <main className="app-shell">
      <section className="chart-panel">
        <Chart
          ref={chartApiRef}
          initialData={mockCandleData}
          isSymbolTransitioning={isSymbolTransitioning}
        />
      </section>
      <aside className="right-panel" aria-label="Chart tools panel">
        <div className="panel-card">
          <h2>Watchlist</h2>
          <ul>
            {WATCHLIST_SYMBOLS.map((watchSymbol) => (
              <li key={watchSymbol}>
                <button
                  type="button"
                  className={`watchlist-symbol${watchSymbol === symbol ? ' watchlist-symbol--active' : ''}`}
                  onClick={() => onSymbolSelect(watchSymbol)}
                >
                  {watchSymbol}
                </button>
              </li>
            ))}
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
