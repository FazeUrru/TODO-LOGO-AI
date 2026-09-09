// Utilidades ELO para el arena de todólogo.ai
import { MODELS, AIModel } from "./models-data";

export type Winner = "A" | "B" | "tie" | "bad";

export const BATTLE_CATEGORIES = [
  { id: "global", label: "General" },
  { id: "codigo", label: "Código" },
  { id: "razonamiento", label: "Razonamiento" },
  { id: "escritura", label: "Escritura" },
  { id: "agente", label: "Agente" },
  // ── Categorías exclusivas de todólogo.ai (no existen en arena.ai) ──
  { id: "matematicas", label: "Matemáticas" },
  { id: "datos", label: "Datos y SQL" },
  { id: "traduccion", label: "Traducción" },
  { id: "educacion", label: "Educación" },
  { id: "negocios", label: "Negocios" },
] as const;

/** Categorías nuevas frente al arena original (para insignias ¡NUEVO!). */
export const NEW_CATEGORIES = [
  "matematicas",
  "datos",
  "traduccion",
  "educacion",
  "negocios",
  // Arenas generativas (v1.15.0)
  "imagen",
  "video",
  "audio",
];

export function expectedScore(ra: number, rb: number): number {
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

/** Ajuste ELO derivado de los votos reales almacenados en la BD. */
export function eloDeltaFromVotes(
  wins: number,
  losses: number,
  ties: number
): number {
  const games = wins + losses + ties;
  if (games === 0) return 0;
  const raw = (18 * (wins - losses)) / Math.sqrt(2 + games) + ties * 1.2;
  return Math.max(-48, Math.min(48, Math.round(raw)));
}

/** Hash determinista para derivar ELO por categoría sin estado adicional. */
function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Categorías del modelo que potencian cada arena. */
const CAT_BOOST: Record<string, string[]> = {
  codigo: ["codigo"],
  razonamiento: ["razonamiento"],
  escritura: ["texto"],
  agente: ["agente"],
  matematicas: ["razonamiento"],
  datos: ["codigo", "razonamiento"],
  traduccion: ["texto"],
  educacion: ["texto"],
  negocios: ["agente", "texto"],
  // Arenas generativas (v1.15.0): el impulso llega a quien pertenece
  imagen: ["imagen"],
  video: ["video"],
  audio: ["audio"],
};

export function categoryElo(m: AIModel, category: string): number {
  if (category === "global") return m.elo;
  const offset = (hashCode(m.id + category) % 55) - 20;
  const boost = CAT_BOOST[category] ?? [];
  const bonus = boost.some((c) => m.categories.includes(c as AIModel["categories"][number]))
    ? 14
    : -26;
  return m.elo + offset + bonus;
}

export interface LeaderRow {
  id: string;
  name: string;
  provider: string;
  providerName: string;
  license: string;
  rank?: number;
  elo: number;
  delta: number;
  ci: number;
  votes: number;
  winRate: number;
  context: number;
  priceOut: number;
  speed: number;
  isNew: boolean;
  categories: string[];
  /** ELO global persistente en BD (v1.9.0); null si aún no tiene batallas. */
  eloGlobal?: number | null;
  eloGlobalBattles?: number;
}
