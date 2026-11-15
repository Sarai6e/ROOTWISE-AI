from flask import Blueprint, jsonify, request

from extensions import db
from models import LeafDiagnosis, PestObservation
from services import leaf_model
from .utils import ApiError, audit, current_user, get_parcel, parse_date, payload

bp = Blueprint("health", __name__)

MAX_BYTES = 10 * 1024 * 1024


@bp.get("/health/capabilities")
def capabilities():
    return jsonify(leaf_model.capabilities())


@bp.post("/health/diagnose")
def diagnose():
    user = current_user()
    file = request.files.get("image")
    if not file or not file.filename:
        raise ApiError("Adjunta una imagen de la hoja en el campo 'image'.")
    blob = file.read(MAX_BYTES + 1)
    if not blob:
        raise ApiError("El archivo está vacío.")
    if len(blob) > MAX_BYTES:
        raise ApiError("La imagen supera 10 MB.", 413)

    try:
        predictions = leaf_model.predict(blob)
    except leaf_model.ModelUnavailable as error:
        raise ApiError(
            "El módulo de IA no está activo en este servidor. La app sigue funcionando sin él.",
            503, "ml_unavailable",
        ) from error
    except ValueError as error:
        raise ApiError(str(error), 422, "invalid_image") from error

    parcel_id = request.form.get("parcel_id")
    parcel = None
    if parcel_id:
        parcel = get_parcel(int(parcel_id), write=True)

    record = LeafDiagnosis(
        user_id=user.id,
        parcel_id=parcel.id if parcel else None,
        image_name=file.filename[:200],
        predictions_json=__import__("json").dumps(predictions, ensure_ascii=False),
        model_version=leaf_model.MODEL_VERSION,
    )
    db.session.add(record)
    audit("health.diagnose", "leaf_diagnosis", None, crop="tomate")
    db.session.commit()
    return jsonify({
        "id": record.id,
        "predictions": predictions,
        "model_version": record.model_version,
        "disclaimer": "Diagnóstico orientativo. Un agrónomo debe confirmar el manejo.",
        "mip": "Prioriza prevención, monitoreo y control cultural o biológico antes de un tratamiento químico.",
    }), 201


@bp.get("/health/observations")
def list_observations():
    user = current_user()
    query = PestObservation.query
    parcel_id = request.args.get("parcel_id")
    if parcel_id:
        query = query.filter(PestObservation.parcel_id == int(parcel_id))
    elif user.role not in {"admin", "tecnico"}:
        query = query.filter(PestObservation.user_id == user.id)
    rows = query.order_by(PestObservation.created_at.desc()).limit(100).all()
    return jsonify([row.to_dict() for row in rows])


@bp.post("/health/observations")
def create_observation():
    user = current_user()
    data = payload()
    parcel = get_parcel(int(data.get("parcel_id") or 0), write=True)
    symptoms = str(data.get("symptoms") or "").strip()
    if len(symptoms) < 5:
        raise ApiError("Describe los síntomas observados.")
    severity = str(data.get("severity") or "media").lower()
    if severity not in {"baja", "media", "alta"}:
        raise ApiError("Severidad inválida.")

    observation = PestObservation(
        user_id=user.id,
        parcel_id=parcel.id,
        campaign_id=int(data["campaign_id"]) if data.get("campaign_id") else None,
        observed_at=parse_date(data.get("observed_at"), "fecha de observación"),
        symptoms=symptoms,
        severity=severity,
        photo_name=(str(data.get("photo_name") or "")[:200] or None),
        notes=(data.get("notes") or None),
    )
    db.session.add(observation)
    audit("health.observation", "parcel", parcel.id)
    db.session.commit()
    return jsonify(observation.to_dict()), 201


@bp.delete("/health/observations/<int:observation_id>")
def delete_observation(observation_id):
    user = current_user()
    observation = db.session.get(PestObservation, observation_id)
    if not observation:
        raise ApiError("Observación no encontrada.", 404)
    get_parcel(observation.parcel_id, write=True)
    audit("health.observation_delete", "observation", observation.id)
    db.session.delete(observation)
    db.session.commit()
    return jsonify({"message": "Observación eliminada."})
