"use client";

import { useState } from "react";
import { Check, Play, Plus, Star } from "lucide-react";
import type { ItemCine } from "@/lib/streamdog/cine";
import { traducirCine, traducirGenero, type IdiomaCine } from "@/lib/streamdog/cine-i18n";
import { cn } from "@/lib/utils";

/**
 * Tarjeta de contenido estilo NetMirror: póster (vertical para series,
 * panorámico para películas de archivo), valoración, insignia de fuente,
 * botón de reproducción al pasar el ratón y acceso rápido a «Mi lista».
 * Con barra de progreso si el título está a medias («Seguir viendo»).
 */

interface Props {
  item: ItemCine;
  idioma: IdiomaCine;
  enMiLista: boolean;
  /** 0..100 o null — dibuja la barra roja de «lo dejaste por aquí». */
  progresoPct?: number | null;
  onAbrir: (item: ItemCine) => void;
  onMiLista: (item: ItemCine) => void;
}

const ETIQUETA_FUENTE: Record<ItemCine["fuente"], string> = {
  commons: "Commons",
  archive: "Archive",
  tvmaze: "TVMaze",
};

export default function TarjetaContenido({ item, idioma, enMiLista, progresoPct, onAbrir, onMiLista }: Props) {
  const [imagenRota, setImagenRota] = useState(false);
  const vertical = item.fuente === "tvmaze";
  const dominioPublico = item.fuente !== "tvmaze";

  return (
    <div className="group relative w-[168px] shrink-0 sm:w-[188px]">
      <button
        type="button"
        onClick={() => onAbrir(item)}
        aria-label={`${item.titulo} — ${traducirCine("Reproducir", idioma)}`}
        className={cn(
          "relative block w-full overflow-hidden rounded-xl border border-white/10 bg-slate-800/60 text-left transition-all duration-200",
          "hover:border-cyan-300/50 hover:shadow-lg hover:shadow-cyan-400/10 focus-visible:outline-2 focus-visible:outline-cyan-300"
        )}
      >
        <div className={cn("relative w-full overflow-hidden bg-slate-900", vertical ? "aspect-[2/3]" : "aspect-video")}>
          {item.imagen && !imagenRota ? (
            <img
              src={item.imagen}
              alt={`Póster de ${item.titulo}`}
              loading="lazy"
              decoding="async"
              onError={() => setImagenRota(true)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 via-slate-800/60 to-slate-900 p-3 text-center">
              <span className="line-clamp-3 text-[12.5px] font-medium text-slate-300">{item.titulo}</span>
            </div>
          )}

          {/* Veladura + botón de reproducción al pasar el ratón */}
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/0 opacity-0 transition-all duration-200 group-hover:bg-slate-950/45 group-hover:opacity-100 group-focus-within:opacity-100">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-slate-950/70 text-white shadow-lg">
              <Play className="ml-0.5 h-5 w-5" fill="currentColor" aria-hidden />
            </span>
          </div>

          {/* Valoración (TVMaze) o sello de dominio público */}
          <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-md bg-slate-950/75 px-1.5 py-0.5 text-[10.5px] font-semibold text-amber-300 backdrop-blur-sm">
            {item.valoracion !== null ? (
              <>
                <Star className="h-3 w-3" fill="currentColor" aria-hidden />
                {item.valoracion.toFixed(1)}
              </>
            ) : dominioPublico ? (
              traducirCine("Dominio público", idioma)
            ) : null}
          </span>

          {/* Barra de progreso de «seguir viendo» */}
          {progresoPct != null && progresoPct > 0 && (
            <span className="absolute inset-x-0 bottom-0 h-1 bg-slate-950/70">
              <span className="block h-full bg-rose-500" style={{ width: `${Math.min(100, Math.round(progresoPct))}%` }} />
            </span>
          )}
        </div>

        <div className="space-y-1 px-2.5 py-2">
          <p className="line-clamp-1 text-[13px] font-medium text-slate-100" title={item.titulo}>
            {item.titulo}
          </p>
          <p className="line-clamp-1 text-[11px] text-slate-400">
            {[item.anyo ?? null, item.duracionMin ? `${item.duracionMin} ${traducirCine("min", idioma)}` : null, traducirGenero(item.generos[0] ?? "", idioma) || null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </button>

      {/* Acceso rápido a «Mi lista» (fuera del botón principal para no anidar) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onMiLista(item);
        }}
        aria-pressed={enMiLista}
        aria-label={enMiLista ? `${item.titulo}: ${traducirCine("En mi lista", idioma)}` : `${item.titulo}: ${traducirCine("Añadir a mi lista", idioma)}`}
        className={cn(
          "absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-md border backdrop-blur-sm transition-colors",
          enMiLista
            ? "border-emerald-400/50 bg-emerald-500/25 text-emerald-200 opacity-100"
            : "border-white/20 bg-slate-950/70 text-slate-300 opacity-0 hover:border-white/40 hover:text-white group-hover:opacity-100 focus-visible:opacity-100"
        )}
      >
        {enMiLista ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Plus className="h-3.5 w-3.5" aria-hidden />}
      </button>

      {/* Insignia de fuente, abajo a la derecha del póster */}
      <span className="pointer-events-none absolute bottom-[52px] right-1.5 rounded-md bg-slate-950/80 px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wide text-slate-300 backdrop-blur-sm">
        {ETIQUETA_FUENTE[item.fuente]}
      </span>
    </div>
  );
}
