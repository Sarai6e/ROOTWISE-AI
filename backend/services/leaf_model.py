"""Diagnóstico orientativo de hojas con el modelo AgroVision (opcional)."""
import json
import threading
from pathlib import Path

from flask import current_app

ML_DIR = Path(__file__).resolve().parent.parent / "ml"
MODEL_PATH = ML_DIR / "agrovision_rgb.keras"
CLASSES_PATH = ML_DIR / "clases.json"
MODEL_VERSION = "agrovision-rgb-mobilenetv2-v1"
SIZE = (160, 160)

SPANISH = {
    "Tomato___Bacterial_spot": "Mancha bacteriana",
    "Tomato___Early_blight": "Tizón temprano",
    "Tomato___Late_blight": "Tizón tardío",
    "Tomato___Leaf_Mold": "Moho de la hoja",
    "Tomato___Septoria_leaf_spot": "Mancha foliar por septoria",
    "Tomato___Spider_mites Two-spotted_spider_mite": "Araña roja de dos manchas",
    "Tomato___Target_Spot": "Mancha diana",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": "Virus del rizado amarillo del tomate",
    "Tomato___Tomato_mosaic_virus": "Virus del mosaico del tomate",
    "Tomato___healthy": "Hoja sana",
}

MIP = {
    "Tomato___Bacterial_spot": "Retira hojas afectadas, evita mojar el follaje y desinfecta herramientas. Consulta manejo bacteriano con un técnico.",
    "Tomato___Early_blight": "Rota con cultivos no solanáceos, elimina restos y mejora la ventilación. Vigila el riego por goteo.",
    "Tomato___Late_blight": "Aísla la planta, reduce humedad foliar y consulta de inmediato por riesgo de propagación.",
    "Tomato___Leaf_Mold": "Aumenta ventilación y reduce humedad relativa. Retira hojas con síntomas.",
    "Tomato___Septoria_leaf_spot": "Retira hojas enfermas, evita salpicaduras y rota cultivos no solanáceos.",
    "Tomato___Spider_mites Two-spotted_spider_mite": "Monitorea el envés, favorece enemigos naturales y evita estrés hídrico.",
    "Tomato___Target_Spot": "Mejora ventilación, elimina restos de cultivo y consulta un plan de manejo integrado.",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": "Controla mosca blanca y elimina plantas muy afectadas. Usa material sano.",
    "Tomato___Tomato_mosaic_virus": "Desinfecta herramientas, elimina plantas sintomáticas y evita manejo con tabaco.",
    "Tomato___healthy": "Sin señales de las clases evaluadas. Mantén monitoreo, riego y nutrición equilibrados.",
}

_lock = threading.Lock()
_cache = {"model": None, "classes": None}


class ModelUnavailable(RuntimeError):
    pass


def _unavailable_reason():
    if not current_app.config.get("ML_ENABLED", True):
        return "El módulo de IA está desactivado en este servidor (ML_ENABLED=0)."
    if not MODEL_PATH.is_file():
        return f"Falta el modelo en {MODEL_PATH}."
    try:
        import tensorflow  # noqa: F401
    except Exception:  # noqa: BLE001
        return (
            "TensorFlow no está instalado en este entorno. "
            "Ejecuta: pip install -r backend/requirements-ml.txt"
        )
    return None


def available():
    return _unavailable_reason() is None


def capabilities():
    classes = []
    if CLASSES_PATH.is_file():
        classes = json.loads(CLASSES_PATH.read_text(encoding="utf-8"))
    return {
        "model_available": available(),
        "reason": _unavailable_reason(),
        "model_version": MODEL_VERSION,
        "classes": [{"class": item, "label": SPANISH.get(item, item)} for item in classes],
        "metrics": {"f1_macro": 0.88298, "accuracy": 0.91426, "test_set": "PlantVillage"},
        "disclaimer": "Triage orientativo: no sustituye el diagnóstico de un agrónomo.",
    }


def _load():
    if _cache["model"] is not None:
        return _cache["model"], _cache["classes"]
    if not available():
        raise ModelUnavailable("El modelo no está disponible en este entorno.")
    from tensorflow import keras

    classes = json.loads(CLASSES_PATH.read_text(encoding="utf-8"))
    model = keras.models.load_model(MODEL_PATH, compile=False)
    _cache["model"] = model
    _cache["classes"] = classes
    return model, classes


def predict(image_bytes):
    from io import BytesIO

    model, classes = _load()

    import numpy as np
    from PIL import Image, ImageOps, UnidentifiedImageError

    try:
        with Image.open(BytesIO(image_bytes)) as photo:
            if photo.width * photo.height > 32_000_000:
                raise ValueError("La imagen excede 32 megapíxeles.")
            rgb = ImageOps.exif_transpose(photo).convert("RGB")
            array = np.asarray(rgb.resize(SIZE, Image.Resampling.BILINEAR), dtype=np.float32)
    except (UnidentifiedImageError, OSError) as error:
        raise ValueError("No se pudo abrir la imagen. Usa JPG, PNG o WebP.") from error

    with _lock:
        scores = np.asarray(model(array[None, ...], training=False))[0]
    order = scores.argsort()[-3:][::-1]
    return [
        {
            "class": classes[index],
            "label": SPANISH.get(classes[index], classes[index]),
            "score": round(float(scores[index]), 4),
            "advice": MIP.get(classes[index], ""),
        }
        for index in order
    ]
