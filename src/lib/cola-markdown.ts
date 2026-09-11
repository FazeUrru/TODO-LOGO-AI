// ============================================================
// todólogo.ai — Partición incremental del texto en streaming (v1.23.0)
//
// EL ATASCO QUE CIERRA: cada flush de 80 ms re-parseaba con react-markdown
// y re-resaltaba con Prism el texto ACUMULADO completo — coste O(n²) que
// con respuestas largas de código saturaba el hilo de la UI: el texto
// llegaba pero la pantalla «no avanzaba».
//
// La cura: partir el texto en «fija» (bloques ya cerrados → se pintan UNA
// vez y el memo salta los repintados) y «cola» (el bloque en crecimiento →
// se repinta por flush sin resaltado). Funciones PURAS, sin React:
// testeables y compartibles.
// ============================================================

/** ¿Deja el texto una valla (``` o ~~~) abierta? Determina dónde NO cortar. */
export function vallasAbiertas(text: string): boolean {
  let pares = 0;
  for (const linea of text.split("\n")) {
    if (/^\s{0,3}(```|~~~)/.test(linea)) pares++;
  }
  return pares % 2 === 1;
}

const RE_ITEM_LISTA = /^\s*(?:\d+[.)]|[-*+])\s/;
const RE_CITA = /^\s*>/;

/**
 * Parte el texto en { fija, cola } por el último doble salto de línea cuyo
 * prefijo deja todos los bloques cerrados y no parte una lista ni una cita
 * en dos (para no renumerar listas sueltas ni trocear blockquotes). Si no
 * hay corte seguro, la cola es el texto entero — y la cola, mientras el
 * stream vive, se pinta pelada: barata siempre.
 *
 * Invariante: `fija + "\n\n" + cola === texto` cuando hay corte.
 */
export function partirCola(text: string): { fija: string; cola: string } {
  if (!text) return { fija: "", cola: "" };
  let corte = text.lastIndexOf("\n\n");
  while (corte > 0) {
    const cabeza = text.slice(0, corte);
    const cola = text.slice(corte + 2);
    const primera = cola.split("\n", 1)[0] ?? "";
    const ultima = cabeza.slice(cabeza.lastIndexOf("\n") + 1) || cabeza;
    const rompeLista = RE_ITEM_LISTA.test(primera) && RE_ITEM_LISTA.test(ultima);
    const rompeCita = RE_CITA.test(primera) && RE_CITA.test(ultima);
    if (!vallasAbiertas(cabeza) && !rompeLista && !rompeCita) {
      return { fija: cabeza, cola };
    }
    corte = cabeza.lastIndexOf("\n\n");
  }
  return { fija: "", cola: text };
}
