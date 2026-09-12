/**
 * v1.32.0 — StreamDog Cine&Series: regresión completa.
 *
 * Cubre el módulo entero de cine y series gratis: normalizadores de las
 * 3 fuentes públicas (TVMaze, Commons, Archive) con payloads crudos
 * reales, elección del mejor vídeo de Archive, limpieza de HTML con
 * entidades, dedupe y paginación, el storage con AUTOREPARACIÓN REAL,
 * el diccionario de 4 idiomas con sus géneros, los URL builders puros,
 * los invariantes estáticos del backend y del service worker, y la
 * tríada de versiones 1.32.0.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { APP_VERSION } from "@/lib/version";
import { VERSIONS } from "@/lib/changelog-meta";
import {
  apuntarProgreso,
  elegirVideoArchive,
  dedupeItems,
  esBooleano,
  esIdiomaCine,
  esListaCine,
  esProgresos,
  CLAVES_CINE,
  limpiarHtml,
  normalizarArchiveDoc,
  normalizarCommonsPage,
  normalizarTvmazeEpisodio,
  normalizarTvmazeSearch,
  normalizarTvmazeShow,
  ordenarItems,
  paginar,
  progresoTerminado,
  purgarProgreso,
  guardarColeccion,
  leerColeccion,
  taparTitulo,
  tituloDeArchivoCommons,
  type ItemCine,
  type ProgresoVer,
} from "@/lib/streamdog/cine";
import {
  archiveBuscarUrl,
  archiveDescargaUrl,
  commonsBuscarUrl,
  idArchiveDe,
  idTvmazeDe,
  tvmazeBuscarUrl,
  tvmazeShowsUrl,
  urlColeccionOro,
  tituloCommonsDe,
} from "@/lib/streamdog/cine-servidor";
import type { TituloOro } from "@/lib/streamdog/cine";
import {
  CLAVES_CINE_UI,
  DICCIONARIOS_CINE,
  GENEROS_CINE,
  IDIOMAS_CINE,
  idiomaCineValido,
  traducirCine,
  traducirGenero,
} from "@/lib/streamdog/cine-i18n";

const RAIZ = process.cwd();

/* ══════════════════ Normalizadores TVMaze ══════════════════ */

describe("v1320 · normalizadores TVMaze", () => {
  it("normaliza un show real: imagen, valoración, géneros, año y duración", () => {
    const item = normalizarTvmazeShow({
      id: 1,
      name: "Under the Dome",
      genres: ["Drama", "Science-Fiction", "Thriller"],
      rating: { average: 6.6 },
      premiered: "2013-06-24",
      averageRuntime: 60,
      summary: "<p>The town of <b>Chester's Mill</b> is trapped.</p>",
      image: { medium: "https://tvmaze.medium.jpg", original: "https://tvmaze.original.jpg" },
      url: "https://www.tvmaze.com/shows/1/under-the-dome",
    });
    expect(item).not.toBeNull();
    expect(item?.id).toBe("tvmaze:1");
    expect(item?.titulo).toBe("Under the Dome");
    expect(item?.tipo).toBe("serie");
    expect(item?.anyo).toBe(2013);
    expect(item?.valoracion).toBe(6.6);
    expect(item?.generos).toEqual(["Drama", "Science-Fiction", "Thriller"]);
    expect(item?.duracionMin).toBe(60);
    expect(item?.sinopsis).toBe("The town of Chester's Mill is trapped.");
    expect(item?.imagen).toBe("https://tvmaze.medium.jpg");
    expect(item?.enlaceOrigen).toContain("tvmaze.com");
  });

  it("rechaza basura sin id o sin título", () => {
    expect(normalizarTvmazeShow(null)).toBeNull();
    expect(normalizarTvmazeShow({ id: "x", name: "Serie" })).toBeNull();
    expect(normalizarTvmazeShow({ id: 5, name: "" })).toBeNull();
  });

  it("normaliza la respuesta de búsqueda [{show}] y capta solo lo válido", () => {
    const items = normalizarTvmazeSearch([
      { show: { id: 7, name: "Girls", rating: { average: 7.0 } } },
      { show: null },
      { basura: true },
      { show: { name: "sin id" } },
    ]);
    expect(items).toHaveLength(1);
    expect(items[0].titulo).toBe("Girls");
  });

  it("normaliza un episodio con temporada, número, fecha y resumen limpio", () => {
    const ep = normalizarTvmazeEpisodio({
      season: 2,
      number: 5,
      name: "The Nesting",
      airdate: "2014-07-21",
      runtime: 43,
      summary: "<p>Big Jim <i>reaps</i> what he sows.</p>",
    });
    expect(ep?.temporada).toBe(2);
    expect(ep?.numero).toBe(5);
    expect(ep?.fecha).toBe("2014-07-21");
    expect(ep?.duracionMin).toBe(43);
    expect(ep?.sinopsis).toBe("Big Jim reaps what he sows.");
    expect(normalizarTvmazeEpisodio({ season: 1 })).toBeNull();
  });
});

