"use client";

/**
 * Duelo del día (v1.20.0): UN duelo al día para TODA la comunidad.
 * Determinista por fecha — quien entre a las 00:01 y quien entre a las 23:59
 * votan el mismo duelo. Al votar: consenso comunitario, identidades y tu
 * delta de jurado. Compartible como replay (/duelo/d_xxx) con /api/share.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Share2, Scale, ThumbsDown, ArrowLeft } from "lucide-react";
import Markdown from "./Markdown";
import ProviderLogo from "./ProviderLogo";
import Confeti from "./Confeti";
import { useToast } from "@/hooks/use-toast";
import { getModel, PROVIDERS } from "@/lib/models-data";
import { registrarVotoJurado, useJurado } from "@/lib/jurado-client";
import { tituloJurado } from "@/lib/elo-usuario";
import { markUsed } from "@/lib/badges";
import { isStaticDemo } from "@/lib/static-mode";
import { cn } from "@/lib/utils";

interface Texto { text: string }
interface Revelado { id: string; name?: string; provider?: string; elo?: number }
interface Consenso { A: number; B: number; tie: number; total: number }

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

function fechaBonita(iso: string): string {
  try {
    const d = new Date(`${iso}T12:00:00Z`);
    return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
  } catch {
    return iso;
  }
}

export default function DueloDelDia() {
  const { toast } = useToast();
  const jurado = useJurado();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fecha, setFecha] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [textoA, setTextoA] = useState<string>("");
  const [textoB, setTextoB] = useState<string>("");
  const [votando, setVotando] = useState<string | null>(null);
  const [ganador, setGanador] = useState<"A" | "B" | "tie" | "bad" | null>(null);
  const [consenso, setConsenso] = useState<Consenso | null>(null);
  const [revA, setRevA] = useState<Revelado | null>(null);
  const [revB, setRevB] = useState<Revelado | null>(null);
  const [delta, setDelta] = useState<number | null>(null);
  const [compartiendo, setCompartiendo] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/dia", { method: "GET" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "El duelo de hoy no arrancó.");
      setFecha(data.fecha);
      setPrompt(data.prompt);
      setTextoA(data.a?.text ?? "");
      setTextoB(data.b?.text ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const votar = async (w: "A" | "B" | "tie" | "bad") => {
    if (votando || ganador) return;
    setVotando(w);
    try {
      const res = await fetch("/api/dia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winner: w }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "El voto no se pudo registrar.");
      // Jurado: servidor manda (con sesión); si no, regla local
      const aId = data.revelacion?.a?.id ?? "";
      const bId = data.revelacion?.b?.id ?? "";
      registrarVotoJurado(w, aId, bId, data.usuarioElo ?? null);
      setDelta(data.usuarioElo?.delta ?? null);
      setConsenso(data.consenso ?? null);
      setRevA(data.revelacion?.a ?? null);
      setRevB(data.revelacion?.b ?? null);
      setGanador(w);
      markUsed("duelo-del-dia");
    } catch (e) {
      toast({
        title: "Duelo del día",
        description: e instanceof Error ? e.message : "El voto no se pudo registrar.",
        variant: "destructive",
      });
    } finally {
      setVotando(null);
    }
  };

  const compartir = async () => {
    if (!ganador || !revA || !revB) return;
    setCompartiendo(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "duelo",
          prompt,
          category: "global",
          composerMode: "texto",
          modelAId: revA.id,
          modelBId: revB.id,
          textoA,
          textoB,
          ganador: ganador === "tie" ? "tie" : ganador === "bad" ? "bad" : ganador,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "No se pudo compartir.");
      const url = `${window.location.origin}${data.url}`;
      await navigator.clipboard.writeText(url);
      toast({ title: "Replay del duelo de hoy creado", description: `Enlace copiado: ${url}` });
    } catch (e) {
      toast({
        title: "No se pudo compartir",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    } finally {
      setCompartiendo(false);
    }
  };

  const titulo = tituloJurado(jurado.elo);
  const total = consenso?.total ?? 0;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto w-full max-w-[860px] px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al arena
        </Link>

        {/* Cabecera */}
        <div className="mt-4 flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-red-500/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-red-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> Hoy
          </span>
          <span className="text-[12.5px] text-muted-foreground">
            {fecha ? fechaBonita(fecha) : "cargando…"}
          </span>
        </div>
        <h1 className="mt-2 font-display text-[34px] font-light leading-tight tracking-tight sm:text-[42px]">
          Duelo del día{" "}
          <span className="bg-highlight inline-block px-2 font-medium italic">
            toda la comunidad, un solo veredicto
          </span>
        </h1>
        <p className="mt-2 max-w-[640px] text-[14px] leading-relaxed text-muted-foreground">
          Un duelo anónimo al día para todo el mundo: los modelos y la consigna cambian a
          medianoche (UTC). Vota, descubre a quién elegiste la comunidad y suma tu delta en
          el ELO de jurado.
        </p>

        {/* Consigna */}
        <div className="mt-6 rounded-xl border border-border bg-card px-4 py-3.5">
          <p className="flex items-center gap-1.5 text-[11.5px] font-medium uppercase tracking-wide text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" /> La consigna de hoy
          </p>
          <p className="mt-1.5 text-[15px] font-medium leading-snug">{prompt || "…"}</p>
        </div>

        {cargando && (
          <div className="mt-8 space-y-3">
            <div className="h-24 animate-pulse rounded-xl border border-border bg-card" />
            <div className="h-24 animate-pulse rounded-xl border border-border bg-card" />
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/40 bg-red-500/5 px-4 py-3 text-[13.5px]">
            {error}{" "}
            <button onClick={() => void cargar()} className="ml-2 underline hover:no-underline">
              Reintentar
            </button>
          </div>
        )}

        {/* Duelo ciego */}
        {!cargando && !error && (
          <>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(["A", "B"] as const).map((lado) => (
                <div
                  key={lado}
                  className={cn(
                    "flex flex-col rounded-xl border bg-card p-4 transition-colors",
                    ganador === lado
                      ? "border-emerald-500/60"
                      : ganador && ganador !== lado
                        ? "opacity-70"
                        : "border-border"
                  )}
                >
                  <p className="mb-2 font-display text-[13px] font-semibold text-muted-foreground">
                    RESPUESTA {lado}
                  </p>
                  <div className="max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                    <Markdown>{lado === "A" ? textoA : textoB}</Markdown>
                  </div>
                </div>
              ))}
            </div>

            {!ganador ? (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => void votar("A")}
                  disabled={Boolean(votando)}
                  className="rounded-xl bg-foreground px-5 py-2.5 text-[14px] font-medium text-background hover:opacity-90 disabled:opacity-50"
                >
                  Gana A
                </button>
                <button
                  onClick={() => void votar("tie")}
                  disabled={Boolean(votando)}
                  className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-[13.5px] font-medium hover:bg-accent disabled:opacity-50"
                >
                  <Scale className="h-4 w-4" /> Empate
                </button>
                <button
                  onClick={() => void votar("bad")}
                  disabled={Boolean(votando)}
                  className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-[13.5px] font-medium hover:bg-accent disabled:opacity-50"
                >
                  <ThumbsDown className="h-4 w-4" /> Ambos malos
                </button>
                <button
                  onClick={() => void votar("B")}
                  disabled={Boolean(votando)}
                  className="rounded-xl bg-foreground px-5 py-2.5 text-[14px] font-medium text-background hover:opacity-90 disabled:opacity-50"
                >
                  Gana B
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {(ganador === "A" || ganador === "B") && <Confeti />}
                {/* Veredicto de la comunidad */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="text-[13px] font-semibold">El veredicto de la comunidad</p>
                  {total > 0 ? (
                    <div className="mt-3 space-y-2.5">
                      {[
                        { etiqueta: `A · ${pct(consenso!.A)}%`, n: consenso!.A, color: "bg-emerald-500" },
                        { etiqueta: `B · ${pct(consenso!.B)}%`, n: consenso!.B, color: "bg-sky-500" },
                        { etiqueta: `Empate · ${pct(consenso!.tie)}%`, n: consenso!.tie, color: "bg-amber-500" },
                      ].map((f) => (
                        <div key={f.etiqueta}>
                          <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                            <span>{f.etiqueta}</span>
                            <span>{f.n} votos</span>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                            <div
                              className={cn("h-full rounded-full transition-all", f.color)}
                              style={{ width: `${pct(f.n)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[13px] text-muted-foreground">
                      Tu voto es el primero del día — la grada llegará después.
                    </p>
                  )}
                </div>

                {/* Revelación */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { r: revA, lado: "A", gano: ganador === "A" },
                    { r: revB, lado: "B", gano: ganador === "B" },
                  ].map(({ r, lado, gano }) => {
                    const m = r ? getModel(r.id) : undefined;
                    return (
                      <div
                        key={lado}
                        className={cn(
                          "copa-pop rounded-xl border bg-card p-4",
                          gano ? "border-emerald-500/60" : "border-border"
                        )}
                      >
                        <p className="text-[11.5px] uppercase tracking-wide text-muted-foreground">
                          Respuesta {lado} {gano ? "· tu veredicto" : ""}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <ProviderLogo provider={r?.provider ?? m?.provider ?? ""} size={20} />
                          <span className="text-[14.5px] font-semibold">{r?.name ?? r?.id}</span>
                        </div>
                        {r?.elo !== undefined && (
                          <p className="mt-0.5 text-[12px] text-muted-foreground">
                            ELO {r.elo} · {m?.provider && (PROVIDERS[m.provider]?.name ?? m.provider)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Tu jurado + compartir */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
                  <div>
                    <p className="text-[13px] font-semibold">
                      {delta !== null
                        ? `${delta >= 0 ? "+" : ""}${delta} en tu ELO de jurado`
                        : "ELO de jurado actualizado"}
                    </p>
                    <p className="text-[12.5px] text-muted-foreground">
                      Tu escalera: <span className={cn("font-semibold", titulo.color)}>{jurado.elo}</span> ·{" "}
                      {titulo.nombre} · racha de {jurado.racha} {jurado.racha === 1 ? "día" : "días"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isStaticDemo() && (
                      <button
                        onClick={() => void compartir()}
                        disabled={compartiendo}
                        className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-[13.5px] font-medium hover:bg-accent disabled:opacity-50"
                      >
                        <Share2 className="h-4 w-4" /> Compartir replay
                      </button>
                    )}
                    <Link
                      href="/salon-de-la-fama"
                      className="rounded-xl bg-foreground px-4 py-2.5 text-[13.5px] font-medium text-background hover:opacity-90"
                    >
                      Ver jurados del arena
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
