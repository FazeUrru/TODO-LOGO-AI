import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { ipDeHeader, acumular, GEN_LIMITE, segundosRestantes } from "@/lib/rate-limit";
import { guardarVideoLocal } from "@/lib/guardar-video";

export const maxDuration = 300;

/**
 * POST /api/video — Modo Cine (v1.15.0, Labs): generación de vídeo REAL.
 *
 * Motor: la generación de vídeo del SDK de Z.ai (CogVideoX), con prompts
 * enriquecidos por el «motor rotativo»: cada petición rota el estilo del
 * enriquecimiento entre los referentes del catálogo actual (Seedance 2.5,
 * Veo 3.1, Kling 3.0 Turbo…), igual que el compositor cambia de modelo.
 * El vídeo producido es real: mp4 descargable con audio.
 *
 * Body: { prompt: string, duracion?: 5 | 10 }
 * Respuesta:
 *  - { ok: true, url, motor, segundos }                       → listo
 *  - { ok: true, pending: true, taskId, motor }               → seguir en /api/video/status
 *  - { ok: false, error }                                     → fallo
 */

/** Motores de enriquecimiento rotativo — reflejan el catálogo v1.15.0. */
const MOTORES = [
  {
    id: "seedance-2.5",
    nombre: "Seedance 2.5",
    estilo:
      "dynamic multi-shot cinematography, bold camera movement, vibrant production design, native synchronized audio",
  },
  {
    id: "veo-3.1",
    nombre: "Veo 3.1",
    estilo:
      "photorealistic outdoor scene, natural lighting, physically accurate motion, ambient native audio",
  },
  {
    id: "kling-3.0-turbo",
    nombre: "Kling 3.0 Turbo",
    estilo:
      "cinematic image-to-video feel, smooth coherent camera pan, believable physics, shallow depth of field",
  },
  {
    id: "sora-2",
    nombre: "Sora 2",
    estilo:
      "cinematic realism, filmic grade, expressive details, story-driven single take",
  },
  {
    id: "runway-gen-4.5",
    nombre: "Runway Gen-4.5",
    estilo:
      "consistent character reference, editorial color palette, controlled studio-like staging",
  },
  {
    id: "wan-3.0",
    nombre: "Wan 3.0",
    estilo:
      "open-weights aesthetic, crisp short take, clean composition, natural motion",
  },
] as const;

export async function consultarTarea(taskId: string) {
  const zai = await ZAI.create();
  const r = (await zai.async.result.query(taskId)) as {
    task_status?: string;
    video_result?: { url: string }[];
    video_url?: string;
    url?: string;
  };
  const url = r.video_result?.[0]?.url ?? r.video_url ?? r.url ?? null;
  return { estado: r.task_status ?? "PROCESSING", url };
}

export async function POST(req: NextRequest) {
  const ip = ipDeHeader(req.headers.get("x-forwarded-for"));
  if (!acumular(`video:${ip}`, GEN_LIMITE, Date.now())) {
    return NextResponse.json(
      { ok: false, error: "Demasiados vídeos desde tu IP. Espera unos minutos." },
      { status: 429, headers: { "Retry-After": String(segundosRestantes(GEN_LIMITE)) } }
    );
  }

  let body: { prompt?: string; duracion?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").trim();
  const duracion = body.duracion === 10 ? 10 : 5;
  if (prompt.length < 6) {
    return NextResponse.json(
      { ok: false, error: "Describe la escena que quieres rodar (mínimo 6 caracteres)." },
      { status: 400 }
    );
  }

  const motor = MOTORES[Math.floor(Date.now() / 1000) % MOTORES.length];
  const promptFinal = `${prompt}. Style: ${motor.estilo}.`;

  try {
    const zai = await ZAI.create();
    const tarea = (await zai.video.generations.create({
      prompt: promptFinal,
      quality: "quality",
      with_audio: true,
      watermark_enabled: false,
      size: "1280x720",
      fps: 30,
      duration: duracion,
    })) as { id?: string; task_status?: string };

    if (!tarea?.id) {
      return NextResponse.json(
        { ok: false, error: "El estudio de vídeo no aceptó la tarea. Inténtalo de nuevo." },
        { status: 502 }
      );
    }

    // Sondeo interno: la generación real tarda 1-4 min. Dentro del límite
    // de la función (Fluid 300 s) esperamos hasta ~240 s con cortesía de 4 s.
    const limite = Date.now() + 240_000;
    while (Date.now() < limite) {
      await new Promise((r) => setTimeout(r, 4_000));
      const { estado, url } = await consultarTarea(tarea.id);
      if (estado === "SUCCESS" && url) {
        const local = await guardarVideoLocal(url);
        return NextResponse.json({
          ok: true,
          url: local ?? url,
          motor: motor.nombre,
          motorId: motor.id,
          segundos: duracion,
          taskId: tarea.id,
        });
      }
      if (estado === "FAIL") break;
    }

    // Sin sitio para terminar: devolvemos la tarea para sondeo externo.
    return NextResponse.json({
      ok: true,
      pending: true,
      taskId: tarea.id,
      motor: motor.nombre,
      motorId: motor.id,
      segundos: duracion,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "El rodaje no pudo iniciarse. Inténtalo en unos minutos." },
      { status: 500 }
    );
  }
}
