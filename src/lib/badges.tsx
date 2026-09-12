"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n";

/**
 * Sistema de insignias ¡NUEVO!: cada funcionalidad nueva lleva una insignia
 * que desaparece en cuanto el usuario la usa de verdad (visita la página,
 * activa la vista, selecciona la categoría…).
 */

const STORE_KEY = "todologo.used.v1";
const EVENT = "todologo-used-changed";

let cache: Set<string> | null = null;

function load(): Set<string> {
  if (cache) return cache;
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    cache = new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    cache = new Set();
  }
  return cache;
}

function persist() {
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify([...load()]));
  } catch {
    /* almacenamiento no disponible */
  }
  window.dispatchEvent(new Event(EVENT));
}

export function markUsed(key: string) {
  const set = load();
  if (set.has(key)) return;
  set.add(key);
  persist();
}

export function isUsed(key: string): boolean {
  if (typeof window === "undefined") return true; // SSR: sin insignia para evitar parpadeo
  return load().has(key);
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

/** Hook reactivo: true cuando la funcionalidad ya ha sido usada. */
export function useUsed(key: string): boolean {
  return useSyncExternalStore(subscribe, () => isUsed(key), () => true);
}

/** Insignia visual reutilizable. */
export function NewBadge({ k, className }: { k: string; className?: string }) {
  const used = useUsed(k);
  const { t } = useT();
  if (used) return null;
  return (
    <span
      className={
        "inline-flex shrink-0 items-center rounded-full bg-highlight px-1.5 py-px text-[9.5px] font-bold uppercase leading-tight text-[#2E2B29] " +
        (className ?? "")
      }
    >
      {t("¡Nuevo!")}
    </span>
  );
}

/** Hook de convenio: devuelve [marcaComoUsado] estable. */
export function useMarkUsed(): (key: string) => void {
  return useCallback((key: string) => markUsed(key), []);
}
