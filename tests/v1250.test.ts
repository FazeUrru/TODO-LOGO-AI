/**
 * Regresión v1.25.0 — «El hilo permanente: cada conversación gana su link
 * público — real, funcional y estable».
 *
 *  · sanearHilo: whitelist de campos, techos por turno/hilo, exigencia de
 *    usuario + asistente, fuentes recortadas, nada de efímeros (media/images)
 *  · serializar/deserializar: ida y vuelta exacta y tolerancia a la corrupción
 *  · API /api/conversacion: POST con validaciones (modelo desconocido,
 *    generativo rechazado, hilo no publicable, rate-limit, id c_), GET listado
 *  · API /api/conversacion/[id]: prefijo c_, 404 honesto, PATCH vista/compartir
 *  · página /c/[id]: export estático honesto (generateStaticParams vacío)
 *  · cliente del link: contadores por sesión, botón compartir, hilo con "Tú"
 *  · ChatExperience: compartirConversacion limpia los turnos (sin media) y
 *    el botón convive con el replay v1.18.0
 *  · BD: tabla ConversacionGuardada auto-creada con sus índices y contadores
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { APP_VERSION } from "../src/lib/version";
import { VERSIONS } from "../src/lib/changelog-meta";
import {
  sanearHilo,
  serializarHilo,
  deserializarHilo,
  primerMensajeUsuario,
  contarIntercambios,
  MAX_TURNOS,
  MAX_CONTENIDO,
  MAX_THINKING,
  MAX_SOURCES,
} from "../src/lib/hilo-conversacion";

const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const rutaPOST = leer("src/app/api/conversacion/route.ts");
const rutaID = leer("src/app/api/conversacion/[id]/route.ts");
const clienteChat = leer("src/components/arena/ChatExperience.tsx");
const dbInit = leer("src/lib/db-init.ts");

/* ─────────────────── Versión y trazabilidad ─────────────────── */

describe("v1.25.0 — versión y trazabilidad", () => {
  it("la app va por la 1.25.0 (la cadena sigue viva)", () => {
    expect(APP_VERSION).toBe("1.28.1");
  });

  it("changelog-meta y CHANGELOG.md relatan la 1.25.0", () => {
    expect(VERSIONS[3].version).toBe("1.26.0");
    expect(VERSIONS[4].version).toBe("1.25.1");
    expect(VERSIONS[4].diffDesde).toBe("1.25.0");
    expect(VERSIONS[5].version).toBe("1.25.0");
    expect(VERSIONS[5].diffDesde).toBe("1.24.0");
    expect(VERSIONS[5].kinds).toContain("nuevo");
    expect(VERSIONS[6].version).toBe("1.24.0");
    const md = leer("CHANGELOG.md");
    expect(md).toContain("El hilo permanente");
    expect(md).toContain("Link de conversación");
    expect(md).toContain("ConversacionGuardada");
  });
});

/* ─────────────────── sanearHilo: el guardián del link ─────────────────── */

const hiloValido = [
  { role: "user", content: "Hazme un cliente torrent robusto" },
  { role: "assistant", content: "Aquí lo tienes: ```python\n...\n```" },
  { role: "user", content: "Ahora añade cola de descargas" },
  { role: "assistant", content: "Hecho, con límite de 3 activas.", thinking: "El usuario quiere cola." },
];

