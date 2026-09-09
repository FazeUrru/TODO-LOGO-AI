"use client";

import { useEffect, useState } from "react";
import { Crown, Medal, Trophy } from "lucide-react";
import ProviderLogo from "./ProviderLogo";
import { getModel } from "@/lib/models-data";
import { cn } from "@/lib/utils";

/**
 * Salón de la Fama de la Copa Todólogo (v1.12.0): los últimos campeones
 * registrados en la base de datos (o en localStorage en la demo estática).
 * `destacadoId` resalta el campeón recién coronado en la vista de revelación.
 */

interface CampeonRow {
  copaId: string;
  prompt: string;
  size: number;
  campeon: { id: string; name: string };
  subcampeon: { id: string; name: string } | null;
  at: string;
}

function fechaCorta(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

export default function SalonFama({ destacadoId }: { destacadoId?: string | null }) {
  const [filas, setFilas] = useState<CampeonRow[] | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch("/api/hall-of-fame")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("sin-salon"))))
      .then((j: { campeones?: CampeonRow[] }) => {
        if (vivo) setFilas(Array.isArray(j.campeones) ? j.campeones : []);
      })
      .catch(() => {
        if (vivo) setFilas([]);
      });
    return () => {
      vivo = false;
    };
  }, []);

  const total = filas?.length ?? 0;
  const vacio = filas !== null && total === 0;

  return (
    <section className="fade-up mt-6 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-highlight">
          <Trophy className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[13.5px] font-medium">Salón de la Fama</p>
          <p className="text-[11.5px] text-muted-foreground">
            {vacio
              ? "Aún no hay campeones: la primera copa escribirá la historia."
              : `Los últimos campeones de la Copa Todólogo (${total} en el registro)`}
          </p>
        </div>
        <a
          href="/salon-de-la-fama"
          className="ml-auto shrink-0 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Ver completo
        </a>
      </div>

      {filas !== null && total > 0 && (
        <ul className="mt-3 space-y-1.5">
          {filas.map((f) => {
            const proveedor = getModel(f.campeon.id)?.provider ?? "";
            const destacado = Boolean(destacadoId) && f.campeon.id === destacadoId;
            return (
              <li
                key={f.copaId}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border border-border px-3 py-2",
                  destacado && "border-amber-400/70 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-950/40"
                )}
              >
                {destacado ? (
                  <Crown className="h-4 w-4 shrink-0 text-amber-500" />
                ) : (
                  <Medal className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                )}
                <ProviderLogo provider={proveedor} size={18} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[12.5px] font-medium">{f.campeon.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">«{f.prompt}»</p>
                </div>
                <span className="shrink-0 rounded-full border border-border px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">
                  {f.size}
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {fechaCorta(f.at)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
