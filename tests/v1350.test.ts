/**
 * v1.35.0 — StreamDog Arena: fusión elegible + «Pacto abierto».
 *
 * Regresión del módulo de fusión con el Arena (validación estricta,
 * puerta única `enlaceArena` que respeta el modo independiente,
 * alternancia pura y clave de storage versionada), del «Pacto
 * abierto» (los 7 bloques del aviso en 4 idiomas, con las 6
 * plataformas y las frases clave de la casa), de la integración real
 * en Cine.tsx y de la tríada de versiones 1.35.0 con README y
 * service worker al día.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CLAVE_MODO_ARENA,
  MODO_ARENA_BASE,
  RUTA_ARENA,
  alternarModoArena,
  enlaceArena,
  enlazadoAlArena,
  esModoArena,
  modoArenaValido,
} from "@/lib/streamdog/arena-enlace";
import { CLAVES_CINE_UI, DICCIONARIOS_CINE, traducirCine } from "@/lib/streamdog/cine-i18n";
import { APP_VERSION } from "@/lib/version";
import { VERSIONS } from "@/lib/changelog-meta";

const RAIZ = process.cwd();

const leer = (p: string): string => readFileSync(join(RAIZ, p), "utf8");

/* ══════════════════ módulo de fusión con el Arena ══════════════════ */

describe("v1350 · fusión con el Arena: lógica pura", () => {
  it("esModoArena solo acepta los dos modos exactos", () => {
    expect(esModoArena("fusionado")).toBe(true);
    expect(esModoArena("independiente")).toBe(true);
    expect(esModoArena("Fusionado")).toBe(false);
    expect(esModoArena("arena")).toBe(false);
    expect(esModoArena("")).toBe(false);
    expect(esModoArena(null)).toBe(false);
    expect(esModoArena(undefined)).toBe(false);
    expect(esModoArena(42)).toBe(false);
  });

  it("modoArenaValido cae seguro al modo base con cualquier basura", () => {
    expect(modoArenaValido("fusionado")).toBe("fusionado");
    expect(modoArenaValido("independiente")).toBe("independiente");
    expect(modoArenaValido("corrupto")).toBe(MODO_ARENA_BASE);
    expect(modoArenaValido(undefined)).toBe(MODO_ARENA_BASE);
    expect(modoArenaValido({ mal: true })).toBe(MODO_ARENA_BASE);
    expect(MODO_ARENA_BASE).toBe("fusionado"); // StreamDog nace fusionado
  });

  it("solo el modo fusionado mantiene los enlaces cruzados vivos", () => {
    expect(enlazadoAlArena("fusionado")).toBe(true);
    expect(enlazadoAlArena("independiente")).toBe(false);
  });

  it("enlaceArena es la puerta única: ruta en fusionado, null en independiente", () => {
    expect(enlaceArena("fusionado")).toBe(RUTA_ARENA);
    expect(enlaceArena("fusionado", "/leaderboard")).toBe("/leaderboard");
    expect(enlaceArena("independiente")).toBeNull();
    expect(enlaceArena("independiente", "/leaderboard")).toBeNull();
  });

  it("alternarModoArena es pura y nunca se queda en el sitio", () => {
    expect(alternarModoArena("fusionado")).toBe("independiente");
    expect(alternarModoArena("independiente")).toBe("fusionado");
    expect(alternarModoArena(alternarModoArena("fusionado"))).toBe("fusionado");
  });

  it("la clave de storage está versionada bajo el espacio de StreamDog", () => {
    expect(CLAVE_MODO_ARENA).toBe("streamdog.arena.v1.modo");
    expect(CLAVE_MODO_ARENA.startsWith("streamdog.")).toBe(true);
  });
});

/* ══════════════════ el «Pacto abierto» ══════════════════ */

const PLATAFORMAS = ["Netflix", "Prime Video", "Disney+", "HBO Max", "Apple TV", "Filmin"] as const;

