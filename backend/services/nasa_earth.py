"""Proxy de APIs públicas de NASA para evitar CORS y centralizar validación."""
import os
from datetime import date, timedelta

import requests
from flask import current_app

CMR_COLLECTIONS = "https://cmr.earthdata.nasa.gov/search/collections.json"
CMR_GRANULES = "https://cmr.earthdata.nasa.gov/search/granules.json"
CMR_STAC = "https://cmr.earthdata.nasa.gov/stac/"
WORLDVIEW = "https://wvs.earthdata.nasa.gov/api/v1/snapshot"
GIBS_WMS = "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi"
EPIC = "https://api.nasa.gov/EPIC/api/natural"
FIRMS = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"


class NasaError(RuntimeError):
    pass


def _get(url, params, timeout=18, stream=False):
    response = requests.get(url, params=params, timeout=timeout, stream=stream)
    response.raise_for_status()
    return response


def collections(keyword, limit=8):
    response = _get(
        CMR_COLLECTIONS,
        {"keyword": keyword, "page_size": max(1, min(int(limit), 25)), "sort_key": "-score"},
    )
    entries = (response.json().get("feed") or {}).get("entry") or []
    return [
        {
            "id": entry.get("id"),
            "short_name": entry.get("short_name"),
            "title": entry.get("title"),
            "summary": (entry.get("summary") or "")[:400],
            "updated": entry.get("updated"),
            "provider": entry.get("data_center"),
            "links": [link.get("href") for link in entry.get("links", [])][:3],
        }
        for entry in entries
    ]


def granules(short_name, bbox, limit=5):
    params = {
        "short_name": short_name,
        "page_size": max(1, min(int(limit), 20)),
        "sort_key": "-start_date",
        "bounding_box": bbox,
    }
    response = _get(CMR_GRANULES, params)
    entries = (response.json().get("feed") or {}).get("entry") or []
    return [
        {
            "id": entry.get("id"),
            "title": entry.get("title"),
            "start": entry.get("time_start"),
            "end": entry.get("time_end"),
            "size_mb": round(int(entry.get("granule_size") or 0), 2) if entry.get("granule_size") else None,
            "links": [link.get("href") for link in entry.get("links", []) if link.get("rel", "").endswith("data")][:2],
        }
        for entry in entries
    ]


def stac_root():
    response = _get(CMR_STAC, {})
    return response.json()


def default_date(day=None):
    if day is None:
        day = date.today()
    if isinstance(day, str):
        return day[:10]
    return day.isoformat()


def bbox_from_point(lat, lon, pad=0.25):
    lat, lon = float(lat), float(lon)
    return [lon - pad, lat - pad, lon + pad, lat + pad]


def satellite_image(lat, lon, day=None, size=720, layer="MODIS_Terra_CorrectedReflectance_TrueColor", pad=0.15):
    south, west, north, east = lat - pad, lon - pad, lat + pad, lon + pad
    params = {
        "REQUEST": "GetSnapshot",
        "LAYERS": layer,
        "CRS": "EPSG:4326",
        "TIME": default_date(day),
        "BBOX": f"{south:.4f},{west:.4f},{north:.4f},{east:.4f}",
        "FORMAT": "image/jpeg",
        "WIDTH": size,
        "HEIGHT": size,
    }
    response = _get(WORLDVIEW, params, timeout=25)
    content_type = response.headers.get("Content-Type", "image/jpeg")
    if not content_type.startswith("image/"):
        raise NasaError("Worldview no devolvió una imagen válida.")
    return response.content, content_type


def gibs_image(lat, lon, day=None, size=720, layer="MODIS_Terra_CorrectedReflectance_TrueColor", pad=0.15):
    south, west, north, east = lat - pad, lon - pad, lat + pad, lon + pad
    params = {
        "SERVICE": "WMS",
        "REQUEST": "GetMap",
        "VERSION": "1.3.0",
        "LAYERS": layer,
        "CRS": "EPSG:4326",
        "BBOX": f"{south:.4f},{west:.4f},{north:.4f},{east:.4f}",
        "WIDTH": size,
        "HEIGHT": size,
        "FORMAT": "image/png",
        "TRANSPARENT": "true",
        "TIME": default_date(day),
    }
    response = _get(GIBS_WMS, params, timeout=25)
    content_type = response.headers.get("Content-Type", "image/png")
    if not content_type.startswith("image/"):
        raise NasaError("GIBS no devolvió una imagen válida.")
    return response.content, content_type


def epic_latest(api_key=None):
    key = api_key or os.environ.get("NASA_API_KEY", "DEMO_KEY")
    response = _get(EPIC, {"api_key": key}, timeout=20)
    data = response.json() or []
    if not data:
        raise NasaError("EPIC no devolvió imágenes en este momento.")
    latest = data[0]
    image_day = (latest.get("date") or "").split(" ")[0]
    stamp = image_day.replace("-", "/")
    filename = latest.get("image")
    url = f"https://epic.gsfc.nasa.gov/archive/natural/{stamp}/jpg/{filename}"
    return {
        "date": latest.get("date"),
        "caption": latest.get("caption"),
        "centroid_lat": (latest.get("centroid_coordinates") or {}).get("lat"),
        "centroid_lon": (latest.get("centroid_coordinates") or {}).get("lon"),
        "image_url": url,
        "source": "NASA EPIC · DSCOVR",
    }


def firms(bbox, days=3, map_key=None):
    key = map_key or os.environ.get("FIRMS_MAP_KEY")
    if not key:
        raise NasaError("Falta FIRMS_MAP_KEY en el servidor para consultar incendios activos.")
    source = "VIIRS_SNPP_NRT"
    url = f"{FIRMS}/{key}/{source}/{bbox}/{max(1, min(int(days), 10))}"
    response = _get(url, {}, timeout=25)
    text = response.text
    lines = [line for line in text.strip().splitlines() if line]
    if not lines or lines[0].startswith("Invalid"):
        raise NasaError("FIRMS rechazó la consulta. Verifica la MAP_KEY y la cobertura.")
    header = lines[0].split(",")
    rows = [dict(zip(header, line.split(","))) for line in lines[1:61]]
    return {"source": "NASA FIRMS · VIIRS NRT", "count": len(rows), "rows": rows}


def status():
    return [
        {"id": "power", "name": "NASA POWER", "use": "Clima diario y agroclimático", "auth": "Pública", "enabled": True},
        {"id": "worldview", "name": "Worldview Snapshots", "use": "Imagen satelital de la parcela", "auth": "Pública", "enabled": True},
        {"id": "gibs", "name": "GIBS WMS", "use": "Capas ráster por fecha", "auth": "Pública", "enabled": True},
        {"id": "cmr", "name": "CMR + CMR-STAC", "use": "Catálogo de colecciones y gránulos", "auth": "Pública", "enabled": True},
        {"id": "epic", "name": "EPIC / DSCOVR", "use": "Imagen reciente de la Tierra", "auth": "DEMO_KEY", "enabled": True},
        {"id": "firms", "name": "FIRMS", "use": "Incendios activos", "auth": "MAP_KEY", "enabled": bool(os.environ.get("FIRMS_MAP_KEY"))},
        {"id": "appeears", "name": "AppEEARS / Harmony / earthaccess", "use": "Subsetting de productos", "auth": "Earthdata Login", "enabled": False},
    ]
