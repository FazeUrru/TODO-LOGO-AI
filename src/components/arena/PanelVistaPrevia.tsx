"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Columns2,
  Copy,
  ExternalLink,
  Eye,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { direccionVista, planificarRefresco, type VistaPrevia } from "@/lib/vista-previa";

/**
 * v1.27.0 — PanelVistaPrevia: la vista previa AUTOMÁTICA del Modo Batalla,
 * la fusión de dos mundos:
 *
 *  · Z.AI — el artefacto se renderiza EN VIVO mientras el modelo escribe:
 *    el iframe repinta el HTML en construcción (como mucho cada 700 ms,
 *    mismo espíritu anti-O(n²) que el render incremental del chat).
 *  · Arena AI — marco de navegador con barra de direcciones, recarga,
 *    apertura en pestaña y pantalla completa.
 *
 * Y la guinda del duelo: pestañas «Modelo A» / «Modelo B» / «Duelo» —
 * la vista Duelo pone las DOS apps corriendo a la vez, lado a lado,
 * para compararlas mientras se construyen. El panel nace solo cuando
 * un lado suelta HTML (la auto-apertura vive en ChatExperience) y el
 * usuario manda: si lo cierra, no vuelve a asomar hasta el próximo envío.
 */

const SANDBOX = "allow-scripts allow-popups allow-pointer-lock";
/** Ritmo máximo de repintado del srcDoc durante el streaming (ms). */
const INTERVALO_VIVO_MS = 700;

type Pestana = "A" | "B" | "duelo";

/** El srcDoc que respira con el streaming, SIN estados de React: el iframe
 * es un sistema externo y se goberna por ref (setAttribute). Repinta como
 * mucho cada INTERVALO_VIVO_MS, y al terminar aplica el código final exacto
 * (desarmado de timers huérfanos incluido). Cero re-renders en cascada. */
function gobernarSrcDoc(
  iframe: HTMLIFrameElement | null,
  codigo: string | null,
  enVivo: boolean,
  ultimo: { len: number; ms: number; timer: ReturnType<typeof setTimeout> | null }
) {
  const aplicar = (code: string) => {
    if (iframe) iframe.setAttribute("srcdoc", code);
    ultimo.len = code.length;
    ultimo.ms = Date.now();
  };
  if (codigo === null) {
    if (ultimo.timer) clearTimeout(ultimo.timer);
    ultimo.timer = null;
    ultimo.len = 0;
    ultimo.ms = 0;
    return;
  }
  if (!enVivo) {
    if (ultimo.timer) clearTimeout(ultimo.timer);
    ultimo.timer = null;
    aplicar(codigo);
    return;
  }
  const plan = planificarRefresco(ultimo.len, codigo.length, ultimo.ms, Date.now(), INTERVALO_VIVO_MS);
  if (plan.aplicar) {
    aplicar(codigo);
  } else if (plan.esperarMs !== null && ultimo.timer === null) {
    // Un solo refresco aplazado en cola: si llega más código antes,
    // el siguiente cambio de `codigo` re-planifica con lo más fresco.
    ultimo.timer = setTimeout(() => {
      ultimo.timer = null;
      aplicar(codigo);
    }, plan.esperarMs);
  }
}