describe("v1.25.0 — sanearHilo: ni un campo de más", () => {
  it("un hilo válido pasa intacto (roles, contenido, orden)", () => {
    const r = sanearHilo(hiloValido);
    expect(r.error).toBeUndefined();
    expect(r.turnos).toHaveLength(4);
    expect(r.turnos.map((t) => t.role)).toEqual(["user", "assistant", "user", "assistant"]);
    expect(r.turnos[3].thinking).toBe("El usuario quiere cola.");
  });

  it("los campos efímeros NO viajan: media, images y kind se quedan fuera", () => {
    const conEfimeros = [
      {
        role: "user",
        content: "mira esta captura",
        images: ["data:image/png;base64,AAAA" + "A".repeat(1000)],
        media: { type: "image", url: "blob:session-only" },
      },
      { role: "assistant", content: "vista", kind: "juego" },
    ];
    const r = sanearHilo(conEfimeros);
    expect(r.turnos).toHaveLength(2);
    expect(r.turnos[0]).toEqual({ role: "user", content: "mira esta captura" });
    expect(r.turnos[1]).toEqual({ role: "assistant", content: "vista" });
  });

  it("rechaza lo que no es un array, lo vacío y lo excesivo", () => {
    expect(sanearHilo("no soy un hilo").error).toBeTruthy();
    expect(sanearHilo(null).error).toBeTruthy();
    expect(sanearHilo([]).error).toBeTruthy();
    const excesivo = Array.from({ length: MAX_TURNOS + 1 }, (_, i) => ({
      role: i % 2 ? "assistant" : "user",
      content: `turno ${i}`,
    }));
    expect(sanearHilo(excesivo).error).toContain(`máx. ${MAX_TURNOS}`);
  });

  it("rechaza roles inválidos y turnos sin contenido", () => {
    expect(sanearHilo([{ role: "sistema", content: "x" }]).error).toContain("Rol inválido");
    expect(sanearHilo([{ role: "user", content: "   " }]).error).toBeTruthy();
    expect(sanearHilo(["texto suelto"]).error).toBeTruthy();
  });

  it("una conversación sin réplica no se publica", () => {
    const soloUsuario = [{ role: "user", content: "hola" }];
    expect(sanearHilo(soloUsuario).error).toContain("al menos un mensaje tuyo");
    const soloAsistente = [{ role: "assistant", content: "qué tal" }];
    expect(sanearHilo(soloAsistente).error).toContain("al menos un mensaje tuyo");
  });

  it("el thinking solo se admite en asistente y con techo propio", () => {
    const largo = "r".repeat(MAX_THINKING + 500);
    const r = sanearHilo([
      { role: "user", content: "piensa", thinking: "esto no viaja" },
      { role: "assistant", content: "pensé", thinking: largo },
    ]);
    expect(r.turnos[0].thinking).toBeUndefined();
    expect(r.turnos[1].thinking).toHaveLength(MAX_THINKING);
  });

  it("el contenido se recorta al techo por turno", () => {
    const largo = "x".repeat(MAX_CONTENIDO + 100);
    const r = sanearHilo([
      { role: "user", content: largo },
      { role: "assistant", content: "ok" },
    ]);
    expect(r.turnos[0].content).toHaveLength(MAX_CONTENIDO);
  });

  it("las fuentes: máx. 12, sin URL se descartan y campos acotados", () => {
    const monton: unknown[] = Array.from({ length: MAX_SOURCES + 3 }, (_, i) => ({
      title: `Fuente ${i}`,
      url: `https://ejemplo.com/${i}`,
      host: "ejemplo.com",
    }));
    monton.push({ title: "sin url", url: "", host: "" });
    monton.push("no soy una fuente");
    const r = sanearHilo([
      { role: "user", content: "cita" },
      { role: "assistant", content: "citado", sources: monton },
    ]);
    expect(r.turnos[1].sources).toHaveLength(MAX_SOURCES);
    expect(r.turnos[1].sources?.[0]).toEqual({
      title: "Fuente 0",
      url: "https://ejemplo.com/0",
      host: "ejemplo.com",
    });
  });

  it("sources vacía o inválida no deja la clave", () => {
    const r = sanearHilo([
      { role: "user", content: "a" },
      { role: "assistant", content: "b", sources: [] },
    ]);
    expect(r.turnos[1].sources).toBeUndefined();
  });
});

/* ─────────────── serialización: ida y vuelta sin sorpresas ─────────────── */

