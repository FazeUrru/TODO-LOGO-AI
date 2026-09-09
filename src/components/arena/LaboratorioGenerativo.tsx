"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Clapperboard,
  Image as ImageIcon,
  AudioLines,
  X,
  Loader2,
  Download,
  Sparkles,
  FlaskConical,
  Check,
  Film,
} from "lucide-react";
import { MODELS } from "@/lib/models-data";
import { cn } from "@/lib/utils";

/**
 * LaboratorioGenerativo (v1.15.0) — los tres modos experimentales del
 * Canal Todólogo Labs en un solo estudio:
 *
 *  1. Cine        → vídeo REAL (mp4 con audio) vía /api/video, con
 *                   motor rotativo que imita la rotación de modelos del
 *                   leaderboard (Seedance 2.5, Veo 3.1, Kling 3.0 Turbo…).
 *  2. Estudio     → la misma escena generada 4 veces con los últimos
 *                   modelos de imagen del catálogo (rotación real de
 *                   estilos por modelo), para comparar y descargar.
 *  3. Estudio de audio → locución REAL vía /api/tts: guion escrito por IA
 *                   (micro-podcast, anuncio o cuento) narrado con voz.
 *
 * Telemetría Labs: «entered» al abrir un tab y «used» por generación,
 * best-effort (en la demo estática se queda en local, como todo).
 */

type Tab = "cine" | "estudio" | "audio";

const MODELOS_IMAGEN = MODELS.filter((m) => m.categories.includes("imagen"));

const POR_DEFECTO_ESTUDIO = ["gpt-image-2.5-sunburst", "nano-banana-pro", "seedream-5.0", "flux-2-pro"];

/** Sello de estilo por modelo: hace que cada generador aporte un look distinto. */
const SELLO_ESTILO: Record<string, string> = {
  "gpt-image-2.5-sunburst":
    "premium editorial photography, flawless typography, fine-grained control, high detail",
  "gpt-image-2.5-flare":
    "clean default look, balanced composition, natural colors",
  "gpt-image-2.5-instant":
    "quick sketch-like clarity, simple bold shapes",
  "gpt-image-2":
    "stable API look, crisp product photography",
  "nano-banana-pro":
    "poster-perfect lettering, vivid illustration, playful energy",
  "nano-banana-2":
    "casual creator aesthetic, warm tones",
  "seedream-5.0":
    "expressive polished aesthetics, cinematic glow",
  "midjourney-v8.2":
    "painterly light, artistic atmosphere, unmistakable aesthetic",
  "flux-2-pro":
    "surgical photorealism, sharp textures, studio lighting",
  "mai-image-2.6-preview":
    "clean office-product scene, diagram-friendly",
  "grok-imagine-2.0":
    "bold viral energy, punchy contrast",
};

const FRASES_RODAJE = [
  "Levantando el set…",
  "Colocando luces…",
  "Ensayando el movimiento de cámara…",
  "Rodando la toma principal…",
  "Ajustando el audio nativo…",
  "Revelando el metraje…",
];

const VOCES = [
  { id: "tongtong", nombre: "Tongtong · cálida" },
  { id: "chuichui", nombre: "Chuichui · brillante" },
  { id: "xiaochen", nombre: "Xiaochen · serena" },
  { id: "jam", nombre: "Jam · potente" },
  { id: "kazi", nombre: "Kazi · tersa" },
  { id: "douji", nombre: "Douji · joven" },
  { id: "luodo", nombre: "Luodo · grave" },
] as const;

const FORMATOS = [
  { id: "podcast", nombre: "Micro-podcast" },
  { id: "anuncio", nombre: "Anuncio de radio" },
  { id: "cuento", nombre: "Micro-cuento" },
] as const;

