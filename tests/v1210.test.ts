/**
 * Regresión v1.21.0 — «el Modo Código dice la verdad» + Labs duelo-equipos.
 * Cada bloque persigue un bug real o fija una regla nueva:
 *  · el clasificador ya confunde una app fullstack con un juego (bug del
 *    marco «Juego en tiempo real»: cualquier HTML completo era «jugable»)
 *  · el Modo Código depende de lo que pide el usuario (servidor y espejo demo)
 *  · la mecánica 2v2: sorteo válido, apoyo y árbitro determinista
 *  · la regla nº 2 de Labs: el duelo por equipos NO toca el ELO global
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { APP_VERSION } from "../src/lib/version";
import { VERSIONS } from "../src/lib/changelog-meta";
import { LABS_FEATURES, featurePorId, registroSano } from "../src/lib/labs";
import {
  clasificarHtml,
  extraerBloqueHtml,
  quitarBloqueHtml,
  esDocumentoCompleto,
} from "../src/lib/clasificador-html";
import {
  sortearEquipos,
  veredictoDeterminista,
  poolEquipos,
  marcadorInicial,
  leerMarcador,
} from "../src/lib/duelo-equipos";
import { esGenerativo } from "../src/lib/models-data";

const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

/* ─────────────────── Versión y trazabilidad ─────────────────── */

describe("v1.21.0 — versión y trazabilidad", () => {
  it("la app va por la 1.22.0 (la cadena sigue viva)", () => {
    expect(APP_VERSION).toBe("1.32.0");
  });

  it("changelog-meta y CHANGELOG.md relatan la 1.21.0", () => {
    expect(VERSIONS[13].version).toBe("1.21.0");
    expect(VERSIONS[13].diffDesde).toBe("1.20.0");
    expect(VERSIONS[13].kinds).toContain("correccion");
    const md = leer("CHANGELOG.md");
    expect(md).toContain("Juego en tiempo real");
    expect(md).toContain("duelo-equipos");
    expect(md).toContain("/labs/duelo-equipos");
  });
});

/* ─────────────────── El clasificador: juego vs app ─────────────────── */

/** Fabrica un HTML con relleno honesto para superar la barrera de enjundia. */
const relleno = (n: number) => `<!-- ${"x".repeat(n)} -->`;
const doc = (interior: string) => `<!doctype html>\n<html lang="es"><head><meta charset="utf-8"><title>t</title></head><body>${interior}${relleno(1600)}</body></html>`;

const HTML_JUEGO_CANVAS = doc(
  `<canvas id="lienz"></canvas><script>const bucle=()=>{requestAnimationFrame(bucle)};addEventListener("keydown",()=>{});let puntuacion=0,enemigo=null,oleada=1,vidas=3;</script>`
);
const HTML_JUEGO_DOM = doc(
  `<div id="hud">puntos</div><script>const bucle=()=>{requestAnimationFrame(bucle)};addEventListener("keydown",()=>{});const enemigo=document.createElement("div");let puntuacion=0,oleada=1,vidas=3,récord=0;</script>`
);
const HTML_APP_CRUD = doc(
  `<form id="alta"><input name="titulo"/><button type="submit">Guardar</button></form><ul id="lista"></ul><script>addEventListener("submit",(e)=>{e.preventDefault();fetch("/api/items").then(r=>r.json())});</script>`
);
const HTML_APP_DASHBOARD = doc(
  `<canvas id="grafico-ventas"></canvas><script>const ctx=document.getElementById("grafico-ventas").getContext("2d");new Chart(ctx,{type:"bar"});</script>`
);
const FRAGMENTO = `<div>tarjeta</div><canvas width="80" height="20"></canvas>${relleno(1600)}`;

