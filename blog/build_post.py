#!/usr/bin/env python3
"""
build_post.py — Missing Palette® blog post generator
=====================================================

Generate a full blog post HTML page from a tiny per-post source file.
You write ~10 lines of front matter plus the article body. The script
fills in all the boilerplate (head, nav, footer, scripts, meta tags,
JSON-LD, CTA section).

USAGE
-----
    python3 build_post.py posts/my-new-post.txt
    python3 build_post.py posts/my-new-post.txt --out blog/my-new-post.html

INPUT FILE FORMAT
-----------------
A plain text file with TOML-style front matter at the top, then the body.
Example:

    ---
    title       = "Hostel 4, and the making of an artist"
    title_html  = "Hostel 4, and the <em>making</em> of an artist"
    slug        = "hostel4"
    eyebrow     = "Memoir · BIT Mesra"
    subtitle    = "On the four years that turned a B.Tech student into a painter."
    date_label  = "Originally written 2024"
    read_time   = "4 min read"
    category    = "Memoir"
    hero_image  = "/img/gallery/sketch (13).jpg"
    hero_alt    = "BIT Mesra - charcoal sketch of Hostel 4"
    hero_caption = "BIT Mesra - charcoal sketch of Hostel 4, college years"
    description = "A charcoal sketch outside Hostel 4 Room 113."
    section     = "Memoir"
    ---

    <p class="lead">Hostel life has a strange kind of stillness inside its chaos.</p>
    <p>This was outside Hostel 4, Room 113...</p>
    ...the rest of your post body in HTML, using the building blocks
    documented in POST_TEMPLATE.html.

NOTES
-----
- Place this script at the root of your site, next to your /blog/ folder.
- Place source files in a /posts/ folder (or anywhere — pass the path).
- Output defaults to /blog/<slug>.html.
- Front matter values can use single or double quotes.
- title_html is optional — if absent, title is used (no <em> emphasis).
"""

from __future__ import annotations
import argparse
import re
import sys
from pathlib import Path
from html import escape


SITE_URL = "https://missingpalette.com"


def parse_source(text: str) -> tuple[dict, str]:
    """Split a source file into (front_matter_dict, body_html)."""
    # Front matter is between two lines that start with "---"
    m = re.match(r"\s*---\s*\n(.*?)\n---\s*\n(.*)", text, re.DOTALL)
    if not m:
        raise ValueError(
            "Source file must start with a front-matter block delimited by "
            "lines containing only '---'. See build_post.py docstring."
        )
    fm_block, body = m.group(1), m.group(2)

    fm = {}
    for line_no, raw in enumerate(fm_block.splitlines(), start=2):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        kv = re.match(r'^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$', line)
        if not kv:
            raise ValueError(f"Front matter line {line_no} is not 'key = value': {raw!r}")
        key, val = kv.group(1), kv.group(2).strip()
        # Strip surrounding quotes if present
        if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
            val = val[1:-1]
        fm[key] = val

    return fm, body.strip()


def require(fm: dict, *keys: str) -> None:
    missing = [k for k in keys if k not in fm or not fm[k]]
    if missing:
        raise ValueError(f"Front matter is missing required keys: {', '.join(missing)}")


TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-HFGSTZXF57"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{dataLayer.push(arguments);}}
    gtag('js', new Date());
    gtag('config', 'G-HFGSTZXF57');
</script>

<title>{title} | Missing Palette® · Journal</title>
<meta name="description" content="{description}">
<meta name="author" content="Ankit Agrawal">
<meta name="copyright" content="© 2019–2026 Missing Palette®">
<meta name="robots" content="index, follow">
<link rel="canonical" href="{canonical_url}">

<meta property="og:title" content="{title} | Missing Palette®">
<meta property="og:description" content="{description}">
<meta property="og:image" content="{og_image}">
<meta property="og:url" content="{canonical_url}">
<meta property="og:type" content="article">
<meta property="og:rights" content="© 2019–2026 Missing Palette®. All Rights Reserved.">
<meta property="article:author" content="Ankit Agrawal">
<meta property="article:section" content="{section}">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title} | Missing Palette®">
<meta name="twitter:description" content="{description}">
<meta name="twitter:image" content="{og_image}">

