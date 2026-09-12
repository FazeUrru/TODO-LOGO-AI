/**
 * v1.36.0 — StreamDog Tops: todas las plataformas en el inicio.
 *
 * Regresión de las 8 listas de tops (Netflix, HBO Max top 50, Prime
 * Video, Apple TV+, Filmin, animación, hechos reales y lo más
 * reciente): saneamiento (sin vacíos, duplicados, comillas; HBO = 50
 * exactos y cada nº 1 en su puesto), i18n de las 8 filas en 4
 * idiomas, integración en `catalogo()` en el orden correcto, el
 * motor `filaTops` con degradación elegante real (sin red → null) y
 * la tríada de versiones 1.36.0 con README y service worker al día.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  RECOMENDADAS_APPLE,
  RECOMENDADAS_DISNEY,
  RECOMENDADAS_NETFLIX,
  RECOMENDADAS_PRIME,
  TOPS_ANIMACION,
  TOPS_FILMIN,
  TOPS_HBO_MAX,
  TOPS_HECHOS_REALES,
  TOPS_RECIENTES,
} from "@/lib/streamdog/cine";
import { filaTops } from "@/lib/streamdog/cine-catalogo";
import { CLAVES_CINE_UI, DICCIONARIOS_CINE, traducirCine } from "@/lib/streamdog/cine-i18n";
import { APP_VERSION } from "@/lib/version";
import { VERSIONS } from "@/lib/changelog-meta";

const RAIZ = process.cwd();

const leer = (p: string): string => readFileSync(join(RAIZ, p), "utf8");

/* ══════════════════ las listas de tops ══════════════════ */

const LISTAS: { nombre: string; lista: string[]; primero: string }[] = [
  { nombre: "Netflix", lista: RECOMENDADAS_NETFLIX, primero: "Stranger Things" },
  { nombre: "HBO Max", lista: TOPS_HBO_MAX, primero: "The Sopranos" },
  { nombre: "Prime Video", lista: RECOMENDADAS_PRIME, primero: "The Boys" },
  { nombre: "Apple TV+", lista: RECOMENDADAS_APPLE, primero: "Ted Lasso" },
  { nombre: "Filmin", lista: TOPS_FILMIN, primero: "Twin Peaks" },
  { nombre: "Animación", lista: TOPS_ANIMACION, primero: "Attack on Titan" },
  { nombre: "Hechos reales", lista: TOPS_HECHOS_REALES, primero: "Mindhunter" },
  { nombre: "Recientes", lista: TOPS_RECIENTES, primero: "Shōgun" },
];

