"""Cliente de NASA POWER con caché en SQLite y degradación controlada."""
import json
from datetime import date, datetime, timedelta, timezone

import requests
from flask import current_app

from extensions import db
from models import ClimateCache

POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
PARAMETERS = ["T2M", "T2M_MIN", "T2M_MAX", "PRECTOTCORR", "RH2M", "ALLSKY_SFC_SW_DWN"]
FILL = -999.0
META = {
    "source": "NASA POWER",
    "product": "POWER Daily · comunidad AG",
    "resolution_deg": 0.5,
    "resolution_note": "0.5° × 0.625° (~50–60 km); contexto regional, no medición dentro de la parcela",
    "url": "https://power.larc.nasa.gov/",
}


def _round_key(value):
    return round(float(value) * 10) / 10


def _period(today=None):
    today = today or date.today()
    end = today - timedelta(days=7)
    start = date(end.year - 5, end.month, 1)
    return start, end


def _clean(series):
    return [value for value in series.values() if isinstance(value, (int, float)) and value > FILL]


def _monthly_average(parameter, dates):
    buckets = {month: [] for month in range(1, 13)}
    for day, value in parameter.items():
        if not isinstance(value, (int, float)) or value <= FILL:
            continue
        try:
            month = int(day[4:6])
        except (ValueError, IndexError):
            continue
        buckets[month].append(value)
    return {month: (round(sum(values) / len(values), 2) if values else None) for month, values in buckets.items()}


def summarize_power(payload, period_start, period_end, fetched_at):
    params = (payload.get("properties") or {}).get("parameter") or {}
    t2m = _clean(params.get("T2M") or {})
    tmin = _clean(params.get("T2M_MIN") or {})
    tmax = _clean(params.get("T2M_MAX") or {})
    rain = params.get("PRECTOTCORR") or {}
    rh = _clean(params.get("RH2M") or {})
    solar = _clean(params.get("ALLSKY_SFC_SW_DWN") or {})

    annual = {}
    for day, value in rain.items():
        if not isinstance(value, (int, float)) or value <= FILL:
            continue
        year = day[:4]
        annual[year] = annual.get(year, 0.0) + value
    annual_values = [value for value in annual.values() if value > 0]

    monthly_rain = {month: [] for month in range(1, 13)}
    for day, value in rain.items():
        if not isinstance(value, (int, float)) or value <= FILL:
            continue
        month = int(day[4:6])
        monthly_rain[month].append(value)
    monthly_rain_mean = {
        month: (round(sum(values), 1) if values else None)
        for month, values in monthly_rain.items()
    }

    if not t2m or not annual_values:
        return {
            "available": False,
            "reason": "NASA POWER no devolvió datos suficientes para estas coordenadas.",
            "meta": META,
            "period": {"start": period_start.isoformat(), "end": period_end.isoformat()},
        }

    return {
        "available": True,
        "meta": {**META, "fetched_at": fetched_at, "license": "NASA Open Data"},
        "period": {"start": period_start.isoformat(), "end": period_end.isoformat()},
        "years": len(annual_values),
        "t2m_mean": round(sum(t2m) / len(t2m), 2),
        "tmin_abs": round(min(tmin), 2) if tmin else None,
        "tmax_abs": round(max(tmax), 2) if tmax else None,
        "rain_annual_mm": round(sum(annual_values) / len(annual_values), 1),
        "rain_monthly_mm": monthly_rain_mean,
        "rh_mean": round(sum(rh) / len(rh), 2) if rh else None,
        "solar_mean": round(sum(solar) / len(solar), 2) if solar else None,
        "days_analyzed": len(t2m),
    }


def fetch_power(lat, lon, period_start, period_end, http_get=None, timeout=20):
    http_get = http_get or requests.get
    params = {
        "parameters": ",".join(PARAMETERS),
        "community": "AG",
        "longitude": round(float(lon), 4),
        "latitude": round(float(lat), 4),
        "start": period_start.strftime("%Y%m%d"),
        "end": period_end.strftime("%Y%m%d"),
        "format": "JSON",
    }
    response = http_get(POWER_URL, params=params, timeout=timeout)
    response.raise_for_status()
    return response.json()


def get_climate(lat, lon, http_get=None, now=None, force=False):
    now = now or datetime.now(timezone.utc)
    lat_key, lon_key = _round_key(lat), _round_key(lon)
    start, end = _period(now.date())

    cached = (
        ClimateCache.query.filter_by(lat_key=lat_key, lon_key=lon_key,
                                     period_start=start, period_end=end)
        .order_by(ClimateCache.fetched_at.desc())
        .first()
    )
    ttl = timedelta(hours=current_app.config.get("CLIMATE_CACHE_HOURS", 24))
    if cached and not force:
        fetched = cached.fetched_at
        if fetched.tzinfo is None:
            fetched = fetched.replace(tzinfo=timezone.utc)
        if now - fetched < ttl:
            data = json.loads(cached.payload_json)
            data["cached"] = True
            return data

    try:
        payload = fetch_power(
            lat, lon, start, end,
            http_get=http_get,
            timeout=current_app.config.get("NASA_POWER_TIMEOUT", 20),
        )
        summary = summarize_power(payload, start, end, now.isoformat())
        summary["cached"] = False
        if summary.get("available"):
            db.session.add(ClimateCache(
                lat_key=lat_key, lon_key=lon_key, period_start=start, period_end=end,
                payload_json=json.dumps(summary),
            ))
            db.session.commit()
        return summary
    except Exception as error:  # noqa: BLE001 - la app debe seguir sin conexión
        current_app.logger.warning("NASA POWER no disponible: %s", error)
        if cached:
            data = json.loads(cached.payload_json)
            data["cached"] = True
            data["stale"] = True
            return data
        return {
            "available": False,
            "reason": "No se pudo consultar NASA POWER. Revisa la conexión e inténtalo de nuevo.",
            "meta": META,
            "period": {"start": start.isoformat(), "end": end.isoformat()},
            "cached": False,
        }
