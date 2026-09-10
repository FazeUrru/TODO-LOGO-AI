import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getModel, CATEGORIAS_GENERATIVAS } from "@/lib/models-data";
import { eloDeltaFromVotes, expectedScore, type Winner } from "@/lib/elo";
import { applyEloDuel, applyArenaDuel, esArenaGenerativa, ELO_BASE } from "@/lib/elo-global";
import { ipDeHeader, acumular, VOTO_LIMITE, segundosRestantes } from "@/lib/rate-limit";
import { procesarJurado } from "@/lib/jurado-servidor";

interface VoteRequest {
  battleId?: string;
  modelAId?: string;
  modelBId?: string;
  winner?: Winner;
  category?: string;
}

export async function POST(req: NextRequest) {
  let body: VoteRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // Rate-limit (v1.13.0): generoso para humanos, hostil a scripts
  const ip = ipDeHeader(req.headers.get("x-forwarded-for"));
  if (!acumular(`voto:${ip}`, VOTO_LIMITE, Date.now())) {
    return NextResponse.json(
      { error: "Demasiados votos desde tu IP. Espera unos minutos e inténtalo de nuevo." },
      { status: 429, headers: { "Retry-After": String(segundosRestantes(VOTO_LIMITE)) } }
    );
  }

  const { modelAId, modelBId, winner, category = "global" } = body;
  if (!modelAId || !modelBId || !winner) {
    return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
  }
  if (!["A", "B", "tie", "bad"].includes(winner)) {
    return NextResponse.json({ error: "Valor de voto inválido." }, { status: 400 });
  }
  const A = getModel(modelAId);
  const B = getModel(modelBId);
  if (!A || !B) {
    return NextResponse.json({ error: "Modelo desconocido." }, { status: 404 });
  }

  let battleId = body.battleId;
  if (!battleId) {
    battleId = `btl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  // Recalcula deltas en vivo para los dos modelos implicados.
  // v1.19.0 — el recuento es consciente de la arena: en imagen/vídeo/audio
  // solo cuentan los votos de ESA modalidad; en texto se excluyen los votos
  // de categorías generativas (antes se colaban en todas las categorías).
  const enArenaGenerativa = esArenaGenerativa(category);
  const computeDelta = async (id: string) => {
    const filtroCategoria = enArenaGenerativa ? { equals: category } : { notIn: [...CATEGORIAS_GENERATIVAS] };
    const [winsA, winsB, tiesA, tiesB] = await Promise.all([
      db.vote.count({ where: { OR: [{ modelAId: id, winner: "A" }, { modelBId: id, winner: "B" }], category: filtroCategoria } }),
      db.vote.count({ where: { OR: [{ modelAId: id, winner: "B" }, { modelBId: id, winner: "A" }], category: filtroCategoria } }),
      db.vote.count({ where: { OR: [{ modelAId: id, winner: "tie" }, { modelBId: id, winner: "tie" }], category: filtroCategoria } }),
      db.vote.count({ where: { OR: [{ modelAId: id, winner: "bad" }, { modelBId: id, winner: "bad" }], category: filtroCategoria } }),
    ]);
    return {
      delta: eloDeltaFromVotes(winsA, winsB, tiesA),
      battles: winsA + winsB + tiesA + tiesB,
    };
  };

  /** ELO de arena persistido (post-voto) — base coherente = total − delta. */
  const basesDeArena = async (
    arena: string,
    idA: string,
    idB: string
  ): Promise<[number, number]> => {
    try {
      const [ra, rb] = await Promise.all([
        db.eloArena.findUnique({ where: { modelId_arena: { modelId: idA, arena } } }),
        db.eloArena.findUnique({ where: { modelId_arena: { modelId: idB, arena } } }),
      ]);
      return [Math.round(ra?.elo ?? ELO_BASE), Math.round(rb?.elo ?? ELO_BASE)];
    } catch {
      return [ELO_BASE, ELO_BASE];
    }
  };

  try {
    // Idempotencia: un battleId solo puede recibir un voto. Si ya existe,
    // no se duplica: se devuelven de nuevo las estadísticas recalculadas.
    const existing = await db.vote.findFirst({ where: { battleId } });
    if (existing) {
      const [statA0, statB0] = await Promise.all([computeDelta(modelAId), computeDelta(modelBId)]);
      const [totA0, totB0] = enArenaGenerativa
        ? await basesDeArena(category, modelAId, modelBId)
        : [A.elo + statA0.delta, B.elo + statB0.delta];
      return NextResponse.json({
        ok: true,
        duplicate: true,
        note: "Esta batalla ya había recibido un voto; no se ha registrado dos veces.",
        elo: {
          [modelAId]: { total: totA0, delta: statA0.delta, battles: statA0.battles },
          [modelBId]: { total: totB0, delta: statB0.delta, battles: statB0.battles },
        },
        swing: 0,
      });
    }
    await db.vote.create({
      data: {
        battleId,
        modelAId,
        modelBId,
        winner,
        category,
      },
    });

    // ELO global persistente (v1.9.0): el voto mueve un ELO real en la BD.
    // v1.19.0 — separación por dimensión: los votos de las arenas generativas
    // (category = imagen/video/audio) escriben en EloArena, SU propia tabla;
    // los de texto siguen en EloState. Nunca se cruzan.
    if (winner !== "bad") {
      try {
        if (esArenaGenerativa(category)) {
          await applyArenaDuel(category, modelAId, modelBId, winner);
        } else {
          await applyEloDuel(modelAId, modelBId, winner);
        }
      } catch {
        /* la batalla continúa aunque el ELO global falle */
      }
    }
  } catch {
    return NextResponse.json(
      { error: "No se pudo registrar el voto." },
      { status: 500 }
    );
  }

  const [statA, statB] = await Promise.all([computeDelta(modelAId), computeDelta(modelBId)]);

  // ELO de jurado (v1.20.0): tu voto también mueve TU escalera. Con sesión
  // se persiste en UserElo (ranking público); sin sesión se devuelve el
  // estado calculado y el cliente lo guarda en su dispositivo.
  const jurado = await procesarJurado(modelAId, modelBId, winner, category);

  // En arenas generativas el rating visible es el ELO de la arena (EloArena,
  // ya actualizado con este voto); en texto, ficha estática + delta, como
  // siempre desde la v1.9.0.
  let baseA = A.elo;
  let baseB = B.elo;
  if (enArenaGenerativa) {
    const [totA, totB] = await basesDeArena(category, modelAId, modelBId);
    baseA = totA - statA.delta;
    baseB = totB - statB.delta;
  }

  const newA = baseA + statA.delta;
  const newB = baseB + statB.delta;

  // ELO matemático del enfrentamiento (para el toast informativo)
  let swing = 0;
  if (winner === "A" || winner === "B") {
    const exp = expectedScore(newA, newB);
    const score = winner === "A" ? 1 : 0;
    swing = Math.round(24 * (score - exp));
  }

  return NextResponse.json({
    ok: true,
    battleId,
    elo: {
      [modelAId]: { base: baseA, delta: statA.delta, total: newA },
      [modelBId]: { base: baseB, delta: statB.delta, total: newB },
    },
    swing,
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
    message:
      winner === "tie"
        ? "Empate registrado. El ELO se mantiene estable."
        : winner === "bad"
          ? "Feedback registrado: ambos modelos perderán visibilidad."
          : "Voto registrado. El ELO del arena se ha actualizado.",
  });
}
