import { NextResponse } from "next/server";
import { acumular, ipDeHeader, segundosRestantes, type LimiteCfg } from "@/lib/rate-limit";
import {
  COLECCION_ORO,
  dedupeItems,
  normalizarArchiveDoc,
  normalizarCommonsPage,
  normalizarTvmazeSearch,
  normalizarTvmazeShow,
  ordenarItems,
  reforjarOro,
  type FilaCine,
  type ItemCine,
} from "@/lib/streamdog/cine";
import {
  archiveBuscarUrl,
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
  TOPE_LISTA_MS,
} from "@/lib/streamdog/cine-servidor";

/**
 * CINE&SERIES · /api/streamdog/cine (v1.32.0) — el catálogo agregado.
 *
 * BACKEND REAL sobre APIs públicas y legales (sin claves, sin piratería):
 *   · Wikimedia Commons → dominio público REPRODUCIBLE (.webm/.mp4)
 *   · Internet Archive  → largometrajes de dominio público (feature_films)
 *   · TVMaze            → metadatos de series (fichas, peso, géneros)
 *
 *  · GET ?vista=inicio             → filas de carrusel (colección de oro,
 *                                    series del momento, cine clásico…)
 *  · GET ?vista=peliculas&pagina=N → listado paginado de películas
 *  · GET ?vista=series&pagina=N    → listado paginado de series
 *  · GET ?q=texto                  → búsqueda global en las 3 fuentes
 *
 * DEGRADACIÓN ELEGANTE: cada fuente se pide con tope de tiempo; la que
 * falle no tira la respuesta — se devuelve el resto con `degradada: true`
 * y los estados por fuente para los chips honestos de la UI. Caché TTL
 * en memoria (inicio 10 min, listas 20, búsqueda 5) con purga automática.
 */

export const dynamic = "force-dynamic";

const CINE_LIMITE: LimiteCfg = { max: 90, ventanaMs: 60_000 };
const TTL_INICIO_MS = 10 * 60_000;
const TTL_LISTA_MS = 20 * 60_000;
const TTL_BUSQUEDA_MS = 5 * 60_000;

/** Respuesta del catálogo: filas para «inicio», items para listas y búsqueda. */
export interface RespuestaCatalogo {
  ok: boolean;
  vista: string;
  q: string;
  pagina: number;
  filas?: FilaCine[];
  items?: ItemCine[];
  /** ¿Queda catálogo para otra página? (heurística honesta) */
  hayMas?: boolean;
  /** true si alguna fuente no respondió: se muestra el resto. */
  degradada: boolean;
  fuentes: Record<string, InfoFuente>;
}

/** Commons: query.pages (objeto) → lista normalizada. */
function commonsDe(datos: RespuestaCommons | null): ItemCine[] {
  if (!datos?.query?.pages) return [];
  return Object.values(datos.query.pages)
    .map(normalizarCommonsPage)
    .filter((x): x is ItemCine => x !== null);
}

