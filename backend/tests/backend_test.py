"""Regression tests for cookie-based auth and core endpoints."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ddhs-command.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
SESSION_COOKIE = "ddhs_session"

DDHS = {"email": "ddhs@demo.health", "password": "DDHS@2026"}


@pytest.fixture
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture
def auth_client(client):
    r = client.post(f"{API}/auth/login", json=DDHS)
    assert r.status_code == 200, r.text
    return client


# ---- Auth ----
def test_login_success_sets_cookie(client):
    r = client.post(f"{API}/auth/login", json=DDHS)
    assert r.status_code == 200
    body = r.json()
    assert "user" in body
    assert body["user"]["email"] == DDHS["email"]
    assert "token" not in body
    assert SESSION_COOKIE in client.cookies
    # httpOnly flag check via raw header
    set_cookie = r.headers.get("set-cookie", "").lower()
    assert "httponly" in set_cookie


def test_login_invalid_password(client):
    r = client.post(f"{API}/auth/login", json={"email": DDHS["email"], "password": "WrongPass1"})
    assert r.status_code == 401


def test_me_without_cookie(client):
    r = client.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_me_with_cookie(auth_client):
    r = auth_client.get(f"{API}/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == DDHS["email"]


def test_logout_clears_cookie(auth_client):
    r = auth_client.post(f"{API}/auth/logout")
    assert r.status_code == 200
    # after logout, /me should be 401
    fresh = requests.Session()
    # simulate browser: keep only cookies that server left
    for c in auth_client.cookies:
        fresh.cookies.set(c.name, c.value)
    # Actually easier: reuse same client (server delete_cookie removes it)
    r2 = auth_client.get(f"{API}/auth/me")
    assert r2.status_code == 401


# ---- Overview ----
def test_overview_requires_auth(client):
    r = client.get(f"{API}/overview")
    assert r.status_code == 401


def test_overview_returns_data(auth_client):
    r = auth_client.get(f"{API}/overview")
    assert r.status_code == 200
    data = r.json()
    for key in ("metrics", "facilities", "alerts"):
        assert key in data
    assert isinstance(data["facilities"], list) and len(data["facilities"]) > 0
    assert isinstance(data["alerts"], list)


# ---- Attendance ----
def test_attendance_capture_valid(auth_client):
    payload = {
        "staff_id": "usr-worker-01",
        "facility_id": "fac-phc-02",
        "latitude": 9.617,
        "longitude": 76.43,
        "gps_accuracy_m": 24,
        "qr_verified": True,
        "face_verified": True,
        "device_secure": True,
        "idempotency_key": "test-key-" + os.urandom(6).hex(),
    }
    r = auth_client.post(f"{API}/attendance/capture", json=payload)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["status"] in ("accepted", "already_synced")


def test_attendance_capture_invalid_idempotency_key(auth_client):
    payload = {
        "staff_id": "usr-worker-01",
        "facility_id": "fac-phc-02",
        "latitude": 9.617,
        "longitude": 76.43,
        "gps_accuracy_m": 24,
        "qr_verified": True,
        "face_verified": True,
        "device_secure": True,
        "idempotency_key": "short",
    }
    r = auth_client.post(f"{API}/attendance/capture", json=payload)
    assert r.status_code == 422


# ---- Medicines ----
def test_medicine_scan_paracetamol(auth_client):
    r = auth_client.post(f"{API}/medicines/scan", json={"filename": "paracetamol.jpg"})
    assert r.status_code == 200
    body = r.json()
    assert body["verified"] is True
    assert "paracetamol" in body["medicine"]["name"].lower()


def test_medicine_scan_no_match(auth_client):
    r = auth_client.post(f"{API}/medicines/scan", json={"filename": "unknown_pill.png"})
    assert r.status_code == 422
