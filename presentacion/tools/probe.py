import subprocess
import sys

import imageio_ffmpeg

path = sys.argv[1]
ff = imageio_ffmpeg.get_ffmpeg_exe()
out = subprocess.run([ff, "-hide_banner", "-i", path], capture_output=True, text=True)
text = (out.stderr or "") + (out.stdout or "")
for line in text.splitlines():
    if "Duration" in line or "Stream #" in line:
        print(line.strip())
