/**
 * STREAMDOG · cine.ts — el núcleo PURO del cine y series gratis (v1.32.0).
 *
 * StreamDog Cine&Series es el módulo de películas y series REALES de
 * StreamDog. Todo el catálogo procede de fuentes públicas y legales:
 *
 *   · Wikimedia Commons  → películas de dominio público REPRODUCIBLES
 *                          (ficheros .webm/.mp4 directos, sin claves).
 *   · Internet Archive   → largometrajes de dominio público (colección
 *                          feature_films) con MP4 jugable.
 *   · TVMaze             → metadatos de series (fichas, géneros,
 *                          valoraciones, episodios). API pública sin clave.
 *
 * Cero piratería: dominio público y metadatos abiertos, nada más.
 *
 * Este módulo es PURO y sin red: las tres rutas del backend
 * (/api/streamdog/cine, /detalle y /reproducir) lo usan para normalizar
 * las respuestas de las fuentes, y la CI lo testea sin tocar internet.
 * También vive aquí la CAPA DE ALMACENAJE CON AUTOREPARACIÓN REAL:
 * el localStorage del módulo se valida al leer y, si está corrupto,
 * se borra y se reconstruye solo — avisando de la reparación.
 */

/* ══════════════════════════ TIPOS ══════════════════════════ */

/** Origen de un título del catálogo. */
export type FuenteCine = "commons" | "archive" | "tvmaze";

/** Qué es el título: película reproducible o ficha de serie. */
export type TipoCine = "pelicula" | "serie";

/** Elemento normalizado del catálogo: la MISMA forma para las 3 fuentes. */
export interface ItemCine {
  /** Identificador único: «fuente:id-interno» (ej.: «commons:Nosferatu_(1922).webm»). */
  id: string;
  fuente: FuenteCine;
  tipo: TipoCine;
  titulo: string;
  /** Año de estreno/producción (o null si la fuente no lo da). */
  anyo: number | null;
  /** Póster o fotograma (URL absoluta de la fuente). */
  imagen: string | null;
  sinopsis: string;
  /** Valoración 0..10 (TVMaze la da; el dominio público suele no llevarla). */
  valoracion: number | null;
  /** Géneros EN EL IDIOMA DE LA FUENTE (inglés); la UI los traduce. */
  generos: string[];
  duracionMin: number | null;
  /** true = hay vídeo directo que el reproductor puede abrir ya. */
  playable: boolean;
  /** Página oficial del título en su fuente (para «ver en el origen»). */
  enlaceOrigen?: string;
}

/** Episodio de una serie (TVMaze). */
export interface EpisodioCine {
  temporada: number;
  numero: number;
  titulo: string;
  /** Fecha de emisión «YYYY-MM-DD» o null. */
  fecha: string | null;
  sinopsis: string;
  duracionMin: number | null;
}

/** Fila del catálogo de inicio (un carrusel horizontal). */
export interface FilaCine {
  /** Clave de traducción de cine-i18n para el título de la fila. */
  claveI18n: string;
  items: ItemCine[];
}

/* ═══════════════════ COLECCIÓN DE ORO ═══════════════════ */

/**
 * Títulos curados de Wikimedia Commons, comprobados uno a uno. El backend
 * los pide EN UNA SOLA LLAMADA por lotes (titles=A|B|C), así que los que
 * la comunidad renombre o borre simplemente desaparecen de la fila sin
 * romper nada — degradación elegante de la casa.
 */
export interface TituloOro {
  /** Nombre EXACTO del fichero en Commons («File:…»). */
  archivo: string;
  titulo: string;
  anyo: number;
  director: string;
  generos: string[];
}

