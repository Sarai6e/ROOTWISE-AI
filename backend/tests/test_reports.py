def test_pdf_report(client, demo_parcel, monkeypatch):
    headers, parcel_id = demo_parcel
    monkeypatch.setattr(
        "api.reports.nasa_power.get_climate",
        lambda *a, **k: {
            "available": True, "t2m_mean": 18.0, "tmin_abs": 10.0, "tmax_abs": 27.0,
            "rain_annual_mm": 550, "rh_mean": 71,
            "period": {"start": "2021-01-01", "end": "2025-12-31"},
            "meta": {"resolution_deg": 0.5},
        },
    )
    response = client.get(f"/api/parcels/{parcel_id}/report.pdf", headers=headers)
    assert response.status_code == 200
    assert response.content_type == "application/pdf"
    assert response.data[:4] == b"%PDF"


def test_pdf_requires_access(client, demo_parcel, other_user, monkeypatch):
    _, parcel_id = demo_parcel
    monkeypatch.setattr("api.reports.nasa_power.get_climate", lambda *a, **k: {"available": False})
    assert client.get(f"/api/parcels/{parcel_id}/report.pdf", headers=other_user).status_code == 403
