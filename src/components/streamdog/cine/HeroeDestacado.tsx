"use client";

import { useState } from "react";
import { Infinity as InfinityIcon, Play, Plus, Star } from "lucide-react";
import { traducirGenero, type IdiomaCine } from "@/lib/streamdog/cine-i18n";
import type { ItemCine } from "@/lib/streamdog/cine";

/**
 * HÉROE DESTACADO (v1.33.0) — la primera impresión premium.
 *
 * Como en las grandes apps de cine: un banner grande con el título
 * estrella del día (el Nº1 REAL de la fila «Los títulos más famosos»,
 * ordenada por descargas de Archive.org), degradado a negro, metadatos
 * y dos acciones: Reproducir y Mi lista. Sin el título no hay héroe:
 * se cae en silencio y el carrusel manda.
 */

interface Props {
  item: ItemCine | null;
  idioma: IdiomaCine;
  /** Etiquetas traducidas. */
  etiquetas: { destacado: string; infinito: string; reproducir: string; enMiLista: string; anadir: string };
  enMiLista: boolean;
  onAbrir: (item: ItemCine) => void;
  onMiLista: (item: ItemCine) => void;
}

export default function HeroeDestacado({ item, idioma, etiquetas, enMiLista, onAbrir, onMiLista }: Props) {
  const [imagenViva, setImagenViva] = useState(true);
  if (!item) return null;

  const meta = [
    item.anyo !== null ? String(item.anyo) : null,
    item.duracionMin !== null ? `${item.duracionMin} min` : null,
    ...item.generos.slice(0, 3).map((g) => traducirGenero(g, idioma)),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section aria-label={etiquetas.destacado} className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-800 via-[#101b30] to-[#0b1322] shadow-2xl">
      {/* Imagen real del título (con red de seguridad si la fuente falla) */}
      {item.imagen && imagenViva ? (
        <img
          src={item.imagen}
          alt=""
          aria-hidden
          onError={() => setImagenViva(false)}
          className="sdc-kenburns absolute inset-0 h-full w-full object-cover opacity-70"
          loading="eager"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-[#070d18] via-[#070d18]/55 to-transparent" aria-hidden />

      <div className="relative flex min-h-[280px] flex-col justify-end gap-3 p-5 sm:min-h-[360px] sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-emerald-200 backdrop-blur">
            <Star className="h-3 w-3" aria-hidden />
            {etiquetas.destacado}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-cyan-200 backdrop-blur">
            <InfinityIcon className="h-3.5 w-3.5" aria-hidden />
            {etiquetas.infinito}
          </span>
        </div>

        <h2 className="max-w-2xl text-[26px] font-extrabold leading-tight tracking-tight text-white drop-shadow-lg sm:text-[38px]">
          {item.titulo}
        </h2>
        {meta ? <p className="text-[12.5px] font-medium text-slate-300 drop-shadow">{meta}</p> : null}
        {item.sinopsis ? <p className="line-clamp-2 max-w-xl text-[12.5px] leading-relaxed text-slate-300/90 drop-shadow sm:text-[13.5px]">{item.sinopsis}</p> : null}

        <div className="mt-1 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onAbrir(item)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-5 text-[14px] font-bold text-slate-950 shadow-lg shadow-emerald-500/25 transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <Play className="h-4.5 w-4.5 fill-current" aria-hidden />
            {etiquetas.reproducir}
          </button>
          <button
            type="button"
            onClick={() => onMiLista(item)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/25 bg-white/[0.08] px-4 text-[13.5px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/[0.16]"
          >
            <Plus className={enMiLista ? "h-4 w-4 rotate-45" : "h-4 w-4"} aria-hidden />
            {enMiLista ? etiquetas.enMiLista : etiquetas.anadir}
          </button>
        </div>
      </div>
    </section>
  );
}
