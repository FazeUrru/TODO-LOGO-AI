/**
 * GET    /api/v2/keys — lista TUS claves (enmascaradas)
 * POST   /api/v2/keys { nombre } — crea una clave (el secreto viaja UNA vez)
 * DELETE /api/v2/keys { id } — revoca una clave tuya (inmediato, no borra)
 *
 * Requiere sesión iniciada (cookie). Máx. 5 claves activas por usuario.
 */

import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/db-init";
import {
  enmascarar,
  generarSecreto,
  MAX_CLAVES_POR_USUARIO,
  type ClavePublica,
} from "@/lib/apikeys";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sin sesión iniciada." }, { status: 401 });
  try {
    await ensureSchema();
    const filas = await db.apiKey.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    const claves: ClavePublica[] = filas.map((f) => ({
      id: f.id,
      nombre: f.name,
      enmascarada: enmascarar(f.key),
      llamadas: f.calls,
      ultimoUso: f.lastUsedAt ? f.lastUsedAt.toISOString() : null,
      revocada: f.revoked,
      creada: f.createdAt.toISOString(),
    }));
    return NextResponse.json({ ok: true, claves, max: MAX_CLAVES_POR_USUARIO });
  } catch {
    return NextResponse.json({ error: "No se pudieron leer las claves." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sin sesión iniciada." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const nombre =
    typeof (body as { name?: unknown } | null)?.name === "string"
      ? (body as { name: string }).name.trim().slice(0, 40) || "Mi clave"
      : "Mi clave";
  try {
    await ensureSchema();
    const activas = await db.apiKey.count({ where: { userId: user.id, revoked: false } });
    if (activas >= MAX_CLAVES_POR_USUARIO) {
      return NextResponse.json(
        { error: `Alcanzaste el máximo de ${MAX_CLAVES_POR_USUARIO} claves activas. Revoca una para crear otra.` },
        { status: 409 }
      );
    }
    const key = generarSecreto();
    const fila = await db.apiKey.create({
      data: { key, name: nombre, userId: user.id },
    });
    return NextResponse.json({
      ok: true,
      clave: {
        id: fila.id,
        nombre: fila.name,
        secreto: key, // UNA sola vez: guárdala ya
        creada: fila.createdAt.toISOString(),
      },
      aviso: "Copia el secreto ahora: no volverá a mostrarse. Trátalo como una contraseña.",
    });
  } catch {
    return NextResponse.json({ error: "No se pudo crear la clave." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sin sesión iniciada." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const id =
    typeof (body as { id?: unknown } | null)?.id === "string" ? (body as { id: string }).id : "";
  if (!id) return NextResponse.json({ error: "Falta el id de la clave." }, { status: 400 });
  try {
    const fila = await db.apiKey.findUnique({ where: { id } });
    if (!fila || fila.userId !== user.id) {
      return NextResponse.json({ error: "Clave no encontrada." }, { status: 404 });
    }
    await db.apiKey.update({ where: { id }, data: { revoked: true } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo revocar la clave." }, { status: 500 });
  }
}
