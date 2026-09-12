"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Globe, Loader2, RefreshCw, Search, WifiOff } from "lucide-react";
import { asset } from "@/lib/asset-path";
import { jsonSeguro } from "@/lib/fetch-seguro";
import { isStaticDemo } from "@/lib/static-mode";
import {
  CLAVES_CINE,
  apuntarProgreso,
  avisarReparacion,
  dedupeItems,
  esBooleano,
  esIdiomaCine,
  esListaCine,
  esProgresos,
  guardarColeccion,
  leerColeccion,
  progresoTerminado,
  type FilaCine,
  type FuenteCine,
  type ItemCine,
  type ProgresoVer,
} from "@/lib/streamdog/cine";
import { coleccionOroCliente, explorarCliente } from "@/lib/streamdog/cine-cliente";
import { IDIOMAS_CINE, traducirCine, type IdiomaCine } from "@/lib/streamdog/cine-i18n";
import { cn } from "@/lib/utils";
import BannerReparacion from "./BannerReparacion";
import DetalleModal from "./DetalleModal";
import FilaCarrusel from "./FilaCarrusel";
import Reproductor from "./Reproductor";
import TarjetaContenido from "./TarjetaContenido";

/**
 * CINE&SERIES (v1.32.0) — el módulo entero de películas y series gratis:
 *
 *  · CATÁLOGO REAL del backend (/api/streamdog/cine): Commons (dominio
 *    público jugable), Archive y TVMaze, con degradación por fuente.
 *  · MULTILENGUAJE es/en/de/fr propio del módulo (persistente).
 *  · MI LISTA y SEGUIR VIENDO con autoreparación real del storage.
 *  · REPRODUCTOR con segundo plano (MediaSession + PiP automático).
 *  · PWA: instalación y service worker con informe de salud real.
 */

type Vista = "inicio" | "peliculas" | "series" | "milista";

const VISTAS: { id: Vista; clave: string }[] = [
  { id: "inicio", clave: "Inicio" },
  { id: "peliculas", clave: "Películas" },
  { id: "series", clave: "Series" },
  { id: "milista", clave: "Mi lista" },
];

interface RespuestaCatalogo {
  ok: boolean;
  filas?: FilaCine[];
  items?: ItemCine[];
  hayMas?: boolean;
  degradada: boolean;
  fuentes: Record<string, { estado: "ok" | "degradada" | "caida"; ms: number | null }>;
  error?: string;
}

interface SesionReproductor {
  item: ItemCine;
  url: string | null;
  mime: string | null;
  posicion: number;
}

interface EventoInstalador extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const ES_FUENTE = (v: string): v is FuenteCine => v === "commons" || v === "archive" || v === "tvmaze";

