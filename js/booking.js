(function () {
  "use strict";

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) =>
    Array.from(scope.querySelectorAll(selector));

  const header = qs(".header");
  const bookingForm = qs("#bookingForm");

  if (!bookingForm) {
    return;
  }

  const shopSelect = qs("#shopLocation");
  const barberSelect = qs("#preferredBarber");
  const serviceSelect = qs("#preferredService");
  const notesField = qs("#bookingNotes");
  const referenceField = qs("#bookingReference");
  const bookingStatus = qs("#bookingStatus");

  const booksyButton = qs("#booksyBookingButton");
  const googleButton = qs("#googleBookingButton");
  const clearButton = qs("#clearBookingSelection");

  const summaryShop = qs("#bookingSummaryShop");
  const summaryBarber = qs("#bookingSummaryBarber");
  const summaryService = qs("#bookingSummaryService");
  const summaryMethod = qs("#bookingSummaryMethod");

  const summaryTagShop = qs("#summaryTagShop");
  const summaryTagBarber = qs("#summaryTagBarber");
  const summaryTagService = qs("#summaryTagService");

  const summaryBlock = qs(".booking-sidebar__block--summary");
  const summaryCard = qs(".booking-mini-card");
  const bookingSummaryList = qs(".booking-summary");
  const bookingSelectionTags = qs(".booking-selection-tags");

  const stickyBookLink = qs(".sticky-book");
  const yearNode = qs("#year");

  const shopCards = qsa(".js-shop-card");
  const shopSelectButtons = qsa(".js-select-shop");
  const barberCards = qsa(".js-barber-card");
  const barberSelectButtons = qsa(".js-select-barber");
  const serviceChips = qsa(".js-service-chip");
  const progressSteps = qsa(".booking-progress__step");
  const flowCards = qsa(".booking-step-card");
  const methodCards = qsa(".booking-method-card");
  const heroStats = qsa(".booking-hero__stat");
  const magneticButtons = qsa(
    ".booking-action-btn, .js-select-shop, .js-select-barber, .booking-chip, .booking-team-toolbar__link"
  );

  const STORAGE_KEY = "solutions_barbershop_booking_state_v4";
  const BOOKING_SECTION_SELECTOR = "#booking-section";
  const DEFAULT_STATUS =
    "Choose a location and barber to unlock both booking options.";
  const DEFAULT_REFERENCE = "Choose your booking method below";
  const GOOGLE_BOOKING_URL =
    "https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0E1r_4To1sK164vhmS2AgQCMe7xYa3B7efXYMJTUBiBKLMbh55CI8Kr1EiWnxWw4CgQrz9uj-W";

  const SHOPS = {
    "shop-1": {
      id: "shop-1",
      label: "Solutions Barbershop 1",
      shortLabel: "Shop 1",
      booksyUrl:
        "https://booksy.com/en-us/444251_solutions-barbershop-1_barber-shop_28561_jersey-city#ba_s=sh_1",
      googleUrl: GOOGLE_BOOKING_URL,
      barbers: [
        { id: "channel", label: "Channel" },
        { id: "jonathan", label: "Jonathan" },
        { id: "lenin", label: "Lenin" },
      ],
    },
    "shop-2": {
      id: "shop-2",
      label: "Solutions Barber Shop 2",
      shortLabel: "Shop 2",
      booksyUrl:
        "https://booksy.com/en-us/88253_solutions-barber-shop-2_barber-shop_28561_jersey-city#ba_s=sh_1",
      googleUrl: GOOGLE_BOOKING_URL,
      barbers: [{ id: "juan", label: "Juan" }],
    },
  };

  const SERVICES = {
    haircut: "Haircut",
    "haircut-and-beard": "Haircut + Beard",
    "kids-haircut": "Kids Haircut",
    "shape-up": "Shape Up",
    "hair-design": "Hair Design",
    "hair-wash": "Hair Wash",
    "house-call": "House Call",
  };

  /*
    Update these estimate ranges to match your live pricing.
    They are clearly treated as estimates in the UI.
  */
  const PRICE_ESTIMATES = {
    haircut: { min: 40, max: 55 },
    "haircut-and-beard": { min: 55, max: 75 },
    "kids-haircut": { min: 30, max: 40 },
    "shape-up": { min: 20, max: 30 },
    "hair-design": { min: 50, max: 70 },
    "hair-wash": { min: 10, max: 18 },
    "house-call": { min: 90, max: 150 },
  };

  const BARBERS_BY_ID = Object.values(SHOPS).reduce(function (accumulator, shop) {
    shop.barbers.forEach(function (barber) {
      accumulator[barber.id] = {
        id: barber.id,
        label: barber.label,
        shopId: shop.id,
        shopLabel: shop.label,
      };
    });
    return accumulator;
  }, {});

  const INITIAL_BARBER_OPTIONS = qsa("option[data-shop]", barberSelect).map(
    function (option) {
      return {
        value: option.value,
        label:
          option.getAttribute("data-barber-label") || option.textContent.trim(),
        shopId: option.getAttribute("data-shop") || "",
      };
    }
  );

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const state = {
    shopId: "",
    barberId: "",
    serviceId: "",
    notes: "",
    selectedMethod: "",
  };

  let summaryPrice = null;
  let summaryTagPrice = null;
  let estimatorCard = null;
  let estimatorAmount = null;
  let estimatorNote = null;

  function setYear() {
    if (yearNode) {
      yearNode.textContent = String(new Date().getFullYear());
    }
  }

  function getHeaderOffset() {
    return header ? header.offsetHeight || 88 : 88;
  }

  function smoothScrollTo(selector) {
    const target = qs(selector);
    if (!target) return;

    const targetTop =
      window.pageYOffset +
      target.getBoundingClientRect().top -
      getHeaderOffset() +
      1;

    window.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });
  }

  function focusTarget(selector) {
    const target = qs(selector);
    if (!target) return;

    if (!target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
    }

    window.setTimeout(function () {
      try {
        target.focus({ preventScroll: true });
      } catch (error) {
        target.focus();
      }
    }, 420);
  }

  function getShop(shopId) {
    return SHOPS[shopId] || null;
  }

  function getBarber(barberId) {
    return BARBERS_BY_ID[barberId] || null;
  }

  function getServiceLabel(serviceId) {
    return SERVICES[serviceId] || "Any service";
  }

  function isValidShop(shopId) {
    return Boolean(getShop(shopId));
  }

  function isValidBarberForShop(barberId, shopId) {
    const barber = getBarber(barberId);
    return Boolean(barber && barber.shopId === shopId);
  }

  function hasLocationSelection() {
    return isValidShop(state.shopId);
  }

  function hasBarberSelection() {
    return isValidBarberForShop(state.barberId, state.shopId);
  }

  function hasServiceSelection() {
    return Boolean(state.serviceId && SERVICES[state.serviceId]);
  }

  function hasValidBookingSelection() {
    return hasLocationSelection() && hasBarberSelection();
  }

  function createOption(value, label, isDisabled, isSelected) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;

    if (isDisabled) {
      option.disabled = true;
    }

    if (isSelected) {
      option.selected = true;
    }

    return option;
  }

  function rebuildBarberOptions(shopId, preferredBarberId) {
    const shop = getShop(shopId);

    barberSelect.innerHTML = "";

    if (!shop) {
      barberSelect.appendChild(
        createOption("", "Choose a shop first", true, true)
      );
      barberSelect.disabled = true;
      barberSelect.setAttribute("aria-disabled", "true");
      return;
    }

    barberSelect.disabled = false;
    barberSelect.setAttribute("aria-disabled", "false");

    barberSelect.appendChild(
      createOption("", "Choose your barber", false, preferredBarberId === "")
    );

    INITIAL_BARBER_OPTIONS.filter(function (optionData) {
      return optionData.shopId === shop.id;
    }).forEach(function (optionData) {
      const option = createOption(
        optionData.value,
        optionData.label,
        false,
        optionData.value === preferredBarberId
      );
      option.setAttribute("data-shop", optionData.shopId);
      barberSelect.appendChild(option);
    });

    if (
      preferredBarberId &&
      !INITIAL_BARBER_OPTIONS.some(function (optionData) {
        return (
          optionData.shopId === shop.id &&
          optionData.value === preferredBarberId
        );
      })
    ) {
      barberSelect.value = "";
    }
  }

  function setButtonAvailability(button, isEnabled) {
    if (!button) return;

    button.disabled = !isEnabled;
    button.setAttribute("aria-disabled", String(!isEnabled));

    if (isEnabled) {
      button.removeAttribute("tabindex");
    } else {
      button.setAttribute("tabindex", "-1");
    }
  }

  function setStatus(message, type) {
    if (!bookingStatus) return;

    bookingStatus.textContent = message;
    bookingStatus.classList.remove("is-success", "is-idle");

    if (type === "success") {
      bookingStatus.classList.add("is-success");
    } else {
      bookingStatus.classList.add("is-idle");
    }
  }

  function formatCurrency(value) {
    return "$" + Number(value).toFixed(0);
  }

  function formatRange(range) {
    if (!range || typeof range.min !== "number" || typeof range.max !== "number") {
      return "Choose a service";
    }

    if (range.min === range.max) {
      return formatCurrency(range.min);
    }

    return formatCurrency(range.min) + "–" + formatCurrency(range.max);
  }

  function getPriceEstimate(serviceId) {
    if (!serviceId || !PRICE_ESTIMATES[serviceId]) {
      return null;
    }

    return PRICE_ESTIMATES[serviceId];
  }

  function createPriceEstimatorUI() {
    if (!summaryCard || !bookingSummaryList || !summaryBlock) {
      return;
    }

    let existingPriceItem = qs("#bookingSummaryPriceItem", summaryCard);

    if (!existingPriceItem) {
      existingPriceItem = document.createElement("div");
      existingPriceItem.className = "booking-summary__item booking-summary__item--price";
      existingPriceItem.id = "bookingSummaryPriceItem";
      existingPriceItem.innerHTML =
        '<dt>Estimated Price</dt><dd id="bookingSummaryPrice">Choose a service</dd>';
      bookingSummaryList.appendChild(existingPriceItem);
    }

    summaryPrice = qs("#bookingSummaryPrice", summaryCard);

    if (bookingSelectionTags && !qs("#summaryTagPrice", bookingSelectionTags)) {
      const tag = document.createElement("span");
      tag.className = "booking-selection-tag";
      tag.id = "summaryTagPrice";
      tag.textContent = "No estimate yet";
      bookingSelectionTags.appendChild(tag);
    }

    summaryTagPrice = qs("#summaryTagPrice", summaryBlock);

    if (!qs("#bookingPriceEstimator", summaryBlock)) {
      const priceEstimator = document.createElement("div");
      priceEstimator.className = "booking-price-estimator";
      priceEstimator.id = "bookingPriceEstimator";
      priceEstimator.innerHTML =
        '<span class="booking-section-label">Price Estimator</span>' +
        '<div class="booking-price-estimator__amount" id="bookingPriceEstimatorAmount">Choose a service</div>' +
        '<p class="booking-note booking-price-estimator__note" id="bookingPriceEstimatorNote">Select a service to see an estimated range.</p>';

      summaryBlock.appendChild(priceEstimator);
    }

    estimatorCard = qs("#bookingPriceEstimator", summaryBlock);
    estimatorAmount = qs("#bookingPriceEstimatorAmount", summaryBlock);
    estimatorNote = qs("#bookingPriceEstimatorNote", summaryBlock);
  }

  function buildReferenceText() {
    const shop = getShop(state.shopId);
    const barber = getBarber(state.barberId);
    const serviceLabel = getServiceLabel(state.serviceId);

    if (!shop && !barber) {
      return DEFAULT_REFERENCE;
    }

    if (shop && !barber) {
      return shop.label + " selected";
    }

    if (shop && barber && state.serviceId) {
      return shop.label + " • " + barber.label + " • " + serviceLabel;
    }

    if (shop && barber) {
      return shop.label + " • " + barber.label;
    }

    return DEFAULT_REFERENCE;
  }

  function setReferenceField() {
    if (!referenceField) return;
    referenceField.value = buildReferenceText();
  }

  function updateSummary() {
    const shop = getShop(state.shopId);
    const barber = getBarber(state.barberId);
    const serviceLabel = getServiceLabel(state.serviceId);

    if (summaryShop) {
      summaryShop.textContent = shop ? shop.label : "Not selected";
    }

    if (summaryBarber) {
      summaryBarber.textContent = barber ? barber.label : "Not selected";
    }

    if (summaryService) {
      summaryService.textContent = serviceLabel;
    }

    if (summaryMethod) {
      if (state.selectedMethod === "booksy") {
        summaryMethod.textContent = "Booksy";
      } else if (state.selectedMethod === "google") {
        summaryMethod.textContent = "Google";
      } else {
        summaryMethod.textContent = "Not selected";
      }
    }

    if (summaryTagShop) {
      summaryTagShop.textContent = shop ? shop.shortLabel : "No shop selected";
    }

    if (summaryTagBarber) {
      summaryTagBarber.textContent = barber
        ? barber.label
        : "No barber selected";
    }

    if (summaryTagService) {
      summaryTagService.textContent = serviceLabel;
    }
  }

  function updatePriceEstimator() {
    const serviceId = state.serviceId;
    const serviceLabel = getServiceLabel(serviceId);
    const estimate = getPriceEstimate(serviceId);
    const hasEstimate = Boolean(estimate);

    if (!summaryPrice || !summaryTagPrice || !estimatorAmount || !estimatorNote) {
      return;
    }

    if (!serviceId) {
      summaryPrice.textContent = "Choose a service";
      summaryTagPrice.textContent = "No estimate yet";
      estimatorAmount.textContent = "Choose a service";
      estimatorNote.textContent =
        "Select a service to see an estimated range.";
      if (estimatorCard) {
        estimatorCard.classList.remove("is-active");
      }
      return;
    }

    if (!hasEstimate) {
      summaryPrice.textContent = "Custom pricing";
      summaryTagPrice.textContent = "Custom pricing";
      estimatorAmount.textContent = "Custom pricing";
      estimatorNote.textContent =
        serviceLabel +
        " pricing should be set manually in booking.js for the live estimator.";
      if (estimatorCard) {
        estimatorCard.classList.add("is-active");
      }
      return;
    }

    const priceText = formatRange(estimate);

    summaryPrice.textContent = priceText;
    summaryTagPrice.textContent = priceText;
    estimatorAmount.textContent = priceText;
    estimatorNote.textContent =
      serviceLabel +
      " estimated range only. Final price may vary by barber, add-ons, and booking platform.";

    if (estimatorCard) {
      estimatorCard.classList.add("is-active");
    }
  }

  function updateShopCardState() {
    shopCards.forEach(function (card) {
      const isSelected = card.getAttribute("data-shop") === state.shopId;
      card.classList.toggle("is-selected", isSelected);
      card.setAttribute("aria-pressed", String(isSelected));
    });

    shopSelectButtons.forEach(function (button) {
      const shopId = button.getAttribute("data-shop");
      const isSelected = shopId === state.shopId;

      button.classList.toggle("is-selected", isSelected);
      button.textContent = isSelected
        ? "Selected"
        : shopId === "shop-2"
        ? "Select Shop 2"
        : "Select Shop 1";
    });
  }

  function updateBarberCardState() {
    barberCards.forEach(function (card) {
      const cardShop = card.getAttribute("data-shop");
      const cardBarber = card.getAttribute("data-barber-id");
      const isSelected =
        cardShop === state.shopId && cardBarber === state.barberId;

      card.classList.toggle("is-selected", isSelected);
      card.setAttribute("aria-pressed", String(isSelected));
    });

    barberSelectButtons.forEach(function (button) {
      const barberId = button.getAttribute("data-barber-id");
      const shopId = button.getAttribute("data-shop");
      const barberName = button.getAttribute("data-barber") || "Barber";
      const isSelected =
        barberId === state.barberId && shopId === state.shopId;

      button.classList.toggle("is-selected", isSelected);
      button.textContent = isSelected ? "Selected" : "Select " + barberName;
    });
  }

  function updateServiceChipState() {
    serviceChips.forEach(function (chip) {
      const serviceId = chip.getAttribute("data-service") || "";
      const isSelected = serviceId === state.serviceId;
      chip.classList.toggle("is-selected", isSelected);
      chip.setAttribute("aria-pressed", String(isSelected));
    });
  }

  function updateProgressState() {
    let progressCount = 0;

    if (hasLocationSelection()) {
      progressCount = 1;
    }

    if (hasBarberSelection()) {
      progressCount = 2;
    }

    if (hasServiceSelection()) {
      progressCount = 3;
    }

    if (hasValidBookingSelection()) {
      progressCount = Math.max(progressCount, 4);
    }

    progressSteps.forEach(function (step, index) {
      const stepNumber = index + 1;
      const isComplete = progressCount >= stepNumber;
      step.classList.toggle("is-active", isComplete);
    });

    flowCards.forEach(function (card, index) {
      const stepNumber = index + 1;
      const isComplete = progressCount >= stepNumber;
      card.classList.toggle("is-active", isComplete);
    });
  }

  function updateMethodCards() {
    methodCards.forEach(function (card) {
      const isBooksyCard = card.classList.contains("booking-method-card--booksy");
      const isGoogleCard = card.classList.contains("booking-method-card--google");

      card.classList.remove("is-active");

      if (state.selectedMethod === "booksy" && isBooksyCard) {
        card.classList.add("is-active");
      }

      if (state.selectedMethod === "google" && isGoogleCard) {
        card.classList.add("is-active");
      }
    });
  }

  function updateHeroStats() {
    heroStats.forEach(function (card, index) {
      card.classList.remove("is-active");

      if (index === 0 && hasLocationSelection()) {
        card.classList.add("is-active");
      }

      if (index === 1 && hasBarberSelection()) {
        card.classList.add("is-active");
      }

      if (index === 2 && state.selectedMethod) {
        card.classList.add("is-active");
      }

      if (index === 3 && hasValidBookingSelection()) {
        card.classList.add("is-active");
      }
    });
  }

  function updateActionButtons() {
    const valid = hasValidBookingSelection();
    const shop = getShop(state.shopId);
    const barber = getBarber(state.barberId);

    setButtonAvailability(booksyButton, valid);
    setButtonAvailability(googleButton, valid);

    if (!valid || !shop || !barber) {
      booksyButton.textContent = "Book with Booksy";
      googleButton.textContent = "Book with Google";
      booksyButton.removeAttribute("data-booking-url");
      googleButton.removeAttribute("data-booking-url");
      setStatus(DEFAULT_STATUS, "idle");
      return;
    }

    booksyButton.setAttribute("data-booking-url", shop.booksyUrl);
    googleButton.setAttribute("data-booking-url", shop.googleUrl);

    booksyButton.textContent = "Book with Booksy — " + shop.shortLabel;
    googleButton.textContent = "Book with Google";

    if (state.selectedMethod === "booksy") {
      setStatus(
        "Booksy is ready for " + barber.label + " at " + shop.label + ".",
        "success"
      );
      return;
    }

    if (state.selectedMethod === "google") {
      setStatus(
        "Google booking is ready for " + barber.label + " at " + shop.label + ".",
        "success"
      );
      return;
    }

    setStatus(
      "Ready to book with " + barber.label + " at " + shop.label + ".",
      "success"
    );
  }

  function updateStickyButton() {
    if (!stickyBookLink) return;

    if (hasValidBookingSelection()) {
      stickyBookLink.textContent = "Ready To Book";
      stickyBookLink.classList.remove("is-disabled");
      return;
    }

    if (hasLocationSelection() || hasBarberSelection() || state.serviceId) {
      stickyBookLink.textContent = "Continue Booking";
      stickyBookLink.classList.remove("is-disabled");
      return;
    }

    stickyBookLink.textContent = "Book Now";
    stickyBookLink.classList.remove("is-disabled");
  }

  function saveState() {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          shopId: state.shopId,
          barberId: state.barberId,
          serviceId: state.serviceId,
          notes: state.notes,
          selectedMethod: state.selectedMethod,
        })
      );
    } catch (error) {
      return;
    }
  }

  function parseUrlState() {
    const params = new URLSearchParams(window.location.search);
    const shopId = params.get("shop") || "";
    const barberId = params.get("barber") || "";
    const serviceId = params.get("service") || "";

    return {
      shopId: isValidShop(shopId) ? shopId : "",
      barberId: barberId && getBarber(barberId) ? barberId : "",
      serviceId: SERVICES[serviceId] ? serviceId : "",
    };
  }

  function restoreState() {
    let stored = null;

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      stored = raw ? JSON.parse(raw) : null;
    } catch (error) {
      stored = null;
    }

    const urlState = parseUrlState();

    const source = {
      shopId: "",
      barberId: "",
      serviceId: "",
      notes: "",
      selectedMethod: "",
    };

    if (stored && typeof stored === "object") {
      source.shopId = stored.shopId || "";
      source.barberId = stored.barberId || "";
      source.serviceId = stored.serviceId || "";
      source.notes = typeof stored.notes === "string" ? stored.notes : "";
      source.selectedMethod =
        stored.selectedMethod === "booksy" || stored.selectedMethod === "google"
          ? stored.selectedMethod
          : "";
    }

    if (urlState.shopId) {
      source.shopId = urlState.shopId;
    }

    if (urlState.barberId) {
      source.barberId = urlState.barberId;
    }

    if (urlState.serviceId) {
      source.serviceId = urlState.serviceId;
    }

    if (isValidShop(source.shopId)) {
      state.shopId = source.shopId;
      shopSelect.value = state.shopId;
    }

    rebuildBarberOptions(state.shopId, "");

    if (isValidBarberForShop(source.barberId, state.shopId)) {
      state.barberId = source.barberId;
      barberSelect.value = state.barberId;
    }

    if (SERVICES[source.serviceId]) {
      state.serviceId = source.serviceId;
      serviceSelect.value = state.serviceId;
    }

    if (notesField && source.notes) {
      state.notes = source.notes;
      notesField.value = source.notes;
    }

    if (source.selectedMethod === "booksy" || source.selectedMethod === "google") {
      state.selectedMethod = source.selectedMethod;
    }
  }

  function updateUrlState() {
    try {
      const url = new URL(window.location.href);

      if (state.shopId) {
        url.searchParams.set("shop", state.shopId);
      } else {
        url.searchParams.delete("shop");
      }

      if (state.barberId) {
        url.searchParams.set("barber", state.barberId);
      } else {
        url.searchParams.delete("barber");
      }

      if (state.serviceId) {
        url.searchParams.set("service", state.serviceId);
      } else {
        url.searchParams.delete("service");
      }

      window.history.replaceState({}, "", url.toString());
    } catch (error) {
      return;
    }
  }

  function updateUI() {
    setReferenceField();
    updateSummary();
    updatePriceEstimator();
    updateShopCardState();
    updateBarberCardState();
    updateServiceChipState();
    updateProgressState();
    updateMethodCards();
    updateHeroStats();
    updateActionButtons();
    updateStickyButton();
    updateUrlState();
    saveState();
  }

  function setShop(shopId, preserveBarber) {
    if (!isValidShop(shopId)) {
      state.shopId = "";
      state.barberId = "";
      shopSelect.value = "";
      rebuildBarberOptions("", "");
      updateUI();
      return;
    }

    const shouldPreserveBarber =
      Boolean(preserveBarber) &&
      isValidBarberForShop(state.barberId, shopId);

    state.shopId = shopId;
    shopSelect.value = shopId;

    if (!shouldPreserveBarber) {
      state.barberId = "";
    }

    rebuildBarberOptions(shopId, shouldPreserveBarber ? state.barberId : "");
    barberSelect.value = shouldPreserveBarber ? state.barberId : "";

    if (!shouldPreserveBarber) {
      state.selectedMethod = "";
    }

    updateUI();
  }

  function setBarber(shopId, barberId) {
    if (!isValidShop(shopId) || !isValidBarberForShop(barberId, shopId)) {
      return;
    }

    state.shopId = shopId;
    state.barberId = barberId;
    state.selectedMethod = "";

    shopSelect.value = shopId;
    rebuildBarberOptions(shopId, barberId);
    barberSelect.value = barberId;

    updateUI();
  }

  function setService(serviceId) {
    if (!serviceId || !SERVICES[serviceId]) {
      state.serviceId = "";
      serviceSelect.value = "";
      updateUI();
      return;
    }

    state.serviceId = serviceId;
    serviceSelect.value = serviceId;
    updateUI();
  }

  function clearSelection() {
    state.shopId = "";
    state.barberId = "";
    state.serviceId = "";
    state.notes = "";
    state.selectedMethod = "";

    shopSelect.value = "";
    serviceSelect.value = "";

    if (notesField) {
      notesField.value = "";
    }

    rebuildBarberOptions("", "");
    updateUI();

    smoothScrollTo(BOOKING_SECTION_SELECTOR);
    focusTarget(BOOKING_SECTION_SELECTOR);
  }

  function openBooking(method) {
    if (!hasValidBookingSelection()) {
      setStatus(DEFAULT_STATUS, "idle");
      smoothScrollTo(BOOKING_SECTION_SELECTOR);
      focusTarget(BOOKING_SECTION_SELECTOR);
      return;
    }

    const shop = getShop(state.shopId);
    const barber = getBarber(state.barberId);

    if (!shop || !barber) {
      return;
    }

    let bookingUrl = "";
    let methodLabel = "";

    if (method === "booksy") {
      bookingUrl = shop.booksyUrl;
      methodLabel = "Booksy";
    } else if (method === "google") {
      bookingUrl = shop.googleUrl;
      methodLabel = "Google";
    }

    if (!bookingUrl) {
      return;
    }

    state.selectedMethod = method;
    updateUI();

    setStatus(
      "Opening " +
        methodLabel +
        " for " +
        barber.label +
        " at " +
        shop.label +
        ".",
      "success"
    );

    window.open(bookingUrl, "_blank", "noopener,noreferrer");
  }

  function handleShopChange() {
    const nextShopId = shopSelect.value || "";

    if (!nextShopId) {
      setShop("", false);
      return;
    }

    const preserveBarber = isValidBarberForShop(state.barberId, nextShopId);
    setShop(nextShopId, preserveBarber);
  }

  function handleBarberChange() {
    const nextBarberId = barberSelect.value || "";

    if (!nextBarberId) {
      state.barberId = "";
      state.selectedMethod = "";
      updateUI();
      return;
    }

    const barber = getBarber(nextBarberId);

    if (!barber) {
      state.barberId = "";
      state.selectedMethod = "";
      updateUI();
      return;
    }

    setBarber(barber.shopId, barber.id);
  }

  function handleServiceChange() {
    state.selectedMethod = "";
    setService(serviceSelect.value || "");
  }

  function handleNotesChange() {
    state.notes = notesField ? notesField.value.trim() : "";
    saveState();
  }

  function activateShopSelection(shopId, shouldScroll) {
    setShop(shopId, false);

    if (shouldScroll) {
      smoothScrollTo(BOOKING_SECTION_SELECTOR);
      focusTarget(BOOKING_SECTION_SELECTOR);
    }
  }

  function activateBarberSelection(shopId, barberId, shouldScroll) {
    setBarber(shopId, barberId);

    if (shouldScroll) {
      smoothScrollTo(BOOKING_SECTION_SELECTOR);
      focusTarget(BOOKING_SECTION_SELECTOR);
    }
  }

  function activateServiceSelection(serviceId) {
    const nextServiceId = state.serviceId === serviceId ? "" : serviceId;
    state.selectedMethod = "";
    setService(nextServiceId);
  }

  function handleKeyboardActivate(event, callback) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      callback();
    }
  }

  function attachShopCardEvents() {
    shopCards.forEach(function (card) {
      const shopId = card.getAttribute("data-shop") || "";

      card.addEventListener("click", function (event) {
        if (event.target.closest("a, button")) {
          return;
        }
        activateShopSelection(shopId, true);
      });

      card.addEventListener("keydown", function (event) {
        handleKeyboardActivate(event, function () {
          activateShopSelection(shopId, true);
        });
      });
    });

    shopSelectButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        const shopId = button.getAttribute("data-shop") || "";
        const scrollTarget =
          button.getAttribute("data-scroll-target") || BOOKING_SECTION_SELECTOR;

        activateShopSelection(shopId, false);
        smoothScrollTo(scrollTarget);
        focusTarget(scrollTarget);
      });
    });
  }

  function attachBarberCardEvents() {
    barberCards.forEach(function (card) {
      const shopId = card.getAttribute("data-shop") || "";
      const barberId = card.getAttribute("data-barber-id") || "";

      card.addEventListener("click", function (event) {
        if (event.target.closest("button, a")) {
          return;
        }
        activateBarberSelection(shopId, barberId, true);
      });

      card.addEventListener("keydown", function (event) {
        handleKeyboardActivate(event, function () {
          activateBarberSelection(shopId, barberId, true);
        });
      });
    });

    barberSelectButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        const shopId = button.getAttribute("data-shop") || "";
        const barberId = button.getAttribute("data-barber-id") || "";
        const scrollTarget =
          button.getAttribute("data-scroll-target") || BOOKING_SECTION_SELECTOR;

        activateBarberSelection(shopId, barberId, false);
        smoothScrollTo(scrollTarget);
        focusTarget(scrollTarget);
      });
    });
  }

  function attachServiceChipEvents() {
    serviceChips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        const serviceId = chip.getAttribute("data-service") || "";
        activateServiceSelection(serviceId);
      });

      chip.addEventListener("keydown", function (event) {
        handleKeyboardActivate(event, function () {
          const serviceId = chip.getAttribute("data-service") || "";
          activateServiceSelection(serviceId);
        });
      });
    });
  }

  function attachFormEvents() {
    shopSelect.addEventListener("change", handleShopChange);
    barberSelect.addEventListener("change", handleBarberChange);
    serviceSelect.addEventListener("change", handleServiceChange);

    if (notesField) {
      notesField.addEventListener("input", handleNotesChange);
      notesField.addEventListener("change", handleNotesChange);
    }

    booksyButton.addEventListener("click", function () {
      openBooking("booksy");
    });

    googleButton.addEventListener("click", function () {
      openBooking("google");
    });

    clearButton.addEventListener("click", function () {
      clearSelection();
    });

    bookingForm.addEventListener("submit", function (event) {
      event.preventDefault();
    });
  }

  function attachStickyButton() {
    if (!stickyBookLink) return;

    stickyBookLink.addEventListener("click", function (event) {
      const href = stickyBookLink.getAttribute("href");
      if (!href || href.charAt(0) !== "#") return;

      event.preventDefault();
      smoothScrollTo(href);
      focusTarget(href);
    });
  }

  function initRevealAnimations() {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      return;
    }

    const revealItems = qsa(
      ".booking-hero__stat, .booking-step-card, .location-card, .barber-card, .booking-card, .booking-sidebar__block, .booking-faq-card"
    );

    revealItems.forEach(function (item) {
      item.classList.add("reveal-pending");
    });

    const observer = new IntersectionObserver(
      function (entries, instance) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("reveal-in");
          instance.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    revealItems.forEach(function (item) {
      observer.observe(item);
    });
  }

  function attachMagneticButtons() {
    if (prefersReducedMotion) return;

    magneticButtons.forEach(function (button) {
      button.addEventListener("mousemove", function (event) {
        if (button.disabled) return;

        const rect = button.getBoundingClientRect();
        const offsetX = event.clientX - rect.left - rect.width / 2;
        const offsetY = event.clientY - rect.top - rect.height / 2;
        const moveX = offsetX * 0.08;
        const moveY = offsetY * 0.12;

        button.style.transform = "translate(" + moveX + "px, " + moveY + "px)";
      });

      button.addEventListener("mouseleave", function () {
        button.style.transform = "";
      });

      button.addEventListener("blur", function () {
        button.style.transform = "";
      });
    });
  }

  function attachSmartScrollHints() {
    const bookingSection = qs(BOOKING_SECTION_SELECTOR);
    if (!bookingSection || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            document.body.classList.add("booking-section-in-view");
          } else {
            document.body.classList.remove("booking-section-in-view");
          }
        });
      },
      {
        threshold: 0.16,
      }
    );

    observer.observe(bookingSection);
  }

  function init() {
    setYear();
    rebuildBarberOptions("", "");
    createPriceEstimatorUI();
    restoreState();
    attachShopCardEvents();
    attachBarberCardEvents();
    attachServiceChipEvents();
    attachFormEvents();
    attachStickyButton();
    initRevealAnimations();
    attachMagneticButtons();
    attachSmartScrollHints();
    updateUI();
  }

  init();
})();