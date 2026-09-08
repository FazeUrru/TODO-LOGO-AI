import { randomBytes } from "crypto";

/**
 * OAuth 2.0 nativo (opcional) para todólogo.ai.
 *
 * El flujo de autorización + callback está implementado de verdad
 * (Authorization Code con state CSRF). Se activa automáticamente en cuanto
 * el entorno define las credenciales del proveedor — solo el propietario
 * puede crearlas:
 *
 *   Google : GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET
 *            (https://console.cloud.google.com/apis/credentials)
 *   GitHub : GITHUB_CLIENT_ID + GITHUB_CLIENT_SECRET
 *            (https://github.com/settings/developers)
 *
 * Redirect URI a registrar en cada consola:
 *   {origin}/api/auth/oauth/google/callback
 *   {origin}/api/auth/oauth/github/callback
 */

export const OAUTH_STATE_COOKIE = "todologo_oauth_state";

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  scope: string;
}

export function oauthConfig(provider: string): OAuthConfig | null {
  switch (provider) {
    case "google":
      return process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ? {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
            tokenUrl: "https://oauth2.googleapis.com/token",
            scope: "openid email profile",
          }
        : null;
    case "github":
      return process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
        ? {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            authUrl: "https://github.com/login/oauth/authorize",
            tokenUrl: "https://github.com/login/oauth/access_token",
            scope: "read:user user:email",
          }
        : null;
    default:
      return null;
  }
}

/** Estado CSRF de un solo uso para proteger el flujo. */
export function newState(): string {
  return randomBytes(16).toString("hex");
}

/** URI de retorno registrada en la consola del proveedor. */
export function redirectUri(req: Request, provider: string): string {
  const url = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
  return `${proto}://${host}/api/auth/oauth/${provider}/callback`;
}

/** Perfil normalizado del proveedor → usuario local. */
export interface OAuthProfile {
  email: string;
  name: string | null;
}

export async function fetchGoogleProfile(accessToken: string): Promise<OAuthProfile | null> {
  const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { email?: string; name?: string; email_verified?: boolean };
  if (!data.email) return null;
  return { email: data.email.toLowerCase(), name: data.name ?? null };
}

export async function fetchGithubProfile(accessToken: string): Promise<OAuthProfile | null> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
  };
  const res = await fetch("https://api.github.com/user", { headers });
  if (!res.ok) return null;
  const user = (await res.json()) as { email?: string | null; name?: string | null; login?: string };

  if (user.email) return { email: user.email.toLowerCase(), name: user.name ?? user.login ?? null };

  // El correo primario puede estar privado: endpoint dedicado
  const resEmails = await fetch("https://api.github.com/user/emails", { headers });
  if (resEmails.ok) {
    const emails = (await resEmails.json()) as { email: string; primary: boolean; verified: boolean }[];
    const primary = emails.find((e) => e.primary && e.verified) ?? emails[0];
    if (primary?.email) return { email: primary.email.toLowerCase(), name: user.name ?? user.login ?? null };
  }
  return null;
}

export async function exchangeCode(
  cfg: OAuthConfig,
  code: string,
  redirect: string
): Promise<string | null> {
  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      code,
      redirect_uri: redirect,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}
