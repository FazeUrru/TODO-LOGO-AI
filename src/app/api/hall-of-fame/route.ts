import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/db-init";

export const dynamic = "force-dynamic";

/**
 * GET /api/hall-of-fame — Salón de la Fama de la Copa Todólogo (v1.12.0):
 * los últimos campeones registrados en la base de datos, más el total histórico.
 * Nunca falla: ante error de BD devuelve una lista vacía.
 */
export async function GET() {
  try {
    await ensureSchema();
    const [rows, total] = await Promise.all([
      db.copaCampeon.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
      db.copaCampeon.count(),
    ]);
    return NextResponse.json({
      ok: true,
      total,
      campeones: rows.map((r) => ({
        copaId: r.copaId,
        prompt: r.prompt,
        size: r.size,
        campeon: { id: r.championModelId, name: r.championName },
        subcampeon: r.runnerUpName
          ? { id: r.runnerUpModelId ?? "", name: r.runnerUpName }
          : null,
        at: r.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ ok: true, total: 0, campeones: [] });
  }
}
