/* ==========================================
   Missing Palette® — Shared Application JS
   Used across all pages of missingpalette.com
   ========================================== */

(function() {
  'use strict';

  // Sticky nav background on scroll
  const nav = document.getElementById('siteNav');
  function handleScroll() {
      if (window.scrollY > 40) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // =====================
  // Scroll progress indicator — thin ochre line at top of page
  // Only visible after scrolling more than 80px
  // =====================
  const scrollProgress = document.getElementById('scrollProgress');
  function updateScrollProgress() {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
      scrollProgress.style.width = Math.min(pct, 100) + '%';
      if (window.scrollY > 80) scrollProgress.classList.add('active');
      else scrollProgress.classList.remove('active');
  }
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress();

  // =====================
  // Back-to-top button — appears after scrolling past hero
  // =====================
  const backToTop = document.getElementById('backToTop');
  const heroEl = document.getElementById('hero');
  function updateBackToTop() {
      const heroBottom = heroEl ? heroEl.getBoundingClientRect().bottom : 600;
      if (heroBottom < 0) {
          backToTop.classList.add('visible');
      } else {
          backToTop.classList.remove('visible');
      }
  }
  window.addEventListener('scroll', updateBackToTop, { passive: true });
  backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  updateBackToTop();

  // =====================
  // Animated stat counters — count up when stats band enters viewport
  // =====================
  const statValues = document.querySelectorAll('.stat-value[data-target]');
  function animateCounter(el) {
      const target = parseFloat(el.dataset.target);
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      const suffix = el.dataset.suffix || '';
      const suffixHtml = el.dataset.suffixHtml ? el.dataset.suffixHtml.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"') : '';
      const duration = 1400;
      const startTime = performance.now();

      function tick(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // ease-out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = target * eased;

          let displayed;
          if (decimals > 0) {
              displayed = current.toFixed(decimals);
          } else {
              displayed = Math.round(current).toString();
          }
          el.innerHTML = displayed + suffix + suffixHtml;

          if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
  }

  const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
          if (entry.isIntersecting && !entry.target.dataset.animated) {
              entry.target.dataset.animated = 'true';
              animateCounter(entry.target);
              statsObserver.unobserve(entry.target);
          }
      });
  }, { threshold: 0.5 });
  statValues.forEach(el => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      // Initialize displayed value to 0 so it doesn't flash the final value before animation
      statsObserver.observe(el);
  });

  // Mobile menu toggle
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  menuToggle.addEventListener('click', () => {
      nav.classList.toggle('menu-open');
      const expanded = nav.classList.contains('menu-open');
      menuToggle.setAttribute('aria-expanded', expanded);
  });
  // Close mobile menu when clicking a nav link
  navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
          nav.classList.remove('menu-open');
          menuToggle.setAttribute('aria-expanded', 'false');
      });
  });

  // Scroll reveal — IntersectionObserver
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
          if (entry.isIntersecting) {
              entry.target.classList.add('in-view');
              revealObserver.unobserve(entry.target);
          }
      });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  reveals.forEach(el => revealObserver.observe(el));

  // =====================
  // Section title fade-up reveal (simple, single fade — no per-letter)
  // =====================
  const sectionTitles = document.querySelectorAll('.section-title, .hero-brand');
  sectionTitles.forEach(title => {
      title.classList.add('title-reveal');
  });

  const titleObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
          if (entry.isIntersecting) {
              entry.target.classList.add('in-view');
              titleObserver.unobserve(entry.target);
          }
      });
  }, { threshold: 0.4 });
  document.querySelectorAll('.title-reveal').forEach(el => titleObserver.observe(el));

  // =====================
  // Parallax — hero plate image + process bg
  // Uses requestAnimationFrame for smooth scrolling
  // =====================
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion) {
      const heroImg = document.querySelector('.hero-plate img');
      const heroPlate = document.querySelector('.hero-plate');
      const parallaxBg = document.querySelector('.parallax-bg');
      let ticking = false;

      function updateParallax() {
          const scrollY = window.scrollY;

          // Hero parallax — moves at 0.4x scroll speed (downward)
          if (heroImg && heroPlate) {
              const rect = heroPlate.getBoundingClientRect();
              const visible = rect.top < window.innerHeight && rect.bottom > 0;
              if (visible) {
                  const offset = (window.innerHeight - rect.top) * 0.08;
                  heroImg.style.transform = `translateY(${offset}px) scale(1.05)`;
              }
          }

          // Process band parallax — bg moves slower than container
          if (parallaxBg) {
              const container = parallaxBg.parentElement;
              const rect = container.getBoundingClientRect();
              const visible = rect.top < window.innerHeight && rect.bottom > 0;
              if (visible) {
                  const speed = parseFloat(parallaxBg.dataset.parallaxSpeed) || 0.3;
                  const offset = (window.innerHeight - rect.top) * speed * 0.15;
                  parallaxBg.style.transform = `translateY(${-offset}px)`;
              }
          }

          ticking = false;
      }

      function onScroll() {
          if (!ticking) {
              window.requestAnimationFrame(updateParallax);
              ticking = true;
          }
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      updateParallax(); // initial position
  }

  // Commissions stack rotation — front card cycles every 3.5s, never stops on hover
  const commissionsSlides = document.querySelectorAll('.commissions-slide');
  const commissionsCredit = document.getElementById('commissionsCredit');
  const commissionsCaptions = [
      '<span class="hi">आँचल</span><span class="sep">·</span>Aanchal<span class="sep">·</span>Oil',
      'Self Portrait<span class="sep">·</span>Charcoal sketch',
      '<span class="hi">अनिद्रा</span><span class="sep">·</span>Anidra<span class="sep">·</span>Watercolor'
  ];
  // Position cycles: at any moment one card is "front", one "mid", one "back"
  // On each tick the front card moves to back, mid moves to front, back moves to mid
  // (so the deck shuffles as if hand-fanning through paintings)
  let commissionsFrontIdx = 0;

  function advanceCommissionsStack() {
      const n = commissionsSlides.length;
      commissionsFrontIdx = (commissionsFrontIdx + 1) % n;

      commissionsSlides.forEach((slide, i) => {
          slide.classList.remove('pos-front', 'pos-mid', 'pos-back');
          // Calculate this card's position relative to the new front
          const rel = (i - commissionsFrontIdx + n) % n;
          if (rel === 0) slide.classList.add('pos-front');
          else if (rel === 1) slide.classList.add('pos-mid');
          else slide.classList.add('pos-back');
      });

      if (commissionsCredit) {
          commissionsCredit.style.opacity = '0';
          setTimeout(() => {
              commissionsCredit.innerHTML = commissionsCaptions[commissionsFrontIdx];
              commissionsCredit.style.opacity = '1';
          }, 250);
      }
  }

  // Run continuously (no hover pause, no buttons to interrupt)
  if (commissionsSlides.length > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInterval(advanceCommissionsStack, 3500);
  }


  // =====================
  // Lightbox — for gallery images and any image-zoom anchors
  // Trigger: <a data-lightbox="GROUP" href="full-img-url" data-title="..." data-title-hi="..." data-medium="..." data-year="..." data-desc="...">
  // Keys: ESC closes, Left/Right navigate within the same group
  // =====================
  (function() {
      const triggers = document.querySelectorAll('a[data-lightbox]');
      if (triggers.length === 0) return;

      const lb = document.createElement('div');
      lb.className = 'mp-lightbox';
      lb.setAttribute('aria-hidden', 'true');
      lb.innerHTML = `
          <span class="mp-lightbox-counter" id="mpLbCounter"></span>
          <button class="mp-lightbox-close" id="mpLbClose" aria-label="Close (ESC)">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
          </button>
          <button class="mp-lightbox-prev" id="mpLbPrev" aria-label="Previous (Left arrow)">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
          </button>
          <button class="mp-lightbox-next" id="mpLbNext" aria-label="Next (Right arrow)">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 6 15 12 9 18"></polyline>
              </svg>
          </button>
          <div class="mp-lightbox-img-wrap">
              <img class="mp-lightbox-img" id="mpLbImg" alt="">
              <div class="mp-lightbox-caption" id="mpLbCaption"></div>
          </div>
      `;
      document.body.appendChild(lb);

      const lbImg = document.getElementById('mpLbImg');
      const lbCaption = document.getElementById('mpLbCaption');
      const lbCounter = document.getElementById('mpLbCounter');
      const lbClose = document.getElementById('mpLbClose');
      const lbPrev = document.getElementById('mpLbPrev');
      const lbNext = document.getElementById('mpLbNext');

      const groups = {};
      triggers.forEach(t => {
          const g = t.dataset.lightbox;
          if (!groups[g]) groups[g] = [];
          groups[g].push(t);
      });

      let currentGroup = null;
      let currentIndex = 0;

      function showItem(group, index) {
          const items = groups[group];
          if (!items || !items[index]) return;
          currentGroup = group;
          currentIndex = index;
          const item = items[index];

          lbImg.style.opacity = '0';
          const newImg = new Image();
          newImg.onload = () => {
              lbImg.src = newImg.src;
              lbImg.alt = item.dataset.title || '';
              lbImg.style.opacity = '1';
          };
          newImg.src = item.href;

          const title = item.dataset.title || '';
          const titleHi = item.dataset.titleHi || '';
          const medium = item.dataset.medium || '';
          const year = item.dataset.year || '';
          const desc = item.dataset.desc || '';

          let captionHTML = '';
          if (titleHi && title) {
              captionHTML += `<span class="hi">${titleHi}</span> · ${title}`;
          } else if (titleHi) {
              captionHTML += `<span class="hi">${titleHi}</span>`;
          } else if (title) {
              captionHTML += title;
          }
          if (medium) captionHTML += ` · ${medium}`;
          if (year) captionHTML += ` <span class="year">· ${year}</span>`;
          if (desc) captionHTML += `<span class="desc">${desc}</span>`;

          lbCaption.innerHTML = captionHTML;
          lbCounter.textContent = `${index + 1} / ${items.length}`;
      }

      function open(group, index) {
          showItem(group, index);
          lb.classList.add('open');
          lb.setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden';
      }

      function close() {
          lb.classList.remove('open');
          lb.setAttribute('aria-hidden', 'true');
          document.body.style.overflow = '';
          currentGroup = null;
      }

      function navigate(direction) {
          if (!currentGroup) return;
          const items = groups[currentGroup];
          const next = (currentIndex + direction + items.length) % items.length;
          showItem(currentGroup, next);
      }

      triggers.forEach(t => {
          t.addEventListener('click', (e) => {
              e.preventDefault();
              const group = t.dataset.lightbox;
              const idx = groups[group].indexOf(t);
              open(group, idx);
          });
      });

      lbClose.addEventListener('click', close);
      lbPrev.addEventListener('click', () => navigate(-1));
      lbNext.addEventListener('click', () => navigate(1));

      lb.addEventListener('click', (e) => {
          if (e.target === lb) close();
      });

      document.addEventListener('keydown', (e) => {
          if (!lb.classList.contains('open')) return;
          if (e.key === 'Escape') close();
          else if (e.key === 'ArrowLeft') navigate(-1);
          else if (e.key === 'ArrowRight') navigate(1);
      });
  })();

/* =====================
  // Workshop popup — shows once per user, 5s after page load
  // Uses localStorage to track if user has seen it before
  // =====================      */
  
  window.addEventListener("load", function () {
  setTimeout(function () {
    if (!localStorage.getItem("popupShown")) {
      document.getElementById("workshopPopup").style.display = "flex";
      localStorage.setItem("popupShown", "true");
    }
  }, 5000);
});

function closePopup() {
  document.getElementById("workshopPopup").style.display = "none";
}

})();