<script type="application/ld+json">
{{
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "{title}",
    "image": "{og_image}",
    "url": "{canonical_url}",
    "author": {{ "@type": "Person", "name": "Ankit Agrawal", "url": "https://missingpalette.com/" }},
    "publisher": {{ "@type": "Organization", "name": "Missing Palette" }},
    "mainEntityOfPage": {{ "@type": "WebPage", "@id": "{canonical_url}" }}
}}
</script>

<link rel="apple-touch-icon" sizes="180x180" href="/img/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/img/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/img/favicon-16x16.png">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,300;1,9..144,400&family=Inter:wght@300;400;500;600&family=Tiro+Devanagari+Hindi:ital@0;1&display=swap" rel="stylesheet">

<link rel="stylesheet" href="/css/missingpalette.css">
<link rel="stylesheet" href="/css/blog-post.css">

</head>
<body>

<div class="scroll-progress" id="scrollProgress" aria-hidden="true"></div>

<nav class="site-nav" id="siteNav">
    <a href="/" class="brand">Missing <em>Palette</em><sup class="tm">®</sup></a>
    <button class="menu-toggle" id="menuToggle" aria-label="Toggle menu" aria-expanded="false">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="3" y1="7" x2="21" y2="7"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="17" x2="21" y2="17"></line></svg>
    </button>
    <ul class="nav-links" id="navLinks">
        <li><a href="/gallery.html">Gallery</a></li>
        <li><a href="#about">About Me</a></li>
        <li><a href="#commissions">Commissions</a></li>
        <li><a href="/blog.html">My Journal</a></li>
        <li><a href="/exhibitions.html">Exhibitions & Press</a></li>
        <li><a href="/products.html">Art Products</a></li>
        <li><a href="#contact" class="nav-cta">Let's Talk</a></li>
    </ul>
</nav>

<main class="post-page">

    <div class="post-header">
        <div class="post-eyebrow">{eyebrow}</div>
        <h1>{title_html}</h1>
        <p class="post-subtitle">{subtitle}</p>
        <div class="post-meta">
            <span>{date_label}</span>
            <span class="dot">·</span>
            <span>{read_time}</span>
            <span class="dot">·</span>
            <span>{category}</span>
        </div>
    </div>

    <figure class="post-hero">
        <img class="post-hero-img" src="{hero_image}" alt="{hero_alt}" loading="eager">
        <figcaption class="post-hero-caption">{hero_caption}</figcaption>
    </figure>

    <article class="post-body">
{body}
    </article>

    <div class="post-back-link">
        <a href="/blog.html">← All journal entries</a>
    </div>

    <section class="post-end-cta">
        <h3>Want to <em>paint with me</em>?</h3>
        <p>I take a small number of commissions each year and run watercolor / oil / sketching classes in Pune, Ranchi, and online. Drop a line.</p>
        <div class="btn-row">
            <a href="/#commissions" class="btn primary">Commission a piece <span class="arrow">→</span></a>
            <a href="/register.html" class="btn">Register for a class <span class="arrow">→</span></a>
        </div>
    </section>

</main>

