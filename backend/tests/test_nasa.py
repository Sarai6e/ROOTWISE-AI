from services import nasa_earth


def test_satellite_endpoint_returns_image(client, auth, monkeypatch):
    headers = auth("demo", "rootwise2026")
    monkeypatch.setattr(
        "api.nasa.nasa_earth.satellite_image",
        lambda *args, **kwargs: (b"\xff\xd8fakejpeg", "image/jpeg"),
    )
    response = client.get("/api/nasa/satellite?lat=-12.6&lon=-76.3", headers=headers)
    assert response.status_code == 200
    assert response.content_type == "image/jpeg"
    assert response.headers["X-Data-Source"] == "NASA Worldview Snapshots"


def test_parcel_satellite_requires_coordinates(client, demo_parcel, monkeypatch):
    headers, parcel_id = demo_parcel
    monkeypatch.setattr(
        "api.nasa.nasa_earth.satellite_image",
        lambda *args, **kwargs: (b"\xff\xd8fakejpeg", "image/jpeg"),
    )
    response = client.get(f"/api/nasa/parcels/{parcel_id}/satellite", headers=headers)
    assert response.status_code == 200
    assert response.data.startswith(b"\xff\xd8")


def test_collections_and_granules(client, auth, monkeypatch):
    headers = auth()
    monkeypatch.setattr(
        "api.nasa.nasa_earth.collections",
        lambda keyword, limit=8: [{"id": "C123", "title": "SMAP", "short_name": "SPL3SMP_E"}],
    )
    monkeypatch.setattr(
        "api.nasa.nasa_earth.granules",
        lambda short_name, bbox, limit=5: [{"id": "G1", "title": "gránulo"}],
    )
    assert client.get("/api/nasa/collections?keyword=soil", headers=headers).status_code == 200
    assert client.get("/api/nasa/granules?short_name=SPL3SMP_E", headers=headers).status_code == 200


def test_epic_endpoint(client, auth, monkeypatch):
    headers = auth()
    monkeypatch.setattr(
        "api.nasa.nasa_earth.epic_latest",
        lambda: {"date": "2026-11-14", "image_url": "https://example.org/epic.jpg"},
    )
    response = client.get("/api/nasa/epic", headers=headers)
    assert response.status_code == 200
    assert "epic.jpg" in response.get_json()["image_url"]


def test_nasa_upstream_errors_are_502(client, auth, monkeypatch):
    headers = auth()

    def broken(*args, **kwargs):
        raise RuntimeError("sin red")

    monkeypatch.setattr("api.nasa.nasa_earth.collections", broken)
    response = client.get("/api/nasa/collections", headers=headers)
    assert response.status_code == 502
    assert response.get_json()["code"] == "nasa_upstream"


def test_satellite_requires_auth(client):
    assert client.get("/api/nasa/satellite?lat=-12&lon=-76").status_code == 401


def test_bbox_and_default_date_helpers():
    assert nasa_earth.default_date("2026-11-15") == "2026-11-15"
    bbox = nasa_earth.bbox_from_point(-12.66, -76.38, pad=0.1)
    assert len(bbox) == 4
    assert bbox[0] < -76.38 < bbox[2]
    assert bbox[1] < -12.66 < bbox[3]


def test_firms_requires_key(monkeypatch):
    monkeypatch.delenv("FIRMS_MAP_KEY", raising=False)
    try:
        nasa_earth.firms("-76.99,-10.68,-75.49,-9.18")
        assert False, "debió lanzar NasaError"
    except nasa_earth.NasaError as error:
        assert "FIRMS_MAP_KEY" in str(error)
