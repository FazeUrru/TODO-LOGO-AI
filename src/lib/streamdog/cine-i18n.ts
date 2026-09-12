/**
 * STREAMDOG · cine-i18n.ts (v1.32.0) — el cine habla 4 idiomas.
 *
 * El módulo de cine y series tiene su propio diccionario con los
 * CUATRO idiomas del pie de página clásico de StreamDog: Español,
 * English, Deutsch y Français. Mismo enfoque que la i18n de la casa
 * («el español es la clave»): las claves son las cadenas canónicas
 * españolas y `traducirCine` nunca deja una clave fea en pantalla —
 * si falta una traducción, cae al español.
 *
 * v1.38.0 — además de los cuatro idiomas fijos, el selector incorpora
 * «Sistema»: sigue el idioma del dispositivo y la ficha se adapta sola
 * (resolutores puros + seguridad en `traducirCine`).
 */

/** Idiomas concretos del módulo (español = la clave fuente). */
export type IdiomaCineFijo = "es" | "en" | "de" | "fr";

/** Valor del selector: «sistema» (se adapta al dispositivo) o idioma fijo. */
export type IdiomaCine = "sistema" | IdiomaCineFijo;

/** Selector de idioma: metadatos para la UI. */
export const IDIOMAS_CINE: { id: IdiomaCine; etiqueta: string }[] = [
  { id: "sistema", etiqueta: "Sistema" },
  { id: "es", etiqueta: "Español" },
  { id: "en", etiqueta: "English" },
  { id: "de", etiqueta: "Deutsch" },
  { id: "fr", etiqueta: "Français" },
];

/** Valida cualquier entrada y cae a «sistema» (la UI se adapta sola). */
export function idiomaCineValido(v: unknown): IdiomaCine {
  return v === "es" || v === "en" || v === "de" || v === "fr" ? v : "sistema";
}

/**
 * Lee el idioma del navegador/dispositivo y devuelve el soportado más
 * cercano: recorre `navigator.languages` en orden de preferencia y cae
 * al español (la casa) si no hay coincidencia. Seguro en SSR.
 */
export function idiomaCineDelNavegador(): IdiomaCineFijo {
  if (typeof navigator === "undefined") return "es";
  const candidatas = Array.isArray(navigator.languages) && navigator.languages.length > 0
    ? navigator.languages
    : navigator.language
      ? [navigator.language]
      : [];
  for (const candidata of candidatas) {
    const prefijo = candidata.slice(0, 2).toLowerCase();
    if (prefijo === "en") return "en";
    if (prefijo === "de") return "de";
    if (prefijo === "fr") return "fr";
    if (prefijo === "es") return "es";
  }
  return "es";
}

/** Resuelve el ajuste a un idioma concreto: «sistema» pregunta al dispositivo. */
export function resolverIdiomaCine(idioma: IdiomaCine): IdiomaCineFijo {
  return idioma === "sistema" ? idiomaCineDelNavegador() : idioma;
}

/* ────────────────────────── claves canónicas ────────────────────────── */

/** Lista cerrada de claves del módulo (para tests de completitud). */
export const CLAVES_CINE_UI = [
  "Cine y series gratis",
  "Inicio",
  "Películas",
  "Series",
  "Explorar",
  "Mi lista",
  "Seguir viendo",
  "Colección de oro",
  "Series del momento",
  "Cine clásico libre",
  "Buscar películas y series…",
  "Reproducir",
  "Reanudar",
  "Añadir a mi lista",
  "En mi lista",
  "Añadido a tu lista",
  "Quitado de tu lista",
  "Ver en el origen",
  "Episodios",
  "Temporada",
  "min",
  "Año",
  "Duración",
  "Géneros",
  "Director",
  "Dominio público",
  "Fuentes en vivo",
  "Comprobar salud",
  "Caché reparada automáticamente",
  "Se detectaron datos corruptos y StreamDog los reconstruyó solo:",
  "Sin conexión: el catálogo vuelve con la red",
  "Reintentar",
  "Cargando catálogo…",
  "Cargando el vídeo…",
  "Sin resultados para «{q}»",
  "Una fuente no respondió a tiempo: se muestra el resto.",
  "Instalar la app",
  "Instalada",
  "Idioma",
  "Los títulos y sinopsis llegan en el idioma de su fuente (normalmente inglés); la interfaz sí está traducida.",
  "Continuar desde {m} min",
  "Empezar por el principio",
  "Segundo plano",
  "Sonará en segundo plano aunque cambies de pestaña o bloques el móvil.",
  "Ventana flotante",
  "No hay vídeo disponible para esta ficha",
  "No se pudo cargar el vídeo",
  "Reintentando el vídeo…",
  "Cargar más",
  "Catálogo vacío por ahora",
  "Reproducir de nuevo",
  "Los títulos más famosos",
  "Film noir",
  "Ciencia ficción y terror",
  "Dibujos animados clásicos",
  "Televisión clásica",
  "Documentales",
  "Lo mejor de Disney+",
  "Catálogo infinito",
  "Actualizado cada hora",
  "Destacado hoy",
  "Explorar todo",
  "Muy pronto",
  "En desarrollo",
  "Próximamente",
  "Deportes en vivo",
  "Viajes",
  "Juegos",
  "Apps",
  "Webs",
  "VS",
  "Esto se está cocinando",
  "Cerrar",
  "Ver el catálogo",
  "Buscar",
  "Los deportes llegan a StreamDog: partidos, marcadores y emoción en directo, con la misma calidad que ya tienes en cine y series. Cada hora que pasa estamos más cerca del saque inicial. ⚽",
  "Rutas, destinos y rincones del mundo libre: la brújula de StreamDog está sobre la mesa. Pronto viajar será tan fácil como dar al play. ✈️",
  "El arcade en tiempo real de StreamDog está en desarrollo: partidas rápidas, récords y diversión sin esperas. El mando se está calibrando. 🎮",
  "Una caja de apps libres y herramientas de la casa, al estilo StreamDog: útiles, rápidas y sin letra pequeña. Se está compilando. 📱",
  "Un radar de webs útiles, seguras y gratuitas para acompañar al catálogo infinito. Estamos afinando la antena. 🌐",
  "Lo mejor de Netflix",
  "Lo mejor de HBO Max",
  "Lo mejor de Prime Video",
  "Lo mejor de Apple TV+",
  "Lo mejor de Filmin",
  "Animación para maratón",
  "Basadas en hechos reales",
  "Lo más reciente",
  "Conexión con el Arena",
  "Fusionado con el Arena",
  "Independiente",
  "Ir al Arena",
  "StreamDog nació dentro del Arena todólogo.ai: en modo fusionado comparten identidad, estilo y enlaces cruzados.",
  "Modo independiente: StreamDog se basta solo — los enlaces al Arena se ocultan, perfecto para su dominio propio.",
  "Pacto abierto",
  "Aviso de seguridad, privacidad y colaboración con las plataformas",
  "Para Netflix, Prime Video, Disney+, HBO Max, Apple TV, Filmin y todas las plataformas del mundo",
  "Qué servimos y qué no",
  "StreamDog emite cine y series de dominio público y metadatos abiertos de Internet Archive, Wikimedia Commons y TVMaze. No alojamos, desciframos ni repartimos archivos protegidos: nada de torrents, nada de cracks, nada de enlaces piratas. Cada ficha muestra su fuente y su licencia; lo que una fuente retira, desaparece del catálogo sin ruido.",
  "Nada personal: el problema son los precios",
  "No tenemos nada en contra de Netflix, Prime Video, Disney+, HBO Max, Apple TV ni Filmin: admiramos lo que construyen. Lo que se atraganta son las suscripciones desorbitadas — media docena de cuotas al mes que ya suman más que la factura de la luz. StreamDog nace para cubrir ese hueco con contenido libre y legal, no para sustituir a nadie: mucha de esta casa sigue pagando sus plataformas favoritas.",
  "Colaboración, no enemistad",
  "Este proyecto busca un acuerdo mayor, no una enemistad permanente: catálogos más asequibles, ventanas de prueba, bundles con dominio público, licencias honestas para apps independientes. Si las plataformas quieren hablar, aquí tienen la puerta abierta y un interlocutor serio. El dominio público ya demuestra la demanda; el contenido premium de las plataformas pondría el resto. Entre todos, todos ganamos.",
  "Marcas y afiliación",
  "Netflix, Prime Video, Disney+, HBO Max, Apple TV y Filmin son marcas registradas de sus respectivos propietarios. StreamDog no está afiliado, patrocinado ni avalado por ninguna; sus referencias son informativas y de uso nominativo — metadatos públicos con enlace siempre al origen oficial, jamás a copias.",
  "Privacidad de verdad",
  "Sin cuentas obligatorias, sin venta de datos, sin rastreadores publicitarios. Tu lista, tu progreso y tus preferencias viven en tu dispositivo (localStorage) y no salen de él. El chat 1-a-1 viaja cifrado de extremo a extremo: este servidor solo transporta cifrado y no guarda conversaciones.",
  "Seguridad auditable",
  "Código abierto y auditable: sin malware, sin mineros criptográficos, sin permisos raros. La PWA se instala desde tu navegador con el sandbox estándar, el reproductor solo abre fuentes verificadas y el servidor publica sus fuentes y su salud en tiempo real (el chip ♾️ de la cabecera).",
  "Legibilidad y retirada",
  "Todo es legible a la primera: cada ficha nombra su fuente, cada error se dice a la cara y el estado del catálogo se publica, no se esconde. Si eres titular de derechos y crees que algo no debería estar aquí, escríbenos: lo retiramos de inmediato. Verificado y limpio es como queremos seguir siendo la casa del contenido libre.",
  "Un pacto duradero: este texto vive en cada versión de StreamDog y evoluciona con ella.",
  /* Top 100 (v1.37.0): la clasificación con 6 filtros */
  "Top 100",
  "La clasificación definitiva: series, películas y documentales del 1 al 100, con ranking real de las fuentes.",
  "Filtros del Top 100",
  "General",
  "Famosos",
  "Animación (Disney)",
  "Recientes",
  "Populares",
  "Ambigüedad",
  "El ranking global: lo mejor de cada plataforma y del archivo público, del 1 al 100.",
  "Los que todo el mundo conoce: éxitos eternos del dominio público y las series que marcaron época en Netflix.",
  "Dibujos y anime para maratón: de los clásicos de Disney a Attack on Titan, sin parar.",
  "Los estrenos de los que habla todo el mundo ahora mismo, del más nuevo al imprescindible.",
  "El consenso de las listas: los títulos que suman más puestos altos en todas las plataformas.",
  "Mezcla sorpresa sin reglas: series, películas y documentales barajados — siempre igual en tu dispositivo, distinto en cada versión.",
  "Puesto",
  "La clasificación está vacía: las fuentes no respondieron. Prueba otro filtro o reintenta.",
  "Español",
  "English",
  "Deutsch",
  "Français",
  "Sistema",
  /* Fichas expandidas (v1.38.0): estado, características y acciones reales */
  "Disponible ya",
  "Qué incluye",
  "Qué puedes hacer ya",
  "Abrir la parrilla",
  "Abrir SportIA",
  "Jugar ahora",
  "Buscar documentales de viajes",
  "Marcadores en directo",
  "Parrilla deportiva con IA",
  "Cuenta atrás de cada partido",
  "Documentales de viajes del archivo libre",
  "Destinos de dominio público",
  "Búsqueda real en el catálogo",
  "Arcade en tiempo real",
  "Récords guardados en tu dispositivo",
  "Sin esperas ni instalaciones",
  "Instalación como app nativa (PWA)",
  "No aparece el botón: usa el menú de tu navegador → «Instalar app»",
  "Todo StreamDog en tu bolsillo",
  "Segundo plano y pantalla completa",
  "Herramientas propias y libres",
  "Salta a cada web en un clic",
  "Todo gratis, como siempre",
  "Webs de la casa",
  "Calculadora",
  "Cuánticas",
  "Pruebas",
  "Labs",
  "Conectores",
  "Leaderboard",
  "Novedades",
  "API pública",
] as const;

