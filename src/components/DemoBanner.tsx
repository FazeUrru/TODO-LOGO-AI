"use client";

import { useState, useSyncExternalStore } from "react";
import { Container, ExternalLink, ShieldCheck, TriangleAlert, X } from "lucide-react";
import { isStaticDemo } from "@/lib/static-mode";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "todologo.bannerDemoOculto";
const REPO = "https://github.com/FazeUrru/TODO-LOGO-AI";

/* La condición de demo es constante por sesión; el único cambio posible es el descarte,
   que se señaliza con el evento "demo-banner-cerrado" para re-leer el snapshot sin setState. */
const subscribeBanner = (onChange: () => void) => {
  window.addEventListener("demo-banner-cerrado", onChange);
  return () => window.removeEventListener("demo-banner-cerrado", onChange);
};
const esDemo = () => {
  if (isStaticDemo()) return true;
  try {
    return new URLSearchParams(window.location.search).get("demo") === "1";
  } catch {
    return false;
  }
};
const esDemoServer = () => false;

function leerOculto(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}
function getSnapshot(): boolean {
  return esDemo() && !leerOculto();
}
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Delimitación visual clara entre la demo estática (GitHub Pages) y una
 * instancia de producción real. Solo aparece cuando la app corre en modo
 * demo (export estático o ?demo=1) y puede cerrarse durante la sesión.
 */
export default function DemoBanner() {
  const visible = useSyncExternalStore(subscribeBanner, getSnapshot, getServerSnapshot);
  const [copiado, setCopiado] = useState(false);

  if (!visible) return null;

  const cerrar = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* si no se puede recordar, simplemente se cierra */
    }
    // Fuerza re-lectura del snapshot tras guardar el descarte
    window.dispatchEvent(new Event("demo-banner-cerrado"));
  };

  const copiarComando = async () => {
    try {
      await navigator.clipboard.writeText("docker compose up --build");
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
    } catch {
      /* portapapeles bloqueado */
    }
  };

  return (
    <div
      role="status"
      className="border-b border-amber-300/70 bg-amber-50/95 text-amber-950 backdrop-blur dark:border-amber-500/25 dark:bg-amber-950/60 dark:text-amber-100"
    >
      <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-start gap-x-3 gap-y-2 px-4 py-2.5 sm:items-center">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 sm:mt-0 dark:text-amber-400" aria-hidden />
        <p className="min-w-0 flex-1 text-[13px] leading-relaxed">
          <strong className="font-semibold">Estás en la demo estática</strong> — las respuestas, los
          votos y el ELO se generan en tu navegador: sin IA real, sin base de datos y sin torneos
          globales. Para la experiencia completa despliega tu propia instancia con{" "}
          <button
            onClick={copiarComando}
            title="Copiar comando"
            className={cn(
              "mx-0.5 inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-100 px-1.5 py-0.5 font-mono text-[12px] font-medium transition-colors hover:bg-amber-200",
              "dark:border-amber-500/40 dark:bg-amber-900/60 dark:hover:bg-amber-900"
            )}
          >
            <Container className="h-3 w-3" aria-hidden />
            docker compose up --build
          </button>
          {copiado && <span className="ml-1 text-[12px] font-medium">¡copiado!</span>}
        </p>
        <div className="flex items-center gap-2 text-[12.5px] font-medium">
          <a
            href={`${REPO}#-docker`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-card/60 px-2.5 py-1 transition-colors hover:bg-accent dark:border-amber-500/40"
          >
            Despliegue en 1 clic
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
          <a
            href={`${REPO}#-honestidad-qu%C3%A9-es-real-y-qu%C3%A9-no`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-card/60 px-2.5 py-1 transition-colors hover:bg-accent dark:border-amber-500/40"
          >
            <ShieldCheck className="h-3 w-3" aria-hidden />
            Qué es real y qué no
          </a>
          <button
            onClick={cerrar}
            aria-label="Cerrar aviso de demo"
            className="rounded-full p-1 text-amber-700 transition-colors hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/60"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
