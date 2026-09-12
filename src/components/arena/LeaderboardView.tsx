"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Trophy,
  ListOrdered,
  ChartLine,
  ChevronDown,
  ChevronUp as ChevUp,
  Search,
  SlidersHorizontal,
  Building2,
  Cpu,
  CircleCheck,
  Code2,
  Brain,
  PenLine,
  Bot,
  Sigma,
  Database,
  Languages,
  GraduationCap,
  Briefcase,
  Clock,
  FileText,
  BarChart3,
  Clapperboard,
  Image as ImageIcon,
  AudioLines,
  type LucideIcon,
} from "lucide-react";
import { PROVIDERS, getModel } from "@/lib/models-data";
import { NEW_CATEGORIES } from "@/lib/elo";
import { NewBadge, markUsed } from "@/lib/badges";
import ProviderLogo from "./ProviderLogo";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LeaderRow {
  id: string;
  name: string;
  provider: string;
  providerName: string;
  license: string;
  rank?: number;
  elo: number;
  delta: number;
  ci: number;
  votes: number;
  winRate: number;
  context: number;
  priceOut: number;
  speed: number;
  isNew: boolean;
  categories: string[];
  eloGlobal?: number | null;
  eloGlobalBattles?: number;
  /** ELO persistente de la arena generativa (v1.19.0), solo en imagen/vídeo/audio. */
  eloArena?: number | null;
  eloArenaBattles?: number;
}

const TABS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "global", label: "General", icon: Trophy },
  { id: "codigo", label: "Código", icon: Code2 },
  { id: "razonamiento", label: "Razonamiento", icon: Brain },
  { id: "escritura", label: "Escritura", icon: PenLine },
  { id: "agente", label: "Agente", icon: Bot },
  { id: "matematicas", label: "Matemáticas", icon: Sigma },
  { id: "datos", label: "Datos y SQL", icon: Database },
  { id: "traduccion", label: "Traducción", icon: Languages },
  { id: "educacion", label: "Educación", icon: GraduationCap },
  { id: "negocios", label: "Negocios", icon: Briefcase },
  // ── Arenas generativas (v1.15.0) ──
  { id: "video", label: "Vídeo", icon: Clapperboard },
  { id: "imagen", label: "Imagen", icon: ImageIcon },
  { id: "audio", label: "Audio", icon: AudioLines },
];

const CAT_DESC: Record<string, string> = {
  global:
    "Clasificación general del arena: ranking dinámico de modelos según millones de votos ciegos de la comunidad, ponderados por categoría y frescura.",
  codigo:
    "Ranking de generación de código: corrección, estilo de ingeniería y capacidad de razonar sobre arquitecturas reales.",
  razonamiento:
    "Ranking de razonamiento: matemáticas, lógica multi-paso y análisis riguroso verificado por humanos.",
  escritura:
    "Ranking de escritura: prosa, tono, creatividad y calidad redaccional en español.",
  agente:
    "Ranking agéntico: qué modelos orquestan mejor herramientas, planifican tareas complejas y completan misiones de principio a fin.",
  matematicas:
    "Arena exclusivo de todólogo.ai: álgebra, cálculo, probabilidad y demostraciones paso a paso verificadas por humanos. Sin equivalente en otros arenas.",
  datos:
    "Arena exclusivo de todólogo.ai: consultas SQL reales, modelado de datos, limpieza y análisis estadístico sobre esquemas de producción.",
  traduccion:
    "Arena exclusivo de todólogo.ai: traducción con matiz cultural entre español, inglés y 20 lenguas más, evaluada por traductores nativos.",
  educacion:
    "Arena exclusivo de todólogo.ai: pedagogía, tutoría paso a paso y adaptación al nivel del alumno, votada por docentes.",
  negocios:
    "Arena exclusivo de todólogo.ai: estrategia, finanzas, marketing y consultoría empresarial con criterio de directivos reales.",
  video:
    "Arena de vídeo con ELO PROPIO: los generadores más recientes del mercado (Seedance 2.5, Veo 3.1, Sora 2, Kling 3.0 Turbo, Runway Gen-4.5, Wan 3.0, Grok Imagine) cara a cara. Sus votos jamás mezclan con el ranking de texto. Evalúa realismo, movimiento de cámara y coherencia de audio.",
  imagen:
    "Arena de imagen con ELO SEPARADO del de texto: la nueva generación completa (GPT-Image-2.5 Sunburst/Flare/Instant, Nano Banana Pro, Seedream 5.0, Midjourney V8.2, FLUX.2) compite a ciegas y su rating arranca en 1000, independiente para siempre. Evalúa fidelidad al prompt, tipografía y edición.",
  audio:
    "Arena de audio con dimensión de rating propia: música y voz generativa (Suno v5.5, ElevenLabs Music, Lyria 3 Pro, MiniMax Music 2.5, Sonauto V3). Evalúa voces naturales, mezcla y estructura musical.",
};

