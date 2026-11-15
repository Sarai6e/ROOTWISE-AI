from datetime import timedelta

from flask import Blueprint, jsonify, request

from extensions import db
from models import CropCampaign, CropCatalog, CropEvent
from .utils import ApiError, audit, current_user, get_parcel, parse_date, payload

bp = Blueprint("campaigns", __name__)

STATUSES = {"planificada", "en_curso", "cosechada", "cancelada"}
EVENT_TYPES = {"siembra", "riego", "fertilizacion", "labor", "observacion", "cosecha", "sanidad"}


def _campaign(campaign_id, write=False):
    campaign = db.session.get(CropCampaign, campaign_id)
    if not campaign:
        raise ApiError("Campaña no encontrada.", 404)
    get_parcel(campaign.parcel_id, write=write)
    return campaign


@bp.post("/parcels/<int:parcel_id>/campaigns")
def create_campaign(parcel_id):
    parcel = get_parcel(parcel_id, write=True)
    data = payload()
    crop = db.session.get(CropCatalog, int(data.get("crop_id") or 0))
    if not crop:
        raise ApiError("Cultivo no encontrado.", 404)

    planned = parse_date(data.get("planned_sowing"), "fecha de siembra planificada")
    actual = parse_date(data.get("actual_sowing"), "fecha de siembra real")
    if actual and not planned:
        planned = actual
    if not planned:
        raise ApiError("Indica la fecha de siembra planificada.")

    campaign = CropCampaign(
        parcel_id=parcel.id,
        crop_id=crop.id,
        planned_sowing=planned,
        actual_sowing=actual,
        status="en_curso" if actual else "planificada",
        target_harvest=parse_date(data.get("target_harvest"), "fecha de cosecha") or (
            planned + timedelta(days=crop.cycle_days) if crop.cycle_days else None
        ),
        notes=(data.get("notes") or None),
    )
    db.session.add(campaign)
    db.session.flush()
    if actual:
        db.session.add(CropEvent(
            campaign_id=campaign.id, event_type="siembra", event_date=actual,
            description="Siembra confirmada", user_id=current_user().id,
        ))
    audit("campaign.create", "parcel", parcel.id, campaign=campaign.id, crop=crop.name)
    db.session.commit()
    return jsonify(campaign.to_dict(with_events=True)), 201


@bp.get("/campaigns")
def list_campaigns():
    user = current_user()
    from models import Farm, Parcel

    query = CropCampaign.query.join(Parcel).join(Farm)
    if user.role not in {"admin", "tecnico"}:
        query = query.filter(Farm.user_id == user.id)
    parcel_id = request.args.get("parcel_id")
    if parcel_id:
        query = query.filter(CropCampaign.parcel_id == int(parcel_id))
    campaigns = query.order_by(CropCampaign.planned_sowing.desc()).limit(100).all()
    return jsonify([campaign.to_dict() for campaign in campaigns])


@bp.get("/campaigns/<int:campaign_id>")
def campaign_detail(campaign_id):
    campaign = _campaign(campaign_id)
    data = campaign.to_dict(with_events=True)
    data["parcel"] = campaign.parcel.to_dict()
    return jsonify(data)


@bp.patch("/campaigns/<int:campaign_id>")
def update_campaign(campaign_id):
    campaign = _campaign(campaign_id, write=True)
    data = payload()

    if "planned_sowing" in data:
        campaign.planned_sowing = parse_date(data.get("planned_sowing"), "fecha planificada")
    if "actual_sowing" in data:
        campaign.actual_sowing = parse_date(data.get("actual_sowing"), "fecha real")
        if campaign.actual_sowing and campaign.status == "planificada":
            campaign.status = "en_curso"
    if "target_harvest" in data:
        campaign.target_harvest = parse_date(data.get("target_harvest"), "cosecha")
    if "status" in data:
        status = str(data.get("status") or "")
        if status not in STATUSES:
            raise ApiError("Estado de campaña inválido.")
        campaign.status = status
    if "notes" in data:
        campaign.notes = data.get("notes")

    audit("campaign.update", "campaign", campaign.id)
    db.session.commit()
    return jsonify(campaign.to_dict(with_events=True))


@bp.delete("/campaigns/<int:campaign_id>")
def delete_campaign(campaign_id):
    campaign = _campaign(campaign_id, write=True)
    db.session.delete(campaign)
    audit("campaign.delete", "campaign", campaign_id)
    db.session.commit()
    return jsonify({"message": "Campaña eliminada con sus eventos."})


@bp.post("/campaigns/<int:campaign_id>/events")
def add_event(campaign_id):
    campaign = _campaign(campaign_id, write=True)
    data = payload()
    event_type = str(data.get("event_type") or "")
    if event_type not in EVENT_TYPES:
        raise ApiError("Tipo de evento inválido.")
    event_date = parse_date(data.get("event_date"), "fecha del evento", required=True)
    description = str(data.get("description") or "").strip()
    if not description:
        raise ApiError("Describe el evento.")

    event = CropEvent(
        campaign_id=campaign.id,
        event_type=event_type,
        event_date=event_date,
        description=description,
        user_id=current_user().id,
    )
    db.session.add(event)
    audit("campaign.event_add", "campaign", campaign.id, event_type=event_type)
    db.session.commit()
    return jsonify(event.to_dict()), 201


@bp.delete("/campaigns/<int:campaign_id>/events/<int:event_id>")
def delete_event(campaign_id, event_id):
    campaign = _campaign(campaign_id, write=True)
    event = db.session.get(CropEvent, event_id)
    if not event or event.campaign_id != campaign.id:
        raise ApiError("Evento no encontrado.", 404)
    db.session.delete(event)
    audit("campaign.event_delete", "campaign", campaign.id, event=event_id)
    db.session.commit()
    return jsonify({"message": "Evento eliminado."})
