import { describe, expect, it } from "vitest";
import {
  deserializarCopa,
  serializarCopa,
  type Copa,
  type CopaDuel,
} from "../src/lib/copas-persistir";
import {
  acumular,
  GEN_LIMITE,
  ipDeHeader,
  type LimiteCfg,
} from "../src/lib/rate-limit";
import { estadisticasSalon, type CampeonFila } from "../src/lib/salon-utils";

/* ── CopaSesion: serialización ida y vuelta (persistencia v1.13.0) ── */

function copaDeEjemplo(size: 4 | 8 | 16 = 4, revelada = false): Copa {
  const duelo = (r: number, d: number): CopaDuel => ({
    key: `r${r}d${d}`,
    a: { modelId: `m${r}${d}a`, label: `S${r}${d}a`, text: `texto A ${r}-${d}` },
    b: { modelId: `m${r}${d}b`, label: `S${r}${d}b`, text: `texto B ${r}-${d}` },
    ...(r === 0 ? { winner: "a" as const, swing: 12 } : {}),
  });
  return {
    id: "copa_test_123",
    prompt: "Diseña una ciudad flotante en 3 actos",
    createdAt: 1_757_000_000_000,
    size,
    roundNames: ["Semifinales", "Gran final"],
    labelNames: ["S", "F"],
    rounds: [[duelo(0, 0), duelo(0, 1)], [duelo(1, 0)]],
    revealed: revelada,
    ...(revelada ? { championModelId: "m00a" } : {}),
  };
}

describe("copas-persistir", () => {
  it("serializar → deserializar es un ida y vuelta fiel (write-through/read-through)", () => {
    const copa = copaDeEjemplo(4, false);
    const reconstruida = deserializarCopa(serializarCopa(copa));
    expect(reconstruida).toEqual(copa);
  });

  it("conserva winner, swing, revelación y campeón", () => {
    const copa = copaDeEjemplo(8, true);
    copa.rounds = [[{ ...copa.rounds[0][0], winner: "b", swing: -7 }]];
    const r = deserializarCopa(serializarCopa(copa));
    expect(r?.rounds[0][0].winner).toBe("b");
    expect(r?.rounds[0][0].swing).toBe(-7);
    expect(r?.revealed).toBe(true);
    expect(r?.championModelId).toBe("m00a");
  });

  it("rechaza JSON corrupto sin lanzar (devuelve null, no revive basura)", () => {
    expect(deserializarCopa("{no es json")).toBeNull();
    expect(deserializarCopa("null")).toBeNull();
    expect(deserializarCopa('{"id":"x"}')).toBeNull(); // incompleta
    expect(deserializarCopa('{"id":"x","prompt":"p","createdAt":1,"size":7}')).toBeNull(); // size inválido
  });

  it("rechaza copas con duelos malformados", () => {
    const mal = {
      id: "copa_x",
      prompt: "p",
      createdAt: 1,
      size: 4,
      roundNames: ["S", "F"],
      labelNames: ["S", "F"],
      revealed: false,
      rounds: [[{ key: "r0d0", a: { modelId: "a" } }]], // b falta, contendientes incompletos
    };
    expect(deserializarCopa(JSON.stringify(mal))).toBeNull();
  });

  it("normaliza winner/swing inválidos en la reconstrucción", () => {
    const copa = copaDeEjemplo();
    (copa.rounds[0][0] as unknown as { winner: string }).winner = "empate";
    (copa.rounds[0][0] as unknown as { swing: string }).swing = "mucho";
    const r = deserializarCopa(serializarCopa(copa))!;
    expect(r.rounds[0][0]).not.toHaveProperty("winner");
    expect(r.rounds[0][0]).not.toHaveProperty("swing");
  });
});

/* ── Rate-limit: ventana fija por IP+clave (v1.13.0) ── */

const CFG: LimiteCfg = { max: 3, ventanaMs: 1_000 };

