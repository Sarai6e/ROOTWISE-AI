import re
import sys
from collections import Counter
from pathlib import Path
from zipfile import ZipFile

from pptx import Presentation
from pptx.util import Emu

src = Path(sys.argv[1])
prs = Presentation(str(src))

fonts = Counter()
colors = Counter()
fills = Counter()

for slide in prs.slides:
    for shape in slide.shapes:
        if not shape.has_text_frame:
            continue
        for para in shape.text_frame.paragraphs:
            for run in para.runs:
                if run.font.name:
                    fonts[run.font.name] += 1
                try:
                    if run.font.color and run.font.color.type is not None:
                        if run.font.color.rgb:
                            colors[str(run.font.color.rgb)] += 1
                except Exception:
                    pass
        try:
            fill = shape.fill
            if fill.type is not None and fill.fore_color.rgb:
                fills[str(fill.fore_color.rgb)] += 1
        except Exception:
            pass

print("FONTS:", fonts.most_common(10))
print("TEXT COLORS:", colors.most_common(15))
print("FILLS:", fills.most_common(15))

with ZipFile(str(src)) as z:
    names = [n for n in z.namelist() if "theme" in n and n.endswith(".xml")]
    for name in names:
        data = z.read(name).decode("utf-8", "ignore")
        srgb = re.findall(r'<a:srgbClr val="([0-9A-Fa-f]{6})"', data)
        latin = re.findall(r'<a:latin typeface="([^"]+)"', data)
        print(f"\n[{name}]")
        print("  colors:", list(dict.fromkeys(srgb))[:14])
        print("  fonts:", list(dict.fromkeys(latin))[:6])
