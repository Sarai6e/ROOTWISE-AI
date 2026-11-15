FAKE_CLIMATE = {
    "available": True,
    "t2m_mean": 18.0,
    "tmin_abs": 10.0,
    "tmax_abs": 28.0,
    "rain_annual_mm": 600,
    "rh_mean": 70,
    "cached": False,
    "meta": {"resolution_deg": 0.5, "source": "NASA POWER"},
    "period": {"start": "2021-01-01", "end": "2025-12-31"},
}


def _crop_ids(client, headers, names):
    crops = client.get("/api/crops?limit=200", headers=headers).get_json()
    index = {item["name"]: item["id"] for item in crops}
    return [index[name] for name in names]


def test_run_simulation_persists_results(client, demo_parcel, monkeypatch):
    headers, parcel_id = demo_parcel
    monkeypatch.setattr("api.simulations.nasa_power.get_climate", lambda *a, **k: dict(FAKE_CLIMATE))
    crop_ids = _crop_ids(client, headers, ["Maíz amiláceo", "Quinua"])

    response = client.post(f"/api/parcels/{parcel_id}/simulations", headers=headers, json={
        "crop_ids": crop_ids,
        "sowing_date": "2026-10-15",
        "objective": "autoconsumo",
    })
    assert response.status_code == 201, response.get_json()
    body = response.get_json()
    assert len(body["results"]) == 2
    assert body["ruleset_version"] == "1.0.0"
    assert body["context"]["climate"]["available"] is True
    assert body["context"]["disclaimer"]

    run_id = body["id"]
    detail = client.get(f"/api/simulations/{run_id}", headers=headers)
    assert detail.status_code == 200
    assert "inputs" in detail.get_json()

    listed = client.get(f"/api/simulations?parcel_id={parcel_id}", headers=headers).get_json()
    assert any(item["id"] == run_id for item in listed)


def test_simulation_requires_crops(client, demo_parcel, monkeypatch):
    headers, parcel_id = demo_parcel
    monkeypatch.setattr("api.simulations.nasa_power.get_climate", lambda *a, **k: dict(FAKE_CLIMATE))
    response = client.post(f"/api/parcels/{parcel_id}/simulations", headers=headers, json={})
    assert response.status_code == 400


def test_simulation_is_isolated_between_users(client, demo_parcel, other_user, monkeypatch):
    headers, parcel_id = demo_parcel
    monkeypatch.setattr("api.simulations.nasa_power.get_climate", lambda *a, **k: dict(FAKE_CLIMATE))
    crop_ids = _crop_ids(client, headers, ["Papa"])
    run_id = client.post(f"/api/parcels/{parcel_id}/simulations", headers=headers, json={
        "crop_ids": crop_ids,
    }).get_json()["id"]

    assert client.get(f"/api/simulations/{run_id}", headers=other_user).status_code == 403
