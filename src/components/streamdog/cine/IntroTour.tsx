"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Sparkles, Volume2, VolumeX, X } from "lucide-react";
import { asset } from "@/lib/asset-path";
import { esIdiomaCine } from "@/lib/streamdog/cine";
import { resolverIdiomaCine, traducirCine, type IdiomaCine, type IdiomaCineFijo } from "@/lib/streamdog/cine-i18n";
import { acordeStreamDog, blip, despegue } from "@/lib/streamdog/cine-audio";
import { cn } from "@/lib/utils";

/**
 * INTRO + TOUR (v1.38.0) — la bienvenida que engancha y el recorrido
 * que enseña la casa en un minuto.
 *
 *  · INTRO — portada a pantalla completa con el logo de StreamDog,
 *    el título con degradado animado y un JINGLE sintetizado con
 *    WebAudio (arpegio + pad + brillo: sin ficheros de audio, sin
 *    licencias, cero bytes extra de descarga). Se salta con un toque
 *    y solo se ve UNA vez (flag persistido). Con prefers-reduced-motion
 *    se recorta la coreografía, no el cariño.
 *
 *  · TOUR — 6 pasos reales sobre la app viva: cada paso centra el
 *    elemento de la página que explica (buscador, vistas, fichas de la
 *    hoja de ruta, idioma, pacto abierto…), con blip de sonido y
 *    controles siguiente/anterior/saltar. Se lanza solo tras la intro
 *    y se puede repetir desde la cabecera del módulo.
 *
 * El idioma lo hereda del módulo de cine (localStorage, «sistema»
 * incluido): la bienvenida habla el idioma de la casa ×4.
 */

const CLAVE_INTRO_VISTA = "streamdog.intro.v1.vista";
const CLAVE_TOUR_HECHO = "streamdog.tour.v1.hecho";
const CLAVE_INTRO_SILENCIO = "streamdog.intro.v1.silencio";

export const FLAGS_INTRO = { vista: CLAVE_INTRO_VISTA, tour: CLAVE_TOUR_HECHO, silencio: CLAVE_INTRO_SILENCIO };

/** Lee el idioma del módulo de cine desde storage («sistema» resuelto). */
function idiomaDeLaCasa(): IdiomaCineFijo {
  if (typeof localStorage === "undefined") return "es";
  const crudo = localStorage.getItem("streamdog.cine.v1.idioma") ?? null;
  const elegido: IdiomaCine = crudo && esIdiomaCine(crudo) ? crudo : "sistema";
  return resolverIdiomaCine(elegido);
}

/** Lee (o marca) si la intro/tour ya se vieron. */
export function introVista(): boolean {
  try {
    return localStorage.getItem(CLAVE_INTRO_VISTA) === "1";
  } catch {
    return false;
  }
}

export function tourHecho(): boolean {
  try {
    return localStorage.getItem(CLAVE_TOUR_HECHO) === "1";
  } catch {
    return false;
  }
}

/* ══════════════════ INTRO ══════════════════ */

interface PropsIntro {
  onTerminar: () => void;
}