/** Diccionario destino: clave española → cadena en el idioma destino. */
export const DICCIONARIOS_CINE: Record<IdiomaCineFijo, Record<string, string>> = {
  /* El español ES la clave: diccionario identidad (nunca se consulta). */
  es: {},

  en: {
    "Cine y series gratis": "Free movies & series",
    Inicio: "Home",
    Películas: "Movies",
    Series: "Series",
    Explorar: "Browse",
    "Mi lista": "My list",
    "Seguir viendo": "Keep watching",
    "Colección de oro": "Golden collection",
    "Series del momento": "Trending series",
    "Cine clásico libre": "Free classic cinema",
    "Buscar películas y series…": "Search movies & series…",
    Reproducir: "Play",
    Reanudar: "Resume",
    "Añadir a mi lista": "Add to my list",
    "En mi lista": "In my list",
    "Añadido a tu lista": "Added to your list",
    "Quitado de tu lista": "Removed from your list",
    "Ver en el origen": "View at source",
    Episodios: "Episodes",
    Temporada: "Season",
    min: "min",
    Año: "Year",
    Duración: "Runtime",
    Géneros: "Genres",
    Director: "Director",
    "Dominio público": "Public domain",
    "Fuentes en vivo": "Live sources",
    "Comprobar salud": "Check health",
    "Caché reparada automáticamente": "Cache repaired automatically",
    "Se detectaron datos corruptos y StreamDog los reconstruyó solo:":
      "Corrupted data was detected and StreamDog rebuilt it on its own:",
    "Sin conexión: el catálogo vuelve con la red": "Offline: the catalog returns with the network",
    Reintentar: "Retry",
    "Cargando catálogo…": "Loading catalog…",
    "Cargando el vídeo…": "Loading the video…",
    "Sin resultados para «{q}»": "No results for “{q}”",
    "Una fuente no respondió a tiempo: se muestra el resto.":
      "One source timed out: showing the rest.",
    "Instalar la app": "Install the app",
    Instalada: "Installed",
    Idioma: "Language",
    "Los títulos y sinopsis llegan en el idioma de su fuente (normalmente inglés); la interfaz sí está traducida.":
      "Titles and synopses arrive in their source language (usually English); the interface itself is translated.",
    "Continuar desde {m} min": "Continue from {m} min",
    "Empezar por el principio": "Start from the beginning",
    "Segundo plano": "Background play",
    "Sonará en segundo plano aunque cambies de pestaña o bloques el móvil.":
      "It keeps playing when you switch tabs or lock your phone.",
    "Ventana flotante": "Floating window",
    "No hay vídeo disponible para esta ficha": "No video available for this title",
    "No se pudo cargar el vídeo": "The video could not load",
    "Reintentando el vídeo…": "Retrying the video…",
    "Cargar más": "Load more",
    "Catálogo vacío por ahora": "Empty catalog for now",
    "Reproducir de nuevo": "Play again",
    "Los títulos más famosos": "The most famous titles",
    "Film noir": "Film noir",
    "Ciencia ficción y terror": "Sci-fi & horror",
    "Dibujos animados clásicos": "Classic cartoons",
    "Televisión clásica": "Classic television",
    Documentales: "Documentaries",
    "Lo mejor de Disney+": "The best of Disney+",
    "Catálogo infinito": "Infinite catalog",
    "Actualizado cada hora": "Refreshed every hour",
    "Destacado hoy": "Featured today",
    "Explorar todo": "Browse everything",
    "Muy pronto": "Coming soon",
    "En desarrollo": "In development",
    Próximamente: "Upcoming",
    "Deportes en vivo": "Live sports",
    Viajes: "Travel",
    Juegos: "Games",
    Apps: "Apps",
    Webs: "Websites",
    VS: "VS",
    "Esto se está cocinando": "This is being cooked up",
    Cerrar: "Close",
    "Ver el catálogo": "Browse the catalog",
    Buscar: "Search",
    "Los deportes llegan a StreamDog: partidos, marcadores y emoción en directo, con la misma calidad que ya tienes en cine y series. Cada hora que pasa estamos más cerca del saque inicial. ⚽":
      "Sports are coming to StreamDog: live matches, scores and excitement, with the same quality you already get in movies & series. Every hour brings us closer to kickoff. ⚽",
    "Rutas, destinos y rincones del mundo libre: la brújula de StreamDog está sobre la mesa. Pronto viajar será tan fácil como dar al play. ✈️":
      "Routes, destinations and corners of the free world: StreamDog's compass is on the drawing board. Soon travelling will be as easy as pressing play. ✈️",
    "El arcade en tiempo real de StreamDog está en desarrollo: partidas rápidas, récords y diversión sin esperas. El mando se está calibrando. 🎮":
      "StreamDog's real-time arcade is in development: quick matches, high scores and fun without waiting. The controller is being calibrated. 🎮",
    "Una caja de apps libres y herramientas de la casa, al estilo StreamDog: útiles, rápidas y sin letra pequeña. Se está compilando. 📱":
      "A box of free apps and in-house tools, StreamDog style: useful, fast and with no fine print. It's compiling right now. 📱",
    "Un radar de webs útiles, seguras y gratuitas para acompañar al catálogo infinito. Estamos afinando la antena. 🌐":
      "A radar of useful, safe and free websites to accompany the infinite catalog. We're fine-tuning the antenna. 🌐",
    "Conexión con el Arena": "Arena connection",
    "Lo mejor de Netflix": "The best of Netflix",
    "Lo mejor de HBO Max": "The best of HBO Max",
    "Lo mejor de Prime Video": "The best of Prime Video",
    "Lo mejor de Apple TV+": "The best of Apple TV+",
    "Lo mejor de Filmin": "The best of Filmin",
    "Animación para maratón": "Animation for a binge",
    "Basadas en hechos reales": "Based on true events",
    "Lo más reciente": "The latest hits",
    /* Top 100 (v1.37.0) */
    "Top 100": "Top 100",
    "La clasificación definitiva: series, películas y documentales del 1 al 100, con ranking real de las fuentes.":
      "The definitive ranking: series, movies and documentaries from 1 to 100, with real rankings from the sources.",
    "Filtros del Top 100": "Top 100 filters",
    General: "General",
    Famosos: "Famous",
    "Animación (Disney)": "Animation (Disney)",
    Recientes: "Recent",
    Populares: "Popular",
    "Ambigüedad": "Ambiguity",
    "El ranking global: lo mejor de cada plataforma y del archivo público, del 1 al 100.":
      "The global ranking: the best of every platform and the public archive, from 1 to 100.",
    "Los que todo el mundo conoce: éxitos eternos del dominio público y las series que marcaron época en Netflix.":
      "The ones everyone knows: eternal public-domain hits and the series that defined an era on Netflix.",
    "Dibujos y anime para maratón: de los clásicos de Disney a Attack on Titan, sin parar.":
      "Cartoons and anime for a marathon: from the Disney classics to Attack on Titan, non-stop.",
    "Los estrenos de los que habla todo el mundo ahora mismo, del más nuevo al imprescindible.":
      "The releases everyone is talking about right now, from the newest to the essential.",
    "El consenso de las listas: los títulos que suman más puestos altos en todas las plataformas.":
      "The consensus of the lists: the titles that add up the most top spots across every platform.",
    "Mezcla sorpresa sin reglas: series, películas y documentales barajados — siempre igual en tu dispositivo, distinto en cada versión.":
      "Surprise mix with no rules: series, movies and documentaries shuffled — always the same on your device, different with every version.",
    Puesto: "Rank",
    "La clasificación está vacía: las fuentes no respondieron. Prueba otro filtro o reintenta.":
      "The ranking is empty: the sources didn't respond. Try another filter or retry.",
    "Fusionado con el Arena": "Fused with the Arena",
    Independiente: "Independent",
    "Ir al Arena": "Go to the Arena",
    "StreamDog nació dentro del Arena todólogo.ai: en modo fusionado comparten identidad, estilo y enlaces cruzados.":
      "StreamDog was born inside the todólogo.ai Arena: in fused mode they share identity, style and cross links.",
    "Modo independiente: StreamDog se basta solo — los enlaces al Arena se ocultan, perfecto para su dominio propio.":
      "Independent mode: StreamDog stands on its own — Arena links hide away, perfect for its own domain.",
    "Pacto abierto": "Open pact",
    "Aviso de seguridad, privacidad y colaboración con las plataformas":
      "Security, privacy and collaboration notice for the platforms",
    "Para Netflix, Prime Video, Disney+, HBO Max, Apple TV, Filmin y todas las plataformas del mundo":
      "For Netflix, Prime Video, Disney+, HBO Max, Apple TV, Filmin and every platform in the world",
    "Qué servimos y qué no": "What we serve — and what we don't",
    "StreamDog emite cine y series de dominio público y metadatos abiertos de Internet Archive, Wikimedia Commons y TVMaze. No alojamos, desciframos ni repartimos archivos protegidos: nada de torrents, nada de cracks, nada de enlaces piratas. Cada ficha muestra su fuente y su licencia; lo que una fuente retira, desaparece del catálogo sin ruido.":
      "StreamDog streams public-domain movies & series and open metadata from Internet Archive, Wikimedia Commons and TVMaze. We do not host, crack or distribute protected files: no torrents, no cracks, no pirate links. Every card shows its source and licence; whatever a source removes leaves the catalog without a fuss.",
    "Nada personal: el problema son los precios": "Nothing personal: the problem is the prices",
    "No tenemos nada en contra de Netflix, Prime Video, Disney+, HBO Max, Apple TV ni Filmin: admiramos lo que construyen. Lo que se atraganta son las suscripciones desorbitadas — media docena de cuotas al mes que ya suman más que la factura de la luz. StreamDog nace para cubrir ese hueco con contenido libre y legal, no para sustituir a nadie: mucha de esta casa sigue pagando sus plataformas favoritas.":
      "We have nothing against Netflix, Prime Video, Disney+, HBO Max, Apple TV or Filmin: we admire what they build. What sticks in the throat are the exorbitant subscriptions — half a dozen monthly fees that already add up to more than the power bill. StreamDog exists to fill that gap with free, legal content, not to replace anyone: many in this house still pay for their favourite platforms.",
    "Colaboración, no enemistad": "Collaboration, not enmity",
    "Este proyecto busca un acuerdo mayor, no una enemistad permanente: catálogos más asequibles, ventanas de prueba, bundles con dominio público, licencias honestas para apps independientes. Si las plataformas quieren hablar, aquí tienen la puerta abierta y un interlocutor serio. El dominio público ya demuestra la demanda; el contenido premium de las plataformas pondría el resto. Entre todos, todos ganamos.":
      "This project wants a bigger agreement, not a permanent feud: more affordable catalogs, trial windows, bundles with public domain, honest licensing for independent apps. If the platforms want to talk, the door is open and the interlocutor is serious. Public domain already proves the demand; the platforms' premium content would complete it. Together, everyone wins.",
    "Marcas y afiliación": "Trademarks and affiliation",
    "Netflix, Prime Video, Disney+, HBO Max, Apple TV y Filmin son marcas registradas de sus respectivos propietarios. StreamDog no está afiliado, patrocinado ni avalado por ninguna; sus referencias son informativas y de uso nominativo — metadatos públicos con enlace siempre al origen oficial, jamás a copias.":
      "Netflix, Prime Video, Disney+, HBO Max, Apple TV and Filmin are registered trademarks of their respective owners. StreamDog is not affiliated with, sponsored or endorsed by any of them; references are informative and nominative — public metadata with links always to the official source, never to copies.",
    "Privacidad de verdad": "Real privacy",
    "Sin cuentas obligatorias, sin venta de datos, sin rastreadores publicitarios. Tu lista, tu progreso y tus preferencias viven en tu dispositivo (localStorage) y no salen de él. El chat 1-a-1 viaja cifrado de extremo a extremo: este servidor solo transporta cifrado y no guarda conversaciones.":
      "No forced accounts, no data selling, no ad trackers. Your list, your progress and your preferences live on your device (localStorage) and never leave it. The 1-to-1 chat travels end-to-end encrypted: this server only transports ciphertext and stores no conversations.",
    "Seguridad auditable": "Auditable security",
    "Código abierto y auditable: sin malware, sin mineros criptográficos, sin permisos raros. La PWA se instala desde tu navegador con el sandbox estándar, el reproductor solo abre fuentes verificadas y el servidor publica sus fuentes y su salud en tiempo real (el chip ♾️ de la cabecera).":
      "Open, auditable code: no malware, no crypto miners, no odd permissions. The PWA installs from your browser with the standard sandbox, the player only opens verified sources, and the server publishes its sources and health in real time (the ♾️ chip in the header).",
    "Legibilidad y retirada": "Legibility and takedown",
    "Todo es legible a la primera: cada ficha nombra su fuente, cada error se dice a la cara y el estado del catálogo se publica, no se esconde. Si eres titular de derechos y crees que algo no debería estar aquí, escríbenos: lo retiramos de inmediato. Verificado y limpio es como queremos seguir siendo la casa del contenido libre.":
      "Everything is legible at first glance: every card names its source, every error is told to your face and the catalog state is published, not hidden. If you are a rights holder and believe something should not be here, write to us: we take it down immediately. Verified and clean is how we intend to keep being the house of free content.",
    "Un pacto duradero: este texto vive en cada versión de StreamDog y evoluciona con ella.":
      "A lasting pact: this text lives in every StreamDog release and evolves with it.",
    Español: "Spanish",
    English: "English",
    Deutsch: "German",
    Français: "French",
    Sistema: "System",
    /* Fichas expandidas (v1.38.0) */
    "Disponible ya": "Available now",
    "Qué incluye": "What's included",
    "Qué puedes hacer ya": "What you can do right now",
    "Abrir la parrilla": "Open the sports grid",
    "Abrir SportIA": "Open SportIA",
    "Jugar ahora": "Play now",
    "Buscar documentales de viajes": "Search travel documentaries",
    "Marcadores en directo": "Live scores",
    "Parrilla deportiva con IA": "AI-powered sports grid",
    "Cuenta atrás de cada partido": "Countdown to every match",
    "Documentales de viajes del archivo libre": "Travel documentaries from the free archive",
    "Destinos de dominio público": "Public-domain destinations",
    "Búsqueda real en el catálogo": "Real search across the catalog",
    "Arcade en tiempo real": "Real-time arcade",
    "Récords guardados en tu dispositivo": "High scores saved on your device",
    "Sin esperas ni instalaciones": "No waits, no installs",
    "Instalación como app nativa (PWA)": "Installs like a native app (PWA)",
    "No aparece el botón: usa el menú de tu navegador → «Instalar app»": "No button here? Use your browser menu → “Install app”",
    "Todo StreamDog en tu bolsillo": "All of StreamDog in your pocket",
    "Segundo plano y pantalla completa": "Background playback and fullscreen",
    "Herramientas propias y libres": "Our own free tools",
    "Salta a cada web en un clic": "Jump to each site in one click",
    "Todo gratis, como siempre": "Everything free, as always",
    "Webs de la casa": "House websites",
    Calculadora: "Calculator",
    Cuánticas: "Quantum",
    Pruebas: "Tests",
    Labs: "Labs",
    Conectores: "Connectors",
    Leaderboard: "Leaderboard",
    Novedades: "What's new",
    "API pública": "Public API",
  },

  de: {
    "Cine y series gratis": "Gratis Filme & Serien",
    Inicio: "Start",
    Películas: "Filme",
    Series: "Serien",
    Explorar: "Stöbern",
    "Mi lista": "Meine Liste",
    "Seguir viendo": "Weiterschauen",
    "Colección de oro": "Goldene Kollektion",
    "Series del momento": "Serien im Trend",
    "Cine clásico libre": "Freier Klassiker-Film",
    "Buscar películas y series…": "Filme & Serien suchen…",
    Reproducir: "Abspielen",
    Reanudar: "Fortsetzen",
    "Añadir a mi lista": "Zu meiner Liste hinzufügen",
    "En mi lista": "In meiner Liste",
    "Añadido a tu lista": "Zu deiner Liste hinzugefügt",
    "Quitado de tu lista": "Aus deiner Liste entfernt",
    "Ver en el origen": "Bei der Quelle ansehen",
    Episodios: "Folgen",
    Temporada: "Staffel",
    min: "Min.",
    Año: "Jahr",
    Duración: "Laufzeit",
    Géneros: "Genres",
    Director: "Regie",
    "Dominio público": "Gemeinfrei",
    "Fuentes en vivo": "Live-Quellen",
    "Comprobar salud": "Zustand prüfen",
    "Caché reparada automáticamente": "Cache automatisch repariert",
    "Se detectaron datos corruptos y StreamDog los reconstruyó solo:":
      "Beschädigte Daten erkannt — StreamDog hat sie selbst wiederhergestellt:",
    "Sin conexión: el catálogo vuelve con la red": "Offline: der Katalog kommt mit dem Netz zurück",
    Reintentar: "Erneut versuchen",
    "Cargando catálogo…": "Katalog wird geladen…",
    "Cargando el vídeo…": "Video wird geladen…",
    "Sin resultados para «{q}»": "Keine Ergebnisse für „{q}“",
    "Una fuente no respondió a tiempo: se muestra el resto.":
      "Eine Quelle hat zu lange gebraucht: der Rest wird angezeigt.",
    "Instalar la app": "App installieren",
    Instalada: "Installiert",
    Idioma: "Sprache",
    "Los títulos y sinopsis llegan en el idioma de su fuente (normalmente inglés); la interfaz sí está traducida.":
      "Titel und Zusammenfassungen kommen in der Sprache der Quelle (meist Englisch); die Oberfläche ist übersetzt.",
    "Continuar desde {m} min": "Ab {m} Min. weiter",
    "Empezar por el principio": "Von vorn beginnen",
    "Segundo plano": "Hintergrund-Wiedergabe",
    "Sonará en segundo plano aunque cambies de pestaña o bloques el móvil.":
      "Läuft weiter, wenn du den Tab wechselst oder das Handy sperrst.",
    "Ventana flotante": "Schwebendes Fenster",
    "No hay vídeo disponible para esta ficha": "Für diesen Titel gibt es kein Video",
    "No se pudo cargar el vídeo": "Das Video konnte nicht geladen werden",
    "Reintentando el vídeo…": "Video wird erneut versucht…",
    "Cargar más": "Mehr laden",
    "Catálogo vacío por ahora": "Der Katalog ist gerade leer",
    "Reproducir de nuevo": "Nochmal abspielen",
    "Los títulos más famosos": "Die berühmtesten Titel",
    "Film noir": "Film noir",
    "Ciencia ficción y terror": "Sci-Fi & Horror",
    "Dibujos animados clásicos": "Klassische Zeichentrickfilme",
    "Televisión clásica": "Klassisches Fernsehen",
    Documentales: "Dokumentationen",
    "Lo mejor de Disney+": "Das Beste von Disney+",
    "Catálogo infinito": "Unendlicher Katalog",
    "Actualizado cada hora": "Stündlich aktualisiert",
    "Destacado hoy": "Heute im Fokus",
    "Explorar todo": "Alles entdecken",
    "Muy pronto": "Demnächst",
    "En desarrollo": "In Entwicklung",
    Próximamente: "Bald verfügbar",
    "Deportes en vivo": "Live-Sport",
    Viajes: "Reisen",
    Juegos: "Spiele",
    Apps: "Apps",
    Webs: "Webseiten",
    VS: "VS",
    "Esto se está cocinando": "Hier entsteht etwas",
    Cerrar: "Schließen",
    "Ver el catálogo": "Katalog entdecken",
    Buscar: "Suchen",
    "Los deportes llegan a StreamDog: partidos, marcadores y emoción en directo, con la misma calidad que ya tienes en cine y series. Cada hora que pasa estamos más cerca del saque inicial. ⚽":
      "Sport kommt zu StreamDog: Live-Spiele, Ergebnisse und Gänsehaut, in derselben Qualität wie Filme & Serien. Jede Stunde bringt uns dem Anpfiff näher. ⚽",
    "Rutas, destinos y rincones del mundo libre: la brújula de StreamDog está sobre la mesa. Pronto viajar será tan fácil como dar al play. ✈️":
      "Routen, Ziele und Ecken der freien Welt: StreamDogs Kompass liegt auf dem Tisch. Bald ist Reisen so einfach wie Play drücken. ✈️",
    "El arcade en tiempo real de StreamDog está en desarrollo: partidas rápidas, récords y diversión sin esperas. El mando se está calibrando. 🎮":
      "StreamDogs Echtzeit-Arcade entsteht: schnelle Partien, Rekorde und Spaß ohne Wartezeit. Der Controller wird gerade kalibriert. 🎮",
    "Una caja de apps libres y herramientas de la casa, al estilo StreamDog: útiles, rápidas y sin letra pequeña. Se está compilando. 📱":
      "Eine Schachtel freier Apps und Hauswerkzeuge, im StreamDog-Stil: nützlich, schnell und ohne Kleingedrucktes. Wird gerade kompiliert. 📱",
    "Un radar de webs útiles, seguras y gratuitas para acompañar al catálogo infinito. Estamos afinando la antena. 🌐":
      "Ein Radar für nützliche, sichere und kostenlose Webseiten — als Begleiter für den unendlichen Katalog. Die Antenne wird justiert. 🌐",
    "Conexión con el Arena": "Arena-Verbindung",
    "Lo mejor de Netflix": "Das Beste von Netflix",
    "Lo mejor de HBO Max": "Das Beste von HBO Max",
    "Lo mejor de Prime Video": "Das Beste von Prime Video",
    "Lo mejor de Apple TV+": "Das Beste von Apple TV+",
    "Lo mejor de Filmin": "Das Beste von Filmin",
    "Animación para maratón": "Animation für den Marathon",
    "Basadas en hechos reales": "Nach wahren Ereignissen",
    "Lo más reciente": "Das Neueste",
    /* Top 100 (v1.37.0) */
    "Top 100": "Top 100",
    "La clasificación definitiva: series, películas y documentales del 1 al 100, con ranking real de las fuentes.":
      "Die endgültige Rangliste: Serien, Filme und Dokumentationen von 1 bis 100, mit echten Rankings der Quellen.",
    "Filtros del Top 100": "Top-100-Filter",
    General: "Allgemein",
    Famosos: "Berühmte",
    "Animación (Disney)": "Animation (Disney)",
    Recientes: "Neu",
    Populares: "Beliebt",
    "Ambigüedad": "Überraschung",
    "El ranking global: lo mejor de cada plataforma y del archivo público, del 1 al 100.":
      "Die globale Rangliste: das Beste jeder Plattform und des öffentlichen Archivs, von 1 bis 100.",
    "Los que todo el mundo conoce: éxitos eternos del dominio público y las series que marcaron época en Netflix.":
      "Die alle kennen: ewige Public-Domain-Hits und die Serien, die bei Netflix eine Ära prägten.",
    "Dibujos y anime para maratón: de los clásicos de Disney a Attack on Titan, sin parar.":
      "Zeichentrick und Anime für den Marathon: von den Disney-Klassikern bis Attack on Titan, ohne Pause.",
    "Los estrenos de los que habla todo el mundo ahora mismo, del más nuevo al imprescindible.":
      "Die Starts, über die gerade alle reden — vom neuesten bis zum Muss.",
    "El consenso de las listas: los títulos que suman más puestos altos en todas las plataformas.":
      "Der Konsens der Listen: die Titel mit den meisten Spitzenplätzen auf allen Plattformen.",
    "Mezcla sorpresa sin reglas: series, películas y documentales barajados — siempre igual en tu dispositivo, distinto en cada versión.":
      "Überraschungsmix ohne Regeln: Serien, Filme und Dokumentationen gemischt — auf deinem Gerät immer gleich, mit jeder Version anders.",
    Puesto: "Platz",
    "La clasificación está vacía: las fuentes no respondieron. Prueba otro filtro o reintenta.":
      "Die Rangliste ist leer: die Quellen haben nicht geantwortert. Probiere einen anderen Filter oder versuch es erneut.",
    "Fusionado con el Arena": "Mit dem Arena verschmolzen",
    Independiente: "Unabhängig",
    "Ir al Arena": "Zum Arena",
    "StreamDog nació dentro del Arena todólogo.ai: en modo fusionado comparten identidad, estilo y enlaces cruzados.":
      "StreamDog wurde im Arena von todólogo.ai geboren: im verschmolzenen Modus teilen sie Identität, Stil und Querverweise.",
    "Modo independiente: StreamDog se basta solo — los enlaces al Arena se ocultan, perfecto para su dominio propio.":
      "Unabhängiger Modus: StreamDog kommt allein aus — Arena-Links werden ausgeblendet, perfekt für die eigene Domain.",
    "Pacto abierto": "Offener Pakt",
    "Aviso de seguridad, privacidad y colaboración con las plataformas":
      "Sicherheits-, Datenschutz- und Kooperationshinweis für die Plattformen",
    "Para Netflix, Prime Video, Disney+, HBO Max, Apple TV, Filmin y todas las plataformas del mundo":
      "Für Netflix, Prime Video, Disney+, HBO Max, Apple TV, Filmin und alle Plattformen der Welt",
    "Qué servimos y qué no": "Was wir ausstrahlen — und was nicht",
    "StreamDog emite cine y series de dominio público y metadatos abiertos de Internet Archive, Wikimedia Commons y TVMaze. No alojamos, desciframos ni repartimos archivos protegidos: nada de torrents, nada de cracks, nada de enlaces piratas. Cada ficha muestra su fuente y su licencia; lo que una fuente retira, desaparece del catálogo sin ruido.":
      "StreamDog zeigt gemeinfreie Filme & Serien und offene Metadaten von Internet Archive, Wikimedia Commons und TVMaze. Wir hosten, knacken und verbreiten keine geschützten Dateien: keine Torrents, keine Cracks, keine Piratenlinks. Jede Karte zeigt ihre Quelle und Lizenz; was eine Quelle entfernt, verschwindet geräuschlos aus dem Katalog.",
    "Nada personal: el problema son los precios": "Nichts Persönliches: das Problem sind die Preise",
    "No tenemos nada en contra de Netflix, Prime Video, Disney+, HBO Max, Apple TV ni Filmin: admiramos lo que construyen. Lo que se atraganta son las suscripciones desorbitadas — media docena de cuotas al mes que ya suman más que la factura de la luz. StreamDog nace para cubrir ese hueco con contenido libre y legal, no para sustituir a nadie: mucha de esta casa sigue pagando sus plataformas favoritas.":
      "Wir haben nichts gegen Netflix, Prime Video, Disney+, HBO Max, Apple TV oder Filmin: wir bewundern, was sie aufbauen. Was uns zu schaffen macht, sind die Wucher-Abos — ein halbes Dutzend Monatsbeiträge, die schon höher sind als die Stromrechnung. StreamDog füllt diese Lücke mit freien, legalen Inhalten, um niemanden zu ersetzen: viele in diesem Haus zahlen weiterhin für ihre Lieblingsplattformen.",
    "Colaboración, no enemistad": "Zusammenarbeit, nicht Feindschaft",
    "Este proyecto busca un acuerdo mayor, no una enemistad permanente: catálogos más asequibles, ventanas de prueba, bundles con dominio público, licencias honestas para apps independientes. Si las plataformas quieren hablar, aquí tienen la puerta abierta y un interlocutor serio. El dominio público ya demuestra la demanda; el contenido premium de las plataformas pondría el resto. Entre todos, todos ganamos.":
      "Dieses Projekt will eine größere Vereinbarung, keine ewige Fehde: günstigere Kataloge, Probefenster, Bundles mit Public Domain, ehrliche Lizenzen für unabhängige Apps. Wenn die Plattformen reden wollen: Die Tür steht offen, und der Gesprächspartner ist ernsthaft. Public Domain beweist die Nachfrage bereits; der Premium-Inhalt der Plattformen würde das Restliche bringen. Zusammen gewinnen alle.",
    "Marcas y afiliación": "Marken und Zugehörigkeit",
    "Netflix, Prime Video, Disney+, HBO Max, Apple TV y Filmin son marcas registradas de sus respectivos propietarios. StreamDog no está afiliado, patrocinado ni avalado por ninguna; sus referencias son informativas y de uso nominativo — metadatos públicos con enlace siempre al origen oficial, jamás a copias.":
      "Netflix, Prime Video, Disney+, HBO Max, Apple TV und Filmin sind eingetragene Marken ihrer jeweiligen Inhaber. StreamDog ist mit keiner davon verbunden, gesponsert oder gutgeheißen; Verweise sind informativ und nominativ — öffentliche Metadaten mit Links immer zur offiziellen Quelle, niemals zu Kopien.",
    "Privacidad de verdad": "Echter Datenschutz",
    "Sin cuentas obligatorias, sin venta de datos, sin rastreadores publicitarios. Tu lista, tu progreso y tus preferencias viven en tu dispositivo (localStorage) y no salen de él. El chat 1-a-1 viaja cifrado de extremo a extremo: este servidor solo transporta cifrado y no guarda conversaciones.":
      "Keine Pflichtkonten, kein Datenverkauf, keine Werbe-Tracker. Deine Liste, dein Fortschritt und deine Einstellungen leben auf deinem Gerät (localStorage) und verlassen es nie. Der 1-zu-1-Chat reist Ende-zu-Ende-verschlüsselt: Dieser Server transportiert nur Chiffrat und speichert keine Gespräche.",
    "Seguridad auditable": "Auditierbare Sicherheit",
    "Código abierto y auditable: sin malware, sin mineros criptográficos, sin permisos raros. La PWA se instala desde tu navegador con el sandbox estándar, el reproductor solo abre fuentes verificadas y el servidor publica sus fuentes y su salud en tiempo real (el chip ♾️ de la cabecera).":
      "Offener, auditierbarer Code: keine Schadsoftware, keine Krypto-Miner, keine seltsamen Berechtigungen. Die PWA wird mit der Standard-Sandbox aus deinem Browser installiert, der Player öffnet nur geprüfte Quellen, und der Server veröffentlicht seine Quellen und seine Gesundheit in Echtzeit (der ♾️-Chip in der Kopfzeile).",
    "Legibilidad y retirada": "Lesbarkeit und Rückzug",
    "Todo es legible a la primera: cada ficha nombra su fuente, cada error se dice a la cara y el estado del catálogo se publica, no se esconde. Si eres titular de derechos y crees que algo no debería estar aquí, escríbenos: lo retiramos de inmediato. Verificado y limpio es como queremos seguir siendo la casa del contenido libre.":
      "Alles ist auf den ersten Blick lesbar: jede Karte nennt ihre Quelle, jeder Fehler wird offen gesagt und der Katalogzustand wird veröffentlicht, nicht versteckt. Falls du Rechteinhaber bist und meinst, dass etwas nicht hier sein sollte, schreib uns: wir entfernen es sofort. Geprüft und sauber — so wollen wir weiter das Haus der freien Inhalte sein.",
    "Un pacto duradero: este texto vive en cada versión de StreamDog y evoluciona con ella.":
      "Ein bleibender Pakt: dieser Text lebt in jeder StreamDog-Version und entwickelt sich mit ihr weiter.",
    Español: "Spanisch",
    English: "Englisch",
    Deutsch: "Deutsch",
    Français: "Französisch",
    Sistema: "System",
    /* Fichas expandidas (v1.38.0) */
    "Disponible ya": "Jetzt verfügbar",
    "Qué incluye": "Was drin ist",
    "Qué puedes hacer ya": "Was du jetzt tun kannst",
    "Abrir la parrilla": "Sportprogramm öffnen",
    "Abrir SportIA": "SportIA öffnen",
    "Jugar ahora": "Jetzt spielen",
    "Buscar documentales de viajes": "Reisedokumentationen suchen",
    "Marcadores en directo": "Ergebnisse live",
    "Parrilla deportiva con IA": "Sportprogramm mit KI",
    "Cuenta atrás de cada partido": "Countdown zu jedem Spiel",
    "Documentales de viajes del archivo libre": "Reisedokumentationen aus dem freien Archiv",
    "Destinos de dominio público": "Reiseziele aus Gemeinfreiheit",
    "Búsqueda real en el catálogo": "Echte Suche im Katalog",
    "Arcade en tiempo real": "Arcade in Echtzeit",
    "Récords guardados en tu dispositivo": "Rekorde auf deinem Gerät gespeichert",
    "Sin esperas ni instalaciones": "Kein Warten, keine Installation",
    "Instalación como app nativa (PWA)": "Installiert sich wie eine native App (PWA)",
    "No aparece el botón: usa el menú de tu navegador → «Instalar app»": "Kein Button hier? Nimm das Menü deines Browsers → „App installieren“",
    "Todo StreamDog en tu bolsillo": "Ganz StreamDog in der Tasche",
    "Segundo plano y pantalla completa": "Hintergrund und Vollbild",
    "Herramientas propias y libres": "Eigene freie Tools",
    "Salta a cada web en un clic": "Mit einem Klick auf jede Website",
    "Todo gratis, como siempre": "Alles gratis, wie immer",
    "Webs de la casa": "Websites der Hauses",
    Calculadora: "Taschenrechner",
    Cuánticas: "Quanten",
    Pruebas: "Tests",
    Labs: "Labs",
    Conectores: "Connectors",
    Leaderboard: "Leaderboard",
    Novedades: "Neuigkeiten",
    "API pública": "Öffentliche API",
  },

  fr: {
    "Cine y series gratis": "Films & séries gratuits",
    Inicio: "Accueil",
    Películas: "Films",
    Series: "Séries",
    Explorar: "Parcourir",
    "Mi lista": "Ma liste",
    "Seguir viendo": "Reprendre la lecture",
    "Colección de oro": "Collection d'or",
    "Series del momento": "Séries du moment",
    "Cine clásico libre": "Cinéma classique libre",
    "Buscar películas y series…": "Rechercher films & séries…",
    Reproducir: "Lecture",
    Reanudar: "Reprendre",
    "Añadir a mi lista": "Ajouter à ma liste",
    "En mi lista": "Dans ma liste",
    "Añadido a tu lista": "Ajouté à votre liste",
    "Quitado de tu lista": "Retiré de votre liste",
    "Ver en el origen": "Voir à la source",
    Episodios: "Épisodes",
    Temporada: "Saison",
    min: "min",
    Año: "Année",
    Duración: "Durée",
    Géneros: "Genres",
    Director: "Réalisation",
    "Dominio público": "Domaine public",
    "Fuentes en vivo": "Sources en direct",
    "Comprobar salud": "Vérifier l'état",
    "Caché reparada automáticamente": "Cache réparé automatiquement",
    "Se detectaron datos corruptos y StreamDog los reconstruyó solo:":
      "Des données corrompues ont été détectées et StreamDog les a reconstruites tout seul :",
    "Sin conexión: el catálogo vuelve con la red": "Hors ligne : le catalogue revient avec le réseau",
    Reintentar: "Réessayer",
    "Cargando catálogo…": "Chargement du catalogue…",
    "Cargando el vídeo…": "Chargement de la vidéo…",
    "Sin resultados para «{q}»": "Aucun résultat pour « {q} »",
    "Una fuente no respondió a tiempo: se muestra el resto.":
      "Une source n'a pas répondu à temps : le reste est affiché.",
    "Instalar la app": "Installer l'app",
    Instalada: "Installée",
    Idioma: "Langue",
    "Los títulos y sinopsis llegan en el idioma de su fuente (normalmente inglés); la interfaz sí está traducida.":
      "Les titres et synopsis arrivent dans la langue de leur source (généralement l'anglais) ; l'interface est bien traduite.",
    "Continuar desde {m} min": "Reprendre à {m} min",
    "Empezar por el principio": "Recommencer du début",
    "Segundo plano": "Lecture en arrière-plan",
    "Sonará en segundo plano aunque cambies de pestaña o bloques el móvil.":
      "La lecture continue quand tu changes d'onglet ou verrouilles le téléphone.",
    "Ventana flotante": "Fenêtre flottante",
    "No hay vídeo disponible para esta ficha": "Aucune vidéo disponible pour ce titre",
    "No se pudo cargar el vídeo": "Impossible de charger la vidéo",
    "Reintentando el vídeo…": "Nouvelle tentative de la vidéo…",
    "Cargar más": "Charger plus",
    "Catálogo vacío por ahora": "Catalogue vide pour l'instant",
    "Reproducir de nuevo": "Rejouer",
    "Los títulos más famosos": "Les titres les plus célèbres",
    "Film noir": "Film noir",
    "Ciencia ficción y terror": "Science-fiction & horreur",
    "Dibujos animados clásicos": "Dessins animés classiques",
    "Televisión clásica": "Télévision classique",
    Documentales: "Documentaires",
    "Lo mejor de Disney+": "Le meilleur de Disney+",
    "Catálogo infinito": "Catalogue infini",
    "Actualizado cada hora": "Mis à jour chaque heure",
    "Destacado hoy": "À la une aujourd'hui",
    "Explorar todo": "Tout parcourir",
    "Muy pronto": "Très bientôt",
    "En desarrollo": "En développement",
    Próximamente: "À venir",
    "Deportes en vivo": "Sport en direct",
    Viajes: "Voyages",
    Juegos: "Jeux",
    Apps: "Applications",
    Webs: "Sites web",
    VS: "VS",
    "Esto se está cocinando": "C'est en préparation",
    Cerrar: "Fermer",
    "Ver el catálogo": "Parcourir le catalogue",
    Buscar: "Rechercher",
    "Los deportes llegan a StreamDog: partidos, marcadores y emoción en directo, con la misma calidad que ya tienes en cine y series. Cada hora que pasa estamos más cerca del saque inicial. ⚽":
      "Le sport arrive sur StreamDog : matchs en direct, scores et frissons, avec la même qualité que vos films & séries. Chaque heure nous rapproche du coup d'envoi. ⚽",
    "Rutas, destinos y rincones del mundo libre: la brújula de StreamDog está sobre la mesa. Pronto viajar será tan fácil como dar al play. ✈️":
      "Itinéraires, destinations et coins du monde libre : la boussole de StreamDog est sur la table. Bientôt, voyager sera aussi simple que d'appuyer sur lecture. ✈️",
    "El arcade en tiempo real de StreamDog está en desarrollo: partidas rápidas, récords y diversión sin esperas. El mando se está calibrando. 🎮":
      "L'arcade en temps réel de StreamDog est en développement : parties rapides, records et plaisir sans attente. La manette se calibre. 🎮",
    "Una caja de apps libres y herramientas de la casa, al estilo StreamDog: útiles, rápidas y sin letra pequeña. Se está compilando. 📱":
      "Une boîte d'applications libres et d'outils maison, façon StreamDog : utiles, rapides et sans petites lignes. Ça compile en ce moment. 📱",
    "Un radar de webs útiles, seguras y gratuitas para acompañar al catálogo infinito. Estamos afinando la antena. 🌐":
      "Un radar de sites utiles, sûrs et gratuits pour accompagner le catalogue infini. L'antenne se règle. 🌐",
    "Conexión con el Arena": "Connexion à l'Arena",
    "Lo mejor de Netflix": "Le meilleur de Netflix",
    "Lo mejor de HBO Max": "Le meilleur de HBO Max",
    "Lo mejor de Prime Video": "Le meilleur de Prime Video",
    "Lo mejor de Apple TV+": "Le meilleur d'Apple TV+",
    "Lo mejor de Filmin": "Le meilleur de Filmin",
    "Animación para maratón": "Animation à dévorer",
    "Basadas en hechos reales": "Inspirées de faits réels",
    "Lo más reciente": "Les plus récentes",
    /* Top 100 (v1.37.0) */
    "Top 100": "Top 100",
    "La clasificación definitiva: series, películas y documentales del 1 al 100, con ranking real de las fuentes.":
      "Le classement définitif : séries, films et documentaires de 1 à 100, avec les vrais classements des sources.",
    "Filtros del Top 100": "Filtres du Top 100",
    General: "Général",
    Famosos: "Célèbres",
    "Animación (Disney)": "Animation (Disney)",
    Recientes: "Récents",
    Populares: "Populaires",
    "Ambigüedad": "Ambiguïté",
    "El ranking global: lo mejor de cada plataforma y del archivo público, del 1 al 100.":
      "Le classement mondial : le meilleur de chaque plateforme et des archives publiques, de 1 à 100.",
    "Los que todo el mundo conoce: éxitos eternos del dominio público y las series que marcaron época en Netflix.":
      "Ceux que tout le monde connaît : succès éternels du domaine public et séries qui ont marqué une époque sur Netflix.",
    "Dibujos y anime para maratón: de los clásicos de Disney a Attack on Titan, sin parar.":
      "Dessins animés et animes pour le marathon : des classiques Disney à Attack on Titan, sans s'arrêter.",
    "Los estrenos de los que habla todo el mundo ahora mismo, del más nuevo al imprescindible.":
      "Les sorties dont tout le monde parle en ce moment, de la plus récente à l'indispensable.",
    "El consenso de las listas: los títulos que suman más puestos altos en todas las plataformas.":
      "Le consensus des listes : les titres qui cumulent le plus de premières places sur toutes les plateformes.",
    "Mezcla sorpresa sin reglas: series, películas y documentales barajados — siempre igual en tu dispositivo, distinto en cada versión.":
      "Mélange surprise sans règles : séries, films et documentaires brassés — toujours pareil sur ton appareil, différent à chaque version.",
    Puesto: "Place",
    "La clasificación está vacía: las fuentes no respondieron. Prueba otro filtro o reintenta.":
      "Le classement est vide : les sources n'ont pas répondu. Essaie un autre filtre ou réessaie.",
    "Fusionado con el Arena": "Fusionné avec l'Arena",
    Independiente: "Indépendant",
    "Ir al Arena": "Aller à l'Arena",
    "StreamDog nació dentro del Arena todólogo.ai: en modo fusionado comparten identidad, estilo y enlaces cruzados.":
      "StreamDog est né dans l'Arena de todólogo.ai : en mode fusionné, ils partagent identité, style et liens croisés.",
    "Modo independiente: StreamDog se basta solo — los enlaces al Arena se ocultan, perfecto para su dominio propio.":
      "Mode indépendant : StreamDog se suffit à lui-même — les liens vers l'Arena disparaissent, parfait pour son propre domaine.",
    "Pacto abierto": "Pacte ouvert",
    "Aviso de seguridad, privacidad y colaboración con las plataformas":
      "Avis de sécurité, de confidentialité et de collaboration aux plateformes",
    "Para Netflix, Prime Video, Disney+, HBO Max, Apple TV, Filmin y todas las plataformas del mundo":
      "Pour Netflix, Prime Video, Disney+, HBO Max, Apple TV, Filmin et toutes les plateformes du monde",
    "Qué servimos y qué no": "Ce que nous diffusons — et ce que nous ne diffusons pas",
    "StreamDog emite cine y series de dominio público y metadatos abiertos de Internet Archive, Wikimedia Commons y TVMaze. No alojamos, desciframos ni repartimos archivos protegidos: nada de torrents, nada de cracks, nada de enlaces piratas. Cada ficha muestra su fuente y su licencia; lo que una fuente retira, desaparece del catálogo sin ruido.":
      "StreamDog diffuse des films & séries du domaine public et des métadonnées ouvertes d'Internet Archive, de Wikimedia Commons et de TVMaze. Nous n'hébergeons, ne déchiffrons ni ne redistribuons de fichiers protégés : ni torrents, ni cracks, ni liens pirates. Chaque fiche affiche sa source et sa licence ; ce qu'une source retire disparaît du catalogue sans bruit.",
    "Nada personal: el problema son los precios": "Rien de personnel : le problème, ce sont les prix",
    "No tenemos nada en contra de Netflix, Prime Video, Disney+, HBO Max, Apple TV ni Filmin: admiramos lo que construyen. Lo que se atraganta son las suscripciones desorbitadas — media docena de cuotas al mes que ya suman más que la factura de la luz. StreamDog nace para cubrir ese hueco con contenido libre y legal, no para sustituir a nadie: mucha de esta casa sigue pagando sus plataformas favoritas.":
      "Nous n'avons rien contre Netflix, Prime Video, Disney+, HBO Max, Apple TV ni Filmin : nous admirons ce qu'ils construisent. Ce qui passe mal, ce sont les abonnements exorbitants — une demi-douzaine de mensualités qui dépassent déjà la facture d'électricité. StreamDog naît pour combler ce vide avec du contenu libre et légal, pas pour remplacer qui que ce soit : beaucoup sous cette maison paient encore leurs plateformes préférées.",
    "Colaboración, no enemistad": "Collaborer, pas s'affronter",
    "Este proyecto busca un acuerdo mayor, no una enemistad permanente: catálogos más asequibles, ventanas de prueba, bundles con dominio público, licencias honestas para apps independientes. Si las plataformas quieren hablar, aquí tienen la puerta abierta y un interlocutor serio. El dominio público ya demuestra la demanda; el contenido premium de las plataformas pondría el resto. Entre todos, todos ganamos.":
      "Ce projet cherche un accord plus grand, pas une inimitié éternelle : des catalogues plus abordables, des fenêtres d'essai, des offres groupées avec le domaine public, des licences honnêtes pour les apps indépendantes. Si les plateformes veulent parler, la porte est ouverte et l'interlocuteur est sérieux. Le domaine public prouve déjà la demande ; le contenu premium des plateformes ferait le reste. Ensemble, tout le monde gagne.",
    "Marcas y afiliación": "Marques et affiliation",
    "Netflix, Prime Video, Disney+, HBO Max, Apple TV y Filmin son marcas registradas de sus respectivos propietarios. StreamDog no está afiliado, patrocinado ni avalado por ninguna; sus referencias son informativas y de uso nominativo — metadatos públicos con enlace siempre al origen oficial, jamás a copias.":
      "Netflix, Prime Video, Disney+, HBO Max, Apple TV et Filmin sont des marques déposées de leurs propriétaires respectifs. StreamDog n'est affilié, sponsorisé ni approuvé par aucune ; ses références sont informatives et nominatives — des métadonnées publiques avec des liens toujours vers la source officielle, jamais vers des copies.",
    "Privacidad de verdad": "Une vraie confidentialité",
    "Sin cuentas obligatorias, sin venta de datos, sin rastreadores publicitarios. Tu lista, tu progreso y tus preferencias viven en tu dispositivo (localStorage) y no salen de él. El chat 1-a-1 viaja cifrado de extremo a extremo: este servidor solo transporta cifrado y no guarda conversaciones.":
      "Sans comptes obligatoires, sans vente de données, sans traqueurs publicitaires. Ta liste, ta progression et tes préférences vivent sur ton appareil (localStorage) et n'en sortent jamais. Le chat 1-pour-1 voyage chiffré de bout en bout : ce serveur ne transporte que du chiffré et ne garde aucune conversation.",
    "Seguridad auditable": "Sécurité auditable",
    "Código abierto y auditable: sin malware, sin mineros criptográficos, sin permisos raros. La PWA se instala desde tu navegador con el sandbox estándar, el reproductor solo abre fuentes verificadas y el servidor publica sus fuentes y su salud en tiempo real (el chip ♾️ de la cabecera).":
      "Code ouvert et auditable : ni malware, ni mineurs cryptographiques, ni permissions étranges. La PWA s'installe depuis ton navigateur avec le bac à sable standard, le lecteur n'ouvre que des sources vérifiées, et le serveur publie ses sources et sa santé en temps réel (la pastille ♾️ de l'en-tête).",
    "Legibilidad y retirada": "Lisibilité et retrait",
    "Todo es legible a la primera: cada ficha nombra su fuente, cada error se dice a la cara y el estado del catálogo se publica, no se esconde. Si eres titular de derechos y crees que algo no debería estar aquí, escríbenos: lo retiramos de inmediato. Verificado y limpio es como queremos seguir siendo la casa del contenido libre.":
      "Tout est lisible au premier regard : chaque fiche nomme sa source, chaque erreur se dit en face et l'état du catalogue est publié, pas caché. Si tu es titulaire de droits et penses que quelque chose ne devrait pas être ici, écris-nous : nous le retirons immédiatement. Vérifié et propre — voilà comment nous voulons continuer d'être la maison du contenu libre.",
    "Un pacto duradero: este texto vive en cada versión de StreamDog y evoluciona con ella.":
      "Un pacte durable : ce texte vit dans chaque version de StreamDog et évolue avec elle.",
    Español: "Espagnol",
    English: "Anglais",
    Deutsch: "Allemand",
    Français: "Français",
    Sistema: "Système",
    /* Fichas expandidas (v1.38.0) */
    "Disponible ya": "Disponible dès maintenant",
    "Qué incluye": "Ce qui est inclus",
    "Qué puedes hacer ya": "Ce que tu peux faire déjà",
    "Abrir la parrilla": "Ouvrir la grille sportive",
    "Abrir SportIA": "Ouvrir SportIA",
    "Jugar ahora": "Jouer maintenant",
    "Buscar documentales de viajes": "Chercher des documentaires de voyage",
    "Marcadores en directo": "Scores en direct",
    "Parrilla deportiva con IA": "Grille sportive avec IA",
    "Cuenta atrás de cada partido": "Compte à rebours de chaque match",
    "Documentales de viajes del archivo libre": "Documentaires de voyage des archives libres",
    "Destinos de dominio público": "Destinations du domaine public",
    "Búsqueda real en el catálogo": "Recherche réelle dans le catalogue",
    "Arcade en tiempo real": "Arcade en temps réel",
    "Récords guardados en tu dispositivo": "Records sauvegardés sur ton appareil",
    "Sin esperas ni instalaciones": "Sans attente ni installation",
    "Instalación como app nativa (PWA)": "S'installe comme une app native (PWA)",
    "No aparece el botón: usa el menú de tu navegador → «Instalar app»": "Pas de bouton ici ? Utilise le menu de ton navigateur → « Installer l'app »",
    "Todo StreamDog en tu bolsillo": "Tout StreamDog dans ta poche",
    "Segundo plano y pantalla completa": "Lecture en arrière-plan et plein écran",
    "Herramientas propias y libres": "Nos propres outils libres",
    "Salta a cada web en un clic": "Saute sur chaque site en un clic",
    "Todo gratis, como siempre": "Tout gratuit, comme toujours",
    "Webs de la casa": "Sites de la maison",
    Calculadora: "Calculatrice",
    Cuánticas: "Quantiques",
    Pruebas: "Tests",
    Labs: "Labs",
    Conectores: "Connecteurs",
    Leaderboard: "Classement",
    Novedades: "Nouveautés",
    "API pública": "API publique",
  },
};

