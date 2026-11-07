// Lee .env y genera js/config.js para que la web lo use.
// Uso: node scripts/generar-config.mjs
// No necesita librerías: solo Node.js.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const rutaEnv = join(raiz, ".env");
const rutaSalida = join(raiz, "js", "config.js");

if (!existsSync(rutaEnv)) {
  console.error("No encuentro .env. Cópialo desde .env.example y rellénalo.");
  process.exit(1);
}

// Parser mínimo: líneas CLAVE=valor, ignora comentarios y líneas vacías.
const variables = {};
for (const linea of readFileSync(rutaEnv, "utf8").split(/\r?\n/)) {
  const limpia = linea.trim();
  if (!limpia || limpia.startsWith("#")) continue;
  const i = limpia.indexOf("=");
  if (i === -1) continue;
  variables[limpia.slice(0, i).trim()] = limpia.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}

const url = variables.SUPABASE_URL || "";
const anon = variables.SUPABASE_ANON_KEY || "";

// Si es un JWT, miramos el campo "role" del payload: anon/authenticated sí, service_role no.
function rolDeJwt(token) {
  const partes = token.split(".");
  if (partes.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(partes[1], "base64url").toString("utf8")).role ?? null;
  } catch {
    return null;
  }
}
const rol = rolDeJwt(anon);

if (rol === "service_role" || anon.startsWith("sb_secret_")) {
  console.error("ERROR: en SUPABASE_ANON_KEY hay una clave secreta (service_role). Usa la clave anon/publishable.");
  process.exit(1);
}

const contenido = `// Generado por scripts/generar-config.mjs a partir de .env. No editar a mano.
// La clave anon es pública; la seguridad la dan las políticas RLS de Supabase.
window.VYRTU_CONFIG = {
  SUPABASE_URL: ${JSON.stringify(url)},
  SUPABASE_ANON_KEY: ${JSON.stringify(anon)},
};
`;

writeFileSync(rutaSalida, contenido, "utf8");

if (!url || !anon) {
  console.log("js/config.js generado, pero faltan valores en .env: el formulario seguirá desactivado.");
} else {
  console.log("js/config.js generado con la URL y la clave anon de .env.");
}
