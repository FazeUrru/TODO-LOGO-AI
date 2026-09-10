import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Auto-inicialización del esquema en entornos efímeros (v1.12.0).
 *
 * En serverless (Vercel) sin base gestionada, cada instancia arranca con un
 * sistema de archivos efímero: este módulo crea las tablas con
 * CREATE TABLE IF NOT EXISTS en el arranque (hook register() de Next,
 * src/instrumentation.ts). En entornos persistentes (local, Docker, VPS,
 * Postgres gestionado) la base ya existe y las sentencias son un no-op barato.
 *
 * v1.12.0: consciente de dialecto (SQLite/PostgreSQL) y completo: cubre las
 * seis tablas del esquema, incluidas EloState (ELO global), CopaCampeon
 * (Salón de la Fama) y ProfileEvent (historial del perfil), más las columnas
 * de perfil de User añadidas en v1.9.2 para bases creadas antes de esa
 * versión. v1.13.0: añade CopaSesion (copas persistentes entre reinicios).
 *
 * Se ejecuta UNA vez por proceso (bandera en globalThis).
 */

const g = globalThis as unknown as { __todologoSchemaReady?: Promise<void> };

/** ¿Dialecto PostgreSQL? DB_PROVIDER gana; si no, se deduce de DATABASE_URL. */
function esPostgres(): boolean {
  if (process.env.DB_PROVIDER === "postgres") return true;
  if (process.env.DB_PROVIDER) return false;
  return /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL ?? "");
}

const PG = esPostgres();
const TS = PG ? "TIMESTAMPTZ NOT NULL DEFAULT now()" : "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP";

async function crearTabla(nombre: string, ddl: string): Promise<void> {
  await db.$executeRawUnsafe(ddl);
}

async function addColumnSiFalta(tabla: string, columna: string, def: string): Promise<void> {
  try {
    if (PG) {
      await db.$executeRawUnsafe(`ALTER TABLE "${tabla}" ADD COLUMN IF NOT EXISTS "${columna}" ${def};`);
      return;
    }
    // SQLite: no tiene IF NOT EXISTS; comprobamos la columna en table_info
    const cols = (await db.$queryRawUnsafe<{ name: string }[]>(
      `PRAGMA table_info("${tabla}");`
    )) as { name: string }[];
    if (Array.isArray(cols) && cols.some((c) => c.name === columna)) return;
    await db.$executeRawUnsafe(`ALTER TABLE "${tabla}" ADD COLUMN "${columna}" ${def};`);
  } catch {
    /* columna ya presente o migración concurrente: continuar */
  }
}

