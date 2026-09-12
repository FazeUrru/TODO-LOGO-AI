import { NextResponse } from "next/server";
import { CRON_MAX_HISTORIAL, CRON_SCHEDULE, proximaEjecucion, saludDe, type EjecucionCron } from "@/lib/streamdog/cine-cron";

/**
 * CRON EMPRESARIAL · /api/streamdog/cron/estado (v1.33.0).
 *
 * El panel de salud del planificador: qué ejecuciones hubo en las
 * últimas 24 h, cómo acabó la última, cuántos items se calentaron y
 * cuándo toca la próxima recarga. Lo pinta la UI como chip honesto
 * «Actualizado cada hora ♾️» con la hora real de la última recarga.
 */

export const dynamic = "force-dynamic";

const g = globalThis as unknown as { __streamdogCronHistorial?: EjecucionCron[] };
const historial: EjecucionCron[] = (g.__streamdogCronHistorial ??= []);

export async function GET() {
  const ahora = Date.now();
  const ultima = historial[0] ?? null;
  return NextResponse.json({
    ok: true,
    schedule: CRON_SCHEDULE,
    maxHistorial: CRON_MAX_HISTORIAL,
    proxima: proximaEjecucion(ahora),
    salud: saludDe(historial),
    ultima,
    /** Minutos desde la última recarga (null si nunca hubo). */
    minutosDesdeUltima: ultima ? Math.round((ahora - ultima.completado) / 60_000) : null,
    historial: historial.slice(0, 12),
  });
}
