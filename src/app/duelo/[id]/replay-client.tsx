"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Swords, RotateCcw, Copy, Check, Crown, CalendarDays, Share2, Eye } from "lucide-react";
import { useParams } from "next/navigation";
import Markdown from "@/components/arena/Markdown";
import ProviderLogo from "@/components/arena/ProviderLogo";
import { getModel, PROVIDERS } from "@/lib/models-data";
import { cn } from "@/lib/utils";

/**
 * v1.18.0 — Replay público de un duelo o copa compartida (/duelo/[id]).
 *
 * URL permanente: muestra las identidades reveladas, los textos completos y
 * el veredicto. En la demo estática de GitHub Pages no hay backend, así que
 * la lectura falla con honestidad y enlaza a la instancia oficial.
 */

interface DueloData {
  ok: true;
  tipo: "duelo";
  id: string;
  prompt: string;
  category: string;
  composerMode: string;
  modelAId: string;
  modelBId: string | null;
  textoA: string;
  textoB: string | null;
  ganador: "A" | "B" | "tie" | "bad" | null;
  createdAt: string;
}

interface CopaData {
  ok: true;
  tipo: "copa";
  id: string;
  prompt: string;
  createdAt: string;
  copa: {
    id: string;
    prompt: string;
    size: number;
    rounds: {
      key: string;
      a: { modelId: string; label: string; text: string };
      b: { modelId: string; label: string; text: string };
      winner?: "a" | "b";
    }[][];
    championModelId?: string;
  };
}

type ReplayData = DueloData | CopaData;

