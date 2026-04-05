import { FIB_DRAWING_TYPES } from '../core/fibDrawings';

function ToolbarButton({ label, title, onClick, disabled = false, active = false }) {
  return (
    <button
      type="button"
      className={`drawing-toolbar__button${active ? ' drawing-toolbar__button--active' : ''}`}
      onClick={onClick}
      title={title ?? label}
      aria-label={title ?? label}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

function DrawingToolbar({ activeTool, interactionState, onAction, compact = false }) {
  return (
    <section className={`drawing-toolbar${compact ? ' drawing-toolbar--compact' : ''}`} aria-label="Drawing controls">
      <div className="drawing-toolbar__row">
        <ToolbarButton
          label="P"
          title="Fibonacci price tool (P)"
          active={activeTool === FIB_DRAWING_TYPES.FIB_PRICE}
          onClick={() => onAction('setTool', activeTool === FIB_DRAWING_TYPES.FIB_PRICE ? null : FIB_DRAWING_TYPES.FIB_PRICE)}
        />
        <ToolbarButton
          label="T"
          title="Fibonacci time tool (T)"
          active={activeTool === FIB_DRAWING_TYPES.FIB_TIME}
          onClick={() => onAction('setTool', activeTool === FIB_DRAWING_TYPES.FIB_TIME ? null : FIB_DRAWING_TYPES.FIB_TIME)}
        />
        <ToolbarButton label="↶" title="Undo (Ctrl/Cmd+Z)" onClick={() => onAction('undo')} disabled={!interactionState.canUndo} />
        <ToolbarButton label="↷" title="Redo (Ctrl/Cmd+Shift+Z)" onClick={() => onAction('redo')} disabled={!interactionState.canRedo} />
        <ToolbarButton label="⌫" title="Delete selected (Delete/Backspace)" onClick={() => onAction('delete')} disabled={!interactionState.selectedCount} />
      </div>
      <div className="drawing-toolbar__row">
        <ToolbarButton label="Group" title="Group selected" onClick={() => onAction('group')} disabled={interactionState.selectedCount < 2} />
        <ToolbarButton label="Ungroup" title="Ungroup selected" onClick={() => onAction('ungroup')} disabled={!interactionState.selectedCount} />
        <ToolbarButton label="Front" title="Bring to front" onClick={() => onAction('front')} disabled={!interactionState.selectedCount} />
        <ToolbarButton label="Back" title="Send to back" onClick={() => onAction('back')} disabled={!interactionState.selectedCount} />
      </div>
      <div className="drawing-toolbar__magnet">
        <label htmlFor="drawing-toolbar-magnet">Magnet {Math.round(interactionState.magnetStrength)}%</label>
        <input
          id="drawing-toolbar-magnet"
          type="range"
          min="0"
          max="100"
          step="1"
          value={interactionState.magnetStrength}
          onChange={(event) => onAction('magnet', Number(event.target.value))}
        />
      </div>
    </section>
  );
}

export default DrawingToolbar;