export default function Cine() {
  /* ── idioma y vistas ── */
  const [idioma, setIdioma] = useState<IdiomaCine>("es");
  const [vista, setVista] = useState<Vista>("inicio");
  const [consulta, setConsulta] = useState("");
  const [qDebounce, setQDebounce] = useState("");

  /* ── catálogo ── */
  const [filas, setFilas] = useState<FilaCine[]>([]);
  const [items, setItems] = useState<ItemCine[]>([]);
  const [hayMas, setHayMas] = useState(false);
  const [degradada, setDegradada] = useState(false);
  const [fuentes, setFuentes] = useState<RespuestaCatalogo["fuentes"]>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enLinea, setEnLinea] = useState(true);
  /** Fuentes salvadas por el PLAN B del navegador (Commons directo). */
  const [fuentesCliente, setFuentesCliente] = useState<Record<string, boolean>>({});
  const paginaRef = useRef(1);
  const controlCarga = useRef<AbortController | null>(null);

  /* ── colecciones del usuario ── */
  const [miLista, setMiLista] = useState<ItemCine[]>([]);
  const [progresos, setProgresos] = useState<ProgresoVer[]>([]);
  const [fondo, setFondo] = useState(false);

  /* ── modales e instalación ── */
  const [detalle, setDetalle] = useState<ItemCine | null>(null);
  const [sesion, setSesion] = useState<SesionReproductor | null>(null);
  const [instalador, setInstalador] = useState<EventoInstalador | null>(null);
  const [instalada, setInstalada] = useState(false);

  const t = useCallback((clave: string, vars?: Record<string, string | number>) => traducirCine(clave, idioma, vars), [idioma]);

  /* ── CARGA INICIAL: storage con autoreparación + SW + instalador ── */
  useEffect(() => {
    const almacen = typeof localStorage !== "undefined" ? localStorage : null;

    const lista = leerColeccion<ItemCine[]>(CLAVES_CINE.miLista, [], esListaCine, almacen);
    if (lista.reparacion) avisarReparacion("Mi lista", lista.reparacion);
    setMiLista(lista.valor);

    const historia = leerColeccion<ProgresoVer[]>(CLAVES_CINE.progreso, [], esProgresos, almacen);
    if (historia.reparacion) avisarReparacion("Seguir viendo", historia.reparacion);
    setProgresos(historia.valor);

    const idiomaGuardado = leerColeccion<IdiomaCine>(CLAVES_CINE.idioma, "es", esIdiomaCine, almacen);
    if (idiomaGuardado.reparacion) avisarReparacion("Idioma", idiomaGuardado.reparacion);
    if (idiomaGuardado.reparacion === null && almacen?.getItem(CLAVES_CINE.idioma) === null) {
      // Primera visita: hereda del navegador (es por defecto, la casa).
      const delNavegador = typeof navigator !== "undefined" ? navigator.language?.slice(0, 2) : "es";
      const inicial = delNavegador === "de" || delNavegador === "fr" || delNavegador === "en" ? delNavegador : "es";
      setIdioma(inicial as IdiomaCine);
      guardarColeccion(CLAVES_CINE.idioma, inicial, almacen);
    } else {
      setIdioma(idiomaGuardado.valor);
    }

    const prefFondo = leerColeccion<boolean>(CLAVES_CINE.fondo, false, esBooleano, almacen);
    if (prefFondo.reparacion) avisarReparacion("Segundo plano", prefFondo.reparacion);
    setFondo(prefFondo.valor);

    setEnLinea(typeof navigator === "undefined" ? true : navigator.onLine);
    const alCambio = () => setEnLinea(navigator.onLine);
    window.addEventListener("online", alCambio);
    window.addEventListener("offline", alCambio);
    return () => {
      window.removeEventListener("online", alCambio);
      window.removeEventListener("offline", alCambio);
    };
  }, []);

  /* Service worker (idempotente, mismo patrón que la Parrilla). */
  useEffect(() => {
    (async () => {
      if (isStaticDemo() || !("serviceWorker" in navigator)) return;
      try {
        if (!navigator.serviceWorker.controller) {
          await navigator.serviceWorker.register(asset("/streamdog-pwa/sw.js"), { scope: asset("/streamdog") });
          await navigator.serviceWorker.ready;
        }
      } catch {
        /* sin SW: la app funciona igual, sin modo sin conexión */
      }
    })();
  }, []);

  /* Instalación PWA. */
  useEffect(() => {
    const alPedir = (e: Event) => {
      e.preventDefault();
      setInstalador(e as EventoInstalador);
    };
    window.addEventListener("beforeinstallprompt", alPedir);
    window.addEventListener("appinstalled", () => {
      setInstalada(true);
      setInstalador(null);
    });
    return () => window.removeEventListener("beforeinstallprompt", alPedir);
  }, []);

  /* ── BÚSQUEDA con debounce (450 ms) ── */
  useEffect(() => {
    const reloj = setTimeout(() => setQDebounce(consulta.trim()), 450);
    return () => clearTimeout(reloj);
  }, [consulta]);

  /* ── PLAN B: Commons directo desde el navegador ──
   * Wikimedia bloquea por huella TLS a los runtimes serverless, pero la
   * API de Commons es CORS-abierta: si el backend la trae degradada, el
   * NAVEGADOR repite la consulta y fusiona el resultado en las filas. */
  const reforzarConCliente = useCallback(
    async (q: string, vista: string, pagina: number, signal: AbortSignal) => {
      try {
        if (q) {
          const extra = await explorarCliente(q, 12, 0, signal);
          if (extra.length > 0) setItems((prev) => dedupeItems([...prev, ...extra]).slice(0, 40));
        } else if (vista === "peliculas") {
          const extra =
            pagina === 1
              ? await coleccionOroCliente(signal)
              : await explorarCliente("classic film OR cortometraje OR silent movie", 12, (pagina - 1) * 12, signal);
          if (extra.length > 0) setItems((prev) => dedupeItems([...prev, ...extra]));
        } else if (vista === "inicio") {
          const oro = await coleccionOroCliente(signal);
          if (oro.length > 0) {
            setFilas((prev) => [
              { claveI18n: "Colección de oro", items: oro },
              ...prev.filter((f) => f.claveI18n !== "Colección de oro"),
            ]);
          }
          const explorar = dedupeItems(await explorarCliente("short film OR animated film OR documentary film", 12, 0, signal));
          if (explorar.length > 0) {
            setFilas((prev) => [
              ...prev.filter((f) => f.claveI18n !== "Explorar el archivo libre"),
              { claveI18n: "Explorar el archivo libre", items: explorar.slice(0, 14) },
            ]);
          }
        }
        setFuentesCliente((prev) => ({ ...prev, commons: true }));
      } catch {
        /* sin plan B: la degradación elegante del backend manda */
      }
    },
    []
  );

  /* ── CARGA DEL CATÁLOGO ── */
  const cargar = useCallback(
    async (modo: "reset" | "mas") => {
      controlCarga.current?.abort();
      const control = new AbortController();
      controlCarga.current = control;

      const pagina = modo === "mas" ? paginaRef.current + 1 : 1;
      paginaRef.current = pagina;
      setCargando(true);
      setError(null);
      if (modo === "reset") {
        setFilas([]);
        setItems([]);
      }

      const params = new URLSearchParams({ pagina: String(pagina) });
      if (qDebounce) params.set("q", qDebounce);
      else if (vista === "peliculas" || vista === "series") params.set("vista", vista);

      try {
        const datos = await jsonSeguro<RespuestaCatalogo>(
          await fetch(`/api/streamdog/cine?${params.toString()}`, { signal: control.signal }),
          "catálogo de StreamDog Cine"
        );
        if (!datos.ok) {
          setError(datos.error ?? "El catálogo no está disponible ahora mismo.");
          return;
        }
        setDegradada(datos.degradada);
        setFuentes(datos.fuentes ?? {});
        setHayMas(Boolean(datos.hayMas));
        if (datos.filas) setFilas(datos.filas);
        setItems((prev) => (modo === "mas" ? [...prev, ...(datos.items ?? [])] : datos.items ?? []));
        const commonsViva = Object.entries(datos.fuentes ?? {}).some(([k, v]) => k === "commons" && v.estado === "ok");
        if (!commonsViva) void reforzarConCliente(qDebounce, vista, pagina, control.signal);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError(e instanceof Error ? e.message : "Error inesperado.");
        }
      } finally {
        setCargando(false);
      }
    },
    [qDebounce, vista, reforzarConCliente]
  );

  useEffect(() => {
    if (vista === "milista") return; // no pega a la red: lo local manda
    void cargar("reset");
  }, [vista, qDebounce, cargar]);

  /* ── ACCIONES ── */

  const cambiarIdioma = (nuevo: IdiomaCine): void => {
    setIdioma(nuevo);
    guardarColeccion(CLAVES_CINE.idioma, nuevo, typeof localStorage !== "undefined" ? localStorage : null);
  };

  const activarFondo = (activa: boolean): void => {
    setFondo(activa);
    guardarColeccion(CLAVES_CINE.fondo, activa, typeof localStorage !== "undefined" ? localStorage : null);
  };

  const alternarMiLista = useCallback(
    (item: ItemCine): void => {
      setMiLista((prev) => {
        const existe = prev.some((x) => x.id === item.id);
        const nueva = existe ? prev.filter((x) => x.id !== item.id) : [...prev, item].slice(-300);
        guardarColeccion(CLAVES_CINE.miLista, nueva, typeof localStorage !== "undefined" ? localStorage : null);
        return nueva;
      });
    },
    []
  );

  const guardarProgreso = useCallback((item: ItemCine, posicionSeg: number, duracionSeg: number): void => {
    setProgresos((prev) => {
      const nueva = apuntarProgreso(prev, { id: item.id, titulo: item.titulo, imagen: item.imagen, posicionSeg, duracionSeg }, Date.now());
      guardarColeccion(CLAVES_CINE.progreso, nueva, typeof localStorage !== "undefined" ? localStorage : null);
      return nueva;
    });
  }, []);

  const abrirSesion = (item: ItemCine, url: string | null, mime: string | null, posicion = 0): void => {
    setDetalle(null);
    setSesion({ item, url, mime, posicion });
  };

  /* ── DERIVADOS ── */

  const idsEnLista = useMemo(() => new Set(miLista.map((x) => x.id)), [miLista]);

  const pctProgresos = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const p of progresos) {
      if (p.duracionSeg > 0 && !progresoTerminado(p)) mapa.set(p.id, (p.posicionSeg / p.duracionSeg) * 100);
    }
    return mapa;
  }, [progresos]);

  const seguirViendo = useMemo(() => {
    return progresos
      .filter((p) => p.posicionSeg > 30 && !progresoTerminado(p))
      .slice(0, 12)
      .map<ProgresoVer & { item: ItemCine }>((p) => {
        const prefijo = p.id.split(":")[0];
        return {
          ...p,
          item: {
            id: p.id,
            fuente: ES_FUENTE(prefijo) ? prefijo : "commons",
            tipo: "pelicula",
            titulo: p.titulo,
            anyo: null,
            imagen: p.imagen,
            sinopsis: "",
            valoracion: null,
            generos: [],
            duracionMin: null,
            playable: true,
          },
        };
      });
  }, [progresos]);

  async function instalar(): Promise<void> {
    if (!instalador) return;
    await instalador.prompt();
    const eleccion = await instalador.userChoice;
    if (eleccion.outcome === "accepted") {
      setInstalada(true);
      setInstalador(null);
    }
  }

  const buscando = qDebounce.length > 0;
  const itemsGrilla = vista === "milista" && !buscando ? miLista : items;

  const chipFuente = (id: string, etiqueta: string) => {
    const info = fuentes[id];
    const salvadaPorCliente = fuentesCliente[id];
    if (!info && !salvadaPorCliente) return null;
    const estado = salvadaPorCliente ? "ok" : info?.estado ?? "caida";
    const color =
      estado === "ok"
        ? "bg-emerald-400 text-emerald-100"
        : estado === "degradada"
          ? "bg-amber-400 text-amber-950"
          : "bg-rose-400 text-rose-950";
    return (
      <span key={id} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10.5px] font-medium text-slate-300">
        <span className={cn("h-1.5 w-1.5 rounded-full", color)} aria-hidden />
        {etiqueta}
        {estado === "ok" ? salvadaPorCliente ? " · directo" : "" : ""}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {!enLinea && (
        <p className="flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3.5 py-2.5 text-[12.5px] font-medium text-amber-200">
          <WifiOff className="h-4 w-4" aria-hidden />
          {t("Sin conexión: el catálogo vuelve con la red")}
        </p>
      )}

      <BannerReparacion idioma={idioma} />

      {/* Cabecera del módulo: fuentes en vivo, idioma e instalación */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">{t("Fuentes en vivo")}</span>
          {chipFuente("commons", "Commons")}
          {chipFuente("archive", "Archive")}
          {chipFuente("tvmaze", "TVMaze")}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {degradada && <span className="hidden text-[11px] text-amber-300/90 sm:inline">{t("Una fuente no respondió a tiempo: se muestra el resto.")}</span>}
          <label className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[12px] text-slate-300">
            <Globe className="h-3.5 w-3.5 text-cyan-300" aria-hidden />
            <span className="sr-only">{t("Idioma")}</span>
            <select
              value={idioma}
              onChange={(e) => cambiarIdioma(e.target.value as IdiomaCine)}
              className="bg-transparent text-[12px] font-medium text-slate-200 focus:outline-none"
              aria-label={t("Idioma")}
            >
              {IDIOMAS_CINE.map((i) => (
                <option key={i.id} value={i.id} className="bg-[#0d1728]">
                  {i.etiqueta}
                </option>
              ))}
            </select>
          </label>
          {instalador && !instalada && (
            <button
              type="button"
              onClick={() => void instalar()}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-3 text-[12px] font-semibold text-cyan-100 transition-colors hover:bg-cyan-400/20"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              {t("Instalar la app")}
            </button>
          )}
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
        <input
          type="search"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder={t("Buscar películas y series…")}
          aria-label={t("Buscar películas y series…")}
          className="min-h-[44px] w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 text-[13.5px] text-slate-100 placeholder:text-slate-500 focus:border-cyan-300/50 focus:outline-none"
        />
      </div>

      {/* Vistas (se ocultan mientras se busca) */}
      {!buscando && (
        <nav aria-label="Vistas del catálogo" className="flex flex-wrap gap-2">
          {VISTAS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVista(v.id)}
              aria-current={vista === v.id ? "page" : undefined}
              className={cn(
                "min-h-[38px] rounded-xl border px-3.5 text-[13px] font-medium transition-colors",
                vista === v.id
                  ? "border-cyan-300/50 bg-cyan-400/10 text-cyan-100"
                  : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:bg-white/[0.06]"
              )}
            >
              {t(v.clave)}
              {v.id === "milista" && miLista.length > 0 ? ` · ${miLista.length}` : ""}
            </button>
          ))}
        </nav>
      )}

      {/* Aviso honesto sobre el idioma del contenido */}
      <p className="text-[11px] leading-relaxed text-slate-500">{t("Los títulos y sinopsis llegan en el idioma de su fuente (normalmente inglés); la interfaz sí está traducida.")}</p>

      {/* CONTENIDO */}
      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-400/25 bg-rose-500/[0.06] p-8 text-center">
          <WifiOff className="h-7 w-7 text-rose-300" aria-hidden />
          <p className="max-w-sm text-[13px] leading-relaxed text-rose-100/90">{error}</p>
          <button
            type="button"
            onClick={() => void cargar("reset")}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-white/20 bg-white/[0.06] px-4 text-[13px] font-semibold text-slate-100 transition-colors hover:border-white/40"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            {t("Reintentar")}
          </button>
        </div>
      ) : cargando && filas.length === 0 && items.length === 0 ? (
        <div className="space-y-5" aria-busy="true" aria-label={t("Cargando catálogo…")}>
          {[0, 1].map((fila) => (
            <div key={fila} className="space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-white/5" />
              <div className="flex gap-3 overflow-hidden">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-[150px] w-[168px] shrink-0 animate-pulse rounded-xl bg-white/5 sm:w-[188px]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : buscando ? (
        /* Resultados de búsqueda */
        itemsGrilla.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-3">
              {itemsGrilla.map((item) => (
                <TarjetaContenido
                  key={`${item.id}-${item.titulo}`}
                  item={item}
                  idioma={idioma}
                  enMiLista={idsEnLista.has(item.id)}
                  progresoPct={pctProgresos.get(item.id) ?? null}
                  onAbrir={setDetalle}
                  onMiLista={alternarMiLista}
                />
              ))}
            </div>
            {hayMas && (
              <button
                type="button"
                onClick={() => void cargar("mas")}
                className="mx-auto flex min-h-[42px] items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-5 text-[13px] font-semibold text-slate-100 transition-colors hover:border-white/30"
              >
                {cargando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {t("Cargar más")}
              </button>
            )}
          </>
        ) : (
          !cargando && <p className="py-10 text-center text-[13.5px] text-slate-400">{t("Sin resultados para «{q}»", { q: qDebounce })}</p>
        )
      ) : vista === "milista" ? (
        /* Mi lista (local, instantáneo) */
        miLista.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {miLista.map((item) => (
              <TarjetaContenido
                key={item.id}
                item={item}
                idioma={idioma}
                enMiLista
                progresoPct={pctProgresos.get(item.id) ?? null}
                onAbrir={setDetalle}
                onMiLista={alternarMiLista}
              />
            ))}
          </div>
        ) : (
          <p className="py-10 text-center text-[13.5px] text-slate-400">{t("Catálogo vacío por ahora")}</p>
        )
      ) : vista === "inicio" ? (
        /* INICIO: seguir viendo + filas de carrusel */
        <div className="space-y-7">
          {seguirViendo.length > 0 && (
            <section aria-label={t("Seguir viendo")}>
              <h2 className="mb-2 text-[15px] font-semibold tracking-tight text-slate-100">{t("Seguir viendo")}</h2>
              <div className="scrollbar-thin flex snap-x gap-3 overflow-x-auto pb-2">
                {seguirViendo.map(({ item, posicionSeg, duracionSeg }) => (
                  <div key={item.id} className="snap-start">
                    <TarjetaContenido
                      item={item}
                      idioma={idioma}
                      enMiLista={idsEnLista.has(item.id)}
                      progresoPct={duracionSeg > 0 ? (posicionSeg / duracionSeg) * 100 : 0}
                      onAbrir={(i) => abrirSesion(i, null, null, posicionSeg)}
                      onMiLista={alternarMiLista}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
          {filas.length > 0 ? (
            filas.map((fila) => (
              <FilaCarrusel
                key={fila.claveI18n}
                titulo={t(fila.claveI18n)}
                items={fila.items}
                idioma={idioma}
                miLista={idsEnLista}
                progresos={pctProgresos}
                onAbrir={setDetalle}
                onMiLista={alternarMiLista}
              />
            ))
          ) : (
            !cargando && <p className="py-10 text-center text-[13.5px] text-slate-400">{t("Catálogo vacío por ahora")}</p>
          )}
        </div>
      ) : (
        /* Películas y Series: grilla paginada */
        itemsGrilla.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-3">
              {itemsGrilla.map((item) => (
                <TarjetaContenido
                  key={item.id}
                  item={item}
                  idioma={idioma}
                  enMiLista={idsEnLista.has(item.id)}
                  progresoPct={pctProgresos.get(item.id) ?? null}
                  onAbrir={setDetalle}
                  onMiLista={alternarMiLista}
                />
              ))}
            </div>
            {hayMas && (
              <button
                type="button"
                onClick={() => void cargar("mas")}
                className="mx-auto flex min-h-[42px] items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-5 text-[13px] font-semibold text-slate-100 transition-colors hover:border-white/30"
              >
                {cargando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {t("Cargar más")}
              </button>
            )}
          </>
        ) : (
          !cargando && <p className="py-10 text-center text-[13.5px] text-slate-400">{t("Catálogo vacío por ahora")}</p>
        )
      )}

      {/* Modales */}
      {detalle && (
        <DetalleModal
          item={detalle}
          idioma={idioma}
          enMiLista={idsEnLista.has(detalle.id)}
          onCerrar={() => setDetalle(null)}
          onReproducir={(item, url, mime) => abrirSesion(item, url, mime, 0)}
          onMiLista={alternarMiLista}
        />
      )}
      {sesion && (
        <Reproductor
          item={sesion.item}
          idioma={idioma}
          videoUrl={sesion.url}
          mime={sesion.mime}
          posicionInicialSeg={sesion.posicion}
          fondoPref={fondo}
          onCerrar={() => setSesion(null)}
          onProgreso={(pos, dur) => guardarProgreso(sesion.item, pos, dur)}
          onFondoPref={activarFondo}
        />
      )}
    </div>
  );
}
