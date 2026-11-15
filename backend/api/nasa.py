from flask import Blueprint, Response, jsonify, request

from services import nasa_earth
from .utils import ApiError, current_user, get_parcel

bp = Blueprint("nasa", __name__, url_prefix="/nasa")

LAYERS = {
    "truecolor": "MODIS_Terra_CorrectedReflectance_TrueColor",
    "viirs": "VIIRS_SNPP_CorrectedReflectance_TrueColor",
    "landsat": "Landsat_WELD_CorrectedReflectance_TrueColor_Global_Annual",
}


def _image(content, content_type, source):
    response = Response(content, mimetype=content_type)
    response.headers["Cache-Control"] = "public, max-age=3600"
    response.headers["X-Data-Source"] = source
    return response


@bp.get("/status")
def status():
    current_user()
    return jsonify({"endpoints": nasa_earth.status()})


@bp.get("/collections")
def collections():
    current_user()
    keyword = (request.args.get("keyword") or "soil moisture").strip()
    try:
        return jsonify(nasa_earth.collections(keyword))
    except Exception as error:  # noqa: BLE001
        raise ApiError(f"CMR no respondió: {error}", 502, "nasa_upstream") from error


@bp.get("/granules")
def granules():
    current_user()
    short_name = (request.args.get("short_name") or "SPL3SMP_E").strip()
    bbox = request.args.get("bbox") or "-76.99,-10.68,-75.49,-9.18"
    try:
        return jsonify(nasa_earth.granules(short_name, bbox))
    except Exception as error:  # noqa: BLE001
        raise ApiError(f"CMR no respondió: {error}", 502, "nasa_upstream") from error


@bp.get("/satellite")
def satellite():
    current_user()
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))
    except (TypeError, ValueError) as error:
        raise ApiError("Indica latitud y longitud.") from error
    layer = LAYERS.get(request.args.get("layer") or "truecolor", LAYERS["truecolor"])
    day = request.args.get("date") or None
    size = min(max(int(request.args.get("size") or 720), 256), 1400)
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise ApiError("Coordenadas fuera de rango.")
    try:
        content, content_type = nasa_earth.satellite_image(lat, lon, day, size, layer)
    except Exception as error:  # noqa: BLE001
        raise ApiError(f"Worldview no devolvió la imagen: {error}", 502, "nasa_upstream") from error
    return _image(content, content_type, "NASA Worldview Snapshots")


@bp.get("/gibs")
def gibs():
    current_user()
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))
    except (TypeError, ValueError) as error:
        raise ApiError("Indica latitud y longitud.") from error
    layer = LAYERS.get(request.args.get("layer") or "truecolor", LAYERS["truecolor"])
    try:
        content, content_type = nasa_earth.gibs_image(
            lat, lon, request.args.get("date") or None, 720, layer
        )
    except Exception as error:  # noqa: BLE001
        raise ApiError(f"GIBS no devolvió la imagen: {error}", 502, "nasa_upstream") from error
    return _image(content, content_type, "NASA GIBS")


@bp.get("/parcels/<int:parcel_id>/satellite")
def parcel_satellite(parcel_id):
    current_user()
    parcel = get_parcel(parcel_id)
    if parcel.centroid_lat is None:
        raise ApiError("La parcela no tiene coordenadas.", 422)
    layer = LAYERS.get(request.args.get("layer") or "truecolor", LAYERS["truecolor"])
    try:
        content, content_type = nasa_earth.satellite_image(
            parcel.centroid_lat, parcel.centroid_lon,
            request.args.get("date") or None,
            min(max(int(request.args.get("size") or 760), 400), 1400),
            layer,
            pad=0.35,
        )
    except Exception as error:  # noqa: BLE001
        raise ApiError(f"Worldview no devolvió la imagen: {error}", 502, "nasa_upstream") from error
    return _image(content, content_type, "NASA Worldview Snapshots")


@bp.get("/epic")
def epic():
    current_user()
    try:
        return jsonify(nasa_earth.epic_latest())
    except Exception as error:  # noqa: BLE001
        raise ApiError(f"EPIC no respondió: {error}", 502, "nasa_upstream") from error


@bp.get("/firms")
def firms():
    current_user()
    bbox = request.args.get("bbox") or "-76.99,-10.68,-75.49,-9.18"
    try:
        return jsonify(nasa_earth.firms(bbox, request.args.get("days") or 3))
    except Exception as error:  # noqa: BLE001
        raise ApiError(f"FIRMS no respondió: {error}", 502, "nasa_upstream") from error
