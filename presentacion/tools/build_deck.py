"""Build the NASA Space Apps 2026 project demo deck (7 slides max, English).

Rules enforced from "NASA Space Apps Challenge.pdf":
  - Demo slide deck: no more than 7 slides including title and intro.
  - All content in English.
  - Team name, member names and the selected challenge must be present.
  - Must show the project, the user experience and how NASA data makes it possible.
"""
import sys
from pathlib import Path

from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Emu, Inches, Pt

ROOT = Path(__file__).resolve().parents[1]
SHOTS = ROOT / "assets" / "screens"
OUT = ROOT.parent / "ROOTWISE_AI_-_Project_Demo_7slides_EN.pptx"
CLIPS = ROOT / "assets" / "logo"
CLIPS.mkdir(parents=True, exist_ok=True)

INK = RGBColor(0x0F, 0x3D, 0x1E)
DEEP = RGBColor(0x0B, 0x24, 0x1B)
LEAF = RGBColor(0x65, 0xA3, 0x0D)
LIME = RGBColor(0xC9, 0xE6, 0x8F)
CREAM = RGBColor(0xFB, 0xF9, 0xF4)
SAND = RGBColor(0xEF, 0xF3, 0xEA)
SLATE = RGBColor(0x47, 0x55, 0x69)
MUTED = RGBColor(0x6B, 0x7A, 0x80)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

FONT = "Plus Jakarta Sans"
W, H = 13.333, 7.5


def add_text(slide, text, x, y, w, h, *, size=12, bold=False, color=SLATE,
             align=PP_ALIGN.LEFT, spacing=1.25, anchor=MSO_ANCHOR.TOP, italic=False):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    frame = box.text_frame
    frame.word_wrap = True
    frame.margin_left = 0
    frame.margin_right = 0
    frame.margin_top = 0
    frame.margin_bottom = 0
    frame.vertical_anchor = anchor
    lines = text.split("\n")
    for index, line in enumerate(lines):
        para = frame.paragraphs[0] if index == 0 else frame.add_paragraph()
        para.alignment = align
        para.line_spacing = spacing
        run = para.add_run()
        run.text = line
        run.font.name = FONT
        run.font.size = Pt(size)
        run.font.bold = bold
        run.font.italic = italic
        run.font.color.rgb = color
    return box


def add_rect(slide, x, y, w, h, fill, *, shape=MSO_SHAPE.ROUNDED_RECTANGLE,
             radius=0.06, line=None, line_w=1.0):
    rect = slide.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    if shape == MSO_SHAPE.ROUNDED_RECTANGLE:
        try:
            rect.adjustments[0] = radius
        except Exception:  # noqa: BLE001
            pass
    if fill is None:
        rect.fill.background()
    else:
        rect.fill.solid()
        rect.fill.fore_color.rgb = fill
    if line is None:
        rect.line.fill.background()
    else:
        rect.line.color.rgb = line
        rect.line.width = Pt(line_w)
    rect.shadow.inherit = False
    return rect


def background(slide, color=CREAM):
    add_rect(slide, 0, 0, W, H, color, shape=MSO_SHAPE.RECTANGLE)


def header(slide, eyebrow, title, subtitle=None):
    add_rect(slide, 0.75, 0.62, 0.09, 0.34, LEAF, shape=MSO_SHAPE.RECTANGLE)
    add_text(slide, eyebrow.upper(), 0.98, 0.60, 10.5, 0.28, size=10.5, bold=True, color=LEAF)
    add_text(slide, title, 0.98, 0.90, 11.6, 0.55, size=26, bold=True, color=INK)
    if subtitle:
        add_text(slide, subtitle, 0.98, 1.52, 11.4, 0.44, size=11.5, color=SLATE)


def footer(slide, index, total=7):
    add_text(slide, "ROOTWISE AI  ·  NASA Space Apps Challenge 2026", 0.75, 6.98, 8.0, 0.24,
             size=8.5, color=MUTED)
    add_text(slide, f"{index} / {total}", 11.9, 6.98, 0.7, 0.24, size=8.5, color=MUTED,
             align=PP_ALIGN.RIGHT)


