import json

from flask import Blueprint, jsonify

from extensions import db
from models import CropCatalog, Farm, Parcel, ParcelCropHistory
from services import geo
from .utils import ApiError, audit, current_user, get_farm, get_parcel, parse_float, payload

bp = Blueprint("parcels", __name__, url_prefix="/parcels")

WATER = {"alta", "media", "baja"}


@bp.get("")
def list_parcels():
    from flask import request

    user = current_user()
    query = Parcel.query.join(Farm)
    farm_id = request.args.get("farm_id")
    if farm_id:
        query = query.filter(Parcel.farm_id == int(farm_id))
    if user.role not in {"admin", "tecnico"}:
        query = query.filter(Farm.user_id == user.id)
    parcels = query.order_by(Parcel.created_at.desc()).all()
    return jsonify([parcel.to_dict() for parcel in parcels])


@bp.post("")
def create_parcel():
    user = current_user()
    data = payload()
    farm = get_farm(int(data.get("farm_id") or 0), write=True)

    name = str(data.get("name") or "").strip()
    if len(name) < 2:
        raise ApiError("Ponle un nombre a la parcela.")
    try:
        geometry = geo.normalize_geometry(data.get("geometry"))
        summary = geo.summarize_geometry(geometry)
    except geo.GeoError as error:
        raise ApiError(str(error), 422, "invalid_geometry") from error

    water = str(data.get("water_available") or "media").lower()
    if water not in WATER:
        raise ApiError("Disponibilidad de agua inválida.")

    parcel = Parcel(
        farm_id=farm.id,
        name=name[:120],
        geometry_json=json.dumps(geometry),
        area_ha=summary["area_ha"],
        centroid_lat=summary["centroid_lat"],
        centroid_lon=summary["centroid_lon"],
        elevation_m=parse_float(data.get("elevation_m"), "altitud", 0, 6000),
        slope_pct=parse_float(data.get("slope_pct"), "pendiente", 0, 100),
        water_available=water,
        irrigation_type=(str(data.get("irrigation_type") or "")[:40] or None),
        notes=(data.get("notes") or None),
    )
    db.session.add(parcel)
    db.session.flush()
    audit("parcel.create", "parcel", parcel.id, area_ha=round(parcel.area_ha, 3), actor=user.id)
    db.session.commit()
    return jsonify(parcel.to_dict()), 201


@bp.get("/<int:parcel_id>")
def get_parcel_detail(parcel_id):
    parcel = get_parcel(parcel_id)
    return jsonify(parcel.to_dict(detailed=True))


@bp.patch("/<int:parcel_id>")
def update_parcel(parcel_id):
    parcel = get_parcel(parcel_id, write=True)
    data = payload()

    if "name" in data:
        name = str(data.get("name") or "").strip()
        if len(name) < 2:
            raise ApiError("Nombre inválido.")
        parcel.name = name[:120]
    if "geometry" in data:
        try:
            geometry = geo.normalize_geometry(data.get("geometry"))
            summary = geo.summarize_geometry(geometry)
        except geo.GeoError as error:
            raise ApiError(str(error), 422, "invalid_geometry") from error
        parcel.geometry_json = json.dumps(geometry)
        parcel.area_ha = summary["area_ha"]
        parcel.centroid_lat = summary["centroid_lat"]
        parcel.centroid_lon = summary["centroid_lon"]
    if "elevation_m" in data:
        parcel.elevation_m = parse_float(data.get("elevation_m"), "altitud", 0, 6000)
    if "slope_pct" in data:
        parcel.slope_pct = parse_float(data.get("slope_pct"), "pendiente", 0, 100)
    if "water_available" in data:
        water = str(data.get("water_available") or "").lower()
        if water not in WATER:
            raise ApiError("Disponibilidad de agua inválida.")
        parcel.water_available = water
    if "irrigation_type" in data:
        parcel.irrigation_type = str(data.get("irrigation_type") or "")[:40] or None
    if "notes" in data:
        parcel.notes = data.get("notes")

    audit("parcel.update", "parcel", parcel.id)
    db.session.commit()
    return jsonify(parcel.to_dict(detailed=True))


@bp.delete("/<int:parcel_id>")
def delete_parcel(parcel_id):
    parcel = get_parcel(parcel_id, write=True)
    audit("parcel.delete", "parcel", parcel.id, name=parcel.name)
    db.session.delete(parcel)
    db.session.commit()
    return jsonify({"message": "Parcela eliminada."})


@bp.post("/<int:parcel_id>/history")
def add_history(parcel_id):
    parcel = get_parcel(parcel_id, write=True)
    data = payload()
    crop = db.session.get(CropCatalog, int(data.get("crop_id") or 0))
    if not crop:
        raise ApiError("Cultivo no encontrado en el catálogo.", 404)
    year = int(data.get("year") or 0)
    if not 1950 <= year <= 2100:
        raise ApiError("Año inválido.")
    item = ParcelCropHistory(
        parcel_id=parcel.id,
        crop_id=crop.id,
        family=crop.botanical_family,
        year=year,
        season=(str(data.get("season") or "")[:30] or None),
        notes=(data.get("notes") or None),
    )
    db.session.add(item)
    audit("parcel.history_add", "parcel", parcel.id, crop=crop.name, year=year)
    db.session.commit()
    return jsonify(item.to_dict()), 201


@bp.delete("/<int:parcel_id>/history/<int:history_id>")
def delete_history(parcel_id, history_id):
    parcel = get_parcel(parcel_id, write=True)
    item = db.session.get(ParcelCropHistory, history_id)
    if not item or item.parcel_id != parcel.id:
        raise ApiError("Registro de historial no encontrado.", 404)
    db.session.delete(item)
    audit("parcel.history_delete", "parcel", parcel.id, history=history_id)
    db.session.commit()
    return jsonify({"message": "Historial actualizado."})
