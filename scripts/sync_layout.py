#!/usr/bin/env python3
"""
sync_layout.py
==============

Propagate the canonical <nav> and <footer> blocks from index.html into every
other HTML page on the site. Run after editing index.html's nav or footer to
keep all pages in lock-step.

Source of truth: index.html
Targets:         every other top-level HTML page + blog/*.html
                 (Archive 01/ is excluded by design)

Behaviour:
  - Reads index.html, extracts <nav class="site-nav" ...>...</nav> and
    <footer class="site-footer">...</footer>.
  - For each target page, replaces the existing <nav> and <footer> blocks.
  - Re-applies the aria-current="page" marker on whichever nav <a> matches
    the page (gallery, blog, exhibitions, events, products).
  - Idempotent: running twice produces no changes the second time.

Usage:
  python scripts/sync_layout.py            # apply
  python scripts/sync_layout.py --check    # exit 1 if anything would change
                                           # (use in CI to block stale layouts)
"""

import re
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
ROOT = _HERE.parent if _HERE.name == 'scripts' else _HERE

SOURCE = ROOT / 'index.html'

# Page -> the link this page should mark with aria-current="page".
# '' means no aria-current (page isn't in the nav).
TARGETS = {
    'gallery.html':                          '/gallery.html',
    'blog.html':                             '/blog.html',
    'exhibitions.html':                      '/exhibitions.html',
    'events.html':                           '/events.html',
    'products.html':                         '/products.html',
    'register.html':                         '',
    'legal.html':                            '',
    'privacy.html':                          '',
    # 404.html intentionally excluded — uses a stripped layout without footer.
    'blog/Ghat.html':                        '/blog.html',
    'blog/hostel4.html':                     '/blog.html',
    'blog/watercolor-portrait-guide.html':   '/blog.html',
    'blog/POST_TEMPLATE.html':               '/blog.html',
}

NAV_RE    = re.compile(r'<nav\s+class="site-nav".*?</nav>',    re.DOTALL)
FOOTER_RE = re.compile(r'<footer\s+class="site-footer".*?</footer>', re.DOTALL)


def extract_blocks(html):
    """Pull out the canonical nav and footer from index.html."""
    nav = NAV_RE.search(html)
    footer = FOOTER_RE.search(html)
    if not nav:
        sys.exit("FATAL: <nav class='site-nav'> not found in index.html")
    if not footer:
        sys.exit("FATAL: <footer class='site-footer'> not found in index.html")
    # Strip any aria-current the source file might already have so we start clean.
    clean_nav = re.sub(r'\s+aria-current="page"', '', nav.group(0))
    return clean_nav, footer.group(0)


def stamp_active(nav_html, active_href):
    """Insert aria-current="page" on the <a> whose href matches active_href."""
    if not active_href:
        return nav_html
    # Match: <a href="<active>"  ... possibly with class="..."> Label </a>
    # Add aria-current="page" immediately after the href attribute.
    pattern = re.compile(
        r'(<a\s+href="' + re.escape(active_href) + r'")(?![^>]*aria-current)'
    )
    return pattern.sub(r'\1 aria-current="page"', nav_html, count=1)


def sync_one(path, canonical_nav, canonical_footer, active_href, check_only):
    """Replace nav + footer in `path`. Return True if file would change."""
    if not path.exists():
        print(f"  MISSING  {path.relative_to(ROOT)}")
        return False
    original = path.read_text(encoding='utf-8')
    new = original
    nav_for_page = stamp_active(canonical_nav, active_href)

    nav_match = NAV_RE.search(new)
    footer_match = FOOTER_RE.search(new)
    if not nav_match:
        print(f"  NO NAV   {path.relative_to(ROOT)}  (skipping)")
        return False
    if not footer_match:
        print(f"  NO FOOT  {path.relative_to(ROOT)}  (skipping)")
        return False

    new = NAV_RE.sub(lambda m: nav_for_page, new, count=1)
    new = FOOTER_RE.sub(lambda m: canonical_footer, new, count=1)

    if new == original:
        print(f"  ok       {path.relative_to(ROOT)}")
        return False

    if check_only:
        print(f"  STALE    {path.relative_to(ROOT)}")
        return True

    path.write_text(new, encoding='utf-8')
    print(f"  updated  {path.relative_to(ROOT)}")
    return True


def main():
    check_only = '--check' in sys.argv
    if not SOURCE.exists():
        sys.exit(f"FATAL: source not found: {SOURCE}")

    src_html = SOURCE.read_text(encoding='utf-8')
    canonical_nav, canonical_footer = extract_blocks(src_html)

    print(f"Source:  {SOURCE.relative_to(ROOT)}")
    print(f"Mode:    {'check (no writes)' if check_only else 'apply'}")
    print()

    changed_any = False
    for rel, active in TARGETS.items():
        path = ROOT / rel
        if sync_one(path, canonical_nav, canonical_footer, active, check_only):
            changed_any = True

    print()
    if check_only and changed_any:
        sys.exit("Some pages are out of sync. Run without --check to update.")
    print("Done.")


if __name__ == '__main__':
    main()
