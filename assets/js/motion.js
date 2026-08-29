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

    /* Consortium map: countries wash in, then the pins drop */
    if (document.querySelector(".cmap")) {
      gsap.from(".cmap__country", {
        opacity: 0,
        duration: 0.6,
        ease: "power1.out",
        stagger: 0.06,
        scrollTrigger: { trigger: ".cmap", start: "top 78%", once: true }
      });
      gsap.from(".cmap__pin", {
        opacity: 0,
        y: -14,
        duration: 0.5,
        ease: "back.out(2)",
        stagger: 0.07,
        delay: 0.35,
        scrollTrigger: { trigger: ".cmap", start: "top 78%", once: true }
      });
    }

    /* The hero rally settles into place on first paint */
    var rally = document.querySelector(".rally");
    if (rally) {
      gsap.from(rally, { scale: 0.93, opacity: 0, duration: 1.1, ease: "power2.out", delay: 0.15 });
    }
  }

  /* ------------------------------------------------------------------
     Three.js: the hero rally in 3D.
     A regulation-size table, two figures, and a ball that bounces once
     on each side of the net. Falls back to the SVG if this cannot run.
     ------------------------------------------------------------------ */
  function initRally3d() {
    var rally = document.querySelector(".rally");
    var host = rally && rally.querySelector(".rally__stage");
    if (!host) return;
    if (navigator.connection && navigator.connection.saveData) return;
    if (!THREE_URL) return;

    import(/* webpackIgnore: true */ THREE_URL).then(function (THREE) {
      /* The stage is display:none until the class below is set, so measure
         the square it sits in rather than the stage itself. */
      var size = rally.clientWidth;
      if (!size) return;

      var renderer;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      } catch (e) {
        return; // no WebGL: the SVG stays
      }
      // Lighter on a phone, where the canvas is small and the battery is not.
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, size < 420 ? 1.5 : 2));
      renderer.setSize(size, size, false);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      host.appendChild(renderer.domElement);
      rally.classList.add("is-3d");

      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);

      var NAVY = 0x0a2450, BLUE = 0x12409b, DEEP = 0x0c2f7a;
      var WHITE = 0xffffff, CORAL = 0xd2694a, SKY = 0xdcebf6;

      function mat(color, rough, metal) {
        return new THREE.MeshStandardMaterial({
          color: color, roughness: rough === undefined ? 0.7 : rough,
          metalness: metal === undefined ? 0.05 : metal
        });
      }

      /* --- lights --------------------------------------------------- */
      scene.add(new THREE.HemisphereLight(0xf2f8fc, 0xbcd6e8, 1.15));
      var key = new THREE.DirectionalLight(0xffffff, 1.5);
      key.position.set(3.4, 6.2, 4.2);
      key.castShadow = true;
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.left = -3.6;
      key.shadow.camera.right = 3.6;
      key.shadow.camera.top = 3.2;
      key.shadow.camera.bottom = -1.2;
      key.shadow.camera.near = 1;
      key.shadow.camera.far = 16;
      key.shadow.bias = -0.0012;
      scene.add(key);
      var fill = new THREE.DirectionalLight(0xcfe3f3, 0.5);
      fill.position.set(-4, 2.5, -3);
      scene.add(fill);

      /* --- floor ---------------------------------------------------- */
      /* Shadow-only ground: the scene sits on the hero's own background with
         soft contact shadows, rather than on a disc with a visible edge. */
      var floor = new THREE.Mesh(
        new THREE.CircleGeometry(4.2, 72),
        new THREE.ShadowMaterial({ opacity: 0.17 })
      );
      floor.rotation.x = -Math.PI / 2;
      floor.receiveShadow = true;
      scene.add(floor);

      /* --- table (regulation 2.74 x 1.525 x 0.76) -------------------- */
      var TL = 2.74, TW = 1.525, TH = 0.76;
      var table = new THREE.Group();

      var top = new THREE.Mesh(new THREE.BoxGeometry(TL, 0.04, TW), mat(BLUE, 0.55));
      top.position.y = TH;
      top.castShadow = true;
      top.receiveShadow = true;
      table.add(top);

      var lineMat = mat(WHITE, 0.6);
      function line(w, d, x, z) {
        var m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.006, d), lineMat);
        m.position.set(x, TH + 0.021, z);
        table.add(m);
      }
      line(TL, 0.02, 0, -TW / 2 + 0.01);   // side lines
      line(TL, 0.02, 0, TW / 2 - 0.01);
      line(0.02, TW, -TL / 2 + 0.01, 0);   // end lines
      line(0.02, TW, TL / 2 - 0.01, 0);
      line(TL, 0.015, 0, 0);               // centre line

      var legMat = mat(DEEP, 0.6);
      [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(function (s) {
        var leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, TH, 0.06), legMat);
        leg.position.set(s[0] * (TL / 2 - 0.18), TH / 2, s[1] * (TW / 2 - 0.14));
        leg.castShadow = true;
        table.add(leg);
      });

      /* net: 1.83 wide, 15.25 high, overhanging each edge */
      var net = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, 0.1525, 1.83),
        new THREE.MeshStandardMaterial({
          color: SKY, roughness: 0.9, transparent: true, opacity: 0.72
        })
      );
      net.position.y = TH + 0.02 + 0.1525 / 2;
      table.add(net);
      var tape = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.015, 1.85), mat(WHITE, 0.7));
      tape.position.y = TH + 0.02 + 0.1525;
      table.add(tape);
      [-1, 1].forEach(function (s) {
        var post = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.19, 12), mat(NAVY, 0.5));
        post.position.set(0, TH + 0.02 + 0.095, s * 0.915);
        post.castShadow = true;
        table.add(post);
      });

      scene.add(table);

      /* --- players --------------------------------------------------- */
      /* A figure in its own space faces +z, so the group only has to be
         turned to face the table. Height is roughly 1.75m, to scale with
         the regulation table beside it. */
      function makePlayer(hand) {
        var g = new THREE.Group();
        var body = mat(NAVY, 0.78);
        var skin = mat(0x3f6fd0, 0.8);

        function part(geo, x, y, z, m, rz) {
          var mesh = new THREE.Mesh(geo, m || body);
          mesh.position.set(x, y, z);
          if (rz) mesh.rotation.z = rz;
          g.add(mesh);
          return mesh;
        }

        // Torso and head only: the figures are busts, ending just above the
        // table, so they cast no shadow on the floor to give that away.
        part(new THREE.CapsuleGeometry(0.135, 0.3, 6, 18), 0, 1.06, 0);
        part(new THREE.SphereGeometry(0.115, 24, 18), 0, 1.44, 0.01, skin);

        // free arm, out to the side for balance
        var free = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.36, 6, 12), body);
        free.position.set(-hand * 0.32, 1.03, -0.05);
        free.rotation.z = -hand * 0.78;
        free.rotation.x = -0.2;
        g.add(free);

        // playing arm, pivoting at the shoulder so it can swing through
        var arm = new THREE.Group();
        /* On the side facing the viewer, so the bat is not hidden behind
           the body, and angled so its face is not edge-on to the camera. */
        arm.position.set(hand * 0.21, 1.22, 0.03);
        arm.rotation.z = -hand * 0.4;
        var upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.4, 6, 12), body);
        upper.position.y = -0.23;
        arm.add(upper);

        // the bat is turned so its face is angled towards the viewer rather
        // than edge-on, the way a player actually holds it
        /* Held the way a bat is actually held: the grip nearest the hand, the
           blade beyond it, so the ball meets the face and not the handle. */
        var bat = new THREE.Group();
        bat.position.y = -0.44;
        bat.rotation.y = hand * 0.95;
        var handle = new THREE.Mesh(new THREE.CylinderGeometry(0.021, 0.018, 0.1, 10), mat(0x9a6a45, 0.85));
        handle.position.y = -0.05;
        bat.add(handle);
        var blade = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.013, 30), mat(CORAL, 0.85));
        blade.position.y = -0.16;
        blade.rotation.x = Math.PI / 2;
        bat.add(blade);
        var rim = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.008, 8, 30), mat(NAVY, 0.6));
        rim.position.y = -0.16;
        bat.add(rim);
        arm.add(bat);
        g.add(arm);

        g.userData.arm = arm;
        g.userData.blade = blade;
        return g;
      }

      var pLeft = makePlayer(-1);
      pLeft.position.set(-(TL / 2 + 0.55), 0, 0);
      pLeft.rotation.y = Math.PI / 2 - 0.5;   // towards the table, turned to the viewer
      scene.add(pLeft);

      var pRight = makePlayer(1);
      pRight.position.set(TL / 2 + 0.55, 0, 0);
      pRight.rotation.y = -Math.PI / 2 + 0.5;
      scene.add(pRight);

      /* --- ball ------------------------------------------------------ */
      /* A regulation ball is 40mm, which is a two-pixel dot at this camera
         distance. Nudged up so the rally is actually readable. */
      var ball = new THREE.Mesh(
        new THREE.SphereGeometry(0.034, 22, 16),
        new THREE.MeshStandardMaterial({ color: 0xff7c3f, roughness: 0.4, emissive: 0x5a2008 })
      );
      ball.castShadow = true;
      scene.add(ball);

      /* --- the rally -------------------------------------------------
         One crossing = hit, bounce on the far half, then the far bat.
         Two parabolas, so it reads as a real exchange rather than a
         ball floating along an arc.

         The contact point is measured from the bat rather than guessed:
         pose both arms at the strike angle, then read where the blade
         actually is. That way the ball always meets the face, whatever
         the arm geometry. ------------------------------------------- */
      var CONTACT = -1.0;   // arm angle at the moment of the strike
      var READY = -0.15;    // arm drawn back, waiting

      pLeft.userData.arm.rotation.x = CONTACT;
      pRight.userData.arm.rotation.x = CONTACT;
      scene.updateMatrixWorld(true);
      var hitL = new THREE.Vector3(), hitR = new THREE.Vector3();
      pLeft.userData.blade.getWorldPosition(hitL);
      pRight.userData.blade.getWorldPosition(hitR);

      var HIT_X = (Math.abs(hitL.x) + Math.abs(hitR.x)) / 2;
      var HIT_Y = (hitL.y + hitR.y) / 2;
      var HIT_Z = (hitL.z + hitR.z) / 2;
      var BOUNCE_Y = TH + 0.02;
      var CROSS = 1.5; // seconds per crossing

      function hop(t, x0, y0, x1, y1, apex) {
        var x = x0 + (x1 - x0) * t;
        var y = y0 + (y1 - y0) * t + apex * 4 * t * (1 - t);
        return [x, y];
      }

      function ballAt(phase, dir) {
        // phase 0..1 across one crossing; dir +1 means left player hits
        var from = -dir * HIT_X, to = dir * HIT_X;
        var bounceX = dir * 0.72;
        var split = 0.62;
        if (phase < split) {
          return hop(phase / split, from, HIT_Y, bounceX, BOUNCE_Y, 0.42);
        }
        return hop((phase - split) / (1 - split), bounceX, BOUNCE_Y, to, HIT_Y, 0.3);
      }

      /* Slow drift, so it reads as a filmed rally rather than a diagram.
         Split out so the very first frame is composed too — otherwise the
         camera sits at the origin until the loop starts, which shows as an
         empty canvas wherever the hero begins below the fold. */
      function placeCamera(t) {
        var a = Math.sin(t * 0.13) * 0.26;
        camera.position.set(Math.sin(a) * 8.5, 2.05 + Math.sin(t * 0.19) * 0.12, Math.cos(a) * 8.5);
        camera.lookAt(0, 1.0, 0);
      }

      var clock = new THREE.Clock();
      var elapsed = 0;

      /* Render only while the hero is on screen, but start a little before it
         arrives: a WebGL buffer is cleared once it has been composited, so a
         paused canvas that scrolls into view would show one blank frame. */
      var running = false;
      var observer = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          if (!running) { running = true; clock.getDelta(); tick(); }
        } else {
          running = false;
        }
      }, { rootMargin: "300px" });
      observer.observe(rally);

      function tick() {
        if (!running) return;
        requestAnimationFrame(tick);
        elapsed += Math.min(clock.getDelta(), 0.05);

        var cycle = elapsed / CROSS;
        var crossing = Math.floor(cycle);
        var phase = cycle - crossing;
        var dir = crossing % 2 === 0 ? 1 : -1;

        var p = ballAt(phase, dir);
        // stays on the line between the two bats, dipping towards the table
        ball.position.set(p[0], p[1], HIT_Z * (1 - 0.55 * Math.sin(phase * Math.PI)));

        // the striker swings through at the start of their crossing,
        // the receiver draws back ready for the next one
        var striker = dir === 1 ? pLeft : pRight;
        var receiver = dir === 1 ? pRight : pLeft;
        /* The striker is at the contact angle at phase 0, when the ball
           leaves the bat, follows through, then recovers. The receiver
           travels back to the contact angle so the bat is there as the
           ball arrives at phase 1. */
        if (phase < 0.22) {
          striker.userData.arm.rotation.x = CONTACT - (phase / 0.22) * 0.5;
        } else {
          var back = (phase - 0.22) / 0.78;
          striker.userData.arm.rotation.x = (CONTACT - 0.5) + back * (READY - CONTACT + 0.5);
        }
        var ease = phase * phase * (3 - 2 * phase);
        receiver.userData.arm.rotation.x = READY + ease * (CONTACT - READY);

        // a small weight shift, since there are no legs to carry it
        striker.position.y = Math.sin(phase * Math.PI) * 0.015;
        receiver.position.y = 0;

        placeCamera(elapsed);
        renderer.render(scene, camera);
      }

      function resize() {
        var s = rally.clientWidth;
        if (!s) return;
        renderer.setSize(s, s, false);
        camera.aspect = 1;
        camera.updateProjectionMatrix();
      }
      window.addEventListener("resize", resize, { passive: true });
      resize();
      placeCamera(0);
      renderer.render(scene, camera);
    }).catch(function () {
      /* SVG stays */
    });
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
    initRally3d();
    initDepth();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
