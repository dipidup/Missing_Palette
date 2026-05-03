#!/usr/bin/env python3
"""
build_post.py
=============

Converts every Markdown file in posts/ into a styled HTML file in blog/,
using POST_TEMPLATE.html as the wrapper.

Workflow for the user:
  1. Write your post in posts/your-slug.md
  2. Add YAML frontmatter at the top (see FRONTMATTER FIELDS below)
  3. Drop any images into img/blog/ (or img/gallery/) and reference them
     in markdown like ![caption](/img/blog/file.jpg)
  4. Commit + push, GitHub Actions runs this script, blog/your-slug.html
     gets regenerated and committed back.

FRONTMATTER FIELDS (YAML, between --- ... --- at top of .md file):

  title:          (required) Post title - shown as <h1> and in <title>
  slug:           (optional) Output filename. Defaults to the .md filename.
                  Example: slug: Ghat -> blog/Ghat.html
  subtitle:       (optional) One-line subtitle below the title
  category:       (optional) Category label, e.g. "Memoir", "Tutorial"
  description:    (required) Meta description (1 sentence, for SEO + share)
  hero_image:     (required) Path to hero image, e.g. /img/gallery/water (1).jpg
  hero_caption:   (optional) Caption shown below hero image
  read_time:      (optional) e.g. "6 min read"
  date:           (optional) ISO date e.g. 2024-08-15
  status:         (optional) "draft" or "published" (default published)
                  Drafts are skipped during build.

Body: standard Markdown after the closing --- line.
  - # Heading 1            -> ignored (title comes from frontmatter)
  - ## Heading 2           -> <h2> with crimson italic em
  - ### Heading 3          -> <h3>
  - **bold**, *italic*     -> standard
  - ![alt](/path/img.jpg)  -> wrapped in <figure class="post-image">
  - > quote                -> <blockquote>
  - ---                    -> <hr class="post-divider">
  - <span class="hi">हिंदी</span> works inline (raw HTML allowed)
"""

import os
import re
import sys
import yaml
from pathlib import Path
from datetime import datetime
from markdown_it import MarkdownIt

# ----------------------------------------------------------------------------
# Paths (resolve relative to repo root, i.e. parent of this script's dir)
# ----------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent if (Path(__file__).resolve().parent.name == 'scripts') else Path(__file__).resolve().parent
POSTS_DIR = ROOT / 'posts'
OUTPUT_DIR = ROOT / 'blog'
TEMPLATE = ROOT / 'POST_TEMPLATE.html'

# ----------------------------------------------------------------------------
# Markdown setup with HTML enabled (for inline <span class="hi">)
# ----------------------------------------------------------------------------
md = MarkdownIt('commonmark', {'html': True, 'linkify': True, 'typographer': False})
md.enable('table').enable('strikethrough')


def parse_frontmatter(text):
    """Pull YAML frontmatter from top of a .md file. Returns (meta, body)."""
    if not text.startswith('---'):
        return {}, text
    parts = text.split('---', 2)
    if len(parts) < 3:
        return {}, text
    try:
        meta = yaml.safe_load(parts[1]) or {}
    except yaml.YAMLError as e:
        print(f"  YAML parse error: {e}", file=sys.stderr)
        return {}, text
    return meta, parts[2].lstrip('\n')


