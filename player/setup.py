from struct import pack
import subprocess
import sys
import time


def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])


packages = ["django", "youtube-dl", "youtube-search-python",
            "pytube", "yt_dlp", "git+https://github.com/Cupcakus/pafy"]

for p in packages:
    install(p)

time.sleep(5)
