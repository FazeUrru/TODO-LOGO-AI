import { NextResponse } from "next/server";
import { acumular, ipDeHeader, type LimiteCfg } from "@/lib/rate-limit";
import {
  elegirVideoArchive,
  normalizarCommonsPage,
  normalizarTvmazeEpisodio,
  normalizarTvmazeShow,
  type EpisodioCine,
  type ItemCine,
} from "@/lib/streamdog/cine";
import {
  archiveDescargaUrl,
  archiveMetaUrl,
  cacheGuardar,
  cacheObtener,
  commonsTitulosUrl,
  idArchiveDe,
  idTvmazeDe,
  pedirFuente,
  tituloCommonsDe,
  tvmazeEpisodiosUrl,
  tvmazeShowUrl,
  type RespuestaCommons,
  TOPE_FICHA_MS,
} from "@/lib/streamdog/cine-servidor";

/**
 * CINE&SERIES · /api/streamdog/cine/detalle (v1.32.0) — la ficha completa.
 *
 *  · GET ?id=tvmaze:123   → show + LISTA DE EPISODIOS (temporada, nº, fecha)
 *  · GET ?id=commons:…    → metadatos del fichero + URL de vídeo directa
 *  · GET ?id=archive:…    → metadatos + el MEJOR MP4 jugable del ítem
 *
 * Caché TTL en memoria (fichas 30 min, vídeos 6 h) y degradación elegante:
 * una fuente lenta nunca cuelga la ruta (tope de 6 s por llamada).
 */

export const dynamic = "force-dynamic";

const FICHA_LIMITE: LimiteCfg = { max: 120, ventanaMs: 60_000 };
const TTL_FICHA_MS = 30 * 60_000;
const TTL_VIDEO_MS = 6 * 60_000;

export interface RespuestaDetalle {
  ok: boolean;
  item: ItemCine | null;
  episodios?: EpisodioCine[];
  videoUrl?: string | null;
  mime?: string | null;
  motivo?: string;
}

