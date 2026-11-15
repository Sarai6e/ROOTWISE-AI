from flask import Blueprint, jsonify

from extensions import db
from models import SoilAnalysis
from .utils import ApiError, audit, get_parcel, parse_date, parse_float, payload

bp = Blueprint("soil", __name__, url_prefix="/parcels")

SOURCES = {"laboratorio", "campo", "declarado"}


def _apply(analysis, data):
    if "source_type" in data:
        source = str(data.get("source_type") or "").lower()
        if source not in SOURCES:
            raise ApiError("Procedencia inválida. Usa laboratorio, campo o declarado.")
        analysis.source_type = source
    analysis.ph = parse_float(data.get("ph"), "pH", 0, 14) if "ph" in data else analysis.ph
    analysis.organic_matter_pct = (
        parse_float(data.get("organic_matter_pct"), "materia orgánica", 0, 100)
        if "organic_matter_pct" in data else analysis.organic_matter_pct
    )
    analysis.ec_ds_m = parse_float(data.get("ec_ds_m"), "conductividad", 0, 100) if "ec_ds_m" in data else analysis.ec_ds_m
    for field in ("n_ppm", "p_ppm", "k_ppm"):
        if field in data:
            setattr(analysis, field, parse_float(data.get(field), field, 0, 100000))
    if "texture" in data:
        analysis.texture = str(data.get("texture") or "")[:40] or None
    if "lab_name" in data:
        analysis.lab_name = str(data.get("lab_name") or "")[:120] or None
    if "sample_date" in data:
        analysis.sample_date = parse_date(data.get("sample_date"), "fecha de muestra")
    if "notes" in data:
        analysis.notes = data.get("notes")


@bp.get("/<int:parcel_id>/soil")
def list_soil(parcel_id):
    parcel = get_parcel(parcel_id)
    return jsonify([item.to_dict() for item in parcel.soil_analyses])


@bp.post("/<int:parcel_id>/soil")
def create_soil(parcel_id):
    parcel = get_parcel(parcel_id, write=True)
    data = payload()
    analysis = SoilAnalysis(parcel_id=parcel.id, source_type="declarado")
    _apply(analysis, data)
    if analysis.ph is None and not analysis.texture:
        raise ApiError("Registra al menos pH o textura para que el análisis sea útil.")
    db.session.add(analysis)
    audit("soil.create", "parcel", parcel.id)
    db.session.commit()
    return jsonify(analysis.to_dict()), 201


@bp.patch("/<int:parcel_id>/soil/<int:analysis_id>")
def update_soil(parcel_id, analysis_id):
    parcel = get_parcel(parcel_id, write=True)
    analysis = db.session.get(SoilAnalysis, analysis_id)
    if not analysis or analysis.parcel_id != parcel.id:
        raise ApiError("Análisis no encontrado.", 404)
    _apply(analysis, payload())
    audit("soil.update", "parcel", parcel.id, analysis=analysis.id)
    db.session.commit()
    return jsonify(analysis.to_dict())


@bp.delete("/<int:parcel_id>/soil/<int:analysis_id>")
def delete_soil(parcel_id, analysis_id):
    parcel = get_parcel(parcel_id, write=True)
    analysis = db.session.get(SoilAnalysis, analysis_id)
    if not analysis or analysis.parcel_id != parcel.id:
        raise ApiError("Análisis no encontrado.", 404)
    db.session.delete(analysis)
    audit("soil.delete", "parcel", parcel.id, analysis=analysis_id)
    db.session.commit()
    return jsonify({"message": "Análisis eliminado."})
