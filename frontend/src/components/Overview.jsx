import { Activity, AlertTriangle, ArrowRight, BellRing, CheckCircle2, Crosshair, HeartPulse, MapPin, UsersRound } from "lucide-react";
import { Badge, Metric } from "./common";

export default function Overview({ data, onNavigate, onAcknowledge }) {
  if (!data) return <div className="loading-state" data-testid="dashboard-loading">Loading district data…</div>;
  const { metrics, facilities, alerts } = data;
  return (
    <div className="page-stack">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">TUESDAY, 17 JUNE 2026 · 10:42 AM</p>
          <h1>Good morning, Dr. Rao</h1>
          <p className="subcopy">Here’s what needs your attention across the district today.</p>
        </div>
        <button data-testid="open-attendance-button" className="primary-button compact" onClick={() => onNavigate("attendance")}>
          <Crosshair size={16} /> Capture attendance
        </button>
      </section>
      <section className="metric-grid">
        <Metric icon={<MapPin />} value={metrics.facilities} label="Facilities connected" detail="All reporting live" tone="teal" />
        <Metric icon={<UsersRound />} value={`${metrics.attendance}%`} label="Staff attendance" detail="+4.2% vs yesterday" tone="green" />
        <Metric icon={<Activity />} value={`${metrics.services}%`} label="Services available" detail="Across all facilities" tone="orange" />
        <Metric icon={<AlertTriangle />} value={metrics.escalated} label="Escalated alerts" detail="Require intervention" tone="red" />
      </section>
      <div className="section-heading">
        <div>
          <p className="eyebrow">DISTRICT PULSE</p>
          <h3>Facility status</h3>
        </div>
        <button data-testid="view-services-button" className="text-button" onClick={() => onNavigate("services")}>
          View service readiness <ArrowRight size={15} />
        </button>
      </div>
      <section className="status-layout">
        <div className="map-panel">
          <div className="map-header">
            <div>
              <strong>Live facility network</strong>
              <small>Updated 10:42 AM · 4 locations</small>
            </div>
            <Badge>LIVE</Badge>
          </div>
          <div className="map-canvas">
            <div className="map-grid" />
            {facilities.map((f, i) => (
              <div key={f.id} data-testid={`facility-map-pin-${f.id}`} className={`map-pin pin-${i} ${f.status}`}>
                <span>{f.status === "critical" ? "!" : ""}</span>
                <div>
                  <strong>{f.name}</strong>
                  <small>{f.staff_present}/{f.staff_expected} staff present</small>
                </div>
              </div>
            ))}
            <div className="map-legend">
              <span><i className="dot green" />Operational</span>
              <span><i className="dot orange" />Attention</span>
              <span><i className="dot red" />Critical</span>
            </div>
          </div>
        </div>
        <div className="alerts-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">LIVE ALERT DELIVERY</p>
              <h3>Active alerts <span>{alerts.filter((alert) => alert.status !== "acknowledged").length}</span></h3>
            </div>
            <BellRing size={18} />
          </div>
          {alerts.map((alert) => (
            <div className={`alert-row ${alert.status === "acknowledged" ? "alert-acknowledged" : ""}`} key={alert.id} data-testid={`alert-${alert.id}`}>
              <span className={`alert-icon ${alert.severity}`}><AlertTriangle size={15} /></span>
              <div>
                <strong>{alert.title}</strong>
                <small>{alert.detail}</small>
                <span className="alert-meta">{alert.age} · {alert.status}</span>
              </div>
              {alert.status !== "acknowledged" ? (
                <button data-testid={`acknowledge-alert-${alert.id}`} className="ack-button" onClick={() => onAcknowledge(alert.id)}>Acknowledge</button>
              ) : (
                <CheckCircle2 className="verified" size={16} />
              )}
            </div>
          ))}
        </div>
      </section>
      <section className="sdg-strip">
        <div className="sdg-icon"><HeartPulse size={22} /></div>
        <div>
          <strong>Every resolved alert supports SDG 3</strong>
          <p>Faster intervention keeps essential care available for every community.</p>
        </div>
        <span className="sdg-progress">District health coverage <b>91%</b></span>
      </section>
    </div>
  );
}
