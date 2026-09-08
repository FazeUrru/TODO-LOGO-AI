"use client";

import { useEffect, useState } from "react";
import { FlaskConical, X } from "lucide-react";
import { isStaticDemo } from "@/lib/static-mode";
import { handleDemoFetch } from "@/lib/demo-engine";

/**
 * Puente del modo demo (GitHub Pages):
 *
 * 1. Instala un interceptor de fetch que resuelve /api/* con el motor local
 *    (src/lib/demo-engine.ts) cuando la app corre en un export estático.
 *    En desarrollo y en el servidor preview no hace nada: las APIs reales
 *    del backend responden con IA de verdad.
 *
 * 2. Muestra una píldora discreta que avisa al visitante de que está
 *    viendo la demo estática sin servidor.
 */
export default function DemoBridge() {
  const [active, setActive] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isStaticDemo()) return;

    const original = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      let path = url;
      try {
        path = url.startsWith("http") ? new URL(url).pathname : url;
      } catch {
        /* ruta relativa tal cual */
      }
      if (path.startsWith("/api/")) {
        const demo = await handleDemoFetch(path, init);
        if (demo) return demo;
      }
      return original(input, init);
    };

    return () => {
      window.fetch = original;
    };
  }, []);

  /* Píldora informativa: se activa tras el montaje (evita desajuste de hidratación) */
  useEffect(() => {
    const t = setTimeout(() => setActive(isStaticDemo()), 0);
    return () => clearTimeout(t);
  }, []);

  if (!active || dismissed) return null;

  return (
    <div className="fixed bottom-3 left-3 z-50 flex max-w-[280px] items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-1.5 text-[11.5px] font-medium text-foreground/80 shadow-sm backdrop-blur">
      <FlaskConical className="h-3.5 w-3.5 shrink-0 text-foreground/60" aria-hidden />
      <span>
        Demo estática (GitHub Pages) — respuestas generadas en local, ELO guardado en tu navegador.
      </span>
      <button
        type="button"
        aria-label="Cerrar aviso de demo"
        onClick={() => setDismissed(true)}
        className="ml-0.5 shrink-0 rounded-full p-0.5 text-foreground/50 transition-colors hover:bg-secondary hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
