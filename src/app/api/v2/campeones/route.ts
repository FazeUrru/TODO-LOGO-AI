/**
 * GET /api/v2/campeones — los últimos campeones de la Copa Todólogo
 * (la fuente del Salón de la Fama, con CORS abierto para terceros).
 */

import { jsonCors, preflightCors } from "@/lib/v2-cors";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/db-init";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflightCors();
}

export async function GET() {
  try {
    await ensureSchema();
    const filas = await db.copaCampeon.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    const rows = filas.map((f) => ({
      copaId: f.copaId,
      prompt: f.prompt,
      size: f.size,
      campeon: { id: f.championModelId, name: f.championName },
      subcampeon: f.runnerUpModelId ? { id: f.runnerUpModelId, name: f.runnerUpName ?? f.runnerUpModelId } : null,
      at: f.createdAt.toISOString(),
    }));
    return jsonCors({ ok: true, total: rows.length, rows });
  } catch {
    return jsonCors({ ok: true, total: 0, rows: [], degradado: true });
  }
}
