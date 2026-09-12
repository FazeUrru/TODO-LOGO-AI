/**
 * v1.38.0 — StreamDog ∞: fichas infinitas en TODAS las categorías,
 * reproductor turbo con lazyload y AUTOGUARDADO TOTAL.
 *
 * Regresión de: CATEGORIAS_EXPLORAR + motor explorar() con caché y cron;
 * cine-gustos.ts (AjustesCine + GustosCine con autoreparación,
 * apuntarGustos puro y recomendadosPara «Porque te gusta»); el
 * code-splitting del reproductor (lazy + Suspense) con preload
 * progresivo y ajustes aplicados; lazyload visual (FilaCarrusel con
 * IntersectionObserver, blur-up en TarjetaContenido, fetchPriority en
 * el héroe); la vista «Explorar» con scroll infinito; i18n ×4 de las
 * 13 claves nuevas y la tríada 1.38.0 con README y service worker.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CATEGORIAS_EXPLORAR, categoriaExplorarValida, CLAVES_CINE, type ItemCine } from "@/lib/streamdog/cine";
import {
  AJUSTES_CINE_DEFECTO,
  VELOCIDADES_CINE,
  apuntarGustos,
  esAjustesCine,
  esGustosCine,
  gustosVacios,
  normalizarAjustesCine,
  puntuarItem,
  recomendadosPara,
  type AjustesCine,
  type GustosCine,
} from "@/lib/streamdog/cine-gustos";
import { CLAVES_CINE_UI, DICCIONARIOS_CINE, traducirCine } from "@/lib/streamdog/cine-i18n";
import { APP_VERSION } from "@/lib/version";
import { VERSIONS } from "@/lib/changelog-meta";

const RAIZ = process.cwd();

const leer = (p: string): string => readFileSync(join(RAIZ, p), "utf8");

/* ══════════════════ utilidades de test ══════════════════ */

const ficha = (id: string, titulo: string, generos: string[] = [], fuente: ItemCine["fuente"] = "tvmaze", valoracion: number | null = null): ItemCine => ({
  id,
  fuente,
  tipo: fuente === "tvmaze" ? "serie" : "pelicula",
  titulo,
  anyo: null,
  imagen: null,
  sinopsis: "",
  valoracion,
  generos,
  duracionMin: null,
  playable: fuente !== "tvmaze",
});

const gustosDe = (generos: Record<string, number>, fuentes: Record<string, number>, ultimos: string[]): GustosCine => ({
  generos,
  fuentes,
  ultimos,
  actualizado: 1_000,
});

/* ══════════════════ EXPLORAR ∞: las categorías ══════════════════ */

describe("v1380 · CATEGORIAS_EXPLORAR: todas las categorías con fondo", () => {
  it("hay 10 categorías cubriendo archive + commons + tvmaze", () => {
    expect(CATEGORIAS_EXPLORAR.length).toBe(10);
    const motores = new Set(CATEGORIAS_EXPLORAR.map((c) => c.motor));
    expect(motores).toEqual(new Set(["archive", "commons", "tvmaze"]));
    expect(CATEGORIAS_EXPLORAR.filter((c) => c.motor === "archive").length).toBe(6);
    expect(CATEGORIAS_EXPLORAR.filter((c) => c.motor === "commons").length).toBe(3);
    expect(CATEGORIAS_EXPLORAR.filter((c) => c.motor === "tvmaze").length).toBe(1);
  });

  it("ids únicos, consultas no vacías en archive/commons y porPagina sano", () => {
    const ids = CATEGORIAS_EXPLORAR.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const cat of CATEGORIAS_EXPLORAR) {
      if (cat.motor !== "tvmaze") expect(cat.consulta.trim().length, cat.id).toBeGreaterThan(0);
      expect(cat.porPagina, cat.id).toBeGreaterThanOrEqual(12);
      expect(cat.porPagina, cat.id).toBeLessThanOrEqual(40);
      expect(cat.claveI18n.trim().length, cat.id).toBeGreaterThan(0);
    }
  });

  it("categoriaExplorarValida cae a null con basura y normaliza mayúsculas", () => {
    expect(categoriaExplorarValida("film-noir")).toBe("film-noir");
    expect(categoriaExplorarValida("  SERIES-TODAS ")).toBe("series-todas");
    expect(categoriaExplorarValida("hack-me")).toBeNull();
    expect(categoriaExplorarValida("")).toBeNull();
    expect(categoriaExplorarValida(42)).toBeNull();
    expect(categoriaExplorarValida(null)).toBeNull();
  });
});

