def test_catalog_is_seeded(client, auth):
    headers = auth()
    response = client.get("/api/crops", headers=headers)
    assert response.status_code == 200
    assert len(response.get_json()) >= 40


def test_search_by_common_and_scientific_name(client, auth):
    headers = auth()
    by_common = client.get("/api/crops?search=papa", headers=headers).get_json()
    assert any(item["name"] == "Papa" for item in by_common)

    by_scientific = client.get("/api/crops?search=Solanum", headers=headers).get_json()
    assert len(by_scientific) >= 2


def test_filter_by_category(client, auth):
    headers = auth()
    response = client.get("/api/crops?category=cereal", headers=headers).get_json()
    assert response
    assert all(item["category"] == "cereal" for item in response)


def test_categories_endpoint(client, auth):
    headers = auth()
    categories = client.get("/api/crops/categories", headers=headers).get_json()
    assert "cereal" in categories


def test_crop_detail_has_sources(client, auth):
    headers = auth()
    crops = client.get("/api/crops?search=Quinua", headers=headers).get_json()
    detail = client.get(f"/api/crops/{crops[0]['id']}", headers=headers)
    assert detail.status_code == 200
    body = detail.get_json()
    assert body["source"]
    assert body["confidence"]
    assert body["planting_months"]


def test_crop_not_found(client, auth):
    headers = auth()
    assert client.get("/api/crops/9999", headers=headers).status_code == 404
