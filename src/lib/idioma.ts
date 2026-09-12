/**
 * todólogo.ai — idiomas de la interfaz (v1.38.0): «Sistema» manda.
 *
 * Módulo mínimo y puro, compartido por settings.tsx (el ajuste uiLang),
 * i18n.tsx (el motor de traducción) y history.ts (timeAgo localizado).
 * Vive separado para que no exista ninguna dependencia circular entre
 * el store de ajustes y el motor de traducción.
 *
 * v1.38.0 — el usuario no debería tener que adivinar idiomas: la opción
 * «Sistema» (por defecto) sigue el idioma del navegador/dispositivo y la
 * UI se adapta sola. Quien quiera fijar uno, lo fija (Español/English).
 */

/** Idiomas concretos soportados por el shell (español = la clave fuente). */
export type IdiomaFijo = "es" | "en";

/**
 * Valor del ajuste: «sistema» (se adapta al dispositivo) o un idioma fijo.
 * «sistema» es el valor por defecto y el destino de cualquier entrada rara.
 */
export type IdiomaUI = "sistema" | IdiomaFijo;

/** Metadatos para los selectores de idioma (Ajustes). */
export const IDIOMAS_UI: { id: IdiomaUI; label: string }[] = [
  { id: "sistema", label: "Sistema" },
  { id: "es", label: "Español" },
  { id: "en", label: "English" },
];

/** Idioma base: la casa nació en español y el diccionario usa español como clave. */
export const IDIOMA_BASE: IdiomaFijo = "es";

/** Valor por defecto del ajuste: la UI se adapta sola al idioma del dispositivo. */
export const IDIOMA_DEFECTO: IdiomaUI = "sistema";

/** Idioma legítimo: acepta cualquier IdiomaUI y degrada a «sistema» (se adapta). */
export function idiomaValido(v: unknown): IdiomaUI {
  return v === "es" || v === "en" ? v : "sistema";
}

/**
 * Lee el idioma del navegador/dispositivo y devuelve el soportado más
 * cercano: recorre `navigator.languages` en orden de preferencia del
 * usuario y cae al español (la casa) si no hay coincidencia. Seguro en
 * SSR: sin `navigator` devuelve el base.
 */
export function idiomaDelNavegador(): IdiomaFijo {
  if (typeof navigator === "undefined") return IDIOMA_BASE;
  const candidatas = Array.isArray(navigator.languages) && navigator.languages.length > 0
    ? navigator.languages
    : navigator.language
      ? [navigator.language]
      : [];
  for (const candidata of candidatas) {
    const prefijo = candidata.slice(0, 2).toLowerCase();
    if (prefijo === "en") return "en";
    if (prefijo === "es") return "es";
  }
  return IDIOMA_BASE;
}

/**
 * Resuelve el ajuste a un idioma concreto: «sistema» pregunta al
 * dispositivo; un idioma fijo se queda como está.
 */
export function resolverIdioma(idioma: IdiomaUI): IdiomaFijo {
  return idioma === "sistema" ? idiomaDelNavegador() : idioma;
}
