"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Code2, Copy, ExternalLink, Gamepad2, Maximize2, Minimize2, RefreshCw, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * v1.17.0 — GamePanel: marco jugable para los juegos que las IA construyen
 * en tiempo real dentro del chat. Sustituye a la mini-vista previa de 340 px:
 * el juego corre grande (520 px), con pantalla completa, recarga, apertura en
 * pestaña nueva y código a la vista. Mientras la IA escribe el HTML muestra
 * el progreso de construcción en vivo (KB de código ya escritos).
 */

const SANDBOX = "allow-scripts allow-popups allow-pointer-lock";
/** Estimación honesta de tamaño para la barra de progreso (no es un límite). */
const KB_ESTIMADO = 26;

export default function GamePanel({
  code,
  completo,
  streaming,
}: {
  code: string;
  /** true si el bloque ```html está cerrado (la generación no se cortó). */
  completo: boolean;
  streaming?: boolean;
}) {
  const [reloadKey, setReloadKey] = useState(0);
  const [verCodigo, setVerCodigo] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [enFull, setEnFull] = useState(false);
  const marcoRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  // El juego se construye mientras llega el código: durante el streaming se
  // muestra el progreso (no un iframe a medias), y al terminar se ejecuta.
  const construyendo = Boolean(streaming);
  const kb = Math.round((code.length / 1024) * 10) / 10;
  const pct = Math.min(96, Math.round((code.length / (KB_ESTIMADO * 1024)) * 100));

  // Pantalla completa del marco (el iframe sigue corriendo dentro).
  useEffect(() => {
    const onChange = () => setEnFull(document.fullscreenElement === marcoRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Auto-scroll del código en construcción: se ve cómo crece el juego.
  useEffect(() => {
    if (construyendo && preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [code, construyendo]);

  const pantallaCompleta = () => {
    const el = marcoRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen().catch(() => {});
    }
  };

  const abrirPestana = () => {
    try {
      const url = URL.createObjectURL(new Blob([code], { type: "text/html" }));
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      /* sin permiso de popups: silencio */
    }
  };

  return (
    <figure
      ref={marcoRef}
      className={cn(
        "mt-2 overflow-hidden rounded-xl border border-border bg-[#0B0B10]",
        enFull && "flex flex-col rounded-none border-0"
      )}
    >
      {/* Cabecera del juego */}
      <figcaption className="flex items-center gap-2 border-b border-white/10 bg-white/[0.05] px-3 py-2">
        <Gamepad2 className="h-4 w-4 shrink-0 text-highlight" />
        <span className="truncate text-[12.5px] font-semibold text-white">
          Juego en tiempo real
        </span>
        {!construyendo && completo && (
          <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-emerald-400">
            jugable
          </span>
        )}
        <span className="ml-auto flex shrink-0 items-center gap-0.5">
          {construyendo ? (
            <span className="rounded-full bg-highlight/15 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-highlight">
              construyendo… {kb} KB
            </span>
          ) : (
            <>
              <button
                onClick={() => setVerCodigo((v) => !v)}
                title={verCodigo ? "Volver al juego" : "Ver el código fuente"}
                className={cn(
                  "flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-zinc-300 hover:bg-white/10 hover:text-white",
                  verCodigo && "bg-white/15 text-white"
                )}
              >
                <Code2 className="h-3 w-3" />
                <span className="hidden sm:inline">{verCodigo ? "Juego" : "Código"}</span>
              </button>
              <button
                onClick={() => setReloadKey((k) => k + 1)}
                title="Reiniciar el juego"
                className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-zinc-300 hover:bg-white/10 hover:text-white"
              >
                <RefreshCw className="h-3 w-3" />
                <span className="hidden sm:inline">Reiniciar</span>
              </button>
              <button
                onClick={abrirPestana}
                title="Abrir en pestaña nueva"
                className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-zinc-300 hover:bg-white/10 hover:text-white"
              >
                <ExternalLink className="h-3 w-3" />
                <span className="hidden sm:inline">Pestaña</span>
              </button>
              <button
                onClick={pantallaCompleta}
                title="Pantalla completa"
                className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-zinc-300 hover:bg-white/10 hover:text-white"
              >
                {enFull ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                <span className="hidden sm:inline">{enFull ? "Salir" : "Pantalla"}</span>
              </button>
            </>
          )}
        </span>
      </figcaption>

      {/* Barra de progreso de construcción en vivo */}
      {construyendo && (
        <div className="h-1 w-full bg-white/10">
          <div
            className="h-full bg-highlight transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {!construyendo && !completo && (
        <div className="flex items-start gap-2 border-b border-amber-500/20 bg-amber-500/10 px-3 py-2">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
          <p className="text-[12px] leading-snug text-amber-200/90">
            El juego llegó a medias por el límite de tiempo de generación. Pide al modelo
            «continúa el juego desde donde lo dejaste» o reenvía con el Modo Juego.
          </p>
        </div>
      )}

      {/* Cuerpo: código en construcción · código fuente · juego ejecutándose */}
      {construyendo || verCodigo ? (
        <pre
          ref={preRef}
          className={cn(
            "scrollbar-thin m-0 overflow-auto whitespace-pre bg-[#0B0B10] p-3 font-mono text-[11px] leading-relaxed text-zinc-300",
            enFull ? "min-h-0 flex-1" : "max-h-[340px]"
          )}
        >
          {code || "Preparando el motor del juego…"}
        </pre>
      ) : (
        <iframe
          key={reloadKey}
          title="Juego creado por la IA"
          sandbox={SANDBOX}
          srcDoc={code}
          allow="fullscreen; gamepad; autoplay"
          className={cn("block w-full border-0 bg-black", enFull ? "min-h-0 flex-1" : "h-[520px]")}
        />
      )}

      {/* Pie honesto */}
      {!construyendo && !verCodigo && !enFull && (
        <div className="flex items-center justify-between gap-2 bg-white/[0.04] px-3 py-1.5">
          <span className="min-w-0 truncate text-[11px] text-zinc-400">
            Creado por la IA en el chat · corre en sandbox local, sin descargas
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(code);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 1400);
            }}
            className="flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-zinc-300 hover:bg-white/10 hover:text-white"
            title="Copiar el código HTML del juego"
          >
            {copiado ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            {copiado ? "¡Copiado!" : "Copiar HTML"}
          </button>
        </div>
      )}
    </figure>
  );
}
