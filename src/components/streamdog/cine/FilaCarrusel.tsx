"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ItemCine } from "@/lib/streamdog/cine";
import { traducirCine, type IdiomaCine } from "@/lib/streamdog/cine-i18n";
import TarjetaContenido from "./TarjetaContenido";

/**
 * Carrusel horizontal con scroll-snap y flechas (estilo NetMirror):
 * una fila del catálogo de inicio. El scroll táctil es nativo; las
 * flechas desplazan el 80 % del ancho visible en escritorio.
 *
 * LAZYLOAD DE FILA (v1.38.0): la fila NO monta sus fichas hasta que el
 * IntersectionObserver la ve acercarse (rootMargin 400 px, una sola
 * vez). El arranque del inicio con ~20 filas ♾️ baja de cientos de
 * nodos+imágenes a solo las 2-3 filas visibles — el resto aparece
 * mientras haces scroll, con su skeleton shimmer como testigo.
 */

interface Props {
  titulo: string;
  items: ItemCine[];
  idioma: IdiomaCine;
  miLista: Set<string>;
  progresos: Map<string, number>;
  onAbrir: (item: ItemCine) => void;
  onMiLista: (item: ItemCine) => void;
  /** v1.38.0: «Ver todo» → abre la categoría EXPLORAR ∞ de esta fila. */
  onExplorar?: () => void;
}

export default function FilaCarrusel({ titulo, items, idioma, miLista, progresos, onAbrir, onMiLista, onExplorar }: Props) {
  const pista = useRef<HTMLDivElement>(null);
  const seccion = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  /* Lazyload de fila: montar las fichas SOLO cuando la fila se asoma. */
  useEffect(() => {
    const el = seccion.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true); // entorno sin IO (SSR/test): contenido siempre
      return;
    }
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "400px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  function desplazar(direccion: 1 | -1): void {
    const el = pista.current;
    if (!el) return;
    el.scrollBy({ left: direccion * el.clientWidth * 0.8, behavior: "smooth" });
  }

  if (items.length === 0) return null;

  return (
    <section ref={seccion} aria-label={titulo} className="group/fila">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-[15px] font-semibold tracking-tight text-slate-100">{titulo}</h2>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10.5px] text-slate-400">{items.length}</span>
        {onExplorar && (
          <button
            type="button"
            onClick={onExplorar}
            className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2.5 py-0.5 text-[10.5px] font-semibold text-cyan-100 transition-colors hover:bg-cyan-400/20"
            aria-label={`${titulo}: ${traducirCine("Ver todo", idioma)}`}
          >
            {traducirCine("Ver todo", idioma)} →
          </button>
        )}
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
        {visible
          ? items.map((item) => (
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
            ))
          : [0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} role="presentation" className="shrink-0">
                <div className="sdc-shimmer h-[150px] w-[168px] rounded-xl bg-white/5 sm:w-[188px]" />
                <div className="sdc-shimmer mt-2 h-3.5 w-28 rounded bg-white/5" />
              </div>
            ))}
      </div>
    </section>
  );
}
