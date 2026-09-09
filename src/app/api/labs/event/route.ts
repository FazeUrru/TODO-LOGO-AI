import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/db-init";
import { featurePorId, TIPOS_EVENTO } from "@/lib/labs";
import { acumular, ipDeHeader, segundosRestantes, GEN_LIMITE } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/labs/event — telemetría estructurada del Canal Labs (v1.14.0).
 * Body: { featureId, tipo: "entered"|"used"|"abandoned"|"crashed", payload? }.
 * Best-effort por diseño del cliente; aquí validamos feature, tipo y rate.
 * El usuario es el de la sesión o «anon» (telemetría anónima, lo declara la UI).
 */
export async function POST(req: NextRequest) {
  // Rate-limit generoso: la telemetría no puede ser un canal de abuso
  const ip = ipDeHeader(req.headers.get("x-forwarded-for"));
  if (!acumular(`labs:${ip}`, GEN_LIMITE, Date.now())) {
    return NextResponse.json(
      { ok: false, error: "rate-limited", retryAfter: segundosRestantes(GEN_LIMITE) },
      { status: 429, headers: { "Retry-After": String(segundosRestantes(GEN_LIMITE)) } }
    );
  }

  let body: { featureId?: string; tipo?: string; payload?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "json-invalido" }, { status: 400 });
  }

  const featureId = String(body.featureId ?? "");
  const tipo = String(body.tipo ?? "");
  if (!featurePorId(featureId)) {
    return NextResponse.json({ ok: false, error: "feature-desconocida" }, { status: 404 });
  }
  if (!TIPOS_EVENTO.includes(tipo as never)) {
    return NextResponse.json({ ok: false, error: "tipo-invalido" }, { status: 400 });
  }

  const user = await currentUser().catch(() => null);
  const payload =
    body.payload === undefined ? null : String(JSON.stringify(body.payload)).slice(0, 2000);

  try {
    await ensureSchema();
    await db.labsEvent.create({
      data: {
        featureId,
        userId: user?.id ?? "anon",
        tipo,
        payload,
      },
    });
  } catch {
    // base caída: la telemetría nunca rompe la experiencia
  }

  return NextResponse.json({ ok: true });
}
