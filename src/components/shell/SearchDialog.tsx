"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, Zap } from "lucide-react";
import { MODELS, PROVIDERS, formatContext, esGenerativo } from "@/lib/models-data";
import { useArena } from "./arena-context";
import ProviderLogo from "@/components/arena/ProviderLogo";
import { cn } from "@/lib/utils";

/** Diálogo de búsqueda de modelos (command palette estilo lmarena). */
export default function SearchDialog() {
  const arena = useArena();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") arena.setSearchOpen(false);
    };
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        arena.setSearchOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDoc);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDoc);
    };
  }, [arena]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MODELS.slice(0, 10);
    return MODELS.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (PROVIDERS[m.provider]?.name ?? "").toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q)) ||
        m.desc.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [query]);

  const detail = MODELS.find((m) => m.id === selected);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-[10vh]">
      <div
        ref={ref}
        className="fade-up w-full max-w-[620px] overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl shadow-black/15"
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
          <Search className="h-[18px] w-[18px] text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0] && !detail)
                setSelected(results[0].id);
            }}
            placeholder={`Buscar entre ${MODELS.length} modelos: nombre, organización, especialidad…`}
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={() => arena.setSearchOpen(false)}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Cerrar buscador"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="scrollbar-thin max-h-[46vh] overflow-y-auto p-2">
          {detail ? (
            <div className="fade-up p-2">
              <button
                onClick={() => setSelected(null)}
                className="mb-2 text-[12.5px] text-muted-foreground hover:text-foreground"
              >
                ← Volver a resultados
              </button>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <ProviderLogo provider={detail.provider} size={34} className="mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-mono text-[17px] font-semibold">{detail.name}</h3>
                      {detail.isNew && (
                        <span className="rounded bg-highlight px-1.5 py-0.5 text-[10px] font-bold uppercase">
                          Nuevo
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      {PROVIDERS[detail.provider]?.name} ·{" "}
                      {detail.license === "abierto" ? "Pesos abiertos" : "Propietario"} ·{" "}
                      {detail.released}
                    </p>
                  </div>
                </div>
                <span className="rounded-lg bg-secondary px-2.5 py-1 font-mono text-[13px] font-semibold">
                  ELO {detail.elo}
                </span>
              </div>
              <p className="mt-3 text-[13.5px] leading-relaxed">{detail.desc}</p>
              {/* v1.15.0: los generativos muestran sus especificaciones reales
                  (segundos, resoluciones, precio por unidad) en vez de tokens. */}
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(detail.especs
                  ? ([
                      ["Modalidad", detail.categories.includes("video") ? "Vídeo" : detail.categories.includes("imagen") ? "Imagen" : "Audio"],
                      ["Especificaciones", detail.especs],
                      ["Precio", detail.precioNota ?? "—"],
                      ["Lanzamiento", detail.released],
                    ] as const)
                  : ([
                      ["Contexto", formatContext(detail.context)],
                      ["Salida máx.", formatContext(detail.maxOutput)],
                      ["Entrada", `$${detail.priceIn}/1M`],
                      ["Salida", `$${detail.priceOut}/1M`],
                    ] as const)
                ).map(([k, v]: readonly [string, string]) => (
                  <div key={k} className="rounded-lg border border-border px-3 py-2">
                    <p className="text-[10.5px] uppercase tracking-wide text-muted-foreground">
                      {k}
                    </p>
                    <p className="mt-0.5 font-mono text-[13px] font-medium">{v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {detail.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-secondary px-2.5 py-0.5 text-[11.5px] text-foreground/80"
                  >
                    {t}
                  </span>
                ))}
              </div>
              {esGenerativo(detail) ? (
                /* v1.17.1 — los generativos no chatean: sin «Chatear ahora».
                   Su sitio es su arena específica del leaderboard (imagen,
                   vídeo o audio), no el chat de texto ni el modo Directo. */
                <div className="mt-4">
                  <p className="rounded-lg bg-secondary px-3 py-2.5 text-[13px] leading-relaxed text-foreground/85">
                    <span className="font-medium">{detail.name}</span> es un modelo generativo:
                    no conversa por texto. Compite y recibe votos en la arena de{" "}
                    <span className="font-medium">
                      {detail.categories.includes("video")
                        ? "vídeo"
                        : detail.categories.includes("audio")
                          ? "audio"
                          : "imagen"}
                    </span>{" "}
                    del leaderboard, y se usa para generar desde su modo específico
                    (imagen, vídeo o voz del composer).
                  </p>
                  <button
                    onClick={() => {
                      arena.setSearchOpen(false);
                      router.push("/leaderboard");
                    }}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card py-2.5 text-[14px] font-medium hover:bg-accent"
                  >
                    <Zap className="h-4 w-4" />
                    Ver su arena en el leaderboard
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    arena.setModelDirectId(detail.id);
                    arena.setMode("direct");
                    arena.setSearchOpen(false);
                    router.push("/");
                  }}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-[14px] font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Zap className="h-4 w-4" />
                  Chatear ahora con {detail.name}
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <>
              {results.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelected(m.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <ProviderLogo provider={m.provider} size={18} />
                    <span className="truncate font-mono text-[13.5px]">{m.name}</span>
                    <span className="hidden truncate text-[12.5px] text-muted-foreground sm:inline">
                      {PROVIDERS[m.provider]?.name}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {m.license === "abierto" && (
                      <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-foreground/70">
                        Abierto
                      </span>
                    )}
                    <span className="font-mono text-[12px] text-muted-foreground">
                      {m.elo}
                    </span>
                  </span>
                </button>
              ))}
              {results.length === 0 && (
                <p className="px-3 py-10 text-center text-[13.5px] text-muted-foreground">
                  Ningún modelo coincide con «{query}».
                </p>
              )}
            </>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11.5px] text-muted-foreground">
          <span>
            {MODELS.length} modelos · {new Set(MODELS.map((m) => m.provider)).size} organizaciones
          </span>
          <span>
            <kbd className="rounded border border-border px-1 py-0.5 font-mono">Esc</kbd>{" "}
            para cerrar
          </span>
        </div>
      </div>
    </div>
  );
}
