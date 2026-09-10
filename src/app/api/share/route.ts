import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getModel } from "@/lib/models-data";
import { deserializarCopa } from "@/lib/copas-persistir";
import { ipDeHeader, acumular, GEN_LIMITE, segundosRestantes } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

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
