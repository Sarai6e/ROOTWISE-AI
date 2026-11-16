import sys
from pathlib import Path

from pptx import Presentation
from pptx.util import Emu

src = Path(sys.argv[1])
out = Path(sys.argv[2])
prs = Presentation(str(src))
lines = [f"SLIDE SIZE: {prs.slide_width}x{prs.slide_height} EMU "
         f"({Emu(prs.slide_width).inches:.2f}x{Emu(prs.slide_height).inches:.2f} in)"]
lines.append(f"SLIDES: {len(prs.slides)}")

for idx, slide in enumerate(prs.slides, 1):
    lines.append(f"\n{'='*70}\nSLIDE {idx}  layout='{slide.slide_layout.name}'")
    for shape in slide.shapes:
        kind = shape.shape_type
        name = shape.name
        pos = f"L{Emu(shape.left).inches:.2f} T{Emu(shape.top).inches:.2f} W{Emu(shape.width).inches:.2f} H{Emu(shape.height).inches:.2f}"
        lines.append(f"  - [{kind}] {name} ({pos})")
        if shape.has_text_frame:
            for para in shape.text_frame.paragraphs:
                text = "".join(run.text for run in para.runs)
                if text.strip():
                    sizes = {run.font.size.pt for run in para.runs if run.font.size}
                    bold = {run.font.bold for run in para.runs}
                    lines.append(f"      lvl{para.level} | {text} | size={sizes} bold={bold}")
        if shape.has_table:
            for row in shape.table.rows:
                cells = [c.text.strip() for c in row.cells]
                lines.append("      TABLE ROW: " + " | ".join(cells))
    if slide.has_notes_slide and slide.notes_slide.notes_text_frame.text.strip():
        notes = slide.notes_slide.notes_text_frame.text.strip()
        lines.append(f"  NOTES: {notes[:500]}")

out.write_text("\n".join(lines), encoding="utf-8")
print("written", out, "slides:", len(prs.slides))
