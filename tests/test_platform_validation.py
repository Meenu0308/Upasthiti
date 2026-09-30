import pytest
from pydantic import ValidationError

from backend.server import AttendanceCapture


@pytest.fixture
def valid_attendance_payload():
    return {"staff_id": "usr-worker-01", "facility_id": "fac-phc-02", "latitude": 9.617, "longitude": 76.43, "gps_accuracy_m": 24, "qr_verified": True, "face_verified": True, "device_secure": True, "idempotency_key": "fixture-key-123"}


@pytest.fixture
def boundary_coordinates():
    return {"latitude": -90, "longitude": 180}


def test_attendance_payload_shape(valid_attendance_payload):
    record = AttendanceCapture(**valid_attendance_payload)
    assert record.latitude == 9.617
    assert set(record.model_dump()) >= {"staff_id", "facility_id", "idempotency_key"}


def test_coordinate_boundaries(valid_attendance_payload, boundary_coordinates):
    record = AttendanceCapture(**{**valid_attendance_payload, **boundary_coordinates})
    assert record.latitude == -90 and record.longitude == 180


@pytest.mark.parametrize("field,value", [("latitude", 91), ("longitude", -181), ("gps_accuracy_m", -1), ("idempotency_key", "short")])
def test_boundary_validation_errors(valid_attendance_payload, field, value):
    with pytest.raises(ValidationError):
        AttendanceCapture(**{**valid_attendance_payload, field: value})


def test_blank_identifier_rejected(valid_attendance_payload):
    with pytest.raises(ValidationError):
        AttendanceCapture(**{**valid_attendance_payload, "staff_id": "   "})