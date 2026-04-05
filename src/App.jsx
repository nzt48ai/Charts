import { useEffect, useMemo, useRef, useState } from 'react';
import { getMockCandleDataForSymbol } from './core/mockCandleData';
import { DEFAULT_FUTURES_SYMBOL } from './data/futuresSymbols';
import { TIMEFRAME_CONFIGS } from './core/timeframes';
import { LAYOUT_OPTIONS } from './data/layoutConfigs';
import { useSavedLayout } from './hooks/useSavedLayout';
import { useSavedTimeframe } from './hooks/useSavedTimeframe';
import { useTradovateMarketData } from './hooks/useTradovateMarketData';
import Chart from './ui/Chart';
import LayoutSwitcher from './ui/LayoutSwitcher';
import SidePanel from './ui/SidePanel';
import SymbolSearch from './ui/SymbolSearch';
import TimeframeSwitcher from './ui/TimeframeSwitcher';

const MOBILE_SHEET_STATES = {
  COLLAPSED: 'collapsed',
  EXPANDED: 'expanded',
};

const MOBILE_SHEET_OFFSETS = {
  [MOBILE_SHEET_STATES.COLLAPSED]: 220,
  [MOBILE_SHEET_STATES.EXPANDED]: 0,
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
  const { activeLayout, activeLayoutId, selectLayout } = useSavedLayout();
  const { activeTimeframeId, selectTimeframe } = useSavedTimeframe();
  const [mobileSheetState, setMobileSheetState] = useState(
    activeLayout.mobile.sheet.defaultState === MOBILE_SHEET_STATES.EXPANDED
      ? MOBILE_SHEET_STATES.EXPANDED
      : MOBILE_SHEET_STATES.COLLAPSED,
  );

  const seedData = useMemo(() => getMockCandleDataForSymbol(activeSymbol.root), [activeSymbol.root]);

  useTradovateMarketData(chartApiRef, {
    seedData,
    symbol: activeSymbol.contract,
    timeframe: activeTimeframeId,
  });

  useEffect(() => {
    setMobileSheetState(
      activeLayout.mobile.sheet.defaultState === MOBILE_SHEET_STATES.EXPANDED
        ? MOBILE_SHEET_STATES.EXPANDED
        : MOBILE_SHEET_STATES.COLLAPSED,
    );
  }, [activeLayout.id]);

  useEffect(() => {
    const sheetElement = mobileSheetRef.current;

    if (!sheetElement) {
      return;
    }

    sheetElement.style.setProperty('--sheet-offset', `${MOBILE_SHEET_OFFSETS[mobileSheetState]}px`);
  }, [mobileSheetState]);

  const onSymbolSelect = (nextSymbol) => {
    if (nextSymbol.contract === activeSymbol.contract) {
      return;
    }

    setActiveSymbol(nextSymbol);
  };

  const onSheetPointerDown = (event) => {
    if (!activeLayout.mobile.sheet.enabled) {
      return;
    }

    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    const sheetElement = mobileSheetRef.current;

    if (!sheetElement) {
      return;
    }

    dragPointerIdRef.current = event.pointerId;
    dragStartYRef.current = event.clientY;
    dragCurrentOffsetRef.current = MOBILE_SHEET_OFFSETS[mobileSheetState];
    sheetElement.setPointerCapture(event.pointerId);
    sheetElement.classList.add('bottom-sheet--dragging');
  };

  const onSheetPointerMove = (event) => {
    if (!activeLayout.mobile.sheet.enabled || event.pointerId !== dragPointerIdRef.current) {
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
    if (!activeLayout.mobile.sheet.enabled || event.pointerId !== dragPointerIdRef.current) {
      return;
    }

    const sheetElement = mobileSheetRef.current;

    if (!sheetElement) {
      return;
    }

    const rawOffset = Number.parseFloat(
      getComputedStyle(sheetElement).getPropertyValue('--sheet-offset').replace('px', ''),
    );

    dragPointerIdRef.current = null;
    sheetElement.classList.remove('bottom-sheet--dragging');
    sheetElement.releasePointerCapture(event.pointerId);

    setMobileSheetState(rawOffset > 110 ? MOBILE_SHEET_STATES.COLLAPSED : MOBILE_SHEET_STATES.EXPANDED);
  };

  const toggleMobileSheet = () => {
    if (!activeLayout.mobile.sheet.enabled) {
      return;
    }

    setMobileSheetState((currentState) =>
      currentState === MOBILE_SHEET_STATES.EXPANDED
        ? MOBILE_SHEET_STATES.COLLAPSED
        : MOBILE_SHEET_STATES.EXPANDED,
    );
  };

  return (
    <main className={`app-shell app-shell--${activeLayoutId}`}>
      <section className={`chart-panel ${activeLayout.desktop.chart.className} ${activeLayout.mobile.chart.className}`}>
        <Chart ref={chartApiRef} initialData={seedData} />

        {activeLayout.desktop.searchSurface.visible ? (
          <div className="desktop-symbol-search" aria-label="Desktop symbol search">
            <SymbolSearch
              inputId="desktop-symbol-search"
              value={desktopSearchValue}
              onValueChange={setDesktopSearchValue}
              activeRoot={activeSymbol.root}
              onSymbolSelect={onSymbolSelect}
            />
          </div>
        ) : null}

        <div className="desktop-layout-switcher">
          <LayoutSwitcher
            options={LAYOUT_OPTIONS}
            activeLayoutId={activeLayoutId}
            onSelectLayout={selectLayout}
            compact
          />
        </div>

        <div className="desktop-timeframe-switcher">
          <TimeframeSwitcher
            options={TIMEFRAME_CONFIGS}
            activeTimeframeId={activeTimeframeId}
            onSelectTimeframe={selectTimeframe}
            compact
          />
        </div>
      </section>

      {activeLayout.desktop.sidePanel.visible ? <SidePanel activeSymbol={activeSymbol} /> : null}

      {activeLayout.mobile.sheet.enabled ? (
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
              <span className="bottom-sheet__title">Workspace</span>
            </button>
          </header>
          <div className="bottom-sheet__content">
            {activeLayout.mobile.searchSurface.visible ? (
              <SymbolSearch
                mobile
                inputId="mobile-symbol-search"
                value={mobileSearchValue}
                onValueChange={setMobileSearchValue}
                activeRoot={activeSymbol.root}
                onSymbolSelect={onSymbolSelect}
              />
            ) : null}
            {activeLayout.mobile.sidePanel.visible ? <SidePanel activeSymbol={activeSymbol} /> : null}
            <TimeframeSwitcher
              options={TIMEFRAME_CONFIGS}
              activeTimeframeId={activeTimeframeId}
              onSelectTimeframe={selectTimeframe}
            />
            <LayoutSwitcher
              options={LAYOUT_OPTIONS}
              activeLayoutId={activeLayoutId}
              onSelectLayout={selectLayout}
            />
          </div>
        </section>
      ) : (
        <>
          <div className="mobile-layout-switcher">
            <LayoutSwitcher
              options={LAYOUT_OPTIONS}
              activeLayoutId={activeLayoutId}
              onSelectLayout={selectLayout}
              compact
            />
          </div>
          <div className="mobile-timeframe-switcher">
            <TimeframeSwitcher
              options={TIMEFRAME_CONFIGS}
              activeTimeframeId={activeTimeframeId}
              onSelectTimeframe={selectTimeframe}
              compact
            />
          </div>
        </>
      )}

      {activeLayout.desktop.floatingControls.visible || activeLayout.mobile.floatingControls.visible ? (
        <nav
          className={`floating-actions${
            activeLayout.desktop.floatingControls.visible ? '' : ' floating-actions--desktop-hidden'
          }`}
          aria-label="Quick actions"
        >
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
      ) : null}
    </main>
  );
}

export default App;
