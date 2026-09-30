export const Badge = ({ children, tone = "teal" }) => (
  <span data-testid="status-badge" className={`badge badge-${tone}`}>{children}</span>
);

export const IconButton = ({ label, children, onClick }) => (
  <button
    data-testid={`icon-${label.toLowerCase().replaceAll(" ", "-")}`}
    aria-label={label}
    className="icon-button"
    onClick={onClick}
  >
    {children}
  </button>
);

export const NavItem = ({ active, icon, label, onClick }) => (
  <button
    data-testid={`nav-${label.toLowerCase().replaceAll(" ", "-").replaceAll("/", "")}`}
    className={`nav-item ${active ? "active" : ""}`}
    onClick={onClick}
  >
    {icon}
    <span>{label}</span>
    {active && <span className="nav-arrow">→</span>}
  </button>
);

export const Metric = ({ icon, value, label, detail, tone }) => (
  <div className="metric-card" data-testid={`metric-${label.toLowerCase().replaceAll(" ", "-")}`}>
    <div className={`metric-icon ${tone}`}>{icon}</div>
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
      <small className={tone === "red" ? "red-text" : ""}>{detail}</small>
    </div>
  </div>
);

export const Verify = ({ icon, title, detail, ok }) => (
  <div className="verify-row">
    <span className="verify-icon">{icon}</span>
    <div>
      <strong>{title}</strong>
      <small>{detail}</small>
    </div>
    <span className={ok ? "verified" : "muted-icon"}>✓</span>
  </div>
);
