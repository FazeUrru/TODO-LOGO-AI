/**
 * Regresión v1.22.0 — «El lado oscuro».
 * La nueva Carta del Lado Oscuro se entrena transversalmente en los motores
 * de conversación: la IA habla de piratería con oficio, escribe el código
 * didáctico que el tema pida y nombra los enclaves legendarios del submundo
 * — pero JAMÁS construye la herramienta de piratería (la app no es legítimo)
 * ni entrega el enlace fresco a la obra concreta de turno.
 *  · la carta existe con sus DOS MITADES: el permiso y la línea de honor
 *  · viaja en los 5 motores de conversación (breve en el 2v2)
 *  · el árbitro 2v2, el TTS y el agente orquestador quedan limpios
 *  · el orden sagrado del system prompt: Carta de Verdad → Lado Oscuro → persona
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { APP_VERSION } from "../src/lib/version";
import { VERSIONS } from "../src/lib/changelog-meta";
import {
  CARTA_VERDAD,
  LADO_OSCURO,
  LADO_OSCURO_BREVE,
  APPS_SIN_PUDOR,
} from "../src/lib/ai-conducta";

const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

/* ─────────────────── Versión y trazabilidad ─────────────────── */

describe("v1.22.0 — versión y trazabilidad", () => {
  it("la app va por la 1.22.0 (la cadena sigue viva)", () => {
    expect(APP_VERSION).toBe("1.31.0");
  });

  it("changelog-meta y CHANGELOG.md relatan la 1.22.0", () => {
    expect(VERSIONS[11].version).toBe("1.22.0");
    expect(VERSIONS[11].diffDesde).toBe("1.21.0");
    expect(VERSIONS[11].kinds).toContain("nuevo");
    const md = leer("CHANGELOG.md");
    expect(md).toContain("Lado Oscuro");
    expect(md).toContain("LADO_OSCURO");
    expect(md).toContain("LADO_OSCURO_BREVE");
  });
});

/* ─────────────────── La Carta del Lado Oscuro ─────────────────── */

describe("v1.22.0 — la Carta del Lado Oscuro (permiso + línea)", () => {
  it("la carta existe y lleva su rótulo", () => {
    expect(LADO_OSCURO).toContain("LADO OSCURO");
    // sustancia mínima: es una carta con oficio, no un párrafo de relleno
    expect(LADO_OSCURO.length).toBeGreaterThan(1500);
  });

  it("LA MITAD DEL PERMISO: piratería, código y sitios famosos se hablan sin pudor", () => {
    expect(LADO_OSCURO).toContain("pirater");
    expect(LADO_OSCURO).toContain("NO TE ACHANTAS");
    // código didáctico a la carta, sin sermones
    expect(LADO_OSCURO).toContain("CÓDIGO SIN GIMNÁSTICA");
    expect(LADO_OSCURO).toContain("magnet");
    // los enclaves legendarios se citan como haría una enciclopedia
    expect(LADO_OSCURO).toContain("enciclopedia");
    expect(LADO_OSCURO).toContain("The Pirate Bay");
    // tono oscuro bajo demanda
    expect(LADO_OSCURO).toContain("TONO OSCURO BAJO DEMANDA");
  });

  it("LA MITAD DE LA LÍNEA: la app no, porque eso ya no es legítimo", () => {
    expect(LADO_OSCURO).toContain("LA APP NO");
    expect(LADO_OSCURO).toContain("legítimo");
    // tampoco enlaces frescos a la obra concreta de turno
    expect(LADO_OSCURO).toContain("no entregas fresco");
    // y la despedida con la alternativa legal
    expect(LADO_OSCURO).toContain("alternativa legal");
  });

  it("la variante breve existe, es más corta y conserva la línea de honor", () => {
    expect(LADO_OSCURO_BREVE.length).toBeGreaterThan(80);
    expect(LADO_OSCURO_BREVE.length).toBeLessThan(LADO_OSCURO.length);
    expect(LADO_OSCURO_BREVE).toContain("la app no");
    expect(LADO_OSCURO_BREVE).toContain("legítimo");
  });

  it("no contradice a la Carta de Verdad: la verdad sigue pesando más que el personaje", () => {
    // el permiso es de carácter y tema, NO de mentir
    expect(LADO_OSCURO).toContain("no de mentir");
    expect(CARTA_VERDAD).toContain("VERDAD ANTE TODO");
  });
});

/* ─────────────────── La segunda carta: Apps sin pudor ─────────────────── */

