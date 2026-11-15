from flask import Blueprint, jsonify, request

from extensions import db
from models import CropCatalog
from .utils import ApiError

bp = Blueprint("crops", __name__, url_prefix="/crops")


@bp.get("")
def list_crops():
    search = (request.args.get("search") or "").strip()
    category = (request.args.get("category") or "").strip()
    limit = min(int(request.args.get("limit") or 60), 200)

    query = CropCatalog.query
    if search:
        pattern = f"%{search}%"
        query = query.filter(db.or_(
            CropCatalog.name.ilike(pattern),
            CropCatalog.scientific_name.ilike(pattern),
            CropCatalog.botanical_family.ilike(pattern),
            CropCatalog.uses.ilike(pattern),
        ))
    if category:
        query = query.filter(CropCatalog.category == category)
    crops = query.order_by(CropCatalog.name.asc()).limit(limit).all()
    return jsonify([crop.to_dict() for crop in crops])


@bp.get("/categories")
def categories():
    rows = db.session.query(CropCatalog.category).distinct().order_by(CropCatalog.category).all()
    return jsonify([row[0] for row in rows if row[0]])


@bp.get("/<int:crop_id>")
def crop_detail(crop_id):
    crop = db.session.get(CropCatalog, crop_id)
    if not crop:
        raise ApiError("Cultivo no encontrado.", 404)
    return jsonify(crop.to_dict())
