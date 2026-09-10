import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { APP_VERSION } from "../src/lib/version";
import { VERSIONS } from "../src/lib/changelog-meta";

const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("v1.18.0 — versión y trazabilidad", () => {
  it("la app va por la 1.19.0 o superior (la cadena sigue viva)", () => {
    const [mayor, menor] = APP_VERSION.split(".").map((n) => parseInt(n, 10));
    expect(mayor).toBe(1);
    expect(menor).toBeGreaterThanOrEqual(19);
  });

  it("changelog-meta y CHANGELOG.md incluyen la 1.18.0 en la cadena", () => {
    expect(VERSIONS.some((v) => v.version === "1.18.0")).toBe(true);
    const meta = VERSIONS.find((v) => v.version === "1.18.0");
    expect(meta?.diffDesde).toBe("1.17.1");
    expect(meta?.kinds).toContain("nuevo");
    const md = leer("CHANGELOG.md");
    expect(md).toContain("Duelos y copas compartibles: replay permanente por URL");
  });

  it("el roadmap ya apunta a la v1.20.0 (la 1.19.0 salió)", () => {
    const md = leer("CHANGELOG.md");
    // Relajado en v1.20.0: la entrada planeada pasó a publicada
    expect(md.includes("Planeado para v1.20.0") || md.includes("Copas de 32 y 64")).toBe(true);
  });
});

describe("v1.18.0 — persistencia del replay", () => {
  it("el modelo DueloGuardado existe en ambos esquemas Prisma", () => {
    for (const esquema of ["prisma/schema.prisma", "prisma/schema.postgres.prisma"]) {
      const src = leer(esquema);
      expect(src).toContain("model DueloGuardado");
      expect(src).toContain("ganador");
      expect(src).toContain("copaId");
    }
  });

  it("db-init crea la tabla en el arranque serverless", () => {
    const src = leer("src/lib/db-init.ts");
    expect(src).toContain('"DueloGuardado"');
    expect(src).toContain("DueloGuardado_createdAt_idx");
  });
});

describe("v1.18.0 — API de compartir", () => {
  it("POST /api/share valida, acota textos y rechaza generativos", () => {
    const src = leer("src/app/api/share/route.ts");
    expect(src).toContain("MAX_TEXTO");
    expect(src).toContain("getModel");
    expect(src).toContain('["imagen", "video", "audio"]');
    expect(src).toContain("acumular("); // rate-limit del arena
    expect(src).toContain("/duelo/");
  });

  it("GET /api/share/[id] sirve el snapshot y el JSON canónico de copas", () => {
    const src = leer("src/app/api/share/[id]/route.ts");
    expect(src).toContain("deserializarCopa");
    expect(src).toContain("copaSesion");
  });
});

describe("v1.18.0 — replay público", () => {
  it("la página /duelo/[id] existe con export estático vacío", () => {
    expect(fs.existsSync(path.join(process.cwd(), "src/app/duelo/[id]/page.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(process.cwd(), "src/app/duelo/[id]/replay-client.tsx"))).toBe(true);
    const page = leer("src/app/duelo/[id]/page.tsx");
    expect(page).toContain("generateStaticParams");
    const client = leer("src/app/duelo/[id]/replay-client.tsx");
    expect(client).toContain("api/share/");
    expect(client).toContain("Markdown");
    expect(client).toContain("Ganador");
    expect(client).toContain("todo-logo-ai.vercel.app"); // degradación honesta
  });
});

describe("v1.18.0 — botones de compartir", () => {
  it("el reveal de la batalla comparte el replay (no en demo estática)", () => {
    const src = leer("src/components/arena/ChatExperience.tsx");
    expect(src).toContain("compartirDuelo");
    expect(src).toContain("Compartir replay");
    expect(src).toContain("isStaticDemo()");
  });

  it("la vista campeón comparte la copa completa", () => {
    const src = leer("src/components/arena/TournamentView.tsx");
    expect(src).toContain("compartirCopa");
    expect(src).toContain("Compartir replay de la copa");
    expect(src).toContain('tipo: "copa"');
  });
});
