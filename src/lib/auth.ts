import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { db as prisma } from "@/lib/db";

/**
 * Autenticación real de todólogo.ai:
 * - Contraseñas con scrypt + salt aleatoria (nunca en texto plano).
 * - Sesión firmada con HMAC-SHA256 en una cookie httpOnly de 30 días.
 * - Proveedores sociales: google, github, microsoft, x.
 */

export const SESSION_COOKIE = "todologo_sesion";
const SECRET = process.env.AUTH_SECRET ?? "todologo-secret-local-v14";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export const SOCIAL_PROVIDERS = ["google", "github", "microsoft", "x"] as const;
export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

export function isSocialProvider(v: string): v is SocialProvider {
  return (SOCIAL_PROVIDERS as readonly string[]).includes(v);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    const calc = scryptSync(password, salt, 64);
    return timingSafeEqual(Buffer.from(hash, "hex"), calc);
  } catch {
    return false;
  }
}

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 40);
}

export function createSessionToken(userId: string): string {
  const payload = `${userId}.${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, ts, sig] = parts;
  if (sign(`${userId}.${ts}`) !== sig) return null;
  if (Date.now() - Number(ts) > MAX_AGE * 1000) return null;
  return userId;
}

export async function setSessionCookie(userId: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  provider: string;
}

export function toPublicUser(u: { id: string; email: string; name: string; provider: string }): PublicUser {
  return { id: u.id, email: u.email, name: u.name, provider: u.provider };
}

/** Usuario de la sesión actual (o null). */
export async function currentUser(): Promise<PublicUser | null> {
  try {
    const jar = await cookies();
    const userId = readSessionToken(jar.get(SESSION_COOKIE)?.value);
    if (!userId) return null;
    const u = await prisma.user.findUnique({ where: { id: userId } });
    return u ? toPublicUser(u) : null;
  } catch {
    return null;
  }
}

/** Nombre amable a partir del correo (p. ej. "marta" para marta@gmail.com). */
export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "usuario";
  const clean = local.replace(/[._-]+/g, " ").trim();
  return clean
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .slice(0, 40) || "Usuario";
}

export const PROVIDER_LABEL: Record<SocialProvider, string> = {
  google: "Google",
  github: "GitHub",
  microsoft: "Microsoft",
  x: "X",
};
