/**
 * STREAMDOG · cine-catalogo.ts (v1.33.0) — la sala de máquinas del catálogo.
 *
 * Vive FUERA de la ruta para que el CRON EMPRESARIAL (v1.33.0) pueda
 * calentar exactamente las mismas cachés que pega un usuario real, sin
 * HTTP contra sí mismo (prohibido en serverless). Dos consumidores:
 *
 *   · /api/streamdog/cine            → el usuario pide y se sirve
 *   · /api/streamdog/cron/actualizar → cada hora, se cocina por adelantado
 *
 * FILAS DEL INICIO (contenido infinito ♾️, 100 % legal):
 *   1. Los títulos más famosos   → Archive, consulta de 30 éxitos eternos
 *   2. Colección de oro          → Commons, comprobada a mano
 *   3. Series del momento        → TVMaze por peso real
 *   4-8. Colecciones Archive     → film_noir, sci-fi_horror, classic_cartoons,
 *                                  classic_tv (series) y documentaryfilms
 *   9. Cine clásico libre        → Archive feature_films
 *  10. Explorar el archivo libre → Commons búsqueda abierta
 *
 * La fila que falle no tira el resto: degradación elegante de la casa.
 */

import {
  COLECCIONES_ARCHIVE,
  COLECCION_ORO,
  EXITOSOS_MUNDIALES,
  RECOMENDADAS_DISNEY,
  dedupeItems,
  normalizarArchiveDoc,
  normalizarCommonsPage,
  normalizarTvmazeSearch,
  normalizarTvmazeShow,
  ordenarItems,
  reforjarOro,
  type ColeccionArchivo,
  type FilaCine,
  type ItemCine,
} from "./cine";
import {
  TOPE_LISTA_MS,
  archiveBuscarUrl,
  archiveColeccionUrl,
  archiveFamososUrl,
  cacheGuardar,
  cacheObtener,
  commonsBuscarUrl,
  estadosFuentes,
  pedirFuente,
  tvmazeBuscarUrl,
  tvmazeShowsUrl,
  urlColeccionOro,
  type InfoFuente,
  type RespuestaArchive,
  type RespuestaCommons,
} from "./cine-servidor";

/* ══════════════════ TIPOS Y TTL ══════════════════ */

export type VistaCine = "inicio" | "peliculas" | "series";

export interface RespuestaCatalogo {
  ok: boolean;
  vista: string;
  q: string;
  pagina: number;
  filas?: FilaCine[];
  items?: ItemCine[];
  hayMas?: boolean;
  degradada: boolean;
  fuentes: Record<string, InfoFuente>;
}

export const TTL_INICIO_MS = 10 * 60_000;
export const TTL_LISTA_MS = 20 * 60_000;
export const TTL_BUSQUEDA_MS = 5 * 60_000;

/** Clave canónica de caché para una petición del catálogo. */
export function claveCine(vista: string, q: string, pagina: number): string {
  return `cine:${vista}:${q.toLowerCase()}:${pagina}`;
}

/* ══════════════════ CONVERSORES ══════════════════ */

/** Commons: query.pages (objeto) → lista normalizada. */
function commonsDe(datos: RespuestaCommons | null): ItemCine[] {
  if (!datos?.query?.pages) return [];
  return Object.values(datos.query.pages)
    .map(normalizarCommonsPage)
    .filter((x): x is ItemCine => x !== null);
}

/** Archive: response.docs → lista normalizada (con tipo opcional). */
function archiveDe(datos: RespuestaArchive | null, tipo?: ItemCine["tipo"]): ItemCine[] {
  const docs = datos?.response?.docs;
  if (!Array.isArray(docs)) return [];
  return docs
    .map((d) => normalizarArchiveDoc(d, tipo ? { tipo } : undefined))
    .filter((x): x is ItemCine => x !== null);
}

/** Series de TVMaze ordenadas por peso (popularidad real de la fuente). */
function seriesPorPeso(datos: unknown[] | null, tope: number): ItemCine[] {
  if (!Array.isArray(datos)) return [];
  const pesoDe = (s: unknown): number => {
    const w = (s as Record<string, unknown>)?.weight;
    return typeof w === "number" ? w : 0;
  };
  const crudos = [...datos].sort((a, b) => pesoDe(b) - pesoDe(a));
  return crudos
    .slice(0, tope)
    .map(normalizarTvmazeShow)
    .filter((x): x is ItemCine => x !== null);
}

