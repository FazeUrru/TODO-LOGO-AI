// ============================================================
// todólogo.ai — Vista previa automática del Modo Batalla (v1.27.0)
// ============================================================
//
// LA FUSIÓN: Z.AI renderiza el canvas EN VIVO mientras el modelo
// escribe el HTML; Arena AI lo presenta en un marco de navegador con
// pestañas. Aquí vive la parte PURA y testeable de esa fusión:
//  · detectar el artefacto en un texto en curso (válido a medias),
//  · leer el título del documento para la barra de direcciones,
//  · decidir CUÁNDO refrescar el iframe sin reventar el hilo de la UI
//    (mismo espíritu que cola-markdown: nada de O(n²) por token).
//
// La detección reutiliza extraerBloqueHtml (clasificador-html.ts,
// v1.21.0): su regex admite el fence ABIERTO (`(?:```|$)`), así que
// el artefacto se ve nacer carácter a carácter durante el streaming.

import { extraerBloqueHtml } from "./clasificador-html";

/** El cursor que el streaming pinta al final del texto (`▍`, U+258D)
 * no debe colarse dentro del HTML que ejecuta el iframe. */
export const CURSOR_STREAM = "\u258D";

export interface VistaPrevia {
  /** Código HTML tal como está (puede estar a medias durante el stream). */
  code: string;
  /** true si el fence ```html ya está cerrado. */
  completo: boolean;
  /** Título del documento (<title>) para la barra de direcciones. */
  titulo: string;
}

/** Título legible del documento HTML, recortado para la barra de URL. */
export function tituloDeHtml(code: string): string {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(code);
  if (!m) return "sin título";
  const t = m[1].replace(/\s+/g, " ").trim();
  if (!t) return "sin título";
  return t.length > 48 ? `${t.slice(0, 47)}…` : t;
}

/**
 * Detecta el artefacto HTML de la respuesta EN CURSO (válido con el
 * fence abierto). Devuelve null si no hay artefacto todavía: no hay
 * que abrir la vista para un ejemplo de 3 líneas — extraerBloqueHtml
 * ya exige ≥60 caracteres de código dentro del fence ```html.
 * El cursor del streaming se recorta para no ensuciar el sandbox.
 */
export function extraerVistaPrevia(txt: string): VistaPrevia | null {
  if (!txt) return null;
  const j = extraerBloqueHtml(txt);
  if (!j) return null;
  const code = j.code.replace(new RegExp(`${CURSOR_STREAM}+$`), "");
  if (!code) return null;
  return { code, completo: j.completo, titulo: tituloDeHtml(code) };
}

export interface PlanRefresco {
  /** Aplicar el srcDoc ahora mismo. */
  aplicar: boolean;
  /** Si no toca aún, milisegundos hasta el refresco aplazado (null = nada programado). */
  esperarMs: number | null;
}

/**
 * Decide si toca refrescar el srcDoc del iframe en vivo. Reglas:
 *  · sin cambios de longitud → nada;
 *  · primera vez (len previo 0) o intervalo ya vencido → aplicar YA;
 *  · dentro del intervalo → aplazar al vencimiento (un solo timer en cola).
 * Es el mismo truco anti-O(n²) del streaming: el iframe se repinta como
 * mucho cada `intervaloMs` aunque el texto crezca cada 80 ms.
 */
export function planificarRefresco(
  lenPrevio: number,
  lenNuevo: number,
  ultimoMs: number,
  ahoraMs: number,
  intervaloMs = 700
): PlanRefresco {
  if (lenNuevo === lenPrevio) return { aplicar: false, esperarMs: null };
  const restante = intervaloMs - (ahoraMs - ultimoMs);
  if (restante <= 0) return { aplicar: true, esperarMs: 0 };
  return { aplicar: false, esperarMs: restante };
}

/** Dirección decorativa de la barra del marco (no navega a ningún sitio). */
export function direccionVista(lado: "A" | "B" | "duelo", titulo: string): string {
  const sitio = lado === "duelo" ? "duelo" : `modelo-${lado.toLowerCase()}`;
  const t = titulo === "sin título" ? "artefacto" : titulo.toLowerCase().replace(/\s+/g, "-");
  return `todologo://batalla/${sitio}/${t}`;
}
