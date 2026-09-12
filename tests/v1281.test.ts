/**
 * Regresión v1.28.1 — «Adiós a los saltos de sección fantasma: la arena
 * ya no cambia de sitio sola».
 *
 * El bug: abrir un chat de «Recientes» escribía el pendiente en sessionStorage
 * Y disparaba el evento de restauración. Si la arena ya estaba montada, el
 * evento lo aplicaba pero el registro NUNCA se limpiaba (solo se consumía al
 * montar), así que el siguiente remonte — navegar fuera y volver, o avanzar/
 * retroceder del navegador — lo reaplicaba: la arena cambiaba de modo y
 * cargaba una conversación vieja SIN que el usuario tocara nada.
 *
 *  · consumePendingChat: fresco pasa una vez, caducado (>15 s) no, legacy no,
 *    roto no
 *  · clearPendingChat: borra sin consumir
 *  · requestLoadChat: sobre con sello de tiempo + evento disparado
 *  · invariantes estáticos: ChatExperience limpia el pendiente en el handler
 *    del evento y valida la lista blanca de modos
 *  · tríada de versiones 1.28.1 coherente en los tres sitios
 */

import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import {
  requestLoadChat,
  consumePendingChat,
  clearPendingChat,
  type SavedChat,
} from "../src/lib/history";
import { APP_VERSION, APP_BUILD_DATE } from "../src/lib/version";
import { VERSIONS } from "../src/lib/changelog-meta";

const leer = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

/* ───────── window simulado: sessionStorage en memoria + registro de eventos ──────── */

function instalarWindow() {
  const saco = new Map<string, string>();
  const eventos: string[] = [];
  (globalThis as unknown as { window: unknown }).window = {
    sessionStorage: {
      getItem: (k: string) => saco.get(k) ?? null,
      setItem: (k: string, v: string) => {
        saco.set(k, v);
      },
      removeItem: (k: string) => {
        saco.delete(k);
      },
    },
    dispatchEvent: (e: Event) => {
      eventos.push(e.type);
      return true;
    },
  };
  return {
    saco,
    eventos,
    CLAVE: "todologo.pending-chat",
    limpiar: () => {
      delete (globalThis as unknown as { window?: unknown }).window;
    },
  };
}

const CHAT: SavedChat = {
  id: "chat_fantasma",
  title: "Batalla que volvía sola",
  mode: "sbs",
  ts: Date.now(),
  category: "global",
  turnsA: [{ role: "user", content: "¿Quién eres?" }],
  turnsB: [],
};

/* ─────────────────── El pendiente: fresco sí, caducado y huérfano no ─────────────────── */

describe("v1.28.1 — el pendiente de restauración caduca y se limpia", () => {
  it("un pendiente fresco se aplica UNA vez y desaparece al consumirse", () => {
    const ctx = instalarWindow();
    try {
      requestLoadChat(CHAT);
      expect(ctx.eventos).toContain("todologo-load-chat");
      expect(consumePendingChat()?.id).toBe(CHAT.id);
      // Consumirlo dos veces NO lo devuelve: nada de restauraciones en bucle.
      expect(consumePendingChat()).toBeNull();
    } finally {
      ctx.limpiar();
    }
  });

  it("el pendiente huérfano CADUCA: pasado el tiempo ya no reaplica la sección", () => {
    const ctx = instalarWindow();
    try {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-09-12T08:00:00Z"));
      requestLoadChat(CHAT);
      // El usuario no vuelve a la arena en 15 s: navega, pasa el tiempo…
      vi.setSystemTime(new Date("2026-09-12T08:00:20Z"));
      expect(consumePendingChat()).toBeNull();
      // …y el registro se purga aunque nadie lo consumiera.
      expect(ctx.saco.has(ctx.CLAVE)).toBe(false);
    } finally {
      vi.useRealTimers();
      ctx.limpiar();
    }
  });

  it("dentro de la ventana de gracia el pendiente SIGUE vivo (flujo legítimo tras navegar)", () => {
    const ctx = instalarWindow();
    try {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-09-12T08:00:00Z"));
      requestLoadChat(CHAT);
      vi.setSystemTime(new Date("2026-09-12T08:00:05Z")); // navegó a /novedades y volvió
      expect(consumePendingChat()?.id).toBe(CHAT.id);
    } finally {
      vi.useRealTimers();
      ctx.limpiar();
    }
  });

  it("clearPendingChat borra el registro SIN consumirlo ni devolverlo", () => {
    const ctx = instalarWindow();
    try {
      requestLoadChat(CHAT);
      clearPendingChat();
      expect(ctx.saco.has(ctx.CLAVE)).toBe(false);
      expect(consumePendingChat()).toBeNull();
    } finally {
      ctx.limpiar();
    }
  });

  it("un pendiente del formato LEGACY (sin sobre) se descarta por obsoleto", () => {
    const ctx = instalarWindow();
    try {
      // Lo que dejaba escrito la versión anterior: el chat pelado, sin sello.
      ctx.saco.set(ctx.CLAVE, JSON.stringify(CHAT));
      expect(consumePendingChat()).toBeNull();
      expect(ctx.saco.has(ctx.CLAVE)).toBe(false); // purgado igualmente
    } finally {
      ctx.limpiar();
    }
  });

  it("un pendiente corrupto no explota y se purga en silencio", () => {
    const ctx = instalarWindow();
    try {
      ctx.saco.set(ctx.CLAVE, "{roto…");
      expect(() => consumePendingChat()).not.toThrow();
      expect(consumePendingChat()).toBeNull();
      expect(ctx.saco.has(ctx.CLAVE)).toBe(false);
    } finally {
      ctx.limpiar();
    }
  });

  it("requestLoadChat escribe el sobre con sello de tiempo (consumible por caducidad)", () => {
    const ctx = instalarWindow();
    try {
      requestLoadChat(CHAT);
      const bruto = ctx.saco.get(ctx.CLAVE);
      expect(bruto).toBeTruthy();
      const sobre = JSON.parse(bruto as string) as { chat: SavedChat; t: number };
      expect(sobre.chat.id).toBe(CHAT.id);
      expect(typeof sobre.t).toBe("number");
      expect(Math.abs(sobre.t - Date.now())).toBeLessThan(5_000);
    } finally {
      ctx.limpiar();
    }
  });
});

