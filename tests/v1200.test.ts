/**
 * Regresión v1.20.0 — Copas de 32/64, API pública v2, ELO de jurado
 * y Duelo del día. Cada bloque persigue un bug real o fija una regla nueva:
 *  · el sorteo garantizado (una copa de 64 con 58 modelos de texto nacía corrupta)
 *  · la geometría de los cuadros XXL (5 y 6 rondas, prefijos correctos)
 *  · las matemáticas del jurado (favorito/contrario/empate/racha/títulos)
 *  · el duelo del día determinista (misma pareja para toda la comunidad)
 *  · el contrato y las claves de /api/v2
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { APP_VERSION } from "../src/lib/version";
import { VERSIONS } from "../src/lib/changelog-meta";
import { MODELS, esGenerativo, getModel } from "../src/lib/models-data";
import { totalRondas, esGranFinal, TAMANOS, COPA_SIZES, sortearIds } from "../src/lib/copa-utils";
import { deserializarCopa, serializarCopa } from "../src/lib/copas-persistir";
import {
  aplicarVotoJurado,
  deltaJurado,
  rachaNueva,
  tituloJurado,
  saneaJurado,
  diaUtc,
  diasEntre,
  ELO_JURADO_BASE,
  ESTADO_JURADO_INICIAL,
} from "../src/lib/elo-usuario";
import { dueloDeDia, fechaDeDuelo, battleIdDeDia, CONSIGNAS_DIA, hashDia } from "../src/lib/duelo-dia";
import { generarSecreto, enmascarar, LIMITE_API_V2, MAX_CLAVES_POR_USUARIO } from "../src/lib/apikeys";
import { CORS_HEADERS } from "../src/lib/v2-cors";

const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

/* ─────────────────── Versión y trazabilidad ─────────────────── */

describe("v1.20.0 — versión y trazabilidad", () => {
  it("la app va por la 1.20.0 (la cadena sigue viva)", () => {
    expect(APP_VERSION).toBe("1.21.0");
  });

  it("changelog-meta y CHANGELOG.md relatan la 1.20.0", () => {
    const meta = VERSIONS.find((v) => v.version === "1.20.0");
    expect(meta?.diffDesde).toBe("1.19.2");
    expect(meta?.kinds).toContain("nuevo");
    const md = leer("CHANGELOG.md");
    expect(md).toContain("Copas de 32 y 64");
    expect(md).toContain("API pública v2");
    expect(md).toContain("ELO de jurado");
    expect(md).toContain("Duelo del día");
  });
});

/* ─────────────────── Catálogo: 64 contendientes posibles ─────────────────── */

describe("v1.20.0 — catálogo suficiente para la Copa XXL", () => {
  it("hay al menos 64 modelos de texto (antes eran 58: la copa de 64 era imposible)", () => {
    const texto = MODELS.filter((m) => !esGenerativo(m));
    expect(texto.length).toBeGreaterThanOrEqual(64);
  });

  it("los 8 refuerzos existen, son de texto y llevan ¡NUEVO!", () => {
    const nuevos = [
      "mistral-large-3.1",
      "codestral-26-air",
      "command-a-2-light",
      "nova-pro-2",
      "nemotron-5-super",
      "granite-5-max",
      "step-3.5-max",
      "spark-x2",
    ];
    for (const id of nuevos) {
      const m = getModel(id);
      expect(m, `falta ${id}`).toBeDefined();
      expect(esGenerativo(m!)).toBe(false);
      expect(m!.isNew).toBe(true);
      expect(m!.elo).toBeGreaterThan(1000);
    }
  });

  it("el catálogo total no ha perdido nadie (86 fichas)", () => {
    expect(MODELS.length).toBe(86);
  });
});

/* ─────────────────── Copas de 32 y 64: geometría y sorteo ─────────────────── */

