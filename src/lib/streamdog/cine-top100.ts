/**
 * STREAMDOG · cine-top100.ts (v1.37.0) — el TOP 100, PURO y sin red.
 *
 * La clasificación definitiva de StreamDog: series, películas y
 * documentales del 1 al 100 con SEIS FILTROS. Todo el ranking se
 * calcula aquí, sin tocar internet, a partir de las listas rankeadas
 * de cine.ts (el orden de cada lista ES su puesto) — el backend solo
 * resuelve títulos → fichas y esta módulo manda en el orden:
 *
 *   · general     → el ranking global: primero los nº 1 de cada lista,
 *                   luego el resto por mejor puesto y consenso.
 *   · famosos     → los que todo el mundo conoce: éxitos eternos del
 *                   dominio público + series de Netflix + los que
 *                   aparecen en 2+ listas a la vez.
 *   · animacion   → dibujos y anime: TOPS_ANIMACION seguido de las
 *                   animadas míticas de Disney (ANIMADAS_DISNEY).
 *   · recientes   → TOPS_RECIENTES en su orden, y el resto del pool
 *                   detrás por consenso.
 *   · populares   → el consenso: puntuación = Σ (puesto normalizado en
 *                   cada lista donde aparece). Quien suma más puestos
 *                   altos en más listas, manda.
 *   · ambiguedad  → mezcla sorpresa sin reglas aparentes: barajado
 *                   DETERMINISTA por cubos (animación, hechos reales,
 *                   recientes, películas, series) en round-robin. El
 *                   mismo orden en cada dispositivo; solo cambia con
 *                   cada versión de las listas.
 *
 * La CI testea los 6 rankings sin red: `clasificarTop100` come un Map
 * de fichas y las listas canónicas — nada de mocks de fetch.
 */

import {
  EXITOSOS_MUNDIALES,
  RECOMENDADAS_APPLE,
  RECOMENDADAS_DISNEY,
  RECOMENDADAS_NETFLIX,
  RECOMENDADAS_PRIME,
  TOPS_ANIMACION,
  TOPS_FILMIN,
  TOPS_HBO_MAX,
  TOPS_HECHOS_REALES,
  TOPS_RECIENTES,
  type ItemCine,
} from "./cine";

/* ══════════════════ TIPOS ══════════════════ */

/** Los seis filtros del Top 100. */
export type FiltroTop100 = "general" | "famosos" | "animacion" | "recientes" | "populares" | "ambiguedad";

/** Metadatos de un filtro: id + clave canónica española para cine-i18n. */
export const FILTROS_TOP100: { id: FiltroTop100; clave: string }[] = [
  { id: "general", clave: "General" },
  { id: "famosos", clave: "Famosos" },
  { id: "animacion", clave: "Animación (Disney)" },
  { id: "recientes", clave: "Recientes" },
  { id: "populares", clave: "Populares" },
  { id: "ambiguedad", clave: "Ambigüedad" },
];

/** Valida cualquier entrada y cae a «general» (el filtro de la casa). */
export function filtroTop100Valido(v: unknown): FiltroTop100 {
  return FILTROS_TOP100.some((f) => f.id === v) ? (v as FiltroTop100) : "general";
}

/** Un puesto del Top 100: la ficha + su rango en la clasificación. */
export interface PuestoTop100 {
  item: ItemCine;
  /** 1..100 — el nº 1 manda. */
  puesto: number;
  /** Etiquetas de las listas donde aparece («Netflix», «Mundiales»…). */
  apariciones: string[];
  /** Mejor posición dentro de cualquier lista (1 = nº 1 de una lista). */
  mejorPuesto: number;
  /** Consenso acumulado: Σ (N − puesto) / N en cada lista donde sale. */
  puntuacion: number;
}

/** Entrada de ranking de un título (antes de resolver fichas). */
export interface EntradaTop100 {
  /** Título canónico (el primero visto al recorrer las listas). */
  titulo: string;
  apariciones: string[];
  mejorPuesto: number;
  puntuacion: number;
}

/* ══════════════════ LAS LISTAS Y SUS ETIQUETAS ══════════════════ */

/**
 * El pool rankeado del Top 100: cada lista conserva SU orden (su nº 1
 * es el nº 1 de la lista) y su etiqueta se muestra en la ficha. Las
 * marcas van sin traducir; los bloques temáticos usan sus claves
 * canónicas españolas, ya presentes en cine-i18n.
 */
