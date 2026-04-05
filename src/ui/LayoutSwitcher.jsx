function LayoutSwitcher({ options, activeLayoutId, onSelectLayout, compact = false }) {
  return (
    <section className={`layout-switcher${compact ? ' layout-switcher--compact' : ''}`} aria-label="Layout switcher">
      <span className="layout-switcher__label">Layout</span>
      <div className="layout-switcher__options" role="tablist" aria-label="Saved layouts">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={option.id === activeLayoutId}
            className={`layout-switcher__option${option.id === activeLayoutId ? ' layout-switcher__option--active' : ''}`}
            onClick={() => onSelectLayout(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}

export default LayoutSwitcher;