/* ══════════════════ Normalizadores Commons y Archive ══════════════════ */

describe("v1320 · normalizadores Commons y Archive", () => {
  it("normaliza una página de Commons con imageinfo de vídeo", () => {
    const item = normalizarCommonsPage({
      title: "File:Nosferatu (1922).webm",
      imageinfo: [
        {
          url: "https://upload.wikimedia.org/wikipedia/commons/7/78/Nosferatu_(1922).webm",
          mime: "video/webm",
          size: 5_027_286_483,
          duration: 5518.735,
          thumburl: "https://thumb.wikimedia.org/nosferatu.jpg",
          descriptionurl: "https://commons.wikimedia.org/wiki/File:Nosferatu_(1922).webm",
          extmetadata: {
            DateTimeOriginal: { value: "1922-03-04" },
            ImageDescription: { value: "Una película de <b>F. W. Murnau</b> &amp; compañía" },
          },
        },
      ],
    });
    expect(item?.id).toBe("commons:Nosferatu%20(1922).webm");
    expect(item?.titulo).toBe("Nosferatu (1922)");
    expect(item?.playable).toBe(true);
    expect(item?.duracionMin).toBe(92); // 5518 s → 92 min
    expect(item?.sinopsis).toBe("Una película de F. W. Murnau & compañía");
    expect(item?.enlaceOrigen).toContain("commons.wikimedia.org");
  });

  it("rechaza páginas sin imageinfo o con MIME que no es vídeo", () => {
    expect(normalizarCommonsPage({ title: "File:X.webm" })).toBeNull();
    expect(normalizarCommonsPage({ title: "File:X.pdf", imageinfo: [{ mime: "application/pdf", url: "https://x" }] })).toBeNull();
  });

  it("extrae el título limpio de un nombre de fichero con guiones bajos", () => {
    expect(tituloDeArchivoCommons("File:Big_Buck_Bunny_4K.webm")).toBe("Big Buck Bunny 4K");
    expect(tituloDeArchivoCommons("File:Plan 9 from Outer Space (1959).mp4")).toBe("Plan 9 from Outer Space (1959)");
  });

  it("normaliza un doc de advancedsearch de Archive con descripción en array", () => {
    const item = normalizarArchiveDoc({
      identifier: "night_of_the_living_dead",
      title: "Night of the Living Dead",
      year: "1968",
      description: ["<p>They won't stay dead.</p>"],
    });
    expect(item?.id).toBe("archive:night_of_the_living_dead");
    expect(item?.anyo).toBe(1968);
    expect(item?.sinopsis).toBe("They won't stay dead.");
    expect(item?.imagen).toBe("https://archive.org/services/img/night_of_the_living_dead");
    expect(normalizarArchiveDoc({ identifier: "solo-id" })).toBeNull();
  });

  it("elegirVideoArchive prefiere el 512kb.mp4 (h.264) y descarta gigantes", () => {
    const video = elegirVideoArchive([
      { name: "movie.ogv", format: "Ogg Video", size: 900_000_000 },
      { name: "movie.mp4", format: "MPEG4", size: 1_500_000_000 },
      { name: "movie_512kb.mp4", format: "h.264", size: 700_000_000 },
      { name: "poster.pdf", format: "Text PDF", size: 1000 },
      { name: "remaster.mp4", format: "MPEG4", size: 9_000_000_000 }, // > 3 GB: fuera
    ]);
    expect(video?.nombre).toBe("movie_512kb.mp4");
    expect(elegirVideoArchive([{ name: "solo.pdf", size: 10 }])).toBeNull();
    expect(elegirVideoArchive("no-es-lista")).toBeNull();
  });
});

