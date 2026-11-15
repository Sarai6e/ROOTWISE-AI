import math

RADIO_TIERRA_M = 6371008.8


class GeoError(ValueError):
    pass


def _as_geometry(data):
    if not isinstance(data, dict):
        raise GeoError("La geometría debe ser un objeto GeoJSON.")
    if data.get("type") == "Feature":
        data = data.get("geometry") or {}
    if data.get("type") != "Polygon":
        raise GeoError("Solo se admiten polígonos (GeoJSON Polygon).")
    return data


def _clean_ring(coords):
    if not isinstance(coords, list) or len(coords) < 3:
        raise GeoError("El polígono necesita al menos 3 vértices.")
    ring = []
    for point in coords:
        if not isinstance(point, (list, tuple)) or len(point) < 2:
            raise GeoError("Cada vértice debe tener longitud y latitud.")
        lon, lat = float(point[0]), float(point[1])
        if not (-180 <= lon <= 180) or not (-90 <= lat <= 90):
            raise GeoError("Coordenadas fuera de rango.")
        ring.append([round(lon, 7), round(lat, 7)])
    if ring[0] != ring[-1]:
        ring.append(ring[0])
    if len(ring) < 4:
        raise GeoError("El polígono necesita al menos 3 vértices distintos.")
    return ring


def normalize_geometry(data):
    geometry = _as_geometry(data)
    rings = geometry.get("coordinates") or []
    if not rings:
        raise GeoError("El polígono no tiene anillo exterior.")
    exterior = _clean_ring(rings[0])
    holes = [_clean_ring(ring) for ring in rings[1:] if ring]
    return {"type": "Polygon", "coordinates": [exterior] + holes}


def ring_area_ha(ring):
    if len(ring) < 4:
        return 0.0
    lat0 = math.radians(sum(point[1] for point in ring[:-1]) / (len(ring) - 1))
    scale_x = math.cos(lat0)
    total = 0.0
    for index in range(len(ring) - 1):
        lon1, lat1 = ring[index]
        lon2, lat2 = ring[index + 1]
        x1, y1 = math.radians(lon1) * scale_x, math.radians(lat1)
        x2, y2 = math.radians(lon2) * scale_x, math.radians(lat2)
        total += x1 * y2 - x2 * y1
    area_m2 = abs(total) * RADIO_TIERRA_M * RADIO_TIERRA_M / 2
    return area_m2 / 10_000


def ring_centroid(ring):
    points = ring[:-1] if ring[0] == ring[-1] else ring
    lat = sum(point[1] for point in points) / len(points)
    lon = sum(point[0] for point in points) / len(points)
    return round(lat, 7), round(lon, 7)


def summarize_geometry(geometry):
    exterior = geometry["coordinates"][0]
    area = ring_area_ha(exterior)
    if area <= 0:
        raise GeoError("El polígono tiene área cero. Revisa los vértices.")
    if area > 5_000_000:
        raise GeoError("El polígono es demasiado grande para una parcela.")
    lat, lon = ring_centroid(exterior)
    return {"area_ha": area, "centroid_lat": lat, "centroid_lon": lon}
