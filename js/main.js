/* =========================================================
   Solutions Barbershop — Main JS
   Refined interactions / stable behavior / premium feel
   ========================================================= */

(function () {
  "use strict";

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) =>
    Array.from(scope.querySelectorAll(selector));

  const body = document.body;
  const header = qs(".header");
  const menuBtn = qs(".menu-toggle");
  const mobileMenu = qs("#mobileMenu");
  const mobileMenuLinks = qsa(".mobile-menu a");

  const reviewCards = qsa(".review-card");
  const nextReviewBtn = qs(".review-btn--next");
  const prevReviewBtn = qs(".review-btn--prev");

  const HEADER_OFFSET = 88;
  const REVIEW_INTERVAL = 5000;

  /* -----------------------------
     Helpers
  ------------------------------ */
  function setAriaExpanded(element, value) {
    if (element) {
      element.setAttribute("aria-expanded", String(value));
    }
  }

  function openMobileMenu() {
    if (!mobileMenu || !menuBtn) return;
    mobileMenu.removeAttribute("hidden");
    menuBtn.classList.add("is-active");
    body.classList.add("menu-open");
    setAriaExpanded(menuBtn, true);
  }

  function closeMobileMenu() {
    if (!mobileMenu || !menuBtn) return;
    mobileMenu.setAttribute("hidden", "");
    menuBtn.classList.remove("is-active");
    body.classList.remove("menu-open");
    setAriaExpanded(menuBtn, false);
  }

  function toggleMobileMenu() {
    if (!mobileMenu) return;
    const isOpen = !mobileMenu.hasAttribute("hidden");
    if (isOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  function getScrollTargetTop(target) {
    const headerHeight = header ? header.offsetHeight : HEADER_OFFSET;
    const rect = target.getBoundingClientRect();
    return window.pageYOffset + rect.top - headerHeight + 1;
  }

  /* -----------------------------
     Mobile Menu
  ------------------------------ */
  if (menuBtn && mobileMenu) {
    setAriaExpanded(menuBtn, false);

    menuBtn.addEventListener("click", function () {
      toggleMobileMenu();
    });

    mobileMenuLinks.forEach((link) => {
      link.addEventListener("click", function () {
        closeMobileMenu();
      });
    });

    document.addEventListener("click", function (event) {
      const clickedInsideMenu = mobileMenu.contains(event.target);
      const clickedMenuBtn = menuBtn.contains(event.target);

      if (!clickedInsideMenu && !clickedMenuBtn) {
        closeMobileMenu();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeMobileMenu();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 992) {
        closeMobileMenu();
      }
    });
  }

  /* -----------------------------
     Header Shadow on Scroll
  ------------------------------ */
  function updateHeaderState() {
    if (!header) return;

    if (window.scrollY > 12) {
      header.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.08)";
      header.classList.add("is-scrolled");
    } else {
      header.style.boxShadow = "none";
      header.classList.remove("is-scrolled");
    }
  }

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });

  /* -----------------------------
     Reviews Slider
  ------------------------------ */
  if (reviewCards.length) {
    let currentReviewIndex = 0;
    let autoSlideTimer = null;

    function showReview(index) {
      reviewCards.forEach((card, i) => {
        const isActive = i === index;
        card.classList.toggle("active", isActive);
        card.setAttribute("aria-hidden", String(!isActive));
      });
    }

    function nextReview() {
      currentReviewIndex = (currentReviewIndex + 1) % reviewCards.length;
      showReview(currentReviewIndex);
    }

    function prevReview() {
      currentReviewIndex =
        (currentReviewIndex - 1 + reviewCards.length) % reviewCards.length;
      showReview(currentReviewIndex);
    }

    function startAutoSlide() {
      stopAutoSlide();
      autoSlideTimer = window.setInterval(nextReview, REVIEW_INTERVAL);
    }

    function stopAutoSlide() {
      if (autoSlideTimer) {
        window.clearInterval(autoSlideTimer);
        autoSlideTimer = null;
      }
    }

    function resetAutoSlide() {
      startAutoSlide();
    }

    showReview(currentReviewIndex);
    startAutoSlide();

    if (nextReviewBtn) {
      nextReviewBtn.addEventListener("click", function () {
        nextReview();
        resetAutoSlide();
      });
    }

    if (prevReviewBtn) {
      prevReviewBtn.addEventListener("click", function () {
        prevReview();
        resetAutoSlide();
      });
    }

    const reviewsSection = qs(".reviews-slider");
    if (reviewsSection) {
      reviewsSection.addEventListener("mouseenter", stopAutoSlide);
      reviewsSection.addEventListener("mouseleave", startAutoSlide);
      reviewsSection.addEventListener("focusin", stopAutoSlide);
      reviewsSection.addEventListener("focusout", startAutoSlide);
    }
  }

  /* -----------------------------
     Smooth Anchor Scroll
  ------------------------------ */
  qsa('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (event) {
      const href = this.getAttribute("href");

      if (!href || href === "#") return;

      const target = qs(href);
      if (!target) return;

      event.preventDefault();

      const targetTop = getScrollTargetTop(target);

      window.scrollTo({
        top: targetTop,
        behavior: "smooth",
      });

      if (target.hasAttribute("tabindex") === false) {
        target.setAttribute("tabindex", "-1");
      }

      window.setTimeout(() => {
        target.focus({ preventScroll: true });
      }, 500);
    });
  });

  /* -----------------------------
     Reveal Animations
  ------------------------------ */
  const revealItems = qsa(
    ".section, .service-feature, .gallery-grid img, .review-card, .location-card, .cta-panel"
  );

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (!prefersReducedMotion && revealItems.length && "IntersectionObserver" in window) {
    revealItems.forEach((item) => {
      item.style.opacity = "0";
      item.style.transform = "translateY(26px)";
      item.style.transition =
        "opacity 0.8s ease, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)";
      item.style.willChange = "opacity, transform";
    });

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => {
      item.style.opacity = "1";
      item.style.transform = "none";
      item.style.transition = "none";
    });
  }

  /* -----------------------------
     Active Nav Link on Scroll
  ------------------------------ */
  const sectionIds = ["home", "services", "about", "gallery", "reviews", "locations", "contact"];
  const sections = sectionIds
    .map((id) => qs(`#${id}`))
    .filter(Boolean);

  const navLinks = qsa('.nav a, .mobile-menu__nav a:not(.btn)');

  function updateActiveNavLink() {
    if (!sections.length || !navLinks.length) return;

    const scrollPosition = window.scrollY + (header ? header.offsetHeight + 40 : 120);

    let currentSectionId = sections[0].id;

    sections.forEach((section) => {
      if (scrollPosition >= section.offsetTop) {
        currentSectionId = section.id;
      }
    });

    navLinks.forEach((link) => {
      const isActive = link.getAttribute("href") === `#${currentSectionId}`;
      link.classList.toggle("is-active", isActive);
    });
  }

  updateActiveNavLink();
  window.addEventListener("scroll", updateActiveNavLink, { passive: true });
  window.addEventListener("resize", updateActiveNavLink);

  /* -----------------------------
     Year Fallback
  ------------------------------ */
  const yearNode = qs("#year");
  if (yearNode && !yearNode.textContent.trim()) {
    yearNode.textContent = new Date().getFullYear();
  }
})();