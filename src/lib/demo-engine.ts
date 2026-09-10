/**
 * Motor demo local para el export estático (GitHub Pages).
 *
 * GitHub Pages no tiene backend: ninguna /api/* existe allí. DemoBridge
 * intercepta las peticiones de fetch y las resuelve aquí, replicando
 * EXACTAMENTE las formas de respuesta de las APIs reales del servidor
 * (batalla, voto, ranking, copa, imagen, agente y cuentas).
 *
 * El texto se genera localmente con las personas de estilo de cada modelo
 * (src/lib/personas.ts) y plantillas por arquetipo: no es IA real en este
 * modo, y la propia app lo indica con una píldora «Demo estática».
 */

import { MODELS, PROVIDERS, getModel, CATEGORIAS_GENERATIVAS, esGenerativo, type AIModel } from "./models-data";
import { categoryElo, eloDeltaFromVotes, expectedScore, type LeaderRow, type Winner } from "./elo";
import { dueloDeDia, fechaDeDuelo } from "./duelo-dia";
import { RECIPES_3D } from "./models-3d";
import { estadisticasSalon } from "./salon-utils";
import { selloDe, sortearDuoImagen } from "./arena-imagen";
import { REPLAYS_CURADOS, tarjetaDeCurado, curadoPorId, type TarjetaMuro } from "./muro-curados";

/* ───────────────────────── Utilidades ───────────────────────── */

type JSON = Record<string, unknown>;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function rid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0;
  return Math.abs(h);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function jsonRes(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errRes(error: string, status = 400): Response {
  return jsonRes({ ok: false, error }, status);
}

/* ─────────────────── Almacén local (localStorage) ─────────────────── */

const K_VOTES = "todologo_demo_votes_v1";
const K_USERS = "todologo_demo_users_v1";
const K_SESSION = "todologo_demo_session_v1";
const K_SALON = "todologo_demo_salon_v1"; // Salón de la Fama (v1.12.0)
const K_ELO_ARENA = "todologo_demo_eloarena_v1"; // ELO de arenas generativas (v1.19.0)

interface CampeonSalon {
  copaId: string;
  prompt: string;
  size: number;
  campeon: { id: string; name: string };
  subcampeon: { id: string; name: string } | null;
  at: string;
}

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* cuota llena: la demo continúa sin persistir */
  }
}

interface DemoVote {
  battleId: string;
  modelAId: string;
  modelBId: string;
  winner: Winner;
  category: string;
}

function getVotes(): DemoVote[] {
  return lsGet<DemoVote[]>(K_VOTES, []);
}

function addVote(v: DemoVote) {
  const votes = getVotes();
  votes.push(v);
  lsSet(K_VOTES, votes);
}

/** Deltas por modelo a partir de los votos locales (igual que el servidor).
 *  v1.19.0 — consciente de la arena: en generativas solo cuentan los votos
 *  de esa modalidad; en texto se excluyen los generativos. */
function tallyFor(id: string, arena?: string) {
  let wins = 0, losses = 0, ties = 0, bads = 0;
  for (const v of getVotes()) {
    if (v.modelAId !== id && v.modelBId !== id) continue;
    if (arena) {
      // Arena generativa: solo votos de ESA modalidad
      if (v.category !== arena) continue;
    } else if ((CATEGORIAS_GENERATIVAS as readonly string[]).includes(v.category)) {
      // Arena de texto: los votos generativos no contaminan el delta
      continue;
    }
    if (v.winner === "tie") ties++;
    else if (v.winner === "bad") bads++;
    else {
      const winnerId = v.winner === "A" ? v.modelAId : v.modelBId;
      if (winnerId === id) wins++;
      else losses++;
    }
  }
  return { wins, losses, ties, bads };
}

/* ───────── ELO de arenas generativas (v1.19.0, espejo de EloArena) ───────── */

const ELO_BASE_ARENA = 1000;
const K_ARENA = 24;

interface FilaEloArena {
  elo: number;
  wins: number;
  losses: number;
  ties: number;
  battles: number;
}

type MapaEloArena = Record<string, FilaEloArena>; // modelId → fila, por arena

function getMapaArena(arena: string): MapaEloArena {
  return lsGet<MapaEloArena>(`${K_ELO_ARENA}:${arena}`, {});
}

/** Aplica un duelo al ELO SEPARADO de la arena generativa (matemática idéntica). */
function applyArenaDuelDemo(arena: string, aId: string, bId: string, winner: "A" | "B" | "tie") {
  const mapa = getMapaArena(arena);
  const ra = mapa[aId]?.elo ?? ELO_BASE_ARENA;
  const rb = mapa[bId]?.elo ?? ELO_BASE_ARENA;
  const expA = 1 / (1 + Math.pow(10, (rb - ra) / 400));
  const scoreA = winner === "A" ? 1 : winner === "B" ? 0 : 0.5;
  const newA = Math.round((ra + K_ARENA * (scoreA - expA)) * 10) / 10;
  const newB = Math.round((rb + K_ARENA * (1 - scoreA - (1 - expA))) * 10) / 10;
  const fila = (which: "A" | "B", elo: number): FilaEloArena => ({
    elo,
    wins: winner === which ? 1 : 0,
    losses: winner !== which && winner !== "tie" ? 1 : 0,
    ties: winner === "tie" ? 1 : 0,
    battles: 1,
  });
  const previo = (id: string, elo: number, which: "A" | "B"): FilaEloArena => {
    const p = mapa[id];
    const f = fila(which, elo);
    return p
      ? { elo: f.elo, wins: p.wins + f.wins, losses: p.losses + f.losses, ties: p.ties + f.ties, battles: p.battles + 1 }
      : f;
  };
  mapa[aId] = previo(aId, newA, "A");
  mapa[bId] = previo(bId, newB, "B");
  lsSet(`${K_ELO_ARENA}:${arena}`, mapa);
}

/* ───────────────────────── Cuentas demo ───────────────────────── */

interface DemoUser {
  id: string;
  email: string;
  name: string;
  provider: string;
}

interface StoredAccount {
  name: string;
  hash: string;
  provider: string;
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function nameFromEmail(email: string): string {
  const local = email.split("@")[0].replace(/[._\-0-9]+/g, " ").trim();
  const clean = local.length >= 2 ? local : email.split("@")[0];
  return clean
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const SOCIAL_LABEL: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  microsoft: "Microsoft",
  x: "X",
};

async function handleAuth(path: string, init: RequestInit | undefined): Promise<Response | null> {
  const body = (() => {
    try {
      return JSON.parse(String(init?.body ?? "{}")) as JSON;
    } catch {
      return {};
    }
  })();

  if (path === "/api/auth/me") {
    return jsonRes({ user: lsGet<DemoUser | null>(K_SESSION, null) });
  }
  if (path === "/api/auth/logout") {
    lsSet(K_SESSION, null);
    return jsonRes({ ok: true });
  }
  if (path === "/api/auth/register") {
    const email = String(body.email ?? "").toLowerCase().trim();
    const password = String(body.password ?? "");
    const name = String(body.name ?? "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return errRes("Escribe un correo válido.");
    if (password.length < 8) return errRes("La contraseña necesita al menos 8 caracteres.");
    const users = lsGet<Record<string, StoredAccount>>(K_USERS, {});
    if (users[email]) return errRes("Ya existe una cuenta con ese correo. Inicia sesión.");
    users[email] = { name: name || nameFromEmail(email), hash: await sha256(password), provider: "email" };
    lsSet(K_USERS, users);
    const user: DemoUser = { id: `u_${hashStr(email).toString(36)}`, email, name: users[email].name, provider: "email" };
    lsSet(K_SESSION, user);
    return jsonRes({ ok: true, user });
  }
  if (path === "/api/auth/login") {
    const email = String(body.email ?? "").toLowerCase().trim();
    const users = lsGet<Record<string, StoredAccount>>(K_USERS, {});
    const acc = users[email];
    if (!acc || acc.hash !== (await sha256(String(body.password ?? "")))) {
      return errRes("Correo o contraseña incorrectos.", 401);
    }
    const user: DemoUser = { id: `u_${hashStr(email).toString(36)}`, email, name: acc.name, provider: acc.provider };
    lsSet(K_SESSION, user);
    return jsonRes({ ok: true, user });
  }
  if (path === "/api/auth/social") {
    const provider = String(body.provider ?? "google");
    const email = String(body.email ?? "").toLowerCase().trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return errRes("Escribe el correo de tu cuenta.");
    const users = lsGet<Record<string, StoredAccount>>(K_USERS, {});
    if (!users[email]) {
      users[email] = { name: nameFromEmail(email), hash: "", provider };
      lsSet(K_USERS, users);
    }
    const user: DemoUser = {
      id: `u_${hashStr(email).toString(36)}`,
      email,
      name: users[email].name,
      provider,
    };
    lsSet(K_SESSION, user);
    return jsonRes({ ok: true, user });
  }
  return null;
}

/* ─────────────── Composición de texto (personas por arquetipo) ─────────────── */

const STOP = new Set(
  ("el la los las un una unos unas al del lo les se su sus mi mis tu tus le nos os me te te he has ha han hay de del al a ante bajo con contra desde durante en entre hacia hasta mediante para por segun sin sobre tras y o u e ni que como cuando donde quien cual cuales cual es son era fue ser estar soy estas esta este estos estas eso esa ese eso si no pero porque muy mas menos ya aun tambien quo the and for with from that this what how why can you your").split(
    " "
  )
);

function keywordsOf(prompt: string): string[] {
  const words = prompt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9áéíóúñü\s]/gi, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP.has(w));
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) ?? 0) + 1);
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, 6)
    .map(([w]) => w);
}

