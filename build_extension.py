#!/usr/bin/env python3
"""
Build the Chrome extension from the shared Sovereign source.

    python3 build_extension.py

Output:
    dist/sovereign-extension/            ← "Load unpacked" this folder to test
    dist/sovereign-extension-<ver>.zip   ← upload this to the Chrome Web Store

The website (PWA) and the extension share every content and app file. The build
only swaps in the extension manifest + background worker, adds extension icon
sizes, and leaves out PWA-only files (service worker, web manifest).
"""
import json, re, shutil, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "dist" / "sovereign-extension"

SHARED = [
    "index.html", "css/styles.css", "js/content.js", "js/app.js", "js/security.js", "js/sound-engine.js", "js/noise-worklet.js",
    "content/lesson-what-is-sexual-energy.js", "content/lesson-energetic-signature.js",
    "content/guide.js", "content/deepen.js", "content/daycycle.js", "content/scripture.js", "content/tracker.js",
    "js/protocols.js", "content/hand.js", "content/lesson-science-of-retention.js", "content/lesson-grounding-bioelectricity.js", "content/lesson-role-of-breathwork.js", "content/lesson-transmutation.js", "content/lesson-esoteric-principles.js", "content/lesson-pitfalls.js", "content/lesson-akashic-window.js", "content/lesson-planetary-hand.js",
    "icons/icon-192.png", "icons/icon-512.png", "icons/icon.svg",
    "fonts/cormorant-garamond.woff", "fonts/cormorant-garamond-italic.woff",
    "fonts/plus-jakarta-sans.woff", "fonts/plus-jakarta-sans-italic.woff",
    "fonts/OFL-CormorantGaramond.txt", "fonts/OFL-PlusJakartaSans.txt",
]

def make_icons(dest: Path):
    """Render 16/32/48/128px icons from the same design as the app icon."""
    from PIL import Image, ImageDraw
    for size in (16, 32, 48, 128):
        S = size * 8
        im = Image.new("RGBA", (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=(11, 11, 12, 255))
        c = S / 2; gold = (201, 169, 97, 255)
        rings = [(96, gold, 12)] if size <= 32 else [(150, (201, 169, 97, 130), 6), (96, gold, 8)]
        for r, col, w in rings:
            r = r / 256 * c; w = max(1, int(w / 256 * c))
            d.ellipse([c - r, c - r, c + r, c + r], outline=col, width=w)
        r = (44 if size <= 32 else 34) / 256 * c
        d.ellipse([c - r, c - r, c + r, c + r], fill=gold)
        im.resize((size, size), Image.LANCZOS).save(dest / f"icon-{size}.png")

def main():
    if OUT.exists(): shutil.rmtree(OUT)
    for rel in SHARED:
        src, dst = ROOT / rel, OUT / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)

    # Printables: the whole Sovereign Library folder
    shutil.copytree(ROOT / "library", OUT / "library", ignore=shutil.ignore_patterns("README.md", "precache.txt"))

    # index.html: drop the PWA manifest link (not part of the extension)
    html = (OUT / "index.html").read_text()
    html = re.sub(r'\s*<link rel="manifest"[^>]*>', "", html)
    (OUT / "index.html").write_text(html)

    shutil.copy2(ROOT / "extension" / "manifest.json", OUT / "manifest.json")
    for f in ("background.js", "offscreen.html", "offscreen.js"):
        shutil.copy2(ROOT / "extension" / f, OUT / f)
    make_icons(OUT / "icons")

    version = json.loads((OUT / "manifest.json").read_text())["version"]
    zpath = ROOT / "dist" / f"sovereign-extension-{version}.zip"
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(OUT.rglob("*")):
            if f.is_file(): z.write(f, f.relative_to(OUT))   # manifest.json at the zip root
    print(f"Built {OUT}\nZip   {zpath}")

if __name__ == "__main__":
    main()
