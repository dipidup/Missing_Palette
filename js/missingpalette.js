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

})();
