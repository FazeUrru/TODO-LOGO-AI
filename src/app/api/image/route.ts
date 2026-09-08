import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";
import crypto from "crypto";

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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { prompt?: string; size?: string };
    const prompt = (body.prompt ?? "").trim();
    const size = (SUPPORTED_SIZES.has(body.size ?? "") ? body.size : "1024x1024") as
      | "1024x1024"
      | "768x1344"
      | "864x1152"
      | "1344x768"
      | "1152x864"
      | "1440x720"
      | "720x1440";

    if (prompt.length < 3) {
      return NextResponse.json(
        { ok: false, error: "Describe qué imagen quieres (mínimo 3 caracteres)." },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();
    const res = (await Promise.race([
      zai.images.generations.create({ prompt, size }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 50_000)),
    ])) as { data?: { base64?: string }[] } | null;

    const b64 = res?.data?.[0]?.base64;
    if (!b64) {
      return NextResponse.json(
        { ok: false, error: "El generador de imágenes no respondió a tiempo. Prueba otra vez." },
        { status: 504 }
      );
    }

    const dir = path.join(process.cwd(), "public", "generated");
    fs.mkdirSync(dir, { recursive: true });
    const name = `img_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}.png`;
    fs.writeFileSync(path.join(dir, name), Buffer.from(b64, "base64"));

    return NextResponse.json({ ok: true, url: `/generated/${name}`, prompt, size });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudo generar la imagen. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
