"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Gauge,
  Loader2,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  PictureInPicture,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { jsonSeguro } from "@/lib/fetch-seguro";
import { detalleCommonsCliente } from "@/lib/streamdog/cine-cliente";
import type { ItemCine } from "@/lib/streamdog/cine";
import { traducirCine, type IdiomaCine } from "@/lib/streamdog/cine-i18n";
import { cn } from "@/lib/utils";

/**
 * REPRODUCTOR REAL de StreamDog Cine (v1.32.0) — a prueba de segundo plano.
 *
 * El bug clásico «el streaming no va en segundo plano» venía de tres
 * causas y aquí están curadas de raíz:
 *
 *  1. TIMERS CONGELADOS: los navegadores ralentizan setTimeout/setInterval
 *     en pestañas ocultas. Este reproductor NO depende de timers para nada
 *     crítico: el progreso se guarda en el evento `timeupdate` del propio
 *     vídeo (sigue disparándose en segundo plano) y el guardado es
 *     incremental (cada ≥ 5 s de salto real).
 *
 *  2. FALTA DE FOCO DE MEDIOS: sin MediaSession, el navegador trata el
 *     vídeo como una pestaña cualquiera y lo pausa al ocultarla. Aquí se
 *     declara `navigator.mediaSession` con metadatos (título, póster) y
 *     acciones (play/pause/adelantar/atrasar/seekto/parar) → el sistema
 *     considera la reproducción «importante» y la mantiene, además de
 *     dar controles en pantalla de bloqueo y notificación del SO.
 *
 *  3. VÍDEO SIN VENTANA: en Android/escritorio Chrome, al ocultar la
 *     pestaña el vídeo entra solo en Picture-in-Picture cuando la
 *     preferencia «Segundo plano» está activa (se pide PiP en el
 *     `visibilitychange`). El audio sigue — y si prefieres verlo,
 *     en la ventana flotante también. Preferencia persistida con
 *     autoreparación (cine.ts).
 */

interface Props {
  item: ItemCine;
  idioma: IdiomaCine;
  /** URL ya resuelta por el detalle (ahorra una llamada); si no, se resuelve aquí. */
  videoUrl?: string | null;
  mime?: string | null;
  /** Segundos donde se quedó el usuario la última vez. */
  posicionInicialSeg: number;
  fondoPref: boolean;
  onCerrar: () => void;
  /** Guarda progreso (el padre lo persiste con autoreparación). */
  onProgreso: (posicionSeg: number, duracionSeg: number) => void;
  onFondoPref: (activa: boolean) => void;
}

const VELOCIDADES = [0.75, 1, 1.25, 1.5, 2] as const;

function minutosDe(segundos: number): number {
  return Math.max(1, Math.round(segundos / 60));
}

