/**
 * todólogo.ai — idiomas de la interfaz (v1.29.0).
 *
 * Módulo mínimo y puro, compartido por settings.tsx (el ajuste uiLang),
 * i18n.tsx (el motor de traducción) y history.ts (timeAgo localizado).
 * Vive separado para que no exista ninguna dependencia circular entre
 * el store de ajustes y el motor de traducción.
 */

export type IdiomaUI = "es" | "en";

/** Metadatos para los selectores de idioma (Ajustes). */
export const IDIOMAS_UI: { id: IdiomaUI; label: string }[] = [
  { id: "es", label: "Español" },
  { id: "en", label: "English" },
];

/** Idioma por defecto: la casa nació en español y en español se queda. */
export const IDIOMA_BASE: IdiomaUI = "es";

/** Idioma legítimo: acepta cualquier IdiomaUI y degrada al base. */
export function idiomaValido(v: unknown): IdiomaUI {
  return v === "en" ? "en" : "es";
}
