// ============================================================
// todólogo.ai — Duelo por equipos 2v2 con árbitro (Labs, v1.21.0)
// ============================================================
//
// La mecánica del flag Labs «duelo-equipos»: dos equipos de dos
// contendientes responden una misma consigna, cada segundo integrante
// CONOCE el borrador de su compañero y añade un APOYO (refuerzo o
// matiz), y un quinto modelo —el ÁRBITRO— lee los dos dosieres y dicta
// veredicto motivado.
//
// REGLAS DE LABS QUE ESTE MÓDULO RESPETA AL PIE DE LA LETRA:
//  · Regla 2 — el ELO global es sagrado: aquí NO se escribe en Votes
//    ni en EloState. El marcador vive en el dispositivo (localStorage)
//    y los eventos van solo a la telemetría de Labs.
//  · Regla 3 — telemetría desde el día uno: la página emite used,
//    abandoned y crashed contra /api/labs/event.
//
// Este módulo es puro y sin I/O: lo comparten la API real
// (/api/labs/duelo-equipos), el espejo de la demo estática
// (demo-engine.ts) y los tests.

import { MODELS, esGenerativo, getModel, type AIModel } from "./models-data";

export type Bando = "azul" | "rojo" | "empate";

export interface JugadorEquipos {
  id: string;
  nombre: string;
  texto: string;
  /** Refuerzo que añade el compañero tras leer el borrador (mecánica de apoyo). */
  apoyo: string;
}

export interface ArbitroEquipos {
  id: string;
  nombre: string;
  veredicto: Bando;
  razon: string;
  /** Puntuaciones 0-10 que declara el árbitro, para desempates visuales. */
  notaAzul: number;
  notaRojo: number;
}

export interface DueloEquipos {
  consigna: string;
  azul: [JugadorEquipos, JugadorEquipos];
  rojo: [JugadorEquipos, JugadorEquipos];
  arbitro: ArbitroEquipos;
}

/** Pool de contendientes válidos: conversan (texto) y existen en el catálogo. */
export function poolEquipos(): AIModel[] {
  return MODELS.filter((m) => !esGenerativo(m));
}

/**
 * Sortea 2v2 + árbitro: cuatro contendientes distintos en dos parejas y
 * un quinto, también distinto, que juzga. `seed` opcional para tests
 * (mismo seed → mismo sorteo, como el Duelo del día).
 */
export function sortearEquipos(seed?: number): {
  azul: [AIModel, AIModel];
  rojo: [AIModel, AIModel];
  arbitro: AIModel;
} {
  const pool = poolEquipos();
  const todos = [...pool];
  // Fisher-Yates con PRNG determinista si hay seed (mulberry32).
  let estado = seed ?? Math.floor(Math.random() * 2 ** 31);
  const azar = () => {
    estado |= 0; estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = todos.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [todos[i], todos[j]] = [todos[j], todos[i]];
  }
  const elegidos = todos.slice(0, 5);
  if (elegidos.length < 5) {
    // Defensa en profundidad: el catálogo nunca debería quedarse corto.
    throw new Error("Catálogo insuficiente para un duelo 2v2 con árbitro.");
  }
  const [a1, a2, b1, b2, arbitro] = elegidos;
  return { azul: [a1, a2], rojo: [b1, b2], arbitro };
}

/** Modelo válido por id para rellenar huecos (caídas, ids desconocidos…). */
export function jugadorDe(id: string): AIModel | null {
  const m = getModel(id);
  return m && !esGenerativo(m) ? m : null;
}

/**
 * Veredicto del árbitro cuando no hay LLM disponible: determinista a
 * partir de los ids (mismo duelo → mismo veredicto), sin favoritismos
 * de catálogo. Empate solo con consigna vacía — en duelos reales se
 * moja uno de los dos bandos.
 */
export function veredictoDeterminista(
  azulIds: [string, string],
  rojoIds: [string, string],
  consigna: string
): { veredicto: Bando; notaAzul: number; notaRojo: number } {
  const hash = (s: string): number => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  if (!consigna.trim()) return { veredicto: "empate", notaAzul: 5, notaRojo: 5 };
  const h = hash(`${azulIds.join("|")}::${rojoIds.join("|")}::${consigna.toLowerCase().trim()}`);
  const margen = (h % 5) + 1; // 1..5 puntos de diferencia
  const azulPrimero = (h >>> 3) % 2 === 0;
  // El ganador siempre puntúa más: nota fija de ganador y la del perdedor cae con el margen.
  const notaGanador = 8;
  const notaPerdedor = Math.max(4, 8 - margen);
  return azulPrimero
    ? { veredicto: "azul", notaAzul: notaGanador, notaRojo: notaPerdedor }
    : { veredicto: "rojo", notaAzul: notaPerdedor, notaRojo: notaGanador };
}

/* ── Marcador en el dispositivo (regla de Labs: nada de ELO global) ── */

const CLAVE_MARCADOR = "labs:duelo-equipos:marcador";

export interface MarcadorEquipos {
  azules: number;
  rojos: number;
  empates: number;
  arbitrajes: number;
}

export function marcadorInicial(): MarcadorEquipos {
  return { azules: 0, rojos: 0, empates: 0, arbitrajes: 0 };
}

export function leerMarcador(): MarcadorEquipos {
  if (typeof window === "undefined") return marcadorInicial();
  try {
    const crudo = window.localStorage.getItem(CLAVE_MARCADOR);
    if (!crudo) return marcadorInicial();
    const p = JSON.parse(crudo) as Partial<MarcadorEquipos>;
    return {
      azules: Math.max(0, Number(p.azules) || 0),
      rojos: Math.max(0, Number(p.rojos) || 0),
      empates: Math.max(0, Number(p.empates) || 0),
      arbitrajes: Math.max(0, Number(p.arbitrajes) || 0),
    };
  } catch {
    return marcadorInicial();
  }
}

export function anotarVeredicto(v: Bando): MarcadorEquipos {
  const m = leerMarcador();
  const nuevo: MarcadorEquipos = {
    azules: m.azules + (v === "azul" ? 1 : 0),
    rojos: m.rojos + (v === "rojo" ? 1 : 0),
    empates: m.empates + (v === "empate" ? 1 : 0),
    arbitrajes: m.arbitrajes + 1,
  };
  try {
    window.localStorage.setItem(CLAVE_MARCADOR, JSON.stringify(nuevo));
  } catch {
    /* almacenamiento bloqueado: el marcador vive solo en la sesión */
  }
  return nuevo;
}

/** Frase de rótulo del marcador para la UI. */
export function resumenMarcador(m: MarcadorEquipos): string {
  if (m.arbitrajes === 0) return "Aún sin arbitrajes en este dispositivo.";
  return `${m.arbitrajes} arbitraje${m.arbitrajes === 1 ? "" : "s"} · Azul ${m.azules} — Rojo ${m.rojos}${m.empates ? ` · ${m.empates} empate${m.empates === 1 ? "" : "s"}` : ""}`;
}