/** Telemetría Labs best-effort: nunca bloquea la UI. */
function labsEvent(featureId: string, tipo: "entered" | "used") {
  try {
    void fetch("/api/labs/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featureId, tipo }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* demo estática: silencio */
  }
}

interface Props {
  abierto: Tab | null;
  onCerrar: () => void;
}

export default function LaboratorioGenerativo({ abierto, onCerrar }: Props) {
  const [tab, setTab] = useState<Tab>("cine");
  useEffect(() => {
    if (abierto) {
      setTab(abierto);
      labsEvent(`modo-${abierto === "audio" ? "audio" : abierto}`, "entered");
    }
  }, [abierto]);

  /* ── ESC/enter y bloqueo de scroll ── */
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div
        className="flex max-h-[92vh] w-full max-w-[880px] flex-col overflow-hidden rounded-t-2xl border border-border bg-card shadow-2xl sm:rounded-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Laboratorio generativo experimental"
      >
        {/* Cabecera */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-highlight/90">
              <FlaskConical className="h-4 w-4 text-[#2E2B29]" />
            </span>
            <div>
              <p className="flex items-center gap-2 text-[15px] font-medium">
                Laboratorio generativo
                <span className="rounded-full bg-emerald-100 px-2 py-px text-[10px] font-bold uppercase text-emerald-800">
                  Labs · experimental
                </span>
              </p>
              <p className="text-[11.5px] text-muted-foreground">
                Puede fallar, tardar o sorprenderte. Eso es lo que hace un laboratorio.
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 gap-1 border-b border-border px-3 py-2">
          {(
            [
              ["cine", "Cine (vídeo real)", Clapperboard],
              ["estudio", "Estudio de imagen", ImageIcon],
              ["audio", "Estudio de audio", AudioLines],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                tab === id
                  ? "bg-secondary font-medium"
                  : "text-foreground/70 hover:bg-accent"
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {tab === "cine" && <ModoCine />}
          {tab === "estudio" && <ModoEstudio />}
          {tab === "audio" && <ModoAudio />}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════ MODO CINE (vídeo real) ══════════════════════ */

function ModoCine() {
  const [prompt, setPrompt] = useState("");
  const [duracion, setDuracion] = useState<5 | 10>(5);
  const [rodando, setRodando] = useState(false);
  const [frase, setFrase] = useState(0);
  const [resultado, setResultado] = useState<{
    url: string;
    motor: string;
    segundos: number;
  } | null>(null);
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const sondear = useCallback((taskId: string, motor: string, segundos: number) => {
    const intentos = setInterval(async () => {
      try {
        const r = await fetch(`/api/video/status?id=${encodeURIComponent(taskId)}`);
        const d = await r.json();
        if (d.ok && d.ready) {
          clearInterval(intentos);
          if (timerRef.current) clearInterval(timerRef.current);
          setResultado({ url: d.url, motor, segundos });
          setRodando(false);
          labsEvent("modo-cine", "used");
        }
        if (d.ok && d.failed) {
          clearInterval(intentos);
          if (timerRef.current) clearInterval(timerRef.current);
          setError("El motor descartó la toma. Prueba otra vez con otra escena.");
          setRodando(false);
        }
      } catch {
        /* seguimos sondeando */
      }
    }, 6_000);
  }, []);

  async function rodar() {
    if (prompt.trim().length < 6 || rodando) return;
    setRodando(true);
    setResultado(null);
    setError("");
    setFrase(0);
    timerRef.current = setInterval(
      () => setFrase((f) => (f + 1) % FRASES_RODAJE.length),
      3_200
    );
    try {
      const res = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), duracion }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "El rodaje falló.");
      if (data.pending) {
        sondear(data.taskId, data.motor, data.segundos);
        return; // el sondeo cerrará el estado
      }
      setResultado({ url: data.url, motor: data.motor, segundos: data.segundos });
      labsEvent("modo-cine", "used");
    } catch (e) {
      setError(e instanceof Error ? e.message : "El rodaje falló. Inténtalo de nuevo.");
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      setRodando(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[13.5px] leading-relaxed text-foreground/85">
        Escribe la escena y rueda un <strong>vídeo real</strong> (mp4 con audio, descargable).
        El <strong>motor rotativo</strong> alterna el estilo de rodaje entre los referentes del
        leaderboard — Seedance 2.5, Veo 3.1, Kling 3.0 Turbo, Sora 2, Runway Gen-4.5 y Wan 3.0 —
        así que la misma escena sale distinta en cada rodaje.
      </p>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={2}
        placeholder="Ej.: un colibrí bebiendo en una flor de granada al amanecer, cámara lenta, luz dorada…"
        className="w-full resize-none rounded-xl border border-border bg-background p-3 text-[14px] outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-foreground/20"
      />

      <div className="flex flex-wrap items-center gap-2">
        {([5, 10] as const).map((s) => (
          <button
            key={s}
            onClick={() => setDuracion(s)}
            className={cn(
              "rounded-lg border border-border px-3 py-1.5 text-[12.5px]",
              duracion === s ? "bg-secondary font-medium" : "text-muted-foreground hover:bg-accent"
            )}
          >
            {s} segundos
          </button>
        ))}
        <button
          onClick={rodar}
          disabled={rodando || prompt.trim().length < 6}
          className="ml-auto flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-[13.5px] font-medium text-background disabled:opacity-40"
        >
          {rodando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Rodando…
            </>
          ) : (
            <>
              <Film className="h-4 w-4" /> Rodar escena
            </>
          )}
        </button>
      </div>

      {rodando && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3">
          <Sparkles className="h-4 w-4 animate-pulse text-emerald-600" />
          <p className="text-[13.5px]">
            {FRASES_RODAJE[frase]}{" "}
            <span className="text-muted-foreground">
              Un vídeo real tarda 1-4 minutos; puedes cerrar y la toma seguirá en el estudio.
            </span>
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-800">
          {error}
        </div>
      )}

      {resultado && (
        <div className="overflow-hidden rounded-xl border border-border">
          <video
            key={resultado.url}
            src={resultado.url}
            controls
            autoPlay
            loop
            playsInline
            className="max-h-[420px] w-full bg-black"
          />
          <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <p className="text-[12.5px] text-muted-foreground">
              Motor rotativo: <span className="font-medium text-foreground">{resultado.motor}</span>{" "}
              · {resultado.segundos} s · audio nativo
            </p>
            <a
              href={resultado.url}
              download
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12.5px] hover:bg-accent"
            >
              <Download className="h-3.5 w-3.5" /> Descargar mp4
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ MODO ESTUDIO (rotación de modelos de imagen) ═══════════════ */

function ModoEstudio() {
  const [prompt, setPrompt] = useState("");
  const [elegidos, setElegidos] = useState<string[]>(POR_DEFECTO_ESTUDIO);
  const [generando, setGenerando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [fotos, setFotos] = useState<{ url: string; modelo: string; id: string }[]>([]);
  const [error, setError] = useState("");

  function toggle(id: string) {
    setElegidos((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 4
          ? [...prev, id]
          : prev
    );
  }

  async function generar() {
    if (prompt.trim().length < 4 || elegidos.length === 0 || generando) return;
    setGenerando(true);
    setFotos([]);
    setError("");
    setProgreso(0);
    const resultados: typeof fotos = [];
    for (const id of elegidos) {
      const modelo = MODELS.find((m) => m.id === id);
      const sello = SELLO_ESTILO[id] ?? "";
      try {
        const res = await fetch("/api/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: `${prompt.trim()}. ${sello}`, size: "1024x1024" }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          resultados.push({ url: data.url, modelo: modelo?.name ?? id, id });
          setFotos([...resultados]);
        }
      } catch {
        /* seguimos con el siguiente modelo */
      }
      setProgreso((p) => p + 1);
    }
    setGenerando(false);
    if (resultados.length === 0) {
      setError("Ninguna generación llegó a tiempo. Espera un momento e inténtalo de nuevo.");
    } else {
      labsEvent("estudio-imagen", "used");
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[13.5px] leading-relaxed text-foreground/85">
        La <strong>misma escena, cuatro generadores</strong>: elige hasta 4 modelos de imagen del
        catálogo (GPT-Image-2.5 Sunburst, Nano Banana Pro, Seedream 5.0, FLUX.2…) y compara sus
        estilos lado a lado. Cada modelo aporta su sello real de estilo — es el «cambiando con los
        últimos modelos» en estado puro.
      </p>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={2}
        placeholder="Ej.: una librería infinita flotando sobre las nubes al atardecer…"
        className="w-full resize-none rounded-xl border border-border bg-background p-3 text-[14px] outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-foreground/20"
      />

      <div>
        <p className="mb-1.5 text-[12.5px] font-medium">
          Modelos en la sesión ({elegidos.length}/4)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {MODELOS_IMAGEN.map((m) => {
            const activo = elegidos.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition-colors",
                  activo
                    ? "border-emerald-600 bg-emerald-50 font-medium text-emerald-800"
                    : "border-border text-muted-foreground hover:bg-accent"
                )}
              >
                {activo && <Check className="h-3 w-3" />}
                {m.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={generar}
          disabled={generando || prompt.trim().length < 4 || elegidos.length === 0}
          className="ml-auto flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-[13.5px] font-medium text-background disabled:opacity-40"
        >
          {generando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Sesión {progreso}/{elegidos.length}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Generar sesión
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-800">
          {error}
        </div>
      )}

      {fotos.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fotos.map((f) => (
            <figure key={f.url} className="overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={`Escena por ${f.modelo}`} className="aspect-square w-full object-cover" />
              <figcaption className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="truncate text-[12.5px] font-medium">{f.modelo}</span>
                <a
                  href={f.url}
                  download
                  className="shrink-0 rounded-lg border border-border p-1.5 hover:bg-accent"
                  title="Descargar"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════ MODO AUDIO (locución real con guion IA) ═══════════════ */

function ModoAudio() {
  const [modo, setModo] = useState<"guion" | "texto">("guion");
  const [tema, setTema] = useState("");
  const [texto, setTexto] = useState("");
  const [formato, setFormato] = useState<"podcast" | "anuncio" | "cuento">("podcast");
  const [voz, setVoz] = useState<string>("tongtong");
  const [cargando, setCargando] = useState(false);
  const [audio, setAudio] = useState<{ url: string; texto: string; voz: string } | null>(null);
  const [error, setError] = useState("");

  async function producir() {
    if (cargando) return;
    const valido = modo === "guion" ? tema.trim().length >= 4 : texto.trim().length >= 12;
    if (!valido) return;
    setCargando(true);
    setAudio(null);
    setError("");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          modo === "guion"
            ? { tema: tema.trim(), formato, voz }
            : { texto: texto.trim(), voz }
        ),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "La locución falló.");
      setAudio({ url: data.url, texto: data.texto, voz: data.voz });
      labsEvent("estudio-audio", "used");
    } catch (e) {
      setError(e instanceof Error ? e.message : "La locución falló. Inténtalo de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[13.5px] leading-relaxed text-foreground/85">
        <strong>Locución real</strong> en un clic: pide un guion (micro-podcast, anuncio o
        cuento) y escúchalo narrado, o pega tu propio texto. El mp3 es descargable y la voz,
        tuya de elegir.
      </p>

      <div className="flex rounded-lg border border-border p-1 text-[12.5px]">
        {(
          [
            ["guion", "Guion con IA"],
            ["texto", "Mi texto"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setModo(id)}
            className={cn(
              "flex-1 rounded-md py-1.5",
              modo === id ? "bg-card shadow-sm font-medium" : "text-muted-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {modo === "guion" ? (
        <>
          <input
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            placeholder="Tema del guion — ej.: por qué el ELO importa en una arena de IA"
            className="w-full rounded-xl border border-border bg-background p-3 text-[14px] outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-foreground/20"
          />
          <div className="flex flex-wrap gap-1.5">
            {FORMATOS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFormato(f.id)}
                className={cn(
                  "rounded-lg border border-border px-3 py-1.5 text-[12.5px]",
                  formato === f.id ? "bg-secondary font-medium" : "text-muted-foreground hover:bg-accent"
                )}
              >
                {f.nombre}
              </button>
            ))}
          </div>
        </>
      ) : (
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={4}
          placeholder="Pega aquí el texto que quieres escuchar (máx. ~1.800 caracteres)…"
          className="w-full resize-none rounded-xl border border-border bg-background p-3 text-[14px] outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-foreground/20"
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-[12.5px] font-medium" htmlFor="voz-lab">
          Voz
        </label>
        <select
          id="voz-lab"
          value={voz}
          onChange={(e) => setVoz(e.target.value)}
          className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-[13px] outline-none"
        >
          {VOCES.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nombre}
            </option>
          ))}
        </select>
        <button
          onClick={producir}
          disabled={cargando}
          className="ml-auto flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-[13.5px] font-medium text-background disabled:opacity-40"
        >
          {cargando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Grabando…
            </>
          ) : (
            <>
              <AudioLines className="h-4 w-4" /> Producir audio
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-800">
          {error}
        </div>
      )}

      {audio && (
        <div className="space-y-2 rounded-xl border border-border p-3">
          <audio controls src={audio.url} className="w-full" />
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-[12px] text-muted-foreground">
              Voz {audio.voz} · {audio.texto.length} caracteres
            </p>
            <a
              href={audio.url}
              download
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-[12.5px] hover:bg-accent"
            >
              <Download className="h-3.5 w-3.5" /> Descargar mp3
            </a>
          </div>
          <details className="rounded-lg bg-secondary/50 px-3 py-2">
            <summary className="cursor-pointer text-[12.5px] font-medium">
              Ver el texto narrado
            </summary>
            <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/85">
              {audio.texto}
            </p>
          </details>
        </div>
      )}
    </div>
  );
}
