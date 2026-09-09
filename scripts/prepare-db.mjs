/**
 * Genera el cliente Prisma con el esquema que toque según DB_PROVIDER:
 *   - "postgres" → prisma/schema.postgres.prisma (ELO global en serverless)
 *   - cualquier otro valor (o ausencia) → prisma/schema.prisma (SQLite)
 *
 * Lo ejecuta el hook postinstall de package.json, la CI y el build de Vercel
 * (scripts/vercel-build.mjs). El resto del código no cambia: los modelos son
 * gemelos 1:1 en ambos esquemas.
 */
import { spawnSync } from "node:child_process";

const pg = process.env.DB_PROVIDER === "postgres";
const schema = pg ? "prisma/schema.postgres.prisma" : "prisma/schema.prisma";

console.log(`[prepare-db] DB_PROVIDER=${process.env.DB_PROVIDER ?? "(sqlite por defecto)"} → ${schema}`);
const res = spawnSync("npx", ["prisma", "generate", "--schema", schema], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exit(res.status ?? 1);
