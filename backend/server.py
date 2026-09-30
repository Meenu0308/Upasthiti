from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import hashlib
import logging
import os
import secrets

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import APIRouter, Cookie, Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, field_validator

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")
mongo_url = os.environ["MONGO_URL"]
db_name = os.environ["DB_NAME"]
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"

app = FastAPI(title="SwasthyaSetu DDHS API", version="1.0.0")
api = APIRouter(prefix="/api")
logger = logging.getLogger("swasthyasetu")


SESSION_COOKIE = "ddhs_session"
COOKIE_MAX_AGE = 28800


class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=6)


class AttendanceCapture(BaseModel):
    staff_id: str
    facility_id: str
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    gps_accuracy_m: float = Field(ge=0, le=1000)
    qr_verified: bool = False
    face_verified: bool = False
    device_secure: bool = True
    idempotency_key: str = Field(min_length=8, max_length=120)
    captured_at: Optional[datetime] = None

    @field_validator("staff_id", "facility_id")
    @classmethod
    def valid_identifier(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Identifier cannot be blank")
        return value.strip()


class SyncItem(AttendanceCapture):
    pass


class MedicineSave(BaseModel):
    medicine_id: str


class MedicineScanRequest(BaseModel):
    filename: str = Field(min_length=1, max_length=255)


class AlertAcknowledgement(BaseModel):
    note: str = Field(default="Acknowledged by supervisor", max_length=300)


def hash_password(password: str) -> str:
    """Hash a password with bcrypt; O(1) application memory, cost governed by bcrypt."""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    """Verify a bcrypt password hash; O(1) relative to stored account count."""
    return bcrypt.checkpw(password.encode(), hashed.encode())


def token_for(user: Dict[str, Any]) -> str:
    """Create a short-lived access token; O(1) payload construction."""
    return jwt.encode({"sub": user["id"], "exp": datetime.now(timezone.utc).timestamp() + 28800}, JWT_SECRET, algorithm=JWT_ALGORITHM)


def public_user(user: Dict[str, Any]) -> Dict[str, Any]:
    return {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"], "facility_id": user.get("facility_id")}


async def current_user(session: Optional[str] = Cookie(default=None, alias=SESSION_COOKIE)) -> Dict[str, Any]:
    """Resolve the signed-in user from the httpOnly session cookie; O(1) token decode + O(log n) user fetch."""
    if not session:
        raise HTTPException(status_code=401, detail="Please sign in to continue")
    try:
        payload = jwt.decode(session, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Session expired") from exc
    user = await db.users.find_one({"id": payload.get("sub")}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


USERS = [
    {"id": "usr-ddhs-01", "name": "Dr. Ananya Rao", "email": "ddhs@demo.health", "password": "DDHS@2026", "role": "ddhs", "facility_id": None},
    {"id": "usr-sup-01", "name": "Meera Joseph", "email": "supervisor@demo.health", "password": "Supervisor@2026", "role": "supervisor", "facility_id": None},
    {"id": "usr-fac-01", "name": "Rakesh Kumar", "email": "officer@demo.health", "password": "Officer@2026", "role": "facility_officer", "facility_id": "fac-phc-02"},
    {"id": "usr-worker-01", "name": "Priya Nair", "email": "worker@demo.health", "password": "Worker@2026", "role": "healthcare_worker", "facility_id": "fac-phc-02"},
    {"id": "usr-admin-01", "name": "System Administrator", "email": "admin@demo.health", "password": "Admin@2026", "role": "admin", "facility_id": None},
]

FACILITIES = [
    {"id": "fac-phc-01", "name": "Kottayam PHC", "type": "PHC", "district": "Kottayam", "lat": 9.5916, "lng": 76.5222, "status": "operational", "staff_present": 18, "staff_expected": 20, "services_open": 6, "services_total": 6},
    {"id": "fac-phc-02", "name": "Kumarakom PHC", "type": "PHC", "district": "Kottayam", "lat": 9.6170, "lng": 76.4300, "status": "attention", "staff_present": 11, "staff_expected": 15, "services_open": 5, "services_total": 6},
    {"id": "fac-sub-03", "name": "Vaikom Sub-Centre", "type": "Sub-Centre", "district": "Kottayam", "lat": 9.7481, "lng": 76.3964, "status": "operational", "staff_present": 7, "staff_expected": 7, "services_open": 4, "services_total": 4},
    {"id": "fac-uphc-04", "name": "Changanassery UPHC", "type": "Upgraded PHC", "district": "Kottayam", "lat": 9.4420, "lng": 76.5360, "status": "critical", "staff_present": 8, "staff_expected": 14, "services_open": 3, "services_total": 6},
]

MEDICINES = [
    {"id": "med-001", "name": "Paracetamol 500 mg", "generic": "Paracetamol", "form": "Tablet", "uses": "Fever and mild-to-moderate pain", "caution": "Do not exceed the recommended daily dose; ask a clinician if you have liver disease.", "category": "Analgesic", "manufacturer": "HealthFirst Labs"},
    {"id": "med-002", "name": "Amoxicillin 500 mg", "generic": "Amoxicillin", "form": "Capsule", "uses": "Bacterial infections when prescribed", "caution": "Complete the prescribed course. Not for viral infections. Check penicillin allergy.", "category": "Antibiotic", "manufacturer": "CureWell Pharma"},
    {"id": "med-003", "name": "ORS Orange", "generic": "Oral Rehydration Salts", "form": "Sachet", "uses": "Prevention and treatment of dehydration", "caution": "Prepare with the stated amount of clean water and use within 24 hours.", "category": "Rehydration", "manufacturer": "NavaCare"},
    {"id": "med-004", "name": "Insulin Glargine", "generic": "Insulin glargine", "form": "Injection", "uses": "Long-acting blood glucose control", "caution": "Use only as prescribed and monitor for low blood sugar.", "category": "Diabetes care", "manufacturer": "NovoCare"},
]


async def seed_data() -> None:
    """Seed demo collections idempotently; O(n) writes for the small demonstration dataset."""
    for user in USERS:
        doc = {**user, "password_hash": hash_password(user["password"])}
        del doc["password"]
        await db.users.update_one({"id": user["id"]}, {"$set": doc}, upsert=True)
    for collection, rows in [(db.facilities, FACILITIES), (db.medicines, MEDICINES)]:
        for row in rows:
            await collection.update_one({"id": row["id"]}, {"$set": row}, upsert=True)
    if await db.alerts.count_documents({}) == 0:
        await db.alerts.insert_many([
            {"id": "alert-001", "facility_id": "fac-uphc-04", "severity": "critical", "title": "Staff shortage affecting emergency cover", "detail": "6 of 14 expected staff have not checked in.", "age": "18 min", "status": "escalated"},
            {"id": "alert-002", "facility_id": "fac-phc-02", "severity": "warning", "title": "Laboratory service not confirmed", "detail": "Facility officer has 22 minutes to acknowledge.", "age": "42 min", "status": "supervisor"},
            {"id": "alert-003", "facility_id": "fac-phc-02", "severity": "info", "title": "2 offline attendance records queued", "detail": "Awaiting secure sync from worker devices.", "age": "1 hr", "status": "queued"},
        ])


@app.on_event("startup")
async def startup() -> None:
    await seed_data()


@api.get("/")
async def root() -> Dict[str, str]:
    return {"message": "SwasthyaSetu DDHS API", "sdg": "SDG 3: Good Health and Well-Being"}


@api.post("/auth/login")
async def login(payload: LoginRequest, response: Response) -> Dict[str, Any]:
    """Verify credentials and set a signed httpOnly session cookie; O(1) verify + O(1) cookie write."""
    user = await db.users.find_one({"email": payload.email.lower()}, {"_id": 0})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    profile = public_user(user)
    response.set_cookie(
        key=SESSION_COOKIE,
        value=token_for(user),
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
    )
    return {"user": profile}


@api.post("/auth/logout")
async def logout(response: Response) -> Dict[str, str]:
    """Clear the httpOnly session cookie; O(1)."""
    response.delete_cookie(key=SESSION_COOKIE, path="/")
    return {"message": "Signed out"}


@api.get("/auth/me")
async def me(user: Dict[str, Any] = Depends(current_user)) -> Dict[str, Any]:
    return public_user(user)


@api.get("/overview")
async def overview(user: Dict[str, Any] = Depends(current_user)) -> Dict[str, Any]:
    facilities = await db.facilities.find({}, {"_id": 0}).to_list(100)
    alerts = await db.alerts.find({}, {"_id": 0}).sort("severity", -1).to_list(20)
    return {"facilities": facilities, "alerts": alerts, "metrics": {"facilities": len(facilities), "operational": sum(f["status"] == "operational" for f in facilities), "attendance": 86, "services": 91, "escalated": sum(a["severity"] == "critical" for a in alerts)}, "viewer": public_user(user)}


@api.get("/medicines")
async def medicines(q: str = "", user: Dict[str, Any] = Depends(current_user)) -> List[Dict[str, Any]]:
    query = {"$or": [{"name": {"$regex": q, "$options": "i"}}, {"generic": {"$regex": q, "$options": "i"}}]} if q else {}
    return await db.medicines.find(query, {"_id": 0}).to_list(50)


@api.post("/medicines/{medicine_id}/save")
async def save_medicine(medicine_id: str, user: Dict[str, Any] = Depends(current_user)) -> Dict[str, str]:
    medicine = await db.medicines.find_one({"id": medicine_id}, {"_id": 0})
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    await db.saved_medicines.update_one({"user_id": user["id"], "medicine_id": medicine_id}, {"$set": {"user_id": user["id"], "medicine_id": medicine_id}}, upsert=True)
    return {"message": "Medicine saved"}


@api.post("/medicines/scan")
async def scan_medicine(payload: MedicineScanRequest, user: Dict[str, Any] = Depends(current_user)) -> Dict[str, Any]:
    """Match an uploaded package filename to the safety-reviewed demo catalog; O(n) over catalog rows."""
    normalized = payload.filename.lower().replace("_", " ").replace("-", " ")
    medicine = None
    for candidate in MEDICINES:
        if any(term in normalized for term in (candidate["name"].lower(), candidate["generic"].lower())):
            medicine = await db.medicines.find_one({"id": candidate["id"]}, {"_id": 0})
            break
    if not medicine:
        raise HTTPException(status_code=422, detail="No catalog match. Use a clearer package photo or search by medicine name.")
    return {"verified": True, "verification_source": "SwasthyaSetu safety-reviewed catalog", "medicine": medicine}


@api.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, payload: AlertAcknowledgement, user: Dict[str, Any] = Depends(current_user)) -> Dict[str, Any]:
    """Record a supervisor/DDHS acknowledgement without deleting the original alert; O(1) indexed update."""
    result = await db.alerts.update_one({"id": alert_id}, {"$set": {"status": "acknowledged", "acknowledged_by": user["id"], "acknowledged_at": datetime.now(timezone.utc).isoformat(), "acknowledgement_note": payload.note}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"id": alert_id, "status": "acknowledged", "acknowledged_by": user["name"]}


@api.post("/attendance/capture")
async def capture_attendance(payload: AttendanceCapture, user: Dict[str, Any] = Depends(current_user)) -> Dict[str, Any]:
    existing = await db.attendance.find_one({"idempotency_key": payload.idempotency_key}, {"_id": 0})
    if existing:
        return {"status": "already_synced", "record": existing}
    reasons: List[str] = []
    if payload.gps_accuracy_m > 100:
        reasons.append("gps_accuracy_low")
    if not payload.qr_verified:
        reasons.append("qr_not_verified")
    if not payload.face_verified:
        reasons.append("face_liveness_not_verified")
    if not payload.device_secure:
        reasons.append("device_security_check_failed")
    record = {"id": secrets.token_hex(8), **payload.model_dump(mode="json"), "server_timestamp": datetime.now(timezone.utc).isoformat(), "captured_by": user["id"], "quarantined": bool(reasons), "reason_codes": reasons, "immutable_hash": hashlib.sha256(payload.idempotency_key.encode()).hexdigest()}
    await db.attendance.insert_one(record)
    return {"status": "quarantined" if reasons else "accepted", "record": {k: v for k, v in record.items() if k != "_id"}}


@api.post("/attendance/sync")
async def sync_attendance(items: List[SyncItem], user: Dict[str, Any] = Depends(current_user)) -> Dict[str, Any]:
    results = []
    for item in items:
        results.append(await capture_attendance(item, user))
    return {"synced": len(results), "results": results}


app.include_router(api)
app.add_middleware(CORSMiddleware, allow_origins=[os.environ["FRONTEND_URL"]], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.on_event("shutdown")
async def shutdown_db_client() -> None:
    client.close()