/* ══════════════════ Utilidades de catálogo ══════════════════ */

describe("v1320 · utilidades de catálogo (puras)", () => {
  it("limpia HTML con tags, entidades nombradas, numeradas y hex", () => {
    expect(limpiarHtml("<p>A &amp; B &#65;&#x42; &hellip; C</p>")).toBe("A & B AB … C");
    expect(limpiarHtml("")).toBe("");
    expect(limpiarHtml("&#60;script&#62;")).toBe("<script>"); // entidades como TEXTO plano (React las escapa)
  });

  it("taparTitulo quita acentos, puntuación y mayúsculas", () => {
    expect(taparTitulo("¡Nosferatu, eine Symphonie des Grauens!")).toBe("nosferatu eine symphonie des grauens");
  });

  it("dedupe gana el reproducible y, a igualdad, Commons sobre Archive", () => {
    const a: ItemCine = { id: "archive:1", fuente: "archive", tipo: "pelicula", titulo: "Charade", anyo: 1963, imagen: null, sinopsis: "", valoracion: null, generos: [], duracionMin: null, playable: true };
    const c: ItemCine = { id: "commons:1", fuente: "commons", tipo: "pelicula", titulo: "Charade", anyo: 1963, imagen: null, sinopsis: "", valoracion: null, generos: [], duracionMin: null, playable: true };
    const s: ItemCine = { id: "tvmaze:1", fuente: "tvmaze", tipo: "serie", titulo: "Charade", anyo: null, imagen: null, sinopsis: "", valoracion: 7.2, generos: [], duracionMin: null, playable: false };
    const lista = dedupeItems([a, c, s]);
    expect(lista).toHaveLength(2);
    const charade = lista.find((i) => i.fuente !== "tvmaze");
    expect(charade?.id).toBe("commons:1"); // mejor peso y también reproducible
  });

  it("ordenarItems pone primero los reproducibles y paginar respeta 1-based", () => {
    const no: ItemCine = { id: "tvmaze:2", fuente: "tvmaze", tipo: "serie", titulo: "B", anyo: null, imagen: null, sinopsis: "", valoracion: 9, generos: [], duracionMin: null, playable: false };
    const si: ItemCine = { id: "commons:2", fuente: "commons", tipo: "pelicula", titulo: "A", anyo: null, imagen: null, sinopsis: "", valoracion: null, generos: [], duracionMin: null, playable: true };
    const orden = ordenarItems([no, si]);
    expect(orden[0].id).toBe("commons:2");
    const datos = [1, 2, 3, 4, 5];
    expect(paginar(datos, 1, 2)).toEqual([1, 2]);
    expect(paginar(datos, 3, 2)).toEqual([5]);
    expect(paginar(datos, 0, 2)).toEqual([1, 2]); // página 0 cae a la 1
  });
});

/* ══════════════════ Storage con AUTOREPARACIÓN REAL ══════════════════ */

function storageFalso(): {
  getItem: (k: string) => string | null;
  setItem: (k: string, v: string) => void;
  removeItem: (k: string) => void;
  datos: Map<string, string>;
} {
  const datos = new Map<string, string>();
  return {
    datos,
    getItem: (k) => datos.get(k) ?? null,
    setItem: (k, v) => {
      datos.set(k, v);
    },
    removeItem: (k) => {
      datos.delete(k);
    },
  };
}

