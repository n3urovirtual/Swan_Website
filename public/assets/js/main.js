/* ==========================================================================
   SWAN — site behaviour
   Progressive enhancement only: every page works with JS disabled.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------ */
  function initNav() {
    var toggle = document.querySelector(".nav__toggle");
    var panel = document.getElementById("nav-panel");
    if (!toggle || !panel) return;

    function close() {
      toggle.setAttribute("aria-expanded", "false");
      panel.classList.remove("is-open");
      document.body.style.removeProperty("overflow");
    }

    toggle.addEventListener("click", function () {
      if (toggle.getAttribute("aria-expanded") === "true") {
        close();
      } else {
        toggle.setAttribute("aria-expanded", "true");
        panel.classList.add("is-open");
        document.body.style.overflow = "hidden";
      }
    });

    panel.addEventListener("click", function (event) {
      if (event.target.closest("a")) close();
    });

    var scrim = document.querySelector(".nav__scrim");
    if (scrim) scrim.addEventListener("click", close);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) close();
    });
  }

  /* ------------------------------------------------------------------
     Language switcher
     Closed markup by default, so it degrades to nothing without JS.
     ------------------------------------------------------------------ */
  function initLangSwitch() {
    var root = document.querySelector(".lang");
    if (!root) return;

    var toggle = root.querySelector(".lang__toggle");
    var menu = root.querySelector(".lang__menu");
    if (!toggle || !menu) return;

    function close() {
      toggle.setAttribute("aria-expanded", "false");
      menu.hidden = true;
    }

    function open() {
      toggle.setAttribute("aria-expanded", "true");
      menu.hidden = false;
      /* In the mobile panel the list opens in flow inside a scrolling
         container, so bring it into view rather than leaving it clipped. */
      if (menu.scrollIntoView) {
        window.requestAnimationFrame(function () {
          menu.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" });
        });
      }
    }

    toggle.addEventListener("click", function (event) {
      event.stopPropagation();
      if (toggle.getAttribute("aria-expanded") === "true") close();
      else open();
    });

    document.addEventListener("click", function (event) {
      if (!root.contains(event.target)) close();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      if (toggle.getAttribute("aria-expanded") !== "true") return;
      close();
      toggle.focus();
    });

    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) close();
    });
  }

  /* ------------------------------------------------------------------
     Header shadow once the page has scrolled
     ------------------------------------------------------------------ */
  function initStickyHeader() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    var ticking = false;
    function update() {
      header.classList.toggle("is-stuck", window.scrollY > 8);
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    update();
  }

  /* ------------------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------------------ */
  function initReveal() {
    var targets = document.querySelectorAll(".reveal, .reveal-group");
    if (!targets.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ------------------------------------------------------------------
     Stat count-up
     ------------------------------------------------------------------ */
  function initCounters() {
    var counters = document.querySelectorAll("[data-count-to]");
    if (!counters.length) return;

    function render(el, value) {
      var prefix = el.dataset.countPrefix || "";
      var suffix = el.dataset.countSuffix || "";
      el.textContent = prefix + value + suffix;
    }

    function run(el) {
      var target = parseInt(el.dataset.countTo, 10);
      if (isNaN(target)) return;

      if (reduceMotion) {
        render(el, target);
        return;
      }

      var duration = 1400;
      var start = null;

      function step(timestamp) {
        if (start === null) start = timestamp;
        var progress = Math.min((timestamp - start) / duration, 1);
        // easeOutCubic
        var eased = 1 - Math.pow(1 - progress, 3);
        render(el, Math.round(target * eased));
        if (progress < 1) window.requestAnimationFrame(step);
      }

      window.requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) {
      counters.forEach(function (el) {
        render(el, parseInt(el.dataset.countTo, 10));
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            run(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach(function (el) {
      render(el, 0);
      observer.observe(el);
    });
  }

  /* ------------------------------------------------------------------
     News: smooth open/close on <details>
     Native <details> still works without this.
     ------------------------------------------------------------------ */
  function initNewsAccordion() {
    var items = document.querySelectorAll(".news-item");
    if (!items.length || reduceMotion) return;

    items.forEach(function (item) {
      var detail = item.querySelector(".news-item__detail");
      var summary = item.querySelector(".news-item__summary");
      if (!detail || !summary) return;

      summary.addEventListener("click", function (event) {
        event.preventDefault();

        if (item.open) {
          detail.style.height = detail.scrollHeight + "px";
          window.requestAnimationFrame(function () {
            detail.style.transition = "height 0.32s cubic-bezier(0.22,0.61,0.36,1), opacity 0.2s";
            detail.style.overflow = "hidden";
            detail.style.opacity = "0";
            detail.style.height = "0px";
          });
          window.setTimeout(function () {
            item.open = false;
            detail.style.removeProperty("height");
            detail.style.removeProperty("overflow");
            detail.style.removeProperty("transition");
            detail.style.removeProperty("opacity");
          }, 320);
        } else {
          item.open = true;
          /* An image that has not finished loading reports no height, which
             would make the panel animate to the wrong size. Wait for any
             that are still in flight before measuring. */
          var pending = [].slice
            .call(detail.querySelectorAll("img"))
            .filter(function (img) { return !img.complete; });
          if (pending.length) {
            pending.forEach(function (img) {
              img.addEventListener("load", remeasure);
              img.addEventListener("error", remeasure);
            });
          }
          var target = detail.scrollHeight;
          detail.style.overflow = "hidden";
          detail.style.height = "0px";
          detail.style.opacity = "0";
          window.requestAnimationFrame(function () {
            detail.style.transition = "height 0.32s cubic-bezier(0.22,0.61,0.36,1), opacity 0.3s 0.05s";
            detail.style.height = target + "px";
            detail.style.opacity = "1";
          });
          window.setTimeout(function () {
            detail.style.removeProperty("height");
            detail.style.removeProperty("overflow");
            detail.style.removeProperty("transition");
            detail.style.removeProperty("opacity");
          }, 380);
        }

        function remeasure() {
          if (!item.open || !detail.style.height) return;
          detail.style.height = detail.scrollHeight + "px";
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     Consortium map: hovering a pin lights up its country
     ------------------------------------------------------------------ */
  function initMap() {
    var pins = document.querySelectorAll(".cmap__pin");
    if (!pins.length) return;

    pins.forEach(function (pin) {
      var slug = (pin.getAttribute("href") || "").replace("#p-", "");
      var country = document.querySelector('.cmap__country[data-for="' + slug + '"]');
      if (!country) return;

      function on() { country.classList.add("is-active"); }
      function off() { country.classList.remove("is-active"); }

      pin.addEventListener("mouseenter", on);
      pin.addEventListener("mouseleave", off);
      pin.addEventListener("focus", on);
      pin.addEventListener("blur", off);
    });
  }

  function init() {
    initNav();
    initLangSwitch();
    initStickyHeader();
    initReveal();
    initCounters();
    initNewsAccordion();
    initMap();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
