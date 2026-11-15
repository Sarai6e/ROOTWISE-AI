import json
from datetime import datetime, timezone

from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db


def utcnow():
    return datetime.now(timezone.utc)


def iso(value):
    return value.isoformat() if value else None


class TimestampMixin:
    created_at = db.Column(db.DateTime, default=utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow, nullable=False)


class User(TimestampMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(40), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), default="agricultor", nullable=False)
    region = db.Column(db.String(80))
    phone = db.Column(db.String(20))
    dni = db.Column(db.String(8))
    language = db.Column(db.String(10), default="es", nullable=False)
    status = db.Column(db.String(20), default="activo", nullable=False)
    last_login = db.Column(db.DateTime)

    farms = db.relationship("Farm", back_populates="owner", cascade="all, delete-orphan")

    def set_password(self, raw):
        self.password_hash = generate_password_hash(raw)

    def check_password(self, raw):
        return check_password_hash(self.password_hash, raw)

    def to_dict(self, private=False):
        data = {
            "id": self.id,
            "username": self.username,
            "full_name": self.full_name,
            "role": self.role,
            "region": self.region,
            "language": self.language,
            "status": self.status,
            "created_at": iso(self.created_at),
            "last_login": iso(self.last_login),
        }
        if private:
            data["phone"] = self.phone
            data["dni"] = self.dni
        return data


class Farm(TimestampMixin, db.Model):
    __tablename__ = "farms"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    locality = db.Column(db.String(160))
    notes = db.Column(db.Text)

    owner = db.relationship("User", back_populates="farms")
    parcels = db.relationship("Parcel", back_populates="farm", cascade="all, delete-orphan")

    def to_dict(self, with_parcels=False):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "locality": self.locality,
            "notes": self.notes,
            "created_at": iso(self.created_at),
            "updated_at": iso(self.updated_at),
        }
        if with_parcels:
            data["parcels"] = [parcel.to_dict() for parcel in self.parcels]
        return data