const TITULOS_PACTO = [
  "Qué servimos y qué no",
  "Nada personal: el problema son los precios",
  "Colaboración, no enemistad",
  "Marcas y afiliación",
  "Privacidad de verdad",
  "Seguridad auditable",
  "Legibilidad y retirada",
] as const;

const CLAVES_ARENA = [
  "Conexión con el Arena",
  "Fusionado con el Arena",
  "Independiente",
  "Ir al Arena",
  "Pacto abierto",
] as const;

describe("v1350 · «Pacto abierto»: i18n completo en 4 idiomas", () => {
  it("todas las claves del pacto y del Arena viven en la lista canónica", () => {
    for (const clave of [...CLAVES_ARENA, ...TITULOS_PACTO]) {
      expect(CLAVES_CINE_UI).toContain(clave);
    }
    expect(CLAVES_CINE_UI).toContain("Aviso de seguridad, privacidad y colaboración con las plataformas");
    expect(CLAVES_CINE_UI).toContain(
      "Para Netflix, Prime Video, Disney+, HBO Max, Apple TV, Filmin y todas las plataformas del mundo"
    );
    expect(CLAVES_CINE_UI).toContain("Un pacto duradero: este texto vive en cada versión de StreamDog y evoluciona con ella.");
  });

  it("los 7 bloques y las plataformas llegan a los 4 idiomas", () => {
    const idiomas = ["es", "en", "de", "fr"] as const;
    for (const idioma of idiomas) {
      for (const titulo of TITULOS_PACTO) {
        expect(traducirCine(titulo, idioma)).toBeTruthy();
        if (idioma !== "es") {
          expect(traducirCine(titulo, idioma)).not.toBe(titulo); // traducido de verdad
        }
      }
      const cuerpoMarcas = traducirCine(
        "Netflix, Prime Video, Disney+, HBO Max, Apple TV y Filmin son marcas registradas de sus respectivos propietarios. StreamDog no está afiliado, patrocinado ni avalado por ninguna; sus referencias son informativas y de uso nominativo — metadatos públicos con enlace siempre al origen oficial, jamás a copias.",
        idioma
      );
      for (const plataforma of PLATAFORMAS) {
        expect(cuerpoMarcas).toContain(plataforma); // las marcas no se traducen
      }
    }
  });

  it("el pacto dice lo que la casa quiere decir: frases clave en es y en", () => {
    const es = {
      contra: traducirCine(
        "No tenemos nada en contra de Netflix, Prime Video, Disney+, HBO Max, Apple TV ni Filmin: admiramos lo que construyen. Lo que se atraganta son las suscripciones desorbitadas — media docena de cuotas al mes que ya suman más que la factura de la luz. StreamDog nace para cubrir ese hueco con contenido libre y legal, no para sustituir a nadie: mucha de esta casa sigue pagando sus plataformas favoritas.",
        "es"
      ),
      acuerdo: traducirCine(
        "Este proyecto busca un acuerdo mayor, no una enemistad permanente: catálogos más asequibles, ventanas de prueba, bundles con dominio público, licencias honestas para apps independientes. Si las plataformas quieren hablar, aquí tienen la puerta abierta y un interlocutor serio. El dominio público ya demuestra la demanda; el contenido premium de las plataformas pondría el resto. Entre todos, todos ganamos.",
        "es"
      ),
    };
    expect(es.contra).toContain("nada en contra");
    expect(es.contra).toContain("suscripciones desorbitadas");
    expect(es.acuerdo).toContain("acuerdo mayor");
    expect(es.acuerdo).toContain("enemistad permanente");

    const enAcuerdo = DICCIONARIOS_CINE.en["Colaboración, no enemistad"];
    const enContra = DICCIONARIOS_CINE.en["Nada personal: el problema son los precios"];
    expect(enAcuerdo).toBe("Collaboration, not enmity");
    expect(enContra).toBe("Nothing personal: the problem is the prices");
    expect(DICCIONARIOS_CINE.de["Pacto abierto"]).toBe("Offener Pakt");
    expect(DICCIONARIOS_CINE.fr["Pacto abierto"]).toBe("Pacte ouvert");
  });

  it("el cuerpo del pacto repudia la piratería en los 4 idiomas", () => {
    const cuerpo =
      "StreamDog emite cine y series de dominio público y metadatos abiertos de Internet Archive, Wikimedia Commons y TVMaze. No alojamos, desciframos ni repartimos archivos protegidos: nada de torrents, nada de cracks, nada de enlaces piratas. Cada ficha muestra su fuente y su licencia; lo que una fuente retira, desaparece del catálogo sin ruido.";
    for (const idioma of ["es", "en", "de", "fr"] as const) {
      const texto = traducirCine(cuerpo, idioma);
      expect(texto).toContain("Internet Archive");
      expect(texto).toContain("TVMaze");
      expect(texto.toLowerCase()).toMatch(/torrent/);
    }
  });
});

