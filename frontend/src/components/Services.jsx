import { SlidersHorizontal, Stethoscope } from "lucide-react";
import { Badge } from "./common";

const SERVICE_LABELS = ["OPD", "Pharmacy", "Lab", "Emergency", "Maternal", "Vaccination"];

const toneFor = (status) => (status === "critical" ? "red" : status === "attention" ? "orange" : "green");

export default function Services({ facilities }) {
  return (
    <div className="page-stack">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">ESSENTIAL CARE COVERAGE</p>
          <h1>Service readiness</h1>
          <p className="subcopy">A fast read on the services communities can access right now.</p>
        </div>
        <button data-testid="service-filter-button" className="outline-button">
          <SlidersHorizontal size={16} /> Filter facilities
        </button>
      </section>
      <div className="service-table" data-testid="service-readiness-table">
        <div className="table-head">
          <span>Facility</span>
          {SERVICE_LABELS.map((label) => <span key={label}>{label}</span>)}
        </div>
        {facilities.map((facility) => (
          <div className="service-row" key={facility.id}>
            <div>
              <strong>{facility.name}</strong>
              <small>{facility.type} · {facility.district}</small>
            </div>
            {SERVICE_LABELS.map((service, index) => (
              <span key={service} className={index < facility.services_open ? "service-on" : "service-off"}>
                {index < facility.services_open ? "Available" : "Offline"}
              </span>
            ))}
            <div className="row-status">
              <Badge tone={toneFor(facility.status)}>{facility.status}</Badge>
            </div>
          </div>
        ))}
      </div>
      <div className="sdg-strip">
        <div className="sdg-icon"><Stethoscope size={22} /></div>
        <div>
          <strong>Service continuity is a health outcome</strong>
          <p>Monitoring availability helps DDHS direct support before care is interrupted.</p>
        </div>
      </div>
    </div>
  );
}
