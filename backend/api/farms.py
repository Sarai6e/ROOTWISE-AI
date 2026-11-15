from flask import Blueprint, jsonify

from extensions import db
from models import Farm
from .utils import ApiError, audit, current_user, get_farm, payload, role_required

bp = Blueprint("farms", __name__, url_prefix="/farms")


@bp.get("")
def list_farms():
    user = current_user()
    query = Farm.query
    if user.role not in {"admin", "tecnico"}:
        query = query.filter(Farm.user_id == user.id)
    farms = query.order_by(Farm.created_at.desc()).all()
    return jsonify([farm.to_dict(with_parcels=True) for farm in farms])


@bp.post("")
def create_farm():
    user = current_user()
    data = payload()
    name = str(data.get("name") or "").strip()
    if len(name) < 2:
        raise ApiError("Ponle un nombre a la finca.")
    farm = Farm(
        user_id=user.id,
        name=name[:120],
        locality=(str(data.get("locality") or "").strip()[:160] or None),
        notes=(data.get("notes") or None),
    )
    db.session.add(farm)
    db.session.flush()
    audit("farm.create", "farm", farm.id)
    db.session.commit()
    return jsonify(farm.to_dict()), 201


@bp.get("/<int:farm_id>")
def get_farm_detail(farm_id):
    farm = get_farm(farm_id)
    return jsonify(farm.to_dict(with_parcels=True))


@bp.patch("/<int:farm_id>")
def update_farm(farm_id):
    farm = get_farm(farm_id, write=True)
    data = payload()
    if "name" in data:
        name = str(data.get("name") or "").strip()
        if len(name) < 2:
            raise ApiError("Nombre de finca inválido.")
        farm.name = name[:120]
    if "locality" in data:
        farm.locality = str(data.get("locality") or "")[:160] or None
    if "notes" in data:
        farm.notes = data.get("notes")
    audit("farm.update", "farm", farm.id)
    db.session.commit()
    return jsonify(farm.to_dict(with_parcels=True))


@bp.delete("/<int:farm_id>")
def delete_farm(farm_id):
    farm = get_farm(farm_id, write=True)
    audit("farm.delete", "farm", farm.id, name=farm.name)
    db.session.delete(farm)
    db.session.commit()
    return jsonify({"message": "Finca eliminada con sus parcelas."})