export default function DueloReplayClient() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ReplayData | null>(null);
  const [error, setError] = useState<string>("");
  const [copiado, setCopiado] = useState(false);
  const [contadores, setContadores] = useState<{ shares: number; views: number } | null>(null);

  useEffect(() => {
    const id = params.id ?? "";
    fetch(`/api/share/${encodeURIComponent(id)}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok || !d.ok) throw new Error(d.error ?? "Replay no encontrado.");
        return d as ReplayData;
      })
      .then((d) => {
        setData(d);
        // v1.19.0 — contadores del muro: +1 vista por visita (una por sesión
        // de navegador); los compartidos llegan al volver a difundir el enlace.
        const clave = `todologo.vista.${id}`;
        const primeraVez = !window.sessionStorage.getItem(clave);
        if (primeraVez) {
          window.sessionStorage.setItem(clave, "1");
          fetch(`/api/share/${encodeURIComponent(id)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accion: "vista" }),
          })
            .then(async (r) => {
              const d2 = await r.json();
              if (r.ok && d2.ok) setContadores({ shares: d2.shares, views: d2.views });
            })
            .catch(() => {});
        }
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Replay no encontrado."));
  }, []);

  function compartir() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
        // v1.19.0 — cada difusión suma al muro de replays
        fetch(`/api/share/${encodeURIComponent(params.id ?? "")}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accion: "compartir" }),
        })
          .then(async (r) => {
            const d = await r.json();
            if (r.ok && d.ok) setContadores({ shares: d.shares, views: d.views });
          })
          .catch(() => {});
      })
      .catch(() => {});
  }

  const fecha = data ? new Date(data.createdAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }) : "";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[900px] items-center justify-between px-4 py-3.5">
          <Link href="/" className="flex items-center gap-2 font-display text-[17px] font-semibold">
            <Swords className="h-4.5 w-4.5" /> todólogo<span className="text-amber-500">.ai</span>
          </Link>
          {data && (
            <div className="flex items-center gap-2">
              {contadores && (
                <span className="hidden items-center gap-2 font-mono text-[11.5px] text-muted-foreground sm:flex">
                  <span className="flex items-center gap-1">
                    <Share2 className="h-3 w-3" /> {contadores.shares.toLocaleString("es-ES")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {contadores.views.toLocaleString("es-ES")}
                  </span>
                </span>
              )}
              <button
                onClick={compartir}
                className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] font-medium hover:bg-accent"
              >
                {copiado ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copiado ? "Enlace copiado" : "Compartir replay"}
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-4 py-8">
        {error && (
          <div className="mx-auto max-w-[560px] rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-[15px] font-medium">Este replay no existe (o no llegó hasta aquí)</p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
              {error} Si lo compartieron desde la demo estática, el replay solo vive en la
              instancia oficial con backend.
            </p>
            <a
              href="https://todo-logo-ai.vercel.app/"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13.5px] font-medium text-primary-foreground"
            >
              Abrir la instancia oficial
            </a>
          </div>
        )}

        {!data && !error && (
          <div className="mx-auto max-w-[560px] space-y-3">
            <div className="skeleton h-16 w-full rounded-xl" />
            <div className="skeleton h-[280px] w-full rounded-xl" />
          </div>
        )}

        {data?.tipo === "duelo" && (
          <DueloReplay d={data} fecha={fecha} />
        )}
        {data?.tipo === "copa" && (
          <CopaReplay c={data} fecha={fecha} />
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-[12.5px] text-muted-foreground">
        Replay permanente · los ELO son reales y nacen de votos ciegos de la comunidad
      </footer>
    </div>
  );
}

/* ── Replay de un duelo 1×1 ── */
function DueloReplay({ d, fecha }: { d: DueloData; fecha: string }) {
  const mA = getModel(d.modelAId);
  const mB = d.modelBId ? getModel(d.modelBId) : null;
  const ganaA = d.ganador === "A";
  const ganaB = d.ganador === "B";

  return (
    <div>
      <p className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" /> {fecha}
        </span>
        <span className="rounded-md bg-secondary px-2 py-0.5 font-medium capitalize">
          {d.category === "global" ? "General" : d.category}
        </span>
        {d.composerMode !== "texto" && (
          <span className="rounded-md bg-secondary px-2 py-0.5 font-medium capitalize">
            {d.composerMode}
          </span>
        )}
        {d.ganador === "tie" && <span className="rounded-md bg-secondary px-2 py-0.5 font-medium">Empate</span>}
        {d.ganador === "bad" && <span className="rounded-md bg-secondary px-2 py-0.5 font-medium">Ambos malos</span>}
      </p>

      {/* Prompt original */}
      <div className="mt-4 rounded-xl border border-border bg-card px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Prompt original
        </p>
        <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed">{d.prompt}</p>
      </div>

      {/* Respuestas con identidades reveladas */}
      <div className={cn("mt-4 grid gap-3", mB && "lg:grid-cols-2")}>
        <PanelReplay
          nombre={mA?.name ?? d.modelAId}
          provider={mA?.provider ?? ""}
          elo={mA?.elo}
          texto={d.textoA}
          etiqueta="Modelo A"
          gana={ganaA}
        />
        {mB && (
          <PanelReplay
            nombre={mB.name}
            provider={mB.provider}
            elo={mB.elo}
            texto={d.textoB ?? ""}
            etiqueta="Modelo B"
            gana={ganaB}
          />
        )}
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-[14px] font-medium text-background hover:opacity-90"
        >
          <RotateCcw className="h-4 w-4" /> Correr tu propio duelo
        </Link>
      </div>
    </div>
  );
}

function PanelReplay({
  nombre,
  provider,
  elo,
  texto,
  etiqueta,
  gana,
}: {
  nombre: string;
  provider: string;
  elo?: number;
  texto: string;
  etiqueta: string;
  gana: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card",
        gana ? "border-emerald-600/60 ring-1 ring-emerald-600/30" : "border-border"
      )}
    >
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border">
          <ProviderLogo provider={provider} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium">{nombre}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            {PROVIDERS[provider]?.name ?? provider}
            {typeof elo === "number" ? ` · ELO ${elo}` : ""}
          </p>
        </div>
        {gana && (
          <span className="flex shrink-0 items-center gap-1 rounded-md bg-emerald-600/10 px-2 py-1 text-[11.5px] font-semibold text-emerald-700">
            <Crown className="h-3.5 w-3.5" /> Ganador
          </span>
        )}
      </div>
      <div className="px-4 py-3 text-[14px] leading-relaxed">
        <Markdown>{texto || "—"}</Markdown>
      </div>
      <p className="px-4 pb-3 text-[11px] text-muted-foreground">{etiqueta} · identidad revelada en el replay</p>
    </div>
  );
}

/* ── Replay completo de una copa ── */
function CopaReplay({ c, fecha }: { c: CopaData; fecha: string }) {
  const copa = c.copa;
  const champ = copa.championModelId ? getModel(copa.championModelId) : null;
  const nombresRonda = ["Cuartos de final", "Semifinales", "Gran final"].slice(-copa.rounds.length);

  return (
    <div>
      <p className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" /> {fecha}
        </span>
        <span className="rounded-md bg-secondary px-2 py-0.5 font-medium">
          Copa Todólogo de {copa.size}
        </span>
      </p>

      <div className="mt-4 rounded-xl border border-amber-500/40 bg-card px-4 py-5 text-center">
        <Trophy className="mx-auto h-8 w-8 text-amber-500" />
        <p className="mt-2 text-[11.5px] font-medium uppercase tracking-widest text-muted-foreground">
          Campeón
        </p>
        <div className="mt-1 flex items-center justify-center gap-2.5">
          <ProviderLogo provider={champ?.provider ?? ""} size={26} />
          <span className="font-display text-[28px] font-semibold leading-none">
            {champ?.name ?? "—"}
          </span>
        </div>
      </div>

      {/* Prompt original */}
      <div className="mt-4 rounded-xl border border-border bg-card px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Consigna de la copa
        </p>
        <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed">{c.prompt}</p>
      </div>

      {/* Cuadro completo, ronda a ronda */}
      {copa.rounds.map((ronda, ri) => (
        <section key={ri} className="mt-6">
          <h2 className="text-[15px] font-medium">{nombresRonda[ri]}</h2>
          <div className="mt-2 space-y-3">
            {ronda.map((duelo) => (
              <div key={duelo.key} className="rounded-xl border border-border bg-card">
                <div className="grid gap-0 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                  {(["a", "b"] as const).map((lado) => {
                    const cto = duelo[lado];
                    const m = getModel(cto.modelId);
                    const gana = duelo.winner === lado;
                    return (
                      <div key={lado} className={cn("px-4 py-3", gana && "bg-emerald-600/5")}>
                        <div className="flex items-center gap-2">
                          <ProviderLogo provider={m?.provider ?? ""} size={16} />
                          <span className="truncate font-mono text-[12.5px] font-medium">
                            {m?.name ?? cto.modelId}
                          </span>
                          <span className="rounded bg-secondary px-1.5 py-px text-[10px] text-muted-foreground">
                            {cto.label}
                          </span>
                          {gana && <Crown className="ml-auto h-3.5 w-3.5 shrink-0 text-emerald-600" />}
                        </div>
                        <div className="mt-2 text-[13.5px] leading-relaxed">
                          <Markdown>{cto.text || "—"}</Markdown>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="mt-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-[14px] font-medium text-background hover:opacity-90"
        >
          <RotateCcw className="h-4 w-4" /> Jugar tu propia copa
        </Link>
      </div>
    </div>
  );
}
