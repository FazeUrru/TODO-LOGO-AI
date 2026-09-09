"use client";

import { useCallback, useSyncExternalStore } from "react";
import { featurePorId, puedeActivar, type LabsFeature } from "@/lib/labs";

/**
 * useFeature / useLabs (v1.14.0) — cliente del Canal Todólogo Labs.
 *
 * La inscripción vive en el dispositivo (`localStorage`, clave
 * `labs:activadas`) y la telemetría via al servidor cuando hay /api
 * (en la demo estática se queda en local, como todo lo demás — y se
 * declara). Fuente de verdad del catálogo: `src/lib/labs.ts`, que viaja
 * en el bundle así que funciona también sin servidor.
 *
 * Patrón de suscripción externa (useSyncExternalStore) como en
 * `history.ts`: cero setState en efectos y hidratación estable.
 */

const CLAVE = "labs:activadas";

export type FuenteActivacion = "no-activa" | "dispositivo" | "servidor";

/* ── Mini-store sobre localStorage con suscriptores ── */
const oyentes = new Set<() => void>();

function suscribirse(cb: () => void): () => void {
  oyentes.add(cb);
  return () => oyentes.delete(cb);
}

function emitir() {
  for (const cb of oyentes) cb();
}

function leerActivadas(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(CLAVE) ?? "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

/** Snapshot estable para useSyncExternalStore (misma referencia si no cambia). */
function getSnapshot(): string {
  return window.localStorage.getItem(CLAVE) ?? "{}";
}
function getServerSnapshot(): string {
  return "{}";
}

/** Escribe la activación y avisa a los suscriptores. */
function guardarActivada(id: string, activa: boolean) {
  const map = leerActivadas();
  if (activa) map[id] = true;
  else delete map[id];
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(map));
  } catch {
    /* almacenamiento lleno o bloqueado: la inscripción no persiste */
  }
  emitir();
}

/** Telemetría best-effort: nunca lanza, nunca bloquea la UI. */
export function reportarEventoLabs(featureId: string, tipo: string, payload?: unknown) {
  try {
    void fetch("/api/labs/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featureId, tipo, payload }),
      keepalive: true,
    });
  } catch {
    /* demo estática o red caída: silencio, es telemetría */
  }
}

export function useLabs() {
  const crudo = useSyncExternalStore(suscribirse, getSnapshot, getServerSnapshot);
  let activadas: Record<string, boolean> = {};
  try {
    activadas = JSON.parse(crudo) as Record<string, boolean>;
  } catch {
    activadas = {};
  }

  const setActiva = useCallback((id: string, activa: boolean) => {
    guardarActivada(id, activa);
    reportarEventoLabs(id, activa ? "entered" : "abandoned");
  }, []);

  return { activadas, setActiva };
}

/** Hook puntual: ¿está activa esta feature experimental en este dispositivo? */
export function useFeature(id: string): { feature?: LabsFeature; activa: boolean; setActiva: (v: boolean) => void } {
  const { activadas, setActiva } = useLabs();
  const feature = featurePorId(id);
  return {
    feature,
    activa: Boolean(feature && activadas[id]),
    setActiva: (v: boolean) => setActiva(id, v),
  };
}

/** ¿Podría esta cohorte activar la feature? (para deshabilitar toggles en /labs) */
export function accesoPermitido(feature: LabsFeature, cohorte: string): boolean {
  return puedeActivar(feature, cohorte as never);
}
