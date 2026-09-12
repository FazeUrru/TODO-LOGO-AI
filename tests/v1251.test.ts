/**
 * Regresión v1.25.1 — «Adiós al “Unexpected token”: el cliente jamás vuelve
 * a mostrar un error inglés de JSON.parse».
 *
 *  · jsonSeguro: parsea JSON válido; ante HTML de error (página 5xx de
 *    Vercel, 404 de GitHub Pages), texto plano o cuerpo vacío lanza SIEMPRE
 *    un mensaje amable en español con el estado HTTP; el contexto viaja en
 *    el mensaje; un cuerpo cortado a medias no se cuela como válido.
 *  · Cirugía estática: los puntos cliente que antes hacían `.json()` sobre
 *    la respuesta cruda (ChatExperience, /c/[id], /duelo/[id], login,
 *    registro, torneo, duelo-equipos) usan jsonSeguro; el helper lee texto
 *    ANTES de parsear (la única forma honesta de no reventar).
 *  · Los ficheros que degradan con gracia (Salón de la Fama, labs, perfil,
 *    UpdateGate, auth-client) no se tocan: su catch nunca expone el mensaje.
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { jsonSeguro } from "../src/lib/fetch-seguro";
import { APP_VERSION } from "../src/lib/version";
import { VERSIONS } from "../src/lib/changelog-meta";

const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

const HTML_VERCEL =
  "<!DOCTYPE html><html><head><title>Server Error</title></head><body>Internal Server Error</body></html>";
const HTML_404_PAGES =
  "<!DOCTYPE html><html><head><title>Page Not Found</title></head><body>404</body></html>";

const respuesta = (cuerpo: string, init?: ResponseInit) =>
  new Response(cuerpo, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    ...init,
  });

describe("jsonSeguro — el parseo que nunca revienta", () => {
  it("JSON válido se parsea tal cual (objetos y tipos parametrizados)", async () => {
    const r = respuesta('{"ok":true,"url":"/c/c_abc"}', {
      headers: { "Content-Type": "application/json" },
    });
    const d = await jsonSeguro<{ ok: boolean; url: string }>(r);
    expect(d.ok).toBe(true);
    expect(d.url).toBe("/c/c_abc");
  });

  it("JSON con espacios y saltos también pasa", async () => {
    const r = respuesta('  \n {"ok": true} \n', {
      headers: { "Content-Type": "application/json" },
    });
    expect((await jsonSeguro(r)).ok).toBe(true);
  });

  it("HTML de error con status 200 → mensaje amable, nunca «Unexpected token»", async () => {
    const err = await jsonSeguro(respuesta(HTML_VERCEL)).catch((e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toContain("datos no válidos");
    expect(err.message).not.toMatch(/unexpected token/i);
  });

  it("HTML 404 de GitHub Pages con status 404 → el estado HTTP viaja en el mensaje", async () => {
    const err = await jsonSeguro(respuesta(HTML_404_PAGES, { status: 404 })).catch(
      (e: Error) => e
    );
    expect(err.message).toContain("error 404");
    expect(err.message).not.toMatch(/unexpected token/i);
  });

  it("Texto plano tipo «Internal Server Error» → mensaje amable", async () => {
    const err = await jsonSeguro(respuesta("Internal Server Error", { status: 502 })).catch(
      (e: Error) => e
    );
    expect(err.message).toContain("error 502");
  });

  it("Cuerpo vacío → mensaje amable (no «Unexpected end of JSON input»)", async () => {
    const err = await jsonSeguro(respuesta("", { status: 200 })).catch((e: Error) => e);
    expect(err.message).toContain("datos no válidos");
  });

  it("JSON cortado a medias (stream partido) → mensaje amable, no se cuela", async () => {
    const err = await jsonSeguro(respuesta('{"ok":true,"a":"texto sin cerrar', {})).catch(
      (e: Error) => e
    );
    expect(err.message).toContain("datos no válidos");
  });

  it("el contexto opcional aparece en el mensaje", async () => {
    const err = await jsonSeguro(respuesta("nope", { status: 503 }), "el torneo").catch(
      (e: Error) => e
    );
    expect(err.message).toContain("el torneo");
    expect(err.message).toContain("error 503");
  });

  it("si la lectura del cuerpo falla, también hay mensaje amable", async () => {
    const r = respuesta("x");
    await r.body?.cancel(); // el stream queda consumido/roto
    const err = await jsonSeguro(r).catch((e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toContain("No se pudo leer");
  });
});

describe("cirugía estática v1.25.1 — nada de .json() crudo en el cliente expuesto", () => {
  const ficherosCurados = [
    "src/components/arena/ChatExperience.tsx",
    "src/app/c/[id]/conversacion-client.tsx",
    "src/app/duelo/[id]/replay-client.tsx",
    "src/app/iniciar-sesion/page.tsx",
    "src/app/registro/page.tsx",
    "src/components/arena/TournamentView.tsx",
    "src/app/labs/duelo-equipos/page.tsx",
  ];

  for (const fichero of ficherosCurados) {
    it(`${fichero} usa jsonSeguro y no deja .json() crudo`, () => {
      const src = leer(fichero);
      expect(src).toContain('from "@/lib/fetch-seguro"');
      expect(src).not.toMatch(/\.json\(\)/);
    });
  }

  it("el helper lee SIEMPRE el cuerpo como texto antes de parsear", () => {
    const src = leer("src/lib/fetch-seguro.ts");
    expect(src).toContain("await res.text()");
    expect(src.indexOf("await res.text()")).toBeLessThan(src.indexOf("JSON.parse"));
  });

  it("el mensaje amable está en español y sugiere reintentar", () => {
    const src = leer("src/lib/fetch-seguro.ts");
    expect(src).toContain("datos no válidos");
    expect(src).toContain("Inténtalo de nuevo");
  });
});

describe("tríada de versiones v1.25.1", () => {
  it("APP_VERSION coincide con la entrada más reciente del changelog", () => {
    expect(APP_VERSION).toBe("1.28.0");
    expect(VERSIONS[2].version).toBe("1.26.0");
  });

  it("el orden del changelog sigue siendo estrictamente descendente", () => {
    for (let i = 1; i < VERSIONS.length; i++) {
      expect(VERSIONS[i - 1].version).not.toBe(VERSIONS[i].version);
    }
    expect(VERSIONS[2].diffDesde).toBe("1.25.1");
  });
});
