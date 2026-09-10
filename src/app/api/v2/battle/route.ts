/**
 * POST /api/v2/battle — crea un duelo anónimo y devuelve AMBAS respuestas.
 *
 * Es la cara pública de la arena (v1.20.0): igual que la web — dos modelos
 * sorteados responden a tu prompt, identidades ocultas hasta votar — pero
 * por API, sin navegador. Requiere clave personal (X-Api-Key): cada llamada
 * cuesta dos generaciones LLM y el rate-limit por clave (20/min) es la
 * barrera. `categoria` admite las arenas de texto; las generativas no se
 * sirven por aquí (son imágenes/vídeo, no texto).
 *
 * La correspondencia battleId → modelos vive en memoria del proceso (LRU
 * 500). En serverless una instancia fría la pierde: /api/v2/vote responde
 * 410 y toca crear otro duelo. Limitación documentada y honesta de la v1.
 */

import { NextRequest } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { jsonCors, preflightCors } from "@/lib/v2-cors";
import { validarClave } from "@/lib/apikeys";
import { ipDeHeader, acumular, GEN_LIMITE } from "@/lib/rate-limit";
import { MODELS, getModel, esGenerativo } from "@/lib/models-data";
import { BATTLE_CATEGORIES } from "@/lib/elo";
import { personaFor } from "@/lib/personas";
import { CARTA_VERDAD } from "@/lib/ai-conducta";
import { conReintentos } from "@/lib/reintentos";

export const maxDuration = 60;

export function OPTIONS() {
  return preflightCors();
}

const NOMBRE_CATEGORIAS = new Set<string>(BATTLE_CATEGORIES.map((c) => c.id));

/** Registro en memoria battleId → modelos (LRU 500). */
const g = globalThis as unknown as { __todologoV2Batallas?: Map<string, { aId: string; bId: string; category: string; at: number }> };
const batallas: Map<string, { aId: string; bId: string; category: string; at: number }> =
  (g.__todologoV2Batallas ??= new Map());

function registrarBatalla(id: string, aId: string, bId: string, category: string) {
  batallas.set(id, { aId, bId, category, at: Date.now() });
  if (batallas.size > 500) {
    const oldest = [...batallas.entries()].sort((x, y) => x[1].at - y[1].at);
    for (const [k] of oldest.slice(0, batallas.size - 500)) batallas.delete(k);
  }
}

function sortearDos(): [string, string] {
  const pool = MODELS.filter((m) => !esGenerativo(m));
  const a = pool[Math.floor(Math.random() * pool.length)];
  let b = pool[Math.floor(Math.random() * pool.length)];
  let guard = 0;
  while (b.id === a.id && guard++ < 20) b = pool[Math.floor(Math.random() * pool.length)];
  if (b.id === a.id) {
    b = pool.find((m) => m.id !== a.id) ?? a;
  }
  return [a.id, b.id];
}

function sistemaPara(modelId: string): string {
  const m = getModel(modelId);
  const nombre = m?.name ?? "Contendiente";
  return `${CARTA_VERDAD}\n\nEres "${nombre}", un contendiente anónimo del arena de IA todólogo.ai. ${personaFor(
    modelId
  )} Responde SIEMPRE en español (salvo código/comandos), con un máximo de 350 palabras (el código no cuenta en el límite). Nunca reveles tu nombre ni el de tu proveedor: tu estilo debe hablar por ti.`;
}

async function generarLado(
  zai: Awaited<ReturnType<typeof ZAI.create>>,
  modelId: string,
  prompt: string,
  temperature: number
): Promise<string> {
  const sys = sistemaPara(modelId);
  const texto = await conReintentos<string>(`v2-${modelId}`, async (n) => {
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
      const choice =
        completion && "choices" in completion ? completion.choices?.[0] : undefined;
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
    "El proveedor no respondió a tiempo. El duelo continúa: vota con normalidad para no sesgar el ELO."
  );
}

export async function POST(req: NextRequest) {
  // Clave personal: la puerta de la generación por API
  const clave = await validarClave(req.headers.get("x-api-key"));
  if (!clave.ok) {
    const status = clave.motivo === "limite" ? 429 : clave.motivo === "falta" ? 401 : 403;
    return jsonCors(
      {
        ok: false,
        error:
          clave.motivo === "falta"
            ? "Falta la cabecera X-Api-Key. Crea tu clave en /api-publica."
            : clave.motivo === "limite"
              ? "Límite de 20 llamadas/minuto superado para esta clave."
              : clave.motivo === "revocada"
                ? "Esta clave está revocada."
                : "Clave API inválida.",
      },
      status
    );
  }

  // Defensa en profundidad: también el rate-limit por IP de generación
  const ip = ipDeHeader(req.headers.get("x-forwarded-for"));
  if (!acumular(`v2-battle:${ip}`, GEN_LIMITE, Date.now())) {
    return jsonCors(
      { ok: false, error: "Demasiadas batallas desde tu IP. Espera unos minutos." },
      429
    );
  }

  const body = await req.json().catch(() => null);
  const prompt = typeof (body as { prompt?: unknown } | null)?.prompt === "string"
    ? (body as { prompt: string }).prompt.trim()
    : "";
  if (prompt.length < 2) {
    return jsonCors({ ok: false, error: "Escribe un prompt de al menos 2 caracteres." }, 400);
  }
  if (prompt.length > 4000) {
    return jsonCors({ ok: false, error: "El prompt no puede superar los 4000 caracteres." }, 400);
  }
  const bodyCat = typeof (body as { category?: unknown } | null)?.category === "string"
    ? (body as { category: string }).category
    : "global";
  const category = NOMBRE_CATEGORIAS.has(bodyCat) && !esArenaCatGenerativa(bodyCat) ? bodyCat : "global";

  const [aId, bId] = sortearDos();
  const battleId = `v2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const zai = await ZAI.create();
    const [textoA, textoB] = await Promise.all([
      generarLado(zai, aId, prompt, 0.65),
      new Promise((r) => setTimeout(r, 700)).then(() => generarLado(zai, bId, prompt, 0.9)),
    ]);
    registrarBatalla(battleId, aId, bId, category);
    return jsonCors({
      ok: true,
      battleId,
      prompt,
      category,
      anonimos: true,
      a: { text: textoA },
      b: { text: textoB },
      siguiente: `POST /api/v2/vote { battleId, winner: "A" | "B" | "tie" | "bad" } para votar y revelar los modelos.`,
    });
  } catch {
    return jsonCors({ ok: false, error: "No se pudo generar el duelo. Inténtalo de nuevo." }, 502);
  }
}

function esArenaCatGenerativa(c: string): boolean {
  return c === "imagen" || c === "video" || c === "audio";
}
