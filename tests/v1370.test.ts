/**
 * v1.37.0 — StreamDog Top 100: la clasificación con 6 filtros.
 *
 * Regresión del motor puro cine-top100.ts (pool de las 10 listas
 * rankeadas, mapa de apariciones con consenso, 6 rankings SIN red:
 * general, famosos, animación (Disney), recientes, populares y la
 * mezcla ambigua determinista), de la degradación elegante (fichas
 * que faltan caen sin ruido), del i18n ×4 de las 18 claves nuevas,
 * de la integración (ruta ?vista=top100&filtro, cron que calienta los
 * 6 filtros, Cine.tsx con su quinta vista, TarjetaContenido con
 * insignia de puesto y Top100.tsx) y de la tríada 1.37.0 con README
 * y service worker al día.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ANIMADAS_DISNEY, FILTROS_TOP100, clasificarTop100, claveTitulo, entradasTop100, filtroTop100Valido, mezclarAmbigua, ordenFiltro, titulosTop100Tvmaze, type FiltroTop100 } from "@/lib/streamdog/cine-top100";
import { RECOMENDADAS_DISNEY, TOPS_ANIMACION, TOPS_HBO_MAX, TOPS_RECIENTES, type ItemCine } from "@/lib/streamdog/cine";
import { CLAVES_CINE_UI, DICCIONARIOS_CINE, traducirCine } from "@/lib/streamdog/cine-i18n";
import { APP_VERSION } from "@/lib/version";
import { VERSIONS } from "@/lib/changelog-meta";

const RAIZ = process.cwd();

const leer = (p: string): string => readFileSync(join(RAIZ, p), "utf8");

/* ══════════════════ utilidades de test ══════════════════ */

/** Ficha de mentira: suficiente para el clasificador (no hay red aquí). */
const ficha = (titulo: string, fuente: ItemCine["fuente"] = "tvmaze"): ItemCine => ({
  id: `${fuente}:${claveTitulo(titulo)}`,
  fuente,
  tipo: fuente === "tvmaze" ? "serie" : "pelicula",
  titulo,
  anyo: null,
  imagen: null,
  sinopsis: "",
  valoracion: null,
  generos: [],
  duracionMin: null,
  playable: fuente !== "tvmaze",
});

/** Pool completo resuelto: una ficha por cada entrada del mapa. */
function poolCompleto(): Map<string, ItemCine> {
  const fichas = new Map<string, ItemCine>();
  for (const [clave, entrada] of entradasTop100()) fichas.set(clave, ficha(entrada.titulo));
  return fichas;
}

const TITULOS = (puestos: { item: ItemCine }[]): string[] => puestos.map((p) => p.item.titulo);

/* ══════════════════ el pool y sus listas ══════════════════ */

