/**
 * STREAMDOG · cine-servidor.ts (v1.32.0) — el brazo servidor del cine.
 *
 * Las tres rutas del backend (/api/streamdog/cine, /detalle y
 * /reproducir) comparten todo lo que necesita red y estado:
 *
 *   · CACHÉ TTL EN MEMORIA (globalThis, patrón de la casa): catálogo
 *     de inicio 10 min, búsquedas 5 min, fichas 30 min. Las fuentes
 *     públicas son lentas y generosas — no hay que castigarlas.
 *   · FETCH CON TOPE (AbortController): una fuente caída o lenta NO
 *     puede colgar la ruta; a los N ms se suelta y se degrada.
 *   · ESTADO DE FUENTES: cada llamada apunta cómo fue su fuente
 *     (ok / degradada / caída) con latencia — la UI pinta chips
 *     honestos con /api/streamdog/cine/estado o con la propia respuesta.
 *   · CONSTRUCTORES DE URL puros y testeables para las 3 fuentes.
 *
 * Sin claves API: Wikimedia Commons, Internet Archive y TVMaze son
 * abiertas. Sin contenido pirata: dominio público y metadatos públicos.
 */

import type { TituloOro } from "./cine";

/* ══════════════════ ESTADO DE FUENTES ══════════════════ */

export type EstadoFuente = "ok" | "degradada" | "caida";

export interface InfoFuente {
  estado: EstadoFuente;
  /** Latencia de la última llamada exitosa/intentada (ms). */
  ms: number | null;
  detalle?: string;
  /** Epoch ms de la última comprobación. */
  comprobado: number;
}

const g = globalThis as unknown as {
  __streamdogCineCache?: Map<string, { expira: number; datos: unknown }>;
  __streamdogCineEstado?: Map<string, InfoFuente>;
};

const caché: Map<string, { expira: number; datos: unknown }> = (g.__streamdogCineCache ??= new Map());
const estados: Map<string, InfoFuente> = (g.__streamdogCineEstado ??= new Map());

const TOPE_ENTRADAS = 300;

/** Purga barata amortizada: cuando la caché crece, sueltan las vencidas. */
function purgar(ahora: number): void {
  if (caché.size <= TOPE_ENTRADAS) return;
  for (const [k, v] of caché) {
    if (v.expira <= ahora) caché.delete(k);
  }
  // Aun así llena (muchas claves vivas): suelta las más viejas.
  if (caché.size > TOPE_ENTRADAS) {
    const ordenadas = [...caché.entries()].sort((a, b) => a[1].expira - b[1].expira);
    for (const [k] of ordenadas.slice(0, caché.size - TOPE_ENTRADAS)) caché.delete(k);
  }
}

/** Devuelve el dato vivo de la caché o null (vencido o ausente). */
export function cacheObtener<T>(clave: string, ahora = Date.now()): T | null {
  const entrada = caché.get(clave);
  if (!entrada) return null;
  if (entrada.expira <= ahora) {
    caché.delete(clave);
    return null;
  }
  return entrada.datos as T;
}

/** Guarda con TTL y purga si toca. */
export function cacheGuardar(clave: string, datos: unknown, ttlMs: number, ahora = Date.now()): void {
  caché.set(clave, { expira: ahora + ttlMs, datos });
  purgar(ahora);
}

/** Apunta cómo fue la llamada a una fuente (para los chips de la UI). */
export function registrarFuente(id: string, estado: EstadoFuente, ms: number | null, detalle?: string): void {
  estados.set(id, { estado, ms, detalle, comprobado: Date.now() });
}

/** Snapshot de estados para la respuesta del backend. */
export function estadosFuentes(): Record<string, InfoFuente> {
  return Object.fromEntries(estados);
}

/* ══════════════════ FETCH CON TOPE ══════════════════ */

/**
 * GET JSON con tope de tiempo: cualquier fallo (red, estado no 2xx,
 * JSON roto, timeout) devuelve null — las rutas degradan, no cuelgan.
 */
