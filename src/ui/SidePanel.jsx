function SidePanel({ activeSymbol }) {
  return (
    <aside className="right-panel" aria-label="Chart tools panel">
      <div className="panel-card">
        <h2>Active Contract</h2>
        <p>
          {activeSymbol.root} · {activeSymbol.contract}
        </p>
      </div>
      <div className="panel-card">
        <h2>Order Ticket</h2>
        <p>Panel content can be replaced with your existing controls.</p>
      </div>
    </aside>
  );
}

export default SidePanel;
