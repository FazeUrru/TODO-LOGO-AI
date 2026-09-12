import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deserializarHilo } from "@/lib/hilo-conversacion";

export const dynamic = "force-dynamic";

/**
 * v1.25.0 — Leer una conversación compartida: GET /api/conversacion/[id].
 *
 * Sirve el hilo completo (ambos lados ya parseados) para la página /c/[id].
 * Los IDs públicos empiezan por «c_»; el 404 es honesto: el link o existe
 * o no existe — nada de respuestas ambiguas.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id.startsWith("c_")) {
    return NextResponse.json(
      { error: "Conversación no encontrada." },
      { status: 404 }
    );
  }

  try {
    const fila = await db.conversacionGuardada.findUnique({ where: { id } });
    if (!fila) {
      return NextResponse.json(
        { error: "Conversación no encontrada." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      {
        ok: true,
        tipo: "conversacion",
        id: fila.id,
        prompt: fila.prompt,
        category: fila.category,
        composerMode: fila.composerMode,
        modelAId: fila.modelAId,
        modelBId: fila.modelBId,
        turnosA: deserializarHilo(fila.turnosA),
        turnosB: deserializarHilo(fila.turnosB),
        ganador: fila.ganador,
        createdAt: fila.createdAt,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer la conversación." },
      { status: 500 }
    );
  }
}

/**
 * v1.25.0 — Contadores del link: PATCH /api/conversacion/[id].
 *
 * { accion: "vista" }     → +1 visita (se abrió el link)
 * { accion: "compartir" } → +1 difusión (alguien re-reparte la URL)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id.startsWith("c_")) {
    return NextResponse.json({ error: "Conversación no encontrada." }, { status: 404 });
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
    const actualizado = await db.conversacionGuardada.update({
      where: { id },
      data:
        body.accion === "vista"
          ? { views: { increment: 1 } }
          : { shares: { increment: 1 } },
      select: { shares: true, views: true },
    });
    return NextResponse.json({
      ok: true,
      shares: actualizado.shares,
      views: actualizado.views,
    });
  } catch {
    return NextResponse.json({ error: "No se pudo registrar." }, { status: 500 });
  }
}
