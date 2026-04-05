import { useCallback, useEffect, useMemo, useState } from 'react';
import { normalizeFibDrawings } from '../core/fibDrawings';
import { loadFibDrawingsBySymbol, saveFibDrawingsBySymbol } from '../data/drawingStorage';

export function useSavedDrawings(activeSymbolContract) {
  const [drawingsBySymbol, setDrawingsBySymbol] = useState(() => loadFibDrawingsBySymbol());

  useEffect(() => {
    saveFibDrawingsBySymbol(drawingsBySymbol);
  }, [drawingsBySymbol]);

  const activeDrawings = useMemo(
    () => normalizeFibDrawings(drawingsBySymbol[activeSymbolContract]),
    [activeSymbolContract, drawingsBySymbol],
  );

  const setActiveDrawings = useCallback(
    (nextDrawings) => {
      setDrawingsBySymbol((current) => ({
        ...current,
        [activeSymbolContract]: normalizeFibDrawings(nextDrawings),
      }));
    },
    [activeSymbolContract],
  );

  return {
    activeDrawings,
    setActiveDrawings,
  };
}
