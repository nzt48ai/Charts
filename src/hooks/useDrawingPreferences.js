import { useCallback, useEffect, useState } from 'react';
import { normalizeFibToolConfigs } from '../core/fibDrawings';
import { loadDrawingPreferences, saveDrawingPreferences } from '../data/preferencesStorage';

export function useDrawingPreferences() {
  const [preferences, setPreferences] = useState(() => loadDrawingPreferences());

  useEffect(() => {
    saveDrawingPreferences(preferences);
  }, [preferences]);

  const updateFibToolConfig = useCallback((toolType, patch) => {
    setPreferences((current) => ({
      ...current,
      fibToolConfigs: normalizeFibToolConfigs({
        ...current.fibToolConfigs,
        [toolType]: {
          ...current.fibToolConfigs[toolType],
          ...patch,
        },
      }),
    }));
  }, []);

  const setMagnetStrength = useCallback((nextStrength) => {
    setPreferences((current) => ({
      ...current,
      magnetStrength: Number(nextStrength) || 0,
    }));
  }, []);

  return {
    fibToolConfigs: preferences.fibToolConfigs,
    magnetStrength: preferences.magnetStrength,
    updateFibToolConfig,
    setMagnetStrength,
  };
}
