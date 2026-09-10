"use client";

import { useEffect, useRef, useState } from "react";
import { FlaskConical, ArrowLeft, Gavel, Swords, Users, Loader2, Scale } from "lucide-react";
import Link from "next/link";
import { isStaticDemo } from "@/lib/static-mode";
import { reportarEventoLabs, useFeature } from "@/lib/use-labs";
import {
  anotarVeredicto,
  leerMarcador,
  resumenMarcador,
  type Bando,
  type DueloEquipos,
  type MarcadorEquipos,
} from "@/lib/duelo-equipos";
import { cn } from "@/lib/utils";

/**
 * /labs/duelo-equipos (v1.21.0) — la arena del flag Labs «duelo-equipos»:
 * dos equipos de dos contendientes, apoyo entre compañeros y un árbitro
 * que lee los dos dosieres y dicta veredicto. El marcador vive en tu
 * dispositivo: el ELO global queda fuera del laboratorio (regla nº 2).
 */

const EJEMPLOS = [
  "¿Cómo explicaría cada equipo la fotosíntesis a un niño de 8 años?",
  "Convince me: ¿es mejor aprender a programar con proyectos o con ejercicios?",
  "Planean la fiesta perfecta de cumpleaños para un desarrollador quemado.",
  "¿Qué le diríais a alguien que duda entre jugar su idea o venderla?",
];

const FASES = [
  "Sorteando los equipos y al árbitro…",
  "Equipo Azul abre la respuesta…",
  "Equipo Rojo contraataca…",
  "Los cierres coordinan su APOYO…",
  "El árbitro lee los dos dosieres…",
];

function TarjetaJugador({
  nombre,
  texto,
  apoyo,
  bando,
}: {
  nombre: string;
  texto: string;
  apoyo: string | null;
  bando: "azul" | "rojo";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <p className={cn("text-[12px] font-bold uppercase tracking-wide", bando === "azul" ? "text-sky-500" : "text-rose-500")}>
        {nombre}
      </p>
      <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground/90">{texto}</p>
      {apoyo && (
        <p className="mt-2 rounded-lg border-l-2 border-highlight bg-secondary/60 px-2.5 py-1.5 text-[12.5px] leading-relaxed text-foreground/80">
          <b>APOYO</b> · {apoyo.replace(/^APOYO:\s*/i, "")}
        </p>
      )}
    </div>
  );
}

