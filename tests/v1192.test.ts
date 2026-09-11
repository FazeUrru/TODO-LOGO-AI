import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import { APP_VERSION } from "../src/lib/version";
import { VERSIONS } from "../src/lib/changelog-meta";
import {
  vigilanteDeLectura,
  conReintentos,
  autocorreccion,
} from "../src/lib/reintentos";

const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

/** Guardia anti-cuelgue: rechaza si la promesa no resuelve en `ms`. */
const techo = <T>(p: Promise<T>, ms = 3000): Promise<T> =>
  Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`ATASCO: no resolvió en ${ms}ms`)), ms)),
  ]);

describe("v1.19.2 — versión y trazabilidad", () => {
  it("la app va por la 1.19.2 (la cadena sigue viva)", () => {
    expect(APP_VERSION).toBe("1.23.0");
  });

  it("changelog-meta y CHANGELOG.md incluyen la 1.19.2 como corrección", () => {
    // Relajado (v1.20.0): busca su propia entrada — la cabecera cambia con cada release
    const meta = VERSIONS.find((v) => v.version === "1.19.2");
    expect(meta).toBeDefined();
    expect(meta?.diffDesde).toBe("1.19.1");
    expect(meta?.kinds).toContain("correccion");
    const md = leer("CHANGELOG.md");
    expect(md).toContain("Adiós al atasco");
    expect(md).toContain("Interbloqueo del vigilante de silencio");
  });
});

describe("v1.19.2 — el interbloqueo del vigilante (raíz del atasco)", () => {
  it("un upstream colgado SIN FIN no cuelga al vigilante: throw rápido + cancelar llamado", async () => {
    let cancelado = false;
    // Generador zombi: su next() jamás resuelve (reader.read() colgado sin FIN)
    async function* upstreamColgado(): AsyncGenerator<string> {
      await new Promise(() => {}); // nunca
      yield "nunca llegará";
    }
    const inicio = Date.now();
    await expect(
      techo(
        (async () => {
          for await (const _ of vigilanteDeLectura(upstreamColgado(), {
            primerChunkMs: 40,
            entreChunkMs: 40,
            cancelar: () => {
              cancelado = true;
            },
          })) {
            void _;
          }
        })(),
        2000
      )
    ).rejects.toThrow("sin primer chunk");
    // ¡Rápido! Antes este camino era un cuelgue eterno (await iterador.return())
    expect(Date.now() - inicio).toBeLessThan(1500);
    expect(cancelado).toBe(true);
  });

  it("silencio ENTRE chunks también muere rápido y cancela (goteo que se congela a mitad)", async () => {
    let cancelado = false;
    const recibido: string[] = [];
    async function* goteoQueSeCongela(): AsyncGenerator<string> {
      yield "const a = 1;";
      await new Promise(() => {}); // a mitad de código: colgado sin FIN
    }
    await expect(
      techo(
        (async () => {
          for await (const d of vigilanteDeLectura(goteoQueSeCongela(), {
            primerChunkMs: 5000,
            entreChunkMs: 40,
            cancelar: () => {
              cancelado = true;
            },
          })) {
            recibido.push(d);
          }
        })(),
        2000
      )
    ).rejects.toThrow("silencio entre chunks");
    expect(recibido).toEqual(["const a = 1;"]);
    expect(cancelado).toBe(true);
  });

  it("un stream sano pasa intacto: valores en orden y cierre limpio, sin cancelar", async () => {
    let cancelado = false;
    async function* sano(): AsyncGenerator<string> {
      yield "uno";
      yield "dos";
    }
    const recibido: string[] = [];
    for await (const d of vigilanteDeLectura(sano(), {
      primerChunkMs: 5000,
      entreChunkMs: 5000,
      cancelar: () => {
        cancelado = true;
      },
    })) {
      recibido.push(d);
    }
    expect(recibido).toEqual(["uno", "dos"]);
    expect(cancelado).toBe(false);
  });

  it("el patrón culpable ya no existe en el código: NUNCA se hace await del return()", () => {
    const src = leer("src/lib/reintentos.ts");
    expect(src).not.toMatch(/await\s+iterador\.return\?\.\(/); // el patrón culpable real
    expect(src).toContain("fuego y olvido");
  });
});

describe("v1.19.2 — presupuesto de reloj ANTES de cada intento", () => {
  it("un intento que consume el presupuesto no deja arrancar otro fresco (techo de maxDuration)", async () => {
    let llamadas = 0;
    const inicio = Date.now();
    const r = await techo(
      conReintentos(
        "test-presupuesto",
        async () => {
          llamadas++;
          await new Promise((res) => setTimeout(res, 60));
          return null; // upstream mudo
        },
        { presupuestoMs: 30, pausaBaseMs: 10, pausaMaxMs: 20 }
      ),
      2000
    );
    expect(r).toBeNull();
    expect(llamadas).toBe(1); // antes: intentaba de nuevo con reloj fresco
    expect(Date.now() - inicio).toBeLessThan(1500);
  });

  it("la recuperación transitoria sigue funcionando: falla dos veces y a la tercera ok", async () => {
    const fallos: number[] = [];
    let llamadas = 0;
    const r = await techo(
      conReintentos<string>(
        "test-recuperacion",
        async () => {
          llamadas++;
          if (llamadas < 3) return null;
          return "ok";
        },
        {
          presupuestoMs: 10_000,
          pausaBaseMs: 5,
          pausaMaxMs: 10,
          enFallo: (info) => fallos.push(info.n),
        }
      ),
      3000
    );
    expect(r).toBe("ok");
    expect(llamadas).toBe(3);
    expect(fallos).toEqual([1, 2]);
  });

  it("la escalera de autocorrección sigue ajustando intentos (modo directo desde el 10)", () => {
    expect(autocorreccion(1).modoDirecto).toBe(false);
    expect(autocorreccion(10).modoDirecto).toBe(true);
    expect(autocorreccion(5).thinking).toBe(false);
  });
});

describe("v1.19.2 — vigilantes en la tubería real (server y cliente)", () => {
  it("battle/route.ts: upstreamDeltas expone cancelar y el vigilante lo recibe", () => {
    const src = leer("src/app/api/battle/route.ts");
    expect(src).toContain("cancelar: () => void");
    expect(src).toMatch(/const \{ iterador, cancelar \} = upstreamDeltas/);
    expect(src).toMatch(/cancelar,/); // pasa el cancelar al vigilante
    expect(src).toContain("restanteGlobal"); // reloj global, no por intento
  });

  it("ChatExperience: la lectura SSE tiene vigilantes propios (silencio 45s y turno 90s)", () => {
    const src = leer("src/components/arena/ChatExperience.tsx");
    expect(src).toContain("SILENCIO_CLIENTE_MS = 45_000");
    expect(src).toContain("TURNO_CLIENTE_MS = 90_000");
    expect(src).toContain("reader.cancel()"); // cancelación directa del zombi
    expect(src).toContain("el servidor dejó de emitir"); // motivo honesto en la UI
  });
});
