(() => {
  /* Al llegar desde la otra página, la cortina lima sigue subiendo; luego se quita para poder salir otra vez */
  if (document.documentElement.classList.contains('arrive')) setTimeout(() => document.documentElement.classList.remove('arrive'), 900);

  /* Pega aquí tus perfiles cuando los tengas (si están vacíos, los botones no aparecen) */
  const INSTAGRAM_URL = "https://www.instagram.com/vyrtu_os/";
  const TIKTOK_URL = "";

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const fmt = n => n.toLocaleString('es-ES');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

  /* ---------- Móviles 3D: cantos apilados para dar grosor + trasera ---------- */
  const backTpl = document.getElementById('backTpl');
  document.querySelectorAll('.dev').forEach(dev => {
    for (let z = -6; z <= 6; z += 1.5) {
      const e = document.createElement('div'); e.className = 'edge'; e.style.transform = `translateZ(${z}px)`;
      dev.insertBefore(e, dev.firstChild);
    }
    if (dev.hasAttribute('data-back')) dev.appendChild(backTpl.content.cloneNode(true));
  });

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
  function scramble(el) {
    const final = el.dataset.final || (el.dataset.final = el.textContent);
    if (reduce) return;
    const pool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%+*', delay = +el.dataset.delay || 0, dur = 1000;
    setTimeout(() => {
      const t0 = performance.now();
      const id = setInterval(() => {
        const p = Math.min(1, (performance.now() - t0) / dur), n = Math.floor(p * final.length);
        el.textContent = final.slice(0, n) + [...final.slice(n)].map(c => c === ' ' || c === '·' ? c : pool[Math.random() * pool.length | 0]).join('');
        if (p >= 1) { clearInterval(id); el.textContent = final; }
      }, 40);
    }, delay);
  }
  function play(el) {
    const fx = el.dataset.fx;
    if (fx === 'scramble') return scramble(el);
    if (fx === 'rise') split(el);
    el.classList.remove('play'); void el.offsetWidth; el.classList.add('play');
    if (el.classList.contains('sweep')) el.classList.add('play');
  }
  function countUp(el) {
    const to = +el.dataset.count;
    if (reduce || !to) return;
    const t0 = performance.now(), dur = 1400;
    const tick = now => { const p = Math.min(1, (now - t0) / dur); el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 4)))); if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
  const C = 2 * Math.PI * 42;
  document.querySelectorAll('[data-ring]').forEach(r => { r.style.strokeDasharray = C; r.style.strokeDashoffset = C * (1 - +r.dataset.ring); });
  function ring(el) {
    if (reduce) return;
    el.style.transition = 'none'; el.style.strokeDashoffset = C; void el.getBoundingClientRect();
    el.style.transition = ''; requestAnimationFrame(() => el.style.strokeDashoffset = C * (1 - +el.dataset.ring));
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
  function applyLang(code, animate) {
    const dict = I18N[code];
    if (!dict) return;
    document.documentElement.lang = code;
    document.title = dict['meta.title'];
    const md = document.querySelector('meta[name="description"]');
    if (md) md.content = dict['meta.desc'];
    document.getElementById('langCur').textContent = code.toUpperCase();
    document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-current', b.dataset.lang === code ? 'true' : 'false'));
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const v = dict[el.dataset.i18n];
      if (v == null) return;
      if (el.dataset.fx === 'scramble') { el.dataset.final = v; if (animate) scramble(el); else el.textContent = v; return; }
      if (el.dataset.fx === 'rise') {
        const played = el.classList.contains('play');
        el.innerHTML = v; delete el.dataset.split; el.removeAttribute('aria-label');
        if (played) play(el);
        return;
      }
      el.innerHTML = v;
    });
  }
  applyLang(lang, false);

  /* Al cargar: hero */
  document.querySelectorAll('.hero [data-fx], .hero[data-fx]').forEach(play);
  document.querySelectorAll('.hero [data-ring]').forEach(ring);

  /* Al entrar en pantalla */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target; io.unobserve(el);
      if (el.hasAttribute('data-sweep')) el.querySelectorAll('[data-fx]').forEach(play);
      else if (el.dataset.fx) play(el);
      if (el.dataset.count !== undefined) countUp(el);
      if (el.dataset.ring) ring(el);
    }), { threshold: .2 });
    document.querySelectorAll('[data-io],[data-count],.story3d [data-ring]').forEach(el => io.observe(el));
  }

  /* ---------- Franja de texto ---------- */
  let words = (I18N[lang] && I18N[lang].words) || ['Entrena', 'Registra', 'Entiende', 'Progresa'];
  const fillRow = (el, n) => { let h = ''; for (let k = 0; k < n; k++) words.forEach((w, j) => h += `<span class="${(j + k) % 2 ? 'out' : 'fill'}">${w}</span><span class="out">✦</span>`); el.innerHTML = h + h; };
  const m1 = document.getElementById('m1'), m2 = document.getElementById('m2');
  fillRow(m1, 2); fillRow(m2, 3);

  /* ---------- Tarjetas que se inclinan con el ratón ---------- */
  if (fine && !reduce) document.querySelectorAll('.feat').forEach(card => {
    const inner = card.querySelector('.feat-in');
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.setProperty('--gx', x * 100 + '%'); card.style.setProperty('--gy', y * 100 + '%');
      inner.style.transform = `perspective(700px) rotateX(${(0.5 - y) * 16}deg) rotateY(${(x - 0.5) * 18}deg)`;
    });
    card.addEventListener('pointerleave', () => inner.style.transform = '');
  });

  /* ---------- Bucle de animación: scroll + ratón ---------- */
  const heroRig = document.getElementById('heroRig'), storyRig = document.getElementById('storyRig');
  const heroCopy = document.getElementById('heroCopy'), spot = document.getElementById('spot'), bar = document.getElementById('progress');
  const story = document.getElementById('story'), steps = [...document.querySelectorAll('.step')], screens = [...document.querySelectorAll('.screens .scr')];
  const dots = [...document.querySelectorAll('.dots b')], bignum = document.getElementById('bignum');
  const orbs = [...document.querySelectorAll('.orb')], glares = [...document.querySelectorAll('.glare')];
  const road = document.getElementById('road'), roadFill = document.getElementById('roadFill'), hitos = [...document.querySelectorAll('.hito')];
  let half1 = 0, half2 = 0, lastGx = -1;

  /* Redes: solo se muestran si hay enlace */
  const socials = [[INSTAGRAM_URL, 'ig', 'Instagram de VYRTU'], [TIKTOK_URL, 'tt', 'TikTok de VYRTU']].filter(s => s[0]);
  if (socials.length) document.querySelectorAll('[data-social]').forEach(box => {
    socials.forEach(([url, icon, label]) => {
      const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('aria-label', label);
      a.innerHTML = `<svg aria-hidden="true"><use href="#${icon}"/></svg>`; box.appendChild(a);
    });
    box.hidden = false;
  });
  document.querySelectorAll('[data-ig]').forEach(a => { if (INSTAGRAM_URL) a.href = INSTAGRAM_URL; else a.hidden = true; });

  /* Hoja de ruta: lima hasta lo que ya está en marcha, blanco para lo que falta */
  const nowHito = road.querySelector('.hito.now');
  let roadCut = 100;
  const roadTip = document.createElement('li'); roadTip.className = 'road-tip'; roadTip.setAttribute('aria-hidden', 'true'); road.appendChild(roadTip);
  function roadGradient() {
    const line = roadFill.parentElement, lh = line.offsetHeight || 1;
    const cut = clamp((nowHito.offsetTop + nowHito.offsetHeight + 11 - line.offsetTop) / lh) * 100;
    roadCut = cut;
    roadFill.style.background = `linear-gradient(var(--acento) 0, var(--acento-oscuro) ${cut}%, #ffffff ${cut}%, rgba(255,255,255,.8) 100%)`;
  }
  addEventListener('resize', () => { half1 = 0; }, { passive: true });
  let mx = 0, my = 0, sx = 0, sy = 0, px = innerWidth / 2, py = innerHeight / 2, active = 0, shown = 0;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; px = e.clientX; py = e.clientY; }, { passive: true });

  function setStep(i) {
    if (i === active) return;
    active = i;
    steps.forEach((s, k) => s.classList.toggle('on', k === i));
    play(steps[i].querySelector('h3'));
    bignum.textContent = '0' + (i + 1);
  }
  function showScreen(i) {
    if (i === shown) return;
    shown = i; screens.forEach((s, k) => s.classList.toggle('on', k === i));
    screens[i].querySelectorAll('[data-ring]').forEach(ring);
  }

  /* Solo se anima lo que está a la vista */
  const visible = new Map();
  if ('IntersectionObserver' in window) {
    const vio = new IntersectionObserver(es => es.forEach(e => visible.set(e.target, e.isIntersecting)), { rootMargin: '100px' });
    [heroRig, m1.parentElement, story, road].forEach(el => { visible.set(el, true); vio.observe(el); });
  }
  const isOn = el => visible.get(el) !== false;
  let maxScroll = 0;
  const measure = () => { maxScroll = document.documentElement.scrollHeight - innerHeight; roadGradient(); };
  measure(); addEventListener('resize', measure, { passive: true }); addEventListener('load', measure);

  function frame(t) {
    const y = scrollY, vh = innerHeight, max = maxScroll;
    sx = lerp(sx, mx, .08); sy = lerp(sy, my, .08);
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (fine) spot.style.transform = `translate(${px}px,${py}px)`;

    if (!reduce) {
      /* Luces con parallax */
      orbs.forEach((o, k) => o.style.transform = `translate(${Math.sin(t / 4000 + k) * 40 + sx * (k + 1) * 30}px,${Math.sin(y / 700 + k * 2) * 120 + Math.cos(t / 5000 + k) * 40}px)`);

      /* Hero: el móvil gira con el scroll y sigue al ratón */
      const hp = clamp(y / (vh * 0.9));
      if (isOn(heroRig)) {
        const ry = -20 + hp * 55 + sx * 18, rx = 10 - hp * 22 - sy * 12, float = Math.sin(t / 900) * 8;
        heroRig.style.transform = `translate3d(0,${hp * 90 + float}px,0) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${-4 + hp * 8}deg)`;
        heroCopy.style.transform = `translate3d(0,${hp * -60}px,0)`;
        heroCopy.style.opacity = 1 - hp * 0.8;
      }

      /* Franja: se mueve sola y más rápido con el scroll */
      if (isOn(m1.parentElement)) {
        if (!half1) { half1 = m1.scrollWidth / 2; half2 = m2.scrollWidth / 2; }
        m1.style.transform = `translate3d(${-((t * 0.04 + y * 0.6) % half1)}px,0,0)`;
        m2.style.transform = `translate3d(${-half2 + ((t * 0.03 + y * 0.4) % half2)}px,0,0)`;
      }

      /* Brillo en la pantalla según el ángulo */
      const gx = Math.round(50 + sx * 80 + hp * 60);
      if (gx !== lastGx) { lastGx = gx; glares.forEach(g => g.style.setProperty('--gx', gx + '%')); }
    }

    /* Hoja de ruta: la línea se dibuja con el scroll y enciende cada hito */
    if (isOn(road)) {
      const rr = road.getBoundingClientRect();
      const rp = reduce ? 1 : clamp((vh * 0.65 - rr.top) / rr.height);
      roadFill.style.clipPath = `inset(0 0 ${(1 - rp) * 100}% 0)`;
      const lineEl = roadFill.parentElement;
      roadTip.style.transform = `translateY(${lineEl.offsetTop + rp * lineEl.offsetHeight}px)`;
      roadTip.style.setProperty('--tip', rp * 100 <= roadCut ? 'var(--acento)' : '#ffffff');
      hitos.forEach(h => h.classList.toggle('lit', h.offsetTop + 30 <= rp * rr.height));
    }

    /* Historia fija: el móvil da la vuelta entre pantallas */
    if (!isOn(story)) { requestAnimationFrame(frame); return; }
    const r = story.getBoundingClientRect();
    const sp = clamp(-r.top / (r.height - vh));
    const seg = Math.min(2.999, sp * 3), i = Math.floor(seg), f = seg - i;
    const spin = i < 2 ? smooth(0.62, 1, f) : 0;
    const angle = (i + spin) * 360;
    showScreen(spin > 0.5 ? Math.min(2, i + 1) : i);
    setStep(spin > 0.5 ? Math.min(2, i + 1) : i);
    dots.forEach((d, k) => d.style.transform = `scaleX(${clamp(seg - k)})`);
    if (!reduce) {
      const bob = Math.sin(t / 1100) * 10, lean = Math.sin(spin * Math.PI);
      storyRig.style.transform = `translate3d(0,${bob}px,${lean * -120}px) rotateX(${8 - sy * 10 + lean * 10}deg) rotateY(${angle - 14 + sx * 16}deg) rotateZ(${-3 + lean * 6}deg) scale(${1 - lean * 0.08})`;
      bignum.style.opacity = 1 - lean;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* Enlaces internos (#apuntarse, #app…): scroll suave con aceleración tipo After Effects */
  const easeInOut = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const header = document.querySelector('header.top');
    const to = Math.max(0, target.getBoundingClientRect().top + scrollY - (header ? header.offsetHeight : 0) - 10);
    if (reduce) { scrollTo(0, to); return; }
    const from = scrollY, dist = to - from, dur = Math.min(1600, 600 + Math.abs(dist) * 0.25), t0 = performance.now();
    const step = now => { const p = Math.min(1, (now - t0) / dur); scrollTo(0, from + dist * easeInOut(p)); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
    history.replaceState(null, '', a.getAttribute('href'));
  });

  /* Transición al ir a otra página (por ejemplo, la hoja de ruta) */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || reduce || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const href = a.getAttribute('href');
    if (!/\.html(#|$)/.test(href)) return;
    e.preventDefault();
    document.body.classList.add('leaving');
    try { sessionStorage.setItem('vyrtu-wipe', '1'); } catch (err) {}
    setTimeout(() => { location.href = href; }, 520);
  });
  addEventListener('pageshow', () => document.body.classList.remove('leaving'));

  /* Selector de idioma */
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
    applyLang(lang, true);
    words = I18N[lang].words; fillRow(m1, 2); fillRow(m2, 3); half1 = 0;
    closeLang(); measure();
  });
  document.addEventListener('click', closeLang);
  addEventListener('keydown', e => { if (e.key === 'Escape') closeLang(); });

  /* Reloj del entreno en vivo */
  let s = 32 * 60 + 14; const clk = document.getElementById('liveClock');
  setInterval(() => { s++; clk.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }, 1000);
})();