/** Variables de interpolación: {clave} dentro del texto. */
export type VarsCine = Record<string, string | number>;

/**
 * Traduce `clave` (español canónico) al idioma pedido. Si falta la
 * traducción o el idioma es el base, devuelve la propia clave — la UI
 * nunca muestra un hueco feo.
 */
export function traducirCine(clave: string, idioma: IdiomaCine, vars?: VarsCine): string {
  // v1.38.0 — «sistema» se resuelve al idioma del dispositivo (defensivo:
  // los componentes ya reciben el idioma resuelto, pero la puerta no se cierra).
  const fijo = idioma === "sistema" ? idiomaCineDelNavegador() : idioma;
  let out = fijo === "es" ? clave : DICCIONARIOS_CINE[fijo][clave] ?? clave;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.split(`{${k}}`).join(String(v));
    }
  }
  return out;
}

/* ────────────────────────── géneros ────────────────────────── */

/**
 * Los géneros llegan de TVMaze en inglés. Mapa inglés → cada idioma;
 * el género desconocido se muestra tal cual (mejor «Musical» en español
 * que una clave vacía).
 */
export const GENEROS_CINE: Record<string, Partial<Record<IdiomaCine, string>>> = {
  Drama: { de: "Drama", fr: "Drame" },
  Comedy: { es: "Comedia", de: "Komödie", fr: "Comédie" },
  Horror: { es: "Terror", de: "Horror", fr: "Horreur" },
  "Science-Fiction": { es: "Ciencia ficción", de: "Science-Fiction", fr: "Science-fiction" },
  Thriller: { es: "Suspense", de: "Thriller", fr: "Thriller" },
  Action: { es: "Acción", de: "Action", fr: "Action" },
  Romance: { es: "Romance", de: "Liebe", fr: "Romance" },
  Mystery: { es: "Misterio", de: "Mystery", fr: "Mystère" },
  Fantasy: { es: "Fantasía", de: "Fantasy", fr: "Fantastique" },
  Animation: { es: "Animación", de: "Animation", fr: "Animation" },
  Crime: { es: "Crimen", de: "Krimi", fr: "Policier" },
  Adventure: { es: "Aventura", de: "Abenteuer", fr: "Aventure" },
  Documentary: { es: "Documental", de: "Dokumentation", fr: "Documentaire" },
  Family: { es: "Familia", de: "Familie", fr: "Famille" },
  Music: { es: "Música", de: "Musik", fr: "Musique" },
  War: { es: "Bélico", de: "Krieg", fr: "Guerre" },
  Western: { de: "Western", fr: "Western" },
  History: { es: "Historia", de: "Geschichte", fr: "Histoire" },
  Sport: { es: "Deporte", de: "Sport", fr: "Sport" },
  Reality: { es: "Reality", de: "Reality", fr: "Télé-réalité" },
  Legal: { es: "Judicial", de: "Recht", fr: "Juridique" },
  Medical: { es: "Médico", de: "Medizin", fr: "Médical" },
  Supernatural: { es: "Sobrenatural", de: "Übernatürliches", fr: "Surnaturel" },
  Espionage: { es: "Espionaje", de: "Spionage", fr: "Espionnage" },
  Food: { es: "Gastronomía", de: "Essen", fr: "Cuisine" },
  Travel: { es: "Viajes", de: "Reisen", fr: "Voyage" },
  Children: { es: "Infantil", de: "Kinder", fr: "Enfants" },
};

/** Traduce un género de fuente (inglés) al idioma de la UI. */
export function traducirGenero(genero: string, idioma: IdiomaCine): string {
  const limpio = genero.trim();
  if (!limpio) return limpio;
  const mapa = GENEROS_CINE[limpio] ?? GENEROS_CINE[limpio.toLowerCase()];
  return mapa?.[idioma] ?? limpio;
}
