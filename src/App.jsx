import { useEffect, useRef, useState } from 'react';
import { mockCandleData } from './core/mockCandleData';
import { useTradovateMarketData } from './hooks/useTradovateMarketData';
import Chart from './ui/Chart';

const WATCHLIST_SYMBOLS = ['ESM6', 'NQM6', 'YMM6'];
const MOBILE_SHEET_STATES = {
  COLLAPSED: 'collapsed',
  EXPANDED: 'expanded',
};

function SidePanelContent({ symbol, onSymbolSelect }) {
  return (
    <>
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
    </>
  );
}

function App() {
  const chartApiRef = useRef(null);
  const mobileSheetRef = useRef(null);
  const dragPointerIdRef = useRef(null);
  const dragStartYRef = useRef(0);
  const dragCurrentOffsetRef = useRef(0);
  const [symbol, setSymbol] = useState(WATCHLIST_SYMBOLS[0]);
  const [isSymbolTransitioning, setIsSymbolTransitioning] = useState(false);
  const [mobileSheetState, setMobileSheetState] = useState(MOBILE_SHEET_STATES.COLLAPSED);

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

  useEffect(() => {
    const sheetElement = mobileSheetRef.current;

    if (!sheetElement) {
      return;
    }

    sheetElement.style.setProperty(
      '--sheet-offset',
      mobileSheetState === MOBILE_SHEET_STATES.EXPANDED ? '0px' : '220px',
    );
  }, [mobileSheetState]);

  const onSymbolSelect = (nextSymbol) => {
    if (nextSymbol === symbol) {
      return;
    }

    setIsSymbolTransitioning(true);
    setSymbol(nextSymbol);
  };

  const onSheetPointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    const sheetElement = mobileSheetRef.current;

    if (!sheetElement) {
      return;
    }

    dragPointerIdRef.current = event.pointerId;
    dragStartYRef.current = event.clientY;
    dragCurrentOffsetRef.current = mobileSheetState === MOBILE_SHEET_STATES.EXPANDED ? 0 : 220;
    sheetElement.setPointerCapture(event.pointerId);
    sheetElement.classList.add('bottom-sheet--dragging');
  };

  const onSheetPointerMove = (event) => {
    if (event.pointerId !== dragPointerIdRef.current) {
      return;
    }

    const sheetElement = mobileSheetRef.current;

    if (!sheetElement) {
      return;
    }

    const deltaY = event.clientY - dragStartYRef.current;
    const nextOffset = Math.max(0, Math.min(220, dragCurrentOffsetRef.current + deltaY));

    sheetElement.style.setProperty('--sheet-offset', `${nextOffset}px`);
  };

  const onSheetPointerEnd = (event) => {
    if (event.pointerId !== dragPointerIdRef.current) {
      return;
    }

    const sheetElement = mobileSheetRef.current;

    if (!sheetElement) {
      return;
    }

    const rawOffset = Number.parseFloat(
      getComputedStyle(sheetElement).getPropertyValue('--sheet-offset').replace('px', ''),
    );
    const nextState = rawOffset > 110 ? MOBILE_SHEET_STATES.COLLAPSED : MOBILE_SHEET_STATES.EXPANDED;

    dragPointerIdRef.current = null;
    sheetElement.classList.remove('bottom-sheet--dragging');
    sheetElement.releasePointerCapture(event.pointerId);
    setMobileSheetState(nextState);
  };

  const toggleMobileSheet = () => {
    setMobileSheetState((currentState) =>
      currentState === MOBILE_SHEET_STATES.EXPANDED
        ? MOBILE_SHEET_STATES.COLLAPSED
        : MOBILE_SHEET_STATES.EXPANDED,
    );
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
        <SidePanelContent symbol={symbol} onSymbolSelect={onSymbolSelect} />
      </aside>

      <section
        ref={mobileSheetRef}
        className="bottom-sheet"
        aria-label="Mobile panel"
        onPointerDown={onSheetPointerDown}
        onPointerMove={onSheetPointerMove}
        onPointerUp={onSheetPointerEnd}
        onPointerCancel={onSheetPointerEnd}
      >
        <header className="bottom-sheet__header">
          <button type="button" className="bottom-sheet__grab" onClick={toggleMobileSheet}>
            <span className="bottom-sheet__handle" />
            <span className="bottom-sheet__title">Quick Access</span>
          </button>
        </header>
        <div className="bottom-sheet__content">
          <SidePanelContent symbol={symbol} onSymbolSelect={onSymbolSelect} />
        </div>
      </section>

      <nav className="floating-actions" aria-label="Quick actions">
        <button type="button" aria-label="Trendline tool" title="Trendline tool">
          ╱
        </button>
        <button type="button" aria-label="Fibonacci tool" title="Fibonacci tool">
          ƒ
        </button>
        <button type="button" aria-label="Crosshair tool" title="Crosshair tool">
          ⊕
        </button>
      </nav>
    </main>
  );
}

export default App;
