/**
 * Persistencia de sesiones de Copa Todólogo (v1.13.0).
 *
 * Hasta la v1.12.0 las copas vivían solo en la memoria del proceso: un
 * reinicio (o una instancia serverless distinta) perdía el cuadro en curso
 * y el voto de un duelo devolvía «la copa ha expirado». Este módulo define
 * la serialización canónica de una copa a JSON para la tabla `CopaSesion`,
 * con write-through en cada mutación y read-through al ausentarse de memoria.
 *
 * Funciones puras (sin BD) para que la CI las pueda testear de extremo a
 * extremo: `serializarCopa` → `deserializarCopa` es un ida y vuelta fiel,
 * y `deserializarCopa` rechaza cualquier payload malformado (nunca revive
 * basura en memoria).
 */

/** Contendiente anónimo de un duelo (estructura idéntica a la del route). */
export interface CopaContender {
  modelId: string;
  label: string;
  text: string;
}

/** Duelo del cuadro. */
export interface CopaDuel {
  key: string;
  a: CopaContender;
  b: CopaContender;
  winner?: "a" | "b";
  swing?: number;
}

/** Sesión completa de una copa, tal y como la maneja el Modo Torneo. */
export interface Copa {
  id: string;
  prompt: string;
  createdAt: number;
  size: 4 | 8 | 16;
  roundNames: string[];
  labelNames: string[];
  rounds: CopaDuel[][];
  championModelId?: string;
  revealed: boolean;
}

/**
 * Serializa una copa al JSON canónico que vive en `CopaSesion.datos`.
 * El orden de propiedades es el del objeto: estable y suficiente.
 */
export function serializarCopa(copa: Copa): string {
  return JSON.stringify(copa);
}

/** Validación estructural mínima de un objeto copa reconstruido de BD. */
function esCopaValida(x: unknown): x is Copa {
  if (typeof x !== "object" || x === null) return false;
  const c = x as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    c.id.length > 0 &&
    typeof c.prompt === "string" &&
    typeof c.createdAt === "number" &&
    (c.size === 4 || c.size === 8 || c.size === 16) &&
    Array.isArray(c.roundNames) &&
    Array.isArray(c.labelNames) &&
    Array.isArray(c.rounds) &&
    typeof c.revealed === "boolean" &&
    c.rounds.every(
      (r: unknown) =>
        Array.isArray(r) &&
        r.every((d: unknown) => {
          if (typeof d !== "object" || d === null) return false;
          const duelo = d as Record<string, unknown>;
          const contendiente = (v: unknown) =>
            typeof v === "object" &&
            v !== null &&
            typeof (v as Record<string, unknown>).modelId === "string" &&
            typeof (v as Record<string, unknown>).label === "string" &&
            typeof (v as Record<string, unknown>).text === "string";
          return (
            typeof duelo.key === "string" && contendiente(duelo.a) && contendiente(duelo.b)
          );
        })
    )
  );
}

/**
 * Reconstruye una copa desde el JSON de la BD. Devuelve `null` si el
 * payload está corrupto o incompleto: el llamador responde 404 y la copa
 * simplemente no revive (nunca se inyecta basura en memoria).
 */
export function deserializarCopa(json: string): Copa | null {
  try {
    const obj: unknown = JSON.parse(json);
    if (!esCopaValida(obj)) return null;
    // Asegura los tipos finos (winner / swing) que la validación no mira:
    for (const ronda of obj.rounds) {
      for (const duelo of ronda) {
        if (duelo.winner !== "a" && duelo.winner !== "b") delete duelo.winner;
        if (typeof duelo.swing !== "number") delete duelo.swing;
      }
    }
    return obj;
  } catch {
    return null;
  }
}
