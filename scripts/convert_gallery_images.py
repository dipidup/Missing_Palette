#!/usr/bin/env python3
"""
convert_gallery_images.py
=========================

For every .jpg / .jpeg in img/gallery/, emit a .webp and (if pillow-avif-plugin
is installed) an .avif sibling. Idempotent — files that already exist are
skipped, so this is safe to re-run after dropping new images in.

Run after you upload new gallery images, OR wire into the GitHub Actions
workflow so it runs automatically on push.

Requirements:
  pip install Pillow                   # WebP support is built into Pillow
  pip install pillow-avif-plugin       # optional, adds AVIF support

Outputs land next to the source jpg (so img/gallery/water (1).jpg gets a
water (1).webp and water (1).avif sibling). The HTML <picture> tags in
gallery.html reference these siblings by replacing the file extension.
"""

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("FATAL: Pillow not installed. Run:  pip install Pillow")

AVIF_AVAILABLE = False
try:
    import pillow_avif  # noqa: F401
    AVIF_AVAILABLE = True
except ImportError:
    pass

_HERE = Path(__file__).resolve().parent
ROOT = _HERE.parent if _HERE.name == 'scripts' else _HERE

GALLERY_DIR = ROOT / 'img' / 'gallery'

# Tuning notes:
#   - Source JPEGs are typically already saved at ~80 quality, so WEBP_QUALITY
#     needs to be lower than that to actually save bytes (else WebP just
#     re-encodes the same information).
#   - AVIF's quality scale is offset relative to JPEG/WebP; 60 is near-
#     visually-lossless for photographic content.
WEBP_QUALITY = 75
AVIF_QUALITY = 60

SOURCE_EXTS = {'.jpg', '.jpeg', '.png'}


def convert_one(src):
    """Produce .webp and .avif siblings for one source jpg. Returns (made_webp, made_avif)."""
    webp_out = src.with_suffix('.webp')
    avif_out = src.with_suffix('.avif')
    made_webp = made_avif = False

    if not webp_out.exists():
        try:
            with Image.open(src) as im:
                im.save(webp_out, 'WEBP', quality=WEBP_QUALITY, method=6)
            made_webp = True
            print(f"  webp  {webp_out.name}")
        except Exception as e:
            print(f"  ERR   {webp_out.name}: {e}")

    if AVIF_AVAILABLE and not avif_out.exists():
        try:
            with Image.open(src) as im:
                im.save(avif_out, 'AVIF', quality=AVIF_QUALITY)
            made_avif = True
            print(f"  avif  {avif_out.name}")
        except Exception as e:
            print(f"  ERR   {avif_out.name}: {e}")

    return made_webp, made_avif


def main():
    if not GALLERY_DIR.exists():
        sys.exit(f"FATAL: {GALLERY_DIR} not found")

    if not AVIF_AVAILABLE:
        print("note: pillow-avif-plugin not installed; AVIF output skipped.")
        print("      pip install pillow-avif-plugin  to enable.\n")

    sources = sorted(
        p for p in GALLERY_DIR.iterdir()
        if p.is_file() and p.suffix.lower() in SOURCE_EXTS
    )
    print(f"Scanning {GALLERY_DIR.relative_to(ROOT)}  ({len(sources)} sources)\n")

    total_webp = total_avif = 0
    for src in sources:
        w, a = convert_one(src)
        total_webp += int(w)
        total_avif += int(a)

    skipped = len(sources) - max(total_webp, total_avif)
    print()
    print(f"Created {total_webp} webp + {total_avif} avif. "
          f"{skipped} source(s) already had outputs.")


if __name__ == '__main__':
    main()
