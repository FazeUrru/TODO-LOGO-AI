import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { MCPS, MCP_CATS } from "../src/lib/mcps-data";
import { APP_VERSION } from "../src/lib/version";

describe("v1.16.0 — catálogo de 75 MCPs", () => {
  it("exactamente 75 servidores con ids únicos", () => {
    expect(MCPS.length).toBe(75);
    expect(new Set(MCPS.map((m) => m.id)).size).toBe(75);
  });

  it("todas las entradas tienen nombre, categoría válida y descripción", () => {
    for (const m of MCPS) {
      expect(m.nombre.length).toBeGreaterThan(1);
      expect((MCP_CATS as readonly string[]).includes(m.cat)).toBe(true);
      expect(m.desc.length).toBeGreaterThan(8);
    }
  });

  it("sin comandos inventados: los oficiales usan el scope @modelcontextprotocol", () => {
    const filesystem = MCPS.find((m) => m.id === "filesystem");
    expect(filesystem?.cmd).toContain("@modelcontextprotocol/server-filesystem");
    const sinCmd = MCPS.filter((m) => !m.cmd);
    expect(sinCmd.length).toBeGreaterThan(0); // los inestables lo declaran con honestidad
  });
});

describe("v1.16.0 — vista previa que espera al streaming", () => {
  it("el Markdown desactiva la vista previa mientras se escribe", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "src/components/arena/Markdown.tsx"),
      "utf8"
    );
    expect(src).toContain("autoPreview={!streaming}");
    expect(src).toContain("Guardar y ver resultado");
  });

  it("el chat pasa el flag de streaming por panel hasta el Markdown", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "src/components/arena/ChatExperience.tsx"),
      "utf8"
    );
    expect(src).toContain("<Markdown streaming={streaming}>");
  });
});

describe("v1.16.0 — vídeo narrado y opciones cuánticas", () => {
  it("existe la copia web del vídeo (17:37) y su póster para /calculadora", () => {
    expect(fs.existsSync(path.join(process.cwd(), "public/video/casos-de-uso-17m37.mp4"))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), "public/video/portada-casos.jpg"))).toBe(true);
  });

  it("la página cuántica pide permiso de pantalla de verdad (getDisplayMedia)", () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), "src/app/cuanticas/page.tsx"),
      "utf8"
    );
    expect(src).toContain("getDisplayMedia");
    expect(src).toContain("permiso");
  });

  it("la versión activa es la 1.16.0", () => {
    expect(APP_VERSION).toBe("1.16.0");
  });
});
