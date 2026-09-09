"use client";

import { useSyncExternalStore } from "react";
import { ExternalLink, Gamepad2, Share2, Sparkles, Dna, Music, MessageCircle, Zap } from "lucide-react";
import { APP_VERSION } from "@/lib/version";
import { cn } from "@/lib/utils";

const GAMES = [
  {
    href: "/games/gta-vi.html",
    title: "GTA VI · Costa Vice",
    tag: "Mundo abierto 3D",
    tagColor: "bg-pink-600/15 text-pink-700 dark:text-pink-300",
    desc: "Ciudad costera estilo Vice en tercera persona: roba coches, cumple misiones, evita a la policía y mira cómo la ciudad evoluciona por niveles con más tráfico, más peatones y más neones.",
    feats: ["3D tercera persona", "NPCs con rutinas diarias", "Tráfico + policía con niveles de búsqueda", "Día/noche + synthwave procedural"],
    cover: "from-pink-500 via-fuchsia-500 to-violet-600",
    emoji: "🌴",
  },
  {
    href: "/games/supervivencia.html",
    title: "Isla Maldita: Evolución",
    tag: "Supervivencia 3D",
    tagColor: "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300",
    desc: "Sobrevive en una isla que aprende de ti: tala, mina, craftea y aguanta las noches. Cada amanecer la isla evoluciona — los enemigos ganan vida y velocidad, aparecen Sombras y Gólems, y los lobos aprenden a flanquear tus fogatas.",
    feats: ["Recolección + crafteo (hacha, pico, fogata, refugio)", "Hambre / sed / energía", "Noches evolutivas con registro", "Tormentas y aprendizaje de la IA"],
    cover: "from-emerald-500 via-teal-500 to-cyan-600",
    emoji: "🏝️",
  },
  {
    href: "/games/estrategia.html",
    title: "Imperios: Némesis Adaptativa",
    tag: "RTS 1 vs IA",
    tagColor: "bg-amber-600/15 text-amber-700 dark:text-amber-300",
    desc: "Estrategia en tiempo real contra una IA que estudia tu ejército y construye su contra: si te blindas de arqueros, saca caballería; si te encierras, trae arietes. Cada oleada evoluciona y deja registro de sus adaptaciones.",
    feats: ["Economía real (madera, oro, comida)", "4 unidades + edificios y torres", "IA que contra-tu estrategia (log Némesis)", "Minimapa, eras y oleadas evolutivas"],
    cover: "from-amber-500 via-orange-500 to-red-600",
    emoji: "⚔️",
  },
];

const MASTER_PROMPT = `MODO JUEGO AAA · PROMPT MAESTRO — El juego debe entregarse en UN solo archivo HTML autocontenido y jugable, con: (1) pantalla de inicio con título, controles y botón JUGAR (desbloquea el audio); (2) HUD en español con barras, récord y registro de evolución; (3) audio 100% procedural con WebAudio (música por escenas y SFX, sin archivos); (4) un bucle autoevolutivo visible: cada N noches / oleadas / misiones el mundo sube de nivel (más enemigos, nuevos tipos, IA que aprende: flanqueo, contra-unidades) y lo anota en un registro persistente (localStorage con try/catch); (5) feedback jugoso: partículas, números de daño, screen shake, cámara suave; (6) rendimiento: pixelRatio limitado, pooling, un solo bucle requestAnimationFrame; (7) botón Compartir con X/Twitter, Facebook, WhatsApp, Telegram + mensaje personalizable y copia de enlace.`;

/* Suscripción vacía: el origen es constante por sesión y se lee sin setState en el efecto,
   evitando el mismatch de hidratación (servidor = "", cliente = window.location.origin). */
const subscribeNoop = () => () => {};
const getOrigin = () => window.location.origin;
const getOriginServer = () => "";

