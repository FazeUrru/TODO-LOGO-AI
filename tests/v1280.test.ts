/**
 * Regresión v1.28.0 — «Watchdog empresarial»: la salud del negocio se
 * juzga en vivo, con SLA, alertas y acciones.
 *
 *  · Aritmética pura: percentil, porcentajeDisponibilidad, tendencia,
 *    formatearUptime, haceCuanto y purgarVentana.
 *  · evaluarSalud: los 6 códigos de alerta, el escalado aviso→crítico,
 *    el nivel compuesto, el resumen sin tráfico y las reglas a medida.
 *  · sugerirAcciones: orden por severidad, sin duplicados y con acción
 *    para cada código conocido.
 *  · Colector del servidor: whitelist del reporte de cliente y
 *    instantánea coherente con las ventanas (vía registrarIncidenteCliente).
 *  · Invariantes estáticos: panel (jsonSeguro, refresco 15 s, pausa
 *    document.hidden, colores de severidad sin proscritos), API
 *    (rate-limit + zod), instrumentación (batalla, health, ChatExperience),
 *    tabla VigilanciaIncidente en los tres sitios y tríada 1.28.0.
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  ACCIONES,
  METRICAS_DEMO,
  REGLAS_BASE,
  evaluarSalud,
  formatearUptime,
  haceCuanto,
  percentil,
  porcentajeDisponibilidad,
  purgarVentana,
  sugerirAcciones,
  tendencia,
  type MetricasNegocio,
} from "../src/lib/vigilancia";
import { registrarIncidenteCliente, tamanoAnillos } from "../src/lib/vigilancia-servidor";
import { APP_VERSION, APP_BUILD_DATE } from "../src/lib/version";
import { VERSIONS } from "../src/lib/changelog-meta";

const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

/** Métricas sanas de fábrica para componer escenarios. */
const SANAS: MetricasNegocio = {
  disponibilidadPct: 100,
  latenciaP50Ms: 600,
  latenciaP99Ms: 1400,
  tasaErrorPct: 0.2,
  dbLatenciaMs: 40,
  batallas: 120,
  cortes: 4,
  cortesCurados: 4,
  cortesSinCurar: 0,
  reanudaciones: 6,
  votos: 40,
  bloqueos429: 2,
  uptimeSec: 7_200,
};

const sana = (parcial: Partial<MetricasNegocio>): MetricasNegocio => ({ ...SANAS, ...parcial });

describe("percentil — rango más cercano sin sorpresas", () => {
  it("lista vacía o sin números finitos → 0", () => {
    expect(percentil([], 0.5)).toBe(0);
    expect(percentil([NaN, Infinity], 0.99)).toBe(0);
  });

  it("una sola muestra es el percentil de todo", () => {
    expect(percentil([350], 0.5)).toBe(350);
    expect(percentil([350], 0.99)).toBe(350);
  });

  it("par e impar dan la mediana del método de rango más cercano", () => {
    expect(percentil([5, 1, 3], 0.5)).toBe(3);
    // Par: ceil(0.5·4)=2 → 2.ª ordenada de [1,2,3,4] → 2 (método nearest-rank).
    expect(percentil([4, 2, 1, 3], 0.5)).toBe(2);
  });

  it("el P99 de 100 muestras coge la cola real", () => {
    const muestras = Array.from({ length: 100 }, (_, i) => i + 1); // 1..100
    expect(percentil(muestras, 0.99)).toBe(99);
    expect(percentil(muestras, 1)).toBe(100);
  });

  it("ordena antes de elegir (la entrada no viene ordenada)", () => {
    expect(percentil([900, 100, 500], 0.99)).toBe(900);
  });
});

