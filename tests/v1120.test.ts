import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROFILE,
  diffProfile,
  PROFILE_FIELD_LABELS,
  sanitizeProfile,
  type UserProfile,
} from "../src/lib/profile-shared";
import {
  chatExternoBodyConstruido,
  proveedoresConVoz,
  vozExternaPara,
} from "../src/lib/voices-externas";
import { esGranFinal, totalRondas } from "../src/lib/copa-utils";

/* ── Copa: rondas totales y detección de la gran final ── */

describe("copa-utils", () => {
  it("el número de rondas depende del tamaño del cuadro", () => {
    expect(totalRondas(4)).toBe(2);
    expect(totalRondas(8)).toBe(3);
    expect(totalRondas(16)).toBe(4);
  });

  it("la primera semifinal de un cuadro de 4 NO es la gran final (bug v1.9.0)", () => {
    // rIdx 0 = semifinal de un cuadro de 4: rounds.length valía 1 y la confundía
    expect(esGranFinal(4, 0)).toBe(false);
    expect(esGranFinal(4, 1)).toBe(true);
    expect(esGranFinal(8, 0)).toBe(false);
    expect(esGranFinal(8, 1)).toBe(false);
    expect(esGranFinal(8, 2)).toBe(true);
    expect(esGranFinal(16, 3)).toBe(true);
  });
});

/* ── Historial del perfil: diffProfile + etiquetas ── */

describe("diffProfile", () => {
  it("sin versión previa no devuelve cambios (primer guardado)", () => {
    expect(diffProfile(null, DEFAULT_PROFILE)).toEqual([]);
  });

  it("detecta solo los campos que cambian y en orden de declaración", () => {
    const base = { ...DEFAULT_PROFILE, bio: "hola" };
    const a = sanitizeProfile({ ...base, displayName: "Marta" });
    const b = sanitizeProfile({ ...base, displayName: "Marta R.", focus: "codigo" });
    const cambiados = diffProfile(a, b);
    expect(cambiados).toEqual(["displayName", "focus"]);
  });

  it("los booleanos y el acento también se comparan", () => {
    const a = sanitizeProfile({ ...DEFAULT_PROFILE, showStats: true });
    const b = sanitizeProfile({ ...DEFAULT_PROFILE, showStats: false, accent: "teal" });
    expect(diffProfile(a, b)).toEqual(["accent", "showStats"]);
  });

  it("cada campo del perfil tiene etiqueta legible", () => {
    const claves = Object.keys(DEFAULT_PROFILE) as (keyof UserProfile)[];
    for (const k of claves) {
      expect(PROFILE_FIELD_LABELS[k]).toBeTruthy();
    }
    expect(PROFILE_FIELD_LABELS.displayName).toBe("Nombre visible");
  });
});

/* ── Voces externas: mapeo proveedor → voz ── */

describe("voces externas", () => {
  it("sin claves en el entorno no hay voces", () => {
    expect(vozExternaPara("openai")).toBeNull();
    expect(vozExternaPara("proveedor-inexistente")).toBeNull();
  });

  it("con clave configurada la voz se construye con endpoint y modelo por defecto", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    const voz = vozExternaPara("openai");
    expect(voz).not.toBeNull();
    expect(voz?.endpoint).toContain("api.openai.com");
    expect(voz?.modelo).toBe("gpt-4o-mini");
    expect(voz?.formato).toBe("openai");
    delete process.env.OPENAI_API_KEY;
  });

  it("VOZ_MODELO_<PROVEEDOR> sobrescribe el slug del modelo", () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    process.env.VOZ_MODELO_ANTHROPIC = "claude-sonnet-4";
    const voz = vozExternaPara("anthropic");
    expect(voz?.modelo).toBe("claude-sonnet-4");
    expect(voz?.formato).toBe("anthropic");
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.VOZ_MODELO_ANTHROPIC;
  });

  it("el cuerpo OpenAI lleva Authorization Bearer y el Anthropic lleva x-api-key", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    const vozOpen = vozExternaPara("openai")!;
    const bodyOpen = chatExternoBodyConstruido(vozOpen, [
      { role: "assistant", content: "sys" },
      { role: "user", content: "hola" },
    ]);
    expect(bodyOpen.body.model).toBe("gpt-4o-mini");
    expect(bodyOpen.cabeceras.Authorization).toBe("Bearer sk-test");

    process.env.ANTHROPIC_API_KEY = "sk-ant";
    const vozAnt = vozExternaPara("anthropic")!;
    const bodyAnt = chatExternoBodyConstruido(vozAnt, [
      { role: "assistant", content: "sys" },
      { role: "user", content: "hola" },
    ]);
    expect(bodyAnt.body.system).toBe("sys");
    expect(bodyAnt.body.max_tokens).toBeGreaterThan(0);
    expect(bodyAnt.cabeceras["x-api-key"]).toBe("sk-ant");
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  it("proveedoresConVoz refleja solo las claves presentes", () => {
    process.env.DEEPSEEK_API_KEY = "sk-ds";
    const conVoz = proveedoresConVoz();
    expect(conVoz).toContain("deepseek");
    expect(conVoz).not.toContain("openai");
    delete process.env.DEEPSEEK_API_KEY;
  });
});
