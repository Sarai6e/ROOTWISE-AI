import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest

from app import create_app
from cli import seed_catalog, seed_demo_users
from extensions import db


@pytest.fixture()
def app():
    application = create_app({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
        "AUTO_SEED": False,
        "JWT_SECRET_KEY": "test-secret",
        "ML_ENABLED": False,
        "CORS_ORIGINS": "*",
    })
    with application.app_context():
        seed_catalog()
        seed_demo_users()
        yield application
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def auth(client):
    def login(username="demo", password="rootwise2026"):
        response = client.post("/api/auth/login", json={"username": username, "password": password})
        assert response.status_code == 200, response.get_json()
        return {"Authorization": f"Bearer {response.get_json()['access_token']}"}

    return login


@pytest.fixture()
def demo_parcel(client, auth):
    headers = auth()
    farms = client.get("/api/farms", headers=headers).get_json()
    parcel_id = farms[0]["parcels"][0]["id"]
    return headers, parcel_id


@pytest.fixture()
def other_user(client, auth):
    response = client.post("/api/auth/register", json={
        "username": "vecino",
        "password": "vecino2026",
        "full_name": "Vecino Agricultor",
        "region": "Ica",
    })
    assert response.status_code == 201
    token = response.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
