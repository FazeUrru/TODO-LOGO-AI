"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Trophy,
  Loader2,
  RotateCcw,
  Crown,
  Swords,
  CircleCheck,
  ArrowDown,
  Users,
  Share2,
  Radio,
  Hand,
  Popcorn,
  Gauge,
} from "lucide-react";
import { useArena } from "@/components/shell/arena-context";
import Markdown from "./Markdown";
import ProviderLogo from "./ProviderLogo";
import SalonFama from "./SalonFama";
import Confeti from "./Confeti";
import { NewBadge, markUsed } from "@/lib/badges";
import { reportarEventoLabs } from "@/lib/use-labs";
import { isStaticDemo } from "@/lib/static-mode";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/* ───────────────────────── Tipos ───────────────────────── */

interface Contender {
  label: string;
  text: string;
  model?: { id: string; name: string; provider: string; elo: number };
}

interface Duel {
  key: string;
  a: Contender;
  b: Contender;
  winner?: "a" | "b";
  swing?: number;
}

interface Copa {
  id: string;
  prompt: string;
  revealed: boolean;
  size: number;
  roundNames: string[];
  phase: "campeon" | "competencia";
  rounds: Duel[][];
  champion?: Contender["model"] | null;
}

const SIZES = [4, 8, 16] as const;

/**
 * v1.19.0 — Consignas del modo espectador: la grada se sienta a ver una copa
 * jugarse sola, así que el sorteo elige una consigna con sabor a final.
 */
const PROMPTS_ESPECTADOR = [
  "Defiende en 60 segundos que las bibliotecas son la infraestructura más infravalorada del siglo XXI",
  "Convierte un lunes gris en una historia épica de tres párrafos",
  "Diseña el lema y el argumentario de una marca de paraguas que solo abre con sol",
  "Explica la entropía a un capitán de barco del siglo XVIII",
  "Inventa una tradición navideña nueva que sobreviva a la primera generación",
  "Vende un botón rojo sin decir para qué sirve",
  "Escribe el primer mensaje que la humanidad envía a una civilización vecina",
  "Reescribe el cuento de la Caperucita desde el punto de vista del bosque",
];

const EXAMPLES = [
  "Explícale a un niño de 10 años por qué el cielo es azul, con una analogía memorable",
  "Diseña el plan de lanzamiento de una cafetería especializada en un barrio universitario",
  "Escribe el primer párrafo de una novela que empiece con una tormenta en una biblioteca",
  "¿Qué lenguaje de programación conviene aprender en 2026 y por qué?",
];

