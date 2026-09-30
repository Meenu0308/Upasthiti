# SwasthyaSetu

SwasthyaSetu is a centralized digital health operations platform for DDHS teams, facility officers, supervisors, and healthcare workers. It connects Sub-Centres, PHCs, and Upgraded PHCs through a comprehensible command centre and secure worker capture flow.

## Architecture

- **React dashboard:** role-aware command centre, facility map, service readiness, attendance capture, offline queue messaging, and Mediwiki.
- **FastAPI backend:** JWT role access, MongoDB-backed seeded domain models, immutable attendance capture records, idempotency protection, quarantine reason codes, and medicine catalog APIs.
- **MongoDB:** users, facilities, alerts, attendance, medicines, and saved medicines. MongoDB `_id` is excluded from API projections to keep responses JSON-safe.
- **Validation:** GPS coordinates, accuracy bounds, device/QR/liveness flags, server timestamps, and duplicate idempotency keys are checked at capture.

## SDG 3 connection

Attendance and service availability outputs directly support **SDG 3: Good Health and Well-Being**. Early alerts help DDHS intervene before staff shortages or service disruptions reduce access to essential care. The dashboard’s coverage and alert metrics are operational indicators, not claims of clinical outcomes.

## Demo notes

Mediwiki photo identification is **DEMO CATALOG** based: the scan button is a visible placeholder for a future verified image-identification integration. Sample login credentials are in `memory/test_credentials.md`. Run `python benchmark.py` to profile validation latency and memory across batch sizes.