export const LISTAS_TOP100: { etiqueta: string; lista: readonly string[] }[] = [
  { etiqueta: "Netflix", lista: RECOMENDADAS_NETFLIX },
  { etiqueta: "HBO Max", lista: TOPS_HBO_MAX },
  { etiqueta: "Prime Video", lista: RECOMENDADAS_PRIME },
  { etiqueta: "Apple TV+", lista: RECOMENDADAS_APPLE },
  { etiqueta: "Filmin", lista: TOPS_FILMIN },
  { etiqueta: "Disney+", lista: RECOMENDADAS_DISNEY },
  { etiqueta: "Animación", lista: TOPS_ANIMACION },
  { etiqueta: "Hechos reales", lista: TOPS_HECHOS_REALES },
  { etiqueta: "Recientes", lista: TOPS_RECIENTES },
  { etiqueta: "Mundiales", lista: EXITOSOS_MUNDIALES },
];

/**
 * Las animadas MÍTICAS de la fila Disney+ (The Bear y compañía son de
 * imagen real): entran en el filtro «Animación (Disney)» detrás del
 * TOPS_ANIMACION, en su propio orden.
 */
export const ANIMADAS_DISNEY: string[] = [
  "The Simpsons",
  "Gravity Falls",
  "Phineas and Ferb",
  "Bluey",
  "X-Men '97",
];

/* ══════════════════ CLAVES DE TÍTULO ══════════════════ */

/**
 * Clave de dedupe entre listas: minúsculas, sin acentos, sin signos.
 * «Élite» y «elite» son la misma serie; «D.O.A.» y «DOA» también.
 */
