import { describe, it, expect } from "vitest";
import { esVersionMenor, APP_VERSION } from "../src/lib/version";
import {
  LABS_FEATURES,
  COHORTES,
  cohorteDeSesion,
  puedeActivar,
  featurePorId,
  registroSano,
  TIPOS_EVENTO,
  LABS_APERTURA,
} from "../src/lib/labs";
import { VERSIONS, enlaceTraza } from "../src/lib/changelog-meta";
import { MODELS } from "../src/lib/models-data";

describe("v1.14.0 — comparador de versiones (UpdateGate)", () => {
  it("detecta correctamente mayor/menor/igual", () => {
    expect(esVersionMenor("1.13.0", "1.14.0")).toBe(true);
    expect(esVersionMenor("1.14.0", "1.13.0")).toBe(false);
    expect(esVersionMenor("1.14.0", "1.14.0")).toBe(false);
    expect(esVersionMenor("1.9.10", "1.10.0")).toBe(true); // 10 > 9, comparación numérica
    expect(esVersionMenor("2.0.0", "1.99.99")).toBe(false);
    expect(esVersionMenor("1.14", "1.14.0")).toBe(false); // segmentos ausentes = 0
  });

  it("la versión del bundle nunca es menor que sí misma", () => {
    expect(esVersionMenor(APP_VERSION, APP_VERSION)).toBe(false);
  });
});

describe("v1.14.0 — registro de Todólogo Labs", () => {
  it("el registro está sano: ids únicos, cohortes válidas, expira > apertura y métricas mínimas", () => {
    expect(registroSano()).toEqual([]);
  });

  it("todos los tipos de evento declarados son válidos", () => {
    for (const f of LABS_FEATURES) {
      for (const m of f.metricas) {
        expect(TIPOS_EVENTO, `${f.id} declara métrica inválida: ${m}`).toContain(m);
      }
    }
  });

  it("la regla de las 8 semanas: toda feature expira tras la apertura", () => {
    for (const f of LABS_FEATURES) {
      expect(new Date(f.expira).getTime()).toBeGreaterThan(new Date(LABS_APERTURA).getTime());
      // y como mucho ~8 semanas + margen
      const dias = (new Date(f.expira).getTime() - new Date(LABS_APERTURA).getTime()) / 86_400_000;
      expect(dias).toBeLessThan(60);
    }
  });

  it("jerarquía de cohortes: inner ⊇ builder ⊇ explorer", () => {
    const copa = featurePorId("copa-32-64")!;
    const api = featurePorId("api-publica")!;
    const trueSkill = featurePorId("elo-bayesiano")!;
    expect(puedeActivar(copa, "explorer")).toBe(true);
    expect(puedeActivar(api, "explorer")).toBe(false);
    expect(puedeActivar(api, "builder")).toBe(true);
    expect(puedeActivar(trueSkill, "builder")).toBe(false);
    expect(puedeActivar(trueSkill, "inner")).toBe(true);
  });

  it("cohorte de sesión: anónimo → explorer, registrado → builder, invitado → inner", () => {
    expect(cohorteDeSesion({ conectado: false })).toBe("explorer");
    expect(cohorteDeSesion({ conectado: true, email: "a@b.c", emailsInner: [] })).toBe("builder");
    expect(
      cohorteDeSesion({ conectado: true, email: "jefe@todologo.ai", emailsInner: ["jefe@todologo.ai"] })
    ).toBe("inner");
    // insensible a mayúsculas
    expect(
      cohorteDeSesion({ conectado: true, email: "JEFE@TODOLOGO.AI", emailsInner: ["jefe@todologo.ai"] })
    ).toBe("inner");
  });

  it("las 3 cohortes están documentadas y las features repartidas entre las tres", () => {
    expect(Object.keys(COHORTES).sort()).toEqual(["builder", "explorer", "inner"]);
    const usadas = new Set(LABS_FEATURES.map((f) => f.cohorte));
    expect(usadas).toEqual(new Set(["explorer", "builder", "inner"]));
  });

  it("featurePorId devuelve undefined ante ids desconocidos (API robusta)", () => {
    expect(featurePorId("no-existe")).toBeUndefined();
  });
});

describe("v1.14.0 — changelog como fuente de datos", () => {
  it("las versiones van en orden descendente estricto y sin duplicados", () => {
    const nums = VERSIONS.map((v) => v.version.split(".").map(Number));
    for (let i = 1; i < nums.length; i++) {
      const a = nums[i - 1];
      const b = nums[i];
      const mayor = a[0] > b[0] || (a[0] === b[0] && (a[1] > b[1] || (a[1] === b[1] && (a[2] ?? 0) > (b[2] ?? 0))));
      expect(mayor, `v${VERSIONS[i - 1].version} debe ir antes que v${VERSIONS[i].version}`).toBe(true);
    }
    expect(new Set(VERSIONS.map((v) => v.version)).size).toBe(VERSIONS.length);
  });

  it("cadena de diffs completa: toda versión salvo la primera enlaza a otra versión real", () => {
    const ids = new Set(VERSIONS.map((v) => v.version));
    for (const v of VERSIONS) {
      if (v.version === "1.0.0") {
        expect(v.hash).toBeTruthy(); // la primera apunta a su commit
        continue;
      }
      expect(v.diffDesde, `v${v.version} sin diffDesde`).toBeTruthy();
      expect(ids.has(v.diffDesde!), `v${v.version} enlaza a una versión inexistente`).toBe(true);
    }
  });

  it("cada versión tiene TL;DR de impacto y hora real salvo la fundacional", () => {
    for (const v of VERSIONS) {
      expect(v.tldr.length).toBeGreaterThan(20);
      if (v.version !== "1.0.0") {
        expect(v.hora).toMatch(/^\d{2}:\d{2}$/);
      }
    }
  });

  it("el enlace de traza es un diff compare para todas menos la inicial", () => {
    for (const v of VERSIONS.slice(0, VERSIONS.length - 1)) {
      const t = enlaceTraza(v);
      expect(t.href).toContain("/compare/");
      expect(t.texto).toContain("diff");
    }
    const primera = enlaceTraza(VERSIONS[VERSIONS.length - 1]);
    expect(primera.href).toContain("/commit/");
  });

  it("regresión: ningún modelo fantasma Gemini 3.8 en el catálogo", () => {
    const ids = MODELS.map((m) => m.id);
    expect(ids).not.toContain("gemini-3.8-pro");
    expect(ids).not.toContain("gemini-3.8-flash");
    expect(ids).toContain("gemini-3-pro"); // el real, de nov 2025
  });

  it("DeepSeek V4.1 Flash: lanzada hoy, con ¡Nuevo! y sin sustituir a la V4-Flash de julio", () => {
    const nueva = MODELS.find((m) => m.id === "deepseek-v4.1-flash");
    expect(nueva).toBeTruthy();
    expect(nueva!.name).toBe("DeepSeek V4.1 Flash");
    expect(nueva!.released).toBe("2026-09-09");
    expect(nueva!.isNew).toBe(true);
    expect(nueva!.categories).toContain("vision"); // entrada nativa imagen+texto
    // la V4-Flash original (julio) sigue en el catálogo
    expect(MODELS.find((m) => m.id === "deepseek-v4-flash")).toBeTruthy();
  });
});
