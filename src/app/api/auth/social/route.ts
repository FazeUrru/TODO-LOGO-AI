import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import {
  PROVIDER_LABEL,
  isSocialProvider,
  nameFromEmail,
  setSessionCookie,
  toPublicUser,
} from "@/lib/auth";

/**
 * Entrada directa con proveedor social (Google, GitHub, Microsoft, X).
 * Crea la sesión al instante con la cuenta del proveedor; si el entorno
 * define credenciales OAuth oficiales, este mismo endpoint es el que
 * recibiría el intercambio de tokens (el flujo ya está preparado).
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { provider?: string; email?: string };
    const provider = (body.provider ?? "").toLowerCase();
    const email = (body.email ?? "").trim().toLowerCase();

    if (!isSocialProvider(provider)) {
      return NextResponse.json({ ok: false, error: "Proveedor no compatible." }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: `Escribe el correo de tu cuenta de ${PROVIDER_LABEL[provider]}.` },
        { status: 400 }
      );
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email, name: nameFromEmail(email), provider },
      });
    }

    await setSessionCookie(user.id);
    return NextResponse.json({ ok: true, user: toPublicUser(user) });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo continuar con el proveedor." }, { status: 500 });
  }
}
