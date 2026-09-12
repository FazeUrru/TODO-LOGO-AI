"use client";

import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Globe, Infinity as InfinityIcon, Loader2, RefreshCw, Search, Settings2, WifiOff } from "lucide-react";
import { asset } from "@/lib/asset-path";
import { jsonSeguro } from "@/lib/fetch-seguro";
import { isStaticDemo } from "@/lib/static-mode";
import {
  CLAVES_CINE,
  CATEGORIAS_EXPLORAR,
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
import {
  AJUSTES_CINE_DEFECTO,
  VELOCIDADES_CINE,
  apuntarGustos,
  esAjustesCine,
  esGustosCine,
  gustosVacios,
  recomendadosPara,
  type AjustesCine,
  type GustosCine,
} from "@/lib/streamdog/cine-gustos";
import { coleccionOroCliente, explorarCliente } from "@/lib/streamdog/cine-cliente";
import { IDIOMAS_CINE, resolverIdiomaCine, traducirCine, type IdiomaCine } from "@/lib/streamdog/cine-i18n";
import { cn } from "@/lib/utils";
import BannerReparacion from "./BannerReparacion";
import DetalleModal from "./DetalleModal";
import FichaExpandida, { type AccionFicha, type FichaSeccionId } from "./FichaExpandida";
import FilaCarrusel from "./FilaCarrusel";
import FilaDeportes from "./FilaDeportes";
import FilaProximamente, { type SeccionPronto } from "./FilaProximamente";
import HeroeDestacado from "./HeroeDestacado";
import TarjetaContenido from "./TarjetaContenido";
import Top100 from "./Top100";
import EnlaceArena from "@/components/streamdog/EnlaceArena";
import AvisoLegal from "./AvisoLegal";
import Sostenibilidad from "./Sostenibilidad";

/**
 * CINE&SERIES (v1.38.0) — el módulo entero de películas y series gratis:
 *
 *  · CATÁLOGO REAL del backend (/api/streamdog/cine): Commons (dominio
 *    público jugable), Archive y TVMaze, con degradación por fuente.
 *  · MULTILENGUAJE es/en/de/fr + «Sistema» propio del módulo (persistente;
 *    se adapta solo al idioma del dispositivo).
 *  · MI LISTA y SEGUIR VIENDO con autoreparación real del storage.
 *  · REPRODUCTOR con segundo plano (MediaSession + PiP automático).
 *  · PWA: instalación y service worker con informe de salud real.
 *  · FICHAS EXPANDIDAS (v1.38.0): la hoja de ruta se PUEDE USAR —
 *    deportes → parrilla, juegos → /games, apps → instalar PWA,
 *    viajes → búsqueda real y webs → las herramientas de la casa.
 */

type Vista = "inicio" | "top100" | "peliculas" | "series" | "explorar" | "milista";

/**
 * CODE-SPLITTING (v1.38.0): el reproductor pesa (controles, MediaSession,
 * PiP) y casi nadie lo abre al entrar — se carga con lazy() en el momento
 * exacto del primer play. El catálogo entero carga MÁS RÁPIDO.
 */
const Reproductor = lazy(() => import("./Reproductor"));

/** Fila del inicio → su categoría EXPLORAR ∞ (botón «Ver todo»). */
const CATEGORIA_POR_FILA: Record<string, string> = {
  "Cine clásico libre": "clasicos",
  "Film noir": "film-noir",
  "Ciencia ficción y terror": "ciencia-ficcion",
  "Dibujos animados clásicos": "animacion-clasica",
  "Televisión clásica": "tv-clasica",
  Documentales: "documentales",
  "Explorar el archivo libre": "cortos-libres",
  "Series del momento": "series-todas",
};

/** Degradados de los chips de salto rápido (uno por fila, ciclando). */
const GRADIENTES_FILA = [
  "from-emerald-400/25 to-teal-400/10 text-emerald-100 border-emerald-300/40",
  "from-violet-400/25 to-fuchsia-400/10 text-violet-100 border-violet-300/40",
  "from-sky-400/25 to-cyan-400/10 text-sky-100 border-sky-300/40",
  "from-amber-400/25 to-orange-400/10 text-amber-100 border-amber-300/40",
  "from-rose-400/25 to-pink-400/10 text-rose-100 border-rose-300/40",
  "from-lime-400/25 to-green-400/10 text-lime-100 border-lime-300/40",
  "from-cyan-400/25 to-blue-300/10 text-cyan-100 border-cyan-300/40",
  "from-orange-400/25 to-red-400/10 text-orange-100 border-orange-300/40",
];

const VISTAS: { id: Vista; clave: string }[] = [
  { id: "inicio", clave: "Inicio" },
  { id: "top100", clave: "Top 100" },
  { id: "peliculas", clave: "Películas" },
  { id: "series", clave: "Series" },
  { id: "explorar", clave: "Explorar" },
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
  /* ── idioma y vistas ── v1.38.0: «sistema» se adapta al dispositivo ── */
  const [idiomaElegido, setIdiomaElegido] = useState<IdiomaCine>("sistema");
  const idioma = resolverIdiomaCine(idiomaElegido);
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

  /* ── ficha expandida (v1.38.0) + salud del cron + explorar películas ── */
  const [ficha, setFicha] = useState<FichaSeccionId | null>(null);
  const [cronSalud, setCronSalud] = useState<"ok" | "degradada" | "caida" | "sin-datos" | null>(null);
  /** Películas: false → cartelera con 4 filtros; true → grilla paginada. */
  const [explorarPeliculas, setExplorarPeliculas] = useState(false);

  /* ── AUTOGUARDADO TOTAL (v1.38.0): ajustes + gustos ── */
  const [ajustes, setAjustes] = useState<AjustesCine>(AJUSTES_CINE_DEFECTO);
  const [gustos, setGustos] = useState<GustosCine>(gustosVacios());
  const [panelAjustes, setPanelAjustes] = useState(false);

  /* ── EXPLORAR ∞ (v1.38.0): TODAS las categorías, sin fondo ── */
  const [explorarCat, setExplorarCat] = useState<string>(CATEGORIAS_EXPLORAR[0].id);
  const centinelaRef = useRef<HTMLDivElement>(null);

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

    const idiomaGuardado = leerColeccion<IdiomaCine>(CLAVES_CINE.idioma, "sistema", esIdiomaCine, almacen);
    if (idiomaGuardado.reparacion) avisarReparacion("Idioma", idiomaGuardado.reparacion);
    // Primera visita o visita con idioma guardado: «sistema» se resuelve
    // al vuelo en cada render (resolverIdiomaCine), sin copiar el idioma
    // del navegador a storage — si el usuario cambia el idioma de su
    // dispositivo, la ficha le sigue sin tocar nada.
    setIdiomaElegido(idiomaGuardado.valor);

    const prefFondo = leerColeccion<boolean>(CLAVES_CINE.fondo, false, esBooleano, almacen);
    if (prefFondo.reparacion) avisarReparacion("Segundo plano", prefFondo.reparacion);
    setFondo(prefFondo.valor);

    const ajustesGuardados = leerColeccion<AjustesCine>(CLAVES_CINE.ajustes, AJUSTES_CINE_DEFECTO, esAjustesCine, almacen);
    if (ajustesGuardados.reparacion) avisarReparacion("Ajustes", ajustesGuardados.reparacion);
    setAjustes(ajustesGuardados.valor);

    const gustosGuardados = leerColeccion<GustosCine>(CLAVES_CINE.gustos, gustosVacios(), esGustosCine, almacen);
    if (gustosGuardados.reparacion) avisarReparacion("Gustos", gustosGuardados.reparacion);
    setGustos(gustosGuardados.valor);

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

  /* Chip honesto «Actualizado cada hora»: lee el estado real del cron empresarial. */
  useEffect(() => {
    if (isStaticDemo()) return;
    const control = new AbortController();
    fetch("/api/streamdog/cron/estado", { signal: control.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.ok) setCronSalud((d.salud ?? "sin-datos") as "ok" | "degradada" | "caida" | "sin-datos");
      })
      .catch(() => {});
    return () => control.abort();
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
    async (q: string, vista: string, pagina: number, signal: AbortSignal, explorarCat = "") => {
      try {
        if (q) {
          const extra = await explorarCliente(q, 12, 0, signal);
          if (extra.length > 0) setItems((prev) => dedupeItems([...prev, ...extra]).slice(0, 40));
        } else if (vista === "explorar") {
          /* EXPLORAR ∞ con motor Commons degradado: el navegador repite la
           * consulta (CORS abierto) y fusiona — misma disciplina del plan B. */
          const cat = CATEGORIAS_EXPLORAR.find((c) => c.id === explorarCat);
          if (cat?.motor === "commons") {
            const extra = await explorarCliente(cat.consulta, 12, (pagina - 1) * 12, signal);
            if (extra.length > 0) setItems((prev) => dedupeItems([...prev, ...extra]));
          }
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
      else if (vista === "explorar") {
        params.set("vista", "explorar");
        params.set("cat", explorarCat);
      } else if (vista === "peliculas" || vista === "series") params.set("vista", vista);

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
        if (!commonsViva) void reforzarConCliente(qDebounce, vista, pagina, control.signal, explorarCat);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError(e instanceof Error ? e.message : "Error inesperado.");
        }
      } finally {
        setCargando(false);
      }
    },
    [qDebounce, vista, explorarCat, reforzarConCliente]
  );

  useEffect(() => {
    if (vista === "milista" || vista === "top100") return; // locales o con su propia carga: no pegan aquí
    void cargar("reset");
  }, [vista, qDebounce, explorarCat, cargar]);

  /* ── SCROLL INFINITO (v1.38.0): el centinela baja la página siguiente ──
   * Solo si el ajuste «cargaInfinita» lo permite (autoguardado) y con el
   * botón «Cargar más» siempre presente como respaldo accesible. */
  useEffect(() => {
    if (!hayMas || cargando || !ajustes.cargaInfinita) return;
    const el = centinelaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) void cargar("mas");
      },
      { rootMargin: "600px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hayMas, cargando, ajustes.cargaInfinita, cargar]);

  /* ── ACCIONES ── */

  /** AUTOGUARDADO (v1.38.0): cada cambio de ajuste se persiste al vuelo. */
  const cambiarAjuste = useCallback((parcial: Partial<AjustesCine>): void => {
    setAjustes((prev) => {
      const nueva = { ...prev, ...parcial };
      guardarColeccion(CLAVES_CINE.ajustes, nueva, typeof localStorage !== "undefined" ? localStorage : null);
      return nueva;
    });
  }, []);

  /** AUTOGUARDADO DE GUSTOS (v1.38.0): abrir o añadir a Mi lista enseña a
   * StreamDog qué géneros y fuentes te mueven — todo en tu dispositivo. */
  const apuntarGustoDe = useCallback((item: ItemCine): void => {
    setGustos((prev) => {
      const nueva = apuntarGustos(prev, item, Date.now());
      guardarColeccion(CLAVES_CINE.gustos, nueva, typeof localStorage !== "undefined" ? localStorage : null);
      return nueva;
    });
  }, []);

  const cambiarIdioma = (nuevo: IdiomaCine): void => {
    setIdiomaElegido(nuevo);
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
        if (!existe) apuntarGustoDe(item); // gusto apuntado al añadir
        return nueva;
      });
    },
    [apuntarGustoDe]
  );

  const guardarProgreso = useCallback((item: ItemCine, posicionSeg: number, duracionSeg: number): void => {
    setProgresos((prev) => {
      const nueva = apuntarProgreso(prev, { id: item.id, titulo: item.titulo, imagen: item.imagen, posicionSeg, duracionSeg }, Date.now());
      guardarColeccion(CLAVES_CINE.progreso, nueva, typeof localStorage !== "undefined" ? localStorage : null);
      return nueva;
    });
  }, []);

  const abrirSesion = (item: ItemCine, url: string | null, mime: string | null, posicion = 0): void => {
    apuntarGustoDe(item); // gusto apuntado al abrir (v1.38.0)
    setDetalle(null);
    setSesion({ item, url, mime, posicion });
  };

  /** Salta a una categoría del modo EXPLORAR ∞ (chips o «Ver todo» de una fila). */
  const irACategoria = (catId: string): void => {
    setExplorarCat(catId);
    setVista("explorar");
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  /** «PORQUE TE GUSTA» (v1.38.0): afinidad real sobre el pool ya cargado. */
  const recomendados = useMemo(() => {
    const pool = [...filas.flatMap((f) => f.items), ...items];
    return recomendadosPara(gustos, pool, 14);
  }, [gustos, filas, items]);

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

  /** El botón verde BUSCAR: sin esperar el debounce de 450 ms. */
  const buscarAhora = (): void => setQDebounce(consulta.trim().slice(0, 80));

  /** El héroe: el nº1 REAL de la fila de famosos (o de la primera fila viva). */
  const heroe = useMemo<ItemCine | null>(() => {
    const famosos = filas.find((f) => f.claveI18n === "Los títulos más famosos");
    return famosos?.items[0] ?? filas[0]?.items[0] ?? null;
  }, [filas]);

  /** Salto suave a una fila del inicio (chips premium). */
  const irAFila = (i: number): void => {
    document.getElementById(`fila-cine-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /** Descripciones motivadoras de cada ficha (i18n ×4). */
  const TEXTOS_FICHA: Record<FichaSeccionId, string> = {
    deportes: t("Los deportes llegan a StreamDog: partidos, marcadores y emoción en directo, con la misma calidad que ya tienes en cine y series. Cada hora que pasa estamos más cerca del saque inicial. ⚽"),
    viajes: t("Rutas, destinos y rincones del mundo libre: la brújula de StreamDog está sobre la mesa. Pronto viajar será tan fácil como dar al play. ✈️"),
    juegos: t("El arcade en tiempo real de StreamDog está en desarrollo: partidas rápidas, récords y diversión sin esperas. El mando se está calibrando. 🎮"),
    apps: t("Una caja de apps libres y herramientas de la casa, al estilo StreamDog: útiles, rápidas y sin letra pequeña. Se está compilando. 📱"),
    webs: t("Un radar de webs útiles, seguras y gratuitas para acompañar al catálogo infinito. Estamos afinando la antena. 🌐"),
  };
  const ETIQUETA_SECCION: Record<FichaSeccionId, string> = {
    deportes: t("Deportes en vivo"),
    viajes: t("Viajes"),
    juegos: t("Juegos"),
    apps: t("Apps"),
    webs: t("Webs"),
  };

  /** Salta a una pestaña hermana de StreamDog vía hash (la página la sincroniza). */
  const irAPestaña = (id: "parrilla" | "sportia"): void => {
    if (typeof window === "undefined") return;
    window.location.hash = id;
  };

  /** Búsqueda real de documentales de viaje en el catálogo infinito. */
  const buscarViajes = (): void => {
    setFicha(null);
    setConsulta("travel documentary");
    setQDebounce("travel documentary");
    setVista("inicio");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * FICHAS EXPANDIDAS (v1.38.0): cada sección deja de ser un «muy pronto»
   * mudo y pasa a ofrecer acciones que YA funcionan, con estado honesto.
   */
  const FICHAS: Record<FichaSeccionId, { estado: "ya" | "pronto"; caracteristicas: string[]; acciones: AccionFicha[] }> = {
    deportes: {
      estado: "ya",
      caracteristicas: [t("Marcadores en directo"), t("Parrilla deportiva con IA"), t("Cuenta atrás de cada partido")],
      acciones: [
        { etiqueta: t("Abrir la parrilla"), onClick: () => irAPestaña("parrilla"), primaria: true },
        { etiqueta: t("Abrir SportIA"), onClick: () => irAPestaña("sportia") },
      ],
    },
    viajes: {
      estado: "pronto",
      caracteristicas: [
        t("Documentales de viajes del archivo libre"),
        t("Destinos de dominio público"),
        t("Búsqueda real en el catálogo"),
      ],
      acciones: [{ etiqueta: t("Buscar documentales de viajes"), onClick: buscarViajes, primaria: true }],
    },
    juegos: {
      estado: "ya",
      caracteristicas: [t("Arcade en tiempo real"), t("Récords guardados en tu dispositivo"), t("Sin esperas ni instalaciones")],
      acciones: [{ etiqueta: t("Jugar ahora"), href: "/games", primaria: true }],
    },
    apps: {
      estado: "ya",
      caracteristicas: [
        t("Instalación como app nativa (PWA)"),
        t("Todo StreamDog en tu bolsillo"),
        t("Segundo plano y pantalla completa"),
      ],
      acciones: [
        instalada
          ? { etiqueta: t("Instalada"), desactivada: true }
          : {
              etiqueta: t("Instalar la app"),
              onClick: () => void instalar(),
              desactivada: !instalador,
              pista: instalador ? undefined : t("No aparece el botón: usa el menú de tu navegador → «Instalar app»"),
              primaria: true,
            },
      ],
    },
    webs: {
      estado: "ya",
      caracteristicas: [t("Herramientas propias y libres"), t("Salta a cada web en un clic"), t("Todo gratis, como siempre")],
      acciones: [
        { etiqueta: t("Calculadora"), href: "/calculadora" },
        { etiqueta: t("Cuánticas"), href: "/cuanticas" },
        { etiqueta: t("Pruebas"), href: "/pruebas" },
        { etiqueta: t("Labs"), href: "/labs" },
        { etiqueta: t("Conectores"), href: "/conectores" },
        { etiqueta: t("Leaderboard"), href: "/leaderboard" },
        { etiqueta: t("Novedades"), href: "/novedades" },
        { etiqueta: t("API pública"), href: "/api-publica" },
      ],
    },
  };

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

      {/* Cabecera del módulo: catálogo infinito, fuentes en vivo, idioma e instalación */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="mr-1 inline-flex items-center gap-1 rounded-full border border-cyan-300/30 bg-gradient-to-r from-cyan-400/15 to-emerald-400/10 px-2.5 py-1 text-[11px] font-bold tracking-wide text-cyan-100"
            title={cronSalud ? `cron: ${cronSalud}` : undefined}
            data-tour="infinito"
          >
            <InfinityIcon className="sdc-flotar h-3.5 w-3.5" aria-hidden />
            {t("Catálogo infinito")}
            {cronSalud && (
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  cronSalud === "ok" ? "bg-emerald-400" : cronSalud === "degradada" ? "bg-amber-400" : cronSalud === "caida" ? "bg-rose-400" : "bg-slate-500"
                )}
                aria-hidden
              />
            )}
          </span>
          <span className="hidden text-[11px] font-medium uppercase tracking-wide text-slate-500 sm:inline">{t("Fuentes en vivo")}</span>
          {chipFuente("commons", "Commons")}
          {chipFuente("archive", "Archive")}
          {chipFuente("tvmaze", "TVMaze")}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {degradada && <span className="hidden text-[11px] text-amber-300/90 sm:inline">{t("Una fuente no respondió a tiempo: se muestra el resto.")}</span>}
          <label className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-[12px] text-slate-300" data-tour="idioma">
            <Globe className="h-3.5 w-3.5 text-cyan-300" aria-hidden />
            <span className="sr-only">{t("Idioma")}</span>
            <select
              value={idiomaElegido}
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
          {/* AJUSTES con AUTOGUARDADO (v1.38.0): panel flotante premium */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPanelAjustes((v) => !v)}
              aria-expanded={panelAjustes}
              aria-label={t("Ajustes")}
              title={t("Ajustes")}
              className={cn(
                "flex h-[34px] w-[34px] items-center justify-center rounded-lg border transition-colors",
                panelAjustes ? "border-cyan-300/50 bg-cyan-400/10 text-cyan-100" : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/30 hover:text-white"
              )}
            >
              <Settings2 className="h-4 w-4" aria-hidden />
            </button>
            {panelAjustes && (
              <div className="absolute right-0 top-[42px] z-40 w-72 space-y-3 rounded-2xl border border-white/10 bg-[#0d1728]/95 p-4 shadow-2xl shadow-cyan-500/10 backdrop-blur-md">
                <div>
                  <p className="text-[13px] font-bold text-slate-100">{t("Ajustes")}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-emerald-300/90">{t("Autoguardado activo: tus ajustes y gustos viven en tu dispositivo.")}</p>
                </div>
                <label className="flex items-center justify-between gap-3">
                  <span className="text-[12.5px] font-medium text-slate-200">{t("Reproducción automática")}</span>
                  <input
                    type="checkbox"
                    checked={ajustes.autoplay}
                    onChange={(e) => cambiarAjuste({ autoplay: e.target.checked })}
                    className="h-4 w-4 accent-cyan-400"
                  />
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span className="text-[12.5px] font-medium text-slate-200">{t("Carga infinita")}</span>
                  <input
                    type="checkbox"
                    checked={ajustes.cargaInfinita}
                    onChange={(e) => cambiarAjuste({ cargaInfinita: e.target.checked })}
                    className="h-4 w-4 accent-cyan-400"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-[12.5px] font-medium text-slate-200">{t("Velocidad por defecto")}</span>
                  <select
                    value={ajustes.velocidadIdx}
                    onChange={(e) => cambiarAjuste({ velocidadIdx: Number.parseInt(e.target.value, 10) })}
                    className="w-full rounded-lg border border-white/15 bg-white/[0.06] px-2 py-1.5 text-[12.5px] text-slate-100 focus:outline-none"
                  >
                    {VELOCIDADES_CINE.map((v, i) => (
                      <option key={v} value={i} className="bg-[#0d1728]">
                        {v}×
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-[12.5px] font-medium text-slate-200">
                    {t("Volumen por defecto")} · {Math.round(ajustes.volumen * 100)} %
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={ajustes.volumen}
                    onChange={(e) => cambiarAjuste({ volumen: Number.parseFloat(e.target.value) })}
                    aria-label={t("Volumen por defecto")}
                    className="h-1 w-full appearance-none rounded-full bg-white/20 accent-cyan-300 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-300"
                  />
                </label>
              </div>
            )}
          </div>
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

      {/* Fusión con el Arena, pacto abierto (v1.35.0) y sostenibilidad (v1.38.0) */}
      <div className="flex flex-wrap items-center gap-2" data-tour="pacto">
        <EnlaceArena idioma={idioma} />
        <AvisoLegal idioma={idioma} />
        <Sostenibilidad idioma={idioma} />
      </div>

      {/* Buscador premium (v1.33.0): barra oscura + botón verde BUSCAR */}
      <form
        role="search"
        data-tour="buscador"
        onSubmit={(e) => {
          e.preventDefault();
          buscarAhora();
        }}
        className="relative flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-1.5 pl-10 shadow-lg transition-colors focus-within:border-emerald-300/50"
      >
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
        <input
          type="search"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder={t("Buscar películas y series…")}
          aria-label={t("Buscar películas y series…")}
          className="min-h-[38px] w-full bg-transparent pr-1 text-[13.5px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          className="sdc-brillo min-h-[38px] shrink-0 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 text-[13px] font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          {t("Buscar")}
        </button>
      </form>

      {/* Vistas (se ocultan mientras se busca) */}
      {!buscando && (
        <nav aria-label="Vistas del catálogo" data-tour="vistas" className="flex flex-wrap gap-2">
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
              <div className="sdc-shimmer h-4 w-40 rounded bg-white/5" />
              <div className="flex gap-3 overflow-hidden">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="sdc-shimmer h-[150px] w-[168px] shrink-0 rounded-xl bg-white/5 sm:w-[188px]" />
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
      ) : vista === "top100" ? (
        /* TOP 100 (v1.37.0): la clasificación con sus 6 filtros */
        <Top100
          t={t}
          idioma={idioma}
          idsEnLista={idsEnLista}
          pctProgresos={pctProgresos}
          onAbrir={setDetalle}
          onMiLista={alternarMiLista}
        />
      ) : vista === "peliculas" && !explorarPeliculas && !buscando ? (
        /* CARTELERA PELÍCULAS (v1.38.0): 4 filtros + crítica constructiva */
        <Top100
          t={t}
          idioma={idioma}
          idsEnLista={idsEnLista}
          pctProgresos={pctProgresos}
          onAbrir={setDetalle}
          onMiLista={alternarMiLista}
          modo="peliculas"
          onExplorarTodo={() => setExplorarPeliculas(true)}
        />
      ) : vista === "explorar" && !buscando ? (
        /* EXPLORAR ∞ (v1.38.0): TODAS las fichas de TODAS las categorías,
         * con scroll infinito (centinela) y botón accesible de respaldo. */
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-[15px] font-semibold tracking-tight text-slate-100">{t("Explorar todo")}</h2>
            <p className="text-[11.5px] text-slate-500">{t("Todas las categorías, todas las fichas: baja y baja, el catálogo no se acaba.")}</p>
          </div>
          <nav aria-label={t("Explorar todo")} className="scrollbar-thin flex items-center gap-2 overflow-x-auto pb-1">
            {CATEGORIAS_EXPLORAR.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setExplorarCat(cat.id)}
                aria-pressed={explorarCat === cat.id}
                className={cn(
                  "min-h-[34px] shrink-0 rounded-xl border px-3 text-[12.5px] font-medium transition-colors",
                  explorarCat === cat.id
                    ? "border-cyan-300/50 bg-cyan-400/10 text-cyan-100"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:bg-white/[0.06]"
                )}
              >
                {t(cat.claveI18n)}
              </button>
            ))}
          </nav>
          {itemsGrilla.length > 0 ? (
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
              {/* Centinela del scroll infinito (IntersectionObserver) */}
              <div ref={centinelaRef} aria-hidden />
              {hayMas && (
                <button
                  type="button"
                  onClick={() => void cargar("mas")}
                  className="mx-auto flex min-h-[42px] items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-5 text-[13px] font-semibold text-slate-100 transition-colors hover:border-white/30"
                >
                  {cargando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <InfinityIcon className="h-4 w-4 text-cyan-300" aria-hidden />}
                  {t("Cargar más")}
                </button>
              )}
            </>
          ) : (
            !cargando && <p className="py-10 text-center text-[13.5px] text-slate-400">{t("Catálogo vacío por ahora")}</p>
          )}
        </div>
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
        /* INICIO: héroe + seguir viendo + chips + filas ♾️ + deportes + muy pronto */
        <div className="space-y-7">
          <HeroeDestacado
            item={heroe}
            idioma={idioma}
            etiquetas={{
              destacado: t("Destacado hoy"),
              infinito: t("Actualizado cada hora"),
              reproducir: t("Reproducir"),
              enMiLista: t("En mi lista"),
              anadir: t("Añadir a mi lista"),
            }}
            enMiLista={heroe ? idsEnLista.has(heroe.id) : false}
            onAbrir={setDetalle}
            onMiLista={alternarMiLista}
          />

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

          {/* «PORQUE TE GUSTA» (v1.38.0): recomendaciones por afinidad real,
           * aprendidas de lo que ves y guardadas en tu dispositivo. */}
          {recomendados.length > 0 && (
            <FilaCarrusel
              titulo={t("Porque te gusta")}
              items={recomendados}
              idioma={idioma}
              miLista={idsEnLista}
              progresos={pctProgresos}
              onAbrir={setDetalle}
              onMiLista={alternarMiLista}
            />
          )}

          {/* Chips de salto rápido (estilo «Chequeo» premium) */}
          {filas.length > 1 && (
            <nav aria-label="Saltar a una fila" className="scrollbar-thin flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="min-h-[36px] shrink-0 rounded-xl border border-emerald-300/40 bg-gradient-to-r from-emerald-400/25 to-teal-400/10 px-4 text-[12.5px] font-bold text-emerald-100 transition-transform hover:scale-[1.03]"
              >
                {t("Inicio")}
              </button>
              {filas.map((fila, i) => (
                <button
                  key={fila.claveI18n}
                  type="button"
                  onClick={() => irAFila(i)}
                  className={cn(
                    "min-h-[36px] shrink-0 rounded-xl border bg-gradient-to-r px-4 text-[12.5px] font-semibold transition-transform hover:scale-[1.03]",
                    GRADIENTES_FILA[i % GRADIENTES_FILA.length]
                  )}
                >
                  {t(fila.claveI18n)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setVista("peliculas")}
                className="min-h-[36px] shrink-0 rounded-xl border border-white/15 bg-white/[0.06] px-4 text-[12.5px] font-bold text-slate-100 transition-transform hover:scale-[1.03]"
              >
                {t("Explorar todo")} →
              </button>
            </nav>
          )}

          {filas.length > 0 ? (
            filas.map((fila, i) => (
              <div
                key={fila.claveI18n}
                id={`fila-cine-${i}`}
                className="sdc-entrada scroll-mt-6"
                style={{ "--sdc-retardo": `${Math.min(i * 70, 560)}ms` } as React.CSSProperties}
              >
                <FilaCarrusel
                  titulo={t(fila.claveI18n)}
                  items={fila.items}
                  idioma={idioma}
                  miLista={idsEnLista}
                  progresos={pctProgresos}
                  onAbrir={setDetalle}
                  onMiLista={alternarMiLista}
                  onExplorar={CATEGORIA_POR_FILA[fila.claveI18n] ? () => irACategoria(CATEGORIA_POR_FILA[fila.claveI18n]) : undefined}
                />
              </div>
            ))
          ) : (
            !cargando && <p className="py-10 text-center text-[13.5px] text-slate-400">{t("Catálogo vacío por ahora")}</p>
          )}

          {/* Hoja de ruta premium: deportes con cuenta atrás + fichas que SE USAN */}
          <FilaDeportes t={t} onAbrir={() => setFicha("deportes")} />
          <div data-tour="hoja-ruta">
            <FilaProximamente
              t={t}
              textos={TEXTOS_FICHA}
              estados={{ viajes: "pronto", juegos: "ya", apps: "ya", webs: "ya" }}
              onAbrir={(s: SeccionPronto) => setFicha(s)}
            />
          </div>
        </div>
      ) : (
        /* Películas y Series: grilla paginada (en películas, con vuelta a la cartelera) */
        itemsGrilla.length > 0 || explorarPeliculas ? (
          <>
            {vista === "peliculas" && explorarPeliculas && (
              <button
                type="button"
                onClick={() => setExplorarPeliculas(false)}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-amber-300/40 bg-gradient-to-r from-amber-400/25 to-orange-400/10 px-3.5 text-[12.5px] font-semibold text-amber-100 transition-transform hover:scale-[1.03]"
              >
                ← {t("Volver a la clasificación")}
              </button>
            )}
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
            {/* Centinela del scroll infinito (IntersectionObserver) */}
            <div ref={centinelaRef} aria-hidden />
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
      <FichaExpandida
        abierto={ficha !== null}
        seccionId={ficha ?? "viajes"}
        seccion={ficha ? (ETIQUETA_SECCION[ficha] ?? ficha) : ""}
        estado={ficha ? FICHAS[ficha].estado : "pronto"}
        descripcion={ficha ? (TEXTOS_FICHA[ficha] ?? "") : ""}
        caracteristicas={ficha ? FICHAS[ficha].caracteristicas : []}
        acciones={ficha ? FICHAS[ficha].acciones : []}
        etiquetas={{
          badgeYa: t("Disponible ya"),
          badgePronto: t("Muy pronto"),
          incluye: t("Qué incluye"),
          acciones: t("Qué puedes hacer ya"),
          cerrar: t("Cerrar"),
        }}
        onCerrar={() => setFicha(null)}
      />
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
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/95" role="dialog" aria-label={`${sesion.item.titulo}: reproductor`}>
              <Loader2 className="h-8 w-8 animate-spin text-cyan-300" aria-hidden />
            </div>
          }
        >
          <Reproductor
            item={sesion.item}
            idioma={idioma}
            videoUrl={sesion.url}
            mime={sesion.mime}
            posicionInicialSeg={sesion.posicion}
            fondoPref={fondo}
            ajustes={ajustes}
            onCerrar={() => setSesion(null)}
            onProgreso={(pos, dur) => guardarProgreso(sesion.item, pos, dur)}
            onFondoPref={activarFondo}
            onAjuste={cambiarAjuste}
          />
        </Suspense>
      )}
    </div>
  );
}
