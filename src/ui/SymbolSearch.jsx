import { searchFuturesRoots } from '../data/futuresSymbols';

function SymbolSearch({
  value,
  onValueChange,
  activeRoot,
  onSymbolSelect,
  inputId,
  mobile = false,
}) {
  const filteredSymbols = searchFuturesRoots(value);

  return (
    <section className={`symbol-search${mobile ? ' symbol-search--mobile' : ''}`}>
      <label htmlFor={inputId} className="symbol-search__label">
        Symbol Search
      </label>
      <input
        id={inputId}
        type="search"
        className="symbol-search__input"
        placeholder="Search futures roots (ES, NQ, CL...)"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
      />
      <div className="symbol-search__results" role="listbox" aria-label="Futures symbols">
        {filteredSymbols.map((symbol) => (
          <button
            key={symbol.contract}
            type="button"
            className={`symbol-search__item${activeRoot === symbol.root ? ' symbol-search__item--active' : ''}`}
            onClick={() => onSymbolSelect(symbol)}
          >
            <span className="symbol-search__root">{symbol.root}</span>
            <span className="symbol-search__meta">
              {symbol.name} · {symbol.contract}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default SymbolSearch;