function topicOf(prompt: string): string {
  const kws = keywordsOf(prompt);
  if (kws.length === 0) return "tu pregunta";
  return kws.slice(0, 3).join(", ");
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type Ctx = { prompt: string; topic: string; kws: string[]; fresh: number };

/** Arquetipos de estilo (espejo de src/lib/personas.ts). */
function archetypeOf(modelId: string): string {
  const map: [string, string][] = [
    ["glm-5-coder", "engineer"],
    ["qwen3.8-coder", "engineer"],
    ["starcoder", "engineer"],
    ["glm", "structured"],
    ["claude", "reflexive"],
    ["fable", "narrative"],
    ["muse", "narrative"],
    ["gpt", "consultant"],
    ["o5", "researcher"],
    ["deepseek", "researcher"],
    ["phi", "researcher"],
    ["gemini", "encyclopedic"],
    ["grok", "witty"],
    ["mistral", "pragmatic"],
    ["kimi", "documentalist"],
    ["minimax", "minimal"],
    ["haiku", "minimal"],
    ["flash", "minimal"],
    ["mini", "minimal"],
    ["llama", "community"],
    ["qwen", "community"],
  ];
  for (const [k, v] of map) if (modelId.includes(k)) return v;
  return "professional";
}

const OPENERS: Record<string, string[]> = {
  structured: ["Voy al grano con {t}.", "Respuesta directa sobre {t}:"],
  reflexive: ["{T} merece un poco de matiz antes de decidir.", "Vamos por partes con {t}."],
  consultant: ["Encaro {t} como un framework de tres bloques.", "Analicemos {t} con criterio de consultoría."],
  encyclopedic: ["Un poco de contexto sobre {t} ayuda a decidir mejor.", "{T}: contexto y datos clave."],
  witty: ["{T} sin rodeos (bueno, dos rodeos).", "Vale, {t}: te lo cuento sin humo."],
  engineer: ["Trato {t} como un problema de diseño.", "Solución técnica para {t}:"],
  narrative: ["Hay algo fascinante en {t}.", "{T} es de esas historias que conviene contar bien."],
  minimal: ["Clave sobre {t}:", "Lo esencial de {t}:"],
  researcher: ["Planteo {t} como hipótesis verificable.", "Análisis riguroso de {t}:"],
  pragmatic: ["Lo práctico primero: {t}.", "{T}, sin idealismos:"],
  documentalist: ["Documentado lo esencial sobre {t}:", "Fuentes y estructura para {t}."],
  community: ["En comunidad esto se resuelve así: {t}.", "{T} desde la experiencia compartida."],
  professional: ["Sobre {t}, esto es lo que importa.", "{T}: guía clara."],
};

const BODY_BLOCKS: Record<string, ((c: Ctx) => string)[]> = {
  structured: [
    () => "- **Decisión:** elige la opción más simple que cumpla el objetivo hoy; la complejidad se añade, nunca se regala.\n- **Por qué:** cada capa extra multiplica coste de mantenimiento y puntos de fallo.\n- **Cómo:** define la métrica de éxito antes de escribir la primera línea.",
    () => "1. Define el resultado en una frase medible.\n2. Reduce el problema al caso mínimo viable.\n3. Itera con feedback real, no con suposiciones.",
    () => "- **Lo crítico:** no perder de vista el criterio de éxito.\n- **Lo olvidado siempre:** el coste de operación posterior al lanzamiento.\n- **El atajo honesto:** reutilizar lo que ya funciona.",
  ],
  reflexive: [
    () => "1. **Entiende el contexto real** — la respuesta correcta depende más del caso que de la teoría.\n2. **Sopesa alternativas** — casi nunca existe una única vía buena; existen compromisos distintos.\n3. **Verifica supuestos** — la mayoría de errores nacen de dar por hecho algo que no lo es.\n4. **Decide y documenta** — anota por qué elegiste así; tu yo futuro lo agradecerá.",
    () => "Hay tres consideraciones que suelen decidir el resultado:\n\n- El **alcance**: mejor un área resuelta de verdad que cinco a medias.\n- El **tiempo**: los plazos realistas incluyen imprevistos; los idealistas, no.\n- El **mantenimiento**: todo lo que construyas lo tendrá que cuidar alguien.",
  ],
  consultant: [
    () => "**Diagnóstico** — el problema de fondo casi nunca es el síntoma visible.\n\n**Pros y contras**\n- Ventaja principal: foco y velocidad de aprendizaje.\n- Riesgo principal: subestimar el coste de cambio.\n\n**Recomendación** — empieza por un piloto acotado, mide y escala solo lo que funcione.",
    () => "Framework rápido:\n\n1. **Impacto**: ¿qué cambia si lo resuelves bien?\n2. **Esfuerzo**: ¿cuál es el camino más corto con calidad aceptable?\n3. **Riesgo**: ¿qué puede romperse y cómo lo detectas pronto?\n\nCon esas tres respuestas, la decisión casi se toma sola.",
  ],
  encyclopedic: [
    () => "- **Contexto:** este tipo de decisiones se han estudiado mucho; los patrones que funcionan comparten un patrón: empezar pequeño y medir.\n- **Dato útil:** los proyectos que documentan sus decisiones desde el día uno fallan bastante menos al escalar.\n- **Enfoque multimodal:** combina fuentes — texto, ejemplos visuales y datos numéricos — antes de concluir.",
    () => "Contexto amplio en tres ideas:\n\n1. El estado del arte cambia rápido; los principios, despacio.\n2. Los datos concretos baten a las opiniones generales.\n3. La mejor referencia es el caso más parecido al tuyo, no el más famoso.",
  ],
  witty: [
    () => "- La respuesta corta: sí, pero al revés de lo que te han contado.\n- La larga: funciona hasta que escala; entonces lo simple gana.\n- Dato duro: el 80 % del valor suele estar en el 20 % del esfuerzo bien colocado.",
    () => "Tres verdades incómodas:\n\n1. Nadie lee la documentación, pero todos la echan de menos.\n2. La solución elegante de hoy es el legacy de mañana — elígela simple.\n3. Si necesitas un diagrama para explicar tu plan, el plan aún no está listo.",
  ],
  engineer: [
    () => "**Diseño:** separa la lógica del transporte y el estado; cada módulo con una sola razón para cambiar.\n\n**Implementación:** empieza por el caso feliz, añade errores después.\n\n**Prueba:** un test por comportamiento, no por línea.",
    () => "Decisiones técnicas justificadas:\n\n- **Estructura plana** sobre jerarquías profundas: menos transformaciones, menos bugs.\n- **Validación en el borde**: el sistema interno confía en datos ya validados.\n- **Observabilidad desde el minuto uno**: un log estructurado ahorra horas de depuración.",
  ],
  narrative: [
    () => "Piénsalo como una novela bien estructurada: primero el conflicto (tu objetivo), luego los personajes (los recursos de que dispones) y al final el giro (aquello que nadie había probado). Las mejores soluciones casi siempre empiezan siendo incómodamente simples.",
    () => "Hay una analogía que lo explica: construir esto es como montar un jardín, no una estatua. La estatua se esculpe una vez; el jardín se poda cada semana. Si tu proyecto vive y respira, elige el jardín.",
  ],
  minimal: [
    () => "- Empieza por el caso mínimo.\n- Mide antes de optimizar.\n- Documenta la decisión, no el código.",
    () => "- Objetivo en una frase.\n- Un paso hoy, otro mañana.\n- Métrica clara desde el inicio.",
  ],
  researcher: [
    () => "**Hipótesis:** el factor limitante no es técnico sino de criterio: sin una métrica clara, cualquier resultado parece válido.\n\n**Análisis:** al comparar alternativas, fija variables y cambia solo una; si el escenario cambia dos cosas a la vez, la conclusión será ruido.\n\n**Conclusión:** define primero cómo medirás el éxito; el resto se deriva de ahí.",
    () => "Verificación paso a paso:\n\n1. **Supuesto inicial:** que el problema es estable — conviene validarlo.\n2. **Dato:** los casos similares resueltos con éxito comparten iteraciones cortas.\n3. **Contraste:** busca activamente el caso que refute tu plan; si sobrevive, avanza.",
  ],
  pragmatic: [
    () => "- **Robustez:** lo que no se puede romper en producción no se rompe; lo demás, supervisiona.\n- **Cumplimiento:** documenta datos personales y retenciones desde el diseño.\n- **Claridad:** si un compañero no lo entiende en cinco minutos, simplifícalo.",
    () => "Enfoque pragmático:\n\n1. Resuelve el caso real que tienes hoy, no el hipotético de 2030.\n2. Elige herramientas con comunidad grande y problemas ya respondidos.\n3. Deja puerta de salida: migrar debe ser caro por decisión, no por arquitectura.",
  ],
  documentalist: [
    () => "Secciones relevantes del tema:\n\n- **Definición y alcance** — qué entra y qué no.\n- **Estado actual** — qué existe ya y quién lo mantiene.\n- **Siguientes pasos** — con responsables y fechas.",
    () => "Documentación mínima viable:\n\n1. Un párrafo de contexto (el «por qué»).\n2. La decisión tomada y sus alternativas descartadas.\n3. El efecto esperado, con fecha de revisión.",
  ],
  community: [
    () => "Lo que funciona en la práctica comunitaria:\n\n- Ejemplos reproducibles ganan a explicaciones abstractas.\n- Comparte pronto: el feedback externo corrige en horas lo que solo tardarías semanas en ver.\n- Licencia y créditos claros desde el primer commit.",
    () => "Perspectivas comparadas:\n\n1. **Enfoque A (rápido):** resultado hoy, deuda mañana.\n2. **Enfoque B (sólido):** más arranque, menos sustos.\n3. **Enfoque mixto:** prototipa A, documenta hacia B.",
  ],
  professional: [
    () => "- **Objetivo:** tenlo en una frase.\n- **Camino:** el más corto con calidad aceptable.\n- **Evidencia:** una métrica que diga si funcionó.",
    () => "Resumen ejecutivo en tres líneas: define el éxito, reduce el alcance al mínimo útil y mide. Lo demás es ejecución.",
  ],
};

const CLOSERS = [
  "Si me das más contexto (presupuesto, plazo, público), afino la recomendación.",
  "Con un ejemplo concreto de tu caso, bajo esto a pasos exactos.",
  "La clave está en empezar: el plan perfecto no existe, el iterado sí.",
  "Y sobre todo: mide. Sin números, esto es opinión; con ellos, estrategia.",
];

function composeAnswer(modelId: string, prompt: string, opts?: { shorter?: boolean }): string {
  const ctx: Ctx = {
    prompt,
    topic: topicOf(prompt),
    kws: keywordsOf(prompt),
    fresh: hashStr(modelId + prompt) % 3,
  };
  const arch = archetypeOf(modelId);
  const openers = OPENERS[arch] ?? OPENERS.professional;
  const opener = openers[ctx.fresh % openers.length]
    .replace("{t}", ctx.topic)
    .replace("{T}", titleCase(ctx.topic));
  const blocks = BODY_BLOCKS[arch] ?? BODY_BLOCKS.professional;
  const body = blocks[ctx.fresh % blocks.length](ctx);
  const closer = opts?.shorter ? "" : `\n\n${CLOSERS[ctx.fresh % CLOSERS.length]}`;
  return `${opener}\n\n${body}${closer}`;
}

/* ─────────────── Modo código: snippets reales parametrizados ─────────────── */

function codeSnippet(prompt: string): { lang: string; code: string } {
  const p = prompt.toLowerCase();
  const kws = keywordsOf(prompt);
  const slug = kws[0] ?? "tarea";
  const fn = slug.replace(/[^a-z0-9]/gi, "") || "proceso";

  if (/react|componente|hook|jsx|tsx|ui/.test(p)) {
    return {
      lang: "tsx",
      code: `import { useEffect, useState } from "react";

/** Cargador de ${slug} con estados de carga y error. */
export function ${titleCase(fn)}Panel() {
  const [data, setData] = useState<${titleCase(fn)}[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/${slug}", { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(setData)
      .catch((e) => e.name !== "AbortError" && setError(e.message));
    return () => ctrl.abort();
  }, []);

  if (error) return <p role="alert">No se pudo cargar: {error}</p>;
  if (!data) return <p>Cargando ${slug}…</p>;

  return (
    <ul>
      {data.map((item) => (
        <li key={item.id}>{item.nombre}</li>
      ))}
    </ul>
  );
}`,
    };
  }
  if (/sql|consulta|base de datos|tabla|join|query/.test(p)) {
    return {
      lang: "sql",
      code: `-- ${titleCase(prompt.slice(0, 70))}
SELECT
  c.id,
  c.nombre,
  COUNT(p.id)              AS total_pedidos,
  SUM(p.importe)           AS importe_total,
  ROUND(AVG(p.importe), 2) AS ticket_medio
FROM clientes AS c
JOIN pedidos AS p ON p.cliente_id = c.id
WHERE p.creado_en >= DATE('now', '-90 days')
GROUP BY c.id, c.nombre
HAVING COUNT(p.id) > 3
ORDER BY importe_total DESC
LIMIT 20;`,
    };
  }
  if (/python|pandas|script|scrap|datos csv/.test(p)) {
    return {
      lang: "python",
      code: `"""${titleCase(prompt.slice(0, 70))}"""
import argparse, json, sys
from pathlib import Path

def ${fn}(ruta: Path) -> dict:
    if not ruta.exists():
        sys.exit(f"No existe: {ruta}")
    datos = json.loads(ruta.read_text(encoding="utf-8"))
    return {"total": len(datos), "muestras": datos[:3]}

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("entrada", type=Path)
    args = parser.parse_args()
    print(json.dumps(${fn}(args.entrada), ensure_ascii=False, indent=2))`,
    };
  }
  return {
    lang: "ts",
    code: `/** Reintenta una operación con espera exponencial (útil para APIs inestables). */
export async function ${fn}Reintentos<T>(
  operacion: () => Promise<T>,
  intentos = 3,
  esperaMs = 400
): Promise<T> {
  let ultimoError: unknown;
  for (let i = 0; i < intentos; i++) {
    try {
      return await operacion();
    } catch (e) {
      ultimoError = e;
      await new Promise((r) => setTimeout(r, esperaMs * 2 ** i));
    }
  }
  throw ultimoError;
}`,
  };
}

/* ─────────────── Modo vídeo: guion por escenas ─────────────── */

function videoScript(prompt: string): string {
  const t = titleCase(topicOf(prompt));
  return `**GUION · ${t}** (60–75 s, formato vertical 9:16)

**ESCENA 1 — Gancho (0:00–0:06)**
Plano: primerísimo del elemento clave, luz lateral cálida.
Voz en off: «¿Y si ${t} fuera mucho más simple de lo que crees?»
Música: pulso electrónico mínimo, sube de intensidad.

**ESCENA 2 — Problema (0:06–0:20)**
Plano: travelling lateral sobre el contexto cotidiano.
Voz en off: el problema tal y como lo vive la gente, sin tecnicismos.
Transición: barrido rápido de pantalla.

**ESCENA 3 — Solución (0:20–0:45)**
Planos: tres cortes secos, uno por beneficio, con rótulos de una palabra.
Música: entra la melodía principal; percusión marcada.

**ESCENA 4 — Prueba (0:45–0:58)**
Plano: pantalla dividida, antes/después; zoom sutil al resultado.
Voz en off: el dato que demuestra el cambio.

**ESCENA 5 — Cierre (0:58–1:10)**
Plano: frontal fijo, silencio de 1 s, call to action clara.
Música: resuelve en la tónica; fade out con el logotipo.`;
}

/* ─────────────── Modo 3D: receta procedural determinista ─────────────── */

function recipe3D(prompt: string): { text: string } {
  const p = prompt.toLowerCase();
  const match = RECIPES_3D.find((r) => r.kw.some((k) => p.includes(k)) || p.includes(r.id));
  if (match) {
    return {
      text: `He localizado en el catálogo de todólogo.ai el modelo que mejor encaja con tu petición: **${match.name}** (${match.cat}). Gíralo, acércate y explora cada pieza desde el visor; si quieres variaciones de color o escala, pídemelas.\n\nMODEL: ${match.id}`,
    };
  }
  // Escultura abstracta generada de forma determinista a partir del prompt
  const h = hashStr(prompt);
  const hues = ["#D94F3D", "#E8863A", "#F4C406", "#5D9C59", "#4A7DBD", "#7A6BB5", "#4FA3A5", "#C8A06A"];
  const parts: (string | number)[][] = [
    ["cy", 0, 0.08, 0, 1.15, 1.3, "#E7E1D8", 0, 0, 0],
    ["bx", 0, 0.85, 0, 0.7, 0.9, 0.7, hues[h % hues.length], 0, (h % 30) / 57, 0],
    ["sp", 0, 1.62, 0, 0.34, 0, 0, hues[(h >> 3) % hues.length], 0, 0, 0],
    ["to", 0, 1.62, 0, 0.62, 0.07, hues[(h >> 5) % hues.length], 0, 0, 0],
    ["co", 0, 2.1, 0, 0.16, 0.5, hues[(h >> 7) % hues.length], 0, 0, 0],
    ["sp", 0.52, 0.55, 0.52, 0.11, 0, 0, "#F4C406", 0, 0, 0],
    ["sp", -0.52, 0.55, -0.52, 0.11, 0, 0, "#F4C406", 0, 0, 0],
  ];
  return {
    text: `Te he esculpido una pieza original a partir de tu idea: una **torre con equilibrante orbital** — pedestal de mármol claro, núcleo girado en ${hues[h % hues.length]}, esfera central anillada y dos satélites ámbar. La genero como receta de primitivas para que pese menos que una foto:\n\n\`\`\`receta3d\n${JSON.stringify(parts)}\n\`\`\`\n\nPuedo ajustar altura, paleta o silueta: dime «más esbelta», «en rojo» o «estilo robot» y te doy otra variante al instante.`,
  };
}

/* ─────────────── Modo Juego AAA: prototipo jugable autoevolutivo ─────────────── */

function gameBlueprint(prompt: string, seed = 0): string {
  const h = hashStr(prompt) + seed * 7919;
  const palettes = [
    { bg: "#0B0E1A", neon: "#22D3EE", hot: "#F472B6", hero: "#F4C406" },
    { bg: "#120B1E", neon: "#A78BFA", hot: "#34D399", hero: "#FBBF24" },
    { bg: "#101A14", neon: "#4ADE80", hot: "#F87171", hero: "#38BDF8" },
  ];
  const pal = palettes[h % palettes.length];
  const names = ["NEÓN ARENA", "ECOS DEL VACÍO", "ÚLTIMO FARO", "VECTOR CARMESÍ", "PULSO CERO"];
  const name = names[(h >> 3) % names.length];

  const html = [
    "<!DOCTYPE html>",
    '<html lang="es">',
    "<head>",
    '<meta charset="utf-8">',
    "<title>" + name + "</title>",
    "<style>",
    "html,body{margin:0;height:100%;background:#05060F;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif}",
    "canvas{border-radius:12px;box-shadow:0 0 42px " + pal.neon + "55}",
    "#hud{position:fixed;top:10px;left:14px;color:#fff;font:12px/1.6 ui-monospace,monospace;white-space:pre;text-shadow:0 0 6px " + pal.neon + ";pointer-events:none}",
    "</style>",
    "</head>",
    "<body>",
    '<canvas id="c" width="480" height="320"></canvas>',
    '<div id="hud"></div>',
    "<script>",
    'var C=document.getElementById("c"),X=C.getContext("2d"),HUD=document.getElementById("hud");',
    "var W=C.width,H=C.height,BG='" + pal.bg + "',NEON='" + pal.neon + "',HOT='" + pal.hot + "',HERO='" + pal.hero + "';",
    "var keys={},px,py,foes=[],bullets=[],parts=[],score=0,wave=1,tick=0,cool=0,alive=false,best=0,ev=[];",
    "try{best=+localStorage.getItem('neon-best')||0}catch(e){best=0}",
    "function reset(){px=W/2;py=H/2;foes=[];bullets=[];parts=[];score=0;wave=1;tick=0;cool=0;ev=['Mundo procedural generado'];alive=true}",
    "document.addEventListener('keydown',function(e){var k=e.key.toLowerCase();keys[k]=true;if((k===' '||k==='enter')&&!alive)reset();if(k.indexOf('arrow')===0)e.preventDefault()});",
    "document.addEventListener('keyup',function(e){keys[e.key.toLowerCase()]=false});",
    "C.addEventListener('pointerdown',function(){if(!alive)reset()});",
    "function spawn(){var side=Math.floor(Math.random()*4);var x=side===0?-10:side===1?W+10:Math.random()*W;var y=side===2?-10:side===3?H+10:Math.random()*H;",
    " var nem=wave>=3&&Math.random()<0.10+wave*0.02;",
    " foes.push({x:x,y:y,r:nem?14:7+Math.random()*3,v:0.5+wave*0.11+(nem?0.55:0),hp:nem?3+Math.floor(wave/2):1,nem:nem,name:'NEMESIS-'+String.fromCharCode(65+Math.floor(Math.random()*26))+(wave)})}",
    "function boom(x,y,c,n){for(var i=0;i<n;i++){var a=Math.random()*6.283;parts.push({x:x,y:y,vx:Math.cos(a)*(1+Math.random()*2.5),vy:Math.sin(a)*(1+Math.random()*2.5),l:18+Math.random()*14,c:c})}}",
    "function nearest(){var m=null,d=1e9;foes.forEach(function(f){var dx=f.x-px,dy=f.y-py,q=dx*dx+dy*dy;if(q<d){d=q;m=f}});return m}",
    "function loop(){requestAnimationFrame(loop);",
    " if(alive){tick++;cool--;var s=2.4;",
    "  if(keys.arrowleft||keys.a)px-=s;if(keys.arrowright||keys.d)px+=s;if(keys.arrowup||keys.w)py-=s;if(keys.arrowdown||keys.s)py+=s;",
    "  px=Math.max(8,Math.min(W-8,px));py=Math.max(8,Math.min(H-8,py));",
    "  if(tick%Math.max(20,64-wave*5)===0)spawn();",
    "  if(cool<=0&&foes.length){var n=nearest();if(n){var an=Math.atan2(n.y-py,n.x-px);var v=3+wave*0.15;bullets.push({x:px,y:py,vx:Math.cos(an)*v,vy:Math.sin(an)*v});cool=Math.max(8,26-wave)}}",
    "  bullets.forEach(function(b){b.x+=b.vx;b.y+=b.vy});",
    "  foes.forEach(function(f){var a=Math.atan2(py-f.y,px-f.x);f.x+=Math.cos(a)*f.v;f.y+=Math.sin(a)*f.v});",
    "  foes.forEach(function(f){bullets.forEach(function(b){var dx=f.x-b.x,dy=f.y-b.y;if(dx*dx+dy*dy<f.r*f.r){b.dead=true;f.hp--;boom(b.x,b.y,HOT,4);",
    "   if(f.hp<=0){f.dead=true;score+=f.nem?50:10;boom(f.x,f.y,f.nem?HERO:NEON,f.nem?20:9);if(f.nem)ev.push('☠ '+f.name+' cae — sube el rango némesis')}}})});",
    "  bullets=bullets.filter(function(b){return !b.dead&&b.x>-20&&b.x<W+20&&b.y>-20&&b.y<H+20});",
    "  foes.forEach(function(f){var dx=f.x-px,dy=f.y-py;if(dx*dx+dy*dy<(f.r+6)*(f.r+6)){alive=false;boom(px,py,HOT,26);try{if(score>best){best=score;localStorage.setItem('neon-best',''+best)}}catch(e){}}});",
    "  foes=foes.filter(function(f){return !f.dead});",
    "  var nw=1+Math.floor(score/120);if(nw>wave){wave=nw;ev.push('⚡ Oleada '+wave+': enemigos más rápidos y cadencia mejorada')}",
    "  parts.forEach(function(p){p.x+=p.vx;p.y+=p.vy;p.l--});parts=parts.filter(function(p){return p.l>0});",
    " }",
    " // dibujo",
    " X.fillStyle=BG;X.fillRect(0,0,W,H);",
    " X.strokeStyle=NEON+'22';X.lineWidth=1;",
    " for(var gx=0;gx<W;gx+=32){X.beginPath();X.moveTo(gx,0);X.lineTo(gx,H);X.stroke()}",
    " for(var gy=0;gy<H;gy+=32){X.beginPath();X.moveTo(0,gy);X.lineTo(W,gy);X.stroke()}",
    " parts.forEach(function(p){X.globalAlpha=p.l/30;X.fillStyle=p.c;X.fillRect(p.x-1.5,p.y-1.5,3,3)});X.globalAlpha=1;",
    " bullets.forEach(function(b){X.fillStyle=HERO;X.shadowColor=HERO;X.shadowBlur=8;X.beginPath();X.arc(b.x,b.y,2.5,0,6.283);X.fill();X.shadowBlur=0});",
    " foes.forEach(function(f){X.fillStyle=f.nem?HOT:NEON;X.shadowColor=X.fillStyle;X.shadowBlur=f.nem?16:9;X.beginPath();X.arc(f.x,f.y,f.r,0,6.283);X.fill();X.shadowBlur=0;",
    "  if(f.nem){X.fillStyle='#fff';X.font='8px monospace';X.fillText(f.name,f.x-24,f.y-f.r-4)}});",
    " if(alive){X.fillStyle=HERO;X.shadowColor=HERO;X.shadowBlur=12;X.beginPath();var a2=Math.atan2((foes[0]?foes[0].y:py-1)-py,(foes[0]?foes[0].x:px-1)-px);",
    "  X.moveTo(px+Math.cos(a2)*10,py+Math.sin(a2)*10);X.lineTo(px+Math.cos(a2+2.5)*8,py+Math.sin(a2+2.5)*8);X.lineTo(px+Math.cos(a2-2.5)*8,py+Math.sin(a2-2.5)*8);X.closePath();X.fill();X.shadowBlur=0}",
    " var txt='PUNTOS '+score+'   OLEADA '+wave+'   RÉCORD '+best+'\\n'+(ev.length?ev[ev.length-1]:'');",
    " HUD.textContent=txt;",
    " if(!alive){X.fillStyle='rgba(5,6,15,0.78)';X.fillRect(0,0,W,H);",
    " X.fillStyle='#fff';X.textAlign='center';X.font='bold 22px system-ui';",
    " X.fillText('" + name + "',W/2,H/2-26);X.font='13px system-ui';",
    " X.fillStyle=NEON;X.fillText(score>0?'GAME OVER — '+score+' puntos':'Muévete con WASD o flechas · dispara solo',W/2,H/2+2);",
    " X.fillStyle='#fff';X.font='12px system-ui';X.fillText('Pulsa ESPACIO o toca para '+(score>0?'reintentar':'empezar'),W/2,H/2+26);",
    " if(best>0){X.fillStyle=HERO;X.fillText('Récord: '+best,W/2,H/2+48)}}",
    " X.textAlign='start';}",
    "loop();",
    "</scr" + "ipt>",
    "</body>",
    "</html>",
  ].join("\n");

  return [
    `🎮 **${name}** — *supervivencia arcade autoevolutiva* (prototipo generado para: «${topicOf(prompt)}»)`,
    ``,
    `**Ficha del juego** — arena de oleadas con estética neón: un piloto solitario contra enjambres que crecen contigo. Gancho: el mundo **evoluciona solo**, partida a partida.`,
    ``,
    `**Sistemas autoevolutivos**`,
    `- ⚡ **Dificultad adaptativa**: la velocidad y el ritmo de aparición suben solos con tu puntuación (oleadas).`,
    `- 🧠 **Némesis con rango**: desde la oleada 3 aparecen líderes que recuerdan por nombre y rango; derrotarlos sube el listón.`,
    `- 🔧 **Mejora procedural**: tu cadencia de disparo y velocidad de proyectil evolucionan con cada oleada.`,
    `- 💾 **Evolución persistente**: el récord se guarda (localStorage con reserva en memoria si está bloqueado).`,
    ``,
    `**Stack AAA real** — Unreal Engine 5.6 (Nanite + Lumen), NetCode dedicado, LiveOps con eventos que mutan el mapa estilo Steam Workshop.`,
    ``,
    `**Prototipo jugable** — WASD o flechas para moverte; tu nave dispara sola al enemigo más cercano. Pulsa ESPACIO o toca el lienzo para empezar:`,
    ``,
    "```html",
    html,
    "```",
    ``,
    `### ¿Siguiente paso?`,
    `¿Añado sonido chiptune con WebAudio? ¿Un modo dos jugadores a bordo dividida? ¿Lo convierto en roguelike con salas procedurales?`,
  ].join("\n");
}
/* ─────────────── Batalla (espejo de POST /api/battle) ─────────────── */

function drawDuel(): [AIModel, AIModel] {
  // v1.17.1 — solo modelos que conversan: los generativos (imagen/vídeo/audio)
  // no responden en el chat y no pueden salir en una batalla de texto.
  const sorted = [...MODELS.filter((m) => !esGenerativo(m))].sort((a, b) => b.elo - a.elo);
  const pool = sorted.slice(0, Math.ceil(sorted.length * 0.7));
  const a = pick(pool);
  let b = pick(pool);
  while (b.id === a.id) b = pick(pool);
  return [a, b];
}

function thinkingFor(modelId: string, prompt: string): string[] {
  const t = topicOf(prompt);
  return [
    "**Razonamiento:**",
    `Descompongo la petición: el núcleo es ${t}.`,
    "Identifico qué asunciones son seguras y cuáles conviene verificar.",
    "Comparo dos caminos posibles y elijo el de menor riesgo.",
    "Compruebo que la respuesta responde exactamente a lo pedido antes de cerrar.",
  ];
}

function sourcesFor(prompt: string): { title: string; url: string; snippet: string }[] {
  const kws = keywordsOf(prompt);
  const q = kws.slice(0, 2).join("+") || "arena+ia";
  return [
    {
      title: `Guía ${new Date().getFullYear()} sobre ${topicOf(prompt)}`,
      url: `https://es.wikipedia.org/wiki/Special:Search?search=${q}`,
      snippet: `Contexto general y referencias sobre ${topicOf(prompt)}.`,
    },
    {
      title: `Documentación oficial recomendada para ${kws[0] ?? "el tema"}`,
      url: `https://developer.mozilla.org/es/search?q=${q}`,
      snippet: "Referencia técnica con ejemplos verificados por la comunidad.",
    },
    {
      title: `Análisis comparativo: ${topicOf(prompt)}`,
      url: `https://arxiv.org/search/?query=${q}`,
      snippet: "Estudios recientes con datos cuantitativos del tema consultado.",
    },
  ];
}

async function handleBattle(init: RequestInit | undefined): Promise<Response> {
  const body = (() => {
    try {
      return JSON.parse(String(init?.body ?? "{}")) as JSON;
    } catch {
      return {};
    }
  })();

  const prompt = String(body.prompt ?? "").trim();
  const single = Boolean(body.single);
  const composerMode = String(body.composerMode ?? "texto");
  const historyA = Array.isArray(body.historyA) ? (body.historyA as unknown[]) : [];
  const historyB = Array.isArray(body.historyB) ? (body.historyB as unknown[]) : [];

  // v1.17.1 — el chat es de texto: un ID generativo enviado por el cliente
  // (o fijado antes de la corrección) cae al sorteo de modelos que conversan.
  const contendienteDe = (id: string): AIModel | null => {
    const m = getModel(id);
    return m && !esGenerativo(m) ? m : null;
  };
  let modelA: AIModel;
  let modelB: AIModel | null = null;
  if (single) {
    modelA = contendienteDe(String(body.modelAId ?? "")) ?? drawDuel()[0];
  } else if (body.modelAId && body.modelBId) {
    modelA = contendienteDe(String(body.modelAId)) ?? drawDuel()[0];
    modelB = contendienteDe(String(body.modelBId)) ?? drawDuel()[1];
  } else if (body.modelAId) {
    modelA = contendienteDe(String(body.modelAId)) ?? drawDuel()[0];
    modelB = drawDuel()[1];
    if (modelB.id === modelA.id) {
      const poolTexto = MODELS.filter((m) => !esGenerativo(m));
      modelB = poolTexto[(poolTexto.indexOf(modelA) + 7) % poolTexto.length];
    }
  } else {
    [modelA, modelB] = drawDuel();
  }

  await sleep(650 + Math.random() * 950 + Math.min(historyA.length * 120, 500));

  let aText: string;
  let bText: string | null = null;
  let sources: { title: string; url: string; snippet: string }[] | undefined;

  if (composerMode === "modelos3d") {
    const rec = recipe3D(prompt);
    aText = rec.text;
    bText = modelB ? composeAnswer(modelB.id, prompt) : null;
  } else if (composerMode === "codigo") {
    const { lang, code } = codeSnippet(prompt);
    aText = `Vamos con el código para ${topicOf(prompt)}, listo para copiar y pegar:\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\n**Notas rápidas**\n- Manejo de errores incluido: falla con mensajes claros, no en silencio.\n- Tipado estricto para que el editor trabaje a tu favor.\n- Adáptalo a tu estilo: el esqueleto es lo importante.`;
    if (modelB) {
      const alt = codeSnippet(prompt + " variante");
      bText = `Otra perspectiva, con un enfoque más directo:\n\n\`\`\`${alt.lang}\n${alt.code}\n\`\`\`\n\n**Cuándo usar cada uno**\n- Este: menos piezas, ideal para empezar hoy.\n- El otro: más cinturón de seguridad para producción.`;
    }
  } else if (composerMode === "video") {
    aText = videoScript(prompt);
    bText = modelB ? videoScript(prompt + " variante B") : null;
  } else if (composerMode === "juego") {
    aText = gameBlueprint(prompt, 0);
    bText = modelB ? gameBlueprint(prompt + " variante", 1) : null;
  } else {
    aText = composeAnswer(modelA.id, prompt);
    bText = modelB ? composeAnswer(modelB.id, prompt + "x") : null;
    if (composerMode === "profundo") {
      const thA = thinkingFor(modelA.id, prompt);
      const thB = modelB ? thinkingFor(modelB.id, prompt) : null;
      aText = thA.map((l) => `> ${l}`).join("\n") + "\n\n---\n\n" + composeAnswer(modelA.id, prompt, { shorter: true });
      if (modelB && thB) {
        bText = thB.map((l) => `> ${l}`).join("\n") + "\n\n---\n\n" + composeAnswer(modelB.id, prompt + "x", { shorter: true });
      }
    }
    if (composerMode === "web") {
      sources = sourcesFor(prompt);
      aText = `${aText}\n\nReferencias consultadas en vivo: [1] y [2].`;
      if (bText) bText = `${bText}\n\nMe apoyo en [1] y [3] para los datos concretos.`;
    }
  }

  return jsonRes({
    ok: true,
    aId: modelA.id,
    bId: modelB?.id ?? null,
    battleId: rid("btl"),
    a: aText,
    b: bText,
    sources,
    usedFallback: false,
  });
}

/* ─────────────── Voto (espejo de POST /api/vote) ─────────────── */

async function handleVote(init: RequestInit | undefined): Promise<Response> {
  const body = ((): JSON => {
    try {
      return JSON.parse(String(init?.body ?? "{}")) as JSON;
    } catch {
      return {};
    }
  })();
  const modelAId = String(body.modelAId ?? "");
  const modelBId = String(body.modelBId ?? "");
  const winner = String(body.winner ?? "") as Winner;
  if (!modelAId || !modelBId || !["A", "B", "tie", "bad"].includes(winner)) {
    return errRes("Faltan campos obligatorios.");
  }
  const A = getModel(modelAId);
  const B = getModel(modelBId);
  if (!A || !B) return errRes("Modelo desconocido.", 404);

  const battleId = String(body.battleId ?? "") || rid("btl");
  const category = String(body.category ?? "global");
  addVote({ battleId, modelAId, modelBId, winner, category });

  // v1.19.0 — ELO SEPARADO en la demo: los votos generativos mueven SU arena
  // (localStorage, espejo de EloArena); los de texto no tocan esa dimensión.
  const enArena = (CATEGORIAS_GENERATIVAS as readonly string[]).includes(category);
  if (enArena && winner !== "bad") {
    applyArenaDuelDemo(category, modelAId, modelBId, winner);
  }

  const tA = tallyFor(modelAId, enArena ? category : undefined);
  const tB = tallyFor(modelBId, enArena ? category : undefined);
  const deltaA = eloDeltaFromVotes(tA.wins, tA.losses, tA.ties);
  const deltaB = eloDeltaFromVotes(tB.wins, tB.losses, tB.ties);
  // En arena generativa el total visible es el ELO de la arena (ya aplicado);
  // en texto, ficha estática + delta, idéntico al servidor.
  let baseA = A.elo;
  let baseB = B.elo;
  if (enArena) {
    const mapa = getMapaArena(category);
    baseA = Math.round(mapa[modelAId]?.elo ?? ELO_BASE_ARENA) - deltaA;
    baseB = Math.round(mapa[modelBId]?.elo ?? ELO_BASE_ARENA) - deltaB;
  }
  const newA = baseA + deltaA;
  const newB = baseB + deltaB;

  let swing = 0;
  if (winner === "A" || winner === "B") {
    const exp = expectedScore(newA, newB);
    swing = Math.round(24 * ((winner === "A" ? 1 : 0) - exp));
  }

  await sleep(120);
  return jsonRes({
    ok: true,
    battleId,
    elo: {
      [modelAId]: { base: baseA, delta: deltaA, total: newA },
      [modelBId]: { base: baseB, delta: deltaB, total: newB },
    },
    swing,
    message:
      winner === "tie"
        ? "Empate registrado. El ELO se mantiene estable."
        : winner === "bad"
          ? "Feedback registrado: ambos modelos perderán visibilidad."
          : "Voto registrado. El ELO del arena se ha actualizado.",
  });
}

/* ─────────────── Ranking (espejo de GET /api/leaderboard) ─────────────── */

function handleLeaderboard(path: string): Response {
  const category = new URLSearchParams(path.split("?")[1] ?? "").get("category") ?? "global";
  // v1.17.1 — espejo exacto de /api/leaderboard: las arenas generativas solo
  // listan sus modelos; las de texto (General, Código,…) excluyen los
  // generativos — GPT-Image-2.5 Sunburst ya no aparece en la General.
  // v1.19.0 — ELO separado: en generativas el rating es el de la arena
  // (espejo local de EloArena) y el recuento solo mira votos de ESA modalidad.
  const soloGenerativos = (CATEGORIAS_GENERATIVAS as readonly string[]).includes(category);
  const pool = soloGenerativos
    ? MODELS.filter((m) => m.categories.includes(category as never))
    : MODELS.filter((m) => !esGenerativo(m));
  const mapaArena = soloGenerativos ? getMapaArena(category) : {};
  const rows: LeaderRow[] = pool.map((m) => {
    const t = tallyFor(m.id, soloGenerativos ? category : undefined);
    const delta = eloDeltaFromVotes(t.wins, t.losses, t.ties);
    const decided = t.wins + t.losses;
    const filaArena = soloGenerativos ? mapaArena[m.id] : undefined;
    return {
      id: m.id,
      name: m.name,
      provider: m.provider,
      providerName: PROVIDERS[m.provider]?.name ?? m.provider,
      license: m.license,
      elo: filaArena ? Math.round(filaArena.elo) : categoryElo(m, category) + delta,
      delta,
      ci: 2 + ((m.elo + m.id.length * 7) % 4),
      votes: t.wins + t.losses + t.ties + t.bads,
      winRate: decided > 0 ? Math.round((t.wins / decided) * 100) : 50,
      context: m.context,
      priceOut: m.priceOut,
      speed: m.speed,
      isNew: Boolean(m.isNew),
      categories: m.categories as string[],
      eloArena: filaArena ? Math.round(filaArena.elo) : null,
      eloArenaBattles: filaArena?.battles ?? 0,
    };
  });
  rows.sort((a, b) => b.elo - a.elo);
  rows.forEach((r, i) => (r.rank = i + 1));
  return jsonRes({
    category,
    total: rows.length,
    rows,
    syncedAt: new Date().toISOString(),
  });
}

/* ─────────────── Imagen (espejo de POST /api/image) ─────────────── */

function svgArt(prompt: string, size: string): string {
  const [w, h] = (size === "1024x1024" ? [1024, 1024] : size === "768x1344" ? [768, 1344] : size === "864x1152" ? [864, 1152] : size === "1344x768" ? [1344, 768] : size === "1152x864" ? [1152, 864] : size === "1440x720" ? [1440, 720] : [720, 1440]) as number[];
  const h0 = hashStr(prompt);
  let seed = h0 || 1;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const hue = h0 % 360;
  const hue2 = (hue + 40 + Math.floor(rnd() * 80)) % 360;
  let shapes = "";
  for (let i = 0; i < 7; i++) {
    const cx = Math.round(rnd() * w);
    const cy = Math.round(rnd() * h);
    const r = Math.round((0.12 + rnd() * 0.38) * Math.min(w, h));
    const oh = (hue + i * 37 + Math.floor(rnd() * 30)) % 360;
    const op = (0.18 + rnd() * 0.4).toFixed(2);
    shapes += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="hsl(${oh} 70% ${(46 + rnd() * 22).toFixed(0)}%)" opacity="${op}"/>`;
  }
  for (let i = 0; i < 2; i++) {
    const cx = Math.round(rnd() * w);
    const cy = Math.round(rnd() * h);
    const r = Math.round((0.2 + rnd() * 0.3) * Math.min(w, h));
    shapes += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="hsl(${(hue2 + i * 60) % 360} 85% 60%)" stroke-width="${3 + Math.floor(rnd() * 5)}" opacity="0.55"/>`;
  }
  let dots = "";
  for (let i = 0; i < 46; i++) {
    dots += `<circle cx="${Math.round(rnd() * w)}" cy="${Math.round(rnd() * h)}" r="${(1 + rnd() * 3.4).toFixed(1)}" fill="#FFFFFF" opacity="${(0.25 + rnd() * 0.6).toFixed(2)}"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 62% 22%)"/><stop offset="0.55" stop-color="hsl(${hue2} 58% 38%)"/><stop offset="1" stop-color="hsl(${(hue + 300) % 360} 52% 16%)"/></linearGradient><filter id="b" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${Math.round(Math.min(w, h) * 0.055)}"/></filter><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.06"/></feComponentTransfer><feComposite operator="over" in2="SourceGraphic"/></filter></defs><rect width="${w}" height="${h}" fill="url(#g)"/><g filter="url(#b)">${shapes}</g>${dots}<rect width="${w}" height="${h}" filter="url(#n)" fill="none"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

async function handleImage(init: RequestInit | undefined): Promise<Response> {
  const body = ((): JSON => {
    try {
      return JSON.parse(String(init?.body ?? "{}")) as JSON;
    } catch {
      return {};
    }
  })();
  const prompt = String(body.prompt ?? "").trim();
  if (prompt.length < 3) return errRes("Describe qué imagen quieres (mínimo 3 caracteres).");
  const size = String(body.size ?? "1024x1024");
  await sleep(900 + Math.random() * 900);
  return jsonRes({ ok: true, url: svgArt(prompt, size), prompt, size });
}

/* ───────── Arena de imagen (espejo de POST /api/image-battle, v1.19.0) ───────── */

async function handleImageBattle(init: RequestInit | undefined): Promise<Response> {
  const body = ((): JSON => {
    try {
      return JSON.parse(String(init?.body ?? "{}")) as JSON;
    } catch {
      return {};
    }
  })();
  const prompt = String(body.prompt ?? "").trim();
  if (prompt.length < 4) {
    return errRes("Describe la escena que competirán los dos generadores (mínimo 4 caracteres).");
  }
  const size = String(body.size ?? "1024x1024");
  const [modeloA, modeloB] = sortearDuoImagen();
  await sleep(1100 + Math.random() * 900);
  // En la demo cada generador produce arte SVG con su sello: la semilla
  // incluye el ID del modelo, así que los dos cuadros nunca salen gemelos.
  return jsonRes({
    ok: true,
    battleId: rid("bti"),
    prompt,
    size,
    aId: modeloA.id,
    bId: modeloB.id,
    aUrl: svgArt(`${prompt} ${selloDe(modeloA.id)} #${modeloA.id}`, size),
    bUrl: svgArt(`${prompt} ${selloDe(modeloB.id)} #${modeloB.id}`, size),
  });
}