export const COLECCION_ORO: TituloOro[] = [
  { archivo: "File:Nosferatu (1922).webm", titulo: "Nosferatu", anyo: 1922, director: "F. W. Murnau", generos: ["Horror", "Fantasy"] },
  { archivo: "File:Night of the Living Dead (1968).webm", titulo: "Night of the Living Dead", anyo: 1968, director: "George A. Romero", generos: ["Horror"] },
  { archivo: "File:Charade (1963).webm", titulo: "Charade", anyo: 1963, director: "Stanley Donen", generos: ["Comedy", "Romance", "Mystery"] },
  { archivo: "File:Plan 9 from Outer Space (1959).webm", titulo: "Plan 9 from Outer Space", anyo: 1959, director: "Ed Wood", generos: ["Science-Fiction", "Horror"] },
  { archivo: "File:Big Buck Bunny 4K.webm", titulo: "Big Buck Bunny", anyo: 2008, director: "Sacha Goedegebure", generos: ["Animation", "Comedy"] },
  { archivo: "File:His Girl Friday (1940).webm", titulo: "His Girl Friday", anyo: 1940, director: "Howard Hawks", generos: ["Comedy", "Romance"] },
  { archivo: "File:The General (1926).webm", titulo: "The General", anyo: 1926, director: "Buster Keaton", generos: ["Comedy", "Action"] },
];

/* ═════════ EXITOSOS MUNDIALES (la fila «tipo Netflix», pero legal) ═════════ */

/**
 * Los títulos ETERNOS del dominio público: los que en cualquier país del
 * mundo suenan a cine de siempre. Se consultan a Archive.org por título
 * exacto en UNA consulta (archiveFamososUrl) y se ordenan por descargas
 * reales de la fuente — popularidad honesta, sin números inventados.
 * Si un título ya no está, simplemente no aparece: degradación elegante.
 */
export const EXITOSOS_MUNDIALES: string[] = [
  "Night of the Living Dead",
  "Nosferatu",
  "His Girl Friday",
  "The General",
  "Charade",
  "The Last Man on Earth",
  "Carnival of Souls",
  "House on Haunted Hill",
  "Little Shop of Horrors",
  "D.O.A.",
  "Detour",
  "Suddenly",
  "The Stranger",
  "Scarlet Street",
  "Dementia 13",
  "The Phantom of the Opera",
  "McLintock",
  "Beat the Devil",
  "Plan 9 from Outer Space",
  "The Cabinet of Dr. Caligari",
  "Metropolis",
  "The Kid",
  "Sherlock Jr.",
  "Popeye",
  "Betty Boop",
  "Superman",
  "The Snows of Kilimanjaro",
  "The Outlaw",
  "Royal Wedding",
  "Freaks",
];

/* ═════════ COLECCIONES INFINITAS DE ARCHIVE.ORG (v1.33.0) ═════════ */

/**
 * Los grandes cajones del Internet Archive, curados como filas del catálogo.
 * Cada una es una consulta real con MILES de títulos: contenido infinito ♾️
 * y legal (dominio público). `tipo` marca las de televisión como series;
 * `claveI18n` es la cadena canónica española que traduce cine-i18n.
 */
export interface ColeccionArchivo {
  /** Identificador EXACTO de la colección en Archive.org. */
  id: string;
  claveI18n: string;
  tipo: TipoCine;
  /** Filas por página al calentar. */
  filas: number;
}

export const COLECCIONES_ARCHIVE: ColeccionArchivo[] = [
  { id: "film_noir", claveI18n: "Film noir", tipo: "pelicula", filas: 12 },
  { id: "sci-fi_horror", claveI18n: "Ciencia ficción y terror", tipo: "pelicula", filas: 12 },
  { id: "classic_cartoons", claveI18n: "Dibujos animados clásicos", tipo: "pelicula", filas: 12 },
  { id: "classic_tv", claveI18n: "Televisión clásica", tipo: "serie", filas: 12 },
  { id: "documentaryfilms", claveI18n: "Documentales", tipo: "pelicula", filas: 12 },
];

/* ═════════════════ LIMPIEZA Y UTILIDADES ═════════════════ */

