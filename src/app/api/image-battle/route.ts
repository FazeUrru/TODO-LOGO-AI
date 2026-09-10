import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { ipDeHeader, acumular, GEN_LIMITE, segundosRestantes } from "@/lib/rate-limit";
import { sortearDuoImagen, selloDe } from "@/lib/arena-imagen";

export const maxDuration = 60;

const SUPPORTED_SIZES = new Set([
  "1024x1024",
  "768x1344",
  "864x1152",
  "1344x768",
  "1152x864",
  "1440x720",
  "720x1440",
]);

/**
 * v1.19.0 — Batalla ciega de la arena de imágenes: POST /api/image-battle.
 *
 * El mismo prompt viaja a DOS generadores sorteados del catálogo (anónimos
 * hasta el voto), cada uno con su sello de estilo real. Devuelve las dos
 * imágenes y los IDs — el cliente los mantiene en anonato hasta que el
 * usuario vota, y entonces /api/vote con category="imagen" mueve el ELO
 * SEPARADO de la arena (tabla EloArena), jamás el de texto.
 */
export async function POST(req: NextRequest) {
  // La generación doble es la ruta más cara del arena: rate-limit propio
  const ip = ipDeHeader(req.headers.get("x-forwarded-for"));
  if (!acumular(`imagen-duelo:${ip}`, GEN_LIMITE, Date.now())) {
    return NextResponse.json(
      { error: "Demasiados duelos de imagen desde tu IP. Espera unos minutos e inténtalo de nuevo." },
      { status: 429, headers: { "Retry-After": String(segundosRestantes(GEN_LIMITE)) } }
    );
  }

  let body: { prompt?: string; size?: string };
  try {
    body = (await req.json()) as { prompt?: string; size?: string };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").trim();
  if (prompt.length < 4) {
    return NextResponse.json(
      { error: "Describe la escena que competirán los dos generadores (mínimo 4 caracteres)." },
      { status: 400 }
    );
  }
  if (prompt.length > 4000) {
    return NextResponse.json(
      { error: "El prompt no puede superar los 4000 caracteres." },
      { status: 400 }
    );
  }
  const size = (SUPPORTED_SIZES.has(body.size ?? "") ? body.size : "1024x1024") as
    | "1024x1024"
    | "768x1344"
    | "864x1152"
    | "1344x768"
    | "1152x864"
    | "1440x720"
    | "720x1440";

  const [modeloA, modeloB] = sortearDuoImagen();
  const battleId = `bti_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const zai = await ZAI.create();

    const generar = async (modelId: string): Promise<string | null> => {
      const promptFinal = `${prompt}. ${selloDe(modelId)}`.trim();
      const res = (await Promise.race([
        zai.images.generations.create({ prompt: promptFinal, size }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 50_000)),
      ])) as { data?: { base64?: string }[] } | null;
      const b64 = res?.data?.[0]?.base64;
      if (!b64) return null;
      const dir = path.join(process.cwd(), "public", "generated");
      fs.mkdirSync(dir, { recursive: true });
      const name = `duelo_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}.png`;
      fs.writeFileSync(path.join(dir, name), Buffer.from(b64, "base64"));
      return `/generated/${name}`;
    };

    // Ambos generadores en paralelo: la espera es la del más lento
    const [urlA, urlB] = await Promise.all([generar(modeloA.id), generar(modeloB.id)]);
    if (!urlA || !urlB) {
      return NextResponse.json(
        { error: "Uno de los generadores no respondió a tiempo. Inténtalo de nuevo: el sorteo será distinto." },
        { status: 504 }
      );
    }

    return NextResponse.json({
      ok: true,
      battleId,
      prompt,
      size,
      aId: modeloA.id,
      bId: modeloB.id,
      aUrl: urlA,
      bUrl: urlB,
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo iniciar el duelo de imagen. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
