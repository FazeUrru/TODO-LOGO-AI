"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ItemCine } from "@/lib/streamdog/cine";
import { traducirCine, type IdiomaCine } from "@/lib/streamdog/cine-i18n";
import TarjetaContenido from "./TarjetaContenido";

/**
 * Carrusel horizontal con scroll-snap y flechas (estilo NetMirror):
 * una fila del catálogo de inicio. El scroll táctil es nativo; las
 * flechas desplazan el 80 % del ancho visible en escritorio.
 */

interface Props {
  titulo: string;
  items: ItemCine[];
  idioma: IdiomaCine;
  miLista: Set<string>;
  progresos: Map<string, number>;
  onAbrir: (item: ItemCine) => void;
  onMiLista: (item: ItemCine) => void;
}

export default function FilaCarrusel({ titulo, items, idioma, miLista, progresos, onAbrir, onMiLista }: Props) {
  const pista = useRef<HTMLDivElement>(null);

  function desplazar(direccion: 1 | -1): void {
    const el = pista.current;
    if (!el) return;
    el.scrollBy({ left: direccion * el.clientWidth * 0.8, behavior: "smooth" });
  }

  if (items.length === 0) return null;

  return (
    <section aria-label={titulo} className="group/fila">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-[15px] font-semibold tracking-tight text-slate-100">{titulo}</h2>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10.5px] text-slate-400">{items.length}</span>
        <span className="ml-auto hidden items-center gap-1 sm:flex">
          <button
            type="button"
            onClick={() => desplazar(-1)}
            aria-label={`${titulo}: desplazar a la izquierda`}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:border-white/25 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => desplazar(1)}
            aria-label={`${titulo}: desplazar a la derecha`}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:border-white/25 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </span>
      </div>

      <div
        ref={pista}
        className="scrollbar-thin flex snap-x gap-3 overflow-x-auto pb-2"
        role="list"
      >
        {items.map((item) => (
          <div key={item.id} role="listitem" className="snap-start">
            <TarjetaContenido
              item={item}
              idioma={idioma}
              enMiLista={miLista.has(item.id)}
              progresoPct={progresos.get(item.id) ?? null}
              onAbrir={onAbrir}
              onMiLista={onMiLista}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
