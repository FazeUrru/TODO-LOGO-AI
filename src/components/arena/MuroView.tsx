"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BrickWall,
  Swords,
  Trophy,
  Share2,
  Eye,
  Crown,
  CalendarDays,
  Loader2,
  ArrowRight,
} from "lucide-react";
import ProviderLogo from "./ProviderLogo";
import { getModel } from "@/lib/models-data";
import { cn } from "@/lib/utils";

/**
 * v1.19.0 — Muro público de replays (/muro).
 *
 * Los duelos y copas más compartidos por la comunidad, en tarjetas: prompt,
 * contendientes revelados con su corona y sus contadores de difusión. Cada
 * tarjeta enlaza al replay permanente (/duelo/[id]) — funciona igual en la
 * instancia con backend y en la demo estática (selección fundacional).
 */

interface TarjetaMuro {
  id: string;
  tipo: "duelo" | "copa";
  prompt: string;
  category: string;
  modelAId: string | null;
  modelBId: string | null;
  ganador: string | null;
  championModelId: string | null;
  copaSize: number | null;
  shares: number;
  views: number;
  createdAt: string;
  oficial: boolean;
}

interface MuroData {
  ok: true;
  replays: TarjetaMuro[];
  stats: { totalCompartidos: number; totalVistas: number; total: number };
}

export default function MuroView() {
  const [data, setData] = useState<MuroData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/share?limit=24")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok || !d.ok) throw new Error(d.error ?? "El muro no respondió.");
        return d as MuroData;
      })
      .then(setData)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "No se pudo cargar el muro.")
      );
  }, []);

  const fechaCorta = (iso: string) =>
    new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-[900px]">
          {/* Cabecera */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="flex items-center gap-2.5 font-display text-[32px] font-medium tracking-tight">
              <BrickWall className="h-7 w-7" /> Muro de replays
            </h1>
          </div>
          <p className="mt-2 max-w-[680px] text-[14px] leading-relaxed text-foreground/85">
            Los duelos y copas que la comunidad más ha difundido, con identidades
            reveladas y veredicto incluido. Comparte el tuyo con el botón{" "}
            <span className="font-medium">«Compartir replay»</span> tras votar: cada
            difusión suma aquí y alimenta el ranking de los más compartidos.
          </p>

          {data && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Swords className="h-3.5 w-3.5" /> {data.stats.total} replays
              </span>
              <span className="flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5" />{" "}
                {data.stats.totalCompartidos.toLocaleString("es-ES")} compartidos
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />{" "}
                {data.stats.totalVistas.toLocaleString("es-ES")} vistas
              </span>
            </div>
          )}

          {/* Estados */}
          {error && (
            <div className="mt-5 rounded-xl border border-border bg-card p-5 text-center">
              <p className="text-[14px] font-medium">El muro no cargó esta vez</p>
              <p className="mt-1 text-[13px] text-muted-foreground">{error}</p>
            </div>
          )}
          {!data && !error && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-[190px] rounded-2xl" />
              ))}
            </div>
          )}
          {data && data.replays.length === 0 && (
            <div className="mt-5 rounded-xl border border-dashed border-border bg-card p-8 text-center">
              <BrickWall className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-[14px] font-medium">El muro está vacío… por ahora</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Gana una batalla o una copa y estrena el primer replay compartido.
              </p>
            </div>
          )}

          {/* Rejilla de replays */}
          {data && data.replays.length > 0 && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {data.replays.map((t, i) => (
                <Link
                  key={t.id}
                  href={`/duelo/${t.id}`}
                  className="group flex flex-col rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/30"
                >
                  {/* Chips superiores */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {i < 3 && (
                      <span className="rounded-md bg-highlight px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#2E2B29]">
                        ★ Top {i + 1}
                      </span>
                    )}
                    <span
                      className={cn(
                        "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold uppercase",
                        t.tipo === "copa" ? "bg-amber-500/15 text-amber-700" : "bg-secondary"
                      )}
                    >
                      {t.tipo === "copa" ? (
                        <>
                          <Trophy className="h-3 w-3" /> Copa de {t.copaSize ?? 4}
                        </>
                      ) : (
                        <>
                          <Swords className="h-3 w-3" /> Duelo
                        </>
                      )}
                    </span>
                    {t.tipo === "duelo" && t.category !== "global" && (
                      <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10.5px] font-medium capitalize">
                        {t.category}
                      </span>
                    )}
                    <span className="ml-auto flex items-center gap-1 text-[10.5px] text-muted-foreground">
                      <CalendarDays className="h-3 w-3" /> {fechaCorta(t.createdAt)}
                    </span>
                  </div>

                  {/* Prompt */}
                  <p className="mt-2.5 line-clamp-2 text-[13.5px] leading-snug text-foreground/90">
                    «{t.prompt}»
                  </p>

                  {/* Contendientes o campeón */}
                  <div className="mt-3 flex-1">
                    {t.tipo === "duelo" ? (
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <Contendiente id={t.modelAId} gana={t.ganador === "A"} />
                        <span className="font-mono text-[10px] text-muted-foreground">VS</span>
                        <Contendiente id={t.modelBId} gana={t.ganador === "B"} />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/5 px-3 py-2">
                        <Trophy className="h-4 w-4 shrink-0 text-amber-500" />
                        <ProviderLogo provider={getModel(t.championModelId ?? "")?.provider ?? ""} size={18} />
                        <span className="truncate font-mono text-[12.5px] font-medium">
                          {getModel(t.championModelId ?? "")?.name ?? "—"}
                        </span>
                        <span className="ml-auto text-[10.5px] text-muted-foreground">campeón</span>
                      </div>
                    )}
                  </div>

                  {/* Contadores */}
                  <div className="mt-3 flex items-center gap-3 border-t border-border pt-2.5 text-[11.5px] text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium">
                      <Share2 className="h-3 w-3" /> {t.shares.toLocaleString("es-ES")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {t.views.toLocaleString("es-ES")}
                    </span>
                    <span className="ml-auto flex items-center gap-1 font-medium text-foreground/70 transition-colors group-hover:text-foreground">
                      Ver replay <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[11.5px] text-muted-foreground">
            <Loader2 className="hidden" />
            Los replays se publican tras votar: identidades reveladas, ELO real y veredicto permanente.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Mitad de un duelo en la tarjeta: logo + nombre + corona si ganó. */
function Contendiente({ id, gana }: { id: string | null; gana: boolean }) {
  const m = id ? getModel(id) : null;
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-1.5 rounded-lg border px-2 py-1.5",
        gana ? "border-emerald-600/50 bg-emerald-600/5" : "border-border"
      )}
    >
      <ProviderLogo provider={m?.provider ?? ""} size={14} />
      <span className="truncate font-mono text-[11.5px] font-medium" title={m?.name ?? id ?? "—"}>
        {m?.name ?? "—"}
      </span>
      {gana && <Crown className="h-3 w-3 shrink-0 text-emerald-600" />}
    </div>
  );
}