describe("v1.20.0 — geometría de cuadros XXL", () => {
  it("32 → 5 rondas y 64 → 6 rondas (log2, como siempre)", () => {
    expect(totalRondas(4)).toBe(2);
    expect(totalRondas(16)).toBe(4);
    expect(totalRondas(32)).toBe(5);
    expect(totalRondas(64)).toBe(6);
  });

  it("la gran final se detecta por TAMAÑO, no por rounds.length", () => {
    expect(esGranFinal(64, 5)).toBe(true);
    expect(esGranFinal(64, 4)).toBe(false);
    expect(esGranFinal(32, 4)).toBe(true);
  });

  it("TAMANOS define nombres y prefijos para 32 y 64", () => {
    expect(TAMANOS[32].names[0]).toBe("Dieciseisavos de final");
    expect(TAMANOS[32].prefixes[0]).toBe("D");
    expect(TAMANOS[64].names[0]).toBe("Treintaidosavos de final");
    expect(TAMANOS[64].prefixes[0]).toBe("T");
    for (const size of COPA_SIZES) {
      expect(TAMANOS[size].names.length).toBe(totalRondas(size));
      expect(TAMANOS[size].prefixes.length).toBe(totalRondas(size));
    }
  });
});

describe("v1.20.0 — sorteo garantizado (el bug del cuadro con huecos)", () => {
  const semillas = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ id: `m-${String(i).padStart(3, "0")}`, elo: 1500 - i * 5 }));

  it("con 58 semillas y cuadro de 64: el pool se expande y la copa se reduce a potencia de 2 (32)", () => {
    const ids = sortearIds(64, semillas(58));
    // 58 < 64 → mayor potencia de 2 jugable = 32. NUNCA 58 (no es potencia de 2).
    expect(ids.length).toBe(32);
    expect(new Set(ids).size).toBe(ids.length); // únicos
    expect(ids.every((id) => id.startsWith("m-"))).toBe(true);
  });

  it("con 66 semillas y cuadro de 64: salen 64 únicos (la copa de 64 existe)", () => {
    const ids = sortearIds(64, semillas(66));
    expect(ids.length).toBe(64);
    expect(new Set(ids).size).toBe(64);
  });

  it("el loop de emparejamiento del route no encuentra undefined nunca", () => {
    for (const pedida of [4, 8, 16, 32, 64]) {
      for (const catalogo of [58, 66, 90]) {
        const ids = sortearIds(pedida, semillas(catalogo));
        const primera: string[] = [];
        for (let i = 0; i < ids.length; i += 2) {
          primera.push(`${ids[i]}|${ids[i + 1]}`);
        }
        expect(primera.every((p) => !p.includes("undefined"))).toBe(true);
        expect(ids.length % 2).toBe(0);
      }
    }
  });

  it("el sorteo sigue saliendo del tramo alto con copas pequeñas", () => {
    const semillas66 = semillas(66);
    const ids = sortearIds(4, semillas66);
    expect(ids.length).toBe(4);
    // pool del 70 % de 66 = 47 → los elegidos están entre las 47 primeras por ELO
    const top47 = [...semillas66].sort((a, b) => b.elo - a.elo).slice(0, 47).map((s) => s.id);
    expect(ids.every((id) => top47.includes(id))).toBe(true);
  });
});

describe("v1.20.0 — persistencia de copas XXL", () => {
  const copa = (size: number) => ({
    id: "copa_test_xxl",
    prompt: "¿Cuál es el sentido de la vida?",
    createdAt: Date.now(),
    size,
    roundNames: TAMANOS[size].names,
    labelNames: TAMANOS[size].prefixes,
    rounds: [
      [
        { key: "r0d0", a: { modelId: "glm-5.3", label: "A1", text: "42" }, b: { modelId: "kimi-k3", label: "A2", text: "43" } },
      ],
    ],
    revealed: false,
  });

  it("una copa de 64 sobrevive el ida y vuelta BD sin ser rechazada", () => {
    const json = serializarCopa(copa(64) as never);
    const vuelta = deserializarCopa(json);
    expect(vuelta).not.toBeNull();
    expect(vuelta!.size).toBe(64);
    expect(vuelta!.roundNames[0]).toBe("Treintaidosavos de final");
  });

  it("un tamaño inventado (20) sigue siendo basura: no se revive", () => {
    const mala = { ...copa(32), size: 20 } as never;
    expect(deserializarCopa(JSON.stringify(mala))).toBeNull();
  });
});

