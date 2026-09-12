"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, Flame, LayoutGrid, Loader2, Quote, Shuffle, Sparkles, TrendingUp, Trophy, WifiOff } from "lucide-react";
import type { ItemCine } from "@/lib/streamdog/cine";
import { jsonSeguro } from "@/lib/fetch-seguro";
import {
  FILTROS_PELICULAS,
  FILTROS_TOP100,
  criticaDe,
  type FiltroTop100,
  type PuestoTop100,
} from "@/lib/streamdog/cine-top100";
import type { IdiomaCine, IdiomaCineFijo } from "@/lib/streamdog/cine-i18n";
import { cn } from "@/lib/utils";
import TarjetaContenido from "./TarjetaContenido";

/**
 * TOP 100 (v1.37.0) — la clasificación definitiva de StreamDog Cine:
 * series, películas y documentales del 1 al 100 con SEIS filtros.
 *
 *  · GENERAL    → el ranking global (los nº 1 de cada lista delante).
 *  · FAMOSOS    → éxitos eternos + Netflix + presencia multi-lista.
 *  · ANIMACIÓN  → dibujos y anime, con las míticas de Disney.
 *  · RECIENTES  → los estrenos del momento, en su orden.
 *  · POPULARES  → el consenso: más puestos altos en más listas.
 *  · AMBIGÜEDAD → mezcla sorpresa determinista, sin reglas aparentes.
 *
 * El ranking lo calcula el backend (caché caliente del cron); aquí solo
 * se elige el filtro, se muestran las medallas y se deja añadir a la
 * lista o abrir la ficha. Fichas SIEMPRE legales, con su fuente.
 */

interface Props {
  t: (clave: string, vars?: Record<string, string | number>) => string;
  idioma: IdiomaCine;
  idsEnLista: Set<string>;
  pctProgresos: Map<string, number>;
  onAbrir: (item: ItemCine) => void;
  onMiLista: (item: ItemCine) => void;
  /** v1.38.0 — «peliculas»: la sección de películas con SUS 4 filtros. */
  modo?: "global" | "peliculas";
  /** Salto a la grilla paginada (solo en modo peliculas). */
  onExplorarTodo?: () => void;
}

interface RespuestaTop100 {
  ok: boolean;
  filtro: string;
  puestos?: PuestoTop100[];
  degradada: boolean;
  error?: string;
}

/** Un gradiente propio por filtro (chips premium v1.33.0). */
const GRADIENTES_FILTRO: Record<FiltroTop100, string> = {
  general: "from-amber-400/30 to-yellow-500/10 text-amber-100 border-amber-300/40",
  famosos: "from-rose-400/30 to-pink-400/10 text-rose-100 border-rose-300/40",
  animacion: "from-violet-400/30 to-fuchsia-400/10 text-violet-100 border-violet-300/40",
  recientes: "from-sky-400/30 to-cyan-400/10 text-sky-100 border-sky-300/40",
  populares: "from-emerald-400/30 to-teal-400/10 text-emerald-100 border-emerald-300/40",
  ambiguedad: "from-fuchsia-400/30 to-purple-400/10 text-fuchsia-100 border-fuchsia-300/40",
};

const ICONO_FILTRO: Record<FiltroTop100, typeof Trophy> = {
  general: Trophy,
  famosos: Flame,
  animacion: Sparkles,
  recientes: Clock,
  populares: TrendingUp,
  ambiguedad: Shuffle,
};

/* ── Modo PELÍCULAS (v1.38.0): 4 filtros con identidad propia ── */

type FiltroPeliculasAlias = "populares" | "recientes" | "ambiguas" | "critica";

const GRADIENTES_PELICULAS: Record<FiltroPeliculasAlias, string> = {
  populares: "from-emerald-400/30 to-teal-400/10 text-emerald-100 border-emerald-300/40",
  recientes: "from-sky-400/30 to-cyan-400/10 text-sky-100 border-sky-300/40",
  ambiguas: "from-fuchsia-400/30 to-purple-400/10 text-fuchsia-100 border-fuchsia-300/40",
  critica: "from-amber-400/30 to-orange-400/10 text-amber-100 border-amber-300/40",
};

const ICONO_FILTRO_PELICULAS: Record<FiltroPeliculasAlias, typeof Trophy> = {
  populares: TrendingUp,
  recientes: Clock,
  ambiguas: Shuffle,
  critica: Quote,
};

