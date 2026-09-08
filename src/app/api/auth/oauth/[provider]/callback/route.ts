import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db as prisma } from "@/lib/db";
import { nameFromEmail, setSessionCookie } from "@/lib/auth";
import {
  OAUTH_STATE_COOKIE,
  exchangeCode,
  fetchGithubProfile,
  fetchGoogleProfile,
  oauthConfig,
  redirectUri,
} from "@/lib/oauth";

export const dynamic = "force-dynamic";

/**
 * Callback OAuth 2.0 nativo: GET /api/auth/oauth/{provider}/callback
 * Valida el state CSRF, intercambia el código por un token de acceso,
 * obtiene el perfil real del proveedor, crea/vincula el usuario y abre
 * sesión con la misma cookie httpOnly del resto de la plataforma.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  const origin = new URL(req.url).origin;
  const fail = (reason: string) =>
    NextResponse.redirect(`${origin}/iniciar-sesion?oauth=error&motivo=${encodeURIComponent(reason)}`);

  const cfg = oauthConfig(provider);
  if (!cfg) return fail(`oauth-${provider}-no-configurado`);

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return fail("falta-codigo-o-state");

  const jar = await cookies();
  const saved = jar.get(OAUTH_STATE_COOKIE)?.value;
  jar.set(OAUTH_STATE_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  if (!saved || saved !== `${provider}:${state}`) return fail("state-invalido");

  const accessToken = await exchangeCode(cfg, code, redirectUri(req, provider));
  if (!accessToken) return fail("token-rechazado");

  const profile =
    provider === "google" ? await fetchGoogleProfile(accessToken) : await fetchGithubProfile(accessToken);
  if (!profile?.email) return fail("perfil-sin-email");

  let user = await prisma.user.findUnique({ where: { email: profile.email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name?.slice(0, 40) || nameFromEmail(profile.email),
        provider,
      },
    });
  } else if (user.provider !== provider) {
    user = await prisma.user.update({ where: { id: user.id }, data: { provider } });
  }

  await setSessionCookie(user.id);
  return NextResponse.redirect(`${origin}/?bienvenida=${encodeURIComponent(user.name)}`);
}
