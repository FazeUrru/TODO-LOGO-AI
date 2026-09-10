"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { FlaskConical, ShieldCheck, Timer, Users, ArrowLeft, ArrowUpRight, Info } from "lucide-react";
import Link from "next/link";
import { markUsed, NewBadge } from "@/lib/badges";
import { isStaticDemo } from "@/lib/static-mode";
import {
  LABS_FEATURES,
  COHORTES,
  type Cohorte,
  type LabsFeature,
} from "@/lib/labs";
import { useLabs } from "@/lib/use-labs";
import { cn } from "@/lib/utils";

/**
 * /labs — Canal Todólogo Labs (v1.14.0): early access con cohortes.
 * El catálogo viaja en el bundle (src/lib/labs.ts) así que la página funciona
 * incluso en la demo estática; la telemetría y los contadores reales llegan
 * de /api/labs cuando hay servidor, y si no, se declara.
 */

interface FeatureRemota extends LabsFeature {
  accesoPermitido: boolean;
  inscriptos: number | null;
  eventos: number | null;
}

function diasRestantes(iso: string): number {
  const ms = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

function ChipCohorte({ cohorte }: { cohorte: Cohorte }) {
  const c = COHORTES[cohorte];
  return (
    <span className={cn("inline-block rounded px-1.5 py-px text-[10px] font-bold uppercase", c.color)}>
      {c.nombre}
    </span>
  );
}

function TarjetaFeature({
  f,
  activa,
  puede,
  cohorte,
  onToggle,
}: {
  f: FeatureRemota;
  activa: boolean;
  puede: boolean;
  cohorte: Cohorte;
  onToggle: (v: boolean) => void;
}) {
  const dias = diasRestantes(f.expira);
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-colors sm:p-5",
        activa ? "border-highlight" : "border-border"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-[15px] font-semibold">{f.nombre}</h3>
        <ChipCohorte cohorte={f.cohorte} />
        {activa && (
          <span className="rounded bg-highlight px-1.5 py-px text-[10px] font-bold uppercase text-[#2E2B29]">
            activada
          </span>
        )}
        <span className="ml-auto flex items-center gap-1 text-[11.5px] text-muted-foreground">
          <Timer className="h-3.5 w-3.5" aria-hidden />
          expira en {dias} día{dias === 1 ? "" : "s"}
        </span>
      </div>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-foreground/85">{f.descripcion}</p>

      {f.inscriptos !== null && (
        <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
          <Users className="h-3.5 w-3.5" aria-hidden />
          {f.inscriptos} inscripción{f.inscriptos === 1 ? "" : "es"} · {f.eventos ?? 0} eventos medidos
        </p>
      )}

      <div className="mt-3 flex items-center gap-3">
        {puede ? (
          <button
            role="switch"
            aria-checked={activa}
            onClick={() => onToggle(!activa)}
            className={cn(
              "relative h-6 w-11 shrink-0 rounded-full transition-colors",
              activa ? "bg-highlight" : "bg-secondary ring-1 ring-border"
            )}
            aria-label={`${activa ? "Desactivar" : "Activar"} ${f.nombre}`}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                activa ? "translate-x-[22px]" : "translate-x-0.5"
              )}
            />
          </button>
        ) : (
          <span
            title={`Reservada a la cohorte ${COHORTES[f.cohorte].nombre}: ${COHORTES[f.cohorte].requisito}`}
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[11.5px] text-muted-foreground"
          >
            <Info className="h-3.5 w-3.5" aria-hidden />
            Cohorte {COHORTES[f.cohorte].nombre}
          </span>
        )}
        {/* v1.21.0 — si la feature tiene página propia y está activa, se entra desde aquí. */}
        {activa && f.url && (
          <Link
            href={f.url}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            Abrir
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
        <p className="text-[12px] leading-snug text-muted-foreground">
          {puede
            ? activa
              ? "Participas: tu uso alimenta la decisión de graduarla o descartarla."
              : "Actívala y participa: sin riesgo para tu ELO ni tus datos."
            : cohorte === "inner"
              ? "Reservada al Inner Circle."
              : `Requiere la cohorte ${COHORTES[f.cohorte].nombre}: ${COHORTES[f.cohorte].requisito}`}
        </p>
      </div>
    </div>
  );
}

