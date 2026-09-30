import { useState } from "react";
import { ArrowRight, CheckCircle2, CircleUserRound, HeartPulse, ShieldCheck } from "lucide-react";
import { api } from "../api";
import { roles } from "../roles";

const DEFAULT_ROLE = { label: "Sign in", email: "", password: "", hint: "" };

export default function Login({ onLogin }) {
  const initial = roles[0] || DEFAULT_ROLE;
  const [selected, setSelected] = useState(initial);
  const [email, setEmail] = useState(initial.email);
  const [password, setPassword] = useState(initial.password);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const choose = (role) => {
    setSelected(role);
    setEmail(role.email);
    setPassword(role.password);
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      onLogin(data.user);
    } catch (e) {
      setError(e.response?.data?.detail || "Unable to sign in");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-story">
        <div className="brand-lockup">
          <span className="brand-mark"><HeartPulse size={22} /></span>
          <span>Upasthiti</span>
        </div>
        <div className="story-copy">
          <p className="eyebrow">PUBLIC HEALTH OPERATIONS</p>
          <h1>See the whole system.<br /><em>Act where it matters.</em></h1>
          <p>One clear view of attendance, essential services, and facility readiness across Kottayam district.</p>
        </div>
        <div className="story-footer">
          <div><span className="metric-number">24</span><span>facilities connected</span></div>
          <div><span className="metric-number">91%</span><span>services available</span></div>
          <div><span className="metric-number">SDG 3</span><span>health & well-being</span></div>
        </div>
      </section>
      <section className="login-panel">
        <div className="mobile-brand"><span className="brand-mark"><HeartPulse size={18} /></span>Upasthiti</div>
        <div className="login-heading">
          <p className="eyebrow">SECURE ACCESS</p>
          <h2>Welcome back</h2>
          <p>Choose a demo role to enter the command centre.</p>
        </div>
        <div className="role-grid">
          {roles.map((role) => (
            <button
              key={role.label}
              type="button"
              data-testid={`role-${role.label.toLowerCase().replaceAll(" ", "-")}`}
              className={`role-option ${selected.label === role.label ? "selected" : ""}`}
              onClick={() => choose(role)}
            >
              <span className="role-icon"><CircleUserRound size={17} /></span>
              <span><strong>{role.label}</strong><small>{role.hint}</small></span>
              {selected.label === role.label && <CheckCircle2 size={17} />}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="login-form">
          <label>Email<input data-testid="login-email-input" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Password<input data-testid="login-password-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {error && <div data-testid="login-error" className="error-message">{error}</div>}
          <button data-testid="login-submit-button" className="primary-button" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Enter command centre"} <ArrowRight size={17} />
          </button>
        </form>
        <p className="privacy-note"><ShieldCheck size={15} /> Demo access uses secure role permissions and audit-ready sessions</p>
      </section>
    </main>
  );
}
