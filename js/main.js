/*
 * Comportamiento de la landing: menú móvil, revelado por scroll y formulario.
 * Script clásico (sin módulos) para que funcione abriendo index.html directamente.
 */
(function () {
  document.documentElement.classList.add("js");

  // ---------- Menú móvil ----------
  var toggle = document.querySelector(".nav__toggle");
  var menu = document.getElementById("menu-movil");

  function setMenu(abierto) {
    toggle.setAttribute("aria-expanded", String(abierto));
    toggle.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
    menu.hidden = !abierto;
  }

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") setMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  // ---------- Barra superior: indicador de vidrio líquido ----------
  var navR = document.querySelector(".nav-r");
  var ind = navR && navR.querySelector(".lg-indicator");
  if (navR && ind) {
    var enlaces = Array.prototype.slice.call(navR.querySelectorAll(".navlink"));
    var actual = null; // enlace bajo la lente
    var sitio = null;  // enlace de la sección en la que estás

    function visible(el) {
      return el && el.offsetParent !== null;
    }

    function mover(el, instantaneo) {
      if (!visible(el)) {
        ind.style.opacity = "0";
        actual = null;
        return;
      }
      if (instantaneo) ind.classList.add("no-anim");
      ind.style.opacity = "1";
      ind.style.transform = "translate3d(" + el.offsetLeft + "px," + el.offsetTop + "px,0)";
      ind.style.width = el.offsetWidth + "px";
      ind.style.height = el.offsetHeight + "px";
      if (instantaneo) {
        void ind.offsetWidth; // aplicar sin transición
        ind.classList.remove("no-anim");
      } else {
        ind.classList.remove("is-moving");
        void ind.offsetWidth;
        ind.classList.add("is-moving");
        setTimeout(function () { ind.classList.remove("is-moving"); }, 560);
      }
      actual = el;
    }

    function marcarSitio(el) {
      enlaces.forEach(function (e) { e.classList.toggle("is-current", e === el); });
      sitio = el;
    }

    enlaces.forEach(function (e) {
      e.addEventListener("pointerenter", function () { mover(e, false); });
      e.addEventListener("focus", function () { mover(e, false); });
      e.addEventListener("blur", function () { mover(sitio, false); });
    });
    navR.addEventListener("pointerleave", function () { mover(sitio, false); });

    // Sección activa según el scroll (solo en la página principal)
    var secciones = ["productos", "principios", "proximamente", "lista"];
    var porId = {};
    enlaces.forEach(function (e) {
      var h = e.getAttribute("href") || "";
      if (h.charAt(0) === "#") porId[h.slice(1)] = e;
    });
    var actualPage = navR.querySelector(".navlink[aria-current='page']");
    if (actualPage) marcarSitio(actualPage);
    if ("IntersectionObserver" in window && !actualPage) {
      var ioSec = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (en.isIntersecting && porId[en.target.id]) {
            marcarSitio(porId[en.target.id]);
            if (!navR.matches(":hover")) mover(sitio, false);
          }
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      secciones.forEach(function (id) {
        var s = document.getElementById(id);
        if (s) ioSec.observe(s);
      });
    }

    // Reflejo que sigue al cursor dentro de la lente
    navR.addEventListener("pointermove", function (e) {
      var r = ind.getBoundingClientRect();
      ind.style.setProperty("--px", (e.clientX - r.left) + "px");
      ind.style.setProperty("--py", (e.clientY - r.top) + "px");
    });
    // Al pulsar, la lente se deforma como un líquido
    var pulsar = function () { ind.classList.add("is-pressed"); };
    var soltar = function () { ind.classList.remove("is-pressed"); };
    navR.addEventListener("pointerdown", pulsar);
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);

    mover(sitio, true);
    window.addEventListener("resize", function () { mover(actual || sitio, true); }, { passive: true });
  }

  // ---------- Revelado por scroll ----------
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach(function (el) { obs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  // ---------- Formulario de lista de espera ----------
  var form = document.getElementById("wl-form");
  if (!form || !window.VyrtuWaitlist) return;

  var submit = document.getElementById("wl-submit");
  var status = document.getElementById("wl-status");
  var success = document.getElementById("wl-success");
  var emailInput = document.getElementById("wl-email");

  var errorEls = {
    email: document.getElementById("wl-email-error"),
    interes: document.getElementById("wl-interes-error"),
    consentimiento: document.getElementById("wl-consent-error"),
  };

  function mostrarErrores(errores) {
    Object.keys(errorEls).forEach(function (campo) {
      var el = errorEls[campo];
      var texto = errores[campo] || "";
      el.textContent = texto;
      el.hidden = !texto;
    });
    emailInput.setAttribute("aria-invalid", String(Boolean(errores.email)));
  }

  function setStatus(texto, esError) {
    status.textContent = texto;
    status.className = "form__status" + (esError ? " form__status--error" : "");
  }

  // Opciones no disponibles (NutriOS, Ropa): al pulsarlas, aviso en lugar de seleccionar.
  var aviso = document.getElementById("wl-disponible");
  document.querySelectorAll(".choice--off").forEach(function (label) {
    label.addEventListener("click", function (e) {
      e.preventDefault();
      aviso.textContent = label.getAttribute("data-no-disponible") + " no está disponible todavía. Por ahora solo puedes apuntarte a VyrtuOS.";
      aviso.hidden = false;
    });
  });
  form.addEventListener("change", function () {
    aviso.hidden = true;
  });

  // Si no hay configuración de Supabase, el formulario no se puede enviar todavía.
  if (!window.VyrtuWaitlist.configurado()) {
    submit.disabled = true;
    setStatus("Lista de espera pendiente de configurar. Vuelve pronto.", false);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    setStatus("", false);

    var datos = new FormData(form);

    // Honeypot: si el campo oculto tiene texto, es un bot. Fingimos éxito.
    if (datos.get("website")) {
      mostrarExito();
      return;
    }

    var resultado = window.VyrtuWaitlist.validar({
      email: datos.get("email"),
      interes: datos.get("interes"),
      consentimiento: datos.get("consentimiento") === "on",
    });

    mostrarErrores(resultado.errores);
    if (!resultado.valido) {
      // Enfocar el primer campo con error.
      var primero = resultado.errores.email ? emailInput
        : resultado.errores.interes ? form.querySelector('input[name="interes"]')
        : form.querySelector('input[name="consentimiento"]');
      primero.focus();
      return;
    }

    submit.disabled = true;
    submit.textContent = "Enviando…";

    window.VyrtuWaitlist.apuntar(resultado.email, datos.get("interes"))
      .then(function (estado) {
        if (estado === "duplicado") {
          setStatus("Ese email ya estaba apuntado a esa opción.", false);
          restaurarBoton();
        } else {
          mostrarExito();
        }
      })
      .catch(function () {
        setStatus("No hemos podido guardarlo. Inténtalo de nuevo en un momento.", true);
        restaurarBoton();
      });
  });

  function restaurarBoton() {
    submit.disabled = false;
    submit.textContent = "Apuntarme";
  }

  function mostrarExito() {
    form.hidden = true;
    success.hidden = false;
    success.focus();
  }
})();