describe("porcentajeDisponibilidad y tendencia", () => {
  it("sin tráfico no hay nada caído: 100", () => {
    expect(porcentajeDisponibilidad(0, 0)).toBe(100);
    expect(porcentajeDisponibilidad(3, 0)).toBe(100);
  });

  it("proporciones redondeadas a dos decimales y acotadas a [0,100]", () => {
    expect(porcentajeDisponibilidad(1, 400)).toBe(99.75);
    expect(porcentajeDisponibilidad(0, 10)).toBe(100);
    expect(porcentajeDisponibilidad(10, 10)).toBe(0);
    expect(porcentajeDisponibilidad(50, 25)).toBe(0); // nunca negativo
  });

  it("tendencia: sube, baja y plano con delta redondeada", () => {
    expect(tendencia(12.5, 10)).toEqual({ direccion: "sube", delta: 2.5 });
    expect(tendencia(8, 9.5)).toEqual({ direccion: "baja", delta: -1.5 });
    expect(tendencia(7, 7)).toEqual({ direccion: "plano", delta: 0 });
  });
});

describe("formatearUptime y haceCuanto — el tiempo legible", () => {
  it("segundos, minutos, horas y días con sus umbrales exactos", () => {
    expect(formatearUptime(45)).toBe("45 s");
    expect(formatearUptime(760)).toBe("12 m 40 s");
    expect(formatearUptime(7500)).toBe("2 h 05 m");
    expect(formatearUptime(86_400 * 3 + 4 * 3_600)).toBe("3 d 4 h");
  });

  it("negativos no rompen: se quedan en 0 s", () => {
    expect(formatearUptime(-5)).toBe("0 s");
  });

  it("haceCuanto: s → m → h → d", () => {
    const ahora = 1_000_000_000;
    expect(haceCuanto(ahora - 30_000, ahora)).toBe("hace 30 s");
    expect(haceCuanto(ahora - 5 * 60_000, ahora)).toBe("hace 5 m");
    expect(haceCuanto(ahora - 3 * 3_600_000, ahora)).toBe("hace 3 h");
    expect(haceCuanto(ahora - 2 * 86_400_000, ahora)).toBe("hace 2 d");
  });
});

describe("purgarVentana — solo lo vivo entra en el juicio", () => {
  it("filtra por ventana y admite el borde superior", () => {
    const ahora = 10_000;
    const eventos = [
      { ts: 9_000, tipo: "a" },
      { ts: 3_000, tipo: "viejo" }, // fuera de la ventana de 6 s
      { ts: 10_000, tipo: "borde" },
      { ts: 10_500, tipo: "futuro" },
    ];
    expect(purgarVentana(eventos, ahora, 6_000).map((e) => e.tipo)).toEqual(["a", "borde"]);
  });
});