async function createSchema(): Promise<void> {
  try {
    await crearTabla(
      "Vote",
      `CREATE TABLE IF NOT EXISTS "Vote" (
        "id"        TEXT PRIMARY KEY,
        "battleId"  TEXT NOT NULL,
        "modelAId"  TEXT NOT NULL,
        "modelBId"  TEXT NOT NULL,
        "winner"    TEXT NOT NULL,
        "category"  TEXT NOT NULL DEFAULT 'global',
        "createdAt" ${TS}
      );`
    );
    for (const [idx, col] of [
      ["Vote_modelAId_idx", "modelAId"],
      ["Vote_modelBId_idx", "modelBId"],
      ["Vote_createdAt_idx", "createdAt"],
    ] as const) {
      await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "${idx}" ON "Vote"("${col}");`);
    }

    await crearTabla(
      "AgentRun",
      `CREATE TABLE IF NOT EXISTS "AgentRun" (
        "id"          TEXT PRIMARY KEY,
        "description" TEXT NOT NULL,
        "projectType" TEXT NOT NULL,
        "autonomy"    TEXT NOT NULL,
        "budget"      TEXT NOT NULL,
        "status"      TEXT NOT NULL DEFAULT 'planificado',
        "createdAt"   ${TS}
      );`
    );
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "AgentRun_createdAt_idx" ON "AgentRun"("createdAt");`
    );

    await crearTabla(
      "User",
      `CREATE TABLE IF NOT EXISTS "User" (
        "id"           TEXT PRIMARY KEY,
        "email"        TEXT NOT NULL UNIQUE,
        "name"         TEXT NOT NULL,
        "passwordHash" TEXT,
        "provider"     TEXT NOT NULL DEFAULT 'email',
        "createdAt"    ${TS}
      );`
    );

    await crearTabla(
      "EloState",
      `CREATE TABLE IF NOT EXISTS "EloState" (
        "modelId"   TEXT PRIMARY KEY,
        "elo"       ${PG ? "DOUBLE PRECISION" : "REAL"} NOT NULL DEFAULT 1000,
        "wins"      INTEGER NOT NULL DEFAULT 0,
        "losses"    INTEGER NOT NULL DEFAULT 0,
        "ties"      INTEGER NOT NULL DEFAULT 0,
        "battles"   INTEGER NOT NULL DEFAULT 0,
        "updatedAt" ${TS}
      );`
    );
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EloState_elo_idx" ON "EloState"("elo");`);

    // ELO de las arenas generativas (v1.19.0): dimensión por modalidad
    await crearTabla(
      "EloArena",
      `CREATE TABLE IF NOT EXISTS "EloArena" (
        "id"        TEXT PRIMARY KEY,
        "modelId"   TEXT NOT NULL,
        "arena"     TEXT NOT NULL,
        "elo"       ${PG ? "DOUBLE PRECISION" : "REAL"} NOT NULL DEFAULT 1000,
        "wins"      INTEGER NOT NULL DEFAULT 0,
        "losses"    INTEGER NOT NULL DEFAULT 0,
        "ties"      INTEGER NOT NULL DEFAULT 0,
        "battles"   INTEGER NOT NULL DEFAULT 0,
        "updatedAt" ${TS}
      );`
    );
    await db.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "EloArena_modelId_arena_key" ON "EloArena"("modelId", "arena");`
    );
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "EloArena_arena_elo_idx" ON "EloArena"("arena", "elo");`
    );

    await crearTabla(
      "CopaCampeon",
      `CREATE TABLE IF NOT EXISTS "CopaCampeon" (
        "id"              TEXT PRIMARY KEY,
        "copaId"          TEXT NOT NULL UNIQUE,
        "prompt"          TEXT NOT NULL,
        "size"            INTEGER NOT NULL DEFAULT 4,
        "championModelId" TEXT NOT NULL,
        "championName"    TEXT NOT NULL,
        "runnerUpModelId" TEXT,
        "runnerUpName"    TEXT,
        "createdAt"       ${TS}
      );`
    );
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "CopaCampeon_createdAt_idx" ON "CopaCampeon"("createdAt");`
    );

    await crearTabla(
      "ProfileEvent",
      `CREATE TABLE IF NOT EXISTS "ProfileEvent" (
        "id"      TEXT PRIMARY KEY,
        "userId"  TEXT NOT NULL,
        "campo"   TEXT NOT NULL,
        "detalle" TEXT NOT NULL DEFAULT '',
        "at"      ${TS}
      );`
    );
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "ProfileEvent_userId_at_idx" ON "ProfileEvent"("userId", "at");`
    );

    await crearTabla(
      "CopaSesion",
      `CREATE TABLE IF NOT EXISTS "CopaSesion" (
        "id"        TEXT PRIMARY KEY,
        "size"      INTEGER NOT NULL DEFAULT 4,
        "datos"     TEXT NOT NULL,
        "createdAt" ${TS},
        "updatedAt" ${TS}
      );`
    );
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "CopaSesion_updatedAt_idx" ON "CopaSesion"("updatedAt");`
    );

    // Canal Todólogo Labs (v1.14.0): espejo de features + telemetría
    await crearTabla(
      "LabsFeature",
      `CREATE TABLE IF NOT EXISTS "LabsFeature" (
        "id"        TEXT PRIMARY KEY,
        "nombre"    TEXT NOT NULL,
        "cohorte"   TEXT NOT NULL,
        "estado"    TEXT NOT NULL DEFAULT 'en-pruebas',
        "expira"    ${PG ? "TIMESTAMPTZ" : "DATETIME"},
        "createdAt" ${TS}
      );`
    );
    await crearTabla(
      "LabsEvent",
      `CREATE TABLE IF NOT EXISTS "LabsEvent" (
        "id"        TEXT PRIMARY KEY,
        "featureId" TEXT NOT NULL,
        "userId"    TEXT NOT NULL DEFAULT 'anon',
        "tipo"      TEXT NOT NULL,
        "payload"   TEXT,
        "createdAt" ${TS}
      );`
    );
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "LabsEvent_featureId_createdAt_idx" ON "LabsEvent"("featureId", "createdAt");`
    );
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "LabsEvent_tipo_idx" ON "LabsEvent"("tipo");`
    );

    // Duelos y copas compartidas por URL permanente (v1.18.0)
    await crearTabla(
      "DueloGuardado",
      `CREATE TABLE IF NOT EXISTS "DueloGuardado" (
        "id"           TEXT PRIMARY KEY,
        "tipo"         TEXT NOT NULL DEFAULT 'duelo',
        "prompt"       TEXT NOT NULL,
        "category"     TEXT NOT NULL DEFAULT 'global',
        "composerMode" TEXT NOT NULL DEFAULT 'texto',
        "modelAId"     TEXT NOT NULL,
        "modelBId"     TEXT,
        "textoA"       TEXT NOT NULL,
        "textoB"       TEXT,
        "ganador"      TEXT,
        "copaId"       TEXT,
        "createdAt"    ${TS}
      );`
    );
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "DueloGuardado_createdAt_idx" ON "DueloGuardado"("createdAt");`
    );
    // Contadores del muro de replays (v1.19.0) para bases creadas antes
    await addColumnSiFalta("DueloGuardado", "shares", "INTEGER NOT NULL DEFAULT 0");
    await addColumnSiFalta("DueloGuardado", "views", "INTEGER NOT NULL DEFAULT 0");
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "DueloGuardado_shares_idx" ON "DueloGuardado"("shares");`
    );

    // ELO de jurado (v1.20.0): el ranking de las personas que votan
    await crearTabla(
      "UserElo",
      `CREATE TABLE IF NOT EXISTS "UserElo" (
        "userId"     TEXT PRIMARY KEY,
        "elo"        ${PG ? "DOUBLE PRECISION" : "REAL"} NOT NULL DEFAULT 1000,
        "votos"      INTEGER NOT NULL DEFAULT 0,
        "aciertos"   INTEGER NOT NULL DEFAULT 0,
        "racha"      INTEGER NOT NULL DEFAULT 0,
        "mejorRacha" INTEGER NOT NULL DEFAULT 0,
        "ultimoDia"  TEXT,
        "updatedAt"  ${TS}
      );`
    );
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "UserElo_elo_idx" ON "UserElo"("elo");`
    );

    // Claves API personales (v1.20.0 — API pública v2)
    await crearTabla(
      "ApiKey",
      `CREATE TABLE IF NOT EXISTS "ApiKey" (
        "id"         TEXT PRIMARY KEY,
        "key"        TEXT NOT NULL UNIQUE,
        "name"       TEXT NOT NULL,
        "userId"     TEXT NOT NULL,
        "calls"      INTEGER NOT NULL DEFAULT 0,
        "lastUsedAt" ${PG ? "TIMESTAMPTZ" : "DATETIME"},
        "revoked"    BOOLEAN NOT NULL DEFAULT FALSE,
        "createdAt"  ${TS}
      );`
    );
    await db.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "ApiKey_userId_idx" ON "ApiKey"("userId");`
    );


    // Columnas de perfil (v1.9.2) para bases creadas antes de esa versión
    const B = PG ? "BOOLEAN" : "BOOLEAN";
    const perfilCols: [string, string][] = [
      ["displayName", "TEXT"],
      ["username", "TEXT"],
      ["bio", "TEXT"],
      ["avatar", "TEXT"],
      ["accent", "TEXT"],
      ["pronouns", "TEXT"],
      ["location", "TEXT"],
      ["website", "TEXT"],
      ["focus", "TEXT"],
      ["publicProfile", B],
      ["showStats", B],
      ["showTrophies", B],
      ["weeklyDigest", B],
      ["newModelsAlert", B],
      ["arenaInvites", B],
      ["profileAt", PG ? "TIMESTAMPTZ" : "DATETIME"],
    ];
    for (const [col, def] of perfilCols) {
      await addColumnSiFalta("User", col, def);
    }

    logger.info("db.schema_ready", { dialect: PG ? "postgresql" : "sqlite" });
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
