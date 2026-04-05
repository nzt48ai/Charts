import { useEffect, useMemo, useRef, useState } from 'react';
import { getMockCandleDataForSymbol } from './core/mockCandleData';
import { DEFAULT_FUTURES_SYMBOL } from './data/futuresSymbols';
import { useTradovateMarketData } from './hooks/useTradovateMarketData';
import Chart from './ui/Chart';
import SymbolSearch from './ui/SymbolSearch';

const MOBILE_SHEET_STATES = {
  COLLAPSED: 'collapsed',
  EXPANDED: 'expanded',
};

function App() {
  const chartApiRef = useRef(null);
  const mobileSheetRef = useRef(null);
  const dragPointerIdRef = useRef(null);
  const dragStartYRef = useRef(0);
  const dragCurrentOffsetRef = useRef(0);
  const [activeSymbol, setActiveSymbol] = useState(DEFAULT_FUTURES_SYMBOL);
  const [desktopSearchValue, setDesktopSearchValue] = useState('');
  const [mobileSearchValue, setMobileSearchValue] = useState('');
  const [mobileSheetState, setMobileSheetState] = useState(MOBILE_SHEET_STATES.COLLAPSED);

  const seedData = useMemo(() => getMockCandleDataForSymbol(activeSymbol.root), [activeSymbol.root]);

  useTradovateMarketData(chartApiRef, {
    seedData,
    symbol: activeSymbol.contract,
  });

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
    if (nextSymbol.contract === activeSymbol.contract) {
      return;
    }

    setActiveSymbol(nextSymbol);
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
        <Chart ref={chartApiRef} initialData={seedData} />
        <div className="desktop-symbol-search" aria-label="Desktop symbol search">
          <SymbolSearch
            inputId="desktop-symbol-search"
            value={desktopSearchValue}
            onValueChange={setDesktopSearchValue}
            activeRoot={activeSymbol.root}
            onSymbolSelect={onSymbolSelect}
          />
        </div>
      </section>
      <aside className="right-panel" aria-label="Chart tools panel">
        <div className="panel-card">
          <h2>Active Contract</h2>
          <p>
            {activeSymbol.root} · {activeSymbol.contract}
          </p>
        </div>
        <div className="panel-card">
          <h2>Order Ticket</h2>
          <p>Panel content can be replaced with your existing controls.</p>
        </div>
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
            <span className="bottom-sheet__title">Symbol Search</span>
          </button>
        </header>
        <div className="bottom-sheet__content">
          <SymbolSearch
            mobile
            inputId="mobile-symbol-search"
            value={mobileSearchValue}
            onValueChange={setMobileSearchValue}
            activeRoot={activeSymbol.root}
            onSymbolSelect={onSymbolSelect}
          />
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
