/**
 * POST /api/v2/vote — vota un duelo creado con /api/v2/battle y revela los
 * modelos. Requiere la misma clave con la que se creó la batalla (o cualquier
 * clave válida: el voto es de quien firma). El voto mueve el ELO real de la
 * BD (EloState / EloArena), exactamente como en la web.
 *
 * El mapping battleId → modelos vive en memoria del proceso: si la instancia
 * se recicló, responde 410 Gone con una explicación honesta.
 */

import { NextRequest } from "next/server";
import { jsonCors, preflightCors } from "@/lib/v2-cors";
import { validarClave } from "@/lib/apikeys";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/db-init";
import { getModel } from "@/lib/models-data";
import { applyEloDuel, applyArenaDuel, esArenaGenerativa } from "@/lib/elo-global";

export function OPTIONS() {
  return preflightCors();
}

const g = globalThis as unknown as { __todologoV2Batallas?: Map<string, { aId: string; bId: string; category: string; at: number }> };
const batallas = g.__todologoV2Batallas;

export async function POST(req: NextRequest) {
  const clave = await validarClave(req.headers.get("x-api-key"));
  if (!clave.ok) {
    const status = clave.motivo === "limite" ? 429 : clave.motivo === "falta" ? 401 : 403;
    return jsonCors(
      {
        ok: false,
        error:
          clave.motivo === "falta"
            ? "Falta la cabecera X-Api-Key."
            : clave.motivo === "limite"
              ? "Límite de 20 llamadas/minuto superado para esta clave."
              : clave.motivo === "revocada"
                ? "Esta clave está revocada."
                : "Clave API inválida.",
      },
      status
    );
  }

  const body = await req.json().catch(() => null);
  const battleId = typeof (body as { battleId?: unknown } | null)?.battleId === "string"
    ? (body as { battleId: string }).battleId
    : "";
  const winner = typeof (body as { winner?: unknown } | null)?.winner === "string"
    ? (body as { winner: string }).winner
    : "";
  if (!battleId || !["A", "B", "tie", "bad"].includes(winner)) {
    return jsonCors(
      { ok: false, error: "Faltan campos (battleId, winner: A|B|tie|bad)." },
      400
    );
  }

  const registro = batallas?.get(battleId);
  if (!registro) {
    return jsonCors(
      {
        ok: false,
        error:
          "Esta batalla expiró de la memoria del servidor (instancia reciclada o battleId desconocido). Crea otro duelo con POST /api/v2/battle.",
      },
      410
    );
  }

  try {
    await ensureSchema();
    // Idempotencia: un battleId solo recibe un voto (igual que la web).
    const existente = await db.vote.findFirst({ where: { battleId } });
    if (!existente) {
      await db.vote.create({
        data: {
          battleId,
          modelAId: registro.aId,
          modelBId: registro.bId,
          winner,
          category: registro.category,
        },
      });
      if (winner !== "bad") {
        try {
          if (esArenaGenerativa(registro.category)) {
            await applyArenaDuel(registro.category, registro.aId, registro.bId, winner as "A" | "B" | "tie");
          } else {
            await applyEloDuel(registro.aId, registro.bId, winner as "A" | "B" | "tie");
          }
        } catch {
          /* el voto ya está registrado aunque el ELO falle */
        }
      }
    }

    batallas!.delete(battleId);

    const A = getModel(registro.aId);
    const B = getModel(registro.bId);
    return jsonCors({
      ok: true,
      battleId,
      winner,
      duplicado: Boolean(existente),
      revelacion: {
        a: A ? { id: A.id, name: A.name, provider: A.provider, elo: A.elo } : { id: registro.aId },
        b: B ? { id: B.id, name: B.name, provider: B.provider, elo: B.elo } : { id: registro.bId },
      },
      mensaje:
        winner === "tie"
          ? "Empate registrado."
          : winner === "bad"
            ? "Feedback registrado."
            : `Voto registrado: gana ${winner === "A" ? "A" : "B"}.`,
    });
  } catch {
    return jsonCors({ ok: false, error: "No se pudo registrar el voto." }, 500);
  }
}
