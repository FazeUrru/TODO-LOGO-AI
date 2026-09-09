import { NextResponse } from "next/server";
import { currentUser, profileFromDb, SESSION_COOKIE, readSessionToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { db as prisma } from "@/lib/db";
import { ensureSchema } from "@/lib/db-init";
import { diffProfile, sanitizeProfile } from "@/lib/profile-shared";

/** GET /api/auth/me — usuario de la sesión + su perfil (15 ajustes). */
export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ ok: true, user: null, profile: null });
    const row = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        displayName: true,
        username: true,
        bio: true,
        avatar: true,
        accent: true,
        pronouns: true,
        location: true,
        website: true,
        focus: true,
        publicProfile: true,
        showStats: true,
        showTrophies: true,
        weeklyDigest: true,
        newModelsAlert: true,
        arenaInvites: true,
        profileAt: true,
      },
    });
    return NextResponse.json({
      ok: true,
      user,
      profile: row ? profileFromDb(row) : null,
    });
  } catch {
    return NextResponse.json({ ok: true, user: null, profile: null });
  }
}

/** PATCH /api/auth/me — autoguardado del perfil (15 ajustes, saneados). */
export async function PATCH(request: Request) {
  try {
    const jar = await cookies();
    const userId = readSessionToken(jar.get(SESSION_COOKIE)?.value);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "sin-sesion" }, { status: 401 });
    }
    const body = await request.json().catch(() => null);
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ ok: false, error: "cuerpo-invalido" }, { status: 400 });
    }
    const p = sanitizeProfile(body);
    const profileAt = new Date();

    // Historial del perfil en la nube (v1.12.0): versión previa para el diff
    const prevRow = await prisma.user
      .findUnique({
        where: { id: userId },
        select: {
          displayName: true,
          username: true,
          bio: true,
          avatar: true,
          accent: true,
          pronouns: true,
          location: true,
          website: true,
          focus: true,
          publicProfile: true,
          showStats: true,
          showTrophies: true,
          weeklyDigest: true,
          newModelsAlert: true,
          arenaInvites: true,
          profileAt: true,
        },
      })
      .catch(() => null);

    await prisma.user.update({
      where: { id: userId },
      data: {
        displayName: p.displayName,
        username: p.username,
        bio: p.bio,
        avatar: p.avatar,
        accent: p.accent,
        pronouns: p.pronouns,
        location: p.location,
        website: p.website,
        focus: p.focus,
        publicProfile: p.publicProfile,
        showStats: p.showStats,
        showTrophies: p.showTrophies,
        weeklyDigest: p.weeklyDigest,
        newModelsAlert: p.newModelsAlert,
        arenaInvites: p.arenaInvites,
        profileAt,
      },
    });

    // Registrar los campos que cambiaron (máx. 16 por guardado; nunca rompe
    // el autoguardado). Primer guardado conocido → evento único de sincronía.
    try {
      const prev = prevRow ? profileFromDb(prevRow) : null;
      const cambiados = prev ? diffProfile(prev, p) : [];
      await ensureSchema();
      if (!prev) {
        await prisma.profileEvent.create({
          data: { userId, campo: "perfil", detalle: "Perfil sincronizado con la nube" },
        });
      } else if (cambiados.length > 0) {
        await prisma.profileEvent.createMany({
          data: cambiados.slice(0, 16).map((campo) => ({
            userId,
            campo,
            detalle: "Ajuste actualizado",
          })),
        });
      }
    } catch {
      /* el historial es accesorio: nunca rompe el autoguardado */
    }

    return NextResponse.json({ ok: true, profile: { ...p, savedAt: profileAt.getTime() } });
  } catch {
    return NextResponse.json({ ok: false, error: "error-interno" }, { status: 500 });
  }
}