/* ══════════════════ BÚSQUEDA GLOBAL ══════════════════ */

/** Búsqueda global: las 3 fuentes en paralelo, merge + dedupe + orden. */
export async function buscar(q: string): Promise<Omit<RespuestaCatalogo, "ok" | "vista" | "q" | "pagina">> {
  const [commons, tvmaze, archive] = await Promise.all([
    pedirFuente<RespuestaCommons>("commons", commonsBuscarUrl(q, 12), TOPE_LISTA_MS),
    pedirFuente<unknown[]>("tvmaze", tvmazeBuscarUrl(q), TOPE_LISTA_MS),
    pedirFuente<RespuestaArchive>("archive", archiveBuscarUrl(q, 1, 12), TOPE_LISTA_MS),
  ]);

  const items = ordenarItems(
    dedupeItems([...commonsDe(commons), ...(tvmaze ? normalizarTvmazeSearch(tvmaze) : []), ...archiveDe(archive)])
  ).slice(0, 40);

  return {
    items,
    hayMas: items.length >= 40,
    degradada: commons === null || tvmaze === null || archive === null,
    fuentes: estadosFuentes(),
  };
}

/* ══════════════════ CATÁLOGO POR VISTA ══════════════════ */

/** Una fila de colección Archive: consulta → fila (vacía si la fuente no dio nada). */
async function filaColeccion(col: ColeccionArchivo): Promise<FilaCine | null> {
  const datos = await pedirFuente<RespuestaArchive>(`archive:${col.id}`, archiveColeccionUrl(col.id, 1, col.filas), TOPE_LISTA_MS);
  const items = ordenarItems(archiveDe(datos, col.tipo)).slice(0, col.filas);
  if (items.length === 0) return null;
  return { claveI18n: col.claveI18n, items };
}

/**
 * Fila «Lo mejor de Disney+»: una búsqueda TVMaze por título mítico, en
 * paralelo, y nos quedamos con la PRIMERA coincidencia de cada una (la
 * correcta: TVMaze ordena por peso). Solo fichas legales: sin vídeo,
 * con enlace al origen. Si TVMaze no está, la fila no sale: sin ruido.
 */
async function filaRecomendadas(): Promise<FilaCine | null> {
  const resultados = await Promise.all(
    RECOMENDADAS_DISNEY.map((q) =>
      pedirFuente<unknown[]>("tvmaze:disney", tvmazeBuscarUrl(q), TOPE_LISTA_MS).then((r) =>
        Array.isArray(r) && r.length > 0 ? normalizarTvmazeSearch(r).slice(0, 1) : []
      )
    )
  );
  const items = ordenarItems(dedupeItems(resultados.flat()));
  if (items.length === 0) return null;
  return { claveI18n: "Lo mejor de Disney+", items: items.slice(0, 14) };
}

