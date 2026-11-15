"""Reporte PDF de parcela con reportlab."""
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

VERDE = colors.HexColor("#0E2A20")
LIMA = colors.HexColor("#C9E68F")
CREMA = colors.HexColor("#F6F4EA")


def _table(rows, widths=None):
    table = Table(rows, colWidths=widths, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), VERDE),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, CREMA]),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#DCE5D8")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return table


def build_parcel_report(parcel, climate, simulations, user):
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        leftMargin=18 * mm, rightMargin=18 * mm,
        topMargin=16 * mm, bottomMargin=16 * mm,
        title=f"ROOTWISE AI · {parcel['name']}",
    )
    styles = getSampleStyleSheet()
    title = ParagraphStyle("TitleRoot", parent=styles["Title"], fontName="Helvetica-Bold",
                           fontSize=22, textColor=VERDE, spaceAfter=2, alignment=0)
    subtitle = ParagraphStyle("Sub", parent=styles["Normal"], fontSize=9,
                              textColor=colors.HexColor("#4A5D52"), spaceAfter=10)
    heading = ParagraphStyle("HeadingRoot", parent=styles["Heading2"], fontSize=13,
                             textColor=VERDE, spaceBefore=12, spaceAfter=6)
    body = ParagraphStyle("BodyRoot", parent=styles["Normal"], fontSize=9.5, leading=13)

    story = [
        Paragraph("ROOTWISE AI", title),
        Paragraph("Cultiva decisiones, cosecha futuro · Reporte de parcela", subtitle),
    ]

    parcel_rows = [
        ["Dato", "Valor"],
        ["Parcela", parcel.get("name") or "-"],
        ["Finca", parcel.get("farm_name") or "-"],
        ["Productor", user.get("full_name") or user.get("username") or "-"],
        ["Área", f"{parcel.get('area_ha')} ha (aproximada, polígono de trabajo)"],
        ["Centro", f"{parcel.get('centroid_lat')}, {parcel.get('centroid_lon')}"],
        ["Altitud", f"{parcel.get('elevation_m') or 'sin dato'} m"],
        ["Agua", str(parcel.get("water_available") or "-")],
        ["Riego", str(parcel.get("irrigation_type") or "-")],
    ]
    story += [Paragraph("Ficha de la parcela", heading), _table(parcel_rows, [45 * mm, 120 * mm])]
    story.append(Paragraph(
        "El polígono es una delimitación de trabajo y no acredita propiedad, posesión ni linderos legales.",
        ParagraphStyle("Note", parent=body, fontSize=8, textColor=colors.HexColor("#6B7C71")),
    ))

    if climate and climate.get("available"):
        climate_rows = [
            ["Variable", "Valor", "Fuente"],
            ["Temperatura media", f"{climate.get('t2m_mean')} °C", "NASA POWER"],
            ["Mínima histórica", f"{climate.get('tmin_abs')} °C", "NASA POWER"],
            ["Máxima histórica", f"{climate.get('tmax_abs')} °C", "NASA POWER"],
            ["Lluvia anual", f"{climate.get('rain_annual_mm')} mm", "NASA POWER"],
            ["Humedad relativa", f"{climate.get('rh_mean')} %", "NASA POWER"],
            ["Periodo", f"{climate['period']['start']} → {climate['period']['end']}", "Promedio 5 años"],
        ]
        story += [Paragraph("Contexto climático", heading), _table(climate_rows, [45 * mm, 70 * mm, 50 * mm])]
        story.append(Paragraph(
            f"Resolución aproximada {climate['meta']['resolution_deg']}°; los datos son contexto regional, "
            "no una medición dentro de la parcela.", ParagraphStyle("Note2", parent=body, fontSize=8,
                                                                    textColor=colors.HexColor("#6B7C71")),
        ))
    else:
        story += [Paragraph("Contexto climático", heading),
                  Paragraph("No se pudo obtener NASA POWER al generar este reporte.", body)]

    if simulations:
        rows = [["Cultivo", "Clasificación", "Aptitud", "Confianza"]]
        for item in simulations[:6]:
            rows.append([
                item.get("crop_name") or "-",
                item.get("classification", "").replace("_", " "),
                f"{(item.get('score') or 0) * 100:.0f}%",
                f"{(item.get('confidence') or 0) * 100:.0f}%",
            ])
        story += [Paragraph("Última simulación de aptitud", heading), _table(rows, [55 * mm, 55 * mm, 30 * mm, 30 * mm])]

    story += [
        Spacer(1, 10),
        Paragraph(
            "ROOTWISE AI es una herramienta de apoyo a decisiones. No garantiza cosechas, rendimientos "
            "ni propiedad de terrenos. Las recomendaciones deben validarse con un agrónomo local.",
            ParagraphStyle("Disclaimer", parent=body, fontSize=8, textColor=colors.HexColor("#6B7C71")),
        ),
    ]

    doc.build(story)
    buffer.seek(0)
    return buffer
