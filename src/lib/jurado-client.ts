"use client";

/**
 * Cliente del ELO de jurado (v1.20.0): tu escalera personal en el
 * dispositivo. Sin sesión, el historial vive en localStorage y las matemáticas
 * corren aquí con las MISMAS funciones puras del servidor (elo-usuario.ts).
 * Con sesión, /api/vote y la copa devuelven `usuarioElo` calculado en servidor
 * (racha y ELO globales entre dispositivos) y aquí solo se guarda el resultado.
 *
 * Almacén: clave `todologo.jurado.v1`. Patrón de suscripción externa
 * (useSyncExternalStore) como en profile.tsx: cero setState en efectos.
 */

import { useSyncExternalStore } from "react";
import { expectedScore } from "@/lib/elo";
import { getModel } from "@/lib/models-data";
import {
  aplicarVotoJurado,
  diaUtc,
  saneaJurado,
  ESTADO_JURADO_INICIAL,
  type EstadoJurado,
  type VotoJurado,
} from "@/lib/elo-usuario";

const CLAVE = "todologo.jurado.v1";
const EVENTO = "todologo-jurado-changed";

/* ── Mini-store sobre localStorage con suscriptores ── */
const oyentes = new Set<() => void>();

function suscribirse(cb: () => void): () => void {
  oyentes.add(cb);
  return () => oyentes.delete(cb);
}

function emitir() {
  for (const cb of oyentes) cb();
}

function leer(): EstadoJurado {
  if (typeof window === "undefined") return { ...ESTADO_JURADO_INICIAL };
  try {
    const raw = window.localStorage.getItem(CLAVE);
    return raw ? saneaJurado(JSON.parse(raw) as unknown) : { ...ESTADO_JURADO_INICIAL };
  } catch {
    return { ...ESTADO_JURADO_INICIAL };
  }
}

function guardar(e: EstadoJurado) {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(e));
  } catch {
    /* almacenamiento lleno o bloqueado: la escalera no persiste */
  }
  emitir();
}

/** Estado actual del jurado en este dispositivo. */
export function leerJurado(): EstadoJurado {
  return leer();
}

/** Hook reactivo: tu ELO de jurado, con re-render al votar. */
export function useJurado(): EstadoJurado {
  return useSyncExternalStore(suscribirse, leer, () => ESTADO_JURADO_INICIAL);
}

/**
 * Registra un voto en el jurado local. Si el servidor mandó su estado
 * (`usuarioElo`, sesión activa) manda el servidor; si no, se aplica la misma
 * regla en local usando el ELO de las fichas como consenso.
 */
export function registrarVotoJurado(
  voto: VotoJurado,
  modelAId: string,
  modelBId: string,
  delServidor?: EstadoJurado | null
): EstadoJurado {
  if (delServidor) {
    const saneado = saneaJurado(delServidor);
    guardar(saneado);
    return saneado;
  }
  // Consenso local: fichas estáticas (en la demo estática no hay EloState).
  const a = getModel(modelAId)?.elo ?? 1000;
  const b = getModel(modelBId)?.elo ?? 1000;
  let esFavorito: boolean | null = null;
  if (voto === "A" || voto === "B") {
    if (a !== b) esFavorito = voto === "A" ? a > b : b > a;
  }
  const nuevo = aplicarVotoJurado(leer(), voto, esFavorito, diaUtc());
  guardar(nuevo);
  return nuevo;
}

/** Borra la escalera local (útil al cerrar sesión para no mezclar historiales). */
export function olvidarJuradoLocal() {
  try {
    window.localStorage.removeItem(CLAVE);
  } catch {
    /* sin almacenamiento */
  }
  emitir();
}