/* ───────── Muro de replays (espejo de GET/PATCH /api/share, v1.19.0) ───────── */

const K_MURO = "todologo_demo_muro_v1";

interface ContadoresMuro {
  shares: number;
  views: number;
}

function contadoresMuro(id: string, base: ContadoresMuro): ContadoresMuro {
  const mapa = lsGet<Record<string, ContadoresMuro>>(K_MURO, {});
  return mapa[id] ?? base;
}

function sumarMuro(id: string, base: ContadoresMuro, campo: "shares" | "views"): ContadoresMuro {
  const mapa = lsGet<Record<string, ContadoresMuro>>(K_MURO, {});
  const previo = mapa[id] ?? base;
  const nuevo = { ...previo, [campo]: previo[campo] + 1 };
  mapa[id] = nuevo;
  lsSet(K_MURO, mapa);
  return nuevo;
}

function handleMuroLista(): Response {
  const tarjetas: TarjetaMuro[] = REPLAYS_CURADOS.map((c) => {
    const t = tarjetaDeCurado(c);
    const cont = contadoresMuro(c.id, { shares: t.shares, views: t.views });
    return { ...t, shares: cont.shares, views: cont.views };
  });
  tarjetas.sort((a, b) => b.shares - a.shares || b.views - a.views);
  return jsonRes({
    ok: true,
    replays: tarjetas.slice(0, 24),
    stats: {
      totalCompartidos: tarjetas.reduce((s, t) => s + t.shares, 0),
      totalVistas: tarjetas.reduce((s, t) => s + t.views, 0),
      total: tarjetas.length,
    },
  });
}

