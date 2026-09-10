/**
 * Claves API personales (v1.20.0 — API pública v2).
 *
 * La API de lectura (/api/v2/leaderboard, /api/v2/models, /api/v2/campeones,
 * /api/v2/jurados) es abierta. La de generación (/api/v2/battle, /api/v2/vote)
 * exige una clave personal porque consume LLM: cada clave lleva su propio
 * rate-limit, contador de llamadas y revocación inmediata. Formato
 * `sk-todo-<48 hex>` (inconfundible y escaneable por secret-scanners).
 *
 * Máximo 5 claves activas por usuario — suficientes para dev/prod/CI, pocas
 * como para que un leak pase desapercibido.
 */

import { randomBytes } from "crypto";
import { acumular, type LimiteCfg } from "./rate-limit";

/** 20 llamadas/minuto por clave: margen holgado para apps reales, hostil a bots. */
export const LIMITE_API_V2: LimiteCfg = { max: 20, ventanaMs: 60_000 };

export const MAX_CLAVES_POR_USUARIO = 5;

export interface ClavePublica {
  id: string;
  nombre: string;
  enmascarada: string; // sk-todo-a1b2c3…9z8y
  llamadas: number;
  ultimoUso: string | null;
  revocada: boolean;
  creada: string;
}

/** Genera un secreto nuevo con el prefijo canónico. */
export function generarSecreto(): string {
  return `sk-todo-${randomBytes(24).toString("hex")}`;
}

/** Enmascara para listados: nadie necesita ver el secreto completo dos veces. */
export function enmascarar(key: string): string {
  return `${key.slice(0, 16)}…${key.slice(-4)}`;
}

/** Valida `X-Api-Key` contra la BD y consume su rate-limit en memoria. */
export async function validarClave(
  header: string | null
): Promise<{ ok: true; keyId: string } | { ok: false; motivo: "falta" | "invalida" | "revocada" | "limite"; retryAfter?: number }> {
  if (!header || !header.startsWith("sk-todo-")) return { ok: false, motivo: "falta" };
  // Import perezoso: las funciones puras (formato, máscaras, límites) se
  // pueden testear en CI sin arrancar el cliente Prisma.
  const { db } = await import("./db");
  let fila;
  try {
    fila = await db.apiKey.findUnique({ where: { key: header } });
  } catch {
    return { ok: false, motivo: "invalida" };
  }
  if (!fila) return { ok: false, motivo: "invalida" };
  if (fila.revoked) return { ok: false, motivo: "revocada" };
  if (!acumular(`v2-clave:${fila.id}`, LIMITE_API_V2, Date.now())) {
    return { ok: false, motivo: "limite", retryAfter: 60 };
  }
  // Contador best-effort: nunca bloquea la llamada por fallar la escritura.
  try {
    await db.apiKey.update({
      where: { id: fila.id },
      data: { calls: { increment: 1 }, lastUsedAt: new Date() },
    });
  } catch {
    /* silencioso */
  }
  return { ok: true, keyId: fila.id };
}
