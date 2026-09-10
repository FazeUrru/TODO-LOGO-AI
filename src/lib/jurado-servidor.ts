/**
 * Servidor del jurado (v1.20.0): aplica el ELO de jurado a cada voto real.
 *
 * Dos responsabilidades:
 *  1. Consenso: puntuación esperada del lado A según el ELO global persistido
 *     (EloState / EloArena). Si la BD no responde, cae a la ficha estática —
 *     el voto nunca se pierde por un fallo de consenso.
 *  2. Persistencia: con sesión iniciada el estado vive en la tabla UserElo
 *     (ranking público de jurados); sin sesión se calcula igualmente y el
 *     cliente lo guarda en su localStorage — nadie se queda sin escalera.
 *
 * Usado por /api/vote, /api/tournament (vote) y /api/dia.
 */

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { readSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { getModel } from "@/lib/models-data";
import { esArenaGenerativa, ELO_BASE } from "@/lib/elo-global";
import {
  aplicarVotoJurado,
  diaUtc,
  saneaJurado,
  type EstadoJurado,
  type VotoJurado,
} from "@/lib/elo-usuario";

/** Rating persistido de un modelo en su dimensión (arena generativa o texto). */
async function ratingPersistido(modelId: string, categoria: string): Promise<number> {
  try {
    if (esArenaGenerativa(categoria)) {
      const fila = await db.eloArena.findUnique({
        where: { modelId_arena: { modelId, arena: categoria } },
      });
      return fila?.elo ?? ELO_BASE;
    }
    const fila = await db.eloState.findUnique({ where: { modelId } });
    return fila?.elo ?? getModel(modelId)?.elo ?? ELO_BASE;
  } catch {
    return getModel(modelId)?.elo ?? ELO_BASE;
  }
}

export interface ResultadoJurado {
  estado: EstadoJurado; // estado YA actualizado
  delta: number; // cambio aplicado en este voto
  acierto: boolean;
  persistido: boolean; // true = guardado en BD (con sesión)
}

/**
 * Procesa un voto para el jurado de la sesión actual (o anónima).
 * `categoria` solo distingue texto de arena generativa para el consenso.
 * Nunca lanza: un fallo de jurado no puede romper un voto.
 */
export async function procesarJurado(
  modelAId: string,
  modelBId: string,
  winner: VotoJurado,
  categoria = "global"
): Promise<ResultadoJurado | null> {
  try {
    const A = getModel(modelAId);
    const B = getModel(modelBId);
    if (!A || !B) return null;

    // ¿Hay sesión? (el usuario puede haber cerrado sesión desde el voto)
    let userId: string | null = null;
    try {
      const jar = await cookies();
      userId = readSessionToken(jar.get(SESSION_COOKIE)?.value);
    } catch {
      userId = null;
    }

    // Estado previo: BD con sesión; sin sesión, neutro (el cliente ya lleva
    // su propio historial local — la racha local sobrevive sin cuenta).
    let previo = saneaJurado(null);
    if (userId) {
      try {
        const fila = await db.userElo.findUnique({ where: { userId } });
        if (fila) {
          previo = saneaJurado({
            elo: fila.elo,
            votos: fila.votos,
            aciertos: fila.aciertos,
            racha: fila.racha,
            mejorRacha: fila.mejorRacha,
            ultimoDia: fila.ultimoDia,
          });
        }
      } catch {
        /* estado neutro */
      }
    }

    // Consenso previo del arena: ¿quién era el favorito según el ELO vivo?
    let esFavorito: boolean | null = null;
    if (winner === "A" || winner === "B") {
      const [ra, rb] = await Promise.all([
        ratingPersistido(modelAId, categoria),
        ratingPersistido(modelBId, categoria),
      ]);
      if (ra !== rb) esFavorito = winner === "A" ? ra > rb : rb > ra;
      // ELO idéntico: consenso indefinido → +4 neutro
    }

    const estado = aplicarVotoJurado(previo, winner, esFavorito, diaUtc());
    const delta = estado.elo - previo.elo;
    const acierto =
      (winner === "A" || winner === "B") && esFavorito === true;

    // Persistencia solo con sesión: el anónimo se queda en el dispositivo.
    let persistido = false;
    if (userId) {
      try {
        const datos = {
          elo: estado.elo,
          votos: estado.votos,
          aciertos: estado.aciertos,
          racha: estado.racha,
          mejorRacha: estado.mejorRacha,
          ultimoDia: estado.ultimoDia,
        };
        await db.userElo.upsert({
          where: { userId },
          create: { userId, ...datos },
          update: datos,
        });
        persistido = true;
      } catch {
        /* el voto ya está registrado; el jurado es accesorio */
      }
    }

    return { estado, delta, acierto, persistido };
  } catch {
    return null;
  }
}