export function IntroStreamDog({ onTerminar }: PropsIntro) {
  const [idioma] = useState<IdiomaCineFijo>(idiomaDeLaCasa);
  const [silencio, setSilencio] = useState<boolean>(() => {
    try {
      return localStorage.getItem(CLAVE_INTRO_SILENCIO) === "1";
    } catch {
      return false;
    }
  });
  const [ocultando, setOcultando] = useState(false);
  const t = useCallback((clave: string) => traducirCine(clave, idioma), [idioma]);
  const silencioRef = useRef(silencio);
  silencioRef.current = silencio;

  const cerrar = useCallback(() => {
    setOcultando(true);
    try {
      localStorage.setItem(CLAVE_INTRO_VISTA, "1");
    } catch {
      /* sin storage: se mostrará otra vez, sin drama */
    }
    setTimeout(onTerminar, 380);
  }, [onTerminar]);

  /* Jingle + despegue al montar; autocierre a los 6,5 s */
  useEffect(() => {
    despegue(silencioRef.current);
    const idMusica = setTimeout(() => acordeStreamDog(silencioRef.current), 450);
    const idCierre = setTimeout(cerrar, 6500);
    return () => {
      clearTimeout(idMusica);
      clearTimeout(idCierre);
    };
  }, [cerrar]);

  const alternarSilencio = (): void => {
    const nuevo = !silencio;
    setSilencio(nuevo);
    try {
      localStorage.setItem(CLAVE_INTRO_SILENCIO, nuevo ? "1" : "0");
    } catch {
      /* sin storage */
    }
  };

  const reducida = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[90] flex flex-col items-center justify-center overflow-hidden bg-[#050a12] transition-opacity duration-300",
        ocultando ? "opacity-0" : "opacity-100"
      )}
      role="dialog"
      aria-modal="true"
      aria-label={t("Bienvenido a StreamDog")}
    >
      {/* Fondo vivo: halos cian/esmeralda que respiran */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className={cn("absolute -left-24 top-1/4 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl", !reducida && "sdc-halo")} />
        <div className={cn("absolute -right-16 bottom-1/4 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl", !reducida && "sdc-halo-reverso")} />
      </div>

      <button
        type="button"
        onClick={alternarSilencio}
        aria-label={t("Sonido")}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.05] text-slate-300 transition-colors hover:text-white"
      >
        {silencio ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
      </button>
      <button
        type="button"
        onClick={cerrar}
        className="absolute right-16 top-4 z-10 min-h-[40px] rounded-xl px-3 text-[12px] font-semibold text-slate-400 transition-colors hover:text-white"
      >
        {t("Saltar la intro")}
      </button>

      {/* Logo + título */}
      <img
        src={asset("/streamdog-pwa/icon.svg")}
        alt=""
        aria-hidden
        className={cn("h-28 w-28 rounded-3xl shadow-2xl shadow-cyan-500/25", !reducida && "sdc-kenburns")}
      />
      <h1 className="mt-6 text-center text-[42px] font-light tracking-tight text-slate-50 sm:text-[56px]">
        Stream
        <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text font-medium text-transparent">Dog</span>
        <span className="ml-3 inline-block align-middle text-[20px] text-slate-400">∞</span>
      </h1>
      <p className="mt-3 max-w-md px-6 text-center text-[14.5px] leading-relaxed text-slate-300">{t("Bienvenido a StreamDog")}</p>
      <p className="mt-1.5 max-w-md px-6 text-center text-[12.5px] leading-relaxed text-slate-500">
        {t("Cine y series libres, actualizados cada hora")}
      </p>

      <button
        type="button"
        onClick={cerrar}
        className="sdc-brillo mt-9 inline-flex min-h-[46px] items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-8 text-[14.5px] font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition-transform hover:scale-[1.04]"
      >
        <Play className="h-4 w-4" fill="currentColor" aria-hidden />
        {t("Entrar")}
      </button>
    </div>
  );
}

/* ══════════════════ TOUR ══════════════════ */

interface PasoTour {
  /** Clave del título del paso. */
  titulo: string;
  /** Clave del texto del paso. */
  texto: string;
  /** Selector CSS del elemento a destacar (null = tarjeta centrada). */
  objetivo: string | null;
}