describe("v1320 · storage con autoreparación real", () => {
  it("lee lo válido tal cual y devuelve defecto + null si la clave no existe", () => {
    const s = storageFalso();
    s.setItem(CLAVES_CINE.miLista, JSON.stringify([{ id: "commons:X", titulo: "X" }]));
    const bien = leerColeccion(CLAVES_CINE.miLista, [], esListaCine, s);
    expect(bien.reparacion).toBeNull();
    expect(bien.valor).toHaveLength(1);
    expect(leerColeccion("clave.inexistente", [], esListaCine, s)).toEqual({ valor: [], reparacion: null });
  });

  it("JSON corrupto → borra la clave, devuelve el defecto y AVISA", () => {
    const s = storageFalso();
    s.setItem(CLAVES_CINE.progreso, "{esto no es json");
    const salida = leerColeccion(CLAVES_CINE.progreso, [], esProgresos, s);
    expect(salida.valor).toEqual([]);
    expect(salida.reparacion).toContain("no era JSON válido");
    expect(s.datos.has(CLAVES_CINE.progreso)).toBe(false); // reconstruido
  });

  it("forma inesperada → reparación también (una lista de números no es Mi lista)", () => {
    const s = storageFalso();
    s.setItem(CLAVES_CINE.miLista, JSON.stringify([1, 2, 3]));
    const salida = leerColeccion(CLAVES_CINE.miLista, [], esListaCine, s);
    expect(salida.valor).toEqual([]);
    expect(salida.reparacion).toContain("forma inesperada");
    expect(s.datos.has(CLAVES_CINE.miLista)).toBe(false);
  });

  it("validadores estrictos: idioma, booleano de fondo y lista de items", () => {
    expect(esIdiomaCine("fr")).toBe(true);
    expect(esIdiomaCine("pt")).toBe(false);
    expect(esBooleano(true)).toBe(true);
    expect(esBooleano("sí")).toBe(false);
    expect(esListaCine([{ id: "archive:x", titulo: "X" }])).toBe(true);
    expect(esListaCine([{ id: "", titulo: "X" }])).toBe(false);
    expect(esProgresos([{ id: "a", titulo: "T", imagen: null, posicionSeg: 10, duracionSeg: 100, actualizado: 1 }])).toBe(true);
    expect(esProgresos([{ id: "a" }])).toBe(false);
  });

  it("guardarColeccion con cuota llena: sin plan B falla; con plan B (recorte) reintenta", () => {
    const s = storageFalso();
    expect(guardarColeccion(CLAVES_CINE.idioma, "de", s)).toBe(true);
    const explota = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => undefined,
    };
    expect(guardarColeccion(CLAVES_CINE.idioma, "de", explota)).toBe(false);
    // Plan B: recortar el historial de progreso y reintentar — así se salva la lista.
    let recortado = false;
    const planB = (): boolean => {
      recortado = true;
      return false; // el plan B no arregla nada aquí, pero SE EJECUTA
    };
    expect(guardarColeccion(CLAVES_CINE.idioma, "de", explota, planB)).toBe(false);
    expect(recortado).toBe(true);
  });

  it("purga de progreso: ordena por reciente y respeta el tope de 50", () => {
    const historial: ProgresoVer[] = Array.from({ length: 60 }, (_, i) => ({
      id: `x:${i}`,
      titulo: `T${i}`,
      imagen: null,
      posicionSeg: 0,
      duracionSeg: 100,
      actualizado: i,
    }));
    const purgado = purgarProgreso(historial);
    expect(purgado).toHaveLength(50);
    expect(purgado[0].id).toBe("x:59"); // el más reciente primero
  });

  it("apuntarProgreso actualiza (no duplica) y marca terminado al 95 %", () => {
    const base: ProgresoVer[] = [{ id: "commons:A", titulo: "A", imagen: null, posicionSeg: 100, duracionSeg: 1000, actualizado: 1 }];
    const siguiente = apuntarProgreso(base, { id: "commons:A", titulo: "A", imagen: null, posicionSeg: 400, duracionSeg: 1000 }, 999);
    expect(siguiente).toHaveLength(1);
    expect(siguiente[0].posicionSeg).toBe(400);
    expect(siguiente[0].actualizado).toBe(999);
    expect(progresoTerminado({ ...siguiente[0], posicionSeg: 960 })).toBe(true);
    expect(progresoTerminado(siguiente[0])).toBe(false);
  });

  it("sin storage (SSR/privado): leer y guardar no explotan", () => {
    expect(leerColeccion(CLAVES_CINE.miLista, [], esListaCine, null)).toEqual({ valor: [], reparacion: null });
    expect(guardarColeccion(CLAVES_CINE.miLista, [], null)).toBe(false);
  });
});

