"use client";

import { useState } from "react";
import {
  Trophy,
  Loader2,
  RotateCcw,
  Crown,
  Swords,
  CircleCheck,
  ArrowDown,
} from "lucide-react";
import { useArena } from "@/components/shell/arena-context";
import Markdown from "./Markdown";
import ProviderLogo from "./ProviderLogo";
import { markUsed } from "@/lib/badges";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/* ───────────────────────── Tipos ───────────────────────── */

interface Contender {
  label: string;
  text: string;
  model?: { id: string; name: string; provider: string; elo: number };
}

interface Duel {
  key: "semi1" | "semi2" | "final";
  a: Contender;
  b: Contender;
  winner?: "a" | "b";
  swing?: number;
}

interface Copa {
  id: string;
  prompt: string;
  revealed: boolean;
  phase: "semis" | "final-cargando" | "final" | "campeon";
  champion?: Contender["model"] | null;
  semi1?: Duel;
  semi2?: Duel;
  final?: Duel;
}

const EXAMPLES = [
  "Explícale a un niño de 10 años por qué el cielo es azul, con una analogía memorable",
  "Diseña el plan de lanzamiento de una cafetería especializada en un barrio universitario",
  "Escribe el primer párrafo de una novela que empiece con una tormenta en una biblioteca",
  "¿Qué lenguaje de programación conviene aprender en 2026 y por qué?",
];

const CONFETTI_COLORS = ["#F4C406", "#2E2B29", "#B45309", "#15803D", "#7C3AED", "#DC2626"];

/** Piezas de confeti con valores deterministas (sin hidratación errática). */
function Confetti() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 26 }).map((_, i) => {
        const left = ((i * 37) % 100) + (i % 3);
        const delay = ((i * 13) % 30) / 10;
        const dur = 2.6 + ((i * 7) % 18) / 10;
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const w = 6 + (i % 3) * 2;
        return (
          <span
            key={i}
            className="copa-confetti-piece"
            style={{
              left: `${left}%`,
              width: w,
              height: w + 5,
              background: color,
              animationDelay: `${delay}s`,
              animationDuration: `${dur}s`,
            }}
          />
        );
      })}
    </div>
  );
}

/* ─────────────────── Tarjeta de contendiente ─────────────────── */

function ContenderCard({
  duel,
  side,
  showResult,
}: {
  duel: Duel;
  side: "a" | "b";
  showResult: boolean;
}) {
  const c = side === "a" ? duel.a : duel.b;
  const isWinner = showResult && duel.winner === side;
  const isLoser = showResult && duel.winner && duel.winner !== side;
  const tag =
    duel.key === "final"
      ? c.label === "F1"
        ? "Ganador SF1"
        : "Ganador SF2"
      : `Contendiente ${c.label}`;

  return (
    <div
      className={cn(
        "copa-pop rounded-xl border bg-card transition-colors",
        isWinner ? "border-foreground" : "border-border",
        isLoser && "opacity-55"
      )}
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Swords className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="font-mono text-[12.5px] font-medium">{tag}</span>
        {isWinner && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-highlight px-2 py-0.5 text-[10.5px] font-semibold uppercase">
            <Crown className="h-3 w-3" /> Pasa la ronda
          </span>
        )}
        {!isWinner && c.model && (
          <span className="ml-auto flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            {c.model.elo ? <span className="font-mono">ELO {c.model.elo}</span> : null}
          </span>
        )}
        {isWinner && c.model && (
          <span className="ml-auto hidden font-mono text-[11.5px] text-muted-foreground sm:inline">
            ELO {c.model.elo}
          </span>
        )}
      </div>
      <div className="px-3.5 py-3">
        <div className="arena-prose text-[13.5px]">
          <Markdown>{c.text}</Markdown>
        </div>
      </div>
      {showResult && isWinner && typeof duel.swing === "number" && duel.swing !== 0 && (
        <div className="border-t border-border px-3.5 py-2 text-[12px] text-emerald-700">
          <span className="font-mono">
            {duel.swing > 0 ? "+" : ""}
            {duel.swing} ELO
          </span>{" "}
          en este duelo
        </div>
      )}
    </div>
  );
}