class Parcel(TimestampMixin, db.Model):
    __tablename__ = "parcels"

    id = db.Column(db.Integer, primary_key=True)
    farm_id = db.Column(db.Integer, db.ForeignKey("farms.id"), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    geometry_json = db.Column(db.Text, nullable=False)
    area_ha = db.Column(db.Float)
    centroid_lat = db.Column(db.Float)
    centroid_lon = db.Column(db.Float)
    elevation_m = db.Column(db.Float)
    slope_pct = db.Column(db.Float)
    water_available = db.Column(db.String(10), default="media")
    irrigation_type = db.Column(db.String(40))
    notes = db.Column(db.Text)

    farm = db.relationship("Farm", back_populates="parcels")
    soil_analyses = db.relationship(
        "SoilAnalysis", back_populates="parcel", cascade="all, delete-orphan",
        order_by="SoilAnalysis.sample_date.desc()",
    )
    crop_history = db.relationship(
        "ParcelCropHistory", back_populates="parcel", cascade="all, delete-orphan"
    )
    campaigns = db.relationship(
        "CropCampaign", back_populates="parcel", cascade="all, delete-orphan"
    )
    simulations = db.relationship(
        "SimulationRun", back_populates="parcel", cascade="all, delete-orphan"
    )

    def geometry(self):
        return json.loads(self.geometry_json) if self.geometry_json else None

    def to_dict(self, detailed=False):
        data = {
            "id": self.id,
            "farm_id": self.farm_id,
            "farm_name": self.farm.name if self.farm else None,
            "name": self.name,
            "geometry": self.geometry(),
            "area_ha": round(self.area_ha, 4) if self.area_ha is not None else None,
            "centroid_lat": self.centroid_lat,
            "centroid_lon": self.centroid_lon,
            "elevation_m": self.elevation_m,
            "slope_pct": self.slope_pct,
            "water_available": self.water_available,
            "irrigation_type": self.irrigation_type,
            "notes": self.notes,
            "created_at": iso(self.created_at),
            "updated_at": iso(self.updated_at),
        }
        if detailed:
            data["soil"] = [item.to_dict() for item in self.soil_analyses]
            data["crop_history"] = [item.to_dict() for item in self.crop_history]
            data["campaigns"] = [item.to_dict() for item in self.campaigns]
            data["simulations"] = [item.to_dict() for item in self.simulations[:10]]
        return data


class ParcelCropHistory(TimestampMixin, db.Model):
    __tablename__ = "parcel_crop_history"

    id = db.Column(db.Integer, primary_key=True)
    parcel_id = db.Column(db.Integer, db.ForeignKey("parcels.id"), nullable=False, index=True)
    crop_id = db.Column(db.Integer, db.ForeignKey("crop_catalog.id"), nullable=False)
    family = db.Column(db.String(60))
    year = db.Column(db.Integer, nullable=False)
    season = db.Column(db.String(30))
    notes = db.Column(db.Text)

    parcel = db.relationship("Parcel", back_populates="crop_history")
    crop = db.relationship("CropCatalog")

    def to_dict(self):
        return {
            "id": self.id,
            "parcel_id": self.parcel_id,
            "crop_id": self.crop_id,
            "crop_name": self.crop.name if self.crop else None,
            "family": self.family,
            "year": self.year,
            "season": self.season,
            "notes": self.notes,
        }


class SoilAnalysis(TimestampMixin, db.Model):
    __tablename__ = "soil_analyses"

    id = db.Column(db.Integer, primary_key=True)
    parcel_id = db.Column(db.Integer, db.ForeignKey("parcels.id"), nullable=False, index=True)
    source_type = db.Column(db.String(20), default="declarado")
    ph = db.Column(db.Float)
    texture = db.Column(db.String(40))
    organic_matter_pct = db.Column(db.Float)
    ec_ds_m = db.Column(db.Float)
    n_ppm = db.Column(db.Float)
    p_ppm = db.Column(db.Float)
    k_ppm = db.Column(db.Float)
    lab_name = db.Column(db.String(120))
    sample_date = db.Column(db.Date)
    notes = db.Column(db.Text)

    parcel = db.relationship("Parcel", back_populates="soil_analyses")

    def to_dict(self):
        return {
            "id": self.id,
            "parcel_id": self.parcel_id,
            "source_type": self.source_type,
            "ph": self.ph,
            "texture": self.texture,
            "organic_matter_pct": self.organic_matter_pct,
            "ec_ds_m": self.ec_ds_m,
            "n_ppm": self.n_ppm,
            "p_ppm": self.p_ppm,
            "k_ppm": self.k_ppm,
            "lab_name": self.lab_name,
            "sample_date": self.sample_date.isoformat() if self.sample_date else None,
            "notes": self.notes,
            "created_at": iso(self.created_at),
        }


class CropCatalog(TimestampMixin, db.Model):
    __tablename__ = "crop_catalog"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(90), unique=True, nullable=False, index=True)
    scientific_name = db.Column(db.String(140))
    botanical_family = db.Column(db.String(80), index=True)
    category = db.Column(db.String(50), index=True)
    cycle_days = db.Column(db.Integer)
    temp_min = db.Column(db.Float)
    temp_max = db.Column(db.Float)
    rain_min_mm = db.Column(db.Float)
    rain_max_mm = db.Column(db.Float)
    alt_min_m = db.Column(db.Float)
    alt_max_m = db.Column(db.Float)
    ph_min = db.Column(db.Float)
    ph_max = db.Column(db.Float)
    water_need = db.Column(db.String(10), default="medio")
    planting_months = db.Column(db.Text)
    uses = db.Column(db.String(200))
    source = db.Column(db.String(200))
    source_version = db.Column(db.String(40))
    confidence = db.Column(db.Float, default=0.7)
    notes = db.Column(db.Text)

    def months(self):
        try:
            return json.loads(self.planting_months or "[]")
        except ValueError:
            return []

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "scientific_name": self.scientific_name,
            "botanical_family": self.botanical_family,
            "category": self.category,
            "cycle_days": self.cycle_days,
            "temp_min": self.temp_min,
            "temp_max": self.temp_max,
            "rain_min_mm": self.rain_min_mm,
            "rain_max_mm": self.rain_max_mm,
            "alt_min_m": self.alt_min_m,
            "alt_max_m": self.alt_max_m,
            "ph_min": self.ph_min,
            "ph_max": self.ph_max,
            "water_need": self.water_need,
            "planting_months": self.months(),
            "uses": self.uses,
            "source": self.source,
            "source_version": self.source_version,
            "confidence": self.confidence,
            "notes": self.notes,
        }


