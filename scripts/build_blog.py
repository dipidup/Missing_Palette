#!/usr/bin/env python3
"""
build_blog.py
=============

Regenerates the post-cards block in blog.html.

Two source modes (decide via SOURCE constant below):

  SOURCE = 'frontmatter'   -- reads posts/*.md frontmatter directly
                              Simplest. The .md file IS the source of truth.
                              Order: alphabetical by filename, with status=published only.

  SOURCE = 'sheet'         -- reads a Posts tab in your Google Sheet,
                              joins to posts/*.md by slug. Good if you
                              want to reorder posts from the phone, or
                              feature a post on top without renaming files.

This file uses 'frontmatter' mode by default. If you ever want to switch
to sheet-driven ordering, change SOURCE = 'sheet' and fill in SHEET_CSV_URL.

In either mode it writes the cards inside the AUTO:POSTS markers in blog.html.
"""

import os
import re
import sys
import yaml
import csv
import io
from pathlib import Path
from urllib.request import urlopen

# ----------------------------------------------------------------------------
# Configuration
# ----------------------------------------------------------------------------

SOURCE = os.environ.get('BLOG_SOURCE', 'frontmatter')   # 'frontmatter' or 'sheet'

# If using sheet mode, paste your sheet's "publish to web" CSV URL here.
# Tabs available: Posts (slug, order, featured)
# Required column: slug. Optional: order (int), featured (yes/no).
SHEET_CSV_URL = os.environ.get(
    'BLOG_SHEET_CSV_URL',
    ''   # leave empty when SOURCE='frontmatter'
)

# ----------------------------------------------------------------------------
# Paths
# ----------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent if (Path(__file__).resolve().parent.name == 'scripts') else Path(__file__).resolve().parent
POSTS_DIR = ROOT / 'posts'
BLOG_HTML = ROOT / 'blog.html'

START_MARKER = '<!-- AUTO:POSTS-START -->'
END_MARKER = '<!-- AUTO:POSTS-END -->'


def parse_frontmatter(text):
    if not text.startswith('---'):
        return {}
    parts = text.split('---', 2)
    if len(parts) < 3:
        return {}
    try:
        return yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError:
        return {}


def load_posts_from_frontmatter():
    """Read every posts/*.md, parse frontmatter, return list of dicts."""
    posts = []
    for md_path in sorted(POSTS_DIR.glob('*.md')):
        if md_path.name.startswith('_'):
            continue
        meta = parse_frontmatter(md_path.read_text(encoding='utf-8'))
        if not meta or meta.get('status') == 'draft':
            continue
        meta['slug'] = meta.get('slug') or md_path.stem
        posts.append(meta)
    return posts


def load_posts_from_sheet():
    """Fetch the Posts tab CSV, join with frontmatter from posts/*.md."""
    if not SHEET_CSV_URL:
        print("FATAL: BLOG_SHEET_CSV_URL not set", file=sys.stderr)
        sys.exit(1)

    print(f"Fetching sheet from {SHEET_CSV_URL}")
    raw = urlopen(SHEET_CSV_URL, timeout=30).read().decode('utf-8')
    reader = csv.DictReader(io.StringIO(raw))

    sheet_rows = []
    for row in reader:
        # Accept any case for column headers
        slug = (row.get('slug') or row.get('Slug') or '').strip()
        if not slug:
            continue
        order = row.get('order') or row.get('Order') or '999'
        featured = (row.get('featured') or row.get('Featured') or '').strip().lower() in ('yes', 'true', '1')
        try:
            order_i = int(order)
        except ValueError:
            order_i = 999
        sheet_rows.append({'slug': slug, 'order': order_i, 'featured': featured})

    # Join with frontmatter from disk
    fm = {}
    for md_path in POSTS_DIR.glob('*.md'):
        meta = parse_frontmatter(md_path.read_text(encoding='utf-8'))
        if meta:
            slug = meta.get('slug') or md_path.stem
            fm[slug] = meta

    posts = []
    for row in sorted(sheet_rows, key=lambda r: r['order']):
        meta = fm.get(row['slug'])
        if not meta:
            print(f"  WARN: sheet has slug '{row['slug']}' but no posts/{row['slug']}.md found")
            continue
        if meta.get('status') == 'draft':
            continue
        meta['slug'] = row['slug']
        meta['featured'] = row['featured']
        posts.append(meta)
    return posts


def emify(s):
    """Convert *word* to <em>word</em> for in-page HTML."""
    return re.sub(r'\*([^*]+)\*', r'<em>\1</em>', s or '')


def render_card(post):
    """Render a single post-card HTML block."""
    slug = post['slug']
    title = emify(post.get('title', ''))
    excerpt = post.get('excerpt') or post.get('subtitle') or post.get('description') or ''
    excerpt = emify(excerpt)
    category = post.get('category', 'Journal')
    medium = post.get('medium', '')   # optional secondary tag e.g. "Watercolor"
    eyebrow = f"{category}" + (f" · {medium}" if medium else '')
    hero = post.get('hero_image', '/img/gallery/water (1).jpg')

    return (
        f'        <a href="/blog/{slug}.html" class="post-card">\n'
        f'            <div class="post-card-img" style="background-image: url(\'{hero}\');"></div>\n'
        f'            <div class="post-card-meta">\n'
        f'                <div class="post-card-eyebrow">{eyebrow}</div>\n'
        f'                <h2 class="post-card-title">{title}</h2>\n'
        f'                <p class="post-card-excerpt">{excerpt}</p>\n'
        f'                <span class="post-card-readmore">Read the post →</span>\n'
        f'            </div>\n'
        f'        </a>'
    )


def main():
    if not BLOG_HTML.exists():
        print(f"FATAL: blog.html not found at {BLOG_HTML}", file=sys.stderr)
        sys.exit(1)

    if SOURCE == 'sheet':
        posts = load_posts_from_sheet()
    else:
        posts = load_posts_from_frontmatter()

    if not posts:
        print("No posts to render. Check posts/ and status: published.", file=sys.stderr)

    cards = '\n\n'.join(render_card(p) for p in posts)
    html = BLOG_HTML.read_text(encoding='utf-8')

    if START_MARKER not in html or END_MARKER not in html:
        print(f"FATAL: blog.html missing {START_MARKER} / {END_MARKER}", file=sys.stderr)
        print("Run scripts/_add_blog_markers.py once to insert them.", file=sys.stderr)
        sys.exit(1)

    pattern = re.compile(
        re.escape(START_MARKER) + r'.*?' + re.escape(END_MARKER),
        re.DOTALL
    )
    replacement = f'{START_MARKER}\n{cards}\n        {END_MARKER}'
    new_html = pattern.sub(replacement, html, count=1)

    BLOG_HTML.write_text(new_html, encoding='utf-8')
    print(f"  OK   blog.html  ({len(posts)} cards rendered, source={SOURCE})")


if __name__ == '__main__':
    main()
