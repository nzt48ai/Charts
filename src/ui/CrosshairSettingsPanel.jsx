function CrosshairSettingsLineRow({ idPrefix, label, lineKey, lineSettings, onColorChange, onOpacityChange }) {
  return (
    <div className="crosshair-settings__line-row">
      <span className="crosshair-settings__line-label">{label}</span>
      <div className="crosshair-settings__controls">
        <label className="crosshair-settings__field" htmlFor={`${idPrefix}-${lineKey}-color`}>
          <span>Color</span>
          <input
            id={`${idPrefix}-${lineKey}-color`}
            type="color"
            value={lineSettings.color}
            onChange={(event) => onColorChange(lineKey, event.target.value)}
          />
        </label>
        <label className="crosshair-settings__field" htmlFor={`${idPrefix}-${lineKey}-opacity`}>
          <span>Opacity</span>
          <input
            id={`${idPrefix}-${lineKey}-opacity`}
            type="range"
            min="0"
            max="100"
            value={Math.round(lineSettings.opacity * 100)}
            onChange={(event) => onOpacityChange(lineKey, Number(event.target.value) / 100)}
          />
        </label>
      </div>
    </div>
  );
}

function CrosshairSettingsPanel({
  idPrefix,
  settings,
  onColorChange,
  onOpacityChange,
  compact = false,
  title = 'Crosshair',
}) {
  return (
    <section
      className={`crosshair-settings${compact ? ' crosshair-settings--compact' : ''}`}
      aria-label="Crosshair settings"
    >
      <span className="crosshair-settings__label">{title}</span>
      <CrosshairSettingsLineRow
        idPrefix={idPrefix}
        label="Vertical"
        lineKey="vertLine"
        lineSettings={settings.vertLine}
        onColorChange={onColorChange}
        onOpacityChange={onOpacityChange}
      />
      <CrosshairSettingsLineRow
        idPrefix={idPrefix}
        label="Horizontal"
        lineKey="horzLine"
        lineSettings={settings.horzLine}
        onColorChange={onColorChange}
        onOpacityChange={onOpacityChange}
      />
    </section>
  );
}

export default CrosshairSettingsPanel;
