import sys
from pathlib import Path

from pypdf import PdfReader

pdf = Path(sys.argv[1])
out = Path(sys.argv[2])
reader = PdfReader(str(pdf))
parts = [f"PAGES: {len(reader.pages)}"]
for i, page in enumerate(reader.pages, 1):
    text = page.extract_text() or ""
    parts.append(f"\n===== PAGE {i} =====\n{text.strip()}")
out.write_text("\n".join(parts), encoding="utf-8")
print("written", out)