/** Archive: response.docs → lista normalizada. */
function archiveDe(datos: RespuestaArchive | null): ItemCine[] {
  const docs = datos?.response?.docs;
  if (!Array.isArray(docs)) return [];
  return docs.map(normalizarArchiveDoc).filter((x): x is ItemCine => x !== null);
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

/** Búsqueda global: las 3 fuentes en paralelo, merge + dedupe + orden. */
async function buscar(q: string): Promise<Omit<RespuestaCatalogo, "ok" | "vista" | "q" | "pagina">> {
  const [commons, tvmaze, archive] = await Promise.all([
    pedirFuente<RespuestaCommons>("commons", commonsBuscarUrl(q, 12), TOPE_LISTA_MS),
    pedirFuente<unknown[]>("tvmaze", tvmazeBuscarUrl(q), TOPE_LISTA_MS),
    pedirFuente<RespuestaArchive>("archive", archiveBuscarUrl(q, 1, 12), TOPE_LISTA_MS),
  ]);

  // TVMaze /search/shows devuelve [{show: {...}}] — justo lo que traga el normalizador.
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

/** Catálogo por vista: inicio (filas), películas y series (listas paginadas). */
async function catalogo(vista: string, pagina: number): Promise<Omit<RespuestaCatalogo, "ok" | "vista" | "q" | "pagina">> {
  if (vista === "series") {
    const datos = await pedirFuente<unknown[]>("tvmaze", tvmazeShowsUrl(pagina - 1), TOPE_LISTA_MS);
    const items = seriesPorPeso(datos, 24);
    return { items, hayMas: pagina < 50, degradada: datos === null, fuentes: estadosFuentes() };
  }

  if (vista === "peliculas") {
    const [oro, commons, archive] = await Promise.all([
      pagina === 1
        ? pedirFuente<RespuestaCommons>("commons", urlColeccionOro(COLECCION_ORO), TOPE_LISTA_MS)
        : Promise.resolve(null),
      pagina > 1
        ? pedirFuente<RespuestaCommons>("commons", commonsBuscarUrl("classic film OR cortometraje OR silent movie", 12, 480, (pagina - 1) * 12), TOPE_LISTA_MS)
        : Promise.resolve(null),
      pedirFuente<RespuestaArchive>("archive", archiveBuscarUrl("", pagina, 20), TOPE_LISTA_MS),
    ]);
    const items = dedupeItems([...reforjarOro(commonsDe(oro)), ...commonsDe(commons), ...archiveDe(archive)]);
    return {
      items: ordenarItems(items),
      hayMas: pagina < 40 && (archiveDe(archive).length >= 15 || commonsDe(commons).length >= 10),
      degradada: oro === null && commons === null && archive === null,
      fuentes: estadosFuentes(),
    };
  }

  /* ── INICIO: filas de carrusel ── */
  const [oro, tvmaze, archive, explorar] = await Promise.all([
    pedirFuente<RespuestaCommons>("commons", urlColeccionOro(COLECCION_ORO), TOPE_LISTA_MS),
    pedirFuente<unknown[]>("tvmaze", tvmazeShowsUrl(0), TOPE_LISTA_MS),
    pedirFuente<RespuestaArchive>("archive", archiveBuscarUrl("", 1, 12), TOPE_LISTA_MS),
    pedirFuente<RespuestaCommons>("commons", commonsBuscarUrl("short film OR animated film OR documentary film", 12), TOPE_LISTA_MS),
  ]);

  const filas: FilaCine[] = [];
  const oroItems = reforjarOro(commonsDe(oro));
  if (oroItems.length > 0) filas.push({ claveI18n: "Colección de oro", items: oroItems });
  const series = seriesPorPeso(tvmaze, 18);
  if (series.length > 0) filas.push({ claveI18n: "Series del momento", items: series });
  const clasicos = archiveDe(archive);
  if (clasicos.length > 0) filas.push({ claveI18n: "Cine clásico libre", items: ordenarItems(clasicos).slice(0, 14) });
  const explorarItems = dedupeItems(commonsDe(explorar)).filter((i) => !oroItems.some((o) => o.id === i.id));
  if (explorarItems.length > 0) filas.push({ claveI18n: "Explorar el archivo libre", items: explorarItems.slice(0, 14) });

  return {
    filas,
    degradada: oro === null || tvmaze === null || archive === null,
    fuentes: estadosFuentes(),
  };
}

const RE_Q = /^[^<>{}"\\]{0,80}$/;

export async function GET(req: Request) {
  const ip = ipDeHeader(req.headers.get("x-forwarded-for"));
  if (!acumular(`cine:${ip}`, CINE_LIMITE, Date.now())) {
    return NextResponse.json(
      { ok: false, error: "El catálogo está saturado de peticiones tuyas: espera un momento." },
      { status: 429, headers: { "Retry-After": String(segundosRestantes(CINE_LIMITE)) } }
    );
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 80);
  if (!RE_Q.test(q)) {
    return NextResponse.json({ ok: false, error: "La búsqueda contiene caracteres no permitidos." }, { status: 400 });
  }
  const vistaCruda = searchParams.get("vista") ?? "inicio";
  const vista = ["inicio", "peliculas", "series"].includes(vistaCruda) ? vistaCruda : "inicio";
  const pagina = Math.min(50, Math.max(1, Number.parseInt(searchParams.get("pagina") ?? "1", 10) || 1));

  const clave = `cine:${vista}:${q.toLowerCase()}:${pagina}`;
  const golpe = cacheObtener<Omit<RespuestaCatalogo, "ok">>(clave);
  if (golpe) {
    return NextResponse.json({ ...golpe, ok: true, cache: "hit" });
  }

  const resultado = q ? await buscar(q) : await catalogo(vista, pagina);
  const respuesta: RespuestaCatalogo = { ...resultado, ok: true, vista, q, pagina };
  cacheGuardar(
    clave,
    { ...resultado, vista, q, pagina },
    q ? TTL_BUSQUEDA_MS : vista === "inicio" ? TTL_INICIO_MS : TTL_LISTA_MS
  );
  return NextResponse.json({ ...respuesta, cache: "miss" });
}