function handleMuroDetalle(id: string): Response {
  const c = curadoPorId(id);
  if (!c) return errRes("Replay no encontrado.", 404);
  if (c.tipo === "copa") {
    return jsonRes({ ok: true, tipo: "copa", id: c.id, prompt: c.prompt, copa: c.copa, createdAt: c.createdAt });
  }
  return jsonRes({
    ok: true,
    tipo: "duelo",
    id: c.id,
    prompt: c.prompt,
    category: c.category,
    composerMode: c.composerMode,
    modelAId: c.modelAId,
    modelBId: c.modelBId,
    textoA: c.textoA,
    textoB: c.textoB,
    ganador: c.ganador,
    createdAt: c.createdAt,
  });
}

function handleMuroContadores(id: string, init: RequestInit | undefined): Response {
  const body = ((): JSON => {
    try {
      return JSON.parse(String(init?.body ?? "{}")) as JSON;
    } catch {
      return {};
    }
  })();
  const accion = String(body.accion ?? "");
  if (accion !== "vista" && accion !== "compartir") {
    return errRes("Acción inválida.");
  }
  const c = curadoPorId(id);
  if (!c) return errRes("Replay no encontrado.", 404);
  const cont = sumarMuro(id, { shares: c.shares, views: c.views }, accion === "vista" ? "views" : "shares");
  return jsonRes({ ok: true, shares: cont.shares, views: cont.views });
}

