import os
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)


def default_database_uri():
    path = (DATA_DIR / "rootwise.db").as_posix()
    return f"sqlite:///{path}"


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "rootwise-dev-secret-change-me")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)

    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", default_database_uri())
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    JSON_SORT_KEYS = False
    MAX_CONTENT_LENGTH = 12 * 1024 * 1024

    ML_ENABLED = os.environ.get("ML_ENABLED", "1") == "1"
    AUTO_SEED = os.environ.get("AUTO_SEED", "1") == "1"
    NASA_POWER_TIMEOUT = int(os.environ.get("NASA_POWER_TIMEOUT", "20"))
    CLIMATE_CACHE_HOURS = int(os.environ.get("CLIMATE_CACHE_HOURS", "24"))

    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")
    FRONTEND_DIST = Path(
        os.environ.get("FRONTEND_DIST", BASE_DIR.parent / "frontend" / "dist")
    )
