import re
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token

from extensions import db
from models import User
from .utils import ApiError, audit, current_user, parse_date, payload

bp = Blueprint("auth", __name__, url_prefix="/auth")

USERNAME_RE = re.compile(r"^[a-z0-9_.-]{3,40}$")


def _issue(user):
    token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
    return {"access_token": token, "user": user.to_dict(private=True)}


@bp.post("/register")
def register():
    data = payload()
    username = str(data.get("username") or "").strip().lower()
    password = str(data.get("password") or "")
    full_name = str(data.get("full_name") or "").strip()

    if not USERNAME_RE.match(username):
        raise ApiError("El usuario debe tener 3–40 caracteres: letras, números, punto, guion o guion bajo.")
    if len(password) < 8:
        raise ApiError("La contraseña debe tener al menos 8 caracteres.")
    if len(full_name) < 3:
        raise ApiError("Escribe tu nombre y apellido.")
    if User.query.filter_by(username=username).first():
        raise ApiError("Ese usuario ya existe. Elige otro.", 409, "username_taken")

    dni = data.get("dni")
    if dni not in (None, ""):
        dni = str(dni).strip()
        if not (dni.isdigit() and len(dni) == 8):
            raise ApiError("El DNI debe tener 8 dígitos (opcional).")

    user = User(
        username=username,
        full_name=full_name[:120],
        region=(data.get("region") or None),
        phone=(data.get("phone") or None),
        dni=dni or None,
        language=(data.get("language") or "es")[:10],
        role="agricultor",
    )
    user.set_password(password)
    db.session.add(user)
    db.session.flush()
    audit("user.register", "user", user.id)
    db.session.commit()
    return jsonify(_issue(user)), 201


@bp.post("/login")
def login():
    data = payload()
    username = str(data.get("username") or "").strip().lower()
    password = str(data.get("password") or "")
    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        raise ApiError("Usuario o contraseña incorrectos.", 401, "invalid_credentials")
    if user.status != "activo":
        raise ApiError("La cuenta está suspendida. Contacta al administrador.", 403, "account_inactive")
    user.last_login = datetime.now(timezone.utc)
    audit("user.login", "user", user.id)
    db.session.commit()
    return jsonify(_issue(user))


@bp.get("/me")
def me():
    user = current_user()
    data = user.to_dict(private=True)
    data["stats"] = {
        "farms": len(user.farms),
        "parcels": sum(len(farm.parcels) for farm in user.farms),
    }
    return jsonify(data)


@bp.patch("/me")
def update_me():
    user = current_user()
    data = payload()

    if "full_name" in data:
        name = str(data.get("full_name") or "").strip()
        if len(name) < 3:
            raise ApiError("Escribe un nombre válido.")
        user.full_name = name[:120]
    for field in ("region", "phone", "language"):
        if field in data:
            setattr(user, field, (str(data.get(field) or "")[:80] or None))
    if "dni" in data:
        dni = str(data.get("dni") or "").strip()
        if dni and not (dni.isdigit() and len(dni) == 8):
            raise ApiError("El DNI debe tener 8 dígitos.")
        user.dni = dni or None

    new_password = data.get("new_password")
    if new_password:
        if not user.check_password(str(data.get("current_password") or "")):
            raise ApiError("La contraseña actual no coincide.", 403, "invalid_password")
        if len(str(new_password)) < 8:
            raise ApiError("La nueva contraseña debe tener al menos 8 caracteres.")
        user.set_password(str(new_password))
        audit("user.password_change", "user", user.id)

    audit("user.update", "user", user.id)
    db.session.commit()
    return jsonify(user.to_dict(private=True))


@bp.post("/logout")
def logout():
    user = current_user()
    audit("user.logout", "user", user.id)
    db.session.commit()
    return jsonify({"message": "Sesión cerrada. El token deja de usarse en este dispositivo."})
