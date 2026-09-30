import { useCallback, useState } from "react";
import { ArrowRight, Camera, CheckCircle2, Clock3, CloudOff, Crosshair, MapPin, QrCode, RefreshCw, WifiOff } from "lucide-react";
import { api } from "../api";
import { Badge, Verify } from "./common";

const QUEUE_KEY = "attendance_queue";

const readQueue = () => {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); }
  catch { return []; }
};

const makeRecord = () => ({
  staff_id: "usr-worker-01",
  facility_id: "fac-phc-02",
  latitude: 9.617,
  longitude: 76.43,
  gps_accuracy_m: 24,
  qr_verified: true,
  face_verified: true,
  device_secure: true,
  idempotency_key: `demo-${Date.now()}`,
});

export default function Attendance() {
  const [state, setState] = useState("ready");
  const [queue, setQueue] = useState(readQueue);
  const [syncing, setSyncing] = useState(false);

  const persist = useCallback((items) => {
    setQueue(items);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  }, []);

  const capture = useCallback(async () => {
    setState("capturing");
    const record = makeRecord();
    try {
      await api.post("/attendance/capture", record);
      setState("success");
    } catch {
      persist([...queue, record]);
      setState("offline");
    }
  }, [queue, persist]);

  const syncQueue = useCallback(async () => {
    if (!queue.length) return;
    setSyncing(true);
    try {
      await api.post("/attendance/sync", queue);
      persist([]);
      setState("success");
    } catch {
      setState("offline");
    } finally {
      setSyncing(false);
    }
  }, [queue, persist]);

  return (
    <div className="page-stack">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">UPASTHITI / ATTENDANCE · KUMARAKOM PHC</p>
          <h1>Attendance capture</h1>
          <p className="subcopy">Verify your presence securely before starting today’s shift.</p>
        </div>
        <Badge tone="green"><span className="live-dot" /> Device secure</Badge>
      </section>
      <section className="capture-layout">
        <div className="capture-card">
          <div className="capture-top">
            <span className="step-pill">STEP 1 OF 3</span>
            <span className="capture-time"><Clock3 size={14} /> Server time · 10:42 AM</span>
          </div>
          <div className="capture-visual">
            {state === "success" ? <CheckCircle2 size={74} /> : state === "offline" ? <WifiOff size={74} /> : <Crosshair size={74} />}
            <div className="scan-ring" />
          </div>
          <h2>
            {state === "ready" ? "Ready to verify" :
             state === "capturing" ? "Checking your presence…" :
             state === "success" ? "Attendance recorded" : "Saved offline"}
          </h2>
          <p>
            {state === "success" ? "Your secure check-in has been shared with the facility officer." :
             state === "offline" ? "We’ll sync automatically when a connection returns." :
             "GPS, facility QR, and liveness checks protect the accuracy of this record."}
          </p>
          <button data-testid="capture-attendance-button" className="primary-button capture-button" onClick={capture} disabled={state === "capturing"}>
            {state === "ready" ? "Start secure check-in" :
             state === "capturing" ? "Verifying…" :
             state === "success" ? "Check in another staff member" : "Retry sync"} <ArrowRight size={17} />
          </button>
        </div>
        <div className="verification-list">
          <Verify icon={<MapPin />} title="GPS geofence" detail="24m accuracy · inside facility boundary" ok />
          <Verify icon={<QrCode />} title="Facility QR code" detail="Kumarakom PHC · code verified" ok />
          <Verify icon={<Camera />} title="Face liveness" detail="Ready for camera verification" />
        </div>
      </section>
      <section className="offline-banner">
        <CloudOff size={19} />
        <div>
          <strong>Offline queue · {queue.length} records waiting</strong>
          <p>Durably stored on this device with idempotency protection and retry handling.</p>
        </div>
        <button data-testid="sync-now-button" className="text-button" disabled={syncing || !queue.length} onClick={syncQueue}>
          {syncing ? "Syncing…" : "Sync now"} <RefreshCw size={14} />
        </button>
      </section>
    </div>
  );
}