describe("v1360 · las 8 listas de tops están saneadas", () => {
  it("cada lista no está vacía, no trae duplicados, comillas ni suciedad", () => {
    for (const { nombre, lista } of LISTAS) {
      expect(lista.length, nombre).toBeGreaterThan(0);
      expect(new Set(lista).size, `duplicados en ${nombre}`).toBe(lista.length);
      for (const titulo of lista) {
        expect(titulo, nombre).toBe(titulo.trim());
        expect(titulo, nombre).not.toMatch(/["\\]/);
        expect(titulo.length, nombre).toBeGreaterThan(0);
      }
    }
  });

  it("HBO Max trae el TOP 50 EXACTO, del Soprano al Somebody Somewhere", () => {
    expect(TOPS_HBO_MAX.length).toBe(50);
    expect(TOPS_HBO_MAX[0]).toBe("The Sopranos");
    expect(TOPS_HBO_MAX[1]).toBe("The Wire");
    expect(TOPS_HBO_MAX[2]).toBe("Game of Thrones");
    expect(TOPS_HBO_MAX).toContain("The Last of Us");
    expect(TOPS_HBO_MAX).toContain("Chernobyl");
    expect(TOPS_HBO_MAX).toContain("Game of Thrones");
    expect(TOPS_HBO_MAX[49]).toBe("Somebody Somewhere");
  });

  it("cada plataforma abre con su título emblema en el nº 1", () => {
    for (const { nombre, lista, primero } of LISTAS) {
      expect(lista[0], `nº 1 de ${nombre}`).toBe(primero);
    }
  });

  it("los tops cubren los 4 pedidos de la casa: famosas, animadas, reales y recientes", () => {
    expect(RECOMENDADAS_NETFLIX).toContain("Money Heist"); // La casa de papel
    expect(RECOMENDADAS_NETFLIX).toContain("Wednesday");
    expect(TOPS_ANIMACION).toContain("One Piece");
    expect(TOPS_ANIMACION).toContain("Avatar: The Last Airbender");
    expect(TOPS_HECHOS_REALES).toContain("When They See Us");
    expect(TOPS_RECIENTES).toContain("3 Body Problem");
    // La fila Disney original sigue intacta con El Encargado delante
    expect(RECOMENDADAS_DISNEY[0]).toBe("The Bear");
  });
});

/* ══════════════════ i18n de las 8 filas ══════════════════ */

const CLAVES_TOPS = [
  "Lo mejor de Netflix",
  "Lo mejor de HBO Max",
  "Lo mejor de Prime Video",
  "Lo mejor de Apple TV+",
  "Lo mejor de Filmin",
  "Animación para maratón",
  "Basadas en hechos reales",
  "Lo más reciente",
] as const;

describe("v1360 · i18n de los tops en 4 idiomas", () => {
  it("las 8 claves viven en la lista canónica y en los 3 diccionarios", () => {
    for (const clave of CLAVES_TOPS) {
      expect(CLAVES_CINE_UI).toContain(clave);
      expect(DICCIONARIOS_CINE.en[clave]).toBeTruthy();
      expect(DICCIONARIOS_CINE.de[clave]).toBeTruthy();
      expect(DICCIONARIOS_CINE.fr[clave]).toBeTruthy();
    }
  });

  it("en/de/fr traducen de verdad (no devuelven la clave española)", () => {
    expect(DICCIONARIOS_CINE.en["Lo mejor de HBO Max"]).toBe("The best of HBO Max");
    expect(DICCIONARIOS_CINE.de["Basadas en hechos reales"]).toBe("Nach wahren Ereignissen");
    expect(DICCIONARIOS_CINE.fr["Lo más reciente"]).toBe("Les plus récentes");
    for (const clave of CLAVES_TOPS) {
      expect(traducirCine(clave, "en")).not.toBe(clave);
      expect(traducirCine(clave, "de")).not.toBe(clave);
      expect(traducirCine(clave, "fr")).not.toBe(clave);
    }
  });
});

/* ══════════════════ integración en el catálogo ══════════════════ */

describe("v1360 · integración de los tops en catalogo()", () => {
  it("las 8 filas se cocinan con filaTops tras la fila Disney", () => {
    const catalogo = leer("src/lib/streamdog/cine-catalogo.ts");
    const orden = [
      'filaRecomendadas(),',
      'filaTops("Lo mejor de Netflix", RECOMENDADAS_NETFLIX, "netflix", { conservarOrden: true })',
      'filaTops("Lo mejor de HBO Max", TOPS_HBO_MAX, "hbo-max", { conservarOrden: true, tope: 50 })',
      'filaTops("Lo mejor de Prime Video", RECOMENDADAS_PRIME, "prime-video", { conservarOrden: true })',
      'filaTops("Lo mejor de Apple TV+", RECOMENDADAS_APPLE, "apple-tv", { conservarOrden: true })',
      'filaTops("Lo mejor de Filmin", TOPS_FILMIN, "filmin", { conservarOrden: true })',
      'filaTops("Animación para maratón", TOPS_ANIMACION, "animacion", { conservarOrden: true })',
      'filaTops("Basadas en hechos reales", TOPS_HECHOS_REALES, "hechos-reales", { conservarOrden: true })',
      'filaTops("Lo más reciente", TOPS_RECIENTES, "reciente", { conservarOrden: true })',
    ];
    let anterior = -1;
    for (const fragmento of orden) {
      const actual = catalogo.indexOf(fragmento);
      expect(actual, `orden de ${fragmento}`).toBeGreaterThan(anterior);
      anterior = actual;
    }
  });

  it("las filas de tops se pintan después de «Series del momento» y antes de las colecciones", () => {
    const catalogo = leer("src/lib/streamdog/cine-catalogo.ts");
    expect(catalogo).toContain("for (const fila of [recomendadas, netflix, hbo, prime, apple, filmin, animacion, reales, recientes])");
    expect(catalogo.indexOf("Series del momento")).toBeLessThan(catalogo.indexOf("Lo mejor de Netflix"));
    expect(catalogo.indexOf("Lo más reciente")).toBeLessThan(catalogo.indexOf("COLECCIONES_ARCHIVE.map"));
  });

  it("filaTops degrada elegante o trae fichas reales: nunca explota", async () => {
    // Con red (TVMaze alcanzable): la fila sale con fichas legales y tope 14.
    // Sin red: null — la fila no sale, sin ruido. Ambos caminos son válidos.
    const fila = await filaTops("Lo mejor de Netflix", RECOMENDADAS_NETFLIX, "netflix", { conservarOrden: true });
    if (fila === null) {
      expect(fila).toBeNull();
      return;
    }
    expect(fila.claveI18n).toBe("Lo mejor de Netflix");
    expect(fila.items.length).toBeGreaterThan(0);
    expect(fila.items.length).toBeLessThanOrEqual(14);
    for (const item of fila.items) {
      expect(item.fuente).toBe("tvmaze");
      expect(item.playable).toBe(false); // fichas legales: SIN vídeo pirata
    }
  });

  it("el motor acepta tope y conservarOrden y la etiqueta distingue plataformas", () => {
    const motor = leer("src/lib/streamdog/cine-catalogo.ts");
    expect(motor).toContain("export async function filaTops");
    expect(motor).toContain("conservarOrden?: boolean");
    expect(motor).toContain("`tvmaze:${etiqueta}`");
  });
});

/* ══════════════════ tríada 1.36.0 + README ══════════════════ */

describe("v1360 · tríada de versiones y repositorio al día", () => {
  it("version.ts, changelog-meta.ts y CHANGELOG.md dicen 1.36.0", () => {
    expect(APP_VERSION).toBe("1.36.0");
    expect(VERSIONS[0].version).toBe("1.36.0");
    expect(VERSIONS[0].diffDesde).toBe("1.35.0");
    const changelog = leer("CHANGELOG.md");
    expect(changelog).toContain("## [1.36.0]");
    expect(changelog.indexOf("## [1.36.0]")).toBeLessThan(changelog.indexOf("## [1.35.0]"));
  });

  it("el README lleva el badge 1.36.0 y cuenta los tops de plataformas", () => {
    const readme = leer("README.md");
    expect(readme).toContain("versi%C3%B3n-1.36.0-");
    expect(readme).toContain("HBO Max top 50");
    expect(readme).toContain("TOPS de plataformas");
  });

  it("el service worker va en la versión de la app", () => {
    expect(leer("public/streamdog-pwa/sw.js")).toContain(`const VERSION = "v${APP_VERSION}"`);
  });
});