describe("v1370 · el pool del Top 100 está sano", () => {
  it("los 6 filtros existen con su id y su clave canónica", () => {
    expect(FILTROS_TOP100.map((f) => f.id)).toEqual(["general", "famosos", "animacion", "recientes", "populares", "ambiguedad"]);
    expect(FILTROS_TOP100.map((f) => f.clave)).toContain("Animación (Disney)");
    expect(FILTROS_TOP100.map((f) => f.clave)).toContain("Ambigüedad");
  });

  it("filtroTop100Valido cae a general con basura", () => {
    expect(filtroTop100Valido("populares")).toBe("populares");
    expect(filtroTop100Valido("hack-me")).toBe("general");
    expect(filtroTop100Valido(null)).toBe("general");
    expect(filtroTop100Valido(42)).toBe("general");
  });

  it("el mapa de apariciones cubre el pool sin suciedad", () => {
    const entradas = entradasTop100();
    expect(entradas.size).toBeGreaterThan(100); // 10 listas, dedupe aplicado
    for (const [clave, entrada] of entradas) {
      expect(clave.length, clave).toBeGreaterThan(0);
      expect(entrada.apariciones.length, clave).toBeGreaterThan(0);
      expect(entrada.mejorPuesto, clave).toBeGreaterThanOrEqual(1);
      expect(entrada.puntuacion, clave).toBeGreaterThan(0);
      expect(entrada.puntuacion, clave).toBeLessThanOrEqual(entrada.apariciones.length);
    }
    // The Wire: nº 2 de la lista larga de HBO → consenso alto (49/51)
    const wire = entradas.get(claveTitulo("The Wire"))!;
    expect(wire.apariciones).toEqual(["HBO Max"]);
    expect(wire.mejorPuesto).toBe(2);
    expect(wire.puntuacion).toBeCloseTo(49 / 51, 10);
    // ningún nº 1 llega al 1.0 perfecto: el consenso siempre tiene matices
    const sopranos = entradas.get(claveTitulo("The Sopranos"))!;
    expect(sopranos.puntuacion).toBeCloseTo(50 / 51, 10);
    expect(sopranos.puntuacion).toBeLessThan(1);
  });

  it("claveTitulo deduplica acentos y signos (Élite = elite, D.O.A. = doa)", () => {
    expect(claveTitulo("Élite")).toBe(claveTitulo("elite"));
    expect(claveTitulo("D.O.A.")).toBe("doa");
    expect(claveTitulo("X-Men '97")).toBe("xmen97");
  });

  it("titulosTop100Tvmaze excluye los Mundiales (van por Archive) y no repite", () => {
    const titulos = titulosTop100Tvmaze();
    const claves = titulos.map(claveTitulo);
    expect(new Set(claves).size).toBe(claves.length);
    expect(titulos).toContain("Stranger Things");
    expect(titulos).toContain("The Sopranos");
    expect(titulos).not.toContain("Night of the Living Dead");
    expect(titulos).not.toContain("Nosferatu");
  });

  it("las animadas míticas de Disney salen de su fila y entran en el filtro", () => {
    for (const titulo of ANIMADAS_DISNEY) {
      expect(RECOMENDADAS_DISNEY).toContain(titulo);
    }
    expect(ANIMADAS_DISNEY).not.toContain("The Bear"); // imagen real
    expect(ANIMADAS_DISNEY.length).toBe(5);
  });
});

/* ══════════════════ los 6 rankings, puros y sin red ══════════════════ */

