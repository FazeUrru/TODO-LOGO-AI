/**
 * v1.25.0 — El hilo permanente: saneado y validación de conversaciones.
 *
 * La conversación de un duelo son DOS hilos (turnosA / turnosB): la misma
 * secuencia de mensajes del usuario con las respuestas de cada modelo,
 * intercaladas en orden. Para publicar un link /c/[id] estable, el hilo se
 * SANEAN aquí (funciones puras, testeables): whitelist de campos, techos por
 * turno y por hilo, y exigencia de que exista al menos un turno de usuario y
 * uno de asistente — una conversación sin réplica no es una conversación.
 *
 * Las imágenes adjuntas (dataURL) y los medios generados (blob URLs) NO
 * viajan: un dataURL puede pesar megas y un blob muere con la sesión —
 * un link permanente no puede depender de nada efímero.
 */

export const MAX_TURNOS = 80; // turnos por lado
export const MAX_CONTENIDO = 80_000; // caracteres por turno (~20k tokens)
export const MAX_THINKING = 20_000; // razonamiento visible por turno
export const MAX_SOURCES = 12; // fuentes web citadas por turno
export const MAX_TITULO = 300; // título de cada fuente
export const MAX_URL = 2_000; // URL de cada fuente
export const MAX_HOST = 200; // host de cada fuente

export interface TurnoFuente {
  title: string;
  url: string;
  host: string;
}

export interface TurnoGuardable {
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  sources?: TurnoFuente[];
}

export interface ResultadoSaneo {
  turnos: TurnoGuardable[];
  /** Motivo del rechazo cuando turnos queda vacío por validación fallida. */
  error?: string;
}

const ROLES_VALIDOS = new Set(["user", "assistant"]);

/** Recorta un string a n caracteres sin romper (undefined → ""). */
function techo(v: unknown, n: number): string {
  return typeof v === "string" ? v.slice(0, n) : "";
}

/**
 * Sanea un hilo completo: acepta lo desconocido y devuelve SOLO lo publicable.
 * Rechaza (turnos vacíos + error) si no es un array, si algún rol es
 * inválido o si no hay al menos un turno de usuario y uno de asistente.
 */
export function sanearHilo(crudo: unknown): ResultadoSaneo {
  if (!Array.isArray(crudo)) {
    return { turnos: [], error: "El hilo no es una lista de turnos." };
  }
  if (crudo.length === 0) {
    return { turnos: [], error: "El hilo está vacío." };
  }
  if (crudo.length > MAX_TURNOS) {
    return {
      turnos: [],
      error: `Demasiados turnos (máx. ${MAX_TURNOS}).`,
    };
  }

  const turnos: TurnoGuardable[] = [];
  for (const t of crudo) {
    if (typeof t !== "object" || t === null) {
      return { turnos: [], error: "Turno malformado." };
    }
    const candidato = t as Record<string, unknown>;
    const role = candidato.role;
    if (typeof role !== "string" || !ROLES_VALIDOS.has(role)) {
      return { turnos: [], error: `Rol inválido (${String(role)}).` };
    }
    const content = techo(candidato.content, MAX_CONTENIDO);
    if (!content.trim()) {
      return { turnos: [], error: "Hay un turno sin contenido." };
    }

    const turno: TurnoGuardable = { role: role as TurnoGuardable["role"], content };
    // thinking: solo asistente, opcional, con techo propio
    if (role === "assistant" && typeof candidato.thinking === "string" && candidato.thinking.trim()) {
      turno.thinking = candidato.thinking.slice(0, MAX_THINKING);
    }
    // sources: whitelist estricta por campo
    if (Array.isArray(candidato.sources) && candidato.sources.length > 0) {
      const fuentes: TurnoFuente[] = [];
      for (const s of candidato.sources.slice(0, MAX_SOURCES)) {
        if (typeof s !== "object" || s === null) continue;
        const f = s as Record<string, unknown>;
        const title = techo(f.title, MAX_TITULO);
        const url = techo(f.url, MAX_URL);
        const host = techo(f.host, MAX_HOST);
        if (!url) continue;
        fuentes.push({ title, url, host });
      }
      if (fuentes.length > 0) turno.sources = fuentes;
    }
    // media / images / kind / dataUrl: NO se publican (efímeros o pesados)
    turnos.push(turno);
  }

  const hayUsuario = turnos.some((t) => t.role === "user");
  const hayAsistente = turnos.some((t) => t.role === "assistant");
  if (!hayUsuario || !hayAsistente) {
    return {
      turnos: [],
      error: "La conversación necesita al menos un mensaje tuyo y una respuesta.",
    };
  }
  return { turnos };
}

/** Serializa un hilo saneado a JSON para la columna TEXT de la BD. */
export function serializarHilo(turnos: TurnoGuardable[]): string {
  return JSON.stringify(turnos);
}

/** Parsea el JSON de la BD con tolerancia: fila corrupta → hilo vacío. */
export function deserializarHilo(json: string | null | undefined): TurnoGuardable[] {
  if (!json) return [];
  try {
    const crudo: unknown = JSON.parse(json);
    if (!Array.isArray(crudo)) return [];
    return crudo.filter(
      (t): t is TurnoGuardable =>
        typeof t === "object" &&
        t !== null &&
        ROLES_VALIDOS.has((t as Record<string, unknown>).role as string) &&
        typeof (t as Record<string, unknown>).content === "string"
    );
  } catch {
    return [];
  }
}

/** Primer mensaje del usuario del hilo: el título natural del link. */
export function primerMensajeUsuario(turnos: TurnoGuardable[]): string {
  const t = turnos.find((x) => x.role === "user");
  return t ? t.content : "";
}

/** ¿Cuántos intercambios completos (usuario→asistente) tiene el hilo? */
export function contarIntercambios(turnos: TurnoGuardable[]): number {
  let n = 0;
  for (const t of turnos) {
    if (t.role === "assistant") n += 1;
  }
  return n;
}
