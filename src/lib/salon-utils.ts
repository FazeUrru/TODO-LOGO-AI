/**
 * Estadísticas del Salón de la Fama (v1.13.0).
 *
 * Cálculo puro y compartido: la API `/api/hall-of-fame` lo usa sobre las
 * filas de la BD, el motor demo sobre la lista de `localStorage`, y la CI
 * lo teste de extremo a extremo. Una sola definición = un solo criterio
 * de "modelo más coronado" en producción y en la demo.
 */

/** Fila de campeón, igual en BD y en la demo (fechas en ISO). */
export interface CampeonFila {
  copaId: string;
  prompt: string;
  size: number;
  campeon: { id: string; name: string };
  subcampeon: { id: string; name: string } | null;
  at: string;
}

/** Estadísticas agregadas que devuelve `GET /api/hall-of-fame`. */
export interface EstadisticasSalon {
  /** Copas coronadas registradas en total. */
  total: number;
  /** Top de modelos por títulos de copa (máximo 5). */
  porModelo: { id: string; name: string; titulos: number }[];
  /** Tamaño del cuadro más grande jamás coronado (null si no hay). */
  copaMasGrande: number | null;
  /** Copas de 8 o 16 modelos coronadas hasta hoy. */
  copasXL: number;
  /** Último campeón registrado (null si no hay). */
  ultimo: { id: string; name: string; prompt: string; at: string } | null;
}

/**
 * Agrega estadísticas desde una lista de campeones ordenada de más nuevo
 * a más antiguo (como la devuelve la BD). Tolera filas vacías o parciales.
 */
export function estadisticasSalon(campeones: CampeonFila[]): EstadisticasSalon {
  const filas = Array.isArray(campeones) ? campeones.filter((f) => !!f) : [];

  const titulos = new Map<string, { name: string; titulos: number }>();
  let copaMasGrande: number | null = null;
  let copasXL = 0;

  for (const f of filas) {
    if (!f.campeon || typeof f.campeon.id !== "string") continue;
    const previa = titulos.get(f.campeon.id);
    if (previa) previa.titulos += 1;
    else titulos.set(f.campeon.id, { name: f.campeon.name || f.campeon.id, titulos: 1 });

    const size = typeof f.size === "number" ? f.size : 4;
    if (copaMasGrande === null || size > copaMasGrande) copaMasGrande = size;
    if (size >= 8) copasXL += 1;
  }

  const porModelo = [...titulos.entries()]
    .map(([id, v]) => ({ id, name: v.name, titulos: v.titulos }))
    .sort((a, b) => b.titulos - a.titulos || a.name.localeCompare(b.name))
    .slice(0, 5);

  const primera = filas.find((f) => f.campeon && typeof f.campeon.id === "string");
  const ultimo = primera
    ? {
        id: primera.campeon.id,
        name: primera.campeon.name || primera.campeon.id,
        prompt: typeof primera.prompt === "string" ? primera.prompt : "",
        at: typeof primera.at === "string" ? primera.at : "",
      }
    : null;

  return { total: filas.length, porModelo, copaMasGrande, copasXL, ultimo };
}
