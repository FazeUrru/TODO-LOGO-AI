"use client";

import { Clapperboard } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * DIÁLOGO MOTIVADOR (v1.33.0) — la cara amable del «muy pronto».
 *
 * Las secciones nuevas (deportes, viajes, juegos, apps, webs) se abren
 * con este diálogo: título de la sección, un texto que ilusiona sin
 * prometer fechas falsas y un botón que devuelve al catálogo infinito,
 * que YA está abierto. Nada de enlaces muertos ni páginas vacías.
 */

interface Props {
  abierto: boolean;
  /** Nombre traducido de la sección (ej. «Deportes en vivo»). */
  seccion: string;
  /** Texto motivador ya traducido para esa sección. */
  texto: string;
  /** Etiquetas ya traducidas del diálogo. */
  etiquetas: { titulo: string; badge: string; cta: string; cerrar: string };
  onCerrar: () => void;
  onVerCatalogo: () => void;
}

export default function DialogoProximamente({ abierto, seccion, texto, etiquetas, onCerrar, onVerCatalogo }: Props) {
  return (
    <Dialog open={abierto} onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent className="max-w-md rounded-2xl border-white/10 bg-[#0d1526] text-slate-100 shadow-2xl">
        <DialogHeader className="text-left">
          <span className="mb-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-emerald-200">
            <Clapperboard className="h-3 w-3" aria-hidden />
            {etiquetas.badge}
          </span>
          <DialogTitle className="text-[19px] font-bold tracking-tight">{seccion}</DialogTitle>
          <DialogDescription className="pt-1 text-[13px] leading-relaxed text-slate-300">
            <span className="mb-2 block text-[12px] font-semibold uppercase tracking-wide text-cyan-300">{etiquetas.titulo}</span>
            {texto}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2">
          <button
            type="button"
            onClick={onCerrar}
            className="min-h-[40px] flex-1 rounded-xl border border-white/15 bg-white/[0.05] px-4 text-[13px] font-semibold text-slate-200 transition-colors hover:bg-white/[0.09]"
          >
            {etiquetas.cerrar}
          </button>
          <button
            type="button"
            onClick={onVerCatalogo}
            className="min-h-[40px] flex-1 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 text-[13px] font-bold text-slate-950 transition-opacity hover:opacity-90"
          >
            {etiquetas.cta}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
