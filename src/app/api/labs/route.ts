import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/db-init";
import {
  LABS_FEATURES,
  COHORTES,
  cohorteDeSesion,
  puedeActivar,
  LABS_APERTURA,
} from "@/lib/labs";

export const dynamic = "force-dynamic";

/**
 * GET /api/labs — catálogo del Canal Todólogo Labs (v1.14.0) con telemetría
 * agregada. El registro fuente vive en `src/lib/labs.ts`; aquí se espeja en
 * la tabla `LabsFeature` y se añaden los contadores de eventos reales.
 * Nunca lanza: si la base no está, devuelve el registro con telemetría vacía.
 */
export async function GET() {
  const user = await currentUser().catch(() => null);
  const emailsInner = (process.env.LABS_INNER_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const cohorte = cohorteDeSesion({
    conectado: Boolean(user),
    email: user?.email ?? null,
    emailsInner,
  });

  const base = {
    ok: true,
    canal: {
      nombre: "Todólogo Labs",
      apertura: LABS_APERTURA,
      reglas: [
        "Ciclo de vida finito: máx. 8 semanas en pruebas → graduación o descarte.",
        "El ELO global es sagrado: ninguna beta escribe en Vote/EloState sin namespace propio.",
        "Telemetría estructurada desde el día uno (adopción, uso, abandono, crash).",
        "Contrato explícito: el modo experimental puede fallar, perder tu partida o mostrar datos inconsistentes.",
      ],
    },
    cohorte,
    puede: COHORTES[cohorte],
    features: LABS_FEATURES.map((f) => ({
      ...f,
      accesoPermitido: puedeActivar(f, cohorte),
      inscriptos: null as number | null,
      eventos: null as number | null,
    })),
  };

  try {
    await ensureSchema();
    // Espejo del registro (upsert idempotente) para estadísticas futuras
    for (const f of LABS_FEATURES) {
      await db.labsFeature.upsert({
        where: { id: f.id },
        create: { id: f.id, nombre: f.nombre, cohorte: f.cohorte, estado: f.estado, expira: new Date(f.expira) },
        update: { nombre: f.nombre, cohorte: f.cohorte, estado: f.estado, expira: new Date(f.expira) },
      });
    }
    const conteos = await db.labsEvent.groupBy({
      by: ["featureId", "tipo"],
      _count: { _all: true },
    });
    const porId = new Map<string, { inscriptos: number; eventos: number }>();
    for (const c of conteos) {
      const acc = porId.get(c.featureId) ?? { inscriptos: 0, eventos: 0 };
      acc.eventos += c._count._all;
      if (c.tipo === "entered") acc.inscriptos = c._count._all;
      porId.set(c.featureId, acc);
    }
    base.features = base.features.map((f) => ({
      ...f,
      inscriptos: porId.get(f.id)?.inscriptos ?? 0,
      eventos: porId.get(f.id)?.eventos ?? 0,
    }));
  } catch {
    // base caída (p. ej. Vercel sin Postgres): el catálogo sigue siendo útil
  }

  return NextResponse.json(base, { headers: { "Cache-Control": "no-store" } });
}
