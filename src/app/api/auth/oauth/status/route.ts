import { NextResponse } from "next/server";
import { oauthConfig } from "@/lib/oauth";

/** Indica qué proveedores tienen OAuth nativo activo en este entorno. */
export async function GET() {
  return NextResponse.json({
    google: oauthConfig("google") !== null,
    github: oauthConfig("github") !== null,
  });
}