/** Marco de UN lado: iframe en vivo con su estado honesto (naciendo / a medias). */
function MarcoLado({
  vista,
  streaming,
  titulo,
  reloadKey,
}: {
  vista: VistaPrevia | null;
  streaming: boolean;
  titulo: string;
  /** Al cambiar, el iframe se remonta: recarga limpia del artefacto. */
  reloadKey: number;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const ultimo = useRef({ len: 0, ms: 0, timer: null as ReturnType<typeof setTimeout> | null });

  // El iframe es un sistema externo: se gobierna por ref, sin estados.
  useEffect(() => {
    gobernarSrcDoc(iframeRef.current, vista?.code ?? null, Boolean(streaming), ultimo.current);
  }, [vista?.code, streaming, reloadKey]);

  if (!vista) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#0B0B10] px-6 text-center">
        {streaming ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-highlight" />
            <p className="text-[12.5px] text-zinc-400">
              {titulo} está escribiendo… la vista nacerá en cuanto suelte HTML.
            </p>
          </>
        ) : (
          <>
            <Eye className="h-5 w-5 text-zinc-600" />
            <p className="text-[12.5px] text-zinc-500">
              {titulo} no ha soltado HTML en esta respuesta.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black">
      {!vista.completo && !streaming && (
        <div className="absolute inset-x-0 top-0 z-10 flex items-start gap-1.5 border-b border-amber-500/20 bg-amber-500/10 px-2.5 py-1.5">
          <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
          <p className="text-[11px] leading-snug text-amber-200/90">
            El HTML llegó a medias (stream cortado): se muestra lo recibido.
          </p>
        </div>
      )}
      <iframe
        key={reloadKey}
        ref={iframeRef}
        title={`Vista previa en vivo de ${titulo}`}
        sandbox={SANDBOX}
        srcDoc={vista.code}
        allow="fullscreen; gamepad; autoplay"
        className="block h-full w-full border-0 bg-black"
      />
    </div>
  );
}

export default function PanelVistaPrevia({
  vistaA,
  vistaB,
  streamingA,
  streamingB,
  revelado,
  nombreA,
  nombreB,
  pestanaInicial = "A",
  onCerrar,
}: {
  vistaA: VistaPrevia | null;
  vistaB: VistaPrevia | null;
  streamingA: boolean;
  streamingB: boolean;
  /** Tras el voto: las pestañas muestran los nombres reales. */
  revelado: boolean;
  nombreA: string;
  nombreB: string;
  /** Lado por el que arranca la pestaña (lo decide la auto-apertura). */
  pestanaInicial?: "A" | "B";
  onCerrar: () => void;
}) {
  const [pestana, setPestana] = useState<Pestana>(pestanaInicial);
  const [reloadKey, setReloadKey] = useState(0);
  const [copiado, setCopiado] = useState(false);
  const [enFull, setEnFull] = useState(false);
  const marcoRef = useRef<HTMLDivElement>(null);

  // La pestaña inicial manda en cada apertura (la auto-apertura elige
  // el lado que soltó HTML primero); dentro, el panel solo salta de
  // pestaña si la actual está vacía y la otra está viva — nunca arranca
  // al usuario de un lado que ya está mirando.
  useEffect(() => {
    setPestana(pestanaInicial);
  }, [pestanaInicial]);
  useEffect(() => {
    if (pestana === "duelo") return;
    const activaTiene = pestana === "A" ? Boolean(vistaA) : Boolean(vistaB);
    if (activaTiene) return;
    if (pestana === "A" && vistaB && streamingB) setPestana("B");
    else if (pestana === "B" && vistaA && streamingA) setPestana("A");
  }, [pestana, vistaA, vistaB, streamingA, streamingB]);

  // Pantalla completa del marco (los iframes siguen corriendo dentro).
  useEffect(() => {
    const onChange = () => setEnFull(document.fullscreenElement === marcoRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const nombreDe = (lado: "A" | "B") => {
    const crudo = lado === "A" ? nombreA : nombreB;
    return revelado ? crudo : lado === "A" ? "Modelo A" : "Modelo B";
  };
  const vistaDe = (lado: "A" | "B") => (lado === "A" ? vistaA : vistaB);
  const streamingDe = (lado: "A" | "B") => (lado === "A" ? streamingA : streamingB);

  const ladoActivo: "A" | "B" | null = pestana === "duelo" ? null : pestana;
  const vistaActiva = ladoActivo ? vistaDe(ladoActivo) : null;
  const streamingActiva = ladoActivo ? streamingDe(ladoActivo) : false;
  const tituloActivo = vistaActiva
    ? vistaActiva.titulo
    : ladoActivo
      ? nombreDe(ladoActivo)
      : "duelo lado a lado";

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
    const code = pestana === "duelo" ? vistaA?.code ?? vistaB?.code : vistaActiva?.code;
    if (!code) return;
    try {
      const url = URL.createObjectURL(new Blob([code], { type: "text/html" }));
      window.open(url, "_blank", "noopener");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      /* sin permiso de popups: silencio */
    }
  };

  const copiarActivo = () => {
    const code = pestana === "duelo" ? vistaA?.code ?? vistaB?.code : vistaActiva?.code;
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1400);
  };

  const enVivoChip = (lado: "A" | "B") =>
    streamingDe(lado) && Boolean(vistaDe(lado)) ? (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        en vivo
      </span>
    ) : null;

  return (
    <figure
      ref={marcoRef}
      className={cn(
        "flex h-[58vh] max-h-[540px] min-h-[300px] w-full flex-col overflow-hidden rounded-xl border border-border bg-[#0B0B10] shadow-2xl xl:h-[calc(100vh-7rem)] xl:max-h-none",
        enFull && "rounded-none border-0"
      )}
    >
      {/* Cabecera de navegador: puntos, barra de dirección y acciones */}
      <figcaption className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-white/[0.05] px-3 py-2">
        <span className="flex shrink-0 items-center gap-1" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md bg-black/40 px-2 py-1 font-mono text-[10.5px] text-zinc-400">
          <ShieldCheck className="h-3 w-3 shrink-0 text-emerald-400" />
          <span className="truncate">{direccionVista(pestana, tituloActivo)}</span>
        </span>
        {pestana === "duelo" ? (
          streamingA && Boolean(vistaA) ? enVivoChip("A") : streamingB && Boolean(vistaB) ? enVivoChip("B") : null
        ) : (
          enVivoChip(pestana)
        )}
        <span className="ml-auto flex shrink-0 items-center gap-0.5">
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            title="Recargar la vista"
            className="flex items-center rounded-md px-1.5 py-1 text-[11px] text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
          <button
            onClick={abrirPestana}
            title="Abrir en pestaña nueva"
            className="flex items-center rounded-md px-1.5 py-1 text-[11px] text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="h-3 w-3" />
          </button>
          <button
            onClick={pantallaCompleta}
            title="Pantalla completa"
            className="flex items-center rounded-md px-1.5 py-1 text-[11px] text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            {enFull ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </button>
          <button
            onClick={onCerrar}
            title="Cerrar la vista previa (vuelve con el botón «Vista previa»)"
            className="flex items-center rounded-md px-1.5 py-1 text-[11px] text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      </figcaption>

      {/* Pestañas: cada modelo y el duelo fusionado */}
      <nav className="flex shrink-0 items-center gap-1 border-b border-white/10 bg-white/[0.03] px-2 py-1.5" aria-label="Vistas de la batalla">
        {(["A", "B", "duelo"] as const).map((p) => {
          const activa = pestana === p;
          const tiene = p === "duelo" ? Boolean(vistaA || vistaB) : Boolean(vistaDe(p));
          return (
            <button
              key={p}
              onClick={() => setPestana(p)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 text-[11.5px] font-medium transition-colors",
                activa ? "bg-white/15 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
              )}
              aria-pressed={activa}
            >
              {p === "duelo" ? (
                <Columns2 className="h-3 w-3" />
              ) : (
                <span className={cn("h-1.5 w-1.5 rounded-full", p === "A" ? "bg-zinc-300" : "bg-zinc-500")} />
              )}
              {p === "duelo" ? "Duelo" : nombreDe(p)}
              {streamingDe(p as "A" | "B") && tiene && p !== "duelo" && (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" title="escribiendo…" />
              )}
            </button>
          );
        })}
        <span className="ml-auto hidden truncate rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 sm:block">
          {vistaActiva ? `${Math.round(vistaActiva.code.length / 102.4) / 10} KB` : "—"}
        </span>
      </nav>

      {/* Cuerpo: un lado o el duelo a doble columna */}
      <div className={cn("min-h-0 flex-1", enFull && "flex flex-col")}>
        {pestana === "duelo" ? (
          <div className="grid h-full grid-cols-1 gap-1.5 p-1.5 sm:grid-cols-2">
            {(["A", "B"] as const).map((lado) => (
              <div
                key={lado}
                className={cn(
                  "relative min-h-0 overflow-hidden rounded-lg border",
                  lado === "A" ? "border-emerald-500/30" : "border-violet-500/30"
                )}
              >
                <span
                  className={cn(
                    "absolute left-2 top-2 z-10 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur",
                    lado === "A" ? "text-emerald-300" : "text-violet-300"
                  )}
                >
                  {nombreDe(lado)}
                </span>
                <MarcoLado
                  vista={vistaDe(lado)}
                  streaming={streamingDe(lado)}
                  titulo={nombreDe(lado)}
                  reloadKey={reloadKey}
                />
              </div>
            ))}
          </div>
        ) : (
          <MarcoLado
            vista={vistaActiva}
            streaming={streamingActiva}
            titulo={nombreDe(ladoActivo ?? "A")}
            reloadKey={reloadKey}
          />
        )}
      </div>

      {/* Pie honesto */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-white/10 bg-white/[0.04] px-3 py-1.5">
        <span className="min-w-0 truncate text-[11px] text-zinc-400">
          Vista previa en vivo · sandbox local sin red del sitio · su uso es tu responsabilidad
        </span>
        <button
          onClick={copiarActivo}
          className="flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-zinc-300 hover:bg-white/10 hover:text-white"
          title="Copiar el HTML de la vista activa"
        >
          {copiado ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          {copiado ? "¡Copiado!" : "Copiar"}
        </button>
      </div>
    </figure>
  );
}