describe("v1.21.0 — clasificador de artefactos HTML", () => {
  it("un juego con canvas, bucle y teclado ES un juego", () => {
    expect(clasificarHtml(HTML_JUEGO_CANVAS)).toBe("juego");
  });

  it("un juego de DOM (bucle + teclado + vocabulario, sin canvas) ES un juego", () => {
    expect(clasificarHtml(HTML_JUEGO_DOM)).toBe("juego");
  });

  it("una app CRUD sin señales de juego es una APP — el bug original, clavado", () => {
    expect(clasificarHtml(HTML_APP_CRUD)).toBe("app");
  });

  it("un dashboard con canvas (gráfico) pero sin bucle/teclado NO es un juego", () => {
    expect(clasificarHtml(HTML_APP_DASHBOARD)).toBe("app");
  });

  it("un fragmento suelto no clasifica como artefacto", () => {
    expect(esDocumentoCompleto(FRAGMENTO)).toBe(false);
    expect(clasificarHtml(FRAGMENTO)).toBe(null);
  });

  it("extraerBloqueHtml funciona con fences cerrados y en construcción", () => {
    const cerrado = "antes\n```html\n" + HTML_JUEGO_CANVAS + "\n```\ndespués";
    const abierto = "antes\n```html\n" + HTML_JUEGO_CANVAS;
    expect(extraerBloqueHtml(cerrado)?.completo).toBe(true);
    expect(extraerBloqueHtml(abierto)?.completo).toBe(false);
    expect(quitarBloqueHtml(cerrado)).toBe("antes\n\ndespués");
    expect(extraerBloqueHtml("sin fence")).toBe(null);
  });
});

/* ─────────────────── Modo Código: depende de lo que pidas ─────────────────── */

describe("v1.21.0 — el Modo Código depende de la petición", () => {
  it("el servidor declara la regla de artefacto (HTML único solo si piden juego)", () => {
    const battle = leer("src/app/api/battle/route.ts");
    expect(battle).toContain("REGLA DE ARTEFACTO");
    expect(battle).toContain("juego o algo jugable");
  });

  it("el espejo demo tiene las tres rutas: juego, fullstack y snippet", () => {
    const demo = leer("src/lib/demo-engine.ts");
    expect(demo).toContain("function codigoDe(");
    expect(demo).toContain("function juegoJugable(");
    expect(demo).toContain("function fullstackDe(");
    expect(demo).toContain("RE_JUEGO_PEDIDO");
    expect(demo).toContain("RE_FULLSTACK_PEDIDO");
  });

  it("la interfaz usa el clasificador y distingue kind juego|app", () => {
    const chat = leer("src/components/arena/ChatExperience.tsx");
    expect(chat).toContain('from "@/lib/clasificador-html"');
    expect(chat).toContain('kind?: "juego" | "app"');
    expect(chat).toContain("clasificarHtml(j.code)");
    // en una app el código NO se retira de la respuesta
    expect(chat).toContain('t.kind === "juego" && extraerBloqueHtml(t.content)');
  });

  it("GamePanel cambia de rótulo según el tipo (marcos honestos)", () => {
    const panel = leer("src/components/arena/GamePanel.tsx");
    expect(panel).toContain('tipo?: "juego" | "app"');
    expect(panel).toContain('"App en vivo"');
    expect(panel).toContain('"Juego en tiempo real"');
  });

  it("el juego jugable del demo cumple las señales del clasificador", () => {
    const demo = leer("src/lib/demo-engine.ts");
    const cuerpo = demo.slice(demo.indexOf("function juegoJugable"));
    expect(/<canvas/.test(cuerpo)).toBe(true);
    expect(/requestAnimationFrame/.test(cuerpo)).toBe(true);
    expect(/keydown/.test(cuerpo)).toBe(true);
    expect(/puntuaci/.test(cuerpo)).toBe(true);
  });
});

/* ─────────────────── Labs: duelo por equipos 2v2 ─────────────────── */

