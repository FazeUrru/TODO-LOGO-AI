// ============================================================
// todólogo.ai — WATCHDOG EMPRESARIAL (v1.28.0)
//
// Tres generaciones de vigilancia conviven en la casa:
//
//  · v1.10.0  scripts/watchdog.sh   — infraestructura (mantiene el
//             proceso vivo: health check, reinicio, backoff).
//  · v1.24.0  stream-inmunidad.ts   — stream (vigilante de silencio
//             en el dispositivo, reanudación, memoria adaptativa).
//  · v1.28.0  vigilancia.ts         — NEGOCIO: esta librería. Los
//             signos vitales del arena (SLA, latencia, errores,
//             cortes, curaciones, bloqueos) se miden contra reglas
//             empresariales y se convierten en alertas con severidad
//             y ACCIONES sugeridas — el panel que un comité quiere
//             ver antes de renovar un contrato de modelos.
//
// Librería pura: nada de red, nada de reloj escondido — el instante
// y los datos entran por parámetro. 100% testeable, como la casa
// manda.
// ============================================================

export type Severidad = "info" | "aviso" | "critico";
export type NivelSalud = "optimo" | "estable" | "degradado" | "critico";

/** Signos vitales del negocio sobre una ventana (24 h por defecto). */
export interface MetricasNegocio {
  /** % de peticiones atendidas sin error 5xx (0–100). */
  disponibilidadPct: number;
  /** Mediana de latencia de generación (ms). */
  latenciaP50Ms: number;
  /** Percentil 99 de latencia de generación (ms). */
  latenciaP99Ms: number;
  /** % de peticiones que acabaron en error 5xx. */
  tasaErrorPct: number;
  /** Latencia medida del latido de base de datos (SELECT 1, ms). */
  dbLatenciaMs: number;
  /** Batallas iniciadas en la ventana. */
  batallas: number;
  /** Cortes de stream detectados en la ventana. */
  cortes: number;
  /** Cortes curados por Stream Forever (reanudación exacta). */
  cortesCurados: number;
  /** Cortes que no se pudieron curar (la respuesta quedó a medias). */
  cortesSinCurar: number;
  /** Tramos de reanudación servidos. */
  reanudaciones: number;
  /** Votos emitidos en la ventana. */
  votos: number;
  /** Bloqueos 429 servidos (rate-limit trabajando). */
  bloqueos429: number;
  /** Tiempo de actividad del proceso (segundos). */
  uptimeSec: number;
}

/** Umbrales empresariales — el SLA que la página /empresas promete. */
export interface ReglasVigilancia {
  /** Disponibilidad mínima prometida (99.9 por defecto). */
  slaDisponibilidadPct: number;
  /** P99 de latencia tolerable (ms). */
  latenciaP99MaxMs: number;
  /** % máximo de errores 5xx. */
  tasaErrorMaxPct: number;
  /** Latencia máxima del latido de BD (ms). */
  dbLatenciaMaxMs: number;
  /** Cortes sin curar tolerados en la ventana. */
  cortesSinCurarMax: number;
  /** Bloqueos 429 por ventana que delatan a un cliente abusivo. */
  bloqueos429Max: number;
}

/** Reglas base: el SLA del 99,95 % anunciado en /empresas, con margen. */
export const REGLAS_BASE: ReglasVigilancia = {
  slaDisponibilidadPct: 99.9,
  latenciaP99MaxMs: 2500,
  tasaErrorMaxPct: 2,
  dbLatenciaMaxMs: 500,
  cortesSinCurarMax: 3,
  bloqueos429Max: 20,
};

export interface AlertaVigilancia {
  codigo: string;
  severidad: Severidad;
  titulo: string;
  detalle: string;
}

export interface InstantaneaSalud {
  nivel: NivelSalud;
  alertas: AlertaVigilancia[];
  resumen: string;
}

/* ── Aritmética de vigilancia ─────────────────────────────── */

/**
 * Percentil por el método del rango más cercano. Lista vacía → 0.
 * p = 0.5 → mediana, p = 0.99 → P99.
 */