const ENTIDADES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
  "&hellip;": "…",
  "&mdash;": "—",
  "&ndash;": "–",
};

/**
 * Limpia el HTML suelto que traen las sinopsis (TVMaze incluye <p>, <b>…,
 * Commons meten entidades en extmetadata). Una sola pasada de tags +
 * decodificación de entidades seguras + espacios compactados.
 */
export function limpiarHtml(texto: string): string {
  if (!texto) return "";
  let out = texto.replace(/<[^>]*>/g, " ");
  for (const [ent, ch] of Object.entries(ENTIDADES)) {
    out = out.split(ent).join(ch);
  }
  // Numeradas (&#76;) y hex (&#x4C;) — solo dígitos, nunca construye tags.
  out = out.replace(/&#(\d+);/g, (_m, d: string) => {
    const n = Number.parseInt(d, 10);
    return n > 31 && n < 0x10_ffff ? String.fromCodePoint(n) : " ";
  });
  out = out.replace(/&#[xX]([0-9a-fA-F]+);/g, (_m, h: string) => {
    const n = Number.parseInt(h, 16);
    return n > 31 && n < 0x10_ffff ? String.fromCodePoint(n) : " ";
  });
  return out.replace(/\s+/g, " ").trim();
}

/** Normaliza un título para deduplicar: minúsculas, sin acentos ni puntuación. */
export function taparTitulo(titulo: string): string {
  return titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function aTexto(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function aNumero(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number.parseFloat(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function aLista(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim()) : [];
}

/** Apunta los datos curados (año, géneros, título) sobre lo que dice Commons.
 *  Compartida por el backend (route.ts) y el fallback cliente. */
export function reforjarOro(items: ItemCine[]): ItemCine[] {
  const ordenados: ItemCine[] = [];
  for (const oro of COLECCION_ORO) {
    const encontrado = items.find((i) => taparTitulo(i.titulo).startsWith(taparTitulo(oro.titulo)));
    if (!encontrado) continue; // fichero renombrado/borrado: fuera sin ruido
    ordenados.push({ ...encontrado, titulo: oro.titulo, anyo: oro.anyo, generos: [...oro.generos] });
  }
  return ordenados;
}

/* ════════════════════ NORMALIZADORES ════════════════════ */

/** TVMaze: un show crudo → ItemCine (o null si no vale la pena). */
export function normalizarTvmazeShow(show: unknown): ItemCine | null {
  if (typeof show !== "object" || show === null) return null;
  const s = show as Record<string, unknown>;
  const id = aNumero(s.id);
  const titulo = aTexto(s.name);
  if (id === null || !titulo) return null;
  const image = typeof s.image === "object" && s.image !== null ? (s.image as Record<string, unknown>) : null;
  const rating = typeof s.rating === "object" && s.rating !== null ? (s.rating as Record<string, unknown>) : null;
  const valoracion = rating ? aNumero(rating.average) : null;
  const premiered = aTexto(s.premiered);
  const anyo = /^\d{4}/.test(premiered) ? Number.parseInt(premiered.slice(0, 4), 10) : null;
  return {
    id: `tvmaze:${id}`,
    fuente: "tvmaze",
    tipo: "serie",
    titulo,
    anyo,
    imagen: aTexto(image?.medium) || aTexto(image?.original) || null,
    sinopsis: limpiarHtml(aTexto(s.summary)),
    valoracion: valoracion !== null ? Math.min(10, Math.max(0, valoracion)) : null,
    generos: aLista(s.genres),
    duracionMin: aNumero(s.averageRuntime) ?? aNumero(s.runtime),
    playable: false,
    enlaceOrigen: aTexto(s.url) || undefined,
  };
}

/** TVMaze: respuesta de /search/shows → lista de items. */
export function normalizarTvmazeSearch(respuesta: unknown): ItemCine[] {
  if (!Array.isArray(respuesta)) return [];
  const salida: ItemCine[] = [];
  for (const fila of respuesta) {
    if (typeof fila === "object" && fila !== null && "show" in fila) {
      const item = normalizarTvmazeShow((fila as Record<string, unknown>).show);
      if (item) salida.push(item);
    }
  }
  return salida;
}

/** TVMaze: un episodio crudo → EpisodioCine. */
export function normalizarTvmazeEpisodio(ep: unknown): EpisodioCine | null {
  if (typeof ep !== "object" || ep === null) return null;
  const e = ep as Record<string, unknown>;
  const titulo = aTexto(e.name);
  const temporada = aNumero(e.season);
  const numero = aNumero(e.number);
  if (!titulo || temporada === null) return null;
  return {
    temporada: Math.trunc(temporada),
    numero: numero === null ? 0 : Math.trunc(numero),
    titulo,
    fecha: /^\d{4}-\d{2}-\d{2}/.test(aTexto(e.airdate)) ? aTexto(e.airdate).slice(0, 10) : null,
    sinopsis: limpiarHtml(aTexto(e.summary)),
    duracionMin: aNumero(e.runtime),
  };
}

/** Commons: nombre de fichero «File:Nosferatu (1922).webm» → título limpio. */
export function tituloDeArchivoCommons(title: string): string {
  return title
    .replace(/^File:/i, "")
    .replace(/\.(webm|mp4|ogv|mov|avi|mkv)$/i, "")
    .replace(/_/g, " ")
    .trim();
}

const MIMES_VIDEO = new Set(["video/webm", "video/mp4", "video/ogg"]);

/** Commons: una página de la API (con imageinfo) → ItemCine. */
export function normalizarCommonsPage(page: unknown): ItemCine | null {
  if (typeof page !== "object" || page === null) return null;
  const p = page as Record<string, unknown>;
  const title = aTexto(p.title);
  if (!title) return null;
  const infos = Array.isArray(p.imageinfo) ? p.imageinfo : [];
  const info = (infos.find((i) => typeof i === "object" && i !== null) as Record<string, unknown> | undefined) ?? null;
  if (!info) return null; // fichero renombrado o borrado → fuera sin ruido
  const mime = aTexto(info.mime);
  if (!MIMES_VIDEO.has(mime)) return null; // solo vídeo real
  const duracionSeg = aNumero(info.duration);
  const ext = typeof info.extmetadata === "object" && info.extmetadata !== null ? (info.extmetadata as Record<string, unknown>) : null;
  const campo = (clave: string): string => {
    if (!ext) return "";
    const nodo = ext[clave];
    if (typeof nodo !== "object" || nodo === null) return "";
    return limpiarHtml(aTexto((nodo as Record<string, unknown>).value));
  };
  const anyoTexto = campo("DateTimeOriginal") || campo("DateTime");
  const anyoMatch = anyoTexto.match(/(1[5-9]\d{2}|20\d{2})/);
  return {
    id: `commons:${encodeURIComponent(title.replace(/^File:/i, ""))}`,
    fuente: "commons",
    tipo: "pelicula",
    titulo: tituloDeArchivoCommons(title),
    anyo: anyoMatch ? Number.parseInt(anyoMatch[1], 10) : null,
    imagen: aTexto(info.thumburl) || null,
    sinopsis: campo("ImageDescription") || "",
    valoracion: null,
    generos: [],
    duracionMin: duracionSeg !== null ? Math.max(1, Math.round(duracionSeg / 60)) : null,
    playable: true,
    enlaceOrigen: aTexto(info.descriptionurl) || undefined,
  };
}

/**
 * Archive.org: elige el MEJOR vídeo reproducible de la lista de ficheros
 * de /metadata. Preferencia por los derivados h.264 («512kb.mp4», el
 * estándar de Archive para streaming), luego cualquier .mp4/.webm, y
 * descarta vídeos gigantes (> 3 GB) para no colgar el reproductor.
 */
export function elegirVideoArchive(files: unknown): { nombre: string; tamano: number } | null {
  if (!Array.isArray(files)) return null;
  const candidatos: { nombre: string; tamano: number; prioridad: number }[] = [];
  for (const f of files) {
    if (typeof f !== "object" || f === null) continue;
    const file = f as Record<string, unknown>;
    const nombre = aTexto(file.name);
    const formato = aTexto(file.format).toLowerCase();
    const esVideo = /\.(mp4|webm)$/i.test(nombre) || formato.includes("mp4") || formato.includes("webm") || (formato.includes("h.264") && !nombre.endsWith(".pdf"));
    if (!esVideo) continue;
    const tamano = aNumero(file.size) ?? 0;
    if (tamano > 3_000_000_000) continue;
    const prioridad = /512kb\.mp4$/i.test(nombre) ? 0 : /\.mp4$/i.test(nombre) ? 1 : /\.webm$/i.test(nombre) ? 2 : 3;
    candidatos.push({ nombre, tamano, prioridad });
  }
  if (candidatos.length === 0) return null;
  candidatos.sort((a, b) => a.prioridad - b.prioridad || a.tamano - b.tamano);
  const elegido = candidatos[0];
  return { nombre: elegido.nombre, tamano: elegido.tamano };
}

/** Archive.org: un doc de advancedsearch → ItemCine. */
export function normalizarArchiveDoc(doc: unknown, opciones?: { tipo?: TipoCine }): ItemCine | null {
  if (typeof doc !== "object" || doc === null) return null;
  const d = doc as Record<string, unknown>;
  const identifier = aTexto(d.identifier);
  const titulo = Array.isArray(d.title) ? aTexto(d.title[0]) : aTexto(d.title);
  if (!identifier || !titulo) return null;
  const anyo = aNumero(d.year);
  const desc = Array.isArray(d.description) ? aTexto(d.description[0]) : aTexto(d.description);
  return {
    id: `archive:${encodeURIComponent(identifier)}`,
    fuente: "archive",
    tipo: opciones?.tipo ?? "pelicula",
    titulo,
    anyo: anyo !== null ? Math.trunc(anyo) : null,
    imagen: `https://archive.org/services/img/${encodeURIComponent(identifier)}`,
    sinopsis: limpiarHtml(desc),
    valoracion: null,
    generos: [],
    duracionMin: null,
    playable: true, // Archive casi siempre tiene un MP4 derivado; /reproducir lo confirma
    enlaceOrigen: `https://archive.org/details/${encodeURIComponent(identifier)}`,
  };
}

/* ═══════════ DEDUPE, ORDEN Y PAGINACIÓN (puro) ═══════════ */

const PESO_FUENTE: Record<FuenteCine, number> = { commons: 0, archive: 1, tvmaze: 2 };

/**
 * Deduplica por título normalizado + año: si la misma película vive en
 * Commons y en Archive, gana la reproducible y, a igualdad, la fuente
 * de mejor peso (Commons → video directo estable).
 */
export function dedupeItems(items: ItemCine[]): ItemCine[] {
  const porClave = new Map<string, ItemCine>();
  for (const item of items) {
    const clave = `${taparTitulo(item.titulo)}|${item.anyo ?? "?"}`;
    const actual = porClave.get(clave);
    if (!actual) {
      porClave.set(clave, item);
      continue;
    }
    const mejor =
      (Number(item.playable) - Number(actual.playable)) ||
      (PESO_FUENTE[item.fuente] - PESO_FUENTE[actual.fuente]) ||
      ((item.valoracion ?? -1) - (actual.valoracion ?? -1));
    if (mejor < 0) porClave.set(clave, item);
  }
  return [...porClave.values()];
}

/** Orden de exhibición: reproducibles primero, valorados después, alfabético al final. */
export function ordenarItems(items: ItemCine[]): ItemCine[] {
  return [...items].sort(
    (a, b) =>
      Number(b.playable) - Number(a.playable) ||
      (b.valoracion ?? -1) - (a.valoracion ?? -1) ||
      a.titulo.localeCompare(b.titulo, "es")
  );
}

/** Página 1-based; una página 0 o negativa cae a la 1. */
export function paginar<T>(items: T[], pagina: number, porPagina: number): T[] {
  const p = Math.max(1, Math.trunc(pagina));
  const desde = (p - 1) * porPagina;
  return items.slice(desde, desde + porPagina);
}

/** ¿Hay más páginas después de esta? (para el «Cargar más») */
export function hayMasPaginas<T>(items: T[], pagina: number, porPagina: number): boolean {
  return paginar(items, pagina + 1, porPagina).length > 0;
}

/* ═══════════ ALMACENAJE CON AUTOREPARACIÓN REAL ═══════════ */

/**
 * La promesa «borra la caché corrupta autónomamente», hecha REAL:
 * todo lo que el módulo guarda en localStorage (mi lista, progreso,
 * idioma) pasa por aquí. Al leer, el JSON se valida con su predicado;
 * si está roto, corrupto o con otra forma → se BORRA la clave, se
 * devuelve el valor por defecto y se AVISA (BannerReparacion) con el
 * motivo exacto. Nada de datos zombis ni toasts feos.
 */

export const ESQUEMA_CINE = 1;

/** Claves del módulo, versionadas por si algún día cambia la forma. */
export const CLAVES_CINE = {
  miLista: "streamdog.cine.v1.miLista",
  progreso: "streamdog.cine.v1.progreso",
  idioma: "streamdog.cine.v1.idioma",
  /** Preferencia de reproducción en segundo plano (MediaSession + PiP automático). */
  fondo: "streamdog.cine.v1.fondo",
} as const;

/** Registro de «seguir viendo»: dónde se quedó cada título. */
export interface ProgresoVer {
  id: string;
  titulo: string;
  imagen: string | null;
  /** Segundos reproducidos. */
  posicionSeg: number;
  /** Duración total en segundos (0 si aún no se sabe). */
  duracionSeg: number;
  /** Fecha de la última reproducción (epoch ms) — para purgar los viejos. */
  actualizado: number;
}

export type StorageMinimo = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type Validador<T> = (v: unknown) => v is T;

export interface LecturaColeccion<T> {
  valor: T;
  /** null si no hubo que reparar nada; el motivo si se reparó. */
  reparacion: string | null;
}

/** Avisa a la UI (BannerReparacion) de una reparación real. Solo en navegador. */
export function avisarReparacion(motivo: string, detalle?: string): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent("streamdog-cine-reparacion", { detail: { motivo, detalle } }));
  } catch {
    /* un CustomEvent roto no puede tumbar la app */
  }
}

