/**
 * Regresión v1.23.0 — «el streaming va al instante y no se atraganta» +
 * «enlaces, archivos y documentos directos sin retención».
 *
 *  · partirCola/vallasAbiertas: la partición incremental que mata el O(n²)
 *    (valla abierta no se corta; lista suelta y cita no se trocean; fija+cola
 *    reconstruye el original)
 *  · el render incremental vive en Markdown (memo + cola pelada)
 *  · vida al instante: el cursor pinta antes del primer delta
 *  · higiene del connect en la ruta de batalla (reloj limpio, tardía cancelada)
 *  · la carta ENLACES_DIRECTOS existe, viaja en los 4 motores y conserva la línea
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { APP_VERSION } from "../src/lib/version";
import { VERSIONS } from "../src/lib/changelog-meta";
import {
  ENLACES_DIRECTOS,
  APPS_SIN_PUDOR,
} from "../src/lib/ai-conducta";
import { partirCola, vallasAbiertas } from "../src/lib/cola-markdown";

const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

/* ─────────────────── Versión y trazabilidad ─────────────────── */

describe("v1.23.0 — versión y trazabilidad", () => {
  it("la app va por la 1.23.0 (la cadena sigue viva)", () => {
    expect(APP_VERSION).toBe("1.35.0");
  });

  it("changelog-meta y CHANGELOG.md relatan la 1.23.0", () => {
    expect(VERSIONS[10].version).toBe("1.26.0");
    expect(VERSIONS[14].version).toBe("1.23.0");
    expect(VERSIONS[14].diffDesde).toBe("1.22.0");
    expect(VERSIONS[14].kinds).toContain("correccion");
    const md = leer("CHANGELOG.md");
    expect(md).toContain("partirCola");
    expect(md).toContain("ENLACES_DIRECTOS");
    expect(md).toContain("no se atraganta");
  });
});

/* ─────────────────── La partición incremental ─────────────────── */

describe("v1.23.0 — partirCola: la cura del O(n²)", () => {
  it("un texto normal se parte por el último doble salto", () => {
    const t = "párrafo uno\n\npárrafo dos\n\ntercero en curso";
    const { fija, cola } = partirCola(t);
    expect(fija).toBe("párrafo uno\n\npárrafo dos");
    expect(cola).toBe("tercero en curso");
  });

  it("invariante: fija + «\\n\\n» + cola reconstruye el original", () => {
    const t = "a\n\nb\n\nc\n\nd";
    const { fija, cola } = partirCola(t);
    expect(fija + "\n\n" + cola).toBe(t);
  });

  it("una valla ABIERTA en la cabeza impide cortar: todo a la cola", () => {
    const t = "```html\n<div>\n\nesto parece nuevo pero el bloque sigue";
    const { fija, cola } = partirCola(t);
    expect(fija).toBe("");
    expect(cola).toBe(t);
  });

  it("una valla CERRADA se fija: el código completo se pinta una sola vez", () => {
    const t = "antes\n\n```js\nconst a = 1;\n```\n\nsigue";
    const { fija, cola } = partirCola(t);
    expect(fija).toBe("antes\n\n```js\nconst a = 1;\n```");
    expect(cola).toBe("sigue");
  });

  it("no parte una lista suelta en dos (la renumeración es el diablo)", () => {
    const t = "1. uno\n\n2. dos en curso";
    const { fija, cola } = partirCola(t);
    expect(fija).toBe("");
    expect(cola).toBe(t);
  });

  it("tampoco trocea una cita (blockquote) en dos", () => {
    const t = "> línea uno\n\n> línea dos en curso";
    const { fija, cola } = partirCola(t);
    expect(fija).toBe("");
    expect(cola).toBe(t);
  });

  it("sin doble salto no hay corte: una sola línea va entera a la cola", () => {
    const { fija, cola } = partirCola("una sola línea");
    expect(fija).toBe("");
    expect(cola).toBe("una sola línea");
  });

  it("texto vacío no explota", () => {
    expect(partirCola("")).toEqual({ fija: "", cola: "" });
  });

  it("vallasAbiertas cuenta ``` y ~~~ (impar = abierta)", () => {
    expect(vallasAbiertas("hola\n```js\ncode")).toBe(true);
    expect(vallasAbiertas("hola\n```js\ncode\n```")).toBe(false);
    expect(vallasAbiertas("~~~\ntexto")).toBe(true);
    expect(vallasAbiertas("sin vallas")).toBe(false);
  });
});

