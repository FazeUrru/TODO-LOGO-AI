import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { APP_VERSION } from "../src/lib/version";
import { CARTA_VERDAD, CAPACIDADES_UNIVERSALES } from "../src/lib/ai-conducta";
import { VERSIONS } from "../src/lib/changelog-meta";

const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("v1.17.0 — reentrenamiento transversal de todas las IA", () => {
  it("la app va por la 1.18.0 o superior (la cadena sigue viva)", () => {
    const [mayor, menor] = APP_VERSION.split(".").map((n) => parseInt(n, 10));
    expect(mayor).toBe(1);
    expect(menor).toBeGreaterThanOrEqual(18);
  });

  it("CAPACIDADES_UNIVERSALES entrena juegos jugables y visión para TODAS las IA", () => {
    expect(CAPACIDADES_UNIVERSALES).toContain("JUEGOS");
    expect(CAPACIDADES_UNIVERSALES).toContain("```html");
    expect(CAPACIDADES_UNIVERSALES).toContain("JUGAR");
    expect(CAPACIDADES_UNIVERSALES).toContain("VISIÓN");
    // Va junto a la Carta de Verdad, no la sustituye
    expect(CARTA_VERDAD).toContain("VERDAD ANTE TODO");
  });

  it("la batalla inyecta las capacidades en el system prompt de cada contendiente", () => {
    const src = leer("src/app/api/battle/route.ts");
    expect(src).toContain("CAPACIDADES_UNIVERSALES");
    expect(src).toContain("personaFor");
  });
});

describe("v1.17.0 — juegos en tiempo real", () => {
  it("el Prompt Maestro pone el prototipo PRIMERO para no cortar el juego", () => {
    const src = leer("src/app/api/battle/route.ts");
    expect(src).toContain("el juego va PRIMERO");
    expect(src).toContain("PROTOTIPO JUGABLE COMPLETO");
  });

  it("GamePanel: panel grande, pantalla completa, sandbox y progreso en vivo", () => {
    expect(fs.existsSync(path.join(process.cwd(), "src/components/arena/GamePanel.tsx"))).toBe(true);
    const src = leer("src/components/arena/GamePanel.tsx");
    expect(src).toContain("requestFullscreen");
    expect(src).toContain("allow-scripts allow-popups allow-pointer-lock");
    expect(src).toContain("h-[520px]");
    expect(src).toContain("construyendo");
  });

  it("el chat detecta juegos durante el streaming y al finalizar (kind juego)", () => {
    const src = leer("src/components/arena/ChatExperience.tsx");
    expect(src).toContain('kind?: "juego"');
    expect(src).toContain("kindDe");
    expect(src).toContain("extraerJuego");
    expect(src).toContain("quitarBloqueHtml");
    expect(src).toContain("<GamePanel");
  });

  it("el sandbox de la vista previa permite capturar el puntero", () => {
    const src = leer("src/components/arena/Markdown.tsx");
    expect(src).toContain("allow-pointer-lock");
  });
});

describe("v1.17.0 — visión VLM integrada", () => {
  it("la API acepta imágenes en formato multimodal image_url", () => {
    const src = leer("src/app/api/battle/route.ts");
    expect(src).toContain("images?: string[]");
    expect(src).toContain('"image_url"');
    expect(src).toContain("data:image/");
    expect(src).toContain("VISIÓN ACTIVADA");
  });

  it("con imágenes el turno va siempre al motor interno (no a voces de solo texto)", () => {
    const src = leer("src/app/api/battle/route.ts");
    expect(src).toContain("images.length === 0");
  });

  it("el chat puede adjuntar imágenes y las prepara para el VLM", () => {
    const src = leer("src/components/arena/ChatExperience.tsx");
    expect(src).toContain('type="file"'); // inputs ocultos restaurados (bug de adjuntos)
    expect(src).toContain("imagenADataUrl");
    expect(src).toContain("dataUrl");
  });
});

describe("v1.17.0 — pruebas y changelog sincronizados", () => {
  it("/pruebas llega a 10 checks con VLM y motor de juegos", () => {
    const src = leer("src/app/pruebas/page.tsx");
    expect(src).toContain('id: "vlm"');
    expect(src).toContain('id: "juegos"');
    expect(src.match(/id: "/g)?.length).toBe(10);
  });

  it("changelog-meta y CHANGELOG.md incluyen la 1.17.0 en la cadena", () => {
    expect(VERSIONS.some((v) => v.version === "1.17.0")).toBe(true);
    const md = leer("CHANGELOG.md");
    expect(md).toContain("Juegos en tiempo real con todas las IA y visión VLM integrada");
  });
});
