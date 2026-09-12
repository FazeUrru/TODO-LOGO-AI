/**
 * Regresión v1.24.0 — «STREAM FOREVER: el streaming que no se corta nunca
 * y aprende de cada corte».
 *
 *  · quitarSolape: el anti-duplicado (cola del previo contra cabeza del nuevo)
 *  · promptReanudacion: continúa desde el carácter exacto, sin repetir, [FIN]
 *  · memoria inmunitaria: rachas, moderación y límites clamp
 *  · servidor: latidos SSE, señal corteA/corteB, finLado, contrato continuacion,
 *    rate-limit exento en tramos, historial de reanudación
 *  · cliente: bucle de reanudación Stream Forever, vigilante adaptativo,
 *    filtro [FIN], badge y chip de inmunidad
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { APP_VERSION } from "../src/lib/version";
import { VERSIONS } from "../src/lib/changelog-meta";
import {
  quitarSolape,
  promptReanudacion,
  ajustarInmunidad,
  cargarInmunidad,
  guardarInmunidad,
  INMUNIDAD_INICIAL,
  UMBRAL_BASE_MS,
  UMBRAL_MIN_MS,
  UMBRAL_MAX_MS,
  TRAMOS_BASE,
  TRAMOS_MIN,
  TRAMOS_MAX_TOPE,
  CLAVE_INMUNIDAD,
} from "../src/lib/stream-inmunidad";

const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const ruta = leer("src/app/api/battle/route.ts");
const cliente = leer("src/components/arena/ChatExperience.tsx");

/* ─────────────────── Versión y trazabilidad ─────────────────── */

describe("v1.24.0 — versión y trazabilidad", () => {
  it("la app va por la 1.24.0 (la cadena sigue viva)", () => {
    expect(APP_VERSION).toBe("1.27.0");
  });

  it("changelog-meta y CHANGELOG.md relatan la 1.24.0", () => {
    expect(VERSIONS[1].version).toBe("1.26.0");
    expect(VERSIONS[4].version).toBe("1.24.0");
    expect(VERSIONS[4].diffDesde).toBe("1.23.0");
    expect(VERSIONS[4].kinds).toContain("nuevo");
    const md = leer("CHANGELOG.md");
    expect(md).toContain("STREAM FOREVER");
    expect(md).toContain("Memoria inmunitaria");
    expect(md).toContain("REANUDA el hilo");
  });
});

/* ─────────────────── quitarSolape: el anti-duplicado ─────────────────── */

describe("v1.24.0 — quitarSolape: ni un carácter repetido", () => {
  it("sin solape devuelve el texto nuevo intacto", () => {
    expect(quitarSolape("ya escrito.", "y sigue aquí")).toBe("y sigue aquí");
  });

  it("recorta el solape exacto de cola y cabeza", () => {
    expect(quitarSolape("hola mundo entero", "mundo entero feliz")).toBe(" feliz");
  });

  it("recorta el solape más LARGO primero", () => {
    const previo = "fin de la línea anterior y Además: continuo";
    const nuevo = "anterior y Además: continuo por aquí";
    // el solape máximo es "anterior y Además: continuo" (27 chars), no uno menor
    expect(quitarSolape(previo, nuevo)).toBe(" por aquí");
  });

  it("solapes cortos (menos de 8) no se consideran: texto intacto", () => {
    expect(quitarSolape("…final s", "sí, sigo")).toBe("sí, sigo");
  });

  it("casos vacíos y borde: nada explota", () => {
    expect(quitarSolape("", "nuevo")).toBe("nuevo");
    expect(quitarSolape("previo", "")).toBe("");
    expect(quitarSolape("abc", "abc")).toBe(""); // duplicado completo del tramo → vacío
  });

  it("el empalme real: un código cortado a mitad de línea continúa limpio", () => {
    const parcial = "function hola() {\n  const x = 1;\n  retu";
    const tramoNuevo = "rn x;\n}";
    expect(parcial + quitarSolape(parcial, tramoNuevo)).toBe("function hola() {\n  const x = 1;\n  return x;\n}");
  });
});

/* ─────────────────── promptReanudacion ─────────────────── */

describe("v1.24.0 — promptReanudacion: continúa desde el carácter exacto", () => {
  it("ordena continuar sin repetir ni un carácter", () => {
    const p = promptReanudacion(2);
    expect(p).toContain("TRAMO 2");
    expect(p).toContain("CONTINÚA");
    expect(p).toContain("Prohibido repetir");
    expect(p).toContain("Prohibido preámbulos");
  });

  it("cubre el código partido y la marca [FIN]", () => {
    const p = promptReanudacion(3);
    expect(p).toContain("bloque de código");
    expect(p).toContain("[FIN]");
  });
});

/* ─────────────────── Memoria inmunitaria autoevolutiva ─────────────────── */

