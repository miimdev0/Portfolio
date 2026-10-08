/* محمد صحرانورد — وب‌سایت انیمیشنی (JavaScript خالص، بدون کتابخانه) */
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

  /* ---------- Split headings into words (keeps Persian letters joined) ---------- */
  // Hero and contact titles already use .line > .word-in markup.

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
      const hoverEl = t.closest("a, button, [data-hover], [data-cursor], .card, .gcard, .prow");
      cursor.classList.toggle("is-hover", !!hoverEl);
      cursorLabel.textContent = (hoverEl && hoverEl.dataset.cursor) || (hoverEl && hoverEl.matches(".card, .gcard, .prow") ? "مشاهده" : "");
      const dark = !!t.closest(".contact, .hgal, .footer") || !!(t.closest(".prow") && t.closest(".prow").matches(":hover"));
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
  const aboutEl = $("#aboutText");
  const aboutWords = aboutEl
    ? (() => {
        const words = aboutEl.textContent.trim().split(/\s+/);
        aboutEl.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(" ");
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
    let active = false;
    window.addEventListener("pointermove", (e) => {
      px = e.clientX;
      py = e.clientY;
    });
    rows.forEach((row) => {
      row.addEventListener("pointerenter", () => {
        const src = row.dataset.img;
        if (pfloatImg.getAttribute("src") !== src) pfloatImg.src = src;
        active = true;
        pfloat.classList.add("is-on");
      });
      row.addEventListener("pointerleave", () => {
        active = false;
        pfloat.classList.remove("is-on");
      });
    });
    (function loop() {
      fx = lerp(fx, px + 28, 0.14);
      fy = lerp(fy, py - pfloat.offsetHeight / 2, 0.14);
      pfloat.style.transform = `translate(${fx}px, ${fy}px)`;
      requestAnimationFrame(loop);
    })();
    void active;
  }

  /* ---------- Horizontal pinned gallery ---------- */
  const hgal = $("#gallery");
  const hgalTrack = $("#hgalTrack");
  const hgalBar = $("#hgalBar");
  const hgalCur = $("#hgalCur");
  const gcards = $$(".gcard");

  function updateHgal() {
    if (!hgal || reduce) return;
    const rect = hgal.getBoundingClientRect();
    const total = hgal.offsetHeight - innerHeight;
    const p = clamp(-rect.top / total, 0, 1);
    const maxX = Math.max(0, hgalTrack.scrollWidth - innerWidth);
    hgalTrack.style.transform = `translate3d(${-maxX * p}px, 0, 0)`;
    hgalBar.style.width = `${p * 100}%`;
    const idx = clamp(Math.round(p * (gcards.length - 1)), 0, gcards.length - 1);
    hgalCur.textContent = toFa(String(idx + 1).padStart(2, "0"));
  }

  /* ---------- Nav: hide/show, scrolled state, dark sections, active link ---------- */
  const nav = $("#nav");
  const navLinks = $$(".nav-links a");
  const sectionIds = navLinks.map((a) => a.getAttribute("href").slice(1));
  let lastY = scrollY;

  function updateNav() {
    const y = scrollY;
    nav.classList.toggle("scrolled", y > 40);
    const dy = y - lastY;
    if (y > 320 && dy > 6) nav.classList.add("hide");
    else if (dy < -6) nav.classList.remove("hide");
    lastY = y;

    // Dark background under the nav?
    const under = document.elementFromPoint(innerWidth / 2, 30);
    nav.classList.toggle("on-dark", !!(under && under.closest(".contact, .hgal, .footer, .marquee")));

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

    updateHgal();
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
  window.addEventListener("resize", updateNav);

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

  /* ---------- Mobile menu ---------- */
  const burger = $("#burger");
  const mobileMenu = $("#mobileMenu");
  const setMenu = (open) => {
    document.body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", String(open));
    mobileMenu.setAttribute("aria-hidden", String(!open));
  };
  burger.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  $$(".mobile-menu a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* ---------- Lightbox ---------- */
  const lightbox = $("#lightbox");
  const lbImg = $("#lbImg");
  const lbCap = $("#lbCap");
  const lbItems = gcards.map((c) => ({
    src: c.querySelector("img").getAttribute("src"),
    cap: c.querySelector("figcaption").textContent.trim(),
  }));
  let lbIndex = 0;

  function showLb(i) {
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
  gcards.forEach((card, i) => card.addEventListener("click", () => openLb(i)));
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