export function percentil(muestras: number[], p: number): number {
  if (muestras.length === 0) return 0;
  const ordenadas = [...muestras].filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (ordenadas.length === 0) return 0;
  const rango = Math.max(1, Math.ceil(p * ordenadas.length));
  return ordenadas[Math.min(rango, ordenadas.length) - 1] ?? ordenadas[ordenadas.length - 1];
}

/** % de disponibilidad: sin tráfico hay nada caído — 100 honesto. */
export function porcentajeDisponibilidad(fallos: number, total: number): number {
  if (total <= 0) return 100;
  const p = (1 - fallos / total) * 100;
  return Math.round(Math.max(0, Math.min(100, p)) * 100) / 100;
}

export type Direccion = "sube" | "baja" | "plano";

/** Tendencia entre dos lecturas consecutivas del mismo indicador. */
export function tendencia(actual: number, previo: number): { direccion: Direccion; delta: number } {
  const delta = Math.round((actual - previo) * 100) / 100;
  if (delta > 0) return { direccion: "sube", delta };
  if (delta < 0) return { direccion: "baja", delta };
  return { direccion: "plano", delta: 0 };
}

/** Duración legible: «3 d 4 h», «2 h 05 m», «12 m 40 s», «45 s». */
export function formatearUptime(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  const dias = Math.floor(s / 86_400);
  const horas = Math.floor((s % 86_400) / 3_600);
  const minutos = Math.floor((s % 3_600) / 60);
  const resto = s % 60;
  if (dias > 0) return `${dias} d ${horas} h`;
  if (horas > 0) return `${horas} h ${String(minutos).padStart(2, "0")} m`;
  if (minutos > 0) return `${minutos} m ${String(resto).padStart(2, "0")} s`;
  return `${resto} s`;
}

/** Relativo corto para feeds: «hace 12 s», «hace 3 m», «hace 2 h». */
export function haceCuanto(ts: number, ahora: number): string {
  const s = Math.max(0, Math.floor((ahora - ts) / 1000));
  if (s < 60) return `hace ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.floor(h / 24)} d`;
}

/**
 * Purga una ventana: se queda con los eventos cuyo `ts` cae dentro de
 * los `ventanaMs` previos a `ahora`. Pura — el colector del servidor
 * la usa y la CI la testa sin servidor.
 */
export function purgarVentana<T extends { ts: number }>(eventos: T[], ahora: number, ventanaMs: number): T[] {
  const desde = ahora - ventanaMs;
  return eventos.filter((e) => e.ts >= desde && e.ts <= ahora);
}

/* ── El juicio: métricas contra reglas ────────────────────── */

const NIVEL_ORDEN: Record<NivelSalud, number> = { optimo: 0, estable: 1, degradado: 2, critico: 3 };
const SEVERIDAD_ORDEN: Record<Severidad, number> = { info: 0, aviso: 1, critico: 2 };

/**
 * Evalúa los signos vitales contra las reglas y devuelve nivel, alertas
 * y una frase de resumen lista para el comité. Determinista: mismas
 * métricas y reglas → mismo veredicto siempre.
 */
