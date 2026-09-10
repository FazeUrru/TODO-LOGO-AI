/**
 * GET /api/usuario-elo — TU estado de jurado (v1.20.0), con sesión iniciada.
 * Devuelve el estado persistido en UserElo (racha y ELO entre dispositivos)
 * y tu posición en el ranking público de jurados.
 */

import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/db-init";
import { saneaJurado, tituloJurado } from "@/lib/elo-usuario";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: true, usuario: null });
  try {
    await ensureSchema();
    const fila = await db.userElo.findUnique({ where: { userId: user.id } });
    if (!fila) return NextResponse.json({ ok: true, usuario: null });
    const estado = saneaJurado({
      elo: fila.elo,
      votos: fila.votos,
      aciertos: fila.aciertos,
      racha: fila.racha,
      mejorRacha: fila.mejorRacha,
      ultimoDia: fila.ultimoDia,
    });
    // Posición: cuántos jurados hay por encima (barato y suficiente)
    const porEncima = await db.userElo.count({ where: { elo: { gt: fila.elo } } });
    return NextResponse.json({
      ok: true,
      usuario: { ...estado, titulo: tituloJurado(estado.elo).nombre, posicion: porEncima + 1 },
    });
  } catch {
    return NextResponse.json({ ok: true, usuario: null, degradado: true });
  }
}
