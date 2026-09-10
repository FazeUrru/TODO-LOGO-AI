// ============================================================
// todólogo.ai — Canal Todólogo Labs (v1.14.0)
// Registro central de features experimentales: cohortes, ciclo
// de vida finito y métricas obligatorias.
// ============================================================
//
// REGLAS DEL CANAL (el contrato que nos autoimpusimos):
//
// 1. **Ciclo de vida finito** — ninguna feature vive en Labs más de
//    8 semanas (`expira`): se gradúa a la app principal con
//    `npm run labs:graduate <id>` o se descarta. Nada de betas
//    perpetuas: si todo es «experimental», nada lo es.
//
// 2. **El ELO global es sagrado** — una feature de Labs NUNCA escribe
//    en `Vote` ni en `EloState` sin namespace propio (p. ej. tablas
//    `Vote_beta_*` o un flag por torneo). Un bug experimental no puede
//    corromper millones de votos reales.
//
// 3. **Telemetría desde el día uno** — toda feature declara las
//    métricas que emitirá (`metricas`): adopción, uso, abandono y
//    crash como mínimo. Una beta sin datos es solo un grupo de quejas.
//
// 4. **Contrato explícito con quien la activa** — la página /labs
//    declara que el modo puede fallar, perder tu partida o mostrar
//    datos inconsistentes. Sin letra pequeña escondida.

export type Cohorte = "explorer" | "builder" | "inner";
export type EstadoLabs = "en-pruebas" | "graduado" | "descartado";
export type TipoEventoLabs = "entered" | "used" | "abandoned" | "crashed";

export const TIPOS_EVENTO: TipoEventoLabs[] = ["entered", "used", "abandoned", "crashed"];

export interface LabsFeature {
  id: string; // id canónico, p. ej. "copa-32-64"
  nombre: string;
  descripcion: string;
  cohorte: Cohorte;
  estado: EstadoLabs;
  expira: string; // fecha ISO — regla de las 8 semanas
  metricas: string[]; // eventos estructurados que emite
  /** v1.21.0 — página propia de la feature, si tiene una (se enlaza desde /labs). */
  url?: string;
}

export const COHORTES: Record<
  Cohorte,
  { nombre: string; descripcion: string; requisito: string; color: string }
> = {
  explorer: {
    nombre: "Explorer",
    descripcion: "Abierta a todo el mundo: entra con un clic y prueba lo que cocinamos.",
    requisito: "Nadie te para en la puerta.",
    color: "bg-emerald-100 text-emerald-800",
  },
  builder: {
    nombre: "Builder",
    descripcion: "Contribuidores y usuarios con historial real de votos en la arena.",
    requisito: "Cuenta registrada (el histórico de >50 votos llegará con el ELO por usuario).",
    color: "bg-amber-100 text-amber-800",
  },
  inner: {
    nombre: "Inner Circle",
    descripcion: "Equipo y testers de confianza: cambios profundos de algoritmo o infraestructura.",
    requisito: "Lista de invitados (LABS_INNER_EMAILS en el entorno del servidor).",
    color: "bg-rose-100 text-rose-800",
  },
};

/** Fecha de apertura del canal: todas las features expiran 8 semanas después. */
export const LABS_APERTURA = "2026-09-09";

/**
 * Catálogo de features en pruebas, ordenadas por cohorte y ROI.
 * Cada una es un flag real: la página /labs permite inscribirse y la
 * telemetría mide adopción/abandono desde el primer día.
 */
