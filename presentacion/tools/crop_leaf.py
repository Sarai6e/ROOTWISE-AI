"""Crop the tomato-leaf photo out of the original Spanish health screenshot."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
src = ROOT.parent / "docs" / "evidencias" / "capturas" / "08-sanidad.png"
out = ROOT / "assets" / "leaf.jpg"
out.parent.mkdir(parents=True, exist_ok=True)

img = Image.open(src).convert("RGB")
w, h = img.size
print("source size:", img.size)
# The upload preview sits in the left card, roughly this region of the 1400x1500 shot.
box = (int(w * 0.215), int(h * 0.245), int(w * 0.515), int(h * 0.385))
img.crop(box).save(out, quality=92)
print("cropped ->", out, Image.open(out).size)
