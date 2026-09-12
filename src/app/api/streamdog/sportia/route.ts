import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/db-init";
import { acumular, ipDeHeader, segundosRestantes, type LimiteCfg } from "@/lib/rate-limit";
import { changelogSportia, progresoDelAnio, sugerenciasParaElDev } from "@/lib/streamdog/sportia";

/**
 * API del cerebro SportIA (v1.26.0).
 *
 *  · GET  → el reloj del año, las sugerencias al desarrollador «en función
 *           de lo que va de año», el changelog SportIA completo y el buzón
 *           (últimas 30 sugerencias guardadas). Todo calculado para AHORA.
 *  · POST → envía una sugerencia al buzón del desarrollador (rate-limitado
 *           y validada con zod: sin spam ni campos sorpresa).
 */

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const BUZON_LIMITE: LimiteCfg = { max: 20, ventanaMs: 60_000 };

const EsquemaSugerencia = z.object({
  origen: z.enum(["sportia", "usuario"]).default("sportia"),
  titulo: z.string().trim().min(3).max(140),
  detalle: z.string().trim().min(3).max(1200),
  evento: z.string().trim().max(140).default(""),
  ventana: z.string().trim().max(80).default(""),
  prioridad: z.enum(["alta", "media", "baja"]).default("media"),
  mes: z.number().int().min(1).max(12).default(1),
});

const respuestaError = (mensaje: string, estado: number, extra?: Record<string, string>) =>
  NextResponse.json({ ok: false, error: mensaje }, { status: estado, headers: extra });

export async function GET() {
  const ahora = new Date();
  const reloj = progresoDelAnio(ahora);
  const sugerencias = sugerenciasParaElDev(ahora);
  const changelog = changelogSportia(ahora);

  let buzon: unknown[] = [];
  try {
    await ensureSchema();
    buzon = await db.sugerenciaDev.findMany({
      orderBy: [{ estado: "asc" }, { createdAt: "desc" }],
      take: 30,
    });
  } catch {
    // Sin base disponible, la parte CALCULADA sigue viva: el GET jamás 500ea.
  }

  return NextResponse.json({
    generadoEn: ahora.toISOString(),
    reloj,
    sugerencias,
    changelog,
    buzon,
  });
}

export async function POST(req: Request) {
  const ip = ipDeHeader(req.headers.get("x-forwarded-for"));
  if (!acumular(`sportia:${ip}`, BUZON_LIMITE, Date.now())) {
    return respuestaError(
      "Demasiadas sugerencias seguidas: deja que el perro respire e inténtalo en un minuto.",
      429,
      { "Retry-After": String(segundosRestantes(BUZON_LIMITE)) }
    );
  }

  let crudo: unknown;
  try {
    crudo = await req.json();
  } catch {
    return respuestaError("No se pudo leer la sugerencia: el cuerpo no es JSON válido.", 400);
  }

  const parsed = EsquemaSugerencia.safeParse(crudo);
  if (!parsed.success) {
    return respuestaError("La sugerencia no pasa la revisión: revisa título (3–140), detalle (3–1200) y los demás campos.", 400);
  }

  try {
    await ensureSchema();
    const fila = await db.sugerenciaDev.create({ data: parsed.data });
    return NextResponse.json({ ok: true, sugerencia: fila }, { status: 201 });
  } catch {
    return respuestaError("El buzón no está disponible en este momento. La sugerencia NO se ha perdido: la app la guarda en local y puede reenviarse.", 500);
  }
}