export const LABS_FEATURES: LabsFeature[] = [
  {
    id: "copa-32-64",
    nombre: "Copas de 32 y 64 modelos",
    descripcion:
      "Cuadruplicar el bracket de la Copa Todólogo hasta 32 y 64 contendientes: generación paralela a gran escala y una UX de cuadro que no se pierda.",
    cohorte: "explorer",
    // v1.20.0 — graduada: sorteo garantizado (pool expandido al catálogo
    // completo), oleadas con presupuesto y catálogo de 64 modelos de texto.
    estado: "graduado",
    expira: "2026-11-04",
    metricas: ["entered", "used", "abandoned", "crashed"],
  },
  {
    id: "duelo-equipos",
    nombre: "Duelo por equipos 2v2",
    descripcion:
      "Dos modelos cooperan por equipo y un tercero arbitra: mecánica de apoyo no trivial que necesita pruebas reales de UX antes de tocar el ELO.",
    cohorte: "explorer",
    estado: "en-pruebas",
    // v1.21.0 — la mecánica ya existe: /labs/duelo-equipos. El marcador vive
    // en tu dispositivo; el ELO global sigue intocado (regla nº 2).
    url: "/labs/duelo-equipos",
    expira: "2026-11-04",
    metricas: ["entered", "used", "abandoned", "crashed"],
  },
  {
    id: "arena-imagenes",
    nombre: "Arena de imágenes",
    descripcion:
      "Comparar generadores de imagen con tu mismo prompt y votar: ranking ELO de imagen separado por completo del de texto.",
    cohorte: "explorer",
    // v1.19.0 — graduada: el duelo ciego con ELO separado (tabla EloArena)
    // vive ya en el Laboratorio generativo y en el leaderboard.
    estado: "graduado",
    expira: "2026-11-04",
    metricas: ["entered", "used", "abandoned", "crashed"],
  },
  {
    id: "api-publica",
    nombre: "API pública con claves",
    descripcion:
      "/api/v2/battle con claves personales, rate-limit propio y contrato OpenAPI: feedback real de DX antes de comprometer el contrato para siempre.",
    cohorte: "builder",
    // v1.20.0 — graduada: /api/v2 completa (leaderboard, models, campeones,
    // jurados, battle, vote, openapi), claves sk-todo-… y docs en /api-publica.
    estado: "graduado",
    expira: "2026-11-04",
    metricas: ["entered", "used", "abandoned"],
  },
  {
    id: "plantillas-prompts",
    nombre: "Plantillas de prompts",
    descripcion:
      "Exportar e importar «consignas ganadoras» con los metadatos del modelo que las hizo vencer: la sabiduría de la arena, compartible.",
    cohorte: "builder",
    estado: "en-pruebas",
    expira: "2026-11-04",
    metricas: ["entered", "used", "abandoned"],
  },
  {
    id: "agente-fases",
    nombre: "Agente multi-paso persistente",
    descripcion:
      "El agente actual planifica; este ejecuta fases con estado persistente y sandboxing. Requiere pruebas de estabilidad antes de abrirlo a todos.",
    cohorte: "builder",
    estado: "en-pruebas",
    expira: "2026-11-04",
    metricas: ["entered", "used", "abandoned", "crashed"],
  },
  {
    id: "elo-bayesiano",
    nombre: "ELO bayesiano (TrueSkill)",
    descripcion:
      "Sustituir el delta clásico por TrueSkill: cambio profundo de algoritmo que exige validación estadística contra el historial antes de migrar los votos.",
    cohorte: "inner",
    estado: "en-pruebas",
    expira: "2026-11-04",
    metricas: ["entered", "used", "abandoned", "crashed"],
  },
  {
    id: "modelos-locales",
    nombre: "Modelos locales (Ollama)",
    descripcion:
      "Corre Llama en tu máquina y enfréntalo a los gigantes de la arena: implicaciones enormes de UX y privacidad que queremos probar con pocos usuarios.",
    cohorte: "inner",
    estado: "en-pruebas",
    expira: "2026-11-04",
    metricas: ["entered", "used", "abandoned", "crashed"],
  },
  {
    id: "streaming-ws",
    nombre: "Streaming bidireccional",
    descripcion:
      "Reemplazar SSE por WebSocket para torneos en vivo con audiencia concurrente: el espectador vería el cuadro moverse en tiempo real.",
    cohorte: "inner",
    estado: "en-pruebas",
    expira: "2026-11-04",
    metricas: ["entered", "used", "abandoned", "crashed"],
  },
];

export function featurePorId(id: string): LabsFeature | undefined {
  return LABS_FEATURES.find((f) => f.id === id);
}

/** Cohorte de un visitante. En servidor, con su sesión si la tiene. */
export function cohorteDeSesion(opts: {
  conectado: boolean;
  email?: string | null;
  emailsInner?: string[];
}): Cohorte {
  if (opts.email && (opts.emailsInner ?? []).some((e) => e.toLowerCase() === opts.email!.toLowerCase())) {
    return "inner";
  }
  return opts.conectado ? "builder" : "explorer";
}

/**
 * ¿Puede esta cohorte activar esta feature? Una cohorte superior hereda
 * el acceso de las inferiores (inner también es builder y explorer).
 */
const RANGO: Record<Cohorte, number> = { explorer: 0, builder: 1, inner: 2 };

export function puedeActivar(feature: LabsFeature, cohorte: Cohorte): boolean {
  return feature.estado === "en-pruebas" && RANGO[cohorte] >= RANGO[feature.cohorte];
}

/**
 * Validación del registro en arranque/tests: ids únicos, cohortes válidas,
 * expira posterior a la apertura y métricas mínimas declaradas.
 */
export function registroSano(): string[] {
  const problemas: string[] = [];
  const vistos = new Set<string>();
  for (const f of LABS_FEATURES) {
    if (vistos.has(f.id)) problemas.push(`id duplicado: ${f.id}`);
    vistos.add(f.id);
    if (!(f.cohorte in COHORTES)) problemas.push(`cohorte inválida en ${f.id}`);
    if (f.expira <= LABS_APERTURA) problemas.push(`expira anterior a la apertura en ${f.id}`);
    if (!f.metricas.includes("entered")) problemas.push(`falta métrica entered en ${f.id}`);
  }
  return problemas;
}
