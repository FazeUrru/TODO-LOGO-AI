/**
 * GET /api/v2/leaderboard?category=global|codigo|…|imagen|video|audio&limit=10
 *
 * Ranking público con CORS abierto — el ELO del arena no es un secreto.
 * v1.20.0: la fuente de verdad es el ELO persistido en BD (EloState para las
 * arenas de texto, EloArena para imagen/vídeo/audio) — exactamente lo mismo
 * que ve la web, sin raspado.
 *
 * Respuesta: { ok, category, total, rows: [{ rank, id, name, provider,
 * elo, wins, losses, ties, battles, updatedAt }] }
 */

import { NextRequest } from "next/server";
import { jsonCors, preflightCors } from "@/lib/v2-cors";
import { db } from "@/lib/db";
import { esArenaGenerativa } from "@/lib/elo-global";
import { BATTLE_CATEGORIES } from "@/lib/elo";
import { CATEGORIAS_GENERATIVAS, esGenerativo } from "@/lib/models-data";
import { MODELS, getModel } from "@/lib/models-data";
import { categoryElo } from "@/lib/elo";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflightCors();
}

const NOMBRE_CATEGORIAS = new Set<string>([
  ...BATTLE_CATEGORIES.map((c) => c.id),
  ...CATEGORIAS_GENERATIVAS,
]);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const categoria = url.searchParams.get("category") ?? "global";
  const limite = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") ?? 10) || 10));

  if (categoria !== "global" && !NOMBRE_CATEGORIAS.has(categoria)) {
    return jsonCors(
      { ok: false, error: "Categoría desconocida.", categorias: [...NOMBRE_CATEGORIAS] },
      400
    );
  }

  try {
    if (esArenaGenerativa(categoria)) {
      // Arena generativa: EloArena de ESA modalidad, ordenada por elo.
      const filas = await db.eloArena.findMany({
        where: { arena: categoria },
        orderBy: { elo: "desc" },
        take: limite,
      });
      const rows = filas.map((f, i) => {
        const m = getModel(f.modelId);
        return {
          rank: i + 1,
          id: f.modelId,
          name: m?.name ?? f.modelId,
          provider: m?.provider ?? "",
          elo: Math.round(f.elo),
          wins: f.wins,
          losses: f.losses,
          ties: f.ties,
          battles: f.battles,
          updatedAt: f.updatedAt.toISOString(),
        };
      });
      return jsonCors({ ok: true, category: categoria, total: rows.length, rows });
    }

    if (categoria === "global") {
      // ELO global persistido de texto.
      const filas = await db.eloState.findMany({ orderBy: { elo: "desc" }, take: limite * 2 });
      const visibles = filas.filter((f) => getModel(f.modelId) !== undefined);
      const rows = visibles.slice(0, limite).map((f, i) => {
        const m = getModel(f.modelId)!;
        return {
          rank: i + 1,
          id: f.modelId,
          name: m.name,
          provider: m.provider,
          elo: Math.round(f.elo),
          wins: f.wins,
          losses: f.losses,
          ties: f.ties,
          battles: f.battles,
          updatedAt: f.updatedAt.toISOString(),
        };
      });
      return jsonCors({ ok: true, category: categoria, total: rows.length, rows });
    }

    // Categoría temática de texto: consenso derivado como en la web
    // (solo modelos que conversan — los generativos no puntuaron aquí).
    const candidatos = MODELS.filter((m) => !m.categories.some((c) => ["imagen", "video", "audio"].includes(c)));
    const filas = await db.eloState.findMany();
    const mapa = new Map(filas.map((f) => [f.modelId, f]));
    const rows = candidatos
      .map((m) => {
        const f = mapa.get(m.id);
        return {
          id: m.id,
          name: m.name,
          provider: m.provider,
          elo: Math.round(f?.elo ?? categoryElo(m, categoria)),
          wins: f?.wins ?? 0,
          losses: f?.losses ?? 0,
          ties: f?.ties ?? 0,
          battles: f?.battles ?? 0,
        };
      })
      .sort((a, b) => b.elo - a.elo)
      .slice(0, limite)
      .map((r, i) => ({ rank: i + 1, ...r, updatedAt: new Date().toISOString() }));
    return jsonCors({ ok: true, category: categoria, total: rows.length, rows });
  } catch {
    // BD caída: degradación honesta a las fichas estáticas (ELO base).
    // v1.20.0 — filtro simétrico (lección v1.17.1): en texto JAMÁS aparecen
    // generativos, ni siquiera en el ranking de reserva.
    const degradado = esArenaGenerativa(categoria)
      ? MODELS.filter((m) => (m.categories as string[]).includes(categoria))
      : MODELS.filter((m) => !esGenerativo(m));
    const rows = degradado
      .sort((a, b) => b.elo - a.elo)
      .slice(0, limite)
      .map((m, i) => ({
        rank: i + 1,
        id: m.id,
        name: m.name,
        provider: m.provider,
        elo: m.elo,
        wins: 0,
        losses: 0,
        ties: 0,
        battles: 0,
        updatedAt: new Date().toISOString(),
        nota: "ranking de reserva (ELO estático)",
      }));
    return jsonCors({ ok: true, category: categoria, total: rows.length, rows, degradado: true });
  }
}
