import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MODELS, PROVIDERS, CATEGORIAS_GENERATIVAS, esGenerativo } from "@/lib/models-data";
import { categoryElo, eloDeltaFromVotes, type LeaderRow } from "@/lib/elo";
import { getGlobalEloMap } from "@/lib/elo-global";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category") ?? "global";
  const globalMap = await getGlobalEloMap();

  let winMap: Record<string, { wins: number; losses: number; ties: number; bads: number }> = {};
  try {
    const votes = await db.vote.findMany({
      select: { modelAId: true, modelBId: true, winner: true },
    });
    for (const v of votes) {
      const ids = [v.modelAId, v.modelBId];
      for (const id of ids) {
        winMap[id] ??= { wins: 0, losses: 0, ties: 0, bads: 0 };
      }
      if (v.winner === "tie") {
        winMap[v.modelAId].ties++;
        winMap[v.modelBId].ties++;
      } else if (v.winner === "bad") {
        winMap[v.modelAId].bads++;
        winMap[v.modelBId].bads++;
      } else {
        const winnerId = v.winner === "A" ? v.modelAId : v.modelBId;
        const loserId = v.winner === "A" ? v.modelBId : v.modelAId;
        winMap[winnerId].wins++;
        winMap[loserId].losses++;
      }
    }
  } catch {
    winMap = {};
  }

  // Arenas generativas (v1.15.0): solo compiten los modelos de esa modalidad —
  // un LLM de texto no aparece en la arena de vídeo por mucho offset que toque.
  // v1.17.1 — y a la inversa: las arenas de texto (General, Código,…) son solo
  // de modelos que conversan. Un modelo de imagen (p. ej. GPT-Image-2.5
  // Sunburst) no compite en la General: no genera texto, no recibe votos de
  // texto y su presencia allí era un error de categoría.
  const soloGenerativos = (CATEGORIAS_GENERATIVAS as readonly string[]).includes(category);
  const candidatos = soloGenerativos
    ? MODELS.filter((m) => m.categories.includes(category as never))
    : MODELS.filter((m) => !esGenerativo(m));

  const rows: LeaderRow[] = candidatos.map((m) => {
    const stats = winMap[m.id] ?? { wins: 0, losses: 0, ties: 0, bads: 0 };
    const delta = eloDeltaFromVotes(stats.wins, stats.losses, stats.ties);
    const decided = stats.wins + stats.losses;
    return {
      id: m.id,
      name: m.name,
      provider: m.provider,
      providerName: PROVIDERS[m.provider]?.name ?? m.provider,
      license: m.license,
      elo: categoryElo(m, category) + delta,
      delta,
      ci: 2 + ((m.elo + m.id.length * 7) % 4),
      votes: stats.wins + stats.losses + stats.ties + stats.bads,
      winRate: decided > 0 ? Math.round((stats.wins / decided) * 100) : 50,
      context: m.context,
      priceOut: m.priceOut,
      speed: m.speed,
      isNew: Boolean(m.isNew),
      categories: m.categories,
      eloGlobal: globalMap[m.id]?.elo ?? null,
      eloGlobalBattles: globalMap[m.id]?.battles ?? 0,
    };
  });

  rows.sort((a, b) => b.elo - a.elo);
  rows.forEach((r, i) => (r.rank = i + 1));

  return NextResponse.json({
    category,
    total: rows.length,
    rows,
    syncedAt: new Date().toISOString(),
  });
}