describe("evaluarSalud — el veredicto contra las reglas", () => {
  it("métricas sanas → óptimo sin alertas y resumen que presume", () => {
    const s = evaluarSalud(SANAS);
    expect(s.nivel).toBe("optimo");
    expect(s.alertas).toHaveLength(0);
    expect(s.resumen).toContain("SLA cumplido");
  });

  it("SLA por debajo → aviso; muy por debajo → crítico", () => {
    const aviso = evaluarSalud(sana({ disponibilidadPct: 99.95 - 0.06 }));
    expect(aviso.alertas[0]?.codigo).toBe("sla-bajo");
    expect(aviso.alertas[0]?.severidad).toBe("aviso");
    expect(aviso.nivel).toBe("degradado");

    const critico = evaluarSalud(sana({ disponibilidadPct: 99.0 }));
    expect(critico.alertas[0]?.severidad).toBe("critico");
    expect(critico.nivel).toBe("critico");
  });

  it("P99 sobre umbral → aviso; al doble → crítico", () => {
    expect(evaluarSalud(sana({ latenciaP99Ms: 2_600 })).alertas[0]?.codigo).toBe("latencia-p99");
    const doble = evaluarSalud(sana({ latenciaP99Ms: 5_001 }));
    expect(doble.alertas[0]?.severidad).toBe("critico");
    expect(doble.nivel).toBe("critico");
  });

  it("tasa de error, latido de BD y cortes sin curar disparan sus códigos", () => {
    expect(evaluarSalud(sana({ tasaErrorPct: 2.5 })).alertas[0]?.codigo).toBe("tasa-error");
    expect(evaluarSalud(sana({ dbLatenciaMs: 600 })).alertas[0]?.codigo).toBe("db-lenta");
    const dbMuerta = evaluarSalud(sana({ dbLatenciaMs: 2_000 }));
    expect(dbMuerta.alertas[0]?.severidad).toBe("critico");
    expect(evaluarSalud(sana({ cortesSinCurar: 5, cortes: 5 })).alertas[0]?.codigo).toBe("cortes-sin-curar");
  });

  it("los bloqueos 429 son solo informativos: no degradan el nivel", () => {
    const s = evaluarSalud(sana({ bloqueos429: 50 }));
    expect(s.alertas[0]?.codigo).toBe("bloqueos-429");
    expect(s.alertas[0]?.severidad).toBe("info");
    expect(s.nivel).toBe("optimo");
  });

  it("varios avisos a la vez → degradado, y el crítico manda", () => {
    const dos = evaluarSalud(sana({ tasaErrorPct: 2.5, dbLatenciaMs: 600 }));
    expect(dos.nivel).toBe("degradado");
    expect(dos.alertas.length).toBeGreaterThanOrEqual(2);
    const mezcla = evaluarSalud(sana({ disponibilidadPct: 98, latenciaP99Ms: 3_000 }));
    expect(mezcla.nivel).toBe("critico");
  });

  it("sin tráfico el resumen lo dice con honestidad", () => {
    const s = evaluarSalud(sana({ batallas: 0, votos: 0 }));
    expect(s.resumen).toContain("Sin tráfico significativo");
  });

  it("reglas a medida: un SLA más exigente se juzga con su vara", () => {
    const estricto = { ...REGLAS_BASE, slaDisponibilidadPct: 100 };
    const s = evaluarSalud(sana({ disponibilidadPct: 99.97 }), estricto);
    expect(s.alertas.some((a) => a.codigo === "sla-bajo")).toBe(true);
  });

  it("la demo verosímil es óptima (si no, el panel de demo mentiría)", () => {
    expect(evaluarSalud(METRICAS_DEMO).nivel).toBe("optimo");
  });
});

describe("sugerirAcciones — de la alerta a la acción", () => {
  it("cada código conocido lleva su acción no vacía", () => {
    for (const codigo of Object.keys(ACCIONES)) {
      const salida = sugerirAcciones([{ codigo, severidad: "aviso", titulo: "t", detalle: "d" }]);
      expect(salida).toHaveLength(1);
      expect(salida[0].accion.length).toBeGreaterThan(20);
    }
  });

  it("ordena por severidad (crítico primero) y no duplica códigos", () => {
    const salida = sugerirAcciones([
      { codigo: "bloqueos-429", severidad: "info", titulo: "", detalle: "" },
      { codigo: "sla-bajo", severidad: "critico", titulo: "", detalle: "" },
      { codigo: "tasa-error", severidad: "aviso", titulo: "", detalle: "" },
      { codigo: "sla-bajo", severidad: "critico", titulo: "", detalle: "" },
    ]);
    expect(salida.map((s) => s.codigo)).toEqual(["sla-bajo", "tasa-error", "bloqueos-429"]);
  });
});

describe("colector del servidor — la verdad del dispositivo entra con whitelist", () => {
  it("los tres tipos de la inmunidad se aceptan y se traducen a eventos", () => {
    const antes = tamanoAnillos().totalEventos;
    expect(registrarIncidenteCliente("corte-curado")).toBe("curado");
    expect(registrarIncidenteCliente("corte-sin-curar")).toBe("sin-curar");
    expect(registrarIncidenteCliente("falso-positivo")).toBe("corte");
    expect(tamanoAnillos().totalEventos).toBe(antes + 3);
  });

  it("el cliente jamás inventa métricas: tipos desconocidos → null", () => {
    expect(registrarIncidenteCliente("batalla")).toBeNull();
    expect(registrarIncidenteCliente("")).toBeNull();
    expect(registrarIncidenteCliente("DROP TABLE User;--")).toBeNull();
  });
});