/** Catálogo por vista: inicio (filas), películas y series (listas paginadas). */
export async function catalogo(vista: VistaCine, pagina: number): Promise<Omit<RespuestaCatalogo, "ok" | "vista" | "q" | "pagina">> {
  if (vista === "series") {
    const datos = await pedirFuente<unknown[]>("tvmaze", tvmazeShowsUrl(pagina - 1), TOPE_LISTA_MS);
    const items = seriesPorPeso(datos, 24);
    return { items, hayMas: pagina < 50, degradada: datos === null, fuentes: estadosFuentes() };
  }

  if (vista === "peliculas") {
    const [oro, commons, archive, famosos] = await Promise.all([
      pagina === 1
        ? pedirFuente<RespuestaCommons>("commons", urlColeccionOro(COLECCION_ORO), TOPE_LISTA_MS)
        : Promise.resolve(null),
      pagina > 1
        ? pedirFuente<RespuestaCommons>("commons", commonsBuscarUrl("classic film OR cortometraje OR silent movie", 12, 480, (pagina - 1) * 12), TOPE_LISTA_MS)
        : Promise.resolve(null),
      pedirFuente<RespuestaArchive>("archive", archiveBuscarUrl("", pagina, 20), TOPE_LISTA_MS),
      pagina === 1 ? pedirFuente<RespuestaArchive>("archive:famosos", archiveFamososUrl(EXITOSOS_MUNDIALES, 20), TOPE_LISTA_MS) : Promise.resolve(null),
    ]);
    const items = dedupeItems([...reforjarOro(commonsDe(oro)), ...archiveDe(famosos), ...commonsDe(commons), ...archiveDe(archive)]);
    return {
      items: ordenarItems(items),
      hayMas: pagina < 40 && (archiveDe(archive).length >= 15 || commonsDe(commons).length >= 10),
      degradada: oro === null && commons === null && archive === null,
      fuentes: estadosFuentes(),
    };
  }

  /* ── INICIO: 11 filas en paralelo, contenido infinito ♾️ ── */
  const [famosos, oro, tvmaze, clasicos, explorar, recomendadas, ...colecciones] = await Promise.all([
    pedirFuente<RespuestaArchive>("archive:famosos", archiveFamososUrl(EXITOSOS_MUNDIALES, 14), TOPE_LISTA_MS),
    pedirFuente<RespuestaCommons>("commons", urlColeccionOro(COLECCION_ORO), TOPE_LISTA_MS),
    pedirFuente<unknown[]>("tvmaze", tvmazeShowsUrl(0), TOPE_LISTA_MS),
    pedirFuente<RespuestaArchive>("archive", archiveBuscarUrl("", 1, 12), TOPE_LISTA_MS),
    pedirFuente<RespuestaCommons>("commons", commonsBuscarUrl("short film OR animated film OR documentary film", 12), TOPE_LISTA_MS),
    filaRecomendadas(),
    ...COLECCIONES_ARCHIVE.map((col) => filaColeccion(col)),
  ]);

  const filas: FilaCine[] = [];
  const famososItems = ordenarItems(archiveDe(famosos));
  if (famososItems.length > 0) filas.push({ claveI18n: "Los títulos más famosos", items: famososItems.slice(0, 14) });
  const oroItems = reforjarOro(commonsDe(oro));
  if (oroItems.length > 0) filas.push({ claveI18n: "Colección de oro", items: oroItems });
  const series = seriesPorPeso(tvmaze, 18);
  if (series.length > 0) filas.push({ claveI18n: "Series del momento", items: series });
  if (recomendadas) filas.push(recomendadas);
  for (const fila of colecciones) {
    if (fila) filas.push(fila);
  }
  const clasicosItems = ordenarItems(archiveDe(clasicos));
  if (clasicosItems.length > 0) filas.push({ claveI18n: "Cine clásico libre", items: clasicosItems.slice(0, 14) });
  const explorarItems = dedupeItems(commonsDe(explorar)).filter((i) => !oroItems.some((o) => o.id === i.id));
  if (explorarItems.length > 0) filas.push({ claveI18n: "Explorar el archivo libre", items: explorarItems.slice(0, 14) });

  return {
    filas,
    degradada: famosos === null || oro === null || tvmaze === null || clasicos === null,
    fuentes: estadosFuentes(),
  };
}

/* ══════════════════ FACHADA CON CACHÉ ══════════════════ */

export interface RespuestaConCache extends Omit<RespuestaCatalogo, "ok"> {
  cache: "hit" | "miss";
}

/** Sirve desde caché si hay golpe; si no, cocina y guarda con su TTL. */
export async function catalogoOCache(vista: VistaCine, q: string, pagina: number): Promise<RespuestaConCache> {
  const clave = claveCine(vista, q, pagina);
  const golpe = cacheObtener<Omit<RespuestaCatalogo, "ok">>(clave);
  if (golpe) return { ...golpe, cache: "hit" };

  const resultado = q ? await buscar(q) : await catalogo(vista, pagina);
  const completo = { ...resultado, vista, q, pagina };
  cacheGuardar(clave, completo, q ? TTL_BUSQUEDA_MS : vista === "inicio" ? TTL_INICIO_MS : TTL_LISTA_MS);
  return { ...completo, cache: "miss" };
}
