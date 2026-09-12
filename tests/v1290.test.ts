/**
 * Regresión v1.29.0 — «La arena habla tu idioma: fundación i18n».
 *
 *  · traducir: es identidad, en traduce, clave ausente cae al español,
 *    interpolación simple y múltiple
 *  · diccionario sano: sin claves ni valores vacíos
 *  · idiomaValido: basura → español
 *  · timeAgo bilingüe
 *  · invariantes estáticos: shell con useT, uiLang en ajustes con saneo
 *    y <html lang>, selector en Ajustes
 *  · tríada de versiones 1.29.0 coherente
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { traducir, EN } from "../src/lib/i18n";
import { idiomaValido, IDIOMAS_UI, IDIOMA_BASE } from "../src/lib/idioma";
import { timeAgo } from "../src/lib/history";
import { APP_VERSION, APP_BUILD_DATE } from "../src/lib/version";
import { VERSIONS } from "../src/lib/changelog-meta";

const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

/* ─────────────────── El motor: traducir ─────────────────── */

describe("v1.29.0 — el motor «el español es la clave»", () => {
  it("en español es identidad: la clave ES el texto", () => {
    expect(traducir("Recientes", "es")).toBe("Recientes");
    expect(traducir("Nuevo chat", "es")).toBe("Nuevo chat");
    expect(traducir("Chatear ahora con {n}", "es", { n: "GLM" })).toBe("Chatear ahora con GLM");
  });

  it("en inglés traduce las cadenas canónicas del shell", () => {
    expect(traducir("Recientes", "en")).toBe("Recent");
    expect(traducir("Nuevo chat", "en")).toBe("New chat");
    expect(traducir("Modo Batalla", "en")).toBe("Battle Mode");
    expect(traducir("Actualizar ahora", "en")).toBe("Update now");
    expect(traducir("Estás en la demo estática", "en")).toBe("You are in the static demo");
  });

  it("una clave sin traducción cae al español (nadie se queda colgado)", () => {
    expect(traducir("Texto aún sin traducir", "en")).toBe("Texto aún sin traducir");
    expect(EN["Texto aún sin traducir"]).toBeUndefined();
  });

  it("la interpolación {var} sustituye simples y múltiples", () => {
    expect(traducir("Chatear ahora con {n}", "en", { n: "GPT-6 Astra" })).toBe(
      "Chat now with GPT-6 Astra"
    );
    expect(traducir("{n} modelos · {m} organizaciones", "en", { n: 56, m: 30 })).toBe(
      "56 models · 30 organizations"
    );
    // Sin variables el marcador queda intacto (y en español ni aparece):
    expect(traducir("Chatear ahora con {n}", "en")).toBe("Chat now with {n}");
  });

  it("el diccionario está sano: sin claves ni valores vacíos", () => {
    const claves = Object.keys(EN);
    expect(claves.length).toBeGreaterThan(80);
    for (const [k, v] of Object.entries(EN)) {
      expect(k.trim().length).toBeGreaterThan(0);
      expect(typeof v).toBe("string");
      expect(v.trim().length).toBeGreaterThan(0);
    }
  });

  it("idiomaValido sanea basura hacia el español", () => {
    expect(idiomaValido("en")).toBe("en");
    expect(idiomaValido("es")).toBe("es");
    expect(idiomaValido("fr")).toBe("es");
    expect(idiomaValido(42)).toBe("es");
    expect(idiomaValido(undefined)).toBe("es");
  });

  it("IDIOMAS_UI y el idioma base son coherentes", () => {
    expect(IDIOMA_BASE).toBe("es");
    expect(IDIOMAS_UI.map((i) => i.id)).toEqual(["es", "en"]);
    expect(IDIOMAS_UI.every((i) => i.label.length > 0)).toBe(true);
  });
});

/* ─────────────────── Tiempo relativo bilingüe ─────────────────── */

