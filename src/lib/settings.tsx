"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * 15 ajustes organizados en 5 categorías, persistidos en localStorage
 * y aplicados globalmente (tema, densidad, movimiento, etc.).
 */

export interface AppSettings {
  // ── Apariencia (3) ──
  theme: "claro" | "oscuro" | "sistema";
  density: "comoda" | "compacta";
  responseFont: "sans" | "serif" | "mono";
  // ── Arena (4) ──
  defaultCategory: string;
  confirmVote: boolean;
  showElo: boolean;
  responseLang: "es" | "en";
  // ── Conversación (3) ──
  autoScroll: boolean;
  showTokens: boolean;
  quickCopy: boolean;
  // ── Historial (2) ──
  autoSaveHistory: boolean;
  historyRetention: 7 | 30 | 90 | 0; // días; 0 = ilimitado
  // ── Sistema (3) ──
  soundOnDone: boolean;
  autoSyncNews: boolean;
  reduceMotion: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "claro",
  density: "comoda",
  responseFont: "sans",
  defaultCategory: "global",
  confirmVote: false,
  showElo: true,
  responseLang: "es",
  autoScroll: true,
  showTokens: false,
  quickCopy: true,
  autoSaveHistory: true,
  historyRetention: 30,
  soundOnDone: false,
  autoSyncNews: true,
  reduceMotion: false,
};

const STORE_KEY = "todologo.ajustes.v1";
const EVENT = "todologo-ajustes-changed";

function load(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persist(s: AppSettings) {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {
    /* sin almacenamiento */
  }
  window.dispatchEvent(new Event(EVENT));
}

/* ── Store global simple con suscripción ── */
let current: AppSettings = DEFAULT_SETTINGS;
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  current = load();
  window.addEventListener(EVENT, () => {
    current = load();
    listeners.forEach((l) => l());
  });
}

export function getSettings(): AppSettings {
  return current;
}

export function updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
  const next = { ...getSettings(), [key]: value };
  persist(next);
}

/* ── Contexto React ── */
interface SettingsCtx {
  settings: AppSettings;
  set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  reset: () => void;
}

const Ctx = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const sync = () => setSettings(getSettings());
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  // Aplica tema, densidad y movimiento al documento
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const dark =
        settings.theme === "oscuro" ||
        (settings.theme === "sistema" && mq.matches);
      root.classList.toggle("dark", dark);
    };
    applyTheme();
    mq.addEventListener("change", applyTheme);
    root.dataset.density = settings.density;
    root.dataset.motion = settings.reduceMotion ? "reducida" : "normal";
    return () => mq.removeEventListener("change", applyTheme);
  }, [settings.theme, settings.density, settings.reduceMotion]);

  const value = useMemo<SettingsCtx>(
    () => ({
      settings,
      set: (key, val) => updateSetting(key, val),
      reset: () => persist(DEFAULT_SETTINGS),
    }),
    [settings]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings(): SettingsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSettings debe usarse dentro de SettingsProvider");
  return ctx;
}

/** Bip corto con WebAudio para el aviso de respuesta completada. */
export function playDoneChime() {
  try {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1174, ctx.currentTime + 0.09);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.24);
    osc.onended = () => ctx.close();
  } catch {
    /* audio no disponible */
  }
}
