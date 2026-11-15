import pytest


@pytest.fixture()
def crop_payload():
    return {
        "id": 1,
        "name": "Papa",
        "botanical_family": "Solanaceae",
        "temp_min": 8,
        "temp_max": 25,
        "rain_min_mm": 500,
        "rain_max_mm": 1200,
        "alt_min_m": 2000,
        "alt_max_m": 4200,
        "ph_min": 5.0,
        "ph_max": 6.5,
        "water_need": "medio",
        "planting_months": [9, 10, 11, 12],
        "confidence": 0.85,
    }


@pytest.fixture()
def parcel_payload():
    return {
        "id": 1,
        "name": "Parcela",
        "elevation_m": 2600,
        "slope_pct": 4,
        "water_available": "media",
        "area_ha": 1.2,
        "centroid_lat": -12.6,
        "centroid_lon": -76.3,
    }


@pytest.fixture()
def climate_payload():
    return {
        "available": True,
        "t2m_mean": 16.0,
        "tmin_abs": 6.0,
        "tmax_abs": 24.0,
        "rain_annual_mm": 800,
        "rh_mean": 72,
        "period": {"start": "2021-01-01", "end": "2025-12-31"},
        "meta": {"resolution_deg": 0.5},
    }


def test_recommendable_with_full_data(crop_payload, parcel_payload, climate_payload):
    from services.suitability import evaluate_crop

    result = evaluate_crop(
        crop_payload, parcel_payload, {"ph": 6.0, "organic_matter_pct": 2.5},
        climate_payload, [], __import__("datetime").date(2026, 10, 15),
    )
    assert result["classification"] == "recomendable"
    assert result["score"] > 0.75
    assert result["confidence"] > 0.5


def test_altitude_out_of_range_is_critical(crop_payload, parcel_payload, climate_payload):
    from services.suitability import evaluate_crop

    parcel_payload["elevation_m"] = 50
    result = evaluate_crop(crop_payload, parcel_payload, {"ph": 6.0}, climate_payload, [],
                           __import__("datetime").date(2026, 10, 15))
    assert result["classification"] == "riesgo_alto"
    assert any("Altitud" in item for item in result["critical"])


def test_high_water_need_with_low_availability(crop_payload, parcel_payload, climate_payload):
    from services.suitability import evaluate_crop

    crop_payload["water_need"] = "alto"
    parcel_payload["water_available"] = "baja"
    result = evaluate_crop(crop_payload, parcel_payload, {"ph": 6.0}, climate_payload, [],
                           __import__("datetime").date(2026, 10, 15))
    assert result["classification"] == "riesgo_alto"
    assert any("agua" in item.lower() for item in result["critical"])


def test_rotation_violation_is_critical(crop_payload, parcel_payload, climate_payload):
    from services.suitability import evaluate_crop

    history = [{"family": "Solanaceae", "year": 2025, "crop_name": "Tomate"}]
    result = evaluate_crop(crop_payload, parcel_payload, {"ph": 6.0}, climate_payload, history,
                           __import__("datetime").date(2026, 10, 15))
    assert result["classification"] == "riesgo_alto"
    assert any("intervalo" in item.lower() or "Rotación" in item for item in result["critical"])


def test_missing_data_returns_insufficient(crop_payload, climate_payload):
    from services.suitability import evaluate_crop

    parcel = {"elevation_m": None, "water_available": "media"}
    result = evaluate_crop(crop_payload, parcel, None, {"available": False}, [],
                           __import__("datetime").date(2026, 10, 15))
    assert result["classification"] == "informacion_insuficiente"
    assert "clima" in result["missing"]
    assert "suelo" in result["missing"]


def test_frost_is_warning_at_low_altitude(crop_payload, parcel_payload, climate_payload):
    from services.suitability import evaluate_crop

    crop_payload["alt_min_m"] = 0
    crop_payload["alt_max_m"] = 4000
    parcel_payload["elevation_m"] = 150
    climate_payload["tmin_abs"] = -2.0
    result = evaluate_crop(crop_payload, parcel_payload, {"ph": 6.0}, climate_payload, [],
                           __import__("datetime").date(2026, 10, 15))
    assert result["classification"] != "riesgo_alto"
    assert any(factor["key"] == "climate" and factor["status"] == "warning" for factor in result["factors"])


def test_frost_is_critical_in_highlands(crop_payload, parcel_payload, climate_payload):
    from services.suitability import evaluate_crop

    parcel_payload["elevation_m"] = 3600
    climate_payload["tmin_abs"] = -4.0
    result = evaluate_crop(crop_payload, parcel_payload, {"ph": 6.0}, climate_payload, [],
                           __import__("datetime").date(2026, 10, 15))
    assert result["classification"] == "riesgo_alto"
    assert any("mínima histórica" in item.lower() for item in result["critical"])


def test_weights_add_up_to_one():
    from services.suitability import WEIGHTS

    assert abs(sum(WEIGHTS.values()) - 1.0) < 1e-9


def test_calendar_outside_window_penalizes(crop_payload, parcel_payload, climate_payload):
    from services.suitability import evaluate_crop

    result = evaluate_crop(crop_payload, parcel_payload, {"ph": 6.0}, climate_payload, [],
                           __import__("datetime").date(2026, 5, 15))
    assert result["components"]["calendar"] < 0.5
