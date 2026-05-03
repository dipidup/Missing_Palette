#!/usr/bin/env python3
"""
build_gallery.py
================

APPEND-ONLY MODE.

Reads a public Google Sheet (CSV export) and inserts cards from the sheet
into gallery.html, between AUTO:STRIP-APPEND markers placed at the end of
each medium-strip. The hand-curated cards already in gallery.html are
NEVER touched.

If the sheet is empty, deleted, or unreachable, the static base remains
untouched. The site stays live with its original hand-curated cards.

WORKFLOW (after one-time install):
  1. Drop a new image file into img/gallery/
  2. Add a row to your Google Sheet (medium, filename, title, year, oneliner)
  3. Commit + push (or wait for the hourly cron)
  4. GitHub Actions runs this script. The new card is inserted at the end
     of the relevant medium-strip.
  5. Card appears on the live site within ~60 seconds.

ONE-TIME INSTALL:
  Run scripts/_add_gallery_markers.py first. It inserts AUTO:STRIP-APPEND
  marker pairs at the end of each medium-strip's existing card list.

SHEET COLUMNS (case-insensitive header row required):
  medium      Single letter: W (watercolor), O (oil), S (sketch),
              A (acrylic), B (out of the box / box), K (worKshop)
  filename    e.g. "water (16).jpg" - exact filename in img/gallery/
  title       Display title. Use Devanagari directly: भण्डि बाबा
  year        e.g. 2026 (or blank)
  oneliner    Short one-sentence description (optional)
  status      "published" or "draft" (optional, default published)

CONFIG:
  Set the GALLERY_SHEET_CSV_URL environment variable to your sheet's
  published CSV URL. In GitHub Actions this is set in the workflow file.
"""

import os
import re
import sys
import csv
import io
from pathlib import Path
from urllib.request import urlopen
from urllib.error import URLError

# ----------------------------------------------------------------------------
# Config
# ----------------------------------------------------------------------------
SHEET_CSV_URL = os.environ.get('GALLERY_SHEET_CSV_URL', '')

# Map single-letter medium codes (case-insensitive) to a friendly label
# that appears in card meta lines. The medium "id" used in the marker
# (e.g. "watercolor") is the dict key on the right.
MEDIUM_MAP = {
    'W': ('watercolor', 'Watercolor'),
    'O': ('oil',        'Oil'),
    'S': ('sketch',     'Sketch'),
    'A': ('acrylic',    'Acrylic'),
    'B': ('oob',        'Mixed'),
    'K': ('workshop',   'Workshop'),
}

# ----------------------------------------------------------------------------
# Paths
# ----------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent
GALLERY_HTML = ROOT / 'gallery.html'

START_TPL = '<!-- AUTO:STRIP-APPEND {medium} -->'
END_TPL = '<!-- AUTO:STRIP-APPEND-END {medium} -->'

# Detect Devanagari characters - if title contains any, wrap in <span class="hi">
DEVANAGARI = re.compile(r'[\u0900-\u097F]')


def fetch_sheet(url):
    """Fetch the CSV export and return a list of dicts."""
    if not url:
        print("FATAL: GALLERY_SHEET_CSV_URL not set.", file=sys.stderr)
        print("Set it in your GitHub Actions workflow, or export it in your "
              "shell for local testing.", file=sys.stderr)
        sys.exit(1)
    print(f"Fetching sheet: {url[:80]}...")
    try:
        raw = urlopen(url, timeout=30).read().decode('utf-8')
    except URLError as e:
        # Don't fail the whole build - just leave the static gallery alone.
        print(f"WARN: could not fetch sheet ({e}). Leaving gallery.html "
              f"unchanged.", file=sys.stderr)
        sys.exit(0)
    reader = csv.DictReader(io.StringIO(raw))
    rows = []
    for row in reader:
        norm = {}
        for k, v in row.items():
            if k is None:
                continue
            key = k.strip().lower()
            val = (v.strip() if isinstance(v, str) else '')
            norm[key] = val
        rows.append(norm)
    return rows


