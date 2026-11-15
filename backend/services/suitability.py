"""Motor de aptitud agronómica: filtros críticos + puntuación multicriterio explicable."""
from .rotation import RULESET_VERSION, rotation_assessment

WEIGHTS = {
    "climate": 0.30,
    "soil": 0.20,
    "water": 0.20,
    "terrain": 0.10,
    "calendar": 0.10,
    "rotation": 0.10,
}

WEIGHT_LABELS = {
    "climate": "Clima",
    "soil": "Suelo",
    "water": "Agua",
    "terrain": "Altitud y terreno",
    "calendar": "Calendario",
    "rotation": "Rotación",
}

CLASSIFICATION_LABELS = {
    "recomendable": "Recomendable",
    "viable_con_restricciones": "Viable con restricciones",
    "no_recomendado": "No recomendado",
    "riesgo_alto": "Riesgo alto",
    "informacion_insuficiente": "Información insuficiente",
}

SOURCE_NOTES = {
    "climate": "NASA POWER (promedio 5 años, ~50 km)",
    "soil": "Análisis registrado en la parcela",
    "water": "Disponibilidad declarada por el productor",
    "terrain": "Altitud registrada de la parcela",
    "calendar": "Calendario del catálogo de cultivos",
    "rotation": f"Reglas de rotación {RULESET_VERSION}",
}


def _clamp(value, low=0.0, high=1.0):
    return max(low, min(high, value))


def _range_score(value, low, high, tolerance):
    if value is None or low is None or high is None:
        return None
    if low <= value <= high:
        return 1.0
    distance = low - value if value < low else value - high
    return _clamp(1 - distance / tolerance)


def _factor(key, status, detail, label=None):
    return {
        "key": key,
        "label": label or WEIGHT_LABELS.get(key, key),
        "status": status,
        "detail": detail,
        "source": SOURCE_NOTES.get(key, ""),
    }


def _next_months(months):
    return {(month % 12) + 1 for month in months}