describe("v1.25.0 — serializar/deserializar: tolerante al corrupto", () => {
  it("la ida y vuelta conserva el hilo exacto", () => {
    const r = sanearHilo(hiloValido);
    const json = serializarHilo(r.turnos);
    expect(deserializarHilo(json)).toEqual(r.turnos);
  });

  it("una fila corrupta degrada a hilo vacío, jamás explota", () => {
    expect(deserializarHilo("esto no es json")).toEqual([]);
    expect(deserializarHilo('{"no": "es array"}')).toEqual([]);
    expect(deserializarHilo(null)).toEqual([]);
    expect(deserializarHilo(undefined)).toEqual([]);
  });

  it("los turnos sin role o sin content se filtran al leer", () => {
    const json = JSON.stringify([
      { role: "user", content: "bien" },
      { role: "invasor", content: "fuera" },
      { role: "assistant" },
      { content: "sin rol" },
    ]);
    expect(deserializarHilo(json)).toEqual([{ role: "user", content: "bien" }]);
  });

  it("primerMensajeUsuario y contarIntercambios leen el hilo", () => {
    const r = sanearHilo(hiloValido);
    expect(primerMensajeUsuario(r.turnos)).toBe("Hazme un cliente torrent robusto");
    expect(contarIntercambios(r.turnos)).toBe(2);
  });
});

/* ─────────────────── API POST /api/conversacion ─────────────────── */

describe("v1.25.0 — API POST /api/conversacion", () => {
  it("rate-limit por IP, como el share del replay", () => {
    expect(rutaPOST).toContain('acumular(`compartir:${ip}`, GEN_LIMITE');
    expect(rutaPOST).toContain("Demasiados compartidos desde tu IP");
  });

  it("solo modelos conocidos y de texto: el generativo se rechaza", () => {
    expect(rutaPOST).toContain("Modelo desconocido.");
    expect(rutaPOST).toContain('["imagen", "video", "audio"].includes(c)');
    expect(rutaPOST).toContain("Modelo inválido para un link de conversación de texto.");
  });

  it("sanea AMBOS hilos y exige que el A sea publicable", () => {
    expect(rutaPOST).toContain("sanearHilo(body.turnosA)");
    expect(rutaPOST).toContain("sanearHilo(body.turnosB)");
    expect(rutaPOST).toContain("no es publicable");
    expect(rutaPOST).toContain("Falta el primer mensaje de la conversación.");
  });

  it("el id es público c_ y la url apunta a /c/", () => {
    expect(rutaPOST).toContain("c_${Date.now().toString(36)}");
    expect(rutaPOST).toContain("url: `/c/${id}`");
  });

  it("guarda con el modelo ConversacionGuardada y serializa los hilos", () => {
    expect(rutaPOST).toContain("db.conversacionGuardada.create");
    expect(rutaPOST).toContain("serializarHilo(ladoA.turnos)");
    expect(rutaPOST).toContain("serializarHilo(ladoB.turnos)");
  });
});

/* ─────────────────── API GET/PATCH /api/conversacion/[id] ─────────────────── */

describe("v1.25.0 — API GET/PATCH /api/conversacion/[id]", () => {
  it("solo ids c_; 404 honesto si no existe", () => {
    expect(rutaID).toContain('id.startsWith("c_")');
    expect(rutaID).toContain("Conversación no encontrada.");
  });

  it("sirve el hilo PARSEADO, no el JSON crudo", () => {
    expect(rutaID).toContain("deserializarHilo(fila.turnosA)");
    expect(rutaID).toContain("deserializarHilo(fila.turnosB)");
    expect(rutaID).toContain('tipo: "conversacion"');
  });

  it("PATCH con dos acciones y nada más: vista y compartir", () => {
    expect(rutaID).toContain('body.accion !== "vista" && body.accion !== "compartir"');
    expect(rutaID).toContain("views: { increment: 1 }");
    expect(rutaID).toContain("shares: { increment: 1 }");
  });

  it("el listado GET devuelve metadatos y nº de mensajes, sin hilos completos", () => {
    expect(rutaPOST).toContain("db.conversacionGuardada.findMany");
    expect(rutaPOST).toContain("mensajes: turnosA.length");
  });
});

