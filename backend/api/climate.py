from flask import Blueprint, jsonify, request

from services import nasa_power
from .utils import ApiError, current_user, get_parcel

bp = Blueprint("climate", __name__)


@bp.get("/parcels/<int:parcel_id>/climate")
def parcel_climate(parcel_id):
    parcel = get_parcel(parcel_id)
    if parcel.centroid_lat is None or parcel.centroid_lon is None:
        raise ApiError("La parcela no tiene coordenadas registradas.", 422)
    force = request.args.get("force") == "1"
    data = nasa_power.get_climate(parcel.centroid_lat, parcel.centroid_lon, force=force)
    return jsonify(data)


@bp.get("/climate/point")
def point_climate():
    current_user()
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))
    except (TypeError, ValueError) as error:
        raise ApiError("Indica latitud y longitud válidas.") from error
    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        raise ApiError("Coordenadas fuera de rango.")
    return jsonify(nasa_power.get_climate(lat, lon))