describe("v1.24.0 — memoria inmunitaria: aprende de cada corte", () => {
  it("el estado inicial es sano y conservador", () => {
    expect(INMUNIDAD_INICIAL.umbralSilencioMs).toBe(UMBRAL_BASE_MS);
    expect(INMUNIDAD_INICIAL.tramosMax).toBe(TRAMOS_BASE);
    expect(INMUNIDAD_INICIAL.cortesCurados).toBe(0);
  });

  it("corte-curado sube contadores y racha", () => {
    const m = ajustarInmunidad(INMUNIDAD_INICIAL, "corte-curado");
    expect(m.cortesVistos).toBe(1);
    expect(m.cortesCurados).toBe(1);
    expect(m.racha).toBe(1);
    expect(m.umbralSilencioMs).toBe(UMBRAL_BASE_MS);
    expect(m.tramosMax).toBe(TRAMOS_BASE);
  });

  it("tres curaciones seguidas: el sistema gana confianza (más rápido, más tramos)", () => {
    let m = INMUNIDAD_INICIAL;
    for (let i = 0; i < 3; i++) m = ajustarInmunidad(m, "corte-curado");
    expect(m.racha).toBe(3);
    expect(m.umbralSilencioMs).toBe(UMBRAL_BASE_MS - 1_500);
    expect(m.tramosMax).toBe(TRAMOS_BASE + 2);
  });

  it("corte-sin-curar: racha a cero y moderación del empeño (nunca por debajo del mínimo)", () => {
    let m = ajustarInmunidad(INMUNIDAD_INICIAL, "corte-curado");
    m = ajustarInmunidad(m, "corte-sin-curar");
    expect(m.racha).toBe(0);
    expect(m.tramosMax).toBe(TRAMOS_BASE - 2);
    for (let i = 0; i < 20; i++) m = ajustarInmunidad(m, "corte-sin-curar");
    expect(m.tramosMax).toBe(TRAMOS_MIN);
  });

  it("falso-positivo: el vigilante se afloja (con techo)", () => {
    const m = ajustarInmunidad(INMUNIDAD_INICIAL, "falso-positivo");
    expect(m.umbralSilencioMs).toBe(UMBRAL_BASE_MS + 2_000);
    for (let i = 0; i < 30; i++) ajustarInmunidad(m, "falso-positivo");
    const tope = ajustarInmunidad({ ...m, umbralSilencioMs: UMBRAL_MAX_MS }, "falso-positivo");
    expect(tope.umbralSilencioMs).toBe(UMBRAL_MAX_MS);
  });

  it("la memoria sobrevive al almacenamiento (y a un almacen roto)", () => {
    const mem = { ...INMUNIDAD_INICIAL, cortesCurados: 7, umbralSilencioMs: 20_000 };
    const guarda: Record<string, string> = {};
    const falsoStorage = {
      getItem: (k: string) => guarda[k] ?? null,
      setItem: (k: string, v: string) => {
        guarda[k] = v;
      },
    };
    guardarInmunidad(mem, falsoStorage);
    expect(guarda[CLAVE_INMUNIDAD]).toContain("\"cortesCurados\":7");
    expect(cargarInmunidad(falsoStorage).cortesCurados).toBe(7);
    expect(cargarInmunidad(falsoStorage).umbralSilencioMs).toBe(20_000);
    const roto = {
      getItem: () => "{roto",
      setItem: () => {
        throw new Error("cuota");
      },
    };
    expect(cargarInmunidad(roto)).toEqual(INMUNIDAD_INICIAL);
    expect(() => guardarInmunidad(mem, roto)).not.toThrow();
  });

  it("la memoria corrupta se sanea con clamps", () => {
    const loco = {
      getItem: () => JSON.stringify({ cortesVistos: -5, umbralSilencioMs: 999_999, tramosMax: "mucho" }),
      setItem: () => {},
    };
    const m = cargarInmunidad(loco);
    expect(m.cortesVistos).toBe(0);
    expect(m.umbralSilencioMs).toBe(UMBRAL_MAX_MS);
    expect(m.tramosMax).toBe(TRAMOS_BASE);
  });
});

/* ─────────────────── Servidor: latidos, corte y reanudación ─────────────────── */