/* ───────── Actividad en vivo (espejo de GET /api/actividad, v1.19.0) ───────── */

function handleActividad(): Response {
  // La demo prioriza los votos locales; sin ellos, el ticker no se queda
  // mudo: tres duelos sintéticos del catálogo (ficcia demo, como todo aquí).
  const votos = getVotes().slice(-8).reverse();
  const base = votos
    .map((v) => {
      const A = getModel(v.modelAId);
      const B = getModel(v.modelBId);
      if (!A || !B) return null;
      return {
        categoria: v.category,
        ganador: v.winner === "A" ? A.id : v.winner === "B" ? B.id : null,
        perdedor: v.winner === "A" ? B.id : v.winner === "B" ? A.id : null,
        empate: v.winner === "tie",
        nombreA: A.name,
        nombreB: B.name,
        at: new Date(Date.now() - Math.floor(Math.random() * 5 + 1) * 60_000).toISOString(),
      };
    })
    .filter(Boolean);
  if ((base as unknown[]).length > 0) {
    return jsonRes({ ok: true, eventos: base, total: getVotes().length + 2 });
  }
  const texto = MODELS.filter((m) => !esGenerativo(m));
  const semilla = Math.floor(Date.now() / 60_000);
  const eventosSinteticos = [0, 1, 2].map((i) => {
    const a = texto[(semilla * 7 + i * 13) % texto.length];
    let b = texto[(semilla * 11 + i * 17 + 5) % texto.length];
    if (b.id === a.id) b = texto[(semilla + i + 9) % texto.length];
    return {
      categoria: ["global", "codigo", "escritura"][i % 3],
      ganador: i === 1 ? null : a.id,
      perdedor: i === 1 ? null : b.id,
      empate: i === 1,
      nombreA: a.name,
      nombreB: b.name,
      at: new Date(Date.now() - (i + 1) * 3 * 60_000).toISOString(),
    };
  });
  return jsonRes({ ok: true, eventos: eventosSinteticos, total: getVotes().length + 2 });
}

