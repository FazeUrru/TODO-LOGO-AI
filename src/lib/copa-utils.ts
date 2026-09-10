/**
 * Utilidades de la Copa Todólogo (v1.12.0).
 * El número de rondas depende SOLO del tamaño del cuadro (4→2, 8→3, 16→4):
 * nunca de copa.rounds.length, que crece conforme advance() crea las rondas
 * siguientes — usar esa longitud hacía que la primera semifinal se tomara por
 * la gran final (revelación prematura y campeón equivocado en el Salón).
 */

/** Número total de rondas de un cuadro de eliminación directa. */
export function totalRondas(size: number): number {
  return Math.round(Math.log2(size));
}

/** ¿Es la gran final? (la ronda que corona al campeón) */
export function esGranFinal(size: number, rIdx: number): boolean {
  return rIdx === totalRondas(size) - 1;
}

/* ─────────── v1.20.0 — Copas de 32 y 64 (graduación Labs copa-32-64) ─────────── */

/** Tamaños de cuadro admitidos por el Modo Torneo. */
export const COPA_SIZES = [4, 8, 16, 32, 64] as const;
export type CopaSize = (typeof COPA_SIZES)[number];

/**
 * Configuración de rondas por tamaño: nombre visible y prefijo de etiqueta
 * (los contendientes anónimos son «O1», «C4», «D7», «T23»…). Los cuadros de
 * 32 y 64 añaden las rondas de dieciseisavos y treintaidosavos.
 */
export const TAMANOS: Record<number, { names: string[]; prefixes: string[] }> = {
  4: { names: ["Semifinales", "Gran final"], prefixes: ["S", "F"] },
  8: { names: ["Cuartos de final", "Semifinales", "Gran final"], prefixes: ["C", "S", "F"] },
  16: {
    names: ["Octavos de final", "Cuartos de final", "Semifinales", "Gran final"],
    prefixes: ["O", "C", "S", "F"],
  },
  32: {
    names: [
      "Dieciseisavos de final",
      "Octavos de final",
      "Cuartos de final",
      "Semifinales",
      "Gran final",
    ],
    prefixes: ["D", "O", "C", "S", "F"],
  },
  64: {
    names: [
      "Treintaidosavos de final",
      "Dieciseisavos de final",
      "Octavos de final",
      "Cuartos de final",
      "Semifinales",
      "Gran final",
    ],
    prefixes: ["T", "D", "O", "C", "S", "F"],
  },
};

/** Contendiente mínimo para el sorteo (id + ELO de texto). */
export interface SemillaSorteo {
  id: string;
  elo: number;
}

/**
 * Sortea `n` IDs ÚNICOS del tramo alto del ranking (v1.17.1: solo texto).
 * v1.20.0 corrige una trampa real: el pool era el 70 % superior del catálogo
 * — con 58 modelos de texto son 41, así que una copa de 64 habría construido
 * el cuadro con `undefined` y la copa nacía corrupta. Ahora el pool se
 * expande al catálogo completo cuando el cuadro lo exige, y si aun así no
 * hay suficientes modelos la copa se reduce a la mayor potencia de 2
 * jugable en lugar de fabricar huecos fantasma.
 */
export function sortearIds(n: number, semillas: SemillaSorteo[]): string[] {
  const orden = [...semillas].sort((a, b) => b.elo - a.elo);
  const top = Math.max(Math.ceil(orden.length * 0.7), Math.min(n, orden.length));
  const pool = orden.slice(0, top);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const ids = pool.slice(0, n).map((s) => s.id);
  if (ids.length < n) {
    // Catálogo insuficiente: bajar a la mayor potencia de 2 jugable.
    let posible = 1;
    while (posible * 2 <= ids.length && posible * 2 <= n) posible *= 2;
    return ids.slice(0, posible);
  }
  return ids;
}