export default function GamesPage() {
  const origin = useSyncExternalStore(subscribeNoop, getOrigin, getOriginServer);
  const shareUrl = (g: (typeof GAMES)[number]) =>
    origin ? origin + g.href : g.href;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-[900px] pb-12">
        <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
          <Gamepad2 className="h-4 w-4" />
          Arcade todólogo · v{APP_VERSION}
        </div>
        <h1 className="mt-3 font-display text-[34px] font-light tracking-tight">
          Juegos{" "}
          <span className="bg-highlight inline-block px-1.5 font-medium italic">autoevolutivos</span>
        </h1>
        {/* v1.17.0 — juegos en tiempo real desde el chat */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-highlight/40 bg-gradient-to-r from-[#F4C406]/15 via-card to-card p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-highlight px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-[#262624]">
              ¡Nuevo v1.17.0!
            </span>
            <h2 className="font-display text-[19px] font-semibold">
              Juegos creados por la IA <span className="italic">en tiempo real</span>, dentro del chat
            </h2>
          </div>
          <p className="mt-2 max-w-[640px] text-[13.5px] leading-relaxed text-foreground/85">
            No hace falta descargar nada de esta página: pide cualquier juego al chat (con el
            <b> Modo Juego AAA</b> del composer o simplemente pidiéndolo en claro) y <b>todas las IA</b> del
            arena lo construyen jugable mientras escriben — con panel grande, música procedural,
            evolución autoadaptativa, pantalla completa y hasta visión VLM para crear juegos a partir de
            una imagen que adjuntes.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href="/"
              className="flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-[13px] font-medium text-background hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" />
              Abrir el chat y pedir un juego
            </a>
            <span className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[12px] text-muted-foreground">
              <Zap className="h-3.5 w-3.5 text-highlight" />
              Skill <code className="font-mono">/juego</code> · Modo Juego AAA · cualquier modelo
            </span>
          </div>
        </div>

        <p className="mt-2 max-w-[640px] text-[14px] leading-relaxed text-foreground/85">
          Tres juegos completos y jugables directamente en el navegador, nacidos del Prompt
          Maestro del Modo Juego AAA. Cada uno incluye música procedural, botón para compartir
          en redes y — lo más importante — un sistema que <b>evoluciona solo</b> mientras
          juegas. Sin descargas, sin dependencias externas: un solo archivo por juego.
        </p>

        {/* Tarjetas de juegos */}
        <div className="mt-7 space-y-4">
          {GAMES.map((g) => (
            <div
              key={g.href}
              className="overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row">
                {/* Portada CSS */}
                <div
                  className={cn(
                    "relative flex min-h-[120px] items-center justify-center bg-gradient-to-br sm:w-[190px] sm:shrink-0",
                    g.cover
                  )}
                >
                  <span className="text-[54px] drop-shadow-lg">{g.emoji}</span>
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    {g.tag}
                  </span>
                </div>
                <div className="flex-1 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-[20px] font-semibold">{g.title}</h2>
                    <span
                      className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide", g.tagColor)}
                    >
                      <Dna className="mr-1 inline h-3 w-3" />
                      Autoevolutivo
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-foreground/85">{g.desc}</p>
                  <ul className="mt-2.5 grid gap-1 text-[12px] text-muted-foreground sm:grid-cols-2">
                    {g.feats.map((f) => (
                      <li key={f} className="flex items-start gap-1.5">
                        <Sparkles className="mt-0.5 h-3 w-3 shrink-0" />
                        {f}
                      </li>
                    ))}
                    <li className="flex items-start gap-1.5">
                      <Music className="mt-0.5 h-3 w-3 shrink-0" />
                      Música y SFX 100% procedurales
                    </li>
                  </ul>
                  <div className="mt-3.5 flex flex-wrap items-center gap-2">
                    <a
                      href={g.href}
                      target="_blank"
                      rel="noopener"
                      className="flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-[13px] font-medium text-background hover:opacity-90"
                    >
                      <Gamepad2 className="h-4 w-4" />
                      Jugar ahora
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                        `Acabo de jugar ${g.title} en todólogo.ai 🎮`
                      )}&url=${encodeURIComponent(shareUrl(g))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[12px] hover:bg-accent"
                    >
                      <Share2 className="h-3.5 w-3.5" /> X
                    </a>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl(g))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[12px] hover:bg-accent"
                    >
                      <Share2 className="h-3.5 w-3.5" /> Facebook
                    </a>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`${g.title} — `)}${encodeURIComponent(shareUrl(g))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[12px] hover:bg-accent"
                    >
                      <Share2 className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl(g))}&text=${encodeURIComponent(g.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[12px] hover:bg-accent"
                    >
                      <Share2 className="h-3.5 w-3.5" /> Telegram
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Prompt Maestro */}
        <details className="mt-7 rounded-2xl border border-border bg-card p-4 sm:p-5">
          <summary className="cursor-pointer list-none">
            <span className="flex items-center gap-2 text-[14.5px] font-semibold">
              <Sparkles className="h-4 w-4" />
              El Prompt Maestro del Modo Juego AAA
              <span className="ml-auto text-[11.5px] font-normal text-muted-foreground">
                (toca para verlo)
              </span>
            </span>
          </summary>
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
            Este es el prompt que entrena a los 56 modelos del arena cuando usas el Modo
            Juego del composer. Está destilado de lo que aprendimos construyendo estos tres
            juegos reales — y cualquier modelo que lo reciba entrega prototipos jugables con
            bucle de evolución.
          </p>
          <pre className="mt-3 max-h-[280px] overflow-auto scrollbar-thin whitespace-pre-wrap rounded-xl border border-border bg-secondary p-3.5 font-mono text-[11.5px] leading-relaxed">
{MASTER_PROMPT}
          </pre>
        </details>

        <p className="mt-5 flex items-start gap-1.5 text-[12px] text-muted-foreground">
          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Los juegos se abren a pantalla completa en su propia página. «GTA VI · Costa Vice»
          es una demo fan no oficial hecha por y para la comunidad de todólogo.ai, sin
          relación con Rockstar Games.
        </p>
      </div>
    </div>
  );
}