class CropRotationRule(TimestampMixin, db.Model):
    __tablename__ = "crop_rotation_rules"

    id = db.Column(db.Integer, primary_key=True)
    family = db.Column(db.String(80), nullable=False)
    previous_family = db.Column(db.String(80), nullable=False)
    min_interval_years = db.Column(db.Integer, default=2)
    risk_level = db.Column(db.String(20), default="medio")
    note = db.Column(db.String(300))
    version = db.Column(db.String(20), default="1.0.0")

    def to_dict(self):
        return {
            "id": self.id,
            "family": self.family,
            "previous_family": self.previous_family,
            "min_interval_years": self.min_interval_years,
            "risk_level": self.risk_level,
            "note": self.note,
            "version": self.version,
        }


class CropCampaign(TimestampMixin, db.Model):
    __tablename__ = "crop_campaigns"

    id = db.Column(db.Integer, primary_key=True)
    parcel_id = db.Column(db.Integer, db.ForeignKey("parcels.id"), nullable=False, index=True)
    crop_id = db.Column(db.Integer, db.ForeignKey("crop_catalog.id"), nullable=False)
    planned_sowing = db.Column(db.Date)
    actual_sowing = db.Column(db.Date)
    status = db.Column(db.String(20), default="planificada")
    target_harvest = db.Column(db.Date)
    notes = db.Column(db.Text)

    parcel = db.relationship("Parcel", back_populates="campaigns")
    crop = db.relationship("CropCatalog")
    events = db.relationship(
        "CropEvent", back_populates="campaign", cascade="all, delete-orphan",
        order_by="CropEvent.event_date.asc()",
    )

    def to_dict(self, with_events=False):
        data = {
            "id": self.id,
            "parcel_id": self.parcel_id,
            "parcel_name": self.parcel.name if self.parcel else None,
            "crop_id": self.crop_id,
            "crop_name": self.crop.name if self.crop else None,
            "crop_family": self.crop.botanical_family if self.crop else None,
            "cycle_days": self.crop.cycle_days if self.crop else None,
            "planned_sowing": self.planned_sowing.isoformat() if self.planned_sowing else None,
            "actual_sowing": self.actual_sowing.isoformat() if self.actual_sowing else None,
            "status": self.status,
            "target_harvest": self.target_harvest.isoformat() if self.target_harvest else None,
            "notes": self.notes,
            "created_at": iso(self.created_at),
        }
        if with_events:
            data["events"] = [event.to_dict() for event in self.events]
        return data


class CropEvent(TimestampMixin, db.Model):
    __tablename__ = "crop_events"

    id = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(
        db.Integer, db.ForeignKey("crop_campaigns.id"), nullable=False, index=True
    )
    event_type = db.Column(db.String(30), nullable=False)
    event_date = db.Column(db.Date, nullable=False)
    description = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"))

    campaign = db.relationship("CropCampaign", back_populates="events")

    def to_dict(self):
        return {
            "id": self.id,
            "campaign_id": self.campaign_id,
            "event_type": self.event_type,
            "event_date": self.event_date.isoformat() if self.event_date else None,
            "description": self.description,
            "user_id": self.user_id,
            "created_at": iso(self.created_at),
        }


