/**
 * CORS de la API pública v2 (v1.20.0): la lectura es abierta a CUALQUIER
 * origen — un ranking de arena no es un secreto — y las rutas de escritura
 * (battle/vote) aceptan `X-Api-Key` + `Content-Type` desde cualquier dominio.
 * El límite real no lo pone el CORS (nunca fue una barrera de seguridad) sino
 * la clave personal y su rate-limit (apikeys.ts).
 */

import { NextResponse } from "next/server";

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Api-Key",
  "Access-Control-Max-Age": "86400",
  "Cache-Control": "no-store",
};

/** Respuesta JSON con CORS abierto (lectura pública). */
export function jsonCors(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: CORS_HEADERS });
}

/** Preflight CORS estándar — cada ruta lo expone vía `export { OPTIONS }`. */
export function preflightCors(): NextResponse {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
