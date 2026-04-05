import { useCallback, useEffect, useMemo, useState } from 'react';
import { getLayoutConfig } from '../data/layoutConfigs';
import { loadActiveLayoutId, saveActiveLayoutId } from '../data/layoutStorage';

export function useSavedLayout() {
  const [activeLayoutId, setActiveLayoutId] = useState(() => loadActiveLayoutId());

  useEffect(() => {
    saveActiveLayoutId(activeLayoutId);
  }, [activeLayoutId]);

  const activeLayout = useMemo(() => getLayoutConfig(activeLayoutId), [activeLayoutId]);

  const selectLayout = useCallback((layoutId) => {
    setActiveLayoutId(layoutId);
  }, []);

  return {
    activeLayout,
    activeLayoutId,
    selectLayout,
  };
}
