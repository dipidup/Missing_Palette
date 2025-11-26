/* ===================================================================
 * Luther - Optimized Main JS
 * Clean, modular, and performance-optimized
 * ------------------------------------------------------------------- */

(function(html) {
    "use strict";

    html.className = html.className.replace(/\bno-js\b/g, '') + ' js ';

    /* --------------------------------------------------------------
     * Constants & Configuration
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
     * Preloader Animation Timeline
     * -------------------------------------------------------------- */
    const initPreloader = () => {
        const preloader = document.querySelector('#preloader');
        if (!preloader) return;

        const tl = anime.timeline({
            easing: 'easeInOutCubic',
            duration: 800,
            autoplay: false
        })
        .add({
            targets: '#loader',
            opacity: 0,
            duration: 1000,
            begin: () => window.scrollTo(0, 0)
        })
        .add({
            targets: '#preloader',
            opacity: 0,
            complete: () => {
                preloader.style.visibility = "hidden";
                preloader.style.display = "none";
            }
        })
        .add({
            targets: '.s-header',
            translateY: [-100, 0],
            opacity: [0, 1]
        }, '-=200')
        .add({
            targets: ['.s-intro .text-pretitle', '.s-intro .text-huge-title'],
            translateX: [100, 0],
            opacity: [0, 1],
            delay: anime.stagger(400)
        })
        .add({
            targets: '.circles span',
            keyframes: [
                { opacity: [0, .3] },
                { opacity: [.3, .1], delay: anime.stagger(100, { direction: 'reverse' }) }
            ],
            delay: anime.stagger(100, { direction: 'reverse' })
        })
        .add({
            targets: '.intro-social li',
            translateX: [-50, 0],
            opacity: [0, 1],
            delay: anime.stagger(100, { direction: 'reverse' })
        })
        .add({
            targets: '.intro-scrolldown',
            translateY: [100, 0],
            opacity: [0, 1]
        }, '-=800');

        window.addEventListener('load', () => {
            html.classList.remove('ss-preload');
            html.classList.add('ss-loaded');
            document.querySelectorAll('.ss-animated').forEach(el => el.classList.remove('ss-animated'));
            tl.play();
        });
    };

    /* --------------------------------------------------------------
     * Mobile Menu
     * -------------------------------------------------------------- */ 
    const initMobileMenu = () => {
        const toggleButton = document.querySelector('.mobile-menu-toggle');
        const mainNavWrap = document.querySelector('.main-nav-wrap');
        const siteBody = document.body;

        if (!toggleButton || !mainNavWrap) return;

        const closeMenu = () => {
            toggleButton.classList.remove('is-clicked');
            siteBody.classList.remove('menu-is-open');
        };

        toggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            toggleButton.classList.toggle('is-clicked');
            siteBody.classList.toggle('menu-is-open');
        });

        mainNavWrap.querySelectorAll('.main-nav a').forEach(link => {
            link.addEventListener("click", () => {
                if (window.matchMedia('(max-width: 800px)').matches) closeMenu();
            });
        });

        window.addEventListener('resize', () => {
            if (window.matchMedia('(min-width: 801px)').matches) closeMenu();
        });
    };

    /* --------------------------------------------------------------
     * ScrollSpy
     * -------------------------------------------------------------- */
    const initScrollSpy = () => {
        const sections = document.querySelectorAll(".target-section");
        if (!sections.length) return;

        window.addEventListener("scroll", () => {
            const scrollY = window.pageYOffset;

            sections.forEach(section => {
                const sectionHeight = section.offsetHeight;
                const sectionTop = section.offsetTop - 50;
                const sectionId = section.getAttribute("id");
                const navLink = document.querySelector(`.main-nav a[href="#${sectionId}"]`);

                if (navLink) {
                    const isActive = scrollY > sectionTop && scrollY <= sectionTop + sectionHeight;
                    navLink.parentNode.classList.toggle("current", isActive);
                }
            });
        });
    };

    /* --------------------------------------------------------------
     * Animate on Scroll
     * -------------------------------------------------------------- */
    const initViewAnimate = () => {
        const blocks = document.querySelectorAll("[data-animate-block]");
        if (!blocks.length) return;

        window.addEventListener("scroll", () => {
            const scrollY = window.pageYOffset;
            const viewportHeight = window.innerHeight;

            blocks.forEach(block => {
                if (block.classList.contains("ss-animated")) return;

                const triggerTop = (block.offsetTop + (viewportHeight * 0.2)) - viewportHeight;
                const blockSpace = triggerTop + block.offsetHeight;
                const inView = scrollY > triggerTop && scrollY <= blockSpace;

                if (inView) {
                    anime({
                        targets: block.querySelectorAll("[data-animate-el]"),
                        opacity: [0, 1],
                        translateY: [100, 0],
                        delay: anime.stagger(400, { start: 200 }),
                        duration: 800,
                        easing: 'easeInOutCubic',
                        begin: () => block.classList.add("ss-animated")
                    });
                }
            });
        });
    };

    /* --------------------------------------------------------------
     * Swiper Slider
     * -------------------------------------------------------------- */ 
    const initSwiper = () => {
        const swiperContainer = document.querySelector('.swiper-container');
        if (!swiperContainer) return;

        new Swiper(swiperContainer, {
            slidesPerView: 1,
            loop: true,
            autoplay: {
                delay: CONFIG.SWIPER.AUTOPLAY_DELAY,
                disableOnInteraction: false
            },
            speed: CONFIG.SWIPER.SPEED,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            breakpoints: {
                401: { slidesPerView: 1, spaceBetween: 20 },
                801: { slidesPerView: 2, spaceBetween: 32 },
                1201: { slidesPerView: 2, spaceBetween: 80 }
            }
        });
    };

    /* --------------------------------------------------------------
     * Lightbox
     * -------------------------------------------------------------- */
    const initLightbox = () => {
        const folioLinks = document.querySelectorAll('.folio-list__item-link');
        if (!folioLinks.length) return;

        const modals = Array.from(folioLinks).map(link => {
            const modalbox = link.getAttribute('href');
            return basicLightbox.create(
                document.querySelector(modalbox),
                {
                    onShow: (instance) => {
                        const closeOnEsc = (e) => e.keyCode === 27 && instance.close();
                        document.addEventListener("keydown", closeOnEsc);
                    }
                }
            );
        });

        folioLinks.forEach((link, index) => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                modals[index].show();
            });
        });
    };

    /* --------------------------------------------------------------
     * Alert Boxes
     * -------------------------------------------------------------- */
    const initAlertBoxes = () => {
        document.querySelectorAll('.alert-box').forEach(box => {
            box.addEventListener('click', (e) => {
                if (e.target.matches(".alert-box__close")) {
                    e.stopPropagation();
                    box.classList.add("hideit");
                    setTimeout(() => box.style.display = "none", 500);
                }
            });
        });
    };

    /* --------------------------------------------------------------
     * Smooth Scroll
     * -------------------------------------------------------------- */
    const initSmoothScroll = () => {
        const moveTo = new MoveTo({
            tolerance: 0,
            duration: 1200,
            easing: 'easeInOutCubic'
        });

        document.querySelectorAll('.smoothscroll').forEach(trigger => {
            moveTo.registerTrigger(trigger);
        });
    };

    /* --------------------------------------------------------------
     * Google Business Ratings
     * -------------------------------------------------------------- */
    const initGoogleRatings = () => {
        const elements = {
            pune: {
                rating: document.getElementById("rating-pune"),
                count: document.getElementById("count-pune")
            },
            ranchi: {
                rating: document.getElementById("rating-ranchi"),
                count: document.getElementById("count-ranchi")
            }
        };

        const fetchRating = async (placeId, ratingEl, countEl) => {
            if (!ratingEl || !countEl) return;

            const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total&key=${CONFIG.GOOGLE_API_KEY}`;

            try {
                const res = await fetch(url);
                const data = await res.json();

                if (data.result) {
                    ratingEl.textContent = `⭐ ${data.result.rating}/5`;
                    countEl.textContent = `${data.result.user_ratings_total} reviews`;
                } else {
                    ratingEl.textContent = "Unavailable";
                }
            } catch {
                ratingEl.textContent = "Error";
            }
        };

        if (elements.pune.rating && elements.pune.count) {
            fetchRating(CONFIG.PLACES.PUNE, elements.pune.rating, elements.pune.count);
        }

        if (elements.ranchi.rating && elements.ranchi.count) {
            fetchRating(CONFIG.PLACES.RANCHI, elements.ranchi.rating, elements.ranchi.count);
        }
    };

    /* --------------------------------------------------------------
     * Card Rotation
     * -------------------------------------------------------------- */
    const initCardRotation = () => {
        const cards = document.querySelectorAll(".work-card");
        if (!cards.length) return;

        let index = 0;

        const rotateCards = () => {
            cards.forEach(card => card.classList.remove("card-front", "card-right", "card-left"));
            cards[index % cards.length].classList.add("card-front");
            cards[(index + 1) % cards.length].classList.add("card-right");
            cards[(index + 2) % cards.length].classList.add("card-left");
            index++;
        };

        rotateCards();
        setInterval(rotateCards, CONFIG.CARD_ROTATION_INTERVAL);
    };

    /* --------------------------------------------------------------
     * Gallery Fullscreen Modal
     * -------------------------------------------------------------- */
    const initGalleryModal = () => {
        const items = document.querySelectorAll(".gallery-item");
        const modal = document.querySelector(".fullscreen-modal");
        
        if (!items.length || !modal) return;

        const modalImg = modal.querySelector("img");
        const closeBtn = modal.querySelector(".close-modal");
        const arrowLeft = modal.querySelector(".modal-arrow.left");
        const arrowRight = modal.querySelector(".modal-arrow.right");

        let currentIndex = 0;
        let startX = 0;

        const openModal = (index) => {
            currentIndex = index;
            modalImg.src = items[index].querySelector("img").src;
            modal.classList.add("show");
        };

        const closeModal = () => modal.classList.remove("show");
        
        const nextImg = () => {
            currentIndex = (currentIndex + 1) % items.length;
            modalImg.src = items[currentIndex].querySelector("img").src;
        };

        const prevImg = () => {
            currentIndex = (currentIndex - 1 + items.length) % items.length;
            modalImg.src = items[currentIndex].querySelector("img").src;
        };

        // Thumbnail clicks
        items.forEach((item, index) => {
            item.addEventListener("click", () => openModal(index));
        });

        // Close actions
        closeBtn?.addEventListener("click", closeModal);
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });

        // Arrow navigation
        arrowLeft?.addEventListener("click", (e) => {
            e.stopPropagation();
            prevImg();
        });

        arrowRight?.addEventListener("click", (e) => {
            e.stopPropagation();
            nextImg();
        });

        // Keyboard navigation (highest priority)
        window.addEventListener("keydown", (e) => {
            if (!modal.classList.contains("show")) return;

            if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Escape") {
                e.stopImmediatePropagation();
                e.preventDefault();
            }

            if (e.key === "ArrowLeft") prevImg();
            if (e.key === "ArrowRight") nextImg();
            if (e.key === "Escape") closeModal();
        }, true);

        // Touch swipe
        modal.addEventListener("touchstart", (e) => {
            startX = e.touches[0].clientX;
        });

        modal.addEventListener("touchend", (e) => {
            const endX = e.changedTouches[0].clientX;
            const diff = startX - endX;

            if (Math.abs(diff) > 50) {
                diff > 0 ? nextImg() : prevImg();
            }
        });

        


    };

// Global fallback: close any open gallery modal on ESC (keeps class consistent with initGalleryModal)
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
        document.querySelectorAll(".fullscreen-modal.show").forEach(modal => {
            modal.classList.remove("show");
        });
    }
});







    

    /* --------------------------------------------------------------
     * Initialize All Features
     * -------------------------------------------------------------- */
    const init = () => {
        // DOM Ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Initialize all modules
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

    // Start initialization
    init();

})(document.documentElement);
