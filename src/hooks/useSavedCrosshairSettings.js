import { useCallback, useEffect, useState } from 'react';
import { normalizeCrosshairSettings } from '../core/crosshairSettings';
import { loadCrosshairSettings, saveCrosshairSettings } from '../data/crosshairStorage';

export function useSavedCrosshairSettings() {
  const [settings, setSettings] = useState(() => loadCrosshairSettings());

  useEffect(() => {
    saveCrosshairSettings(settings);
  }, [settings]);

  const updateLineColor = useCallback((lineKey, color) => {
    setSettings((currentSettings) =>
      normalizeCrosshairSettings({
        ...currentSettings,
        [lineKey]: {
          ...currentSettings[lineKey],
          color,
        },
      }),
    );
  }, []);

  const updateLineOpacity = useCallback((lineKey, opacity) => {
    setSettings((currentSettings) =>
      normalizeCrosshairSettings({
        ...currentSettings,
        [lineKey]: {
          ...currentSettings[lineKey],
          opacity,
        },
      }),
    );
  }, []);

  return {
    crosshairSettings: settings,
    updateLineColor,
    updateLineOpacity,
  };
}
