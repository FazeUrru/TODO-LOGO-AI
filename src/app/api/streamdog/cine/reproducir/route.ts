import { NextResponse } from "next/server";
import { acumular, ipDeHeader, type LimiteCfg } from "@/lib/rate-limit";
import { elegirVideoArchive } from "@/lib/streamdog/cine";
import {
  archiveDescargaUrl,
  archiveMetaUrl,
  cacheGuardar,
  cacheObtener,
  idArchiveDe,
  idTvmazeDe,
  pedirFuente,
  tituloCommonsDe,
  commonsTitulosUrl,
  type RespuestaCommons,
  TOPE_FICHA_MS,
} from "@/lib/streamdog/cine-servidor";

/**
 * CINE&SERIES · /api/streamdog/cine/reproducir (v1.32.0) — el enlacesín.
 *
 * Resuelve la URL REAL y REPRODUCIBLE de un título, lista para el
 * <video> del reproductor:
 *
 *  · commons → el fichero original de Wikimedia (streaming directo,
 *              servido por sus CDNs globales, sin pasar por aquí).
 *  · archive → el mejor MP4 h.264 del ítem (derivado «512kb.mp4» de
 *              Archive: compatible con TODOS los navegadores).
 *  · tvmaze  → las series en TVMaze son metadatos: se responde con
 *              ok:false + código «sin-video» y la UI lo explica amable.
 *
 * El backend NO proxya el vídeo (la banda ancha de las películas es de
 * las CDNs de origen): solo resuelve el enlace y lo cachea 6 h.
 */

export const dynamic = "force-dynamic";

const REPRO_LIMITE: LimiteCfg = { max: 120, ventanaMs: 60_000 };
const TTL_VIDEO_MS = 6 * 60_000;

export interface RespuestaReproducir {
  ok: boolean;
  url?: string;
  mime?: string;
  /** «sin-video»: la ficha es de metadatos (series de TVMaze). */
  codigo?: "sin-video" | "sin-archivo" | "fuente-caida";
  mensaje?: string;
}

const RE_ID = /^[a-z]+:[^<>{}"\\]{1,300}$/;

/** Mime por extensión del enlace resuelto. */
function mimeDe(url: string): string {
  return url.toLowerCase().endsWith(".webm") ? "video/webm" : "video/mp4";
}

async function resolverCommons(titulo: string): Promise<RespuestaReproducir> {
  const clave = `cine:video:commons:${titulo}`;
  const golpe = cacheObtener<RespuestaReproducir>(clave);
  if (golpe) return golpe;

  const datos = await pedirFuente<RespuestaCommons>("commons", commonsTitulosUrl([titulo], 320), TOPE_FICHA_MS);
  const pagina = datos?.query?.pages ? Object.values(datos.query.pages)[0] : null;
  const info = (pagina as Record<string, unknown> | undefined)?.imageinfo;
  const primera = Array.isArray(info) && typeof info[0] === "object" && info[0] !== null ? (info[0] as Record<string, unknown>) : null;
  const url = primera && typeof primera.url === "string" ? primera.url : null;
  const salida: RespuestaReproducir = url
    ? { ok: true, url, mime: mimeDe(url) }
    : { ok: false, codigo: "sin-archivo", mensaje: "El fichero ya no está disponible en Wikimedia Commons." };
  cacheGuardar(clave, salida, TTL_VIDEO_MS);
  return salida;
}

async function resolverArchive(identifier: string): Promise<RespuestaReproducir> {
  const clave = `cine:video:archive:${identifier}`;
  const golpe = cacheObtener<RespuestaReproducir>(clave);
  if (golpe) return golpe;

  const datos = await pedirFuente<{ metadata?: Record<string, unknown>; files?: unknown[] }>("archive", archiveMetaUrl(identifier), TOPE_FICHA_MS);
  if (!datos?.metadata) {
    return { ok: false, codigo: "sin-archivo", mensaje: "El ítem ya no existe en Internet Archive." };
  }
  const video = elegirVideoArchive(datos.files ?? []);
  const salida: RespuestaReproducir = video
    ? { ok: true, url: archiveDescargaUrl(identifier, video.nombre), mime: mimeDe(video.nombre) }
    : { ok: false, codigo: "sin-archivo", mensaje: "Este ítem de Archive no tiene un vídeo que el reproductor pueda abrir." };
  cacheGuardar(clave, salida, TTL_VIDEO_MS);
  return salida;
}

export async function GET(req: Request) {
  const ip = ipDeHeader(req.headers.get("x-forwarded-for"));
  if (!acumular(`cine-reproducir:${ip}`, REPRO_LIMITE, Date.now())) {
    return NextResponse.json(
      { ok: false, mensaje: "Demasiadas peticiones de reproducción: espera un momento." },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = (searchParams.get("id") ?? "").trim();
  if (!RE_ID.test(id)) {
    return NextResponse.json({ ok: false, mensaje: "El identificador no tiene el formato correcto." }, { status: 400 });
  }

  try {
    if (id.startsWith("commons:")) {
      const titulo = tituloCommonsDe(id);
      if (!titulo) return NextResponse.json({ ok: false, mensaje: "El identificador del fichero no vale." }, { status: 400 });
      return NextResponse.json(await resolverCommons(titulo));
    }
    if (id.startsWith("archive:")) {
      const identifier = idArchiveDe(id);
      if (!identifier || !/^[A-Za-z0-9._-]{1,120}$/.test(identifier)) {
        return NextResponse.json({ ok: false, mensaje: "El identificador de Archive no vale." }, { status: 400 });
      }
      return NextResponse.json(await resolverArchive(identifier));
    }
    if (idTvmazeDe(id) !== null) {
      return NextResponse.json({
        ok: false,
        codigo: "sin-video",
        mensaje:
          "Las fichas de series de TVMaze son metadatos (episodios, valoraciones y dónde verlas): no incluyen vídeo reproducible. Prueba las películas de la colección, que sí se reproducen aquí.",
      });
    }
    return NextResponse.json({ ok: false, mensaje: "Fuente desconocida." }, { status: 400 });
  } catch {
    return NextResponse.json(
      { ok: false, codigo: "fuente-caida", mensaje: "La fuente no respondió. Inténtalo de nuevo en unos segundos." },
      { status: 502 }
    );
  }
}
