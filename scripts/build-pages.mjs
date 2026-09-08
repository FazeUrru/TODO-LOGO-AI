#!/usr/bin/env node
/**
 * Build estático de todólogo.ai para GitHub Pages.
 *
 * 1. Aparta temporalmente src/app/api (los route handlers no son exportables).
 * 2. Ejecuta `next build` con BUILD_STATIC=1 → export en .next-static/out.
 * 3. Restaura siempre las APIs (incluso si el build falla).
 * 4. Copia .nojekyll (GitHub Pages ignoraría _next/ por Jekyll) y 404.html.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const API_DIR = path.join(ROOT, "src", "app", "api");
const API_HIDDEN = path.join(ROOT, ".pages-api-hidden");

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(path.join(ROOT, "src", "app"))) fail("Ejecuta este script desde la raíz del proyecto.");

const moved = fs.existsSync(API_DIR);
if (moved) {
  fs.renameSync(API_DIR, API_HIDDEN);
  console.log("→ src/app/api apartado temporalmente");
}

try {
  execSync("bunx next build", {
    stdio: "inherit",
    env: { ...process.env, BUILD_STATIC: "1" },
  });
} finally {
  if (moved && fs.existsSync(API_HIDDEN)) {
    fs.renameSync(API_HIDDEN, API_DIR);
    console.log("→ src/app/api restaurado");
  }
}

/* Localiza el HTML exportado (según versión cae en .next-static/out o en .next-static) */
const OUT_CANDIDATES = [path.join(ROOT, ".next-static", "out"), path.join(ROOT, ".next-static")];
const OUT_DIR = OUT_CANDIDATES.find((p) => fs.existsSync(path.join(p, "index.html")));
if (!OUT_DIR) fail("El export estático no generó HTML (falta index.html)");

fs.writeFileSync(path.join(OUT_DIR, ".nojekyll"), "");
const notFound = path.join(OUT_DIR, "404.html");
if (!fs.existsSync(notFound) && fs.existsSync(path.join(OUT_DIR, "index.html"))) {
  fs.copyFileSync(path.join(OUT_DIR, "index.html"), notFound);
}

console.log(`✓ Export estático listo en ${path.relative(ROOT, OUT_DIR)} (${fs.readdirSync(OUT_DIR).length} entradas)`);