/** v1.19.0 — lluvia de palomitas del modo espectador (determinista). */
function Palomitas() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {Array.from({ length: 14 }).map((_, i) => {
        const left = ((i * 53) % 100) + (i % 2);
        const delay = ((i * 17) % 30) / 10;
        const dur = 3.4 + ((i * 7) % 20) / 10;
        const size = 16 + (i % 3) * 6;
        return (
          <span
            key={i}
            className="copa-confetti-piece flex items-center justify-center"
            style={{
              left: `${left}%`,
              width: size,
              height: size,
              fontSize: size - 2,
              background: "transparent",
              animationDelay: `${delay}s`,
              animationDuration: `${dur}s`,
            }}
          >
            🍿
          </span>
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
        <span className="font-mono text-[12.5px] font-medium">
          {c.label ? `Contendiente ${c.label}` : "Contendiente"}
        </span>
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
  isFinal,
  voting,
  onVote,
}: {
  duel: Duel;
  title: string;
  isFinal: boolean;
  voting: boolean;
  onVote: (winner: "a" | "b") => void;
}) {
  const decided = Boolean(duel.winner);
  const labelA = isFinal ? "Corona al campeón (A)" : `Gana ${duel.a.label || "A"}`;
  const labelB = isFinal ? "Corona al campeón (B)" : `Gana ${duel.b.label || "B"}`;

  return (
    <section className={cn("fade-up", isFinal && "mx-auto w-full max-w-[820px]")}>
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
      <div className={cn("grid gap-3", !isFinal && "sm:grid-cols-1 lg:grid-cols-1")}>
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
                  "border-border hover:bg-accent",
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
  const [size, setSize] = useState<number>(4);
  const [copa, setCopa] = useState<Copa | null>(null);
  const [starting, setStarting] = useState(false);
  const [votingDuel, setVotingDuel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /* ── Modo espectador (v1.19.0): la grada ve la copa jugarse sola ── */
  const [espectador, setEspectador] = useState(false);
  const [velocidad, setVelocidad] = useState<1 | 2 | 4>(1);
  const [aplausos, setAplausos] = useState(0);
  const [palomitas, setPalomitas] = useState(false);
  const [fraseGrada, setFraseGrada] = useState<string | null>(null);
  const espectadorActivo = useRef(false);
  useEffect(() => {
    espectadorActivo.current = espectador;
  }, [espectador]);

  const startCopa = async () => {
    const p = prompt.trim();
    if (p.length < 2) {
      setError(`Escribe la consigna con la que competirán los ${size} modelos.`);
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", prompt: p, size }),
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

  const vote = async (duelKey: string, winner: "a" | "b") => {
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
    setEspectador(false);
    setPalomitas(false);
    setAplausos(0);
    setFraseGrada(null);
  };

  /**
   * v1.19.0 — Entrar como espectador: sortea una copa con consigna de la
   * casa y la deja en manos de la grada. Tú solo aplaudes (o comes palomitas).
   */
  const verCopaEnDirecto = async () => {
    const consigna = PROMPTS_ESPECTADOR[Math.floor(Math.random() * PROMPTS_ESPECTADOR.length)];
    setPrompt(consigna);
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", prompt: consigna, size: 4 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo iniciar la copa en directo.");
      markUsed("modo-torneo");
      markUsed("espectador");
      reportarEventoLabs("streaming-ws", "used");
      setEspectador(true);
      setAplausos(0);
      setCopa(data.copa as Copa);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error inesperado";
      setError(msg);
      toast({ title: "Modo espectador", description: msg, variant: "destructive" });
    } finally {
      setStarting(false);
    }
  };

  /** Bucle de la grada: vota cada duelo pendiente con pausa dramática. */
  useEffect(() => {
    if (!espectador || !copa || copa.revealed) return;
    const ultimo = copa.rounds[copa.rounds.length - 1] ?? [];
    const pendiente = ultimo.find((d) => d.a.text && !d.winner);
    if (!pendiente) return; // sin textos aún (ronda generándose) o ya decidida
    let cancelado = false;
    const pausa = (3500 + Math.random() * 2500) / velocidad;
    const t = setTimeout(async () => {
      if (cancelado || !espectadorActivo.current) return;
      setFraseGrada("La grada delibera…");
      await new Promise((r) => setTimeout(r, 1200 / velocidad));
      if (cancelado || !espectadorActivo.current) return;
      const elegido: "a" | "b" = Math.random() < 0.5 ? "a" : "b";
      setFraseGrada(`La grada vota: gana el contendiente ${(elegido === "a" ? pendiente.a : pendiente.b).label || (elegido === "a" ? "A" : "B")}`);
      try {
        await vote(pendiente.key, elegido);
        setAplausos((a) => a + 2 + Math.floor(Math.random() * 9));
      } catch {
        /* el voto fallido solo retrasa el espectáculo */
      }
      setFraseGrada(null);
    }, pausa);
    return () => {
      cancelado = true;
      clearTimeout(t);
    };
  }, [espectador, copa, velocidad]);

  /** v1.18.0 — comparte la copa por URL permanente: replay público del cuadro. */
  const compartirCopa = async () => {
    if (!copa) return;
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "copa", copaId: copa.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "No se pudo compartir la copa.");
      const url = `${window.location.origin}${data.url}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Replay de la copa creado y enlace copiado",
        description: `Cualquiera puede repasar el cuadro entero en ${url}`,
      });
    } catch (e) {
      toast({
        title: "No se pudo compartir la copa",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      });
    }
  };

  /* ── Portada de la copa ── */
  if (!copa) {
    return (
      <div className="flex flex-1 flex-col items-center overflow-y-auto scrollbar-thin px-4">
        <div className="flex w-full max-w-[780px] flex-1 flex-col items-center justify-center py-10">
          <div className="copa-pop flex items-center gap-2">
            <Trophy className="h-7 w-7" strokeWidth={2.2} />
            <span className="font-display text-[30px] font-semibold">Copa Todólogo</span>
          </div>
          <h1 className="mt-3 text-center font-display text-[40px] font-light leading-[1.1] tracking-tight sm:text-[48px]">
            Hasta 16 modelos.{" "}
            <span className="bg-highlight inline-block px-2 font-medium italic leading-[1.05]">
              Un campeón.
            </span>
          </h1>
          <p className="mt-4 max-w-[560px] text-center text-[14.5px] leading-relaxed text-muted-foreground">
            El torneo de eliminación directa que no existe en ningún otro arena: sortea 4, 8
            o 16 modelos anónimos, compiten por eliminatorias con tu misma consigna, tú
            decides quién gana cada duelo y la gran final corona al campeón. Todos los votos
            mueven el ELO real del ranking — y desde la v1.9.0 también el ELO global
            persistente.
          </p>

          {/* Selector de tamaño */}
          <div className="mt-6 flex w-full max-w-[640px] flex-col gap-2 rounded-xl border border-border bg-card p-3">
            <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> Tamaño del cuadro
            </p>
            <div className="grid grid-cols-3 gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-center transition-colors",
                    size === s
                      ? "border-foreground bg-accent"
                      : "border-border hover:bg-accent/60"
                  )}
                >
                  <span className="block font-display text-[19px] font-semibold">{s}</span>
                  <span className="block text-[10.5px] text-muted-foreground">
                    {s === 4
                      ? "Semis + final"
                      : s === 8
                        ? "Cuartos + semis + final"
                        : "Octavos · torneo XXL"}
                  </span>
                </button>
              ))}
            </div>
            {size > 4 && (
              <p className="text-[11.5px] text-muted-foreground">
                {size === 8
                  ? "3 rondas y 7 duelos: el sorteo genera los cuartos en paralelo (~15-50 s) y cada ronda se juega al votar."
                  : "4 rondas y 15 duelos: torneo completo con octavos, cuartos, semis y gran final. Cada ronda se genera al votar la anterior."}
              </p>
            )}
          </div>

          {/* Reglas */}
          <div className="mt-4 grid w-full max-w-[640px] gap-2 sm:grid-cols-4">
            {[
              ["1", "Sorteo", `${size} modelos del top del ranking, en anonato total`],
              ["2", "Primera ronda", `Los ${size} responden; votas a los ganadores`],
              ["3", "Eliminatorias", "Cada ronda se genera al votar la anterior"],
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
              Consigna de la copa (los {size} modelos responderán lo mismo)
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
                  Sorteando {size} contendientes y generando la primera ronda…
                </>
              ) : (
                <>
                  <Trophy className="h-4 w-4" />
                  Sortear e iniciar la copa de {size}
                </>
              )}
              {starting && (
                <span className="copa-sweep absolute inset-y-0 w-1/3 bg-white/10" />
              )}
            </button>
            <p className="mt-2 text-center text-[11.5px] text-muted-foreground">
              Primera ronda en paralelo (~15-50 s). Después votas ronda a ronda hasta la
              gran final.
            </p>

            {/* v1.19.0 — Modo espectador: ver una copa jugarse en directo */}
            <button
              onClick={verCopaEnDirecto}
              disabled={starting}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-[13.5px] font-medium transition-colors hover:bg-accent disabled:opacity-60"
            >
              {starting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Preparando el estadio…
                </>
              ) : (
                <>
                  <Radio className="h-4 w-4 text-red-600" />
                  Ver una copa en directo (modo espectador)
                  <NewBadge k="espectador" />
                </>
              )}
            </button>
            <p className="mt-1.5 text-center text-[11px] text-muted-foreground">
              La grada sortea una copa de 4, la juega sola y tú aplaudes. Puedes tomar el
              control cuando quieras.
            </p>
          </div>
          <SalonFama />
        </div>
      </div>
    );
  }

  /* ── Campeón y revelación ── */
  if (copa.revealed && copa.phase === "campeon") {
    const champ = copa.champion;
    const all = (copa.rounds[0] ?? []).flatMap((d) => [d.a, d.b]);
    return (
      <div className="relative flex flex-1 flex-col items-center overflow-y-auto scrollbar-thin px-4">
        <Confeti piezas={26} />
        <div className="flex w-full max-w-[780px] flex-1 flex-col items-center py-12">
          <div className="copa-pop flex h-16 w-16 items-center justify-center rounded-full bg-highlight">
            <Trophy className="h-8 w-8" strokeWidth={2.2} />
          </div>
          <p className="mt-4 text-[12.5px] font-medium uppercase tracking-widest text-muted-foreground">
            Campeón de la Copa Todólogo de {copa.size}
          </p>
          <div className="copa-pop mt-2 flex items-center gap-3">
            <ProviderLogo provider={champ?.provider ?? ""} size={30} />
            <span className="font-display text-[38px] font-semibold leading-none">
              {champ?.name ?? "—"}
            </span>
          </div>
          <p className="mt-2 font-mono text-[13px] text-muted-foreground">
            {champ?.elo ? `ELO base ${champ.elo}` : ""} · {copa.rounds.length} duelos ganados ·
            votos registrados en el ranking real y el ELO global
          </p>
          {espectador && (
            <p className="copa-pulse mt-2 flex items-center justify-center gap-1.5 text-[13px] font-medium text-red-600">
              <Hand className="h-4 w-4" />
              La grada enloqueció: {aplausos} aplausos para el campeón
            </p>
          )}
          {palomitas && <Palomitas />}

          {/* Revelación de identidades */}
          <div className="mt-8 w-full max-w-[680px] rounded-2xl border border-border bg-card p-4">
            <p className="mb-3 text-center text-[13px] font-medium">
              ¿Quién era quién? La copa de {copa.size} era anónima y estas son las
              identidades
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {all.map((c) => (
                <div
                  key={c.label}
                  className="flex items-center gap-2 rounded-xl border border-border px-3 py-2"
                >
                  <ProviderLogo provider={c.model?.provider ?? ""} size={18} />
                  <div className="min-w-0">
                    <p className="truncate font-mono text-[12.5px] font-medium">
                      {c.model?.name ?? "—"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Contendiente {c.label}</p>
                  </div>
                  {champ && c.model?.id === champ.id && (
                    <Crown className="ml-auto h-4 w-4 shrink-0 text-amber-500" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {!isStaticDemo() && (
            <button
              onClick={compartirCopa}
              className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-[14px] font-medium hover:bg-accent"
            >
              <Share2 className="h-4 w-4" />
              Compartir replay de la copa
            </button>
          )}
          <button
            onClick={reset}
            className="mt-8 flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-[14px] font-medium text-background hover:opacity-90"
          >
            <RotateCcw className="h-4 w-4" />
            Nueva copa
          </button>

          <SalonFama destacadoId={champ?.id ?? null} />
        </div>
      </div>
    );
  }

  /* ── Bracket en curso ── */
  const lastIdx = copa.rounds.length - 1;
  const lastRound = copa.rounds[lastIdx] ?? [];
  const lastDecided = lastRound.length > 0 && lastRound.every((d) => d.winner);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-2 pt-4 sm:px-5">
        <div className="mx-auto max-w-[820px]">
          {/* Cabecera del bracket */}
          <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <Trophy className="h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="text-[13.5px] font-medium">
                  Copa Todólogo de {copa.size} en curso
                </p>
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

          {/* v1.19.0 — Barra EN DIRECTO del modo espectador */}
          {espectador && (
            <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-red-500/30 bg-card px-4 py-2.5">
              <span className="copa-pulse flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide text-red-600">
                <span className="h-2 w-2 rounded-full bg-red-500" /> En directo
              </span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted-foreground">
                {fraseGrada ?? "La grada vota cada duelo: tú solo disfrutas (y aplaudes)"}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setAplausos((a) => a + 1)}
                  className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[12px] font-medium hover:bg-accent"
                  title="Aplaudir"
                >
                  <Hand className="h-3.5 w-3.5" /> {aplausos}
                </button>
                <button
                  onClick={() => setPalomitas((p) => !p)}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border px-2 py-1 text-[12px] font-medium hover:bg-accent",
                    palomitas ? "border-amber-500 bg-amber-500/10 text-amber-700" : "border-border"
                  )}
                  title="Palomitas (lluvia de 🍿)"
                >
                  <Popcorn className="h-3.5 w-3.5" /> Palomitas
                </button>
                <span className="flex items-center gap-0.5 rounded-lg border border-border p-0.5" title="Velocidad de la grada">
                  <Gauge className="mx-1 h-3.5 w-3.5 text-muted-foreground" />
                  {([1, 2, 4] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setVelocidad(v)}
                      className={cn(
                        "rounded px-1.5 py-0.5 font-mono text-[11.5px]",
                        velocidad === v ? "bg-secondary font-semibold" : "text-muted-foreground hover:bg-accent"
                      )}
                    >
                      x{v}
                    </button>
                  ))}
                </span>
                <button
                  onClick={() => {
                    setEspectador(false);
                    setFraseGrada(null);
                    toast({ title: "Control tomado", description: "La copa sigue en juego: ahora votas tú." });
                  }}
                  className="rounded-lg bg-foreground px-2.5 py-1 text-[12px] font-medium text-background hover:opacity-90"
                >
                  Tomar el control
                </button>
              </div>
            </div>
          )}

          {copa.rounds.map((round, ri) => {
            const isFinalRound = ri === lastIdx;
            const roundDecided = round.every((d) => d.winner);
            return (
              <div key={`round-${ri}`}>
                <div
                  className={cn(
                    "grid gap-5",
                    !isFinalRound && "lg:grid-cols-2",
                    round.length > 2 && "xl:grid-cols-2"
                  )}
                >
                  {round.map((duel) => (
                    <DuelCard
                      key={duel.key}
                      duel={duel}
                      title={
                        isFinalRound
                          ? "Gran final — ¿quién es el campeón?"
                          : `${copa.roundNames[ri]} · Duelo ${
                              Number(duel.key.slice(duel.key.indexOf("d") + 1)) + 1
                            }`
                      }
                      isFinal={isFinalRound}
                      voting={votingDuel === duel.key}
                      onVote={(w) => vote(duel.key, w)}
                    />
                  ))}
                </div>
                {ri < lastIdx && (
                  <div className="my-4 flex items-center justify-center gap-2 text-muted-foreground">
                    <span className="h-px w-16 bg-border sm:w-28" />
                    <ArrowDown className={cn("h-4 w-4", roundDecided && "copa-pulse")} />
                    <span className="h-px w-16 bg-border sm:w-28" />
                  </div>
                )}
                {isFinalRound && !roundDecided && round.some((d) => !d.a.text) && (
                  <div className="fade-up mx-auto mt-3 w-full max-w-[820px]">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {round.map((d, di) =>
                        d.a.text ? null : (
                          <div
                            key={d.key}
                            className="copa-pulse flex h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card"
                          >
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            <p className="mt-2 text-[12.5px] text-muted-foreground">
                              Finalista {di + 1} respondiendo…
                            </p>
                          </div>
                        )
                      )}
                    </div>
                    <p className="mt-3 text-center text-[12px] text-muted-foreground">
                      Los finalistas están generando sus respuestas ahora mismo.
                    </p>
                  </div>
                )}
                {/* Ronda siguiente aún sin generar */}
                {roundDecided && ri + 1 >= copa.rounds.length && !isFinalRound && (
                  <div className="fade-up mx-auto mt-2 w-full max-w-[820px]">
                    <div className="copa-pulse flex h-[86px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <p className="mt-2 text-[12.5px] text-muted-foreground">
                        Generando {copa.roundNames[ri + 1]?.toLowerCase() ?? "siguiente ronda"}…
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Última ronda decidida pero sin revelar (cargando campeón) */}
          {lastDecided && !copa.revealed && (
            <div className="fade-up mx-auto mt-2 w-full max-w-[820px]">
              <div className="copa-pulse flex h-[86px] items-center justify-center rounded-xl border border-dashed border-border bg-card">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <p className="ml-2 text-[12.5px] text-muted-foreground">
                  Preparando la revelación del campeón…
                </p>
              </div>
            </div>
          )}

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
