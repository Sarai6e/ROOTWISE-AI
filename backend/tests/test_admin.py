def test_admin_stats_requires_admin(client, auth):
    demo = auth()
    assert client.get("/api/admin/stats", headers=demo).status_code == 403

    admin = auth("admin", "rootwise2026")
    response = client.get("/api/admin/stats", headers=admin)
    assert response.status_code == 200
    body = response.get_json()
    assert body["users"] >= 2
    assert body["parcels"] >= 1
    assert body["crops"] >= 40


def test_admin_updates_role_and_audit(client, auth):
    admin = auth("admin", "rootwise2026")
    users = client.get("/api/users", headers=admin).get_json()
    demo = next(item for item in users if item["username"] == "demo")

    response = client.patch(f"/api/users/{demo['id']}", headers=admin, json={"role": "tecnico"})
    assert response.status_code == 200
    assert response.get_json()["role"] == "tecnico"

    audit = client.get("/api/admin/audit", headers=admin).get_json()
    assert any(item["action"] == "user.admin_update" for item in audit)


def test_admin_cannot_delete_self(client, auth):
    admin = auth("admin", "rootwise2026")
    me = client.get("/api/auth/me", headers=admin).get_json()
    assert client.delete(f"/api/users/{me['id']}", headers=admin).status_code == 409


def test_nasa_endpoint_status(client, auth):
    headers = auth()
    response = client.get("/api/nasa/status", headers=headers)
    assert response.status_code == 200
    endpoints = response.get_json()["endpoints"]
    ids = {item["id"] for item in endpoints}
    assert {"power", "worldview", "cmr", "epic"} <= ids


def test_healthz_public(client):
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.get_json()["status"] == "ok"