/* ══════════════════ AJUSTES: autoguardado con autoreparación ══════════════════ */

describe("v1380 · AjustesCine: el usuario manda una vez y StreamDog obedece", () => {
  it("los defectos son sanos y las claves de storage existen", () => {
    expect(AJUSTES_CINE_DEFECTO).toEqual({ autoplay: true, cargaInfinita: true, velocidadIdx: 1, volumen: 1 });
    expect(VELOCIDADES_CINE).toEqual([0.75, 1, 1.25, 1.5, 2]);
    expect(CLAVES_CINE.ajustes).toBe("streamdog.cine.v1.ajustes");
    expect(CLAVES_CINE.gustos).toBe("streamdog.cine.v1.gustos");
  });

  it("esAjustesCine acepta el objeto completo y rechaza basura", () => {
    expect(esAjustesCine(AJUSTES_CINE_DEFECTO)).toBe(true);
    expect(esAjustesCine({ autoplay: false, cargaInfinita: false, velocidadIdx: 4, volumen: 0.4 })).toBe(true);
    expect(esAjustesCine(null)).toBe(false);
    expect(esAjustesCine("ajustes")).toBe(false);
    expect(esAjustesCine([])).toBe(false);
    expect(esAjustesCine({ autoplay: true })).toBe(false); // parcial: reparación
    expect(esAjustesCine({ autoplay: true, cargaInfinita: true, velocidadIdx: 9, volumen: 1 })).toBe(false);
    expect(esAjustesCine({ autoplay: true, cargaInfinita: true, velocidadIdx: 1, volumen: 1.5 })).toBe(false);
  });

  it("normalizarAjustesCine fusiona parciales con los defectos", () => {
    expect(normalizarAjustesCine({})).toEqual(AJUSTES_CINE_DEFECTO);
    expect(normalizarAjustesCine({ volumen: 0.3 })).toEqual({ ...AJUSTES_CINE_DEFECTO, volumen: 0.3 });
    expect(normalizarAjustesCine({ velocidadIdx: 99 })).toEqual(AJUSTES_CINE_DEFECTO); // fuera de rango → defecto
    expect(normalizarAjustesCine("basura")).toEqual(AJUSTES_CINE_DEFECTO);
  });
});

/* ══════════════════ GUSTOS: lo aprendido vive en el dispositivo ══════════════════ */

