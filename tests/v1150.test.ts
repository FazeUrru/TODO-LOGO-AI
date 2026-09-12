import { describe, it, expect } from "vitest";
import { APP_VERSION } from "../src/lib/version";
import { CARTA_VERDAD, CARTA_VERDAD_BREVE } from "../src/lib/ai-conducta";
import { VERSIONS, enlaceTraza } from "../src/lib/changelog-meta";
import { MODELS } from "../src/lib/models-data";

describe("v1.15.0 — versión y trazabilidad", () => {
  it("la app va por la 1.18.0 (la cadena sigue viva)", () => {
    expect(APP_VERSION).toBe("1.26.0");
  });

  it("la entrada 1.16.0 sigue en la cadena y enlaza a su diff", () => {
    const meta = VERSIONS.find((v) => v.version === "1.16.0");
    expect(meta?.diffDesde).toBe("1.15.0");
    expect(enlaceTraza(meta!).href).toContain("compare/v1.15.0...v1.16.0");
  });

  it("la cadena de versiones sigue descendente y sin duplicados", () => {
    for (let i = 1; i < VERSIONS.length; i++) {
      expect(VERSIONS[i - 1].version).not.toBe(VERSIONS[i].version);
    }
    expect(new Set(VERSIONS.map((v) => v.version)).size).toBe(VERSIONS.length);
  });
});

describe("v1.15.0 — Carta de Verdad y Conducta (entrenamiento de los motores)", () => {
  it("prohíbe inventar datos y modelos", () => {
    expect(CARTA_VERDAD).toContain("VERDAD ANTE TODO");
    expect(CARTA_VERDAD).toContain("No inventes nunca");
    expect(CARTA_VERDAD).toContain("NO ALUCINES MODELOS");
  });

  it("obliga a declarar la incertidumbre y marcar estimaciones", () => {
    expect(CARTA_VERDAD).toContain("no lo sé con certeza");
    expect(CARTA_VERDAD).toContain("SEPARA LO CIERTO DE LO PROBABLE");
  });

  it("cubre las preguntas QUE HACE LA IA: concretas, mínimas y honestas", () => {
    expect(CARTA_VERDAD).toContain("PREGUNTAS BIEN HECHAS");
    expect(CARTA_VERDAD).toContain("Nunca finjas saber lo que preguntas");
  });

  it("exige autoverificación y corrección de errores propios", () => {
    expect(CARTA_VERDAD).toContain("AUTOVERIFICACIÓN");
    expect(CARTA_VERDAD).toContain("la verdad pesa más que la coherencia");
  });

  it("la variante breve conserva el contrato esencial (motores con presupuesto estricto)", () => {
    expect(CARTA_VERDAD_BREVE).toContain("Verdad ante todo");
    expect(CARTA_VERDAD_BREVE).toContain("no inventes");
    expect(CARTA_VERDAD_BREVE).toContain("pregunta");
  });
});

describe("v1.15.0 — regreso del catálogo tras la auditoría", () => {
  it("wan-3.0 declara sus categorías (regresión del fix de tipos)", () => {
    const wan = MODELS.find((m) => m.id === "wan-3.0");
    expect(wan).toBeDefined();
    expect(wan?.categories).toContain("video");
  });

  it("ningún modelo generativo se quedó sin categorías", () => {
    const fantasma = MODELS.find(
      (m) => (m.especs ?? m.precioNota) && m.categories.length === 0
    );
    expect(fantasma).toBeUndefined();
  });
});
