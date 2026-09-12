"use client";

import { useState } from "react";
import { Bone, CalendarRange, FlaskConical, LockKeyhole, Sparkles } from "lucide-react";
import { asset } from "@/lib/asset-path";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import Parrilla from "@/components/streamdog/Parrilla";
import PanelSportia from "@/components/streamdog/PanelSportia";
import ChatE2E from "@/components/streamdog/ChatE2E";
import Laboratorio from "@/components/streamdog/Laboratorio";

type Pestaña = "parrilla" | "sportia" | "chat" | "lab";

const PESTAÑAS: { id: Pestaña; nombre: string; icono: typeof Bone; pista: string }[] = [
  { id: "parrilla", nombre: "Parrilla", icono: CalendarRange, pista: "Lo que va de año y lo que se instala" },
  { id: "sportia", nombre: "SportIA", icono: Sparkles, pista: "Changelog y sugerencias al desarrollador" },
  { id: "chat", nombre: "Chat E2E", icono: LockKeyhole, pista: "1 a 1, cifrado extremo a extremo" },
  { id: "lab", nombre: "Laboratorio", icono: FlaskConical, pista: "El parseo que no explota" },
];

export default function StreamDogPage() {
  const { t } = useT();
  const [pestaña, setPestaña] = useState<Pestaña>("parrilla");

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin bg-[#050a12]">
      <div className="mx-auto flex min-h-full max-w-[1100px] flex-col px-4 py-8 sm:px-8">
        {/* Encabezado de marca */}
        <header className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <img
            src={asset("/streamdog-pwa/icon.svg")}
            alt="Icono de StreamDog: cabeza de perro con botón de reproducción y ondas de emisión"
            className="h-16 w-16 rounded-2xl shadow-lg shadow-cyan-500/10"
          />
          <div className="min-w-0">
            <h1 className="font-display text-[30px] font-light tracking-tight text-slate-50">
              Stream<span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text font-medium text-transparent">Dog</span>
            </h1>
            <p className="mt-0.5 text-[13.5px] leading-relaxed text-slate-400">
              {t("Tu parrilla deportiva con IA — se instala como app nativa y todo lo que scrapea, lo traga sin explotar.")}
            </p>
          </div>
          <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11.5px] font-medium text-emerald-300 sm:flex">
            <Bone className="h-3.5 w-3.5" aria-hidden />
            PWA nativa · v1.26.0
          </span>
        </header>

        {/* Pestañas */}
        <nav aria-label="Secciones de StreamDog" className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PESTAÑAS.map((p) => {
            const Icono = p.icono;
            const activa = pestaña === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPestaña(p.id)}
                aria-current={activa ? "page" : undefined}
                className={cn(
                  "group flex min-h-[44px] items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left text-[13.5px] font-medium transition-colors",
                  activa
                    ? "border-cyan-400/40 bg-cyan-400/10 text-cyan-200"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]"
                )}
              >
                <Icono className={cn("h-4 w-4 shrink-0", activa ? "text-cyan-300" : "text-slate-500 group-hover:text-slate-300")} aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate">{p.nombre}</span>
                  <span className="hidden truncate text-[11px] font-normal text-slate-500 lg:block">{p.pista}</span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Contenido */}
        <main className="mt-6 flex-1">
          {pestaña === "parrilla" && <Parrilla />}
          {pestaña === "sportia" && <PanelSportia />}
          {pestaña === "chat" && <ChatE2E />}
          {pestaña === "lab" && <Laboratorio />}
        </main>

        <footer className="mt-10 border-t border-white/5 pt-4 text-[11.5px] leading-relaxed text-slate-500">
          StreamDog es el módulo de parrilla deportiva del arena:alojable como app nativa (Vercel o GitHub Pages),
          con dominio personalizado documentado paso a paso. El chat es extremo a extremo: este servidor solo transporta
          cifrado y no guarda conversaciones. Guía completa en <code className="rounded bg-white/5 px-1 py-0.5 text-slate-400">docs/STREAMDOG-ALOJAMIENTO.md</code>.
        </footer>
      </div>
    </div>
  );
}
