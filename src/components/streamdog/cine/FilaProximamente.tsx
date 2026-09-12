"use client";

import { Globe, Gamepad2, Plane, Smartphone, Sparkles } from "lucide-react";

/**
 * SECCIÓN «MUY PRONTO» (v1.33.0) — la hoja de ruta con orgullo.
 *
 * Viajes, juegos, apps y webs: tarjetas premium con degradado propio,
 * badge «En desarrollo» y un toque de lo que viene. Pulsar abre el
 * diálogo motivador — la hoja de ruta se presume, no se esconde.
 */

export type SeccionPronto = "viajes" | "juegos" | "apps" | "webs";

interface Props {
  t: (clave: string) => string;
  /** Texto motivador por sección, ya traducido. */
  textos: Record<SeccionPronto, string>;
  onAbrir: (seccion: SeccionPronto) => void;
}

const TARJETAS: { id: SeccionPronto; clave: string; Icono: typeof Plane; gradiente: string; anillo: string }[] = [
  { id: "viajes", clave: "Viajes", Icono: Plane, gradiente: "from-sky-500/25 to-cyan-400/10", anillo: "group-hover:ring-sky-300/40" },
  { id: "juegos", clave: "Juegos", Icono: Gamepad2, gradiente: "from-violet-500/25 to-fuchsia-400/10", anillo: "group-hover:ring-violet-300/40" },
  { id: "apps", clave: "Apps", Icono: Smartphone, gradiente: "from-amber-500/25 to-orange-400/10", anillo: "group-hover:ring-amber-300/40" },
  { id: "webs", clave: "Webs", Icono: Globe, gradiente: "from-emerald-500/25 to-teal-400/10", anillo: "group-hover:ring-emerald-300/40" },
];

export default function FilaProximamente({ t, textos, onAbrir }: Props) {
  return (
    <section aria-label={t("Muy pronto")}>
      <div className="mb-2 flex items-center gap-2">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-slate-100">
          <Sparkles className="h-4 w-4 text-amber-300" aria-hidden />
          {t("Muy pronto")}
        </h2>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
          {t("En desarrollo")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TARJETAS.map(({ id, clave, Icono, gradiente, anillo }) => (
          <button
            key={id}
            type="button"
            onClick={() => onAbrir(id)}
            aria-label={`${t(clave)} — ${t("En desarrollo")}`}
            className={`group flex min-h-[110px] flex-col items-start justify-between rounded-2xl border border-white/10 bg-gradient-to-br ${gradiente} p-3.5 text-left ring-1 ring-transparent transition-all hover:scale-[1.02] hover:border-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ${anillo}`}
          >
            <Icono className="h-6 w-6 text-white/85 transition-transform group-hover:scale-110" aria-hidden />
            <span>
              <span className="block text-[14px] font-bold tracking-tight text-slate-100">{t(clave)}</span>
              <span className="mt-0.5 block text-[10.5px] font-bold uppercase tracking-wide text-amber-200/90">{t("Muy pronto")}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
