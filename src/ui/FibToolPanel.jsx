import { FIB_DRAWING_TYPES, FIB_PRICE_LINE_STYLES } from '../core/fibDrawings';
import { parseFibLevelsInput } from '../core/fibMath';

function ToolButton({ label, active, onClick }) {
  return (
    <button type="button" className={`fib-tools__button${active ? ' fib-tools__button--active' : ''}`} onClick={onClick}>
      {label}
    </button>
  );
}

function FibConfigSection({ idPrefix, title, toolType, config, onConfigChange, supportsLineStyle = false }) {
  return (
    <div className="fib-tools__section">
      <h3>{title}</h3>
      <div className="fib-tools__row">
        <label htmlFor={`${idPrefix}-${toolType}-levels`}>Levels</label>
        <input
          id={`${idPrefix}-${toolType}-levels`}
          type="text"
          value={config.levels.join(', ')}
          onChange={(event) => onConfigChange(toolType, { levels: parseFibLevelsInput(event.target.value) })}
          placeholder="0, 0.382, 0.618, 1"
        />
      </div>
      <div className="fib-tools__row fib-tools__row--two">
        <label htmlFor={`${idPrefix}-${toolType}-color`}>Color</label>
        <input
          id={`${idPrefix}-${toolType}-color`}
          type="color"
          value={config.color}
          onChange={(event) => onConfigChange(toolType, { color: event.target.value })}
        />
        <label htmlFor={`${idPrefix}-${toolType}-opacity`}>Opacity</label>
        <input
          id={`${idPrefix}-${toolType}-opacity`}
          type="range"
          min="5"
          max="100"
          value={Math.round(config.opacity * 100)}
          onChange={(event) => onConfigChange(toolType, { opacity: Number(event.target.value) / 100 })}
        />
      </div>
      <div className="fib-tools__row fib-tools__row--toggle">
        <label htmlFor={`${idPrefix}-${toolType}-labels`}>Labels</label>
        <input
          id={`${idPrefix}-${toolType}-labels`}
          type="checkbox"
          checked={Boolean(config.showLabels)}
          onChange={(event) => onConfigChange(toolType, { showLabels: event.target.checked })}
        />
      </div>
      {supportsLineStyle ? (
        <div className="fib-tools__row">
          <label htmlFor={`${idPrefix}-${toolType}-line-style`}>Line style</label>
          <select
            id={`${idPrefix}-${toolType}-line-style`}
            value={config.lineStyle}
            onChange={(event) => onConfigChange(toolType, { lineStyle: event.target.value })}
          >
            {Object.values(FIB_PRICE_LINE_STYLES).map((lineStyle) => (
              <option key={lineStyle} value={lineStyle}>
                {lineStyle}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}

function FibToolPanel({ idPrefix, activeTool, toolConfigs, onActivateTool, onConfigChange, compact = false }) {
  return (
    <section className={`fib-tools${compact ? ' fib-tools--compact' : ''}`} aria-label="Fibonacci tools">
      <span className="fib-tools__label">Fibonacci</span>
      <div className="fib-tools__buttons">
        <ToolButton
          label="Price"
          active={activeTool === FIB_DRAWING_TYPES.FIB_PRICE}
          onClick={() =>
            onActivateTool(
              activeTool === FIB_DRAWING_TYPES.FIB_PRICE ? null : FIB_DRAWING_TYPES.FIB_PRICE,
            )
          }
        />
        <ToolButton
          label="Time"
          active={activeTool === FIB_DRAWING_TYPES.FIB_TIME}
          onClick={() =>
            onActivateTool(
              activeTool === FIB_DRAWING_TYPES.FIB_TIME ? null : FIB_DRAWING_TYPES.FIB_TIME,
            )
          }
        />
      </div>
      <FibConfigSection
        idPrefix={idPrefix}
        title="Fib Price"
        toolType={FIB_DRAWING_TYPES.FIB_PRICE}
        config={toolConfigs[FIB_DRAWING_TYPES.FIB_PRICE]}
        onConfigChange={onConfigChange}
        supportsLineStyle
      />
      <FibConfigSection
        idPrefix={idPrefix}
        title="Fib Time"
        toolType={FIB_DRAWING_TYPES.FIB_TIME}
        config={toolConfigs[FIB_DRAWING_TYPES.FIB_TIME]}
        onConfigChange={onConfigChange}
      />
    </section>
  );
}

export default FibToolPanel;
