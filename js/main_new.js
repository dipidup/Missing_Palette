/* ===================================================================
 * Luther 1.0.0 - Main JS
 * UPDATED: Added Google Ratings Fetcher
 * ------------------------------------------------------------------- */

(function(html) {

    "use strict";

    html.className = html.className.replace(/\bno-js\b/g, '') + ' js ';



   /* Animations
    * -------------------------------------------------- */
    const tl = anime.timeline({
        easing: 'easeInOutCubic',
        duration: 800,
        autoplay: false
    })
    .add({
        targets: '#loader',
        opacity: 0,
        duration: 1000,
        begin: function(anim) { window.scrollTo(0, 0); }
    })
    .add({
        targets: '#preloader',
        opacity: 0,
        complete: function(anim) {
            const pre = document.querySelector("#preloader");
            pre.style.visibility = "hidden";
            pre.style.display = "none";
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



   /* Preloader
    * -------------------------------------------------- */
    const ssPreloader = function() {

        const preloader = document.querySelector('#preloader');
        if (!preloader) return;
        
        window.addEventListener('load', function() {
            document.querySelector('html').classList.remove('ss-preload');
            document.querySelector('html').classList.add('ss-loaded');

            document.querySelectorAll('.ss-animated').forEach(item => item.classList.remove('ss-animated'));

            tl.play();
        });

    }; 



   /* Mobile Menu
    * ---------------------------------------------------- */ 
    const ssMobileMenu = function() {

        const toggleButton = document.querySelector('.mobile-menu-toggle');
        const mainNavWrap = document.querySelector('.main-nav-wrap');
        const siteBody = document.querySelector("body");

        if (!(toggleButton && mainNavWrap)) return;

        toggleButton.addEventListener('click', function(event) {
            event.preventDefault();
            toggleButton.classList.toggle('is-clicked');
            siteBody.classList.toggle('menu-is-open');
        });

        mainNavWrap.querySelectorAll('.main-nav a').forEach(function(link) {
            link.addEventListener("click", function(event) {

                if (window.matchMedia('(max-width: 800px)').matches) {
                    toggleButton.classList.remove('is-clicked');
                    siteBody.classList.remove('menu-is-open');
                }
            });
        });

        window.addEventListener('resize', function() {

            if (window.matchMedia('(min-width: 801px)').matches) {
                siteBody.classList.remove('menu-is-open');
                toggleButton.classList.remove("is-clicked");
            }
        });

    }; 



   /* ScrollSpy
    * ------------------------------------------------------ */
    const ssScrollSpy = function() {

        const sections = document.querySelectorAll(".target-section");

        window.addEventListener("scroll", function() {

            let scrollY = window.pageYOffset;

            sections.forEach(function(current) {
                const sectionHeight = current.offsetHeight;
                const sectionTop = current.offsetTop - 50;
                const sectionId = current.getAttribute("id");

                if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                    document.querySelector(".main-nav a[href*=" + sectionId + "]").parentNode.classList.add("current");
                } else {
                    document.querySelector(".main-nav a[href*=" + sectionId + "]").parentNode.classList.remove("current");
                }
            });
        });

    }; 



   /* Animate on Scroll
    * ------------------------------------------------------ */
    const ssViewAnimate = function() {

        const blocks = document.querySelectorAll("[data-animate-block]");

        window.addEventListener("scroll", function() {

            let scrollY = window.pageYOffset;

            blocks.forEach(function(current) {

                const viewportHeight = window.innerHeight;
                const triggerTop = (current.offsetTop + (viewportHeight * .2)) - viewportHeight;
                const blockHeight = current.offsetHeight;
                const blockSpace = triggerTop + blockHeight;
                const inView = scrollY > triggerTop && scrollY <= blockSpace;
                const isAnimated = current.classList.contains("ss-animated");

                if (inView && (!isAnimated)) {
                    anime({
                        targets: current.querySelectorAll("[data-animate-el]"),
                        opacity: [0, 1],
                        translateY: [100, 0],
                        delay: anime.stagger(400, { start: 200 }),
                        duration: 800,
                        easing: 'easeInOutCubic',
                        begin: function(anim) { current.classList.add("ss-animated"); }
                    });
                }
            });
        });

    }; 



   /* Swiper (Autoplay Enabled)
    * ------------------------------------------------------ */ 
    const ssSwiper = function() {

        const mySwiper = new Swiper('.swiper-container', {

            slidesPerView: 1,
            loop: true,

            autoplay: {
                delay: 2000,               
                disableOnInteraction: false
            },

            speed: 600,

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



   /* Lightbox
    * ------------------------------------------------------ */
    const ssLightbox = function() {

        const folioLinks = document.querySelectorAll('.folio-list__item-link');
        const modals = [];

        folioLinks.forEach(function(link) {
            let modalbox = link.getAttribute('href');
            let instance = basicLightbox.create(
                document.querySelector(modalbox),
                {
                    onShow: function(instance) {

                        document.addEventListener("keydown", function(event) {
                            if (event.keyCode === 27) instance.close();
                        });
                    }
                }
            )
            modals.push(instance);
        });

        folioLinks.forEach(function(link, index) {
            link.addEventListener("click", function(event) {
                event.preventDefault();
                modals[index].show();
            });
        });

    };  



   /* Alert Boxes
    * ------------------------------------------------------ */
    const ssAlertBoxes = function() {

        document.querySelectorAll('.alert-box').forEach(function(box) {
            box.addEventListener('click', function(event) {
                if (event.target.matches(".alert-box__close")) {
                    event.stopPropagation();
                    box.classList.add("hideit");

                    setTimeout(function(){
                        box.style.display = "none";
                    }, 500)
                }    
            });
        });

    }; 



   /* Smooth Scroll
    * ------------------------------------------------------ */
    const ssMoveTo = function(){

        const moveTo = new MoveTo({
            tolerance: 0,
            duration: 1200,
            easing: 'easeInOutCubic',
            container: window
        });

        document.querySelectorAll('.smoothscroll').forEach(trigger => moveTo.registerTrigger(trigger));

    }; 



   /* ------------------------------------------------------
    * ⭐ GOOGLE BUSINESS RATINGS FETCHER ⭐
    * ------------------------------------------------------ */

    const PLACE_PUNE = "ChIJ18Vmwx_BwjsRRPwn1UQRNus";
    const PLACE_RANCHI = "ChIJMyS0GeHg9DkRs-ikZBp-1YU";

    const API_KEY = "YOUR_API_KEY"; // ← replace this

    async function fetchRating(placeId, ratingEl, countEl) {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total&key=${API_KEY}`;

        try {
            const res = await fetch(url);
            const data = await res.json();

            if (data.result) {
                ratingEl.textContent = `⭐ ${data.result.rating}/5`;
                countEl.textContent = `${data.result.user_ratings_total} reviews`;
            } else {
                ratingEl.textContent = "Unavailable";
                countEl.textContent = "";
            }
        } catch (err) {
            ratingEl.textContent = "Error";
            countEl.textContent = "";
        }
    }

    function initGoogleRatings() {
        const rp = document.getElementById("rating-pune");
        const cp = document.getElementById("count-pune");
        const rr = document.getElementById("rating-ranchi");
        const cr = document.getElementById("count-ranchi");

        if (rp && cp) fetchRating(PLACE_PUNE, rp, cp);
        if (rr && cr) fetchRating(PLACE_RANCHI, rr, cr);
    }



   /* Initialize
    * ------------------------------------------------------ */
    (function ssInit() {

        ssPreloader();
        ssMobileMenu();
        ssScrollSpy();
        ssViewAnimate();
        ssSwiper();
        ssLightbox();
        ssAlertBoxes();
        ssMoveTo();

        // ⭐ Start Google Ratings Fetcher
        initGoogleRatings();

    })();

})(document.documentElement);
