"use client";

/**
 * Autoguardado del historial de conversaciones en localStorage.
 * Las conversaciones se guardan solas (debounce en ChatExperience),
 * aparecen en "Recientes" de la barra lateral y se restauran con un clic.
 */

export interface SavedTurn {
  role: "user" | "assistant";
  content: string;
  media?: {
    type: "image" | "3d" | "video" | "audio";
    url?: string;
    prompt?: string;
    model?: string;
    recipe?: string;
    voz?: string;
    estilo?: string;
    segundos?: number;
  };
  thinking?: string;
  sources?: { title: string; url: string; host: string }[];
}

export interface SavedChat {
  id: string;
  title: string;
  mode: "battle" | "agent" | "sbs" | "direct" | "torneo";
  ts: number;
  category: string;
  turnsA: SavedTurn[];
  turnsB: SavedTurn[];
  battle?: {
    aId: string;
    bId: string | null;
    battleId: string;
    revealed: boolean;
    winner?: string;
    swing?: number;
    eloTotalA?: number;
    eloTotalB?: number;
  };
  agentMission?: string;
  agentPlan?: unknown;
  agentGenerated?: boolean;
}

const STORE_KEY = "todologo.chats.v1";
const EVENT = "todologo-chats-changed";
const MAX_CHATS = 50;

let cache: SavedChat[] | null = null;
function invalidate() {
  cache = null;
}

function retentionDays(): number {
  try {
    const raw = window.localStorage.getItem("todologo.ajustes.v1");
    if (raw) {
      const s = JSON.parse(raw) as { historyRetention?: number };
      if (typeof s.historyRetention === "number") return s.historyRetention;
    }
  } catch {
    /* valores por defecto */
  }
  return 30;
}

function prune(list: SavedChat[]): SavedChat[] {
  const days = retentionDays();
  const cutoff = days > 0 ? Date.now() - days * 86_400_000 : 0;
  const filtered = cutoff ? list.filter((c) => c.ts >= cutoff) : list;
  return filtered.sort((a, b) => b.ts - a.ts).slice(0, MAX_CHATS);
}

export function loadChats(): SavedChat[] {
  if (cache) return cache;
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const list: SavedChat[] = raw ? (JSON.parse(raw) as SavedChat[]) : [];
    const pruned = prune(list);
    if (pruned.length !== list.length) {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(pruned));
    }
    cache = pruned;
    return pruned;
  } catch {
    cache = [];
    return cache;
  }
}

export function saveChat(chat: SavedChat) {
  try {
    const list = loadChats().filter((c) => c.id !== chat.id);
    list.unshift(chat);
    invalidate();
    window.localStorage.setItem(STORE_KEY, JSON.stringify(prune(list)));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* cuota llena u otro error: se ignora silenciosamente */
  }
}

export function deleteChat(id: string) {
  try {
    invalidate();
    window.localStorage.setItem(
      STORE_KEY,
      JSON.stringify(loadChats().filter((c) => c.id !== id))
    );
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignorado */
  }
}

export function clearChats() {
  try {
    invalidate();
    window.localStorage.removeItem(STORE_KEY);
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignorado */
  }
}

export function subscribeChats(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

/** Dispara la restauración de una conversación guardada (misma página o tras navegar). */
export function requestLoadChat(chat: SavedChat) {
  try {
    window.sessionStorage.setItem("todologo.pending-chat", JSON.stringify(chat));
  } catch {
    /* sin almacenamiento */
  }
  window.dispatchEvent(new CustomEvent("todologo-load-chat", { detail: chat }));
}

/** Lee y limpia una restauración pendiente (p. ej. tras cambiar de ruta). */
export function consumePendingChat(): SavedChat | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem("todologo.pending-chat");
    if (!raw) return null;
    window.sessionStorage.removeItem("todologo.pending-chat");
    return JSON.parse(raw) as SavedChat;
  } catch {
    return null;
  }
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ayer";
  if (d < 7) return `hace ${d} días`;
  return new Date(ts).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}
