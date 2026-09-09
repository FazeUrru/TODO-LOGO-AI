/**
 * Rate-limiting por IP (v1.13.0) para las rutas de generación.
 *
 * Ventana fija en memoria por `IP + clave de ruta`: hasta `max` peticiones
 * por `ventanaMs`; la petición `max + 1` recibe 429 con `Retry-After`.
 * Diseñado para frenar el abuso de las rutas caras (batalla, copa, imagen,
 * agente) sin tocar el tráfico legítimo del arena. Es deliberadamente
 * en-proceso (como el store de copas pre-v1.13.0): barato, sin dependencias
 * y suficiente como primera barrera; el límite duro multi-instancia llegará
 * con el edge middleware cuando el proyecto lo necesite.
 *
 * El núcleo (`acumular`) es una función pura con reloj inyectable para que
 * la CI la pueda testear sin servidor.
 */

/** Registro: por cada clave (IP+ruta), los timestamps dentro de la ventana. */
const g = globalThis as unknown as { __todologoRate?: Map<string, number[]> };
const registro: Map<string, number[]> = (g.__todologoRate ??= new Map());

/** Límite máximo de peticiones y ventana en ms. */
export interface LimiteCfg {
  max: number;
  ventanaMs: number;
}

/**
 * Extrae la IP del cliente desde `x-forwarded-for` (Vercel, Docker, proxy)
 * tomando el primer valor de la lista; cae a `anon` si no viene.
 */
export function ipDeHeader(xff: string | null | undefined): string {
  if (!xff) return "anon";
  const primero = xff.split(",")[0]?.trim();
  return primero && primero.length > 0 ? primero : "anon";
}

/**
 * Núcleo puro: registra el intento en `ahora` y decide si pasa.
 * Devuelve `true` si la petición está dentro del límite, `false` si excede.
 * Purga los timestamps vencidos de la clave y las claves huérfanas de vez
 * en cuando para que el mapa no crezca sin control.
 */
export function acumular(clave: string, cfg: LimiteCfg, ahora: number): boolean {
  // Purga global barata: cuando el registro supera 4 096 claves, se limpian
  // las que no tengan timestamps vivos (amortizado, no en cada petición).
  if (registro.size > 4096) {
    for (const [k, ts] of registro) {
      const vivos = ts.filter((t) => ahora - t < cfg.ventanaMs);
      if (vivos.length === 0) registro.delete(k);
      else registro.set(k, vivos);
    }
  }

  const ts = (registro.get(clave) ?? []).filter((t) => ahora - t < cfg.ventanaMs);
  if (ts.length >= cfg.max) {
    registro.set(clave, ts);
    return false;
  }
  ts.push(ahora);
  registro.set(clave, ts);
  return true;
}

/** Límite por defecto de las rutas de generación: 12 cada 5 minutos. */
export const GEN_LIMITE: LimiteCfg = { max: 12, ventanaMs: 5 * 60 * 1000 };

/** Límite de votos: generoso, el voto es barato (60 cada 5 minutos). */
export const VOTO_LIMITE: LimiteCfg = { max: 60, ventanaMs: 5 * 60 * 1000 };

/** Segundos hasta que se levanta el bloqueo (para el header Retry-After). */
export function segundosRestantes(cfg: LimiteCfg, ahora = Date.now()): number {
  return Math.max(1, Math.ceil(cfg.ventanaMs / 1000));
}