describe("v1380 · GustosCine: apuntar sin mutar, podar sin perder lo importante", () => {
  it("esGustosCine valida la forma completa y rechaza la podrida", () => {
    expect(esGustosCine(gustosDe({ Drama: 3 }, { tvmaze: 5 }, ["tvmaze:1"]))).toBe(true);
    expect(esGustosCine(gustosVacios())).toBe(true);
    expect(esGustosCine(null)).toBe(false);
    expect(esGustosCine({ generos: {}, fuentes: {}, ultimos: [], actualizado: "hoy" })).toBe(false);
    expect(esGustosCine(gustosDe({ Drama: -2 }, {}, []))).toBe(false); // contador negativo
    expect(esGustosCine(gustosDe({}, {}, [""]))).toBe(false); // id vacío
    expect(esGustosCine(gustosDe({}, {}, [42 as unknown as string]))).toBe(false);
  });

  it("apuntarGustos sube géneros, fuentes y «últimos» sin mutar el original", () => {
    const previo = gustosDe({ Drama: 2 }, { tvmaze: 1 }, ["tvmaze:10"]);
    const item = ficha("tvmaze:99", "Serie Nueva", ["Drama", "Crime"]);
    const nuevo = apuntarGustos(previo, item, 2_000);

    expect(nuevo).not.toBe(previo); // puro: objeto nuevo
    expect(previo.generos).toEqual({ Drama: 2 }); // el original no se toca
    expect(nuevo.generos.Drama).toBe(3);
    expect(nuevo.generos.Crime).toBe(1);
    expect(nuevo.fuentes.tvmaze).toBe(2);
    expect(nuevo.ultimos[0]).toBe("tvmaze:99"); // el más nuevo primero
    expect(nuevo.ultimos).toContain("tvmaze:10");
    expect(nuevo.ultimos).toHaveLength(2);
    expect(nuevo.actualizado).toBe(2_000);
  });

  it("reabrir el mismo título no duplica «últimos» y el techo del género no crece al infinito", () => {
    const base = gustosDe({}, {}, ["tvmaze:1", "tvmaze:2"]);
    const reabierto = apuntarGustos(base, ficha("tvmaze:1", "Repetida"), 3_000);
    expect(reabierto.ultimos).toEqual(["tvmaze:1", "tvmaze:2"]); // dedupe, no duplicado

    let g = gustosVacios();
    for (let i = 0; i < 100; i++) g = apuntarGustos(g, ficha(`tvmaze:${i}`, "Muy vista", ["Drama"]), 4_000);
    expect(g.generos.Drama).toBe(40); // TECHO_GENERO
  });

  it("poda los géneros menos vistos al superar el tope (12) y recorta «últimos» a 24", () => {
    let g = gustosVacios();
    for (let i = 0; i < 20; i++) g = apuntarGustos(g, ficha(`a:${i}`, `G${i}`, [`Genero${i}`]), 5_000);
    expect(Object.keys(g.generos).length).toBe(12); // TOPE_GENEROS
    expect(g.generos.Genero19).toBeGreaterThan(0); // los recientes sobreviven

    let h = gustosVacios();
    for (let i = 0; i < 40; i++) h = apuntarGustos(h, ficha(`b:${i}`, `T${i}`), 6_000);
    expect(h.ultimos.length).toBe(24); // TOPE_ULTIMOS
    expect(h.ultimos[0]).toBe("b:39");
  });

  it("apuntarGustos ignora basura sin drama", () => {
    const base = gustosVacios(7);
    expect(apuntarGustos(base, null as unknown as ItemCine, 8)).toEqual(base);
  });
});

/* ══════════════════ «PORQUE TE GUSTA»: recomendadosPara ══════════════════ */

describe("v1380 · recomendadosPara: afinidad real, determinista", () => {
  const pool = [
    ficha("t:1", "Drama a tope", ["Drama"], "tvmaze", 8.5),
    ficha("t:2", "Otro drama", ["Drama"], "tvmaze", 7.0),
    ficha("t:3", "Comedia suelta", ["Comedy"], "tvmaze", 9.0),
    ficha("a:1", "Noir de archivo", ["Crime"], "archive", 8.0),
    ficha("c:1", "Corto de Commons", [], "commons"),
  ];

  it("sin gustos no hay fila: honestidad antes que humo", () => {
    expect(recomendadosPara(gustosVacios(), pool)).toEqual([]);
    expect(recomendadosPara(gustosDe({}, {}, ["t:1"]), pool)).toEqual([]); // solo «últimos», sin afinidades
  });

  it("ordena por afinidad (género ×2 + fuente ×1) y descarta afinidad cero", () => {
    const g = gustosDe({ Drama: 2 }, {}, []);
    const salida = recomendadosPara(g, pool);
    expect(salida.map((x) => x.titulo)).toEqual(["Drama a tope", "Otro drama"]); // la comedia y el corto, fuera (0 puntos)
  });

  it("nunca recomienda lo que acabas de ver («últimos» fuera)", () => {
    const g = gustosDe({ Drama: 1 }, {}, ["t:1"]);
    const salida = recomendadosPara(g, pool);
    expect(salida.map((x) => x.id)).not.toContain("t:1");
    expect(salida.map((x) => x.titulo)).toEqual(["Otro drama"]);
  });

  it("la fuente pesa y el empate cae por valoración (determinista)", () => {
    const g = gustosDe({ Crime: 1 }, { archive: 1 }, []);
    const salida = recomendadosPara(g, pool);
    expect(salida).toHaveLength(1);
    expect(salida[0].titulo).toBe("Noir de archivo");

    const doble = [ficha("x:1", "B", ["Sci-Fi"], "tvmaze", 6), ficha("x:2", "A", ["Sci-Fi"], "tvmaze", 9)];
    expect(recomendadosPara(gustosDe({ "Sci-Fi": 1 }, {}, []), doble).map((x) => x.titulo)).toEqual(["A", "B"]);
  });

  it("puntuarItem suma géneros vistos y fuente, y devuelve 0 sin historial", () => {
    const item = ficha("t:9", "Multi", ["Drama", "Crime"], "archive");
    expect(puntuarItem(gustosVacios(), item)).toBe(0);
    expect(puntuarItem(gustosDe({ Drama: 3, Crime: 1 }, { archive: 2 }, []), item)).toBe(2 * 3 + 2 * 1 + 1 * 2);
  });

  it("respeta el tope pedido", () => {
    const g = gustosDe({ Drama: 5 }, {}, []);
    const grande = Array.from({ length: 40 }, (_, i) => ficha(`g:${i}`, `Drama ${i}`, ["Drama"]));
    expect(recomendadosPara(g, grande, 14)).toHaveLength(14);
  });
});