/* ─────────────── Agente (espejo de POST /api/agent) ─────────────── */

const PROJECT_TYPES: Record<string, string> = {
  "juego-aaa": "videojuego AAA",
  "app-web": "aplicación web interactiva",
  "app-movil": "aplicación móvil",
  saas: "plataforma SaaS",
  escritorio: "aplicación de escritorio",
  api: "API / microservicios",
  extension: "extensión",
  "data-ml": "pipeline de datos / ML",
};

async function handleAgent(init: RequestInit | undefined): Promise<Response> {
  const body = ((): JSON => {
    try {
      return JSON.parse(String(init?.body ?? "{}")) as JSON;
    } catch {
      return {};
    }
  })();
  const desc = String(body.description ?? "").trim();
  if (desc.length < 2) return errRes("Describe la misión para que el enjambre la planifique.");
  const type = PROJECT_TYPES[String(body.projectType ?? "")] ?? "proyecto de software";
  const autonomy = String(body.autonomy ?? "L2");
  const budget = String(body.budget ?? "standard");
  const lead = budget === "saturn" ? "GPT-6 Astra" : budget === "intensivo" ? "Claude Opus 5" : "GLM-5.3";
  const topic = topicOf(desc);

  await sleep(1000 + Math.random() * 1200);

  return jsonRes({
    ok: true,
    generated: true,
    plan: {
      mission: `Entregar ${type} funcional: «${desc.slice(0, 120)}»`,
      summary: `El enjambre del Modo Agente analizará el objetivo (${topic}), diseñará la arquitectura y ejecutará un pipeline completo con nivel de autonomía ${autonomy}. Cada fase incluye verificación automática antes de avanzar; los fallos se corrigen en bucle sin intervención humana.`,
      team: [
        { role: "Orquestador", model: lead, task: "Planificar, delegar y verificar cada fase" },
        { role: "Arquitecto", model: "o5-pro", task: "Diseño de sistema, decisiones técnicas y ADRs" },
        { role: "Desarrollador principal", model: "glm-5-coder", task: "Implementación del núcleo y tests unitarios" },
        { role: "Frontend/UX", model: "fable-5.1", task: "Interfaz, copywriting y experiencia de usuario" },
        { role: "QA & Seguridad", model: "kimi-swarm", task: "Pruebas automatizadas, fuzzing y auditoría" },
        { role: "DevOps", model: "devstral-2", task: "CI/CD, despliegue y observabilidad" },
      ],
      phases: [
        {
          name: "Análisis y requisitos",
          duration: "6 min",
          steps: [
            "Descomposición del objetivo en requisitos medibles",
            "Identificación de riesgos y dependencias críticas",
            "Especificación técnica viva",
          ],
        },
        {
          name: "Arquitectura",
          duration: "10 min",
          steps: [
            "Selección de stack y patrones (con alternativas descartadas)",
            "Diagrama de componentes y contratos de API",
            "Plan de datos, caché y escalado",
          ],
        },
        {
          name: "Construcción del núcleo",
          duration: "45 min",
          steps: [
            "Scaffold del proyecto y tooling (lint, tests, CI)",
            "Implementación de módulos críticos en paralelo por sub-agentes",
            "Integración continua con verificación automática",
          ],
        },
        {
          name: "Interfaz y experiencia",
          duration: "25 min",
          steps: [
            "Sistema de diseño y componentes accesibles",
            "Estados de carga, error y vacío cuidados",
            "Pruebas de usabilidad automatizadas",
          ],
        },
        {
          name: "Verificación y despliegue",
          duration: "18 min",
          steps: [
            "Suite E2E sobre los flujos críticos",
            "Auditoría de seguridad y rendimiento",
            "Despliegue con rollback automático",
          ],
        },
      ],
      stack: [
        { layer: "Frontend", choice: "Next.js + TypeScript + Tailwind" },
        { layer: "Backend", choice: "API routes + Prisma + SQLite/PostgreSQL" },
        { layer: "Infra", choice: "Contenedor + CI/CD con preview por PR" },
        { layer: "Calidad", choice: "Vitest + Playwright + ESLint estricto" },
      ],
      deliverables: [
        `${type} funcionando de extremo a extremo`,
        "Repositorio con tests verdes y pipeline activo",
        "Documentación de arquitectura y decisiones",
      ],
      risks: [
        { risk: "Ambigüedad en los requisitos iniciales", mitigation: "Especificación validada antes de construir" },
        { risk: "Crecimiento de alcance durante la ejecución", mitigation: "Congelar alcance por fase; extras al backlog" },
        { risk: "Deuda técnica en integraciones externas", mitigation: "Adaptadores aislados y tests de contrato" },
      ],
      successCriteria: [
        "Todos los flujos críticos pasan E2E",
        "Tiempo de respuesta percibido < 200 ms en interacciones clave",
        "Cero errores críticos en auditoría de seguridad",
      ],
      totalEstimate: budget === "saturn" ? "~2 h de cómputo paralelo" : budget === "intensivo" ? "~50 min con sub-agentes" : "~30 min",
    },
  });
}

