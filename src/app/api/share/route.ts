import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getModel } from "@/lib/models-data";
import { deserializarCopa } from "@/lib/copas-persistir";
import { ipDeHeader, acumular, GEN_LIMITE, segundosRestantes } from "@/lib/rate-limit";
import {
  REPLAYS_CURADOS,
  tarjetaDeCurado,
  type TarjetaMuro,
} from "@/lib/muro-curados";

export const dynamic = "force-dynamic";

const LIMITE = 24;

/** Límite de tamaño por respuesta almacenada (60 KB ≈ 15k tokens). */
const MAX_TEXTO = 60_000;

function nuevoId(): string {
  return `d_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * v1.18.0 — Compartir un duelo o una copa por URL permanente.
 *
 * POST /api/share { tipo: "duelo", prompt, category, composerMode, modelAId,
 *                   modelBId, textoA, textoB, ganador }
 * POST /api/share { tipo: "copa", copaId }  — el cuadro ya vive en CopaSesion
 *
 * Devuelve { ok, id, url } con la URL pública del replay (/duelo/[id]).
 * El replay muestra las identidades reveladas: es una publicación, no una
 * batalla anónima — por eso se guarda el ganador y los textos completos.
 */
export async function POST(req: NextRequest) {
  const ip = ipDeHeader(req.headers.get("x-forwarded-for"));
  if (!acumular(`compartir:${ip}`, GEN_LIMITE, Date.now())) {
    return NextResponse.json(
      { error: "Demasiados compartidos desde tu IP. Espera unos minutos." },
      { status: 429, headers: { "Retry-After": String(segundosRestantes(GEN_LIMITE)) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const tipo = body.tipo === "copa" ? "copa" : "duelo";

  /* ── Copa: validar que la sesión existe y está bien formada ── */
  if (tipo === "copa") {
    const copaId = typeof body.copaId === "string" ? body.copaId : "";
    if (!copaId.startsWith("copa_")) {
      return NextResponse.json({ error: "copaId inválido." }, { status: 400 });
    }
    let prompt = "";
    try {
      const sesion = await db.copaSesion.findUnique({ where: { id: copaId } });
      if (!sesion) {
        return NextResponse.json({ error: "La copa ya no existe." }, { status: 404 });
      }
      const copa = deserializarCopa(sesion.datos);
      if (!copa) {
        return NextResponse.json({ error: "La copa está corrupta." }, { status: 422 });
      }
      prompt = copa.prompt.slice(0, 4000);
    } catch {
      return NextResponse.json({ error: "No se pudo leer la copa." }, { status: 500 });
    }
    const id = nuevoId();
    try {
      await db.dueloGuardado.create({
        data: { id, tipo, prompt, copaId, modelAId: copaId, textoA: "" },
      });
    } catch {
      return NextResponse.json({ error: "No se pudo guardar el replay." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, id, url: `/duelo/${id}` });
  }

  /* ── Duelo: snapshot completo de una batalla del arena ── */
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (prompt.length < 2 || prompt.length > 4000) {
    return NextResponse.json({ error: "Prompt ausente o fuera de rango." }, { status: 400 });
  }
  const modelAId = typeof body.modelAId === "string" ? body.modelAId : "";
  const modelBId = typeof body.modelBId === "string" && body.modelBId ? body.modelBId : null;
  if (!getModel(modelAId) || (modelBId && !getModel(modelBId))) {
    return NextResponse.json({ error: "Modelo desconocido." }, { status: 400 });
  }
  // Coherencia v1.17.1: un replay de chat es de texto — nada de generativos.
  const esGenerativoId = (id: string | null) =>
    id ? (getModel(id)?.categories.some((c) => ["imagen", "video", "audio"].includes(c)) ?? false) : false;
  if (esGenerativoId(modelAId) || esGenerativoId(modelBId)) {
    return NextResponse.json({ error: "Modelo inválido para un replay de texto." }, { status: 400 });
  }
  const textoA = typeof body.textoA === "string" ? body.textoA.slice(0, MAX_TEXTO) : "";
  const textoB = typeof body.textoB === "string" ? body.textoB.slice(0, MAX_TEXTO) : null;
  if (!textoA.trim()) {
    return NextResponse.json({ error: "Falta la respuesta del modelo A." }, { status: 400 });
  }
  const ganador =
    typeof body.ganador === "string" && ["A", "B", "tie", "bad"].includes(body.ganador)
      ? body.ganador
      : null;
  const category = typeof body.category === "string" ? body.category.slice(0, 40) : "global";
  const composerMode =
    typeof body.composerMode === "string" ? body.composerMode.slice(0, 20) : "texto";

  const id = nuevoId();
  try {
    await db.dueloGuardado.create({
      data: {
        id,
        tipo: "duelo",
        prompt,
        category,
        composerMode,
        modelAId,
        modelBId,
        textoA,
        textoB: modelBId ? textoB : null,
        ganador,
      },
    });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar el replay." }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id, url: `/duelo/${id}` });
}

/**
 * v1.19.0 — Muro de replays: GET /api/share.
 *
 * Lista los duelos y copas más compartidos: filas reales de la BD
 * (ordenadas por compartidos → vistas → fecha) fusionadas con la selección
 * fundacional de /lib/muro-curados (sin duplicar IDs). Una instancia recién
 * estrenada nunca muestra un muro vacío.
 */
export async function GET(req: NextRequest) {
  const limite = Math.min(
    Number(req.nextUrl.searchParams.get("limit")) || LIMITE,
    48
  );

  const tarjetas: TarjetaMuro[] = [];
  const vistos = new Set<string>();

  try {
    const filas = await db.dueloGuardado.findMany({
      orderBy: [{ shares: "desc" }, { views: "desc" }, { createdAt: "desc" }],
      take: limite,
    });
    for (const f of filas) {
      vistos.add(f.id);
      if (f.tipo === "copa" && f.copaId) {
        let championModelId: string | null = null;
        let copaSize: number | null = null;
        try {
          const sesion = await db.copaSesion.findUnique({ where: { id: f.copaId } });
          const copa = sesion ? deserializarCopa(sesion.datos) : null;
          if (copa) {
            championModelId = copa.championModelId ?? null;
            copaSize = copa.size;
          }
        } catch {
          /* tarjeta sin campeón: el resto de la tarjeta sigue válida */
        }
        tarjetas.push({
          id: f.id,
          tipo: "copa",
          prompt: f.prompt,
          category: f.category,
          modelAId: null,
          modelBId: null,
          ganador: null,
          championModelId,
          copaSize,
          shares: f.shares,
          views: f.views,
          createdAt: f.createdAt.toISOString(),
          oficial: false,
        });
      } else {
        tarjetas.push({
          id: f.id,
          tipo: "duelo",
          prompt: f.prompt,
          category: f.category,
          modelAId: f.modelAId,
          modelBId: f.modelBId,
          ganador: f.ganador,
          championModelId: null,
          copaSize: null,
          shares: f.shares,
          views: f.views,
          createdAt: f.createdAt.toISOString(),
          oficial: false,
        });
      }
    }
  } catch {
    /* BD ausente (demo serverless): el muro sigue con la selección curada */
  }

  // Selección fundacional: solo los IDs que la BD aún no conoce
  for (const c of REPLAYS_CURADOS) {
    if (vistos.has(c.id)) continue;
    tarjetas.push(tarjetaDeCurado(c));
  }

  tarjetas.sort((a, b) => b.shares - a.shares || b.views - a.views);

  const totalCompartidos = tarjetas.reduce((s, t) => s + t.shares, 0);
  const totalVistas = tarjetas.reduce((s, t) => s + t.views, 0);

  return NextResponse.json(
    {
      ok: true,
      replays: tarjetas.slice(0, limite),
      stats: { totalCompartidos, totalVistas, total: tarjetas.length },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
