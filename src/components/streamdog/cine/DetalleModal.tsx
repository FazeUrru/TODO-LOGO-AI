"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, ExternalLink, Film, Loader2, Play, Plus, Star, Tv, X, Check } from "lucide-react";
import { jsonSeguro } from "@/lib/fetch-seguro";
import { detalleCommonsCliente } from "@/lib/streamdog/cine-cliente";
import type { EpisodioCine, ItemCine } from "@/lib/streamdog/cine";
import { traducirCine, traducirGenero, type IdiomaCine } from "@/lib/streamdog/cine-i18n";
import { cn } from "@/lib/utils";

/**
 * FICHA DETALLADA (v1.32.0): sinopsis, metadatos, géneros traducidos,
 * episodios agrupados por temporada (series de TVMaze) y acciones:
 * Reproducir (si hay vídeo real), Ver en el origen y Mi lista.
 */

interface Props {
  item: ItemCine;
  idioma: IdiomaCine;
  enMiLista: boolean;
  onCerrar: () => void;
  onReproducir: (item: ItemCine, videoUrl: string | null, mime: string | null) => void;
  onMiLista: (item: ItemCine) => void;
}

interface DetalleDatos {
  item: ItemCine;
  episodios?: EpisodioCine[];
  videoUrl?: string | null;
  mime?: string | null;
}