export function claveTitulo(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/* ══════════════════ MAPA DE APARICIONES ══════════════════ */

/**
 * Recorre las 10 listas en orden y construye el mapa clave → entrada:
 * apariciones (etiquetas), mejor puesto y puntuación de consenso.
 * La puntuación premia puestos altos en listas LARGAS: (N − puesto)/(N + 1)
 * — así el nº 1 de HBO (50/51 ≈ 0.98) pesa más que el nº 1 de una lista
 * de 10 (10/11 ≈ 0.91) y ningún título llega al 1.0 perfecto: el
 * «populares» siempre tiene matices, nunca empates planos de lista.
 */
export function entradasTop100(): Map<string, EntradaTop100> {
  const mapa = new Map<string, EntradaTop100>();
  for (const { etiqueta, lista } of LISTAS_TOP100) {
    const n = lista.length;
    for (let i = 0; i < n; i++) {
      const clave = claveTitulo(lista[i]);
      if (!clave) continue;
      const peso = (n - i) / (n + 1);
      const previa = mapa.get(clave);
      if (previa) {
        if (!previa.apariciones.includes(etiqueta)) previa.apariciones.push(etiqueta);
        previa.mejorPuesto = Math.min(previa.mejorPuesto, i + 1);
        previa.puntuacion += peso;
      } else {
        mapa.set(clave, { titulo: lista[i], apariciones: [etiqueta], mejorPuesto: i + 1, puntuacion: peso });
      }
    }
  }
  return mapa;
}

/* ══════════════════ TÍTULOS A RESOLVER ══════════════════ */

/**
 * Los títulos del pool que se resuelven contra TVMaze (las 9 listas de
 * plataformas y temáticos). Los EXITOSOS_MUNDIALES van por Archive en
 * UNA consulta (archiveFamososUrl) — no están aquí.
 */
export function titulosTop100Tvmaze(): string[] {
  const vistos = new Set<string>();
  const titulos: string[] = [];
  for (const { lista } of LISTAS_TOP100) {
    if (lista === EXITOSOS_MUNDIALES) continue;
    for (const titulo of lista) {
      const clave = claveTitulo(titulo);
      if (!clave || vistos.has(clave)) continue;
      vistos.add(clave);
      titulos.push(titulo);
    }
  }
  return titulos;
}

/* ══════════════════ ORDEN POR FILTRO ══════════════════ */

/** Cubos de la mezcla ambigua, en el orden del round-robin. */
const CUBOS_AMBIGUOS = ["animacion", "reales", "recientes", "peliculas", "series"] as const;
type CuboAmbiguo = (typeof CUBOS_AMBIGUOS)[number];

/** A qué cubo pertenece una clave de título (primera coincidencia manda). */
function cuboDe(clave: string, animadas: Set<string>, porCubo: Record<CuboAmbiguo, Set<string>>): CuboAmbiguo {
  if (animadas.has(clave) || porCubo.animacion.has(clave)) return "animacion";
  if (porCubo.reales.has(clave)) return "reales";
  if (porCubo.recientes.has(clave)) return "recientes";
  if (porCubo.peliculas.has(clave)) return "peliculas";
  return "series";
}

/**
 * MEZCLA AMBIGUA (v1.37.0): barajado determinista por cubos en
 * round-robin — animación, hechos reales, recientes, películas y
 * series se alternan, así que nunca sabes qué viene después (una
 * serie, luego un clásico, luego anime…). Sin aleatoriedad: el MISMO
 * pool produce el MISMO orden en todos los dispositivos; el orden solo
 * cambia cuando cambian las listas canónicas (o sea, con cada versión).
 */
export function mezclarAmbigua(claves: string[]): string[] {
  const animadas = new Set(ANIMADAS_DISNEY.map(claveTitulo));
  const porCubo: Record<CuboAmbiguo, Set<string>> = {
    animacion: new Set(TOPS_ANIMACION.map(claveTitulo)),
    reales: new Set(TOPS_HECHOS_REALES.map(claveTitulo)),
    recientes: new Set(TOPS_RECIENTES.map(claveTitulo)),
    peliculas: new Set(EXITOSOS_MUNDIALES.map(claveTitulo)),
    series: new Set(),
  };

  const colas = new Map<CuboAmbiguo, string[]>(CUBOS_AMBIGUOS.map((c) => [c, []]));
  for (const clave of claves) {
    colas.get(cuboDe(clave, animadas, porCubo))!.push(clave);
  }

  const mezcla: string[] = [];
  while (mezcla.length < claves.length) {
    let avanzo = false;
    for (const cubo of CUBOS_AMBIGUOS) {
      const cola = colas.get(cubo)!;
      const siguiente = cola.shift();
      if (siguiente !== undefined) {
        mezcla.push(siguiente);
        avanzo = true;
      }
    }
    if (!avanzo) break; // seguridad: sin colas no hay bucle infinito
  }
  return mezcla;
}

/**
 * El ORDEN de un filtro como claves de título (sin fichas): la parte
 * 100 % pura y testeable del ranking. `tope` recorta a 100 en
 * `clasificarTop100`; aquí se devuelve el orden completo para tests.
 */
export function ordenFiltro(filtro: FiltroTop100, entradas: Map<string, EntradaTop100>): string[] {
  const todas = [...entradas.keys()];

  const porConsenso = (a: string, b: string): number => {
    const ea = entradas.get(a)!;
    const eb = entradas.get(b)!;
    return eb.puntuacion - ea.puntuacion || eb.apariciones.length - ea.apariciones.length || ea.mejorPuesto - eb.mejorPuesto || a.localeCompare(b);
  };
  const porMejorPuesto = (a: string, b: string): number => {
    const ea = entradas.get(a)!;
    const eb = entradas.get(b)!;
    return ea.mejorPuesto - eb.mejorPuesto || eb.apariciones.length - ea.apariciones.length || eb.puntuacion - ea.puntuacion || a.localeCompare(b);
  };

  switch (filtro) {
    case "general":
      return todas.sort(porMejorPuesto);

    case "famosos": {
      const famosas = todas.filter((clave) => {
        const e = entradas.get(clave)!;
        return e.apariciones.includes("Mundiales") || e.apariciones.includes("Netflix") || e.apariciones.length >= 2;
      });
      return famosas.sort((a, b) => {
        const ea = entradas.get(a)!;
        const eb = entradas.get(b)!;
        return eb.apariciones.length - ea.apariciones.length || eb.puntuacion - ea.puntuacion || a.localeCompare(b);
      });
    }

    case "animacion": {
      const enPool = (lista: readonly string[]) => lista.map(claveTitulo).filter((c) => entradas.has(c));
      const vistas = new Set<string>();
      const orden: string[] = [];
      for (const clave of [...enPool(TOPS_ANIMACION), ...enPool(ANIMADAS_DISNEY)]) {
        if (vistas.has(clave)) continue;
        vistas.add(clave);
        orden.push(clave);
      }
      return orden;
    }

    case "recientes": {
      const recientes = TOPS_RECIENTES.map(claveTitulo).filter((c) => entradas.has(c));
      const resto = todas.filter((c) => !recientes.includes(c)).sort(porMejorPuesto);
      return [...recientes, ...resto];
    }

    case "populares":
      return todas.sort(porConsenso);

    case "ambiguedad":
      return mezclarAmbigua(todas);
  }
}

/* ══════════════════ CLASIFICADOR ══════════════════ */

/**
 * El Top 100 de un filtro: orden puro → fichas resueltas del pool →
 * puestos 1..N (tope 100). Las claves sin ficha (TVMaze/Archive no
 * encontraron el título) caen sin ruido — degradación elegante.
 */
export function clasificarTop100(
  fichas: Map<string, ItemCine>,
  filtro: FiltroTop100,
  entradas: Map<string, EntradaTop100> = entradasTop100(),
  tope = 100
): PuestoTop100[] {
  const orden = ordenFiltro(filtro, entradas);
  const puestos: PuestoTop100[] = [];
  for (const clave of orden) {
    const item = fichas.get(clave);
    if (!item) continue;
    const entrada = entradas.get(clave)!;
    puestos.push({
      item,
      puesto: puestos.length + 1,
      apariciones: [...entrada.apariciones],
      mejorPuesto: entrada.mejorPuesto,
      puntuacion: entrada.puntuacion,
    });
    if (puestos.length >= tope) break;
  }
  return puestos;
}
