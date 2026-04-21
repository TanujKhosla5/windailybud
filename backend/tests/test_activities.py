"""Backend tests for Activities feature (types + logs) and auth prerequisites."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://first-steps-113.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def auth():
    email = f"test_act_{int(time.time())}@test.com"
    password = "Test1234"
    r = requests.post(f"{API}/auth/register", json={"email": email, "password": password, "name": "Act Tester"})
    assert r.status_code == 200, r.text
    data = r.json()
    token = data["access_token"]
    return {"headers": {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, "email": email}


class TestActivityTypes:
    def test_default_activity_types_seeded(self, auth):
        r = requests.get(f"{API}/activity-types", headers=auth["headers"])
        assert r.status_code == 200
        data = r.json()
        names = sorted([t["name"] for t in data])
        assert "Padel" in names
        assert "Poker" in names
        assert "Pickleball" in names
        assert "Squash" in names
        assert len([t for t in data if t["is_default"]]) >= 4

    def test_create_custom_activity_type(self, auth):
        r = requests.post(f"{API}/activity-types", headers=auth["headers"], json={"name": "Tennis"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "Tennis"
        assert data["is_default"] is False
        # Verify persistence
        r2 = requests.get(f"{API}/activity-types", headers=auth["headers"])
        assert any(t["name"] == "Tennis" for t in r2.json())

    def test_duplicate_activity_type_rejected(self, auth):
        r = requests.post(f"{API}/activity-types", headers=auth["headers"], json={"name": "Padel"})
        assert r.status_code == 400


class TestActivityLogs:
    def _get_padel_id(self, auth):
        r = requests.get(f"{API}/activity-types", headers=auth["headers"])
        return next(t["id"] for t in r.json() if t["name"] == "Padel")

    def test_create_activity_log(self, auth):
        type_id = self._get_padel_id(auth)
        payload = {
            "activity_type_id": type_id,
            "activity_date": "2026-01-15",
            "location": "City Sports Club",
            "duration_minutes": 60,
            "players": ["Alice", "Bob", "Charlie"],
        }
        r = requests.post(f"{API}/activity-logs", headers=auth["headers"], json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["activity_type_name"] == "Padel"
        assert data["location"] == "City Sports Club"
        assert data["duration_minutes"] == 60
        assert data["players"] == ["Alice", "Bob", "Charlie"]
        assert data["activity_date"] == "2026-01-15"
        pytest.shared_log_id = data["id"]

    def test_get_activity_logs_with_type_name(self, auth):
        r = requests.get(f"{API}/activity-logs", headers=auth["headers"])
        assert r.status_code == 200
        logs = r.json()
        assert len(logs) >= 1
        assert all("activity_type_name" in log for log in logs)

    def test_filter_by_activity_type(self, auth):
        type_id = self._get_padel_id(auth)
        r = requests.get(f"{API}/activity-logs", headers=auth["headers"], params={"activity_type_id": type_id})
        assert r.status_code == 200
        logs = r.json()
        assert all(l["activity_type_id"] == type_id for l in logs)

    def test_filter_by_player(self, auth):
        r = requests.get(f"{API}/activity-logs", headers=auth["headers"], params={"player": "Alice"})
        assert r.status_code == 200
        logs = r.json()
        assert len(logs) >= 1
        assert all(any("alice" in p.lower() for p in l["players"]) for l in logs)

    def test_filter_by_location(self, auth):
        r = requests.get(f"{API}/activity-logs", headers=auth["headers"], params={"location": "Sports"})
        assert r.status_code == 200
        logs = r.json()
        assert len(logs) >= 1
        assert all("sports" in (l["location"] or "").lower() for l in logs)

    def test_delete_activity_log(self, auth):
        log_id = getattr(pytest, "shared_log_id", None)
        assert log_id is not None
        r = requests.delete(f"{API}/activity-logs/{log_id}", headers=auth["headers"])
        assert r.status_code == 200
        r2 = requests.get(f"{API}/activity-logs", headers=auth["headers"])
        assert all(l["id"] != log_id for l in r2.json())

    def test_create_log_invalid_type(self, auth):
        r = requests.post(f"{API}/activity-logs", headers=auth["headers"], json={
            "activity_type_id": "non-existent-id",
            "activity_date": "2026-01-15",
            "players": [],
        })
        assert r.status_code == 404


class TestAuthUnauthorized:
    def test_no_auth_activities(self):
        r = requests.get(f"{API}/activity-types")
        assert r.status_code in (401, 403)
        r2 = requests.get(f"{API}/activity-logs")
        assert r2.status_code in (401, 403)
