#!/usr/bin/env python3
"""
Cleanup pass for Missing Palette site files.

Fixes (in one pass, idempotent):
  1. em-dash (—, &mdash;)  ->  short dash (-)
  2. broken &dash; entity   ->  short dash (-)
  3. broken css link to /css/blog-post.css (file does not exist) -> removed
  4. obvious AI-tell phrases rewritten in Ankit's own voice
  5. legal.html relative privacy.html link -> /privacy.html
  6. index.html: gallery.html#oil (1) -> gallery.html#aanchal
  7. blog.html nav cleanup (it had /#about etc which work but use stale labels)

NOT fixed by this script (need real content / your input):
  - hostel4.html template content (handled separately, see hostel4_replace.py)
  - products.html REPLACE_WITH_YOUR_AMAZON_LINK placeholders (you must paste real links)

Run from the folder containing the HTML files.
"""

import re
import os
import shutil
from pathlib import Path

WORKDIR = Path(__file__).parent
BACKUP = WORKDIR / "_backup_before_cleanup"

# ---------- Files to process ----------
HTML_FILES = [
    "index.html", "gallery.html", "blog.html", "exhibitions.html",
    "register.html", "products.html", "legal.html", "privacy.html",
    "Ghat.html", "watercolor-portrait-guide.html", "POST_TEMPLATE.html",
    # hostel4.html handled separately
]

# ---------- 1. Dash replacements ----------
# em-dash with surrounding spaces  ->  " - " (already a single space on each side)
# em-dash without surrounding spaces (rare) -> "-"
DASH_REPLACEMENTS = [
    # entities
    (r" &mdash; ", " - "),
    (r" &mdash;", " -"),
    (r"&mdash; ", "- "),
    (r"&mdash;", "-"),
    (r"&dash;", "-"),
    (r"&ndash;", "-"),
    # literal em-dash unicode
    (" \u2014 ", " - "),
    (" \u2014", " -"),
    ("\u2014 ", "- "),
    ("\u2014", "-"),
    # literal en-dash unicode
    (" \u2013 ", " - "),
    ("\u2013", "-"),
]

# ---------- 2. AI-tell phrase rewrites ----------
# These are sentences/phrases that read as obvious AI/LLM defaults.
# The replacements are deliberately plainer.

PHRASE_REPLACEMENTS = [
    # The footer tagline shows on every page - "things in between" reads template-y
    (
        "The studio practice of Indian artist Ankit Agrawal. Watercolor, oil, and the things in between.",
        "Indian artist Ankit Agrawal. Watercolor and oil, mostly. Sketching and acrylic when the work asks for it.",
    ),
    # Hero tagline "stillnesses of contemporary India" - reads like a press release
    (
        "Concerned with the faces, places, and stillnesses of contemporary India.",
        "I paint people and places, mostly across India.",
    ),
    # "The Journal" hero eyebrow - "Notes from the studio" is a classic LLM eyebrow
    (
        "&mdash; Notes from the studio &mdash;",
        "Stories behind the paintings",
    ),
    (
        "- Notes from the studio -",
        "Stories behind the paintings",
    ),
    # Index "Selected works · 2015 -present" eyebrow
    (
        "Selected works &middot; 2015 &ndash;present",
        "Selected works, 2015 onwards",
    ),
    (
        "Selected works · 2015 -present",
        "Selected works, 2015 onwards",
    ),
    (
        "Selected works · 2015 &ndash;present",
        "Selected works, 2015 onwards",
    ),
    # "Here is something new"
    (
        "Here is something new",
        "What's happening lately",
    ),
    # "Here is a little more"
    (
        "Here is a little more",
        "By the numbers",
    ),
    # "Drifting through some kind things people have said"
    (
        "Drifting through some <em>kind things</em> people have said.",
        "Some <em>kind words</em> from students and patrons.",
    ),
    # "— Words from students & patrons —"
    (
        "&mdash; Words from students &amp; patrons &mdash;",
        "Reviews and notes",
    ),
    (
        "- Words from students &amp; patrons -",
        "Reviews and notes",
    ),
    # "Bespoke. Limited slots each year." - too marketing-speak
    (
        "Bespoke. Limited slots each year.",
        "A few each year.",
    ),
    # "A custom collection, by hand."
    (
        "A custom collection, <em>by hand</em>.",
        "Commissioning a <em>custom piece</em>.",
    ),
    # "A few priceless pieces."
    (
        "A few priceless <em>pieces</em>.",
        "A few <em>favourites</em>.",
    ),
    # "A decade of work, noticed."
    (
        "A decade of <em>work</em>, noticed.",
        "What's been recognised.",
    ),
    # Process eyebrow "Process" - replace with section number style
    # (handled by class hide already, but text change for sanity)
    # "Engineer by degree, artist by every other measure" - keep, it's good
    # "Painting from life, not photographs" - keep, it's good
    # blog.html "Long-form notes on the practice — how a watercolor portrait..."
    (
        "Long-form notes on the practice -",
        "Notes on the work -",
    ),
    (
        "Long-form notes on the practice &mdash;",
        "Notes on the work -",
    ),
    # blog "Coming Soon" -> something quieter
    # template residue check
    # the BIT Mesra hostel reference in Journal hero
    (
        "and the BIT Mesra sketchbook that still defines how I see things.",
        "and the BIT Mesra years where it all started.",
    ),
    # commission-prints-note
    (
        "Selected works are also available as <a href=\"/gallery.html?filter=prints\">archival prints</a> if a commission isn't the right fit.",
        "Some of the works are available as <a href=\"/gallery.html?filter=prints\">archival prints</a> as well.",
    ),
]

