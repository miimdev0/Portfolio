/* محمد صحرانورد — وب‌سایت انیمیشنی سوپر خفن (JavaScript خالص، بدون کتابخانه) */
(() => {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  // Convert western digits to Persian digits
  const FA = "۰۱۲۳۴۵۶۷۸۹";
  const toFa = (v) => String(v).replace(/[0-9]/g, (d) => FA[d]);

  /* ---------- Clock (Tehran) + Persian date ---------- */
  const clock = $("#clock");
  const tick = () => {
    const t = new Date().toLocaleTimeString("fa-IR", {
      timeZone: "Asia/Tehran",
      hour: "2-digit",
      minute: "2-digit",
    });
    clock.textContent = `تهران ${t}`;
  };
  tick();
  setInterval(tick, 20000);

  try {
    const dateFa = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      dateStyle: "long",
      timeZone: "Asia/Tehran",
    }).format(new Date());
    $("#todayFa").textContent = dateFa;
    const yearFa = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric", timeZone: "Asia/Tehran" })
      .format(new Date());
    $("#year").textContent = yearFa;
  } catch (e) {
    $("#todayFa").textContent = "";
  }

  /* ---------- Circular text (word-based so Persian stays connected) ---------- */
  const circleTexts = $$("[data-circle-text]");
  function buildCircleTexts() {
    circleTexts.forEach((el) => {
      const words = el.dataset.circleText.trim().split(/\s+/);
      const n = words.length;
      const parent = el.parentElement;
      const size = Math.min(parent.clientWidth, parent.clientHeight) || 160;
      el.style.setProperty("--ct-r", `${size * 0.42}px`);
      if (el.childElementCount !== n) {
        el.innerHTML = "";
        words.forEach((w) => {
          const s = document.createElement("span");
          s.textContent = w;
          el.appendChild(s);
        });
      }
      Array.from(el.children).forEach((s, i) => {
        s.style.setProperty("--a", `${(360 / n) * i}deg`);
      });
    });
  }
  buildCircleTexts();

  /* ---------- Media fallback: if an image is missing, show the designed gradient ---------- */
  $$(".media img").forEach((img) => {
    const wrap = img.closest(".media");
    const mark = () => wrap && wrap.classList.add("is-empty");
    if (img.complete && img.naturalWidth === 0) mark();
    img.addEventListener("error", mark);
  });

  /* ---------- Loader ---------- */
  const loader = $("#loader");
  const loaderNum = $("#loaderNum");
  const loaderBar = $("#loaderBar");
  const startSite = () => {
    document.body.classList.add("is-loaded");
    document.body.classList.remove("is-loading");
  };

  if (reduce) {
    loader.remove();
    startSite();
  } else {
    const dur = 1900;
    const t0 = performance.now();
    const step = (now) => {
      const p = clamp((now - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - p, 3);
      loaderNum.textContent = toFa(Math.round(e * 100));
      loaderBar.style.width = `${e * 100}%`;
      if (p < 1) requestAnimationFrame(step);
      else {
        loader.classList.add("done");
        startSite();
        setTimeout(() => loader.remove(), 1200);
      }
    };
    requestAnimationFrame(step);
  }

  /* ---------- Custom cursor ---------- */
  const cursor = $(".cursor");
  const dot = $(".cursor-dot");
  const ring = $(".cursor-ring");
  const cursorLabel = $("#cursorLabel");
  if (fine && !reduce) {
    let mx = innerWidth / 2;
    let my = innerHeight / 2;
    let rx = mx;
    let ry = my;
    window.addEventListener("pointermove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;

      const t = e.target;
      const hoverEl = t.closest("a, button, [data-hover], [data-cursor], .card, .gcard, .prow, .ring-card");
      cursor.classList.toggle("is-hover", !!hoverEl);
      cursorLabel.textContent = (hoverEl && hoverEl.dataset.cursor) || (hoverEl && hoverEl.matches(".card, .gcard, .prow") ? "مشاهده" : "");
      const dark = !!t.closest(".contact, .ring3d-sec, .footer, .mobile-menu") || !!(t.closest(".prow") && t.closest(".prow").matches(":hover"));
      cursor.classList.toggle("is-dark", dark);
    });
    (function loop() {
      rx = lerp(rx, mx, 0.18);
      ry = lerp(ry, my, 0.18);
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(loop);
    })();
    window.addEventListener("pointerdown", () => cursor.classList.add("is-down"));
    window.addEventListener("pointerup", () => cursor.classList.remove("is-down"));
    document.addEventListener("mouseout", (e) => {
      if (!e.relatedTarget) cursor.style.opacity = "0";
    });
    document.addEventListener("mouseover", () => (cursor.style.opacity = "1"));
  } else {
    cursor.style.display = "none";
  }

  /* ---------- Magnetic elements ---------- */
  if (fine && !reduce) {
    $$("[data-magnetic]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
      });
      el.addEventListener("pointerleave", () => (el.style.transform = ""));
    });
  }

  /* ---------- 3D tilt on bento cards and hero blob ---------- */
  if (fine && !reduce) {
    $$(".card, #heroBlob").forEach((card) => {
      const strength = Number(card.dataset.tiltStrength) || 6;
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--rx", `${((0.5 - y) * strength).toFixed(2)}deg`);
        card.style.setProperty("--ry", `${((x - 0.5) * strength).toFixed(2)}deg`);
      });
      card.addEventListener("pointerleave", () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
      });
    });
  }

  /* ---------- Hero image switcher (thumbs + globe) ---------- */
  const heroBlob = $("#heroBlob");
  const heroImg = $("#heroImg");
  const thumbs = $$(".thumb");
  const setHero = (src) => {
    if (heroImg.getAttribute("src") === src) return;
    heroBlob.classList.remove("swap");
    void heroBlob.offsetWidth;
    heroBlob.classList.add("swap");
    heroImg.src = src;
  };
  thumbs.forEach((t) =>
    t.addEventListener("click", () => {
      thumbs.forEach((x) => x.classList.toggle("is-active", x === t));
      setHero(t.dataset.src);
    })
  );

  /* ---------- Count-up numbers ---------- */
  const counters = $$("[data-count]");
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    const prefix = el.dataset.prefix || "";
    const dur = 1800;
    const t0 = performance.now();
    const step = (now) => {
      const p = clamp((now - t0) / dur, 0, 1);
      const v = Math.round((1 - Math.pow(1 - p, 4)) * target);
      el.textContent = prefix + toFa(v);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (!reduce) counters.forEach((el) => (el.textContent = (el.dataset.prefix || "") + toFa(0)));

  /* ---------- Scroll reveal ---------- */
  const revealEls = $$(".reveal-up, [data-count]");
  // stagger siblings inside the same grid/container
  revealEls.forEach((el) => {
    const sibs = Array.from(el.parentElement.children).filter((c) => c.matches(".reveal-up, [data-count]"));
    el.style.setProperty("--d", `${Math.max(0, sibs.indexOf(el)) * 90}ms`);
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add("is-in");
        if (el.hasAttribute("data-count")) countUp(el);
        io.unobserve(el);
      });
    },
    { threshold: 0.2 }
  );

  if (reduce) {
    revealEls.forEach((el) => el.classList.add("is-in"));
    counters.forEach((el) => (el.textContent = (el.dataset.prefix || "") + toFa(el.dataset.count)));
  } else {
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Word highlight for the about paragraph ---------- */
  const HL_WORDS = ["تصویر", "حرکت", "معنایی", "زنده"];
  const aboutEl = $("#aboutText");
  const aboutWords = aboutEl
    ? (() => {
        const words = aboutEl.textContent.trim().split(/\s+/);
        aboutEl.innerHTML = words
          .map((w) => {
            const hl = HL_WORDS.some((k) => w.includes(k)) ? " hl-word" : "";
            return `<span class="w${hl}">${w}</span>`;
          })
          .join(" ");
        return $$(".w", aboutEl);
      })()
    : [];

  /* ---------- Project list: hover preview follows cursor ---------- */
  const pfloat = $("#pfloat");
  const pfloatImg = $("#pfloatImg");
  const rows = $$(".prow");
  if (fine && !reduce && pfloat) {
    let px = 0;
    let py = 0;
    let fx = 0;
    let fy = 0;
    window.addEventListener("pointermove", (e) => {
      px = e.clientX;
      py = e.clientY;
    });
    rows.forEach((row) => {
      row.addEventListener("pointerenter", () => {
        const src = row.dataset.img;
        if (pfloatImg.getAttribute("src") !== src) pfloatImg.src = src;
        pfloat.classList.add("is-on");
      });
      row.addEventListener("pointerleave", () => {
        pfloat.classList.remove("is-on");
      });
    });
    (function loop() {
      fx = lerp(fx, px + 28, 0.14);
      fy = lerp(fy, py - pfloat.offsetHeight / 2, 0.14);
      pfloat.style.transform = `translate(${fx}px, ${fy}px)`;
      requestAnimationFrame(loop);
    })();
  }

  /* ============================================================
     3D ROTATING RING GALLERY — دایره‌ی چرخان سه‌بعدی
     ============================================================ */
  const ringStage = $("#ringStage");
  const ringEl = $("#ring3d");
  const ringCards = $$(".ring-card");
  const ringCur = $("#ringCur");
  const ringPrev = $("#ringPrev");
  const ringNext = $("#ringNext");
  const N = ringCards.length || 1;
  const STEP = 360 / N;
  const AUTO_SPEED = 7; // deg per second
  let spin = 0;
  let vel = reduce ? 0 : AUTO_SPEED;
  let snapping = false;
  let snapTo = 0;
  let dragging = false;
  let dragMoved = 0;
  let lastX = 0;
  let lastT = 0;

  // index each card on the circle + block native image dragging
  ringCards.forEach((c, i) => {
    c.style.setProperty("--i", i);
    const img = c.querySelector("img");
    if (img) {
      img.setAttribute("draggable", "false");
      img.addEventListener("dragstart", (e) => e.preventDefault());
    }
  });

  function sizeRing() {
    if (!ringStage || !ringEl) return;
    const w = ringStage.clientWidth;
    const h = ringStage.clientHeight;
    const cardW = clamp(Math.min(w / 4.3, h / 2.4, 235), 104, 235);
    const cardH = cardW * 1.32;
    const radius = clamp(Math.min(w * 0.37, cardW * 2.2), 130, 450);
    ringEl.style.setProperty("--card-w", `${cardW}px`);
    ringEl.style.setProperty("--card-h", `${cardH}px`);
    ringEl.style.setProperty("--ring-r", `${radius}px`);
  }
  sizeRing();

  function applyRing() {
    ringEl.style.setProperty("--spin", `${spin}deg`);
    // per-card facing → brightness + front class
    let best = -2;
    let bestI = 0;
    ringCards.forEach((card, i) => {
      const theta = ((i * STEP + spin) * Math.PI) / 180;
      const face = Math.cos(theta); // 1 = facing camera
      card.style.setProperty("--face", face.toFixed(3));
      if (face > best) {
        best = face;
        bestI = i;
      }
    });
    ringCards.forEach((c, i) => c.classList.toggle("is-front", i === bestI));
    if (ringCur) ringCur.textContent = toFa(String(bestI + 1).padStart(2, "0"));
  }
  applyRing();

  function ringFrame(now) {
    const dt = Math.min(0.05, (now - (ringFrame.last || now)) / 1000);
    ringFrame.last = now;

    if (snapping) {
      const diff = snapTo - spin;
      spin += diff * Math.min(1, dt * 7);
      if (Math.abs(diff) < 0.2) {
        spin = snapTo;
        snapping = false;
        vel = reduce ? 0 : AUTO_SPEED;
      }
    } else if (!dragging) {
      // momentum decays back to the gentle auto-rotation
      vel += ((reduce ? 0 : AUTO_SPEED) - vel) * Math.min(1, dt * 1.6);
      spin += vel * dt;
    }
    applyRing();
    requestAnimationFrame(ringFrame);
  }
  requestAnimationFrame(ringFrame);

  // drag to spin (mouse + touch)
  if (ringStage) {
    ringStage.addEventListener("pointerdown", (e) => {
      dragging = true;
      snapping = false;
      dragMoved = 0;
      lastX = e.clientX;
      lastT = performance.now();
      ringStage.setPointerCapture(e.pointerId);
    });
    ringStage.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const now = performance.now();
      const dt = Math.max(8, now - lastT);
      lastX = e.clientX;
      lastT = now;
      dragMoved += Math.abs(dx);
      spin += dx * 0.26;
      vel = (dx * 0.26 * 1000) / dt; // deg/s
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      vel = clamp(vel, -90, 90);
    };
    ringStage.addEventListener("pointerup", endDrag);
    ringStage.addEventListener("pointercancel", endDrag);

    // click a card → lightbox (suppressed after a real drag)
    ringCards.forEach((card, i) => {
      card.addEventListener("click", () => {
        if (dragMoved > 8) return;
        openLb(i);
      });
    });
  }

  function stepRing(dir) {
    snapping = true;
    dragging = false;
    snapTo = Math.round(spin / STEP) * STEP + dir * STEP;
    vel = 0;
  }
  if (ringPrev) ringPrev.addEventListener("click", () => stepRing(1));
  if (ringNext) ringNext.addEventListener("click", () => stepRing(-1));

  /* ---------- Nav: hide/show, scrolled state, dark sections, active link, progress ---------- */
  const nav = $("#nav");
  const navLinks = $$(".nav-links a");
  const sectionIds = navLinks.map((a) => a.getAttribute("href").slice(1));
  const scrollBar = $("#scrollBar");
  let lastY = scrollY;

  function updateNav() {
    const y = scrollY;
    nav.classList.toggle("scrolled", y > 40);
    const dy = y - lastY;
    if (y > 320 && dy > 6 && !document.body.classList.contains("menu-open")) nav.classList.add("hide");
    else if (dy < -6) nav.classList.remove("hide");
    lastY = y;

    // scroll progress
    const max = document.documentElement.scrollHeight - innerHeight;
    if (scrollBar) scrollBar.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;

    // Dark background under the nav?
    const under = document.elementFromPoint(innerWidth / 2, 30);
    nav.classList.toggle("on-dark", !!(under && under.closest(".contact, .ring3d-sec, .footer, .marquee")));

    // Hero parallax for the outlined background word
    const hero = $(".hero");
    if (hero && !reduce) hero.style.setProperty("--hero-shift", `${y * 0.25}px`);
    const heroBg = $(".hero-bg-word");
    if (heroBg && !reduce) heroBg.style.transform = `translateY(${y * 0.2}px)`;

    if (aboutWords.length && !reduce) {
      const r = $("#about").getBoundingClientRect();
      const vh = innerHeight;
      const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.4), 0, 1);
      const n = aboutWords.length;
      aboutWords.forEach((w, i) => w.classList.toggle("lit", p >= i / n));
    }
  }

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateNav();
        ticking = false;
      });
    },
    { passive: true }
  );
  window.addEventListener("resize", () => {
    sizeRing();
    buildCircleTexts();
    updateNav();
  });

  // Active section in nav
  const secIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${en.target.id}`));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sectionIds.forEach((id) => {
    const s = document.getElementById(id);
    if (s) secIO.observe(s);
  });

  updateNav();

  /* ---------- Mobile menu (fullscreen, staggered) ---------- */
  const burger = $("#burger");
  const mobileMenu = $("#mobileMenu");
  // hover-fill effect uses data-text
  $$(".mm-links a span").forEach((s) => (s.dataset.text = s.textContent));

  const setMenu = (open) => {
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    mobileMenu.setAttribute("aria-hidden", String(!open));
    if (open) nav.classList.remove("hide");
  };
  burger.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  $$(".mobile-menu a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("menu-open")) setMenu(false);
  });
  // close automatically if resized to desktop
  window.addEventListener("resize", () => {
    if (innerWidth > 1100 && document.body.classList.contains("menu-open")) setMenu(false);
  });

  /* ---------- Lightbox ---------- */
  const lightbox = $("#lightbox");
  const lbImg = $("#lbImg");
  const lbCap = $("#lbCap");
  const lbItems = ringCards.map((c) => ({
    src: c.querySelector("img").getAttribute("src"),
    cap: c.querySelector("figcaption").textContent.trim(),
  }));
  let lbIndex = 0;

  function showLb(i) {
    if (!lbItems.length) return;
    lbIndex = (i + lbItems.length) % lbItems.length;
    const item = lbItems[lbIndex];
    lbImg.src = item.src;
    lbCap.textContent = item.cap;
  }
  function openLb(i) {
    showLb(i);
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lb-open");
  }
  function closeLb() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lb-open");
  }

  $$("[data-open-gallery]").forEach((btn) =>
    btn.addEventListener("click", () => openLb(Number(btn.dataset.openGallery) || 0))
  );
  $("#lbClose").addEventListener("click", closeLb);
  $("#lbPrev").addEventListener("click", () => showLb(lbIndex - 1));
  $("#lbNext").addEventListener("click", () => showLb(lbIndex + 1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target.classList.contains("lb-fig")) closeLb();
  });
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") showLb(lbIndex + 1); // RTL: left arrow = next
    if (e.key === "ArrowRight") showLb(lbIndex - 1);
  });
})();
