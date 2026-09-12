"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Wrench, X } from "lucide-react";
import { traducirCine, type IdiomaCine } from "@/lib/streamdog/cine-i18n";

/**
 * BANNER DE REPARACIÓN REAL (v1.32.0) — la idea del modal de «Sistema de
 * Autoreparación», pero SIN fingir: aquí solo se muestra cuando ha
 * ocurrido una reparación de verdad, con el registro de lo reparado:
 *
 *   · El STORAGE del módulo se encontró corrupto y cine.ts lo reconstruyó
 *     (JSON roto, forma inesperada, idioma inválido…).
 *   · El SERVICE WORKER verificó su shell (mensaje COMPROBAR_SALUD) y
 *     tuvo que re-añadir entradas que faltaban o purgar cachés viejas.
 *
 * El usuario también puede pedir una comprobación manual con el botón
 * «Comprobar salud»: el SW audita su caché y responde con un informe.
 * Si todo está bien, NO aparece nada — silencio = salud.
 */

interface ReparacionReal {
  motivo: string;
  detalle: string;
  cuando: number;
}

interface Props {
  idioma: IdiomaCine;
}

interface InformeSw {
  tipo: "SALUD";
  ok: boolean;
  reparado: boolean;
  faltaban: number;
  entradas: number;
  version: string;
}

function hora(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default function BannerReparacion({ idioma }: Props) {
  const [visibles, setVisibles] = useState<ReparacionReal[]>([]);
  const [comprobando, setComprobando] = useState(false);
  const [informe, setInforme] = useState<string | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const t = (clave: string, vars?: Record<string, string | number>): string => traducirCine(clave, idioma, vars);

  useEffect(() => {
    function apuntar(e: Event): void {
      const detalle = (e as CustomEvent<{ motivo?: string; detalle?: string }>).detail ?? {};
      const reparacion: ReparacionReal = {
        motivo: detalle.motivo ?? "Caché",
        detalle: detalle.detalle ?? "Reconstruido",
        cuando: Date.now(),
      };
      setVisibles((prev) => [...prev.slice(-4), reparacion]);
      setInforme(null);
    }

    function delSw(e: MessageEvent): void {
      const datos = e.data as InformeSw | undefined;
      if (!datos || datos.tipo !== "SALUD") return;
      setComprobando(false);
      if (datos.reparado) {
        apuntar(
          new CustomEvent("streamdog-cine-reparacion", {
            detail: {
              motivo: "Service Worker",
              detalle: `Faltaban ${datos.faltaban} entradas del shell y se re-añadieron (${datos.entradas} en caché · ${datos.version})`,
            },
          })
        );
      } else {
        setInforme(`✓ ${datos.version}: ${datos.entradas} entradas verificadas, nada que reparar`);
      }
    }

    window.addEventListener("streamdog-cine-reparacion", apuntar);
    navigator.serviceWorker?.addEventListener("message", delSw);
    return () => {
      window.removeEventListener("streamdog-cine-reparacion", apuntar);
      navigator.serviceWorker?.removeEventListener("message", delSw);
    };
  }, []);

  /* Se apaga solo a los 12 s de tranquilidad. */
  useEffect(() => {
    if (visibles.length === 0) return;
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setVisibles([]), 12_000);
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [visibles]);

  async function comprobarSalud(): Promise<void> {
    setComprobando(true);
    setInforme(null);
    try {
      const registro = await navigator.serviceWorker?.getRegistration();
      const sw = registro?.active ?? navigator.serviceWorker?.controller;
      if (!sw) {
        setInforme("Sin service worker (demo estática o navegador sin soporte): la caché del módulo se auto-repara igualmente al leer.");
        setComprobando(false);
        return;
      }
      sw.postMessage({ tipo: "COMPROBAR_SALUD" });
      // La respuesta llega por el listener de mensajes; red de seguridad:
      setTimeout(() => {
        setComprobando(false);
        setInforme((actual) => actual ?? "El SW no respondió al informe (¿sw recién instalado?). Reintenta en unos segundos.");
      }, 4_000);
    } catch {
      setComprobando(false);
      setInforme("No se pudo hablar con el service worker en este navegador.");
    }
  }

  if (visibles.length === 0 && !comprobando && !informe) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-5 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.07] p-4"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
          <Wrench className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-emerald-200">{t("Caché reparada automáticamente")}</p>
          <p className="text-[11.5px] text-emerald-200/70">{t("Se detectaron datos corruptos y StreamDog los reconstruyó solo:")}</p>
        </div>
        <button
          type="button"
          onClick={comprobarSalud}
          disabled={comprobando}
          className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11.5px] font-medium text-emerald-100 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
        >
          {comprobando ? "…" : t("Comprobar salud")}
        </button>
        {visibles.length > 0 && (
          <button
            type="button"
            onClick={() => setVisibles([])}
            aria-label="Cerrar aviso de reparación"
            className="flex h-7 w-7 items-center justify-center rounded-md text-emerald-200/70 transition-colors hover:text-emerald-100"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {visibles.length > 0 && (
        <div className="mt-3 max-h-32 space-y-1 overflow-y-auto rounded-lg bg-slate-950/40 p-2.5 font-mono text-[11px] leading-relaxed scrollbar-thin">
          {visibles.map((r, i) => (
            <p key={`${r.cuando}-${i}`} className="text-emerald-100/85">
              <span className="text-emerald-400/70">[{hora(r.cuando)}]</span>{" "}
              <span className="font-semibold">{r.motivo}:</span> {r.detalle}
            </p>
          ))}
        </div>
      )}

      {informe && (
        <p className="mt-3 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-emerald-100/80">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" aria-hidden />
          {informe}
        </p>
      )}
    </div>
  );
}
