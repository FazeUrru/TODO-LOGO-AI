/**
 * Logger estructurado (JSON Lines) sin dependencias externas.
 * Una línea por evento: nivel, mensaje y contexto plano.
 * En Vercel/Docker los logs JSON se pueden indexar directamente.
 */

type Level = "info" | "warn" | "error";

function emit(level: Level, event: string, ctx: Record<string, unknown> = {}) {
  const line = JSON.stringify({
    t: new Date().toISOString(),
    lvl: level,
    evt: event,
    ...ctx,
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (event: string, ctx?: Record<string, unknown>) => emit("info", event, ctx),
  warn: (event: string, ctx?: Record<string, unknown>) => emit("warn", event, ctx),
  error: (event: string, ctx?: Record<string, unknown>) => emit("error", event, ctx),
};

/** Envuelve una promesa y registra duración + resultado (para rutas API). */
export async function withTiming<T>(
  event: string,
  fn: () => Promise<T>,
  ctx: Record<string, unknown> = {}
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    logger.info(event, { ...ctx, ms: Date.now() - start, ok: true });
    return result;
  } catch (err) {
    logger.error(event, {
      ...ctx,
      ms: Date.now() - start,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
