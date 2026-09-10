import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { MODELS, getModel, esGenerativo } from "@/lib/models-data";
import { db } from "@/lib/db";
import { expectedScore } from "@/lib/elo";
import { applyEloDuel } from "@/lib/elo-global";
import { personaFor } from "@/lib/personas";
import { chatExterno, vozExternaPara } from "@/lib/voices-externas";
import { esGranFinal, totalRondas, TAMANOS, COPA_SIZES, sortearIds, type CopaSize } from "@/lib/copa-utils";
import { procesarJurado } from "@/lib/jurado-servidor";
import { serializarCopa, deserializarCopa } from "@/lib/copas-persistir";
import { ipDeHeader, acumular, GEN_LIMITE, VOTO_LIMITE, segundosRestantes } from "@/lib/rate-limit";
import { CARTA_VERDAD } from "@/lib/ai-conducta";
import { conReintentos, autocorreccion } from "@/lib/reintentos";

export const maxDuration = 60;

/* ───────────────────────── Tipos ───────────────────────── */

export interface CopaContender {
  modelId: string;
  label: string; // "O1"…"O8" | "C1"…"C4" | "S1" | "S2" | "F1" | "F2"
  text: string;
}

export interface CopaDuel {
  key: string; // "r0d0", "r1d2", …
  a: CopaContender;
  b: CopaContender;
  winner?: "a" | "b";
  swing?: number;
}

export interface Copa {
  id: string;
  prompt: string;
  createdAt: number;
  size: CopaSize;
  roundNames: string[];
  labelNames: string[]; // prefijo por ronda: ["O","C","S","F"]
  rounds: CopaDuel[][];
  championModelId?: string;
  revealed: boolean;
}

interface TournamentRequest {
  action?: "start" | "vote";
  prompt?: string;
  size?: number;
  id?: string;
  duel?: string;
  winner?: "a" | "b";
}

/* ───────── Sesiones: memoria + BD (v1.13.0, write-through) ───────── */

const store: Map<string, Copa> = ((globalThis as unknown as {
  __todologoCopas?: Map<string, Copa>;
}).__todologoCopas ??= new Map());

/** Memoria con limpieza por tamaño: conserva las 160 copas más recientes. */
function persistEnMemoria(copa: Copa) {
  store.set(copa.id, copa);
  if (store.size > 160) {
    const oldest = [...store.values()].sort((x, y) => x.createdAt - y.createdAt);
    for (const old of oldest.slice(0, store.size - 160)) store.delete(old.id);
  }
}

/**
 * Write-through (v1.13.0): memoria + tabla CopaSesion. Hasta la v1.12.0 un
 * reinicio o una instancia serverless distinta perdía el cuadro en curso;
 * ahora cada mutación queda registrada en BD y la copa sobrevive. Si la BD
 * no responde, la copa continúa en memoria como hasta ahora.
 */
async function persist(copa: Copa): Promise<void> {
  persistEnMemoria(copa);
  try {
    await db.copaSesion.upsert({
      where: { id: copa.id },
      create: { id: copa.id, size: copa.size, datos: serializarCopa(copa) },
      update: { size: copa.size, datos: serializarCopa(copa) },
    });
  } catch {
    /* la copa continúa aunque la BD no responda */
  }
}

/**
 * Read-through (v1.13.0): si la copa no está en la memoria de esta
 * instancia (reinicio, LRU, servidor distinto), se reconstruye desde la
 * BD. Un payload corrupto devuelve null y responde 404: nunca se revive
 * basura en memoria.
 */
async function cargarCopa(id: string): Promise<Copa | null> {
  const enMemoria = store.get(id);
  if (enMemoria) return enMemoria;
  try {
    const fila = await db.copaSesion.findUnique({ where: { id } });
    if (!fila) return null;
    const copa = deserializarCopa(fila.datos);
    if (copa) persistEnMemoria(copa);
    return copa;
  } catch {
    return null;
  }
}

/* ───────────────────────── Sorteo ───────────────────────── */