/* ─────────────── Copa Todólogo (espejo de POST /api/tournament) ─────────────── */

interface CopaContender {
  modelId: string;
  label: string;
  text: string;
}
interface CopaDuel {
  key: "semi1" | "semi2" | "final";
  a: CopaContender;
  b: CopaContender;
  winner?: "a" | "b";
  swing?: number;
}
interface Copa {
  id: string;
  prompt: string;
  createdAt: number;
  semi1: CopaDuel;
  semi2: CopaDuel;
  final?: CopaDuel;
  championModelId?: string;
  revealed: boolean;
}

const copaStore = new Map<string, Copa>();

function pickFour(): string[] {
  // v1.17.1 — la copa es de texto: los generativos no entran al bracket.
  const sorted = [...MODELS.filter((m) => !esGenerativo(m))].sort((a, b) => b.elo - a.elo);
  const pool = sorted.slice(0, Math.ceil(sorted.length * 0.7));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 4).map((m) => m.id);
}

function contenderText(modelId: string, prompt: string): string {
  return composeAnswer(modelId, prompt, { shorter: true });
}

async function generateSemis(copa: Copa) {
  await sleep(700);
  copa.semi1.a.text = contenderText(copa.semi1.a.modelId, copa.prompt);
  copa.semi1.b.text = contenderText(copa.semi1.b.modelId, copa.prompt);
  await sleep(500);
  copa.semi2.a.text = contenderText(copa.semi2.a.modelId, copa.prompt);
  copa.semi2.b.text = contenderText(copa.semi2.b.modelId, copa.prompt);
}

function recordDuel(duel: CopaDuel, winner: "a" | "b"): number {
  const A = getModel(duel.a.modelId);
  const B = getModel(duel.b.modelId);
  if (!A || !B) return 0;
  addVote({
    battleId: `copa_${duel.key}`,
    modelAId: duel.a.modelId,
    modelBId: duel.b.modelId,
    winner: winner === "a" ? "A" : "B",
    category: "global",
  });
  const exp = expectedScore(A.elo, B.elo);
  return Math.round(24 * ((winner === "a" ? 1 : 0) - exp));
}

function publicContender(copa: Copa, c: CopaContender) {
  if (!copa.revealed) return { label: c.label, text: c.text };
  const m = getModel(c.modelId);
  return {
    label: c.label,
    text: c.text,
    model: m
      ? { id: m.id, name: m.name, provider: m.provider, elo: m.elo }
      : { id: c.modelId, name: c.modelId, provider: "", elo: 0 },
  };
}

function publicDuel(copa: Copa, d?: CopaDuel) {
  if (!d) return undefined;
  return {
    key: d.key,
    a: publicContender(copa, d.a),
    b: publicContender(copa, d.b),
    winner: d.winner,
    swing: d.swing,
  };
}

function publicState(copa: Copa) {
  const bothSemisDone = Boolean(copa.semi1.winner && copa.semi2.winner);
  const finalReady = Boolean(copa.final && copa.final.a.text);
  return {
    id: copa.id,
    prompt: copa.prompt,
    revealed: copa.revealed,
    phase: copa.revealed
      ? ("campeon" as const)
      : finalReady
        ? ("final" as const)
        : bothSemisDone
          ? ("final-cargando" as const)
          : ("semis" as const),
    champion:
      copa.revealed && copa.championModelId
        ? publicContender(copa, { modelId: copa.championModelId, label: "CAMPEÓN", text: "" }).model
        : null,
    semi1: publicDuel(copa, copa.semi1),
    semi2: publicDuel(copa, copa.semi2),
    final: publicDuel(copa, copa.final),
  };
}

