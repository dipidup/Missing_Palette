#!/usr/bin/env python3
"""
ONE-TIME helper. Inserts empty AUTO:STRIP-APPEND marker pairs at the END of
each medium-strip in gallery.html. The build script will inject sheet rows
between these markers without touching the static cards above.

Idempotent: if markers already exist, does nothing.
Makes a .bak backup of gallery.html before changing anything.

Run once from the repo root:
    python3 scripts/_add_gallery_markers.py

After install, gallery.html will have something like:

    <div class="medium-strip" id="watercolor-strip">
        <a class="strip-card">...painting 1 (static)...</a>
        <a class="strip-card">...painting 2 (static)...</a>
        ... (existing cards untouched) ...

            <!-- AUTO:STRIP-APPEND watercolor -->
            <!-- AUTO:STRIP-APPEND-END watercolor -->
    </div>
"""
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GALLERY_HTML = ROOT / 'gallery.html'

# Mediums to process - matches the IDs in gallery.html
MEDIUMS = [
    'watercolor',
    'oil',
    'sketch',
    'acrylic',
    'oob',
    'workshop',
]


def find_strip_close(html, strip_id):
    """
    Find the closing </div> for <div class="medium-strip" id="{strip_id}">.
    Returns the index of the start of '</div>' or None if not found.
    """
    open_pattern = re.compile(
        r'<div class="medium-strip" id="' + re.escape(strip_id) + r'">'
    )
    m = open_pattern.search(html)
    if not m:
        return None

    # Walk forward, counting <div and </div>, until depth returns to 0
    depth = 1
    i = m.end()
    while i < len(html) and depth > 0:
        next_open = html.find('<div', i)
        next_close = html.find('</div>', i)
        if next_close == -1:
            return None
        if next_open != -1 and next_open < next_close:
            depth += 1
            i = next_open + 4
        else:
            depth -= 1
            if depth == 0:
                return next_close
            i = next_close + 6
    return None


def main():
    if not GALLERY_HTML.exists():
        print(f"FATAL: gallery.html not found at {GALLERY_HTML}", file=sys.stderr)
        sys.exit(1)

    html = GALLERY_HTML.read_text(encoding='utf-8')

    # Already inserted?
    if all(f'AUTO:STRIP-APPEND {m}' in html for m in MEDIUMS):
        print("All append markers already present. Nothing to do.")
        return

    backup = GALLERY_HTML.with_suffix('.html.bak')
    shutil.copy2(GALLERY_HTML, backup)
    print(f"Backup: {backup.name}")

    # Process bottom-up so earlier indices remain valid as we modify
    inserted = 0
    for medium in reversed(MEDIUMS):
        strip_id = f'{medium}-strip'
        start_marker = f'<!-- AUTO:STRIP-APPEND {medium} -->'
        end_marker = f'<!-- AUTO:STRIP-APPEND-END {medium} -->'

        if start_marker in html:
            print(f"  {medium:12} markers already present, skipped")
            continue

        close_idx = find_strip_close(html, strip_id)
        if close_idx is None:
            print(f"  {medium:12} could not find <div class=\"medium-strip\" "
                  f"id=\"{strip_id}\">", file=sys.stderr)
            continue

        # Insert empty marker pair JUST before the strip's closing </div>.
        # Indent to match neighboring card indentation (12 spaces in this site).
        indent = '            '
        injection = (
            '\n'
            f'{indent}{start_marker}\n'
            f'{indent}{end_marker}\n'
            '        '
        )
        html = html[:close_idx] + injection + html[close_idx:]
        inserted += 1
        print(f"  {medium:12} markers added")

    GALLERY_HTML.write_text(html, encoding='utf-8')
    print(f"\nDone. {inserted} medium(s) marked.")


if __name__ == '__main__':
    main()
