/* =========================================================
   Solutions Barbershop 2 — Main JS
   Clean, premium interactions
   ========================================================= */

(function () {
  const qs = (s, scope = document) => scope.querySelector(s);
  const qsa = (s, scope = document) => Array.from(scope.querySelectorAll(s));

  /* -----------------------------
     Mobile Menu
  ------------------------------ */
  const menuBtn = qs(".menu-toggle");
  const mobileMenu = qs("#mobileMenu");

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => {
      const isOpen = mobileMenu.hasAttribute("hidden") === false;

      if (isOpen) {
        mobileMenu.setAttribute("hidden", "");
        menuBtn.setAttribute("aria-expanded", "false");
      } else {
        mobileMenu.removeAttribute("hidden");
        menuBtn.setAttribute("aria-expanded", "true");
      }
    });

    // Close menu on link click
    qsa(".mobile-menu a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileMenu.setAttribute("hidden", "");
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (
        !mobileMenu.contains(e.target) &&
        !menuBtn.contains(e.target)
      ) {
        mobileMenu.setAttribute("hidden", "");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* -----------------------------
     Header Shadow on Scroll
  ------------------------------ */
  const header = qs(".header");

  function handleScroll() {
    if (!header) return;

    if (window.scrollY > 10) {
      header.style.boxShadow = "0 10px 30px rgba(0,0,0,0.35)";
    } else {
      header.style.boxShadow = "none";
    }
  }

  window.addEventListener("scroll", handleScroll);

  /* -----------------------------
     Reviews Slider
  ------------------------------ */
  const reviews = qsa(".review-card");
  const nextBtn = qs(".review-btn--next");
  const prevBtn = qs(".review-btn--prev");

  let current = 0;
  let autoSlide;

  function showReview(index) {
    reviews.forEach((r) => r.classList.remove("active"));
    reviews[index].classList.add("active");
  }

  function nextReview() {
    current = (current + 1) % reviews.length;
    showReview(current);
  }

  function prevReview() {
    current = (current - 1 + reviews.length) % reviews.length;
    showReview(current);
  }

  if (reviews.length) {
    showReview(current);

    autoSlide = setInterval(nextReview, 5000);

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        nextReview();
        resetAuto();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        prevReview();
        resetAuto();
      });
    }

    function resetAuto() {
      clearInterval(autoSlide);
      autoSlide = setInterval(nextReview, 5000);
    }
  }

  /* -----------------------------
     Smooth Anchor Scroll
  ------------------------------ */
  qsa('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");

      if (targetId.length > 1) {
        const target = qs(targetId);

        if (target) {
          e.preventDefault();

          window.scrollTo({
            top: target.offsetTop - 80,
            behavior: "smooth",
          });
        }
      }
    });
  });

  /* -----------------------------
     Reveal Animations
  ------------------------------ */
  const revealItems = qsa(
    ".section, .service-feature, .gallery-grid img, .review-card"
  );

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
      threshold: 0.12,
    }
  );

  revealItems.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(30px)";
    el.style.transition = "all 0.8s ease";
    observer.observe(el);
  });

})();