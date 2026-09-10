import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { APP_VERSION } from "../src/lib/version";
import { VERSIONS } from "../src/lib/changelog-meta";
import { REPLAYS_CURADOS, curadoPorId, tarjetaDeCurado } from "../src/lib/muro-curados";
import { MODELOS_IMAGEN, selloDe, SELLO_ESTILO, sortearDuoImagen } from "../src/lib/arena-imagen";
import { LABS_FEATURES, featurePorId } from "../src/lib/labs";

const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

describe("v1.19.0 — versión y trazabilidad", () => {
  it("la app declara la versión 1.19.0", () => {
    expect(APP_VERSION).toBe("1.19.0");
  });

  it("changelog-meta y CHANGELOG.md incluyen la 1.19.0 como más reciente", () => {
    expect(VERSIONS[0].version).toBe("1.19.0");
    expect(VERSIONS[0].diffDesde).toBe("1.18.0");
    expect(VERSIONS[0].kinds).toContain("nuevo");
    const md = leer("CHANGELOG.md");
    expect(md).toContain("La arena de imagen ya es de verdad");
  });

  it("el roadmap apunta a la v1.20.0", () => {
    const md = leer("CHANGELOG.md");
    expect(md).toContain("Planeado para v1.20.0");
  });
});

describe("v1.19.0 — arena de imagen con ELO separado", () => {
  it("el esquema tiene EloArena en SQLite y PostgreSQL con clave única modelo+arena", () => {
    for (const esquema of ["prisma/schema.prisma", "prisma/schema.postgres.prisma"]) {
      const src = leer(esquema);
      expect(src).toContain("model EloArena");
      expect(src).toContain("@@unique([modelId, arena])");
      expect(src).toContain("@@index([arena, elo])");
    }
  });

  it("db-init crea EloArena y las columnas del muro en el arranque serverless", () => {
    const src = leer("src/lib/db-init.ts");
    expect(src).toContain('"EloArena"');
    expect(src).toContain("EloArena_modelId_arena_key");
    expect(src).toContain('addColumnSiFalta("DueloGuardado", "shares"');
    expect(src).toContain('addColumnSiFalta("DueloGuardado", "views"');
  });

  it("/api/vote separa dimensiones: EloArena para generativos, EloState para texto", () => {
    const src = leer("src/app/api/vote/route.ts");
    expect(src).toContain("applyArenaDuel");
    expect(src).toContain("esArenaGenerativa(category)");
    expect(src).toContain("filtroCategoria"); // deltas conscientes de arena
  });

  it("el leaderboard es consciente de la arena y expone eloArena", () => {
    const src = leer("src/app/api/leaderboard/route.ts");
    expect(src).toContain("getArenaEloMap");
    expect(src).toContain("eloArena:");
    expect(src).toContain("notIn: [...CATEGORIAS_GENERATIVAS]");
  });

  it("existe /api/image-battle con sorteo ciego y sello por modelo", () => {
    const src = leer("src/app/api/image-battle/route.ts");
    expect(src).toContain("sortearDuoImagen");
    expect(src).toContain("selloDe");
    expect(src).toContain("imagen-duelo"); // rate-limit propio
    expect(src).toContain("battleId");
  });

  it("el catálogo de imagen es compartido: modelos, sellos y sorteo sin repeticiones", () => {
    expect(MODELOS_IMAGEN.length).toBeGreaterThanOrEqual(8);
    expect(selloDe("gpt-image-2.5-sunburst")).toBe(SELLO_ESTILO["gpt-image-2.5-sunburst"]);
    for (let i = 0; i < 30; i++) {
      const [a, b] = sortearDuoImagen();
      expect(a.id).not.toBe(b.id);
      expect(a.categories).toContain("imagen");
      expect(b.categories).toContain("imagen");
    }
  });

  it("la UI estrena la pestaña Arena Imagen con voto ciego y categoría imagen", () => {
    const src = leer("src/components/arena/LaboratorioGenerativo.tsx");
    expect(src).toContain('"arena"');
    expect(src).toContain("ArenaImagen");
    expect(src).toContain('category: "imagen"');
    expect(src).toContain("api/image-battle");
  });

  it("el LeaderboardView muestra el ELO de arena en las filas generativas", () => {
    const src = leer("src/components/arena/LeaderboardView.tsx");
    expect(src).toContain("eloArena");
    expect(src).toContain("batallas de");
  });

  it("el flag arena-imagenes de Labs queda graduado", () => {
    expect(featurePorId("arena-imagenes")?.estado).toBe("graduado");
  });
});

describe("v1.19.0 — modo espectador de torneos", () => {
  it("la Copa tiene botón de espectador, barra EN DIRECTO y control de la grada", () => {
    const src = leer("src/components/arena/TournamentView.tsx");
    expect(src).toContain("verCopaEnDirecto");
    expect(src).toContain("En directo");
    expect(src).toContain("Tomar el control");
    expect(src).toContain("PROMPTS_ESPECTADOR");
    expect(src).toContain("Palomitas");
  });

  it("la grada vota sola con pausa dramática y velocidad ajustable", () => {
    const src = leer("src/components/arena/TournamentView.tsx");
    expect(src).toContain("La grada delibera");
    expect(src).toContain("velocidad");
    expect(src).toContain("[1, 2, 4]");
  });
});