/* ─────────────────── La página /c/[id] y su cliente ─────────────────── */

describe("v1.25.0 — la página /c/[id] (el link público)", () => {
  const pagina = leer("src/app/c/[id]/page.tsx");
  const cliente = leer("src/app/c/[id]/conversacion-client.tsx");

  it("export estático honesto: nada se prerrenderiza en GitHub Pages", () => {
    expect(pagina).toContain("export async function generateStaticParams()");
    expect(pagina).toContain("return [];"); 
  });

  it("el cliente lee /api/conversacion/[id] y cuenta la vista por sesión", () => {
    expect(cliente).toContain("/api/conversacion/${encodeURIComponent(id)}");
    expect(cliente).toContain("todologo.vista.c.");
    expect(cliente).toContain("sessionStorage");
    expect(cliente).toContain('accion: "vista"');
  });

  it("el hilo se pinta completo: turnos de usuario y respuestas con markdown", () => {
    expect(cliente).toContain("t.role === \"user\"");
    expect(cliente).toContain("<Markdown>");
    expect(cliente).toContain("whitespace-pre-wrap");
  });

  it("dos hilos lado a lado solo si hay duelo; corona y «Tú» presentes", () => {
    expect(cliente).toContain("data.modelBId && \"xl:grid-cols-2\"");
    expect(cliente).toContain("Ganador");
    expect(cliente).toContain("Tú");
  });

  it("el 404 de la demo estática enlaza a la instancia oficial", () => {
    expect(cliente).toContain("todo-logo-ai.vercel.app");
  });
});

/* ─────────────────── El botón en el arena ─────────────────── */

describe("v1.25.0 — el botón «Link de conversación» en el chat", () => {
  it("compartirConversacion existe, POSTea y copia la URL", () => {
    expect(clienteChat).toContain("async function compartirConversacion()");
    expect(clienteChat).toContain('fetch("/api/conversacion"');
    expect(clienteChat).toContain("Link de conversación copiado");
  });

  it("la limpieza del hilo deja fuera media, images y kind", () => {
    expect(clienteChat).toContain("limpiarHilo");
    expect(clienteChat).toContain("t.role === \"assistant\" && t.thinking");
    expect(clienteChat).toContain("t.sources && t.sources.length > 0");
    // el mapa solo produce role/content (+thinking/sources): nada más viaja
    expect(clienteChat).not.toContain("media: t.media");
    expect(clienteChat).not.toContain("images: t.images");
  });

  it("el botón convive con el replay (v1.18.0) y respeta la demo estática", () => {
    expect(clienteChat).toContain("onClick={compartirConversacion}");
    expect(clienteChat).toContain("onClick={compartirDuelo}");
    expect(clienteChat).toContain("!isStaticDemo()");
    expect(clienteChat).toContain("El link de conversación publica el hilo entero");
  });
});

/* ─────────────────── La tabla en la base de datos ─────────────────── */

describe("v1.25.0 — la tabla ConversacionGuardada", () => {
  it("el esquema Prisma la declara con hilos y contadores", () => {
    const esquema = leer("prisma/schema.prisma");
    expect(esquema).toContain("model ConversacionGuardada");
    expect(esquema).toContain("turnosA      String");
    expect(esquema).toContain("turnosB      String?");
    expect(esquema).toContain("@@index([shares])");
  });

  it("db-init la auto-crea en serverless con índices y contadores", () => {
    expect(dbInit).toContain('CREATE TABLE IF NOT EXISTS "ConversacionGuardada"');
    expect(dbInit).toContain('"turnosA"      TEXT NOT NULL');
    expect(dbInit).toContain('"turnosB"      TEXT,');
    expect(dbInit).toContain(
      'CREATE INDEX IF NOT EXISTS "ConversacionGuardada_createdAt_idx"'
    );
    expect(dbInit).toContain('addColumnSiFalta("ConversacionGuardada", "shares"');
    expect(dbInit).toContain('addColumnSiFalta("ConversacionGuardada", "views"');
  });
});