/* =====================================================
   ADDITIONS — v2
   1. Custom cursor with watercolour splash trail
   2. Scroll reveals — stronger translateY + stagger
   3. Scroll reveals — translateY already exists, bump it
   4. Hero painting hover interaction
   ===================================================== */

/* ─────────────────────────────────────────────────────
   1. WATERCOLOUR SPLASH ON CLICK
   – Native arrow cursor stays visible (was a black dot
     that disappeared against dark images and dark mode).
   – On click, a watercolour splash bursts at the pointer
     and fades out — same colour cycle as before.
   – Disabled on touch devices and reduced-motion.
   ───────────────────────────────────────────────────── */
(function initSplash() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if ('ontouchstart' in window) return;

    const style = document.createElement('style');
    style.textContent = `
        .mp-splash {
            position: fixed;
            pointer-events: none;
            z-index: 99998;
            border-radius: 50%;
            transform: translate(-50%, -50%) scale(0);
            animation: mpSplash 0.65s cubic-bezier(0.2,0.8,0.2,1) forwards;
        }
        @keyframes mpSplash {
            0%   { transform: translate(-50%,-50%) scale(0); opacity: 0.7; }
            60%  { opacity: 0.35; }
            100% { transform: translate(-50%,-50%) scale(4.5); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // Click splash — watercolour colours cycling
    const splashColours = [
        'rgba(181,119,58,0.35)',   // ochre
        'rgba(139,40,32,0.3)',     // crimson
        'rgba(79,90,58,0.3)',      // moss
        'rgba(26,22,20,0.2)',      // ink
        'rgba(181,119,58,0.25)',   // ochre again
    ];
    let splashIdx = 0;

    document.addEventListener('mousedown', e => {
        const splash = document.createElement('div');
        splash.className = 'mp-splash';
        const size = 28 + Math.random() * 20;
        splash.style.cssText = `
            left: ${e.clientX}px;
            top: ${e.clientY}px;
            width: ${size}px;
            height: ${size}px;
            background: ${splashColours[splashIdx % splashColours.length]};
        `;
        document.body.appendChild(splash);
        splashIdx++;

        // 2 smaller satellite splashes slightly offset
        for (let i = 0; i < 2; i++) {
            const s2 = document.createElement('div');
            s2.className = 'mp-splash';
            const sz2 = 10 + Math.random() * 12;
            const ox = (Math.random() - 0.5) * 40;
            const oy = (Math.random() - 0.5) * 40;
            s2.style.cssText = `
                left: ${e.clientX + ox}px;
                top: ${e.clientY + oy}px;
                width: ${sz2}px;
                height: ${sz2}px;
                background: ${splashColours[(splashIdx + i) % splashColours.length]};
                animation-delay: ${0.06 * (i + 1)}s;
            `;
            document.body.appendChild(s2);
        }

        setTimeout(() => {
            document.querySelectorAll('.mp-splash').forEach(el => el.remove());
        }, 800);
    });
})();


/* ─────────────────────────────────────────────────────
   2 + 3. STRONGER SCROLL REVEALS WITH STAGGER
   The existing .reveal class already uses translateY(24px).
   We replace the observer to also handle stagger — child
   elements inside a .reveal-group fire with 80ms delay each.
   We also add a stronger initial offset for section titles.
   ───────────────────────────────────────────────────── */
(function enhanceReveals() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Inject enhanced styles on top of existing reveal CSS
    const style = document.createElement('style');
    style.textContent = `
        /* Stronger initial offset */
        .reveal {
            opacity: 0;
            transform: translateY(36px);
            transition: opacity 750ms cubic-bezier(0.16, 1, 0.3, 1),
                        transform 750ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal.in-view {
            opacity: 1;
            transform: translateY(0);
        }

        /* Staggered children inside any .reveal-stagger container */
        .reveal-stagger > * {
            opacity: 0;
            transform: translateY(28px);
            transition: opacity 650ms cubic-bezier(0.16, 1, 0.3, 1),
                        transform 650ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal-stagger.in-view > *:nth-child(1)  { opacity:1; transform:translateY(0); transition-delay: 0ms;   }
        .reveal-stagger.in-view > *:nth-child(2)  { opacity:1; transform:translateY(0); transition-delay: 80ms;  }
        .reveal-stagger.in-view > *:nth-child(3)  { opacity:1; transform:translateY(0); transition-delay: 160ms; }
        .reveal-stagger.in-view > *:nth-child(4)  { opacity:1; transform:translateY(0); transition-delay: 240ms; }
        .reveal-stagger.in-view > *:nth-child(5)  { opacity:1; transform:translateY(0); transition-delay: 320ms; }
        .reveal-stagger.in-view > *:nth-child(6)  { opacity:1; transform:translateY(0); transition-delay: 400ms; }
        .reveal-stagger.in-view > *:nth-child(n+7){ opacity:1; transform:translateY(0); transition-delay: 480ms; }

        /* Section titles get a slightly longer, more elegant lift */
        .section-title {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 900ms cubic-bezier(0.16, 1, 0.3, 1),
                        transform 900ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .section-title.in-view {
            opacity: 1;
            transform: translateY(0);
        }
    `;
    document.head.appendChild(style);

    // Observe .reveal-stagger containers (auto-stagger any grid/list)
    const staggerEls = document.querySelectorAll('.reveal-stagger');
    const staggerObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                staggerObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    staggerEls.forEach(el => staggerObs.observe(el));

    // Also observe section-title elements not already caught by title-reveal
    const sectionTitles = document.querySelectorAll('.section-title');
    const titleObs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                titleObs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    sectionTitles.forEach(el => titleObs.observe(el));
})();


/* ─────────────────────────────────────────────────────
   4. HERO PAINTING HOVER INTERACTION
   – Subtle scale on hover (beyond the parallax scale)
   – Caption slides up and becomes more visible
   – A very light dark wash appears over the image
   – On hover-out, everything eases back
   ───────────────────────────────────────────────────── */
(function heroHover() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if ('ontouchstart' in window) return;

    const style = document.createElement('style');
    style.textContent = `
        /* Wash overlay — appears on hover */
        .hero-plate-wash {
            position: absolute;
            inset: 0;
            background: rgba(26, 22, 20, 0);
            transition: background 0.5s ease;
            z-index: 1;
            pointer-events: none;
        }
        .hero-plate:hover .hero-plate-wash {
            background: rgba(26, 22, 20, 0.18);
        }

        /* Image scale on hover — layered on top of parallax transform */
        .hero-plate:hover img {
            transform: scale(1.07) !important;
            transition: transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
        }

        /* Caption slides up and fully reveals on hover */
        .hero-plate-caption {
            transform: translateY(6px);
            transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
                        opacity 0.4s ease;
        }
        .hero-plate:hover .hero-plate-caption {
            transform: translateY(0);
        }
        .hero-plate-caption .en-title {
            max-height: 0;
            overflow: hidden;
            opacity: 0;
            transition: max-height 0.4s ease 0.1s, opacity 0.4s ease 0.15s;
        }
        .hero-plate:hover .hero-plate-caption .en-title {
            max-height: 40px;
            opacity: 0.95;
        }

        /* Credit fades in on hover */
        .hero-plate-credit {
            opacity: 0;
            transition: opacity 0.4s ease 0.2s;
        }
        .hero-plate:hover .hero-plate-credit {
            opacity: 1;
        }

        /* "Read the story" link — appears on hover */
        .hero-plate-story-link {
            position: absolute;
            bottom: 1.2rem;
            right: 1.2rem;
            font-family: var(--font-body);
            font-size: 0.65rem;
            font-weight: 500;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: rgba(245, 240, 230, 0.85);
            text-decoration: none;
            z-index: 3;
            opacity: 0;
            transform: translateX(6px);
            transition: opacity 0.4s ease 0.15s, transform 0.4s ease 0.15s;
            border-bottom: 1px solid rgba(245,240,230,0.4);
            padding-bottom: 1px;
        }
        .hero-plate:hover .hero-plate-story-link {
            opacity: 1;
            transform: translateX(0);
        }
    `;
    document.head.appendChild(style);

    const plate = document.querySelector('.hero-plate');
    if (!plate) return;

    // Inject the wash overlay
    const wash = document.createElement('div');
    wash.className = 'hero-plate-wash';
    plate.appendChild(wash);

    // Inject "Read the story" link pointing to Ghat blog post
    const storyLink = document.createElement('a');
    storyLink.className = 'hero-plate-story-link';
    storyLink.href = '/blog/Ghat.html';
    storyLink.textContent = 'Read the story →';
    plate.appendChild(storyLink);
})();


/* ─────────────────────────────────────────────────────
   5. MAGNETIC CTAs
   – Main buttons gently pull toward the cursor on hover.
   – Pull falls off proportional to distance from button center.
   – Disabled on touch + reduced-motion.
   ───────────────────────────────────────────────────── */
(function magneticCTAs() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if ('ontouchstart' in window) return;

    const targets = document.querySelectorAll(
        '.btn, .nav-cta, .hero-yt-btn, .happening-link, .recog-link, .read-story-link'
    );
    targets.forEach(btn => {
        btn.style.transition = 'transform 350ms cubic-bezier(0.16, 1, 0.3, 1)';
        btn.style.willChange = 'transform';

        btn.addEventListener('mousemove', e => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - (rect.left + rect.width / 2);
            const y = e.clientY - (rect.top + rect.height / 2);
            // 0.25x horizontal, 0.4x vertical — vertical feels stronger because buttons are wider than tall
            btn.style.transform = `translate(${x * 0.25}px, ${y * 0.4}px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });
})();


/* ─────────────────────────────────────────────────────
   6. PAPER-GRAIN OVERLAY
   – Subtle SVG noise fixed over the whole viewport.
   – Slow shift via CSS animation gives film-grain shimmer.
   – Pointer-events:none so it never blocks clicks.
   ───────────────────────────────────────────────────── */
(function paperGrain() {
    const noiseSvg =
        "data:image/svg+xml;utf8," +
        "%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%27240%27%20height%3D%27240%27%3E" +
        "%3Cfilter%20id%3D%27n%27%3E" +
        "%3CfeTurbulence%20type%3D%27fractalNoise%27%20baseFrequency%3D%270.85%27%20numOctaves%3D%272%27%20stitchTiles%3D%27stitch%27/%3E" +
        "%3CfeColorMatrix%20type%3D%27matrix%27%20values%3D%270%200%200%200%200%20%200%200%200%200%200%20%200%200%200%200%200%20%200%200%200%201%200%27/%3E" +
        "%3C/filter%3E" +
        "%3Crect%20width%3D%27240%27%20height%3D%27240%27%20filter%3D%27url%28%23n%29%27/%3E" +
        "%3C/svg%3E";

    const style = document.createElement('style');
    style.textContent = `
        .mp-paper-grain {
            position: fixed;
            inset: -10%;
            z-index: 9000;
            pointer-events: none;
            opacity: 0.07;
            mix-blend-mode: multiply;
            background-image: url("${noiseSvg}");
            background-size: 240px 240px;
            animation: mpGrainShift 6s steps(6) infinite;
        }
        @keyframes mpGrainShift {
            0%, 100% { transform: translate(0, 0); }
            20% { transform: translate(-1%, 0.5%); }
            40% { transform: translate(0.6%, -0.8%); }
            60% { transform: translate(-0.4%, 1%); }
            80% { transform: translate(1%, 0.4%); }
        }
        @media (prefers-reduced-motion: reduce) {
            .mp-paper-grain { animation: none; }
        }
    `;
    document.head.appendChild(style);

    const grain = document.createElement('div');
    grain.className = 'mp-paper-grain';
    grain.setAttribute('aria-hidden', 'true');
    document.body.appendChild(grain);
})();