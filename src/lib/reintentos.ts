// ============================================================
// todólogo.ai — Motor de reintentos con autocorrección (v1.19.1)
//
// "QUE NO SE ATASQUEN": ningún generador de la arena se queda
// mudo. Toda llamada al upstream pasa por este motor:
//
//  · HASTA 50 REINTENTOS (REINTENTOS_MAX) con pausa exponencial
//    con jitter — el techo es 50 o el presupuesto de reloj de la
//    ruta (en serverless maxDuration manda), lo que llegue antes.
//  · AUTOCORRECCIÓN EN CASCADA: cada reintento no repite el mismo
//    error a ciegas — la escalera autocorreccion(n) ajusta los
//    parámetros del intento (menos temperature, sin thinking,
//    historial recortado, prompt acotado, modo directo).
//  · VIGILANTE DE SILENCIO: un stream que se queda mudo se da por
//    caído y se regenera (watchdogDeLectura para ReadableStreams).
//  · TELEMETRÍA: cada reintento avisa al llamador (SSE `reintento`
//    en la batalla) y al logger — la UI puede mostrar
//    «Recuperando señal · intento N/50».
//
// Función pura de orquestación: sin BD, sin estado global, testeable.
// ============================================================

import { logger } from "./logger";

/** Techo absoluto de intentos por generación (1 intento inicial + 49 reintentos). */
export const REINTENTOS_MAX = 50;

export interface OpcionesReintento {
  /** Techo de intentos (por defecto 50). */
  max?: number;
  /** Presupuesto de reloj: pasado este límite se devuelve null (deadline-aware). */
  presupuestoMs?: number;
  /** Pausa base entre intentos (por defecto 350 ms). */
  pausaBaseMs?: number;
  /** Pausa máxima entre intentos (por defecto 3000 ms). */
  pausaMaxMs?: number;
  /** Aviso por cada fallo con su motivo (para SSE/telemetría/UI). */
  enFallo?: (info: { n: number; max: number; motivo: string }) => void;
}

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Ejecuta `fn` hasta que devuelva algo distinto de null/undefined o se
 * agoten los intentos. Cada fallo (null o excepción) dispara la pausa
 * exponencial y el siguiente intento con los ajustes de autocorrección
 * que correspondan según el número de intento.
 */
export async function conReintentos<T>(
  etiqueta: string,
  fn: (n: number, motivoPrevio: string | null) => Promise<T | null | undefined>,
  opts: OpcionesReintento = {}
): Promise<T | null> {
  const max = Math.max(1, Math.min(opts.max ?? REINTENTOS_MAX, REINTENTOS_MAX));
  const presupuesto = opts.presupuestoMs ?? Number.POSITIVE_INFINITY;
  const base = opts.pausaBaseMs ?? 350;
  const topePausa = opts.pausaMaxMs ?? 3000;
  const inicio = Date.now();
  let motivo: string | null = null;

  for (let n = 1; n <= max; n++) {
    // v1.19.2 — ANTES de cada intento (no solo entre pausas): si el reloj
    // ya consumió el presupuesto, no se arranca otro intento. Sin este
    // guardia, un intento de 55s + otro intento fresco de 25s superaban el
    // maxDuration del serverless y la función moría a medias con el stream
    // abierto (el cliente se quedaba colgado sin «end» y sin cierre).
    const consumido = Date.now() - inicio;
    if (n > 1 && consumido >= presupuesto) {
      logger.error("reintentos.agotados", { etiqueta, max, motivo, consumido, presupuesto });
      return null;
    }
    try {
      const r = await fn(n, motivo);
      if (r !== null && r !== undefined) return r;
      motivo = motivo ?? "respuesta vacía del upstream";
    } catch (e) {
      motivo = e instanceof Error ? e.message : String(e);
    }
    if (n < max) {
      opts.enFallo?.({ n, max, motivo: motivo ?? "desconocido" });
      logger.warn("reintentos.fallo", { etiqueta, n, max, motivo });
      const restante = presupuesto - (Date.now() - inicio);
      if (restante <= base) return null; // sin tiempo ni para la pausa
      const pausa = Math.min(base * Math.pow(1.35, n - 1), topePausa, restante - base);
      await dormir(Math.max(80, pausa + Math.random() * 150));
    }
  }
  logger.error("reintentos.agotados", { etiqueta, max, motivo });
  return null;
}

