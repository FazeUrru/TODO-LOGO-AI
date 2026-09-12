"use client";

import { useMemo, useState, useEffect } from "react";
import { Calculator as CalcIcon, Plus, X, Sparkles, PlayCircle } from "lucide-react";
import { MODELS, PROVIDERS, getModel, formatContext, esGenerativo } from "@/lib/models-data";
import { markUsed } from "@/lib/badges";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "Chat ligero", inM: 0.5, outM: 1 },
  { label: "Asistente pro", inM: 5, outM: 8 },
  { label: "Pipeline RAG", inM: 40, outM: 12 },
  { label: "Agentes 24/7", inM: 200, outM: 90 },
];

export default function CalculadoraPage() {
  // La insignia ¡Nuevo! de la calculadora desaparece al visitarla de verdad.
  useEffect(() => markUsed("calculadora"), []);
  const [inM, setInM] = useState(5);
  const [outM, setOutM] = useState(8);
  const [picks, setPicks] = useState<string[]>(["glm-5.3", "claude-opus-5", "deepseek-v4"]);
  const [picker, setPicker] = useState("");

  // v1.15.0: la calculadora compara costes por tokens de texto — fuera los
  // generativos, que cobran por segundo/imagen y no son comparables.
  const sorted = useMemo(
    () => MODELS.filter((m) => !esGenerativo(m)).sort((a, b) => b.elo - a.elo),
    []
  );

  const cost = (id: string) => {
    const m = getModel(id);
    if (!m) return 0;
    return inM * m.priceIn + outM * m.priceOut;
  };

  const rows = picks.map(getModel).filter(Boolean);
  const maxCost = Math.max(...rows.map((m) => cost(m!.id)), 1);
  const minCost = Math.min(...rows.map((m) => cost(m!.id)), Infinity);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-[860px] pb-12">
        <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
          <CalcIcon className="h-4 w-4" />
          Herramientas
        </div>
        <h1 className="mt-3 font-display text-[34px] font-light tracking-tight">
          Calculadora de{" "}
          <span className="bg-highlight inline-block px-1.5 font-medium italic">costes</span>
        </h1>
        <p className="mt-2 max-w-[600px] text-[14px] leading-relaxed text-foreground/85">
          Estima la factura mensual real de cada modelo con los precios publicados por
          proveedor (USD por millón de tokens) y compara hasta 3 candidatos a la vez.
        </p>

        {/* Presets */}
        <div className="mt-5 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setInM(p.inM);
                setOutM(p.outM);
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12.5px]",
                inM === p.inM && outM === p.outM
                  ? "border-foreground bg-secondary font-medium"
                  : "border-border bg-card hover:bg-accent"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Sliders */}
        <div className="mt-5 grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
          <div>
            <div className="flex items-baseline justify-between">
              <label className="text-[13.5px] font-medium">Tokens de entrada / mes</label>
              <span className="font-mono text-[14px] font-semibold">{inM}M</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={500}
              step={0.1}
              value={inM}
              onChange={(e) => setInM(Number(e.target.value))}
              className="mt-2 w-full accent-black"
            />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <label className="text-[13.5px] font-medium">Tokens de salida / mes</label>
              <span className="font-mono text-[14px] font-semibold">{outM}M</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={200}
              step={0.1}
              value={outM}
              onChange={(e) => setOutM(Number(e.target.value))}
              className="mt-2 w-full accent-black"
            />
          </div>
        </div>

        {/* Selector de modelos */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {picks.map((id) => {
            const m = getModel(id);
            return (
              <span
                key={id}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pl-2.5 pr-1.5 text-[12.5px]"
              >
                <span
                  className={cn("h-2 w-2 rounded-full", PROVIDERS[m?.provider ?? ""]?.color)}
                />
                <span className="font-mono">{m?.name}</span>
                <button
                  onClick={() => setPicks((p) => p.filter((x) => x !== id))}
                  className="rounded-full p-0.5 hover:bg-accent"
                  aria-label={`Quitar ${m?.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
          {picks.length < 3 && (
            <select
              value={picker}
              onChange={(e) => {
                if (e.target.value) {
                  setPicks((p) => [...p, e.target.value]);
                  setPicker("");
                }
              }}
              className="flex items-center gap-1 rounded-full border border-dashed border-border bg-transparent px-3 py-1.5 text-[12.5px] text-muted-foreground outline-none"
            >
              <option value="">+ Añadir modelo</option>
              {sorted.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Tabla comparativa */}
        <div className="mt-4 space-y-2.5">
          {rows.map((m) => {
            const c = cost(m!.id);
            const saving = minCost < Infinity && c > 0 ? ((c - minCost) / c) * 100 : 0;
            return (
              <div key={m!.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="font-mono text-[14px] font-semibold">{m!.name}</span>
                    <span className="ml-2 text-[12px] text-muted-foreground">
                      {PROVIDERS[m!.provider]?.name} · ELO {m!.elo} · ctx{" "}
                      {formatContext(m!.context)}
                    </span>
                  </div>
                  <span className="font-display text-[22px] font-medium">
                    {c < 1 ? `$${c.toFixed(2)}` : `$${c.toFixed(0)}`}
                    <span className="text-[12px] text-muted-foreground">/mes</span>
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      c === minCost ? "bg-emerald-600" : "bg-foreground/70"
                    )}
                    style={{ width: `${Math.max((c / maxCost) * 100, 3)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                  ${m!.priceIn}/1M entrada · ${m!.priceOut}/1M salida
                  {c > minCost && saving > 0 && (
                    <span className="ml-2 font-medium text-emerald-700">
                      {saving.toFixed(0)}% más caro que la opción más barata
                    </span>
                  )}
                  {c === minCost && picks.length > 1 && (
                    <span className="ml-2 font-medium text-emerald-700">
                      La más eficiente de tu selección
                    </span>
                  )}
                </p>
              </div>
            );
          })}
        </div>

        <p className="mt-4 flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <Plus className="h-3.5 w-3.5" />
          Precios de lista publicados por cada proveedor; los contratos empresariales
          suelen negociar descuentos del 15-40% sobre estas cifras.
        </p>

        {/* ── v1.16.0: vídeo oficial «10 casos de uso» con badge animado ── */}
        <div className="mt-10 border-t border-border pt-8">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="relative inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1 text-[11.5px] font-semibold text-background">
              <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F4C406] opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#F4C406]" />
              </span>
              <Sparkles className="h-3 w-3" />
              NUEVO
            </span>
            <h2 className="font-display text-[22px] font-light tracking-tight">
              Los 10 casos de uso, en vídeo —{" "}
              <span className="italic">17:37 min narrados</span>
            </h2>
          </div>
          <p className="mt-1.5 max-w-[600px] text-[13.5px] leading-relaxed text-muted-foreground">
            Un recorrido completo por toda la aplicación: batallas, código, imagen,
            vídeo, voz, 3D, agente, copa, búsqueda web y juegos. Con narración en español.
          </p>
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-black shadow-sm">
            <video
              controls
              preload="metadata"
              poster="/video/portada-casos.jpg"
              src="/video/casos-de-uso-17m37.mp4"
              className="block aspect-video w-full"
            />
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <PlayCircle className="h-3.5 w-3.5" />
            Narrado con la voz «tongtong» del estudio de audio de todólogo.
          </p>
        </div>
      </div>
    </div>
  );
}
