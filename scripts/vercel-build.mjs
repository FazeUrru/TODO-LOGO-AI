/**
 * Build de producción para Vercel (v1.12.0):
 *   1. Genera el cliente Prisma según DB_PROVIDER (scripts/prepare-db.mjs).
 *   2. Con Postgres y DATABASE_URL presentes, sincroniza el esquema
 *      (prisma db push) contra la base gestionada (Neon / Vercel Postgres).
 *      Si falta DATABASE_URL, avisa y continúa: la app arranca y /api/health
 *      lo reportará con checks.database = "down".
 *   3. Compila `next build`.
 *
 * Configurar en vercel.json → buildCommand.
 */
import { spawnSync } from "node:child_process";

function run(cmd, args, env) {
  const res = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...env },
  });
  if (res.status !== 0) process.exit(res.status ?? 1);
}

const pg = process.env.DB_PROVIDER === "postgres";
const tieneUrl = Boolean(process.env.DATABASE_URL);

// 1) Cliente Prisma del provider correcto (idempotente con el postinstall)
run("node", ["scripts/prepare-db.mjs"]);

// 2) Sincronizar el esquema contra Postgres gestionado
if (pg) {
  if (tieneUrl) {
    console.log("[vercel-build] DB_PROVIDER=postgres → prisma db push contra la base gestionada");
    run("npx", [
      "prisma", "db", "push",
      "--skip-generate",
      "--accept-data-loss",
      "--schema", "prisma/schema.postgres.prisma",
    ]);
  } else {
    console.warn(
      "[vercel-build] DB_PROVIDER=postgres pero falta DATABASE_URL: el esquema no se sincroniza. " +
        "Crea la base en Vercel → Storage → Postgres (o Neon) y añade DATABASE_URL."
    );
  }
}

// 3) Compilar
run("npx", ["next", "build"]);