class SimulationRun(TimestampMixin, db.Model):
    __tablename__ = "simulation_runs"

    id = db.Column(db.Integer, primary_key=True)
    parcel_id = db.Column(db.Integer, db.ForeignKey("parcels.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    sowing_date = db.Column(db.Date)
    inputs_json = db.Column(db.Text)
    ruleset_version = db.Column(db.String(20), default="1.0.0")

    parcel = db.relationship("Parcel", back_populates="simulations")
    results = db.relationship(
        "SimulationResult", back_populates="run", cascade="all, delete-orphan"
    )

    def to_dict(self, detailed=False):
        data = {
            "id": self.id,
            "parcel_id": self.parcel_id,
            "parcel_name": self.parcel.name if self.parcel else None,
            "user_id": self.user_id,
            "sowing_date": self.sowing_date.isoformat() if self.sowing_date else None,
            "ruleset_version": self.ruleset_version,
            "created_at": iso(self.created_at),
            "results": [result.to_dict() for result in self.results],
        }
        if detailed:
            data["inputs"] = json.loads(self.inputs_json or "{}")
        return data


class SimulationResult(TimestampMixin, db.Model):
    __tablename__ = "simulation_results"

    id = db.Column(db.Integer, primary_key=True)
    run_id = db.Column(db.Integer, db.ForeignKey("simulation_runs.id"), nullable=False, index=True)
    crop_id = db.Column(db.Integer, db.ForeignKey("crop_catalog.id"), nullable=False)
    classification = db.Column(db.String(40), nullable=False)
    score = db.Column(db.Float)
    limiting_factors_json = db.Column(db.Text)
    explanation = db.Column(db.Text)
    confidence = db.Column(db.Float)
    components_json = db.Column(db.Text)

    run = db.relationship("SimulationRun", back_populates="results")
    crop = db.relationship("CropCatalog")

    def factors(self):
        try:
            return json.loads(self.limiting_factors_json or "[]")
        except ValueError:
            return []

    def components(self):
        try:
            return json.loads(self.components_json or "{}")
        except ValueError:
            return {}

    def to_dict(self):
        return {
            "id": self.id,
            "run_id": self.run_id,
            "crop_id": self.crop_id,
            "crop_name": self.crop.name if self.crop else None,
            "crop_family": self.crop.botanical_family if self.crop else None,
            "classification": self.classification,
            "score": self.score,
            "confidence": self.confidence,
            "factors": self.factors(),
            "components": self.components(),
            "explanation": self.explanation,
        }


class ClimateCache(TimestampMixin, db.Model):
    __tablename__ = "climate_cache"

    id = db.Column(db.Integer, primary_key=True)
    lat_key = db.Column(db.Float, nullable=False, index=True)
    lon_key = db.Column(db.Float, nullable=False, index=True)
    period_start = db.Column(db.Date, nullable=False)
    period_end = db.Column(db.Date, nullable=False)
    payload_json = db.Column(db.Text, nullable=False)
    fetched_at = db.Column(db.DateTime, default=utcnow, nullable=False)


class LeafDiagnosis(TimestampMixin, db.Model):
    __tablename__ = "leaf_diagnoses"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    parcel_id = db.Column(db.Integer, db.ForeignKey("parcels.id"))
    image_name = db.Column(db.String(200))
    predictions_json = db.Column(db.Text)
    model_version = db.Column(db.String(40))
    notes = db.Column(db.Text)

    def predictions(self):
        try:
            return json.loads(self.predictions_json or "[]")
        except ValueError:
            return []

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "parcel_id": self.parcel_id,
            "image_name": self.image_name,
            "predictions": self.predictions(),
            "model_version": self.model_version,
            "notes": self.notes,
            "created_at": iso(self.created_at),
        }


class PestObservation(TimestampMixin, db.Model):
    __tablename__ = "pest_observations"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    parcel_id = db.Column(db.Integer, db.ForeignKey("parcels.id"), nullable=False, index=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey("crop_campaigns.id"))
    observed_at = db.Column(db.Date)
    symptoms = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(20), default="media")
    photo_name = db.Column(db.String(200))
    notes = db.Column(db.Text)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "parcel_id": self.parcel_id,
            "campaign_id": self.campaign_id,
            "observed_at": self.observed_at.isoformat() if self.observed_at else None,
            "symptoms": self.symptoms,
            "severity": self.severity,
            "photo_name": self.photo_name,
            "notes": self.notes,
            "created_at": iso(self.created_at),
        }


class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True)
    actor_id = db.Column(db.Integer, db.ForeignKey("users.id"))
    action = db.Column(db.String(60), nullable=False)
    entity_type = db.Column(db.String(40))
    entity_id = db.Column(db.Integer)
    metadata_json = db.Column(db.Text)
    occurred_at = db.Column(db.DateTime, default=utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "actor_id": self.actor_id,
            "action": self.action,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "metadata": json.loads(self.metadata_json or "{}"),
            "occurred_at": iso(self.occurred_at),
        }