/* ══════════════════ i18n ×4 de las claves nuevas ══════════════════ */

describe("v1380 · i18n: 13 claves nuevas en los 4 idiomas, sin huecos", () => {
  it("CLAVES_CINE_UI es una lista cerrada sin repetidos y las nuevas están", () => {
    expect(new Set(CLAVES_CINE_UI).size).toBe(CLAVES_CINE_UI.length);
    for (const clave of ["Ver todo", "Porque te gusta", "Ajustes", "Cortos libres", "Todas las series", "Carga infinita", "Volumen por defecto"]) {
      expect(CLAVES_CINE_UI).toContain(clave);
    }
  });

  it("las 13 claves nuevas existen en en, de y fr (y es es identidad)", () => {
    const nuevas = [
      "Ver todo",
      "Todas las categorías, todas las fichas: baja y baja, el catálogo no se acaba.",
      "Cortos libres",
      "Animación libre",
      "Documentales libres",
      "Todas las series",
      "Porque te gusta",
      "Ajustes",
      "Autoguardado activo: tus ajustes y gustos viven en tu dispositivo.",
      "Reproducción automática",
      "Carga infinita",
      "Velocidad por defecto",
      "Volumen por defecto",
    ];
    for (const idioma of ["en", "de", "fr"] as const) {
      for (const clave of nuevas) {
        const salida = DICCIONARIOS_CINE[idioma][clave];
        expect(salida, `${idioma}: ${clave}`).toBeTruthy();
        expect(salida, `${idioma}: ${clave}`).not.toBe(clave); // traducida de verdad
      }
    }
    expect(traducirCine("Ver todo", "es")).toBe("Ver todo");
    expect(traducirCine("Ver todo", "en")).toBe("See all");
    expect(traducirCine("Porque te gusta", "de")).toBe("Weil es dir gefällt");
    expect(traducirCine("Carga infinita", "fr")).toBe("Défilement infini");
  });

  it("las claves de categorías reutilizadas ya estaban traducidas", () => {
    // «Film noir» es idéntico en inglés legítimamente: se excluye de esa aserción.
    for (const clave of ["Cine clásico libre", "Ciencia ficción y terror", "Dibujos animados clásicos", "Televisión clásica", "Documentales"]) {
      expect(traducirCine(clave, "en")).not.toBe(clave);
      expect(traducirCine(clave, "de")).not.toBe(clave);
      expect(traducirCine(clave, "fr")).not.toBe(clave);
    }
    // «Film noir» es préstamo legítimo: idéntico en en/de/fr — solo exigimos que exista.
    expect(DICCIONARIOS_CINE.en["Film noir"]).toBeDefined();
    expect(DICCIONARIOS_CINE.de["Film noir"]).toBeDefined();
    expect(DICCIONARIOS_CINE.fr["Film noir"]).toBeDefined();
  });
});

/* ══════════════════ integración ══════════════════ */

