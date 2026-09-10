import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deserializarCopa } from "@/lib/copas-persistir";
import { curadoPorId } from "@/lib/muro-curados";

export const dynamic = "force-dynamic";

/**
 * v1.18.0 — Leer un replay compartido: GET /api/share/[id].
 *
 * Devuelve el snapshot del duelo (identidades reveladas, textos completos y
 * ganador) o, si es una copa, el JSON canónico completo de la CopaSesion para
 * que la página /duelo/[id] repia el cuadro entero.
 *
 * v1.19.0 — si el ID pertenece a la selección fundacional del muro y aún no
 * vive en BD, se sirve directamente desde /lib/muro-curados: los replays
 * «oficiales» abren en cualquier instancia desde el primer arranque.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id.startsWith("d_")) {
    return NextResponse.json({ error: "Replay no encontrado." }, { status: 404 });
  }

  try {
    const duelo = await db.dueloGuardado.findUnique({ where: { id } });
    if (!duelo) {
      return servirCurado(id);
    }

    if (duelo.tipo === "copa" && duelo.copaId) {
      const sesion = await db.copaSesion.findUnique({ where: { id: duelo.copaId } });
      const copa = sesion ? deserializarCopa(sesion.datos) : null;
      if (!copa) {
        return NextResponse.json({ error: "La copa de este replay ya no existe." }, { status: 404 });
      }
      return NextResponse.json(
        { ok: true, tipo: "copa", id: duelo.id, prompt: duelo.prompt, copa, createdAt: duelo.createdAt },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        tipo: "duelo",
        id: duelo.id,
        prompt: duelo.prompt,
        category: duelo.category,
        composerMode: duelo.composerMode,
        modelAId: duelo.modelAId,
        modelBId: duelo.modelBId,
        textoA: duelo.textoA,
        textoB: duelo.textoB,
        ganador: duelo.ganador,
        createdAt: duelo.createdAt,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "No se pudo leer el replay." }, { status: 500 });
  }
}

/** Sirve un replay de la selección fundacional si existe (v1.19.0). */
function servirCurado(id: string): NextResponse {
  const c = curadoPorId(id);
  if (!c) {
    return NextResponse.json({ error: "Replay no encontrado." }, { status: 404 });
  }
  if (c.tipo === "copa") {
    return NextResponse.json(
      { ok: true, tipo: "copa", id: c.id, prompt: c.prompt, copa: c.copa, createdAt: c.createdAt },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
  return NextResponse.json(
    {
      ok: true,
      tipo: "duelo",
      id: c.id,
      prompt: c.prompt,
      category: c.category,
      composerMode: c.composerMode,
      modelAId: c.modelAId,
      modelBId: c.modelBId,
      textoA: c.textoA,
      textoB: c.textoB,
      ganador: c.ganador,
      createdAt: c.createdAt,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

/**
 * v1.19.0 — Contadores del muro: PATCH /api/share/[id].
 *
 * { accion: "vista" }     → +1 vista (el replay se abrió)
 * { accion: "compartir" } → +1 compartido (alguien vuelve a difundir el enlace)
 *
 * Los replays de la selección fundacional no viven en BD: sus contadores son
 * los canónicos de la narrativa y el PATCH responde con ellos sin escribir.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id.startsWith("d_")) {
    return NextResponse.json({ error: "Replay no encontrado." }, { status: 404 });
  }
  let body: { accion?: string };
  try {
    body = (await req.json()) as { accion?: string };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (body.accion !== "vista" && body.accion !== "compartir") {
    return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  }

  try {
    const fila = await db.dueloGuardado.findUnique({
      where: { id },
      select: { shares: true, views: true },
    });
    if (!fila) {
      const c = curadoPorId(id);
      if (!c) {
        return NextResponse.json({ error: "Replay no encontrado." }, { status: 404 });
      }
      return NextResponse.json({ ok: true, shares: c.shares, views: c.views });
    }
    const actualizado = await db.dueloGuardado.update({
      where: { id },
      data:
        body.accion === "vista"
          ? { views: { increment: 1 } }
          : { shares: { increment: 1 } },
      select: { shares: true, views: true },
    });
    return NextResponse.json({ ok: true, shares: actualizado.shares, views: actualizado.views });
  } catch {
    return NextResponse.json({ error: "No se pudo registrar." }, { status: 500 });
  }
}
