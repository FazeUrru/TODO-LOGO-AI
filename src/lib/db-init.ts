import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Auto-inicialización del esquema SQLite en entornos efímeros.
 *
 * En serverless (Vercel) el sistema de archivos de escritura es /tmp y cada
 * instancia arranca con una base vacía: este módulo crea las tablas con
 * CREATE TABLE IF NOT EXISTS en el arranque del proceso (hook register() de
 * Next, src/instrumentation.ts). En entornos persistentes (local, Docker,
 * VPS) la base ya existe y las sentencias son un no-op barato.
 *
 * Se ejecuta UNA vez por proceso (bandera en globalThis).
 */

const g = globalThis as unknown as { __todologoSchemaReady?: Promise<void> };

async function createSchema(): Promise<void> {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Vote" (
        "id"        TEXT     PRIMARY KEY,
        "battleId"  TEXT     NOT NULL,
        "modelAId"  TEXT     NOT NULL,
        "modelBId"  TEXT     NOT NULL,
        "winner"    TEXT     NOT NULL,
        "category"  TEXT     NOT NULL DEFAULT 'global',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIME
      );
    `);
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "Vote_modelAId_idx" ON "Vote"("modelAId");`
    );
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "Vote_modelBId_idx" ON "Vote"("modelBId");`
    );
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "Vote_createdAt_idx" ON "Vote"("createdAt");`
    );

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AgentRun" (
        "id"          TEXT     PRIMARY KEY,
        "description" TEXT     NOT NULL,
        "projectType" TEXT     NOT NULL,
        "autonomy"    TEXT     NOT NULL,
        "budget"      TEXT     NOT NULL,
        "status"      TEXT     NOT NULL DEFAULT 'planificado',
        "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIME
      );
    `);
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "AgentRun_createdAt_idx" ON "AgentRun"("createdAt");`
    );

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id"           TEXT     PRIMARY KEY,
        "email"        TEXT     NOT NULL UNIQUE,
        "name"         TEXT     NOT NULL,
        "passwordHash" TEXT,
        "provider"     TEXT     NOT NULL DEFAULT 'email',
        "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIME
      );
    `);

    logger.info("db.schema_ready", {});
  } catch (err) {
    logger.warn("db.schema_init_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Promesa compartida que garantiza el esquema antes de usar la base. */
export function ensureSchema(): Promise<void> {
  if (!g.__todologoSchemaReady) {
    g.__todologoSchemaReady = createSchema();
  }
  return g.__todologoSchemaReady;
}
