import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";
import { ipDeHeader, acumular, GEN_LIMITE, segundosRestantes } from "@/lib/rate-limit";
import { CARTA_VERDAD_BREVE } from "@/lib/ai-conducta";

export const maxDuration = 120;

/**
 * POST /api/tts — Estudio de audio (v1.15.0, Labs): locución REAL.
 *
 * Dos caminos:
 *  - { texto }        → se narra el texto tal cual.
 *  - { tema, formato }→ un LLM escribe primero el guion (micro-podcast,
 *                       anuncio o cuento) y se narra el resultado.
 * Motor: audio.tts del SDK de Z.ai. Voz seleccionable; el mp4/mp3 queda
 * servido desde /generated para poder descargarlo.
 */

const VOCES = ["tongtong", "chuichui", "xiaochen", "jam", "kazi", "douji", "luodo"] as const;

const GUIONES: Record<string, string> = {
  podcast:
    "Escribe un micro-podcast de ~150 palabras en español, tono cercano y experto, con un gancho inicial, dos ideas claras y un cierre memorable. Solo el texto que se dirá en voz alta, sin títulos ni acotaciones.",
  anuncio:
    "Escribe el texto de un anuncio de radio de ~80 palabras en español sobre el tema dado: voz en off potente, frases cortas y un cierre con llamada a la acción. Solo el texto que se dirá, sin acotaciones.",
  cuento:
    "Escribe un micro-cuento de ~130 palabras en español, evocador y con ritmo para ser escuchado, sobre el tema dado. Solo el texto narrado, sin título ni acotaciones.",
};

export async function POST(req: NextRequest) {
  const ip = ipDeHeader(req.headers.get("x-forwarded-for"));
  if (!acumular(`tts:${ip}`, GEN_LIMITE, Date.now())) {
    return NextResponse.json(
      { ok: false, error: "Demasiados audios desde tu IP. Espera unos minutos." },
      { status: 429, headers: { "Retry-After": String(segundosRestantes(GEN_LIMITE)) } }
    );
  }

  let body: { texto?: string; tema?: string; formato?: string; voz?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  const voz = (VOCES as readonly string[]).includes(body.voz ?? "")
    ? (body.voz as string)
    : "tongtong";
  let texto = (body.texto ?? "").trim();

  try {
    const zai = await ZAI.create();

    // Sin texto pero con tema: primero guion con IA (modelo por defecto del SDK).
    if (texto.length < 12) {
      const tema = (body.tema ?? "").trim();
      if (tema.length < 4) {
        return NextResponse.json(
          { ok: false, error: "Escribe un texto para narrar o un tema para el guion." },
          { status: 400 }
        );
      }
      const sistema =
        GUIONES[body.formato ?? "podcast"] ?? GUIONES.podcast;
      const chat = await zai.chat.completions.create({
        messages: [
          { role: "system", content: `${sistema} ${CARTA_VERDAD_BREVE}` },
          { role: "user", content: `Tema: ${tema}` },
        ],
        thinking: { type: "disabled" },
      });
      texto = (chat.choices?.[0]?.message?.content ?? "").trim();
      texto = texto.replace(/^["“»]|["”«]$/g, "").slice(0, 1_800);
      if (texto.length < 12) {
        return NextResponse.json(
          { ok: false, error: "No se pudo escribir el guion. Reformula el tema." },
          { status: 502 }
        );
      }
    }

    const ttsRes = await zai.audio.tts.create({
      input: texto.slice(0, 1_800),
      voice: voz,
      response_format: "mp3",
    });

    const buf = Buffer.from(await ttsRes.arrayBuffer());
    if (buf.length < 500) {
      return NextResponse.json(
        { ok: false, error: "La locución llegó vacía. Inténtalo de nuevo." },
        { status: 502 }
      );
    }
    const dir = path.join(process.cwd(), "public", "generated");
    fs.mkdirSync(dir, { recursive: true });
    const name = `aud_${Date.now().toString(36)}.mp3`;
    fs.writeFileSync(path.join(dir, name), buf);

    return NextResponse.json({ ok: true, url: `/generated/${name}`, texto, voz });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudo generar la locución. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}
