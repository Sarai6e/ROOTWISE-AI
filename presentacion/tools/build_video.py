"""Render the 30-second ROOTWISE AI demo video (1920x1080, 30 fps, English).

Timing follows the NASA Space Apps Project Submission Guide:
  0:00 team intro · 0:02 challenge · 0:05 project name · 0:10 idea · 0:20 future
"""
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SHOTS = ROOT / "assets" / "screens"
AUDIO = ROOT / "video" / "audio"
OUT = ROOT.parent / "ROOTWISE_AI_-_Demo_30s_EN.mp4"

W, H = 1920, 1080
FPS = 30
DURATION = 30.0

INK = (15, 61, 30)
DEEP = (11, 36, 27)
LEAF = (101, 163, 13)
LIME = (201, 230, 143)
CREAM = (251, 249, 244)
WHITE = (255, 255, 255)

FONT_PATH = ROOT / "assets" / "fonts" / "PlusJakartaSans-var.ttf"
LOGO = ROOT.parent / "frontend" / "public" / "logo-emblem.png"

_font_cache: dict[tuple[int, int], ImageFont.FreeTypeFont] = {}


def font(size: int, weight: int = 400) -> ImageFont.FreeTypeFont:
    key = (size, weight)
    if key in _font_cache:
        return _font_cache[key]
    loaded = ImageFont.truetype(str(FONT_PATH), size)
    try:
        loaded.set_variation_by_axes([weight])
    except Exception:  # noqa: BLE001
        pass
    _font_cache[key] = loaded
    return loaded


def ease(t: float) -> float:
    """Smoothstep."""
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def background() -> Image.Image:
    """Vertical gradient from deep green to ink with a soft radial glow."""
    top = np.array([11, 36, 27], dtype=np.float32)
    bottom = np.array([15, 61, 30], dtype=np.float32)
    ramp = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    base = top[None, :] * (1 - ramp) + bottom[None, :] * ramp
    canvas = np.repeat(base[:, None, :], W, axis=1)

    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    dist = np.sqrt(((xx - W * 0.72) / (W * 0.75)) ** 2 + ((yy - H * 0.35) / (H * 0.85)) ** 2)
    glow = np.clip(1 - dist, 0, 1)[..., None] ** 2
    canvas = canvas + glow * np.array([24, 52, 26], dtype=np.float32)
    return Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8), "RGB")


BG = background()
BG_BYTES = BG.tobytes()


def scene_base() -> Image.Image:
    """Fresh copy of the precomputed background (cheap)."""
    return BG.copy()


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255)
    return mask


def paste_rounded(canvas: Image.Image, img: Image.Image, box: tuple[int, int, int, int], radius: int):
    x0, y0, x1, y1 = box
    fitted = img.resize((x1 - x0, y1 - y0), Image.LANCZOS).convert("RGB")
    canvas.paste(fitted, (x0, y0), rounded_mask(fitted.size, radius))


def ken_burns(canvas: Image.Image, src: Image.Image, box: tuple[int, int, int, int],
              progress: float, *, zoom_from=1.0, zoom_to=1.09, radius=26, drift=0.02):
    """Slow zoom/pan of a screenshot inside a rounded card."""
    x0, y0, x1, y1 = box
    bw, bh = x1 - x0, y1 - y0
    zoom = zoom_from + (zoom_to - zoom_from) * ease(progress)
    sw, sh = src.size
    target_ratio = bw / bh
    src_ratio = sw / sh
    if src_ratio > target_ratio:
        ch = sh
        cw = int(sh * target_ratio)
    else:
        cw = sw
        ch = int(sw / target_ratio)
    cw = int(cw / zoom)
    ch = int(ch / zoom)
    cx = (sw - cw) // 2 + int((progress - 0.5) * drift * sw)
    cy = (sh - ch) // 2
    cx = max(0, min(sw - cw, cx))
    cy = max(0, min(sh - ch, cy))
    cropped = src.crop((cx, cy, cx + cw, cy + ch))
    paste_rounded(canvas, cropped, box, radius)