/* ─────────────────── Duelo con botones de voto ─────────────────── */

function DuelCard({
  duel,
  title,
  voting,
  onVote,
}: {
  duel: Duel;
  title: string;
  voting: boolean;
  onVote: (winner: "a" | "b") => void;
}) {
  const decided = Boolean(duel.winner);
  const labelA =
    duel.key === "final"
      ? "Gana el ganador SF1"
      : `Gana ${duel.a.label}`;
  const labelB =
    duel.key === "final"
      ? "Gana el ganador SF2"
      : `Gana ${duel.b.label}`;

  return (
    <section className={cn("fade-up", duel.key === "final" && "mx-auto w-full max-w-[820px]")}>
      <header className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-[17px] font-semibold">{title}</h3>
        {decided ? (
          <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
            <CircleCheck className="h-3.5 w-3.5 text-emerald-600" /> Ronda decidida
          </span>
        ) : (
          <span className="copa-pulse flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> En vivo — anónimo
          </span>
        )}
      </header>
      <div className={cn("grid gap-3", duel.key !== "final" && "sm:grid-cols-1 lg:grid-cols-1")}>
        <ContenderCard duel={duel} side="a" showResult={decided} />
        <ContenderCard duel={duel} side="b" showResult={decided} />
      </div>
      {!decided && (
        <div className="mt-3 rounded-xl border border-border bg-card p-3">
          <p className="mb-2 text-center text-[12.5px] text-muted-foreground">
            Elige quién pasa a la siguiente ronda. Tu voto actualiza el ELO real.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(["a", "b"] as const).map((w) => (
              <button
                key={w}
                disabled={voting}
                onClick={() => onVote(w)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors",
                  w === "a" ? "border-border hover:bg-accent" : "border-border hover:bg-accent",
                  voting && "cursor-wait opacity-60"
                )}
              >
                {voting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {w === "a" ? labelA : labelB}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ───────────────────────── Vista principal ───────────────────────── */

export default function TournamentView() {
  const arena = useArena();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [copa, setCopa] = useState<Copa | null>(null);
  const [starting, setStarting] = useState(false);
  const [votingDuel, setVotingDuel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCopa = async () => {
    const p = prompt.trim();
    if (p.length < 2) {
      setError("Escribe la consigna con la que competirán los 4 modelos.");
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", prompt: p }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo iniciar la copa.");
      markUsed("modo-torneo");
      setCopa(data.copa as Copa);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error inesperado";
      setError(msg);
      toast({ title: "Copa Todólogo", description: msg, variant: "destructive" });
    } finally {
      setStarting(false);
    }
  };

  const vote = async (duelKey: "semi1" | "semi2" | "final", winner: "a" | "b") => {
    if (!copa || votingDuel) return;
    setVotingDuel(duelKey);
    try {
      const res = await fetch("/api/tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "vote", id: copa.id, duel: duelKey, winner }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "El voto no se pudo registrar.");
      setCopa(data.copa as Copa);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error inesperado";
      toast({ title: "Copa Todólogo", description: msg, variant: "destructive" });
    } finally {
      setVotingDuel(null);
    }
  };

  const reset = () => {
    setCopa(null);
    setPrompt("");
    setError(null);
  };

  /* ── Portada de la copa ── */
  if (!copa) {
    return (
      <div className="flex flex-1 flex-col items-center overflow-y-auto scrollbar-thin px-4">
        <div className="flex w-full max-w-[780px] flex-1 flex-col items-center justify-center py-10">
          <div className="copa-pop flex items-center gap-2">
            <Trophy className="h-7 w-7" strokeWidth={2.2} />
            <span className="font-display text-[30px] font-semibold">Copa Todólogo</span>
            <span className="rounded bg-highlight px-1.5 py-0.5 text-[10px] font-bold uppercase">
              Nuevo
            </span>
          </div>
          <h1 className="mt-3 text-center font-display text-[40px] font-light leading-[1.1] tracking-tight sm:text-[48px]">
            Cuatro modelos.{" "}
            <span className="bg-highlight inline-block px-2 font-medium italic leading-[1.05]">
              Un campeón.
            </span>
          </h1>
          <p className="mt-4 max-w-[560px] text-center text-[14.5px] leading-relaxed text-muted-foreground">
            El torneo de eliminación directa que no existe en ningún otro arena: sortea 4
            modelos anónimos, compiten en semifinales con tu misma consigna, tú decides quién
            gana cada duelo y los finalistas se enfrentan en la gran final. Todos los votos
            mueven el ELO real del ranking.
          </p>

          {/* Reglas */}
          <div className="mt-6 grid w-full max-w-[640px] gap-2 sm:grid-cols-4">
            {[
              ["1", "Sorteo", "4 modelos del top del ranking, en anonato total"],
              ["2", "Semifinales", "Los 4 responden tu consigna; votas 2 ganadores"],
              ["3", "Gran final", "Los ganadores responden de nuevo; elige al campeón"],
              ["4", "Revelación", "Se destapan las identidades y el ELO se ajusta"],
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-xl border border-border bg-card px-3 py-2.5">
                <span className="font-mono text-[11px] text-muted-foreground">PASO {n}</span>
                <p className="text-[13px] font-medium">{t}</p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>

          {/* Consigna */}
          <div className="mt-8 w-full max-w-[640px]">
            <label className="mb-1.5 block text-[12.5px] font-medium text-muted-foreground">
              Consigna de la copa (los 4 modelos responderán lo mismo)
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              maxLength={4000}
              placeholder="Ej.: Propón una idea de negocio digital que pueda empezar mañana con menos de 100 €…"
              className="w-full resize-none rounded-xl border border-border bg-card px-3.5 py-3 text-[14px] outline-none placeholder:text-muted-foreground focus:border-foreground/40"
            />
            {error && <p className="mt-1.5 text-[12.5px] text-red-600">{error}</p>}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  className="max-w-full truncate rounded-full border border-border bg-card px-3 py-1.5 text-left text-[12px] text-muted-foreground hover:bg-accent"
                >
                  {ex}
                </button>
              ))}
            </div>
            <button
              onClick={startCopa}
              disabled={starting}
              className="relative mt-4 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-foreground px-4 py-3 text-[14.5px] font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-wait opacity-90"
            >
              {starting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sorteando contendientes y generando semifinales…
                </>
              ) : (
                <>
                  <Trophy className="h-4 w-4" />
                  Sortear e iniciar la copa
                </>
              )}
              {starting && (
                <span className="copa-sweep absolute inset-y-0 w-1/3 bg-white/10" />
              )}
            </button>
            <p className="mt-2 text-center text-[11.5px] text-muted-foreground">
              Semifinales en paralelo (~15-50 s). Después votas las dos rondas y la final.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Campeón y revelación ── */
  if (copa.revealed && copa.phase === "campeon") {
    const champ = copa.champion;
    const all: { label: string; model?: Contender["model"] }[] = [
      { label: "A1", model: copa.semi1?.a.model },
      { label: "A2", model: copa.semi1?.b.model },
      { label: "B1", model: copa.semi2?.a.model },
      { label: "B2", model: copa.semi2?.b.model },
    ];
    return (
      <div className="relative flex flex-1 flex-col items-center overflow-y-auto scrollbar-thin px-4">
        <Confetti />
        <div className="flex w-full max-w-[780px] flex-1 flex-col items-center py-12">
          <div className="copa-pop flex h-16 w-16 items-center justify-center rounded-full bg-highlight">
            <Trophy className="h-8 w-8" strokeWidth={2.2} />
          </div>
          <p className="mt-4 text-[12.5px] font-medium uppercase tracking-widest text-muted-foreground">
            Campeón de la Copa Todólogo
          </p>
          <div className="copa-pop mt-2 flex items-center gap-3">
            <ProviderLogo provider={champ?.provider ?? ""} size={30} />
            <span className="font-display text-[38px] font-semibold leading-none">
              {champ?.name ?? "—"}
            </span>
          </div>
          <p className="mt-2 font-mono text-[13px] text-muted-foreground">
            {champ?.elo ? `ELO base ${champ.elo}` : ""} · 3 duelos ganados · votos registrados en el ranking real
          </p>

          {/* Revelación de identidades */}
          <div className="mt-8 w-full max-w-[640px] rounded-2xl border border-border bg-card p-4">
            <p className="mb-3 text-center text-[13px] font-medium">
              ¿Quién era quién? La copa era anónima y estas son las identidades
            </p>
            <div className="grid grid-cols-2 gap-2">
              {all.map(({ label, model }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-xl border border-border px-3 py-2"
                >
                  <ProviderLogo provider={model?.provider ?? ""} size={18} />
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[12.5px] font-medium">
                      {model?.name ?? "—"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Contendiente {label}
                    </p>
                  </div>
                  {champ && model?.id === champ.id && (
                    <Crown className="ml-auto h-4 w-4 shrink-0 text-amber-500" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={reset}
            className="mt-8 flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-[14px] font-medium text-background hover:opacity-90"
          >
            <RotateCcw className="h-4 w-4" />
            Nueva copa
          </button>
        </div>
      </div>
    );
  }

  /* ── Bracket en curso ── */
  const semisDecided = Boolean(copa.semi1?.winner && copa.semi2?.winner);
  const finalLoading = semisDecided && !copa.final?.a.text;
  const finalDuel = copa.final?.a.text ? copa.final : undefined;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-2 pt-4 sm:px-5">
        <div className="mx-auto max-w-[820px]">
          {/* Cabecera del bracket */}
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <Trophy className="h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="text-[13.5px] font-medium">Copa Todólogo en curso</p>
                <p className="truncate text-[12px] text-muted-foreground">«{copa.prompt}»</p>
              </div>
            </div>
            <button
              onClick={reset}
              className="shrink-0 rounded-lg border border-border px-2.5 py-1.5 text-[12px] font-medium hover:bg-accent"
            >
              Abandonar
            </button>
          </div>

          {/* Semifinales */}
          <div className="grid gap-5 lg:grid-cols-2">
            {copa.semi1 && (
              <DuelCard
                duel={copa.semi1}
                title="Semifinal 1"
                voting={votingDuel === "semi1"}
                onVote={(w) => vote("semi1", w)}
              />
            )}
            {copa.semi2 && (
              <DuelCard
                duel={copa.semi2}
                title="Semifinal 2"
                voting={votingDuel === "semi2"}
                onVote={(w) => vote("semi2", w)}
              />
            )}
          </div>

          {/* Conector hacia la final */}
          <div className="my-4 flex items-center justify-center gap-2 text-muted-foreground">
            <span className="h-px w-16 bg-border sm:w-28" />
            <ArrowDown className={cn("h-4 w-4", semisDecided && "copa-pulse")} />
            <span className="h-px w-16 bg-border sm:w-28" />
          </div>

          {/* Gran final */}
          {finalLoading && (
            <div className="fade-up mx-auto w-full max-w-[820px]">
              <h3 className="mb-2 text-center font-display text-[17px] font-semibold">
                Gran final
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {["F1", "F2"].map((l) => (
                  <div
                    key={l}
                    className="copa-pulse flex h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card"
                  >
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <p className="mt-2 text-[12.5px] text-muted-foreground">
                      Ganador de la {l === "F1" ? "SF1" : "SF2"} respondiendo…
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center text-[12px] text-muted-foreground">
                Los dos finalistas están generando sus respuestas ahora mismo.
              </p>
            </div>
          )}

          {finalDuel && (
            <DuelCard
              duel={finalDuel}
              title="Gran final — ¿quién es el campeón?"
              voting={votingDuel === "final"}
              onVote={(w) => vote("final", w)}
            />
          )}

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
