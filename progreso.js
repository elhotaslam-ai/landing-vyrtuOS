(() => {
  /* Al llegar desde la otra página, la cortina lima sigue subiendo; luego se quita para poder salir otra vez */
  if (document.documentElement.classList.contains('arrive')) setTimeout(() => document.documentElement.classList.remove('arrive'), 900);

  const INSTAGRAM_URL = "https://www.instagram.com/vyrtu_os/";

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- Efectos de texto ---------- */
  function split(el) {
    if (el.dataset.split) return;
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            for (const c of part) { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; s.style.setProperty('--i', i++); w.appendChild(s); }
            frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    const label = el.textContent.trim();
    walk(el); el.setAttribute('aria-label', label); el.dataset.split = 1;
    el.querySelectorAll('.w').forEach(w => w.setAttribute('aria-hidden', 'true'));
  }
  function play(el) {
    if (el.dataset.fx === 'rise') split(el);
    el.classList.remove('play'); void el.offsetWidth; el.classList.add('play');
  }

  /* ---------- Idiomas (textos en i18n.js) ---------- */
  const I18N = window.VYRTU_I18N || {};
  const LANGS = ['es', 'en', 'pt', 'it'];
  let lang = null;
  try { lang = localStorage.getItem('vyrtu-lang'); } catch (e) {}
  if (!LANGS.includes(lang)) {
    const prefs = (navigator.languages || [navigator.language || 'es']).map(l => String(l).slice(0, 2).toLowerCase());
    lang = prefs.find(l => LANGS.includes(l)) || 'en';
  }
  if (!I18N[lang]) lang = 'es';
  function applyLang(code) {
    const dict = I18N[code];
    if (!dict) return;
    document.documentElement.lang = code;
    document.title = dict['pg.title'];
    const md = document.querySelector('meta[name="description"]');
    if (md) md.content = dict['pg.desc'];
    document.getElementById('langCur').textContent = code.toUpperCase();
    document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-current', b.dataset.lang === code ? 'true' : 'false'));
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = dict[el.dataset.i18n];
      if (v == null) return;
      if (el.dataset.fx === 'rise') {
        const played = el.classList.contains('play');
        el.innerHTML = v; delete el.dataset.split; el.removeAttribute('aria-label');
        if (played) play(el);
        return;
      }
      el.innerHTML = v;
    });
  }
  applyLang(lang);

  const langBtn = document.getElementById('langBtn'), langMenu = document.getElementById('langMenu');
  const closeLang = () => { langMenu.hidden = true; langBtn.setAttribute('aria-expanded', 'false'); };
  langBtn.addEventListener('click', e => {
    e.stopPropagation();
    const open = langMenu.hidden;
    langMenu.hidden = !open; langBtn.setAttribute('aria-expanded', String(open));
  });
  langMenu.addEventListener('click', e => {
    const b = e.target.closest('[data-lang]');
    if (!b) return;
    e.stopPropagation();
    lang = b.dataset.lang;
    try { localStorage.setItem('vyrtu-lang', lang); } catch (err) {}
    applyLang(lang); closeLang(); roadGradient();
  });
  document.addEventListener('click', closeLang);
  addEventListener('keydown', e => { if (e.key === 'Escape') closeLang(); });

  document.querySelectorAll('[data-ig]').forEach(a => { if (INSTAGRAM_URL) a.href = INSTAGRAM_URL; else a.hidden = true; });

  /* ---------- Resumen: se cuenta solo a partir de las tareas de la página ---------- */
  const items = [...document.querySelectorAll('.checks .it')];
  const count = { done: 0, doing: 0, todo: 0 };
  items.forEach(it => { if (it.classList.contains('done')) count.done++; else if (it.classList.contains('doing')) count.doing++; else count.todo++; });
  const pct = Math.round(count.done / (items.length || 1) * 100);
  const R = 2 * Math.PI * 50, ringEl = document.getElementById('sumRing');
  ringEl.style.strokeDasharray = R; ringEl.style.strokeDashoffset = reduce ? R * (1 - pct / 100) : R;
  function countTo(el, to, delay) {
    if (reduce) { el.textContent = to; return; }
    setTimeout(() => {
      const t0 = performance.now(), dur = 1300;
      const tick = now => { const p = Math.min(1, (now - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }, delay);
  }
  document.querySelectorAll('[data-sum]').forEach((el, k) => countTo(el, count[el.dataset.sum], 800 + k * 120));
  countTo(document.getElementById('sumPct'), pct, 800);
  if (!reduce) setTimeout(() => { ringEl.style.strokeDashoffset = R * (1 - pct / 100); }, 800);

  /* ---------- Animaciones de entrada ---------- */
  document.querySelectorAll('.pg-hero [data-fx], .pg-hero[data-fx]').forEach(play);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target); play(e.target);
      e.target.querySelectorAll('.it').forEach((it, k) => { it.style.setProperty('--k', k); it.classList.add('in'); });
    }), { threshold: .15 });
    document.querySelectorAll('[data-io]').forEach(el => io.observe(el));
  } else document.querySelectorAll('.it').forEach(it => it.classList.add('in'));

  /* ---------- Línea de fases: lima hasta lo que está en marcha, blanco para lo que falta ---------- */
  const road = document.getElementById('road'), roadFill = document.getElementById('roadFill'), hitos = [...road.querySelectorAll('.hito')];
  const nowHitos = road.querySelectorAll('.hito.now'), lastNow = nowHitos[nowHitos.length - 1];
  let roadCut = 100;
  const roadTip = document.createElement('li'); roadTip.className = 'road-tip'; roadTip.setAttribute('aria-hidden', 'true'); road.appendChild(roadTip);
  function roadGradient() {
    const line = roadFill.parentElement, lh = line.offsetHeight || 1;
    const cut = clamp((lastNow.offsetTop + lastNow.offsetHeight + 11 - line.offsetTop) / lh) * 100;
    roadCut = cut;
    roadFill.style.background = `linear-gradient(var(--acento) 0, var(--acento-oscuro) ${cut}%, #ffffff ${cut}%, rgba(255,255,255,.8) 100%)`;
  }
  roadGradient(); addEventListener('resize', roadGradient, { passive: true }); addEventListener('load', roadGradient);

  const bar = document.getElementById('progress'), spot = document.getElementById('spot'), orbs = [...document.querySelectorAll('.orb')];
  let px = innerWidth / 2, py = innerHeight / 2, ticking = false;
  addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; if (fine) spot.style.transform = `translate(${px}px,${py}px)`; }, { passive: true });
  function onScroll() {
    ticking = false;
    const y = scrollY, vh = innerHeight, max = document.documentElement.scrollHeight - vh;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    const rr = road.getBoundingClientRect();
    const rp = reduce ? 1 : clamp((vh * 0.65 - rr.top) / rr.height);
    roadFill.style.clipPath = `inset(0 0 ${(1 - rp) * 100}% 0)`;
    const lineEl = roadFill.parentElement;
    roadTip.style.transform = `translateY(${lineEl.offsetTop + rp * lineEl.offsetHeight}px)`;
    roadTip.style.setProperty('--tip', rp * 100 <= roadCut ? 'var(--acento)' : '#ffffff');
    hitos.forEach(h => h.classList.toggle('lit', h.offsetTop + 30 <= rp * rr.height));
    if (!reduce) orbs.forEach((o, k) => o.style.transform = `translate3d(0,${Math.sin(y / 700 + k * 2) * 120}px,0)`);
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Scroll animado para #anclas y transición entre páginas ---------- */
  const easeInOut = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const href = a.getAttribute('href');
    if (href.startsWith('#')) {
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const to = Math.max(0, target.getBoundingClientRect().top + scrollY - 90);
      if (reduce) { scrollTo(0, to); return; }
      const from = scrollY, dist = to - from, dur = Math.min(1600, 600 + Math.abs(dist) * 0.25), t0 = performance.now();
      const step = now => { const p = Math.min(1, (now - t0) / dur); scrollTo(0, from + dist * easeInOut(p)); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    } else if (/\.html(#|$)/.test(href) && !reduce) {
      e.preventDefault();
      document.body.classList.add('leaving');
      try { sessionStorage.setItem('vyrtu-wipe', '1'); } catch (err) {}
    setTimeout(() => { location.href = href; }, 520);
    }
  });
  addEventListener('pageshow', () => document.body.classList.remove('leaving'));
})();
