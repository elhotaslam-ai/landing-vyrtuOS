# Especificación de diseño — referencia: getartcraft.com (home)

Análisis de **solo la página principal** para extraer estructura y patrones. No se copian textos, imágenes, logos ni código. Lo que aquí se describe es un patrón visual genérico; la implementación de Vyrtu usa copy, tokens y componentes propios.

**Método:** lectura del DOM con `getComputedStyle` y `getBoundingClientRect` (valores exactos, medidos a ~780 px de ancho), más capturas del navegador integrado en `docs/capturas-referencia/`. Las medidas de escritorio son estimaciones a partir de las capturas, no medidas exactas. Los estados hover y las duraciones de animación no se han medido.

---

## 1. Orden de secciones

| # | Sección | Contenido observado |
|---|---|---|
| 1 | Navbar fija | Logo, navegación en mono, toggle de tema, CTA sólido a la derecha. Se colapsa a menú hamburguesa en móvil. |
| 2 | Hero | Marca grande a pantalla casi completa, titular corto, subtítulo de 2–3 líneas, dos botones (sólido + contorno), enlace secundario y microtexto de plataformas. |
| 3 | Lista de productos ("lineup") | Etiqueta de sección, titular grande, párrafo, dos botones, luego rejilla de tarjetas con filtro de categoría implícito. |
| 4 | Bloque "Próximamente" | Titular corto con énfasis en una palabra y CTA a comunidad. |
| 5 | Principios | Rejilla de 6 elementos (título + una frase). |
| 6 | Producto secundario | Bloque destacado con dos CTA. |
| 7 | CTA final | Titular con énfasis, párrafo breve, un botón sólido. |
| 8 | Footer | Marca, 3 columnas de enlaces y correo de contacto. |

Patrón a conservar: **etiqueta mono → titular grande → párrafo → acciones**, repetido en cada sección.

## 2. Tipografía

| Rol | Familia (observada) | Tamaño | Peso | Interlineado | Tracking |
|---|---|---|---|---|---|
| H1 (hero) | Archivo, sans grotesca | 36 px (escritorio mayor) | 620 | 37.8 px (≈1.05) | −1.08 px (≈ −0.03 em) |
| H2 (sección) | Archivo | 60 px | 620 | 61.2 px (≈1.02) | −2.1 px (≈ −0.035 em) |
| H3 (tarjeta) | Inter | 16 px | 400 | 16 px | normal |
| Párrafo | Inter | 16 px | 400 | 24 px (1.5) | normal |
| Etiqueta / botón / nav | Geist Mono | 11 px | 500–700 | 16.5 px | 1.32–1.65 px (≈ 0.12–0.15 em) |

Reglas:
- Titulares en familia grotesca con peso medio-alto y tracking negativo.
- Todo lo funcional (navegación, etiquetas, botones, estados) en **mono, mayúsculas**, tamaño pequeño y tracking amplio.
- Cuerpo en sans regular.

## 3. Espaciado y color

- Escala observada en múltiplos de 4 (4, 8, 16, 24, 32).
- Botones: `padding: 0 24px`, altura ≈ 44 px (estimado en captura).
- Margen superior del titular del hero: 32 px.
- Colores (medidos): fondo ≈ `#121316`, texto claro ≈ `#F2F1EE`, bordes de contorno blanco al 40 % de opacidad.
- Sin radios: `border-radius: 0` en botones, tarjetas e imágenes. Bordes de 1 px en tono muy bajo.

## 4. Tarjetas

- Sin fondo ni borde propio; la imagen de producto es el protagonista.
- Orden interno: etiqueta de categoría (mono) → imagen (captura de la app, ratio ≈ 16:10 estimado) → nombre (H3, 16 px) → descripción de 1–2 líneas → chips de estado (mono) → plataformas (mono) → enlace "Explorar".
- Rejilla: 4 columnas a ~780 px de ancho (observado), 1 columna en móvil.
- Estados de producto en chips: "En desarrollo", "Próximamente", "Early alpha", "Installers ready". Son texto plano, sin color de acento.

## 5. Botones

- **Primario:** fondo blanco, texto negro, mono 700, 11 px, mayúsculas, sin radio, icono a la izquierda, `padding 0 24px`.
- **Secundario:** fondo transparente, borde 0.67 px blanco al 40 %, texto claro, misma tipografía.
- Hover y focus: **no verificados**. En Vyrtu se definen con cambio de opacidad/borde y anillo de foco visible.

## 6. Animaciones (observadas)

- **Revelado al hacer scroll:** los bloques aparecen con opacidad 0→1, desplazamiento vertical corto y desenfoque (blur) que se resuelve. Se dispara al entrar en viewport.
- **Hero:** la marca grande tiene un brillo/destello que recorre el logotipo; fondo con gradiente animado muy sutil.
- **Navegación lateral del hero:** índice vertical con marcas numeradas (0, 5…) que sirve de guía de scroll.
- Duraciones y curvas: **no medidas**. En Vyrtu: 600–700 ms, `cubic-bezier(0.2, 0.7, 0.2, 1)`, y se desactiva con `prefers-reduced-motion`.

## 7. Responsive

- Hasta ~780 px: la navegación se reduce a logo + tema + hamburguesa; los botones del hero pasan a ancho completo y se apilan.
- Titulares: H2 de 60 px a un tamaño fluido (≈ 36–44 px en móvil).
- Rejilla: 4 → 2 → 1 columnas según ancho.
- Gutter lateral del contenedor: 16 px en móvil (estimado).
- Sin scroll horizontal.

## 8. Capturas de referencia

- `docs/capturas-referencia/01-hero-escritorio.jpg` — hero en escritorio.
- `docs/capturas-referencia/02-hero-movil.jpg` — hero en móvil (menú hamburguesa, botones apilados).
- `docs/capturas-referencia/03-botones-cta.jpg` — botón sólido vs. contorno.
- `docs/capturas-referencia/04-revelado-scroll.jpg` — bloque en mitad de la animación de desenfoque.
- `docs/capturas-referencia/05-rejilla-apps.jpg` — rejilla de tarjetas durante el revelado.

Estas capturas son solo para esta especificación. No se incluyen en `public/` ni en el build.

---

## 9. Decisiones para Vyrtu (aplicación del patrón, sin copiar)

| Aspecto | Decisión |
|---|---|
| Paleta | Tokens propios: fondo `#0A0A0A`, superficie `#151515`, borde `#292929`, texto `#F5F5F5`, secundario `#929292`, acento `#C6FF3D`. |
| Tipografía | Titulares: Inter Tight 600–700, tracking −0.03 em. Cuerpo: Inter 16/24. Etiquetas y botones: JetBrains Mono, mayúsculas, tracking 0.12 em. |
| Radios | 0 en botones y tarjetas (igual que la referencia). Excepción: campos del formulario, 2 px. |
| Botón primario | Fondo acento `#C6FF3D`, texto negro. Secundario: borde `#292929`, texto claro, hover con borde acento. |
| Tarjetas | Superficie `#151515`, borde `#292929`, padding 24 px. Chips de estado con borde, sin fondo de color. |
| Animación | Revelado con fade + desenfoque leve. `prefers-reduced-motion` la desactiva. |
| Responsive | Breakpoints Tailwind (`md` 768, `lg` 1024). Menú móvil desplegable. |
| Contenido | Copy original en español. Ninguna imagen, logo ni texto de ArtCraft. |
