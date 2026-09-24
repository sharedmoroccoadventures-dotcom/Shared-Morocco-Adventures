/* Shared Morocco Adventures · motion engine (no dependencies)
   JS measures, CSS moves: elements receive --p (0..1) progress and state
   classes; all transforms live in site.css. Respects reduced motion. */
(() => {
  'use strict';
  const d = document, root = d.documentElement, W = window;
  const reduce = W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = W.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = d) => c.querySelector(s);
  const $$ = (s, c = d) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  let vh = W.innerHeight, vw = W.innerWidth;

  /* ---------- word splitting ---------- */
  function split(el) {
    if (el.dataset.split) return; el.dataset.split = '1';
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/); const frag = d.createDocumentFragment();
          parts.forEach(p => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(' ')); return; }
            const w = d.createElement('span'); w.className = 'w';
            const s = d.createElement('span'); s.textContent = p; s.style.setProperty('--i', i++);
            w.appendChild(s); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('w') && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    $$('.w', el).forEach(w => w.setAttribute('aria-hidden', 'true'));
  }
  $$('[data-r="words"], .phero h1').forEach(split);

  /* ---------- stagger ---------- */
  $$('[data-stagger]').forEach(g => [...g.children].forEach((c, i) => {
    c.style.setProperty('--i', i);
    if (!c.hasAttribute('data-r')) c.setAttribute('data-r', g.dataset.stagger || 'up');
  }));
  $$('.hero__title .line > span').forEach((s, i) => s.style.setProperty('--i', i));

  /* ---------- reveal ---------- */
  const revealIO = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
  }), { rootMargin: '0px 0px -9% 0px', threshold: 0.12 });
  $$('[data-r], [data-in]').forEach(el => reduce ? el.classList.add('is-in') : revealIO.observe(el));

  /* ---------- counters ---------- */
  const countIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; countIO.unobserve(e.target);
    const el = e.target, to = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
    const pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = pre + to.toFixed(dec) + suf; return; }
    const t0 = performance.now(), dur = 1600;
    const tick = t => { const k = clamp((t - t0) / dur); const v = to * (1 - Math.pow(1 - k, 4)); el.textContent = pre + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en')) + suf; if (k < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }), { threshold: 0.6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- progress engine ---------- */
  const tracked = new Set(); const handlers = [];
  const progIO = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? tracked.add(e.target) : tracked.delete(e.target)), { rootMargin: '25% 0px 25% 0px' });
  $$('[data-p]').forEach(el => progIO.observe(el));
  function progressOf(el, mode) {
    const r = el.getBoundingClientRect();
    if (mode === 'pin') return clamp(-r.top / Math.max(1, r.height - vh));
    if (mode === 'read') return clamp(-r.top / Math.max(1, r.height - vh * 0.6));
    if (mode === 'line') return clamp((vh * 0.55 - r.top) / Math.max(1, r.height));
    if (mode === 'top') return clamp(-r.top / Math.max(1, r.height));
    return clamp((vh - r.top) / (vh + r.height));
  }
  let ticking = false, lastY = W.scrollY, vel = 0;
  function frame() {
    ticking = false;
    const y = W.scrollY; vel = y - lastY; lastY = y;
    tracked.forEach(el => el.style.setProperty('--p', progressOf(el, el.dataset.p).toFixed(4)));
    handlers.forEach(h => h(y, vel));
  }
  const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  W.addEventListener('scroll', request, { passive: true });
  W.addEventListener('resize', () => { vh = W.innerHeight; vw = W.innerWidth; resizers.forEach(f => f()); request(); });
  const resizers = [];
  // only do per-frame work for things that are near the viewport
  const near = new WeakSet();
  const nearIO = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? near.add(e.target) : near.delete(e.target)), { rootMargin: '60% 0px' });
  // pause decorative CSS animations while their section is off-screen
  const offIO = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('off-screen', !e.isIntersecting)), { rootMargin: '120px 0px' });
  $$('main > section, main > article, main > div, .ftr').forEach(s => offIO.observe(s));

  /* ---------- header ---------- */
  const hdr = $('.hdr');
  if (hdr) {
    const always = hdr.classList.contains('hdr--solid');
    let acc = 0;
    handlers.push((y, v) => {
      hdr.classList.toggle('is-solid', always || y > 40);
      if (root.classList.contains('menu-open')) return;
      acc = Math.sign(v) === Math.sign(acc) ? acc + v : v;
      if (y > 420 && acc > 24) hdr.classList.add('is-hidden');
      else if (acc < -12 || y < 200) hdr.classList.remove('is-hidden');
    });
    // sliding nav indicator
    const nav = $('.nav', hdr), ind = $('.nav__ind', hdr);
    if (nav && ind) {
      const links = $$('a', nav), cur = links.find(a => a.getAttribute('aria-current') === 'page');
      const move = a => { if (!a) { ind.style.opacity = 0; return; } ind.style.opacity = 1; ind.style.width = a.offsetWidth + 'px'; ind.style.transform = `translateX(${a.offsetLeft}px)`; };
      links.forEach(a => { a.addEventListener('mouseenter', () => move(a)); a.addEventListener('focus', () => move(a)); });
      nav.addEventListener('mouseleave', () => move(cur));
      requestAnimationFrame(() => move(cur));
      resizers.push(() => move(cur));
    }
  }

  /* ---------- menu ---------- */
  const burger = $('.burger'), menu = $('.menu');
  if (burger && menu) {
    $$('.menu__links a', menu).forEach((a, i) => a.style.setProperty('--i', i));
    const main = $('main');
    const set = open => {
      root.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open);
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.toggleAttribute('inert', !open);
      if (main) main.toggleAttribute('inert', open);
      if (open) setTimeout(() => $('a', menu)?.focus({ preventScroll: true }), 350); else burger.focus({ preventScroll: true });
    };
    menu.setAttribute('inert', '');
    burger.addEventListener('click', () => set(!root.classList.contains('menu-open')));
    d.addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('menu-open')) set(false); });
    $$('a', menu).forEach(a => a.addEventListener('click', () => set(false)));
  }

  /* ---------- journey rail (MOVE → TRAVEL) ---------- */
  const rail = $('.rail');
  if (rail) {
    const items = $$('li', rail);
    const railIO = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const k = e.target.dataset.stage;
      items.forEach(li => li.classList.toggle('is-on', li.dataset.stage === k));
    }), { rootMargin: '-48% 0px -48% 0px' });
    $$('[data-stage]').forEach(s => s.tagName !== 'LI' && railIO.observe(s));
  }

  /* ---------- horizontal pinned rails ---------- */
  $$('.hscroll').forEach(sec => {
    const pin = $('.hscroll__pin', sec), track = $('.hscroll__track', sec), bar = $('.hscroll__bar', sec);
    let lastX = -1;
    let dist = 0, on = false;
    const setup = () => {
      on = !reduce && vw >= 900;
      sec.classList.toggle('hscroll--native', !on);
      if (!on) { pin.style.removeProperty('--h'); track.style.transform = ''; return; }
      dist = Math.max(0, track.scrollWidth - vw);
      pin.style.setProperty('--h', (dist + vh) + 'px');
    };
    setup(); resizers.push(setup); nearIO.observe(pin);
    W.addEventListener('load', setup);
    handlers.push(() => {
      if (!on || !near.has(pin)) return;
      const r = pin.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, r.height - vh));
      const x = Math.round(p * dist);
      if (x === lastX) return; lastX = x;
      track.style.transform = `translate3d(${-x}px,0,0)`;
      bar.style.setProperty('--p', p.toFixed(4));
    });
  });

  /* ---------- journey map ---------- */
  const journey = $('.journey');
  if (journey) {
    const pin = $('.journey__pin', journey), route = $('.route', journey), trav = $('.traveler', journey);
    const stops = $$('.stop', journey), cards = $$('.jcard__item', journey), bars = $$('.jprog i', journey);
    const L = route.getTotalLength();
    // where does each stop sit along the path?
    const at = stops.map(s => {
      const cx = +s.dataset.x, cy = +s.dataset.y; let best = 0, bd = 1e9;
      for (let i = 0; i <= 400; i++) { const pt = route.getPointAtLength(L * i / 400); const dd = (pt.x - cx) ** 2 + (pt.y - cy) ** 2; if (dd < bd) { bd = dd; best = i / 400; } }
      return best;
    });
    route.style.strokeDasharray = L; route.style.strokeDashoffset = L;
    let current = -1, lastP = -1;
    const show = p => {
      p = Math.round(p * 1000) / 1000; if (p === lastP) return; lastP = p;
      route.style.strokeDashoffset = (L * (1 - p)).toFixed(1);
      const pt = route.getPointAtLength(L * p); trav.setAttribute('cx', pt.x); trav.setAttribute('cy', pt.y);
      let idx = 0; at.forEach((a, i) => { if (p >= a - 0.004) idx = i; });
      stops.forEach((s, i) => { s.classList.toggle('is-on', i <= idx); s.classList.toggle('is-current', i === idx); });
      if (idx !== current) { current = idx; cards.forEach((c, i) => c.classList.toggle('is-on', i === idx)); }
      bars.forEach((b, i) => { const a = at[i], z = at[i + 1] ?? 1; b.style.setProperty('--f', clamp((p - a) / Math.max(.001, z - a)).toFixed(3)); });
    };
    if (reduce) { journey.classList.add('journey--static'); show(1); }
    else { nearIO.observe(pin); handlers.push(() => { if (!near.has(pin)) return; const r = pin.getBoundingClientRect(); show(clamp((-r.top) / Math.max(1, r.height - vh) * 1.08)); }); }
  }

  /* ---------- itinerary timeline ---------- */
  $$('.timeline').forEach(tl => {
    const days = $$('.day', tl);
    nearIO.observe(tl);
    handlers.push(() => {
      if (!near.has(tl)) return;
      const r = tl.getBoundingClientRect();
      const p = clamp((vh * 0.55 - r.top) / Math.max(1, r.height));
      tl.style.setProperty('--p', p.toFixed(4));
      days.forEach(dy => dy.classList.toggle('is-passed', dy.getBoundingClientRect().top < vh * 0.55));
    });
  });

  /* ---------- sticky story (why shared) ---------- */
  const story = $('.story');
  if (story) {
    const imgs = $$('.story__visual img', story);
    const storyIO = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; const k = +e.target.dataset.step;
      imgs.forEach((im, i) => im.classList.toggle('is-on', i === k));
    }), { rootMargin: '-45% 0px -45% 0px' });
    $$('.story__step', story).forEach(s => storyIO.observe(s));
  }

  /* ---------- big quote lights word by word ---------- */
  $$('.big-quote').forEach(q => {
    const words = q.textContent.trim().split(/\s+/); q.setAttribute('aria-label', q.textContent.trim());
    q.innerHTML = words.map(w => `<span class="word" aria-hidden="true">${w}</span>`).join(' ');
    const ws = $$('.word', q);
    handlers.push(() => { const r = q.getBoundingClientRect(); const p = clamp((vh * 0.85 - r.top) / (vh * 0.6)); const n = Math.round(p * ws.length); ws.forEach((w, i) => w.classList.toggle('on', reduce || i < n)); });
  });

  /* ---------- group chat ---------- */
  $$('.chat').forEach(chat => {
    const msgs = $$('.msg', chat), typing = $('.typing', chat);
    const io = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return; io.disconnect();
      if (reduce) { msgs.forEach(m => m.classList.add('is-in')); return; }
      let t = 200;
      msgs.forEach((m, i) => {
        if (i > 0 && typing) { setTimeout(() => { typing.classList.add('is-on'); m.before(typing); }, t); t += 900; }
        setTimeout(() => { typing?.classList.remove('is-on'); m.classList.add('is-in'); }, t); t += 700;
      });
    }, { threshold: 0.35 });
    io.observe(chat);
  });

  /* ---------- pointer niceties ---------- */
  if (fine && !reduce) {
    $$('.btn, .tcard__go, .burger').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`; });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
    $$('.tcard, .xp__tile').forEach(c => {
      const img = $('img', c);
      c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; img && (img.style.setProperty('--mx', (x * -14).toFixed(1) + 'px'), img.style.setProperty('--my', (y * -14).toFixed(1) + 'px')); });
      c.addEventListener('pointerleave', () => { img?.style.setProperty('--mx', '0px'); img?.style.setProperty('--my', '0px'); });
    });
    // hero depth
    const hero = $('.hero');
    if (hero) {
      const layers = $$('[data-depth]', hero);
      hero.addEventListener('pointermove', e => { const x = e.clientX / vw - .5, y = e.clientY / vh - .5; layers.forEach(l => l.style.translate = `${x * l.dataset.depth}px ${y * l.dataset.depth * .6}px`); });
    }
    // cursor
    const cur = d.createElement('div'); cur.className = 'cursor'; cur.innerHTML = '<span></span>'; cur.setAttribute('aria-hidden', 'true'); d.body.appendChild(cur);
    let tx = -100, ty = -100, cx = -100, cy = -100;
    W.addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; cur.classList.add('is-on'); }, { passive: true });
    d.addEventListener('pointerleave', () => cur.classList.remove('is-on'));
    let looping = false;
    const loop = () => { cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2; cur.style.setProperty('--cx', cx.toFixed(1) + 'px'); cur.style.setProperty('--cy', cy.toFixed(1) + 'px'); if (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.4) requestAnimationFrame(loop); else looping = false; };
    W.addEventListener('pointermove', () => { if (!looping) { looping = true; requestAnimationFrame(loop); } }, { passive: true });
    $$('[data-cursor]').forEach(el => {
      el.addEventListener('pointerenter', () => { $('span', cur).textContent = el.dataset.cursor; cur.classList.add('is-big'); });
      el.addEventListener('pointerleave', () => cur.classList.remove('is-big'));
    });
  }

  /* ---------- accordions (animated details) ---------- */
  $$('.faq details').forEach(det => {
    const sum = $('summary', det), body = $('.faq__a', det);
    if (!body || reduce) return;
    sum.addEventListener('click', e => {
      e.preventDefault();
      if (det.dataset.anim) return; det.dataset.anim = '1';
      if (det.open) {
        const h = body.offsetHeight;
        body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.65,0,.35,1)' }).onfinish = () => { det.open = false; delete det.dataset.anim; };
      } else {
        det.open = true; const h = body.offsetHeight;
        body.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.22,1,.36,1)' }).onfinish = () => delete det.dataset.anim;
      }
    });
  });

  /* ---------- FAQ search ---------- */
  const fs = $('.faq-search');
  if (fs) {
    const cats = $$('[data-faq-cat]'), empty = $('.faq-empty');
    fs.addEventListener('input', () => {
      const q = fs.value.trim().toLowerCase(); let shown = 0;
      cats.forEach(c => { let n = 0; $$('details', c).forEach(dt => { const hit = !q || dt.textContent.toLowerCase().includes(q); dt.hidden = !hit; if (hit) n++; if (q && hit) dt.open = true; if (!q) dt.open = false; }); c.hidden = !n; shown += n; });
      if (empty) empty.hidden = shown > 0;
    });
  }

  /* ---------- filters with FLIP ---------- */
  $$('[data-filters]').forEach(box => {
    const grid = $(box.dataset.filters), items = $$('[data-tags]', grid), count = $('.fcount', box);
    const state = {};
    const apply = () => {
      const first = new Map(items.map(it => [it, it.getBoundingClientRect()]));
      let n = 0;
      items.forEach(it => { const tags = it.dataset.tags.split(' '); const ok = Object.values(state).every(v => !v || tags.includes(v)); it.classList.toggle('is-filtered-out', !ok); if (ok) n++; });
      if (count) count.textContent = `${n} trip${n === 1 ? '' : 's'}`;
      if (reduce) return;
      items.forEach(it => { if (it.classList.contains('is-filtered-out')) return; const a = first.get(it), b = it.getBoundingClientRect(); if (!a.width) { it.animate([{ opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.22,1,.36,1)' }); return; } const dx = a.left - b.left, dy = a.top - b.top; if (dx || dy) it.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)' }); });
    };
    $$('[data-group]', box).forEach(btn => btn.addEventListener('click', () => {
      const g = btn.dataset.group;
      $$(`[data-group="${g}"]`, box).forEach(b => b.setAttribute('aria-pressed', b === btn));
      state[g] = btn.dataset.value; apply();
    }));
    // legacy home route-finder params (?style=&length=&from=)
    const q = new URLSearchParams(location.search);
    const map = { 'See the Sahara': 'sahara', 'Explore imperial cities': 'cities', 'Take a day trip': 'daytrip', Marrakech: 'marrakech', Fes: 'fes', Casablanca: 'casablanca' };
    ['style', 'from', 'region', 'length'].forEach(k => { const v = q.get(k); if (!v) return; const val = map[v] || v.toLowerCase().replace(/\s+days?$/, 'd').replace(/\s+/g, '-'); const b = $(`[data-value="${val}"]`, box); if (b) b.click(); });
  });

  /* ---------- reading progress ---------- */
  const prog = $('.progress i'), art = $('#article');
  if (prog && art) handlers.push(() => { const r = art.getBoundingClientRect(); prog.style.setProperty('--p', clamp(-r.top / Math.max(1, r.height - vh)).toFixed(4)); });

  /* ---------- tour page mobile booking dock ---------- */
  const mdock = $('.mdock');
  if (mdock) {
    const hero = $('.phero'), ftr = $('.ftr');
    handlers.push(() => { const past = hero ? hero.getBoundingClientRect().bottom < 0 : W.scrollY > 500; const nearEnd = ftr && ftr.getBoundingClientRect().top < vh; mdock.classList.toggle('is-on', past && !nearEnd); });
  }

  /* ---------- jump nav highlighting ---------- */
  const jump = $('.jump');
  if (jump) {
    const links = $$('a', jump);
    const jio = new IntersectionObserver(es => es.forEach(e => { if (!e.isIntersecting) return; links.forEach(a => { const on = a.getAttribute('href') === '#' + e.target.id; a.classList.toggle('is-on', on); if (on) jump.scrollTo({ left: a.offsetLeft - 40, behavior: reduce ? 'auto' : 'smooth' }); }); }), { rootMargin: '-40% 0px -55% 0px' });
    links.forEach(a => { const t = $(a.getAttribute('href')); t && jio.observe(t); });
  }

  /* ---------- contact: prefill trip from ?trip= ---------- */
  const trip = $('#trip');
  if (trip) {
    const want = new URLSearchParams(location.search).get('trip');
    if (want) {
      const norm = s => s.toLowerCase().replace(/&|,|\band\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
      let opt = [...trip.options].find(o => norm(o.value) === norm(want)) || [...trip.options].find(o => norm(o.value).includes(norm(want)) || norm(want).includes(norm(o.value)));
      if (!opt) { opt = new Option(want, want); trip.add(opt, 0); }
      trip.value = opt.value;
      const note = $('.trip-note'); if (note) { note.hidden = false; $('b', note).textContent = opt.text; }
    }
  }

  /* ---------- first paint choreography ---------- */
  const go = () => requestAnimationFrame(() => requestAnimationFrame(() => { root.classList.add('is-loaded'); request(); }));
  const heroImg = $('.hero__media img, .phero__media img');
  if (heroImg && !heroImg.complete) { let done = false; const f = () => { if (!done) { done = true; go(); } }; heroImg.addEventListener('load', f); heroImg.addEventListener('error', f); setTimeout(f, 900); }
  else go();
  frame();
})();