/**
 * Escalera de autocorrección: qué ajustar en el intento n. Cada escalón
 * ataca una causa distinta de atasco — nunca se repite el mismo intento
 * idéntico más de dos veces.
 */
export interface AjusteAutocorreccion {
  /** Multiplicador de temperature (1 → sin cambio). */
  factorTemperatura: number;
  /** A partir de aquí el thinking se desactiva (latencia y estabilidad). */
  thinking: boolean;
  /** Historial recortado a las últimas N jugadas (null = sin recorte). */
  recorteHistorial: number | null;
  /** Prompt acotado a N caracteres (null = íntegro). */
  recortePrompt: number | null;
  /** A partir de aquí conviene un intento sin streaming (una pieza). */
  modoDirecto: boolean;
}

export function autocorreccion(n: number): AjusteAutocorreccion {
  return {
    factorTemperatura: n === 1 ? 1 : n <= 3 ? 0.8 : 0.5,
    thinking: n <= 2,
    recorteHistorial: n <= 3 ? null : n <= 6 ? 6 : 2,
    recortePrompt: n <= 6 ? null : n <= 12 ? 1500 : 800,
    modoDirecto: n >= 10,
  };
}

/**
 * Vigilante de lectura para un ReadableStream: lanza cuando el upstream
 * calla demasiado — antes del primer chunk (primerChunkMs) o ENTRE chunks
 * (entreChunkMs). Así un stream mudo nunca congela la arena: muere, se
 * informa y el motor lo reintenta.
 *
 * v1.19.2 — CORRECCIÓN DEL ATASCO: antes se hacía `await iterador.return()`.
 * Un async generator con un `next()` pendiente solo completa su `return()`
 * cuando el `next()` pendiente resuelve — y ese `next()` esperaba eternamente
 * a `reader.read()` de un upstream colgado sin FIN. Resultado: el vigilante
 * que debía salvar el atasco era él mismo el que se atascaba, el SSE nunca
 * cerraba y el cliente se quedaba clavado a mitad de una respuesta (síntoma:
 * «la IA se queda atascada en un punto donde no avanza», típico al codificar
 * porque las respuestas largas multiplica las probabilidades de cuelgue).
 *
 * La secuencia correcta al detectar silencio es:
 *  1. `cancelar()` — cancela el READER directamente (no pasa por el
 *     generador): la especificación de Streams resuelve los `read()`
 *     pendientes con {done:true}, desbloqueando el generador.
 *  2. `iterador.return()` en fuego y olvido (NUNCA await).
 *  3. `throw` INMEDIATO: el reintento arranca ya.
 */
export async function* vigilanteDeLectura<T>(
  iterador: AsyncIterator<T>,
  opts: { primerChunkMs: number; entreChunkMs: number; cancelar?: () => void }
): AsyncGenerator<T> {
  let primero = true;
  while (true) {
    let despertar: ReturnType<typeof setTimeout> | undefined;
    const goteo = new Promise<"silencio">((resolve) => {
      despertar = setTimeout(() => resolve("silencio"), primero ? opts.primerChunkMs : opts.entreChunkMs);
    });
    let resultado: IteratorResult<T> | "silencio";
    try {
      resultado = await Promise.race([iterador.next(), goteo]);
    } finally {
      if (despertar) clearTimeout(despertar);
    }
    if (resultado === "silencio") {
      // 1) Cancelación DIRECTA del lector: desbloquea el read() pendiente.
      try {
        opts.cancelar?.();
      } catch {
        /* ya muerto */
      }
      // 2) Cierre del generador en fuego y olvido — awaiting it sería
      //    encolarse detrás del next() pendiente y colgarnos (el bug).
      try {
        Promise.resolve(iterador.return?.(undefined as never)).catch(() => {});
      } catch {
        /* ya muerto */
      }
      // 3) El throw sale YA: el motor de reintentos regenera sin esperar
      //    al upstream zombi.
      throw new Error(`vigilante: ${primero ? "sin primer chunk" : "silencio entre chunks"}`);
    }
    if (resultado.done) return;
    primero = false;
    yield resultado.value;
  }
}

/** Pausa utilitaria reutilizable por los clientes (backoff del lector SSE). */
export const pausaReintento = dormir;