describe("v1.24.0 — servidor de batalla: STREAM FOREVER por dentro", () => {
  it("emite latidos SSE cada 2 s (la conexión nunca calla)", () => {
    expect(ruta).toContain('": ping\\n\\n"');
    expect(ruta).toContain("setInterval");
    expect(ruta).toContain("2_000");
    expect(ruta).toContain("clearInterval(latido)");
  });

  it("señaliza el corte en el end (corteA/corteB) y marca cortado por reloj", () => {
    expect(ruta).toContain("corteA: outA.cortado && !usedA");
    expect(ruta).toContain("corteB: Boolean(modelB) && Boolean(outB?.cortado) && !usedB");
    expect(ruta).toContain("cortePorReloj");
    expect(ruta).toContain("cortado: text.trim().length > 0");
  });

  it("emite finLado para los lados que terminan limpios", () => {
    expect(ruta).toContain('t: "finLado"');
  });

  it("acepta el contrato continuacion con reanudarA/reanudarB y parciales", () => {
    expect(ruta).toContain("reanudarA?: boolean");
    expect(ruta).toContain("reanudarB?: boolean");
    expect(ruta).toContain("parcialA?: string");
    expect(ruta).toContain("parcialB?: string");
    expect(ruta).toContain("body.continuacion?.parcialA ?? \"\"");
    expect(ruta).toContain("body.continuacion?.reanudarA ?? Boolean(parcialA)");
  });

  it("los tramos de reanudación NO vuelven a pagar el rate-limit", () => {
    expect(ruta).toContain("!esContinuacion && !acumular");
    expect(ruta).toContain("esContinuacion = Boolean(body.continuacion?.parcialA || body.continuacion?.parcialB)");
  });

  it("el parcial entra como assistant del historial y el prompt pide continuar", () => {
    expect(ruta).toContain('[...historyA, { role: "assistant" as const, content: parcialA }]');
    expect(ruta).toContain("promptReanudacion(tramo)");
    expect(ruta).toContain('promptEfectivo = esContinuacion');
  });

  it("el lado que terminó bien NO se regenera (ladoNeutro)", () => {
    expect(ruta).toContain("ladoNeutro");
    expect(ruta).toContain("reanudarA\n            ? streamSide");
    expect(ruta).toContain(": Promise.resolve(ladoNeutro)");
  });

  it("importa la inmunidad y conserva el presupuesto de 55 s por tramo", () => {
    expect(ruta).toContain('from "@/lib/stream-inmunidad"');
    expect(ruta).toContain("STREAM_TOTAL_DEADLINE_MS = 55_000");
  });
});

/* ─────────────────── Cliente: el bucle que nunca se rinde ─────────────────── */

describe("v1.24.0 — cliente: reanudación automática e inmunitaria", () => {
  it("existe el bucle Stream Forever con el contrato completo", () => {
    expect(cliente).toContain("STREAM FOREVER — encadenado autoevolutivo de tramos");
    expect(cliente).toContain("reanudando el hilo desde el último carácter");
    expect(cliente).toContain("const reanudarA = corteA || !finA");
    expect(cliente).toContain("const reanudarB = !isDirect && (corteB || !finB)");
    expect(cliente).toContain("tramo < mem.tramosMax");
  });

  it("empalma SIEMPRE con anti-solape (base + quitarSolape)", () => {
    expect(cliente).toContain("accA = baseA + quitarSolape(baseA, nuevoA)");
    expect(cliente).toContain("accB = baseB + quitarSolape(baseB, nuevoB)");
  });

  it("el vigilante del cliente usa el umbral ADAPTATIVO de la memoria", () => {
    expect(cliente).toContain("const mem: MemoriaInmunidad = cargarInmunidad()");
    expect(cliente).toContain("SILENCIO_CLIENTE_MS = mem.umbralSilencioMs");
    expect(cliente).not.toContain("SILENCIO_CLIENTE_MS = 45_000");
  });

  it("procesa finLado y la señal de corte del end", () => {
    expect(cliente).toContain('type === "finLado"');
    expect(cliente).toContain("corteA = Boolean(payload.corteA)");
    expect(cliente).toContain("corteB = Boolean(payload.corteB)");
  });

  it("la marca [FIN] se retira y no se pinta", () => {
    expect(cliente).toContain('nuevoA = nuevoA.replace(/^\\s*\\[FIN\\]\\s*/u, "")');
    expect(cliente).toContain('nuevoB = nuevoB.replace(/^\\s*\\[FIN\\]\\s*/u, "")');
  });

  it("registra el incidente en la memoria inmunitaria y muestra el chip", () => {
    expect(cliente).toContain("ajustarInmunidad(mem, eventoFinal)");
    expect(cliente).toContain("guardarInmunidad(mem2)");
    expect(cliente).toContain("corte-sin-curar");
    expect(cliente).toContain("cortes curados");
  });

  it("el badge distingue la reanudación Stream Forever de la recuperación clásica", () => {
    expect(cliente).toContain("Stream Forever · reanudando el hilo (tramo");
    expect(cliente).toContain("Recuperando señal · intento");
  });

  it("lo confirmado jamás se borra: limpiar solo vacía el tramo en curso", () => {
    expect(cliente).toContain("nuevoA = \"\";\n            empalmaA();");
    expect(cliente).toContain("lo\n          // confirmado (base) jamás se borra");
  });
});
