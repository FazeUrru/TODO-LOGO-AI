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
  /* Cartelera de películas + crítica constructiva (v1.38.0) */
  "Películas del cine",
  "Filtros de las películas",
  "La cartelera de películas del dominio público con cuatro puertas: populares, recientes, ambiguas y la crítica constructiva — clásicos con una crítica honesta bajo cada ficha.",
  "Ambiguas",
  "Crítica constructiva",
  "Las películas más pedidas de la casa: el consenso de los éxitos mundiales del dominio público.",
  "Del año más nuevo al más viejo: el catálogo de películas ordenado por su año de estreno real.",
  "Clásicos con crítica y éxitos mundiales, alternados sin reglas: una crítica, un éxito, otra crítica…",
  "La sección que no existe en ningún otro catálogo: 12 clásicos con una crítica constructiva y honesta de qué envejeció y qué sigue vivo.",
  "Volver a la clasificación",
  "Hoy en emisión",
  /* Intro + tour (v1.38.0) */
  "Bienvenido a StreamDog",
  "Cine y series libres, actualizados cada hora",
  "Entrar",
  "Saltar la intro",
  "Sonido",
  "Ver la intro",
  "Tour de la casa",
  "Saltar el tour",
  "Anterior",
  "Siguiente",
  "Terminar",
  "Tour: tu catálogo infinito",
  "Un minuto y sabes usar toda la casa: qué es cada cosa, dónde está y cómo se usa. Puedes saltarlo cuando quieras.",
  "Actualizado cada hora, de verdad",
  "Este chip es el pulso de la casa: el cron empresarial recoge lo nuevo de las fuentes cada hora y el punto verde dice que todo va fino.",
  "Busca entre millones de tdo",
  "El buscador pega en las tres fuentes a la vez (Commons, Archive y TVMaze) y muestra resultados reales: escribe y da al botón verde.",
  "Cinco vistas, un catálogo",
  "Inicio con filas, el Top 100 con 6 filtros, Películas con crítica constructiva, Series y tu Mi lista: todo salta con un toque.",
  "La hoja de ruta se PUEDE usar",
  "Deportes, viajes, juegos, apps y webs no son carteles mudos: cada ficha abre acciones reales — jugar, instalar, explorar, escuchar.",
  "En tu idioma, siempre",
  "«Sistema» adapta la app al idioma de tu dispositivo y también puedes fijar Español, English, Deutsch o Français.",
  "Y el pacto abierto",
  "Aquí está la carta a las plataformas y la explicación completa de la app: qué es, cómo funciona y cómo se sostiene sin anuncios.",
  /* Sostenibilidad (v1.38.0): monetizar sin anuncios ni suscripción */
  "Sostenibilidad",
  "Cómo se sostiene la casa sin anuncios ni suscripciones",
  "Sin anuncios · Sin suscripción · Sin venta de datos",
  "Cómo se sostiene StreamDog",
  "El catálogo es gratis y será gratis para siempre. Estas tres vías — 100 % opcionales — pagan los servidores, el dominio y el cron que lo refresca cada hora. Tres formas nuevas de sostener contenido libre, guiadas por la demanda real de películas y series.",
  "Puente legal (afiliación honesta)",
  "Cuando un título que buscas no está en el catálogo libre, StreamDog te ofrece el camino legal a la plataforma que lo tiene — con enlace de afiliado. Tú pagas exactamente lo mismo; la casa recibe una comisión pequeña por el envío. Sin rastreadores, sin pop-ups, sin presión: el puente solo aparece cuando la demanda del título lo justifica, y jamás altera el catálogo ni el orden de las filas. Es la forma más limpia de que el catálogo libre y las plataformas convivan.",
  "Colecciones a demanda (micro-mecenazgo)",
  "La demanda manda de verdad: la comunidad vota qué colección se cura, restaura o digitaliza después — una temporada de cartoons, un ciclo de film noir, los documentales de viajes que pedís en el buscador. Quien apoya una colección concreta aparece en sus créditos dentro de la app. No hay cuotas ni niveles: cada campaña es una colección concreta con un coste claro, y el resultado entra al catálogo libre para todo el mundo, también para quien no aportó un céntimo.",
  "Pósters del dominio público",
  "Impresión bajo demanda con ARTE LIBRE: portadas, fotogramas y carteles de películas de dominio público convertidos en láminas y pósters de calidad, más el merchandising de la marca StreamDog. Los originales ya son de todos; nosotros solo los tratamos con cariño y los llevamos a la pared. El margen de cada lámina paga servidores, dominio y el cron que mantiene el catálogo fresco cada hora — sin tocar el precio de nadie.",
  "Nada de esto es obligatorio para ver ni una sola ficha: la casa no cierra si un día nadie apoya — pero gracias a quien apoya, crece.",
  /* Explicación de la app (v1.38.0): la guía completa dentro del pacto */
  "Qué es StreamDog y cómo funciona",
  "El pacto con las plataformas",
  "Qué es StreamDog",
  "StreamDog es un catálogo infinito de cine y series GRATIS y legales: películas completas de dominio público que se reproducen aquí mismo, series con sus fichas y episodios, y documentales de archivo. Nada de copias piratas ni descargas raras: todo lo que ves nace libre o es metadato público. Se instala como app (PWA) desde el propio navegador, sin tiendas, y funciona en el móvil como en el ordenador.",
  "Cómo funciona por dentro",
  "La casa se alimenta de tres fuentes públicas — Wikimedia Commons (vídeo reproducible), Internet Archive (el gran archivo del mundo) y TVMaze (metadatos de series) — y un CRON EMPRESARIAL las recorre cada hora, puntual como un reloj: lo que aparece, entra al catálogo; lo que desaparece, sale sin ruido. No hay cuentas, no hay registro, no hay seguimiento: tu lista, tu progreso y tus preferencias viven en tu dispositivo y no salen de él. Y si una fuente se cae, el resto sigue: degradación elegante, nunca una página rota.",
  "Qué puedes hacer hoy mismo",
  "Reproducir películas completas y ponerlas en segundo plano o a pantalla completa; guardar en Mi lista y retomar donde lo dejaste (Seguir viendo); explorar el Top 100 con 6 filtros — general, famosos, animación Disney, recientes, populares y ambigüedad —; descubrir la sección de PELÍCULAS con 4 filtros propios, incluida la CRÍTICA CONSTRUCTIVA: 12 clásicos con una crítica honesta de qué envejeció y qué sigue vivo; ver HOY EN EMISIÓN, lo que se emite de verdad ahora mismo; abrir la parrilla deportiva, jugar a los juegos de la casa, explorar las webs de la casa y cambiar de idioma — o dejar «Sistema», que adapta todo solo. La primera vez verás la intro con su música y un tour de un minuto: cada cosa en su sitio.",
  "Cómo se sostiene (sin anuncios ni suscripción)",
  "El catálogo es gratis y será gratis para siempre. La casa se sostiene con tres vías opcionales guiadas por la demanda real: puentes de afiliación honesta hacia plataformas legales cuando un título no está libre (pagas lo mismo, la casa cobra una comisión pequeña), colecciones a demanda donde la comunidad vota y financia qué se cura después, y pósters de dominio público impresos bajo demanda. Nada de banners, nada de cuotas mensuales, nada de vender tus datos: si quieres saber más, el botón «Sostenibilidad» de la cabecera lo cuenta al detalle.",
  "Las reglas de la casa",
  "Solo contenido libre y metadatos abiertos; cada ficha nombra su fuente; si un titular de derechos pide una retirada, se retira de inmediato. Sin excepciones y sin disculpas: así es como esta casa lleva el contenido libre de forma limpia, auditable y para todos los públicos.",
  /* v1.38.0 — Explorar ∞ + autoguardado total (ajustes + gustos) */
  "Ver todo",
  "Todas las categorías, todas las fichas: baja y baja, el catálogo no se acaba.",
  "Cortos libres",
  "Animación libre",
  "Documentales libres",
  "Todas las series",
  "Porque te gusta",
  "Ajustes",
  "Autoguardado activo: tus ajustes y gustos viven en tu dispositivo.",
  "Reproducción automática",
  "Carga infinita",
  "Velocidad por defecto",
  "Volumen por defecto",
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
    /* Cartelera películas + crítica (v1.38.0) */
    "Películas del cine": "Movies",
    "Filtros de las películas": "Movie filters",
    "La cartelera de películas del dominio público con cuatro puertas: populares, recientes, ambiguas y la crítica constructiva — clásicos con una crítica honesta bajo cada ficha.":
      "The public-domain movie lineup with four doors: popular, recent, ambiguous and constructive criticism — classics with an honest review under every card.",
    Ambiguas: "Ambiguous",
    "Crítica constructiva": "Constructive criticism",
    "Las películas más pedidas de la casa: el consenso de los éxitos mundiales del dominio público.":
      "The house's most requested movies: the consensus of the world's public-domain hits.",
    "Del año más nuevo al más viejo: el catálogo de películas ordenado por su año de estreno real.":
      "From the newest year to the oldest: the movie catalog ordered by its real release year.",
    "Clásicos con crítica y éxitos mundiales, alternados sin reglas: una crítica, un éxito, otra crítica…":
      "Classics with reviews and world hits, alternating without rules: a review, a hit, another review…",
    "La sección que no existe en ningún otro catálogo: 12 clásicos con una crítica constructiva y honesta de qué envejeció y qué sigue vivo.":
      "The section no other catalog has: 12 classics with a constructive, honest take on what aged and what still lives.",
    "Volver a la clasificación": "Back to the ranking",
    "Hoy en emisión": "On air today",
    /* Intro + tour (v1.38.0) */
    "Bienvenido a StreamDog": "Welcome to StreamDog",
    "Cine y series libres, actualizados cada hora": "Free movies & series, refreshed every hour",
    Entrar: "Come in",
    "Saltar la intro": "Skip intro",
    Sonido: "Sound",
    "Ver la intro": "Replay the intro",
    "Tour de la casa": "House tour",
    "Saltar el tour": "Skip the tour",
    Anterior: "Back",
    Siguiente: "Next",
    Terminar: "Finish",
    "Tour: tu catálogo infinito": "Tour: your infinite catalog",
    "Un minuto y sabes usar toda la casa: qué es cada cosa, dónde está y cómo se usa. Puedes saltarlo cuando quieras.":
      "One minute and you know how the whole house works: what everything is, where it is and how to use it. Skip it anytime.",
    "Actualizado cada hora, de verdad": "Refreshed every hour, for real",
    "Este chip es el pulso de la casa: el cron empresarial recoge lo nuevo de las fuentes cada hora y el punto verde dice que todo va fino.":
      "This chip is the house's pulse: the enterprise cron gathers what's new from the sources every hour, and the green dot says all is fine.",
    "Busca entre millones de tdo": "Search across millions of titles",
    "El buscador pega en las tres fuentes a la vez (Commons, Archive y TVMaze) y muestra resultados reales: escribe y da al botón verde.":
      "The search box hits all three sources at once (Commons, Archive and TVMaze) and shows real results: type and hit the green button.",
    "Cinco vistas, un catálogo": "Five views, one catalog",
    "Inicio con filas, el Top 100 con 6 filtros, Películas con crítica constructiva, Series y tu Mi lista: todo salta con un toque.":
      "Home with rows, the Top 100 with 6 filters, Movies with constructive criticism, Series and your My List: everything jumps with a tap.",
    "La hoja de ruta se PUEDE usar": "The roadmap is USABLE",
    "Deportes, viajes, juegos, apps y webs no son carteles mudos: cada ficha abre acciones reales — jugar, instalar, explorar, escuchar.":
      "Sports, travel, games, apps and websites are not mute posters: every card opens real actions — play, install, explore, listen.",
    "En tu idioma, siempre": "In your language, always",
    "«Sistema» adapta la app al idioma de tu dispositivo y también puedes fijar Español, English, Deutsch o Français.":
      "“System” adapts the app to your device's language, and you can also pin Español, English, Deutsch or Français.",
    "Y el pacto abierto": "And the open pact",
    "Aquí está la carta a las plataformas y la explicación completa de la app: qué es, cómo funciona y cómo se sostiene sin anuncios.":
      "Here is the letter to the platforms and the app's full explanation: what it is, how it works and how it sustains itself without ads.",
    /* Sostenibilidad (v1.38.0) */
    Sostenibilidad: "Sustainability",
    "Cómo se sostiene la casa sin anuncios ni suscripciones": "How the house sustains itself without ads or subscriptions",
    "Sin anuncios · Sin suscripción · Sin venta de datos": "No ads · No subscription · No data selling",
    "Cómo se sostiene StreamDog": "How StreamDog sustains itself",
    "El catálogo es gratis y será gratis para siempre. Estas tres vías — 100 % opcionales — pagan los servidores, el dominio y el cron que lo refresca cada hora. Tres formas nuevas de sostener contenido libre, guiadas por la demanda real de películas y series.":
      "The catalog is free and will stay free forever. These three paths — 100% optional — pay for the servers, the domain and the cron that refreshes it hourly. Three new ways to sustain free content, guided by the real demand for movies and series.",
    "Puente legal (afiliación honesta)": "Legal bridge (honest affiliation)",
    "Cuando un título que buscas no está en el catálogo libre, StreamDog te ofrece el camino legal a la plataforma que lo tiene — con enlace de afiliado. Tú pagas exactamente lo mismo; la casa recibe una comisión pequeña por el envío. Sin rastreadores, sin pop-ups, sin presión: el puente solo aparece cuando la demanda del título lo justifica, y jamás altera el catálogo ni el orden de las filas. Es la forma más limpia de que el catálogo libre y las plataformas convivan.":
      "When a title you want isn't in the free catalog, StreamDog offers the legal path to the platform that has it — with an affiliate link. You pay exactly the same; the house earns a small commission for the referral. No trackers, no pop-ups, no pressure: the bridge only appears when demand justifies it, and it never alters the catalog or the row order. It's the cleanest way for the free catalog and the platforms to coexist.",
    "Colecciones a demanda (micro-mecenazgo)": "On-demand collections (micro-crowdfunding)",
    "La demanda manda de verdad: la comunidad vota qué colección se cura, restaura o digitaliza después — una temporada de cartoons, un ciclo de film noir, los documentales de viajes que pedís en el buscador. Quien apoya una colección concreta aparece en sus créditos dentro de la app. No hay cuotas ni niveles: cada campaña es una colección concreta con un coste claro, y el resultado entra al catálogo libre para todo el mundo, también para quien no aportó un céntimo.":
      "Demand truly rules: the community votes which collection gets curated, restored or digitized next — a cartoon season, a film-noir cycle, the travel documentaries you ask the search box for. Whoever backs a specific collection appears in its credits inside the app. No fees, no tiers: each campaign is one concrete collection with a clear cost, and the result enters the free catalog for everyone, including those who didn't chip in a cent.",
    "Pósters del dominio público": "Public-domain posters",
    "Impresión bajo demanda con ARTE LIBRE: portadas, fotogramas y carteles de películas de dominio público convertidos en láminas y pósters de calidad, más el merchandising de la marca StreamDog. Los originales ya son de todos; nosotros solo los tratamos con cariño y los llevamos a la pared. El margen de cada lámina paga servidores, dominio y el cron que mantiene el catálogo fresco cada hora — sin tocar el precio de nadie.":
      "Print-on-demand with FREE ART: covers, frames and posters of public-domain movies turned into quality prints and posters, plus StreamDog brand merch. The originals already belong to everyone; we just treat them with care and take them to your wall. Each print's margin pays for servers, domain and the cron that keeps the catalog fresh every hour — without touching anyone's price.",
    "Nada de esto es obligatorio para ver ni una sola ficha: la casa no cierra si un día nadie apoya — pero gracias a quien apoya, crece.":
      "None of this is required to watch even a single card: the house won't close if nobody ever chips in — but thanks to those who do, it grows.",
    /* Explicación de la app (v1.38.0) */
    "Qué es StreamDog y cómo funciona": "What StreamDog is and how it works",
    "El pacto con las plataformas": "The pact with the platforms",
    "Qué es StreamDog": "What StreamDog is",
    "StreamDog es un catálogo infinito de cine y series GRATIS y legales: películas completas de dominio público que se reproducen aquí mismo, series con sus fichas y episodios, y documentales de archivo. Nada de copias piratas ni descargas raras: todo lo que ves nace libre o es metadato público. Se instala como app (PWA) desde el propio navegador, sin tiendas, y funciona en el móvil como en el ordenador.":
      "StreamDog is an infinite catalog of FREE, legal movies and series: full public-domain films that play right here, series with their cards and episodes, and archive documentaries. No pirate copies, no shady downloads: everything you see is born free or is public metadata. It installs as an app (PWA) straight from the browser, no stores, and works on phone and desktop alike.",
    "Cómo funciona por dentro": "How it works inside",
    "La casa se alimenta de tres fuentes públicas — Wikimedia Commons (vídeo reproducible), Internet Archive (el gran archivo del mundo) y TVMaze (metadatos de series) — y un CRON EMPRESARIAL las recorre cada hora, puntual como un reloj: lo que aparece, entra al catálogo; lo que desaparece, sale sin ruido. No hay cuentas, no hay registro, no hay seguimiento: tu lista, tu progreso y tus preferencias viven en tu dispositivo y no salen de él. Y si una fuente se cae, el resto sigue: degradación elegante, nunca una página rota.":
      "The house feeds on three public sources — Wikimedia Commons (playable video), Internet Archive (the world's great archive) and TVMaze (series metadata) — and an ENTERPRISE CRON sweeps them every hour, punctual as a clock: whatever appears enters the catalog; whatever disappears leaves without a sound. No accounts, no signup, no tracking: your list, progress and preferences live on your device and never leave it. And if a source goes down, the rest keeps going: graceful degradation, never a broken page.",
    "Qué puedes hacer hoy mismo": "What you can do right now",
    "Reproducir películas completas y ponerlas en segundo plano o a pantalla completa; guardar en Mi lista y retomar donde lo dejaste (Seguir viendo); explorar el Top 100 con 6 filtros — general, famosos, animación Disney, recientes, populares y ambigüedad —; descubrir la sección de PELÍCULAS con 4 filtros propios, incluida la CRÍTICA CONSTRUCTIVA: 12 clásicos con una crítica honesta de qué envejeció y qué sigue vivo; ver HOY EN EMISIÓN, lo que se emite de verdad ahora mismo; abrir la parrilla deportiva, jugar a los juegos de la casa, explorar las webs de la casa y cambiar de idioma — o dejar «Sistema», que adapta todo solo. La primera vez verás la intro con su música y un tour de un minuto: cada cosa en su sitio.":
      "Play full movies and keep them in background or fullscreen; save to My List and resume where you left off (Keep Watching); explore the Top 100 with 6 filters — overall, famous, Disney animation, recent, popular and ambiguity —; discover the MOVIES section with 4 filters of its own, including CONSTRUCTIVE CRITICISM: 12 classics with an honest take on what aged and what still lives; watch ON AIR TODAY, what's really broadcasting right now; open the sports grid, play the house games, explore the house websites and switch languages — or leave “System”, which adapts everything by itself. The first time you'll see the intro with its music and a one-minute tour: everything in its place.",
    "Cómo se sostiene (sin anuncios ni suscripción)": "How it sustains itself (no ads, no subscription)",
    "El catálogo es gratis y será gratis para siempre. La casa se sostiene con tres vías opcionales guiadas por la demanda real: puentes de afiliación honesta hacia plataformas legales cuando un título no está libre (pagas lo mismo, la casa cobra una comisión pequeña), colecciones a demanda donde la comunidad vota y financia qué se cura después, y pósters de dominio público impresos bajo demanda. Nada de banners, nada de cuotas mensuales, nada de vender tus datos: si quieres saber más, el botón «Sostenibilidad» de la cabecera lo cuenta al detalle.":
      "The catalog is free and will stay free forever. The house sustains itself with three optional paths guided by real demand: honest affiliate bridges to legal platforms when a title isn't free (you pay the same, the house gets a small commission), on-demand collections where the community votes and funds what gets curated next, and public-domain posters printed on demand. No banners, no monthly fees, no selling your data: if you want more detail, the “Sustainability” button in the header spells it out.",
    "Las reglas de la casa": "The house rules",
    "Solo contenido libre y metadatos abiertos; cada ficha nombra su fuente; si un titular de derechos pide una retirada, se retira de inmediato. Sin excepciones y sin disculpas: así es como esta casa lleva el contenido libre de forma limpia, auditable y para todos los públicos.":
      "Free content and open metadata only; every card names its source; if a rights holder requests a removal, it's removed immediately. No exceptions, no apologies: that's how this house keeps free content clean, auditable and for all audiences.",
    /* v1.38.0 — Explorar ∞ + autoguardado total (ajustes + gustos) */
    "Ver todo": "See all",
    "Todas las categorías, todas las fichas: baja y baja, el catálogo no se acaba.":
      "All the categories, all the cards: keep scrolling, the catalog never ends.",
    "Cortos libres": "Free shorts",
    "Animación libre": "Free animation",
    "Documentales libres": "Free documentaries",
    "Todas las series": "All series",
    "Porque te gusta": "Because you like it",
    Ajustes: "Settings",
    "Autoguardado activo: tus ajustes y gustos viven en tu dispositivo.":
      "Autosave on: your settings and tastes live on your device.",
    "Reproducción automática": "Autoplay",
    "Carga infinita": "Infinite scroll",
    "Velocidad por defecto": "Default speed",
    "Volumen por defecto": "Default volume",
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
    /* Cartelera películas + crítica (v1.38.0) */
    "Películas del cine": "Filme",
    "Filtros de las películas": "Filmfilter",
    "La cartelera de películas del dominio público con cuatro puertas: populares, recientes, ambiguas y la crítica constructiva — clásicos con una crítica honesta bajo cada ficha.":
      "Das Gemeinfrei-Filmprogramm mit vier Türen: beliebt, neu, ambig und konstruktive Kritik — Klassiker mit ehrlicher Kritik unter jeder Karte.",
    Ambiguas: "Ambig",
    "Crítica constructiva": "Konstruktive Kritik",
    "Las películas más pedidas de la casa: el consenso de los éxitos mundiales del dominio público.":
      "Die meistgewünschten Filme des Hauses: der Konsens der weltweiten Gemeinfrei-Hits.",
    "Del año más nuevo al más viejo: el catálogo de películas ordenado por su año de estreno real.":
      "Vom neuesten zum ältesten Jahr: der Filmkatalog nach echtem Erscheinungsjahr sortiert.",
    "Clásicos con crítica y éxitos mundiales, alternados sin reglas: una crítica, un éxito, otra crítica…":
      "Klassiker mit Kritik und Welthits, regellos abwechselnd: eine Kritik, ein Hit, noch eine Kritik…",
    "La sección que no existe en ningún otro catálogo: 12 clásicos con una crítica constructiva y honesta de qué envejeció y qué sigue vivo.":
      "Die Sektion, die kein anderer Katalog hat: 12 Klassiker mit konstruktiver, ehrlicher Kritik — was gealtert ist und was weiterlebt.",
    "Volver a la clasificación": "Zurück zum Ranking",
    "Hoy en emisión": "Heute im Fernsehen",
    /* Intro + tour (v1.38.0) */
    "Bienvenido a StreamDog": "Willkommen bei StreamDog",
    "Cine y series libres, actualizados cada hora": "Freie Filme & Serien, stündlich aktualisiert",
    Entrar: "Eintreten",
    "Saltar la intro": "Intro überspringen",
    Sonido: "Ton",
    "Ver la intro": "Intro nochmal ansehen",
    "Tour de la casa": "Hausführung",
    "Saltar el tour": "Tour überspringen",
    Anterior: "Zurück",
    Siguiente: "Weiter",
    Terminar: "Fertig",
    "Tour: tu catálogo infinito": "Tour: dein unendlicher Katalog",
    "Un minuto y sabes usar toda la casa: qué es cada cosa, dónde está y cómo se usa. Puedes saltarlo cuando quieras.":
      "Eine Minute, und du kennst das ganze Haus: was was ist, wo es steht und wie es geht. Jederzeit überspringbar.",
    "Actualizado cada hora, de verdad": "Stündlich aktualisiert, wirklich",
    "Este chip es el pulso de la casa: el cron empresarial recoge lo nuevo de las fuentes cada hora y el punto verde dice que todo va fino.":
      "Dieser Chip ist der Puls des Hauses: Der Enterprise-Cron holt stündlich das Neue aus den Quellen, der grüne Punkt sagt: alles fein.",
    "Busca entre millones de tdo": "Suche in Millionen von Titeln",
    "El buscador pega en las tres fuentes a la vez (Commons, Archive y TVMaze) y muestra resultados reales: escribe y da al botón verde.":
      "Die Suche greift alle drei Quellen gleichzeitig (Commons, Archive und TVMaze) und zeigt echte Ergebnisse: tippen, grünen Knopf drücken.",
    "Cinco vistas, un catálogo": "Fünf Ansichten, ein Katalog",
    "Inicio con filas, el Top 100 con 6 filtros, Películas con crítica constructiva, Series y tu Mi lista: todo salta con un toque.":
      "Start mit Reihen, die Top 100 mit 6 Filtern, Filme mit konstruktiver Kritik, Serien und deine Meine Liste: alles ein Tipp entfernt.",
    "La hoja de ruta se PUEDE usar": "Die Roadmap ist BENUTZBAR",
    "Deportes, viajes, juegos, apps y webs no son carteles mudos: cada ficha abre acciones reales — jugar, instalar, explorar, escuchar.":
      "Sport, Reisen, Spiele, Apps und Webs sind keine stummen Plakate: Jede Karte öffnet echte Aktionen — spielen, installieren, erkunden, hören.",
    "En tu idioma, siempre": "In deiner Sprache, immer",
    "«Sistema» adapta la app al idioma de tu dispositivo y también puedes fijar Español, English, Deutsch o Français.":
      "„System“ passt die App an die Sprache deines Geräts an; du kannst auch Español, English, Deutsch oder Français festnageln.",
    "Y el pacto abierto": "Und der offene Pakt",
    "Aquí está la carta a las plataformas y la explicación completa de la app: qué es, cómo funciona y cómo se sostiene sin anuncios.":
      "Hier steht der Brief an die Plattformen und die komplette Erklärung der App: was sie ist, wie sie funktioniert und wie sie ohne Werbung überlebt.",
    /* Sostenibilidad (v1.38.0) */
    Sostenibilidad: "Nachhaltigkeit",
    "Cómo se sostiene la casa sin anuncios ni suscripciones": "Wie das Haus ohne Werbung und Abos überlebt",
    "Sin anuncios · Sin suscripción · Sin venta de datos": "Keine Werbung · Kein Abo · Kein Datenverkauf",
    "Cómo se sostiene StreamDog": "Wie sich StreamDog trägt",
    "El catálogo es gratis y será gratis para siempre. Estas tres vías — 100 % opcionales — pagan los servidores, el dominio y el cron que lo refresca cada hora. Tres formas nuevas de sostener contenido libre, guiadas por la demanda real de películas y series.":
      "Der Katalog ist gratis und bleibt es für immer. Diese drei Wege — 100 % optional — zahlen Server, Domain und den Cron, der ihn stündlich auffrischt. Drei neue Arten, freie Inhalte zu tragen, geführt von der echten Nachfrage nach Filmen und Serien.",
    "Puente legal (afiliación honesta)": "Legale Brücke (ehrliche Affiliation)",
    "Cuando un título que buscas no está en el catálogo libre, StreamDog te ofrece el camino legal a la plataforma que lo tiene — con enlace de afiliado. Tú pagas exactamente lo mismo; la casa recibe una comisión pequeña por el envío. Sin rastreadores, sin pop-ups, sin presión: el puente solo aparece cuando la demanda del título lo justifica, y jamás altera el catálogo ni el orden de las filas. Es la forma más limpia de que el catálogo libre y las plataformas convivan.":
      "Wenn ein gesuchter Titel nicht im freien Katalog ist, bietet StreamDog den legalen Weg zur Plattform, die ihn hat — mit Affiliate-Link. Du zahlst genau dasselbe; das Haus bekommt eine kleine Vermittlungsprovision. Ohne Tracker, ohne Pop-ups, ohne Druck: Die Brücke erscheint nur, wenn die Nachfrage es rechtfertigt, und verändert nie den Katalog oder die Reihenfolge. So leben freier Katalog und Plattformen am saubersten zusammen.",
    "Colecciones a demanda (micro-mecenazgo)": "Sammlungen auf Bestellung (Micro-Mäzenatentum)",
    "La demanda manda de verdad: la comunidad vota qué colección se cura, restaura o digitaliza después — una temporada de cartoons, un ciclo de film noir, los documentales de viajes que pedís en el buscador. Quien apoya una colección concreta aparece en sus créditos dentro de la app. No hay cuotas ni niveles: cada campaña es una colección concreta con un coste claro, y el resultado entra al catálogo libre para todo el mundo, también para quien no aportó un céntimo.":
      "Die Nachfrage regiert wirklich: Die Community stimmt ab, welche Sammlung als Nächstes kuratiert, restauriert oder digitalisiert wird — eine Cartoon-Saison, ein Film-noir-Zyklus, die Reisedokus, die du in der Suche verlangst. Wer eine konkrete Sammlung unterstützt, steht in ihren Credits in der App. Keine Gebühren, keine Stufen: Jede Kampagne ist eine konkrete Sammlung mit klaren Kosten, und das Ergebnis kommt für alle in den freien Katalog — auch für die, die keinen Cent gaben.",
    "Pósters del dominio público": "Gemeinfrei-Poster",
    "Impresión bajo demanda con ARTE LIBRE: portadas, fotogramas y carteles de películas de dominio público convertidos en láminas y pósters de calidad, más el merchandising de la marca StreamDog. Los originales ya son de todos; nosotros solo los tratamos con cariño y los llevamos a la pared. El margen de cada lámina paga servidores, dominio y el cron que mantiene el catálogo fresco cada hora — sin tocar el precio de nadie.":
      "Print-on-demand mit FREIER KUNST: Cover, Standbilder und Plakate gemeinfreier Filme als hochwertige Drucke und Poster, dazu StreamDog-Merch. Die Originale gehören ohnehin allen; wir behandeln sie nur liebevoll und bringen sie an die Wand. Die Marge jedes Drucks zahlt Server, Domain und den Cron, der den Katalog stündlich frisch hält — ohne den Preis von irgendjemandem zu berühren.",
    "Nada de esto es obligatorio para ver ni una sola ficha: la casa no cierra si un día nadie apoya — pero gracias a quien apoya, crece.":
      "Nichts davon ist nötig, um auch nur eine Karte zu sehen: Das Haus schließt nicht, wenn niemand gibt — aber dank der Gebenden wächst es.",
    /* Explicación de la app (v1.38.0) */
    "Qué es StreamDog y cómo funciona": "Was StreamDog ist und wie es funktioniert",
    "El pacto con las plataformas": "Der Pakt mit den Plattformen",
    "Qué es StreamDog": "Was StreamDog ist",
    "StreamDog es un catálogo infinito de cine y series GRATIS y legales: películas completas de dominio público que se reproducen aquí mismo, series con sus fichas y episodios, y documentales de archivo. Nada de copias piratas ni descargas raras: todo lo que ves nace libre o es metadato público. Se instala como app (PWA) desde el propio navegador, sin tiendas, y funciona en el móvil como en el ordenador.":
      "StreamDog ist ein unendlicher Katalog von GRATIS, legalen Filmen und Serien: komplette Gemeinfrei-Filme, die hier laufen, Serien mit Karten und Episoden, und Archiv-Dokus. Keine Piraterie, kein schräger Download: Alles, was du siehst, ist frei geboren oder öffentliches Metadatum. Installiert wird's als App (PWA) direkt im Browser, ohne Store, und läuft auf Handy wie Rechner.",
    "Cómo funciona por dentro": "Wie es innen funktioniert",
    "La casa se alimenta de tres fuentes públicas — Wikimedia Commons (vídeo reproducible), Internet Archive (el gran archivo del mundo) y TVMaze (metadatos de series) — y un CRON EMPRESARIAL las recorre cada hora, puntual como un reloj: lo que aparece, entra al catálogo; lo que desaparece, sale sin ruido. No hay cuentas, no hay registro, no hay seguimiento: tu lista, tu progreso y tus preferencias viven en tu dispositivo y no salen de él. Y si una fuente se cae, el resto sigue: degradación elegante, nunca una página rota.":
      "Das Haus lebt von drei öffentlichen Quellen — Wikimedia Commons (abspielbares Video), Internet Archive (das große Archiv der Welt) und TVMaze (Serien-Metadaten) — und ein ENTERPRISE-CRON fegt sie stündlich, pünktlich wie eine Uhr: Was auftaucht, kommt in den Katalog; was verschwindet, geht lautlos. Keine Konten, keine Anmeldung, kein Tracking: Deine Liste, dein Fortschritt und deine Einstellungen leben auf deinem Gerät und verlassen es nie. Und fällt eine Quelle aus, läuft der Rest weiter: elegante Degradation, nie eine kaputte Seite.",
    "Qué puedes hacer hoy mismo": "Was du heute sofort kannst",
    "Reproducir películas completas y ponerlas en segundo plano o a pantalla completa; guardar en Mi lista y retomar donde lo dejaste (Seguir viendo); explorar el Top 100 con 6 filtros — general, famosos, animación Disney, recientes, populares y ambigüedad —; descubrir la sección de PELÍCULAS con 4 filtros propios, incluida la CRÍTICA CONSTRUCTIVA: 12 clásicos con una crítica honesta de qué envejeció y qué sigue vivo; ver HOY EN EMISIÓN, lo que se emite de verdad ahora mismo; abrir la parrilla deportiva, jugar a los juegos de la casa, explorar las webs de la casa y cambiar de idioma — o dejar «Sistema», que adapta todo solo. La primera vez verás la intro con su música y un tour de un minuto: cada cosa en su sitio.":
      "Komplette Filme abspielen, im Hintergrund oder Vollbild; in Meine Liste speichern und weitersehen, wo du aufgehört hast; die Top 100 mit 6 Filtern erkunden — Gesamt, Berühmt, Disney-Animation, Neu, Beliebt und Ambig; die FILM-Sektion mit 4 eigenen Filtern entdecken, inklusive KONSTRUKTIVER KRITIK: 12 Klassiker mit ehrlicher Kritik, was gealtert ist und was lebt; HEUTE IM FERNSEHEN sehen, was gerade wirklich läuft; das Sportprogramm öffnen, die Spiele des Hauses spielen, die Webs des Hauses erkunden und die Sprache wechseln — oder „System“ lassen, das alles allein anpasst. Beim ersten Mal siehst du die Intro mit Musik und eine einminütige Tour: alles an seinem Platz.",
    "Cómo se sostiene (sin anuncios ni suscripción)": "Wie sie sich trägt (ohne Werbung, ohne Abo)",
    "El catálogo es gratis y será gratis para siempre. La casa se sostiene con tres vías opcionales guiadas por la demanda real: puentes de afiliación honesta hacia plataformas legales cuando un título no está libre (pagas lo mismo, la casa cobra una comisión pequeña), colecciones a demanda donde la comunidad vota y financia qué se cura después, y pósters de dominio público impresos bajo demanda. Nada de banners, nada de cuotas mensuales, nada de vender tus datos: si quieres saber más, el botón «Sostenibilidad» de la cabecera lo cuenta al detalle.":
      "Der Katalog ist gratis und bleibt es für immer. Das Haus trägt sich über drei optionale Wege, geführt von echter Nachfrage: ehrliche Affiliate-Brücken zu legalen Plattformen, wenn ein Titel nicht frei ist (du zahlst dasselbe, das Haus bekommt eine kleine Provision), Sammlungen auf Bestellung, bei denen die Community abstimmt und finanziert, was als Nächstes kuratiert wird, und Gemeinfrei-Poster per Print-on-demand. Keine Banner, keine Monatsgebühren, kein Datenverkauf: Der „Nachhaltigkeit“-Knopf in der Kopfzeile erzählt es im Detail.",
    "Las reglas de la casa": "Die Hausregeln",
    "Solo contenido libre y metadatos abiertos; cada ficha nombra su fuente; si un titular de derechos pide una retirada, se retira de inmediato. Sin excepciones y sin disculpas: así es como esta casa lleva el contenido libre de forma limpia, auditable y para todos los públicos.":
      "Nur freie Inhalte und offene Metadaten; jede Karte nennt ihre Quelle; verlangt ein Rechteinhaber die Entfernung, passiert sie sofort. Ohne Ausnahmen, ohne Entschuldigung: So führt dieses Haus freie Inhalte sauber, prüfbar und für alle Publika.",
    /* v1.38.0 — Explorar ∞ + autoguardado total (ajustes + gustos) */
    "Ver todo": "Alles ansehen",
    "Todas las categorías, todas las fichas: baja y baja, el catálogo no se acaba.":
      "Alle Kategorien, alle Karten: scroll weiter und weiter, der Katalog hört nie auf.",
    "Cortos libres": "Freie Kurzfilme",
    "Animación libre": "Freie Animation",
    "Documentales libres": "Freie Dokumentationen",
    "Todas las series": "Alle Serien",
    "Porque te gusta": "Weil es dir gefällt",
    Ajustes: "Einstellungen",
    "Autoguardado activo: tus ajustes y gustos viven en tu dispositivo.":
      "Autospeichern aktiv: Deine Einstellungen und Vorlieben leben auf deinem Gerät.",
    "Reproducción automática": "Automatisch abspielen",
    "Carga infinita": "Infinite Scroll",
    "Velocidad por defecto": "Standardgeschwindigkeit",
    "Volumen por defecto": "Standardlautstärke",
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
    /* Cartelera películas + crítica (v1.38.0) */
    "Películas del cine": "Films",
    "Filtros de las películas": "Filtres de films",
    "La cartelera de películas del dominio público con cuatro puertas: populares, recientes, ambiguas y la crítica constructiva — clásicos con una crítica honesta bajo cada ficha.":
      "La programmation de films du domaine public avec quatre portes : populaires, récents, ambigus et la critique constructive — des classiques avec une critique honnête sous chaque fiche.",
    Ambiguas: "Ambigus",
    "Crítica constructiva": "Critique constructive",
    "Las películas más pedidas de la casa: el consenso de los éxitos mundiales del dominio público.":
      "Les films les plus demandés de la maison : le consensus des succès mondiaux du domaine public.",
    "Del año más nuevo al más viejo: el catálogo de películas ordenado por su año de estreno real.":
      "De l'année la plus récente à la plus ancienne : le catalogue de films trié par sa vraie année de sortie.",
    "Clásicos con crítica y éxitos mundiales, alternados sin reglas: una crítica, un éxito, otra crítica…":
      "Des classiques avec critique et des succès mondiaux, alternés sans règles : une critique, un succès, une autre critique…",
    "La sección que no existe en ningún otro catálogo: 12 clásicos con una crítica constructiva y honesta de qué envejeció y qué sigue vivo.":
      "La section qu'aucun autre catalogue n'a : 12 classiques avec une critique constructive et honnête de ce qui a vieilli et de ce qui vit encore.",
    "Volver a la clasificación": "Retour au classement",
    "Hoy en emisión": "À l'antenne aujourd'hui",
    /* Intro + tour (v1.38.0) */
    "Bienvenido a StreamDog": "Bienvenue sur StreamDog",
    "Cine y series libres, actualizados cada hora": "Films & séries libres, actualisés chaque heure",
    Entrar: "Entrer",
    "Saltar la intro": "Passer l'intro",
    Sonido: "Son",
    "Ver la intro": "Revoir l'intro",
    "Tour de la casa": "Visite de la maison",
    "Saltar el tour": "Passer la visite",
    Anterior: "Retour",
    Siguiente: "Suivant",
    Terminar: "Terminer",
    "Tour: tu catálogo infinito": "Visite : ton catalogue infini",
    "Un minuto y sabes usar toda la casa: qué es cada cosa, dónde está y cómo se usa. Puedes saltarlo cuando quieras.":
      "Une minute et tu sais te servir de toute la maison : ce qu'est chaque chose, où elle est et comment l'utiliser. À ignorer quand tu veux.",
    "Actualizado cada hora, de verdad": "Actualisé chaque heure, vraiment",
    "Este chip es el pulso de la casa: el cron empresarial recoge lo nuevo de las fuentes cada hora y el punto verde dice que todo va fino.":
      "Cette pastille est le pouls de la maison : le cron d'entreprise ramasse le nouveau des sources chaque heure et le point vert dit que tout roule.",
    "Busca entre millones de tdo": "Cherche parmi des millions de titres",
    "El buscador pega en las tres fuentes a la vez (Commons, Archive y TVMaze) y muestra resultados reales: escribe y da al botón verde.":
      "La recherche frappe les trois sources en même temps (Commons, Archive et TVMaze) et montre des résultats réels : tape et appuie sur le bouton vert.",
    "Cinco vistas, un catálogo": "Cinq vues, un catalogue",
    "Inicio con filas, el Top 100 con 6 filtros, Películas con crítica constructiva, Series y tu Mi lista: todo salta con un toque.":
      "Accueil avec des rangées, le Top 100 avec 6 filtres, Films avec critique constructive, Séries et ta Ma liste : tout saute d'un geste.",
    "La hoja de ruta se PUEDE usar": "La feuille de route s'UTILISE",
    "Deportes, viajes, juegos, apps y webs no son carteles mudos: cada ficha abre acciones reales — jugar, instalar, explorar, escuchar.":
      "Sport, voyages, jeux, apps et sites ne sont pas des affiches muettes : chaque fiche ouvre des actions réelles — jouer, installer, explorer, écouter.",
    "En tu idioma, siempre": "Dans ta langue, toujours",
    "«Sistema» adapta la app al idioma de tu dispositivo y también puedes fijar Español, English, Deutsch o Français.":
      "« Système » adapte l'app à la langue de ton appareil ; tu peux aussi figer Español, English, Deutsch ou Français.",
    "Y el pacto abierto": "Et le pacte ouvert",
    "Aquí está la carta a las plataformas y la explicación completa de la app: qué es, cómo funciona y cómo se sostiene sin anuncios.":
      "Ici se trouve la lettre aux plateformes et l'explication complète de l'app : ce qu'elle est, comment elle fonctionne et comment elle se soutient sans publicité.",
    /* Sostenibilidad (v1.38.0) */
    Sostenibilidad: "Soutenabilité",
    "Cómo se sostiene la casa sin anuncios ni suscripciones": "Comment la maison se soutient sans pub ni abonnements",
    "Sin anuncios · Sin suscripción · Sin venta de datos": "Sans pub · Sans abonnement · Sans vente de données",
    "Cómo se sostiene StreamDog": "Comment StreamDog se soutient",
    "El catálogo es gratis y será gratis para siempre. Estas tres vías — 100 % opcionales — pagan los servidores, el dominio y el cron que lo refresca cada hora. Tres formas nuevas de sostener contenido libre, guiadas por la demanda real de películas y series.":
      "Le catalogue est gratuit et le restera pour toujours. Ces trois voies — 100 % optionnelles — paient les serveurs, le domaine et le cron qui le rafraîchit chaque heure. Trois façons nouvelles de soutenir le contenu libre, guidées par la vraie demande de films et séries.",
    "Puente legal (afiliación honesta)": "Pont légal (affiliation honnête)",
    "Cuando un título que buscas no está en el catálogo libre, StreamDog te ofrece el camino legal a la plataforma que lo tiene — con enlace de afiliado. Tú pagas exactamente lo mismo; la casa recibe una comisión pequeña por el envío. Sin rastreadores, sin pop-ups, sin presión: el puente solo aparece cuando la demanda del título lo justifica, y jamás altera el catálogo ni el orden de las filas. Es la forma más limpia de que el catálogo libre y las plataformas convivan.":
      "Quand un titre que tu cherches n'est pas dans le catalogue libre, StreamDog t'offre le chemin légal vers la plateforme qui l'a — avec un lien d'affiliation. Tu paies exactement le même prix ; la maison reçoit une petite commission d'envoi. Sans traqueurs, sans pop-ups, sans pression : le pont n'apparaît que si la demande le justifie, et il ne change jamais le catalogue ni l'ordre des rangées. C'est la façon la plus propre de faire cohabiter le catalogue libre et les plateformes.",
    "Colecciones a demanda (micro-mecenazgo)": "Collections à la demande (micro-mécénat)",
    "La demanda manda de verdad: la comunidad vota qué colección se cura, restaura o digitaliza después — una temporada de cartoons, un ciclo de film noir, los documentales de viajes que pedís en el buscador. Quien apoya una colección concreta aparece en sus créditos dentro de la app. No hay cuotas ni niveles: cada campaña es una colección concreta con un coste claro, y el resultado entra al catálogo libre para todo el mundo, también para quien no aportó un céntimo.":
      "La demande commande vraiment : la communauté vote quelle collection sera curée, restaurée ou numérisée ensuite — une saison de cartoons, un cycle film noir, les documentaires de voyage que tu demandes à la recherche. Qui soutient une collection précise apparaît dans ses crédits dans l'app. Pas de cotisations, pas de paliers : chaque campagne est une collection concrète avec un coût clair, et le résultat entre dans le catalogue libre pour tout le monde, y compris ceux qui n'ont pas donné un centime.",
    "Pósters del dominio público": "Affiches du domaine public",
    "Impresión bajo demanda con ARTE LIBRE: portadas, fotogramas y carteles de películas de dominio público convertidos en láminas y pósters de calidad, más el merchandising de la marca StreamDog. Los originales ya son de todos; nosotros solo los tratamos con cariño y los llevamos a la pared. El margen de cada lámina paga servidores, dominio y el cron que mantiene el catálogo fresco cada hora — sin tocar el precio de nadie.":
      "Impression à la demande avec de l'ART LIBRE : couvertures, photogrammes et affiches de films du domaine public transformés en estampes et affiches de qualité, plus le merchandising de la marque StreamDog. Les originaux sont déjà à tous ; on les traite juste avec soin et on les emmène au mur. La marge de chaque estampe paie les serveurs, le domaine et le cron qui garde le catalogue frais chaque heure — sans toucher au prix de personne.",
    "Nada de esto es obligatorio para ver ni una sola ficha: la casa no cierra si un día nadie apoya — pero gracias a quien apoya, crece.":
      "Rien de tout cela n'est obligatoire pour voir ne serait-ce qu'une fiche : la maison ne ferme pas si un jour personne ne soutient — mais grâce à ceux qui soutiennent, elle grandit.",
    /* Explicación de la app (v1.38.0) */
    "Qué es StreamDog y cómo funciona": "Ce qu'est StreamDog et comment ça marche",
    "El pacto con las plataformas": "Le pacte avec les plateformes",
    "Qué es StreamDog": "Ce qu'est StreamDog",
    "StreamDog es un catálogo infinito de cine y series GRATIS y legales: películas completas de dominio público que se reproducen aquí mismo, series con sus fichas y episodios, y documentales de archivo. Nada de copias piratas ni descargas raras: todo lo que ves nace libre o es metadato público. Se instala como app (PWA) desde el propio navegador, sin tiendas, y funciona en el móvil como en el ordenador.":
      "StreamDog est un catalogue infini de films et séries GRATUITS et légaux : des films complets du domaine public qui se lisent ici même, des séries avec leurs fiches et épisodes, et des documentaires d'archive. Pas de copies pirates, pas de téléchargements louches : tout ce que tu vois naît libre ou est métadonnée publique. Ça s'installe comme une app (PWA) depuis le navigateur, sans boutique, et marche au téléphone comme à l'ordinateur.",
    "Cómo funciona por dentro": "Comment ça marche à l'intérieur",
    "La casa se alimenta de tres fuentes públicas — Wikimedia Commons (vídeo reproducible), Internet Archive (el gran archivo del mundo) y TVMaze (metadatos de series) — y un CRON EMPRESARIAL las recorre cada hora, puntual como un reloj: lo que aparece, entra al catálogo; lo que desaparece, sale sin ruido. No hay cuentas, no hay registro, no hay seguimiento: tu lista, tu progreso y tus preferencias viven en tu dispositivo y no salen de él. Y si una fuente se cae, el resto sigue: degradación elegante, nunca una página rota.":
      "La maison se nourrit de trois sources publiques — Wikimedia Commons (vidéo lisible), Internet Archive (la grande archive du monde) et TVMaze (métadonnées de séries) — et un CRON D'ENTREPRISE les balaie chaque heure, ponctuel comme une horloge : ce qui apparaît entre au catalogue ; ce qui disparaît sort sans bruit. Pas de comptes, pas d'inscription, pas de pistage : ta liste, ta progression et tes préférences vivent sur ton appareil et n'en sortent jamais. Et si une source tombe, le reste continue : dégradation élégante, jamais une page cassée.",
    "Qué puedes hacer hoy mismo": "Ce que tu peux faire dès maintenant",
    "Reproducir películas completas y ponerlas en segundo plano o a pantalla completa; guardar en Mi lista y retomar donde lo dejaste (Seguir viendo); explorar el Top 100 con 6 filtros — general, famosos, animación Disney, recientes, populares y ambigüedad —; descubrir la sección de PELÍCULAS con 4 filtros propios, incluida la CRÍTICA CONSTRUCTIVA: 12 clásicos con una crítica honesta de qué envejeció y qué sigue vivo; ver HOY EN EMISIÓN, lo que se emite de verdad ahora mismo; abrir la parrilla deportiva, jugar a los juegos de la casa, explorar las webs de la casa y cambiar de idioma — o dejar «Sistema», que adapta todo solo. La primera vez verás la intro con su música y un tour de un minuto: cada cosa en su sitio.":
      "Lire des films complets et les mettre en arrière-plan ou plein écran ; sauver dans Ma liste et reprendre là où tu t'es arrêté (Continuer à regarder) ; explorer le Top 100 avec 6 filtres — général, célèbres, animation Disney, récents, populaires et ambiguïté — ; découvrir la section FILMS avec 4 filtres à elle, dont la CRITIQUE CONSTRUCTIVE : 12 classiques avec une critique honnête de ce qui a vieilli et de ce qui vit encore ; voir À L'ANTENNE AUJOURD'HUI, ce qui se diffuse vraiment là, maintenant ; ouvrir la grille sportive, jouer aux jeux de la maison, explorer les sites de la maison et changer de langue — ou laisser « Système », qui adapte tout seul. La première fois tu verras l'intro avec sa musique et une visite d'une minute : chaque chose à sa place.",
    "Cómo se sostiene (sin anuncios ni suscripción)": "Comment ça se soutient (sans pub ni abonnement)",
    "El catálogo es gratis y será gratis para siempre. La casa se sostiene con tres vías opcionales guiadas por la demanda real: puentes de afiliación honesta hacia plataformas legales cuando un título no está libre (pagas lo mismo, la casa cobra una comisión pequeña), colecciones a demanda donde la comunidad vota y financia qué se cura después, y pósters de dominio público impresos bajo demanda. Nada de banners, nada de cuotas mensuales, nada de vender tus datos: si quieres saber más, el botón «Sostenibilidad» de la cabecera lo cuenta al detalle.":
      "Le catalogue est gratuit et le restera pour toujours. La maison se soutient avec trois voies optionnelles guidées par la vraie demande : des ponts d'affiliation honnête vers des plateformes légales quand un titre n'est pas libre (tu paies le même prix, la maison touche une petite commission), des collections à la demande où la communauté vote et finance ce qui sera curé ensuite, et des affiches du domaine public imprimées à la demande. Pas de bannières, pas de mensualités, pas de vente de tes données : le bouton « Soutenabilité » de l'en-tête le raconte en détail.",
    "Las reglas de la casa": "Les règles de la maison",
    "Solo contenido libre y metadatos abiertos; cada ficha nombra su fuente; si un titular de derechos pide una retirada, se retira de inmediato. Sin excepciones y sin disculpas: así es como esta casa lleva el contenido libre de forma limpia, auditable y para todos los públicos.":
      "Contenu libre et métadonnées ouvertes seulement ; chaque fiche nomme sa source ; si un ayant droit demande un retrait, il est immédiat. Sans exceptions et sans excuses : voilà comment cette maison porte le contenu libre propre, auditable et pour tous les publics.",
    /* v1.38.0 — Explorar ∞ + autoguardado total (ajustes + gustos) */
    "Ver todo": "Tout voir",
    "Todas las categorías, todas las fichas: baja y baja, el catálogo no se acaba.":
      "Toutes les catégories, toutes les fiches : descends et descends, le catalogue ne s'arrête jamais.",
    "Cortos libres": "Courts libres",
    "Animación libre": "Animation libre",
    "Documentales libres": "Documentaires libres",
    "Todas las series": "Toutes les séries",
    "Porque te gusta": "Parce que tu aimes",
    Ajustes: "Réglages",
    "Autoguardado activo: tus ajustes y gustos viven en tu dispositivo.":
      "Sauvegarde auto active : tes réglages et tes goûts vivent sur ton appareil.",
    "Reproducción automática": "Lecture automatique",
    "Carga infinita": "Défilement infini",
    "Velocidad por defecto": "Vitesse par défaut",
    "Volumen por defecto": "Volume par défaut",
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