/* ─────────────────── ELO de jurado ─────────────────── */

describe("v1.20.0 — ELO de jurado: las matemáticas", () => {
  it("votar al favorito acierta: +8 y +1 por día de racha (máx. +7)", () => {
    expect(deltaJurado("A", true, 1)).toEqual({ delta: 9, acierto: true });
    expect(deltaJurado("B", true, 3)).toEqual({ delta: 11, acierto: true });
    expect(deltaJurado("A", true, 10)).toEqual({ delta: 15, acierto: true }); // racha topa en 7
  });

  it("ir contra el consenso cobra: −4 (legítimo, pero caro)", () => {
    expect(deltaJurado("B", false, 5)).toEqual({ delta: -4, acierto: false });
  });

  it("empate, feedback y sin consenso: participación honesta", () => {
    expect(deltaJurado("tie", null, 1).delta).toBe(2);
    expect(deltaJurado("bad", null, 1).delta).toBe(1);
    expect(deltaJurado("A", null, 1).delta).toBe(4);
  });

  it("la racha diaria: consecutivo suma, hueco reinicia, mismo día no duplica", () => {
    expect(rachaNueva(null, "2026-09-10", 0)).toBe(1);
    expect(rachaNueva("2026-09-09", "2026-09-10", 3)).toBe(4);
    expect(rachaNueva("2026-09-07", "2026-09-10", 3)).toBe(1);
    expect(rachaNueva("2026-09-10", "2026-09-10", 6)).toBe(6);
  });

  it("diasEntre cuenta días y tolera basura como infinito", () => {
    expect(diasEntre("2026-09-09", "2026-09-10")).toBe(1);
    expect(diasEntre("2026-09-01", "2026-09-10")).toBe(9);
    expect(diasEntre("basura", "2026-09-10")).toBe(Number.POSITIVE_INFINITY);
  });

  it("aplicarVotoJurado es inmutable y actualiza aciertos, racha y mejorRacha", () => {
    const antes = { ...ESTADO_JURADO_INICIAL };
    const despues = aplicarVotoJurado(antes, "A", true, "2026-09-10");
    expect(antes).toEqual(ESTADO_JURADO_INICIAL); // no muta
    expect(despues.elo).toBe(ELO_JURADO_BASE + 9); // +8 acierto, +1 por racha de 1 día
    expect(despues.votos).toBe(1);
    expect(despues.aciertos).toBe(1);
    expect(despues.racha).toBe(1);
    expect(despues.mejorRacha).toBe(1);
    expect(despues.ultimoDia).toBe("2026-09-10");
  });

  it("la escalera de títulos: Aprendiz → Leyenda", () => {
    expect(tituloJurado(950).nombre).toBe("Aprendiz");
    expect(tituloJurado(1000).nombre).toBe("Aficionado");
    expect(tituloJurado(1120).nombre).toBe("Conocedor");
    expect(tituloJurado(1250).nombre).toBe("Crítico");
    expect(tituloJurado(1350).nombre).toBe("Árbitro");
    expect(tituloJurado(1500).nombre).toBe("Leyenda del jurado");
  });

  it("saneaJurado nunca reviva basura ni ELO absurdos", () => {
    const s = saneaJurado({ elo: "NaN", votos: -3, aciertos: 2.7, racha: {}, mejorRacha: 4, ultimoDia: "2026-13-99" });
    expect(s.elo).toBe(ELO_JURADO_BASE);
    expect(s.votos).toBe(0);
    expect(s.aciertos).toBe(3); // redondeo, nunca negativo
    expect(s.racha).toBe(0);
    expect(s.ultimoDia).toBeNull();
  });

  it("diaUtc es estable y con formato YYYY-MM-DD", () => {
    expect(diaUtc(new Date("2026-09-10T23:30:00Z"))).toBe("2026-09-10");
  });
});