describe("v1.21.0 — mecánica del duelo 2v2", () => {
  it("el sorteo produce 5 contendientes distintos, todos de texto", () => {
    const { azul, rojo, arbitro } = sortearEquipos();
    const ids = [azul[0].id, azul[1].id, rojo[0].id, rojo[1].id, arbitro.id];
    expect(new Set(ids).size).toBe(5);
    const catalogo = poolEquipos();
    for (const id of ids) {
      const m = catalogo.find((x) => x.id === id);
      expect(m).toBeDefined();
      expect(esGenerativo(m!)).toBe(false);
    }
  });

  it("mismo seed → mismo sorteo (determinista como el Duelo del día)", () => {
    const a = sortearEquipos(2026);
    const b = sortearEquipos(2026);
    expect(a.azul.map((m) => m.id)).toEqual(b.azul.map((m) => m.id));
    expect(a.rojo.map((m) => m.id)).toEqual(b.rojo.map((m) => m.id));
    expect(a.arbitro.id).toBe(b.arbitro.id);
  });

  it("el veredicto determinista premia al ganador y repite resultado", () => {
    const { azul, rojo } = sortearEquipos(7);
    const idsAzul = [azul[0].id, azul[1].id] as [string, string];
    const idsRojo = [rojo[0].id, rojo[1].id] as [string, string];
    const v1 = veredictoDeterminista(idsAzul, idsRojo, "¿Cómo enseñar recursividad con pizza?");
    const v2 = veredictoDeterminista(idsAzul, idsRojo, "¿Cómo enseñar recursividad con pizza?");
    expect(v1).toEqual(v2);
    expect(["azul", "rojo"]).toContain(v1.veredicto); // con consigna, se moja
    if (v1.veredicto === "azul") expect(v1.notaAzul).toBeGreaterThanOrEqual(v1.notaRojo);
    else expect(v1.notaRojo).toBeGreaterThanOrEqual(v1.notaAzul);
    // consigna vacía → empate técnico, nunca un ganador inventado
    const vacio = veredictoDeterminista(idsAzul, idsRojo, "   ");
    expect(vacio.veredicto).toBe("empate");
  });

  it("sin almacenamiento el marcador empieza a cero (y no explota)", () => {
    expect(leerMarcador()).toEqual(marcadorInicial());
  });
});

describe("v1.21.0 — Labs: registro y regla del ELO sagrado", () => {
  it("duelo-equipos está en el catálogo, en pruebas y con página propia", () => {
    const f = featurePorId("duelo-equipos");
    expect(f).toBeDefined();
    expect(f?.estado).toBe("en-pruebas");
    expect(f?.cohorte).toBe("explorer");
    expect(f?.url).toBe("/labs/duelo-equipos");
    expect(LABS_FEATURES.filter((x) => x.url).length).toBe(1);
    expect(registroSano()).toEqual([]);
  });

  it("la API del duelo NO escribe en la base de datos (regla nº 2 de Labs)", () => {
    const ruta = leer("src/app/api/labs/duelo-equipos/route.ts");
    // Sin comentarios: la doctrina menciona `db.` — lo que no puede haber es código.
    const codigo = ruta
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/[^\n]*/g, "");
    expect(codigo).not.toMatch(/\bdb\./);
    expect(codigo).not.toMatch(/vote\.create|EloState/);
    expect(ruta).toContain("acumular"); // rate-limit propio
  });

  it("el espejo demo atiende el endpoint del duelo por equipos", () => {
    const demo = leer("src/lib/demo-engine.ts");
    expect(demo).toContain('"/api/labs/duelo-equipos"');
    expect(demo).toContain("handleDueloEquipos");
  });

  it("la página existe, tiene puerta de activación y telemetría", () => {
    const pagina = leer("src/app/labs/duelo-equipos/page.tsx");
    expect(pagina).toContain('useFeature("duelo-equipos")');
    expect(pagina).toContain("reportarEventoLabs");
    expect(pagina).toContain("anotarVeredicto");
  });
});
