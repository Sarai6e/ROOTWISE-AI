SQUARE = {
    "type": "Polygon",
    "coordinates": [[
        [-76.400, -12.600],
        [-76.399, -12.600],
        [-76.399, -12.601],
        [-76.400, -12.601],
        [-76.400, -12.600],
    ]],
}


def test_demo_farm_and_parcel_are_seeded(client, auth):
    headers = auth()
    farms = client.get("/api/farms", headers=headers).get_json()
    assert len(farms) == 1
    assert farms[0]["name"] == "Finca La Esperanza"
    parcel = farms[0]["parcels"][0]
    assert parcel["area_ha"] > 0
    assert parcel["geometry"]["type"] == "Polygon"


def test_create_farm_and_parcel_calculates_area(client, auth):
    headers = auth()
    farm = client.post("/api/farms", headers=headers, json={
        "name": "Finca Sur", "locality": "Ica",
    })
    assert farm.status_code == 201
    farm_id = farm.get_json()["id"]

    response = client.post("/api/parcels", headers=headers, json={
        "farm_id": farm_id,
        "name": "Parcela 2",
        "geometry": SQUARE,
        "area_ha": 999,
        "elevation_m": 420,
        "water_available": "alta",
    })
    assert response.status_code == 201
    body = response.get_json()
    assert 1.1 < body["area_ha"] < 1.4
    assert body["centroid_lat"] == -12.6005
    assert body["farm_id"] == farm_id


def test_invalid_geometry_is_rejected(client, auth):
    headers = auth()
    farms = client.get("/api/farms", headers=headers).get_json()
    response = client.post("/api/parcels", headers=headers, json={
        "farm_id": farms[0]["id"],
        "name": "Mala",
        "geometry": {"type": "Point", "coordinates": [-76.4, -12.6]},
    })
    assert response.status_code == 422
    assert response.get_json()["code"] == "invalid_geometry"


def test_other_user_cannot_read_parcel(client, demo_parcel, other_user):
    _, parcel_id = demo_parcel
    response = client.get(f"/api/parcels/{parcel_id}", headers=other_user)
    assert response.status_code == 403


def test_update_and_delete_parcel(client, demo_parcel):
    headers, parcel_id = demo_parcel
    response = client.patch(f"/api/parcels/{parcel_id}", headers=headers, json={
        "name": "Parcela Renombrada", "elevation_m": 180,
    })
    assert response.status_code == 200
    assert response.get_json()["name"] == "Parcela Renombrada"

    deleted = client.delete(f"/api/parcels/{parcel_id}", headers=headers)
    assert deleted.status_code == 200
    assert client.get(f"/api/parcels/{parcel_id}", headers=headers).status_code == 404


def test_soil_crud(client, demo_parcel):
    headers, parcel_id = demo_parcel
    created = client.post(f"/api/parcels/{parcel_id}/soil", headers=headers, json={
        "source_type": "laboratorio", "ph": 6.8, "texture": "franco arcilloso",
        "organic_matter_pct": 2.4, "sample_date": "2026-09-01",
    })
    assert created.status_code == 201
    analysis_id = created.get_json()["id"]

    updated = client.patch(f"/api/parcels/{parcel_id}/soil/{analysis_id}", headers=headers, json={
        "ph": 7.0,
    })
    assert updated.status_code == 200
    assert updated.get_json()["ph"] == 7.0

    deleted = client.delete(f"/api/parcels/{parcel_id}/soil/{analysis_id}", headers=headers)
    assert deleted.status_code == 200