describe("v1.19.0 — muro público de replays", () => {
  it("GET /api/share lista el muro fusionando BD y selección fundacional", () => {
    const src = leer("src/app/api/share/route.ts");
    expect(src).toContain("REPLAYS_CURADOS");
    expect(src).toContain("tarjetaDeCurado");
    expect(src).toContain("totalCompartidos");
  });

  it("PATCH /api/share/[id] cuenta vistas y compartidos con fallback curado", () => {
    const src = leer("src/app/api/share/[id]/route.ts");
    expect(src).toContain("export async function PATCH");
    expect(src).toContain('"vista"');
    expect(src).toContain('"compartir"');
    expect(src).toContain("servirCurado");
  });

  it("el replay público registra la vista una vez por sesión y muestra contadores", () => {
    const src = leer("src/app/duelo/[id]/replay-client.tsx");
    expect(src).toContain("todologo.vista.");
    expect(src).toContain("accion");
    expect(src).toContain("contadores");
  });

  it("la selección fundacional tiene 9 replays coherentes con IDs únicos", () => {
    expect(REPLAYS_CURADOS).toHaveLength(9);
    const ids = new Set(REPLAYS_CURADOS.map((r) => r.id));
    expect(ids.size).toBe(9);
    for (const r of REPLAYS_CURADOS) {
      expect(r.id.startsWith("d_curado")).toBe(true);
      expect(r.shares).toBeGreaterThan(0);
      expect(r.views).toBeGreaterThan(r.shares / 2);
      if (r.tipo === "copa") {
        expect(r.copa.revealed).toBe(true);
        expect(r.copa.championModelId).toBeTruthy();
        expect(r.copa.rounds.length).toBe(2); // semis + final
      }
    }
  });

  it("las tarjetas del muro exponen el contrato completo (campeón, contadores)", () => {
    const copa = curadoPorId("d_curado08");
    expect(copa).toBeTruthy();
    if (copa && copa.tipo === "copa") {
      const t = tarjetaDeCurado(copa);
      expect(t.tipo).toBe("copa");
      expect(t.copaSize).toBe(4);
      expect(t.championModelId).toBe("glm-5.3-air");
      expect(t.oficial).toBe(true);
    }
    const duelo = curadoPorId("d_curado01");
    expect(duelo).toBeTruthy();
    if (duelo && duelo.tipo === "duelo") {
      const t = tarjetaDeCurado(duelo);
      expect(t.ganador).toBe("B");
      expect(t.modelAId).toBe("claude-opus-5");
    }
  });

  it("la página /muro existe y la Sidebar enlaza el muro", () => {
    expect(fs.existsSync(path.join(process.cwd(), "src/app/muro/page.tsx"))).toBe(true);
    const sidebar = leer("src/components/shell/Sidebar.tsx");
    expect(sidebar).toContain('"/muro"');
    expect(sidebar).toContain("Muro de replays");
  });
});

describe("v1.19.0 — sorpresas y espejo demo", () => {
  it("el Confeti es compartido por copa, arena de imagen y revelación del chat", () => {
    expect(fs.existsSync(path.join(process.cwd(), "src/components/arena/Confeti.tsx"))).toBe(true);
    expect(leer("src/components/arena/ChatExperience.tsx")).toContain('from "./Confeti"');
    expect(leer("src/components/arena/TournamentView.tsx")).toContain('from "./Confeti"');
    expect(leer("src/components/arena/LaboratorioGenerativo.tsx")).toContain('from "./Confeti"');
  });

  it("el Modo Oráculo predice, guarda racha y celebra con confeti", () => {
    const src = leer("src/components/arena/ChatExperience.tsx");
    expect(src).toContain("Modo Oráculo");
    expect(src).toContain("todologo.oraculo.v1");
    expect(src).toContain("rachaOraculo");
    expect(src).toContain("fiestaRevelacion");
  });

  it("el ticker de actividad existe en servidor, demo y leaderboard", () => {
    const api = leer("src/app/api/actividad/route.ts");
    expect(api).toContain("db.vote.findMany");
    expect(api).toContain("ANONIMIZADOS por el lado del usuario");
    const demo = leer("src/lib/demo-engine.ts");
    expect(demo).toContain("handleActividad");
    const view = leer("src/components/arena/LeaderboardView.tsx");
    expect(view).toContain("api/actividad");
  });

  it("el demo-engine replica image-battle, muro y contadores", () => {
    const src = leer("src/lib/demo-engine.ts");
    expect(src).toContain("handleImageBattle");
    expect(src).toContain("handleMuroLista");
    expect(src).toContain("handleMuroDetalle");
    expect(src).toContain("handleMuroContadores");
    expect(src).toContain("K_ELO_ARENA");
    expect(src).toContain("applyArenaDuelDemo");
  });
});
