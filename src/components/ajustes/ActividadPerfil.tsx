"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { PROFILE_FIELD_LABELS } from "@/lib/profile-shared";
import { Section } from "./controles";

/**
 * Actividad del perfil en la nube (v1.12.0): últimos cambios registrados del
 * perfil de la cuenta (GET /api/profile/historial). Sin sesión o sin eventos,
 * la tarjeta se mantiene discreta; en la demo estática vive vacía a propósito.
 */

interface Evento {
  campo: string;
  detalle: string;
  at: string;
}

function fechaHora(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function ActividadPerfil() {
  const [eventos, setEventos] = useState<Evento[] | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch("/api/profile/historial")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("sin-sesion"))))
      .then((j: { eventos?: Evento[] }) => {
        if (vivo) setEventos(Array.isArray(j.eventos) ? j.eventos : []);
      })
      .catch(() => {
        if (vivo) setEventos(null); // sin sesión: tarjeta oculta
      });
    return () => {
      vivo = false;
    };
  }, []);

  if (eventos === null || eventos.length === 0) return null;

  return (
    <Section icon={History} title="Actividad del perfil en la nube">
      <div className="space-y-1.5 px-4 pb-1">
        {eventos.map((e, i) => (
          <div
            key={`${e.campo}-${e.at}-${i}`}
            className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2"
          >
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
            <p className="min-w-0 flex-1 truncate text-[12.5px]">
              <span className="font-medium">
                {PROFILE_FIELD_LABELS[e.campo as keyof typeof PROFILE_FIELD_LABELS] ?? e.campo}
              </span>
              {e.detalle && (
                <span className="text-muted-foreground"> — {e.detalle.toLowerCase()}</span>
              )}
            </p>
            <span className="shrink-0 text-[11px] text-muted-foreground">{fechaHora(e.at)}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
