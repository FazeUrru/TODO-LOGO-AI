"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Swords,
  RotateCcw,
  Copy,
  Check,
  Crown,
  CalendarDays,
  Share2,
  Eye,
  MessagesSquare,
  User,
} from "lucide-react";
import { useParams } from "next/navigation";
import Markdown from "@/components/arena/Markdown";
import ProviderLogo from "@/components/arena/ProviderLogo";
import { getModel, PROVIDERS } from "@/lib/models-data";
import { cn } from "@/lib/utils";
import type { TurnoGuardable } from "@/lib/hilo-conversacion";
import { jsonSeguro } from "@/lib/fetch-seguro";

/**
 * v1.25.0 — El hilo permanente: visor público de una conversación (/c/[id]).
 *
 * URL permanente que abre la conversación TAL CUAL ocurrió: cada mensaje del
 * usuario y cada respuesta de cada modelo, en su orden, con markdown y las
 * identidades reveladas. En la demo estática de GitHub Pages no hay backend,
 * así que la lectura falla con honestidad y enlaza a la instancia oficial.
 */

interface ConversacionData {
  ok: true;
  tipo: "conversacion";
  id: string;
  prompt: string;
  category: string;
  composerMode: string;
  modelAId: string;
  modelBId: string | null;
  turnosA: TurnoGuardable[];
  turnosB: TurnoGuardable[];
  ganador: "A" | "B" | "tie" | "bad" | null;
  createdAt: string;
}