describe("v1.29.0 — timeAgo en dos idiomas", () => {
  const hace = (ms: number) => Date.now() - ms;

  it("español: igual que siempre", () => {
    expect(timeAgo(hace(10_000), "es")).toBe("ahora");
    expect(timeAgo(hace(12 * 60_000), "es")).toBe("hace 12 min");
    expect(timeAgo(hace(3 * 3_600_000), "es")).toBe("hace 3 h");
    expect(timeAgo(hace(26 * 3_600_000), "es")).toBe("ayer");
    expect(timeAgo(hace(4 * 86_400_000), "es")).toBe("hace 4 días");
  });

  it("inglés: las cinco formas equivalentes", () => {
    expect(timeAgo(hace(10_000), "en")).toBe("now");
    expect(timeAgo(hace(12 * 60_000), "en")).toBe("12 min ago");
    expect(timeAgo(hace(3 * 3_600_000), "en")).toBe("3 h ago");
    expect(timeAgo(hace(26 * 3_600_000), "en")).toBe("yesterday");
    expect(timeAgo(hace(4 * 86_400_000), "en")).toBe("4 days ago");
  });

  it("sin idioma sigue siendo español (compatibilidad con llamadas antiguas)", () => {
    expect(timeAgo(hace(12 * 60_000))).toBe("hace 12 min");
  });
});

/* ─────────────────── Invariantes estáticos ─────────────────── */

describe("v1.29.0 — el shell traducido, pieza a pieza", () => {
  it("los cinco componentes del shell usan useT", () => {
    for (const fichero of [
      "src/components/shell/Sidebar.tsx",
      "src/components/shell/TopBar.tsx",
      "src/components/shell/SearchDialog.tsx",
      "src/components/shell/UpdateGate.tsx",
      "src/components/DemoBanner.tsx",
    ]) {
      expect(leer(fichero)).toContain("useT()");
    }
  });

  it("TopBar traduce los modos vía MODE_META", () => {
    const top = leer("src/components/shell/TopBar.tsx");
    expect(top).toContain("t(MODE_META[arena.mode].label)");
    expect(top).toContain("t(MODE_META[m].sub)");
  });

  it("el Sidebar localiza el tiempo relativo de Recientes", () => {
    const side = leer("src/components/shell/Sidebar.tsx");
    expect(side).toContain("timeAgo(c.ts, idioma)");
  });

  it("settings.tsx declara uiLang, lo sanea y lo aplica al <html lang>", () => {
    const s = leer("src/lib/settings.tsx");
    expect(s).toContain("uiLang: IdiomaUI");
    expect(s).toContain('uiLang: "es"');
    expect(s).toContain("idiomaValido(parsed.uiLang)");
    expect(s).toContain("root.lang = settings.uiLang");
  });

  it("Ajustes trae el selector de idioma en Apariencia", () => {
    const a = leer("src/app/ajustes/page.tsx");
    expect(a).toContain('t("Idioma de la interfaz")');
    expect(a).toContain("settings.uiLang");
    expect(a).toContain("IDIOMAS_UI");
  });

  it("la insignia ¡Nuevo! también se traduce", () => {
    const b = leer("src/lib/badges.tsx");
    expect(b).toContain('t("¡Nuevo!")');
  });

  it("el ajuste entra en el tipo AppSettings y sus valores por defecto", () => {
    const s = leer("src/lib/settings.tsx");
    expect(s).toContain("Idioma (1, v1.29.0)");
  });
});

/* ─────────────────── Tríada de versiones — 1.29.0 ─────────────────── */

describe("tríada de versiones — 1.29.0 coherente en los tres sitios", () => {
  it("version.ts declara 1.29.0", () => {
    expect(APP_VERSION).toBe("1.31.0");
    expect(APP_BUILD_DATE).toBe("2026-09-12");
  });

  it("changelog-meta.ts trae la entrada nueva arriba y encadena el diff", () => {
    const nueva = VERSIONS[2];
    expect(nueva.version).toBe("1.29.0");
    expect(nueva.diffDesde).toBe("1.28.1");
    expect(nueva.hora).toBeTruthy();
    expect(nueva.kinds).toContain("nuevo");
    const versiones = VERSIONS.map((v) => v.version);
    expect(new Set(versiones).size).toBe(versiones.length); // sin duplicados
  });

  it("CHANGELOG.md contiene la entrada con su compare, por encima de la 1.28.1", () => {
    const md = leer("CHANGELOG.md");
    expect(md).toContain("compare/v1.28.1...v1.29.0");
    expect(md).toContain("fundación i18n");
    expect(md.indexOf("## [1.29.0]")).toBeLessThan(md.indexOf("## [1.28.1]"));
  });
});
