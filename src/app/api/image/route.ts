import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { ipDeHeader, acumular, GEN_LIMITE, segundosRestantes } from "@/lib/rate-limit";
import { conReintentos } from "@/lib/reintentos";

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
  // Rate-limit (v1.13.0): la generación de imágenes es la ruta más cara
  const ip = ipDeHeader(req.headers.get("x-forwarded-for"));
  if (!acumular(`imagen:${ip}`, GEN_LIMITE, Date.now())) {
    return NextResponse.json(
      { error: "Demasiadas imágenes desde tu IP. Espera unos minutos e inténtalo de nuevo." },
      { status: 429, headers: { "Retry-After": String(segundosRestantes(GEN_LIMITE)) } }
    );
  }
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

    // v1.19.1 — motor de reintentos: hasta 50 intentos con autocorrección
    // (prompt acotado a partir del 2º) dentro del presupuesto de reloj.
    const url = await conReintentos<string>("imagen-estudio", async (n) => {
      const cuerpo = n >= 2 ? prompt.slice(0, 600) : prompt;
      const timeoutMs = n === 1 ? 25_000 : 15_000;
      const res = (await Promise.race([
        zai.images.generations.create({ prompt: cuerpo, size }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
      ])) as { data?: { base64?: string }[] } | null;
      const b64 = res?.data?.[0]?.base64;
      if (!b64) return null;
      const dir = path.join(process.cwd(), "public", "generated");
      fs.mkdirSync(dir, { recursive: true });
      const name = `img_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}.png`;
      fs.writeFileSync(path.join(dir, name), Buffer.from(b64, "base64"));
      return `/generated/${name}`;
    }, { presupuestoMs: 50_000 });

    if (!url) {
      return NextResponse.json(
        { ok: false, error: "El generador de imágenes no respondió a tiempo. Prueba otra vez." },
        { status: 504 }
      );
    }

    return NextResponse.json({ ok: true, url, prompt, size });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudo generar la imagen. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
