/**
 * tests/v1310.test.ts — «Leer en voz alta» (TTS del navegador) + insignia
 * ¡Nuevo! de la Calculadora.
 *
 * Cubre: textoParaLeer (markdown → texto digerible), partirEnFrases (cortes
 * honestos), comportamiento seguro sin speechSynthesis (SSR/node), invariantes
 * estáticos (botón TTS en PanelRespuesta, badge de calculadora) y tríada
 * de versiones 1.31.0 coherente.
 */
import { describe, it, expect, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { textoParaLeer, partirEnFrases, vozDisponible, hablar, detenerVoz } from "@/lib/voz";
import { APP_VERSION } from "@/lib/version";
import { VERSIONS } from "@/lib/changelog-meta";

const RAIZ = join(__dirname, "..");
const leer = (p: string) => readFileSync(join(RAIZ, p), "utf8");

describe("v1.31.0 · textoParaLeer", () => {
  it("elimina cabeceras, negritas, cursivas y tachados", () => {
    expect(textoParaLeer("## Título\nEsto es **importante** y *fino* y ~~falso~~")).toBe(
      "Título Esto es importante y fino y falso"
    );
  });

  it("los enlaces se leen por su texto visible", () => {
    expect(textoParaLeer("Mira [la documentación](https://example.com) entera")).toBe(
      "Mira la documentación entera"
    );
  });

  it("el código se anuncia, no se lee", () => {
    const out = textoParaLeer("Antes ```js\nconst x = 1;\n``` después");
    expect(out).toContain("(bloque de código)");
    expect(out).not.toContain("const x");
    expect(textoParaLeer("Usa `npm install` para empezar")).toBe("Usa npm install para empezar");
  });

  it("colapsa espacios sobrantes y recorta", () => {
    expect(textoParaLeer("  hola   mundo  ")).toBe("hola mundo");
  });
});

describe("v1.31.0 · partirEnFrases", () => {
  it("texto corto: un solo trozo", () => {
    expect(partirEnFrases("Hola mundo.")).toEqual(["Hola mundo."]);
    expect(partirEnFrases("   ")).toEqual([]);
  });

  it("respeta el corte de frase al superar el límite", () => {
    const texto = "Primera frase corta. ".repeat(30); // 20 chars × 30 = 600
    const trozos = partirEnFrases(texto, 120);
    expect(trozos.length).toBeGreaterThan(3);
    for (const t of trozos) expect(t.length).toBeLessThanOrEqual(130);
    const vuelta = trozos.join(" ");
    expect(vuelta.replace(/\s+/g, " ")).toBe(texto.replace(/\s+/g, " ").trim());
  });

  it("una frase gigante se parte por espacios, nunca a mitad de palabra", () => {
    const frase = "palabra ".repeat(80).trim(); // 640 chars sin punto
    const trozos = partirEnFrases(frase, 100);
    expect(trozos.length).toBeGreaterThan(4);
    for (const t of trozos) {
      expect(t.length).toBeLessThanOrEqual(110);
      expect(t.startsWith("pal")).toBe(true);
      expect(t.endsWith("palabra")).toBe(true);
    }
  });

  it("palabra gigante sin espacios: corte duro", () => {
    const trozos = partirEnFrases("a".repeat(250), 100);
    expect(trozos.length).toBe(3);
    expect(trozos[0].length).toBe(100);
  });
});

describe("v1.31.0 · comportamiento seguro sin navegador", () => {
  afterEach(() => {
    detenerVoz();
  });

  it("vozDisponible es false en node (sin window)", () => {
    expect(vozDisponible()).toBe(false);
  });

  it("detenerVoz no explota sin speechSynthesis", () => {
    expect(() => detenerVoz()).not.toThrow();
  });

  it("hablar avisa onError sin sintetizador y nunca lanza", () => {
    let error = false;
    let fin = false;
    expect(() =>
      hablar("Texto de prueba para leer", {
        idioma: "es",
        onFin: () => (fin = true),
        onError: () => (error = true),
      })
    ).not.toThrow();
    expect(error).toBe(true);
    expect(fin).toBe(false);
  });

  it("hablar con texto vacío tras limpiar también avisa onError", () => {
    let error = false;
    hablar("```js\nsolo codigo\n```", { idioma: "en", onError: () => (error = true) });
    // el bloque se anuncia con «(bloque de código)», así que hay algo que leer:
    // el error real viene de la ausencia de síntesis, no del texto.
    expect(error).toBe(true);
  });
});

describe("v1.31.0 · invariantes estáticos", () => {
  it("PanelRespuesta integra el botón TTS con limpieza al desmontar", () => {
    const src = leer("src/components/arena/ChatExperience.tsx");
    expect(src).toContain('import { hablar, detenerVoz } from "@/lib/voz"');
    expect(src).toContain('trad("Leer en voz alta")');
    expect(src).toContain('trad("Detener lectura")');
    expect(src).toContain("hablar(t.content, {");
    expect(src).toContain("useEffect(() => () => detenerVoz(), [])");
  });

  it("la calculadora tiene insignia en el menú y marca uso al visitarla", () => {
    const sidebar = leer("src/components/shell/Sidebar.tsx");
    expect(sidebar).toContain('"Calculadora", Calculator, "calculadora"');
    const page = leer("src/app/calculadora/page.tsx");
    expect(page).toContain('markUsed("calculadora")');
  });

  it("el diccionario traduce las etiquetas del TTS", () => {
    const i18n = leer("src/lib/i18n.tsx");
    expect(i18n).toContain('"Leer en voz alta": "Read aloud"');
    expect(i18n).toContain('"Detener lectura": "Stop reading"');
  });
});

describe("v1.31.0 · tríada de versiones", () => {
  it("APP_VERSION es 1.31.0", () => {
    expect(APP_VERSION).toBe("1.38.0");
  });

  it("VERSIONS[1] describe la 1.31.0 y encadena el diff", () => {
    expect(VERSIONS[7].version).toBe("1.31.0");
    expect(VERSIONS[7].diffDesde).toBe("1.30.0");
    expect(VERSIONS[7].kinds).toContain("nuevo");
    expect(VERSIONS[8].version).toBe("1.30.0");
  });

  it("CHANGELOG.md trae la 1.31.0 por encima de la 1.30.0", () => {
    const md = leer("CHANGELOG.md");
    expect(md.indexOf("## [1.31.0]")).toBeLessThan(md.indexOf("## [1.30.0]"));
    expect(md).toContain("compare/v1.30.0...v1.31.0");
  });
});