export async function fetchJsonConTope<T>(url: string, topeMs: number): Promise<T | null> {
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), topeMs);
  const inicio = Date.now();
  try {
    const res = await fetch(url, {
      signal: control.signal,
      headers: { accept: "application/json", "user-agent": "StreamDog/1.32.0 (catalogo publico; contacto: repo FazeUrru/TODO-LOGO-AI)" },
      cache: "no-store",
    });
    if (!res.ok) {
      registrarFuente("(fetch)", "degradada", Date.now() - inicio, `HTTP ${res.status} en ${res.url.slice(0, 60)}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (error) {
    const motivo = error instanceof Error ? error.name : "desconocido";
    registrarFuente("(fetch)", "caida", Date.now() - inicio, motivo === "AbortError" ? "timeout" : motivo);
    return null;
  } finally {
    clearTimeout(reloj);
  }
}

/** Envuelve una llamada: mide, registra el estado de la fuente y devuelve null si falló. */
export async function pedirFuente<T>(
  fuente: string,
  url: string,
  topeMs: number
): Promise<T | null> {
  const inicio = Date.now();
  const datos = await fetchJsonConTope<T>(url, topeMs);
  const ms = Date.now() - inicio;
  if (datos === null) {
    // fetchJsonConTope ya registró el detalle; eleva a nivel de fuente.
    const previo = estados.get("(fetch)");
    estados.delete("(fetch)");
    registrarFuente(fuente, previo?.estado === "caida" ? "caida" : "degradada", ms, previo?.detalle);
    return null;
  }
  registrarFuente(fuente, "ok", ms);
  return datos;
}

/* ══════════════════ CONSTRUCTORES DE URL (puros) ══════════════════ */

/** Commons: búsqueda de vídeos por texto (namespace 6 = File:). */
export function commonsBuscarUrl(q: string, limite: number, ancho = 480): string {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrsearch: `filetype:video ${q}`.trim(),
    gsrnamespace: "6",
    gsrlimit: String(Math.min(50, Math.max(1, limite))),
    prop: "imageinfo",
    iiprop: "url|mime|size|extmetadata",
    iiurlwidth: String(ancho),
  });
  return `https://commons.wikimedia.org/w/api.php?${params.toString()}`;
}

/** Commons: un lote de ficheros EXACTOS en una sola llamada (colección de oro). */
export function commonsTitulosUrl(titulos: string[], ancho = 640): string {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    titles: titulos.join("|"),
    prop: "imageinfo",
    iiprop: "url|mime|size|extmetadata",
    iiurlwidth: String(ancho),
  });
  return `https://commons.wikimedia.org/w/api.php?${params.toString()}`;
}

/** Archive.org: advancedsearch sobre largometrajes de dominio público. */
export function archiveBuscarUrl(q: string, pagina: number, filas: number): string {
  const consulta = q
    ? `collection:(feature_films) AND mediatype:(movies) AND (${q})`
    : "collection:(feature_films) AND mediatype:(movies)";
  const params = new URLSearchParams({
    q: consulta,
    page: String(Math.max(1, pagina)),
    rows: String(Math.min(50, Math.max(1, filas))),
    output: "json",
    "sort[]": "-downloads",
  });
  for (const campo of ["identifier", "title", "year", "description", "downloads"]) {
    params.append("fl[]", campo);
  }
  return `https://archive.org/advancedsearch.php?${params.toString()}`;
}

/** Archive.org: metadatos completos (ficheros incluidos) de un ítem. */
export function archiveMetaUrl(identifier: string): string {
  return `https://archive.org/metadata/${encodeURIComponent(identifier)}`;
}

/** Archive.org: URL de descarga/streaming de un fichero (302 a nodo). */
export function archiveDescargaUrl(identifier: string, fichero: string): string {
  return `https://archive.org/download/${encodeURIComponent(identifier)}/${fichero.split("/").map(encodeURIComponent).join("/")}`;
}

/** TVMaze: catálogo por páginas de 250 shows (ordenados por peso). */
export function tvmazeShowsUrl(pagina: number): string {
  return `https://api.tvmaze.com/shows?page=${Math.max(0, pagina)}`;
}

/** TVMaze: búsqueda de series por texto. */
export function tvmazeBuscarUrl(q: string): string {
  return `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`;
}

/** TVMaze: ficha completa de un show. */
export function tvmazeShowUrl(id: number): string {
  return `https://api.tvmaze.com/shows/${id}`;
}

/** TVMaze: episodios de un show. */
export function tvmazeEpisodiosUrl(id: number): string {
  return `https://api.tvmaze.com/shows/${id}/episodes`;
}

/** TVMaze: extrae el id numérico de un ItemCine «tvmaze:123». */
export function idTvmazeDe(item: string): number | null {
  if (!item.startsWith("tvmaze:")) return null;
  const n = Number.parseInt(item.slice(7), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Commons: título «File:…» de un ItemCine «commons:Nombre_archivo». */
export function tituloCommonsDe(item: string): string | null {
  if (!item.startsWith("commons:")) return null;
  return `File:${decodeURIComponent(item.slice(8))}`;
}

/** Archive.org: identifier de un ItemCine «archive:identificador». */
export function idArchiveDe(item: string): string | null {
  if (!item.startsWith("archive:")) return null;
  return decodeURIComponent(item.slice(8));
}

/* ══════════════════ AYUDAS DE AGREGACIÓN ══════════════════ */

/** Respuesta cruda de advancedsearch (v2 de la API de Archive). */
export interface RespuestaArchive {
  response?: {
    numFound?: number;
    docs?: unknown[];
  };
}

/** Respuesta cruda de la API de Commons (query.pages). */
export interface RespuestaCommons {
  query?: {
    pages?: Record<string, unknown>;
  };
}

/** Ejecuta todas las llamadas de la colección de oro en UNA petición por lotes. */
export function urlColeccionOro(coleccion: TituloOro[]): string {
  return commonsTitulosUrl(coleccion.map((t) => t.archivo));
}

/** Tope de tiempo por fuente: generoso con metadata, estricto con listas. */
export const TOPE_LISTA_MS = 3_500;
export const TOPE_FICHA_MS = 6_000;
