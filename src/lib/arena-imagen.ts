// ============================================================
// todólogo.ai — Arena de imágenes (v1.19.0)
// Corazón compartido (servidor + cliente + demo) de la arena
// generativa con ELO separado: sorteo ciego de dúos y sello de
// estilo por modelo. Nada de lógica de BD aquí: solo puro dato.
// ============================================================

import { MODELS, AIModel, getModel } from "./models-data";

/** Modelos que compiten en la arena de imagen. */
export const MODELOS_IMAGEN: AIModel[] = MODELS.filter((m) => m.categories.includes("imagen"));

/**
 * Sello de estilo por modelo: hace que cada generador aporte un look
 * distinto dentro del motor único de Todólogo. El mismo mapa que el
 * Estudio usa desde v1.15.0, ahora fuente única para toda la app.
 */
export const SELLO_ESTILO: Record<string, string> = {
  "gpt-image-2.5-sunburst":
    "premium editorial photography, flawless typography, fine-grained control, high detail",
  "gpt-image-2.5-flare":
    "clean default look, balanced composition, natural colors",
  "gpt-image-2.5-instant":
    "quick sketch-like clarity, simple bold shapes",
  "gpt-image-2":
    "stable API look, crisp product photography",
  "nano-banana-pro":
    "poster-perfect lettering, vivid illustration, playful energy",
  "nano-banana-2":
    "casual creator aesthetic, warm tones",
  "seedream-5.0":
    "expressive polished aesthetics, cinematic glow",
  "midjourney-v8.2":
    "painterly light, artistic atmosphere, unmistakable aesthetic",
  "flux-2-pro":
    "surgical photorealism, sharp textures, studio lighting",
  "mai-image-2.6-preview":
    "clean office-product scene, diagram-friendly",
  "grok-imagine-2.0":
    "bold viral energy, punchy contrast",
};

export function selloDe(id: string): string {
  return SELLO_ESTILO[id] ?? "";
}

/**
 * Sortea un dúo ciego para la arena de imagen: dos modelos DISTINTOS del
 * tramo alto de la clasificación (70 % superior por ELO base, como en el
 * resto del arena). Espejo exacto de drawDuel/pickN del lado de texto.
 */
export function sortearDuoImagen(): [AIModel, AIModel] {
  const sorted = [...MODELOS_IMAGEN].sort((a, b) => b.elo - a.elo);
  const pool = sorted.slice(0, Math.ceil(sorted.length * 0.7));
  const a = pool[Math.floor(Math.random() * pool.length)];
  let b = pool[Math.floor(Math.random() * pool.length)];
  while (b.id === a.id) b = pool[Math.floor(Math.random() * pool.length)];
  return [a, b];
}

/** Nombre visible de un contendiente (o su id si la ficha desapareció). */
export function nombreDe(id: string): string {
  return getModel(id)?.name ?? id;
}
