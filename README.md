# Vyrtu Corporation: landing v3

Web estática: HTML, CSS y JavaScript, sin frameworks ni build.

## Abrir

Doble clic en `index.html`. Funciona sin servidor.

## Activar la lista de espera (Supabase)

1. Ejecutar `supabase/migrations/20261107000000_waitlist.sql` en el SQL Editor.
2. Copiar `.env.example` a `.env` y rellenar `SUPABASE_URL` y `SUPABASE_ANON_KEY`
   (Project Settings → API). Usar solo la clave anon/publishable, nunca la service_role.
3. Generar la configuración de la web:

   ```bash
   node scripts/generar-config.mjs
   ```

   Esto escribe `js/config.js` a partir de `.env`. Hay que repetirlo cada vez que cambies `.env`.

`.env` está en `.gitignore`, así que no se sube al repositorio. Mientras los valores estén vacíos, el formulario aparece desactivado.

## Estructura

```
index.html          Landing (navbar, hero, 01 Productos, 02 Principios,
                    03 Próximamente + formulario, CTA, footer)
privacidad.html     Política de privacidad
css/styles.css      Tokens (:root), tipografía, botones, tarjetas, revelado
js/config.js        Configuración pública de Supabase
js/waitlist.js      Validación y alta en la tabla waitlist (fetch a PostgREST)
js/main.js          Menú móvil, revelado por scroll, envío del formulario
favicon.svg
supabase/migrations/  Tabla waitlist con RLS (anon solo INSERT)
docs/               Especificación de diseño y capturas de referencia (no se publican)
```

## Pendiente antes de publicar

- Completar en `privacidad.html` la razón social, CIF y datos de contacto (marcado PENDIENTE).
- Revisar el texto legal con un asesor.
- Sustituir el copy provisional por el definitivo.