def render_body(md_body):
    """Render markdown body to HTML, then post-process for our class names."""

    # Pre-process: markdown-it doesn't handle ![alt](path with spaces) by default.
    # Convert all such image references to their URL-encoded form so the parser
    # treats them as one URL. We URL-encode only the spaces inside the parens.
    def _encode_img_url(match):
        alt = match.group(1)
        url = match.group(2)
        url_enc = url.replace(' ', '%20')
        return f'![{alt}]({url_enc})'

    md_body = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', _encode_img_url, md_body)

    html = md.render(md_body)

    # Wrap top-level <h1> from body if present (rare; usually meta.title is used)
    # Actually drop body H1s since we use frontmatter title
    html = re.sub(r'<h1[^>]*>.*?</h1>\s*', '', html)

    # Convert standalone images (not inside <p>) into <figure class="post-image">
    # Also match images inside <p> tags that have nothing else - convert those too.
    # Pattern: <p><img src="X" alt="Y"></p> -> <figure>...
    def img_to_figure(match):
        src = match.group('src')
        alt = match.group('alt')
        # Use alt as caption, allow <span class="hi"> already in alt
        figure = (
            '<figure class="post-image">\n'
            f'    <img src="{src}" alt="{alt}" loading="lazy">\n'
        )
        if alt:
            figure += f'    <figcaption class="post-image-caption">{alt}</figcaption>\n'
        figure += '</figure>'
        return figure

    # <p><img ...></p> -> figure
    html = re.sub(
        r'<p>\s*<img[^>]*src="(?P<src>[^"]+)"[^>]*alt="(?P<alt>[^"]*)"[^>]*/?>\s*</p>',
        img_to_figure,
        html
    )
    # Also reverse-order alt before src
    html = re.sub(
        r'<p>\s*<img[^>]*alt="(?P<alt>[^"]*)"[^>]*src="(?P<src>[^"]+)"[^>]*/?>\s*</p>',
        img_to_figure,
        html
    )

    # blockquote class - add class for our styling (already handled by .post-body blockquote)
    # hr -> hr.post-divider
    html = re.sub(r'<hr\s*/?>', '<hr class="post-divider">', html)

    # Add a "lead" class to the first paragraph for the larger italic opener
    # but only if it's not already classed
    html = re.sub(
        r'(<article class="post-body">[\s\S]*?)<p>',
        r'\1<p class="lead">',
        html, count=1  # only first
    )
    # Above is wrong - we don't have <article> wrap yet at this stage.
    # Instead just mark first <p> with class:
    html = re.sub(r'^<p>', '<p class="lead">', html, count=1)

    return html