/** Etiquetas de categoría para el ticker de actividad (v1.19.0). */
const ETIQUETA_CATEGORIA: Record<string, string> = {
  global: "General",
  codigo: "Código",
  razonamiento: "Razonamiento",
  escritura: "Escritura",
  agente: "Agente",
  matematicas: "Matemáticas",
  datos: "Datos y SQL",
  traduccion: "Traducción",
  educacion: "Educación",
  negocios: "Negocios",
  imagen: "Imagen",
  video: "Vídeo",
  audio: "Audio",
};

interface EventoActividad {
  categoria: string;
  ganador: string | null;
  perdedor: string | null;
  empate: boolean;
  nombreA: string;
  nombreB: string;
  at: string;
}

function haceCuanto(iso: string): string {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `hace ${s} s`;
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  return `hace ${Math.round(m / 60)} h`;
}

type ViewAs = "ranking" | "pareto";
type License = "todas" | "abierto" | "propietario";
type Entities = "models" | "labs";

export default function LeaderboardView() {
  const { t } = useT();
  const [category, setCategory] = useState("global");
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncedAt, setSyncedAt] = useState<string>("");
  const [viewAs, setViewAs] = useState<ViewAs>("ranking");
  const [license, setLicense] = useState<License>("todas");
  const [entities, setEntities] = useState<Entities>("models");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  /* v1.19.0 — Ticker de actividad en vivo: los últimos duelos de la arena */
  const [actividad, setActividad] = useState<EventoActividad[]>([]);
  const [idxActividad, setIdxActividad] = useState(0);

  useEffect(() => {
    let alive = true;
    const cargar = () =>
      fetch("/api/actividad")
        .then((r) => r.json())
        .then((d) => {
          if (alive && d.ok) setActividad(d.eventos ?? []);
        })
        .catch(() => {});
    cargar();
    const t = setInterval(cargar, 20_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  useEffect(() => {
    if (actividad.length < 2) return;
    const t = setInterval(() => setIdxActividad((i) => (i + 1) % actividad.length), 4500);
    return () => clearInterval(t);
  }, [actividad.length]);

  function changeCategory(id: string) {
    setLoading(true);
    setCategory(id);
    markUsed(`cat-${id}`);
  }

  useEffect(() => {
    let alive = true;
    fetch(`/api/leaderboard?category=${category}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setRows(d.rows ?? []);
        setSyncedAt(d.syncedAt ?? "");
      })
      .catch(() => alive && setRows([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [category]);

  const filtered = useMemo(() => {
    let list = rows;
    if (license !== "todas")
      list = list.filter((r) => r.license === license);
    const q = query.trim().toLowerCase();
    if (q)
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.providerName.toLowerCase().includes(q)
      );
    return list;
  }, [rows, license, query]);

  const minElo = Math.min(...rows.map((r) => r.elo), 1200);
  const maxElo = Math.max(...rows.map((r) => r.elo), 1500);

  const labs = useMemo(() => {
    const map = new Map<string, LeaderRow[]>();
    for (const r of filtered) {
      const arr = map.get(r.provider) ?? [];
      arr.push(r);
      map.set(r.provider, arr);
    }
    return Array.from(map.entries())
      .map(([prov, models]) => {
        const best = [...models].sort((a, b) => b.elo - a.elo).slice(0, 3);
        const avg = Math.round(best.reduce((s, m) => s + m.elo, 0) / best.length);
        return {
          provider: prov,
          name: PROVIDERS[prov]?.name ?? prov,
          elo: avg,
          models: models.length,
          best: best[0]?.name ?? "—",
        };
      })
      .sort((a, b) => b.elo - a.elo);
  }, [filtered]);

  const pareto = useMemo(
    () =>
      [...filtered]
        // Los generativos cobran por segundo/imagen, no por 1M tokens:
        // compararlos aquí sería manzanas contra naranjas.
        .filter((r) => !r.categories.some((c) => ["imagen", "video", "audio"].includes(c)))
        .map((r) => ({ ...r, value: r.elo / Math.max(r.priceOut, 0.4) }))
        .sort((a, b) => b.value - a.value),
    [filtered]
  );

  const maxPareto = pareto[0]?.value ?? 1;
  const totalVotes = rows.reduce((s, r) => s + r.votes, 0);
  const dateLabel = syncedAt
    ? new Date(syncedAt).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Pestañas de arena */}
      <div className="scrollbar-thin flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border px-3 py-2 sm:px-5">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => changeCategory(t.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13.5px] transition-colors",
                category === t.id
                  ? "bg-secondary font-medium"
                  : "text-foreground/75 hover:bg-accent"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t.label}
              {NEW_CATEGORIES.includes(t.id) && <NewBadge k={`cat-${t.id}`} />}
            </button>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Panel de filtros */}
        {showFilters && (
          <aside className="scrollbar-thin hidden w-[264px] shrink-0 overflow-y-auto border-r border-border p-4 md:block">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-[13.5px] font-medium">
                <Eye className="h-4 w-4" /> Ver como
              </p>
              <button
                onClick={() => setShowFilters(false)}
                className="text-muted-foreground hover:text-foreground"
                title="Ocultar filtros"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-2.5 flex rounded-lg border border-border p-1">
              <button
                onClick={() => setViewAs("ranking")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[12.5px]",
                  viewAs === "ranking" ? "bg-card shadow-sm font-medium" : "text-muted-foreground"
                )}
              >
                <ListOrdered className="h-3.5 w-3.5" /> Ranking
              </button>
              <button
                onClick={() => {
                  setViewAs("pareto");
                  markUsed("pareto");
                }}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[12.5px]",
                  viewAs === "pareto" ? "bg-card shadow-sm font-medium" : "text-muted-foreground"
                )}
              >
                <ChartLine className="h-3.5 w-3.5" /> Pareto
                {viewAs !== "pareto" && <NewBadge k="pareto" />}
              </button>
            </div>

            <p className="mt-5 flex items-center gap-2 text-[13.5px] font-medium">
              <Trophy className="h-4 w-4" /> Categorías ({TABS.length})
            </p>
            <div className="mt-2 space-y-0.5">
              {TABS.map((t) => {
                const CIcon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => changeCategory(t.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-[13.5px] hover:bg-accent",
                      category === t.id && "bg-secondary font-medium"
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <CIcon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{t.label}</span>
                      {NEW_CATEGORIES.includes(t.id) && <NewBadge k={`cat-${t.id}`} />}
                    </span>
                    {category === t.id && <CircleCheck className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <p className="mt-5 text-[13.5px] font-medium">{t("Tipo de licencia")}</p>
            <div className="mt-2 space-y-1">
              {(
                [
                  ["todas", t("Todas")],
                  ["abierto", t("Pesos abiertos")],
                  ["propietario", t("Propietaria")],
                ] as const
              ).map(([id, label]) => (
                <label
                  key={id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13.5px] hover:bg-accent"
                >
                  <input
                    type="radio"
                    checked={license === id}
                    onChange={() => setLicense(id)}
                    className="h-3.5 w-3.5 accent-black"
                  />
                  {label}
                </label>
              ))}
            </div>
          </aside>
        )}

        {/* Contenido principal */}
        <div className="scrollbar-thin min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="mx-auto max-w-[900px]">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-[32px] font-medium tracking-tight">
                {category === "global" ? t("Arena") : `${t("Arena")} ${t(TABS.find((tab) => tab.id === category)?.label ?? "")}`}
              </h1>
              <span className="flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-[13px] font-medium">
                {(() => {
                  const TIcon = TABS.find((tab) => tab.id === category)?.icon ?? Trophy;
                  return <TIcon className="h-4 w-4" />;
                })()}
                {t(TABS.find((tab) => tab.id === category)?.label ?? "")}
              </span>
            </div>
            <p className="mt-2 max-w-[680px] text-[14px] leading-relaxed text-foreground/85">
              {CAT_DESC[category]}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {dateLabel}
              </span>
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> {totalVotes.toLocaleString("es-ES")} {t("votos registrados")}
              </span>
              <span className="flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" /> {t("{n} modelos", { n: rows.length })}
              </span>
            </div>

            {/* v1.19.0 — Ticker de actividad en vivo */}
            {actividad.length > 0 &&
              (() => {
                const ev = actividad[idxActividad % actividad.length];
                return (
                  <div
                    key={idxActividad}
                    className="fade-up mt-2 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[12.5px]"
                  >
                    <span className="copa-pulse h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">
                      {ev.empate
                        ? t("{a} empató con {b}", { a: ev.nombreA, b: ev.nombreB })
                        : t("{a} venció a {b}", {
                            a: getModel(ev.ganador ?? "")?.name ?? ev.nombreA,
                            b: getModel(ev.perdedor ?? "")?.name ?? ev.nombreB,
                          })}
                      {" · "}
                      <span className="font-medium text-foreground/70">
                        {t(ETIQUETA_CATEGORIA[ev.categoria] ?? ev.categoria)}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                      {haceCuanto(ev.at)}
                    </span>
                  </div>
                );
              })()}

            {/* Barra de herramientas */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {!showFilters && (
                <button
                  onClick={() => setShowFilters(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12.5px] hover:bg-accent"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" /> {t("Mostrar filtros")}
                </button>
              )}
              <div className="relative flex-1 sm:max-w-[240px]">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("Filtrar modelos…")}
                  className="w-full rounded-lg border border-border bg-card py-1.5 pl-8 pr-3 text-[13px] outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-foreground/20"
                />
              </div>
              <div className="flex rounded-lg border border-border p-0.5">
                <button
                  onClick={() => setEntities("models")}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2.5 py-1 text-[12.5px]",
                    entities === "models" ? "bg-secondary font-medium" : "text-muted-foreground"
                  )}
                >
                  <Cpu className="h-3.5 w-3.5" /> Modelos
                </button>
                <button
                  onClick={() => {
                    setEntities("labs");
                    markUsed("labs");
                  }}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2.5 py-1 text-[12.5px]",
                    entities === "labs" ? "bg-secondary font-medium" : "text-muted-foreground"
                  )}
                >
                  <Building2 className="h-3.5 w-3.5" /> Labs
                  {entities !== "labs" && <NewBadge k="labs" />}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="mt-5 space-y-2.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="skeleton h-[52px] w-full" />
                ))}
              </div>
            ) : viewAs === "pareto" && entities === "models" ? (
              /* ── Vista Pareto: ELO por dólar ── */
              <div className="mt-5 space-y-1.5">
                <p className="mb-3 text-[12.5px] text-muted-foreground">
                  Eficiencia = ELO ÷ precio de salida (USD/1M tokens). Más alto = más
                  inteligencia por dólar.
                </p>
                {pareto.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
                  >
                    <span className="w-6 shrink-0 text-right font-mono text-[12px] text-muted-foreground">
                      {r.rank}
                    </span>
                    <span className="w-[180px] shrink-0 truncate font-mono text-[12.5px]">
                      {r.name}
                    </span>
                    <div className="h-4 flex-1 overflow-hidden rounded bg-secondary">
                      <div
                        className="h-full rounded bg-emerald-600/85"
                        style={{ width: `${Math.max((r.value / maxPareto) * 100, 2)}%` }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right font-mono text-[12px]">
                      {r.value.toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            ) : entities === "labs" ? (
              /* ── Vista Labs: media de los 3 mejores por organización ── */
              <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
                {labs.map((l, i) => (
                  <div
                    key={l.provider}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3",
                      i > 0 && "border-t border-border"
                    )}
                  >
                    <span className="w-7 text-center font-mono text-[13px] text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card">
                      <ProviderLogo provider={l.provider} size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">{l.name}</p>
                      <p className="text-[11.5px] text-muted-foreground">
                        {l.models} modelos · mejor: <span className="font-mono">{l.best}</span>
                      </p>
                    </div>
                    <span className="font-mono text-[14px] font-semibold">{l.elo}</span>
                  </div>
                ))}
              </div>
            ) : (
              /* ── Tabla ranking réplica ── */
              <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-card scrollbar-thin">
                <table className="w-full min-w-[640px] border-collapse">
                  <thead>
                    <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Rank</th>
                      <th className="px-4 py-3 font-medium">{t("Modelo")}</th>
                      <th className="px-4 py-3 text-right font-medium">{t("Puntuación arena")}</th>
                      <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">
                        IC 95%
                      </th>
                      <th className="hidden px-4 py-3 text-right font-medium md:table-cell">
                        {t("Votos")}
                      </th>
                      <th className="w-[90px] px-4 py-3 font-medium">{t("Distribución")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => {
                      const lo = Math.max(1, (r.rank ?? 1) - 3);
                      const hi = Math.min(rows.length, (r.rank ?? 1) + 3);
                      const pct =
                        12 +
                        ((r.elo - minElo) / Math.max(maxElo - minElo, 1)) * 88;
                      return (
                        <tr
                          key={r.id}
                          className="border-b border-border/60 transition-colors last:border-0 hover:bg-accent/50"
                        >
                          <td className="px-4 py-3">
                            <div className="text-[14px] font-medium">{r.rank}</div>
                            <div className="font-mono text-[10.5px] text-muted-foreground">
                              {lo} ↔ {hi}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <ProviderLogo provider={r.provider} size={20} />
                              <span className="truncate font-mono text-[13px] font-medium">
                                {r.name}
                              </span>
                              {r.isNew && (
                                <span className="shrink-0 rounded bg-highlight px-1 py-px text-[9.5px] font-bold uppercase">
                                  Nuevo
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 pl-[28px] text-[11.5px] text-muted-foreground">
                              {r.providerName} ·{" "}
                              {r.license === "abierto" ? "Pesos abiertos" : "Propietaria"}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {r.delta !== 0 && (
                                r.delta > 0 ? (
                                  <ChevUp className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5 text-red-500" />
                                )
                              )}
                              <span className="font-mono text-[13.5px] font-semibold">
                                {r.elo}
                              </span>
                            </div>
                            {r.delta !== 0 && (
                              <p
                                className={cn(
                                  "font-mono text-[11px]",
                                  r.delta > 0 ? "text-emerald-600" : "text-red-500"
                                )}
                              >
                                {r.delta > 0 ? "+" : ""}
                                {r.delta}
                              </p>
                            )}
                            {typeof r.eloArena === "number" && (
                              <p
                                className="font-mono text-[10px] text-muted-foreground"
                                title="ELO separado de la arena generativa (v1.19.0): esta dimensión arranca en 1000 y solo mueve con votos de imagen/vídeo/audio"
                              >
                                IA {r.eloArena} · {r.eloArenaBattles} batallas de{" "}
                                {(ETIQUETA_CATEGORIA[category] ?? category).toLowerCase()}
                              </p>
                            )}
                            {typeof r.eloGlobal === "number" && typeof r.eloArena !== "number" && (
                              <p
                                className="font-mono text-[10px] text-muted-foreground"
                                title="ELO global persistente en la base de datos (v1.9.0)"
                              >
                                G {r.eloGlobal} · {r.eloGlobalBattles} batallas
                              </p>
                            )}
                          </td>
                          <td className="hidden px-4 py-3 text-right font-mono text-[12px] text-muted-foreground sm:table-cell">
                            ±{r.ci}
                          </td>
                          <td className="hidden px-4 py-3 text-right font-mono text-[12px] text-muted-foreground md:table-cell">
                            {r.votes}
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                              <div
                                className="h-full rounded-full bg-emerald-600/85 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <p className="px-4 py-12 text-center text-[13.5px] text-muted-foreground">
                    Ningún modelo coincide con los filtros actuales.
                  </p>
                )}
              </div>
            )}

            <p className="mt-4 flex items-center gap-1.5 text-[12px] text-muted-foreground">
              {r_delta_hint()}
              Los puntos se recalculan con cada voto ciego registrado en la arena.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function r_delta_hint() {
  return (
    <span className="flex items-center">
      <ChevUp className="h-3.5 w-3.5 text-emerald-600" />
    </span>
  );
}
