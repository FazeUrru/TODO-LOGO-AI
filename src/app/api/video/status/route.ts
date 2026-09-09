import { NextRequest, NextResponse } from "next/server";
import { consultarTarea } from "../route";

export const maxDuration = 60;

/**
 * GET /api/video/status?id=<taskId> — sondeo externo del Modo Cine (v1.15.0).
 * Cuando el POST inicial se queda sin tiempo de función, el cliente sigue
 * aquí: misma tarea, mismo motor, misma descarga local al terminar.
 */
export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get("id") ?? "";
  if (!taskId) {
    return NextResponse.json({ ok: false, error: "Falta el id de la tarea." }, { status: 400 });
  }

  try {
    const { estado, url } = await consultarTarea(taskId);
    if (estado === "SUCCESS" && url) {
      // Reutilizamos la descarga local del route principal vía import dinámico
      const { guardarVideoLocal } = await import("@/lib/guardar-video");
      const local = await guardarVideoLocal(url);
      return NextResponse.json({ ok: true, ready: true, url: local ?? url });
    }
    if (estado === "FAIL") {
      return NextResponse.json({ ok: true, ready: false, failed: true });
    }
    return NextResponse.json({ ok: true, ready: false });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudo consultar la tarea." },
      { status: 502 }
    );
  }
}
