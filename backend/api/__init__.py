from . import admin, auth, campaigns, climate, crops, farms, health, nasa, parcels, reports, simulations, soil, users


def register_blueprints(app):
    for module in (
        auth, users, farms, parcels, soil, crops, simulations,
        campaigns, climate, health, reports, admin, nasa,
    ):
        prefix = module.bp.url_prefix or ""
        app.register_blueprint(module.bp, url_prefix=f"/api{prefix}")
