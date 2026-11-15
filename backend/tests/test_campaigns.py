def _crop_id(client, headers, name="Maíz amiláceo"):
    crops = client.get("/api/crops?limit=200", headers=headers).get_json()
    return next(item["id"] for item in crops if item["name"] == name)


def test_campaign_lifecycle(client, demo_parcel):
    headers, parcel_id = demo_parcel
    crop_id = _crop_id(client, headers)

    created = client.post(f"/api/parcels/{parcel_id}/campaigns", headers=headers, json={
        "crop_id": crop_id,
        "planned_sowing": "2026-11-20",
        "notes": "Campaña grande 2026",
    })
    assert created.status_code == 201
    campaign = created.get_json()
    assert campaign["status"] == "planificada"
    assert campaign["target_harvest"]
    campaign_id = campaign["id"]

    event = client.post(f"/api/campaigns/{campaign_id}/events", headers=headers, json={
        "event_type": "riego",
        "event_date": "2026-12-01",
        "description": "Riego de emergencia",
    })
    assert event.status_code == 201
    event_id = event.get_json()["id"]

    confirmed = client.patch(f"/api/campaigns/{campaign_id}", headers=headers, json={
        "actual_sowing": "2026-11-22",
    })
    assert confirmed.get_json()["status"] == "en_curso"

    detail = client.get(f"/api/campaigns/{campaign_id}", headers=headers).get_json()
    assert len(detail["events"]) == 1

    assert client.delete(
        f"/api/campaigns/{campaign_id}/events/{event_id}", headers=headers
    ).status_code == 200
    assert client.delete(f"/api/campaigns/{campaign_id}", headers=headers).status_code == 200


def test_invalid_event_type(client, demo_parcel):
    headers, parcel_id = demo_parcel
    crop_id = _crop_id(client, headers)
    campaign_id = client.post(f"/api/parcels/{parcel_id}/campaigns", headers=headers, json={
        "crop_id": crop_id, "planned_sowing": "2026-11-20",
    }).get_json()["id"]

    response = client.post(f"/api/campaigns/{campaign_id}/events", headers=headers, json={
        "event_type": "fiesta", "event_date": "2026-11-21", "description": "No válido",
    })
    assert response.status_code == 400