const PASOS: PasoTour[] = [
  { titulo: "Tour: tu catálogo infinito", texto: "Un minuto y sabes usar toda la casa: qué es cada cosa, dónde está y cómo se usa. Puedes saltarlo cuando quieras.", objetivo: null },
  { titulo: "Actualizado cada hora, de verdad", texto: "Este chip es el pulso de la casa: el cron empresarial recoge lo nuevo de las fuentes cada hora y el punto verde dice que todo va fino.", objetivo: "[data-tour='infinito']" },
  { titulo: "Busca entre millones de tdo", texto: "El buscador pega en las tres fuentes a la vez (Commons, Archive y TVMaze) y muestra resultados reales: escribe y da al botón verde.", objetivo: "[data-tour='buscador']" },
  { titulo: "Cinco vistas, un catálogo", texto: "Inicio con filas, el Top 100 con 6 filtros, Películas con crítica constructiva, Series y tu Mi lista: todo salta con un toque.", objetivo: "[data-tour='vistas']" },
  { titulo: "La hoja de ruta se PUEDE usar", texto: "Deportes, viajes, juegos, apps y webs no son carteles mudos: cada ficha abre acciones reales — jugar, instalar, explorar, escuchar.", objetivo: "[data-tour='hoja-ruta']" },
  { titulo: "En tu idioma, siempre", texto: "«Sistema» adapta la app al idioma de tu dispositivo y también puedes fijar Español, English, Deutsch o Français.", objetivo: "[data-tour='idioma']" },
  { titulo: "Y el pacto abierto", texto: "Aquí está la carta a las plataformas y la explicación completa de la app: qué es, cómo funciona y cómo se sostiene sin anuncios.", objetivo: "[data-tour='pacto']" },
];

interface PropsTour {
  onTerminar: () => void;
}

export function TourStreamDog({ onTerminar }: PropsTour) {
  const [idioma] = useState<IdiomaCineFijo>(idiomaDeLaCasa);
  const [paso, setPaso] = useState(0);
  const t = useCallback((clave: string) => traducirCine(clave, idioma), [idioma]);

  /* Destacar el objetivo del paso: scroll + anillo; sonido por paso */
  useEffect(() => {
    const actual = PASOS[paso];
    blip(false);
    if (!actual.objetivo) return;
    const objetivo = document.querySelector(actual.objetivo);
    if (objetivo) {
      objetivo.scrollIntoView({ behavior: "smooth", block: "center" });
      objetivo.classList.add("tour-destacado");
      return () => objetivo.classList.remove("tour-destacado");
    }
    return undefined;
  }, [paso]);

  const avanzar = (): void => {
    if (paso >= PASOS.length - 1) terminar();
    else setPaso((p) => p + 1);
  };

  const terminar = (): void => {
    try {
      localStorage.setItem(CLAVE_TOUR_HECHO, "1");
    } catch {
      /* sin storage */
    }
    document.querySelector(".tour-destacado")?.classList.remove("tour-destacado");
    onTerminar();
  };

  const actual = PASOS[paso];
  const reducida = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[85] flex justify-center px-3 pb-4 sm:pb-6" role="dialog" aria-label={t("Tour de la casa")}>
      <div className={cn("w-full max-w-lg rounded-2xl border border-cyan-300/25 bg-[#0b1526]/95 p-4 shadow-2xl shadow-cyan-500/10 backdrop-blur-md", !reducida && "sdc-elevarse")}>
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-cyan-200">
            <Sparkles className="h-3 w-3" aria-hidden />
            {t("Tour de la casa")}
          </span>
          <span className="text-[11px] font-medium text-slate-500">
            {paso + 1}/{PASOS.length}
          </span>
          <button type="button" onClick={terminar} className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-white" aria-label={t("Saltar el tour")}>
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <h3 className="text-[15.5px] font-bold tracking-tight text-slate-50">{t(actual.titulo)}</h3>
        <p className="mt-1 text-[12.5px] leading-relaxed text-slate-300">{t(actual.texto)}</p>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPaso((p) => Math.max(0, p - 1))}
            disabled={paso === 0}
            className="inline-flex min-h-[38px] items-center gap-1 rounded-xl border border-white/15 bg-white/[0.05] px-3.5 text-[12.5px] font-semibold text-slate-200 transition-colors hover:bg-white/[0.09] disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            {t("Anterior")}
          </button>
          <button
            type="button"
            onClick={avanzar}
            className="ml-auto inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 text-[12.5px] font-bold text-slate-950 transition-transform hover:scale-[1.03]"
          >
            {paso >= PASOS.length - 1 ? t("Terminar") : t("Siguiente")}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
