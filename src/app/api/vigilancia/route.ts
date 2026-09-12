import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/db-init";
import { logger } from "@/lib/logger";
import { acumular, ipDeHeader, segundosRestantes, type LimiteCfg } from "@/lib/rate-limit";
import { APP_VERSION } from "@/lib/version";
import {
  ACCIONES,
  METRICAS_DEMO,
  REGLAS_BASE,
  evaluarSalud,
  sugerirAcciones,
  type MetricasNegocio,
} from "@/lib/vigilancia";
import {
  historial,
  instantanea,
  registrarIncidenteCliente,
} from "@/lib/vigilancia-servidor";

/**
 * API del watchdog empresarial (v1.28.0) — la tercera pata de la
 * vigilancia de la casa (el watchdog.sh v1.10.0 vigila el proceso y
 * la inmunidad v1.24.0 vigila el stream en cada dispositivo).
 *
 *  · GET  → instantánea del negocio: métricas de la ventana de 24 h,
 *           veredicto de salud contra las reglas del SLA, acciones
 *           sugeridas por alerta, feed de incidentes en memoria y la
 *           AUDITORÍA persistida (los avisos graves sobreviven a los
 *           reinicios — requisito de comité).
 *  · POST → los dispositivos reportan su experiencia real de cortes
 *           (la memoria inmunitaria hablando) con rate-limit propio.
 *           Sin BD: si la base cae, la telemetría sigue.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 15;

/** 30 reportes por minuto e IP: el cliente reporta poco; el abuso no pasa. */
const REPORTE_LIMITE: LimiteCfg = { max: 30, ventanaMs: 60_000 };

const EsquemaReporte = z.object({
  tipo: z.enum(["corte-curado", "corte-sin-curar", "falso-positivo"]),
});

const respuestaError = (mensaje: string, estado: number, extra?: Record<string, string>) =>
  NextResponse.json({ ok: false, error: mensaje }, { status: estado, headers: extra });

/** Deduplicación de auditoría: un mismo código no se persiste dos veces en media hora. */
const VENTANA_AUDITORIA_MS = 30 * 60 * 1000;

/** Instantánea de demostración honesta para el export estático. */
function instantaneaDemo() {
  const salud = evaluarSalud(METRICAS_DEMO, REGLAS_BASE);
  return {
    ok: true,
    modo: "demo" as const,
    version: APP_VERSION,
    generadoEn: new Date().toISOString(),
    metricas: METRICAS_DEMO,
    salud,
    sugerencias: sugerirAcciones(salud.alertas),
    incidentes: [],
    auditoria: [],
    reglas: REGLAS_BASE,
  };
}

export async function GET() {
  if (process.env.BUILD_STATIC === "1") {
    return NextResponse.json(instantaneaDemo());
  }

  const ahora = Date.now();

  // 1 · Latido de la base: medido con reloj propio, sin contaminar las
  // muestras de latencia de generación.
  let dbLatenciaMs = 0;
  try {
    const t0 = Date.now();
    await db.$queryRaw`SELECT 1`;
    dbLatenciaMs = Date.now() - t0;
  } catch {
    dbLatenciaMs = -1; // la BD no responde: evaluarSalud lo juzgará crítico
  }

  // 2 · Métricas del colector en memoria + señales del proceso.
  const metricas: MetricasNegocio = instantanea(ahora, {
    dbLatenciaMs: Math.max(0, dbLatenciaMs),
    uptimeSec: Math.round(process.uptime()),
  });
  if (dbLatenciaMs === -1) {
    // BD caída → disponibilidad real 0: el nivel de salud no puede ser verde.
    metricas.disponibilidadPct = 0;
    metricas.tasaErrorPct = 100;
  }

  // 3 · Veredicto + acciones sugeridas (librería pura, determinista).
  const salud = evaluarSalud(metricas, REGLAS_BASE);
  const sugerencias = sugerirAcciones(salud.alertas);

  // 4 · Auditoría persistida: los avisos graves se escriben en la base
  // (con deduplicación de 30 min por código) y se leen aunque el proceso
  // haya reiniciado. Si la BD no está, la instantánea sigue viva.
  let auditoria: unknown[] = [];
  try {
    await ensureSchema();
    for (const alerta of salud.alertas) {
      if (alerta.severidad === "info") continue;
      const yaVisto = await db.vigilanciaIncidente.findFirst({
        where: { codigo: alerta.codigo, createdAt: { gte: new Date(ahora - VENTANA_AUDITORIA_MS) } },
        select: { id: true },
      });
      if (yaVisto) continue;
      await db.vigilanciaIncidente.create({
        data: {
          codigo: alerta.codigo,
          severidad: alerta.severidad,
          titulo: alerta.titulo,
          detalle: alerta.detalle.slice(0, 500),
          origen: "servidor",
        },
      });
    }
    auditoria = await db.vigilanciaIncidente.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  } catch (err) {
    logger.warn("vigilancia.auditoria_fallo", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return NextResponse.json({
    ok: true,
    modo: "en-vivo" as const,
    version: APP_VERSION,
    generadoEn: new Date(ahora).toISOString(),
    metricas,
    salud,
    sugerencias,
    incidentes: historial(ahora, 14),
    auditoria,
    reglas: REGLAS_BASE,
    accionesDisponibles: Object.keys(ACCIONES),
  });
}

export async function POST(req: Request) {
  const ip = ipDeHeader(req.headers.get("x-forwarded-for"));
  if (!acumular(`vigilancia:${ip}`, REPORTE_LIMITE, Date.now())) {
    return respuestaError(
      "Demasiados reportes seguidos desde tu conexión: el vigilante ya lo ha apuntado.",
      429,
      { "Retry-After": String(segundosRestantes(REPORTE_LIMITE)) }
    );
  }

  if (process.env.BUILD_STATIC === "1") {
    return NextResponse.json({ ok: true, modo: "demo" });
  }

  let crudo: unknown;
  try {
    crudo = await req.json();
  } catch {
    return respuestaError("No se pudo leer el reporte: el cuerpo no es JSON válido.", 400);
  }

  const parsed = EsquemaReporte.safeParse(crudo);
  if (!parsed.success) {
    return respuestaError("El reporte no es válido: solo se aceptan cortes curados, sin curar y falsos positivos.", 400);
  }

  const aceptado = registrarIncidenteCliente(parsed.data.tipo);
  if (!aceptado) return respuestaError("El reporte no encaja en ningún tipo conocido.", 400);

  return NextResponse.json({ ok: true, tipo: aceptado });
}
