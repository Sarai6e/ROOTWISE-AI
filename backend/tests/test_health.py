import io


def test_capabilities_without_tensorflow(client, auth):
    headers = auth()
    response = client.get("/api/health/capabilities", headers=headers)
    assert response.status_code == 200
    body = response.get_json()
    assert body["model_available"] is False
    assert body["model_version"]
    assert body["disclaimer"]


def test_diagnose_without_model_returns_503(client, auth):
    headers = auth()
    response = client.post(
        "/api/health/diagnose",
        headers=headers,
        data={"image": (io.BytesIO(b"imagen-falsa"), "hoja.jpg")},
        content_type="multipart/form-data",
    )
    assert response.status_code == 503
    assert response.get_json()["code"] == "ml_unavailable"


def test_diagnose_with_mocked_model(client, auth, monkeypatch):
    def fake_predict(blob):
        return [
            {"class": "Tomato___healthy", "label": "Hoja sana", "score": 0.91, "advice": "Monitoreo."},
            {"class": "Tomato___Early_blight", "label": "Tizón temprano", "score": 0.05, "advice": "Rota cultivos."},
        ]

    monkeypatch.setattr("services.leaf_model.predict", fake_predict)
    headers = auth()
    response = client.post(
        "/api/health/diagnose",
        headers=headers,
        data={"image": (io.BytesIO(b"imagen-falsa"), "hoja.jpg")},
        content_type="multipart/form-data",
    )
    assert response.status_code == 201
    body = response.get_json()
    assert body["predictions"][0]["label"] == "Hoja sana"
    assert len(body["predictions"]) == 2


def test_observation_crud(client, demo_parcel):
    headers, parcel_id = demo_parcel
    created = client.post("/api/health/observations", headers=headers, json={
        "parcel_id": parcel_id,
        "symptoms": "Manchas oscuras en hojas bajas",
        "severity": "media",
        "observed_at": "2026-11-01",
    })
    assert created.status_code == 201
    observation_id = created.get_json()["id"]

    listed = client.get(f"/api/health/observations?parcel_id={parcel_id}", headers=headers)
    assert any(item["id"] == observation_id for item in listed.get_json())

    assert client.delete(
        f"/api/health/observations/{observation_id}", headers=headers
    ).status_code == 200