async function handleTournament(init: RequestInit | undefined): Promise<Response> {
  const body = ((): JSON => {
    try {
      return JSON.parse(String(init?.body ?? "{}")) as JSON;
    } catch {
      return {};
    }
  })();
  const action = String(body.action ?? "");

  if (action === "start") {
    const prompt = String(body.prompt ?? "").trim();
    if (prompt.length < 2) return errRes("Escribe la consigna de la copa para sortear a los contendientes.");
    const [p1, p2, p3, p4] = pickFour();
    const copa: Copa = {
      id: rid("copa"),
      prompt,
      createdAt: Date.now(),
      semi1: { key: "semi1", a: { modelId: p1, label: "A1", text: "" }, b: { modelId: p2, label: "A2", text: "" } },
      semi2: { key: "semi2", a: { modelId: p3, label: "B1", text: "" }, b: { modelId: p4, label: "B2", text: "" } },
      revealed: false,
    };
    copaStore.set(copa.id, copa);
    await generateSemis(copa);
    return jsonRes({ ok: true, copa: publicState(copa) });
  }

  if (action === "vote") {
    const duelKey = String(body.duel ?? "");
    const winner = String(body.winner ?? "");
    const copa = copaStore.get(String(body.id ?? ""));
    if (!copa) return errRes("La copa ha expirado. Inicia una nueva desde el Modo Torneo.", 404);
    if (!["a", "b"].includes(winner)) return errRes("Faltan campos del voto (id, duel, winner).");
    const duel = duelKey === "semi1" ? copa.semi1 : duelKey === "semi2" ? copa.semi2 : copa.final;
    if (!duel || !duel.a.text) return errRes("Ese duelo todavía no está disponible.", 409);

    if (!duel.winner) {
      duel.winner = winner as "a" | "b";
      duel.swing = recordDuel(duel, duel.winner);

      if (duelKey !== "final" && copa.semi1.winner && copa.semi2.winner && !copa.final) {
        const w1 = copa.semi1.winner === "a" ? copa.semi1.a : copa.semi1.b;
        const w2 = copa.semi2.winner === "a" ? copa.semi2.a : copa.semi2.b;
        const finalDuel: CopaDuel = {
          key: "final",
          a: { modelId: w1.modelId, label: "F1", text: "" },
          b: { modelId: w2.modelId, label: "F2", text: "" },
        };
        copa.final = finalDuel;
        await sleep(800);
        finalDuel.a.text = contenderText(finalDuel.a.modelId, copa.prompt);
        finalDuel.b.text = contenderText(finalDuel.b.modelId, copa.prompt);
      }

      if (duelKey === "final" && copa.final) {
        copa.revealed = true;
        copa.championModelId = winner === "a" ? copa.final.a.modelId : copa.final.b.modelId;
        // Salón de la Fama (v1.12.0): el campeón queda en tu navegador
        try {
          const sub = winner === "a" ? copa.final.b : copa.final.a;
          const lista = lsGet<CampeonSalon[]>(K_SALON, []);
          lista.unshift({
            copaId: copa.id,
            prompt: copa.prompt.slice(0, 300),
            size: 4,
            campeon: {
              id: copa.championModelId,
              name: getModel(copa.championModelId)?.name ?? copa.championModelId,
            },
            subcampeon: { id: sub.modelId, name: getModel(sub.modelId)?.name ?? sub.modelId },
            at: new Date().toISOString(),
          });
          lsSet(K_SALON, lista.slice(0, 40));
        } catch {
          /* el salón es accesorio en la demo */
        }
      }
    }
    await sleep(150);
    return jsonRes({ ok: true, copa: publicState(copa) });
  }

  return errRes("Acción desconocida.");
}

/* ─────────────── Duelo del día (espejo de GET/POST /api/dia) ─────────────── */

interface DiaRegistro {
  fecha: string;
  aId: string;
  bId: string;
  prompt: string;
  textoA: string;
  textoB: string;
}

let diaCache: DiaRegistro | null = null;

/** Espejo del duelo del día: misma pareja y consigna deterministas que
 *  dueloDeDia(), textos locales (composeAnswer) y consenso simulado con
 *  vida propia — la demo nunca se queda sin duelo de hoy. */
function construirDia(): DiaRegistro {
  const fecha = fechaDeDuelo();
  const { modelAId, modelBId, prompt } = dueloDeDia(fecha);
  return {
    fecha,
    aId: modelAId,
    bId: modelBId,
    prompt,
    textoA: composeAnswer(modelAId, prompt, { shorter: true }),
    textoB: composeAnswer(modelBId, prompt, { shorter: true }),
  };
}

function consensoDiaDemo(fecha: string): { A: number; B: number; tie: number; total: number } {
  // Votos reales de hoy en localStorage + un grada simulada determinista
  const reales = getVotes().filter((v) => v.battleId.startsWith(`dia-${fecha}`));
  const A = reales.filter((v) => v.winner === "A").length;
  const B = reales.filter((v) => v.winner === "B").length;
  const tie = reales.filter((v) => v.winner === "tie").length;
  const h = (fecha.split("-").reduce((a, p) => a + Number(p || 0), 0) % 60) + 40;
  const sA = A + h;
  const sB = B + Math.floor(h * 0.7);
  const sTie = tie + Math.floor(h * 0.15);
  return { A: sA, B: sB, tie: sTie, total: sA + sB + sTie };
}

async function handleDia(init: RequestInit | undefined, method: string): Promise<Response> {
  if (!diaCache) diaCache = construirDia();
  if (diaCache.fecha !== fechaHoyDemo()) diaCache = construirDia();

  if (method === "GET") {
    return jsonRes({
      ok: true,
      fecha: diaCache.fecha,
      battleId: `dia-${diaCache.fecha}`,
      prompt: diaCache.prompt,
      a: { text: diaCache.textoA },
      b: { text: diaCache.textoB },
      anonimos: true,
    });
  }

  const body = ((): JSON => {
    try {
      return JSON.parse(String(init?.body ?? "{}")) as JSON;
    } catch {
      return {};
    }
  })();
  const winner = String(body.winner ?? "") as Winner;
  if (!["A", "B", "tie", "bad"].includes(winner)) {
    return errRes("Voto inválido (A | B | tie | bad).");
  }
  addVote({ battleId: `dia-${diaCache.fecha}-${rid("v")}`, modelAId: diaCache.aId, modelBId: diaCache.bId, winner, category: "global" });
  const consenso = consensoDiaDemo(diaCache.fecha);
  const A = getModel(diaCache.aId);
  const B = getModel(diaCache.bId);
  return jsonRes({
    ok: true,
    fecha: diaCache.fecha,
    consenso,
    revelacion: {
      a: { id: diaCache.aId, name: A?.name ?? diaCache.aId, provider: A?.provider ?? "", elo: A?.elo ?? 1000 },
      b: { id: diaCache.bId, name: B?.name ?? diaCache.bId, provider: B?.provider ?? "", elo: B?.elo ?? 1000 },
    },
    // usuarioElo null → el cliente aplica la regla local (jurado-client)
    usuarioElo: null,
  });
}

function fechaHoyDemo(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ───────────────────────── Enrutador ───────────────────────── */

export async function handleDemoFetch(rawPath: string, init?: RequestInit): Promise<Response | null> {
  const path = rawPath.split("?")[0];
  const method = (init?.method ?? "GET").toUpperCase();

  try {
    if (path === "/api/auth/oauth/status") {
      return jsonRes({ google: false, github: false });
    }
    if (path.startsWith("/api/auth/")) {
      return (await handleAuth(path, init)) ?? errRes("Endpoint de autenticación desconocido.", 404);
    }
    if (path === "/api/dia") return await handleDia(init, method);
    if (path === "/api/battle" && method === "POST") return await handleBattle(init);
    if (path === "/api/vote" && method === "POST") return await handleVote(init);
    if (path === "/api/leaderboard") return handleLeaderboard(rawPath);
    if (path === "/api/image" && method === "POST") return await handleImage(init);
    if (path === "/api/image-battle" && method === "POST") return await handleImageBattle(init);
    if (path === "/api/agent" && method === "POST") return await handleAgent(init);
    if (path === "/api/tournament" && method === "POST") return await handleTournament(init);
    // v1.19.0 — muro de replays + actividad en vivo (espejos exactos)
    if (path === "/api/share" && method === "GET") return handleMuroLista();
    if (path === "/api/actividad") return handleActividad();
    if (path.startsWith("/api/share/")) {
      const id = path.slice("/api/share/".length);
      if (method === "PATCH") return handleMuroContadores(id, init);
      if (method === "GET") return handleMuroDetalle(id);
    }
    if (path === "/api/hall-of-fame") {
      const lista = lsGet<CampeonSalon[]>(K_SALON, []);
      return jsonRes({
        ok: true,
        total: lista.length,
        campeones: lista.slice(0, 12),
        stats: estadisticasSalon(lista), // v1.13.0: mismas estadísticas que producción
      });
    }
    if (path === "/api/profile/historial") {
      // En la demo el perfil vive en tu navegador: historial en la nube no aplica
      return jsonRes({ ok: true, eventos: [] });
    }
    if (path === "/api/news") {
      return jsonRes({ ok: true, articles: [], cached: true, note: "demo" });
    }
    if (path === "/api/stats") {
      return jsonRes({ ok: true, totalVotes: getVotes().length + 2, models: MODELS.length, providers: Object.keys(PROVIDERS).length });
    }
    if (path === "/api/health") {
      return jsonRes({
        ok: true,
        service: "todologo-ai",
        mode: "static-demo",
        checks: { database: "localstorage", votes: getVotes().length },
        catalog: { models: MODELS.length, providers: Object.keys(PROVIDERS).length },
        timestamp: new Date().toISOString(),
      });
    }
  } catch {
    return errRes("El motor demo encontró un error inesperado.", 500);
  }
  return null;
}
