export const LAYOUT_IDS = {
  FOCUS: 'focus',
  TRADE: 'trade',
  MINIMAL: 'minimal',
};

export const LAYOUTS = {
  [LAYOUT_IDS.FOCUS]: {
    id: LAYOUT_IDS.FOCUS,
    label: 'Focus',
    desktop: {
      chart: { className: 'layout-chart--focus' },
      sidePanel: { visible: false, mode: 'floating' },
      searchSurface: { visible: true, placement: 'floating' },
      floatingControls: { visible: true, placement: 'floating' },
    },
    mobile: {
      chart: { className: 'layout-chart--focus' },
      sidePanel: { visible: false, mode: 'bottom-sheet' },
      searchSurface: { visible: true, placement: 'bottom-sheet' },
      floatingControls: { visible: true, placement: 'floating' },
      sheet: { enabled: true, defaultState: 'collapsed' },
    },
  },
  [LAYOUT_IDS.TRADE]: {
    id: LAYOUT_IDS.TRADE,
    label: 'Trade',
    desktop: {
      chart: { className: 'layout-chart--trade' },
      sidePanel: { visible: true, mode: 'floating' },
      searchSurface: { visible: true, placement: 'floating' },
      floatingControls: { visible: true, placement: 'floating' },
    },
    mobile: {
      chart: { className: 'layout-chart--trade' },
      sidePanel: { visible: true, mode: 'bottom-sheet' },
      searchSurface: { visible: true, placement: 'bottom-sheet' },
      floatingControls: { visible: true, placement: 'floating' },
      sheet: { enabled: true, defaultState: 'expanded' },
    },
  },
  [LAYOUT_IDS.MINIMAL]: {
    id: LAYOUT_IDS.MINIMAL,
    label: 'Minimal',
    desktop: {
      chart: { className: 'layout-chart--minimal' },
      sidePanel: { visible: false, mode: 'floating' },
      searchSurface: { visible: false, placement: 'floating' },
      floatingControls: { visible: false, placement: 'floating' },
    },
    mobile: {
      chart: { className: 'layout-chart--minimal' },
      sidePanel: { visible: false, mode: 'bottom-sheet' },
      searchSurface: { visible: false, placement: 'bottom-sheet' },
      floatingControls: { visible: true, placement: 'floating' },
      sheet: { enabled: false, defaultState: 'collapsed' },
    },
  },
};

export const LAYOUT_OPTIONS = Object.values(LAYOUTS).map(({ id, label }) => ({
  id,
  label,
}));

export const DEFAULT_LAYOUT_ID = LAYOUT_IDS.FOCUS;

export function getLayoutConfig(layoutId) {
  return LAYOUTS[layoutId] ?? LAYOUTS[DEFAULT_LAYOUT_ID];
}
