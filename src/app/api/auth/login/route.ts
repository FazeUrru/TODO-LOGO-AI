import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { setSessionCookie, toPublicUser, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { ok: false, error: "Correo o contraseña incorrectos." },
        { status: 401 }
      );
    }

    await setSessionCookie(user.id);
    return NextResponse.json({ ok: true, user: toPublicUser(user) });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo iniciar sesión." }, { status: 500 });
  }
}