# ---------- 3. Link / href fixes ----------
LINK_REPLACEMENTS = [
    # Remove dead blog-post.css link (file doesn't exist; styles are inline anyway)
    (
        '<link rel="stylesheet" href="/css/blog-post.css">\n',
        '',
    ),
    (
        '<link rel="stylesheet" href="/css/blog-post.css">',
        '',
    ),
    # legal.html: fix the relative privacy.html link
    (
        '<a href="privacy.html">Privacy Policy</a>',
        '<a href="/privacy.html">Privacy Policy</a>',
    ),
    # index.html: fix the malformed gallery anchor with space
    (
        'href="/gallery.html#oil (1)"',
        'href="/gallery.html#aanchal"',
    ),
]


def backup():
    """Take a one-time backup before first run."""
    if BACKUP.exists():
        print(f"  (backup already exists at {BACKUP.name})")
        return
    BACKUP.mkdir()
    for f in HTML_FILES + ["hostel4.html", "missingpalette.css", "missingpalette_v2.css"]:
        src = WORKDIR / f
        if src.exists():
            shutil.copy2(src, BACKUP / f)
    print(f"  Backed up originals to {BACKUP.name}/")


def apply_to_text(text):
    """Apply all replacements to a string in order."""
    for old, new in DASH_REPLACEMENTS:
        text = text.replace(old, new)
    for old, new in PHRASE_REPLACEMENTS:
        text = text.replace(old, new)
    for old, new in LINK_REPLACEMENTS:
        text = text.replace(old, new)
    # collapse double spaces created by replacements (but preserve indentation)
    text = re.sub(r'(?<=\S) {2,}(?=\S)', ' ', text)
    return text


def main():
    backup()
    total_changes = 0
    for fname in HTML_FILES:
        path = WORKDIR / fname
        if not path.exists():
            print(f"  SKIP {fname} (not found)")
            continue
        original = path.read_text(encoding='utf-8')
        cleaned = apply_to_text(original)
        if cleaned != original:
            path.write_text(cleaned, encoding='utf-8')
            n = sum(1 for a, b in zip(original.split('\n'), cleaned.split('\n')) if a != b)
            total_changes += n
            print(f"  {fname:40} cleaned ({n} lines changed)")
        else:
            print(f"  {fname:40} no changes")
    print(f"\nDone. {total_changes} lines changed across all files.")


if __name__ == "__main__":
    main()
