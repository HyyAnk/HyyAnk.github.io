// Your Surviving Job — site v3 motion. GSAP + ScrollTrigger + Lenis (recipes: MengTo/Skills cinematic-scroll-storytelling).
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = matchMedia("(hover: none)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const loader = $(".loader");
  const hasGsap = window.gsap && window.ScrollTrigger;

  /* ---------- manifesto: wrap words (works without GSAP too) ---------- */
  const man = $("#manifesto");
  const words = [];
  (function wrap(node, hot) {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((t) => {
          if (!t) return;
          if (/^\s+$/.test(t)) return frag.append(t);
          const s = document.createElement("span");
          s.className = "w" + (hot ? " hot" : "");
          s.textContent = t;
          words.push(s);
          frag.append(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) {
        wrap(n, hot || n.classList.contains("hot"));
        if (n.classList.contains("hot")) n.replaceWith(...n.childNodes);
      }
    });
  })(man, false);

  if (!hasGsap || reduce) {
    loader?.remove();
    words.forEach((w) => w.classList.add("on"));
    document.documentElement.classList.add("static-format");
    $$("#format .act").forEach((a) => (a.style.position = "static", a.style.opacity = 1, a.style.marginBottom = "28px"));
    if (!hasGsap) return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
      const t = $(a.getAttribute("href"));
      if (t) { e.preventDefault(); lenis.scrollTo(t, { duration: 1.6 }); }
    }));
  }
  if (reduce) return;

  /* ---------- preloader → hero ---------- */
  const heroImg = $("[data-hero-media] img");
  const ready = Promise.race([
    heroImg && !heroImg.complete ? new Promise((r) => heroImg.addEventListener("load", r, { once: true })) : Promise.resolve(),
    new Promise((r) => setTimeout(r, 4500)),
  ]);
  const ecg = $("#ecg");
  const len = ecg.getTotalLength();
  gsap.set(ecg, { strokeDasharray: len, strokeDashoffset: len });
  gsap.set("[data-hero-title] .mask > span", { yPercent: 110 });
  gsap.set("[data-hero-meta]", { autoAlpha: 0, y: 20 });
  lenis?.stop();
  const day = { v: 0 }, dayEl = $("#loaderDay");
  const intro = gsap.timeline({ defaults: { ease: "power3.out" } })
    .to(ecg, { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut" })
    .to(day, { v: 60, duration: 1.5, ease: "power2.in", onUpdate: () => (dayEl.textContent = String(Math.round(day.v)).padStart(2, "0")) }, 0);
  // safety net: never keep the page behind the loader (slow network, throttled tab)
  setTimeout(() => {
    if (!document.body.contains(loader)) return;
    loader.remove();
    gsap.set("[data-hero-title] .mask > span", { yPercent: 0 });
    gsap.set("[data-hero-meta]", { autoAlpha: 1, y: 0 });
    lenis?.start();
  }, 9000);
  Promise.all([ready, new Promise((r) => intro.eventCallback("onComplete", r))]).then(() => {
    gsap.timeline()
      .to(loader, { yPercent: -100, duration: 1.1, ease: "power4.inOut" })
      .from("[data-hero-media]", { scale: 1.12, duration: 2.2, ease: "power3.out" }, 0.1)
      .to("[data-hero-title] .mask > span", { yPercent: 0, duration: 1.2, ease: "power4.out", stagger: 0.12 }, 0.45)
      .to("[data-hero-meta]", { autoAlpha: 1, y: 0, duration: 1 }, 0.9)
      .add(() => { loader.remove(); lenis?.start(); });
  });

  /* ---------- hero torch ---------- */
  const hero = $("#hero");
  const torch = { x: innerWidth * 0.7, y: innerHeight * 0.55, r: Math.max(190, Math.min(330, innerWidth * 0.21)), f: 1 };
  const paint = () => {
    for (const el of [$("#torch"), $("#torchGlow")]) {
      el.style.setProperty("--x", torch.x + "px");
      el.style.setProperty("--y", torch.y + "px");
      el.style.setProperty("--r", torch.r * torch.f + "px");
    }
  };
  paint();
  // a flame, not a bulb: the circle breathes a little
  let heroOn = true;
  new IntersectionObserver(([e]) => (heroOn = e.isIntersecting)).observe(hero);
  gsap.ticker.add((t) => {
    if (!heroOn) return;
    torch.f = 1 + Math.sin(t * 7.3) * 0.012 + Math.sin(t * 13.1) * 0.01 + (Math.random() - 0.5) * 0.012;
    paint();
  });

  /* ---------- hero embers ---------- */
  const cv = $("#embers"), cx = cv.getContext("2d");
  const dpr = Math.min(2, devicePixelRatio || 1);
  let W = 0, H = 0;
  const size = () => { W = cv.width = hero.clientWidth * dpr; H = cv.height = hero.clientHeight * dpr; };
  size();
  addEventListener("resize", size);
  const spawn = (p = {}) => Object.assign(p, {
    x: Math.random() * W, y: H * (0.55 + Math.random() * 0.5), vy: -(12 + Math.random() * 34) * dpr, vx: (Math.random() - 0.5) * 8 * dpr,
    s: (0.6 + Math.random() * 1.6) * dpr, life: 0, max: 5 + Math.random() * 7, ph: Math.random() * 6.28,
  });
  const embers = Array.from({ length: innerWidth < 700 ? 34 : 70 }, () => { const p = spawn(); p.life = Math.random() * p.max; return p; });
  let last = performance.now();
  (function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (heroOn) {
      cx.clearRect(0, 0, W, H);
      cx.globalCompositeOperation = "lighter";
      for (const p of embers) {
        p.life += dt;
        if (p.life > p.max) spawn(p);
        p.x += (p.vx + Math.sin(p.life * 1.7 + p.ph) * 10 * dpr) * dt;
        p.y += p.vy * dt;
        const a = Math.sin((p.life / p.max) * Math.PI) * (0.55 + 0.45 * Math.sin(p.life * 9 + p.ph));
        cx.fillStyle = `rgba(255, ${120 + (p.ph * 15) | 0}, 50, ${Math.max(0, a) * 0.85})`;
        cx.beginPath();
        cx.arc(p.x, p.y, p.s, 0, 6.283);
        cx.fill();
      }
    }
    requestAnimationFrame(frame);
  })(last);
  const toX = gsap.quickTo(torch, "x", { duration: 0.6, ease: "power3.out", onUpdate: paint });
  const toY = gsap.quickTo(torch, "y", { duration: 0.6, ease: "power3.out", onUpdate: paint });
  let sweep = null;
  if (touch) {
    // phones: the torch searches the dark by itself
    $(".torch-hint").lastChild.textContent = "Watch the dark";
    sweep = gsap.timeline({ repeat: -1, yoyo: true, defaults: { duration: 3.2, ease: "sine.inOut", onUpdate: paint } })
      .to(torch, { x: () => innerWidth * 0.25, y: () => innerHeight * 0.62 })
      .to(torch, { x: () => innerWidth * 0.8, y: () => innerHeight * 0.48 })
      .to(torch, { x: () => innerWidth * 0.55, y: () => innerHeight * 0.7 });
  } else {
    hero.addEventListener("pointermove", (e) => {
      const b = hero.getBoundingClientRect();
      toX(e.clientX - b.left);
      toY(e.clientY - b.top);
    });
  }
  // scrolling down lifts the darkness
  gsap.to(torch, { r: () => Math.max(innerWidth, innerHeight) * 1.3, ease: "none", onUpdate: paint,
    scrollTrigger: { trigger: hero, start: "top top", end: "bottom 30%", scrub: 1 } });
  gsap.to("[data-hero-media]", { yPercent: 10, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero-copy", { yPercent: -30, autoAlpha: 0, ease: "none", scrollTrigger: { trigger: hero, start: "40% top", end: "bottom top", scrub: true } });

  /* ---------- manifesto ---------- */
  ScrollTrigger.create({
    trigger: man, start: "top 78%", end: "bottom 45%", scrub: true,
    onUpdate: (st) => {
      const n = Math.round(st.progress * words.length);
      words.forEach((w, i) => w.classList.toggle("on", i < n));
    },
  });

  /* ---------- section reveals ---------- */
  $$(".eyebrow, .jobs-intro h2, .jobs-intro p, .reel-head h2, .reel-head p, .call h2, .call p, .call .ctas").forEach((el) => {
    if (el.closest(".hero, .loader")) return;
    gsap.from(el, { y: 40, autoAlpha: 0, filter: "blur(8px)", duration: 1.1, ease: "power4.out",
      scrollTrigger: { trigger: el, start: "top 86%", once: true } });
  });

  /* ---------- jobs: pinned horizontal travel (desktop) ---------- */
  const mm = gsap.matchMedia();
  mm.add("(min-width: 861px)", () => {
    const track = $("#jobsTrack");
    const dist = () => track.scrollWidth - innerWidth;
    const travel = gsap.to(track, { x: () => -dist(), ease: "none",
      scrollTrigger: { trigger: "#jobs", start: "top top", end: () => "+=" + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
    $$(".job").forEach((job) => {
      gsap.fromTo($("img", job), { xPercent: -6 }, { xPercent: 6, ease: "none",
        scrollTrigger: { trigger: job, containerAnimation: travel, start: "left right", end: "right left", scrub: true } });
      gsap.from(job, { y: 60, autoAlpha: 0.2, ease: "none",
        scrollTrigger: { trigger: job, containerAnimation: travel, start: "left 98%", end: "left 60%", scrub: true } });
    });
  });

  /* ---------- format: the day counter ---------- */
  const bgs = $$(".format-bg img");
  const acts = $$("#format .act");
  const dayNum = $("#dayNum");
  const rail = $("#rail");
  const fade = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
  ScrollTrigger.create({
    trigger: "#format", start: "top top", end: "+=260%", pin: true, scrub: true, anticipatePin: 1,
    onUpdate: (st) => {
      const p = st.progress;
      dayNum.textContent = String(Math.round(Math.min(1, p / 0.86) * 60)).padStart(2, "0");
      rail.style.transform = `scaleX(${Math.min(1, p / 0.86)})`;
      const b1 = fade(p, 0.4, 0.5), b2 = fade(p, 0.84, 0.92);
      bgs[1].style.opacity = b1;
      bgs[2].style.opacity = b2;
      bgs[0].style.transform = `scale(${1.08 - p * 0.08})`;
      bgs[1].style.transform = `scale(${1.08 - p * 0.06})`;
      const o = [1 - fade(p, 0.38, 0.45), fade(p, 0.45, 0.52) * (1 - fade(p, 0.82, 0.88)), fade(p, 0.88, 0.94)];
      acts.forEach((a, i) => { a.style.opacity = o[i]; a.style.transform = `translateY(${(1 - o[i]) * 24}px)`; });
    },
  });

  /* ---------- reel ---------- */
  const reelFrame = $("#reelFrame");
  const vid = $("video", reelFrame);
  gsap.fromTo(reelFrame, { clipPath: "inset(14% 18% 14% 18% round 6px)" }, { clipPath: "inset(0% 0% 0% 0% round 6px)", ease: "none",
    scrollTrigger: { trigger: reelFrame, start: "top 95%", end: "center 55%", scrub: 1 } });
  gsap.fromTo(vid, { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: reelFrame, start: "top 95%", end: "center 55%", scrub: 1 } });
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { vid.preload = "auto"; vid.play().catch(() => {}); } else vid.pause();
  }, { threshold: 0.15 }).observe(reelFrame);

  /* ---------- stats count up ---------- */
  $$("[data-count]").forEach((b) => {
    const to = +b.dataset.count, o = { v: 0 };
    b.textContent = "0";
    gsap.to(o, { v: to, duration: 1.8, ease: "power3.out", onUpdate: () => (b.textContent = Math.round(o.v)),
      scrollTrigger: { trigger: b, start: "top 88%", once: true } });
  });

  /* ---------- final call + footer ---------- */
  gsap.fromTo("[data-parallax] img", { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: ".call", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.from(".giant span", { yPercent: 60, ease: "none", scrollTrigger: { trigger: "footer", start: "top bottom", end: "bottom bottom", scrub: 1 } });

  addEventListener("load", () => ScrollTrigger.refresh());
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
})();
