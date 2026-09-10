/**
 * ELO de jurado (v1.20.0): el ranking del que TÚ formas parte.
 *
 * Hasta hoy el ELO de la arena medía a los modelos. El jurado — la gente que
 * vota — era invisible. Esta librería le da su propia escalera: cada voto
 * mueve el ELO del jurado según lo alineado que esté con la sabiduría del
 * arena (el consenso ELO global en el momento del voto), con racha diaria y
 * títulos. Reglas transparentes y testeables, sin magia:
 *
 *  · Votas al FAVORITO (su puntuación esperada ≥ 0.5)  → acierto: +8, más
 *    +1 por cada día de racha (máx. +7). Premia la constancia, no la suerte.
 *  · Votas al no favorito (contrario)                  → −4. Ir contra el
 *    consenso es legítimo, pero el consenso te cobra.
 *  · Empate                                            → +2 (participación).
 *  · «Ambos malos»                                     → +1 (feedback útil).
 *  · Sin consenso disponible (ELO idéntico / BD caída) → +4 (neutral).
 *
 * Las funciones son PURAS para que la CI las pueda testear de extremo a
 * extremo; la persistencia (BD con sesión, localStorage sin ella) vive en
 * jurado-servidor.ts y jurado-client.ts.
 */

export interface EstadoJurado {
  elo: number;
  votos: number;
  aciertos: number;
  racha: number; // días consecutivos votando (incluye hoy)
  mejorRacha: number;
  ultimoDia: string | null; // "2026-09-10" (UTC)
}

export const ELO_JURADO_BASE = 1000;

export const ESTADO_JURADO_INICIAL: EstadoJurado = {
  elo: ELO_JURADO_BASE,
  votos: 0,
  aciertos: 0,
  racha: 0,
  mejorRacha: 0,
  ultimoDia: null,
};

/** Día UTC en formato "YYYY-MM-DD" — la racha no depende de la zona horaria. */
export function diaUtc(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Diferencia en días entre dos fechas "YYYY-MM-DD". */
export function diasEntre(a: string, b: string): number {
  const da = Date.parse(`${a}T00:00:00Z`);
  const db = Date.parse(`${b}T00:00:00Z`);
  if (Number.isNaN(da) || Number.isNaN(db)) return Number.POSITIVE_INFINITY;
  return Math.round((db - da) / 86_400_000);
}

/** Racha nueva dado el día actual y la racha previa. */
export function rachaNueva(ultimoDia: string | null, hoy: string, racha: number): number {
  if (ultimoDia === hoy) return Math.max(racha, 1); // ya votó hoy: no decrece
  const gap = ultimoDia ? diasEntre(ultimoDia, hoy) : Number.POSITIVE_INFINITY;
  if (gap === 1) return racha + 1; // día consecutivo
  return 1; // hueco (o primer voto): la racha se reinicia
}

export type VotoJurado = "A" | "B" | "tie" | "bad";

/**
 * Delta de ELO + acierto para un voto, dado el consenso previo del arena:
 * `esFavorito` = el votado tenía puntuación esperada ≥ 0.5 (o null si no hay
 * consenso). `racha` es la racha YA actualizada del día.
 */
export function deltaJurado(
  voto: VotoJurado,
  esFavorito: boolean | null,
  racha: number
): { delta: number; acierto: boolean } {
  if (voto === "tie") return { delta: 2, acierto: false };
  if (voto === "bad") return { delta: 1, acierto: false };
  if (esFavorito === null) return { delta: 4, acierto: false };
  if (esFavorito) return { delta: 8 + Math.min(racha, 7), acierto: true };
  return { delta: -4, acierto: false };
}

/**
 * Aplica un voto al estado del jurado (inmutable). `esFavorito` puede ser
 * null (sin consenso). Devuelve el estado nuevo — nunca muta el recibido.
 */
export function aplicarVotoJurado(
  estado: EstadoJurado,
  voto: VotoJurado,
  esFavorito: boolean | null,
  hoy: string = diaUtc()
): EstadoJurado {
  const racha = rachaNueva(estado.ultimoDia, hoy, estado.racha);
  const { delta, acierto } = deltaJurado(voto, esFavorito, racha);
  return {
    elo: Math.round(estado.elo + delta),
    votos: estado.votos + 1,
    aciertos: estado.aciertos + (acierto ? 1 : 0),
    racha,
    mejorRacha: Math.max(estado.mejorRacha, racha),
    ultimoDia: hoy,
  };
}

/** ¿Es un día "YYYY-MM-DD" real? (rechaza 2026-13-99: formato sin fecha). */
export function esDiaValido(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const t = Date.parse(`${v}T00:00:00Z`);
  if (Number.isNaN(t)) return false;
  return new Date(t).toISOString().slice(0, 10) === v; // ida y vuelta fiel
}

/** Sanea un estado leído de BD/localStorage: nunca reviva basura. */
export function saneaJurado(x: unknown): EstadoJurado {
  const e = (typeof x === "object" && x !== null ? x : {}) as Record<string, unknown>;
  const num = (v: unknown, base: number) =>
    typeof v === "number" && Number.isFinite(v) ? v : base;
  return {
    elo: Math.round(num(e.elo, ELO_JURADO_BASE)),
    votos: Math.max(0, Math.round(num(e.votos, 0))),
    aciertos: Math.max(0, Math.round(num(e.aciertos, 0))),
    racha: Math.max(0, Math.round(num(e.racha, 0))),
    mejorRacha: Math.max(0, Math.round(num(e.mejorRacha, 0))),
    ultimoDia: esDiaValido(e.ultimoDia) ? e.ultimoDia : null,
  };
}

/* ─────────────── Títulos del jurado ─────────────── */

export interface TituloJurado {
  nombre: string;
  min: number;
  color: string; // clase tailwind del texto
}

/** Escalera de títulos — umbrales estables, documentados en la UI. */
export const TITULOS: TituloJurado[] = [
  { nombre: "Leyenda del jurado", min: 1400, color: "text-amber-500" },
  { nombre: "Árbitro", min: 1300, color: "text-violet-500" },
  { nombre: "Crítico", min: 1200, color: "text-sky-500" },
  { nombre: "Conocedor", min: 1100, color: "text-emerald-500" },
  { nombre: "Aficionado", min: 1000, color: "text-muted-foreground" },
  { nombre: "Aprendiz", min: 0, color: "text-muted-foreground" },
];

/** Título correspondiente a un ELO de jurado. */
export function tituloJurado(elo: number): TituloJurado {
  return TITULOS.find((t) => elo >= t.min) ?? TITULOS[TITULOS.length - 1];
}