/* ─────────────────── El render y el cursor ─────────────────── */

describe("v1.23.0 — render incremental y vida al instante", () => {
  it("Markdown usa el cuerpo memoizado y la cola pelada (sin Prism en vivo)", () => {
    const md = leer("src/components/arena/Markdown.tsx");
    expect(md).toContain("memo(function CuerpoMarkdown");
    expect(md).toContain("PrePelado");
    expect(md).toContain("partirCola(children)");
    expect(md).toContain('enVivo');
  });

  it("el cursor parpadea antes del primer delta (ChatExperience)", () => {
    const chat = leer("src/components/arena/ChatExperience.tsx");
    expect(chat).toContain("vida al instante");
    expect(chat).toContain("      flush();");
  });

  it("la ruta de batalla limpia el reloj del connect y cancela la conexión tardía", () => {
    const battle = leer("src/app/api/battle/route.ts");
    expect(battle).toContain("clearTimeout(relojConexion)");
    expect(battle).toContain("lector.cancel()");
    expect(battle).toContain("higiene de la carrera");
  });
});

/* ─────────────────── La carta de enlaces directos ─────────────────── */

describe("v1.23.0 — ENLACES_DIRECTOS: la puerta, no la conferencia", () => {
  it("la carta existe con su rótulo y su sustancia", () => {
    expect(ENLACES_DIRECTOS).toContain("ENLACES DIRECTOS SIN RETENCIÓN");
    expect(ENLACES_DIRECTOS).toContain("no puedo proporcionar enlaces");
    expect(ENLACES_DIRECTOS).toContain("arXiv");
    expect(ENLACES_DIRECTOS).toContain("Proyecto Gutenberg");
    expect(ENLACES_DIRECTOS).toContain("Wayback");
    expect(ENLACES_DIRECTOS.length).toBeGreaterThan(1200);
  });

  it("genera archivos a medida y no inventa URLs (honestidad)", () => {
    expect(ENLACES_DIRECTOS).toContain("lo GENERAS en la respuesta");
    expect(ENLACES_DIRECTOS).toContain("Nunca inventes URLs");
  });

  it("LA LÍNEA se conserva: la copia pirata de la obra de turno no se reparte", () => {
    expect(ENLACES_DIRECTOS).toContain("copia pirata");
    expect(ENLACES_DIRECTOS).toContain("no se reparte");
  });

  it("viaja tras Apps sin pudor en los 4 motores grandes (orden sagrado)", () => {
    for (const ruta of [
      "src/app/api/battle/route.ts",
      "src/app/api/tournament/route.ts",
      "src/app/api/v2/battle/route.ts",
      "src/app/api/dia/route.ts",
    ]) {
      const t = leer(ruta);
      expect(t).toContain("ENLACES_DIRECTOS");
      expect(t.indexOf("APPS_SIN_PUDOR")).toBeLessThan(t.indexOf("ENLACES_DIRECTOS"));
    }
  });

  it("no viaja al 2v2, ni al árbitro, ni a TTS, ni al agente", () => {
    expect(leer("src/app/api/labs/duelo-equipos/route.ts")).not.toContain("ENLACES_DIRECTOS");
    expect(leer("src/app/api/tts/route.ts")).not.toContain("ENLACES_DIRECTOS");
    expect(leer("src/app/api/agent/route.ts")).not.toContain("ENLACES_DIRECTOS");
  });

  it("el conjunto de cartas queda completo y en orden en la conducta", () => {
    const conducta = leer("src/lib/ai-conducta.ts");
    expect(conducta.indexOf("LADO_OSCURO =")).toBeLessThan(conducta.indexOf("APPS_SIN_PUDOR ="));
    expect(conducta.indexOf("APPS_SIN_PUDOR =")).toBeLessThan(conducta.indexOf("ENLACES_DIRECTOS ="));
  });
});