describe("v1370 · los 6 rankings del Top 100", () => {
  const fichas = poolCompleto();

  it("GENERAL: puestos consecutivos 1..N y abre con el nº 1 de la lista más larga", () => {
    const general = clasificarTop100(fichas, "general");
    expect(general.length).toBe(100); // el pool pasa del centenar: tope aplicado
    general.forEach((p, i) => expect(p.puesto).toBe(i + 1));
    // El Soprano: nº 1 de HBO (la lista más larga) → oro
    expect(general[0].item.titulo).toBe("The Sopranos");
    expect(general[0].mejorPuesto).toBe(1);
    // los nº 1 de las otras listas están en la cabeza del ranking
    const diez = TITULOS(general.slice(0, 14));
    for (const emblema of ["Stranger Things", "The Boys", "Ted Lasso", "Twin Peaks", "The Bear", "Attack on Titan", "Mindhunter", "Shōgun", "Night of the Living Dead"]) {
      expect(diez, `el nº 1 de ${emblema} debe estar cerca de la cabeza`).toContain(emblema);
    }
  });

  it("GENERAL respeta el tope de 100 cuando el pool es mayor", () => {
    const tope = clasificarTop100(fichas, "general", undefined, 100);
    expect(tope.length).toBe(100);
    expect(tope[99].puesto).toBe(100);
  });

  it("FAMOSOS: solo Mundiales, Netflix o presencia multi-lista", () => {
    const famosos = clasificarTop100(fichas, "famosos");
    expect(famosos.length).toBeGreaterThan(0);
    for (const p of famosos) {
      const fama = p.apariciones.includes("Mundiales") || p.apariciones.includes("Netflix") || p.apariciones.length >= 2;
      expect(fama, `${p.item.titulo} (${p.apariciones.join(",")}) no es famoso según la regla`).toBe(true);
    }
    const titulos = TITULOS(famosos);
    expect(titulos).toContain("Night of the Living Dead"); // nº 1 de Mundiales
    expect(titulos).toContain("Stranger Things"); // nº 1 de Netflix
    expect(titulos).not.toContain("Ted Lasso"); // solo está en Apple TV+
    // multi-lista delante de los de una sola lista
    const multi = famosos.filter((p) => p.apariciones.length >= 2);
    if (multi.length > 0) {
      expect(famosos[0].apariciones.length).toBeGreaterThanOrEqual(multi[multi.length - 1].apariciones.length);
    }
  });

  it("ANIMACIÓN: abre con Attack on Titan, trae a Disney y deja fuera a The Wire", () => {
    const animacion = clasificarTop100(fichas, "animacion");
    const titulos = TITULOS(animacion);
    expect(titulos[0]).toBe("Attack on Titan");
    expect(titulos).toContain("One Piece");
    expect(titulos).toContain("The Simpsons");
    expect(titulos).toContain("Bluey");
    expect(titulos).toContain("X-Men '97");
    expect(titulos).not.toContain("The Wire");
    expect(titulos).not.toContain("Stranger Things");
    // sin duplicados: X-Men '97 está en dos listas de animación pero sale una vez
    expect(titulos.filter((t) => t === "X-Men '97").length).toBe(1);
  });

  it("RECIENTES: los 12 de la lista en su orden y luego el resto del pool", () => {
    const recientes = clasificarTop100(fichas, "recientes");
    expect(recientes.length).toBeGreaterThanOrEqual(TOPS_RECIENTES.length);
    TITULOS(recientes.slice(0, TOPS_RECIENTES.length)).forEach((t, i) => expect(t).toBe(TOPS_RECIENTES[i]));
    // después de los recientes manda el mejor puesto: The Sopranos
    expect(recientes[TOPS_RECIENTES.length].item.titulo).toBe("The Sopranos");
  });

  it("POPULARES: la puntuación de consenso nunca sube al bajar el ranking", () => {
    const populares = clasificarTop100(fichas, "populares");
    expect(populares.length).toBeGreaterThan(50);
    for (let i = 1; i < populares.length; i++) {
      expect(populares[i].puntuacion).toBeLessThanOrEqual(populares[i - 1].puntuacion + 1e-12);
    }
    // El Soprano (0.98) manda; los éxitos eternos (29/30) y The Wire (0.96) le siguen de cerca
    expect(populares[0].item.titulo).toBe("The Sopranos");
    expect(populares[1].item.titulo).toBe("Night of the Living Dead");
    expect(populares[2].item.titulo).toBe("The Wire");
  });

  it("AMBIGÜEDAD: determinista, completa y con los 5 cubos alternando en la cabeza", () => {
    const claves = [...entradasTop100().keys()];
    const mezcla1 = mezclarAmbigua(claves);
    const mezcla2 = mezclarAmbigua(claves);
    expect(mezcla1).toEqual(mezcla2); // el mismo pool → el mismo orden, siempre
    expect([...mezcla1].sort()).toEqual([...claves].sort()); // sin pérdidas ni duplicados
    expect(mezcla1).not.toEqual(claves); // de verdad está barajada

    const ambigua = clasificarTop100(fichas, "ambiguedad");
    expect(ambigua.length).toBe(100); // el Top 100 recorta el pool entero
    // round-robin: animación → hechos reales → recientes → películas → series
    // (dentro del cubo animación manda el orden del pool: Disney+ antes que Animación)
    const cinco = TITULOS(ambigua.slice(0, 5));
    expect(cinco).toEqual(["The Simpsons", "Mindhunter", "Shōgun", "Night of the Living Dead", "Stranger Things"]);

    // y de verdad difiere del ranking general
    expect(TITULOS(clasificarTop100(fichas, "ambiguedad")).slice(0, 20)).not.toEqual(TITULOS(clasificarTop100(fichas, "general")).slice(0, 20));
  });

  it("ordenFiltro cubre los 6 filtros sin lanzar", () => {
    const entradas = entradasTop100();
    for (const { id } of FILTROS_TOP100) {
      const orden = ordenFiltro(id as FiltroTop100, entradas);
      expect(orden.length, id).toBeGreaterThan(0);
    }
  });
});

