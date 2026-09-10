import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deserializarCopa } from "@/lib/copas-persistir";

export const dynamic = "force-dynamic";

/**
 * v1.18.0 — Leer un replay compartido: GET /api/share/[id].
 *
 * Devuelve el snapshot del duelo (identidades reveladas, textos completos y
 * ganador) o, si es una copa, el JSON canónico completo de la CopaSesion para
 * que la página /duelo/[id] repia el cuadro entero.
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
      return NextResponse.json({ error: "Replay no encontrado." }, { status: 404 });
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