export default function LabsPage() {
  const { activadas, setActiva } = useLabs();
  const [remotas, setRemotas] = useState<FeatureRemota[] | null>(null);
  const [cohorte, setCohorte] = useState<Cohorte>("explorer");
  const [reglas, setReglas] = useState<string[]>([]);
  const demo = useSyncExternalStore(
    () => () => {},
    isStaticDemo,
    () => false
  );

  useEffect(() => {
    markUsed("labs");
    let vivo = true;
    fetch("/api/labs")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("sin-labs"))))
      .then((j: { features?: FeatureRemota[]; cohorte?: Cohorte; reglas?: string[] }) => {
        if (!vivo) return;
        if (Array.isArray(j.features)) setRemotas(j.features);
        if (j.cohorte) setCohorte(j.cohorte);
        if (j.reglas) setReglas(j.reglas);
      })
      .catch(() => {
        if (vivo) setRemotas(null); // demo estática: catálogo local
      });
    return () => {
      vivo = false;
    };
  }, []);

  const features: FeatureRemota[] =
    remotas ??
    LABS_FEATURES.map((f) => ({
      ...f,
      accesoPermitido: f.cohorte === "explorer",
      inscriptos: null,
      eventos: null,
    }));

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-[720px] pb-12">
        <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
          <FlaskConical className="h-4 w-4" aria-hidden />
          Early Access
          <NewBadge k="labs" />
        </div>
        <h1 className="mt-3 font-display text-[34px] font-light tracking-tight">
          Todólogo{" "}
          <span className="bg-highlight inline-block px-1.5 font-medium italic">Labs</span>
        </h1>
        <p className="mt-2 max-w-[640px] text-[14px] leading-relaxed text-foreground/85">
          El canal experimental de la arena: pruebas lo que cocinamos antes que nadie y tu
          uso decide qué se gradúa y qué se descarta. Cohortes abiertas, ciclo de vida finito
          (8 semanas máximo) y el ELO global siempre fuera del laboratorio.
        </p>

        {/* Contrato explícito */}
        <div className="mt-5 rounded-xl border border-border bg-secondary/50 p-4 sm:p-5">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold">
            <ShieldCheck className="h-4 w-4" aria-hidden /> El contrato de una beta honesta
          </h2>
          <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-foreground/85">
            {(reglas.length
              ? reglas
              : [
                  "Esto es experimental y puede fallar: perder tu partida o mostrar datos inconsistentes son fallos esperados, no sorpresas.",
                  "El ELO global es sagrado: ninguna feature de Labs escribe en los votos ni en el ranking reales.",
                  "Nada vive en beta más de 8 semanas: se gradúa a la app o se descarta — nada de betas perpetuas.",
                  "Tu inscripción vive en este dispositivo; la telemetría es anónima y alimenta solo la decisión de graduar o descartar.",
                ]
            ).map((r) => (
              <li key={r} className="flex gap-2">
                <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-highlight" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Cohortes */}
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {(Object.entries(COHORTES) as [Cohorte, (typeof COHORTES)[Cohorte]][]).map(
            ([id, c]) => (
              <div
                key={id}
                className={cn(
                  "rounded-xl border p-3.5",
                  cohorte === id ? "border-highlight bg-card" : "border-border bg-card/60"
                )}
              >
                <div className="flex items-center gap-2">
                  <ChipCohorte cohorte={id} />
                  {cohorte === id && (
                    <span className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">
                      tu cohorte
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-[12.5px] leading-snug text-foreground/85">{c.descripcion}</p>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{c.requisito}</p>
              </div>
            )
          )}
        </div>

        {/* Catálogo */}
        <div className="mt-6 space-y-3">
          {features.map((f) => (
            <TarjetaFeature
              key={f.id}
              f={f}
              activa={Boolean(activadas[f.id])}
              puede={f.accesoPermitido || (!remotas && f.cohorte === "explorer")}
              cohorte={cohorte}
              onToggle={(v) => setActiva(f.id, v)}
            />
          ))}
        </div>

        {demo && (
          <p className="mt-5 rounded-lg border border-border bg-secondary/50 px-3.5 py-2.5 text-[12.5px] text-muted-foreground">
            Estás en la demo estática: el catálogo y los toggles funcionan en tu navegador, pero
            la telemetría no viaja a ningún servidor. En producción ({""}
            <Link href="https://todo-logo-ai.vercel.app/labs" className="underline hover:text-foreground">
              /labs en la instancia oficial
            </Link>
            ) cada evento se mide de verdad.
          </p>
        )}

        <p className="mt-6 text-[12.5px] text-muted-foreground">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Volver a la arena
          </Link>
        </p>
      </div>
    </div>
  );
}
