import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/db-init";
import { estadisticasSalon } from "@/lib/salon-utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/hall-of-fame — Salón de la Fama de la Copa Todólogo (v1.12.0):
 * los últimos campeones registrados en la base de datos, más el total histórico.
 *
 * v1.13.0: añade `stats` (estadísticas agregadas vía salon-utils): top de
 * modelos por títulos, copa más grande coronada, copas XL y último campeón —
 * el mismo cálculo que consume la página pública /salon-de-la-fama.
 * Nunca falla: ante error de BD devuelve una lista vacía.
 */
export async function GET() {
  try {
    await ensureSchema();
    const filas = await db.copaCampeon.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
    const todas = filas.map((r) => ({
      copaId: r.copaId,
      prompt: r.prompt,
      size: r.size,
      campeon: { id: r.championModelId, name: r.championName },
      subcampeon: r.runnerUpName
        ? { id: r.runnerUpModelId ?? "", name: r.runnerUpName }
        : null,
      at: r.createdAt.toISOString(),
    }));
    const stats = estadisticasSalon(todas);
    return NextResponse.json({ ok: true, total: stats.total, campeones: todas.slice(0, 12), stats });
  } catch {
    return NextResponse.json({
      ok: true,
      total: 0,
      campeones: [],
      stats: estadisticasSalon([]),
    });
  }
}
