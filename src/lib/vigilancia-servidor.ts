// ============================================================
// todólogo.ai — Colector del vigilante de negocio (v1.28.0)
//
// El watchdog.sh (v1.10.0) vigila el PROCESO y stream-inmunidad
// (v1.24.0) vigila el STREAM en cada dispositivo; este módulo es la
// tercera pata: agrega los EVENTOS DEL NEGOCIO en el servidor para
// que el panel de /empresas y la API /api/vigilancia puedan juzgar
// la salud con números reales y no con promesas.
//
// Diseño deliberadamente en-proceso (mismo espíritu que rate-limit):
// anillos en memoria con ventana de 24 h, sin dependencias y con
// coste O(1) amortizado por evento. Multi-instancia vendrá con el
// almacén compartido cuando el tráfico lo pida.
//
// Las piezas puras (purgarVentana, percentil, porcentaje… viven en
// vigilancia.ts) son testeables sin servidor; este fichero solo las
// compone y guarda el estado en globalThis (hot-reload safe).
// ============================================================

import {
  percentil,
  porcentajeDisponibilidad,
  purgarVentana,
  type MetricasNegocio,
} from "./vigilancia";

/** Tipos de evento que el negocio entiende. Whitelist cerrada. */
export type TipoEventoNegocio =
  | "batalla"
  | "voto"
  | "corte"
  | "reanudacion"
  | "curado"
  | "sin-curar"
  | "error-5xx"
  | "bloqueo-429";

export interface EventoNegocio {
  ts: number;
  tipo: TipoEventoNegocio;
  /** Detalle breve opcional (modelo, IP enmascarada, tramo…). */
  detalle?: string;
}

interface MuestraLatencia {
  ts: number;
  ms: number;
}

/** Ventanas de agregación. */
export const VENTANA_1H = 60 * 60 * 1000;
export const VENTANA_24H = 24 * VENTANA_1H;

/** Techo del anillo de eventos (24 h de tráfico holgado) y de latencias. */
export const EVENTOS_MAX = 6_000;
export const LATENCIAS_MAX = 2_000;

interface EstadoVigilancia {
  eventos: EventoNegocio[];
  latencias: MuestraLatencia[];
  /** Total histórico de eventos vistos desde el arranque del proceso. */
  totalEventos: number;
  /** Arranque del colector (ms). */
  desde: number;
}

const g = globalThis as unknown as { __todologoVigilancia?: EstadoVigilancia };
const estado: EstadoVigilancia = (g.__todologoVigilancia ??= {
  eventos: [],
  latencias: [],
  totalEventos: 0,
  desde: Date.now(),
});

/** Registra un evento de negocio (anillo: el más antiguo cae). */
export function registrarEvento(tipo: TipoEventoNegocio, detalle?: string, ahora = Date.now()): void {
  estado.eventos.push({ ts: ahora, tipo, detalle: detalle?.slice(0, 120) });
  estado.totalEventos += 1;
  if (estado.eventos.length > EVENTOS_MAX) {
    estado.eventos.splice(0, estado.eventos.length - EVENTOS_MAX);
  }
}

/** Registra una muestra de latencia de generación (anillo). */
export function registrarLatencia(ms: number, ahora = Date.now()): void {
  if (!Number.isFinite(ms) || ms < 0) return;
  estado.latencias.push({ ts: ahora, ms: Math.min(600_000, Math.round(ms)) });
  if (estado.latencias.length > LATENCIAS_MAX) {
    estado.latencias.splice(0, estado.latencias.length - LATENCIAS_MAX);
  }
}

/** Cuenta los eventos de un tipo dentro de una lista ya filtrada. */
export function contarPorTipo(eventos: EventoNegocio[], tipo: TipoEventoNegocio): number {
  let n = 0;
  for (const e of eventos) if (e.tipo === tipo) n += 1;
  return n;
}

