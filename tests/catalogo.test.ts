import { describe, it, expect } from "vitest";
import { CATEGORIES, formatContext, getModel, providerOf } from "../src/lib/models-data";

describe("catálogo: getModel", () => {
  it("resuelve ids conocidos y undefined para desconocidos", () => {
    expect(getModel("glm-5.3")?.id).toBe("glm-5.3");
    expect(getModel("no-existe")).toBeUndefined();
  });
});

describe("catálogo: providerOf", () => {
  it("devuelve el proveedor registrado del modelo", () => {
    const m = getModel("glm-5.3")!;
    expect(providerOf(m).id).toBe(m.provider);
    expect(typeof providerOf(m).name).toBe("string");
  });
});

describe("catálogo: formatContext", () => {
  it("formatea millones con un decimal como máximo", () => {
    expect(formatContext(1_000_000)).toBe("1M");
    expect(formatContext(1_500_000)).toBe("1.5M");
  });

  it("formatea miles redondos en K", () => {
    expect(formatContext(58_000)).toBe("58K");
    expect(formatContext(256_000)).toBe("256K");
  });
});

describe("catálogo: CATEGORIES", () => {
  it("abre con la categoría 'todas' y no repite ids", () => {
    expect(CATEGORIES[0].id).toBe("todas");
    const ids = CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
