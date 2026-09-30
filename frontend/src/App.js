import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Crosshair, HeartPulse, LayoutDashboard, LogOut, Menu, Pill, RefreshCw, Stethoscope, X } from "lucide-react";
import { api } from "./api";
import { IconButton, NavItem } from "./components/common";
import Login from "./components/Login";
import Overview from "./components/Overview";
import Attendance from "./components/Attendance";
import Services from "./components/Services";
import Mediwiki from "./components/Mediwiki";
import "@/App.css";

const PAGE_TITLES = {
  overview: "Command centre",
  attendance: "Upasthiti / Attendance",
  services: "Service readiness",
  mediwiki: "Mediwiki",
};

function App() {
  const [user, setUser] = useState(null);
  const [overview, setOverview] = useState(null);
  const [page, setPage] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastSync, setLastSync] = useState("just now");
  const [booted, setBooted] = useState(false);

  const load = useCallback(async () => {
    try {
      const [me, data] = await Promise.all([api.get("/auth/me"), api.get("/overview")]);
      setUser(me.data);
      setOverview(data.data);
      setLastSync("just now");
    } catch {
      setUser(null);
    } finally {
      setBooted(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return undefined;
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [user, load]);

  const acknowledge = useCallback(async (alertId) => {
    await api.post(`/alerts/${alertId}/acknowledge`, { note: "Reviewed in DDHS command centre" });
    setOverview((current) => ({
      ...current,
      alerts: current.alerts.map((alert) => alert.id === alertId ? { ...alert, status: "acknowledged" } : alert),
    }));
  }, []);

  const signOut = useCallback(async () => {
    try { await api.post("/auth/logout"); } catch { /* ignore */ }
    setUser(null);
    setOverview(null);
  }, []);

  if (!booted) return <div className="loading-state" data-testid="app-loading">Loading command centre…</div>;
  if (!user) return <Login onLogin={(u) => { setUser(u); load(); }} />;

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-mark"><HeartPulse size={20} /></span>
          <span>Upasthiti</span>
          <IconButton label="Close menu" onClick={() => setSidebarOpen(false)}><X size={18} /></IconButton>
        </div>
        <div className="district-switch"><span className="live-dot" /> Kottayam district <ChevronDown size={15} /></div>
        <nav>
          <NavItem active={page === "overview"} icon={<LayoutDashboard size={18} />} label="Command centre" onClick={() => { setPage("overview"); setSidebarOpen(false); }} />
          <NavItem active={page === "attendance"} icon={<Crosshair size={18} />} label="Upasthiti / Attendance" onClick={() => { setPage("attendance"); setSidebarOpen(false); }} />
          <NavItem active={page === "services"} icon={<Stethoscope size={18} />} label="Service readiness" onClick={() => { setPage("services"); setSidebarOpen(false); }} />
          <NavItem active={page === "mediwiki"} icon={<Pill size={18} />} label="Mediwiki" onClick={() => { setPage("mediwiki"); setSidebarOpen(false); }} />
        </nav>
        <div className="sidebar-bottom">
          <div className="sdg-note">
            <span>SDG 3</span>
            <p>Good health and<br />well-being</p>
            <HeartPulse size={28} />
          </div>
          <div className="account-row">
            <span className="avatar">{user.name.split(" ").map((n) => n[0]).join("")}</span>
            <div><strong>{user.name}</strong><small>{user.role.replace("_", " ")}</small></div>
            <IconButton label="Sign out" onClick={signOut}><LogOut size={16} /></IconButton>
          </div>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <button data-testid="mobile-menu-button" className="mobile-menu" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button>
          <div>
            <p className="topbar-kicker">DDHS OPERATIONS / <span>LIVE DISTRICT VIEW</span></p>
            <h2>{PAGE_TITLES[page]}</h2>
          </div>
          <div className="topbar-actions">
            <div className="sync-state"><span className="live-dot" /> Live refresh <strong>{lastSync}</strong></div>
            <IconButton label="Refresh data" onClick={load}><RefreshCw size={18} /></IconButton>
            <div className="user-chip"><span className="avatar small">{user.name.split(" ").map((n) => n[0]).join("")}</span><span>{user.name.split(" ")[1] || user.name}</span></div>
          </div>
        </header>
        <main className="content">
          {page === "overview" && <Overview data={overview} onNavigate={setPage} onAcknowledge={acknowledge} />}
          {page === "attendance" && <Attendance />}
          {page === "services" && <Services facilities={overview?.facilities || []} />}
          {page === "mediwiki" && <Mediwiki />}
        </main>
      </div>
    </div>
  );
}

export default App;
