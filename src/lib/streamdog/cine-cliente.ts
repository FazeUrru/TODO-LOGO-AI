/**
 * STREAMDOG · cine-cliente.ts (v1.32.0) — el plan B que corre en TU navegador.
 *
 * POR QUÉ EXISTE: Wikimedia aplica reglas antirrobot por huella TLS —
 * bloquea con 403 las peticiones salientes de runtimes serverless/Node
 * (Vercel incluido, a veces) mientras que los NAVEGADORES REALES pasan
 * siempre. Y la API de Commons está pensada para eso: con `origin=*`
 * permite CORS anónimo desde el navegador.
 *
 * CÓMO SE USA: el backend sigue siendo la vía principal (con su caché
 * TTL y sus reintentos). Si la fuente Commons responde degradada o
 * caída, el cliente repite la consulta DESDE EL NAVEGADOR con estas
 * funciones y fusiona el resultado en las filas — el chip de fuentes
 * pasa a «ok (directo)» sin que el usuario se entere del drama.
 *
 * También cubre ficha (/detalle) y vídeo (/reproducir) de Commons: el
 * vídeo en sí SIEMPRE lo sirve el CDN de Wikimedia directamente al
 * <video> — este módulo solo resuelve el enlace.
 */

import {
  COLECCION_ORO,
  normalizarCommonsPage,
  reforjarOro,
  type ItemCine,
} from "./cine";
import {
  commonsBuscarUrl,
  commonsTitulosUrl,
  tituloCommonsDe,
  urlColeccionOro,
  type RespuestaCommons,
} from "./cine-servidor";

/** GET JSON tolerante: cualquier fallo (abort, 403, red) → null. */
async function getJson(url: string, signal?: AbortSignal): Promise<RespuestaCommons | null> {
  try {
    const res = await fetch(url, { signal, cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as RespuestaCommons;
  } catch {
    return null;
  }
}

/** query.pages (objeto por id numérico) → lista normalizada. */
function paginasAItems(datos: RespuestaCommons | null): ItemCine[] {
  const pages = datos?.query?.pages;
  if (!pages) return [];
  return Object.values(pages)
    .map(normalizarCommonsPage)
    .filter((x): x is ItemCine => x !== null);
}

/** La Colección de oro, pedida DESDE EL NAVEGADOR en un lote único. */
export async function coleccionOroCliente(signal?: AbortSignal): Promise<ItemCine[]> {
  const datos = await getJson(urlColeccionOro(COLECCION_ORO), signal);
  return reforjarOro(paginasAItems(datos));
}

/** Búsqueda de vídeos en Commons desde el navegador (con offset para paginar). */
export async function explorarCliente(
  q: string,
  limite = 12,
  offset = 0,
  signal?: AbortSignal
): Promise<ItemCine[]> {
  const datos = await getJson(commonsBuscarUrl(q, limite, 480, offset), signal);
  return paginasAItems(datos);
}

export interface DetalleCommonsCliente {
  item: ItemCine;
  videoUrl: string | null;
  mime: string | null;
}

/** Ficha completa de Commons desde el navegador (item + vídeo directo). */
export async function detalleCommonsCliente(
  id: string,
  signal?: AbortSignal
): Promise<DetalleCommonsCliente | null> {
  const titulo = tituloCommonsDe(id);
  if (!titulo) return null;
  const datos = await getJson(commonsTitulosUrl([titulo], 960), signal);
  const pages = datos?.query?.pages;
  if (!pages) return null;
  const pagina = Object.values(pages)[0] as Record<string, unknown> | undefined;
  const item = normalizarCommonsPage(pagina);
  if (!pagina || !item) return null;
  const info = pagina.imageinfo;
  const primera = Array.isArray(info) && typeof info[0] === "object" && info[0] !== null ? (info[0] as Record<string, unknown>) : null;
  const videoUrl = primera && typeof primera.url === "string" ? primera.url : null;
  const mime = videoUrl ? (videoUrl.toLowerCase().endsWith(".webm") ? "video/webm" : "video/mp4") : null;
  return { item, videoUrl, mime };
}