describe("v1380 · integración del catálogo infinito", () => {
  it("la ruta sirve ?vista=explorar&cat=&pagina=", () => {
    const ruta = leer("src/app/api/streamdog/cine/route.ts");
    expect(ruta).toContain('vistaCruda === "explorar"');
    expect(ruta).toContain("explorar(searchParams.get(\"cat\"), pagina)");
    expect(ruta).toContain("?vista=explorar&cat=X");
  });

  it("el motor explorar cachea por (cat, página) y el cron calienta la primera", () => {
    const motor = leer("src/lib/streamdog/cine-catalogo.ts");
    expect(motor).toContain("export async function explorar");
    expect(motor).toContain("explorar:${cat.id}:${pag}");
    expect(motor).toContain("TTL_EXPLORAR_MS");
    expect(motor).toContain("paginaExplorar");

    const cron = leer("src/app/api/streamdog/cron/actualizar/route.ts");
    expect(cron).toContain("CATEGORIAS_EXPLORAR");
    expect(cron).toContain("explorar(id, 1)");
    expect(cron).toContain("explorar:${id}:1");
  });

  it("Cine.tsx tiene la vista Explorar, el centinela infinito y las filas con «Ver todo»", () => {
    const cine = leer("src/components/streamdog/cine/Cine.tsx");
    expect(cine).toContain('{ id: "explorar", clave: "Explorar" }');
    expect(cine).toContain('vista === "explorar" && !buscando');
    expect(cine).toContain("CATEGORIAS_EXPLORAR.map");
    expect(cine).toContain('params.set("cat", explorarCat)');
    expect(cine).toContain("centinelaRef");
    expect(cine).toContain('rootMargin: "600px 0px"');
    expect(cine).toContain("ajustes.cargaInfinita");
    expect(cine).toContain("CATEGORIA_POR_FILA");
    expect(cine).toContain("onExplorar={");
    expect(cine).toContain('t("Porque te gusta")');
  });

  it("el reproductor va lazy, con Suspense y ajustes persistidos", () => {
    const cine = leer("src/components/streamdog/cine/Cine.tsx");
    expect(cine).toContain('const Reproductor = lazy(() => import("./Reproductor"));');
    expect(cine).toContain("<Suspense");
    expect(cine).toContain("cambiarAjuste");
    expect(cine).toContain("CLAVES_CINE.ajustes");
    expect(cine).toContain("CLAVES_CINE.gustos");
    expect(cine).toContain("apuntarGustos(prev, item, Date.now())");

    const rep = leer("src/components/streamdog/cine/Reproductor.tsx");
    expect(rep).toContain("ajustes: AjustesCine");
    expect(rep).toContain("onAjuste");
    expect(rep).toContain('preload={nivelPreload}');
    expect(rep).toContain('setNivelPreload("auto")');
    expect(rep).toContain("autoPlay={ajustes.autoplay}");
    expect(rep).toContain("VELOCIDADES_CINE");
    expect(rep).toContain("onAjuste({ volumen: v })");
    expect(rep).toContain("onAjuste({ velocidadIdx: siguiente })");
  });

  it("lazyload visual: skeleton en fila, blur-up en tarjeta y héroe prioritario", () => {
    const fila = leer("src/components/streamdog/cine/FilaCarrusel.tsx");
    expect(fila).toContain("IntersectionObserver");
    expect(fila).toContain('rootMargin: "400px 0px"');
    expect(fila).toContain("sdc-shimmer");
    expect(fila).toContain("onExplorar?:");

    const tarjeta = leer("src/components/streamdog/cine/TarjetaContenido.tsx");
    expect(tarjeta).toContain('loading="lazy"');
    expect(tarjeta).toContain('decoding="async"');
    expect(tarjeta).toContain("imagenViva");
    expect(tarjeta).toContain("blur-md");

    const heroe = leer("src/components/streamdog/cine/HeroeDestacado.tsx");
    expect(heroe).toContain('fetchPriority="high"');
  });
});

/* ══════════════════ tríada 1.38.0 + README ══════════════════ */

describe("v1380 · tríada de versiones y repositorio al día", () => {
  it("version.ts, changelog-meta.ts y CHANGELOG.md dicen 1.38.0", () => {
    expect(APP_VERSION).toBe("1.38.0");
    expect(VERSIONS[0].version).toBe("1.38.0");
    expect(VERSIONS[0].diffDesde).toBe("1.37.0");
    const changelog = leer("CHANGELOG.md");
    expect(changelog).toContain("## [1.38.0]");
    expect(changelog.indexOf("## [1.38.0]")).toBeLessThan(changelog.indexOf("## [1.37.0]"));
  });

  it("el README lleva el badge 1.38.0 y cuenta el catálogo infinito", () => {
    const readme = leer("README.md");
    expect(readme).toContain("versi%C3%B3n-1.38.0-");
    expect(readme.toLowerCase()).toContain("explorar");
  });

  it("el service worker va en la versión de la app", () => {
    expect(leer("public/streamdog-pwa/sw.js")).toContain(`const VERSION = "v${APP_VERSION}"`);
  });
});