export default function DueloEquiposPage() {
  const { feature, activa, setActiva } = useFeature("duelo-equipos");
  const [consigna, setConsigna] = useState("");
  const [cargando, setCargando] = useState(false);
  const [fase, setFase] = useState(0);
  const [duelo, setDuelo] = useState<DueloEquipos | null>(null);
  const [marcador, setMarcador] = useState<MarcadorEquipos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const demo = useRef(false);
  const anotadoRef = useRef(false);

  useEffect(() => {
    demo.current = Boolean(isStaticDemo);
    setMarcador(leerMarcador());
  }, []);

  // El teatro de fases: la API genera en oleadas, la UI lo narra en vivo.
  useEffect(() => {
    if (!cargando) return;
    const t = setInterval(() => setFase((f) => Math.min(f + 1, FASES.length - 1)), 1600);
    return () => clearInterval(t);
  }, [cargando]);

  if (!feature) {
    return (
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-16 sm:px-8">
        <p className="mx-auto max-w-[560px] text-center text-[14px] text-muted-foreground">
          Esta feature experimental ya no existe en el catálogo de Labs: se graduó o se descartó.
        </p>
      </div>
    );
  }

  if (!activa) {
    return (
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-16 sm:px-8">
        <div className="mx-auto max-w-[560px] rounded-xl border border-border bg-card p-6 text-center">
          <FlaskConical className="mx-auto h-6 w-6 text-highlight" aria-hidden />
          <h1 className="mt-3 font-display text-[24px] font-light">{feature.nombre}</h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/85">{feature.descripcion}</p>
          <p className="mt-2 text-[12.5px] text-muted-foreground">
            Es una feature de Todólogo Labs: actívala para entrar (es gratis y sin riesgo para tu ELO).
          </p>
          <div className="mt-4 flex items-center justify-center gap-2.5">
            <button
              onClick={() => {
                setActiva(true);
                reportarEventoLabs("duelo-equipos", "entered");
              }}
              className="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              Activar y entrar
            </button>
            <Link
              href="/labs"
              className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium hover:bg-accent/60"
            >
              Ver el catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  async function lanzar() {
    if (consigna.trim().length < 4 || cargando) return;
    setCargando(true);
    setError(null);
    setDuelo(null);
    setFase(0);
    anotadoRef.current = false;
    try {
      const res = await fetch("/api/labs/duelo-equipos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: consigna.trim() }),
      });
      const j = (await res.json()) as { ok?: boolean; duelo?: DueloEquipos; error?: string };
      if (!res.ok || !j.ok || !j.duelo) throw new Error(j.error ?? "El duelo no pudo celebrarse.");
      setDuelo(j.duelo);
      setMarcador(anotarVeredicto(j.duelo.arbitro.veredicto));
      anotadoRef.current = true;
      reportarEventoLabs("duelo-equipos", "used");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido.");
      reportarEventoLabs("duelo-equipos", "crashed");
    } finally {
      setCargando(false);
    }
  }

  const colores = (v: Bando): string =>
    v === "azul"
      ? "bg-sky-500/15 text-sky-600 dark:text-sky-400"
      : v === "rojo"
        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
        : "bg-amber-500/15 text-amber-600 dark:text-amber-400";

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-[860px] pb-14">
        <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
          <FlaskConical className="h-4 w-4" aria-hidden />
          Todólogo Labs · feature experimental
        </div>
        <h1 className="mt-3 flex items-center gap-2.5 font-display text-[32px] font-light tracking-tight">
          <Swords className="h-7 w-7 text-highlight" aria-hidden />
          Duelo por equipos <span className="bg-highlight inline-block px-1.5 font-medium italic">2v2</span>
        </h1>
        <p className="mt-2 max-w-[680px] text-[14px] leading-relaxed text-foreground/85">
          Dos equipos de dos contendientes responden la misma consigna. El cierre de cada equipo
          lee el borrador de su compañero y añade un <b>APOYO</b>. Después, un quinto modelo —el{" "}
          <b>ÁRBITRO</b>— lee los dos dosieres y dicta veredicto motivado con notas.
        </p>
        <p className="mt-1.5 text-[12.5px] text-muted-foreground">
          El marcador vive en tu dispositivo y nunca toca el ELO global: esto es un laboratorio.
          {demo.current && " En la demo estática, los textos se generan con el motor local."}
        </p>

        {/* Consigna */}
        <div className="mt-6 rounded-xl border border-border bg-card p-4">
          <label htmlFor="consigna-equipos" className="text-[13.5px] font-semibold">
            La consigna del duelo
          </label>
          <textarea
            id="consigna-equipos"
            value={consigna}
            onChange={(e) => setConsigna(e.target.value)}
            rows={3}
            maxLength={600}
            placeholder="Escribe aquí la misión que ambos equipos intentarán ganar…"
            className="mt-2 w-full resize-none rounded-lg border border-border bg-background p-3 text-[13.5px] leading-relaxed outline-none focus:border-highlight"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {EJEMPLOS.map((ej) => (
              <button
                key={ej}
                onClick={() => setConsigna(ej)}
                className="rounded-full border border-border px-2.5 py-1 text-[11.5px] text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              >
                {ej.length > 52 ? `${ej.slice(0, 52)}…` : ej}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={lanzar}
              disabled={consigna.trim().length < 4 || cargando}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cargando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Users className="h-4 w-4" aria-hidden />}
              {cargando ? "Duelo en marcha…" : "¡Que empiece el duelo!"}
            </button>
            {marcador && marcador.arbitrajes > 0 && (
              <span className="text-[12px] text-muted-foreground">{resumenMarcador(marcador)}</span>
            )}
          </div>
        </div>

        {/* Teatro de fases */}
        {cargando && (
          <div className="mt-4 rounded-xl border border-border bg-secondary/40 px-4 py-3.5">
            <p className="flex items-center gap-2 text-[13.5px]">
              <Loader2 className="h-4 w-4 animate-spin text-highlight" aria-hidden />
              {FASES[fase]}
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-600 dark:text-rose-400">
            {error} — el duelo queda anulado y no cuenta en el marcador.
          </div>
        )}

        {/* Veredicto del árbitro */}
        {duelo && (
          <>
            <div className="mt-6 rounded-xl border border-highlight bg-card p-4 sm:p-5">
              <h2 className="flex items-center gap-2 text-[14.5px] font-semibold">
                <Gavel className="h-4.5 w-4.5 text-highlight" aria-hidden />
                Veredicto del árbitro · {duelo.arbitro.nombre}
              </h2>
              <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                <span className={cn("rounded-full px-3 py-1 text-[12.5px] font-bold uppercase tracking-wide", colores(duelo.arbitro.veredicto))}>
                  {duelo.arbitro.veredicto === "azul"
                    ? "Gana el Equipo Azul"
                    : duelo.arbitro.veredicto === "rojo"
                      ? "Gana el Equipo Rojo"
                      : "Empate técnico"}
                </span>
                <span className="rounded-full bg-secondary px-3 py-1 font-mono text-[12.5px] font-semibold">
                  Azul {duelo.arbitro.notaAzul} — {duelo.arbitro.notaRojo} Rojo
                </span>
              </div>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-foreground/85">{duelo.arbitro.razon}</p>
            </div>

            {/* Los dos equipos */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-2.5">
                <p className="flex items-center gap-1.5 text-[13px] font-bold text-sky-600 dark:text-sky-400">
                  <Scale className="h-4 w-4" aria-hidden /> EQUIPO AZUL
                </p>
                <TarjetaJugador nombre={duelo.azul[0].nombre} texto={duelo.azul[0].texto} apoyo={duelo.azul[0].apoyo} bando="azul" />
                <TarjetaJugador nombre={duelo.azul[1].nombre} texto={duelo.azul[1].texto} apoyo={duelo.azul[1].apoyo} bando="azul" />
              </div>
              <div className="space-y-2.5">
                <p className="flex items-center gap-1.5 text-[13px] font-bold text-rose-600 dark:text-rose-400">
                  <Scale className="h-4 w-4" aria-hidden /> EQUIPO ROJO
                </p>
                <TarjetaJugador nombre={duelo.rojo[0].nombre} texto={duelo.rojo[0].texto} apoyo={duelo.rojo[0].apoyo} bando="rojo" />
                <TarjetaJugador nombre={duelo.rojo[1].nombre} texto={duelo.rojo[1].texto} apoyo={duelo.rojo[1].apoyo} bando="rojo" />
              </div>
            </div>

            <p className="mt-4 text-[12px] text-muted-foreground">
              {resumenMarcador(marcador ?? leerMarcador())} — tu uso alimenta la decisión de graduar
              esta feature o descartarla (regla nº 3 de Labs).
            </p>
          </>
        )}

        <p className="mt-8 text-[12.5px] text-muted-foreground">
          <Link href="/labs" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Volver a Labs
          </Link>
        </p>
      </div>
    </div>
  );
}
