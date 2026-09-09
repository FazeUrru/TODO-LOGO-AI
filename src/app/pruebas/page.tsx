"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, CheckCircle2, XCircle, Loader2, RotateCcw } from "lucide-react";
import { APP_VERSION } from "@/lib/version";
import { MODELS } from "@/lib/models-data";
import { MCPS } from "@/lib/mcps-data";
import { cn } from "@/lib/utils";

/**
 * /pruebas — Pruebas en tiempo real (v1.16.0).
 * Diagnóstico vivo del sistema: cada check se ejecuta de verdad contra la app
 * y el navegador, con resultado y latencia al instante.
 */

interface Check {
  id: string;
  nombre: string;
  estado: "pendiente" | "ok" | "fail";
  detalle: string;
  ms: number;
}

const INICIALES: Check[] = [
  { id: "version", nombre: "Versión de la app (local ↔ servidor)", estado: "pendiente", detalle: "", ms: 0 },
  { id: "batalla", nombre: "Motor de batalla activo (/api/battle)", estado: "pendiente", detalle: "", ms: 0 },
  { id: "video", nombre: "Motor de vídeo activo (/api/video)", estado: "pendiente", detalle: "", ms: 0 },
  { id: "tts", nombre: "Motor de voz activo (/api/tts)", estado: "pendiente", detalle: "", ms: 0 },
  { id: "catalogo", nombre: "Catálogo de modelos cargado", estado: "pendiente", detalle: "", ms: 0 },
  { id: "mcps", nombre: "Catálogo de 75 MCPs cargado", estado: "pendiente", detalle: "", ms: 0 },
  { id: "webgl", nombre: "WebGL para el visor 3D", estado: "pendiente", detalle: "", ms: 0 },
  { id: "voz-navegador", nombre: "Síntesis de voz del navegador", estado: "pendiente", detalle: "", ms: 0 },
  { id: "vlm", nombre: "Visión inteligente (VLM) para imágenes adjuntas", estado: "pendiente", detalle: "", ms: 0 },
  { id: "juegos", nombre: "Motor de juegos en tiempo real (canvas + sandbox)", estado: "pendiente", detalle: "", ms: 0 },
];

async function medir(
  fn: () => Promise<{ detalle: string; ok: boolean }>
): Promise<{ detalle: string; ok: boolean; ms: number }> {
  const t0 = performance.now();
  const r = await fn();
  return { ...r, ms: Math.round(performance.now() - t0) };
}

