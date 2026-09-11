/**
 * GET  /api/dia — el Duelo del día: consigna + dos respuestas anónimas.
 * POST /api/dia { winner } — registra tu voto y revela identidades + consenso.
 *
 * v1.20.0: un duelo determinista al día para toda la comunidad. Los textos se
 * generan UNA vez por proceso (caché en memoria) y se reutilizan para todos
 * los visitantes del día — el coste de LLM es constante, no por visitante.
 * Los votos usan battleId `dia-<fecha>-<sufijo>` y el consenso se agrega por
 * prefijo `dia-<fecha>`: cada persona vota una vez y los porcentajes son
 * comunitarios.
 */

import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/db-init";
import { getModel } from "@/lib/models-data";
import { personaFor } from "@/lib/personas";
import { CARTA_VERDAD, LADO_OSCURO, APPS_SIN_PUDOR } from "@/lib/ai-conducta";
import { conReintentos } from "@/lib/reintentos";
import { ipDeHeader, acumular, VOTO_LIMITE, GEN_LIMITE } from "@/lib/rate-limit";
import { applyEloDuel } from "@/lib/elo-global";
import { procesarJurado } from "@/lib/jurado-servidor";
import { dueloDeDia, fechaDeDuelo, battleIdDeDia, battleIdDeVoto } from "@/lib/duelo-dia";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/** Caché del duelo del día (por proceso): textos ya generados hoy. */
const g = globalThis as unknown as {
  __todologoDia?: { fecha: string; aId: string; bId: string; prompt: string; textoA: string; textoB: string };
};

function sistemaPara(modelId: string): string {
  const m = getModel(modelId);
  const nombre = m?.name ?? "Contendiente";
  return `${CARTA_VERDAD}\n\n${LADO_OSCURO}\n\n${APPS_SIN_PUDOR}\n\nEres "${nombre}", un contendiente anónimo del Duelo del día de todólogo.ai. ${personaFor(
    modelId
  )} Responde SIEMPRE en español (salvo código/comandos), con un máximo de 300 palabras (el código no cuenta). Nunca reveles tu nombre ni el de tu proveedor: tu estilo debe hablar por ti.`;
}

async function generarTexto(
  zai: Awaited<ReturnType<typeof ZAI.create>>,
  modelId: string,
  prompt: string,
  temperature: number
): Promise<string> {
  const sys = sistemaPara(modelId);
  const texto = await conReintentos<string>(`dia-${modelId}`, async (n) => {
    if (n > 20) return undefined;
    try {
      const completion = await Promise.race([
        zai.chat.completions.create({
          messages: [
            { role: "assistant", content: sys },
            { role: "user", content: prompt },
          ] as never,
          temperature,
          thinking: { type: n > 2 ? "disabled" : "enabled" },
        }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 20_000)),
      ]);
      const choice = completion && "choices" in completion ? completion.choices?.[0] : undefined;
      const content =
        typeof (choice?.message as { content?: unknown } | undefined)?.content === "string"
          ? (choice?.message as { content: string }).content.trim()
          : null;
      return content && content.length > 0 ? content : null;
    } catch {
      return null;
    }
  }, { presupuestoMs: 45_000 });
  return (
    texto ??
    "El proveedor no respondió a tiempo para esta respuesta. El duelo continúa: vota con normalidad."
  );
}

/** Consenso comunitario del día (por prefijo de battleId). */
async function consensoDeDia(fecha: string): Promise<{ A: number; B: number; tie: number; total: number }> {
  try {
    const votos = await db.vote.findMany({
      where: { battleId: { startsWith: `dia-${fecha}` } },
      select: { winner: true },
    });
    const A = votos.filter((v) => v.winner === "A").length;
    const B = votos.filter((v) => v.winner === "B").length;
    const tie = votos.filter((v) => v.winner === "tie").length;
    return { A, B, tie, total: A + B + tie };
  } catch {
    return { A: 0, B: 0, tie: 0, total: 0 };
  }
}