/* ══════════════════ integración en la UI ══════════════════ */

describe("v1350 · integración de la fusión y el pacto en Cine", () => {
  it("Cine.tsx monta el conmutador y el pacto con el idioma del módulo", () => {
    const cine = leer("src/components/streamdog/cine/Cine.tsx");
    expect(cine).toContain("import EnlaceArena");
    expect(cine).toContain("import AvisoLegal");
    expect(cine).toContain("<EnlaceArena idioma={idioma} />");
    expect(cine).toContain("<AvisoLegal idioma={idioma} />");
  });

  it("EnlaceArena persiste el modo y apaga el enlace en independiente", () => {
    const componente = leer("src/components/streamdog/EnlaceArena.tsx");
    expect(componente).toContain("CLAVE_MODO_ARENA");
    expect(componente).toContain("guardarColeccion");
    expect(componente).toContain("enlaceArena(modo)");
    expect(componente).toContain('aria-pressed={fusionado}');
  });

  it("el pacto cubre seguridad, privacidad y legibilidad con las 6 plataformas", () => {
    const aviso = leer("src/components/streamdog/cine/AvisoLegal.tsx");
    for (const plataforma of PLATAFORMAS) {
      expect(aviso).toContain(plataforma);
    }
    expect(aviso).toContain("Qué servimos y qué no");
    expect(aviso).toContain("Privacidad de verdad");
    expect(aviso).toContain("Seguridad auditable");
    expect(aviso).toContain("Legibilidad y retirada");
    expect(aviso).toContain('open={abierto}'); // usa <Dialog> como los diálogos de la casa
  });
});

/* ══════════════════ tríada 1.35.0 + README ══════════════════ */

describe("v1350 · tríada de versiones y repositorio al día", () => {
  it("version.ts, changelog-meta.ts y CHANGELOG.md dicen 1.35.0", () => {
    expect(APP_VERSION).toBe("1.35.0");
    expect(VERSIONS[0].version).toBe("1.35.0");
    expect(VERSIONS[0].diffDesde).toBe("1.34.0");
    const changelog = leer("CHANGELOG.md");
    expect(changelog).toContain("## [1.35.0]");
    expect(changelog.indexOf("## [1.35.0]")).toBeLessThan(changelog.indexOf("## [1.34.0]"));
  });

  it("el README lleva el badge 1.35.0 y cuenta la fusión y el pacto", () => {
    const readme = leer("README.md");
    expect(readme).toContain("versi%C3%B3n-1.35.0-");
    expect(readme).toContain("Fusión elegible con el Arena");
    expect(readme).toContain("«Pacto abierto»");
  });

  it("el service worker va en la versión de la app", () => {
    expect(leer("public/streamdog-pwa/sw.js")).toContain(`const VERSION = "v${APP_VERSION}"`);
  });
});