/**
 * Sortea N contendientes del tramo alto del ranking (v1.17.1: la copa es de
 * texto). v1.20.0 delega en sortearIds(): el pool se expande al catálogo
 * completo cuando el cuadro lo exige (una copa de 64 no cabe en el 70 % de
 * 58 modelos de texto) y reduce a potencia de 2 si el catálogo no llega.
 */
function pickN(n: number): string[] {
  const semillas = MODELS.filter((m) => !esGenerativo(m)).map((m) => ({ id: m.id, elo: m.elo }));
  return sortearIds(n, semillas);
}

/* ─────────────────── Generación de respuestas ─────────────────── */

function fallbackResponse(label: string, prompt: string): string {
  return `**${label}** (respuesta de reserva — el proveedor no respondió a tiempo)\n\nHe recibido la consigna: _"${prompt.slice(0, 120)}${prompt.length > 120 ? "…" : ""}"_. La copa continúa: vota con normalidad para no sesgar el ELO.`;
}

async function genContender(
  zai: Awaited<ReturnType<typeof ZAI.create>>,
  modelId: string,
  label: string,
  prompt: string,
  temperature: number
): Promise<string> {
  const model = getModel(modelId);
  const name = model?.name ?? "Contendiente";
  const sys = `${CARTA_VERDAD}\n\nEres "${name}", un contendiente anónimo de la Copa Todólogo, el torneo de eliminación directa del arena de IA todólogo.ai. ${personaFor(
    modelId
  )} Responde SIEMPRE en español (salvo código/comandos), con un máximo de 200 palabras (el código no cuenta en el límite). Nunca reveles tu nombre ni el de tu proveedor: eres un contendiente anónimo hasta la revelación final y tu estilo debe hablar por ti.`;

  const t0 = Date.now();

  const attempt = async (timeoutMs: number, n: number): Promise<string | null> => {
    // v1.19.1 — escalera de autocorrección: los reintentos no repiten el
    // mismo error a ciegas (menos temperature, sin thinking, prompt acotado).
    const aj = autocorreccion(n);
    const promptAjustado =
      aj.recortePrompt && prompt.length > aj.recortePrompt ? prompt.slice(0, aj.recortePrompt) : prompt;
    const temp = Math.max(0.2, temperature * aj.factorTemperatura);
    // v1.12.0 — voz de proveedor real si hay clave API configurada
    const voz = model ? vozExternaPara(model.provider) : null;
    if (voz && aj.thinking && n <= 2) {
      const r = await chatExterno(
        voz,
        [
          { role: "assistant", content: sys },
          { role: "user", content: promptAjustado },
        ],
        temp,
        timeoutMs
      );
      if (r) return r.text;
    }
    try {
      const completion = await Promise.race([
        zai.chat.completions.create({
          messages: [
            { role: "assistant", content: sys },
            { role: "user", content: promptAjustado },
          ] as never,
          temperature: temp,
          thinking: { type: aj.thinking ? "enabled" : "disabled" },
        }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
      ]);
      const choice =
        completion && "choices" in completion ? completion.choices?.[0] : undefined;
      const content =
        typeof (choice?.message as { content?: unknown } | undefined)?.content === "string"
          ? ((choice?.message as { content: string }).content).trim()
          : null;
      return content && content.length > 0 ? content : null;
    } catch {
      return null;
    }
  };

  // v1.19.1 — motor de reintentos: HASTA 50 INTENTOS con autocorrección y
  // presupuesto de reloj (52 s). Un contendiente nunca se queda mudo por un
  // upstream caído: se regenera hasta lograr texto o hasta que la ventana
  // serverless se agota (entonces responde la reserva honesta).
  const texto = await conReintentos<string>(`copa-${label}`, async (n) => {
    const restante = 52_000 - (Date.now() - t0);
    if (restante < 8_000) return undefined; // presupuesto agotado → salir
    const timeoutMs = Math.max(8_000, Math.min(20_000, restante));
    return attempt(timeoutMs, n);
  }, { presupuestoMs: 52_000 });

  return texto ?? fallbackResponse(label, prompt);
}

/**
 * Genera en paralelo todas las respuestas de una ronda.
 *
 * v1.20.0 — OLEADAS con presupuesto: una copa de 64 dispara 64 generaciones
 * en la primera ronda; la ráfaga completa provocaba 429 a granel aguas arriba
 * y toda la ronda caía a la respuesta de reserva. Ahora se procesa en
 * oleadas de 6 duelos y, si el reloj global se agota, el resto recibe su
 * reserva honesta al instante — la copa SIEMPRE arranca, pase lo que pase
 * aguas arriba, y el progreso se persiste a BD en cada oleada.
 */
async function generateRound(copa: Copa, roundIdx: number) {
  const zai = await ZAI.create();
  const round = copa.rounds[roundIdx];
  const prefix = copa.labelNames[roundIdx];
  const t0 = Date.now();
  const PRESUPUESTO_MS = 50_000;
  const OLEADA = 6;

  const generarDuelo = async (duel: CopaDuel, d: number) => {
    const la = prefix + (d * 2 + 1);
    const lb = prefix + (d * 2 + 2);
    duel.a.label = la;
    duel.b.label = lb;
    return Promise.all([
      genContender(zai, duel.a.modelId, la, copa.prompt, 0.65).then((t) => (duel.a.text = t)),
      new Promise((r) => setTimeout(r, 700)).then(() =>
        genContender(zai, duel.b.modelId, lb, copa.prompt, 0.9).then((t) => (duel.b.text = t))
      ),
    ]);
  };

  for (let i = 0; i < round.length; i += OLEADA) {
    const queda = PRESUPUESTO_MS - (Date.now() - t0);
    if (i > 0 && queda < 12_000) {
      // Reloj global agotado: reserva honesta para los duelos restantes.
      for (let d = i; d < round.length; d++) {
        const duel = round[d];
        duel.a.label = prefix + (d * 2 + 1);
        duel.b.label = prefix + (d * 2 + 2);
        duel.a.text = duel.a.text || fallbackResponse(duel.a.label, copa.prompt);
        duel.b.text = duel.b.text || fallbackResponse(duel.b.label, copa.prompt);
      }
      break;
    }
    await Promise.all(round.slice(i, i + OLEADA).map((duel, j) => generarDuelo(duel, i + j)));
    await persist(copa); // progreso incremental: la copa sobrevive al timeout
  }
  await persist(copa);
}

/** Cuando una ronda queda decidida, empareja ganadores y genera la siguiente. */
async function advance(copa: Copa, finishedRound: number) {
  const round = copa.rounds[finishedRound];
  if (round.some((d) => !d.winner)) return; // aún hay duelos pendientes
  const totalRounds = totalRondas(copa.size); // 4→2, 8→3, 16→4
  if (finishedRound >= totalRounds - 1) return; // era la gran final
  const winners = round.map((d) => (d.winner === "a" ? d.a.modelId : d.b.modelId));
  const next: CopaDuel[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    next.push({
      key: `r${finishedRound + 1}d${i / 2}`,
      a: { modelId: winners[i], label: "", text: "" },
      b: { modelId: winners[i + 1], label: "", text: "" },
    });
  }
  copa.rounds[finishedRound + 1] = next; // marcador sincrónico contra votos rápidos
  await persist(copa);
  await generateRound(copa, finishedRound + 1);
}

/* ─────────────────── ELO: registro + swing ─────────────────── */

async function recordDuel(copa: Copa, duel: CopaDuel, winner: "a" | "b"): Promise<number> {
  const A = getModel(duel.a.modelId);
  const B = getModel(duel.b.modelId);
  if (!A || !B) return 0;

  try {
    await db.vote.create({
      data: {
        battleId: `${copa.id}:${duel.key}`,
        modelAId: duel.a.modelId,
        modelBId: duel.b.modelId,
        winner: winner === "a" ? "A" : "B",
        category: "global",
      },
    });
  } catch {
    /* la copa continúa aunque el registro falle */
  }

  // ELO global persistente (v1.9.0): la copa también mueve el ELO de la BD
  try {
    await applyEloDuel(duel.a.modelId, duel.b.modelId, winner === "a" ? "A" : "B");
  } catch {
    /* silencioso */
  }

  const exp = expectedScore(A.elo, B.elo);
  return Math.round(24 * (winner === "a" ? 1 - exp : 0 - exp));
}

/* ─────────────────── Serialización pública ─────────────────── */

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

function publicDuel(copa: Copa, d: CopaDuel) {
  return {
    key: d.key,
    a: publicContender(copa, d.a),
    b: publicContender(copa, d.b),
    winner: d.winner,
    swing: d.swing,
  };
}

function publicState(copa: Copa) {
  const champion = copa.revealed && copa.championModelId
    ? publicContender(copa, {
        modelId: copa.championModelId,
        label: "CAMPEÓN",
        text: "",
      }).model
    : null;
  return {
    id: copa.id,
    prompt: copa.prompt,
    revealed: copa.revealed,
    size: copa.size,
    roundNames: copa.roundNames,
    phase: (copa.revealed ? "campeon" : "competencia") as "campeon" | "competencia",
    rounds: copa.rounds.map((r) => r.map((d) => publicDuel(copa, d))),
    champion,
  };
}

/* ───────────────────────── Handler ───────────────────────── */

export async function POST(req: NextRequest) {
  let body: TournamentRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  /* ── Acción: iniciar una copa nueva ── */
  if (body.action === "start") {
    // Rate-limit (v1.13.0): lanzar una copa genera N×2 respuestas — cara
    const ip = ipDeHeader(req.headers.get("x-forwarded-for"));
    if (!acumular(`copa-start:${ip}`, GEN_LIMITE, Date.now())) {
      return NextResponse.json(
        { error: "Demasiadas copas lanzadas desde tu IP. Espera unos minutos e inténtalo de nuevo." },
        { status: 429, headers: { "Retry-After": String(segundosRestantes(GEN_LIMITE)) } }
      );
    }
    const prompt = (body.prompt ?? "").trim();
    if (prompt.length < 2) {
      return NextResponse.json(
        { error: "Escribe la consigna de la copa para sortear a los contendientes." },
        { status: 400 }
      );
    }
    if (prompt.length > 4000) {
      return NextResponse.json(
        { error: "La consigna no puede superar los 4000 caracteres." },
        { status: 400 }
      );
    }
    const pedida = (
      (COPA_SIZES as readonly number[]).includes(Number(body.size)) ? Number(body.size) : 4
    ) as CopaSize;
    const ids = pickN(pedida);
    // Si el catálogo no alcanzó para el cuadro pedido, sortearIds devolvió la
    // mayor potencia de 2 jugable: el TAMAÑO REAL manda (roundNames, rondas y
    // detección de la gran final dependen de copa.size — no puede decir 64
    // con un cuadro de 32, o el campeón jamás se corona).
    const size = (ids.length < pedida ? ids.length : pedida) as CopaSize;
    const cfg = TAMANOS[size];
    const first: CopaDuel[] = [];
    for (let i = 0; i < ids.length; i += 2) {
      first.push({
        key: `r0d${i / 2}`,
        a: { modelId: ids[i], label: "", text: "" },
        b: { modelId: ids[i + 1], label: "", text: "" },
      });
    }
    const copa: Copa = {
      id: `copa_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      prompt,
      createdAt: Date.now(),
      size,
      roundNames: cfg.names,
      labelNames: cfg.prefixes,
      rounds: [first],
      revealed: false,
    };
    await persist(copa);
    await generateRound(copa, 0);
    return NextResponse.json({ ok: true, copa: publicState(copa) });
  }

  /* ── Acción: votar un duelo ── */
  if (body.action === "vote") {
    // Rate-limit (v1.13.0): generoso para humanos, hostil a scripts
    const ip = ipDeHeader(req.headers.get("x-forwarded-for"));
    if (!acumular(`copa-voto:${ip}`, VOTO_LIMITE, Date.now())) {
      return NextResponse.json(
        { error: "Demasiados votos desde tu IP. Espera unos minutos e inténtalo de nuevo." },
        { status: 429, headers: { "Retry-After": String(segundosRestantes(VOTO_LIMITE)) } }
      );
    }
    const { id, duel: duelKey, winner } = body;
    if (!id || !duelKey || !winner || !["a", "b"].includes(winner)) {
      return NextResponse.json(
        { error: "Faltan campos del voto (id, duel, winner)." },
        { status: 400 }
      );
    }
    // Read-through (v1.13.0): si esta instancia no la tiene, se recupera de BD
    const copa = await cargarCopa(id);
    if (!copa) {
      return NextResponse.json(
        { error: "La copa ha expirado. Inicia una nueva desde el Modo Torneo." },
        { status: 404 }
      );
    }
    const rIdx = Number(duelKey.slice(1, duelKey.indexOf("d")));
    const dIdx = Number(duelKey.slice(duelKey.indexOf("d") + 1));
    const duel = copa.rounds[rIdx]?.[dIdx];
    if (!duel || !duel.a.text) {
      return NextResponse.json(
        { error: "Ese duelo todavía no está disponible." },
        { status: 409 }
      );
    }

    // ELO de jurado de esta acción (null si el duelo ya estaba decidido)
    let jurado: Awaited<ReturnType<typeof procesarJurado>> = null;

    // Idempotencia: un duelo ya decidido devuelve el estado sin re-votar
    if (!duel.winner) {
      duel.winner = winner;
      duel.swing = await recordDuel(copa, duel, winner);
      await persist(copa);
      // ELO de jurado (v1.20.0): tu voto también mueve TU escalera. El
      // resultado viaja en la respuesta — el cliente anónimo no conoce los
      // modelId hasta la revelación, así que el servidor manda el estado.
      jurado = await procesarJurado(duel.a.modelId, duel.b.modelId, winner === "a" ? "A" : "B", "global");
      // Ronda completa → se genera la siguiente con los ganadores
      await advance(copa, rIdx);
      // Gran final votada → revelación y campeón. La condición depende del
      // TAMAÑO del cuadro (totalRondas), no de rounds.length, que crece con
      // cada ronda creada: votar la primera semifinal de un cuadro de 4 no
      // debe revelar campeón (bug de la v1.9.0 destapado por el Salón).
      if (esGranFinal(copa.size, rIdx)) {
        copa.revealed = true;
        copa.championModelId = winner === "a" ? duel.a.modelId : duel.b.modelId;
        await persist(copa);
        // Salón de la Fama (v1.12.0): el campeón queda registrado en la BD
        const subcampeon = winner === "a" ? duel.b : duel.a;
        try {
          await db.copaCampeon.create({
            data: {
              copaId: copa.id,
              prompt: copa.prompt.slice(0, 300),
              size: copa.size,
              championModelId: copa.championModelId,
              championName: getModel(copa.championModelId)?.name ?? copa.championModelId,
              runnerUpModelId: subcampeon.modelId,
              runnerUpName: getModel(subcampeon.modelId)?.name ?? subcampeon.modelId,
            },
          });
        } catch {
          /* el Salón de la Fama nunca rompe la revelación */
        }
      }
    }

    return NextResponse.json({
      ok: true,
      copa: publicState(copa),
      usuarioElo: jurado
        ? {
            elo: jurado.estado.elo,
            votos: jurado.estado.votos,
            aciertos: jurado.estado.aciertos,
            racha: jurado.estado.racha,
            mejorRacha: jurado.estado.mejorRacha,
            delta: jurado.delta,
            acierto: jurado.acierto,
            persistido: jurado.persistido,
          }
        : null,
    });
  }

  return NextResponse.json({ error: "Acción desconocida." }, { status: 400 });
}
