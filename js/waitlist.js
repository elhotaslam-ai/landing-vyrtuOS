/*
 * Lista de espera: validación y alta en la tabla `waitlist` de Supabase.
 * Usa la API REST de PostgREST con fetch; no hace falta librería ni build.
 * Expone window.VyrtuWaitlist.
 */
(function () {
  var EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;
  var MAX_EMAIL = 254;
  var INTERESES = ["vyrtuos", "nutrios", "ropa"];
  // Solo se puede elegir lo que ya está disponible. El resto muestra un aviso.
  var DISPONIBLES = ["vyrtuos"];
  var NOMBRES = { vyrtuos: "VyrtuOS", nutrios: "NutriOS", ropa: "Ropa" };

  // Devuelve { valido, errores, email } con mensajes en español.
  function validar(datos) {
    var errores = {};
    var email = (datos.email || "").trim();

    if (!email) {
      errores.email = "Introduce tu email.";
    } else if (email.length > MAX_EMAIL || !EMAIL_RE.test(email)) {
      errores.email = "Revisa el formato del email.";
    }

    if (!datos.interes) {
      errores.interes = "Elige una opción.";
    } else if (DISPONIBLES.indexOf(datos.interes) === -1) {
      errores.interes = NOMBRES[datos.interes] + " no está disponible todavía.";
    }

    if (!datos.consentimiento) {
      errores.consentimiento = "Necesitamos tu acuerdo para guardar el email.";
    }

    return {
      valido: Object.keys(errores).length === 0,
      errores: errores,
      email: email.toLowerCase(),
    };
  }

  // Resuelve 'ok' | 'duplicado'. Lanza error si no hay configuración o falla la red.
  function apuntar(email, interes) {
    var cfg = window.VYRTU_CONFIG || {};
    var url = (cfg.SUPABASE_URL || "").replace(/\/+$/, "");
    var key = cfg.SUPABASE_ANON_KEY || "";

    if (!url || !key) {
      return Promise.reject(new Error("CONFIG"));
    }

    return fetch(url + "/rest/v1/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: "Bearer " + key,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ email: email, interest: interes }),
    }).then(function (res) {
      // PostgREST devuelve 409 cuando salta la restricción única (email + interés).
      if (res.status === 409) return "duplicado";
      if (!res.ok) throw new Error("HTTP " + res.status);
      return "ok";
    });
  }

  window.VyrtuWaitlist = {
    INTERESES: INTERESES,
    DISPONIBLES: DISPONIBLES,
    NOMBRES: NOMBRES,
    validar: validar,
    apuntar: apuntar,
    configurado: function () {
      var cfg = window.VYRTU_CONFIG || {};
      return Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
    },
  };
})();
