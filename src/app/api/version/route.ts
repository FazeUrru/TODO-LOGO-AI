import { NextResponse } from "next/server";
import { APP_VERSION, APP_BUILD_DATE } from "@/lib/version";

export const dynamic = "force-dynamic";

/**
 * Punto de control de versión para el sistema de actualización (v1.14.0).
 * El cliente (UpdateGate) compara la versión de su bundle con la del
 * servidor: si el servidor va por delante, hay un despliegue nuevo y se
 * ofrece — y luego exige — la actualización. Sin tocar la base de datos,
 * pensado para sondear cada pocos minutos.
 */
export async function GET() {
  return NextResponse.json(
    {
      service: "todologo-ai",
      version: APP_VERSION,
      buildDate: APP_BUILD_DATE,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
