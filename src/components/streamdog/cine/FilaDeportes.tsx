"use client";

import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";

/**
 * DEPORTES EN VIVO (v1.33.0) — la vitrina del «próximamente» que sí late.
 *
 * Como en las apps premium: tarjetas de enfrentamientos famosos con
 * escudo de iniciales, colores de cada equipo y CUENTA ATRÁS REAL al
 * saque de las 21:00 (UTC). Mientras la sección deportiva llega de
 * verdad, el contador corre — y al pulsar, un diálogo motivador explica
 * que se está construyendo. Sin datos falsos: nadie «juega» aquí aún;
 * solo el tiempo, que es honesto.
 */

interface Equipo {
  nombre: string;
  iniciales: string;
  /** Color del escudo (fondo). */
  color: string;
  /** Color del texto sobre el escudo. */
  tinta: string;
}

interface Enfrentamiento {
  local: Equipo;
  visitante: Equipo;
  /** Hora del saque en UTC (los grandes partidos: noche). */
  horaUtc: number;
}

const ENFRENTAMIENTOS: Enfrentamiento[] = [
  {
    local: { nombre: "Liverpool", iniciales: "LFC", color: "#C8102E", tinta: "#ffffff" },
    visitante: { nombre: "Fulham", iniciales: "FUL", color: "#e8e8e8", tinta: "#111111" },
    horaUtc: 20,
  },
  {
    local: { nombre: "Real Madrid", iniciales: "RMA", color: "#f5f5f5", tinta: "#1a2b6d" },
    visitante: { nombre: "Barcelona", iniciales: "FCB", color: "#A50044", tinta: "#EDBB00" },
    horaUtc: 21,
  },
  {
    local: { nombre: "Chelsea", iniciales: "CHE", color: "#034694", tinta: "#ffffff" },
    visitante: { nombre: "Hull City", iniciales: "HUL", color: "#F5A12D", tinta: "#111111" },
    horaUtc: 19,
  },
  {
    local: { nombre: "Bayern", iniciales: "FCB", color: "#DC052D", tinta: "#ffffff" },
    visitante: { nombre: "Dortmund", iniciales: "BVB", color: "#FDE100", tinta: "#111111" },
    horaUtc: 20,
  },
  {
    local: { nombre: "PSG", iniciales: "PSG", color: "#004170", tinta: "#DA291C" },
    visitante: { nombre: "Marsella", iniciales: "OM", color: "#2FAEE0", tinta: "#ffffff" },
    horaUtc: 21,
  },
  {
    local: { nombre: "Atlético", iniciales: "ATM", color: "#CB3524", tinta: "#ffffff" },
    visitante: { nombre: "Sevilla", iniciales: "SEV", color: "#f0f0f0", tinta: "#D81324" },
    horaUtc: 19,
  },
];

/** Próximo saque (a las `horaUtc`:00 UTC) después de `ahora`. */
export function proximoSaque(horaUtc: number, ahora: number): number {
  const d = new Date(ahora);
  d.setUTCHours(horaUtc, 0, 0, 0);
  if (d.getTime() <= ahora) d.setUTCDate(d.getUTCDate() + 1);
  return d.getTime();
}

/** «HH:MM:SS» desde milisegundos restantes. */
export function cuentaAtras(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const dos = (n: number) => String(n).padStart(2, "0");
  return `${dos(h)}:${dos(m)}:${dos(s)}`;
}

interface Props {
  t: (clave: string) => string;
  onAbrir: () => void;
}

export default function FilaDeportes({ t, onAbrir }: Props) {
  const [ahora, setAhora] = useState<number | null>(null);

  useEffect(() => {
    // Asíncrono a propósito: el primer tick no corrompe la hidratación SSR.
    const primer = setTimeout(() => setAhora(Date.now()), 0);
    const reloj = setInterval(() => setAhora(Date.now()), 1000);
    return () => {
      clearTimeout(primer);
      clearInterval(reloj);
    };
  }, []);

  return (
    <section aria-label={t("Deportes en vivo")}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-slate-100">
          {t("Deportes en vivo")}
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">
            <CalendarClock className="h-3 w-3" aria-hidden />
            {t("Próximamente")}
          </span>
        </h2>
      </div>

      <div className="scrollbar-thin flex snap-x gap-3 overflow-x-auto pb-2">
        {ENFRENTAMIENTOS.map((m, i) => {
          const restante = ahora !== null ? proximoSaque(m.horaUtc, ahora) - ahora : null;
          return (
            <button
              key={i}
              type="button"
              onClick={onAbrir}
              className="sdc-frontera group w-[240px] shrink-0 snap-start overflow-hidden rounded-2xl bg-white/[0.04] text-left transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
            >
              {/* Cinta superior: proximidad + cuenta atrás real */}
              <div className="flex items-center justify-between bg-black/40 px-3 py-1.5">
                <span className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-300">{t("Próximamente")}</span>
                <span className="font-mono text-[11px] font-bold tabular-nums text-emerald-300" aria-label={t("Próximamente")}>
                  {restante === null ? "--:--:--" : cuentaAtras(restante)}
                </span>
              </div>

              {/* Enfrentamiento: escudos + VS */}
              <div className="flex items-center justify-center gap-4 bg-gradient-to-br from-white/[0.05] to-transparent px-3 py-4">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full text-[11px] font-black shadow-inner ring-1 ring-white/20"
                  style={{ backgroundColor: m.local.color, color: m.local.tinta }}
                  aria-hidden
                >
                  {m.local.iniciales}
                </span>
                <span className="text-[15px] font-black tracking-tight text-slate-200" aria-hidden>
                  {t("VS")}
                </span>
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full text-[11px] font-black shadow-inner ring-1 ring-white/20"
                  style={{ backgroundColor: m.visitante.color, color: m.visitante.tinta }}
                  aria-hidden
                >
                  {m.visitante.iniciales}
                </span>
              </div>

              {/* Nombres */}
              <div className="flex items-center justify-center gap-2 border-t border-white/[0.06] px-3 py-2.5">
                <span className="truncate text-[12px] font-semibold text-slate-200">{m.local.nombre}</span>
                <span className="text-[11px] font-bold text-slate-500">{t("VS")}</span>
                <span className="truncate text-[12px] font-semibold text-slate-200">{m.visitante.nombre}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