def evaluate_crop(crop, parcel, soil, climate, history, sowing_date):
    factors = []
    missing = []
    critical = []
    sowing_month = sowing_date.month

    elevation = parcel.get("elevation_m")
    alt_low, alt_high = crop.get("alt_min_m"), crop.get("alt_max_m")
    if elevation is None:
        missing.append("altitud")
        terrain_score = 0.5
        factors.append(_factor("terrain", "missing", "Falta la altitud de la parcela; no se puede verificar el rango del cultivo."))
    elif alt_low is not None and alt_high is not None and not (alt_low <= elevation <= alt_high):
        terrain_score = 0.0
        critical.append(f"Altitud {elevation:.0f} m fuera del rango {alt_low:.0f}–{alt_high:.0f} m.")
        factors.append(_factor("terrain", "critical", f"La parcela está a {elevation:.0f} m y el cultivo requiere {alt_low:.0f}–{alt_high:.0f} m."))
    else:
        terrain_score = 1.0
        factors.append(_factor("terrain", "ok", f"Altitud de {elevation:.0f} m compatible con el rango del cultivo."))

    slope = parcel.get("slope_pct")
    if slope is not None and slope > 25:
        terrain_score = min(terrain_score, 0.6)
        factors.append(_factor("terrain", "warning", f"Pendiente de {slope:.0f}%: alto riesgo de erosión; requiere curvas de nivel o terrazas."))

    if not climate or not climate.get("available"):
        missing.append("clima")
        climate_score = 0.5
        factors.append(_factor("climate", "missing", "Sin datos climáticos de NASA POWER para esta ubicación. El resultado baja de confianza."))
    else:
        temp_score = _range_score(
            climate.get("t2m_mean"), crop.get("temp_min"), crop.get("temp_max"), 10
        )
        rain_low, rain_high = crop.get("rain_min_mm"), crop.get("rain_max_mm")
        span = max(200.0, ((rain_high or 800) - (rain_low or 400)))
        rain_score = _range_score(climate.get("rain_annual_mm"), rain_low, rain_high, span)
        temp_score = 0.5 if temp_score is None else temp_score
        rain_score = 0.5 if rain_score is None else rain_score
        climate_score = _clamp(0.6 * temp_score + 0.4 * rain_score)

        tmin_abs = climate.get("tmin_abs")
        tmax_abs = climate.get("tmax_abs")
        highland = elevation is not None and elevation >= 2000
        if (
            tmin_abs is not None
            and crop.get("temp_min") is not None
            and tmin_abs < crop["temp_min"] - 2
            and highland
        ):
            critical.append(
                f"Temperatura mínima histórica de {tmin_abs:.1f} °C por debajo del umbral del cultivo."
            )
            factors.append(_factor("climate", "critical", f"Heladas históricas de {tmin_abs:.1f} °C; el cultivo tolera desde {crop['temp_min']:.1f} °C."))
        elif tmin_abs is not None and crop.get("temp_min") is not None and tmin_abs < crop["temp_min"] - 2:
            factors.append(_factor(
                "climate", "warning",
                f"La mínima histórica del píxel satelital es {tmin_abs:.1f} °C. A {elevation:.0f} m el "
                "dato puede incluir zonas altas cercanas; verifica heladas locales.",
            ))
        elif tmax_abs is not None and crop.get("temp_max") is not None and tmax_abs > crop["temp_max"] + 5:
            factors.append(_factor("climate", "warning", f"Máximas de {tmax_abs:.1f} °C pueden generar estrés térmico."))
        else:
            factors.append(_factor("climate", "ok", f"Temperatura media {climate.get('t2m_mean')} °C y lluvia anual {climate.get('rain_annual_mm')} mm dentro de lo esperado."))

        factors.append(_factor(
            "climate", "ok" if rain_score >= 0.6 else "warning",
            f"Precipitación anual estimada: {climate.get('rain_annual_mm')} mm.",
        ))

    ph = (soil or {}).get("ph")
    if ph is None:
        missing.append("suelo")
        soil_score = 0.5
        factors.append(_factor("soil", "missing", "No hay pH registrado. Un análisis de laboratorio mejora la recomendación."))
    else:
        ph_low, ph_high = crop.get("ph_min"), crop.get("ph_max")
        if ph_low is not None and ph_high is not None:
            if ph < ph_low - 0.8 or ph > ph_high + 0.8:
                soil_score = 0.0
                critical.append(f"pH {ph} fuera del rango tolerado ({ph_low}–{ph_high}).")
                factors.append(_factor("soil", "critical", f"pH {ph}: fuera del rango {ph_low}–{ph_high} del cultivo."))
            else:
                deviation = 0 if ph_low <= ph <= ph_high else min(abs(ph - ph_low), abs(ph - ph_high))
                soil_score = _clamp(1 - deviation / 1.5)
                status = "ok" if deviation == 0 else "warning"
                factors.append(_factor("soil", status, f"pH {ph} frente al rango {ph_low}–{ph_high}."))
        else:
            soil_score = 0.6
            factors.append(_factor("soil", "missing", "El cultivo no tiene rango de pH documentado en el catálogo."))
        organic = (soil or {}).get("organic_matter_pct")
        if organic is not None:
            bonus = 0.08 if organic >= 2 else -0.05 if organic < 1 else 0
            soil_score = _clamp(soil_score + bonus)
            factors.append(_factor("soil", "ok" if organic >= 1 else "warning", f"Materia orgánica: {organic}%."))

    availability = (parcel.get("water_available") or "media").lower()
    need = (crop.get("water_need") or "medio").lower()
    supply = {"alta": 1.0, "media": 0.62, "baja": 0.3}.get(availability, 0.62)
    demand = {"bajo": 0.3, "medio": 0.62, "alto": 1.0}.get(need, 0.62)
    water_score = _clamp(1 - max(0.0, demand - supply))
    if demand >= 0.95 and supply <= 0.35:
        critical.append("El cultivo tiene alta demanda de agua y la parcela reporta disponibilidad baja.")
        factors.append(_factor("water", "critical", "Demanda hídrica alta con disponibilidad declarada baja."))
    elif demand > supply:
        factors.append(_factor("water", "warning", f"Demanda {need} y disponibilidad {availability}; puede requerir riego suplementario."))
    else:
        factors.append(_factor("water", "ok", f"Disponibilidad {availability} suficiente para una demanda {need}."))

    months = crop.get("planting_months") or []
    if not months:
        calendar_score = 0.6
        factors.append(_factor("calendar", "missing", "El cultivo no tiene ventana de siembra documentada."))
    elif sowing_month in months:
        calendar_score = 1.0
        factors.append(_factor("calendar", "ok", f"El mes {sowing_month} está dentro de la ventana de siembra."))
    elif sowing_month in _next_months(months):
        calendar_score = 0.65
        factors.append(_factor("calendar", "warning", f"El mes {sowing_month} está cerca de la ventana de siembra."))
    else:
        calendar_score = 0.2
        factors.append(_factor("calendar", "warning", f"El mes {sowing_month} queda fuera de la ventana de siembra del catálogo."))

    rotation_score, rotation_factor = rotation_assessment(
        crop.get("botanical_family"), history, sowing_date.year
    )
    factors.append(rotation_factor)
    if rotation_factor["status"] == "critical":
        critical.append(rotation_factor["detail"])
    elif rotation_factor["status"] == "missing":
        missing.append("historial")

    components = {
        "climate": round(climate_score, 3),
        "soil": round(soil_score, 3),
        "water": round(water_score, 3),
        "terrain": round(terrain_score, 3),
        "calendar": round(calendar_score, 3),
        "rotation": round(rotation_score, 3),
    }
    score = sum(WEIGHTS[key] * value for key, value in components.items())

    missing_ratio = len([item for item in missing if item in {"clima", "suelo", "altitud"}]) / 3
    if critical:
        classification = "riesgo_alto"
    elif missing_ratio > 0.4:
        classification = "informacion_insuficiente"
    elif score >= 0.75:
        classification = "recomendable"
    elif score >= 0.5:
        classification = "viable_con_restricciones"
    else:
        classification = "no_recomendado"

    base_confidence = crop.get("confidence") or 0.7
    confidence = round(_clamp(base_confidence * (1 - 0.45 * missing_ratio)), 2)

    explanation = _explain(crop, classification, score, critical, missing, components)

    return {
        "crop_id": crop.get("id"),
        "crop_name": crop.get("name"),
        "crop_family": crop.get("botanical_family"),
        "classification": classification,
        "classification_label": CLASSIFICATION_LABELS[classification],
        "score": round(score, 4),
        "confidence": confidence,
        "components": components,
        "factors": factors,
        "missing": missing,
        "critical": critical,
        "explanation": explanation,
    }


def _explain(crop, classification, score, critical, missing, components):
    best = sorted(components.items(), key=lambda item: item[1], reverse=True)[:2]
    weak = sorted(components.items(), key=lambda item: item[1])[:2]
    label = CLASSIFICATION_LABELS[classification]
    parts = [
        f"{crop.get('name')}: {label.lower()} para esta parcela y fecha "
        f"(aptitud {score * 100:.0f}/100)."
    ]
    if best:
        parts.append(
            "Mejores criterios: " + ", ".join(f"{WEIGHT_LABELS[key]} ({value * 100:.0f}%)" for key, value in best) + "."
        )
    if weak:
        parts.append(
            "Puntos débiles: " + ", ".join(f"{WEIGHT_LABELS[key]} ({value * 100:.0f}%)" for key, value in weak) + "."
        )
    if critical:
        parts.append("Restricción crítica: " + " ".join(critical))
    if missing:
        parts.append("Datos faltantes: " + ", ".join(missing) + ".")
    parts.append(
        "Es una simulación con datos declarados y promedios satelitales; no es un pronóstico ni garantiza rendimiento."
    )
    return " ".join(parts)