def picture_card(slide, image, x, y, w, h, *, pad=0.10, bg=WHITE, border=RGBColor(0xE2, 0xE8, 0xDC)):
    """Rounded white card with a cropped screenshot inside."""
    add_rect(slide, x, y, w, h, bg, radius=0.05, line=border)
    inner_w, inner_h = w - pad * 2, h - pad * 2
    pic = slide.shapes.add_picture(str(image), Inches(x + pad), Inches(y + pad),
                                   Inches(inner_w), Inches(inner_h))
    pic.crop_left = pic.crop_right = pic.crop_top = pic.crop_bottom = 0
    return pic


def logo_card(slide, image, x, y, size):
    add_rect(slide, x, y, size, size, WHITE, radius=0.12)
    slide.shapes.add_picture(str(image), Inches(x + 0.08), Inches(y + 0.08),
                             Inches(size - 0.16), Inches(size - 0.16))


def bullet_card(slide, x, y, w, h, title, body, *, accent=LEAF, title_size=14, body_size=10.5):
    add_rect(slide, x, y, w, h, WHITE, radius=0.07, line=RGBColor(0xE2, 0xE8, 0xDC))
    add_rect(slide, x, y + 0.22, 0.055, 0.30, accent, shape=MSO_SHAPE.RECTANGLE)
    add_text(slide, title, x + 0.26, y + 0.22, w - 0.45, 0.32, size=title_size, bold=True, color=INK)
    add_text(slide, body, x + 0.26, y + 0.66, w - 0.48, h - 0.82, size=body_size, color=SLATE, spacing=1.3)


def stat(slide, x, y, w, value, label, *, color=INK):
    add_text(slide, value, x, y, w, 0.62, size=38, bold=True, color=color)
    add_text(slide, label, x, y + 0.66, w, 0.3, size=10.5, color=MUTED)


