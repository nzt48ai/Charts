function TimeframeSwitcher({ options, activeTimeframeId, onSelectTimeframe, compact = false }) {
  return (
    <section
      className={`timeframe-switcher${compact ? ' timeframe-switcher--compact' : ''}`}
      aria-label="Timeframe switcher"
    >
      <span className="timeframe-switcher__label">Timeframe</span>
      <div className="timeframe-switcher__options" role="tablist" aria-label="Chart timeframes">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={option.id === activeTimeframeId}
            className={`timeframe-switcher__option${option.id === activeTimeframeId ? ' timeframe-switcher__option--active' : ''}`}
            onClick={() => onSelectTimeframe(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}

export default TimeframeSwitcher;