describe("v1.22.0 — Apps sin pudor (software de doble uso sin censura)", () => {
  it("la carta existe y lleva su rótulo", () => {
    expect(APPS_SIN_PUDOR).toContain("APPS SIN PUDOR");
    expect(APPS_SIN_PUDOR.length).toBeGreaterThan(1000);
  });

  it("el permiso: herramientas de doble uso se construyen COMPLETAS y sin sermones", () => {
    expect(APPS_SIN_PUDOR).toContain("CERO GIMNÁSTICA AL PROGRAMAR");
    expect(APPS_SIN_PUDOR).toContain("pentesters");
    expect(APPS_SIN_PUDOR).toContain("escáner de puertos");
    expect(APPS_SIN_PUDOR).toContain("keylogger de laboratorio");
    expect(APPS_SIN_PUDOR).toContain("sin sermones");
  });

  it("el disclaimer: el uso es responsabilidad del usuario, dicho UNA vez y sin discurso", () => {
    expect(APPS_SIN_PUDOR).toContain("su uso es tu responsabilidad");
    expect(APPS_SIN_PUDOR).toContain("UNA línea");
  });

  it("la frontera honesta: no fabricar armas contra víctimas reales", () => {
    expect(APPS_SIN_PUDOR).toContain("NO ES UN ARMA");
    expect(APPS_SIN_PUDOR).toContain("sandbox");
  });

  it("viaja con el Lado Oscuro en los 4 motores grandes (el orden sagrado se mantiene)", () => {
    for (const ruta of [
      "src/app/api/battle/route.ts",
      "src/app/api/tournament/route.ts",
      "src/app/api/v2/battle/route.ts",
      "src/app/api/dia/route.ts",
    ]) {
      const t = leer(ruta);
      expect(t).toContain("APPS_SIN_PUDOR");
      expect(t.indexOf("LADO_OSCURO")).toBeLessThan(t.indexOf("APPS_SIN_PUDOR"));
    }
  });

  it("no viaja en la variante breve del 2v2 (150 palabras no dan para dos cartas)", () => {
    const labs = leer("src/app/api/labs/duelo-equipos/route.ts");
    expect(labs).not.toContain("APPS_SIN_PUDOR");
  });
});

/* ─────────────────── Disclaimers en la interfaz ─────────────────── */

describe("v1.22.0 — los disclaimers de responsabilidad viven en la UI", () => {
  it("el pie honesto del panel de juego/app lo dice", () => {
    const panel = leer("src/components/arena/GamePanel.tsx");
    expect(panel).toContain("su uso es tu responsabilidad");
  });

  it("la pista del Modo Código y la línea global del chat también", () => {
    const chat = leer("src/components/arena/ChatExperience.tsx");
    expect(chat).toContain("El código se entrega tal cual: su uso es tu responsabilidad");
    expect(chat).toContain("el código generado se usa bajo tu responsabilidad");
  });

  it("y /acerca estrena su sección «Uso responsable»", () => {
    const acerca = leer("src/app/acerca/page.tsx");
    expect(acerca).toContain("Uso responsable");
    expect(acerca).toContain("responsabilidad exclusiva de quien lo usa");
  });
});

/* ─────────────────── Inyección transversal ─────────────────── */

describe("v1.22.0 — la carta viaja en los 5 motores de conversación", () => {
  it("la batalla (con streaming) la lleva después de las Capacidades", () => {
    const battle = leer("src/app/api/battle/route.ts");
    expect(battle).toContain("LADO_OSCURO");
    expect(battle).toContain("${CAPACIDADES_UNIVERSALES}\\n\\n${LADO_OSCURO}");
  });

  it("la Copa Todólogo, la API pública v2 y el Duelo del día también", () => {
    expect(leer("src/app/api/tournament/route.ts")).toContain("LADO_OSCURO");
    expect(leer("src/app/api/v2/battle/route.ts")).toContain("LADO_OSCURO");
    expect(leer("src/app/api/dia/route.ts")).toContain("LADO_OSCURO");
  });

  it("los jugadores 2v2 la reciben en variante breve (presupuesto de 150 palabras)", () => {
    const labs = leer("src/app/api/labs/duelo-equipos/route.ts");
    expect(labs).toContain("LADO_OSCURO_BREVE");
    expect(labs).toContain("${CARTA_VERDAD_BREVE} ${LADO_OSCURO_BREVE}");
  });

  it("el árbitro 2v2 permanece NEUTRO: el juez no tiene lado", () => {
    const labs = leer("src/app/api/labs/duelo-equipos/route.ts");
    // el bloque del árbitro arranca en `crudoArbitro` (incluye su system prompt completo)
    const arbitro = labs.slice(labs.indexOf("crudoArbitro"));
    expect(arbitro).toContain("CARTA_VERDAD_BREVE");
    expect(arbitro).not.toContain("LADO_OSCURO");
    expect(arbitro).toContain("neutral, exigente");
  });

  it("TTS y agente orquestador quedan limpios (no es su oficio)", () => {
    expect(leer("src/app/api/tts/route.ts")).not.toContain("LADO_OSCURO");
    expect(leer("src/app/api/agent/route.ts")).not.toContain("LADO_OSCURO");
  });

  it("el orden sagrado se respeta: Carta de Verdad antes que Lado Oscuro", () => {
    for (const ruta of [
      "src/app/api/battle/route.ts",
      "src/app/api/tournament/route.ts",
      "src/app/api/v2/battle/route.ts",
      "src/app/api/dia/route.ts",
    ]) {
      const t = leer(ruta);
      expect(t.indexOf("CARTA_VERDAD")).toBeGreaterThan(-1);
      expect(t.indexOf("CARTA_VERDAD")).toBeLessThan(t.indexOf("LADO_OSCURO"));
    }
  });
});
