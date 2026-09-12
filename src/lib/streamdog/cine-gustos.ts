/**
 * STREAMDOG · cine-gustos.ts (v1.38.0) — AUTOGUARDADO TOTAL, puro y sin red.
 *
 * Dos piezas que viven en el dispositivo (localStorage con autoreparación
 * de la casa vía leerColeccion/guardarColeccion) y NUNCA salen de él:
 *
 *  · AJUSTES — el usuario manda una vez y StreamDog obedece siempre:
 *      - autoplay         → ¿el reproductor arranca solo al abrir?
 *      - cargaInfinita    → ¿el scroll baja fichas solo o con botón?
 *      - velocidadIdx     → velocidad de reproducción por defecto
 *      - volumen          → volumen por defecto (0..1, paso 0.05)
 *
 *  · GUSTOS — lo que StreamDog aprende de ti mientras ves:
 *      - generos  → cuántas veces reprodujiste/añadiste cada género
 *      - fuentes  → cuántas veces por fuente (commons/archive/tvmaze)
 *      - ultimos  → los últimos títulos abiertos (para no recomendarte
 *                   lo mismo dos veces y para «Porque te gusta»)
 *
 * Todo son funciones PURAS y deterministas: la CI las testea sin red,
 * sin storage y sin navegador, igual que cine.ts y cine-top100.ts.
 */

import type { ItemCine } from "./cine";

/* ══════════════════ AJUSTES ══════════════════ */

export interface AjustesCine {
  /** Arrancar la reproducción solo al abrir el reproductor. */
  autoplay: boolean;
  /** El scroll carga fichas solo (IntersectionObserver) además del botón. */
  cargaInfinita: boolean;
  /** Índice en la tabla de velocidades del reproductor (0..4). */
  velocidadIdx: number;
  /** Volumen por defecto 0..1. */
  volumen: number;
}

export const AJUSTES_CINE_DEFECTO: AjustesCine = {
  autoplay: true,
  cargaInfinita: true,
  velocidadIdx: 1,
  volumen: 1,
};

/** Velocidades canónicas (mismo orden que el reproductor). */
export const VELOCIDADES_CINE = [0.75, 1, 1.25, 1.5, 2] as const;

/**
 * Validador TOLERANTE para leerColeccion: acepta el objeto completo o
 * un parcial (una versión antigua o truncada nunca rompe la sesión —
 * los campos que falten toman su defecto). Los campos basura se
 * descartan; si NO es un objeto, no es un ajuste válido (reparación).
 */
export function esAjustesCine(v: unknown): v is AjustesCine {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.autoplay === "boolean" &&
    typeof o.cargaInfinita === "boolean" &&
    typeof o.velocidadIdx === "number" &&
    Number.isFinite(o.velocidadIdx) &&
    o.velocidadIdx >= 0 &&
    o.velocidadIdx < VELOCIDADES_CINE.length &&
    typeof o.volumen === "number" &&
    Number.isFinite(o.volumen) &&
    o.volumen >= 0 &&
    o.volumen <= 1
  );
}

/** Fusiona un parcial con los defectos, campo a campo (migraciones sin drama). */
export function normalizarAjustesCine(v: unknown): AjustesCine {
  const o = (typeof v === "object" && v !== null && !Array.isArray(v) ? v : {}) as Partial<AjustesCine>;
  const defecto = AJUSTES_CINE_DEFECTO;
  const velocidadIdx =
    typeof o.velocidadIdx === "number" && Number.isFinite(o.velocidadIdx) && o.velocidadIdx >= 0 && o.velocidadIdx < VELOCIDADES_CINE.length
      ? Math.floor(o.velocidadIdx)
      : defecto.velocidadIdx;
  const volumen =
    typeof o.volumen === "number" && Number.isFinite(o.volumen) && o.volumen >= 0 && o.volumen <= 1 ? o.volumen : defecto.volumen;
  return {
    autoplay: typeof o.autoplay === "boolean" ? o.autoplay : defecto.autoplay,
    cargaInfinita: typeof o.cargaInfinita === "boolean" ? o.cargaInfinita : defecto.cargaInfinita,
    velocidadIdx,
    volumen,
  };
}

/* ══════════════════ GUSTOS ══════════════════ */

export interface GustosCine {
  /** Género (inglés, canónico de fuente) → veces consumido. */
  generos: Record<string, number>;
  /** Fuente → veces consumida. */
  fuentes: Record<string, number>;
  /** Últimos títulos abiertos (más nuevo primero, ids). */
  ultimos: string[];
  /** Epoch ms del último apunte. */
  actualizado: number;
}

/** Tope de géneros recordados: los que menos pesan caen (poda honesta). */
const TOPE_GENEROS = 12;
/** Tope de «últimos títulos»: memoria corta, recomendaciones frescas. */
const TOPE_ULTIMOS = 24;
/** Un género deja de crecer en este techo (evita monocracia eterna). */
const TECHO_GENERO = 40;

export function gustosVacios(ahora = 0): GustosCine {
  return { generos: {}, fuentes: {}, ultimos: [], actualizado: ahora };
}