/* ══════════════════ degradación elegante ══════════════════ */

describe("v1370 · degradación del Top 100", () => {
  it("las fichas que faltan caen sin ruido y los puestos no dejan huecos", () => {
    const fichas = poolCompleto();
    fichas.delete(claveTitulo("The Sopranos")); // TVMaze no la encontró (en este mundo de test)
    fichas.delete(claveTitulo("Nosferatu"));
    const general = clasificarTop100(fichas, "general");
    expect(general.length).toBe(100); // sigue habiendo pool de sobra para el tope
    expect(TITULOS(general)).not.toContain("The Sopranos");
    general.forEach((p, i) => expect(p.puesto).toBe(i + 1));
    expect(general[0].item.titulo).not.toBe("The Sopranos");
  });

  it("sin fichas no hay puestos (y la UI tiene su estado vacío traducido)", () => {
    expect(clasificarTop100(new Map(), "general")).toEqual([]);
    expect(traducirCine("La clasificación está vacía: las fuentes no respondieron. Prueba otro filtro o reintenta.", "de")).not.toContain("fuentes");
  });
});

/* ══════════════════ i18n ×4 ══════════════════ */

describe("v1370 · el Top 100 habla los 4 idiomas", () => {
  const CLAVES_NUEVAS = [
    "Top 100",
    "La clasificación definitiva: series, películas y documentales del 1 al 100, con ranking real de las fuentes.",
    "Filtros del Top 100",
    "General",
    "Famosos",
    "Animación (Disney)",
    "Recientes",
    "Populares",
    "Ambigüedad",
    "El ranking global: lo mejor de cada plataforma y del archivo público, del 1 al 100.",
    "Los que todo el mundo conoce: éxitos eternos del dominio público y las series que marcaron época en Netflix.",
    "Dibujos y anime para maratón: de los clásicos de Disney a Attack on Titan, sin parar.",
    "Los estrenos de los que habla todo el mundo ahora mismo, del más nuevo al imprescindible.",
    "El consenso de las listas: los títulos que suman más puestos altos en todas las plataformas.",
    "Mezcla sorpresa sin reglas: series, películas y documentales barajados — siempre igual en tu dispositivo, distinto en cada versión.",
    "Puesto",
    "La clasificación está vacía: las fuentes no respondieron. Prueba otro filtro o reintenta.",
  ] as const;

  it("las claves viven en la lista canónica y en los 3 diccionarios", () => {
    for (const clave of CLAVES_NUEVAS) {
      expect(CLAVES_CINE_UI, `falta en CLAVES: ${clave}`).toContain(clave);
      expect(DICCIONARIOS_CINE.en[clave], `en falta: ${clave}`).toBeTruthy();
      expect(DICCIONARIOS_CINE.de[clave], `de falta: ${clave}`).toBeTruthy();
      expect(DICCIONARIOS_CINE.fr[clave], `fr falta: ${clave}`).toBeTruthy();
    }
  });

  it("los filtros y el subtítulo se traducen de verdad (no caen al español)", () => {
    for (const idioma of ["en", "de", "fr"] as const) {
      expect(traducirCine("Animación (Disney)", idioma)).not.toBe("Animación (Disney)");
      expect(traducirCine("Ambigüedad", idioma)).not.toBe("Ambigüedad");
      expect(traducirCine("Puesto", idioma)).not.toBe("Puesto");
      expect(traducirCine("La clasificación definitiva: series, películas y documentales del 1 al 100, con ranking real de las fuentes.", idioma).length).toBeGreaterThan(40);
    }
    expect(traducirCine("Puesto", "en")).toBe("Rank");
    expect(traducirCine("Puesto", "de")).toBe("Platz");
    expect(traducirCine("Puesto", "fr")).toBe("Place");
  });
});

