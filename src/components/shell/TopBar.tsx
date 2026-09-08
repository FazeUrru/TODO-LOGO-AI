"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Swords,
  Sparkles,
  Columns2,
  MessageCircle,
  Trophy,
  ChevronDown,
  Search,
  PanelLeft,
  Check,
  Grid3X3,
} from "lucide-react";
import { useUsed, NewBadge } from "@/lib/badges";
import { MODELS, PROVIDERS, getModel } from "@/lib/models-data";
import { useArena, type ArenaMode, MODE_META } from "./arena-context";
import ProviderLogo from "@/components/arena/ProviderLogo";
import FloatingPanel from "./FloatingPanel";
import { cn } from "@/lib/utils";

const MODE_ICONS: Record<ArenaMode, typeof Swords> = {
  battle: Swords,
  agent: Sparkles,
  sbs: Columns2,
  direct: MessageCircle,
  torneo: Trophy,
};

/* ── Selector de modelo con buscador (estilo lmarena) ── */
function ModelSelect({
  value,
  onChange,
  align = "left",
}: {
  value: string;
  onChange: (id: string) => void;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const model = getModel(value);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? MODELS.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            (PROVIDERS[m.provider]?.name ?? m.provider).toLowerCase().includes(q)
        )
      : MODELS;
    return [...list].sort((a, b) => b.elo - a.elo).slice(0, 60);
  }, [query]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          setQuery("");
        }}
        className="flex max-w-[118px] items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] hover:bg-accent sm:max-w-[240px]"
      >
        <ProviderLogo provider={model?.provider ?? ""} size={16} />
        <span className="truncate font-mono text-[12.5px]">{model?.name ?? value}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </button>

      <FloatingPanel anchorRef={ref} open={open} onClose={() => setOpen(false)} width={320} align={align}>
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar modelo u organización…"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="scrollbar-thin max-h-[340px] overflow-y-auto p-1.5">
          {results.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                onChange(m.id);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-accent"
            >
              <span className="flex min-w-0 items-center gap-2">
                <ProviderLogo provider={m.provider} size={16} />
                <span className="truncate font-mono text-[12.5px]">{m.name}</span>
                {m.isNew && (
                  <span className="rounded bg-highlight px-1 py-px text-[9.5px] font-semibold uppercase">
                    Nuevo
                  </span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-2 text-[11px] text-muted-foreground">
                <span className="hidden sm:inline">{PROVIDERS[m.provider]?.name}</span>
                <span className="font-mono">{m.elo}</span>
                {m.id === value && <Check className="h-3.5 w-3.5 text-foreground" />}
              </span>
            </button>
          ))}
          {results.length === 0 && (
            <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">
              Sin resultados para «{query}»
            </p>
          )}
        </div>
      </FloatingPanel>
    </div>
  );
}

/* ── Dropdown de modos ── */
function ModeDropdown() {
  const arena = useArena();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const Icon = MODE_ICONS[arena.mode];
  const torneoUsed = useUsed("modo-torneo");

  const modes: ArenaMode[] = ["battle", "agent", "sbs", "direct", "torneo"];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[14px] font-medium hover:bg-accent sm:px-2.5"
      >
        <Icon className="h-4 w-4" />
        <span className="hidden max-w-[130px] truncate sm:inline">{MODE_META[arena.mode].label}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      <FloatingPanel anchorRef={ref} open={open} onClose={() => setOpen(false)} width={300}>
        <div className="p-1.5">
          {modes.map((m) => {
            const MIcon = MODE_ICONS[m];
            const active = m === arena.mode;
            return (
              <button
                key={m}
                onClick={() => {
                  arena.setMode(m);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-accent",
                  active && "bg-secondary"
                )}
              >
                <MIcon className="mt-0.5 h-[18px] w-[18px] shrink-0" />
                <span>
                  <span className="flex items-center gap-1.5 text-[14px] font-medium">
                    {MODE_META[m].label}
                    {m === "torneo" && !torneoUsed && <NewBadge k="modo-torneo" />}
                  </span>
                  <span className="block text-[12.5px] text-muted-foreground">
                    {MODE_META[m].sub}
                  </span>
                </span>
                {active && <Check className="ml-auto mt-1 h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </FloatingPanel>
    </div>
  );
}

/* ── Barra superior según ruta ── */
export default function TopBar() {
  const pathname = usePathname();
  const arena = useArena();

  const title =
    pathname === "/leaderboard"
      ? "Overview"
      : pathname === "/novedades"
        ? "Novedades"
        : pathname === "/empresas"
          ? "Empresas"
          : pathname === "/changelog"
            ? "Changelog"
            : pathname === "/acerca"
              ? "Acerca de"
              : pathname === "/ajustes"
                ? "Ajustes"
                : pathname === "/calculadora"
                  ? "Calculadora"
                  : pathname === "/conectores"
                    ? "Conectores"
                    : pathname === "/iniciar-sesion"
                      ? "Iniciar sesión"
                      : pathname === "/registro"
                        ? "Crear cuenta"
                        : null;

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-1 border-b border-border bg-background/95 px-3 backdrop-blur">
      <button
        onClick={() => arena.setSidebarOpen(!arena.sidebarOpen)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-foreground/80 hover:bg-accent md:hidden"
        aria-label="Abrir barra lateral"
      >
        <PanelLeft className="h-[17px] w-[17px]" />
      </button>

      {pathname === "/" ? (
        <>
          <div className="shrink-0">
            <ModeDropdown />
          </div>
          {arena.mode === "sbs" && (
            <>
              <div className="shrink-0">
                <ModelSelect value={arena.modelAId} onChange={arena.setModelAId} />
              </div>
              <div className="shrink-0">
                <ModelSelect value={arena.modelBId} onChange={arena.setModelBId} align="right" />
              </div>
            </>
          )}
          {arena.mode === "direct" && (
            <div className="shrink-0">
              <ModelSelect value={arena.modelDirectId} onChange={arena.setModelDirectId} />
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-[14px] font-medium">
          {pathname === "/leaderboard" ? (
            <Grid3X3 className="h-4 w-4" />
          ) : null}
          {title}
        </div>
      )}
    </header>
  );
}
