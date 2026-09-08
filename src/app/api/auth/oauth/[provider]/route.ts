import { NextRequest, NextResponse } from "next/server";
import {
  OAUTH_STATE_COOKIE,
  newState,
  oauthConfig,
  redirectUri,
} from "@/lib/oauth";

export const dynamic = "force-dynamic";

/**
 * Inicio del flujo OAuth 2.0 nativo: GET /api/auth/oauth/{provider}
 * Redirige a la pantalla de consentimiento del proveedor. Si el entorno no
 * define credenciales, responde 501 con la guía de configuración.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const cfg = oauthConfig(provider);

  if (!cfg) {
    return NextResponse.json(
      {
        ok: false,
        error: `OAuth nativo de ${provider} no configurado en este entorno.`,
        setup: [
          `Crea las credenciales OAuth en la consola de ${provider}.`,
          `Registra la URI de retorno: ${redirectUri(req, provider)}`,
          `Define las variables ${
            provider === "google" ? "GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET" : "GITHUB_CLIENT_ID y GITHUB_CLIENT_SECRET"
          } y reinicia.`,
        ],
      },
      { status: 501 }
    );
  }

  const state = newState();
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: redirectUri(req, provider),
    response_type: "code",
    scope: cfg.scope,
    state,
  });

  const res = NextResponse.redirect(`${cfg.authUrl}?${params.toString()}`);
  res.cookies.set(OAUTH_STATE_COOKIE, `${provider}:${state}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