export function evaluarSalud(m: MetricasNegocio, reglas: ReglasVigilancia = REGLAS_BASE): InstantaneaSalud {
  const alertas: AlertaVigilancia[] = [];

  // 1 · SLA de disponibilidad — la promesa escrita en /empresas.
  if (m.disponibilidadPct < reglas.slaDisponibilidadPct) {
    const critico = m.disponibilidadPct < reglas.slaDisponibilidadPct - 0.5;
    alertas.push({
      codigo: "sla-bajo",
      severidad: critico ? "critico" : "aviso",
      titulo: "Disponibilidad por debajo del SLA",
      detalle: `Se midió ${m.disponibilidadPct.toFixed(2)} % frente al ${reglas.slaDisponibilidadPct} % prometido${critico ? " — el desvío supera el margen de gracia" : ""}.`,
    });
  }

  // 2 · Latencia P99 de generación.
  if (m.latenciaP99Ms > reglas.latenciaP99MaxMs) {
    const critico = m.latenciaP99Ms > reglas.latenciaP99MaxMs * 2;
    alertas.push({
      codigo: "latencia-p99",
      severidad: critico ? "critico" : "aviso",
      titulo: "Latencia P99 por encima del umbral",
      detalle: `El P99 va a ${Math.round(m.latenciaP99Ms)} ms (máximo ${reglas.latenciaP99MaxMs} ms)${critico ? " — el doble del umbral: los modelos lentos están degradando la experiencia" : ""}.`,
    });
  }

  // 3 · Tasa de error 5xx.
  if (m.tasaErrorPct > reglas.tasaErrorMaxPct) {
    const critico = m.tasaErrorPct > reglas.tasaErrorMaxPct * 2;
    alertas.push({
      codigo: "tasa-error",
      severidad: critico ? "critico" : "aviso",
      titulo: "Tasa de error sobre el límite",
      detalle: `${m.tasaErrorPct.toFixed(2)} % de las peticiones acabó en error de servidor (límite ${reglas.tasaErrorMaxPct} %).`,
    });
  }

  // 4 · Latido de base de datos.
  if (m.dbLatenciaMs > reglas.dbLatenciaMaxMs) {
    const critico = m.dbLatenciaMs > reglas.dbLatenciaMaxMs * 3;
    alertas.push({
      codigo: "db-lenta",
      severidad: critico ? "critico" : "aviso",
      titulo: "La base de datos tarda en responder",
      detalle: `El latido (SELECT 1) midió ${Math.round(m.dbLatenciaMs)} ms (máximo ${reglas.dbLatenciaMaxMs} ms).`,
    });
  }

  // 5 · Cortes que Stream Forever no pudo curar.
  if (m.cortesSinCurar > reglas.cortesSinCurarMax) {
    alertas.push({
      codigo: "cortes-sin-curar",
      severidad: "aviso",
      titulo: "Cortes de stream sin curar",
      detalle: `${m.cortesSinCurar} respuestas quedaron a medias en la ventana (tolerancia ${reglas.cortesSinCurarMax}).`,
    });
  }

  // 6 · Bloqueos 429: el rate-limit trabajando — info, pero si crece
  // demasiado alguien está martilleando la API.
  if (m.bloqueos429 > reglas.bloqueos429Max) {
    alertas.push({
      codigo: "bloqueos-429",
      severidad: "info",
      titulo: "Abundantes bloqueos por rate-limit",
      detalle: `${m.bloqueos429} peticiones bloqueadas en la ventana: algún cliente supera el límite con insistencia.`,
    });
  }

  const hayCritico = alertas.some((a) => a.severidad === "critico");
  const hayAviso = alertas.some((a) => a.severidad === "aviso");
  const nivel: NivelSalud = hayCritico ? "critico" : hayAviso ? "degradado" : "optimo";

  return { nivel, alertas, resumen: redactarResumen(m, reglas, nivel) };
}

/** Frase de resumen honesta: qué va bien y qué no, en una línea. */
export function redactarResumen(m: MetricasNegocio, reglas: ReglasVigilancia, nivel: NivelSalud): string {
  const sinDatos = m.batallas === 0 && m.votos === 0;
  if (sinDatos) {
    return nivel === "optimo"
      ? "Sin tráfico significativo en la ventana: los sistemas responden y el vigilante no tiene incidentes que juzgar."
      : "Sin tráfico significativo, pero los propios sistemas internos ya disparan avisos — revisa las alertas.";
  }
  const tasaCuracion = m.cortes > 0 ? Math.round((m.cortesCurados / m.cortes) * 100) : 100;
  const cola =
    m.cortes > 0
      ? ` de los ${m.cortes} cortes se curó el ${tasaCuracion} %`
      : " sin cortes de stream en la ventana";
  switch (nivel) {
    case "optimo":
      return `SLA cumplido (${m.disponibilidadPct.toFixed(2)} %), P99 a ${Math.round(m.latenciaP99Ms)} ms y${cola}. ${m.batallas} batallas y ${m.votos} votos en 24 h.`;
    case "estable":
      return `Servicio dentro de parámetros con observaciones menores: disponibilidad ${m.disponibilidadPct.toFixed(2)} % (SLA ${reglas.slaDisponibilidadPct} %).`;
    case "degradado":
      return `Servicio degradado: hay avisos activos que conviene atender antes de que crezcan (P99 ${Math.round(m.latenciaP99Ms)} ms, errores ${m.tasaErrorPct.toFixed(2)} %).`;
    case "critico":
      return `Incidente crítico activo: algún umbral duro está incumplido — las alertas rojas mandan sobre el resto del panel.`;
  }
}