/**
 * Instantánea de métricas de negocio sobre la ventana de 24 h.
 * `dbLatenciaMs` y `uptimeSec` llegan medidos desde la ruta que llama
 * (son señales del proceso, no de los anillos).
 */
export function instantanea(
  ahora = Date.now(),
  extra?: { dbLatenciaMs?: number; uptimeSec?: number }
): MetricasNegocio {
  const ventana = purgarVentana(estado.eventos, ahora, VENTANA_24H);
  const latenciasVivas = purgarVentana(estado.latencias, ahora, VENTANA_24H).map((l) => l.ms);

  const batallas = contarPorTipo(ventana, "batalla");
  const votos = contarPorTipo(ventana, "voto");
  const errores5xx = contarPorTipo(ventana, "error-5xx");
  const peticiones = batallas + votos + errores5xx;

  return {
    disponibilidadPct: porcentajeDisponibilidad(errores5xx, peticiones),
    latenciaP50Ms: percentil(latenciasVivas, 0.5),
    latenciaP99Ms: percentil(latenciasVivas, 0.99),
    tasaErrorPct: peticiones > 0 ? Math.round((errores5xx / peticiones) * 10_000) / 100 : 0,
    dbLatenciaMs: extra?.dbLatenciaMs ?? 0,
    batallas,
    cortes: contarPorTipo(ventana, "corte"),
    cortesCurados: contarPorTipo(ventana, "curado"),
    cortesSinCurar: contarPorTipo(ventana, "sin-curar"),
    reanudaciones: contarPorTipo(ventana, "reanudacion"),
    votos,
    bloqueos429: contarPorTipo(ventana, "bloqueo-429"),
    uptimeSec: extra?.uptimeSec ?? Math.round((Date.now() - estado.desde) / 1000),
  };
}

/** Últimos incidentes, el más reciente primero. */
export function historial(ahora = Date.now(), limite = 12, ventanaMs = VENTANA_24H): EventoNegocio[] {
  return purgarVentana(estado.eventos, ahora, ventanaMs)
    .slice(-limite)
    .reverse();
}

/** Métricas dentro de la ventana de UNA hora (para tendencias finas). */
export function instantanea1h(ahora = Date.now()): Record<TipoEventoNegocio, number> {
  const ventana = purgarVentana(estado.eventos, ahora, VENTANA_1H);
  return {
    batalla: contarPorTipo(ventana, "batalla"),
    voto: contarPorTipo(ventana, "voto"),
    corte: contarPorTipo(ventana, "corte"),
    reanudacion: contarPorTipo(ventana, "reanudacion"),
    curado: contarPorTipo(ventana, "curado"),
    "sin-curar": contarPorTipo(ventana, "sin-curar"),
    "error-5xx": contarPorTipo(ventana, "error-5xx"),
    "bloqueo-429": contarPorTipo(ventana, "bloqueo-429"),
  };
}

/**
 * Incidencias que reporta el CLIENTE (la memoria inmunitaria de
 * v1.24.0 al curar un corte). Whitelist: el cliente jamás inventa
 * métricas — solo cuenta su experiencia real, y el servidor la traduce
 * a eventos de negocio. Devuelve el tipo aceptado o null.
 */
export function registrarIncidenteCliente(tipo: string, ahora = Date.now()): TipoEventoNegocio | null {
  switch (tipo) {
    case "corte-curado":
      registrarEvento("curado", "reportado por el dispositivo", ahora);
      return "curado";
    case "corte-sin-curar":
      registrarEvento("sin-curar", "reportado por el dispositivo", ahora);
      return "sin-curar";
    case "falso-positivo":
      registrarEvento("corte", "falso positivo del vigilante local", ahora);
      return "corte";
    default:
      return null;
  }
}

/** Telemetría para las pruebas: lectura sin mutar. */
export function tamanoAnillos(): { eventos: number; latencias: number; totalEventos: number } {
  return {
    eventos: estado.eventos.length,
    latencias: estado.latencias.length,
    totalEventos: estado.totalEventos,
  };
}