/* ══════════════════ i18n del cine: 4 idiomas sanos ══════════════════ */

describe("v1320 · multilenguaje es/en/de/fr", () => {
  it("el español ES la clave: identidad; los otros traducen; la clave ausente cae", () => {
    expect(traducirCine("Reproducir", "es")).toBe("Reproducir");
    expect(traducirCine("Reproducir", "en")).toBe("Play");
    expect(traducirCine("Reproducir", "de")).toBe("Abspielen");
    expect(traducirCine("Reproducir", "fr")).toBe("Lecture");
    expect(traducirCine("Clave inventada", "en")).toBe("Clave inventada");
  });

  it("interpolación de variables ({m} minutos, {q} búsqueda)", () => {
    expect(traducirCine("Continuar desde {m} min", "en", { m: 7 })).toBe("Continue from 7 min");
    expect(traducirCine("Sin resultados para «{q}»", "de", { q: "nosferatu" })).toBe("Keine Ergebnisse für „nosferatu“");
  });

  it("los 4 diccionarios cubren EXACTAMENTE el mismo set de claves", () => {
    const claves: string[] = [...CLAVES_CINE_UI];
    for (const idioma of ["en", "de", "fr"] as const) {
      const dic = DICCIONARIOS_CINE[idioma];
      for (const clave of claves) {
        expect(dic[clave], `${idioma} falta: ${clave}`).toBeTruthy();
      }
      const extra = Object.keys(dic).filter((k) => !claves.includes(k));
      expect(extra, `${idioma} tiene claves sobrantes`).toEqual([]);
    }
    // El español no lleva diccionario (identidad) pero sí selector.
    expect(DICCIONARIOS_CINE.es).toEqual({});
    expect(IDIOMAS_CINE.map((i) => i.id)).toEqual(["es", "en", "de", "fr"]);
    expect(idiomaCineValido("de")).toBe("de");
    expect(idiomaCineValido("italiano")).toBe("es");
  });

  it("géneros traducidos; el desconocido se muestra tal cual", () => {
    expect(traducirGenero("Comedy", "es")).toBe("Comedia");
    expect(traducirGenero("Comedy", "de")).toBe("Komödie");
    expect(traducirGenero("Science-Fiction", "fr")).toBe("Science-fiction");
    expect(traducirGenero("Musical", "es")).toBe("Musical");
    expect(Object.keys(GENEROS_CINE).length).toBeGreaterThanOrEqual(25);
  });
});

/* ══════════════════ URL builders puros ══════════════════ */

describe("v1320 · constructores de URL de las fuentes", () => {
  it("Commons: búsqueda filetype:video con límite y offset para paginar", () => {
    const url = commonsBuscarUrl("nosferatu", 12, 480, 24);
    expect(url).toContain("gsrsearch=filetype%3Avideo+nosferatu");
    expect(url).toContain("gsrlimit=12");
    expect(url).toContain("gsroffset=24");
    expect(commonsBuscarUrl("x", 12).includes("gsroffset")).toBe(false);
  });

  it("Commons: lote de títulos en UNA llamada (colección de oro)", () => {
    const oro: TituloOro[] = [
      { archivo: "File:A.webm", titulo: "A", anyo: 1, director: "D", generos: [] },
      { archivo: "File:B.webm", titulo: "B", anyo: 2, director: "D", generos: [] },
    ];
    expect(urlColeccionOro(oro)).toContain("titles=File%3AA.webm%7CFile%3AB.webm");
  });

  it("Archive: advancedsearch con colección feature_films, página y sort por descargas", () => {
    const url = archiveBuscarUrl("", 2, 20);
    expect(url).toContain("collection%3A%28feature_films%29");
    expect(url).toContain("page=2");
    expect(url).toContain("sort%5B%5D=-downloads");
    expect(archiveBuscarUrl("plan 9", 1, 10)).toContain("plan+9");
  });

  it("Archive: URL de descarga con fichero codificado por tramos", () => {
    expect(archiveDescargaUrl("id con espacios", "a b_512kb.mp4")).toBe(
      "https://archive.org/download/id%20con%20espacios/a%20b_512kb.mp4"
    );
  });

  it("TVMaze: shows por página y búsqueda codificada; ids redondos", () => {
    expect(tvmazeShowsUrl(3)).toBe("https://api.tvmaze.com/shows?page=3");
    expect(tvmazeBuscarUrl("star wars")).toContain("q=star%20wars");
    expect(idTvmazeDe("tvmaze:42")).toBe(42);
    expect(idTvmazeDe("commons:42")).toBeNull();
    expect(tituloCommonsDe("commons:Nosferatu%20(1922).webm")).toBe("File:Nosferatu (1922).webm");
    expect(idArchiveDe("archive:plan_9")).toBe("plan_9");
  });
});