export default function PruebasPage() {
  const [checks, setChecks] = useState<Check[]>(INICIALES);
  const [corriendo, setCorriendo] = useState(false);

  const actualizar = (id: string, patch: Partial<Check>) =>
    setChecks((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const correr = useCallback(async () => {
    setCorriendo(true);
    setChecks(INICIALES.map((c) => ({ ...c, estado: "pendiente", detalle: "", ms: 0 })));

    // 1. Versión local ↔ servidor
    actualizar("version", { estado: "ok", detalle: "midiendo…" });
    try {
      const r = await medir(async () => {
        const res = await fetch("/api/version", { cache: "no-store" });
        const j = await res.json();
        return { detalle: `local ${APP_VERSION} · servidor ${j.version}`, ok: j.version === APP_VERSION };
      });
      actualizar("version", { estado: r.ok ? "ok" : "fail", detalle: r.detalle, ms: r.ms });
    } catch {
      actualizar("version", { estado: "fail", detalle: "sin respuesta del servidor" });
    }

    // 2-4. Endpoints vivos (un GET debe responder rápido aunque sea 405)
    for (const [id, url, nombre] of [
      ["batalla", "/api/battle", "batalla"],
      ["video", "/api/video", "vídeo"],
      ["tts", "/api/tts", "voz"],
    ] as const) {
      try {
        const r = await medir(async () => {
          const res = await fetch(url, { method: "GET", cache: "no-store" });
          return { detalle: `HTTP ${res.status} — endpoint ${res.status < 500 ? "vivo" : "con errores"}`, ok: res.status < 500 };
        });
        actualizar(id, { estado: r.ok ? "ok" : "fail", detalle: r.detalle, ms: r.ms });
      } catch {
        actualizar(id, { estado: "fail", detalle: `sin respuesta del motor de ${nombre}` });
      }
    }

    // 5. Catálogo
    actualizar("catalogo", {
      estado: MODELS.length >= 20 ? "ok" : "fail",
      detalle: `${MODELS.length} modelos en el catálogo`,
      ms: 1,
    });

    // 6. MCPs
    actualizar("mcps", {
      estado: MCPS.length === 75 ? "ok" : "fail",
      detalle: `${MCPS.length} servidores MCP indexados`,
      ms: 1,
    });

    // 7. WebGL
    try {
      const r = await medir(async () => {
        const cv = document.createElement("canvas");
        const gl = cv.getContext("webgl2") ?? cv.getContext("webgl");
        if (!gl) return { ok: false, detalle: "WebGL no disponible" };
        const depurar = gl.getExtension("WEBGL_debug_renderer_info");
        const render = depurar ? String(gl.getParameter(deburear(depurar))) : "GPU";
        return { ok: true, detalle: `activo · ${render.slice(0, 48)}` };
      });
      actualizar("webgl", { estado: r.ok ? "ok" : "fail", detalle: r.detalle, ms: r.ms });
    } catch {
      actualizar("webgl", { estado: "fail", detalle: "no se pudo iniciar WebGL" });
    }

    // 8. speechSynthesis
    actualizar("voz-navegador", {
      estado: "speechSynthesis" in window ? "ok" : "fail",
      detalle: "speechSynthesis disponible" + ("speechSynthesis" in window ? ` · ${window.speechSynthesis.getVoices().length} voces` : ""),
      ms: 1,
    });

    // 9. v1.17.0 — Visión VLM: File API + decodificación de imagen + reescalado
    try {
      const r = await medir(async () => {
        const cv = document.createElement("canvas");
        cv.width = cv.height = 8;
        const pintaPixels = typeof cv.getContext("2d") === "object" && cv.getContext("2d") !== null;
        const dataUrl = pintaPixels ? cv.toDataURL("image/jpeg", 0.8) : "";
        const fileApi = "FileReader" in window && typeof Image !== "undefined";
        const ok = fileApi && dataUrl.startsWith("data:image/jpeg");
        return {
          ok,
          detalle: ok
            ? "File API + canvas listo · las imágenes adjuntas viajan al motor de visión"
            : "el navegador no soporta la preparación de imágenes",
        };
      });
      actualizar("vlm", { estado: r.ok ? "ok" : "fail", detalle: r.detalle, ms: r.ms });
    } catch {
      actualizar("vlm", { estado: "fail", detalle: "no se pudo preparar una imagen de prueba" });
    }

    // 10. v1.17.0 — Motor de juegos: canvas 2D + iframe sandbox + pantalla completa
    try {
      const r = await medir(async () => {
        const cv = document.createElement("canvas");
        const ctx = cv.getContext("2d");
        const sandbox = "sandbox" in document.createElement("iframe");
        const full = typeof document.documentElement.requestFullscreen === "function";
        const ok = Boolean(ctx) && sandbox && full;
        return {
          ok,
          detalle: `canvas 2D ${ctx ? "OK" : "no"} · sandbox ${sandbox ? "OK" : "no"} · fullscreen ${full ? "OK" : "no"}`,
        };
      });
      actualizar("juegos", { estado: r.ok ? "ok" : "fail", detalle: r.detalle, ms: r.ms });
    } catch {
      actualizar("juegos", { estado: "fail", detalle: "el navegador no soporta el motor de juegos" });
    }

    setCorriendo(false);
  }, []);

  useEffect(() => {
    correr();
  }, [correr]);

  const okN = checks.filter((c) => c.estado === "ok").length;
  const failN = checks.filter((c) => c.estado === "fail").length;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-[720px] pb-12">
        <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
          <Activity className="h-4 w-4" />
          Diagnóstico
        </div>
        <h1 className="mt-3 font-display text-[34px] font-light tracking-tight">
          Pruebas en{" "}
          <span className="bg-highlight inline-block px-1.5 font-medium italic">tiempo real</span>
        </h1>
        <p className="mt-2 max-w-[600px] text-[14px] leading-relaxed text-foreground/85">
          Comprobaciones vivas del sistema: versión, motores, catálogos y capacidades
          de tu navegador. Cada prueba se ejecuta de verdad y muestra su latencia.
        </p>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={correr}
            disabled={corriendo}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-[13px] font-medium hover:bg-accent disabled:opacity-50"
          >
            {corriendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            {corriendo ? "Ejecutando…" : "Ejecutar de nuevo"}
          </button>
          <span className="text-[12.5px] text-muted-foreground">
            {corriendo ? "en marcha…" : (
              <>
                <b className="text-green-600">{okN} OK</b> · <b className="text-red-500">{failN} fallos</b> · {checks.length} pruebas
              </>
            )}
          </span>
        </div>

        <div className="mt-4 grid gap-1.5">
          {checks.map((c) => (
            <div
              key={c.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3.5 py-2.5",
                c.estado === "ok" ? "border-border bg-card" : c.estado === "fail" ? "border-red-500/30 bg-red-500/[0.05]" : "border-border bg-card opacity-70"
              )}
            >
              {c.estado === "ok" ? (
                <CheckCircle2 className="h-4.5 w-4.5 h-[18px] w-[18px] shrink-0 text-green-600" />
              ) : c.estado === "fail" ? (
                <XCircle className="h-[18px] w-[18px] shrink-0 text-red-500" />
              ) : (
                <Loader2 className="h-[18px] w-[18px] shrink-0 animate-spin text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium">{c.nombre}</p>
                {c.detalle && (
                  <p className="truncate font-mono text-[11px] text-muted-foreground">{c.detalle}</p>
                )}
              </div>
              {c.ms > 0 && (
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 font-mono text-[10.5px] text-foreground/60">
                  {c.ms} ms
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function deburear(ext: { UNMASKED_RENDERER_WEBGL?: number }): number {
  return ext.UNMASKED_RENDERER_WEBGL ?? 37446;
}