export default function ConversacionClient() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ConversacionData | null>(null);
  const [error, setError] = useState<string>("");
  const [copiado, setCopiado] = useState(false);
  const [contadores, setContadores] = useState<{ shares: number; views: number } | null>(null);

  useEffect(() => {
    const id = params.id ?? "";
    fetch(`/api/conversacion/${encodeURIComponent(id)}`)
      .then(async (r) => {
        const d = await jsonSeguro<ConversacionData & { error?: string }>(r);
        if (!r.ok || !d.ok) throw new Error(d.error ?? "Conversación no encontrada.");
        return d;
      })
      .then((d) => {
        setData(d);
        // +1 vista por visita (una por sesión de navegador), como en los replays
        const clave = `todologo.vista.c.${id}`;
        const primeraVez = !window.sessionStorage.getItem(clave);
        if (primeraVez) {
          window.sessionStorage.setItem(clave, "1");
          fetch(`/api/conversacion/${encodeURIComponent(id)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accion: "vista" }),
          })
            .then(async (r) => {
              const d2 = await jsonSeguro<{ ok: boolean; shares: number; views: number }>(r);
              if (r.ok && d2.ok) setContadores({ shares: d2.shares, views: d2.views });
            })
            .catch(() => {});
        }
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Conversación no encontrada.")
      );
  }, []);

  function compartir() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
        // cada difusión suma al contador público del link
        fetch(`/api/conversacion/${encodeURIComponent(params.id ?? "")}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accion: "compartir" }),
        })
          .then(async (r) => {
            const d = await jsonSeguro<{ ok: boolean; shares: number; views: number }>(r);
            if (r.ok && d.ok) setContadores({ shares: d.shares, views: d.views });
          })
          .catch(() => {});
      })
      .catch(() => {});
  }

  const fecha = data
    ? new Date(data.createdAt).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const nMensajes = data ? data.turnosA.length : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-3.5">
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
                {copiado ? "Enlace copiado" : "Compartir conversación"}
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-4 py-8">
        {error && (
          <div className="mx-auto max-w-[560px] rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-[15px] font-medium">Esta conversación no existe (o no llegó hasta aquí)</p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
              {error} Si el link se compartió desde la demo estática, la conversación solo
              vive en la instancia oficial con backend.
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

        {data && (
          <div>
            {/* Cabecera del link: título natural + metadatos */}
            <p className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" /> {fecha}
              </span>
              <span className="flex items-center gap-1.5">
                <MessagesSquare className="h-3.5 w-3.5" /> {nMensajes} mensajes
              </span>
              <span className="rounded-md bg-secondary px-2 py-0.5 font-medium capitalize">
                {data.category === "global" ? "General" : data.category}
              </span>
              {data.composerMode !== "texto" && (
                <span className="rounded-md bg-secondary px-2 py-0.5 font-medium capitalize">
                  {data.composerMode}
                </span>
              )}
              {data.ganador === "tie" && (
                <span className="rounded-md bg-secondary px-2 py-0.5 font-medium">Empate</span>
              )}
              {data.ganador === "bad" && (
                <span className="rounded-md bg-secondary px-2 py-0.5 font-medium">Ambos malos</span>
              )}
            </p>

            <h1 className="mt-3 text-[20px] font-semibold leading-snug sm:text-[23px]">
              {data.prompt}
            </h1>

            {/* El hilo completo: lado a lado en el duelo 1×1, hilo único si solo hay un modelo */}
            <div className={cn("mt-5 grid gap-4", data.modelBId && "xl:grid-cols-2")}>
              <PanelHilo
                titulo={data.turnosA.length > 0 ? "Conversación completa" : "Conversación"}
                modelId={data.modelAId}
                turnos={data.turnosA}
                gana={data.ganador === "A"}
              />
              {data.modelBId && (
                <PanelHilo
                  titulo="Conversación completa"
                  modelId={data.modelBId}
                  turnos={data.turnosB}
                  gana={data.ganador === "B"}
                />
              )}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-[14px] font-medium text-background hover:opacity-90"
              >
                <RotateCcw className="h-4 w-4" /> Librar tu propia batalla
              </Link>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border py-6 text-center text-[12.5px] text-muted-foreground">
        Link permanente · la conversación se conserva tal cual ocurrió
      </footer>
    </div>
  );
}

/* ── Un lado del hilo: todos los turnos de un modelo, en orden ── */
function PanelHilo({
  titulo,
  modelId,
  turnos,
  gana,
}: {
  titulo: string;
  modelId: string;
  turnos: TurnoGuardable[];
  gana: boolean;
}) {
  const m = getModel(modelId);
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card",
        gana ? "border-emerald-600/60 ring-1 ring-emerald-600/30" : "border-border"
      )}
    >
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border">
          <ProviderLogo provider={m?.provider ?? ""} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-medium">{m?.name ?? modelId}</p>
          <p className="font-mono text-[11px] text-muted-foreground">
            {PROVIDERS[m?.provider ?? ""]?.name ?? m?.provider ?? ""}
            {typeof m?.elo === "number" ? ` · ELO ${m.elo}` : ""}
          </p>
        </div>
        {gana && (
          <span className="flex shrink-0 items-center gap-1 rounded-md bg-emerald-600/10 px-2 py-1 text-[11.5px] font-semibold text-emerald-700">
            <Crown className="h-3.5 w-3.5" /> Ganador
          </span>
        )}
      </div>

      <div className="space-y-4 px-4 py-4">
        {turnos.length === 0 && (
          <p className="text-[13.5px] text-muted-foreground">Este hilo llegó vacío.</p>
        )}
        {turnos.map((t, i) =>
          t.role === "user" ? (
            <div key={i} className="ml-auto max-w-[92%] rounded-xl bg-secondary/70 px-3.5 py-2.5">
              <p className="flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
                <User className="h-3 w-3" /> Tú
              </p>
              <p className="mt-1 whitespace-pre-wrap text-[13.5px] leading-relaxed">{t.content}</p>
            </div>
          ) : (
            <div key={i}>
              <div className="px-3.5 py-2.5 text-[14px] leading-relaxed">
                <Markdown>{t.content}</Markdown>
              </div>
              {t.sources && t.sources.length > 0 && (
                <p className="px-3.5 text-[11px] text-muted-foreground">
                  Fuentes citadas: {t.sources.length}
                </p>
              )}
            </div>
          )
        )}
      </div>
      <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
        {titulo} · identidad revelada en el link
      </p>
    </div>
  );
}
