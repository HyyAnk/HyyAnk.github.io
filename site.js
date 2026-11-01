// Your Surviving Job — channel site behaviour. Data: data/cases.js (window.SBP_CASES, newest first).
(() => {
  const CASES = window.SBP_CASES || [];
  const SEALED = window.SBP_UPCOMING || [];
  const CHANNEL = 'https://www.youtube.com/@YourSurvivingJob';
  const TRAILERS = ['soldier', 'surgeon', 'bodyguard', 'bus-driver', 'train-conductor', 'police-officer'];
  const GROUPS = [['all', 'All jobs'], ['uniform', 'Uniform'], ['medical', 'Medical'], ['transport', 'Transport'], ['everyday', 'Everyday']];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (s, el = document) => el.querySelector(s);
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const thumb = (c) => `https://i.ytimg.com/vi/${c.yt}/maxresdefault.jpg`;
  const watch = (c) => `https://www.youtube.com/watch?v=${c.yt}`;
  const fileNo = (c) => `FILE No. ${String(c.no).padStart(3, '0')}`;
  const daysLabel = (c) => `DAYS ${c.days.replace('-', '–')}`;
  const verdictColor = { ASSET: '#9cc46f', FUNCTIONAL: '#e0b14f', EXPENDABLE: '#e06a5d' };
  const thumbFallback = (img) => { img.addEventListener('error', () => { if (!img.dataset.fb) { img.dataset.fb = 1; img.src = img.src.replace('maxresdefault', 'hqdefault'); } }, { once: true }); };

  const scoreHTML = (s) => !s ? '' : `
    <div class="score">${['trapped', 'breakout', 'together'].map((k) => `
      <div class="score-row"><span>${k.toUpperCase()}</span><span class="score-bar"><i data-w="${s[k] * 10}%"></i></span><b>${s[k]}</b></div>`).join('')}
    </div>
    <div class="verdict v-${esc(s.label)}"><span>SURVIVAL INDEX ${s.index}/10</span><b>${esc(s.label)}</b></div>`;
  const fillBars = (root) => requestAnimationFrame(() => root.querySelectorAll('.score-bar i').forEach((i) => { i.style.width = i.dataset.w; }));

  /* ---------- nav ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const menuBtn = $('#menuBtn'), links = $('#navLinks');
  menuBtn.addEventListener('click', () => { const o = links.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', o); });
  links.addEventListener('click', (e) => { if (e.target.tagName === 'A') { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); } });

  /* ---------- hero ---------- */
  const blood = $('#blood');
  [0.12, 0.38, 0.55, 0.8].forEach((x, i) => {
    const d = document.createElement('span'); d.className = 'drip';
    d.style.left = `${x * 100}%`; d.style.animationDelay = `${i * 0.9}s`; blood.appendChild(d);
  });
  const totalRules = CASES.reduce((a, c) => a + c.rules.length, 0);
  const counts = { files: CASES.length, rules: totalRules };
  document.querySelectorAll('[data-count]').forEach((el) => {
    const to = counts[el.dataset.count]; if (reduced) { el.textContent = to; return; }
    const t0 = performance.now();
    const step = (t) => { const p = Math.min(1, (t - t0) / 1600); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  const vid = $('#heroVideo'); if (reduced && vid) vid.pause();
  $('#watchNewest').addEventListener('click', () => openCase(CASES[0]));
  $('#ticker').innerHTML = [...CASES, ...CASES].map((c) => `<span>${esc(c.job)} · ${esc(c.hook)}</span>`).join('');
  $('#commentLink').href = watch(CASES[0]);

  /* ---------- newest file ---------- */
  const n = CASES[0];
  const feature = $('#feature');
  feature.innerHTML = `
    <div class="feature-media" role="button" tabindex="0" aria-label="Play ${esc(n.title)}" style="--thumb:url('${thumb(n)}')">
      <img src="${thumb(n)}" alt="${esc(n.title)}" loading="lazy"><span class="badge-new">New</span>
      <span class="play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4v16l13-8z"/></svg></span>
    </div>
    <div class="folder">
      <div class="no">${fileNo(n)} · ${daysLabel(n)} · ${n.dur}</div>
      <h3>${esc(n.job)}</h3>
      ${n.hook ? `<div class="stamp-hook">${esc(n.hook)}</div>` : ''}
      <p>${esc(n.opening)}</p>
      ${scoreHTML(n.scores)}
      <button class="btn btn-paper" data-open="${n.no}">Open the file</button>
    </div>`;
  thumbFallback($('img', feature));
  const fm = $('.feature-media', feature);
  fm.addEventListener('click', () => openCase(n));
  fm.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCase(n); } });

  /* ---------- case grid ---------- */
  const grid = $('#grid'), chips = $('#chips');
  let filter = 'all';
  GROUPS.forEach(([k, label]) => {
    const count = k === 'all' ? CASES.length : CASES.filter((c) => c.group === k).length;
    if (!count) return;
    const b = h(`<button class="chip" aria-pressed="${k === filter}">${label}<small>${count}</small></button>`);
    b.addEventListener('click', () => { filter = k; chips.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', x === b)); renderGrid(); });
    chips.appendChild(b);
  });
  function renderGrid() {
    grid.innerHTML = '';
    CASES.filter((c) => filter === 'all' || c.group === filter).forEach((c, i) => {
      const s = c.scores;
      const card = h(`
        <button class="card" data-no="${fileNo(c)}" style="animation-delay:${i * 40}ms" aria-label="Open the ${esc(c.job)} file">
          <div class="thumb"><img src="${thumb(c)}" alt="" loading="lazy"><span class="dur">${c.dur}</span><img class="closed" src="img/stamp.png" alt=""></div>
          <div class="body">
            <h3 class="job">${esc(c.job)}</h3>
            <p class="hook">${esc(c.hook)}</p>
            <div class="meta"><span>${daysLabel(c)}</span>${s ? `<span class="meter" title="Survival index ${s.index}/10 · ${s.label}"><i style="--w:${s.index * 10}%;--c:${verdictColor[s.label] || '#9cc46f'}"></i>${s.index}</span>` : '<span>PART ' + (c.days.startsWith('31') ? '2' : '1') + '</span>'}</div>
          </div>
        </button>`);
      thumbFallback($('.thumb img', card));
      card.addEventListener('click', () => openCase(c));
      grid.appendChild(card);
    });
  }
  renderGrid();

  /* ---------- scorecard sample ---------- */
  const sample = CASES.find((c) => c.job === 'Soldier' && c.scores) || CASES.find((c) => c.scores);
  const scCard = $('#scCard');
  if (sample) {
    $('#scSub').textContent = `Sample · the ${sample.job} file`;
    $('#scScore').innerHTML = scoreHTML(sample.scores).split('<div class="verdict')[0];
    $('#scVerdict').innerHTML = `<span>SURVIVAL INDEX ${sample.scores.index}/10</span><b class="v-${sample.scores.label}">${sample.scores.label}</b>`;
  }

  /* ---------- lineup ---------- */
  const wall = $('#lineupWall');
  const seen = new Set();
  [...CASES].reverse().forEach((c) => {
    if (seen.has(c.job)) return; seen.add(c.job);
    const s = h(`<button class="suspect" aria-label="Open the ${esc(c.job)} file"><img src="img/cast/${c.slug}.png" alt="" loading="lazy"><span class="placard">${esc(c.job)}<small>${fileNo(c)}</small></span></button>`);
    s.addEventListener('click', () => openCase(c));
    wall.appendChild(s);
  });
  SEALED.forEach((u) => wall.appendChild(h(`<div class="suspect sealed" aria-label="Sealed file"><img src="img/cast/${u.file}" alt="" loading="lazy"><span class="placard">Sealed<small>COMING SOON</small></span></div>`)));

  /* ---------- rule generator ---------- */
  const RULES = CASES.flatMap((c) => c.rules.map((r) => ({ ...r, c })));
  let typing = 0, ruleCase = CASES[0];
  function drawRule(first) {
    if (!RULES.length) return;
    const r = first ? (RULES.find((x) => /Ladders stop them/.test(x.text)) || RULES[0]) : RULES[Math.floor(Math.random() * RULES.length)];
    ruleCase = r.c;
    $('#ruleLabel').textContent = `SURVIVAL RULE ${r.n}`;
    $('#ruleFrom').textContent = `From the file of the ${r.c.job}`;
    const el = $('#ruleText'), text = r.text, id = ++typing;
    if (reduced || first) { el.textContent = text; return; }
    el.textContent = '';
    let i = 0;
    const tick = () => { if (id !== typing) return; el.textContent = text.slice(0, ++i); if (i < text.length) setTimeout(tick, 28 + Math.random() * 40); };
    tick();
  }
  drawRule(true);
  $('#drawRule').addEventListener('click', () => drawRule(false));
  $('#ruleOpen').addEventListener('click', (e) => { e.preventDefault(); openCase(ruleCase); });

  /* ---------- trailers ---------- */
  const reel = $('#reel');
  TRAILERS.forEach((slug) => {
    const c = CASES.find((x) => x.slug.endsWith('_' + slug));
    const p = h(`<div class="phone" role="button" tabindex="0" aria-label="Play the ${esc(c ? c.job : slug)} trailer">
      <img src="media/trailers/${slug}.jpg" alt="" loading="lazy">
      <span class="mini-play"><svg viewBox="0 0 24 24"><path d="M7 4v16l13-8z"/></svg></span>
      <div class="tag">${esc(c ? c.job : slug)}<span>Trailer</span></div></div>`);
    const play = () => {
      let v = $('video', p);
      if (!v) {
        reel.querySelectorAll('.phone video').forEach((o) => { o.pause(); o.closest('.phone').classList.remove('playing'); });
        v = h(`<video src="media/trailers/${slug}.mp4" poster="media/trailers/${slug}.jpg" playsinline controls preload="auto"></video>`);
        $('img', p).replaceWith(v);
        v.addEventListener('pause', () => p.classList.remove('playing'));
        v.addEventListener('play', () => { reel.querySelectorAll('.phone video').forEach((o) => { if (o !== v) o.pause(); }); p.classList.add('playing'); });
        v.play();
      }
    };
    p.addEventListener('click', play);
    p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); } });
    reel.appendChild(p);
  });

  /* ---------- modal ---------- */
  const modal = $('#modal'), box = $('#modalBox');
  let lastFocus = null;
  function openCase(c) {
    if (!c) return;
    lastFocus = document.activeElement;
    box.innerHTML = `
      <div class="player"><iframe src="https://www.youtube-nocookie.com/embed/${c.yt}?autoplay=1&rel=0&modestbranding=1" title="${esc(c.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>
      <div class="modal-info">
        <div>
          <div class="no">${fileNo(c)} · ${daysLabel(c)} · ${c.dur}</div>
          <h3>${esc(c.job)}</h3>
          <p>${esc(c.opening)}</p>
          ${c.question ? `<p class="q">${esc(c.question)}</p>` : ''}
          ${scoreHTML(c.scores)}
          <div class="hero-cta" style="margin-top:18px"><a class="btn btn-red" href="${watch(c)}" target="_blank" rel="noopener">Watch on YouTube</a></div>
        </div>
        <div>
          <h4>Survival rules in this file</h4>
          <ol>${c.rules.map((r) => `<li>${esc(r.text)}</li>`).join('')}</ol>
        </div>
      </div>`;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    fillBars(box);
    history.replaceState(null, '', `#file-${c.no}`);
    $('#modalClose').focus();
  }
  function closeModal() {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open');
    box.innerHTML = '';
    document.body.style.overflow = '';
    history.replaceState(null, '', location.pathname);
    lastFocus?.focus?.();
  }
  $('#modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open]');
    if (b) openCase(CASES.find((c) => String(c.no) === b.dataset.open));
  });
  const m = location.hash.match(/^#file-(\d+)$/);
  if (m) openCase(CASES.find((c) => String(c.no) === m[1]));

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in');
    fillBars(en.target);
    if (en.target === scCard) setTimeout(() => scCard.classList.add('stamped'), 900);
    io.unobserve(en.target);
  }), { threshold: 0.18 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
})();
