from flask import Blueprint, jsonify, request

from extensions import db
from models import User
from .utils import ApiError, audit, current_user, payload, role_required

bp = Blueprint("users", __name__, url_prefix="/users")

ROLES = {"agricultor", "tecnico", "admin"}
STATUSES = {"activo", "suspendido"}


@bp.get("")
@role_required("admin")
def list_users():
    search = (request.args.get("search") or "").strip().lower()
    query = User.query
    if search:
        query = query.filter(
            db.or_(User.username.ilike(f"%{search}%"), User.full_name.ilike(f"%{search}%"))
        )
    users = query.order_by(User.created_at.desc()).all()
    return jsonify([user.to_dict() for user in users])


@bp.get("/<int:user_id>")
@role_required("admin")
def get_user(user_id):
    user = db.session.get(User, user_id)
    if not user:
        raise ApiError("Usuario no encontrado.", 404)
    return jsonify(user.to_dict(private=True))


@bp.patch("/<int:user_id>")
@role_required("admin")
def update_user(user_id):
    admin = current_user()
    user = db.session.get(User, user_id)
    if not user:
        raise ApiError("Usuario no encontrado.", 404)
    data = payload()

    if "role" in data:
        role = str(data.get("role") or "")
        if role not in ROLES:
            raise ApiError("Rol inválido.")
        if user.id == admin.id and role != "admin":
            raise ApiError("No puedes quitarte el rol de administrador.", 409)
        user.role = role
    if "status" in data:
        status = str(data.get("status") or "")
        if status not in STATUSES:
            raise ApiError("Estado inválido.")
        if user.id == admin.id and status != "activo":
            raise ApiError("No puedes suspender tu propia cuenta.", 409)
        user.status = status
    if "full_name" in data:
        user.full_name = str(data.get("full_name") or user.full_name)[:120]

    audit("user.admin_update", "user", user.id, changes=list(data.keys()))
    db.session.commit()
    return jsonify(user.to_dict(private=True))


@bp.delete("/<int:user_id>")
@role_required("admin")
def delete_user(user_id):
    admin = current_user()
    if admin.id == user_id:
        raise ApiError("No puedes eliminar tu propia cuenta desde el panel.", 409)
    user = db.session.get(User, user_id)
    if not user:
        raise ApiError("Usuario no encontrado.", 404)
    audit("user.delete", "user", user.id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "Usuario eliminado junto con sus fincas y parcelas."})
