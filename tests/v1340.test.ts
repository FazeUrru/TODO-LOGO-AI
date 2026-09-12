/**
 * v1.34.0 — StreamDog en movimiento: animaciones originales + Disney+.
 *
 * Regresión de la suite de animaciones `sdc-*` (clases y keyframes en
 * globals.css, respeto a prefers-reduced-motion, clases aplicadas en
 * los componentes correctos), la fila «Lo mejor de Disney+» (lista
 * saneada, sin duplicados, El Encargado delante), la clave i18n en 4
 * idiomas y la tríada de versiones 1.34.0 con README al día.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { APP_VERSION } from "@/lib/version";
import { VERSIONS } from "@/lib/changelog-meta";
import { RECOMENDADAS_DISNEY } from "@/lib/streamdog/cine";
import { CLAVES_CINE_UI, DICCIONARIOS_CINE } from "@/lib/streamdog/cine-i18n";

const RAIZ = process.cwd();

const leer = (p: string): string => readFileSync(join(RAIZ, p), "utf8");

/* ══════════════════ suite de animaciones sdc-* ══════════════════ */

const ANIMACIONES = [
  { clase: "sdc-shimmer", keyframe: "sdc-shimmer", uso: "esqueletos" },
  { clase: "sdc-entrada", keyframe: "sdc-entrada", uso: "filas" },
  { clase: "sdc-kenburns", keyframe: "sdc-kenburns", uso: "héroe" },
  { clase: "sdc-brillo", keyframe: "sdc-brillo", uso: "botón buscar" },
  { clase: "sdc-frontera", keyframe: "sdc-frontera", uso: "partidos" },
  { clase: "sdc-flotar", keyframe: "sdc-flotar", uso: "insignia ∞" },
  { clase: "sdc-elevarse", keyframe: "sdc-elevarse", uso: "tarjetas" },
  { clase: "sdc-onda", keyframe: "sdc-onda", uso: "diálogo/héroe" },
] as const;

describe("v1340 · suite de animaciones originales", () => {
  const css = leer("src/app/globals.css");

  it("las 8 animaciones existen: clase + keyframe propios", () => {
    for (const a of ANIMACIONES) {
      expect(css).toContain(`.${a.clase}`);
      expect(css).toContain(`@keyframes ${a.keyframe}`);
    }
  });

  it("todas respetan prefers-reduced-motion", () => {
    expect(css).toContain("prefers-reduced-motion: reduce");
    for (const a of ANIMACIONES) {
      expect(css.indexOf(`.${a.clase}`)).toBeLessThan(css.indexOf("prefers-reduced-motion: reduce"));
    }
  });

  it("las animaciones están aplicadas en los componentes correctos", () => {
    expect(leer("src/components/streamdog/cine/Cine.tsx")).toContain("sdc-shimmer"); // esqueletos
    expect(leer("src/components/streamdog/cine/Cine.tsx")).toContain("sdc-entrada"); // filas
    expect(leer("src/components/streamdog/cine/Cine.tsx")).toContain("sdc-brillo"); // botón buscar
    expect(leer("src/components/streamdog/cine/Cine.tsx")).toContain("sdc-flotar"); // insignia ∞
    expect(leer("src/components/streamdog/cine/HeroeDestacado.tsx")).toContain("sdc-kenburns");
    expect(leer("src/components/streamdog/cine/FilaDeportes.tsx")).toContain("sdc-frontera");
    expect(leer("src/components/streamdog/cine/TarjetaContenido.tsx")).toContain("sdc-elevarse");
  });

  it("la entrada escalonada usa una variable CSS y el retardo crece acotado", () => {
    const cine = leer("src/components/streamdog/cine/Cine.tsx");
    expect(cine).toContain("--sdc-retardo");
    expect(cine).toContain("Math.min(i * 70, 560)");
  });
});

/* ══════════════════ Lo mejor de Disney+ ══════════════════ */

describe("v1340 · fila «Lo mejor de Disney+»", () => {
  it("El Encargado (The Bear) encabeza la lista de míticas", () => {
    expect(RECOMENDADAS_DISNEY[0]).toBe("The Bear");
    expect(RECOMENDADAS_DISNEY.length).toBeGreaterThanOrEqual(12);
    expect(RECOMENDADAS_DISNEY).toContain("Only Murders in the Building");
    expect(RECOMENDADAS_DISNEY).toContain("Loki");
    expect(RECOMENDADAS_DISNEY).toContain("The Mandalorian");
    expect(RECOMENDADAS_DISNEY).toContain("The Simpsons");
  });

  it("la lista está saneada: sin comillas, sin duplicados, recortada", () => {
    const limpias = RECOMENDADAS_DISNEY.map((t) => t.trim());
    expect(new Set(limpias).size).toBe(limpias.length);
    for (const titulo of RECOMENDADAS_DISNEY) {
      expect(titulo).not.toMatch(/["\\]/);
      expect(titulo.length).toBeGreaterThan(0);
    }
  });

  it("la fila se cocina en el catálogo y entra en el inicio tras las series", () => {
    const catalogo = leer("src/lib/streamdog/cine-catalogo.ts");
    expect(catalogo).toContain("filaRecomendadas");
    expect(catalogo).toContain('claveI18n: "Lo mejor de Disney+"');
    expect(catalogo.indexOf('filas.push(recomendadas)')).toBeGreaterThan(catalogo.indexOf('claveI18n: "Series del momento"'));
  });

  it("la clave i18n vive en la lista canónica y en los 3 diccionarios", () => {
    expect(CLAVES_CINE_UI).toContain("Lo mejor de Disney+");
    expect(DICCIONARIOS_CINE.en["Lo mejor de Disney+"]).toBeTruthy();
    expect(DICCIONARIOS_CINE.de["Lo mejor de Disney+"]).toBeTruthy();
    expect(DICCIONARIOS_CINE.fr["Lo mejor de Disney+"]).toBeTruthy();
  });
});

/* ══════════════════ tríada 1.34.0 + README ══════════════════ */

describe("v1340 · tríada de versiones y repositorio al día", () => {
  it("version.ts, changelog-meta.ts y CHANGELOG.md dicen 1.34.0", () => {
    expect(APP_VERSION).toBe("1.34.0");
    expect(VERSIONS[0].version).toBe("1.34.0");
    expect(VERSIONS[0].diffDesde).toBe("1.33.0");
    const changelog = leer("CHANGELOG.md");
    expect(changelog).toContain("## [1.34.0]");
    expect(changelog.indexOf("## [1.34.0]")).toBeLessThan(changelog.indexOf("## [1.33.0]"));
  });

  it("el README lleva el badge 1.34.0 y cuenta StreamDog ∞", () => {
    const readme = leer("README.md");
    expect(readme).toContain("versi%C3%B3n-1.34.0-");
    expect(readme).toContain("StreamDog: cine y series gratis");
  });

  it("el service worker va en la versión de la app", () => {
    expect(leer("public/streamdog-pwa/sw.js")).toContain(`const VERSION = "v${APP_VERSION}"`);
  });
});
