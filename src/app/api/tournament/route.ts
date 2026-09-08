import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { MODELS, getModel } from "@/lib/models-data";
import { db } from "@/lib/db";
import { expectedScore } from "@/lib/elo";
import { personaFor } from "@/lib/personas";

export const maxDuration = 60;

/* ───────────────────────── Tipos ───────────────────────── */

export interface CopaContender {
  modelId: string;
  label: string; // "A1" | "A2" | "B1" | "B2" | "F1" | "F2"
  text: string;
}

export interface CopaDuel {
  key: "semi1" | "semi2" | "final";
  a: CopaContender;
  b: CopaContender;
  winner?: "a" | "b";
  swing?: number;
}

export interface Copa {
  id: string;
  prompt: string;
  createdAt: number;
  semi1: CopaDuel;
  semi2: CopaDuel;
  final?: CopaDuel;
  championModelId?: string;
  revealed: boolean;
}

interface TournamentRequest {
  action?: "start" | "vote";
  prompt?: string;
  id?: string;
  duel?: "semi1" | "semi2" | "final";
  winner?: "a" | "b";
}

/* ─────────────── Sesiones en memoria (proceso único) ─────────────── */

const store: Map<string, Copa> = ((globalThis as unknown as {
  __todologoCopas?: Map<string, Copa>;
}).__todologoCopas ??= new Map());

function persist(copa: Copa) {
  store.set(copa.id, copa);
  // Limpieza: conserva las 120 copas más recientes
  if (store.size > 120) {
    const oldest = [...store.values()].sort((x, y) => x.createdAt - y.createdAt);
    for (const old of oldest.slice(0, store.size - 120)) store.delete(old.id);
  }
}

/* ───────────────────────── Sorteo ───────────────────────── */

/** Cuatro modelos distintos del tramo alto del ranking (sorteo aleatorio). */
function pickFour(): string[] {
  const sorted = [...MODELS].sort((a, b) => b.elo - a.elo);
  const pool = sorted.slice(0, Math.ceil(sorted.length * 0.7));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 4).map((m) => m.id);
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
  temperature: number,
  delayMs = 0
): Promise<string> {
  const model = getModel(modelId);
  const name = model?.name ?? "Contendiente";
  const sys = `Eres "${name}", un contendiente anónimo de la Copa Todólogo, el torneo de eliminación directa del arena de IA todólogo.ai. ${personaFor(
    modelId
  )} Responde SIEMPRE en español (salvo código/comandos), con un máximo de 200 palabras (el código no cuenta en el límite). Nunca reveles tu nombre ni el de tu proveedor: eres un contendiente anónimo hasta la revelación final y tu estilo debe hablar por ti.`;

  const attempt = async (timeoutMs: number): Promise<string | null> => {
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

  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  const t0 = Date.now();
  const first = await attempt(44_000);
  if (first) return first;
  // Reintento dentro del presupuesto temporal si el primer intento falló rápido
  const remaining = 52_000 - (Date.now() - t0);
  if (remaining < 8_000) return fallbackResponse(label, prompt);
  const second = await attempt(remaining);
  return second ?? fallbackResponse(label, prompt);
}

/** Genera los cuatro contendientes de las semifinales en paralelo. */
async function generateSemis(copa: Copa) {
  const zai = await ZAI.create();
  const [tA1, tA2, tB1, tB2] = await Promise.all([
    genContender(zai, copa.semi1.a.modelId, "A1", copa.prompt, 0.65, 0),
    genContender(zai, copa.semi1.b.modelId, "A2", copa.prompt, 0.9, 1_400),
    genContender(zai, copa.semi2.a.modelId, "B1", copa.prompt, 0.65, 2_800),
    genContender(zai, copa.semi2.b.modelId, "B2", copa.prompt, 0.9, 4_200),
  ]);
  copa.semi1.a.text = tA1;
  copa.semi1.b.text = tA2;
  copa.semi2.a.text = tB1;
  copa.semi2.b.text = tB2;
  persist(copa);
}

/** Genera la gran final con los dos semifinalistas ganadores (en paralelo). */
async function generateFinal(copa: Copa) {
  const w1 = copa.semi1.winner === "a" ? copa.semi1.a : copa.semi1.b;
  const w2 = copa.semi2.winner === "a" ? copa.semi2.a : copa.semi2.b;
  const finalDuel: CopaDuel = {
    key: "final",
    a: { modelId: w1.modelId, label: "F1", text: "" },
    b: { modelId: w2.modelId, label: "F2", text: "" },
  };
  copa.final = finalDuel; // marcador sincrónico contra carreras de voto
  persist(copa);
  const zai = await ZAI.create();
  const [tF1, tF2] = await Promise.all([
    genContender(zai, finalDuel.a.modelId, "F1", copa.prompt, 0.7, 0),
    genContender(zai, finalDuel.b.modelId, "F2", copa.prompt, 0.85, 1_400),
  ]);
  finalDuel.a.text = tF1;
  finalDuel.b.text = tF2;
  persist(copa);
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
        ? publicContender(copa, {
            modelId: copa.championModelId,
            label: "CAMPEÓN",
            text: "",
          }).model
        : null,
    semi1: publicDuel(copa, copa.semi1),
    semi2: publicDuel(copa, copa.semi2),
    final: publicDuel(copa, copa.final),
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

    const [p1, p2, p3, p4] = pickFour();
    const copa: Copa = {
      id: `copa_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      prompt,
      createdAt: Date.now(),
      semi1: {
        key: "semi1",
        a: { modelId: p1, label: "A1", text: "" },
        b: { modelId: p2, label: "A2", text: "" },
      },
      semi2: {
        key: "semi2",
        a: { modelId: p3, label: "B1", text: "" },
        b: { modelId: p4, label: "B2", text: "" },
      },
      revealed: false,
    };
    persist(copa);
    await generateSemis(copa);
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
    const duel =
      duelKey === "semi1" ? copa.semi1 : duelKey === "semi2" ? copa.semi2 : copa.final;
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

      // Semifinales completas → se genera la gran final
      if (
        duelKey !== "final" &&
        copa.semi1.winner &&
        copa.semi2.winner &&
        !copa.final
      ) {
        await generateFinal(copa);
      }

      // Final votada → revelación y campeón
      if (duelKey === "final" && copa.final) {
        copa.revealed = true;
        copa.championModelId =
          winner === "a" ? copa.final.a.modelId : copa.final.b.modelId;
        persist(copa);
      }
    }

    return NextResponse.json({ ok: true, copa: publicState(copa) });
  }

  return NextResponse.json({ error: "Acción desconocida." }, { status: 400 });
}
