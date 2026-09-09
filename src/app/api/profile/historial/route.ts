import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/db-init";

export const dynamic = "force-dynamic";

/**
 * GET /api/profile/historial — actividad del perfil en la nube (v1.12.0):
 * los últimos cambios registrados del perfil de la sesión. Sin sesión
 * devuelve 401 (el cliente oculta la tarjeta).
 */
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "sin-sesion" }, { status: 401 });
    }
    await ensureSchema();
    const eventos = await db.profileEvent.findMany({
      where: { userId: user.id },
      orderBy: { at: "desc" },
      take: 15,
    });
    return NextResponse.json({
      ok: true,
      eventos: eventos.map((e) => ({ campo: e.campo, detalle: e.detalle, at: e.at })),
    });
  } catch {
    return NextResponse.json({ ok: true, eventos: [] });
  }
}
