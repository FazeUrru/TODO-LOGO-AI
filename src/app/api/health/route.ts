import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { APP_VERSION, APP_BUILD_DATE } from "@/lib/version";
import { MODELS } from "@/lib/models-data";
import { cronReport } from "@/lib/cron";

export const dynamic = "force-dynamic";

/**
 * Health check para observabilidad y despliegues:
 * - Verifica la base de datos con una consulta real (SELECT 1).
 * - Expone versión, modo, tiempo de actividad y recuento de catálogo.
 * - 200 si todo va bien; 503 si la base no responde.
 */
export async function GET() {
  const start = Date.now();
  let database: "up" | "down" = "down";
  let votes: number | null = null;

  try {
    await db.$queryRaw`SELECT 1`;
    database = "up";
    votes = await db.vote.count();
  } catch (err) {
    logger.error("health.db_down", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const body = {
    ok: database === "up",
    service: "todologo-ai",
    version: APP_VERSION,
    buildDate: APP_BUILD_DATE,
    mode: process.env.BUILD_STATIC === "1" ? "static" : "standalone",
    checks: {
      database,
      votes,
    },
    catalog: {
      models: MODELS.length,
      providers: new Set(MODELS.map((m) => m.provider)).size,
    },
    cron: cronReport(),
    uptimeSec: Math.round(process.uptime()),
    latencyMs: Date.now() - start,
    timestamp: new Date().toISOString(),
  };

  logger.info("health.check", { ok: body.ok, db: database, ms: body.latencyMs });
  return NextResponse.json(body, { status: body.ok ? 200 : 503 });
}
