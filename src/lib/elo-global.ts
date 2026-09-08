// ELO global persistente (v1.9.0) — cada voto/copa mueve un ELO real almacenado
// en la BD. A diferencia del delta derivado de votos, este estado sobrevive
// reinicios y es la base para el despliegue con Postgres: basta con cambiar el
// provider del datasource en prisma/schema.prisma y DATABASE_URL (el schema y
// este módulo son idénticos para SQLite y PostgreSQL).
import { db } from "@/lib/db";

export const ELO_BASE = 1000;
const K = 24;

export interface GlobalEloRow {
  modelId: string;
  elo: number;
  wins: number;
  losses: number;
  ties: number;
  battles: number;
}

/** Aplica un duelo resuelto al ELO global (upsert atómico por modelo). */
export async function applyEloDuel(
  modelAId: string,
  modelBId: string,
  winner: "A" | "B" | "tie"
): Promise<void> {
  const [a, b] = await Promise.all([
    db.eloState.findUnique({ where: { modelId: modelAId } }),
    db.eloState.findUnique({ where: { modelId: modelBId } }),
  ]);
  const ra = a?.elo ?? ELO_BASE;
  const rb = b?.elo ?? ELO_BASE;
  const expA = 1 / (1 + Math.pow(10, (rb - ra) / 400));
  const scoreA = winner === "A" ? 1 : winner === "B" ? 0 : 0.5;
  const newA = Math.round((ra + K * (scoreA - expA)) * 10) / 10;
  const newB = Math.round((rb + K * (1 - scoreA - (1 - expA))) * 10) / 10;

  const inc = (which: "A" | "B") => {
    const won = winner === which;
    const tied = winner === "tie";
    return {
      elo: which === "A" ? newA : newB,
      wins: won ? 1 : 0,
      losses: !won && !tied ? 1 : 0,
      ties: tied ? 1 : 0,
      battles: 1,
    };
  };

  await Promise.all([
    db.eloState.upsert({
      where: { modelId: modelAId },
      create: { modelId: modelAId, elo: newA, wins: inc("A").wins, losses: inc("A").losses, ties: inc("A").ties, battles: 1 },
      update: {
        elo: newA,
        wins: { increment: inc("A").wins },
        losses: { increment: inc("A").losses },
        ties: { increment: inc("A").ties },
        battles: { increment: 1 },
      },
    }),
    db.eloState.upsert({
      where: { modelId: modelBId },
      create: { modelId: modelBId, elo: newB, wins: inc("B").wins, losses: inc("B").losses, ties: inc("B").ties, battles: 1 },
      update: {
        elo: newB,
        wins: { increment: inc("B").wins },
        losses: { increment: inc("B").losses },
        ties: { increment: inc("B").ties },
        battles: { increment: 1 },
      },
    }),
  ]);
}

/** Mapa global modelId → estado ELO persistido (solo modelos con batallas). */
export async function getGlobalEloMap(): Promise<Record<string, GlobalEloRow>> {
  try {
    const rows = await db.eloState.findMany({ where: { battles: { gt: 0 } } });
    const map: Record<string, GlobalEloRow> = {};
    for (const r of rows) {
      map[r.modelId] = {
        modelId: r.modelId,
        elo: Math.round(r.elo),
        wins: r.wins,
        losses: r.losses,
        ties: r.ties,
        battles: r.battles,
      };
    }
    return map;
  } catch {
    return {};
  }
}