def build_post(md_path, template):
    """Build one .md file into an .html file in blog/."""
    text = md_path.read_text(encoding='utf-8')
    meta, body = parse_frontmatter(text)

    # Validate required fields
    title = meta.get('title')
    description = meta.get('description', '')
    hero_image = meta.get('hero_image', '/img/gallery/water (1).jpg')
    if not title:
        print(f"  SKIP {md_path.name} - missing 'title' in frontmatter", file=sys.stderr)
        return False

    if meta.get('status') == 'draft':
        print(f"  SKIP {md_path.name} - draft")
        return False

    # Slug from frontmatter or filename
    slug = meta.get('slug') or md_path.stem
    out_path = OUTPUT_DIR / f"{slug}.html"

    subtitle = meta.get('subtitle', '')
    category = meta.get('category', 'Journal')
    read_time = meta.get('read_time', '')
    hero_caption = meta.get('hero_caption', '')

    # Helper: convert *word* in titles/subtitles to <em>word</em> for in-page HTML
    def emify(s):
        return re.sub(r'\*([^*]+)\*', r'<em>\1</em>', s)
    # Helper: strip *word* markers entirely for plain-text uses (og:title, <title>)
    def deemify(s):
        return re.sub(r'\*([^*]+)\*', r'\1', s)

    title_em = emify(title)        # rich, for <h1>
    title_plain = deemify(title)   # plain, for <title>, og:title etc
    subtitle_em = emify(subtitle) if subtitle else ''

    # Build derived fields
    canonical = f"https://missingpalette.com/blog/{slug}.html"
    og_image = hero_image if hero_image.startswith('http') else f"https://missingpalette.com{hero_image}"

    # Build the post body with proper wrapping
    body_html = render_body(body)
    article_html = f'<article class="post-body">\n{body_html}\n</article>'

    # Build header block
    meta_pieces = []
    if category:
        meta_pieces.append(f'<span>{category}</span>')
    if read_time:
        meta_pieces.append(f'<span>{read_time}</span>')
    meta_inner = '<span class="dot">·</span>'.join(meta_pieces) if meta_pieces else ''

    header_block = (
        '<div class="post-header">\n'
        f'        <h1>{title_em}</h1>\n'
        + (f'        <p class="post-subtitle">{subtitle_em}</p>\n' if subtitle_em else '')
        + (f'        <div class="post-meta">{meta_inner}</div>\n' if meta_inner else '')
        + '    </div>'
    )

    # Hero block
    if hero_image:
        hero_block = (
            '<figure class="post-hero">\n'
            f'        <img class="post-hero-img" src="{hero_image}" alt="{title_plain}" loading="eager">\n'
            + (f'        <figcaption class="post-hero-caption">{hero_caption}</figcaption>\n' if hero_caption else '')
            + '    </figure>'
        )
    else:
        hero_block = ''

    # Now read template and substitute
    html = template

    # Title tag (and og titles)
    html = re.sub(
        r'<title>.*?</title>',
        f'<title>{title_plain} | Missing Palette® · Journal</title>',
        html, count=1
    )
    html = re.sub(
        r'<meta name="description" content="[^"]*">',
        f'<meta name="description" content="{description}">',
        html, count=1
    )
    html = re.sub(
        r'<link rel="canonical" href="[^"]*">',
        f'<link rel="canonical" href="{canonical}">',
        html, count=1
    )
    html = re.sub(
        r'<meta property="og:image" content="[^"]*">',
        f'<meta property="og:image" content="{og_image}">',
        html, count=1
    )
    html = re.sub(
        r'<meta name="twitter:image" content="[^"]*">',
        f'<meta name="twitter:image" content="{og_image}">',
        html, count=1
    )
    html = re.sub(
        r'<meta property="og:title" content="[^"]*">',
        f'<meta property="og:title" content="{title_plain} | Missing Palette®">',
        html, count=1
    )
    html = re.sub(
        r'<meta property="og:description" content="[^"]*">',
        f'<meta property="og:description" content="{description}">',
        html, count=1
    )
    html = re.sub(
        r'<meta property="og:url" content="[^"]*">',
        f'<meta property="og:url" content="{canonical}">',
        html, count=1
    )
    html = re.sub(
        r'<meta name="twitter:title" content="[^"]*">',
        f'<meta name="twitter:title" content="{title_plain} | Missing Palette®">',
        html, count=1
    )
    html = re.sub(
        r'<meta name="twitter:description" content="[^"]*">',
        f'<meta name="twitter:description" content="{description}">',
        html, count=1
    )
    html = re.sub(
        r'<meta property="article:section" content="[^"]*">',
        f'<meta property="article:section" content="{category}">',
        html, count=1
    )

    # Schema.org JSON-LD: replace headline + image + url
    def patch_schema(m):
        block = m.group(0)
        block = re.sub(r'"headline": "[^"]*"', f'"headline": "{title_plain}"', block)
        block = re.sub(r'"image": "[^"]*"', f'"image": "{og_image}"', block)
        # Only patch the top-level "url" (the one right after "image"), not the
        # author's url inside the nested Person object. Anchor on the line break.
        block = re.sub(
            r'("image": "[^"]*",\s*\n\s*)"url": "[^"]*"',
            r'\1"url": "' + canonical + '"',
            block
        )
        # Patch @id similarly (it's only one in the block, the WebPage's @id)
        block = re.sub(
            r'"@id": "[^"]*"',
            f'"@id": "{canonical}"',
            block
        )
        return block

    html = re.sub(
        r'<script type="application/ld\+json">[\s\S]*?</script>',
        patch_schema,
        html, count=1
    )

    # Replace the ENTIRE block from <main class="post-page"> opening through
    # the </article> closing tag with our generated header + hero + article.
    # Then we keep the post-back-link, post-end-cta, etc. that follow.
    new_main_inner = (
        '<main class="post-page">\n\n'
        '    ' + header_block + '\n\n'
        '    ' + hero_block + '\n\n'
        '    ' + article_html + '\n'
    )

    html = re.sub(
        r'<main class="post-page">[\s\S]*?</article>',
        new_main_inner.rstrip(),
        html, count=1
    )

    out_path.write_text(html, encoding='utf-8')
    return True


def main():
    if not TEMPLATE.exists():
        print(f"FATAL: template not found at {TEMPLATE}", file=sys.stderr)
        sys.exit(1)
    if not POSTS_DIR.exists():
        print(f"FATAL: posts/ directory not found at {POSTS_DIR}", file=sys.stderr)
        sys.exit(1)

    OUTPUT_DIR.mkdir(exist_ok=True)
    template_text = TEMPLATE.read_text(encoding='utf-8')

    md_files = sorted(POSTS_DIR.glob('*.md'))
    if not md_files:
        print("No .md files found in posts/")
        return

    print(f"Building {len(md_files)} posts...")
    built = 0
    for md_path in md_files:
        if md_path.name.startswith('_'):  # convention: _draft.md is skipped
            print(f"  SKIP {md_path.name} (starts with _)")
            continue
        try:
            ok = build_post(md_path, template_text)
            if ok:
                slug = md_path.stem
                print(f"  OK   {md_path.name} -> blog/{slug}.html")
                built += 1
        except Exception as e:
            print(f"  FAIL {md_path.name} - {e}", file=sys.stderr)

    print(f"\nBuilt {built} posts into {OUTPUT_DIR}/")


if __name__ == '__main__':
    main()
