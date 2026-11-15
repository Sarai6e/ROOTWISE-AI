import json
from datetime import date

from flask import Blueprint, jsonify

from extensions import db
from models import CropCatalog, SimulationResult, SimulationRun
from services import nasa_power
from services.rotation import RULESET_VERSION
from services.suitability import evaluate_crop
from .utils import ApiError, audit, current_user, get_parcel, parse_date, payload

bp = Blueprint("simulations", __name__)


def _latest_soil(parcel):
    return parcel.soil_analyses[0].to_dict() if parcel.soil_analyses else None


def _context(parcel, sowing_date):
    climate = nasa_power.get_climate(parcel.centroid_lat, parcel.centroid_lon)
    soil = _latest_soil(parcel)
    history = [
        {"family": item.family, "year": item.year, "crop_name": item.crop.name if item.crop else None}
        for item in parcel.crop_history
    ]
    parcel_data = {
        "id": parcel.id,
        "name": parcel.name,
        "elevation_m": parcel.elevation_m,
        "slope_pct": parcel.slope_pct,
        "water_available": parcel.water_available,
        "area_ha": round(parcel.area_ha, 3) if parcel.area_ha else None,
        "centroid_lat": parcel.centroid_lat,
        "centroid_lon": parcel.centroid_lon,
    }
    return parcel_data, climate, soil, history


@bp.post("/parcels/<int:parcel_id>/simulations")
def run_simulation(parcel_id):
    user = current_user()
    parcel = get_parcel(parcel_id, write=True)
    data = payload()

    crop_ids = data.get("crop_ids") or []
    if not isinstance(crop_ids, list) or not crop_ids:
        raise ApiError("Selecciona al menos un cultivo del catálogo.")
    if len(crop_ids) > 8:
        raise ApiError("Puedes comparar hasta 8 cultivos por simulación.")
    crops = CropCatalog.query.filter(CropCatalog.id.in_([int(item) for item in crop_ids])).all()
    if len(crops) != len(set(int(item) for item in crop_ids)):
        raise ApiError("Alguno de los cultivos no existe en el catálogo.", 404)

    sowing_date = parse_date(data.get("sowing_date"), "fecha de siembra") or date.today()

    parcel_data, climate, soil, history = _context(parcel, sowing_date)

    run = SimulationRun(
        parcel_id=parcel.id,
        user_id=user.id,
        sowing_date=sowing_date,
        ruleset_version=RULESET_VERSION,
        inputs_json=json.dumps({
            "parcel": parcel_data,
            "climate": climate,
            "soil": soil,
            "history": history,
            "sowing_date": sowing_date.isoformat(),
            "objective": data.get("objective") or "autoconsumo y mercado local",
            "ruleset_version": RULESET_VERSION,
        }, default=str),
    )
    db.session.add(run)
    db.session.flush()

    outputs = []
    for crop in crops:
        result = evaluate_crop(crop.to_dict(), parcel_data, soil, climate, history, sowing_date)
        outputs.append(result)
        db.session.add(SimulationResult(
            run_id=run.id,
            crop_id=crop.id,
            classification=result["classification"],
            score=result["score"],
            confidence=result["confidence"],
            limiting_factors_json=json.dumps(result["factors"], ensure_ascii=False),
            components_json=json.dumps(result["components"]),
            explanation=result["explanation"],
        ))

    audit("simulation.run", "parcel", parcel.id, crops=[crop.name for crop in crops])
    db.session.commit()

    response = run.to_dict(detailed=True)
    response["context"] = {
        "parcel": parcel_data,
        "soil": soil,
        "climate": {
            "available": climate.get("available"),
            "t2m_mean": climate.get("t2m_mean"),
            "rain_annual_mm": climate.get("rain_annual_mm"),
            "tmin_abs": climate.get("tmin_abs"),
            "tmax_abs": climate.get("tmax_abs"),
            "meta": climate.get("meta"),
            "period": climate.get("period"),
            "cached": climate.get("cached"),
        },
        "weights": {"clima": 0.30, "suelo": 0.20, "agua": 0.20, "terreno": 0.10, "calendario": 0.10, "rotación": 0.10},
        "ruleset_version": RULESET_VERSION,
        "disclaimer": (
            "Simulación con promedios satelitales y datos declarados. No es un pronóstico "
            "ni garantiza rendimiento; valida con un agrónomo local."
        ),
    }
    missing = sorted({item for result in outputs for item in result["missing"]})
    response["context"]["missing_data"] = missing
    return jsonify(response), 201


@bp.get("/simulations")
def list_simulations():
    from flask import request

    user = current_user()
    query = SimulationRun.query
    parcel_id = request.args.get("parcel_id")
    if parcel_id:
        parcel = get_parcel(int(parcel_id))
        query = query.filter(SimulationRun.parcel_id == parcel.id)
    elif user.role not in {"admin", "tecnico"}:
        from models import Farm, Parcel

        query = (
            query.join(Parcel, SimulationRun.parcel_id == Parcel.id)
            .join(Farm, Parcel.farm_id == Farm.id)
            .filter(Farm.user_id == user.id)
        )
    runs = query.order_by(SimulationRun.created_at.desc()).limit(30).all()
    return jsonify([run.to_dict() for run in runs])


@bp.get("/simulations/<int:run_id>")
def simulation_detail(run_id):
    run = db.session.get(SimulationRun, run_id)
    if not run:
        raise ApiError("Simulación no encontrada.", 404)
    get_parcel(run.parcel_id)
    return jsonify(run.to_dict(detailed=True))


@bp.delete("/simulations/<int:run_id>")
def delete_simulation(run_id):
    run = db.session.get(SimulationRun, run_id)
    if not run:
        raise ApiError("Simulación no encontrada.", 404)
    get_parcel(run.parcel_id, write=True)
    db.session.delete(run)
    audit("simulation.delete", "simulation", run_id)
    db.session.commit()
    return jsonify({"message": "Simulación eliminada."})
