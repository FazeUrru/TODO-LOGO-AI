import { describe, it, expect } from "vitest";
import {
  expectedScore,
  eloDeltaFromVotes,
  categoryElo,
  BATTLE_CATEGORIES,
  NEW_CATEGORIES,
} from "../src/lib/elo";
import { MODELS, PROVIDERS, getModel } from "../src/lib/models-data";

describe("expectedScore (ELO clásico)", () => {
  it("dos modelos iguales → 0.5", () => {
    expect(expectedScore(1500, 1500)).toBeCloseTo(0.5);
  });

  it("400 puntos de ventaja ≈ 0.909", () => {
    expect(expectedScore(1900, 1500)).toBeCloseTo(0.909, 2);
  });

  it("es simétrico: E(a,b) + E(b,a) = 1", () => {
    const a = expectedScore(1520, 1444);
    const b = expectedScore(1444, 1520);
    expect(a + b).toBeCloseTo(1);
  });
});

describe("eloDeltaFromVotes (delta derivado de votos reales)", () => {
  it("sin partidas → 0", () => {
    expect(eloDeltaFromVotes(0, 0, 0)).toBe(0);
  });

  it("más victorias que derrotas → delta positivo", () => {
    expect(eloDeltaFromVotes(10, 2, 0)).toBeGreaterThan(0);
  });

  it("más derrotas que victorias → delta negativo", () => {
    expect(eloDeltaFromVotes(2, 10, 0)).toBeLessThan(0);
  });

  it("los empates suman un empujón pequeño y positivo", () => {
    expect(eloDeltaFromVotes(5, 5, 6)).toBeGreaterThan(0);
  });

  it("nunca supera el acotado ±48", () => {
    expect(eloDeltaFromVotes(5000, 0, 0)).toBeLessThanOrEqual(48);
    expect(eloDeltaFromVotes(0, 5000, 0)).toBeGreaterThanOrEqual(-48);
  });

  it("es un entero (ELO sin decimales)", () => {
    expect(Number.isInteger(eloDeltaFromVotes(7, 3, 2))).toBe(true);
  });
});

describe("categoryElo (ELO por categoría)", () => {
  const coder = getModel("qwen3.8-coder-plus")!;
  const poet = getModel("fable-5.1")!;

  it("global devuelve el ELO base sin tocar", () => {
    expect(categoryElo(coder, "global")).toBe(coder.elo);
  });

  it("es determinista: misma entrada → mismo resultado", () => {
    expect(categoryElo(coder, "codigo")).toBe(categoryElo(coder, "codigo"));
  });

  it("un modelo de código recibe bonus en Código y penalización fuera de su terreno", () => {
    const enCodigo = categoryElo(coder, "codigo");
    const enEscritura = categoryElo(coder, "escritura");
    // el offset aleatorio está acotado a [-20, +34], el bonus/pena es ±14/-26
    expect(enCodigo - coder.elo).toBeGreaterThan(-21);
    expect(enEscritura - coder.elo).toBeLessThan(15);
  });

  it("cualquier ELO por categoría se mantiene en un rango sensato (±60 del base)", () => {
    for (const cat of BATTLE_CATEGORIES) {
      const v = categoryElo(poet, cat.id);
      expect(Math.abs(v - poet.elo)).toBeLessThanOrEqual(60);
    }
  });
});

describe("catálogo de batallas", () => {
  it("hay 10 categorías y 5 exclusivas de Todólogo", () => {
    expect(BATTLE_CATEGORIES).toHaveLength(10);
    expect(NEW_CATEGORIES).toHaveLength(5);
  });
});

describe("integridad del catálogo de modelos", () => {
  it("los ids de modelo son únicos", () => {
    const ids = new Set(MODELS.map((m) => m.id));
    expect(ids.size).toBe(MODELS.length);
  });

  it("cada modelo apunta a un proveedor existente (p. ej. qwen tras el cambio de logo)", () => {
    for (const m of MODELS) {
      expect(PROVIDERS[m.provider], `proveedor ausente para ${m.id}`).toBeDefined();
    }
  });

  it("Qwen es un proveedor propio con dominio y logo oficiales", () => {
    expect(PROVIDERS.qwen).toBeDefined();
    expect(PROVIDERS.qwen.name).toBe("Qwen");
    expect(PROVIDERS.qwen.domain).toBe("qwen.ai");
    expect(PROVIDERS.qwen.logo).toBe("/providers/qwen.png");
  });

  it("todos los ELO base están en un rango creíble (1000–1700)", () => {
    for (const m of MODELS) {
      expect(m.elo).toBeGreaterThan(1000);
      expect(m.elo).toBeLessThan(1700);
    }
  });
});
