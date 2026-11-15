import json
from datetime import date
from pathlib import Path

import click
from flask.cli import with_appcontext

from extensions import db
from models import (
    CropCatalog, CropRotationRule, Farm, Parcel, ParcelCropHistory, SoilAnalysis, User,
)
from services import geo

DATA_DIR = Path(__file__).resolve().parent / "data"


def seed_catalog():
    if CropCatalog.query.count() > 0:
        return 0
    crops = json.loads((DATA_DIR / "crops.seed.json").read_text(encoding="utf-8"))
    for item in crops:
        db.session.add(CropCatalog(
            name=item["name"],
            scientific_name=item.get("scientific_name"),
            botanical_family=item.get("botanical_family"),
            category=item.get("category"),
            cycle_days=item.get("cycle_days"),
            temp_min=item.get("temp_min"),
            temp_max=item.get("temp_max"),
            rain_min_mm=item.get("rain_min_mm"),
            rain_max_mm=item.get("rain_max_mm"),
            alt_min_m=item.get("alt_min_m"),
            alt_max_m=item.get("alt_max_m"),
            ph_min=item.get("ph_min"),
            ph_max=item.get("ph_max"),
            water_need=item.get("water_need", "medio"),
            planting_months=json.dumps(item.get("planting_months", [])),
            uses=item.get("uses"),
            source=item.get("source"),
            source_version=item.get("source_version", "2026.1"),
            confidence=item.get("confidence", 0.7),
            notes=item.get("notes"),
        ))
    rules = json.loads((DATA_DIR / "rotation_rules.json").read_text(encoding="utf-8"))
    for rule in rules:
        db.session.add(CropRotationRule(
            family=rule["family"],
            previous_family=rule["previous_family"],
            min_interval_years=rule.get("min_interval_years", 2),
            risk_level=rule.get("risk_level", "medio"),
            note=rule.get("note"),
        ))
    db.session.commit()
    return len(crops)


def _demo_geometry():
    ring = [
        [-76.3850, -12.6600],
        [-76.3800, -12.6600],
        [-76.3798, -12.6645],
        [-76.3849, -12.6647],
        [-76.3850, -12.6600],
    ]
    geometry = geo.normalize_geometry({"type": "Polygon", "coordinates": [ring]})
    return geometry, geo.summarize_geometry(geometry)


def seed_demo_users():
    if User.query.count() > 0:
        return 0
    admin = User(username="admin", full_name="Administrador ROOTWISE", role="admin", region="Lima")
    admin.set_password("rootwise2026")
    demo = User(
        username="demo", full_name="María Quispe", role="agricultor",
        region="Lima", language="es",
    )
    demo.set_password("rootwise2026")
    db.session.add_all([admin, demo])
    db.session.flush()

    farm = Farm(user_id=demo.id, name="Finca La Esperanza", locality="Cañete, Lima",
                notes="Finca demostrativa para el reto NASA Space Apps.")
    db.session.add(farm)
    db.session.flush()

    geometry, summary = _demo_geometry()
    parcel = Parcel(
        farm_id=farm.id,
        name="Parcela Norte",
        geometry_json=json.dumps(geometry),
        area_ha=summary["area_ha"],
        centroid_lat=summary["centroid_lat"],
        centroid_lon=summary["centroid_lon"],
        elevation_m=150,
        slope_pct=4,
        water_available="media",
        irrigation_type="gravedad",
        notes="Suelo franco con riego por gravedad.",
    )
    db.session.add(parcel)
    db.session.flush()

    db.session.add(SoilAnalysis(
        parcel_id=parcel.id, source_type="laboratorio", ph=6.4, texture="franco",
        organic_matter_pct=2.1, ec_ds_m=1.2, n_ppm=28, p_ppm=18, k_ppm=190,
        lab_name="Laboratorio Agrario La Molina", sample_date=date(2026, 8, 12),
    ))
    crop_names = ["Papa", "Maíz amiláceo"]
    for index, crop_name in enumerate(crop_names):
        crop = CropCatalog.query.filter_by(name=crop_name).first()
        if crop:
            db.session.add(ParcelCropHistory(
                parcel_id=parcel.id, crop_id=crop.id, family=crop.botanical_family,
                year=2024 + index, season="campaña grande",
            ))
    db.session.commit()
    return 2


def seed_database(app=None):
    seeded = seed_catalog()
    users = seed_demo_users()
    if seeded:
        (app.logger.info if app else print)(f"Catálogo sembrado: {seeded} cultivos.")
    if users:
        (app.logger.info if app else print)(
            "Usuarios demo creados: admin / rootwise2026 y demo / rootwise2026"
        )
    return seeded + users


def register_cli(app):
    @app.cli.command("seed-db")
    @with_appcontext
    def seed_db_command():
        total = seed_database(app)
        click.echo(f"Seed completado: {total} registros nuevos.")

    @app.cli.command("create-admin")
    @click.option("--username", prompt=True)
    @click.option("--password", prompt=True, hide_input=True, confirmation_prompt=True)
    @click.option("--full-name", prompt="Nombre completo")
    @with_appcontext
    def create_admin_command(username, password, full_name):
        if User.query.filter_by(username=username.lower()).first():
            raise click.ClickException("Ese usuario ya existe.")
        user = User(username=username.lower(), full_name=full_name, role="admin")
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        click.echo(f"Administrador {user.username} creado.")
