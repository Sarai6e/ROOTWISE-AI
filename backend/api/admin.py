from flask import Blueprint, jsonify, request

from extensions import db
from models import AuditLog, CropCatalog, Farm, LeafDiagnosis, Parcel, SimulationRun, User
from .utils import current_user, role_required

bp = Blueprint("admin", __name__, url_prefix="/admin")


@bp.get("/stats")
@role_required("admin")
def stats():
    return jsonify({
        "users": User.query.count(),
        "admins": User.query.filter_by(role="admin").count(),
        "farms": Farm.query.count(),
        "parcels": Parcel.query.count(),
        "hectares": round(
            db.session.query(db.func.coalesce(db.func.sum(Parcel.area_ha), 0)).scalar(), 2
        ),
        "crops": CropCatalog.query.count(),
        "simulations": SimulationRun.query.count(),
        "diagnoses": LeafDiagnosis.query.count(),
        "users_by_role": {
            role: User.query.filter_by(role=role).count()
            for role in ("agricultor", "tecnico", "admin")
        },
    })


@bp.get("/audit")
@role_required("admin")
def audit():
    limit = min(int(request.args.get("limit") or 50), 200)
    rows = AuditLog.query.order_by(AuditLog.occurred_at.desc()).limit(limit).all()
    return jsonify([row.to_dict() for row in rows])


@bp.get("/me")
def whoami():
    return jsonify(current_user().to_dict(private=True))
