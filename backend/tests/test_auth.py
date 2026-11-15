def test_register_without_email_or_dni(client):
    response = client.post("/api/auth/register", json={
        "username": "nuevo",
        "password": "campo2026",
        "full_name": "Nuevo Productor",
        "region": "Cusco",
    })
    assert response.status_code == 201
    body = response.get_json()
    assert body["access_token"]
    assert body["user"]["role"] == "agricultor"
    assert body["user"]["username"] == "nuevo"


def test_register_rejects_weak_password(client):
    response = client.post("/api/auth/register", json={
        "username": "corto", "password": "123", "full_name": "Nombre Válido",
    })
    assert response.status_code == 400


def test_register_duplicate_username(client):
    client.post("/api/auth/register", json={
        "username": "repetido", "password": "campo2026", "full_name": "Uno Dos",
    })
    response = client.post("/api/auth/register", json={
        "username": "repetido", "password": "campo2026", "full_name": "Uno Dos",
    })
    assert response.status_code == 409


def test_login_and_me(client, auth):
    headers = auth()
    response = client.get("/api/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.get_json()["username"] == "demo"


def test_login_wrong_password(client):
    response = client.post("/api/auth/login", json={"username": "demo", "password": "incorrecta"})
    assert response.status_code == 401


def test_requires_token(client):
    response = client.get("/api/farms")
    assert response.status_code == 401
    assert response.get_json()["code"] == "auth_required"


def test_role_permissions(client, auth):
    demo_headers = auth()
    assert client.get("/api/users", headers=demo_headers).status_code == 403

    admin_headers = auth("admin", "rootwise2026")
    response = client.get("/api/users", headers=admin_headers)
    assert response.status_code == 200
    assert len(response.get_json()) >= 2


def test_change_password(client, auth):
    headers = auth()
    response = client.patch("/api/auth/me", headers=headers, json={
        "current_password": "rootwise2026",
        "new_password": "nuevaClave2026",
    })
    assert response.status_code == 200
    login = client.post("/api/auth/login", json={"username": "demo", "password": "nuevaClave2026"})
    assert login.status_code == 200


def test_user_can_change_language(client, auth):
    headers = auth()
    for language in ("en", "qu", "kwa", "ash", "es"):
        response = client.patch("/api/auth/me", headers=headers, json={"language": language})
        assert response.status_code == 200
        assert response.get_json()["language"] == language


def test_logout_audits(client, auth):
    headers = auth()
    response = client.post("/api/auth/logout", headers=headers)
    assert response.status_code == 200