export default function DetalleModal({ item, idioma, enMiLista, onCerrar, onReproducir, onMiLista }: Props) {
  const [datos, setDatos] = useState<DetalleDatos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [temporada, setTemporada] = useState(1);

  const t = (clave: string, vars?: Record<string, string | number>): string => traducirCine(clave, idioma, vars);

  useEffect(() => {
    const control = new AbortController();
    setCargando(true);
    setError(null);
    setDatos(null);
    (async () => {
      try {
        const salida = await jsonSeguro<DetalleDatos & { ok: boolean; motivo?: string; error?: string }>(
          await fetch(`/api/streamdog/cine/detalle?id=${encodeURIComponent(item.id)}`, { signal: control.signal }),
          "detalle"
        );
        if (!salida.ok || !salida.item) {
          // PLAN B: Commons bloquea por huella TLS a los servidores; el
          // navegador real pasa siempre → la ficha se pide desde aquí.
          if (item.id.startsWith("commons:")) {
            const directo = await detalleCommonsCliente(item.id, control.signal);
            if (directo) {
              setDatos(directo);
              setCargando(false);
              return;
            }
          }
          setError(salida.error ?? "La ficha no está disponible ahora mismo.");
          return;
        }
        setDatos(salida);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError(e instanceof Error ? e.message : "Error inesperado.");
      } finally {
        setCargando(false);
      }
    })();
    return () => control.abort();
  }, [item.id]);

  const ficha = datos?.item ?? item;
  const episodiosDeTemporada = useMemo(
    () => (datos?.episodios ?? []).filter((e) => e.temporada === temporada).sort((a, b) => a.numero - b.numero),
    [datos, temporada]
  );
  const temporadas = useMemo(() => [...new Set((datos?.episodios ?? []).map((e) => e.temporada))].sort((a, b) => a - b), [datos]);
  const hayVideo = Boolean(datos?.videoUrl);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-950/85 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={ficha.titulo}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div className="relative my-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#0a1322] shadow-2xl shadow-cyan-500/5">
        {/* Fondo del encabezado */}
        <div className="relative">
          {ficha.imagen ? (
            <div className="relative h-44 w-full overflow-hidden sm:h-56">
              <img src={ficha.imagen} alt="" aria-hidden className="h-full w-full scale-110 object-cover blur-[2px] saturate-75" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1322] via-[#0a1322]/60 to-transparent" />
              <img
                src={ficha.imagen}
                alt={`Póster de ${ficha.titulo}`}
                className="absolute bottom-3 left-4 hidden h-36 rounded-lg border border-white/15 object-cover shadow-xl sm:block sm:h-40"
              />
            </div>
          ) : (
            <div className="h-28 w-full bg-gradient-to-br from-slate-800 to-[#0a1322]" />
          )}
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar ficha"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-slate-950/70 text-slate-200 backdrop-blur-sm transition-colors hover:border-white/40 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="relative -mt-8 space-y-4 p-4 sm:p-6 sm:pt-4">
          <div>
            <h2 className="font-display text-[22px] font-semibold leading-tight tracking-tight text-slate-50">{ficha.titulo}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-slate-400">
              {ficha.anyo && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                  {ficha.anyo}
                </span>
              )}
              {ficha.duracionMin && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  {ficha.duracionMin} {t("min")}
                </span>
              )}
              {ficha.valoracion !== null && (
                <span className="inline-flex items-center gap-1 font-medium text-amber-300">
                  <Star className="h-3.5 w-3.5" fill="currentColor" aria-hidden />
                  {ficha.valoracion.toFixed(1)}/10
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                {ficha.tipo === "serie" ? <Tv className="h-3.5 w-3.5" aria-hidden /> : <Film className="h-3.5 w-3.5" aria-hidden />}
                {ficha.fuente === "tvmaze" ? "TVMaze" : t("Dominio público")}
              </span>
            </div>
          </div>

          {cargando ? (
            <div className="flex items-center gap-2 py-6 text-[13px] text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-300" aria-hidden />
              {t("Cargando catálogo…")}
            </div>
          ) : error ? (
            <p className="rounded-xl border border-rose-400/25 bg-rose-500/[0.07] p-3 text-[13px] text-rose-200">{error}</p>
          ) : (
            <>
              {/* Acciones */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onReproducir(ficha, datos?.videoUrl ?? null, datos?.mime ?? null)}
                  disabled={!hayVideo}
                  title={hayVideo ? undefined : t("No hay vídeo disponible para esta ficha")}
                  className={cn(
                    "inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold transition-colors",
                    hayVideo
                      ? "bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 hover:from-cyan-300 hover:to-emerald-300"
                      : "cursor-not-allowed border border-white/10 bg-white/[0.04] text-slate-500"
                  )}
                >
                  <Play className="h-4 w-4" fill="currentColor" aria-hidden />
                  {t("Reproducir")}
                </button>
                <button
                  type="button"
                  onClick={() => onMiLista(ficha)}
                  aria-pressed={enMiLista}
                  className={cn(
                    "inline-flex min-h-[40px] items-center gap-2 rounded-xl border px-3.5 text-[13px] font-medium transition-colors",
                    enMiLista
                      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                      : "border-white/15 bg-white/[0.04] text-slate-200 hover:border-white/30"
                  )}
                >
                  {enMiLista ? <Check className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
                  {enMiLista ? t("En mi lista") : t("Añadir a mi lista")}
                </button>
                {ficha.enlaceOrigen && (
                  <a
                    href={ficha.enlaceOrigen}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3.5 text-[13px] font-medium text-slate-200 transition-colors hover:border-white/30"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden />
                    {t("Ver en el origen")}
                  </a>
                )}
              </div>

              {ficha.generos.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {ficha.generos.map((g) => (
                    <span key={g} className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-[11px] text-slate-300">
                      {traducirGenero(g, idioma)}
                    </span>
                  ))}
                </div>
              )}

              {ficha.sinopsis && (
                <p className="max-h-40 overflow-y-auto text-[13.5px] leading-relaxed text-slate-300 scrollbar-thin">{ficha.sinopsis}</p>
              )}

              {/* Episodios de series */}
              {temporadas.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-semibold text-slate-100">{t("Episodios")}</h3>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10.5px] text-slate-400">{datos?.episodios?.length ?? 0}</span>
                    {temporadas.length > 1 && (
                      <select
                        value={temporada}
                        onChange={(e) => setTemporada(Number.parseInt(e.target.value, 10))}
                        aria-label={t("Temporada")}
                        className="ml-auto rounded-lg border border-white/15 bg-[#0d1728] px-2.5 py-1.5 text-[12px] text-slate-200"
                      >
                        {temporadas.map((n) => (
                          <option key={n} value={n}>
                            {t("Temporada")} {n}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <ol className="max-h-64 space-y-1.5 overflow-y-auto pr-1 scrollbar-thin">
                    {episodiosDeTemporada.map((ep) => (
                      <li key={`${ep.temporada}-${ep.numero}`} className="rounded-lg border border-white/[0.07] bg-white/[0.03] p-2.5">
                        <p className="text-[12.5px] font-medium text-slate-200">
                          <span className="mr-1.5 inline-block min-w-[38px] text-[11px] font-semibold text-cyan-300/80">
                            {ep.numero > 0 ? `T${ep.temporada}·E${ep.numero}` : `T${ep.temporada}`}
                          </span>
                          {ep.titulo}
                          {ep.fecha && <span className="ml-2 text-[10.5px] font-normal text-slate-500">{ep.fecha}</span>}
                        </p>
                        {ep.sinopsis && <p className="mt-0.5 line-clamp-2 pl-[46px] text-[11px] leading-relaxed text-slate-400">{ep.sinopsis}</p>}
                      </li>
                    ))}
                    {episodiosDeTemporada.length === 0 && <li className="p-2 text-[12px] text-slate-500">—</li>}
                  </ol>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
