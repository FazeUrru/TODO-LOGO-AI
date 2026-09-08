"use client";

import { createContext, useContext } from "react";

export type ArenaMode = "battle" | "agent" | "sbs" | "direct";

export interface ArenaState {
  mode: ArenaMode;
  setMode: (m: ArenaMode) => void;
  modelAId: string;
  setModelAId: (id: string) => void;
  modelBId: string;
  setModelBId: (id: string) => void;
  modelDirectId: string;
  setModelDirectId: (id: string) => void;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  /** clave para forzar un "nuevo chat" desde la barra lateral */
  roundKey: number;
  resetChat: () => void;
}

export const ArenaContext = createContext<ArenaState | null>(null);

export function useArena(): ArenaState {
  const ctx = useContext(ArenaContext);
  if (!ctx) throw new Error("useArena debe usarse dentro de ArenaContext");
  return ctx;
}

export const MODE_META: Record<
  ArenaMode,
  { label: string; sub: string }
> = {
  battle: {
    label: "Modo Batalla",
    sub: "Enfrenta 2 modelos anónimos",
  },
  agent: {
    label: "Modo Agente",
    sub: "Pensado para tareas complejas",
  },
  sbs: {
    label: "Lado a Lado",
    sub: "Compara 2 modelos a tu elección",
  },
  direct: {
    label: "Directo",
    sub: "Chatea con 1 modelo a la vez",
  },
};
