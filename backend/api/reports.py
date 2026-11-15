from flask import Blueprint, send_file

from services import nasa_power
from services.pdf import build_parcel_report
from .utils import current_user, get_parcel

bp = Blueprint("reports", __name__)


@bp.get("/parcels/<int:parcel_id>/report.pdf")
def parcel_report(parcel_id):
    user = current_user()
    parcel = get_parcel(parcel_id)
    climate = nasa_power.get_climate(parcel.centroid_lat, parcel.centroid_lon)
    last_run = parcel.simulations[0] if parcel.simulations else None
    simulations = [item.to_dict() for item in last_run.results] if last_run else []
    buffer = build_parcel_report(
        parcel.to_dict(), climate, simulations,
        {"full_name": user.full_name, "username": user.username},
    )
    filename = f"rootwise-{parcel.id}-{parcel.name.replace(' ', '-').lower()}.pdf"
    return send_file(
        buffer, mimetype="application/pdf", as_attachment=True,
        download_name=filename, max_age=0,
    )