describe("rate-limit", () => {
  it("permite hasta max peticiones y bloquea la siguiente", () => {
    const clave = `t1:${Math.random()}`;
    expect(acumular(clave, CFG, 0)).toBe(true);
    expect(acumular(clave, CFG, 10)).toBe(true);
    expect(acumular(clave, CFG, 20)).toBe(true);
    expect(acumular(clave, CFG, 30)).toBe(false); // 4ª dentro de la ventana
    expect(acumular(clave, GEN_LIMITE, 40)).toBe(true); // otra clave (otra cfg) no interfiere
  });

  it("la ventana se reinicia al expirar", () => {
    const clave = `t2:${Math.random()}`;
    expect(acumular(clave, CFG, 1_000)).toBe(true);
    expect(acumular(clave, CFG, 1_010)).toBe(true);
    expect(acumular(clave, CFG, 1_020)).toBe(true);
    expect(acumular(clave, CFG, 1_030)).toBe(false);
    expect(acumular(clave, CFG, 2_100)).toBe(true); // ventana nueva: pasa
  });

  it("cada IP tiene su contador independiente", () => {
    const base = `t3:${Math.random()}`;
    expect(acumular(`${base}:ipA`, CFG, 0)).toBe(true);
    expect(acumular(`${base}:ipA`, CFG, 1)).toBe(true);
    expect(acumular(`${base}:ipA`, CFG, 2)).toBe(true);
    expect(acumular(`${base}:ipA`, CFG, 3)).toBe(false);
    expect(acumular(`${base}:ipB`, CFG, 4)).toBe(true); // otra IP: sin límite
  });
});

describe("ipDeHeader", () => {
  it("toma el primer valor de x-forwarded-for", () => {
    expect(ipDeHeader("1.2.3.4, 10.0.0.1")).toBe("1.2.3.4");
    expect(ipDeHeader("  5.6.7.8 ,9.9.9.9")).toBe("5.6.7.8");
  });

  it("cae a anon si no viene o viene vacío", () => {
    expect(ipDeHeader(null)).toBe("anon");
    expect(ipDeHeader(undefined)).toBe("anon");
    expect(ipDeHeader("")).toBe("anon");
    expect(ipDeHeader("   ")).toBe("anon");
  });
});

/* ── Salón de la Fama: estadísticas agregadas (v1.13.0) ── */

function fila(
  id: string,
  name: string,
  size: number,
  at: string,
  sub: string | null = null
): CampeonFila {
  return {
    copaId: `copa_${id}_${at}`,
    prompt: `consigna de ${name}`,
    size,
    campeon: { id, name },
    subcampeon: sub ? { id: sub, name: sub } : null,
    at,
  };
}

describe("estadisticasSalon", () => {
  it("agrega total, porModelo (top 5), copa más grande, copas XL y último", () => {
    const filas = [
      fila("gpt", "GPT-5", 16, "2026-09-09T10:00:00Z"),
      fila("claude", "Claude", 8, "2026-09-08T10:00:00Z"),
      fila("gpt", "GPT-5", 4, "2026-09-07T10:00:00Z", "Gemini"),
      fila("gemini", "Gemini", 4, "2026-09-06T10:00:00Z"),
    ];
    const s = estadisticasSalon(filas);
    expect(s.total).toBe(4);
    expect(s.porModelo[0]).toEqual({ id: "gpt", name: "GPT-5", titulos: 2 });
    expect(s.porModelo).toHaveLength(3);
    expect(s.copaMasGrande).toBe(16);
    expect(s.copasXL).toBe(2);
    expect(s.ultimo?.id).toBe("gpt");
    expect(s.ultimo?.at).toBe("2026-09-09T10:00:00Z");
  });

  it("empate de títulos se resuelve por nombre (determinista)", () => {
    const s = estadisticasSalon([
      fila("b", "Beta", 4, "2026-09-09T00:00:00Z"),
      fila("a", "Alfa", 4, "2026-09-08T00:00:00Z"),
    ]);
    expect(s.porModelo.map((m) => m.id)).toEqual(["a", "b"]);
  });

  it("lista vacía o basura → estadísticas vacías sin lanzar", () => {
    expect(estadisticasSalon([])).toEqual({
      total: 0,
      porModelo: [],
      copaMasGrande: null,
      copasXL: 0,
      ultimo: null,
    });
    expect(estadisticasSalon([undefined as unknown as CampeonFila]).total).toBe(0);
  });
});
