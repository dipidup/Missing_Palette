#!/usr/bin/env python3
"""
ONE-TIME helper. Adds <!-- AUTO:POSTS-START --> / <!-- AUTO:POSTS-END -->
markers around the post-cards block in blog.html so build_blog.py knows
where to write.

Idempotent: if the markers already exist, it does nothing.
Makes a .bak backup of blog.html before changing anything.

Run from the repo root:
    python3 scripts/_add_blog_markers.py
"""
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BLOG_HTML = ROOT / 'blog.html'

START_MARKER = '<!-- AUTO:POSTS-START -->'
END_MARKER = '<!-- AUTO:POSTS-END -->'


def main():
    if not BLOG_HTML.exists():
        print(f"FATAL: blog.html not found at {BLOG_HTML}", file=sys.stderr)
        sys.exit(1)

    html = BLOG_HTML.read_text(encoding='utf-8')

    if START_MARKER in html and END_MARKER in html:
        print("Markers already present. Nothing to do.")
        return

    # Find <div class="posts-grid">  ...  </div>
    # The cards live between this opening div and its matching closing.
    # We'll insert markers right after <div class="posts-grid"> and right before
    # the </div> that closes it. We identify the close by counting depth.

    pattern = re.compile(
        r'(<div class="posts-grid">\s*\n)([\s\S]*?)(\n\s*</div>\s*\n\s*<p class="coming-soon">)',
        re.MULTILINE
    )

    m = pattern.search(html)
    if not m:
        print("FATAL: couldn't find the <div class=\"posts-grid\"> block in blog.html", file=sys.stderr)
        sys.exit(1)

    backup = BLOG_HTML.with_suffix('.html.bak')
    shutil.copy2(BLOG_HTML, backup)
    print(f"Backup: {backup.name}")

    new = (
        m.group(1)
        + f'        {START_MARKER}\n'
        + m.group(2)
        + f'\n        {END_MARKER}'
        + m.group(3)
    )
    new_html = html.replace(m.group(0), new, 1)
    BLOG_HTML.write_text(new_html, encoding='utf-8')
    print("Markers added.")


if __name__ == '__main__':
    main()
