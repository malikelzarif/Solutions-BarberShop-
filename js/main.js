/* =========================================================
   Solutions Barbershop — Main JS
   Fixed live reviews loading
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

  const nextReviewBtn = qs(".review-btn--next");
  const prevReviewBtn = qs(".review-btn--prev");

  const liveReviewsContainer = qs("#reviewsContainer");
  const avgRatingNode = qs("#avgRating");
  const totalReviewsNode = qs("#totalReviews");
  const toggleReviewsBtn = qs("#toggleReviewsBtn");

  const HEADER_OFFSET = 88;
  const REVIEW_INTERVAL = 5000;

  const LIVE_REVIEWS_API =
    "https://script.google.com/macros/s/AKfycbzwlCP2G3bjGD2fxLoNlcD-Kwx9wq3QXIdEFCl4UFZeDVZtkc0nhlPmFa3fq23hUi9T/exec?action=reviews";

  const INITIAL_REVIEW_COUNT = 6;

  let reviewCards = qsa(".review-card");
  let allLiveReviews = [];
  let showAllReviews = false;

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

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeRating(value) {
    const rating = Number(value);
    if (Number.isNaN(rating)) return 5;
    return Math.max(1, Math.min(5, Math.round(rating)));
  }

  function buildStars(rating) {
    const safeRating = normalizeRating(rating);
    return "★".repeat(safeRating) + "☆".repeat(5 - safeRating);
  }

  function parseReviewsResponse(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.reviews)) return data.reviews;
    return [];
  }

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

  function initFallbackReviewsSlider() {
    const fallbackScope = qs("#fallbackReviews") || qs(".reviews-slider");
    if (!fallbackScope) return;

    reviewCards = qsa(".review-card", fallbackScope);
    if (!reviewCards.length) return;

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
      if (reviewCards.length > 1) {
        autoSlideTimer = window.setInterval(nextReview, REVIEW_INTERVAL);
      }
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

    fallbackScope.addEventListener("mouseenter", stopAutoSlide);
    fallbackScope.addEventListener("mouseleave", startAutoSlide);
    fallbackScope.addEventListener("focusin", stopAutoSlide);
    fallbackScope.addEventListener("focusout", startAutoSlide);
  }

  function updateReviewSummary(reviews) {
    if (!reviews.length) {
      if (avgRatingNode) avgRatingNode.textContent = "⭐ 0.0";
      if (totalReviewsNode) totalReviewsNode.textContent = "No reviews yet";
      return;
    }

    const total = reviews.length;
    const sum = reviews.reduce(function (acc, review) {
      return acc + normalizeRating(review.rating);
    }, 0);
    const avg = (sum / total).toFixed(1);

    if (avgRatingNode) avgRatingNode.textContent = "⭐ " + avg;
    if (totalReviewsNode) {
      totalReviewsNode.textContent = total + (total === 1 ? " review" : " reviews");
    }
  }

  function renderLiveReviews() {
    if (!liveReviewsContainer) return;

    const visibleReviews = showAllReviews
      ? allLiveReviews
      : allLiveReviews.slice(0, INITIAL_REVIEW_COUNT);

    if (!visibleReviews.length) {
      liveReviewsContainer.innerHTML =
        '<article class="review-card active"><div class="stars">☆☆☆☆☆</div><p>No reviews yet.</p><h3>Check back soon</h3></article>';
    } else {
      liveReviewsContainer.innerHTML = visibleReviews
        .map(function (review) {
          const name = escapeHtml(review.name || "Verified Client");
          const text = escapeHtml(review.review || "");
          const stars = buildStars(review.rating);

          return (
            '<article class="review-card active">' +
            '<div class="stars" aria-label="' +
            normalizeRating(review.rating) +
            ' star review">' +
            stars +
            "</div>" +
            "<p>“" +
            text +
            "”</p>" +
            "<h3>" +
            name +
            "</h3>" +
            "</article>"
          );
        })
        .join("");
    }

    if (toggleReviewsBtn) {
      if (allLiveReviews.length > INITIAL_REVIEW_COUNT) {
        toggleReviewsBtn.hidden = false;
        toggleReviewsBtn.textContent = showAllReviews
          ? "See Less Reviews"
          : "See More Reviews";
      } else {
        toggleReviewsBtn.hidden = true;
      }
    }
  }

  function loadLiveReviews() {
    if (!liveReviewsContainer) return;

    liveReviewsContainer.innerHTML =
      '<article class="review-card active"><div class="stars">★★★★★</div><p>Loading reviews...</p><h3>Please wait</h3></article>';

    fetch(LIVE_REVIEWS_API, {
      method: "GET",
      cache: "no-store",
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Failed to load reviews");
        }
        return response.json();
      })
      .then(function (data) {
        const reviews = parseReviewsResponse(data)
          .filter(function (review) {
            return review && (review.review || review.name);
          })
          .map(function (review) {
            return {
              name: review.name || "Verified Client",
              review: review.review || "",
              rating: normalizeRating(review.rating),
            };
          })
          .reverse();

        allLiveReviews = reviews;
        updateReviewSummary(allLiveReviews);
        renderLiveReviews();
      })
      .catch(function (error) {
        console.error("Live reviews error:", error);

        if (avgRatingNode) avgRatingNode.textContent = "⭐ --";
        if (totalReviewsNode) totalReviewsNode.textContent = "Unable to load reviews";

        liveReviewsContainer.innerHTML =
          '<article class="review-card active"><div class="stars">☆☆☆☆☆</div><p>Live reviews could not be loaded right now.</p><h3>Please try again later</h3></article>';

        if (toggleReviewsBtn) {
          toggleReviewsBtn.hidden = true;
        }
      });
  }

  if (toggleReviewsBtn) {
    toggleReviewsBtn.addEventListener("click", function () {
      showAllReviews = !showAllReviews;
      renderLiveReviews();
    });
  }

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

      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
      }

      window.setTimeout(() => {
        target.focus({ preventScroll: true });
      }, 500);
    });
  });

  function initRevealAnimations() {
    const revealItems = qsa(
      ".section, .service-feature, .gallery-grid img, .review-card, .location-card, .cta-panel"
    );

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (
      !prefersReducedMotion &&
      revealItems.length &&
      "IntersectionObserver" in window
    ) {
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
  }

  const sectionIds = [
    "home",
    "services",
    "about",
    "gallery",
    "reviews",
    "locations",
    "contact",
  ];

  const sections = sectionIds.map((id) => qs("#" + id)).filter(Boolean);
  const navLinks = qsa('.nav a, .mobile-menu__nav a:not(.btn)');

  function updateActiveNavLink() {
    if (!sections.length || !navLinks.length) return;

    const scrollPosition =
      window.scrollY + (header ? header.offsetHeight + 40 : 120);

    let currentSectionId = sections[0].id;

    sections.forEach((section) => {
      if (scrollPosition >= section.offsetTop) {
        currentSectionId = section.id;
      }
    });

    navLinks.forEach((link) => {
      const isHashLink = link.getAttribute("href") === "#" + currentSectionId;
      link.classList.toggle("is-active", isHashLink);
    });
  }

  updateActiveNavLink();
  window.addEventListener("scroll", updateActiveNavLink, { passive: true });
  window.addEventListener("resize", updateActiveNavLink);

  const yearNode = qs("#year");
  if (yearNode && !yearNode.textContent.trim()) {
    yearNode.textContent = new Date().getFullYear();
  }

  initFallbackReviewsSlider();
  loadLiveReviews();
  initRevealAnimations();
})();