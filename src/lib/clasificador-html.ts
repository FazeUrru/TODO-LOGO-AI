// ============================================================
// todólogo.ai — Clasificador de HTML generado (v1.21.0)
// ============================================================
//
// EL BUG QUE CIERRA (v1.21.0): hasta ahora, CUALQUIER documento HTML
// completo con enjundia (>1500 caracteres) se etiquetaba como «juego
// jugable». Resultado: pedías una app fullstack en Modo Código, el
// modelo entregaba una web de una sola pieza… y la interfaz la
// presentaba en el marco de «Juego en tiempo real», escondiendo
// además el código. El artefacto debe depender de lo que pide el
// usuario: un juego cuando pide un juego, una app cuando pide una app.
//
// Reglas (en orden de fuerza):
//  · JUEGO — hay señales reales de juego: canvas + bucle/teclado,
//    o bucle + teclado + vocabulario de juego (juegos de DOM).
//  · APP — documento HTML completo sin señales de juego.
//  · null — fragmento, plantilla o algo que no corre solo.

/** Bloque ```html (completo o aún en construcción durante el streaming). */
export const RE_FENCE_ABIERTO = /```html[ \t]*\r?\n([\s\S]*?)(?:```|$)/i;
export const RE_FENCE_CERRADO = /```html[ \t]*\r?\n[\s\S]*?```/i;

/** Extrae el primer bloque ```html con enjundia mínima para correr. */
export function extraerBloqueHtml(txt: string): { code: string; completo: boolean } | null {
  const m = RE_FENCE_ABIERTO.exec(txt);
  if (!m) return null;
  const code = m[1].trim();
  if (code.length < 60) return null;
  return { code, completo: RE_FENCE_CERRADO.test(txt) };
}

/** Quita el primer bloque ```html del texto (para dejar solo la prosa). */
export function quitarBloqueHtml(txt: string): string {
  return txt.replace(RE_FENCE_ABIERTO, "").trim();
}

/* ── Señales de juego ── */

const RE_CANVAS = /<canvas[\s>]/i;
const RE_BUCLE = /requestAnimationFrame/i;
const RE_TECLADO =
  /keydown|keyup|keypress|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|KeyA|KeyD|\bWASD\b|\bmovimiento\b/i;
/** Vocabulario de juego: cada aparición suma (global, no solo booleano). */
const RE_VOCAB_JUEGO =
  /puntuaci[óo]n|enemigo|oleada|game\s*over|gameover|r[ée]cord|\bvidas?\b|\bjefe\b|\bboss\b|jugador|partida\b|moneda|\bniveles?\b|respawn|power[\s-]?up|highscore|marcador\b/gi;

/** ¿Documento HTML completo con cuerpo suficiente para ejecutarse solo? */
export function esDocumentoCompleto(code: string): boolean {
  return code.length > 1500 && /<!doctype\s+html|<html[\s>]/i.test(code);
}

/**
 * Clasifica un bloque HTML: «juego» (con señales reales de juego),
 * «app» (documento completo que no es un juego) o null (no clasifica).
 * En Modo Juego la interfaz fuerza «juego» sin pasar por aquí: esto
 * solo decide los casos ambiguos (Modo Código, texto, web…).
 */
export function clasificarHtml(code: string): "juego" | "app" | null {
  const vocab = (code.match(RE_VOCAB_JUEGO) ?? []).length;
  const canvas = RE_CANVAS.test(code);
  const bucle = RE_BUCLE.test(code);
  const teclado = RE_TECLADO.test(code);

  // Juego con lienzo: canvas + (bucle de animación, teclado o vocabulario).
  if (canvas && (bucle || teclado || vocab >= 2)) return "juego";
  // Juego de DOM (el marco del Modo Juego lo permite): bucle + teclado + vocabulario.
  if (bucle && teclado && vocab >= 2) return "juego";
  // Documento completo sin señales de juego: es una app/web.
  if (esDocumentoCompleto(code)) return "app";
  return null;
}
