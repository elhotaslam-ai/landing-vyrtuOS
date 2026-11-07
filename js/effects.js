/*
 * Efectos de movimiento: barra de scroll, paralaje, palabras que suben,
 * inclinación 3D (cubo y tarjetas), hoja de ruta y foco de luz.
 * Script clásico, sin dependencias. Solo actúa si hay JS y no se pide movimiento reducido.
 */
(function () {
  if (!document.documentElement.classList.contains("js")) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;

  var progress = document.querySelector(".progress");
  var orbs = Array.prototype.slice.call(document.querySelectorAll(".orb"));
  var spot = document.querySelector(".spot");

  // ---------- Partir los titulares en palabras (para revelarlas una a una) ----------
  function splitWords(root) {
    var idx = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(" "));
              return;
            }
            var w = document.createElement("span");
            w.className = "w";
            var inner = document.createElement("span");
            inner.textContent = part;
            inner.style.setProperty("--i", String(idx++));
            w.appendChild(inner);
            frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== "BR") {
          walk(child);
        }
      });
    })(root);
  }
  document.querySelectorAll("[data-words]").forEach(function (el) {
    splitWords(el);
    el.classList.add("reveal-words");
  });

  // ---------- Texto que se "descifra" (scramble) ----------
  var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/·";
  function scramble(el) {
    var final = el.textContent;
    if (reduce) return;
    var frames = 18;
    var f = 0;
    var t = setInterval(function () {
      f++;
      var out = "";
      for (var i = 0; i < final.length; i++) {
        var ch = final[i];
        if (ch === " " || i < (f / frames) * final.length) out += ch;
        else out += CHARS[Math.floor(Math.random() * CHARS.length)];
      }
      el.textContent = out;
      if (f >= frames) {
        clearInterval(t);
        el.textContent = final;
      }
    }, 38);
  }
  document.querySelectorAll("[data-scramble]").forEach(function (el) {
    // Arranca cuando el elemento aparece en pantalla.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          scramble(el);
          io.disconnect();
        }
      });
    });
    io.observe(el);
  });

  // ---------- Scroll: barra de progreso y paralaje de los orbes ----------
  var ticking = false;
  function onScroll() {
    ticking = false;
    var max = document.documentElement.scrollHeight - window.innerHeight || 1;
    var y = window.scrollY;
    if (progress) progress.style.transform = "scaleX(" + Math.min(1, y / max) + ")";
    if (!reduce) {
      orbs.forEach(function (o, i) {
        var dir = i % 2 ? -1 : 1;
        o.style.transform = "translate3d(0," + (y * (0.05 + i * 0.025) * dir) + "px,0)";
      });
    }
    updateRoad();
  }
  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true }
  );

  // ---------- Foco de luz que sigue al ratón ----------
  if (spot && fine && !reduce) {
    window.addEventListener("pointermove", function (e) {
      spot.style.transform = "translate3d(" + e.clientX + "px," + e.clientY + "px,0)";
      spot.classList.add("is-on");
    });
    document.addEventListener("pointerleave", function () {
      spot.classList.remove("is-on");
    });
  }

  // ---------- Cubo 3D: sigue al puntero en el hero ----------
  var rig = document.querySelector(".rig");
  var hero = document.querySelector(".hero");
  if (rig && hero && fine && !reduce) {
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      rig.style.transform = "rotateX(" + (-10 - y * 18) + "deg) rotateY(" + (-18 + x * 30) + "deg)";
    });
    hero.addEventListener("pointerleave", function () {
      rig.style.transform = "";
    });
  }

  // ---------- Tarjetas con inclinación 3D (solo las disponibles) ----------
  if (fine && !reduce) {
    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(800px) rotateX(" + (-y * 8) + "deg) rotateY(" + x * 10 + "deg) translateZ(0)";
      });
      card.addEventListener("pointerleave", function () {
        card.style.transform = "";
      });
    });
  }

  // ---------- Hoja de ruta: contadores, anillo y línea de progreso ----------
  var roadList = document.getElementById("road");
  var ring = document.getElementById("sumRing");
  var pct = document.getElementById("sumPct");
  var counts = {
    done: document.querySelectorAll(".it.done").length,
    doing: document.querySelectorAll(".it.doing").length,
    todo: document.querySelectorAll(".it.todo").length,
  };
  var total = counts.done + counts.doing + counts.todo;
  var donePct = total ? Math.round((counts.done / total) * 100) : 0;

  document.querySelectorAll("[data-sum]").forEach(function (el) {
    el.textContent = counts[el.getAttribute("data-sum")];
  });
  if (pct) pct.textContent = String(donePct);
  var sumWrap = document.querySelector(".summary .sum-ring");
  if (sumWrap) {
    var circumference = 314.16;
    sumWrap.style.setProperty("--off", String(circumference * (1 - donePct / 100)));
  }

  // Marca las fases en que estamos cuando entran en pantalla.
  var hitos = document.querySelectorAll(".hito");
  if ("IntersectionObserver" in window) {
    var hitoObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("lit");
            hitoObs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    hitos.forEach(function (h) { hitoObs.observe(h); });

    var ringObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          ringObs.disconnect();
        }
      });
    });
    if (sumWrap) ringObs.observe(sumWrap);
  } else {
    hitos.forEach(function (h) { h.classList.add("lit"); });
  }

  // Como la v2: lima hasta el final de la fase "ahora", blanco para lo que falta.
  var roadCutPct = 100;
  var roadTip = null;
  if (roadList) {
    roadTip = document.createElement("li");
    roadTip.className = "road-tip";
    roadTip.setAttribute("aria-hidden", "true");
    roadList.appendChild(roadTip);
  }

  function paintRoadCut() {
    if (!roadList) return;
    var line = roadList.querySelector(".road-line");
    var now = roadList.querySelector(".hito.now");
    var b = line && line.querySelector("b");
    if (!line || !now || !b) return;
    var lh = line.offsetHeight || 1;
    var cut = Math.max(0, Math.min(1, (now.offsetTop + now.offsetHeight + 11 - line.offsetTop) / lh)) * 100;
    roadCutPct = cut;
    b.style.background =
      "linear-gradient(var(--accent) 0, var(--acento-oscuro) " + cut + "%, #ffffff " + cut + "%, rgba(255,255,255,.8) 100%)";
  }

  function updateRoad() {
    if (!roadList) return;
    var r = roadList.getBoundingClientRect();
    var vh = window.innerHeight;
    var p = (vh * 0.6 - r.top) / (r.height || 1);
    var fill = Math.max(0, Math.min(1, p));
    var line = roadList.querySelector(".road-line b");
    if (line) line.style.setProperty("--p", String(fill));

    // La punta sigue el final de la raya; lima dentro de la fase en curso, blanca después.
    if (roadTip) {
      var lineEl = roadList.querySelector(".road-line");
      var lineTop = lineEl ? lineEl.offsetTop : 0;
      var lineH = lineEl ? lineEl.offsetHeight : 0;
      roadTip.style.transform = "translateY(" + (lineTop + fill * lineH) + "px)";
      roadTip.style.setProperty("--tip", fill * 100 <= roadCutPct ? "var(--accent)" : "#ffffff");
    }
  }
  paintRoadCut();
  window.addEventListener("resize", paintRoadCut, { passive: true });
  updateRoad();
  onScroll();

  // ---------- Transición entre páginas (cortina lima, como la v2) ----------
  // Al llegar, la página nueva lleva la clase "arrive" (puesta por el script del <head>)
  // y la cortina se retira; después se quita la clase para poder salir otra vez.
  if (document.documentElement.classList.contains("arrive")) {
    setTimeout(function () { document.documentElement.classList.remove("arrive"); }, 900);
  }
  if (!reduce) {
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || a.target === "_blank" || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      var href = a.getAttribute("href") || "";
      if (!/\.html(#|$)/.test(href)) return;
      e.preventDefault();
      document.body.classList.add("leaving");
      try { sessionStorage.setItem("vyrtu-wipe", "1"); } catch (err) {}
      setTimeout(function () { window.location.href = href; }, 520);
    });
    window.addEventListener("pageshow", function () { document.body.classList.remove("leaving"); });
  }
})();
