"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Download,
  Hourglass,
  Radio,
  Sparkles,
  Trophy,
} from "lucide-react";
import { asset } from "@/lib/asset-path";
import { isStaticDemo } from "@/lib/static-mode";
import { cn } from "@/lib/utils";
import { eventosDelMes, NOMBRES_MES, progresoDelAnio, sugerenciasParaElDev } from "@/lib/streamdog/sportia";

/**
 * Parrilla de StreamDog: el año en la palma de la mano. Muestra el reloj
 * del año (progreso, día, trimestre), los eventos deportivos del mes y del
 * siguiente — cada uno con la feature que SportIA sugiere para él — y el
 * panel de INSTALACIÓN NATIVA (beforeinstallprompt + estado del service
 * worker): la parte que convierte la web en app.
 */

interface EventoInstalador extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Parrilla() {
  const reloj = useMemo(() => progresoDelAnio(new Date()), []);
  const eventosMes = useMemo(() => eventosDelMes(reloj.mes), [reloj.mes]);
  const mesSiguiente = (reloj.mes % 12) + 1;
  const eventosProximos = useMemo(() => eventosDelMes(mesSiguiente), [mesSiguiente]);
  const sugerenciaTop = useMemo(() => sugerenciasParaElDev(new Date())[0], []);

  const [instalador, setInstalador] = useState<EventoInstalador | null>(null);
  const [instalada, setInstalada] = useState(false);
  const [swEstado, setSwEstado] = useState<"registrando" | "lista" | "estatica" | "sin-sw">("registrando");

  useEffect(() => {
    const alPedir = (e: Event) => {
      e.preventDefault();
      setInstalador(e as EventoInstalador);
    };
    window.addEventListener("beforeinstallprompt", alPedir);
    window.addEventListener("appinstalled", () => {
      setInstalada(true);
      setInstalador(null);
    });

    (async () => {
      if (isStaticDemo()) {
        setSwEstado("estatica");
        return;
      }
      if (!("serviceWorker" in navigator)) {
        setSwEstado("sin-sw");
        return;
      }
      try {
        if (!navigator.serviceWorker.controller) {
          await navigator.serviceWorker.register(asset("/streamdog-pwa/sw.js"), {
            scope: asset("/streamdog"),
          });
          await navigator.serviceWorker.ready;
        }
        setSwEstado("lista");
      } catch {
        setSwEstado("sin-sw");
      }
    })();

    return () => window.removeEventListener("beforeinstallprompt", alPedir);
  }, []);

  async function instalar() {
    if (!instalador) return;
    await instalador.prompt();
    const eleccion = await instalador.userChoice;
    if (eleccion.outcome === "accepted") {
      setInstalada(true);
      setInstalador(null);
    }
  }

  const textoSw =
    swEstado === "lista"
      ? "Service worker activo: la parrilla abre incluso sin red."
      : swEstado === "estatica"
        ? "Demo estática (GitHub Pages): sin service worker, la app corre online."
        : swEstado === "registrando"
          ? "Registrando el service worker…"
          : "Este navegador no soporta service workers: la app funciona igual, sin modo sin conexión.";

