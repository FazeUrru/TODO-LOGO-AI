/**
 * ============================================================
 * todólogo.ai — v1.31.0 · Voz del navegador (TTS del chat)
 * ============================================================
 *
 * «Leer en voz alta» sobre las respuestas del asistente usando la
 * Web Speech API nativa (speechSynthesis): sin APIs externas, sin
 * claves y sin coste — el navegador ya trae un sintetizador.
 *
 *  · `textoParaLeer`  — limpia el markdown para no leer símbolos.
 *  · `partirEnFrases` — trocea textos largos (los navegadores truncan
 *    enunciados kilométricos y dejan la lectura a medias).
 *  · `hablar`         — encola la lectura respetando el idioma de la
 *    interfaz (es-ES / en-US) y avisa por callbacks.
 *  · `detenerVoz`     — corta en seco (y es seguro sin window: SSR).
 *
 * Complementa el Modo Voz existente (locución con voces propias vía
 * API): este es el «lector» universal de cualquier respuesta texto.
 */

/** Longitud objetivo por enunciado: abajo de esto ningún navegador trunca. */
const LIM_FRASE = 220;

/** ¿El navegador de este usuario puede hablar? */
export function vozDisponible(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Convierte markdown a «texto digerible»: los símbolos de formato no se
 * leen (o se anuncian con sentido: «bloque de código», «imagen») y los
 * enlaces se pronuncian por su texto visible.
 */
export function textoParaLeer(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " (bloque de código) ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " (imagen) ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parte un texto en trozos de hasta `lim` caracteres respetando el corte
 * de frase (. ¡ ? ? … :) y, en última instancia, cortando en el último
 * espacio — nunca a mitad de palabra.
 */
export function partirEnFrases(texto: string, lim: number = LIM_FRASE): string[] {
  const limpio = texto.trim();
  if (limpio.length <= lim) return limpio ? [limpio] : [];

  const frases = limpio.match(/[^.!?…:]+[.!?…:]*\s*/g) ?? [limpio];
  const trozos: string[] = [];
  let actual = "";

  const cerrar = () => {
    if (actual.trim()) trozos.push(actual.trim());
    actual = "";
  };

  for (const frase of frases) {
    // Una frase suelta más larga que el límite se parte por espacios.
    if (frase.length > lim) {
      cerrar();
      let resto = frase.trim();
      while (resto.length > lim) {
        let corte = resto.lastIndexOf(" ", lim);
        if (corte <= 0) corte = lim; // palabra gigante: corte duro
        trozos.push(resto.slice(0, corte).trim());
        resto = resto.slice(corte).trim();
      }
      actual = resto ? resto + " " : "";
      continue;
    }
    if ((actual + frase).length > lim) cerrar();
    actual += frase;
  }
  cerrar();
  return trozos;
}

/** Corta cualquier lectura en curso. Seguro en SSR y sin soporte. */
export function detenerVoz(): void {
  if (vozDisponible()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* algunos navegadores lanzan si no había nada en cola */
    }
  }
}

export interface HablarOpciones {
  /** Idioma de la interfaz: "es" | "en" (define la voz y el locale). */
  idioma: string;
  onFin?: () => void;
  onError?: () => void;
}

/**
 * Lee `texto` en voz alta. Encadena los trozos en orden y termina con
 * `onFin` (o `onError` si no hay sintetizador, el texto queda vacío o el
 * motor falla). Cancela cualquier lectura previa al empezar.
 */
export function hablar(texto: string, opts: HablarOpciones): void {
  if (!vozDisponible()) {
    opts.onError?.();
    return;
  }
  const synth = window.speechSynthesis;
  let trozos: string[];
  try {
    synth.cancel();
    trozos = partirEnFrases(textoParaLeer(texto));
  } catch {
    opts.onError?.();
    return;
  }
  if (trozos.length === 0) {
    opts.onError?.();
    return;
  }

  const prefijo = opts.idioma === "en" ? "en" : "es";
  const locale = opts.idioma === "en" ? "en-US" : "es-ES";
  // getVoices() puede venir vacío hasta el evento voiceschanged: si no hay
  // coincidencia dejamos la voz por defecto del navegador con u.lang correcto.
  let voces: SpeechSynthesisVoice[] = [];
  try {
    voces = synth.getVoices();
  } catch {
    voces = [];
  }
  const voz = voces.find((v) => v.lang.replace("_", "-").toLowerCase().startsWith(prefijo));

  let i = 0;
  const hablarTrozo = () => {
    if (i >= trozos.length) {
      opts.onFin?.();
      return;
    }
    let u: SpeechSynthesisUtterance;
    try {
      u = new SpeechSynthesisUtterance(trozos[i++]);
    } catch {
      opts.onError?.();
      return;
    }
    u.lang = locale;
    if (voz) u.voice = voz;
    u.rate = 1;
    u.pitch = 1;
    u.onend = () => hablarTrozo();
    u.onerror = () => opts.onError?.();
    try {
      synth.speak(u);
    } catch {
      opts.onError?.();
    }
  };
  hablarTrozo();
}
