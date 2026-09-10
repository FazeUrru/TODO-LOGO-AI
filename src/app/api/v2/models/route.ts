/**
 * GET /api/v2/models — catálogo público del arena (CORS abierto).
 * Opcional: ?category=texto|codigo|…|imagen|video|audio&limit=
 */

import { NextRequest } from "next/server";
import { jsonCors, preflightCors } from "@/lib/v2-cors";
import { MODELS } from "@/lib/models-data";

export function OPTIONS() {
  return preflightCors();
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const categoria = url.searchParams.get("category");
  const limite = Math.max(1, Math.min(200, Number(url.searchParams.get("limit") ?? 100) || 100));

  let filas = MODELS;
  if (categoria) {
    filas = filas.filter((m) => (m.categories as string[]).includes(categoria));
  }
  const rows = filas.slice(0, limite).map((m) => ({
    id: m.id,
    name: m.name,
    provider: m.provider,
    license: m.license,
    categories: m.categories,
    elo: m.elo,
    context: m.context,
    maxOutput: m.maxOutput,
    priceIn: m.priceIn,
    priceOut: m.priceOut,
    speed: m.speed,
    released: m.released,
    desc: m.desc,
    tags: m.tags,
    isNew: Boolean(m.isNew),
  }));
  return jsonCors({ ok: true, total: rows.length, rows });
}