/**
 * Lee `clave` y la valida con `valida`. Cualquier problema (JSON roto,
 * forma inesperada, valor no válido) → borra la clave, devuelve el
 * defecto e informa del motivo. `storage` inyectable para la CI.
 */
export function leerColeccion<T>(
  clave: string,
  defecto: T,
  valida: Validador<T>,
  storage: StorageMinimo | null
): LecturaColeccion<T> {
  if (!storage) return { valor: defecto, reparacion: null };
  let crudo: string | null = null;
  try {
    crudo = storage.getItem(clave);
  } catch {
    return { valor: defecto, reparacion: null }; // storage bloqueado (modo privado): sin drama
  }
  if (crudo === null) return { valor: defecto, reparacion: null };
  let parseado: unknown;
  try {
    parseado = JSON.parse(crudo);
  } catch {
    try {
      storage.removeItem(clave);
    } catch {
      /* nada que hacer */
    }
    return { valor: defecto, reparacion: `«${clave}» no era JSON válido y se ha borrado para reconstruirlo` };
  }
  if (!valida(parseado)) {
    try {
      storage.removeItem(clave);
    } catch {
      /* nada que hacer */
    }
    return { valor: defecto, reparacion: `«${clave}» tenía una forma inesperada y se ha reconstruido` };
  }
  return { valor: parseado, reparacion: null };
}