def new_slide(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    return slide


def build():
    prs = Presentation()
    prs.slide_width = Emu(int(W * 914400))
    prs.slide_height = Emu(int(H * 914400))

    logo = ROOT.parent / "frontend" / "public" / "logo-emblem.png"
    logo_full = ROOT.parent / "logo.jpeg"

    # ---------------------------------------------------------------- 1 Title
    slide = new_slide(prs)
    background(slide, INK)
    add_rect(slide, 0, 0, W, 0.16, LEAF, shape=MSO_SHAPE.RECTANGLE)
    add_text(slide, "NASA SPACE APPS CHALLENGE 2026  ·  TEAM ROOTWISE AI", 0.9, 0.95, 9.0, 0.3,
             size=11, bold=True, color=LIME)
    add_text(slide, "ROOTWISE AI", 0.9, 1.38, 8.6, 0.95, size=54, bold=True, color=WHITE)
    add_text(slide, "Grow decisions, harvest the future.", 0.9, 2.42, 8.4, 0.45,
             size=19, bold=True, color=LIME)
    add_rect(slide, 0.92, 3.02, 0.75, 0.045, LEAF, shape=MSO_SHAPE.RECTANGLE)
    add_text(slide,
             "A free, offline-first farming advisor that turns open NASA Earth observation\n"
             "into explained crop-rotation decisions for small and medium farms.",
             0.9, 3.32, 8.1, 0.9, size=13.5, color=RGBColor(0xDC, 0xE7, 0xDA), spacing=1.4)
    add_text(slide, "Challenge: “A turning point: adapting farms with NASA data”", 0.9, 4.42, 8.2, 0.3,
             size=11.5, bold=True, color=WHITE)
    add_text(slide, "Team ROOTWISE AI  ·  Lima, Peru  ·  Earth Science · Software · Arts & Media", 0.9, 4.78, 8.4, 0.3,
             size=10.5, color=RGBColor(0xB9, 0xCB, 0xB8))
    add_text(slide, "github.com/Sarai6e/ROOTWISE-AI", 0.9, 5.12, 6.0, 0.3,
             size=10.5, bold=True, color=LIME)
    slide.shapes.add_picture(str(logo), Inches(9.55), Inches(1.80), Inches(3.15), Inches(2.01))
    add_text(slide, "Team ROOTWISE AI", 9.55, 3.98, 3.15, 0.30, size=12, bold=True, color=WHITE,
             align=PP_ALIGN.CENTER)
    add_text(slide, "Lima, Peru", 9.55, 4.30, 3.15, 0.26, size=10, color=RGBColor(0xB9, 0xCB, 0xB8),
             align=PP_ALIGN.CENTER)

    # ------------------------------------------------------------- 2 Challenge
    slide = new_slide(prs)
    background(slide)
    header(slide, "The challenge", "Farmers must decide what to plant while the climate shifts",
           "Rainfall is irregular, water is scarce, soils degrade and reliable advice rarely reaches the field.")
    stats = [("1.5 °C", "warmer mean temperatures already recorded"),
             ("70 %", "of freshwater used by agriculture"),
             ("0 bars", "signal in many rural plots")]
    for index, (value, label) in enumerate(stats):
        stat(slide, 0.95 + index * 1.95, 2.16, 1.8, value, label)
    bullet_card(slide, 0.95, 3.28, 3.55, 1.62, "Decisions without data",
                "Rotation and sowing dates are chosen by habit, with no local climate record.")
    bullet_card(slide, 4.65, 3.28, 3.55, 1.62, "The digital divide",
                "Tools demand email, ID and constant connection that rural families do not have.")
    bullet_card(slide, 8.35, 3.28, 3.55, 1.62, "Losses after the fact",
                "Pests and soil exhaustion are detected late, when the harvest is already lost.")
    add_rect(slide, 0.95, 5.16, 3.55, 0.9, SAND, radius=0.12)
    add_text(slide, "Why this challenge", 1.15, 5.30, 3.1, 0.26, size=10.5, bold=True, color=INK)
    add_text(slide, "Peru holds 84 of the world’s 117 life zones; a single district can span frost and heat.", 1.15, 5.58, 3.15, 0.42,
             size=9.5, color=SLATE, spacing=1.25)
    add_rect(slide, 4.65, 5.16, 3.55, 0.9, SAND, radius=0.12)
    add_text(slide, "Our angle", 4.85, 5.30, 3.1, 0.26, size=10.5, bold=True, color=INK)
    add_text(slide, "Use data that already exists, explain every answer and never hide its limits.", 4.85, 5.58, 3.15, 0.42,
             size=9.5, color=SLATE, spacing=1.25)
    add_rect(slide, 8.35, 5.16, 3.55, 0.9, SAND, radius=0.12)
    add_text(slide, "Success for us", 8.55, 5.30, 3.1, 0.26, size=10.5, bold=True, color=INK)
    add_text(slide, "A farmer can compare crops and read why one is safer, without connectivity.", 8.55, 5.58, 3.15, 0.42,
             size=9.5, color=SLATE, spacing=1.25)
    footer(slide, 2)

    # -------------------------------------------------------------- 3 Solution
    slide = new_slide(prs)
    background(slide)
    header(slide, "The solution", "ROOTWISE AI turns open science into a field decision",
           "Draw the plot, declare the soil, compare crops. Every result is explained, reproducible and free.")
    steps = [("1", "Draw the plot", "Polygon on a 2D/3D map; area and centroid computed on the server."),
             ("2", "Add real data", "Soil pH, organic matter, water, irrigation, altitude and crop history."),
             ("3", "Simulate crops", "Critical filters first, then a weighted score across six criteria."),
             ("4", "Act and record", "Convert the best option into a campaign and log each field event.")]
    for index, (number, title, body) in enumerate(steps):
        x = 0.95 + index * 3.02
        add_rect(slide, x, 2.30, 2.78, 2.34, WHITE, radius=0.07, line=RGBColor(0xE2, 0xE8, 0xDC))
        add_rect(slide, x + 0.22, 2.52, 0.42, 0.42, LIME, radius=0.2)
        add_text(slide, number, x + 0.22, 2.60, 0.42, 0.3, size=13, bold=True, color=INK,
                 align=PP_ALIGN.CENTER)
        add_text(slide, title, x + 0.22, 3.08, 2.32, 0.3, size=12.5, bold=True, color=INK)
        add_text(slide, body, x + 0.22, 3.44, 2.34, 1.0, size=9.5, color=SLATE, spacing=1.3)
        if index < 3:
            add_rect(slide, x + 2.80, 3.42, 0.20, 0.035, RGBColor(0xC5, 0xD1, 0xBE),
                     shape=MSO_SHAPE.RECTANGLE)
    add_text(slide, "Score = 0.30 climate + 0.20 soil + 0.20 water + 0.10 terrain + 0.10 calendar + 0.10 rotation",
             0.95, 4.92, 11.7, 0.32, size=11, bold=True, color=INK)
    add_text(slide,
             "Critical filters are not compensated by other criteria: altitude out of range, historic frost, high water demand with low availability,\n"
             "pH outside the crop range or a rotation interval violated. Each run stores its inputs, ruleset version and the source of every variable.",
             0.95, 5.30, 11.6, 0.72, size=10, color=SLATE, spacing=1.35)
    for index, (label, desc) in enumerate([("Recommended", "Plant and follow the calendar"),
                                           ("Viable with restrictions", "Fix water, drainage or date first"),
                                           ("High risk", "Choose another crop"),
                                           ("Insufficient data", "Complete the sheet")]):
        x = 0.95 + index * 2.95
        add_rect(slide, x, 6.14, 2.72, 0.62, SAND, radius=0.16)
        add_text(slide, label, x + 0.16, 6.22, 2.4, 0.22, size=9.5, bold=True, color=INK)
        add_text(slide, desc, x + 0.16, 6.44, 2.4, 0.22, size=8.5, color=MUTED)
    footer(slide, 3)

    # -------------------------------------------------------------- 4 NASA data
    slide = new_slide(prs)
    background(slide)
    header(slide, "NASA data and resources", "Six NASA services behind every recommendation",
           "Every call runs through our backend: the browser never receives a NASA key, and each layer keeps its source and date.")
    rows = [("NASA POWER", "Daily and agro-climatic series", "5-year averages per coordinate, 24 h local cache"),
            ("NASA Worldview", "Satellite snapshot of the plot", "Image proxy returned as image/jpeg"),
            ("NASA GIBS", "Raster layers by date", "WMS through the backend, clouds disclosed"),
            ("NASA CMR + STAC", "Collection and granule catalogue", "Keyword search over Earthdata"),
            ("NASA EPIC / DSCOVR", "Latest full-Earth image", "DEMO_KEY or NASA_API_KEY"),
            ("NASA FIRMS", "Active fire detections", "Optional free MAP_KEY")]
    for index, (name, use, note) in enumerate(rows):
        y = 2.18 + index * 0.60
        add_rect(slide, 0.95, y, 6.55, 0.52, WHITE, radius=0.14, line=RGBColor(0xE2, 0xE8, 0xDC))
        add_text(slide, name, 1.12, y + 0.15, 1.95, 0.26, size=10.5, bold=True, color=INK)
        add_text(slide, use, 3.10, y + 0.16, 2.30, 0.26, size=9.5, color=SLATE)
        add_text(slide, note, 5.30, y + 0.16, 2.10, 0.26, size=8.5, color=MUTED)
    picture_card(slide, SHOTS / "05-nasa.png", 7.78, 2.10, 4.75, 2.62)
    add_text(slide, "ROOTWISE EARTH screen: Worldview imagery, CMR catalogue, EPIC and FIRMS in one place.",
             7.82, 4.86, 4.70, 0.30, size=8.5, color=MUTED)
    add_rect(slide, 7.78, 5.26, 4.75, 1.16, SAND, radius=0.08)
    add_text(slide, "Honesty rule", 7.98, 5.40, 4.3, 0.26, size=10.5, bold=True, color=INK)
    add_text(slide, "Satellite data is regional context, never an in-plot measurement. Resolution, provider and date stay visible, and nothing is presented as a deterministic forecast.",
             7.98, 5.68, 4.35, 0.66, size=8.8, color=SLATE, spacing=1.3)
    footer(slide, 4)

    # --------------------------------------------------------------- 5 Demo sim
    slide = new_slide(prs)
    background(slide)
    header(slide, "The experience", "A farmer compares crops and reads why",
           "Three crops evaluated for the same plot and date. The best option is explained criterion by criterion.")
    picture_card(slide, SHOTS / "04-simulator.png", 0.95, 2.06, 7.55, 4.24)
    add_rect(slide, 8.78, 2.06, 3.72, 1.28, WHITE, radius=0.08, line=RGBColor(0xE2, 0xE8, 0xDC))
    add_text(slide, "81 %", 8.98, 2.18, 1.6, 0.6, size=30, bold=True, color=INK)
    add_text(slide, "Tomato · Recommended", 8.98, 2.80, 3.2, 0.26, size=10.5, bold=True, color=LEAF)
    add_text(slide, "Soil 100 %, altitude 100 %, calendar 100 %. Weak points shown too: water 62 %, climate 63 %.",
             8.98, 3.06, 3.3, 0.24, size=8.2, color=MUTED, spacing=1.2)
    add_rect(slide, 8.78, 3.48, 3.72, 1.16, WHITE, radius=0.08, line=RGBColor(0xE2, 0xE8, 0xDC))
    add_text(slide, "Missing data is a result", 8.98, 3.60, 3.3, 0.26, size=10.5, bold=True, color=INK)
    add_text(slide, "If soil or water is unknown, the app reduces confidence and asks for the missing value instead of guessing.",
             8.98, 3.88, 3.3, 0.66, size=8.6, color=SLATE, spacing=1.3)
    add_rect(slide, 8.78, 4.78, 3.72, 1.52, SAND, radius=0.08)
    add_text(slide, "54 crops", 8.98, 4.92, 1.7, 0.42, size=22, bold=True, color=INK)
    add_text(slide, "with agronomic requirements", 10.58, 5.02, 1.85, 0.32, size=8.5, color=MUTED)
    add_text(slide, "22 rotation rules  ·  ruleset v1.0.0  ·  reproducible runs",
             8.98, 5.46, 3.35, 0.28, size=8.5, color=SLATE)
    add_text(slide, "Best option becomes a campaign; every field event is logged for the next rotation.",
             8.98, 5.74, 3.35, 0.44, size=8.5, color=MUTED, spacing=1.25)
    footer(slide, 5)

    # --------------------------------------------------- 6 Offline + languages
    slide = new_slide(prs)
    background(slide)
    header(slide, "Inclusion", "Works without internet, in five languages",
           "A PWA caches the app and the data, queues writes and syncs when the signal returns. Plant health triage runs on the same phone.")
    picture_card(slide, SHOTS / "07-offline.png", 0.95, 2.06, 4.05, 2.44)
    add_text(slide, "Offline write queued and announced to the farmer", 0.98, 4.58, 4.0, 0.26,
             size=8.5, color=MUTED)
    picture_card(slide, SHOTS / "06-health.png", 5.22, 2.06, 4.05, 2.44)
    add_text(slide, "Leaf diagnosis with the AgroVision model (10 tomato classes)", 5.25, 4.58, 4.0, 0.26,
             size=8.5, color=MUTED)
    add_rect(slide, 9.48, 2.06, 3.02, 2.44, WHITE, radius=0.08, line=RGBColor(0xE2, 0xE8, 0xDC))
    add_text(slide, "Languages", 9.68, 2.18, 2.6, 0.26, size=10.5, bold=True, color=INK)
    for index, (lang, state) in enumerate([("Español", "validated"),
                                           ("English", "validated"),
                                           ("Runasimi (Quechua)", "beta"),
                                           ("Kichwa amazónico", "beta"),
                                           ("Asháninka", "beta")]):
        y = 2.50 + index * 0.34
        add_text(slide, lang, 9.68, y, 1.9, 0.26, size=9.5, color=INK)
        add_text(slide, state, 11.55, y, 0.85, 0.26, size=8.2, color=MUTED, align=PP_ALIGN.RIGHT)
    add_rect(slide, 9.48, 4.62, 3.02, 1.68, SAND, radius=0.08)
    add_text(slide, "No barriers to start", 9.68, 4.76, 2.6, 0.26, size=10.5, bold=True, color=INK)
    add_text(slide, "No email, no SMS, no ID required. Sign up with a username and password, in the field, on a basic phone.",
             9.68, 5.04, 2.6, 0.72, size=8.6, color=SLATE, spacing=1.3)
    add_text(slide, "Translations ship inside the bundle, so they also work offline.",
             9.68, 5.80, 2.6, 0.40, size=8.4, color=MUTED, spacing=1.25)
    add_rect(slide, 0.95, 4.98, 8.32, 1.32, WHITE, radius=0.07, line=RGBColor(0xE2, 0xE8, 0xDC))
    add_text(slide, "Measured today", 1.15, 5.14, 4.0, 0.26, size=10.5, bold=True, color=INK)
    for index, (value, label) in enumerate([("59", "tests passing"), ("75 %", "coverage"), ("10", "model classes")]):
        add_text(slide, value, 1.15 + index * 2.72, 5.44, 2.5, 0.42, size=20, bold=True, color=INK)
        add_text(slide, label, 1.15 + index * 2.72, 5.86, 2.5, 0.26, size=8.5, color=MUTED)
    footer(slide, 6)

    # ------------------------------------------------------------- 7 The future
    slide = new_slide(prs)
    background(slide, INK)
    add_rect(slide, 0, 0, W, 0.16, LEAF, shape=MSO_SHAPE.RECTANGLE)
    add_rect(slide, 0.95, 0.72, 0.09, 0.34, LIME, shape=MSO_SHAPE.RECTANGLE)
    add_text(slide, "LOOKING AHEAD", 1.18, 0.70, 6.0, 0.28, size=10.5, bold=True, color=LIME)
    add_text(slide, "From one plot to a climate-resilient countryside", 1.18, 1.00, 10.4, 0.55,
             size=25, bold=True, color=WHITE)
    phases = [("Today", "Working product", "Plots, NASA climate, explained simulator, campaigns, plant health, offline PWA and PDF report."),
              ("Next", "Irrigation and alerts", "Water balance with GPM, frost and heat warnings pushed to the phone, agronomist review of beta translations."),
              ("Beyond", "Regional network", "New crops and countries, community validation of rotations, open rulesets any extension service can audit.")]
    for index, (tag, title, body) in enumerate(phases):
        x = 0.95 + index * 2.52
        add_rect(slide, x, 1.88, 2.37, 1.86, RGBColor(0x14, 0x4A, 0x26), radius=0.07,
                 line=RGBColor(0x2A, 0x66, 0x39))
        add_text(slide, tag.upper(), x + 0.20, 2.04, 2.0, 0.26, size=9, bold=True, color=LIME)
        add_text(slide, title, x + 0.20, 2.32, 2.0, 0.30, size=12.5, bold=True, color=WHITE)
        add_text(slide, body, x + 0.20, 2.66, 2.0, 0.96, size=8.8,
                 color=RGBColor(0xC9, 0xD8, 0xC7), spacing=1.3)
    add_text(slide, "What it can do for people and the planet", 0.95, 4.04, 7.0, 0.3,
             size=12, bold=True, color=LIME)
    add_text(slide,
             "A farmer avoids one lost season, keeps soil cover and uses less water. Multiply that by the small farms that feed most of the world:\n"
             "the same open decision layer can protect livelihoods and store carbon — on Earth today, and on any habitat we settle next.",
             0.95, 4.40, 7.45, 0.86, size=10, color=RGBColor(0xD8, 0xE3, 0xD6), spacing=1.35)
    add_rect(slide, 0.95, 5.48, 7.45, 0.90, RGBColor(0x14, 0x4A, 0x26), radius=0.1)
    add_text(slide, "Team ROOTWISE AI  ·  Project repository", 1.15, 5.60, 4.2, 0.26, size=9, color=LIME)
    add_text(slide, "github.com/Sarai6e/ROOTWISE-AI", 1.15, 5.88, 5.6, 0.30, size=12.5, bold=True, color=WHITE)
    add_rect(slide, 8.62, 1.88, 3.72, 1.86, RGBColor(0x14, 0x4A, 0x26), radius=0.08,
             line=RGBColor(0x2A, 0x66, 0x39))
    slide.shapes.add_picture(str(logo), Inches(9.55), Inches(2.02), Inches(1.86), Inches(1.19))
    add_text(slide, "ROOTWISE AI", 8.82, 3.24, 3.32, 0.30, size=12, bold=True, color=WHITE,
             align=PP_ALIGN.CENTER)
    add_text(slide, "Sources: NASA POWER, GIBS, Worldview, CMR, EPIC, FIRMS and Earthdata. Agronomic references: FAO/FAOSTAT, INIA, MIDAGRI, SENAMHI, SENASA.",
             8.62, 3.96, 3.72, 0.70, size=7.8, color=RGBColor(0xA9, 0xBE, 0xA7), spacing=1.3)
    add_text(slide, "Product screenshots come from the running application. Slides were drafted with AI assistance and reviewed by the team.",
             8.62, 4.76, 3.72, 0.62, size=7.8, color=RGBColor(0xA9, 0xBE, 0xA7), spacing=1.3)
    add_text(slide, "ROOTWISE AI supports decisions. It does not certify land ownership, guarantee yields or replace an agronomist.",
             8.62, 5.52, 3.72, 0.72, size=7.8, color=RGBColor(0xC9, 0xD8, 0xC7), spacing=1.3)
    footer(slide, 7)

    prs.save(str(OUT))
    print("saved", OUT, "slides:", len(prs.slides))


if __name__ == "__main__":
    sys.exit(build())
