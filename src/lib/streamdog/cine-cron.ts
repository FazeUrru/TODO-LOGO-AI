/**
 * STREAMDOG · cine-cron.ts (v1.33.0) — el cron empresarial, PURO.
 *
 * El catálogo «se actualiza cada hora» de verdad: un cron llama al
 * backend y cocina por adelantado las cachés que luego se sirven
 * calientes a los usuarios. Este módulo guarda la lógica PURA que la
 * CI puede testear sin red:
 *
 *   · autorizarCron      → solo el planificador (con CRON_SECRET) o el
 *                          dueño del despliegue puede disparar recargas;
 *                          si no hay secreto configurado, se permite en
 *                          desarrollo y se documenta en la respuesta.
 *   · registrarEjecucion → historial rotatorio (24 ejecuciones = 24 h)
 *                          para el panel de salud empresarial.
 *   · saludDe            → cómo acaba de comportarse el catálogo.
 *   · proximaEjecucion   → «a las HH:00» en texto humano, UTC.
 */

export const CRON_SCHEDULE = "0 * * * *";
export const CRON_MAX_HISTORIAL = 24;

export interface EjecucionCron {
  /** Epoch ms de arranque (id de la ejecución). */
  id: number;
  iniciado: number;
  /** Epoch ms de fin. */
  completado: number;
  duracionMs: number;
  ok: boolean;
  /** Filas de carrusel servidas por la recarga de inicio. */
  filas: number;
  /** Items calentados en total (inicio + listas). */
  items: number;
  degradada: boolean;
  errores: string[];
  /** Qué se calentó, por vista. */
  vistas: string[];
}

export type SaludCron = "ok" | "degradada" | "caida" | "sin-datos";

/**
 * ¿Puede quien llama disparar el cron? Con secreto configurado exige
 * «Authorization: Bearer <secreto>» o «x-cron-clave: <secreto>» (Vercel
 * Cron manda el primero; el webhook de GitHub Actions puede usar el que
 * convenga). Sin secreto (desarrollo local) se permite y se avisa.
 * Comparación en tiempo constante: nada de fugas por timing.
 */
export function autorizarCron(
  authHeader: string | null,
  claveHeader: string | null,
  secreto: string | undefined
): { permitido: boolean; razon: string } {
  if (!secreto) return { permitido: true, razon: "sin-secreto-configurado" };
  const esperado = `Bearer ${secreto}`;
  const igualesAuth =
    authHeader !== null && authHeader.length === esperado.length && igualConstante(authHeader, esperado);
  const igualesClave = claveHeader !== null && claveHeader.length === secreto.length && igualConstante(claveHeader, secreto);
  if (igualesAuth || igualesClave) return { permitido: true, razon: "autorizado" };
  return { permitido: false, razon: "secreto-incorrecto-o-ausente" };
}

/** Comparación en tiempo constante sin depender de APIs específicas. */
function igualConstante(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Añade una ejecución al historial (el más nuevo primero, tope 24 h). */
export function registrarEjecucion(historial: EjecucionCron[], ejecucion: EjecucionCron): EjecucionCron[] {
  return [ejecucion, ...historial].slice(0, CRON_MAX_HISTORIAL);
}

/** Salud según la ÚLTIMA ejecución: el estado que pinta el panel. */
export function saludDe(historial: EjecucionCron[]): SaludCron {
  const ultima = historial[0];
  if (!ultima) return "sin-datos";
  if (!ultima.ok) return "caida";
  return ultima.degradada ? "degradada" : "ok";
}

/** «Próxima ejecución: a las 15:00 (UTC)» — el minuto 00 que sigue. */
export function proximaEjecucion(ahora: number): string {
  const d = new Date(ahora);
  d.setUTCHours(d.getUTCHours() + 1, 0, 0, 0);
  const hh = String(d.getUTCHours()).padStart(2, "0");
  return `${hh}:00 (UTC)`;
}
