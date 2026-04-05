import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildCrosshairChartOptions } from './core/crosshairSettings';
import { getMockCandleDataForSymbol } from './core/mockCandleData';
import { TIMEFRAME_CONFIGS } from './core/timeframes';
import { LAYOUT_OPTIONS } from './data/layoutConfigs';
import { DEFAULT_FUTURES_SYMBOL } from './data/futuresSymbols';
import { useSavedCrosshairSettings } from './hooks/useSavedCrosshairSettings';
import { useSavedDrawings } from './hooks/useSavedDrawings';
import { useDrawingKeyboardShortcuts } from './hooks/useDrawingKeyboardShortcuts';
import { useDrawingPreferences } from './hooks/useDrawingPreferences';
import { useSavedLayout } from './hooks/useSavedLayout';
import { useSavedTimeframe } from './hooks/useSavedTimeframe';
import { useTradovateMarketData } from './hooks/useTradovateMarketData';
import Chart from './ui/Chart';
import CrosshairSettingsPanel from './ui/CrosshairSettingsPanel';
import DrawingToolbar from './ui/DrawingToolbar';
import FibToolPanel from './ui/FibToolPanel';
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
  const [activeDrawingTool, setActiveDrawingTool] = useState(null);
  const [drawingInteractionState, setDrawingInteractionState] = useState({
    canUndo: false,
    canRedo: false,
    selectedCount: 0,
    magnetStrength: 35,
  });
  const { activeLayout, activeLayoutId, selectLayout } = useSavedLayout();
  const { activeTimeframeId, selectTimeframe } = useSavedTimeframe();
  const { crosshairSettings, updateLineColor, updateLineOpacity } = useSavedCrosshairSettings();
  const { activeDrawings, setActiveDrawings } = useSavedDrawings(activeSymbol.contract);
  const { fibToolConfigs, magnetStrength, updateFibToolConfig, setMagnetStrength } = useDrawingPreferences();
  const crosshairChartOptions = useMemo(
    () => buildCrosshairChartOptions(crosshairSettings),
    [crosshairSettings],
  );
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
    setDesktopSearchValue('');
    setMobileSearchValue('');
    setActiveDrawingTool(null);
    if (activeLayout.mobile.sheet.enabled) {
      setMobileSheetState(MOBILE_SHEET_STATES.COLLAPSED);
    }
  };

  const onSheetPointerDown = (event) => {
    if (!activeLayout.mobile.sheet.enabled) {
      return;
    }

    const headerElement = event.target instanceof Element ? event.target.closest('.bottom-sheet__header') : null;
    if (!headerElement) {
      return;
    }

    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    if (event.pointerType === 'touch' && !event.isPrimary) {
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

  const runChartAction = useCallback((action, payload) => {
    const chartApi = chartApiRef.current;
    if (!chartApi) {
      return;
    }

    if (action === 'undo') chartApi.undoDrawing?.();
    if (action === 'redo') chartApi.redoDrawing?.();
    if (action === 'delete') chartApi.deleteSelectedDrawings?.();
    if (action === 'group') chartApi.groupSelectedDrawings?.();
    if (action === 'ungroup') chartApi.ungroupSelectedDrawings?.();
    if (action === 'front') chartApi.bringSelectionToFront?.();
    if (action === 'back') chartApi.sendSelectionToBack?.();
    if (action === 'magnet') chartApi.setMagnetStrength?.(payload);
  }, []);

  const onDeleteShortcut = useCallback(() => runChartAction('delete'), [runChartAction]);
  const onUndoShortcut = useCallback(() => runChartAction('undo'), [runChartAction]);
  const onRedoShortcut = useCallback(() => runChartAction('redo'), [runChartAction]);
  const onCancelDrawingTool = useCallback(() => setActiveDrawingTool(null), []);

  useDrawingKeyboardShortcuts({
    onDelete: onDeleteShortcut,
    onUndo: onUndoShortcut,
    onRedo: onRedoShortcut,
    onCancelTool: onCancelDrawingTool,
  });

  const onDrawingToolbarAction = (action, payload) => {
    if (action === 'setTool') {
      setActiveDrawingTool(payload);
      return;
    }

    if (action === 'magnet') {
      setMagnetStrength(payload);
    }

    runChartAction(action, payload);
  };

  return (
    <main className={`app-shell app-shell--${activeLayoutId}`}>
      <section className={`chart-panel ${activeLayout.desktop.chart.className} ${activeLayout.mobile.chart.className}`}>
        <Chart
          ref={chartApiRef}
          initialData={seedData}
          chartOptions={crosshairChartOptions}
          drawingTool={activeDrawingTool}
          fibToolConfigs={fibToolConfigs}
          fibDrawings={activeDrawings}
          magnetStrength={magnetStrength}
          onFibDrawingsChange={setActiveDrawings}
          onDrawingInteractionStateChange={setDrawingInteractionState}
        />

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

        <div className="desktop-crosshair-settings">
          <CrosshairSettingsPanel
            idPrefix="desktop-crosshair"
            settings={crosshairSettings}
            onColorChange={updateLineColor}
            onOpacityChange={updateLineOpacity}
            compact
          />
        </div>

        <div className="desktop-fib-tools">
          <FibToolPanel
            idPrefix="desktop-fib"
            activeTool={activeDrawingTool}
            toolConfigs={fibToolConfigs}
            onActivateTool={setActiveDrawingTool}
            onConfigChange={updateFibToolConfig}
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
            <FibToolPanel
              idPrefix="mobile-fib"
              activeTool={activeDrawingTool}
              toolConfigs={fibToolConfigs}
              onActivateTool={setActiveDrawingTool}
              onConfigChange={updateFibToolConfig}
            />
            <CrosshairSettingsPanel
              idPrefix="mobile-crosshair"
              settings={crosshairSettings}
              onColorChange={updateLineColor}
              onOpacityChange={updateLineOpacity}
              title="Crosshair"
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
          <div className="mobile-fib-tools">
            <FibToolPanel
              idPrefix="mobile-floating-fib"
              activeTool={activeDrawingTool}
              toolConfigs={fibToolConfigs}
              onActivateTool={setActiveDrawingTool}
              onConfigChange={updateFibToolConfig}
              compact
            />
          </div>
        </>
      )}

      {activeLayout.desktop.floatingControls.visible || activeLayout.mobile.floatingControls.visible ? (
        <div
          className={`floating-actions${
            activeLayout.desktop.floatingControls.visible ? '' : ' floating-actions--desktop-hidden'
          }`}
        >
          <DrawingToolbar
            activeTool={activeDrawingTool}
            interactionState={drawingInteractionState}
            onAction={onDrawingToolbarAction}
            compact
          />
        </div>
      ) : null}
    </main>
  );
}

export default App;