/* ══════════════════ Invariantes estáticos ══════════════════ */

describe("v1320 · invariantes estáticos del backend, la UI y el SW", () => {
  it("las 3 rutas del cine usan rate-limit y degradación (sin llamadas colgantes)", () => {
    const catalogo = readFileSync(join(RAIZ, "src/app/api/streamdog/cine/route.ts"), "utf8");
    expect(catalogo).toContain("acumular(");
    // desde v1.33.0 la degradación vive en cine-catalogo.ts (compartida con el cron)
    const agregacion = readFileSync(join(RAIZ, "src/lib/streamdog/cine-catalogo.ts"), "utf8");
    expect(agregacion).toContain("degradada");
    const detalle = readFileSync(join(RAIZ, "src/app/api/streamdog/cine/detalle/route.ts"), "utf8");
    expect(detalle).toContain("TOPE_FICHA_MS");
    const reproducir = readFileSync(join(RAIZ, "src/app/api/streamdog/cine/reproducir/route.ts"), "utf8");
    expect(reproducir).toContain("sin-video");
  });

  it("el reproductor declara MediaSession y PiP (el segundo plano real)", () => {
    const reproductor = readFileSync(join(RAIZ, "src/components/streamdog/cine/Reproductor.tsx"), "utf8");
    expect(reproductor).toContain("mediaSession");
    expect(reproductor).toContain("requestPictureInPicture");
    expect(reproductor).toContain("visibilitychange");
    expect(reproductor).toContain("setPositionState");
    // Progreso SIN timers: se guarda en timeupdate, no en setInterval.
    expect(reproductor).toContain("onTimeUpdate");
    expect(reproductor).not.toContain("setInterval(");
  });

  it("el service worker está en la versión de la app y audita su salud", () => {
    const sw = readFileSync(join(RAIZ, "public/streamdog-pwa/sw.js"), "utf8");
    expect(sw).toContain(`const VERSION = "v${APP_VERSION}"`);
    expect(sw).toContain('tipo === "COMPROBAR_SALUD"');
    expect(sw).toContain('tipo: "SALUD"');
    expect(sw).toContain("cache.add"); // la reparación re-añade entradas
    expect(sw).toContain("fresca.ok"); // no cachea errores
  });

  it("la página de StreamDog monta el módulo de cine con pestaña propia", () => {
    const pagina = readFileSync(join(RAIZ, "src/app/streamdog/page.tsx"), "utf8");
    expect(pagina).toContain("Cine");
    expect(pagina).toContain('Pestaña>("cine")');
    expect(pagina).toContain("APP_VERSION");
  });
});

/* ══════════════════ Tríada de versiones ══════════════════ */

describe("v1320 · tríada de versiones coherente", () => {
  it("version.ts, changelog-meta.ts y CHANGELOG.md dicen 1.32.0", () => {
    expect(APP_VERSION).toBe("1.33.0");
    expect(VERSIONS[1].version).toBe("1.32.0");
    expect(VERSIONS[1].diffDesde).toBe("1.31.0");
    expect(VERSIONS[1].kinds).toContain("nuevo");
    const changelog = readFileSync(join(RAIZ, "CHANGELOG.md"), "utf8");
    expect(changelog).toContain("## [1.32.0]");
    expect(changelog).toContain("StreamDog Cine&Series");
    // La entrada anterior sigue intacta (la del doblete i18n/TTS).
    expect(changelog).toContain("## [1.31.0]");
  });
});