/** Descripciones canónicas de los filtros de películas (i18n por clave). */
const DESCRIPCION_PELICULAS: Record<FiltroPeliculasAlias, string> = {
  populares: "Las películas más pedidas de la casa: el consenso de los éxitos mundiales del dominio público.",
  recientes: "Del año más nuevo al más viejo: el catálogo de películas ordenado por su año de estreno real.",
  ambiguas: "Clásicos con crítica y éxitos mundiales, alternados sin reglas: una crítica, un éxito, otra crítica…",
  critica: "La sección que no existe en ningún otro catálogo: 12 clásicos con una crítica constructiva y honesta de qué envejeció y qué sigue vivo.",
};

/** Descripción canónica de cada filtro (i18n por clave). */
const CLAVE_DESCRIPCION: Record<FiltroTop100, string> = {
  general: "El ranking global: lo mejor de cada plataforma y del archivo público, del 1 al 100.",
  famosos: "Los que todo el mundo conoce: éxitos eternos del dominio público y las series que marcaron época en Netflix.",
  animacion: "Dibujos y anime para maratón: de los clásicos de Disney a Attack on Titan, sin parar.",
  recientes: "Los estrenos de los que habla todo el mundo ahora mismo, del más nuevo al imprescindible.",
  populares: "El consenso de las listas: los títulos que suman más puestos altos en todas las plataformas.",
  ambiguedad: "Mezcla sorpresa sin reglas: series, películas y documentales barajados — siempre igual en tu dispositivo, distinto en cada versión.",
};

