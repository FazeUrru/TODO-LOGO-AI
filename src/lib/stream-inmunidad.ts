// ============================================================
// todólogo.ai — STREAM FOREVER · Inmunidad adaptativa (v1.24.0)
//
// "QUE NO SE CORTE NUNCA": ningún techo de la plataforma (maxDuration
// del serverless, proxy que traga la conexión, upstream que muere a
// mitad de un bloque de código) puede dejar una respuesta a medias.
//
// Tres piezas:
//
//  1. REANUDACIÓN POR TRAMOS: cuando un tramo se corta, el cliente
//     reanuda SOLO lo que falta: envía el texto acumulado y el modelo
//     CONTINÚA desde el carácter exacto. Los tramos se encadenan
//     infinitos: 55s por tramo × tramos ilimitados = stream eterno.
//  2. ANTI-SOLAPE: los modelos al continuar suelen repetir la última
//     línea (a veces medio párrafo). quitarSolape() recorta la cabeza
//     del tramo nuevo contra la cola del texto ya pintado.
//  3. MEMORIA INMUNITARIA (lo autoevolutivo): cada corte real deja
//     huella en el dispositivo (localStorage). La memoria ajusta sus
//     propios parámetros: el umbral del vigilante de silencio y el
//     número máximo de tramos. Racha de curaciones → el vigilante
//     reacciona más rápido y admite más tramos; curaciones fallidas →
//     se modera. El sistema aprende del tráfico real de cada red.
//
// Funciones puras + almacenamiento inyectable: 100% testeable.
// ============================================================

/** Ventana máxima de solape a comparar entre cola del previo y cabeza del nuevo. */
export const MAX_SOLAPE = 400;

/** Tramos de reanudación: base, mínimo y techo absoluto. */
export const TRAMOS_BASE = 10;
export const TRAMOS_MIN = 4;
export const TRAMOS_MAX_TOPE = 30;

/** Umbral del vigilante de silencio del cliente (con heartbeats de 2s). */
export const UMBRAL_BASE_MS = 25_000;
export const UMBRAL_MIN_MS = 12_000;
export const UMBRAL_MAX_MS = 40_000;

/**
 * Quita de la cabeza de `nuevo` el solape con la cola de `previo`.
 * Devuelve `nuevo` recortado: si el modelo repitió la última frase
 * (o los últimos N caracteres) al continuar, no se duplica ni un carácter.
 * Sin solape → devuelve `nuevo` intacto.
 */
export function quitarSolape(previo: string, nuevo: string, maxSolape: number = MAX_SOLAPE): string {
  if (!previo || !nuevo) return nuevo;
  const kMax = Math.min(maxSolape, previo.length, nuevo.length);
  // Del solape más grande al más pequeño: la primera coincidencia gana.
  // Umbral anti-falsos-positivos: 8 caracteres — salvo que el tramo nuevo
  // ENTERO sea el solape (el modelo repitió la cola completa).
  for (let k = kMax; k >= 8 || k === nuevo.length; k--) {
    if (previo.slice(-k) === nuevo.slice(0, k)) return nuevo.slice(k);
    if (k === nuevo.length && k < 8) break; // ya se probó el tramo entero
  }
  return nuevo;
}

/**
 * Instrucción de reanudación que acompaña al texto parcial: el modelo
 * continúa EXACTAMENTE donde lo dejó — sin repetir, sin preámbulos.
 */
export function promptReanudacion(tramo: number): string {
  return [
    `(REANUDACIÓN AUTOMÁTICA · TRAMO ${tramo}) Tu respuesta anterior se interrumpió por un corte técnico (no tuyo): en el historial tienes EXACTAMENTE lo que ya escribiste, y el usuario lo está viendo en pantalla.`,
    "CONTINÚA la respuesta desde el carácter exacto donde se quedó:",
    "· Prohibido repetir, resumir o reescribir ni una palabra de lo ya escrito.",
    "· Prohibido preámbulos («Continúo», «Claro», «Retomando»): el primer carácter de tu respuesta empalma directamente con la última letra del historial.",
    "· Si el corte partió un bloque de código a mitad, reabre la valla de código y reanuda el código en el punto exacto, y termínalo COMPLETO.",
    "· Si la respuesta ya estaba realmente terminada cuando se cortó, responde solo con la marca exacta: [FIN].",
  ].join("\n");
}

