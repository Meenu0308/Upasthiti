"""Small benchmark for the attendance validation path used by SwasthyaSetu."""
import time
import tracemalloc

from backend.server import AttendanceCapture


def run(batch_size: int) -> tuple[float, float]:
    """Measure validation latency in milliseconds and peak memory in KiB; O(batch_size)."""
    payload = {"staff_id": "usr-worker-01", "facility_id": "fac-phc-02", "latitude": 9.617, "longitude": 76.43, "gps_accuracy_m": 24, "qr_verified": True, "face_verified": True, "device_secure": True, "idempotency_key": "benchmark-123456"}
    tracemalloc.start()
    started = time.perf_counter()
    for i in range(batch_size):
        AttendanceCapture(**{**payload, "idempotency_key": f"benchmark-{i:08d}"})
    elapsed = (time.perf_counter() - started) * 1000 / batch_size
    _, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    return elapsed, peak / 1024


if __name__ == "__main__":
    print("batch_size,latency_ms_per_item,peak_memory_kib")
    for size in (1, 16, 64, 256):
        latency, memory = run(size)
        print(f"{size},{latency:.3f},{memory:.1f}")