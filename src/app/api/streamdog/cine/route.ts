import { NextResponse } from "next/server";
import { acumular, ipDeHeader, segundosRestantes, type LimiteCfg } from "@/lib/rate-limit";
import { buscar, catalogoOCache, top100, type RespuestaCatalogo, type VistaCine } from "@/lib/streamdog/cine-catalogo";

/**
 * CINE&SERIES · /api/streamdog/cine (v1.33.0) — el catálogo agregado.
 *
 * BACKEND REAL sobre APIs públicas y legales (sin claves, sin piratería):
 *   · Wikimedia Commons → dominio público REPRODUCIBLE (.webm/.mp4)
 *   · Internet Archive  → éxitos eternos + film noir + sci-fi/horror +
 *                         cartoons + TV clásica + documentales (♾️)
 *   · TVMaze            → metadatos de series (fichas, peso, géneros)
 *
 *  · GET ?vista=inicio             → filas de carrusel (famosos, oro,
 *                                    series, 5 colecciones Archive…)
 *  · GET ?vista=peliculas&pagina=N → listado paginado de películas
 *  · GET ?vista=series&pagina=N    → listado paginado de series
 *  · GET ?vista=top100&filtro=X    → la clasificación definitiva (v1.37.0):
 *                                    filtro = general | famosos | animacion
 *                                    | recientes | populares | ambiguedad
 *                                    (inválido → general)
 *  · GET ?q=texto                  → búsqueda global en las 3 fuentes
 *
 * La agregación vive en cine-catalogo.ts para que el CRON EMPRESARIAL
 * (/api/streamdog/cron/actualizar) caliente las MISMAS cachés cada hora.
 * DEGRADACIÓN ELEGANTE: la fuente que falle no tira la respuesta.
 */

export const dynamic = "force-dynamic";

const CINE_LIMITE: LimiteCfg = { max: 90, ventanaMs: 60_000 };

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
  const vista: VistaCine = ["inicio", "peliculas", "series"].includes(vistaCruda) ? (vistaCruda as VistaCine) : "inicio";
  const pagina = Math.min(50, Math.max(1, Number.parseInt(searchParams.get("pagina") ?? "1", 10) || 1));

  try {
    /* TOP 100 (v1.37.0): tiene su propia caché y su propia forma de respuesta. */
    if (vistaCruda === "top100") {
      const clasificacion = await top100(searchParams.get("filtro"));
      return NextResponse.json({ ...clasificacion, ok: true, vista: "top100" as const, q, pagina });
    }

    const resultado = await catalogoOCache(vista, q, pagina);
    const respuesta: RespuestaCatalogo = { ...resultado, ok: true, vista, q, pagina };
    return NextResponse.json(respuesta);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "El catálogo no está disponible ahora mismo.",
      },
      { status: 502 }
    );
  }
}
