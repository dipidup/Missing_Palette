#!/usr/bin/env python3
"""
build_post.py
=============

Converts every Markdown file in posts/ into a styled HTML file in blog/,
using POST_TEMPLATE.html as the wrapper.
"""

import os
import re
import sys
import yaml
from pathlib import Path
from markdown_it import MarkdownIt

# ----------------------------------------------------------------------------
# Paths (robust + CI-safe)
# ----------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / 'posts'
OUTPUT_DIR = ROOT / 'blog'

# ✅ FIXED: template is inside blog/
TEMPLATE = ROOT / 'blog' / 'POST_TEMPLATE.html'

# ----------------------------------------------------------------------------
# Markdown setup
# ----------------------------------------------------------------------------
md = MarkdownIt('commonmark', {
    'html': True,
    'linkify': True,
    'typographer': False
})
md.enable('table').enable('strikethrough')


def parse_frontmatter(text):
    if not text.startswith('---'):
        return {}, text
    parts = text.split('---', 2)
    if len(parts) < 3:
        return {}, text
    try:
        meta = yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError as e:
        print(f"YAML error: {e}", file=sys.stderr)
        return {}, text
    return meta, parts[2].lstrip('\n')


def render_body(md_body):
    def encode_img(match):
        alt = match.group(1)
        url = match.group(2)
        return f'![{alt}]({url.replace(" ", "%20")})'

    md_body = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', encode_img, md_body)
    html = md.render(md_body)

    # Remove H1 (we use frontmatter title)
    html = re.sub(r'<h1[^>]*>.*?</h1>\s*', '', html)

    # Convert images to figure
    def img_to_figure(match):
        src = match.group('src')
        alt = match.group('alt')
        fig = (
            '<figure class="post-image">\n'
            f'<img src="{src}" alt="{alt}" loading="lazy">\n'
        )
        if alt:
            fig += f'<figcaption class="post-image-caption">{alt}</figcaption>\n'
        fig += '</figure>'
        return fig

    html = re.sub(
        r'<p>\s*<img[^>]*src="(?P<src>[^"]+)"[^>]*alt="(?P<alt>[^"]*)"[^>]*/?>\s*</p>',
        img_to_figure,
        html
    )

    html = re.sub(r'<hr\s*/?>', '<hr class="post-divider">', html)
    html = re.sub(r'^<p>', '<p class="lead">', html, count=1)

    return html


def build_post(md_path, template):
    text = md_path.read_text(encoding='utf-8')
    meta, body = parse_frontmatter(text)

    if meta.get('status') == 'draft':
        return False

    title = meta.get('title')
    if not title:
        print(f"SKIP {md_path.name} (no title)", file=sys.stderr)
        return False

    slug = meta.get('slug') or md_path.stem
    out_path = OUTPUT_DIR / f"{slug}.html"

    description = meta.get('description', '')
    hero_image = meta.get('hero_image', '')
    subtitle = meta.get('subtitle', '')
    category = meta.get('category', 'Journal')

    def emify(s):
        return re.sub(r'\*([^*]+)\*', r'<em>\1</em>', s)

    def deemify(s):
        return re.sub(r'\*([^*]+)\*', r'\1', s)

    title_em = emify(title)
    title_plain = deemify(title)

    body_html = render_body(body)

    article_html = f'<article class="post-body">\n{body_html}\n</article>'

    header = (
        '<div class="post-header">\n'
        f'<h1>{title_em}</h1>\n'
        + (f'<p class="post-subtitle">{subtitle}</p>\n' if subtitle else '')
        + '</div>'
    )

    hero = (
        f'<figure class="post-hero">\n'
        f'<img src="{hero_image}" alt="{title_plain}">\n'
        '</figure>'
        if hero_image else ''
    )

    html = template

    html = re.sub(r'<title>.*?</title>',
                  f'<title>{title_plain} | Missing Palette</title>',
                  html, count=1)

    html = re.sub(
        r'<main class="post-page">[\s\S]*?</article>',
        f'<main class="post-page">\n{header}\n{hero}\n{article_html}',
        html,
        count=1
    )

    out_path.write_text(html, encoding='utf-8')
    return True


def main():
    # ✅ Strong debug
    if not TEMPLATE.exists():
        print("FATAL: Template not found", file=sys.stderr)
        print(f"Expected: {TEMPLATE}", file=sys.stderr)
        print(f"Blog folder contents: {list((ROOT / 'blog').glob('*'))}", file=sys.stderr)
        sys.exit(1)

    if not POSTS_DIR.exists():
        print("FATAL: posts/ folder missing", file=sys.stderr)
        sys.exit(1)

    OUTPUT_DIR.mkdir(exist_ok=True)
    template = TEMPLATE.read_text(encoding='utf-8')

    files = list(POSTS_DIR.glob('*.md'))

    print(f"Building {len(files)} posts...\n")

    for f in files:
        try:
            if build_post(f, template):
                print(f"OK   {f.name}")
        except Exception as e:
            print(f"FAIL {f.name} - {e}", file=sys.stderr)

    print("\nDone.")


if __name__ == "__main__":
    main()
