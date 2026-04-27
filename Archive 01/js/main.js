/* ===================================================================
 * Luther - Optimized Main JS (No Features Removed)
 * Cleaned, stabilized, GPU-friendly, scroll-optimized
 * ------------------------------------------------------------------- */

(function (html) {
    "use strict";

    html.className = html.className.replace(/\bno-js\b/g, "") + " js ";

    /* --------------------------------------------------------------
     * CONFIG
     * -------------------------------------------------------------- */
    const CONFIG = {
        GOOGLE_API_KEY: "YOUR_API_KEY",
        PLACES: {
            PUNE: "ChIJ18Vmwx_BwjsRRPwn1UQRNus",
            RANCHI: "ChIJMyS0GeHg9DkRs-ikZBp-1YU"
        },
        SWIPER: {
            AUTOPLAY_DELAY: 2000,
            SPEED: 600
        },
        CARD_ROTATION_INTERVAL: 2500
    };

    /* --------------------------------------------------------------
     * Preloader (FIXED #loader → .loader)
     * -------------------------------------------------------------- */
    const initPreloader = () => {
        const preloader = document.querySelector("#preloader");
        const loader = document.querySelector("#preloader .loader");
        if (!preloader || !loader) return;

        const tl = anime.timeline({
            easing: "easeInOutCubic",
            duration: 800,
            autoplay: false
        })
            .add({
                targets: "#preloader .loader",
                opacity: 0,
                duration: 1000,
                begin: () => window.scrollTo(0, 0)
            })
            .add({
                targets: "#preloader",
                opacity: 0,
                complete: () => {
                    preloader.style.visibility = "hidden";
                    preloader.style.display = "none";
                }
            })
            .add(
                {
                    targets: ".s-header",
                    translateY: [-100, 0],
                    opacity: [0, 1]
                },
                "-=200"
            )
            .add({
                targets: [".s-intro .text-pretitle", ".s-intro .text-huge-title"],
                translateX: [100, 0],
                opacity: [0, 1],
                delay: anime.stagger(400)
            })
            .add({
                targets: ".circles span",
                keyframes: [
                    { opacity: [0, 0.3] },
                    { opacity: [0.3, 0.1], delay: anime.stagger(100, { direction: "reverse" }) }
                ],
                delay: anime.stagger(100, { direction: "reverse" })
            })
            .add({
                targets: ".intro-social li",
                translateX: [-50, 0],
                opacity: [0, 1],
                delay: anime.stagger(100, { direction: "reverse" })
            })
            .add(
                {
                    targets: ".intro-scrolldown",
                    translateY: [100, 0],
                    opacity: [0, 1]
                },
                "-=800"
            );

        window.addEventListener("load", () => {
            html.classList.remove("ss-preload");
            html.classList.add("ss-loaded");
            document.querySelectorAll(".ss-animated").forEach((el) => el.classList.remove("ss-animated"));
            tl.play();
        });
    };

    /* --------------------------------------------------------------
     * Mobile Menu
     * -------------------------------------------------------------- */
    const initMobileMenu = () => {
        const btn = document.querySelector(".mobile-menu-toggle");
        const navWrap = document.querySelector(".main-nav-wrap");
        if (!btn || !navWrap) return;

        const closeMenu = () => {
            btn.classList.remove("is-clicked");
            document.body.classList.remove("menu-is-open");
        };

        btn.addEventListener("click", (e) => {
            e.preventDefault();
            btn.classList.toggle("is-clicked");
            document.body.classList.toggle("menu-is-open");
        });

        navWrap.querySelectorAll(".main-nav a").forEach((link) => {
            link.addEventListener("click", () => {
                if (window.innerWidth <= 800) closeMenu();
            });
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 800) closeMenu();
        });
    };

    /* --------------------------------------------------------------
     * ScrollSpy (Optimized w/ rAF)
     * -------------------------------------------------------------- */
    const initScrollSpy = () => {
        const sections = document.querySelectorAll(".target-section");
        if (!sections.length) return;

        let ticking = false;

        window.addEventListener("scroll", () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollY = window.pageYOffset;

                    sections.forEach((section) => {
                        const top = section.offsetTop - 50;
                        const height = section.offsetHeight;
                        const id = section.getAttribute("id");
                        const link = document.querySelector(`.main-nav a[href="#${id}"]`);

                        if (link) {
                            const active = scrollY > top && scrollY <= top + height;
                            link.parentNode.classList.toggle("current", active);
                        }
                    });

                    ticking = false;
                });

                ticking = true;
            }
        });
    };

    /* --------------------------------------------------------------
     * Animate on Scroll (Optimized)
     * -------------------------------------------------------------- */
    const initViewAnimate = () => {
        const blocks = document.querySelectorAll("[data-animate-block]");
        if (!blocks.length) return;

        let ticking = false;

        const animate = () => {
            const scrollY = window.pageYOffset;
            const viewport = window.innerHeight;

            blocks.forEach((block) => {
                if (block.classList.contains("ss-animated")) return;

                const triggerTop = block.offsetTop - viewport * 0.8;
                const visible = scrollY > triggerTop;

                if (visible) {
                    anime({
                        targets: block.querySelectorAll("[data-animate-el]"),
                        opacity: [0, 1],
                        translateY: [100, 0],
                        delay: anime.stagger(400, { start: 200 }),
                        duration: 800,
                        easing: "easeInOutCubic",
                        begin: () => block.classList.add("ss-animated")
                    });
                }
            });
        };

        window.addEventListener("scroll", () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    animate();
                    ticking = false;
                });

                ticking = true;
            }
        });
    };

    /* --------------------------------------------------------------
     * Swiper (safe)
     * -------------------------------------------------------------- */
    const initSwiper = () => {
        const container = document.querySelector(".swiper-container");
        if (!container || typeof Swiper === "undefined") return;

        new Swiper(container, {
            slidesPerView: 1,
            loop: true,
            autoplay: {
                delay: CONFIG.SWIPER.AUTOPLAY_DELAY,
                disableOnInteraction: false
            },
            speed: CONFIG.SWIPER.SPEED,
            pagination: {
                el: ".swiper-pagination",
                clickable: true
            },
            breakpoints: {
                401: { slidesPerView: 1, spaceBetween: 20 },
                801: { slidesPerView: 2, spaceBetween: 32 },
                1201: { slidesPerView: 2, spaceBetween: 80 }
            }
        });
    };

    /* --------------------------------------------------------------
     * Lightbox (safe)
     * -------------------------------------------------------------- */
    const initLightbox = () => {
        const links = document.querySelectorAll(".folio-list__item-link");
        if (!links.length || typeof basicLightbox === "undefined") return;

        const modals = [...links].map((link) => {
            const modalId = link.getAttribute("href");
            return basicLightbox.create(document.querySelector(modalId), {
                onShow: (instance) => {
                    const esc = (e) => e.keyCode === 27 && instance.close();
                    document.addEventListener("keydown", esc);
                }
            });
        });

        links.forEach((link, i) => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                modals[i].show();
            });
        });
    };

    /* --------------------------------------------------------------
     * Alert Boxes
     * -------------------------------------------------------------- */
    const initAlertBoxes = () => {
        document.querySelectorAll(".alert-box").forEach((box) => {
            box.addEventListener("click", (e) => {
                if (e.target.matches(".alert-box__close")) {
                    e.stopPropagation();
                    box.classList.add("hideit");
                    setTimeout(() => (box.style.display = "none"), 500);
                }
            });
        });
    };

    /* --------------------------------------------------------------
     * Smooth Scroll
     * -------------------------------------------------------------- */
    const initSmoothScroll = () => {
        if (typeof MoveTo === "undefined") return;

        const moveTo = new MoveTo({
            tolerance: 0,
            duration: 1200,
            easing: "easeInOutCubic"
        });

        document.querySelectorAll(".smoothscroll").forEach((trigger) =>
            moveTo.registerTrigger(trigger)
        );
    };

    /* --------------------------------------------------------------
     * Google Ratings (safe)
     * -------------------------------------------------------------- */
    const initGoogleRatings = () => {
        const fetchRating = async (placeId, ratingEl, countEl) => {
            if (!ratingEl || !countEl) return;

            try {
                const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total&key=${CONFIG.GOOGLE_API_KEY}`;
                const res = await fetch(url);
                const data = await res.json();

                if (data.result) {
                    ratingEl.textContent = `⭐ ${data.result.rating}/5`;
                    countEl.textContent = `${data.result.user_ratings_total} reviews`;
                }
            } catch {
                ratingEl.textContent = "Error";
            }
        };

        fetchRating(
            CONFIG.PLACES.PUNE,
            document.getElementById("rating-pune"),
            document.getElementById("count-pune")
        );
        fetchRating(
            CONFIG.PLACES.RANCHI,
            document.getElementById("rating-ranchi"),
            document.getElementById("count-ranchi")
        );
    };

    /* --------------------------------------------------------------
     * Card Rotation
     * -------------------------------------------------------------- */
    const initCardRotation = () => {
        const cards = document.querySelectorAll(".work-card");
        if (!cards.length) return;

        let index = 0;

        const rotate = () => {
            cards.forEach((c) =>
                c.classList.remove("card-front", "card-right", "card-left")
            );

            cards[index % cards.length].classList.add("card-front");
            cards[(index + 1) % cards.length].classList.add("card-right");
            cards[(index + 2) % cards.length].classList.add("card-left");

            index++;
        };

        rotate();
        setInterval(rotate, CONFIG.CARD_ROTATION_INTERVAL);
    };

    /* --------------------------------------------------------------
     * Gallery Modal (optimized, unchanged behavior)
     * -------------------------------------------------------------- */
    const initGalleryModal = () => {
        const items = document.querySelectorAll(".gallery-item");
        const modal = document.querySelector(".fullscreen-modal");
        if (!items.length || !modal) return;

        const modalImg = modal.querySelector("img");
        const btnClose = modal.querySelector(".close-modal");
        const left = modal.querySelector(".modal-arrow.left");
        const right = modal.querySelector(".modal-arrow.right");

        let index = 0;
        let startX = 0;

        const update = () => {
            modalImg.src = items[index].querySelector("img").src;
        };

        const open = (i) => {
            index = i;
            update();
            modal.classList.add("show");
        };

        const close = () => modal.classList.remove("show");

        items.forEach((item, i) => item.addEventListener("click", () => open(i)));

        btnClose.addEventListener("click", close);
        modal.addEventListener("click", (e) => {
            if (e.target === modal) close();
        });

        left.addEventListener("click", (e) => {
            e.stopPropagation();
            index = (index - 1 + items.length) % items.length;
            update();
        });

        right.addEventListener("click", (e) => {
            e.stopPropagation();
            index = (index + 1) % items.length;
            update();
        });

        window.addEventListener(
            "keydown",
            (e) => {
                if (!modal.classList.contains("show")) return;

                if (e.key === "ArrowLeft") {
                    index = (index - 1 + items.length) % items.length;
                    update();
                }
                if (e.key === "ArrowRight") {
                    index = (index + 1) % items.length;
                    update();
                }
                if (e.key === "Escape") close();
            },
            true
        );

        modal.addEventListener("touchstart", (e) => {
            startX = e.touches[0].clientX;
        });

        modal.addEventListener("touchend", (e) => {
            const diff = startX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
                diff > 0
                    ? (index = (index + 1) % items.length)
                    : (index = (index - 1 + items.length) % items.length);
                update();
            }
        });
    };

    /* --------------------------------------------------------------
     * Initialize All
     * -------------------------------------------------------------- */
    const init = () => {
        initPreloader();
        initMobileMenu();
        initScrollSpy();
        initViewAnimate();
        initSwiper();
        initLightbox();
        initAlertBoxes();
        initSmoothScroll();
        initGoogleRatings();
        initCardRotation();
        initGalleryModal();
    };

    init();
})(document.documentElement);

/* --------------------------------------------------------------
 * Optimized Parallax (same behavior, smoother)
 * -------------------------------------------------------------- */
let parallaxTick = false;

document.addEventListener("scroll", () => {
    if (!parallaxTick) {
        requestAnimationFrame(() => {
            document.querySelectorAll(".service-img img").forEach((img) => {
                const rect = img.getBoundingClientRect();
                img.style.transform = `translateY(${rect.top * 0.25}px)`;
            });

            parallaxTick = false;
        });

        parallaxTick = true;
    }
});