/* ─────────────────── Invariantes estáticos en los ficheros ─────────────────── */

describe("v1.28.1 — invariantes estáticos de la cura", () => {
  it("history.ts declara la caducidad y exporta clearPendingChat", () => {
    const lib = leer("src/lib/history.ts");
    expect(lib).toContain("PENDING_CADUCIDAD_MS = 15_000");
    expect(lib).toContain("export function clearPendingChat()");
    // El consumo siempre purga, incluso cuando descarta:
    expect(lib).toContain("removeItem(PENDING_KEY)");
  });

  it("ChatExperience limpia el pendiente dentro del handler del evento", () => {
    const chat = leer("src/components/arena/ChatExperience.tsx");
    // El handler del evento llama a clearPendingChat tras aplicar:
    expect(chat).toContain("clearPendingChat();");
    // …y la lista blanca de modos protege la restauración de datos corruptos:
    expect(chat).toContain('const MODOS_VALIDOS: ArenaMode[] = ["battle", "agent", "sbs", "direct", "torneo"]');
    expect(chat).toContain("MODOS_VALIDOS.includes(chat.mode)");
  });

  it("el panel de vigilancia ya no hardcodea la versión en el snapshot demo", () => {
    const panel = leer("src/components/empresas/PanelVigilancia.tsx");
    expect(panel).toContain("version: APP_VERSION");
    expect(panel).not.toContain('version: "1.28.0"');
  });
});

/* ─────────────────── Tríada de versiones — 1.28.1 ─────────────────── */

describe("tríada de versiones — 1.28.1 coherente en los tres sitios", () => {
  it("version.ts declara 1.28.1", () => {
    expect(APP_VERSION).toBe("1.32.0");
    expect(APP_BUILD_DATE).toBe("2026-09-12");
  });

  it("changelog-meta.ts conserva la entrada 1.28.1 con su diff encadenado", () => {
    const nueva = VERSIONS.find((v) => v.version === "1.28.1");
    expect(nueva).toBeTruthy();
    expect(nueva?.diffDesde).toBe("1.28.0");
    expect(nueva?.hora).toBeTruthy();
    expect(nueva?.kinds).toContain("correccion");
    const versiones = VERSIONS.map((v) => v.version);
    expect(new Set(versiones).size).toBe(versiones.length); // sin duplicados
  });

  it("CHANGELOG.md contiene la entrada con su compare, por encima de la 1.28.0", () => {
    const md = leer("CHANGELOG.md");
    expect(md).toContain("compare/v1.28.0...v1.28.1");
    expect(md).toContain("saltos de sección fantasma");
    expect(md.indexOf("## [1.28.1]")).toBeLessThan(md.indexOf("## [1.28.0]"));
  });
});
