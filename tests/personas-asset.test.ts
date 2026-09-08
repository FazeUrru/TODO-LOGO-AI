import { describe, expect, it } from "vitest";
import { FOLLOWUP_RULE, QUALITY_RULES, personaFor } from "../src/lib/personas";
import { MODELS } from "../src/lib/models-data";
import { asset, BASE_PATH } from "../src/lib/asset-path";
import { APP_VERSION } from "../src/lib/version";

describe("personas: personaFor", () => {
  it("devuelve una persona no vacía y estable para cada modelo del catálogo", () => {
    for (const m of MODELS.slice(0, 10)) {
      const p = personaFor(m.id);
      expect(typeof p).toBe("string");
      expect(p.length).toBeGreaterThan(20);
      expect(personaFor(m.id)).toBe(p); // determinista
    }
  });

  it("modelos con ids distintos reciben enfoques de estilo distintos", () => {
    const a = MODELS[0];
    const b = MODELS.find((m) => m.id !== a.id)!;
    expect(personaFor(a.id)).not.toBe(personaFor(b.id));
  });

  it("un id desconocido no revienta: devuelve cadena segura", () => {
    expect(() => personaFor("modelo-inexistente")).not.toThrow();
    expect(typeof personaFor("modelo-inexistente")).toBe("string");
  });

  it("las reglas de calidad y el cierre con diálogo están presentes", () => {
    expect(QUALITY_RULES).toContain("REGLAS DE CALIDAD");
    expect(QUALITY_RULES).toContain("Markdown profesional");
    expect(FOLLOWUP_RULE).toContain("¿Siguiente paso?");
  });
});

describe("asset-path: asset()", () => {
  it("deja intactas las rutas externas, data: y blob:", () => {
    expect(asset("https://example.com/logo.png")).toBe("https://example.com/logo.png");
    expect(asset("data:image/png;base64,xxx")).toBe("data:image/png;base64,xxx");
    expect(asset("blob:abc")).toBe("blob:abc");
  });

  it("maneja valores vacíos y nulos devolviendo cadena vacía", () => {
    expect(asset("")).toBe("");
    expect(asset(undefined)).toBe("");
    expect(asset(null)).toBe("");
  });

  it("en desarrollo (sin basePath) devuelve la ruta tal cual", () => {
    expect(BASE_PATH).toBe("");
    expect(asset("/providers/glm.png")).toBe("/providers/glm.png");
  });
});

describe("version: APP_VERSION", () => {
  it("sigue el formato semántico mayor.menor.parche", () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
