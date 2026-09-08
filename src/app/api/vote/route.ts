import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getModel } from "@/lib/models-data";
import { eloDeltaFromVotes, expectedScore, type Winner } from "@/lib/elo";

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

  try {
    await db.vote.create({
      data: {
        battleId,
        modelAId,
        modelBId,
        winner,
        category,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo registrar el voto." },
      { status: 500 }
    );
  }

  // Recalcula deltas en vivo para los dos modelos implicados
  const computeDelta = async (id: string) => {
    const [winsA, winsB, tiesA, tiesB] = await Promise.all([
      db.vote.count({ where: { OR: [{ modelAId: id, winner: "A" }, { modelBId: id, winner: "B" }] } }),
      db.vote.count({ where: { OR: [{ modelAId: id, winner: "B" }, { modelBId: id, winner: "A" }] } }),
      db.vote.count({ where: { OR: [{ modelAId: id, winner: "tie" }, { modelBId: id, winner: "tie" }] } }),
      db.vote.count({ where: { OR: [{ modelAId: id, winner: "bad" }, { modelBId: id, winner: "bad" }] } }),
    ]);
    return {
      delta: eloDeltaFromVotes(winsA, winsB, tiesA),
      battles: winsA + winsB + tiesA + tiesB,
    };
  };

  const [statA, statB] = await Promise.all([computeDelta(modelAId), computeDelta(modelBId)]);

  const newA = A.elo + statA.delta;
  const newB = B.elo + statB.delta;

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
      [modelAId]: { base: A.elo, delta: statA.delta, total: newA },
      [modelBId]: { base: B.elo, delta: statB.delta, total: newB },
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
