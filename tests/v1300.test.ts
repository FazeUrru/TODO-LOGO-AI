/**
 * tests/v1300.test.ts — i18n fase 2: secciones al inglés (arena, leaderboard,
 * muro, salón de la fama, conectores MCP, Streamdog).
 *
 * Cubre: motor de traducción con las claves nuevas (interpolación incluida),
 * diccionario sano (sin claves/traducciones vacías ni duplicados), invariantes
 * estáticos (los ficheros traducidos usan useT y envuelven sus cadenas con t()),
 * y tríada de versiones 1.30.0 coherente.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import { traducir, EN } from "@/lib/i18n";
import { APP_VERSION, esVersionMenor } from "@/lib/version";
import { VERSIONS } from "@/lib/changelog-meta";

const RAIZ = join(__dirname, "..");
const leer = (p: string) => readFileSync(join(RAIZ, p), "utf8");

describe("v1.30.0 · motor de traducción con claves nuevas", () => {
  it("español es identidad incluso con las claves nuevas", () => {
    expect(traducir("Para empezar", "es")).toBe("Para empezar");
    expect(traducir("Empate", "es")).toBe("Empate");
  });

  it("arena: tarjetas, voto y revelación en inglés", () => {
    expect(traducir("Crea un juego", "en")).toBe("Create a game");
    expect(traducir("Programa conmigo", "en")).toBe("Code with me");
    expect(traducir("Empate", "en")).toBe("Tie");
    expect(traducir("Ambos malos", "en")).toBe("Both are bad");
    expect(traducir("¿Confirmar?", "en")).toBe("Confirm?");
    expect(traducir("Nueva batalla", "en")).toBe("New battle");
    expect(traducir("Empate registrado", "en")).toBe("Tie recorded");
  });

  it("arena: placeholders del composer por modo", () => {
    expect(traducir("Describe tu misión: un juego AAA, una app, una web completa…", "en")).toContain(
      "Describe your mission"
    );
    expect(traducir("Pregunta lo que quieras… usa / para skills", "en")).toBe(
      "Ask anything… use / for skills"
    );
  });

  it("ticker del leaderboard: interpolación anidada con nombres de modelos", () => {
    expect(traducir("{a} venció a {b}", "en", { a: "GPT-6 Astra", b: "Claude 5" })).toBe(
      "GPT-6 Astra beat Claude 5"
    );
    expect(traducir("{a} empató con {b}", "en", { a: "Gemini", b: "Llama" })).toBe(
      "Gemini tied with Llama"
    );
    expect(traducir("{n} modelos", "en", { n: 56 })).toBe("56 models");
  });

  it("muro y salón: estados y chips", () => {
    expect(traducir("{n} replays", "en", { n: 12 })).toBe("12 replays");
    expect(traducir("Copa de {n}", "en", { n: 4 })).toBe("Cup · 4");
    expect(traducir("El muro está vacío… por ahora", "en")).toBe("The wall is empty… for now");
    expect(traducir("Aún no hay campeones: la primera copa escribirá la historia.", "en")).toContain(
      "No champions yet"
    );
  });

  it("claves ausentes caen al español (adopción incremental)", () => {
    expect(traducir("Cadena que no existe en el diccionario", "en")).toBe(
      "Cadena que no existe en el diccionario"
    );
  });
});

describe("v1.30.0 · diccionario sano", () => {
  it("sin claves vacías, sin traducciones vacías y sin duplicados", () => {
    const claves = Object.keys(EN);
    expect(claves.length).toBeGreaterThan(150);
    for (const k of claves) {
      expect(k.trim().length, `clave vacía o espacios: «${k}»`).toBeGreaterThan(0);
      expect(String(EN[k]).trim().length, `traducción vacía para «${k}»`).toBeGreaterThan(0);
    }
    expect(new Set(claves).size).toBe(claves.length);
  });

  it("las claves nuevas de esta release están presentes", () => {
    const obligatorias = [
      "Crea un juego",
      "Enviar mensaje",
      "¿Cuál responde mejor? Tu voto actualiza el ELO en vivo.",
      "Ninguna skill coincide con «/{q}»",
      "{a} venció a {b}",
      "Puntuación arena",
      "75 servidores",
      "Ver replay",
    ];
    for (const k of obligatorias) expect(EN[k], `falta la clave «${k}»`).toBeTruthy();
  });
});

describe("v1.30.0 · invariantes estáticos", () => {
  it("arena: usa useT y envuelve las cadenas visibles clave", () => {
    const src = leer("src/components/arena/ChatExperience.tsx");
    expect(src).toContain('import { useT } from "@/lib/i18n"');
    expect(src).toContain('const { t } = useT()');
    // placeholders, voto y revelación envueltos
    expect(src).toContain('t("Pregunta lo que quieras… usa / para skills")');
    expect(src).toContain('t("¿Confirmar?")');
    expect(src).toContain('t("Nueva batalla")');
    expect(src).toContain('t("Ganador: {n}"');
    // el timer del autoguardado ya no se llama t (evita TDZ con la traducción)
    expect(src).not.toContain("const t = setTimeout");
    // el mapa de tipos de agente ya no sombrea t
    expect(src).not.toContain("AGENT_TYPES.map((t) =>");
  });

  it("leaderboard, muro y salón usan useT", () => {
    for (const f of [
      "src/components/arena/LeaderboardView.tsx",
      "src/components/arena/MuroView.tsx",
      "src/components/arena/SalonFama.tsx",
    ]) {
      const src = leer(f);
      expect(src, f).toContain('import { useT } from "@/lib/i18n"');
      expect(src, f).toMatch(/const \{ t(: trad)?(, idioma)? \} = useT\(\)/);
    }
  });

  it("leaderboard: ticker y tabla envueltos con t()", () => {
    const src = leer("src/components/arena/LeaderboardView.tsx");
    expect(src).toContain('t("{a} venció a {b}"');
    expect(src).toContain('t("Filtrar modelos…")');
    expect(src).toContain('t("Puntuación arena")');
    expect(src).not.toContain(">Modelo</th>");
    expect(src).not.toContain(">Votos</th>");
  });

  it("mcps y streamdog usan useT", () => {
    const mcps = leer("src/app/mcps/page.tsx");
    expect(mcps).toContain('const { t } = useT()');
    expect(mcps).toContain('t("75 servidores")');
    const sd = leer("src/app/streamdog/page.tsx");
    expect(sd).toContain('const { t } = useT()');
  });
});

describe("v1.30.0 · tríada de versiones", () => {
  it("APP_VERSION es 1.30.0", () => {
    expect(APP_VERSION).toBe("1.30.0");
  });

  it("VERSIONS[0] describe la 1.30.0 con diff desde 1.29.0", () => {
    expect(VERSIONS.length).toBeGreaterThan(1);
    expect(VERSIONS[0].version).toBe("1.30.0");
    expect(VERSIONS[0].diffDesde).toBe("1.29.0");
    expect(VERSIONS[0].kinds).toContain("nuevo");
    expect(VERSIONS[1].version).toBe("1.29.0");
  });

  it("CHANGELOG.md tiene la entrada 1.30.0 por encima de la 1.29.0", () => {
    const md = leer("CHANGELOG.md");
    expect(md).toContain("## [1.30.0]");
    expect(md.indexOf("## [1.30.0]")).toBeLessThan(md.indexOf("## [1.29.0]"));
    expect(md).toContain("compare/v1.29.0...v1.30.0");
  });

  it("esVersionMenor sigue funcionando para el UpdateGate", () => {
    expect(esVersionMenor("1.29.0", "1.30.0")).toBe(true);
    expect(esVersionMenor("1.30.0", "1.29.0")).toBe(false);
  });
});
