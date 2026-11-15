from datetime import date
from functools import wraps

from flask import request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from extensions import db
from models import AuditLog, Farm, Parcel, User


class ApiError(Exception):
    def __init__(self, message, status=400, code=None):
        super().__init__(message)
        self.message = message
        self.status = status
        self.code = code

    def to_dict(self):
        data = {"error": self.message}
        if self.code:
            data["code"] = self.code
        return data


def payload():
    return request.get_json(silent=True) or {}


def current_user():
    verify_jwt_in_request()
    identity = get_jwt_identity()
    if identity is None:
        raise ApiError("Se requiere iniciar sesión.", 401, "auth_required")
    user = db.session.get(User, int(identity))
    if not user or user.status != "activo":
        raise ApiError("La cuenta no está activa.", 403, "account_inactive")
    return user


def role_required(*roles):
    def decorator(function):
        @wraps(function)
        def wrapper(*args, **kwargs):
            user = current_user()
            if roles and user.role not in roles:
                raise ApiError("No tienes permisos para esta acción.", 403, "forbidden")
            return function(*args, **kwargs)

        return wrapper

    return decorator


def get_farm(farm_id, write=False):
    farm = db.session.get(Farm, farm_id)
    if not farm:
        raise ApiError("Finca no encontrada.", 404, "farm_not_found")
    user = current_user()
    if user.role == "admin":
        return farm
    if farm.user_id == user.id:
        return farm
    if user.role == "tecnico" and not write:
        return farm
    raise ApiError("No tienes acceso a esta finca.", 403, "forbidden")


def get_parcel(parcel_id, write=False):
    parcel = db.session.get(Parcel, parcel_id)
    if not parcel:
        raise ApiError("Parcela no encontrada.", 404, "parcel_not_found")
    user = current_user()
    if user.role == "admin":
        return parcel
    if parcel.farm and parcel.farm.user_id == user.id:
        return parcel
    if user.role == "tecnico" and not write:
        return parcel
    raise ApiError("No tienes acceso a esta parcela.", 403, "forbidden")


def parse_date(value, field="fecha", required=False):
    if value in (None, ""):
        if required:
            raise ApiError(f"Falta {field}.")
        return None
    if isinstance(value, date):
        return value
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError as error:
        raise ApiError(f"{field} debe usar el formato AAAA-MM-DD.") from error


def parse_float(value, field, low=None, high=None):
    if value in (None, ""):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError) as error:
        raise ApiError(f"{field} debe ser numérico.") from error
    if low is not None and number < low or high is not None and number > high:
        raise ApiError(f"{field} está fuera de rango.")
    return number


def audit(action, entity_type=None, entity_id=None, **metadata):
    user = None
    try:
        identity = get_jwt_identity()
        user = db.session.get(User, int(identity)) if identity else None
    except Exception:  # noqa: BLE001
        user = None
    db.session.add(AuditLog(
        actor_id=user.id if user else None,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        metadata_json=__import__("json").dumps(metadata, default=str),
    ))
