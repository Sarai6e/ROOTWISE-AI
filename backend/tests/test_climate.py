from datetime import date, timedelta


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self.payload


def _payload():
    base = date.today() - timedelta(days=30)
    params = {"T2M": {}, "T2M_MIN": {}, "T2M_MAX": {}, "PRECTOTCORR": {}, "RH2M": {}, "ALLSKY_SFC_SW_DWN": {}}
    values = {
        "T2M": 18.0, "T2M_MIN": 10.0, "T2M_MAX": 28.0,
        "PRECTOTCORR": 5.0, "RH2M": 70.0, "ALLSKY_SFC_SW_DWN": 5.2,
    }
    for offset in range(4):
        key = (base + timedelta(days=offset)).strftime("%Y%m%d")
        for name, value in values.items():
            params[name][key] = value
    return {"properties": {"parameter": params}}


def test_climate_summary_and_cache(app, monkeypatch):
    from services import nasa_power

    calls = {"count": 0}

    def fake_get(url, params=None, timeout=None, stream=False):
        calls["count"] += 1
        return FakeResponse(_payload())

    with app.app_context():
        first = nasa_power.get_climate(-12.6, -76.38, http_get=fake_get)
        assert first["available"] is True
        assert first["t2m_mean"] == 18.0
        assert first["rain_annual_mm"] == 20.0
        assert first["tmin_abs"] == 10.0
        assert first["cached"] is False

        second = nasa_power.get_climate(-12.6, -76.38, http_get=fake_get)
        assert second["cached"] is True
        assert calls["count"] == 1


def test_climate_failure_returns_unavailable(app):
    from services import nasa_power

    def broken(*args, **kwargs):
        raise RuntimeError("sin red")

    with app.app_context():
        result = nasa_power.get_climate(4.5, -75.0, http_get=broken)
        assert result["available"] is False
        assert "reason" in result


def test_climate_endpoint_requires_auth(client):
    assert client.get("/api/parcels/1/climate").status_code == 401


def test_parcel_climate_endpoint(client, demo_parcel, monkeypatch):
    headers, parcel_id = demo_parcel
    monkeypatch.setattr(
        "api.climate.nasa_power.get_climate",
        lambda *a, **k: {"available": True, "t2m_mean": 19.0},
    )
    response = client.get(f"/api/parcels/{parcel_id}/climate", headers=headers)
    assert response.status_code == 200
    assert response.get_json()["t2m_mean"] == 19.0