/* ─────────────────── Duelo del día ─────────────────── */

describe("v1.20.0 — Duelo del día: determinista para toda la comunidad", () => {
  it("misma fecha → misma pareja y consigna (a las 00:01 y a las 23:59)", () => {
    const a = dueloDeDia("2026-09-10");
    const b = dueloDeDia("2026-09-10");
    expect(a).toEqual(b);
  });

  it("la pareja son dos modelos de texto distintos del tramo alto", () => {
    for (const fecha of ["2026-09-10", "2026-09-11", "2026-12-31", "2027-01-01"]) {
      const d = dueloDeDia(fecha);
      expect(d.modelAId).not.toBe(d.modelBId);
      const A = getModel(d.modelAId)!;
      const B = getModel(d.modelBId)!;
      expect(esGenerativo(A)).toBe(false);
      expect(esGenerativo(B)).toBe(false);
      expect(A.elo).toBeGreaterThanOrEqual(1150);
      expect(B.elo).toBeGreaterThanOrEqual(1150);
      expect(CONSIGNAS_DIA).toContain(d.prompt);
    }
  });

  it("otro día cambia el duelo (o al menos el hash de la fecha manda)", () => {
    const h10 = hashDia("duelo-dia:2026-09-10");
    const h11 = hashDia("duelo-dia:2026-09-11");
    expect(h10).not.toBe(h11);
    expect(battleIdDeDia("2026-09-10")).toBe("dia-2026-09-10");
  });

  it("fechaDeDuelo usa UTC: el duelo no cambia a medianoche de cada zona", () => {
    expect(fechaDeDuelo(new Date("2026-09-10T23:59:59Z"))).toBe("2026-09-10");
    expect(fechaDeDuelo(new Date("2026-09-10T00:00:01Z"))).toBe("2026-09-10");
  });
});

/* ─────────────────── API pública v2 ─────────────────── */

describe("v1.20.0 — API pública v2: claves, límites y CORS", () => {
  it("los secretos tienen formato sk-todo-<48 hex> y el enmascarado no los filtra", () => {
    const s = generarSecreto();
    expect(s.startsWith("sk-todo-")).toBe(true);
    expect(s).toMatch(/^sk-todo-[0-9a-f]{48}$/);
    const mask = enmascarar(s);
    expect(mask).toContain("…");
    expect(mask.length).toBeLessThan(s.length);
    expect(mask).not.toBe(s);
  });

  it("el límite por clave es de 20 llamadas/minuto y máx. 5 claves activas", () => {
    expect(LIMITE_API_V2.max).toBe(20);
    expect(LIMITE_API_V2.ventanaMs).toBe(60_000);
    expect(MAX_CLAVES_POR_USUARIO).toBe(5);
  });

  it("CORS abierto en la v2: lectura y preflight para cualquier origen", () => {
    expect(CORS_HEADERS["Access-Control-Allow-Origin"]).toBe("*");
    expect(CORS_HEADERS["Access-Control-Allow-Headers"]).toContain("X-Api-Key");
    expect(CORS_HEADERS["Access-Control-Allow-Methods"]).toContain("OPTIONS");
  });

  it("las 7 rutas v2 existen en el árbol (routes reales, no documentación)", () => {
    for (const ruta of [
      "src/app/api/v2/keys/route.ts",
      "src/app/api/v2/leaderboard/route.ts",
      "src/app/api/v2/models/route.ts",
      "src/app/api/v2/campeones/route.ts",
      "src/app/api/v2/jurados/route.ts",
      "src/app/api/v2/battle/route.ts",
      "src/app/api/v2/vote/route.ts",
      "src/app/api/v2/openapi/route.ts",
    ]) {
      expect(fs.existsSync(path.join(process.cwd(), ruta)), `falta ${ruta}`).toBe(true);
    }
  });

  it("el contrato OpenAPI se declara 3.1 y documenta battle+vote", () => {
    const doc = leer("src/app/api/v2/openapi/route.ts");
    expect(doc).toContain('"3.1.0"');
    expect(doc).toContain("/api/v2/battle");
    expect(doc).toContain("/api/v2/vote");
    expect(doc).toContain("X-Api-Key");
  });

  it("db-init crea las tablas UserElo y ApiKey (serverless sin migraciones)", () => {
    const init = leer("src/lib/db-init.ts");
    expect(init).toContain('"UserElo"');
    expect(init).toContain('"ApiKey"');
    expect(init).toContain("UserElo_elo_idx");
    expect(init).toContain("ApiKey_userId_idx");
  });

  it("el esquema Prisma (sqlite y postgres) declara UserElo y ApiKey", () => {
    expect(leer("prisma/schema.prisma")).toContain("model UserElo");
    expect(leer("prisma/schema.prisma")).toContain("model ApiKey");
    expect(leer("prisma/schema.postgres.prisma")).toContain("model UserElo");
    expect(leer("prisma/schema.postgres.prisma")).toContain("model ApiKey");
  });

  it("el vote de la arena devuelve el estado del jurado (usuarioElo)", () => {
    const vote = leer("src/app/api/vote/route.ts");
    expect(vote).toContain("procesarJurado");
    expect(vote).toContain("usuarioElo");
  });

  it("el torneo y el duelo del día también puntúan al jurado", () => {
    expect(leer("src/app/api/tournament/route.ts")).toContain("procesarJurado");
    expect(leer("src/app/api/dia/route.ts")).toContain("procesarJurado");
  });
});

