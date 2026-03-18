/* =========================================================
   Royal Edge / Premium Barbershop Website
   Main JavaScript
   Handles:
   - Mobile menu toggle
   - Auto-closing mobile menu on link click
   - Reviews slider
   - Sticky header shadow on scroll
   - Reveal on scroll
   ========================================================= */

(function () {
  "use strict";

  const body = document.body;
  const header = document.querySelector(".header");
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileLinks = document.querySelectorAll(".mobile-menu__nav a");

  const reviewCards = document.querySelectorAll(".review-card");
  const prevBtn = document.querySelector(".review-btn--prev");
  const nextBtn = document.querySelector(".review-btn--next");

  let currentReview = 0;

  /* -----------------------------
     Mobile Menu
  ------------------------------ */
  function openMenu() {
    if (!menuToggle || !mobileMenu) return;

    mobileMenu.hidden = false;
    menuToggle.setAttribute("aria-expanded", "true");
    body.style.overflow = "hidden";
  }

  function closeMenu() {
    if (!menuToggle || !mobileMenu) return;

    mobileMenu.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
    body.style.overflow = "";
  }

  function toggleMenu() {
    if (!mobileMenu || !menuToggle) return;

    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";

    if (isExpanded) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", toggleMenu);
  }

  if (mobileLinks.length) {
    mobileLinks.forEach((link) => {
      link.addEventListener("click", () => {
        closeMenu();
      });
    });
  }

  window.addEventListener("resize", () => {
    if (window.innerWidth > 992) {
      closeMenu();
    }
  });

  /* -----------------------------
     Reviews Slider
  ------------------------------ */
  function showReview(index) {
    if (!reviewCards.length) return;

    reviewCards.forEach((card, i) => {
      card.classList.toggle("active", i === index);
    });
  }

  function nextReview() {
    currentReview = (currentReview + 1) % reviewCards.length;
    showReview(currentReview);
  }

  function prevReview() {
    currentReview = (currentReview - 1 + reviewCards.length) % reviewCards.length;
    showReview(currentReview);
  }

  if (reviewCards.length) {
    showReview(currentReview);
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", nextReview);
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", prevReview);
  }

  // Optional auto-rotate every 6 seconds
  if (reviewCards.length > 1) {
    setInterval(nextReview, 6000);
  }

  /* -----------------------------
     Sticky Header Enhancement
  ------------------------------ */
  function handleHeaderScroll() {
    if (!header) return;

    if (window.scrollY > 20) {
      header.style.background = "rgba(10, 12, 17, 0.86)";
      header.style.boxShadow = "0 10px 30px rgba(0,0,0,0.18)";
    } else {
      header.style.background = "rgba(10, 12, 17, 0.68)";
      header.style.boxShadow = "none";
    }
  }

  window.addEventListener("scroll", handleHeaderScroll);
  handleHeaderScroll();

  /* -----------------------------
     Reveal on Scroll
  ------------------------------ */
  const revealItems = document.querySelectorAll(
    ".section-heading, .service-card, .info-card, .review-card, .social-card, .booking-panel__inner, .gallery-grid img"
  );

  revealItems.forEach((item) => {
    item.style.opacity = "0";
    item.style.transform = "translateY(24px)";
    item.style.transition = "opacity 700ms ease, transform 700ms ease";
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
    }
  );

  revealItems.forEach((item) => observer.observe(item));
})();