/* ── Memoria inmunitaria ──────────────────────────────────── */

export interface MemoriaInmunidad {
  /** Cortes de stream vistos en este dispositivo. */
  cortesVistos: number;
  /** Cortes curados sin intervención del usuario. */
  cortesCurados: number;
  /** Racha actual de curaciones consecutivas. */
  racha: number;
  /** Umbral del vigilante de silencio (ms) — se adapta con la experiencia. */
  umbralSilencioMs: number;
  /** Tramos máximos de reanudación por respuesta — evoluciona. */
  tramosMax: number;
}

export const INMUNIDAD_INICIAL: MemoriaInmunidad = {
  cortesVistos: 0,
  cortesCurados: 0,
  racha: 0,
  umbralSilencioMs: UMBRAL_BASE_MS,
  tramosMax: TRAMOS_BASE,
};

export type EventoInmunidad = "corte-curado" | "corte-sin-curar" | "falso-positivo";

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * El corazón autoevolutivo: cada incidente real reajusta los parámetros.
 *
 *  · corte-curado      → racha+1; con racha múltiplo de 3 el sistema gana
 *                        confianza: vigilante más rápido (−1,5s) y más
 *                        tramos permitidos (+2).
 *  · corte-sin-curar   → racha a cero y tramos−2: si reanudar no está
 *                        curando, moderar el empeño en vez de martillear.
 *  · falso-positivo    → vigilante+2s: disparó sobre un stream vivo.
 */
export function ajustarInmunidad(mem: MemoriaInmunidad, evento: EventoInmunidad): MemoriaInmunidad {
  const n: MemoriaInmunidad = { ...mem };
  if (evento === "corte-curado") {
    n.cortesVistos = mem.cortesVistos + 1;
    n.cortesCurados = mem.cortesCurados + 1;
    n.racha = mem.racha + 1;
    if (n.racha % 3 === 0) {
      n.umbralSilencioMs = clamp(n.umbralSilencioMs - 1_500, UMBRAL_MIN_MS, UMBRAL_MAX_MS);
      n.tramosMax = clamp(n.tramosMax + 2, TRAMOS_MIN, TRAMOS_MAX_TOPE);
    }
  } else if (evento === "corte-sin-curar") {
    n.cortesVistos = mem.cortesVistos + 1;
    n.racha = 0;
    n.tramosMax = clamp(n.tramosMax - 2, TRAMOS_MIN, TRAMOS_MAX_TOPE);
  } else {
    n.umbralSilencioMs = clamp(n.umbralSilencioMs + 2_000, UMBRAL_MIN_MS, UMBRAL_MAX_MS);
  }
  return n;
}

/** Clave de almacenamiento en localStorage. */
export const CLAVE_INMUNIDAD = "todologo.inmunidad.v1";

/** Carga la memoria con saneado completo (nunca lanza). */
export function cargarInmunidad(almacen?: Pick<Storage, "getItem">): MemoriaInmunidad {
  try {
    const crudo = (almacen ?? localStorage).getItem(CLAVE_INMUNIDAD);
    if (!crudo) return { ...INMUNIDAD_INICIAL };
    const j = JSON.parse(crudo) as Partial<MemoriaInmunidad>;
    return {
      cortesVistos: Number.isFinite(j.cortesVistos) ? Math.max(0, j.cortesVistos as number) : 0,
      cortesCurados: Number.isFinite(j.cortesCurados) ? Math.max(0, j.cortesCurados as number) : 0,
      racha: Number.isFinite(j.racha) ? Math.max(0, j.racha as number) : 0,
      umbralSilencioMs: clamp(Number(j.umbralSilencioMs) || UMBRAL_BASE_MS, UMBRAL_MIN_MS, UMBRAL_MAX_MS),
      tramosMax: clamp(Number(j.tramosMax) || TRAMOS_BASE, TRAMOS_MIN, TRAMOS_MAX_TOPE),
    };
  } catch {
    return { ...INMUNIDAD_INICIAL };
  }
}

/** Guarda la memoria (nunca lanza: storage bloqueado → se ignora). */
export function guardarInmunidad(mem: MemoriaInmunidad, almacen?: Pick<Storage, "setItem">): void {
  try {
    (almacen ?? localStorage).setItem(CLAVE_INMUNIDAD, JSON.stringify(mem));
  } catch {
    /* incógnito o cuota llena: la memoria vive solo en esta sesión */
  }
}