describe("invariantes estáticos del panel y la API", () => {
  const panel = leer("src/components/empresas/PanelVigilancia.tsx");
  const api = leer("src/app/api/vigilancia/route.ts");

  it("el panel lee con jsonSeguro (invariante de la casa desde v1.25.1)", () => {
    expect(panel).toContain("jsonSeguro");
    expect(panel).not.toMatch(/\.json\(\)/);
  });

  it("refresco cada 15 s, pausa con la pestaña oculta y botón manual", () => {
    expect(panel).toContain("REFRESCO_MS = 15_000");
    expect(panel).toContain("document.hidden");
    expect(panel).toContain("Comprobar ahora");
  });

  it("colores de severidad sin indigo ni azul proscritos", () => {
    expect(panel).not.toMatch(/\b(indigo|blue)-\d+/);
    expect(panel).toContain("emerald");
    expect(panel).toContain("amber");
  });

  it("el panel cuelga en /empresas con su sección accesible", () => {
    const empresas = leer("src/app/empresas/page.tsx");
    expect(empresas).toContain("PanelVigilancia");
    expect(panel).toContain('aria-label="Panel de vigilancia del negocio"');
  });

  it("la API tiene rate-limit propio, zod y whitelist de reportes", () => {
    expect(api).toContain("acumular(");
    expect(api).toContain("EsquemaReporte");
    expect(api).toContain('"corte-curado"');
    expect(api).toContain('"corte-sin-curar"');
    expect(api).toContain('"falso-positivo"');
  });

  it("la API nunca pinta verde con la base muerta", () => {
    expect(api).toContain("dbLatenciaMs = -1");
    expect(api).toContain("disponibilidadPct = 0");
  });

  it("la auditoría deduplica 30 minutos por código y solo archiva lo grave", () => {
    expect(api).toContain("VENTANA_AUDITORIA_MS");
    expect(api).toContain('alerta.severidad === "info"');
    expect(api).toContain("continue");
  });
});

describe("instrumentación — la batalla, la salud y el cliente hablan al vigilante", () => {
  it("/api/battle registra batallas, reanudaciones, cortes, latencia y 429", () => {
    const batalla = leer("src/app/api/battle/route.ts");
    expect(batalla).toContain('registrarEvento(esContinuacion ? "reanudacion" : "batalla")');
    expect(batalla).toContain('registrarEvento("bloqueo-429"');
    expect(batalla).toContain('registrarEvento("corte"');
    expect(batalla).toContain("registrarLatencia(Date.now() - inicioTramo)");
  });

  it("/api/health reporta la BD caída como incidente de negocio", () => {
    expect(leer("src/app/api/health/route.ts")).toContain('registrarEvento("error-5xx"');
  });

  it("ChatExperience envía el evento en fire-and-forget sin esperar", () => {
    const chat = leer("src/components/arena/ChatExperience.tsx");
    expect(chat).toContain('fetch("/api/vigilancia"');
    expect(chat).toContain('.catch(() => {})');
  });

  it("la tabla VigilanciaIncidente existe en los tres sitios", () => {
    expect(leer("src/lib/db-init.ts")).toContain('"VigilanciaIncidente"');
    expect(leer("prisma/schema.prisma")).toContain("model VigilanciaIncidente");
    expect(leer("prisma/schema.postgres.prisma")).toContain("model VigilanciaIncidente");
  });
});

describe("tríada de versiones — 1.28.0 coherente en los tres sitios", () => {
  it("version.ts declara 1.28.1 (la release actual; la entrada 1.28.0 sigue abajo)", () => {
    expect(APP_VERSION).toBe("1.38.0");
    expect(APP_BUILD_DATE).toBe("2026-09-12");
  });

  it("changelog-meta.ts conserva la entrada 1.28.0 con su diff encadenado", () => {
    const nueva = VERSIONS.find((v) => v.version === "1.28.0");
    expect(nueva).toBeTruthy();
    expect(nueva?.diffDesde).toBe("1.27.0");
    expect(nueva?.hora).toBeTruthy();
    expect(nueva?.kinds).toContain("nuevo");
    const versiones = VERSIONS.map((v) => v.version);
    expect(new Set(versiones).size).toBe(versiones.length); // sin duplicados
  });

  it("CHANGELOG.md contiene la entrada con su compare", () => {
    const md = leer("CHANGELOG.md");
    expect(md).toContain("compare/v1.27.0...v1.28.0");
    expect(md).toContain("Watchdog empresarial");
  });
});
