import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getModel } from "@/lib/models-data";
import { ipDeHeader, acumular, GEN_LIMITE, segundosRestantes } from "@/lib/rate-limit";
import {
  sanearHilo,
  serializarHilo,
  primerMensajeUsuario,
  deserializarHilo,
} from "@/lib/hilo-conversacion";

export const dynamic = "force-dynamic";

/**
 * v1.25.0 — El hilo permanente: POST /api/conversacion.
 *
 * Guarda la conversación COMPLETA de un duelo del arena (los dos hilos,
 * turnosA/turnosB, con cada turno en su orden y su rol) y devuelve la URL
 * pública estable del link: /c/[id]. A diferencia del replay de duelo
 * (v1.18.0, snapshot aplastado), aquí el link abre la conversación tal y
 * como ocurrió — mensaje a mensaje, con ambos modelos lado a lado.
 *
 * Body: { modelAId, modelBId?, turnosA, turnosB?, ganador?, category?,
 *         composerMode? }
 * Devuelve: { ok, id, url } con la URL pública (/c/c_xxx).
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

  /* ── Modelos: conocidos y de texto (coherencia con el replay v1.17.1) ── */
  const modelAId = typeof body.modelAId === "string" ? body.modelAId : "";
  const modelBId =
    typeof body.modelBId === "string" && body.modelBId ? body.modelBId : null;
  if (!getModel(modelAId) || (modelBId && !getModel(modelBId))) {
    return NextResponse.json({ error: "Modelo desconocido." }, { status: 400 });
  }
  const esGenerativoId = (id: string | null) =>
    id
      ? (getModel(id)?.categories.some((c) => ["imagen", "video", "audio"].includes(c)) ?? false)
      : false;
  if (esGenerativoId(modelAId) || esGenerativoId(modelBId)) {
    return NextResponse.json(
      { error: "Modelo inválido para un link de conversación de texto." },
      { status: 400 }
    );
  }

  /* ── Hilos: saneado estricto de ambos lados ── */
  const ladoA = sanearHilo(body.turnosA);
  if (ladoA.turnos.length === 0) {
    return NextResponse.json(
      { error: ladoA.error ?? "El hilo del modelo A no es publicable." },
      { status: 400 }
    );
  }
  let ladoB: ReturnType<typeof sanearHilo> | null = null;
  if (modelBId) {
    ladoB = sanearHilo(body.turnosB);
    if (ladoB.turnos.length === 0) {
      return NextResponse.json(
        { error: ladoB.error ?? "El hilo del modelo B no es publicable." },
        { status: 400 }
      );
    }
  }

  const prompt = primerMensajeUsuario(ladoA.turnos).slice(0, 4000);
  if (!prompt.trim()) {
    return NextResponse.json(
      { error: "Falta el primer mensaje de la conversación." },
      { status: 400 }
    );
  }
  const category =
    typeof body.category === "string" ? body.category.slice(0, 40) : "global";
  const composerMode =
    typeof body.composerMode === "string" ? body.composerMode.slice(0, 20) : "texto";
  const ganador =
    typeof body.ganador === "string" && ["A", "B", "tie", "bad"].includes(body.ganador)
      ? body.ganador
      : null;

  const id = `c_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  try {
    await db.conversacionGuardada.create({
      data: {
        id,
        prompt,
        category,
        composerMode,
        modelAId,
        modelBId,
        turnosA: serializarHilo(ladoA.turnos),
        turnosB: modelBId && ladoB ? serializarHilo(ladoB.turnos) : null,
        ganador,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo guardar la conversación." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, id, url: `/c/${id}` });
}

/**
 * v1.25.0 — Listado de conversaciones publicadas: GET /api/conversacion.
 * Devuelve las más compartidas para futuras superficies (muro, perfil).
 */
export async function GET(req: NextRequest) {
  const limite = Math.min(Number(req.nextUrl.searchParams.get("limit")) || 12, 48);
  try {
    const filas = await db.conversacionGuardada.findMany({
      orderBy: [{ shares: "desc" }, { views: "desc" }, { createdAt: "desc" }],
      take: limite,
    });
    const conversaciones = filas.map((f) => {
      const turnosA = deserializarHilo(f.turnosA);
      return {
        id: f.id,
        prompt: f.prompt,
        category: f.category,
        modelAId: f.modelAId,
        modelBId: f.modelBId,
        ganador: f.ganador,
        mensajes: turnosA.length,
        shares: f.shares,
        views: f.views,
        createdAt: f.createdAt.toISOString(),
      };
    });
    return NextResponse.json(
      { ok: true, conversaciones },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { ok: true, conversaciones: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