def render_title(title):
    """If title contains Devanagari, wrap inside <span class='hi'>."""
    if DEVANAGARI.search(title):
        return f'<span class="hi">{title}</span>'
    return title


def render_card(row, medium_label):
    """Render one strip-card HTML block from a sheet row."""
    filename = row.get('filename', '').strip()
    if not filename:
        return None
    title_raw = row.get('title', '').strip() or filename
    title_html = render_title(title_raw)
    year = row.get('year', '').strip()
    oneliner = row.get('oneliner', '').strip()

    # Build meta string: "Watercolor · 2018" or just "Watercolor"
    meta = medium_label
    if year:
        meta += f' · <span class="year">{year}</span>'

    src = f'img/gallery/{filename}'
    plain_meta = f'{medium_label} on paper · {year}' if year else medium_label

    card = (
        f'            <a class="strip-card" '
        f'data-lb-src="{src}" '
        f'data-lb-title="{title_raw}" '
        f'data-lb-meta="{plain_meta}" '
        f'href="#" onclick="return false;">\n'
        f'                <div class="strip-card-img">'
        f'<img src="{src}" alt="{title_raw}" loading="lazy"></div>\n'
        f'                <div class="strip-card-caption">\n'
        f'                    <span class="strip-card-title">{title_html}</span>\n'
        f'                    <span class="strip-card-meta">{meta}</span>\n'
    )
    if oneliner:
        card += f'                    <span class="strip-card-oneliner">{oneliner}</span>\n'
    card += (
        f'                </div>\n'
        f'            </a>'
    )
    return card


def replace_append_zone(html, medium_id, cards_html):
    """Replace content between AUTO:STRIP-APPEND markers for one medium."""
    start_marker = START_TPL.format(medium=medium_id)
    end_marker = END_TPL.format(medium=medium_id)

    if start_marker not in html or end_marker not in html:
        print(f"  WARN: markers for '{medium_id}' not found in gallery.html. "
              f"Run scripts/_add_gallery_markers.py once.", file=sys.stderr)
        return html

    pattern = re.compile(
        re.escape(start_marker) + r'.*?' + re.escape(end_marker),
        re.DOTALL
    )
    if cards_html:
        replacement = f'{start_marker}\n{cards_html}\n            {end_marker}'
    else:
        # Empty append zone - keep markers but nothing between them
        replacement = f'{start_marker}\n            {end_marker}'
    return pattern.sub(replacement, html, count=1)


def main():
    if not GALLERY_HTML.exists():
        print(f"FATAL: gallery.html not found at {GALLERY_HTML}", file=sys.stderr)
        sys.exit(1)

    rows = fetch_sheet(SHEET_CSV_URL)
    print(f"  Fetched {len(rows)} rows from sheet.")

    # Group by medium code
    by_medium = {code: [] for code in MEDIUM_MAP}
    skipped = 0
    for row in rows:
        if row.get('status', 'published').lower() == 'draft':
            skipped += 1
            continue
        code = row.get('medium', '').strip().upper()
        if code not in MEDIUM_MAP:
            print(f"  WARN: unknown medium '{code}' for filename="
                  f"'{row.get('filename')}', skipped")
            continue
        by_medium[code].append(row)

    if skipped:
        print(f"  Skipped {skipped} draft row(s).")

    html = GALLERY_HTML.read_text(encoding='utf-8')

    # Render and inject each medium's append zone
    total_cards = 0
    for code, (medium_id, label) in MEDIUM_MAP.items():
        rows_for_medium = by_medium[code]
        cards = [render_card(r, label) for r in rows_for_medium]
        cards = [c for c in cards if c]
        cards_html = '\n\n'.join(cards) if cards else ''
        html = replace_append_zone(html, medium_id, cards_html)
        print(f"  {label:12} ({code})  -  {len(cards)} appended card(s)")
        total_cards += len(cards)

    GALLERY_HTML.write_text(html, encoding='utf-8')
    print(f"\nWrote gallery.html  ({total_cards} appended cards).")


if __name__ == '__main__':
    main()
