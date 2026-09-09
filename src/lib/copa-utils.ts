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