export async function GET() {
  const fecha = fechaDeDuelo();
  const enCache = g.__todologoDia && g.__todologoDia.fecha === fecha ? g.__todologoDia : null;

  let duelo = enCache;
  if (!duelo) {
    const { modelAId, modelBId, prompt } = dueloDeDia(fecha);
    const vacio = { aId: modelAId, bId: modelBId, prompt };
    // ¿Textos ya guardados hoy en la tabla de duelos del día? (persistencia)
    // No: la generación es barata una vez por proceso y el fallback es
    // honesto — la caché de proceso basta para v1.
    try {
      const ip = ipDeHeader(null);
      if (!acumular(`dia-gen:${ip}`, GEN_LIMITE, Date.now())) {
        return NextResponse.json(
          { error: "Demasiadas peticiones. Espera unos minutos." },
          { status: 429 }
        );
      }
    } catch {
      /* rate-limit no debe romper el GET */
    }
    const zai = await ZAI.create();
    const [textoA, textoB] = await Promise.all([
      generarTexto(zai, modelAId, prompt, 0.65),
      new Promise((r) => setTimeout(r, 700)).then(() => generarTexto(zai, modelBId, prompt, 0.9)),
    ]);
    duelo = { fecha, ...vacio, textoA, textoB };
    g.__todologoDia = duelo;
  }

  return NextResponse.json({
    ok: true,
    fecha,
    battleId: battleIdDeDia(fecha),
    prompt: duelo.prompt,
    a: { text: duelo.textoA },
    b: { text: duelo.textoB },
    anonimos: true,
  });
}

export async function POST(req: NextRequest) {
  const ip = ipDeHeader(req.headers.get("x-forwarded-for"));
  if (!acumular(`dia-voto:${ip}`, VOTO_LIMITE, Date.now())) {
    return NextResponse.json(
      { error: "Demasiados votos desde tu IP. Espera unos minutos." },
      { status: 429, headers: { "Retry-After": String(60) } }
    );
  }
  const body = await req.json().catch(() => null);
  const winner = typeof (body as { winner?: unknown } | null)?.winner === "string"
    ? (body as { winner: string }).winner
    : "";
  if (!["A", "B", "tie", "bad"].includes(winner)) {
    return NextResponse.json({ error: "Voto inválido (A | B | tie | bad)." }, { status: 400 });
  }

  const fecha = fechaDeDuelo();
  const enCache = g.__todologoDia && g.__todologoDia.fecha === fecha ? g.__todologoDia : null;
  if (!enCache) {
    // Nadie ha cargado el duelo hoy en esta instancia: obligar a un GET previo
    // garantiza textos reales antes de votar.
    return NextResponse.json({ error: "Carga primero el duelo del día (GET /api/dia)." }, { status: 409 });
  }

  const { aId, bId, prompt } = enCache;
  const battleId = battleIdDeVoto(fecha);
  try {
    await ensureSchema();
    await db.vote.create({
      data: { battleId, modelAId: aId, modelBId: bId, winner, category: "global" },
    });
    if (winner !== "bad") {
      try {
        await applyEloDuel(aId, bId, winner as "A" | "B" | "tie");
      } catch {
        /* el voto ya está registrado */
      }
    }
  } catch {
    return NextResponse.json({ error: "No se pudo registrar tu voto." }, { status: 500 });
  }

  // ELO de jurado: el duelo del día también puntúa tu escalera
  const jurado = await procesarJurado(aId, bId, winner as "A" | "B" | "tie" | "bad", "global");

  const consenso = await consensoDeDia(fecha);
  const A = getModel(aId);
  const B = getModel(bId);

  return NextResponse.json({
    ok: true,
    fecha,
    consenso,
    revelacion: {
      a: A ? { id: A.id, name: A.name, provider: A.provider, elo: A.elo } : { id: aId },
      b: B ? { id: B.id, name: B.name, provider: B.provider, elo: B.elo } : { id: bId },
    },
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
