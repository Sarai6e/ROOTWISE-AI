"""Reglas de rotación de cultivos y utilidades de familia botánica."""

RULESET_VERSION = "1.0.0"

DEFAULT_INTERVALS = {
    "Solanaceae": 3,
    "Brassicaceae": 2,
    "Cucurbitaceae": 2,
    "Fabaceae": 2,
    "Alliaceae": 3,
    "Apiaceae": 2,
    "Asteraceae": 2,
    "Rosaceae": 3,
    "Rutaceae": 2,
    "Poaceae": 1,
    "Amaranthaceae": 1,
}

BENEFICIAL_PREVIOUS = {
    "Fabaceae": "Las leguminosas fijan nitrógeno y suelen dejar el suelo en mejores condiciones.",
    "Poaceae": "Los cereales dejan rastrojo; conviene vigilar el agotamiento de nitrógeno.",
}


def interval_for(family, previous_family, rules=None):
    for rule in rules or []:
        if rule.family == family and rule.previous_family == previous_family:
            return rule.min_interval_years, rule.risk_level, rule.note
    if family == previous_family:
        return DEFAULT_INTERVALS.get(family, 2), "medio", (
            f"Repetir la familia {family} puede favorecer plagas y agotamiento de nutrientes."
        )
    return 0, "bajo", None


def years_since(history, family):
    years = [item.get("year") for item in history if item.get("family") == family and item.get("year")]
    return max(years) if years else None


def rotation_assessment(crop_family, history, sowing_year, rules=None):
    """Devuelve (score 0..1, factor dict). history usa claves family/year."""
    previous = [item for item in history if item.get("family")]
    if not previous:
        return 0.6, {
            "key": "rotation",
            "label": "Rotación",
            "status": "missing",
            "detail": "No hay historial de cultivos registrado. Se asume neutro hasta completar el historial.",
            "source": "Historial de la parcela",
        }

    last = max(previous, key=lambda item: item.get("year") or 0)
    if last.get("family") != crop_family:
        note = BENEFICIAL_PREVIOUS.get(last.get("family"))
        return 1.0, {
            "key": "rotation",
            "label": "Rotación",
            "status": "ok",
            "detail": (
                f"El cultivo anterior fue {last.get('crop_name') or last.get('family')} "
                f"({last.get('year')}). La familia cambia respecto a {crop_family}."
                + (f" {note}" if note else "")
            ),
            "source": "Historial de la parcela",
        }

    interval, risk, note = interval_for(crop_family, last.get("family"), rules)
    elapsed = (sowing_year or 0) - (last.get("year") or 0)
    if interval and elapsed < interval:
        return 0.0, {
            "key": "rotation",
            "label": "Rotación",
            "status": "critical",
            "detail": (
                f"Repetir {crop_family} tras {elapsed} año(s) incumple el intervalo mínimo "
                f"de {interval} año(s). {note or ''}".strip()
            ),
            "source": f"Regla de rotación {RULESET_VERSION}",
        }

    return 0.85, {
        "key": "rotation",
        "label": "Rotación",
        "status": "warning",
        "detail": (
            f"Se repite la familia {crop_family} después de {elapsed} año(s). "
            "Vigila nutrientes y sanidad del suelo."
        ),
        "source": f"Regla de rotación {RULESET_VERSION}",
    }
