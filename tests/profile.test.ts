import { describe, expect, it } from "vitest";
import {
  ACCENTS,
  DEFAULT_PROFILE,
  LIMITS,
  accentColor,
  effectiveName,
  focusLabel,
  isValidUsername,
  isValidWebsite,
  sanitizeProfile,
  sanitizeUsername,
  websiteHref,
} from "../src/lib/profile-shared";

describe("perfil: sanitizeUsername", () => {
  it("convierte a minúsculas y sustituye espacios/arrobas por guiones bajos", () => {
    expect(sanitizeUsername("Marta_Rivera")).toBe("marta_rivera");
    expect(sanitizeUsername("  @Ana  Gil ")).toBe("ana_gil");
  });

  it("elimina caracteres no permitidos (acentos, símbolos)", () => {
    expect(sanitizeUsername("Ángel!!")).toBe("ngel");
    expect(sanitizeUsername("dev.tools")).toBe("devtools");
  });

  it("respeta el límite de 20 caracteres", () => {
    const largo = "a".repeat(50);
    expect(sanitizeUsername(largo)).toHaveLength(LIMITS.username);
  });

  it("deja cadenas válidas intactas", () => {
    expect(sanitizeUsername("ana_99")).toBe("ana_99");
  });
});

describe("perfil: isValidUsername", () => {
  it("acepta vacío (opcional) y slugs válidos de 3-20", () => {
    expect(isValidUsername("")).toBe(true);
    expect(isValidUsername("abc")).toBe(true);
    expect(isValidUsername("a".repeat(20))).toBe(true);
  });

  it("rechaza cortos, largos, mayúsculas y símbolos", () => {
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("a".repeat(21))).toBe(false);
    expect(isValidUsername("Ana_99")).toBe(false);
    expect(isValidUsername("ana-99")).toBe(false);
  });
});

describe("perfil: isValidWebsite y websiteHref", () => {
  it("valida URLs y dominios simples", () => {
    expect(isValidWebsite("")).toBe(true);
    expect(isValidWebsite("https://todologo.ai/arena")).toBe(true);
    expect(isValidWebsite("todologo.ai")).toBe(true);
  });

  it("rechaza esquemas raros y texto suelto", () => {
    expect(isValidWebsite("javascript:alert(1)")).toBe(false);
    expect(isValidWebsite("no es una url")).toBe(false);
  });

  it("websiteHref normaliza a https sin tocar los absolutos", () => {
    expect(websiteHref("")).toBe("");
    expect(websiteHref("todologo.ai")).toBe("https://todologo.ai");
    expect(websiteHref("http://example.com")).toBe("http://example.com");
  });
});

describe("perfil: sanitizeProfile", () => {
  it("completa con los valores por defecto ante entradas vacías", () => {
    const p = sanitizeProfile(undefined);
    expect(p).toEqual({ ...DEFAULT_PROFILE, savedAt: 0 });
  });

  it("recorta textos largos a sus límites", () => {
    const p = sanitizeProfile({
      displayName: "x".repeat(99),
      bio: "y".repeat(999),
      location: "z".repeat(99),
    });
    expect(p.displayName).toHaveLength(LIMITS.displayName);
    expect(p.bio).toHaveLength(LIMITS.bio);
    expect(p.location).toHaveLength(LIMITS.location);
  });

  it("sanea el username y descarta avatar/accent desconocidos", () => {
    const p = sanitizeProfile({
      username: "  @Usuaria !Nueva ",
      avatar: "🚀",
      accent: "neon-pink",
    });
    expect(p.username).toBe("usuaria_nueva");
    expect(p.avatar).toBe("");
    expect(p.accent).toBe(DEFAULT_PROFILE.accent);
  });

  it("acepta avatar y accent del catálogo oficial", () => {
    const p = sanitizeProfile({ avatar: "🦉", accent: "teal" });
    expect(p.avatar).toBe("🦉");
    expect(p.accent).toBe("teal");
  });

  it("coacciona booleanos y sanea savedAt (negativo a 0, válido intacto)", () => {
    const p = sanitizeProfile({
      publicProfile: "no",
      showStats: 1,
      weeklyDigest: true,
      savedAt: 1725872400000,
    });
    expect(p.publicProfile).toBe(DEFAULT_PROFILE.publicProfile);
    expect(p.showStats).toBe(DEFAULT_PROFILE.showStats);
    expect(p.weeklyDigest).toBe(true);
    expect(p.savedAt).toBe(1725872400000);
    expect(sanitizeProfile({ savedAt: -5 }).savedAt).toBe(0);
  });
});

describe("perfil: catálogos y helpers de presentación", () => {
  it("accentColor resuelve del catálogo y cae en terracota si el id es raro", () => {
    const teal = ACCENTS.find((a) => a.id === "teal")!;
    expect(accentColor("teal")).toBe(teal.color);
    expect(accentColor("magenta-flúor")).toBe(ACCENTS[0].color);
  });

  it("focusLabel devuelve la etiqueta o el propio id si es desconocido", () => {
    expect(focusLabel("codigo")).toBe("Código");
    expect(focusLabel("robotica")).toBe("robotica");
  });

  it("effectiveName prefiere el nombre visible y respalda en la cuenta", () => {
    expect(effectiveName({ ...DEFAULT_PROFILE, displayName: "  " }, "Marta")).toBe("Marta");
    expect(effectiveName({ ...DEFAULT_PROFILE, displayName: "Ana Gil" }, "Marta")).toBe("Ana Gil");
  });
});
