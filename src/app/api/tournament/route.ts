import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { MODELS, getModel } from "@/lib/models-data";
import { db } from "@/lib/db";
import { expectedScore } from "@/lib/elo";
import { applyEloDuel } from "@/lib/elo-global";
import { personaFor } from "@/lib/personas";
import { chatExterno, vozExternaPara } from "@/lib/voices-externas";
import { esGranFinal, totalRondas } from "@/lib/copa-utils";

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
  size: 4 | 8 | 16;
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

/* ─────────────── Sesiones en memoria (proceso único) ─────────────── */

const store: Map<string, Copa> = ((globalThis as unknown as {
  __todologoCopas?: Map<string, Copa>;
}).__todologoCopas ??= new Map());

function persist(copa: Copa) {
  store.set(copa.id, copa);
  // Limpieza: conserva las 160 copas más recientes
  if (store.size > 160) {
    const oldest = [...store.values()].sort((x, y) => x.createdAt - y.createdAt);
    for (const old of oldest.slice(0, store.size - 160)) store.delete(old.id);
  }
}

/* ───────────────────────── Sorteo ───────────────────────── */

/** N modelos distintos del tramo alto del ranking (sorteo aleatorio). */
function pickN(n: number): string[] {
  const sorted = [...MODELS].sort((a, b) => b.elo - a.elo);
  const pool = sorted.slice(0, Math.ceil(sorted.length * 0.7));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n).map((m) => m.id);
}

const SIZE_CFG: Record<number, { names: string[]; prefixes: string[] }> = {
  4: { names: ["Semifinales", "Gran final"], prefixes: ["S", "F"] },
  8: { names: ["Cuartos de final", "Semifinales", "Gran final"], prefixes: ["C", "S", "F"] },
  16: {
    names: ["Octavos de final", "Cuartos de final", "Semifinales", "Gran final"],
    prefixes: ["O", "C", "S", "F"],
  },
};

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
  const sys = `Eres "${name}", un contendiente anónimo de la Copa Todólogo, el torneo de eliminación directa del arena de IA todólogo.ai. ${personaFor(
    modelId
  )} Responde SIEMPRE en español (salvo código/comandos), con un máximo de 200 palabras (el código no cuenta en el límite). Nunca reveles tu nombre ni el de tu proveedor: eres un contendiente anónimo hasta la revelación final y tu estilo debe hablar por ti.`;

  const attempt = async (timeoutMs: number): Promise<string | null> => {
    // v1.12.0 — voz de proveedor real si hay clave API configurada
    const voz = model ? vozExternaPara(model.provider) : null;
    if (voz) {
      const r = await chatExterno(
        voz,
        [
          { role: "assistant", content: sys },
          { role: "user", content: prompt },
        ],
        temperature,
        timeoutMs
      );
      if (r) return r.text;
    }
    try {
      const completion = await Promise.race([
        zai.chat.completions.create({
          messages: [
            { role: "assistant", content: sys },
            { role: "user", content: prompt },
          ] as never,
          temperature,
          thinking: { type: "disabled" },
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

  const t0 = Date.now();
  const first = await attempt(44_000);
  if (first) return first;
  const remaining = 52_000 - (Date.now() - t0);
  if (remaining < 8_000) return fallbackResponse(label, prompt);
  const second = await attempt(remaining);
  return second ?? fallbackResponse(label, prompt);
}

/** Genera en paralelo todas las respuestas de una ronda. */
async function generateRound(copa: Copa, roundIdx: number) {
  const zai = await ZAI.create();
  const round = copa.rounds[roundIdx];
  const prefix = copa.labelNames[roundIdx];
  await Promise.all(
    round.map((duel, d) => {
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
    })
  );
  persist(copa);
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
  persist(copa);
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
    const allowedSizes = [4, 8, 16];
    const size = (allowedSizes.includes(Number(body.size)) ? Number(body.size) : 4) as 4 | 8 | 16;
    const cfg = SIZE_CFG[size];

    const ids = pickN(size);
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
    persist(copa);
    await generateRound(copa, 0);
    return NextResponse.json({ ok: true, copa: publicState(copa) });
  }

  /* ── Acción: votar un duelo ── */
  if (body.action === "vote") {
    const { id, duel: duelKey, winner } = body;
    if (!id || !duelKey || !winner || !["a", "b"].includes(winner)) {
      return NextResponse.json(
        { error: "Faltan campos del voto (id, duel, winner)." },
        { status: 400 }
      );
    }
    const copa = store.get(id);
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

    // Idempotencia: un duelo ya decidido devuelve el estado sin re-votar
    if (!duel.winner) {
      duel.winner = winner;
      duel.swing = await recordDuel(copa, duel, winner);
      persist(copa);
      // Ronda completa → se genera la siguiente con los ganadores
      await advance(copa, rIdx);
      // Gran final votada → revelación y campeón. La condición depende del
      // TAMAÑO del cuadro (totalRondas), no de rounds.length, que crece con
      // cada ronda creada: votar la primera semifinal de un cuadro de 4 no
      // debe revelar campeón (bug de la v1.9.0 destapado por el Salón).
      if (esGranFinal(copa.size, rIdx)) {
        copa.revealed = true;
        copa.championModelId = winner === "a" ? duel.a.modelId : duel.b.modelId;
        persist(copa);
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

    return NextResponse.json({ ok: true, copa: publicState(copa) });
  }

  return NextResponse.json({ error: "Acción desconocida." }, { status: 400 });
}
