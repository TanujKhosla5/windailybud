"""Backend tests for the new Daily Anchor feature + regression on existing endpoints."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://first-steps-113.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def auth():
    email = f"test_anchor_{int(time.time())}@test.com"
    password = "Test1234"
    r = requests.post(f"{API}/auth/register", json={"email": email, "password": password, "name": "Anchor Tester"})
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    return {"headers": {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, "email": email}


@pytest.fixture(scope="module")
def todo_id(auth):
    r = requests.post(f"{API}/todos", headers=auth["headers"], json={
        "title": "Anchor candidate",
        "urgency_tier": 1,
        "importance_tier": 1,
    })
    assert r.status_code == 200, r.text
    return r.json()["id"]


# ============ DAILY ANCHOR ============
class TestDailyAnchor:
    def test_get_anchor_null_when_not_set(self, auth):
        r = requests.get(f"{API}/daily-anchor", headers=auth["headers"])
        assert r.status_code == 200
        assert r.json() is None

    def test_put_anchor_with_bogus_todo_returns_404(self, auth):
        r = requests.put(f"{API}/daily-anchor", headers=auth["headers"], json={
            "anchor_date": "2026-01-20",
            "todo_id": "non-existent-todo-xyz",
        })
        assert r.status_code == 404

    def test_put_anchor_valid_upserts(self, auth, todo_id):
        r = requests.put(f"{API}/daily-anchor", headers=auth["headers"], json={
            "anchor_date": "2026-01-20",
            "todo_id": todo_id,
        })
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["todo_id"] == todo_id
        assert body["anchor_date"] == "2026-01-20"
        assert body["user_id"]

    def test_get_anchor_returns_saved(self, auth, todo_id):
        r = requests.get(f"{API}/daily-anchor", headers=auth["headers"], params={"date": "2026-01-20"})
        assert r.status_code == 200
        body = r.json()
        assert body is not None
        assert body["todo_id"] == todo_id
        assert body["anchor_date"] == "2026-01-20"

    def test_put_anchor_idempotent_upsert(self, auth, todo_id):
        # Create another todo and re-anchor for same date
        r2 = requests.post(f"{API}/todos", headers=auth["headers"], json={"title": "Other anchor"})
        assert r2.status_code == 200
        new_id = r2.json()["id"]
        r = requests.put(f"{API}/daily-anchor", headers=auth["headers"], json={
            "anchor_date": "2026-01-20",
            "todo_id": new_id,
        })
        assert r.status_code == 200
        assert r.json()["todo_id"] == new_id
        # GET should reflect the override
        rg = requests.get(f"{API}/daily-anchor", headers=auth["headers"], params={"date": "2026-01-20"})
        assert rg.json()["todo_id"] == new_id

    def test_delete_anchor_clears(self, auth):
        r = requests.delete(f"{API}/daily-anchor", headers=auth["headers"], params={"date": "2026-01-20"})
        assert r.status_code == 200
        rg = requests.get(f"{API}/daily-anchor", headers=auth["headers"], params={"date": "2026-01-20"})
        assert rg.status_code == 200
        assert rg.json() is None

    def test_anchor_unauthorized(self):
        r = requests.get(f"{API}/daily-anchor")
        assert r.status_code in (401, 403)


# ============ REGRESSION: existing endpoints still work ============
class TestRegression:
    def test_todos_crud(self, auth):
        # Create
        r = requests.post(f"{API}/todos", headers=auth["headers"], json={
            "title": "Reg todo",
            "urgency_tier": 2,
            "importance_tier": 1,
        })
        assert r.status_code == 200, r.text
        tid = r.json()["id"]
        # Get list
        rg = requests.get(f"{API}/todos", headers=auth["headers"])
        assert rg.status_code == 200
        assert any(t["id"] == tid for t in rg.json())
        # Update
        ru = requests.patch(f"{API}/todos/{tid}", headers=auth["headers"], json={"title": "Reg todo updated"})
        assert ru.status_code == 200
        assert ru.json()["title"] == "Reg todo updated"
        # Delete
        rd = requests.delete(f"{API}/todos/{tid}", headers=auth["headers"])
        assert rd.status_code == 200

    def test_habits_endpoint(self, auth):
        r = requests.get(f"{API}/habits", headers=auth["headers"])
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_habit_logs_endpoint(self, auth):
        r = requests.get(f"{API}/habit-logs", headers=auth["headers"])
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_tags_endpoint(self, auth):
        r = requests.get(f"{API}/tags", headers=auth["headers"])
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_activities_endpoint(self, auth):
        r = requests.get(f"{API}/activity-types", headers=auth["headers"])
        assert r.status_code == 200
        names = [t["name"] for t in r.json()]
        assert "Padel" in names
        rl = requests.get(f"{API}/activity-logs", headers=auth["headers"])
        assert rl.status_code == 200