/* ── De la alerta a la acción ─────────────────────────────── */

/** Acción sugerida por cada código de alerta — determinista y accionable. */
export const ACCIONES: Record<string, string> = {
  "sla-bajo":
    "Revisa el feed de incidentes del último tramo y el estado del upstream; si el desvío persiste, saca de rotación los modelos caídos y escala a la casa correspondiente.",
  "latencia-p99":
    "Compara el P99 por proveedor en el leaderboard de latencia y depura de la rotación los modelos que arrastran la cola.",
  "tasa-error":
    "Verifica los reintentos autocorrectivos (v1.19.1) y busca el código 5xx dominante en el historial: suele ser un único upstream hinchando la media.",
  "db-lenta":
    "Comprueba el plan de la base gestionada y la latencia de red desde la instancia: un SELECT 1 lento casi siempre es red, no disco.",
  "cortes-sin-curar":
    "Revisa el techo maxDuration del serverless y la memoria inmunitaria del dispositivo más golpeado: si los tramos se agotan, súbelos.",
  "bloqueos-429":
    "Identifica al cliente insistente por IP (x-forwarded-for) y por clave API v2 de mayor consumo; si es legítimo, negocia un límite propio.",
};

/**
 * Acciones sugeridas para las alertas activas, en el orden de severidad
 * (críticas primero) y sin duplicar código. Es lo que convierte un panel
 * de métricas en una herramienta de negocio: cada alerta lleva su «qué
 * hago con esto».
 */
export function sugerirAcciones(alertas: AlertaVigilancia[]): { codigo: string; accion: string }[] {
  const vistas = new Set<string>();
  const salida: { codigo: string; accion: string }[] = [];
  for (const a of [...alertas].sort((x, y) => SEVERIDAD_ORDEN[y.severidad] - SEVERIDAD_ORDEN[x.severidad])) {
    if (vistas.has(a.codigo)) continue;
    vistas.add(a.codigo);
    const accion = ACCIONES[a.codigo];
    if (accion) salida.push({ codigo: a.codigo, accion });
  }
  return salida;
}

/** Chip legible de severidad para el panel y los tests. */
export function etiquetaSeveridad(s: Severidad): string {
  return s === "critico" ? "Crítico" : s === "aviso" ? "Aviso" : "Informativa";
}

/** Chip legible de nivel de salud. */
export function etiquetaNivel(n: NivelSalud): string {
  return n === "optimo" ? "Óptimo" : n === "estable" ? "Estable" : n === "degradado" ? "Degradado" : "Crítico";
}

/**
 * Instantánea de demostración para la página /empresas cuando no hay
 * servidor (export estático): métricas verosímiles y honestas — van
 * rotuladas como demo en el panel.
 */
export const METRICAS_DEMO: MetricasNegocio = {
  disponibilidadPct: 99.97,
  latenciaP50Ms: 640,
  latenciaP99Ms: 1980,
  tasaErrorPct: 0.31,
  dbLatenciaMs: 38,
  batallas: 4812,
  cortes: 37,
  cortesCurados: 35,
  cortesSinCurar: 2,
  reanudaciones: 61,
  votos: 1290,
  bloqueos429: 7,
  uptimeSec: 86_400 * 12 + 4 * 3_600,
};
