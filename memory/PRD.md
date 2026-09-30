# SwasthyaSetu Product Requirements Document

## Original problem statement

Build a centralized digital healthcare monitoring platform connecting Sub-Centres, PHCs, and Upgraded PHCs with the Deputy Director of Health Services (DDHS). The system needs attendance monitoring, alerts and escalation, essential service monitoring, facility locations, offline synchronization, role-based access, analytics, secure audit-ready storage, a Mediwiki medicine assistant, suspicious attendance quarantine, pytest fixtures, typed functions, benchmark profiling, semantic domain naming, and explicit SDG 3 alignment.

## Architecture decisions

- React web application with responsive dashboard and worker capture views.
- FastAPI service using the existing MongoDB connection and JSON-safe projections.
- JWT bearer sessions with seeded role accounts for DDHS, supervisor, facility officer, healthcare worker, and administrator.
- Attendance records use server timestamps, idempotency keys, immutable hashes, and quarantine reason codes instead of deletion.
- Demo medicine catalog is MongoDB-backed. Image scan remains a visible **DEMO CATALOG** placeholder until verified image identification is connected.

## Personas

- DDHS: needs a district-wide live view and clear escalation priorities.
- Supervisor: needs coverage gaps and unresolved alerts.
- Facility officer: needs local service readiness and attendance context.
- Healthcare worker: needs a simple secure check-in that works with poor connectivity.
- Administrator: needs controlled access and system oversight.

## Core requirements (static)

1. Secure role-based access with valid sample credentials.
2. Facility status, service availability, alerts, and map view.
3. GPS, QR, face-liveness flag, device security, server timestamp, and idempotency-aware attendance capture.
4. Offline queue messaging and sync endpoint.
5. Medicine search, profile, save, and recent-ready data model.
6. Tests for shape and boundary validation plus a benchmark script.
7. SDG 3: Good Health and Well-Being connection in the architecture notes.

## Implemented — 2026-09-30

- Built the DDHS command centre with four live metrics, facility map, alerts, and SDG 3 impact strip.
- Built connected worker attendance capture with secure checks, accepted/quarantined responses, and offline queue UI.
- Built service readiness grid for OPD, pharmacy, laboratory, emergency, maternal care, and vaccination.
- Built Mediwiki search and expandable profiles with save action over live seeded MongoDB data.
- Added JWT role login, sample accounts, typed FastAPI models/functions, pytest fixtures, and benchmark.py.
- Verified with 7 pytest cases, frontend production build, benchmark smoke test, and live browser/API testing.

## Prioritized backlog

### P0

- Replace demo face-liveness flag with a verified biometric/liveness service.
- Replace demo photo scan with a verified medicine image-identification workflow.

### P1

- Add explicit saved-state and recent-search feedback in Mediwiki.
- Add per-item error isolation and retry results for bulk attendance sync.
- Add true geographic map tiles and facility boundary polygons.

### P2

- Add richer analytics for attendance patterns, travel anomalies, and service disruptions.
- Add immutable audit-log viewer and administrator policy controls.
- Add push/WebSocket alert delivery and supervisor acknowledgement workflow.

## Next tasks

1. Connect verified medicine image identification and safety-reviewed content.
2. Add offline persistence backed by a service worker or local database.
3. Introduce production-grade biometric, device-attestation, and privacy controls.