function reloj(segundos: number): string {
  if (!Number.isFinite(segundos) || segundos < 0) return "0:00";
  const s = Math.floor(segundos % 60);
  const m = Math.floor((segundos / 60) % 60);
  const h = Math.floor(segundos / 3600);
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

export default function Reproductor({
  item,
  idioma,
  videoUrl: urlInicial,
  mime: mimeInicial,
  posicionInicialSeg,
  fondoPref,
  onCerrar,
  onProgreso,
  onFondoPref,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const envoltorioRef = useRef<HTMLDivElement>(null);
  const ultimoGuardado = useRef(0);
  const ocultarControls = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [url, setUrl] = useState<string | null>(urlInicial ?? null);
  const [mime, setMime] = useState<string | null>(mimeInicial ?? null);
  const [cargandoUrl, setCargandoUrl] = useState(urlInicial ? false : true);
  const [errorUrl, setErrorUrl] = useState<string | null>(null);
  const [errorMedio, setErrorMedio] = useState(false);
  const [tampón, setTampón] = useState(false);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [actual, setActual] = useState(0);
  const [duracion, setDuracion] = useState(0);
  const [bufferedPct, setBufferedPct] = useState(0);
  const [volumen, setVolumen] = useState(1);
  const [silenciado, setSilenciado] = useState(false);
  const [velocidadIdx, setVelocidadIdx] = useState(1);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [controlesVisibles, setControlesVisibles] = useState(true);
  const [reanudado, setReanudado] = useState(false);

  const t = useCallback((clave: string, vars?: Record<string, string | number>) => traducirCine(clave, idioma, vars), [idioma]);

  /* ── 1) Resolver la URL del vídeo (si el detalle no la trajo) ── */
  const resolver = useCallback(async () => {
    setCargandoUrl(true);
    setErrorUrl(null);
    setErrorMedio(false);
    try {
      const datos = await jsonSeguro<{ ok: boolean; url?: string; mime?: string; mensaje?: string }>(
        await fetch(`/api/streamdog/cine/reproducir?id=${encodeURIComponent(item.id)}`),
        "reproductor"
      );
      if (datos.ok && datos.url) {
        setUrl(datos.url);
        setMime(datos.mime ?? null);
        return;
      }
      // PLAN B del navegador: la API de Commons pasa por TLS de navegador
      // real aunque el servidor esté bloqueado por huella TLS.
      if (!datos.ok && item.id.startsWith("commons:")) {
        const directo = await detalleCommonsCliente(item.id);
        if (directo?.videoUrl) {
          setUrl(directo.videoUrl);
          setMime(directo.mime);
          return;
        }
      }
      setErrorUrl(datos.mensaje ?? t("No hay vídeo disponible para esta ficha"));
    } catch (e) {
      setErrorUrl(e instanceof Error ? e.message : t("No se pudo cargar el vídeo"));
    } finally {
      setCargandoUrl(false);
    }
  }, [item.id, t]);

  useEffect(() => {
    if (!urlInicial) void resolver();
  }, [urlInicial, resolver]);

  /* ── 2) MEDIASESSION: el corazón del segundo plano ── */
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const sesion = navigator.mediaSession;
    sesion.metadata = new MediaMetadata({
      title: item.titulo,
      artist: item.anyo ? `${item.anyo} · StreamDog Cine` : "StreamDog Cine",
      album: item.fuente === "commons" ? "Wikimedia Commons" : item.fuente === "archive" ? "Internet Archive" : "TVMaze",
      artwork: item.imagen ? [{ src: item.imagen, sizes: "512x512", type: "image/jpeg" }] : [],
    });
    const conVídeo = (): HTMLVideoElement | null => videoRef.current;
    const acciones: [MediaSessionAction, (d?: MediaSessionActionDetails) => void][] = [
      ["play", () => void videoRef.current?.play()],
      ["pause", () => videoRef.current?.pause()],
      ["stop", () => onCerrar()],
      ["seekbackward", () => saltar(-10)],
      ["seekforward", () => saltar(10)],
      [
        "seekto",
        (d) => {
          if (d?.seekTime != null && conVídeo()) conVídeo()!.currentTime = d.seekTime;
        },
      ],
    ];
    for (const [accion, manejador] of acciones) {
      try {
        sesion.setActionHandler(accion, manejador);
      } catch {
        /* acción no soportada: se ignora sin drama */
      }
    }
    return () => {
      try {
        sesion.metadata = null;
        for (const [accion] of acciones) sesion.setActionHandler(accion, null);
        sesion.playbackState = "none";
      } catch {
        /* nada */
      }
    };
  }, [item.titulo, item.anyo, item.imagen, item.fuente, onCerrar]);

  /* ── 3) VISIBILITYCHANGE: al ocultar la pestaña, PiP automático si la pref lo pide ── */
  useEffect(() => {
    function alOcultar(): void {
      if (document.visibilityState !== "hidden") return;
      const video = videoRef.current;
      if (!video || video.paused || video.ended) return;
      if (fondoPref && "pictureInPictureEnabled" in document && document.pictureInPictureEnabled && !document.pictureInPictureElement) {
        video.requestPictureInPicture?.().catch(() => {
          /* PiP rechazado (usuario/SO): el audio sigue igual por MediaSession */
        });
      }
      // Guardado de emergencia al irse: un último timeupdate puede no llegar.
      if (video.currentTime > 0) onProgreso(video.currentTime, video.duration || 0);
    }
    document.addEventListener("visibilitychange", alOcultar);
    return () => document.removeEventListener("visibilitychange", alOcultar);
  }, [fondoPref, onProgreso]);

  /* ── 4) Teclado global mientras el reproductor está abierto ── */
  useEffect(() => {
    function alTecla(e: KeyboardEvent): void {
      const video = videoRef.current;
      if (!video) return;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          if (video.paused) void video.play();
          else video.pause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          saltar(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          saltar(10);
          break;
        case "ArrowUp":
          e.preventDefault();
          cambiarVolumen(Math.min(1, video.volume + 0.1));
          break;
        case "ArrowDown":
          e.preventDefault();
          cambiarVolumen(Math.max(0, video.volume - 0.1));
          break;
        case "f":
          void alternarPantallaCompleta();
          break;
        case "m":
          video.muted = !video.muted;
          setSilenciado(video.muted);
          break;
        case "p":
          void alternarPip();
          break;
        case "Escape":
          onCerrar();
          break;
      }
    }
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, [onCerrar]);

  /* ── 5) Sincroniza el estado de reproducción con MediaSession ── */
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = reproduciendo ? "playing" : "paused";
  }, [reproduciendo]);

  function saltar(delta: number): void {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = Math.min(Math.max(0, video.currentTime + delta), video.duration);
  }

  function cambiarVolumen(v: number): void {
    const video = videoRef.current;
    if (!video) return;
    video.volume = v;
    video.muted = v === 0;
    setVolumen(v);
    setSilenciado(video.muted);
  }

  async function alternarPip(): Promise<void> {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await video.requestPictureInPicture();
    } catch {
      /* PiP no disponible: silencioso */
    }
  }

  async function alternarPantallaCompleta(): Promise<void> {
    const el = envoltorioRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setPantallaCompleta(false);
      } else {
        await el.requestFullscreen();
        setPantallaCompleta(true);
      }
    } catch {
      /* sin permiso: silencioso */
    }
  }

  function despertarControles(): void {
    setControlesVisibles(true);
    if (ocultarControls.current) clearTimeout(ocultarControls.current);
    ocultarControls.current = setTimeout(() => {
      const video = videoRef.current;
      if (video && !video.paused) setControlesVisibles(false);
    }, 2_600);
  }

  function alTimeUpdate(): void {
    const video = videoRef.current;
    if (!video) return;
    setActual(video.currentTime);
    // Estado de posición para los controles del SO (pantalla de bloqueo).
    if ("mediaSession" in navigator && Number.isFinite(video.duration) && video.duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: video.duration,
          position: video.currentTime,
          playbackRate: video.playbackRate,
        });
      } catch {
        /* fuera de rango: nada */
      }
    }
    // Guardado incremental SIN timers: solo cuando avanzó ≥ 5 s desde el último.
    if (Math.abs(video.currentTime - ultimoGuardado.current) >= 5) {
      ultimoGuardado.current = video.currentTime;
      onProgreso(video.currentTime, video.duration || 0);
    }
  }

  function alBuffered(): void {
    const video = videoRef.current;
    if (!video || video.buffered.length === 0 || !Number.isFinite(video.duration) || video.duration === 0) return;
    setBufferedPct((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
  }

  function alCargadoMetadatos(): void {
    const video = videoRef.current;
    if (!video) return;
    setDuracion(video.duration || 0);
    // REANUDAR: si venía a medias y no está terminado, sigue donde lo dejó.
    if (!reanudado && posicionInicialSeg > 30 && posicionInicialSeg < video.duration * 0.95) {
      video.currentTime = posicionInicialSeg;
      ultimoGuardado.current = posicionInicialSeg;
    }
    setReanudado(true);
  }

  function reintentarMedio(): void {
    setErrorMedio(false);
    setUrl(null);
    void resolver();
  }

  const velocidad = VELOCIDADES[velocidadIdx];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${item.titulo}: reproductor`}
      onMouseMove={despertarControles}
      onTouchStart={despertarControles}
    >
      <div
        ref={envoltorioRef}
        className={cn("relative w-full max-w-5xl px-2 sm:px-6", pantallaCompleta && "h-full max-w-none sm:px-0")}
      >
        {/* Cabecera */}
        <div
          className={cn(
            "flex items-center gap-3 px-1 pb-2 pt-3 transition-opacity duration-300",
            controlesVisibles ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold text-slate-100">{item.titulo}</p>
            <p className="truncate text-[11.5px] text-slate-400">
              {[item.anyo, mime?.replace("video/", "").toUpperCase()].filter(Boolean).join(" · ")}
              {fondoPref ? ` · ${t("Segundo plano")} ✓` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onFondoPref(!fondoPref)}
            title={t("Sonará en segundo plano aunque cambies de pestaña o bloques el móvil.")}
            aria-pressed={fondoPref}
            className={cn(
              "ml-auto flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-medium transition-colors",
              fondoPref
                ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
                : "border-white/15 bg-white/[0.04] text-slate-300 hover:border-white/30 hover:text-white"
            )}
          >
            <PictureInPicture2 className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{t("Segundo plano")}</span>
          </button>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar reproductor"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] text-slate-300 transition-colors hover:border-white/30 hover:text-white"
          >
            <X className="h-4.5 w-4.5" aria-hidden />
          </button>
        </div>

        {/* Escenario */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl shadow-cyan-500/5">
          {url && (
            <video
              ref={videoRef}
              src={url}
              poster={item.imagen ?? undefined}
              autoPlay
              playsInline
              preload="metadata"
              className={cn("mx-auto w-full bg-black", pantallaCompleta ? "h-full object-contain" : "aspect-video")}
              onLoadedMetadata={alCargadoMetadatos}
              onTimeUpdate={alTimeUpdate}
              onProgress={alBuffered}
              onPlay={() => setReproduciendo(true)}
              onPause={() => setReproduciendo(false)}
              onWaiting={() => setTampón(true)}
              onPlaying={() => setTampón(false)}
              onCanPlay={() => setTampón(false)}
              onError={() => setErrorMedio(true)}
              onEnded={() => {
                const video = videoRef.current;
                if (video) onProgreso(video.duration || 0, video.duration || 0);
                setReproduciendo(false);
              }}
            />
          )}

          {/* Estados superpuestos */}
          {cargandoUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/80">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-300" aria-hidden />
              <p className="text-[13px] text-slate-300">{t("Cargando el vídeo…")}</p>
            </div>
          )}

          {!cargandoUrl && errorUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/85 p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-amber-300" aria-hidden />
              <p className="max-w-sm text-[13.5px] leading-relaxed text-slate-200">{errorUrl}</p>
              <a
                href={item.enlaceOrigen ?? "https://streamdog.example"}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-white/20 bg-white/[0.06] px-3.5 py-2 text-[12.5px] font-medium text-slate-100 transition-colors hover:border-white/40"
              >
                {t("Ver en el origen")}
              </a>
            </div>
          )}

          {errorMedio && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/85 p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-rose-300" aria-hidden />
              <p className="max-w-sm text-[13.5px] text-slate-200">{t("No se pudo cargar el vídeo")}</p>
              <button
                type="button"
                onClick={reintentarMedio}
                className="rounded-lg border border-cyan-300/40 bg-cyan-400/10 px-3.5 py-2 text-[12.5px] font-medium text-cyan-100 transition-colors hover:bg-cyan-400/20"
              >
                {t("Reintentar")}
              </button>
            </div>
          )}

          {tampón && !errorMedio && url && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-200/90" aria-hidden />
            </div>
          )}

          {/* Botón central de reproducción cuando está en pausa */}
          {url && !reproduciendo && !errorMedio && !cargandoUrl && (
            <button
              type="button"
              onClick={() => void videoRef.current?.play()}
              aria-label={t("Reproducir")}
              className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-slate-950/70 text-white shadow-xl transition-transform hover:scale-105"
            >
              <Play className="ml-1 h-7 w-7" fill="currentColor" aria-hidden />
            </button>
          )}

          {/* Chip «Empezar por el principio» tras reanudar */}
          {url && reanudado && posicionInicialSeg > 30 && actual > 0 && actual < 5 + posicionInicialSeg && actual >= posicionInicialSeg - 1 && (
            <button
              type="button"
              onClick={() => {
                const video = videoRef.current;
                if (video) video.currentTime = 0;
              }}
              className="absolute left-3 top-3 rounded-lg border border-white/20 bg-slate-950/80 px-3 py-1.5 text-[12px] font-medium text-slate-100 backdrop-blur-sm transition-colors hover:border-white/40"
            >
              {t("Empezar por el principio")}
            </button>
          )}

          {/* Controles inferiores */}
          <div
            className={cn(
              "absolute inset-x-0 bottom-0 space-y-2 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent px-3 pb-3 pt-8 transition-opacity duration-300",
              controlesVisibles ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          >
            {/* Progreso con búfer */}
            <div className="relative h-4">
              <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-white/15">
                <div className="h-full rounded-full bg-white/25" style={{ width: `${Math.min(100, bufferedPct)}%` }} />
              </div>
              <input
                type="range"
                min={0}
                max={duracion || 0}
                step={0.1}
                value={actual}
                onChange={(e) => {
                  const video = videoRef.current;
                  if (video) video.currentTime = Number.parseFloat(e.target.value);
                  setActual(Number.parseFloat(e.target.value));
                }}
                aria-label="Barra de progreso"
                className="absolute top-1/2 h-1 w-full -translate-y-1/2 appearance-none rounded-full bg-transparent accent-cyan-400 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-300"
                style={{ background: `linear-gradient(to right, #22d3ee ${(actual / (duracion || 1)) * 100}%, transparent ${(actual / (duracion || 1)) * 100}%)` }}
              />
            </div>

            <div className="flex items-center gap-1.5 text-slate-200">
              <button type="button" onClick={() => (videoRef.current?.paused ? void videoRef.current?.play() : videoRef.current?.pause())} aria-label={reproduciendo ? "Pausa" : t("Reproducir")} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10">
                {reproduciendo ? <Pause className="h-5 w-5" fill="currentColor" aria-hidden /> : <Play className="h-5 w-5" fill="currentColor" aria-hidden />}
              </button>
              <button type="button" onClick={() => saltar(-10)} aria-label="Atrás 10 segundos" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10">
                <RotateCcw className="h-4.5 w-4.5" aria-hidden />
              </button>
              <button type="button" onClick={() => saltar(10)} aria-label="Adelante 10 segundos" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10">
                <RotateCw className="h-4.5 w-4.5" aria-hidden />
              </button>

              <span className="ml-1 font-mono text-[11.5px] tabular-nums text-slate-300">
                {reloj(actual)} / {reloj(duracion)}
              </span>

              <div className="ml-auto flex items-center gap-1.5">
                <button type="button" onClick={() => cambiarVolumen(silenciado ? (volumen > 0 ? volumen : 1) : 0)} aria-label={silenciado ? "Activar sonido" : "Silenciar"} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10">
                  {silenciado || volumen === 0 ? <VolumeX className="h-4.5 w-4.5" aria-hidden /> : <Volume2 className="h-4.5 w-4.5" aria-hidden />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={silenciado ? 0 : volumen}
                  onChange={(e) => cambiarVolumen(Number.parseFloat(e.target.value))}
                  aria-label="Volumen"
                  className="hidden h-1 w-20 appearance-none rounded-full bg-white/20 accent-cyan-300 sm:block [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slate-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    const siguiente = (velocidadIdx + 1) % VELOCIDADES.length;
                    setVelocidadIdx(siguiente);
                    if (videoRef.current) videoRef.current.playbackRate = VELOCIDADES[siguiente];
                  }}
                  aria-label="Velocidad de reproducción"
                  className="flex h-9 items-center gap-1 rounded-lg px-2 text-[12px] font-semibold hover:bg-white/10"
                >
                  <Gauge className="h-4 w-4" aria-hidden />
                  {velocidad}×
                </button>
                <button type="button" onClick={() => void alternarPip()} aria-label={t("Ventana flotante")} className="hidden h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10 sm:flex">
                  <PictureInPicture className="h-4.5 w-4.5" aria-hidden />
                </button>
                <button type="button" onClick={() => void alternarPantallaCompleta()} aria-label="Pantalla completa" className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10">
                  {pantallaCompleta ? <Minimize className="h-4.5 w-4.5" aria-hidden /> : <Maximize className="h-4.5 w-4.5" aria-hidden />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="px-1 pt-2 text-[11px] leading-relaxed text-slate-500">
          Atajos: espacio/K reproducir · ←/→ 10 s · ↑/↓ volumen · F pantalla completa · M silencio · P ventana flotante · Esc cerrar
        </p>
      </div>
    </div>
  );
}
