import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Pill, Search, ShieldCheck, Upload, X } from "lucide-react";
import { api } from "../api";
import { Badge, IconButton } from "./common";

export default function Mediwiki() {
  const [query, setQuery] = useState("");
  const [medicines, setMedicines] = useState([]);
  const [selected, setSelected] = useState(null);
  const [scanStatus, setScanStatus] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const fileInput = useRef(null);
  const latestQuery = useRef("");

  const search = useCallback(async (value) => {
    setQuery(value);
    latestQuery.current = value;
    try {
      const { data } = await api.get(`/medicines?q=${encodeURIComponent(value)}`);
      // Ignore out-of-order responses so a slow earlier request cannot overwrite a newer one.
      if (latestQuery.current !== value) return;
      setMedicines(data);
    } catch {
      if (latestQuery.current === value) setMedicines([]);
    }
  }, []);

  useEffect(() => { search(""); }, [search]);

  const scan = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setScanStatus("Please choose a package image.");
      return;
    }
    setScanStatus("Verifying package against the safety-reviewed catalog…");
    try {
      const { data } = await api.post("/medicines/scan", { filename: file.name });
      setSelected(data.medicine);
      setScanStatus(`Verified match · ${data.verification_source}`);
    } catch (error) {
      setScanStatus(error.response?.data?.detail || "No verified catalog match found.");
    }
  };

  const save = async () => {
    setSaveError("");
    try {
      await api.post(`/medicines/${selected.id}/save`, {});
      setSaved(true);
    } catch (error) {
      setSaveError(error.response?.data?.detail || "Could not save medicine. Please try again.");
    }
  };

  return (
    <div className="page-stack">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">MEDICINE INFORMATION ASSISTANT</p>
          <h1>Mediwiki</h1>
          <p className="subcopy">Search or upload a package photo for a safety-reviewed catalog match.</p>
        </div>
        <Badge tone="green">Verified catalog</Badge>
      </section>
      <section className="mediwiki-hero">
        <div className="medicine-search">
          <Pill size={24} />
          <input
            data-testid="medicine-search-input"
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Search medicine by name or generic name"
          />
          <Search size={20} />
        </div>
        <input ref={fileInput} data-testid="medicine-image-input" className="visually-hidden" type="file" accept="image/*" onChange={scan} />
        <button data-testid="medicine-scan-button" className="scan-button" onClick={() => fileInput.current?.click()}>
          <Upload size={18} /> Verify package photo
        </button>
        {scanStatus && <p data-testid="medicine-scan-status" className="scan-status"><CheckCircle2 size={14} /> {scanStatus}</p>}
        <p className="safety-line"><ShieldCheck size={14} /> Profiles are catalog-reviewed. Always confirm with a qualified health professional.</p>
      </section>
      <div className="medicine-grid">
        {medicines.map((medicine) => (
          <button
            key={medicine.id}
            data-testid={`medicine-card-${medicine.id}`}
            className={`medicine-card ${selected?.id === medicine.id ? "selected" : ""}`}
            onClick={() => { setSelected(medicine); setSaved(false); }}
          >
            <div className="medicine-card-top">
              <span className="medicine-symbol"><Pill size={20} /></span>
              <Badge tone={medicine.category === "Antibiotic" ? "orange" : "teal"}>{medicine.category}</Badge>
            </div>
            <h3>{medicine.name}</h3>
            <p>{medicine.generic} · {medicine.form}</p>
            <span className="medicine-link">View profile <ArrowRight size={14} /></span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="medicine-profile" data-testid="medicine-profile">
          <div>
            <p className="eyebrow">SAFETY-REVIEWED MEDICINE PROFILE</p>
            <h2>{selected.name}</h2>
            <p>{selected.generic} · {selected.form} · {selected.manufacturer}</p>
          </div>
          <IconButton label="Close profile" onClick={() => setSelected(null)}><X size={18} /></IconButton>
          <div className="profile-columns">
            <div><span>Common use</span><strong>{selected.uses}</strong></div>
            <div><span>Important caution</span><strong>{selected.caution}</strong></div>
          </div>
          <button data-testid="save-medicine-button" className="primary-button compact" onClick={save}>
            {saved ? "Saved to medicines" : "Save to medicines"} <CheckCircle2 size={16} />
          </button>
          {saveError && <p data-testid="save-medicine-error" className="error-message">{saveError}</p>}
        </div>
      )}
    </div>
  );
}
