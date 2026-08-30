/* ==========================================================================
   A gentle table-tennis rally, in the same 3-D language as the site's hero.
   It is a rally, not a match: the opponent is cooperative and there is no
   score to lose — only how long the two of you can keep the ball going.
   ========================================================================== */
(function () {
  "use strict";

  var stage   = document.getElementById("stage");
  var overlay = document.getElementById("overlay");
  var startBtn= document.getElementById("start");
  var hudRally= document.getElementById("hud-rally");
  var hudBest = document.getElementById("hud-best");
  if (!stage) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  import("/assets/js/vendor/three.module.min.js").then(function (THREE) {
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch (e) {
      return;                       /* no WebGL: the fallback copy stays */
    }

    /* --- table geometry, in metres (regulation) ------------------------- */
    var TL = 2.74, TW = 1.525, TH = 0.76;
    var HZ = TL / 2, HX = TW / 2;
    var NET_H = 0.1525;
    var R = 0.035;                  /* ball: larger than life, to stay visible */
    var PZ = 1.34, AZ = -1.34;      /* the two paddle planes */
    var G  = 3.2;                   /* softened gravity — real 9.81 plays far too fast */
    var REACH = 0.30;               /* forgiving: this is a waiting room, not a test */
    var REST = TH + R;              /* ball height when it is sitting on the table */
    var NET_CLEAR = TH + NET_H + R + 0.07;   /* net, plus a margin worth clearing by */

    var w = stage.clientWidth, h = stage.clientHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, w < 500 ? 1.5 : 2));
    renderer.setSize(w, h, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    stage.appendChild(renderer.domElement);
    stage.classList.add("is-3d");

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(31, w / h, 0.1, 40);
    camera.position.set(0, 3.30, 3.75);
    camera.lookAt(0, 0.86, -0.15);

    function mat(color, rough, metal) {
      return new THREE.MeshStandardMaterial({
        color: color, roughness: rough === undefined ? 0.7 : rough,
        metalness: metal === undefined ? 0.05 : metal
      });
    }

    /* --- lights: same rig as the hero, so the two scenes are siblings --- */
    scene.add(new THREE.HemisphereLight(0xf2f8fc, 0xbcd6e8, 1.15));
    var key = new THREE.DirectionalLight(0xffffff, 1.45);
    key.position.set(1.3, 6.6, 1.8);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -3.8; key.shadow.camera.right = 3.8;
    key.shadow.camera.top = 3.8;   key.shadow.camera.bottom = -3.8;
    key.shadow.camera.near = 1;    key.shadow.camera.far = 14;
    key.shadow.bias = -0.0012;
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xcfe3f3, 0.5);
    fill.position.set(-3.4, 2.2, -2.6);
    scene.add(fill);

    /* Shadow-only ground, so the table floats on the panel's own gradient. */
    var floor = new THREE.Mesh(
      new THREE.CircleGeometry(4.6, 64),
      new THREE.ShadowMaterial({ opacity: 0.11 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    /* --- table ---------------------------------------------------------- */
    var top = new THREE.Mesh(new THREE.BoxGeometry(TW, 0.03, TL), mat(0x12409b, 0.55));
    top.position.y = TH;
    top.castShadow = true; top.receiveShadow = true;
    scene.add(top);

    function line(lw, ll, x, z) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(lw, 0.004, ll), mat(0xffffff, 0.45));
      m.position.set(x, TH + 0.016, z);
      scene.add(m);
    }
    line(TW, 0.02, 0, -HZ + 0.01);   /* end lines */
    line(TW, 0.02, 0,  HZ - 0.01);
    line(0.02, TL, -HX + 0.01, 0);   /* side lines */
    line(0.02, TL,  HX - 0.01, 0);
    line(0.014, TL, 0, 0);           /* centre line */

    /* legs */
    [[-HX + 0.16, -HZ + 0.28], [HX - 0.16, -HZ + 0.28],
     [-HX + 0.16,  HZ - 0.28], [HX - 0.16,  HZ - 0.28]].forEach(function (p) {
      var leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, TH, 0.05), mat(0x0a2450, 0.7));
      leg.position.set(p[0], TH / 2, p[1]);
      leg.castShadow = true;
      scene.add(leg);
    });

    /* net */
    var net = new THREE.Mesh(
      new THREE.BoxGeometry(TW + 0.15, NET_H, 0.008),
      new THREE.MeshStandardMaterial({ color: 0xe4eff7, roughness: 0.9, transparent: true, opacity: 0.72 })
    );
    net.position.set(0, TH + NET_H / 2 + 0.015, 0);
    net.castShadow = true;
    scene.add(net);
    var band = new THREE.Mesh(new THREE.BoxGeometry(TW + 0.15, 0.018, 0.011), mat(0xffffff, 0.6));
    band.position.set(0, TH + NET_H + 0.02, 0);
    scene.add(band);

    /* --- bats ------------------------------------------------------------ */
    function makeBat(bladeColor) {
      var g = new THREE.Group();
      var blade = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.012, 24), mat(bladeColor, 0.6));
      blade.rotation.x = Math.PI / 2;      /* face the ball, not the ceiling */
      blade.castShadow = true;
      g.add(blade);
      var handle = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.016, 0.095, 12), mat(0x9a6a45, 0.85));
      handle.position.y = -0.115;
      handle.castShadow = true;
      g.add(handle);
      return g;
    }
    var pBat = makeBat(0xd2694a);           /* the visitor's bat: the coral accent */
    pBat.position.set(0, TH + 0.17, PZ);
    scene.add(pBat);
    var aBat = makeBat(0x0a2450);           /* the opponent's: navy */
    aBat.position.set(0, TH + 0.17, AZ);
    scene.add(aBat);

    /* --- ball ------------------------------------------------------------ */
    var ball = new THREE.Mesh(
      new THREE.SphereGeometry(R, 20, 16),
      new THREE.MeshStandardMaterial({ color: 0xff8a4c, roughness: 0.42, emissive: 0x4a1a06 })
    );
    ball.castShadow = true;
    scene.add(ball);

    /* --- state ------------------------------------------------------------ */
    var pos = new THREE.Vector3(), vel = new THREE.Vector3();
    var rally = 0, best = 0;
    var dead = 0;                 /* seconds left of the "rally over" pause */
    var running = false;
    var pointerX = 0;             /* -1 .. 1 across the stage */
    var aiX = 0, aiWobble = 0;

    /* Every shot's lift is SOLVED from where we want the ball to land, not
       guessed. Guessing is what makes a toy like this feel broken: one clipped
       net in ten and the rally is over for reasons the player can't see. This
       way a shot clears the net and drops on the far half at any speed. */
    function liftFor(y0, speed, landDz, netDz) {
      var tLand = landDz / speed;
      var vLand = (REST - y0 + (G / 2) * tLand * tLand) / tLand;
      var tNet  = netDz / speed;
      var vNet  = (NET_CLEAR - y0 + (G / 2) * tNet * tNet) / tNet;
      return Math.max(vLand, vNet);
    }

    function serve() {
      pos.set((Math.random() - 0.5) * 0.7, TH + 0.30, AZ + 0.04);
      var speed = 2.5;
      var landDz = Math.abs(pos.z) + 0.55;
      var aimX = (Math.random() - 0.5) * 0.8;
      vel.set((aimX - pos.x) / (landDz / speed),
              liftFor(pos.y, speed, landDz, Math.abs(pos.z)),
              speed);
      rally = 0;
      hudRally.textContent = "0";
      dead = 0;
    }

    function endRally() {
      if (dead > 0) return;
      dead = 1.3;
      if (rally > best) { best = rally; hudBest.textContent = String(best); }
    }

    /* Returns the ball, angled by where on the bat it landed. Speed creeps up
       with the rally so a long one gets gently harder. */
    function ret(batX, towardPlayer) {
      var off = THREE.MathUtils.clamp((pos.x - batX) / REACH, -1, 1);
      var speed = Math.min(2.4 + rally * 0.035, 3.2);
      var landZ = towardPlayer ? 0.6 : -0.6;
      var landDz = Math.abs(pos.z - landZ);
      /* Where on the bat the ball landed decides where it is PLACED, and the
         sideways speed is solved from that. Setting vel.x directly instead let
         a return drift a metre wide over its flight and sail off the table. */
      var aimX = off * HX * 0.62;
      vel.z = towardPlayer ? speed : -speed;
      vel.x = (aimX - pos.x) / (landDz / speed);
      vel.y = liftFor(pos.y, speed, landDz, Math.abs(pos.z));
      /* Nudge the ball clear of the bat so it cannot re-trigger next frame. */
      pos.z += towardPlayer ? 0.02 : -0.02;
    }

    var clock = new THREE.Clock();

    function step(dt) {
      if (dead > 0) {
        dead -= dt;
        if (dead <= 0) { serve(); return; }
      }

      var prevX = pos.x, prevY = pos.y, prevZ = pos.z;
      vel.y -= G * dt;
      pos.addScaledVector(vel, dt);

      /* bounce on the table top */
      if (pos.y - R <= TH && vel.y < 0 &&
          Math.abs(pos.x) <= HX && Math.abs(pos.z) <= HZ) {
        pos.y = TH + R;
        vel.y = -vel.y * 0.78;
      }

      /* Each crossing below is interpolated back to the exact plane instead of
         being tested on the post-step position. A ball at 3 m/s covers 10 cm in
         a 30 fps frame — enough to step straight through the net, or past the
         bat, which reads to a player as "it just didn't hit it". */
      var f;

      /* the net */
      if (dead <= 0 && ((prevZ < 0 && pos.z >= 0) || (prevZ > 0 && pos.z <= 0))) {
        f = (0 - prevZ) / (pos.z - prevZ);
        if (prevY + (pos.y - prevY) * f < TH + NET_H + R) {
          vel.z *= -0.12; vel.x *= 0.2; endRally();
        }
      }

      /* the visitor's bat */
      if (dead <= 0 && prevZ < PZ && pos.z >= PZ) {
        f = (PZ - prevZ) / (pos.z - prevZ);
        var xh = prevX + (pos.x - prevX) * f, yh = prevY + (pos.y - prevY) * f;
        if (Math.abs(xh - pBat.position.x) < REACH && yh > TH - 0.1) {
          pos.set(xh, yh, PZ);
          ret(pBat.position.x, false);
          rally++;
          hudRally.textContent = String(rally);
        }
      }
      /* the opponent's bat — cooperative: it reaches unless the ball is wild */
      if (dead <= 0 && prevZ > AZ && pos.z <= AZ) {
        f = (AZ - prevZ) / (pos.z - prevZ);
        var xa = prevX + (pos.x - prevX) * f, ya = prevY + (pos.y - prevY) * f;
        if (Math.abs(xa - aBat.position.x) < REACH + 0.06 && ya > TH - 0.1) {
          pos.set(xa, ya, AZ);
          ret(aBat.position.x, true);
        }
      }

      /* out of play */
      if (pos.z > PZ + 0.5 || pos.z < AZ - 0.5 || pos.y < -0.6 ||
          Math.abs(pos.x) > HX + 0.9) {
        endRally();
      }
      if (pos.y < -1.4) { dead = Math.min(dead, 0.35); }

      /* --- bats follow ---------------------------------------------------- */
      var want = pointerX * (HX + 0.12);
      /* A little assist as the ball arrives: the bat leans the last few
         centimetres so a generous REACH still *looks* like a real contact. */
      if (vel.z > 0 && pos.z > 0 && Math.abs(pos.x - want) < REACH) {
        want += (pos.x - want) * 0.55;
      }
      pBat.position.x += (want - pBat.position.x) * Math.min(1, dt * 14);

      aiWobble += dt;
      var target = (vel.z < 0 ? pos.x : 0) + Math.sin(aiWobble * 1.7) * 0.05;
      aiX += (target - aiX) * Math.min(1, dt * 5.5);
      aBat.position.x = THREE.MathUtils.clamp(aiX, -HX - 0.1, HX + 0.1);

      /* Tilt each bat into its swing, so the contact reads as a stroke. */
      pBat.rotation.z = THREE.MathUtils.clamp((pBat.position.x - pos.x) * 0.7, -0.5, 0.5);
      aBat.rotation.z = THREE.MathUtils.clamp((aBat.position.x - pos.x) * 0.7, -0.5, 0.5);

      ball.position.copy(pos);
    }

    /* --- input ------------------------------------------------------------ */
    function movedTo(clientX) {
      var r = stage.getBoundingClientRect();
      pointerX = THREE.MathUtils.clamp(((clientX - r.left) / r.width) * 2 - 1, -1, 1);
    }
    stage.addEventListener("pointermove", function (e) { movedTo(e.clientX); });
    stage.addEventListener("pointerdown", function (e) { movedTo(e.clientX); });
    /* Keyboard, so the game is not mouse-only. */
    stage.tabIndex = 0;
    stage.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft")  { pointerX = Math.max(-1, pointerX - 0.16); e.preventDefault(); }
      if (e.key === "ArrowRight") { pointerX = Math.min( 1, pointerX + 0.16); e.preventDefault(); }
    });

    /* --- loop -------------------------------------------------------------- */
    var raf = 0;
    function frame() {
      raf = requestAnimationFrame(frame);
      var dt = Math.min(clock.getDelta(), 0.05);   /* clamp: a backgrounded tab
                                                      must not teleport the ball */
      if (running) step(dt);
      renderer.render(scene, camera);
    }

    function play()  { if (!running) { running = true; clock.getDelta(); } overlay.hidden = true; }
    function pause() { running = false; }

    /* Only run while the panel is actually on screen. */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { if (!raf) { clock.getDelta(); frame(); } }
        else if (raf) { cancelAnimationFrame(raf); raf = 0; }
      });
    }, { rootMargin: "200px" });
    io.observe(stage);

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { clock.getDelta(); }
    });

    window.addEventListener("resize", function () {
      var nw = stage.clientWidth, nh = stage.clientHeight;
      if (!nw || !nh) return;
      renderer.setSize(nw, nh, false);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
    });

    startBtn.addEventListener("click", play);

    serve();
    ball.position.copy(pos);
    if (reduced) {
      /* Someone who asked for less motion gets a still table and a choice. */
      overlay.hidden = false;
      if (!raf) frame();
    } else {
      play();
    }
  }).catch(function () { /* module failed to load: the fallback copy stays */ });
})();