export default function Top100({ t, idioma, idsEnLista, pctProgresos, onAbrir, onMiLista, modo = "global", onExplorarTodo }: Props) {
  const esPeliculas = modo === "peliculas";
  const [filtro, setFiltro] = useState<string>(esPeliculas ? "populares" : "general");
  const [puestos, setPuestos] = useState<PuestoTop100[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(
    async (f: string, signal: AbortSignal): Promise<void> => {
      setCargando(true);
      setError(null);
      try {
        const datos = await jsonSeguro<RespuestaTop100>(
          await fetch(esPeliculas ? `/api/streamdog/cine?vista=peliculas&filtro=${f}` : `/api/streamdog/cine?vista=top100&filtro=${f}`, { signal }),
          esPeliculas ? "la cartelera de películas" : "la clasificación Top 100"
        );
        if (!datos.ok) {
          setError(datos.error ?? t("La clasificación está vacía: las fuentes no respondieron. Prueba otro filtro o reintenta."));
          setPuestos([]);
          return;
        }
        setPuestos(datos.puestos ?? []);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError(e instanceof Error ? e.message : "Error inesperado.");
          setPuestos([]);
        }
      } finally {
        setCargando(false);
      }
    },
    [t]
  );

  useEffect(() => {
    const control = new AbortController();
    void cargar(filtro, control.signal);
    return () => control.abort();
  }, [filtro, cargar]);

  const activo = esPeliculas
    ? (FILTROS_PELICULAS.find((f) => f.id === filtro) ?? FILTROS_PELICULAS[0])
    : (FILTROS_TOP100.find((f) => f.id === filtro) ?? FILTROS_TOP100[0]);

  return (
    <section aria-label={t(esPeliculas ? "Películas del cine" : "Top 100")} className="space-y-4">
      {/* Cabecera del Top 100 / de la cartelera de películas */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="inline-flex items-center gap-2 text-[17px] font-bold tracking-tight text-slate-50">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-amber-300/40 bg-gradient-to-br from-amber-400/30 to-yellow-500/10">
            <Trophy className="h-4 w-4 text-amber-200" aria-hidden />
          </span>
          {t(esPeliculas ? "Películas del cine" : "Top 100")}
        </h2>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10.5px] font-medium text-slate-300">
          {t("Actualizado cada hora")}
        </span>
      </div>
      <p className="max-w-2xl text-[12.5px] leading-relaxed text-slate-400">
        {t(
          esPeliculas
            ? "La cartelera de películas del dominio público con cuatro puertas: populares, recientes, ambiguas y la crítica constructiva — clásicos con una crítica honesta bajo cada ficha."
            : "La clasificación definitiva: series, películas y documentales del 1 al 100, con ranking real de las fuentes."
        )}
      </p>

      {/* Chips de filtro: seis puertas al Top 100 global, cuatro a las películas */}
      <nav aria-label={t(esPeliculas ? "Filtros de las películas" : "Filtros del Top 100")} className="scrollbar-thin flex items-center gap-2 overflow-x-auto pb-1">
        {(esPeliculas ? FILTROS_PELICULAS : FILTROS_TOP100).map(({ id, clave }) => {
          const Icono = esPeliculas ? ICONO_FILTRO_PELICULAS[id as FiltroPeliculasAlias] : ICONO_FILTRO[id as FiltroTop100];
          const activoChip = id === filtro;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setFiltro(id)}
              aria-pressed={activoChip}
              title={t(CLAVE_DESCRIPCION[id] ?? (esPeliculas ? DESCRIPCION_PELICULAS[id as FiltroPeliculasAlias] : ""))}
              className={cn(
                "inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-xl border bg-gradient-to-r px-3.5 text-[12.5px] font-semibold transition-transform",
                esPeliculas ? GRADIENTES_PELICULAS[id as FiltroPeliculasAlias] : GRADIENTES_FILTRO[id as FiltroTop100],
                activoChip ? "scale-[1.04] ring-2 ring-white/40" : "opacity-75 hover:scale-[1.03] hover:opacity-100"
              )}
            >
              <Icono className="h-3.5 w-3.5" aria-hidden />
              {t(clave)}
            </button>
          );
        })}
        {esPeliculas && onExplorarTodo && (
          <button
            type="button"
            onClick={onExplorarTodo}
            className="inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-3.5 text-[12.5px] font-bold text-slate-100 transition-transform hover:scale-[1.03]"
          >
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
            {t("Explorar todo")}
          </button>
        )}
      </nav>
      <p className="text-[11.5px] leading-relaxed text-slate-500">
        {t(esPeliculas ? DESCRIPCION_PELICULAS[activo.id as FiltroPeliculasAlias] : CLAVE_DESCRIPCION[activo.id as FiltroTop100])}
      </p>

      {/* Contenido del ranking */}
      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-400/25 bg-rose-500/[0.06] p-8 text-center">
          <WifiOff className="h-7 w-7 text-rose-300" aria-hidden />
          <p className="max-w-sm text-[13px] leading-relaxed text-rose-100/90">{error}</p>
          <button
            type="button"
            onClick={() => {
              const control = new AbortController();
              void cargar(filtro, control.signal);
            }}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-4 text-[13px] font-semibold text-slate-100 transition-colors hover:border-white/40"
          >
            {t("Reintentar")}
          </button>
        </div>
      ) : cargando && puestos.length === 0 ? (
        <div className="flex flex-wrap gap-4" aria-busy="true" aria-label={t("Cargando catálogo…")}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="sdc-shimmer h-[210px] w-[168px] rounded-xl bg-white/5 sm:w-[188px]" />
          ))}
        </div>
      ) : puestos.length > 0 ? (
        <div className="flex flex-wrap gap-x-3 gap-y-5">
          {puestos.map((p) => {
            const critica = esPeliculas && filtro === "critica" ? criticaDe(p.item.titulo) : null;
            const textoCritica = critica ? critica.texto[(idioma === "sistema" ? "es" : idioma) as IdiomaCineFijo] : null;
            return (
              <div key={`${p.puesto}-${p.item.id}`} className="w-[168px] shrink-0 sm:w-[188px]">
                <TarjetaContenido
                  item={p.item}
                  idioma={idioma}
                  enMiLista={idsEnLista.has(p.item.id)}
                  progresoPct={pctProgresos.get(p.item.id) ?? null}
                  puesto={p.puesto}
                  onAbrir={onAbrir}
                  onMiLista={onMiLista}
                />
                {/* CRÍTICA CONSTRUCTIVA (v1.38.0): la crítica honesta bajo la ficha */}
                {textoCritica ? (
                  <p className="mt-2 flex gap-1 rounded-lg border border-amber-300/20 bg-amber-400/[0.06] p-2 text-[10.5px] leading-relaxed text-amber-100/90">
                    <Quote className="mt-0.5 h-3 w-3 shrink-0 text-amber-300" aria-hidden />
                    <span className="line-clamp-6">{textoCritica}</span>
                  </p>
                ) : p.apariciones.length > 0 ? (
                  <p className="mt-1.5 line-clamp-1 px-1 text-center text-[10px] font-medium uppercase tracking-wide text-slate-500" title={p.apariciones.join(" · ")}>
                    {p.apariciones.join(" · ")}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        !cargando && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            {cargando ? (
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" aria-hidden />
            ) : (
              <p className="max-w-sm text-[13px] leading-relaxed text-slate-400">
                {t("La clasificación está vacía: las fuentes no respondieron. Prueba otro filtro o reintenta.")}
              </p>
            )}
          </div>
        )
      )}
    </section>
  );
}