/* ─────────────────── Integraciones de UI ─────────────────── */

describe("v1.20.0 — integraciones de UI", () => {
  it("TournamentView ofrece los 5 tamaños (4-8-16-32-64)", () => {
    const tv = leer("src/components/arena/TournamentView.tsx");
    expect(tv).toContain("[4, 8, 16, 32, 64]");
    expect(tv).toContain("Hasta 64 modelos");
  });

  it("el jurado vive también en el cliente (localStorage, mismas reglas)", () => {
    const jc = leer("src/lib/jurado-client.ts");
    expect(jc).toContain("todologo.jurado.v1");
    expect(jc).toContain("aplicarVotoJurado");
  });

  it("los tres puntos de voto de la UI registran al jurado", () => {
    for (const f of [
      "src/components/arena/ChatExperience.tsx",
      "src/components/arena/LaboratorioGenerativo.tsx",
      "src/components/arena/TournamentView.tsx",
    ]) {
      expect(leer(f).includes("registrarVotoJurado"), f).toBe(true);
    }
  });

  it("el espejo demo del duelo del día existe (GitHub Pages sin API)", () => {
    const demo = leer("src/lib/demo-engine.ts");
    expect(demo).toContain('"/api/dia"');
    expect(demo).toContain("handleDia");
  });

  it("el Salón de la Fama lista jurados y la sidebar enlaza las dos páginas nuevas", () => {
    expect(leer("src/app/salon-de-la-fama/page.tsx")).toContain("api/v2/jurados");
    const sidebar = leer("src/components/shell/Sidebar.tsx");
    expect(sidebar).toContain('"/dia"');
    expect(sidebar).toContain('"/api-publica"');
  });

  it("Labs gradúa copa-32-64 y api-publica", () => {
    const labs = leer("src/lib/labs.ts");
    const bloque = labs.slice(labs.indexOf('"copa-32-64"'), labs.indexOf('"duelo-equipos"'));
    expect(bloque).toContain('"graduado"');
    const bloqueApi = labs.slice(labs.indexOf('"api-publica"'), labs.indexOf('"plantillas-prompts"'));
    expect(bloqueApi).toContain('"graduado"');
  });
});