<footer class="site-footer">
    <div class="footer-grid">
        <div>
            <div class="footer-brand">Missing <em>Palette</em><sup class="tm">®</sup></div>
            <p class="footer-tagline">The studio practice of Indian artist Ankit Agrawal. Watercolor, oil, and the things in between.</p>
        </div>
        <div class="footer-col">
            <h5>Explore</h5>
            <ul>
                <li><a href="/gallery.html">Gallery</a></li>
                <li><a href="/#about">About</a></li>
                <li><a href="/#commissions">Commissions</a></li>
                <li><a href="/blog.html">Journal</a></li>
                <li><a href="/products.html">Art Materials</a></li>
            </ul>
        </div>
        <div class="footer-col">
            <h5>Connect</h5>
            <ul class="footer-social-list">
                <li><a href="https://www.instagram.com/imankit_art" target="_blank" rel="noopener noreferrer"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>Instagram</a></li>
                <li><a href="https://www.youtube.com/missingpalette" target="_blank" rel="noopener noreferrer"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>YouTube</a></li>
                <li><a href="https://www.facebook.com/missingpalette" target="_blank" rel="noopener noreferrer"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>Facebook</a></li>
                <li><a href="https://www.linkedin.com/in/akaankit" target="_blank" rel="noopener noreferrer"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>LinkedIn</a></li>
                <li><a href="https://topmate.io/akaankit" target="_blank" rel="noopener noreferrer"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Topmate · Book a call</a></li>
                <li><a href="https://www.patreon.com/bePatron?u=15378539" target="_blank" rel="noopener noreferrer"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="14.5" cy="9.5" r="6.5"/><line x1="4" y1="3" x2="4" y2="21"/></svg>Patreon</a></li>
            </ul>
        </div>
        <div class="footer-col">
            <h5>Write to Me</h5>
            <ul>
                <li><a href="mailto:ankit@missingpalette.com">ankit@missingpalette.com</a></li>
                <li><a href="/#contact">Contact form</a></li>
                <li><a href="https://topmate.io/akaankit" target="_blank" rel="noopener noreferrer">Book a 1:1 call</a></li>
                <li><a href="/register.html">Register for class</a></li>
                <li><a href="/2025_Ankit_K_Agrawal_Resume.pdf" target="_blank" rel="noopener noreferrer">Download CV (PDF)</a></li>
            </ul>
        </div>
    </div>
    <div class="footer-legal">
        <div class="copyright-line">
            <p>© 2019&ndash;2026 Missing Palette<sup class="tm">®</sup> · All Rights Reserved.</p>
            <p class="tm-notice">Missing Palette<sup class="tm">®</sup> is a registered trademark. Artworks © Ankit Agrawal - unauthorized reproduction is prohibited.</p>
        </div>
        <div class="right">
            <a href="/privacy.html">Privacy</a>
            <a href="/legal.html">Legal</a>
        </div>
    </div>
    <p class="made-with">Made with <span class="heart">❤</span> by <span class="aka">AKA</span></p>
</footer>

<button class="back-to-top" id="backToTop" aria-label="Back to top">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="12" y1="19" x2="12" y2="5"></line>
        <polyline points="5 12 12 5 19 12"></polyline>
    </svg>
</button>

<script src="/js/missingpalette.js" defer></script>

</body>
</html>
"""


def render(fm: dict, body: str) -> str:
    require(fm, "title", "slug", "eyebrow", "subtitle",
            "date_label", "read_time", "category",
            "hero_image", "hero_alt", "hero_caption",
            "description")

    canonical_url = f"{SITE_URL}/blog/{fm['slug']}.html"
    og_image = fm["hero_image"]
    if og_image.startswith("/"):
        og_image = SITE_URL + og_image

    # Plain title is used in <title>, og:title, twitter:title, JSON-LD headline.
    # title_html is optional and used inside <h1> so you can put <em> in it.
    title = fm["title"]
    title_html = fm.get("title_html") or escape(title)

    # Indent body so it sits nicely inside <article>.
    indented_body = "\n".join("        " + ln if ln.strip() else "" for ln in body.splitlines())

    values = {
        "title": escape(title),
        "title_html": title_html,  # raw HTML allowed
        "description": escape(fm["description"]),
        "canonical_url": canonical_url,
        "og_image": og_image,
        "section": escape(fm.get("section", fm["category"])),
        "eyebrow": escape(fm["eyebrow"]),
        "subtitle": escape(fm["subtitle"]),
        "date_label": escape(fm["date_label"]),
        "read_time": escape(fm["read_time"]),
        "category": escape(fm["category"]),
        "hero_image": escape(fm["hero_image"], quote=True),
        "hero_alt": escape(fm["hero_alt"], quote=True),
        "hero_caption": fm["hero_caption"],  # raw HTML allowed
        "body": indented_body,
    }
    return TEMPLATE.format(**values)


def main() -> int:
    ap = argparse.ArgumentParser(description="Build a Missing Palette blog post page.")
    ap.add_argument("source", help="Path to the post source .txt/.md file")
    ap.add_argument("--out", help="Output HTML path (default: blog/<slug>.html)")
    args = ap.parse_args()

    src_path = Path(args.source)
    if not src_path.exists():
        print(f"error: source file not found: {src_path}", file=sys.stderr)
        return 1

    text = src_path.read_text(encoding="utf-8")
    try:
        fm, body = parse_source(text)
        html = render(fm, body)
    except ValueError as e:
        print(f"error: {e}", file=sys.stderr)
        return 1

    if args.out:
        out_path = Path(args.out)
    else:
        out_path = Path("blog") / f"{fm['slug']}.html"

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(html, encoding="utf-8")
    print(f"wrote {out_path}  ({len(html):,} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

