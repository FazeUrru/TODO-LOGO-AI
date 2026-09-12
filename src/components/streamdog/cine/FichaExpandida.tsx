"use client";

import Link from "next/link";
import { Gamepad2, Globe, Plane, Smartphone, Sparkles, type LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * FICHA EXPANDIDA (v1.38.0) — la evolución del «muy pronto».
 *
 * Cada sección de la hoja de ruta (deportes, viajes, juegos, apps, webs)
 * abre ahora una ficha completa: insignia de estado honesta («Disponible
 * ya» / «Muy pronto»), descripción motivadora, chips de características
 * y — lo importante — ACCIONES REALES que ya funcionan: saltar a la
 * parrilla deportiva, jugar a los juegos de la casa, instalar la PWA,
 * buscar documentales de viaje en el catálogo o explorar las webs de la
 * casa. Nada de enlaces muertos: cada ficha se puede USAR.
 */

/** Identificadores de las fichas expandibles de StreamDog. */
export type FichaSeccionId = "deportes" | "viajes" | "juegos" | "apps" | "webs";

/** Identidad visual de cada ficha: icono y degradado propios. */
export const IDENTIDAD_FICHA: Record<FichaSeccionId, { Icono: LucideIcon; gradiente: string }> = {
  deportes: { Icono: Sparkles, gradiente: "from-emerald-500/30 to-cyan-400/10" },
  viajes: { Icono: Plane, gradiente: "from-sky-500/30 to-cyan-400/10" },
  juegos: { Icono: Gamepad2, gradiente: "from-violet-500/30 to-fuchsia-400/10" },
  apps: { Icono: Smartphone, gradiente: "from-amber-500/30 to-orange-400/10" },
  webs: { Icono: Globe, gradiente: "from-emerald-500/30 to-teal-400/10" },
};

/** Una acción real de la ficha: enlace interno, externo o callback. */
export interface AccionFicha {
  etiqueta: string;
  /** Ruta interna de la casa (se navega con Link). */
  href?: string;
  /** Enlace externo (se abre en pestaña nueva). */
  externo?: boolean;
  /** Acción en la propia página (hash de pestaña, búsqueda, instalación…). */
  onClick?: () => void;
  /** La acción principal va con degradado verde-cian. */
  primaria?: boolean;
  /** Desactivada (p. ej. instalar sin instalador disponible). */
  desactivada?: boolean;
  /** Pista de accesibilidad para botones desactivados. */
  pista?: string;
}

interface Props {
  abierto: boolean;
  /** Id de la ficha (icono y degradado propios). */
  seccionId: FichaSeccionId;
  /** Nombre traducido de la sección (ej. «Deportes en vivo»). */
  seccion: string;
  /** Estado honesto: usable ahora o en camino. */
  estado: "ya" | "pronto";
  /** Descripción motivadora ya traducida. */
  descripcion: string;
  /** Características ya traducidas (chips). */
  caracteristicas: string[];
  /** Acciones reales ya traducidas. */
  acciones: AccionFicha[];
  /** Etiquetas ya traducidas del diálogo. */
  etiquetas: { badgeYa: string; badgePronto: string; incluye: string; acciones: string; cerrar: string };
  onCerrar: () => void;
}

const CLASE_ACCION_BASE =
  "inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl px-4 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70";

export default function FichaExpandida({
  abierto,
  seccionId,
  seccion,
  estado,
  descripcion,
  caracteristicas,
  acciones,
  etiquetas,
  onCerrar,
}: Props) {
  const { Icono, gradiente } = IDENTIDAD_FICHA[seccionId];

  const claseAccion = (accion: AccionFicha): string =>
    accion.desactivada
      ? "cursor-not-allowed border border-white/10 bg-white/[0.04] text-slate-500"
      : accion.primaria
        ? "bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-950 hover:from-emerald-300 hover:to-cyan-300"
        : "border border-white/15 bg-white/[0.05] text-slate-200 hover:border-white/30 hover:bg-white/[0.09]";

  const cuerpoAccion = (accion: AccionFicha): React.ReactNode => (
    <>
      {accion.primaria && !accion.desactivada && <Sparkles className="h-3.5 w-3.5" aria-hidden />}
      {accion.etiqueta}
    </>
  );

  return (
    <Dialog open={abierto} onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent className="max-w-lg overflow-hidden rounded-2xl border-white/10 bg-[#0d1526] p-0 text-slate-100 shadow-2xl shadow-cyan-500/10">
        {/* Cabecera con identidad propia de la sección */}
        <div className={cn("relative bg-gradient-to-br px-5 pb-5 pt-6", gradiente)}>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide backdrop-blur-sm",
              estado === "ya"
                ? "border border-emerald-300/40 bg-emerald-400/15 text-emerald-100"
                : "border border-amber-300/40 bg-amber-400/15 text-amber-100"
            )}
          >
            {estado === "ya" ? etiquetas.badgeYa : etiquetas.badgePronto}
          </span>
          <DialogTitle className="mt-2 flex items-center gap-2.5 text-[21px] font-bold tracking-tight">
            <Icono className="h-6 w-6 text-white/90" aria-hidden />
            {seccion}
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-[13px] leading-relaxed text-slate-200/90">
            {descripcion}
          </DialogDescription>
        </div>

        <div className="space-y-4 px-5 py-4">
          {/* Qué incluye */}
          <div className="space-y-1.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{etiquetas.incluye}</h3>
            <div className="flex flex-wrap gap-1.5">
              {caracteristicas.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11.5px] text-slate-300"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Qué puedes hacer ya — acciones reales */}
          <div className="space-y-1.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{etiquetas.acciones}</h3>
            <div className="flex flex-wrap gap-2">
              {acciones.map((accion) =>
                accion.href && !accion.externo ? (
                  <Link key={accion.etiqueta} href={accion.href} className={cn(CLASE_ACCION_BASE, claseAccion(accion))}>
                    {cuerpoAccion(accion)}
                  </Link>
                ) : accion.href && accion.externo ? (
                  <a
                    key={accion.etiqueta}
                    href={accion.href}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(CLASE_ACCION_BASE, claseAccion(accion))}
                  >
                    {cuerpoAccion(accion)}
                  </a>
                ) : (
                  <button
                    key={accion.etiqueta}
                    type="button"
                    onClick={accion.onClick}
                    disabled={accion.desactivada}
                    title={accion.pista}
                    aria-disabled={accion.desactivada}
                    className={cn(CLASE_ACCION_BASE, claseAccion(accion))}
                  >
                    {cuerpoAccion(accion)}
                  </button>
                )
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="min-h-[38px] w-full rounded-xl border border-white/10 bg-white/[0.04] text-[12.5px] font-medium text-slate-300 transition-colors hover:bg-white/[0.08]"
          >
            {etiquetas.cerrar}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
