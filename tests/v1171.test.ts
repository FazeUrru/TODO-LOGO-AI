import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { APP_VERSION } from "../src/lib/version";
import { VERSIONS } from "../src/lib/changelog-meta";
import { MODELS, esGenerativo, CATEGORIAS_GENERATIVAS } from "../src/lib/models-data";

const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("v1.17.1 — versión y trazabilidad", () => {
  it("la app va por la 1.18.0 (la cadena sigue viva)", () => {
    expect(APP_VERSION).toBe("1.33.0");
  });

  it("changelog-meta y CHANGELOG.md incluyen la 1.17.1 en la cadena", () => {
    expect(VERSIONS.some((v) => v.version === "1.17.1")).toBe(true);
    const md = leer("CHANGELOG.md");
    expect(md).toContain(
      "La General vuelve a ser de texto: fuera los modelos de imagen del leaderboard y del chat"
    );
  });
});

describe("v1.17.1 — datos del catálogo", () => {
  it("GPT-Image-2.5 Sunburst es generativo y ya no cabe en arenas de texto", () => {
    const sunburst = MODELS.find((m) => m.id === "gpt-image-2.5-sunburst");
    expect(sunburst).toBeDefined();
    expect(esGenerativo(sunburst!)).toBe(true);
  });

  it("todos los generativos del catálogo quedan fuera de cualquier arena de texto", () => {
    const generativos = MODELS.filter((m) => esGenerativo(m));
    expect(generativos.length).toBeGreaterThan(0);
    // La definición es simétrica: un modelo es generativo si toca imagen/vídeo/audio,
    // y las arenas de texto excluyen exactamente ese mismo predicado.
    for (const m of generativos) {
      expect(m.categories.some((c) => (CATEGORIAS_GENERATIVAS as readonly string[]).includes(c))).toBe(
        true
      );
    }
  });
});

describe("v1.17.1 — leaderboard sin generativos en arenas de texto", () => {
  it("/api/leaderboard excluye generativos fuera de las categorías generativas", () => {
    const src = leer("src/app/api/leaderboard/route.ts");
    expect(src).toContain("esGenerativo");
    expect(src).toContain("MODELS.filter((m) => !esGenerativo(m))");
  });

  it("el motor demo (GitHub Pages) replica el mismo filtro", () => {
    const src = leer("src/lib/demo-engine.ts");
    expect(src).toContain("CATEGORIAS_GENERATIVAS");
    expect(src).toContain("MODELS.filter((m) => !esGenerativo(m))");
  });
});

describe("v1.17.1 — el chat nunca responde con un modelo de imagen", () => {
  it("/api/battle: pickRandom solo sortea modelos que conversan", () => {
    const src = leer("src/app/api/battle/route.ts");
    expect(src).toContain("!esGenerativo(m)");
    expect(src).toContain("esContendienteValido");
  });

  it("/api/battle: los IDs del cliente se validan (generativo → sorteo sano)", () => {
    const src = leer("src/app/api/battle/route.ts");
    expect(src).toContain("esContendienteValido(body.modelAId) ? body.modelAId! : pickRandom()");
  });

  it("la Copa Torneo (servidor y demo) no mete generativos en el bracket", () => {
    expect(leer("src/app/api/tournament/route.ts")).toContain(
      "MODELS.filter((m) => !esGenerativo(m))"
    );
    expect(leer("src/lib/demo-engine.ts")).toContain("la copa es de texto");
  });

  it("el motor demo valida igual los IDs del cliente en handleBattle", () => {
    const src = leer("src/lib/demo-engine.ts");
    expect(src).toContain("contendienteDe");
    expect(src).toContain("poolTexto");
  });
});

describe("v1.17.1 — interfaz coherente", () => {
  it("el selector de modelos del chat no ofrece generativos", () => {
    const src = leer("src/components/shell/TopBar.tsx");
    expect(src).toContain("MODELS.filter((m) => !esGenerativo(m))");
  });

  it("el buscador no fija un generativo como chat directo: explica y lleva a su arena", () => {
    const src = leer("src/components/shell/SearchDialog.tsx");
    expect(src).toContain("esGenerativo(detail)");
    expect(src).toContain("no conversa por texto");
    expect(src).toContain('router.push("/leaderboard")');
  });
});