/**
 * Validador estricto para leerColeccion (con autoreparación): todas las
 * claves presentes y del tipo correcto. Contadores negativos o no
 * finitos = inválido (se repara a vacío en el propio módulo: mejor
 * empezar de cero que recomendar con contadores podridos).
 */
export function esGustosCine(v: unknown): v is GustosCine {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return false;
  const o = v as Record<string, unknown>;
  if (typeof o.actualizado !== "number" || !Number.isFinite(o.actualizado)) return false;
  if (!Array.isArray(o.ultimos) || o.ultimos.some((x) => typeof x !== "string" || x.length === 0)) return false;
  if (typeof o.generos !== "object" || o.generos === null || Array.isArray(o.generos)) return false;
  if (typeof o.fuentes !== "object" || o.fuentes === null || Array.isArray(o.fuentes)) return false;
  const contadores = [...Object.values(o.generos), ...Object.values(o.fuentes)];
  return contadores.every((n) => typeof n === "number" && Number.isFinite(n) && n >= 0);
}

/** Incrementa un contador con techo, sin mutar el original. */
function subir(mapa: Record<string, number>, clave: string, techo: number): Record<string, number> {
  const actual = mapa[clave];
  const nuevo = Math.min(techo, (typeof actual === "number" && Number.isFinite(actual) && actual >= 0 ? actual : 0) + 1);
  return { ...mapa, [clave]: nuevo };
}

/** Poda los géneros menos vistos si se superó el tope (determinista). */
function podarGeneros(generos: Record<string, number>): Record<string, number> {
  const claves = Object.keys(generos);
  if (claves.length <= TOPE_GENEROS) return generos;
  return Object.fromEntries(
    claves
      .sort((a, b) => generos[b] - generos[a] || (a < b ? -1 : 1)) // más vistos primero; empate alfabético
      .slice(0, TOPE_GENEROS)
      .map((k) => [k, generos[k]])
  );
}

/**
 * APUNTAR GUSTOS (puro): el usuario abrió un título (o lo añadió a Mi
 * lista) — se apunta su fuente, sus géneros y el título en «últimos».
 * Devuelve un objeto NUEVO; nunca muta el que entra.
 */
export function apuntarGustos(gustos: GustosCine, item: ItemCine, ahora: number, tope = TOPE_ULTIMOS): GustosCine {
  if (!item || typeof item.id !== "string" || item.id.length === 0) return gustos;
  let generos = gustos.generos;
  for (const genero of item.generos.slice(0, 4)) {
    const limpia = genero.trim().slice(0, 40);
    if (limpia) generos = subir(generos, limpia, TECHO_GENERO);
  }
  return {
    generos: podarGeneros(generos),
    fuentes: subir(gustos.fuentes, item.fuente, 9_999),
    ultimos: [item.id, ...gustos.ultimos.filter((x) => x !== item.id)].slice(0, tope),
    actualizado: ahora,
  };
}

/* ══════════════════ RECOMENDADOS («Porque te gusta») ══════════════════ */

/**
 * Puntuación de afinidad de una ficha contra los gustos: cada género
 * conocido pesa 2 (por visto), la fuente pesa 1. Sin historial → 0.
 */
export function puntuarItem(gustos: GustosCine, item: ItemCine): number {
  let puntos = 0;
  for (const genero of item.generos) {
    const veces = gustos.generos[genero] ?? gustos.generos[genero.trim()];
    if (veces && veces > 0) puntos += 2 * veces;
  }
  const fuente = gustos.fuentes[item.fuente];
  if (fuente && fuente > 0) puntos += 1 * fuente;
  return puntos;
}

/**
 * «PORQUE TE GUSTA» (puro): sobre el pool YA cargado (las filas del
 * inicio + búsqueda), ordena por afinidad real con tus gustos y
 * descarta lo que ya tienes en «últimos» (nada de recomendarte lo que
 * acabas de ver) y lo que no despierta ninguna afinidad. Empate →
 * valoración más alta, luego título alfabético: determinista siempre.
 */
export function recomendadosPara(
  gustos: GustosCine,
  pool: readonly ItemCine[],
  tope = 14
): ItemCine[] {
  if (gustos.ultimos.length === 0 && Object.keys(gustos.generos).length === 0 && Object.keys(gustos.fuentes).length === 0) return [];
  const yaFuera = new Set(gustos.ultimos);
  const vistos = new Set<string>();
  const candidatas: { item: ItemCine; puntos: number }[] = [];
  for (const item of pool) {
    if (!item || vistos.has(item.id) || yaFuera.has(item.id)) continue;
    vistos.add(item.id);
    const puntos = puntuarItem(gustos, item);
    if (puntos <= 0) continue;
    candidatas.push({ item, puntos });
  }
  return candidatas
    .sort(
      (a, b) =>
        b.puntos - a.puntos ||
        (b.item.valoracion ?? 0) - (a.item.valoracion ?? 0) ||
        (a.item.titulo < b.item.titulo ? -1 : 1)
    )
    .slice(0, tope)
    .map((c) => c.item);
}