  return (
    <div className="space-y-6">
      {/* Reloj del año */}
      <section
        aria-label="Progreso del año"
        className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center gap-2 text-[12px] font-medium text-slate-400">
          <CalendarRange className="h-4 w-4 text-cyan-300" aria-hidden />
          Lo que va de {reloj.anio}
          <span className="ml-auto rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-slate-400">
            T{reloj.trimestre} · {reloj.diasRestantes} días restantes
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text font-display text-[40px] font-medium leading-none text-transparent">
            {reloj.pct.toLocaleString("es-ES", { maximumFractionDigits: 1 })} %
          </span>
          <span className="text-[13px] text-slate-500">
            del año · día {reloj.diaDelAnio} de {reloj.diasDelAnio} · {NOMBRES_MES[reloj.mes - 1]}
          </span>
        </div>
        <div
          className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={Math.round(reloj.pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`El año va por el ${reloj.pct} %`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-[width] duration-700"
            style={{ width: `${Math.max(2, reloj.pct)}%` }}
          />
        </div>
      </section>

      {/* Instalación nativa */}
      <section
        aria-label="Instalar como app nativa"
        className="flex flex-col gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-5 sm:flex-row sm:items-center sm:p-6"
      >
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-[15px] font-medium text-emerald-200">
            <Download className="h-4 w-4" aria-hidden />
            App web nativa
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-400">
            {textoSw}{" "}
            {swEstado !== "estatica" && (
              <span className="text-slate-500">Alojamiento y dominio personalizado: docs/STREAMDOG-ALOJAMIENTO.md.</span>
            )}
          </p>
        </div>
        {instalada ? (
          <span className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-500/15 px-5 text-[13.5px] font-medium text-emerald-200">
            <CheckCircle2 className="h-4 w-4" aria-hidden /> Instalada en este dispositivo
          </span>
        ) : instalador ? (
          <button
            onClick={instalar}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 text-[13.5px] font-semibold text-slate-950 transition-opacity hover:opacity-90"
          >
            <Download className="h-4 w-4" aria-hidden />
            Instalar StreamDog
          </button>
        ) : (
          <p className="max-w-[260px] text-[12px] leading-relaxed text-slate-500">
            En móvil: menú del navegador → «Añadir a pantalla de inicio». En escritorio: icono de instalar en la barra
            de direcciones.
          </p>
        )}
      </section>

      {/* Eventos del mes */}
      <section aria-label={`Eventos de ${NOMBRES_MES[reloj.mes - 1]}`}>
        <h2 className="flex items-center gap-2 text-[15px] font-medium text-slate-200">
          <Trophy className="h-4 w-4 text-cyan-300" aria-hidden />
          {NOMBRES_MES[reloj.mes - 1].charAt(0).toUpperCase() + NOMBRES_MES[reloj.mes - 1].slice(1)} en la parrilla
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {eventosMes.map((e) => (
            <article key={e.nombre} className="flex flex-col rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-cyan-300/80">
                {e.deporte}
              </div>
              <h3 className="mt-1 text-[14.5px] font-medium text-slate-100">{e.nombre}</h3>
              <p className="mt-0.5 text-[12px] text-slate-500">{e.ventana}</p>
              <p className="mt-2 flex-1 border-t border-white/5 pt-2 text-[12.5px] leading-relaxed text-slate-400">
                <Sparkles className="mr-1 inline h-3.5 w-3.5 text-emerald-300/70" aria-hidden />
                {e.idea}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Próximos del mes siguiente */}
      <section aria-label={`Próximos eventos: ${NOMBRES_MES[mesSiguiente - 1]}`}>
        <h2 className="flex items-center gap-2 text-[14px] font-medium text-slate-300">
          <Hourglass className="h-4 w-4 text-slate-400" aria-hidden />
          A la vista: {NOMBRES_MES[mesSiguiente - 1]}
        </h2>
        <ul className="mt-3 space-y-2">
          {eventosProximos.map((e) => (
            <li
              key={e.nombre}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-[13px]"
            >
              <span className="font-medium text-slate-200">{e.nombre}</span>
              <span className="text-[11.5px] uppercase tracking-wide text-slate-500">{e.deporte}</span>
              <span className="ml-auto text-[12px] text-slate-500">{e.ventana}</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-600" aria-hidden />
            </li>
          ))}
        </ul>
      </section>

      {/* Teaser SportIA */}
      {sugerenciaTop && (
        <section
          aria-label="Sugerencia destacada de SportIA"
          className="flex items-start gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.05] p-4"
        >
          <Radio className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" aria-hidden />
          <p className="text-[13px] leading-relaxed text-slate-300">
            <span className="font-medium text-cyan-200">SportIA ahora mismo:</span> {sugerenciaTop.titulo} — {sugerenciaTop.detalle}{" "}
            <span className={cn("ml-1 text-slate-500")}>(pestaña SportIA para el resto y el buzón)</span>
          </p>
        </section>
      )}
    </div>
  );
}