/* ══════════════════ integración ══════════════════ */

describe("v1370 · integración del Top 100", () => {
  it("la ruta sirve ?vista=top100&filtro con validación y fallback", () => {
    const ruta = leer("src/app/api/streamdog/cine/route.ts");
    expect(ruta).toContain('vistaCruda === "top100"');
    expect(ruta).toContain('top100(searchParams.get("filtro"))');
    expect(ruta).toContain("?vista=top100&filtro=X");
  });

  it("cine-catalogo resuelve el pool UNA vez y cachea por filtro", () => {
    const motor = leer("src/lib/streamdog/cine-catalogo.ts");
    expect(motor).toContain("export async function top100");
    expect(motor).toContain("resolverPoolTop100");
    expect(motor).toContain('cacheGuardar("top100:pool"');
    expect(motor).toContain("TTL_TOP100_MS");
    expect(motor).toContain("clasificarTop100(fichas, filtro)");
  });

  it("el cron empresarial calienta los 6 filtros del Top 100", () => {
    const cron = leer("src/app/api/streamdog/cron/actualizar/route.ts");
    expect(cron).toContain('top100("general")');
    expect(cron).toContain("FILTROS_TOP100");
    expect(cron).toContain("top100:${id}");
  });

  it("Cine.tsx tiene su quinta vista y renderiza Top100", () => {
    const cine = leer("src/components/streamdog/cine/Cine.tsx");
    expect(cine).toContain('{ id: "top100", clave: "Top 100" }');
    expect(cine).toContain('vista === "top100"');
    expect(cine).toContain("<Top100");
    expect(cine).toContain('vista === "milista" || vista === "top100"');
  });

  it("TarjetaContenido pinta la medalla y Top100.tsx trae los 6 chips", () => {
    const tarjeta = leer("src/components/streamdog/cine/TarjetaContenido.tsx");
    expect(tarjeta).toContain("puesto?: number");
    expect(tarjeta).toContain("claseMedalla");
    expect(tarjeta).toContain('traducirCine("Puesto", idioma)');

    const top100 = leer("src/components/streamdog/cine/Top100.tsx");
    expect(top100).toContain("FILTROS_TOP100");
    expect(top100).toContain("aria-pressed={activoChip}");
    expect(top100).toContain("GRADIENTES_FILTRO");
    expect(top100).toContain("puesto={p.puesto}");
  });
});

/* ══════════════════ tríada 1.37.0 + README ══════════════════ */

describe("v1370 · tríada de versiones y repositorio al día", () => {
  it("version.ts, changelog-meta.ts y CHANGELOG.md dicen 1.37.0", () => {
    expect(APP_VERSION).toBe("1.38.0");
    expect(VERSIONS[1].version).toBe("1.37.0");
    expect(VERSIONS[1].diffDesde).toBe("1.36.0");
    const changelog = leer("CHANGELOG.md");
    expect(changelog).toContain("## [1.37.0]");
    expect(changelog.indexOf("## [1.37.0]")).toBeLessThan(changelog.indexOf("## [1.36.0]"));
  });

  it("el README lleva el badge 1.37.0 y cuenta el Top 100", () => {
    const readme = leer("README.md");
    expect(readme).toContain("versi%C3%B3n-1.38.0-");
    expect(readme).toContain("TOP 100 con 6 filtros");
  });

  it("el service worker va en la versión de la app", () => {
    expect(leer("public/streamdog-pwa/sw.js")).toContain(`const VERSION = "v${APP_VERSION}"`);
  });
});
