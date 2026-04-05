import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_TIMEFRAME_ID, isSupportedTimeframe } from '../core/timeframes';
import { loadActiveTimeframeId, saveActiveTimeframeId } from '../data/layoutStorage';

export function useSavedTimeframe() {
  const [activeTimeframeId, setActiveTimeframeId] = useState(() => loadActiveTimeframeId());

  useEffect(() => {
    saveActiveTimeframeId(activeTimeframeId);
  }, [activeTimeframeId]);

  const selectTimeframe = useCallback((timeframeId) => {
    if (!isSupportedTimeframe(timeframeId)) {
      return;
    }

    setActiveTimeframeId(timeframeId);
  }, []);

  return {
    activeTimeframeId: isSupportedTimeframe(activeTimeframeId) ? activeTimeframeId : DEFAULT_TIMEFRAME_ID,
    selectTimeframe,
  };
}
