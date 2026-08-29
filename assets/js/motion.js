/* ==========================================================================
   SWAN — motion layer
   --------------------------------------------------------------------------
   Everything here is enhancement. If GSAP fails to load, main.js has already
   revealed the content with IntersectionObserver; if Three.js fails or the
   device is small, the hero simply has no depth field. Nothing depends on it.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  // Resolve vendor paths against this script, so the page can live anywhere.
  var self = document.currentScript && document.currentScript.src;
  var THREE_URL =
    window.SWAN_THREE_URL ||
    (self ? self.replace(/motion\.js(\?.*)?$/, "vendor/three.module.min.js") : null);

  /* ------------------------------------------------------------------
     GSAP: reading progress, parallax, and the map drawing itself in.
     Reveals stay in CSS + IntersectionObserver (main.js) — one system.
     ------------------------------------------------------------------ */
  function initGsap() {
    if (!window.gsap || !window.ScrollTrigger) return;
    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    /* Reading progress bar */
    var bar = document.querySelector(".progress");
    if (bar) {
      gsap.to(bar, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 }
      });
    }

    /* Page-hero ornament drifts slower than the page */
    gsap.utils.toArray(".page-hero__decor").forEach(function (el) {
      gsap.to(el, {
        yPercent: 16,
        ease: "none",
        scrollTrigger: { trigger: el.parentNode, start: "top top", end: "bottom top", scrub: 0.6 }
      });
    });

    /* Consortium map: the connector lines draw themselves as it scrolls in */
    var links = gsap.utils.toArray(".cmap__link");
    if (links.length) {
      links.forEach(function (path) {
        var len = path.getTotalLength();
        gsap.set(path, { strokeDasharray: len, strokeDashoffset: len, opacity: 1 });
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: 1.1,
          ease: "power2.out",
          scrollTrigger: { trigger: ".cmap", start: "top 78%", once: true }
        });
      });
    }

    /* The hero rally settles into place on first paint */
    var rally = document.querySelector(".rally");
    if (rally) {
      gsap.from(rally, { scale: 0.93, opacity: 0, duration: 1.1, ease: "power2.out", delay: 0.15 });
    }
  }

  /* ------------------------------------------------------------------
     Three.js: a drifting field of linked nodes behind the hero.
     The rally arc in front is the sport; this is the network it builds.
     Loaded only where it is worth the bytes.
     ------------------------------------------------------------------ */
  function initDepth() {
    var host = document.querySelector(".hero__depth");
    if (!host) return;
    if (window.innerWidth < 900) return; // never ship 350 KB to a phone
    if (navigator.connection && navigator.connection.saveData) return;

    if (!THREE_URL) return;

    import(/* webpackIgnore: true */ THREE_URL)
      .then(function (THREE) {
        var width = host.clientWidth;
        var height = host.clientHeight;
        if (!width || !height) return;

        var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        host.appendChild(renderer.domElement);

        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 100);
        camera.position.z = 16;

        var COUNT = 64;
        var nodes = [];
        var positions = new Float32Array(COUNT * 3);

        for (var i = 0; i < COUNT; i++) {
          nodes.push({
            x: (Math.random() - 0.5) * 34,
            y: (Math.random() - 0.5) * 18,
            z: (Math.random() - 0.5) * 12,
            vx: (Math.random() - 0.5) * 0.008,
            vy: (Math.random() - 0.5) * 0.008
          });
        }

        var dotGeo = new THREE.BufferGeometry();
        dotGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        var dots = new THREE.Points(
          dotGeo,
          new THREE.PointsMaterial({
            color: 0x2c67ce,
            size: 0.22,
            transparent: true,
            opacity: 0.42,
            sizeAttenuation: true
          })
        );
        scene.add(dots);

        var MAX_LINKS = COUNT * 8;
        var linkPositions = new Float32Array(MAX_LINKS * 6);
        var linkGeo = new THREE.BufferGeometry();
        linkGeo.setAttribute("position", new THREE.BufferAttribute(linkPositions, 3));
        var links = new THREE.LineSegments(
          linkGeo,
          new THREE.LineBasicMaterial({ color: 0x22ace3, transparent: true, opacity: 0.16 })
        );
        scene.add(links);

        var pointer = { x: 0, y: 0 };
        window.addEventListener(
          "pointermove",
          function (e) {
            pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
            pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
          },
          { passive: true }
        );

        // Pause the loop when the hero scrolls away; never run two at once.
        var running = false;
        var observer = new IntersectionObserver(function (entries) {
          if (entries[0].isIntersecting) {
            if (!running) {
              running = true;
              tick();
            }
          } else {
            running = false;
          }
        });
        observer.observe(host);

        function tick() {
          if (!running) return;
          requestAnimationFrame(tick);

          var p = 0;
          for (var i = 0; i < COUNT; i++) {
            var n = nodes[i];
            n.x += n.vx;
            n.y += n.vy;
            if (n.x > 17 || n.x < -17) n.vx *= -1;
            if (n.y > 9 || n.y < -9) n.vy *= -1;
            positions[i * 3] = n.x;
            positions[i * 3 + 1] = n.y;
            positions[i * 3 + 2] = n.z;
          }
          dotGeo.attributes.position.needsUpdate = true;

          for (var a = 0; a < COUNT; a++) {
            for (var b = a + 1; b < COUNT; b++) {
              var dx = nodes[a].x - nodes[b].x;
              var dy = nodes[a].y - nodes[b].y;
              var dz = nodes[a].z - nodes[b].z;
              if (dx * dx + dy * dy + dz * dz < 20 && p < MAX_LINKS * 6 - 6) {
                linkPositions[p++] = nodes[a].x;
                linkPositions[p++] = nodes[a].y;
                linkPositions[p++] = nodes[a].z;
                linkPositions[p++] = nodes[b].x;
                linkPositions[p++] = nodes[b].y;
                linkPositions[p++] = nodes[b].z;
              }
            }
          }
          linkGeo.setDrawRange(0, p / 3);
          linkGeo.attributes.position.needsUpdate = true;

          camera.position.x += (pointer.x * 1.6 - camera.position.x) * 0.03;
          camera.position.y += (-pointer.y * 1.0 - camera.position.y) * 0.03;
          camera.lookAt(0, 0, 0);

          renderer.render(scene, camera);
        }

        host.classList.add("is-ready");

        window.addEventListener("resize", function () {
          var w = host.clientWidth;
          var h = host.clientHeight;
          if (!w || !h) return;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        });
      })
      .catch(function () {
        /* No depth field. The hero still reads exactly as designed. */
      });
  }

  function init() {
    initGsap();
    initDepth();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