def wrap(draw: ImageDraw.ImageDraw, text: str, fnt, max_width: int) -> list[str]:
    words = text.split()
    lines, current = [], ""
    for word in words:
        trial = f"{current} {word}".strip()
        if draw.textlength(trial, font=fnt) <= max_width:
            current = trial
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_center(draw, text, y, fnt, fill, max_width=W - 300, spacing=1.28):
    lines = wrap(draw, text, fnt, max_width)
    line_h = int(fnt.size * spacing)
    total = line_h * len(lines)
    start = y - total // 2
    for index, line in enumerate(lines):
        width = draw.textlength(line, font=fnt)
        draw.text(((W - width) / 2, start + index * line_h), line, font=fnt, fill=fill)
    return total


def caption_bar(canvas: Image.Image, text: str, alpha: int = 190):
    """Accessible English subtitle band at the bottom."""
    draw = ImageDraw.Draw(canvas)
    fnt = font(34, 600)
    lines = wrap(draw, text, fnt, W - 380)
    line_h = 46
    height = line_h * len(lines) + 34
    band = Image.new("RGBA", (W, height), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(band)
    bdraw.rounded_rectangle((0, 0, W - 1, height - 1), radius=0, fill=(8, 26, 18, alpha))
    canvas.paste(Image.alpha_composite(
        canvas.crop((0, H - height, W, H)).convert("RGBA"), band).convert("RGB"), (0, H - height))
    draw = ImageDraw.Draw(canvas)
    for index, line in enumerate(lines):
        width = draw.textlength(line, font=fnt)
        draw.text(((W - width) / 2, H - height + 17 + index * line_h), line, font=fnt, fill=WHITE)


def logo_paste(canvas: Image.Image, size: int, center: tuple[int, int], opacity: float = 1.0):
    emblem = Image.open(LOGO).convert("RGBA")
    ratio = size / max(emblem.size)
    emblem = emblem.resize((int(emblem.width * ratio), int(emblem.height * ratio)), Image.LANCZOS)
    if opacity < 1.0:
        alpha = emblem.split()[3].point(lambda v: int(v * opacity))
        emblem.putalpha(alpha)
    canvas.paste(emblem, (center[0] - emblem.width // 2, center[1] - emblem.height // 2), emblem)


def scene_title(t: float) -> Image.Image:
    canvas = scene_base()
    draw = ImageDraw.Draw(canvas)
    appear = ease(t / 0.8)
    logo_paste(canvas, int(360 * (0.92 + 0.08 * appear)), (W // 2, 330), appear)

    f_eyebrow = font(30, 700)
    draw_centered(draw, "NASA SPACE APPS CHALLENGE 2026", 520, f_eyebrow, LIME, appear)
    draw_centered(draw, "ROOTWISE AI", 610, font(112, 800), WHITE, appear)
    draw_centered(draw, "Grow decisions, harvest the future.", 745, font(44, 600), LIME, appear * 0.95)
    draw_centered(draw, "Team ROOTWISE AI  ·  Lima, Peru", 830, font(32, 500), (200, 216, 200), appear * 0.9)
    caption_bar(canvas, "We are Team ROOTWISE AI.")
    return canvas


def draw_centered(draw, text, y, fnt, fill, alpha=1.0, max_width=W - 300):
    if alpha <= 0.02:
        return
    colour = tuple(int(c * alpha + (1 - alpha) * bg_c) for c, bg_c in zip(fill, (12, 40, 29)))
    draw_center(draw, text, y, fnt, colour, max_width)


def scene_challenge(t: float) -> Image.Image:
    canvas = scene_base()
    draw = ImageDraw.Draw(canvas)
    p = ease(t / 1.0)
    draw_centered(draw, "THE CHALLENGE", 300, font(32, 700), LIME, p)
    draw_centered(draw, "Farmers must decide what to plant while the climate shifts",
                  400, font(62, 700), WHITE, p, max_width=1480)
    draw_centered(draw, "Irregular rain · scarce water · degraded soils · no local advice",
                  560, font(34, 500), (198, 216, 200), p)

    stats = [("1.5 \u00b0C", "warmer already"), ("70 %", "freshwater used"), ("0 bars", "in many plots")]
    for index, (value, label) in enumerate(stats):
        delay = 0.35 + index * 0.18
        alpha = ease((t - delay) / 0.7)
        if alpha <= 0.01:
            continue
        cx = 520 + index * 440
        draw_centered_at(draw, value, cx, 700, font(76, 800), WHITE, alpha)
        draw_centered_at(draw, label, cx, 790, font(28, 500), (186, 206, 188), alpha)

    caption_bar(canvas, "Farmers must choose what to plant as the climate shifts.")
    return canvas


def draw_centered_at(draw, text, cx, y, fnt, fill, alpha=1.0):
    if alpha <= 0.02:
        return
    colour = tuple(int(c * alpha + (1 - alpha) * bg_c) for c, bg_c in zip(fill, (13, 46, 29)))
    width = draw.textlength(text, font=fnt)
    draw.text((cx - width / 2, y), text, font=fnt, fill=colour)


def scene_name(t: float) -> Image.Image:
    canvas = scene_base()
    draw = ImageDraw.Draw(canvas)
    p = ease(t / 0.8)
    draw_centered(draw, "ROOTWISE AI", 430, font(132, 800), WHITE, p)
    draw_centered(draw, "Grow decisions, harvest the future.", 570, font(50, 600), LIME, p)
    draw_centered(draw, "Explained crop-rotation advice for small farms", 665, font(34, 500),
                  (198, 216, 200), p * 0.95)
    labels = ["NASA Earth data", "Explainable engine", "Offline first", "5 languages"]
    for index, label in enumerate(labels):
        alpha = ease((t - 0.5 - index * 0.1) / 0.6)
        if alpha <= 0.01:
            continue
        x = 360 + index * 305
        draw_centered_at(draw, label, x, 800, font(26, 600), LIME, alpha)
    caption_bar(canvas, "ROOTWISE AI \u2014 grow decisions, harvest the future.")
    return canvas


SCENES = {
    "dashboard": SHOTS / "02-dashboard.png",
    "parcel": SHOTS / "03-parcel.png",
    "simulator": SHOTS / "04-simulator.png",
    "nasa": SHOTS / "05-nasa.png",
    "offline": SHOTS / "07-offline.png",
}
_cache: dict[str, Image.Image] = {}


def shot(name: str) -> Image.Image:
    if name not in _cache:
        _cache[name] = Image.open(SCENES[name]).convert("RGB")
    return _cache[name]


def scene_idea(t: float) -> Image.Image:
    canvas = scene_base()
    draw = ImageDraw.Draw(canvas)
    draw_centered(draw, "HOW IT WORKS", 140, font(26, 700), LIME, 1.0)

    # Four screens cycle every 2.5 s with a Ken Burns move.
    names = ["dashboard", "parcel", "simulator", "nasa"]
    slot = 2.5
    index = min(int(t // slot), len(names) - 1)
    local = (t - index * slot) / slot
    box = (210, 230, W - 210, 830)
    ken_burns(canvas, shot(names[index]), box, local)
    draw = ImageDraw.Draw(canvas)
    label = {"dashboard": "Your field at a glance",
             "parcel": "Draw the plot, read the terrain",
             "simulator": "Compare crops, see why",
             "nasa": "NASA Earth observation"}[names[index]]
    draw_centered(draw, label, 862, font(30, 600), (222, 233, 220), 1.0)
    return canvas


def scene_future(t: float) -> Image.Image:
    canvas = scene_base()
    draw = ImageDraw.Draw(canvas)
    p = ease(t / 0.9)
    draw_centered(draw, "IT ALSO WORKS WHERE THE SIGNAL DOES NOT", 250,
                  font(28, 700), LIME, p)
    draw_centered(draw, "Offline first, in five languages", 340, font(70, 700), WHITE, p)

    box = (300, 430, W - 300, 830)
    ken_burns(canvas, shot("offline"), box, t / 10.0, zoom_from=1.0, zoom_to=1.05)
    draw = ImageDraw.Draw(canvas)
    draw_centered(draw, "Spanish · English · Runasimi · Kichwa · Asháninka", 862,
                  font(30, 600), (222, 233, 220), p)
    caption_bar(canvas, "Works offline, in five languages \u2014 no farmer left out.")
    return canvas


def scene_close(t: float) -> Image.Image:
    canvas = scene_base()
    draw = ImageDraw.Draw(canvas)
    p = ease(t / 0.7)
    logo_paste(canvas, int(300 * (0.93 + 0.07 * p)), (W // 2, 300), p)
    draw_centered(draw, "Healthier soil. Resilient farms.", 520, font(64, 700), WHITE, p)
    draw_centered(draw, "On Earth \u2014 and beyond.", 610, font(52, 600), LIME, p)
    draw_centered(draw, "github.com/Sarai6e/ROOTWISE-AI", 730, font(34, 700), (222, 233, 220), p)
    draw_centered(draw, "Narration generated with AI text-to-speech", 800, font(22, 400),
                  (150, 176, 154), p * 0.9)
    caption_bar(canvas, "Healthier soil, resilient farms \u2014 on Earth and beyond.")
    return canvas


def frame_at(time_s: float) -> Image.Image:
    if time_s < 2.0:
        return scene_title(time_s)
    if time_s < 5.0:
        return scene_challenge(time_s - 2.0)
    if time_s < 10.0:
        return scene_name(time_s - 5.0)
    if time_s < 20.0:
        return scene_idea(time_s - 10.0)
    if time_s < 25.0:
        return scene_future(time_s - 20.0)
    return scene_close(time_s - 25.0)


def main() -> int:
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    total = int(DURATION * FPS)
    if "--stills" in sys.argv:
        stills = ROOT / "video" / "stills"
        stills.mkdir(parents=True, exist_ok=True)
        for moment in (1.0, 3.5, 6.0, 12.0, 16.0, 22.0, 27.0):
            frame_at(moment).save(stills / f"still-{moment:04.1f}.png")
            print("still", moment, flush=True)
        return 0
    cmd = [
        ffmpeg, "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-i", str(AUDIO / "01-intro.wav"),
        "-i", str(AUDIO / "02-challenge.wav"),
        "-i", str(AUDIO / "03-name.wav"),
        "-i", str(AUDIO / "04-idea.wav"),
        "-i", str(AUDIO / "05-future.wav"),
    ]
    # Voice-over placement (seconds) matching the guide's timing marks.
    delays = [0.25, 2.10, 5.05, 10.10, 20.10]
    filters = []
    for index, delay in enumerate(delays, start=1):
        ms = int(delay * 1000)
        filters.append(f"[{index}:a]adelay={ms}|{ms}[a{index}]")
    filters.append("".join(f"[a{i}]" for i in range(1, 6)) + "amix=inputs=5:normalize=0[mix]")
    filters.append("[mix]volume=1.6,acompressor=threshold=-18dB:ratio=3:attack=5:release=120,"
                   "alimiter=limit=0.95[aout]")
    cmd += ["-filter_complex", ";".join(filters), "-map", "0:v", "-map", "[aout]"]
    cmd += [
        "-c:v", "libx264", "-preset", "medium", "-crf", "18",
        "-pix_fmt", "yuv420p", "-r", str(FPS),
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
        "-t", f"{DURATION}", "-movflags", "+faststart",
        "-metadata", "title=ROOTWISE AI - 30s project demo (NASA Space Apps 2026)",
        "-metadata", "comment=Narration generated with AI text-to-speech. Screenshots from the running ROOTWISE AI application.",
        str(OUT),
    ]

    process = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL,
                               stderr=subprocess.DEVNULL)
    assert process.stdin is not None
    try:
        for index in range(total):
            frame = frame_at(index / FPS)
            process.stdin.write(frame.tobytes())
            if index % 150 == 0:
                print(f"frame {index}/{total}", flush=True)
        process.stdin.close()
    except BrokenPipeError:
        pass
    code = process.wait()
    if code != 0:
        print("ffmpeg failed with code", code)
        return code
    print("saved", OUT, f"{OUT.stat().st_size / 1e6:.1f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