/**
 * Guarda con red de seguridad: si el storage explota (cuota llena,
 * modo privado), `alFallo` decide el plan B (recortar y reintentar,
 * avisar, rendir en silencio…). Devuelve true si quedó guardado.
 */
export function guardarColeccion<T>(
  clave: string,
  valor: T,
  storage: StorageMinimo | null,
  alFallo?: (clave: string, error: unknown) => boolean
): boolean {
  if (!storage) return false;
  const crudo = JSON.stringify(valor);
  try {
    storage.setItem(clave, crudo);
    return true;
  } catch (error) {
    if (alFallo && alFallo(clave, error)) {
      try {
        storage.setItem(clave, JSON.stringify(valor));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

/* ── Validadores de las tres colecciones ── */

export const esListaIds = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string" && x.length > 0 && x.length <= 200);

/** «Mi lista» guarda instantáneas ligeras del item (id + título obligatorios). */
export function esListaCine(v: unknown): v is ItemCine[] {
  return (
    Array.isArray(v) &&
    v.length <= 500 &&
    v.every((p) => {
      if (typeof p !== "object" || p === null) return false;
      const r = p as Record<string, unknown>;
      return typeof r.id === "string" && r.id.length > 0 && r.id.length <= 320 && typeof r.titulo === "string" && r.titulo.length > 0;
    })
  );
}

export function esProgresos(v: unknown): v is ProgresoVer[] {
  return (
    Array.isArray(v) &&
    v.every((p) => {
      if (typeof p !== "object" || p === null) return false;
      const r = p as Record<string, unknown>;
      return (
        typeof r.id === "string" &&
        r.id.length > 0 &&
        typeof r.titulo === "string" &&
        typeof r.posicionSeg === "number" &&
        Number.isFinite(r.posicionSeg) &&
        r.posicionSeg >= 0 &&
        typeof r.duracionSeg === "number" &&
        Number.isFinite(r.duracionSeg) &&
        typeof r.actualizado === "number" &&
        Number.isFinite(r.actualizado)
      );
    })
  );
}

export const esIdiomaCine = (v: unknown): v is import("./cine-i18n").IdiomaCine =>
  v === "es" || v === "en" || v === "de" || v === "fr";

/** Para la preferencia de segundo plano: solo true/false vale. */
export const esBooleano = (v: unknown): v is boolean => typeof v === "boolean";

/** Purga el historial: los más recientes primero, tope `max` (50 por defecto). */
export function purgarProgreso(lista: ProgresoVer[], max = 50): ProgresoVer[] {
  return [...lista].sort((a, b) => b.actualizado - a.actualizado).slice(0, Math.max(1, max));
}

/** Añade/actualiza el progreso de un título y devuelve la lista purgada. */
export function apuntarProgreso(
  lista: ProgresoVer[],
  entrada: { id: string; titulo: string; imagen: string | null; posicionSeg: number; duracionSeg: number },
  ahora: number
): ProgresoVer[] {
  const resto = lista.filter((p) => p.id !== entrada.id);
  const previo = lista.find((p) => p.id === entrada.id);
  const duracion = entrada.duracionSeg > 0 ? entrada.duracionSeg : (previo?.duracionSeg ?? 0);
  return purgarProgreso(
    [{ ...entrada, duracionSeg: duracion, actualizado: ahora }, ...resto],
    50
  );
}

/** ¿El título se terminó? (> 95 % de la duración conocida) */
export function progresoTerminado(p: ProgresoVer): boolean {
  return p.duracionSeg > 0 && p.posicionSeg / p.duracionSeg > 0.95;
}
