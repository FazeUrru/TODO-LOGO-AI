import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import {
  hashPassword,
  nameFromEmail,
  setSessionCookie,
  toPublicUser,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { name?: string; email?: string; password?: string };
    const name = (body.name ?? "").trim();
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    if (name.length < 2) {
      return NextResponse.json({ ok: false, error: "Tu nombre debe tener al menos 2 letras." }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Escribe un correo válido." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ ok: false, error: "La contraseña necesita 6 caracteres o más." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Ya existe una cuenta con ese correo. Inicia sesión." },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: { email, name, passwordHash: hashPassword(password), provider: "email" },
    });
    await setSessionCookie(user.id);
    return NextResponse.json({ ok: true, user: toPublicUser(user) });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo crear la cuenta." }, { status: 500 });
  }
}