const RE_ID = /^[a-z]+:[^<>{}"\\]{1,300}$/;

function errorDetalle(mensaje: string, estado: number, motivo?: string): NextResponse {
  return NextResponse.json({ ok: false, item: null, motivo, error: mensaje }, { status: estado });
}

/* ── TVMaze: show + episodios ── */
async function detalleTvmaze(idNumerico: number): Promise<RespuestaDetalle> {
  const claveShow = `cine:detalle:tvmaze:show:${idNumerico}`;
  let item = cacheObtener<ItemCine>(claveShow);
  if (!item) {
    const crudo = await pedirFuente<Record<string, unknown>>("tvmaze", tvmazeShowUrl(idNumerico), TOPE_FICHA_MS);
    if (!crudo) return { ok: true, item: null, motivo: "fuente-caida" };
    item = normalizarTvmazeShow(crudo);
    if (item) cacheGuardar(claveShow, item, TTL_FICHA_MS);
  }

  const claveCaps = `cine:detalle:tvmaze:episodios:${idNumerico}`;
  let episodios = cacheObtener<EpisodioCine[]>(claveCaps);
  if (!episodios) {
    const caps = await pedirFuente<unknown[]>("tvmaze", tvmazeEpisodiosUrl(idNumerico), TOPE_FICHA_MS);
    episodios = Array.isArray(caps)
      ? caps.map(normalizarTvmazeEpisodio).filter((x): x is EpisodioCine => x !== null)
      : [];
    if (caps) cacheGuardar(claveCaps, episodios, TTL_FICHA_MS);
  }

  return { ok: true, item, episodios };
}

/* ── Commons: ficha + vídeo directo ── */
async function detalleCommons(titulo: string): Promise<RespuestaDetalle> {
  const clave = `cine:detalle:commons:${titulo}`;
  const golpe = cacheObtener<Omit<RespuestaDetalle, "ok">>(clave);
  if (golpe) return { ...golpe, ok: true };

  const datos = await pedirFuente<RespuestaCommons>("commons", commonsTitulosUrl([titulo], 960), TOPE_FICHA_MS);
  const pagina = datos?.query?.pages ? Object.values(datos.query.pages)[0] : null;
  const item = normalizarCommonsPage(pagina);
  if (!item) return { ok: true, item: null, motivo: "no-encontrado" };

  const info = (pagina as Record<string, unknown>)?.imageinfo;
  const primera = Array.isArray(info) && typeof info[0] === "object" && info[0] !== null ? (info[0] as Record<string, unknown>) : null;
  const videoUrl = primera && typeof primera.url === "string" ? primera.url : null;
  const mime = primera && typeof primera.mime === "string" ? primera.mime : null;
  const salida = { item, videoUrl, mime };
  cacheGuardar(clave, salida, TTL_VIDEO_MS);
  return { ok: true, ...salida };
}

interface MetaArchive {
  metadata?: Record<string, unknown>;
  files?: unknown[];
}

/* ── Archive.org: ficha + mejor MP4 ── */
async function detalleArchive(identifier: string): Promise<RespuestaDetalle> {
  const clave = `cine:detalle:archive:${identifier}`;
  const golpe = cacheObtener<Omit<RespuestaDetalle, "ok">>(clave);
  if (golpe) return { ...golpe, ok: true };

  const datos = await pedirFuente<MetaArchive>("archive", archiveMetaUrl(identifier), TOPE_FICHA_MS);
  if (!datos?.metadata) return { ok: true, item: null, motivo: "no-encontrado" };

  const m = datos.metadata;
  const texto = (v: unknown): string => (Array.isArray(v) ? (typeof v[0] === "string" ? v[0] : "") : typeof v === "string" ? v : "");
  const anyoCrudo = Number.parseInt(texto(m.year), 10);
  const titulo = texto(m.title) || identifier;
  const item: ItemCine = {
    id: `archive:${encodeURIComponent(identifier)}`,
    fuente: "archive",
    tipo: "pelicula",
    titulo,
    anyo: Number.isFinite(anyoCrudo) && anyoCrudo > 1400 && anyoCrudo < 2100 ? anyoCrudo : null,
    imagen: `https://archive.org/services/img/${encodeURIComponent(identifier)}`,
    sinopsis: texto(m.description),
    valoracion: null,
    generos: [],
    duracionMin: null,
    playable: true,
    enlaceOrigen: `https://archive.org/details/${encodeURIComponent(identifier)}`,
  };

  const video = elegirVideoArchive(datos.files ?? []);
  const videoUrl = video ? archiveDescargaUrl(identifier, video.nombre) : null;
  const mime = videoUrl?.toLowerCase().endsWith(".webm") ? "video/webm" : videoUrl ? "video/mp4" : null;
  const salida = { item, videoUrl, mime };
  cacheGuardar(clave, salida, TTL_VIDEO_MS);
  return { ok: true, ...salida };
}

export async function GET(req: Request) {
  const ip = ipDeHeader(req.headers.get("x-forwarded-for"));
  if (!acumular(`cine-detalle:${ip}`, FICHA_LIMITE, Date.now())) {
    return errorDetalle("Demasiadas fichas a la vez: espera un momento.", 429);
  }

  const { searchParams } = new URL(req.url);
  const id = (searchParams.get("id") ?? "").trim();
  if (!RE_ID.test(id)) {
    return errorDetalle("El identificador de la ficha no tiene el formato correcto.", 400);
  }

  try {
    if (id.startsWith("tvmaze:")) {
      const numero = idTvmazeDe(id);
      if (numero === null) return errorDetalle("El identificador de la serie no vale.", 400);
      return NextResponse.json(await detalleTvmaze(numero));
    }
    if (id.startsWith("commons:")) {
      const titulo = tituloCommonsDe(id);
      if (!titulo) return errorDetalle("El identificador del fichero no vale.", 400);
      return NextResponse.json(await detalleCommons(titulo));
    }
    if (id.startsWith("archive:")) {
      const identifier = idArchiveDe(id);
      if (!identifier || !/^[A-Za-z0-9._-]{1,120}$/.test(identifier)) {
        return errorDetalle("El identificador del ítem de Archive no vale.", 400);
      }
      return NextResponse.json(await detalleArchive(identifier));
    }
    return errorDetalle("Fuente desconocida: usa tvmaze, commons o archive.", 400);
  } catch {
    return errorDetalle("La ficha no pudo cargarse en esta ocasión. Inténtalo de nuevo en unos segundos.", 502, "fuente-error");
  }
}
