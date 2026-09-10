import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getModel } from "@/lib/models-data";

export const dynamic = "force-dynamic";

/**
 * v1.19.0 — Pulso de la arena: GET /api/actividad.
 *
 * Los últimos duelos decididos, ANONIMIZADOS por el lado del usuario pero
 * con identidades de modelos visibles (el ELO es público): alimenta el
 * ticker «Actividad en vivo» del leaderboard. Estructura mínima y
 * estable; el cliente compone las frases y refresca cada 20 s.
 */
export async function GET() {
  try {
    const votos = await db.vote.findMany({
      where: { winner: { in: ["A", "B", "tie"] } },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        modelAId: true,
        modelBId: true,
        winner: true,
        category: true,
        createdAt: true,
      },
    });

    const eventos = votos
      .map((v) => {
        const A = getModel(v.modelAId);
        const B = getModel(v.modelBId);
        if (!A || !B) return null;
        return {
          categoria: v.category,
          ganador: v.winner === "A" ? A.id : v.winner === "B" ? B.id : null,
          perdedor: v.winner === "A" ? B.id : v.winner === "B" ? A.id : null,
          empate: v.winner === "tie",
          nombreA: A.name,
          nombreB: B.name,
          at: v.createdAt.toISOString(),
        };
      })
      .filter(Boolean);

    let total = 0;
    try {
      total = await db.vote.count();
    } catch {
      total = 0;
    }

    return NextResponse.json(
      { ok: true, eventos, total },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ ok: true, eventos: [], total: 0 });
  }
}
