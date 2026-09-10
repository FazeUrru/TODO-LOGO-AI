/**
 * GET /api/v2/jurados — el ranking público de las personas que votan
 * (ELO de jurado, v1.20.0). Solo aparecen cuentas con perfil público y
 * estadísticas visibles; sin correos, sin identificadores internos.
 */

import { jsonCors, preflightCors } from "@/lib/v2-cors";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/db-init";
import { nameFromEmail } from "@/lib/auth";
import { tituloJurado } from "@/lib/elo-usuario";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return preflightCors();
}

export async function GET() {
  try {
    await ensureSchema();
    const filas = await db.userElo.findMany({
      orderBy: { elo: "desc" },
      take: 100,
    });
    const conUsuario = await db.user.findMany({
      where: { id: { in: filas.map((f) => f.userId) } },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        username: true,
        avatar: true,
        publicProfile: true,
        showStats: true,
      },
    });
    const info = new Map(conUsuario.map((u) => [u.id, u]));
    const rows = filas
      .map((f) => ({ fila: f, u: info.get(f.userId) }))
      .filter(
        ({ u }) =>
          u &&
          u.publicProfile !== false && // null = opción por defecto: visible
          u.showStats !== false
      )
      .slice(0, 50)
      .map(({ fila, u }, i) => {
        const titulo = tituloJurado(fila.elo);
        const nombre =
          (u?.displayName && u.displayName.trim()) ||
          (u?.username && u.username.trim()) ||
          nameFromEmail(u?.email ?? "");
        return {
          rank: i + 1,
          nombre,
          avatar: u?.avatar ?? null,
          elo: Math.round(fila.elo),
          titulo: titulo.nombre,
          color: titulo.color,
          votos: fila.votos,
          aciertos: fila.aciertos,
          precision: fila.votos > 0 ? Math.round((fila.aciertos / fila.votos) * 100) : null,
          racha: fila.racha,
          mejorRacha: fila.mejorRacha,
          ultimoDia: fila.ultimoDia,
        };
      });
    return jsonCors({ ok: true, total: rows.length, rows });
  } catch {
    return jsonCors({ ok: true, total: 0, rows: [], degradado: true });
  }
}
